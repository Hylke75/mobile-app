// Marketing in de beheeromgeving: overzicht, contacten met toestemmingsbewijs, afmelden,
// verwijderen op verzoek en verzendinstellingen. Alleen voor public.admins; rollen:
// owner/admin (alles), marketing_editor (lezen), analyst (alleen het overzicht).
// Elke wijziging komt in marketing_audit_logs.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { consentStatus, normaliseerEmail, sha256 } from '../_shared/marketing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

type Rol = 'owner' | 'admin' | 'marketing_editor' | 'analyst';
const MAX_WIJZIGINGEN_PER_UUR = 60;
const PAGINA = 50;
const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Methode niet toegestaan' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: auth, error: authFout } = await db.auth.getUser(token);
  if (authFout || !auth.user) return json({ error: 'Niet ingelogd' }, 401);
  const { data: beheerder } = await db
    .from('admins')
    .select('rol')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!beheerder) return json({ error: 'Geen toegang' }, 403);
  const rol = beheerder.rol as Rol;
  const magWijzigen = rol === 'owner' || rol === 'admin';
  const magContacten = rol !== 'analyst';

  let invoer: Record<string, unknown>;
  try {
    invoer = await req.json();
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400);
  }

  const log = (actie: string, objectType: string, objectId: string, samenvatting: string) =>
    db.from('marketing_audit_logs').insert({
      actor_id: auth.user.id,
      actie,
      object_type: objectType,
      object_id: objectId,
      samenvatting: samenvatting.slice(0, 300),
    });

  async function misbruikrem(): Promise<boolean> {
    const sleutel = `admin-marketing:${auth.user!.id}`;
    const { count } = await db
      .from('misbruikrem')
      .select('id', { count: 'exact', head: true })
      .eq('sleutel', sleutel)
      .gte('created_at', new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) >= MAX_WIJZIGINGEN_PER_UUR) return false;
    await db.from('misbruikrem').insert({ sleutel });
    return true;
  }

  async function instellingen() {
    const { data } = await db.from('marketing_settings').select('sleutel, waarde, updated_at');
    return Object.fromEntries((data ?? []).map((r) => [r.sleutel, r.waarde]));
  }

  switch (invoer.actie) {
    case 'overzicht': {
      const tel = async (tabel: string, filter?: (q: any) => any) => {
        let q = db.from(tabel).select('id', { count: 'exact', head: true });
        if (filter) q = filter(q);
        return (await q).count ?? 0;
      };
      const [contacten, wachtlijst, suppressies] = await Promise.all([
        tel('marketing_contacts', (q) => q.is('deleted_at', null)),
        tel('wachtlijst'),
        tel('marketing_suppressions'),
      ]);
      // Status per contact uit het toestemmingsbewijs
      const { data: rijen } = await db
        .from('marketing_consents')
        .select('contact_id, status, created_at')
        .eq('purpose', 'newsletter');
      const perContact = new Map<string, { status: 'pending' | 'granted' | 'revoked'; created_at: string }[]>();
      for (const r of rijen ?? []) {
        perContact.set(r.contact_id, [...(perContact.get(r.contact_id) ?? []), r]);
      }
      const telling = { granted: 0, pending: 0, revoked: 0 };
      for (const lijst of perContact.values()) {
        const s = consentStatus(lijst);
        if (s !== 'none') telling[s]++;
      }
      return json({
        rol,
        contacten,
        wachtlijstEenmalig: wachtlijst,
        suppressies,
        nieuwsbrief: telling,
        instellingen: await instellingen(),
      });
    }

    case 'contacten': {
      if (!magContacten) return json({ error: 'Geen toegang' }, 403);
      const pagina = Math.max(0, Math.min(1000, Number(invoer.pagina) || 0));
      const zoek = typeof invoer.zoek === 'string' ? invoer.zoek.trim().toLowerCase().slice(0, 100) : '';
      let q = db
        .from('marketing_contacts')
        .select('id, email_normalized, locale, source, utm_source, utm_campaign, created_at, user_id', {
          count: 'exact',
        })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(pagina * PAGINA, pagina * PAGINA + PAGINA - 1);
      if (zoek) q = q.ilike('email_normalized', `%${zoek.replace(/[%_]/g, '')}%`);
      const { data: contacten, count } = await q;
      const ids = (contacten ?? []).map((c) => c.id);
      const { data: consents } = ids.length
        ? await db
            .from('marketing_consents')
            .select('contact_id, status, created_at')
            .eq('purpose', 'newsletter')
            .in('contact_id', ids)
        : { data: [] };
      const hashes = await Promise.all((contacten ?? []).map((c) => sha256(c.email_normalized)));
      const { data: onderdrukt } = hashes.length
        ? await db.from('marketing_suppressions').select('email_hash, reason').in('email_hash', hashes)
        : { data: [] };
      return json({
        totaal: count ?? 0,
        pagina,
        perPagina: PAGINA,
        contacten: (contacten ?? []).map((c, i) => ({
          ...c,
          status: consentStatus((consents ?? []).filter((r) => r.contact_id === c.id)),
          suppressies: (onderdrukt ?? []).filter((s) => s.email_hash === hashes[i]).map((s) => s.reason),
        })),
      });
    }

    case 'contact': {
      if (!magContacten) return json({ error: 'Geen toegang' }, 403);
      const id = typeof invoer.id === 'string' && UUID.test(invoer.id) ? invoer.id : '';
      if (!id) return json({ error: 'Ongeldig id' }, 400);
      const { data: contact } = await db.from('marketing_contacts').select('*').eq('id', id).maybeSingle();
      if (!contact) return json({ error: 'Niet gevonden' }, 404);
      const [{ data: consents }, { data: onderdrukt }, { data: events }] = await Promise.all([
        db
          .from('marketing_consents')
          .select('id, purpose, status, method, legal_text_version, legal_text_snapshot, source_url, created_at, confirms_consent_id')
          .eq('contact_id', id)
          .order('created_at', { ascending: false }),
        db
          .from('marketing_suppressions')
          .select('reason, scope, created_at')
          .eq('email_hash', await sha256(contact.email_normalized)),
        db
          .from('marketing_events')
          .select('event_name, occurred_at, properties')
          .eq('contact_id', id)
          .order('occurred_at', { ascending: false })
          .limit(50),
      ]);
      return json({
        contact,
        status: consentStatus((consents ?? []).filter((c) => c.purpose === 'newsletter')),
        consents,
        suppressies: onderdrukt,
        events,
      });
    }

    case 'afmelden': {
      if (!magWijzigen) return json({ error: 'Geen toegang' }, 403);
      if (!(await misbruikrem())) return json({ error: 'Te veel acties, probeer het later' }, 429);
      const id = typeof invoer.id === 'string' && UUID.test(invoer.id) ? invoer.id : '';
      const { data: contact } = await db
        .from('marketing_contacts')
        .select('id, email_normalized')
        .eq('id', id)
        .maybeSingle();
      if (!contact) return json({ error: 'Niet gevonden' }, 404);
      await db.from('marketing_consents').insert({
        contact_id: contact.id,
        purpose: 'newsletter',
        status: 'revoked',
        method: 'admin',
      });
      await db.from('marketing_suppressions').upsert(
        {
          email_hash: await sha256(contact.email_normalized),
          contact_id: contact.id,
          scope: 'marketing',
          reason: 'unsubscribe',
        },
        { onConflict: 'email_hash,scope,reason', ignoreDuplicates: true },
      );
      await db
        .from('email_outbox')
        .update({ status: 'cancelled', last_error: 'unsubscribed' })
        .eq('contact_id', contact.id)
        .eq('email_kind', 'marketing')
        .eq('status', 'pending');
      await log('afmelden', 'contact', contact.id, 'Afgemeld door beheer');
      return json({ ok: true });
    }

    case 'verwijderen': {
      // Verzoek tot verwijdering: contact en toestemmingsbewijs weg, alleen een hash blijft
      // (zodat het adres nooit opnieuw gemaild wordt)
      if (!magWijzigen) return json({ error: 'Geen toegang' }, 403);
      if (!(await misbruikrem())) return json({ error: 'Te veel acties, probeer het later' }, 429);
      const id = typeof invoer.id === 'string' && UUID.test(invoer.id) ? invoer.id : '';
      const { data: contact } = await db
        .from('marketing_contacts')
        .select('id, email_normalized')
        .eq('id', id)
        .maybeSingle();
      if (!contact) return json({ error: 'Niet gevonden' }, 404);
      if (normaliseerEmail(invoer.bevestiging) !== contact.email_normalized) {
        return json({ error: 'Typ het e-mailadres ter bevestiging' }, 400);
      }
      await db.from('marketing_suppressions').upsert(
        { email_hash: await sha256(contact.email_normalized), scope: 'all', reason: 'deletion_request' },
        { onConflict: 'email_hash,scope,reason', ignoreDuplicates: true },
      );
      const { error } = await db.from('marketing_contacts').delete().eq('id', contact.id);
      if (error) return json({ error: 'Verwijderen mislukt' }, 500);
      await log('verwijderen', 'contact', contact.id, 'Verwijderd op verzoek; hash blijft in suppressie');
      return json({ ok: true });
    }

    case 'zetInstellingen': {
      if (!magWijzigen) return json({ error: 'Geen toegang' }, 403);
      if (!(await misbruikrem())) return json({ error: 'Te veel acties, probeer het later' }, 429);
      const wijziging: { sleutel: string; waarde: unknown }[] = [];
      if (invoer.send_mode !== undefined) {
        if (!['disabled', 'test', 'live'].includes(invoer.send_mode as string)) {
          return json({ error: 'Ongeldige verzendmodus' }, 400);
        }
        // Live versturen: alleen de eigenaar, met een getypte bevestiging
        if (invoer.send_mode === 'live' && (rol !== 'owner' || invoer.bevestiging !== 'LIVE')) {
          return json({ error: 'Alleen de eigenaar kan live zetten (typ LIVE)' }, 403);
        }
        wijziging.push({ sleutel: 'send_mode', waarde: invoer.send_mode });
      }
      if (invoer.test_recipients !== undefined) {
        const lijst = Array.isArray(invoer.test_recipients) ? invoer.test_recipients : [];
        const adressen = lijst.map(normaliseerEmail).filter((e): e is string => !!e);
        if (adressen.length !== lijst.length || adressen.length > 10) {
          return json({ error: 'Maximaal 10 geldige testadressen' }, 400);
        }
        wijziging.push({ sleutel: 'test_recipients', waarde: [...new Set(adressen)] });
      }
      if (invoer.kill_switch !== undefined) {
        wijziging.push({ sleutel: 'kill_switch', waarde: invoer.kill_switch === true });
      }
      for (const w of wijziging) {
        await db
          .from('marketing_settings')
          .upsert({ ...w, updated_at: new Date().toISOString(), updated_by: auth.user.id });
        await log('instelling', 'setting', w.sleutel, `Gewijzigd naar ${JSON.stringify(w.waarde)}`);
      }
      return json({ ok: true, instellingen: await instellingen() });
    }

    case 'auditlog': {
      if (!magWijzigen) return json({ error: 'Geen toegang' }, 403);
      const { data } = await db
        .from('marketing_audit_logs')
        .select('actie, object_type, object_id, samenvatting, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      return json({ log: data ?? [] });
    }

    default:
      return json({ error: 'Onbekende actie' }, 400);
  }
});
