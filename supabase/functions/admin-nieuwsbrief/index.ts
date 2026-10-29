// Nieuwsbrieven in de beheeromgeving: campagnes maken en bewerken (vaste blokken), voorbeeld,
// doelgroep, testmail naar de testadressen, indienen, goedkeuren, inplannen, pauzeren,
// annuleren, sjablonen en de verzendwachtrij. Alleen voor public.admins.
// Rollen: owner/admin alles; marketing_editor concepten en testmail (niet goedkeuren of
// inplannen); analyst alleen lezen. Elke wijziging komt in marketing_audit_logs.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { resend } from '../_shared/mail.ts';
import { isTaal, magVersturen, sha256, TALEN, type SuppressieReden } from '../_shared/marketing.ts';
import { controleer, maakMail, schoonBlokken, slug } from '../_shared/nieuwsbrief.ts';
import {
  campagneUitRij,
  doelgroep,
  SITE,
  verwerkWachtrij,
  verzendInstellingen,
} from '../_shared/verzending.ts';

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
const MAX_WIJZIGINGEN_PER_UUR = 120;
const MAX_TESTMAILS_PER_UUR = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BEWERKBAAR = ['draft', 'in_review', 'approved'];
const KOLOMMEN =
  'id, name, slug, locale, subject, preheader, content_blocks_json, segment, status, scheduled_at, approved_by, approved_at, sent_count, created_at, updated_at';

const tekst = (waarde: unknown, max: number) => (typeof waarde === 'string' ? waarde.trim().slice(0, max) : '');
const talenUit = (waarde: unknown) =>
  Array.isArray(waarde) ? [...new Set(waarde.filter(isTaal))] : [];
const maskeer = (email: string) => {
  const [naam, domein] = email.split('@');
  return `${naam!.slice(0, 1)}***@${domein}`;
};

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
  const isBeheer = rol === 'owner' || rol === 'admin';
  const magBewerken = isBeheer || rol === 'marketing_editor';
  const gebruiker = auth.user.id;

  let invoer: Record<string, unknown>;
  try {
    invoer = await req.json();
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400);
  }

  const log = (actie: string, objectId: string, samenvatting: string) =>
    db.from('marketing_audit_logs').insert({
      actor_id: gebruiker,
      actie,
      object_type: 'campagne',
      object_id: objectId,
      samenvatting: samenvatting.slice(0, 300),
    });

  async function misbruikrem(soort: string, max: number): Promise<boolean> {
    const sleutel = `${soort}:${gebruiker}`;
    const { count } = await db
      .from('misbruikrem')
      .select('id', { count: 'exact', head: true })
      .eq('sleutel', sleutel)
      .gte('created_at', new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) >= max) return false;
    await db.from('misbruikrem').insert({ sleutel });
    return true;
  }

  const geenToegang = () => json({ error: 'Geen toegang' }, 403);
  const id = typeof invoer.id === 'string' && UUID.test(invoer.id) ? invoer.id : '';

  async function campagne() {
    if (!id) return null;
    const { data } = await db.from('newsletter_campaigns').select(KOLOMMEN).eq('id', id).maybeSingle();
    return data;
  }

  // Statuswissel alleen vanuit de verwachte status (geen dubbele of verouderde klikken)
  async function wissel(van: string[], naar: Record<string, unknown>, actie: string) {
    const { data } = await db
      .from('newsletter_campaigns')
      .update(naar)
      .eq('id', id)
      .in('status', van)
      .select(KOLOMMEN)
      .maybeSingle();
    if (!data) return json({ error: 'Deze stap kan niet in de huidige status' }, 409);
    await log(actie, id, `Status ${naar.status ?? ''}`.trim());
    return json({ ok: true, campagne: data });
  }

  const wijzigend = !['lijst', 'ophalen', 'voorbeeld', 'doelgroep', 'wachtrij', 'sjablonen'].includes(
    invoer.actie as string,
  );
  if (wijzigend && !(await misbruikrem('admin-nieuwsbrief', MAX_WIJZIGINGEN_PER_UUR))) {
    return json({ error: 'Te veel acties, probeer het later' }, 429);
  }

  switch (invoer.actie) {
    case 'lijst': {
      const { data } = await db
        .from('newsletter_campaigns')
        .select('id, name, locale, subject, status, scheduled_at, sent_count, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200);
      return json({ rol, campagnes: data ?? [], instellingen: await verzendInstellingen(db) });
    }

    case 'ophalen': {
      const c = await campagne();
      if (!c) return json({ error: 'Niet gevonden' }, 404);
      const { data: ontvangers } = await db
        .from('newsletter_campaign_recipients')
        .select('status')
        .eq('campaign_id', c.id);
      const resultaten: Record<string, number> = {};
      for (const r of ontvangers ?? []) resultaten[r.status] = (resultaten[r.status] ?? 0) + 1;
      return json({ campagne: c, controle: controleer(campagneUitRij(c)), resultaten });
    }

    case 'nieuw': {
      if (!magBewerken) return geenToegang();
      const taal = isTaal(invoer.taal) ? invoer.taal : 'nl';
      let basis = { subject: '', preheader: '', content_blocks_json: [] as unknown, template_id: null as string | null };
      const sjabloon = typeof invoer.sjabloon === 'string' && UUID.test(invoer.sjabloon) ? invoer.sjabloon : '';
      if (sjabloon) {
        const { data: s } = await db.from('newsletter_templates').select('*').eq('id', sjabloon).maybeSingle();
        if (s) {
          basis = {
            subject: s.subject_default,
            preheader: s.preheader_default,
            content_blocks_json: s.content_blocks_json,
            template_id: s.id,
          };
        }
      }
      const naam = tekst(invoer.naam, 120) || 'Nieuwe nieuwsbrief';
      const { data, error } = await db
        .from('newsletter_campaigns')
        .insert({
          name: naam,
          slug: slug(naam),
          locale: taal,
          segment: { talen: [taal] },
          created_by: gebruiker,
          ...basis,
        })
        .select(KOLOMMEN)
        .single();
      if (error) return json({ error: 'Aanmaken mislukt' }, 500);
      await log('nieuw', data.id, naam);
      return json({ ok: true, campagne: data });
    }

    case 'opslaan': {
      if (!magBewerken) return geenToegang();
      const naam = tekst(invoer.naam, 120);
      if (!naam) return json({ error: 'Naam ontbreekt' }, 400);
      const talen = talenUit(invoer.talen);
      // Wijzigen na goedkeuring maakt de goedkeuring ongedaan
      return wissel(
        BEWERKBAAR,
        {
          name: naam,
          slug: slug(naam),
          locale: isTaal(invoer.taal) ? invoer.taal : 'nl',
          subject: tekst(invoer.onderwerp, 150),
          preheader: tekst(invoer.preheader, 200),
          content_blocks_json: schoonBlokken(invoer.blokken),
          segment: { talen },
          status: 'draft',
          approved_by: null,
          approved_at: null,
        },
        'opslaan',
      );
    }

    case 'dupliceren': {
      if (!magBewerken) return geenToegang();
      const c = await campagne();
      if (!c) return json({ error: 'Niet gevonden' }, 404);
      const naam = `${c.name} (kopie)`.slice(0, 120);
      const { data, error } = await db
        .from('newsletter_campaigns')
        .insert({
          name: naam,
          slug: c.slug,
          locale: c.locale,
          subject: c.subject,
          preheader: c.preheader,
          content_blocks_json: c.content_blocks_json,
          segment: c.segment,
          created_by: gebruiker,
        })
        .select(KOLOMMEN)
        .single();
      if (error) return json({ error: 'Dupliceren mislukt' }, 500);
      await log('dupliceren', data.id, `Kopie van ${c.id}`);
      return json({ ok: true, campagne: data });
    }

    case 'verwijderen': {
      if (!magBewerken) return geenToegang();
      const { data } = await db
        .from('newsletter_campaigns')
        .delete()
        .eq('id', id)
        .eq('status', 'draft')
        .select('id');
      if (!data?.length) return json({ error: 'Alleen concepten kun je verwijderen' }, 409);
      await log('verwijderen', id, 'Concept verwijderd');
      return json({ ok: true });
    }

    case 'voorbeeld': {
      // Voorbeeld van de (nog niet opgeslagen) inhoud uit de editor
      const c = {
        naam: tekst(invoer.naam, 120) || 'voorbeeld',
        taal: isTaal(invoer.taal) ? invoer.taal : 'nl',
        onderwerp: tekst(invoer.onderwerp, 150),
        preheader: tekst(invoer.preheader, 200),
        blokken: schoonBlokken(invoer.blokken),
      } as const;
      const mail = maakMail(
        { ...c, blokken: [...c.blokken] },
        { afmeldUrl: `${SITE()}/nieuwsbrief/afmelden`, test: invoer.test === true },
      );
      return json({ ...mail, controle: controleer({ ...c, blokken: [...c.blokken] }) });
    }

    case 'doelgroep': {
      const talen = talenUit(invoer.talen);
      const lijst = await doelgroep(db, talen);
      return json({
        aantal: lijst.length,
        voorbeelden: lijst.slice(0, 5).map((c) => ({ email: maskeer(c.email_normalized), taal: c.locale })),
      });
    }

    case 'testmail': {
      if (!magBewerken) return geenToegang();
      if (!(await misbruikrem('nieuwsbrief-test', MAX_TESTMAILS_PER_UUR))) {
        return json({ error: 'Te veel testmails, probeer het later' }, 429);
      }
      const c = await campagne();
      if (!c) return json({ error: 'Niet gevonden' }, 404);
      const inhoud = campagneUitRij(c);
      const controle = controleer(inhoud);
      if (controle.fouten.length) return json({ error: controle.fouten[0] }, 400);
      const instellingen = await verzendInstellingen(db);
      if (instellingen.sendMode === 'disabled') {
        return json({ error: 'Zet de verzendmodus eerst op Test (Marketing → Verzendinstellingen)' }, 409);
      }
      if (!instellingen.testontvangers.length) return json({ error: 'Voeg eerst testadressen toe' }, 409);
      const apiKey = Deno.env.get('RESEND_API_KEY');
      if (!apiKey) return json({ error: 'RESEND_API_KEY ontbreekt in de function-secrets' }, 503);
      const provider = resend(apiKey);
      const mail = maakMail(inhoud, {
        afmeldUrl: `${SITE()}/nieuwsbrief/afmelden`,
        test: true,
        campagneSlug: c.slug,
      });
      const resultaat: { aan: string; ok: boolean }[] = [];
      for (const aan of instellingen.testontvangers.slice(0, 10)) {
        const { data: onderdrukt } = await db
          .from('marketing_suppressions')
          .select('reason, scope')
          .eq('email_hash', await sha256(aan));
        // Alleen testadressen; ook in live-modus nooit naar iemand anders
        const besluit = magVersturen({
          soort: 'transactional',
          email: aan,
          consent: 'none',
          suppressies: (onderdrukt ?? []) as { reason: SuppressieReden; scope: 'marketing' | 'all' }[],
          ...instellingen,
          sendMode: 'test',
        });
        if (!besluit.ok) {
          resultaat.push({ aan, ok: false });
          continue;
        }
        const v = await provider.verstuur({ aan, onderwerp: mail.onderwerp, html: mail.html, tekst: mail.tekst });
        resultaat.push({ aan, ok: v.ok });
      }
      await log('testmail', c.id, `Naar ${resultaat.filter((r) => r.ok).length} testadres(sen)`);
      return json({ ok: true, resultaat });
    }

    case 'indienen': {
      if (!magBewerken) return geenToegang();
      const c = await campagne();
      if (!c) return json({ error: 'Niet gevonden' }, 404);
      const controle = controleer(campagneUitRij(c));
      if (controle.fouten.length) return json({ error: controle.fouten[0] }, 400);
      return wissel(['draft'], { status: 'in_review' }, 'indienen');
    }

    case 'afkeuren':
      if (!isBeheer) return geenToegang();
      return wissel(['in_review', 'approved'], { status: 'draft', approved_by: null, approved_at: null }, 'afkeuren');

    case 'goedkeuren': {
      if (!isBeheer) return geenToegang();
      const c = await campagne();
      if (!c) return json({ error: 'Niet gevonden' }, 404);
      const controle = controleer(campagneUitRij(c));
      if (controle.fouten.length) return json({ error: controle.fouten[0] }, 400);
      if (!(c.segment?.talen ?? []).length) return json({ error: 'Kies minstens één taal als doelgroep' }, 400);
      return wissel(
        ['in_review'],
        { status: 'approved', approved_by: gebruiker, approved_at: new Date().toISOString() },
        'goedkeuren',
      );
    }

    case 'inplannen': {
      if (!isBeheer) return geenToegang();
      if (invoer.bevestigd !== true) return json({ error: 'Bevestiging ontbreekt' }, 400);
      const moment = invoer.moment === 'nu' ? new Date() : new Date(String(invoer.moment));
      if (Number.isNaN(moment.getTime())) return json({ error: 'Ongeldig tijdstip' }, 400);
      if (moment.getTime() < Date.now() - 60_000) return json({ error: 'Dit tijdstip ligt in het verleden' }, 400);
      if (moment.getTime() > Date.now() + 90 * 86400_000) {
        return json({ error: 'Plan maximaal 90 dagen vooruit' }, 400);
      }
      return wissel(['approved'], { status: 'scheduled', scheduled_at: moment.toISOString() }, 'inplannen');
    }

    case 'pauzeren':
      if (!isBeheer) return geenToegang();
      return wissel(['scheduled', 'sending'], { status: 'paused' }, 'pauzeren');

    case 'hervatten': {
      if (!isBeheer) return geenToegang();
      // Al begonnen (mails in de wachtrij): verder verzenden; anders weer ingepland
      const { count } = await db
        .from('email_outbox')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', id);
      return wissel(['paused'], { status: (count ?? 0) > 0 ? 'sending' : 'scheduled' }, 'hervatten');
    }

    case 'annuleren': {
      if (!isBeheer) return geenToegang();
      const antwoord = await wissel(
        ['draft', 'in_review', 'approved', 'scheduled', 'sending', 'paused'],
        { status: 'cancelled' },
        'annuleren',
      );
      if (antwoord.status === 200) {
        await db
          .from('email_outbox')
          .update({ status: 'cancelled', last_error: 'campaign_cancelled' })
          .eq('campaign_id', id)
          .eq('status', 'pending');
        await db
          .from('newsletter_campaign_recipients')
          .update({ status: 'cancelled' })
          .eq('campaign_id', id)
          .eq('status', 'queued');
      }
      return antwoord;
    }

    case 'sjablonen': {
      const { data } = await db
        .from('newsletter_templates')
        .select('id, name, locale, category, version, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100);
      return json({ sjablonen: data ?? [] });
    }

    case 'alsSjabloon': {
      if (!magBewerken) return geenToegang();
      const c = await campagne();
      if (!c) return json({ error: 'Niet gevonden' }, 404);
      const { data, error } = await db
        .from('newsletter_templates')
        .insert({
          name: c.name,
          locale: c.locale,
          subject_default: c.subject,
          preheader_default: c.preheader,
          content_blocks_json: c.content_blocks_json,
          created_by: gebruiker,
        })
        .select('id')
        .single();
      if (error) return json({ error: 'Opslaan als sjabloon mislukt' }, 500);
      await log('sjabloon', data.id, `Sjabloon uit ${c.id}`);
      return json({ ok: true });
    }

    case 'wachtrij': {
      const tel = async (status: string) =>
        (await db.from('email_outbox').select('id', { count: 'exact', head: true }).eq('status', status))
          .count ?? 0;
      const statussen = ['pending', 'sending', 'sent', 'skipped', 'dead', 'cancelled'];
      const aantallen = Object.fromEntries(
        await Promise.all(statussen.map(async (s) => [s, await tel(s)] as const)),
      );
      const { data: fouten } = await db
        .from('email_outbox')
        .select('id, campaign_id, status, attempt_count, last_error, updated_at')
        .not('last_error', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10);
      return json({
        aantallen,
        fouten: fouten ?? [],
        instellingen: await verzendInstellingen(db),
        talen: TALEN,
      });
    }

    case 'lancering': {
      // Eenmalige lanceringsmail aan de wachtlijst (de belofte op de site). Alleen de eigenaar.
      if (rol !== 'owner') return geenToegang();
      if (invoer.bevestigd !== true) return json({ error: 'Bevestiging ontbreekt' }, 400);
      const instellingen = await verzendInstellingen(db);
      if (instellingen.sendMode === 'disabled') {
        return json({ error: 'Zet de verzendmodus eerst op Test of Live' }, 409);
      }
      const { data: lijst } = await db.from('wachtlijst').select('email, taal').limit(50_000);
      // In testmodus alleen de testadressen die ook op de wachtlijst staan
      const ontvangers = (lijst ?? []).filter(
        (w) => instellingen.sendMode === 'live' || instellingen.testontvangers.includes(w.email),
      );
      for (let i = 0; i < ontvangers.length; i += 500) {
        const deel = ontvangers.slice(i, i + 500);
        const rijen = await Promise.all(
          deel.map(async (w) => ({
            email_kind: 'transactional',
            render_context_json: { soort: 'lancering', email: w.email, taal: w.taal },
            idempotency_key: `lancering:${await sha256(w.email)}`,
          })),
        );
        await db.from('email_outbox').upsert(rijen, {
          onConflict: 'idempotency_key',
          ignoreDuplicates: true,
        });
      }
      await log('lancering', 'wachtlijst', `${ontvangers.length} adressen in de wachtrij`);
      return json({ ok: true, aantal: ontvangers.length });
    }

    case 'verwerk': {
      if (!isBeheer) return geenToegang();
      const resultaat = await verwerkWachtrij(db);
      await db.from('marketing_audit_logs').insert({
        actor_id: gebruiker,
        actie: 'wachtrij',
        object_type: 'outbox',
        samenvatting: JSON.stringify(resultaat),
      });
      return json({ ok: true, resultaat });
    }

    default:
      return json({ error: 'Onbekende actie' }, 400);
  }
});
