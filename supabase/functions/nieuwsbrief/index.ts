// Nieuwsbrief vanaf de website: aanmelden (dubbele bevestiging), bevestigen en afmelden zonder
// login. Openbaar (zonder account) met misbruikrem. Antwoorden verraden nooit of een adres al
// bekend is. Er gaat alleen mail de deur uit als de verzendmodus dat toestaat (standaard uit).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { opmaak, resend } from '../_shared/mail.ts';
import {
  consentStatus,
  controleerAfmeldToken,
  isTaal,
  magOpnieuwAanmelden,
  magVersturen,
  maakToken,
  normaliseerEmail,
  sha256,
  type SendMode,
  type SuppressieReden,
  type Taal,
} from '../_shared/marketing.ts';
import { NIEUWSBRIEF_TEKSTEN, TOESTEMMING_VERSIE } from '../_shared/nieuwsbriefTeksten.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const MAX_PER_UUR = 5;
const MAX_TOTAAL_PER_UUR = 300;
const TOKEN_GELDIG_MS = 48 * 3600_000;
// Geen nieuwe bevestigingsmail binnen 10 minuten naar hetzelfde adres
const OPNIEUW_NA_MS = 10 * 60_000;
const SITE = () => Deno.env.get('MARKETING_SITE_URL') ?? 'https://www.mooove-app.com';
const taalPad = (taal: Taal) => (taal === 'nl' ? '' : `${taal}/`);
const knip = (waarde: unknown, max: number) =>
  typeof waarde === 'string' && waarde.trim() ? waarde.trim().slice(0, max) : null;

type Db = SupabaseClient;

async function instellingen(db: Db) {
  const { data } = await db.from('marketing_settings').select('sleutel, waarde');
  const kaart = new Map((data ?? []).map((r) => [r.sleutel as string, r.waarde as unknown]));
  const modus = kaart.get('send_mode');
  return {
    sendMode: (modus === 'test' || modus === 'live' ? modus : 'disabled') as SendMode,
    testontvangers: Array.isArray(kaart.get('test_recipients'))
      ? (kaart.get('test_recipients') as string[])
      : [],
    killSwitch: kaart.get('kill_switch') === true,
  };
}

async function suppressies(db: Db, emailHash: string) {
  const { data } = await db
    .from('marketing_suppressions')
    .select('reason, scope')
    .eq('email_hash', emailHash);
  return (data ?? []) as { reason: SuppressieReden; scope: 'marketing' | 'all' }[];
}

async function misbruikrem(db: Db, req: Request): Promise<boolean> {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    ((req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'onbekend');
  const dag = new Date().toISOString().slice(0, 10);
  const sleutel = `nieuwsbrief:${await sha256(`${ip}|${dag}|${Deno.env.get('SUPABASE_URL')}`)}`;
  const uurGeleden = new Date(Date.now() - 3600_000).toISOString();
  const tel = async (s: string) =>
    (
      await db
        .from('misbruikrem')
        .select('id', { count: 'exact', head: true })
        .eq('sleutel', s)
        .gte('created_at', uurGeleden)
    ).count ?? 0;
  if ((await tel(sleutel)) >= MAX_PER_UUR || (await tel('nieuwsbrief:totaal')) >= MAX_TOTAAL_PER_UUR) {
    return false;
  }
  await db.from('misbruikrem').insert([{ sleutel }, { sleutel: 'nieuwsbrief:totaal' }]);
  return true;
}

async function event(db: Db, naam: string, contactId: string | null, properties = {}) {
  await db
    .from('marketing_events')
    .insert({ event_name: naam, event_source: 'website', contact_id: contactId, properties });
}

async function aanmelden(db: Db, invoer: Record<string, unknown>, req: Request) {
  // Toestemming moet expliciet zijn aangevinkt; zonder vinkje geen aanmelding
  if (invoer.toestemming !== true) return json({ error: 'Toestemming ontbreekt' }, 400);
  const email = normaliseerEmail(invoer.email);
  if (!email) return json({ error: 'Ongeldig e-mailadres' }, 400);
  const taal: Taal = isTaal(invoer.taal) ? invoer.taal : 'en';
  if (!(await misbruikrem(db, req))) return json({ error: 'Te veel aanmeldingen, probeer het later' }, 429);

  const emailHash = await sha256(email);
  const onderdrukt = await suppressies(db, emailHash);
  // Na een bounce, klacht of verwijderverzoek niet opnieuw; antwoord blijft hetzelfde
  if (!magOpnieuwAanmelden(onderdrukt.map((s) => s.reason))) return json({ ok: true });

  const utm = (invoer.utm ?? {}) as Record<string, unknown>;
  let { data: contact } = await db
    .from('marketing_contacts')
    .select('id')
    .eq('email_normalized', email)
    .is('deleted_at', null)
    .maybeSingle();
  if (!contact) {
    const { data, error } = await db
      .from('marketing_contacts')
      .insert({
        email_normalized: email,
        locale: taal,
        source: knip(invoer.bron, 40) ?? 'website',
        utm_source: knip(utm.source, 100),
        utm_medium: knip(utm.medium, 100),
        utm_campaign: knip(utm.campaign, 100),
        utm_content: knip(utm.content, 100),
        referrer: knip(invoer.referrer, 300),
      })
      .select('id')
      .single();
    if (error) return json({ error: 'Aanmelden mislukt' }, 500);
    contact = data;
  }

  const { data: consents } = await db
    .from('marketing_consents')
    .select('status, created_at')
    .eq('contact_id', contact.id)
    .eq('purpose', 'newsletter');
  if (consentStatus(consents ?? []) === 'granted') return json({ ok: true });
  const recent = (consents ?? []).some(
    (c) => c.status === 'pending' && Date.now() - new Date(c.created_at).getTime() < OPNIEUW_NA_MS,
  );
  if (recent) return json({ ok: true });

  const teksten = NIEUWSBRIEF_TEKSTEN[taal];
  const token = maakToken();
  const { error } = await db.from('marketing_consents').insert({
    contact_id: contact.id,
    purpose: 'newsletter',
    status: 'pending',
    method: 'form',
    legal_text_version: TOESTEMMING_VERSIE,
    legal_text_snapshot: teksten.toestemming,
    source_url: knip(invoer.pagina, 300),
    proof_token_hash: await sha256(token),
    token_expires_at: new Date(Date.now() + TOKEN_GELDIG_MS).toISOString(),
  });
  if (error) return json({ error: 'Aanmelden mislukt' }, 500);
  await event(db, 'newsletter_signup_requested', contact.id, { locale: taal });

  // Bevestigingsmail: een servicebericht, maar wel binnen de verzendmodus (standaard uit)
  const besluit = magVersturen({
    soort: 'transactional',
    email,
    consent: 'pending',
    suppressies: onderdrukt,
    ...(await instellingen(db)),
  });
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (besluit.ok && apiKey) {
    // Token in het #-deel van de link: dat komt niet in serverlogs terecht
    const url = `${SITE()}/${taalPad(taal)}nieuwsbrief/bevestigen#t=${token}`;
    const { html, tekst } = opmaak({
      taal,
      titel: teksten.titel,
      alineas: [teksten.alinea1, teksten.alinea2],
      knop: { tekst: teksten.knop, url },
      voet: teksten.voet,
    });
    await resend(apiKey).verstuur({ aan: email, onderwerp: teksten.onderwerp, html, tekst });
  } else {
    await event(db, 'email_skipped', contact.id, { reden: besluit.ok ? 'no_api_key' : besluit.reden });
  }
  return json({ ok: true });
}

async function bevestigen(db: Db, invoer: Record<string, unknown>) {
  if (typeof invoer.token !== 'string' || invoer.token.length < 20) {
    return json({ error: 'Ongeldige link' }, 400);
  }
  const { data: aanmelding } = await db
    .from('marketing_consents')
    .select('id, contact_id, legal_text_version, legal_text_snapshot, token_expires_at')
    .eq('proof_token_hash', await sha256(invoer.token))
    .eq('status', 'pending')
    .maybeSingle();
  if (!aanmelding) return json({ error: 'Ongeldige link' }, 400);
  if (new Date(aanmelding.token_expires_at).getTime() < Date.now()) {
    return json({ error: 'Verlopen link' }, 410);
  }
  const { data: contact } = await db
    .from('marketing_contacts')
    .select('email_normalized')
    .eq('id', aanmelding.contact_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!contact) return json({ error: 'Ongeldige link' }, 400);
  const emailHash = await sha256(contact.email_normalized);
  if (!magOpnieuwAanmelden((await suppressies(db, emailHash)).map((s) => s.reason))) {
    return json({ error: 'Niet mogelijk' }, 409);
  }

  const { error } = await db.from('marketing_consents').insert({
    contact_id: aanmelding.contact_id,
    purpose: 'newsletter',
    status: 'granted',
    method: 'double_opt_in',
    legal_text_version: aanmelding.legal_text_version,
    legal_text_snapshot: aanmelding.legal_text_snapshot,
    confirms_consent_id: aanmelding.id,
  });
  // Al eerder bevestigd (link twee keer geopend): gewoon succes tonen
  if (error) return json({ ok: true, al: true });
  // Expliciet opnieuw aangemeld: een eerdere afmelding vervalt
  await db.from('marketing_suppressions').delete().eq('email_hash', emailHash).eq('reason', 'unsubscribe');
  await event(db, 'newsletter_confirmed', aanmelding.contact_id);
  // Welkomstmail via de verzendwachtrij (zelfde controles als elke marketingmail)
  await db.from('email_outbox').upsert(
    {
      contact_id: aanmelding.contact_id,
      email_kind: 'marketing',
      render_context_json: { soort: 'welkom' },
      idempotency_key: `welkom:${aanmelding.id}`,
    },
    { onConflict: 'idempotency_key', ignoreDuplicates: true },
  );
  return json({ ok: true });
}

async function afmelden(db: Db, invoer: Record<string, unknown>) {
  const contactId = await controleerAfmeldToken(invoer.token, Deno.env.get('MARKETING_TOKEN_SECRET') ?? '');
  if (!contactId) return json({ error: 'Ongeldige link' }, 400);
  const { data: contact } = await db
    .from('marketing_contacts')
    .select('id, email_normalized')
    .eq('id', contactId)
    .maybeSingle();
  if (contact) {
    await db.from('marketing_consents').insert({
      contact_id: contact.id,
      purpose: 'newsletter',
      status: 'revoked',
      method: 'unsubscribe_link',
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
    // Al ingeplande marketingmail voor dit adres vervalt meteen
    await db
      .from('email_outbox')
      .update({ status: 'cancelled', last_error: 'unsubscribed' })
      .eq('contact_id', contact.id)
      .eq('email_kind', 'marketing')
      .eq('status', 'pending');
    await event(db, 'newsletter_unsubscribed', contact.id);
  }
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Methode niet toegestaan' }, 405);

  // One-click afmelden vanuit de mailclient (RFC 8058): POST naar ?afmelden=<token>
  const url = new URL(req.url);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const oneClick = url.searchParams.get('afmelden');
  if (oneClick) return afmelden(db, { token: oneClick });

  let invoer: Record<string, unknown>;
  try {
    invoer = await req.json();
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400);
  }
  switch (invoer.actie) {
    case 'aanmelden':
      return aanmelden(db, invoer, req);
    case 'bevestigen':
      return bevestigen(db, invoer);
    case 'afmelden':
      return afmelden(db, invoer);
    default:
      return json({ error: 'Onbekende actie' }, 400);
  }
});
