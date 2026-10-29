// Verzendwachtrij voor marketingmail (Deno). Wordt aangeroepen door de cron-functie mail-worker
// en door de knop "Wachtrij nu verwerken" in het beheer.
// 1. Campagnes waarvan het tijdstip is bereikt: doelgroep bepalen en in de outbox zetten.
// 2. Een batch uit de outbox claimen en per mail vlak vóór verzenden alles opnieuw controleren
//    (verzendmodus, noodstop, toestemming, suppressies, campagnestatus).
// 3. Campagnes zonder openstaande mails afronden.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { opmaak, resend } from './mail.ts';
import {
  consentStatus,
  isTaal,
  magVersturen,
  sha256,
  tekenAfmeldToken,
  type SendMode,
  type SuppressieReden,
  type Taal,
} from './marketing.ts';
import { maakMail, schoonBlokken, volgendePoging, welkomCampagne, type Campagne } from './nieuwsbrief.ts';
import { NIEUWSBRIEF_TEKSTEN } from './nieuwsbriefTeksten.ts';

type Db = SupabaseClient;

const BATCH = 50;
// Resend staat standaard 2 verzoeken per seconde toe
const PAUZE_MS = 600;
const slaap = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const SITE = () => Deno.env.get('MARKETING_SITE_URL') ?? 'https://www.mooove-app.com';

export async function verzendInstellingen(db: Db) {
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

// Afmeldlinks: een pagina op de site (in de mail) en one-click via de functie (header)
export async function afmeldLinks(contactId: string, taal: Taal) {
  const geheim = Deno.env.get('MARKETING_TOKEN_SECRET');
  if (!geheim) return null;
  const token = await tekenAfmeldToken(contactId, geheim);
  return {
    pagina: `${SITE()}/${taal === 'nl' ? '' : `${taal}/`}nieuwsbrief/afmelden#t=${encodeURIComponent(token)}`,
    oneClick: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nieuwsbrief?afmelden=${encodeURIComponent(token)}`,
  };
}

export function campagneUitRij(rij: {
  name: string;
  locale: string;
  subject: string;
  preheader: string;
  content_blocks_json: unknown;
}): Campagne {
  return {
    naam: rij.name,
    taal: isTaal(rij.locale) ? rij.locale : 'en',
    onderwerp: rij.subject,
    preheader: rij.preheader,
    blokken: schoonBlokken(rij.content_blocks_json),
  };
}

// Doelgroep op het moment van inplannen naar de wachtrij: alleen bevestigde toestemming
export async function doelgroep(db: Db, talen: string[]) {
  let q = db.from('marketing_contacts').select('id, email_normalized, locale').is('deleted_at', null);
  if (talen.length) q = q.in('locale', talen);
  const { data: contacten } = await q.limit(50_000);
  const ids = (contacten ?? []).map((c) => c.id);
  const toestemming = new Map<string, { status: 'pending' | 'granted' | 'revoked'; created_at: string }[]>();
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await db
      .from('marketing_consents')
      .select('contact_id, status, created_at')
      .eq('purpose', 'newsletter')
      .in('contact_id', ids.slice(i, i + 500));
    for (const r of data ?? []) toestemming.set(r.contact_id, [...(toestemming.get(r.contact_id) ?? []), r]);
  }
  return (contacten ?? []).filter((c) => consentStatus(toestemming.get(c.id) ?? []) === 'granted');
}

async function startCampagnes(db: Db) {
  const { data: klaar } = await db
    .from('newsletter_campaigns')
    .select('id, segment')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());
  for (const c of klaar ?? []) {
    // Eerst status zetten, zodat een tweede worker deze campagne niet ook oppakt
    const { data: gezet } = await db
      .from('newsletter_campaigns')
      .update({ status: 'sending' })
      .eq('id', c.id)
      .eq('status', 'scheduled')
      .select('id');
    if (!gezet?.length) continue;
    const talen = Array.isArray(c.segment?.talen) ? (c.segment.talen as string[]) : [];
    const ontvangers = await doelgroep(db, talen);
    for (let i = 0; i < ontvangers.length; i += 500) {
      const deel = ontvangers.slice(i, i + 500);
      await db
        .from('newsletter_campaign_recipients')
        .upsert(
          deel.map((o) => ({ campaign_id: c.id, contact_id: o.id })),
          { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true },
        );
      await db.from('email_outbox').upsert(
        deel.map((o) => ({
          contact_id: o.id,
          campaign_id: c.id,
          email_kind: 'marketing',
          idempotency_key: `campagne:${c.id}:${o.id}`,
        })),
        { onConflict: 'idempotency_key', ignoreDuplicates: true },
      );
    }
  }
}

type OutboxRij = {
  id: string;
  contact_id: string | null;
  campaign_id: string | null;
  email_kind: 'marketing' | 'transactional';
  render_context_json: Record<string, unknown>;
  attempt_count: number;
  idempotency_key: string;
};

async function zetRij(db: Db, rij: OutboxRij, velden: Record<string, unknown>, ontvanger?: Record<string, unknown>) {
  await db.from('email_outbox').update({ locked_at: null, ...velden }).eq('id', rij.id);
  if (ontvanger && rij.campaign_id && rij.contact_id) {
    await db
      .from('newsletter_campaign_recipients')
      .update(ontvanger)
      .eq('campaign_id', rij.campaign_id)
      .eq('contact_id', rij.contact_id);
  }
}

export type Resultaat = { geclaimd: number; verstuurd: number; overgeslagen: number; mislukt: number };

export async function verwerkWachtrij(db: Db): Promise<Resultaat> {
  await startCampagnes(db);
  const resultaat: Resultaat = { geclaimd: 0, verstuurd: 0, overgeslagen: 0, mislukt: 0 };
  const { data: rijen } = await db.rpc('marketing_claim_outbox', { aantal: BATCH });
  const lijst = (rijen ?? []) as OutboxRij[];
  resultaat.geclaimd = lijst.length;
  if (!lijst.length) return await rondAf(db, resultaat);

  const instellingen = await verzendInstellingen(db);
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const provider = apiKey ? resend(apiKey) : null;
  const campagnes = new Map<string, Record<string, unknown>>();

  for (const rij of lijst) {
    const overslaan = async (reden: string) => {
      resultaat.overgeslagen++;
      await zetRij(db, rij, { status: 'skipped', last_error: reden }, { status: 'skipped', failure_code: reden });
    };
    if (rij.render_context_json?.soort === 'lancering') {
      await verstuurLancering(db, rij, instellingen, provider, resultaat);
      continue;
    }
    if (!rij.contact_id) {
      await overslaan('geen_contact');
      continue;
    }
    const { data: contact } = await db
      .from('marketing_contacts')
      .select('id, email_normalized, locale, deleted_at')
      .eq('id', rij.contact_id)
      .maybeSingle();
    if (!contact || contact.deleted_at) {
      await overslaan('contact_verwijderd');
      continue;
    }
    const [{ data: consents }, { data: onderdrukt }] = await Promise.all([
      db
        .from('marketing_consents')
        .select('status, created_at')
        .eq('contact_id', contact.id)
        .eq('purpose', 'newsletter'),
      db
        .from('marketing_suppressions')
        .select('reason, scope')
        .eq('email_hash', await sha256(contact.email_normalized)),
    ]);
    const besluit = magVersturen({
      soort: rij.email_kind,
      email: contact.email_normalized,
      consent: consentStatus(consents ?? []),
      suppressies: (onderdrukt ?? []) as { reason: SuppressieReden; scope: 'marketing' | 'all' }[],
      ...instellingen,
    });
    if (!besluit.ok) {
      // Verzendmodus uit of noodstop: later opnieuw proberen in plaats van definitief overslaan
      if (besluit.reden === 'send_mode_disabled' || besluit.reden === 'kill_switch') {
        resultaat.overgeslagen++;
        await zetRij(db, rij, {
          status: 'pending',
          attempt_count: Math.max(0, rij.attempt_count - 1),
          next_retry_at: new Date(Date.now() + 15 * 60_000).toISOString(),
          last_error: besluit.reden,
        });
      } else {
        await overslaan(besluit.reden);
      }
      continue;
    }

    // Opmaken
    let campagne: Campagne;
    let campagneSlug: string | undefined;
    if (rij.campaign_id) {
      let c = campagnes.get(rij.campaign_id);
      if (!c) {
        const { data } = await db
          .from('newsletter_campaigns')
          .select('name, slug, locale, subject, preheader, content_blocks_json, status')
          .eq('id', rij.campaign_id)
          .single();
        c = data ?? {};
        campagnes.set(rij.campaign_id, c);
      }
      if (c.status !== 'sending') {
        // Gepauzeerd of geannuleerd na het claimen: terug in de wachtrij
        await zetRij(db, rij, { status: 'pending', attempt_count: Math.max(0, rij.attempt_count - 1) });
        continue;
      }
      campagne = campagneUitRij(c as Parameters<typeof campagneUitRij>[0]);
      campagneSlug = c.slug as string;
    } else if (rij.render_context_json?.soort === 'welkom') {
      campagne = welkomCampagne(isTaal(contact.locale) ? contact.locale : 'en', SITE());
      campagneSlug = 'welkom';
    } else {
      await overslaan('onbekende_mail');
      continue;
    }
    const links = await afmeldLinks(contact.id, campagne.taal);
    if (!links || !provider) {
      // Zonder afmeldgeheim of mailsleutel nooit marketingmail versturen
      await zetRij(db, rij, {
        status: 'pending',
        attempt_count: Math.max(0, rij.attempt_count - 1),
        next_retry_at: new Date(Date.now() + 60 * 60_000).toISOString(),
        last_error: links ? 'geen_resend_sleutel' : 'geen_afmeldgeheim',
      });
      resultaat.overgeslagen++;
      continue;
    }
    const mail = maakMail(campagne, {
      afmeldUrl: links.pagina,
      test: instellingen.sendMode === 'test',
      campagneSlug,
    });
    const verstuurd = await provider.verstuur({
      aan: contact.email_normalized,
      onderwerp: mail.onderwerp,
      html: mail.html,
      tekst: mail.tekst,
      afmeldUrl: links.oneClick,
      idempotencyKey: rij.idempotency_key,
    });
    if (verstuurd.ok) {
      resultaat.verstuurd++;
      await zetRij(
        db,
        rij,
        { status: 'sent', provider_message_id: verstuurd.id, last_error: null },
        { status: 'sent', sent_at: new Date().toISOString(), provider_message_id: verstuurd.id },
      );
    } else {
      resultaat.mislukt++;
      const opnieuw = volgendePoging(rij.attempt_count);
      await zetRij(
        db,
        rij,
        opnieuw
          ? { status: 'pending', next_retry_at: opnieuw.toISOString(), last_error: verstuurd.fout }
          : { status: 'dead', last_error: verstuurd.fout },
        opnieuw ? undefined : { status: 'failed', failure_code: verstuurd.fout },
      );
    }
    await slaap(PAUZE_MS);
  }
  return await rondAf(db, resultaat);
}

// Eenmalige lanceringsmail aan een wachtlijstadres; daarna gaat het adres van de wachtlijst af
async function verstuurLancering(
  db: Db,
  rij: OutboxRij,
  instellingen: Awaited<ReturnType<typeof verzendInstellingen>>,
  provider: ReturnType<typeof resend> | null,
  resultaat: Resultaat,
) {
  const email = String(rij.render_context_json.email ?? '');
  const taal: Taal = isTaal(rij.render_context_json.taal) ? rij.render_context_json.taal : 'en';
  const { data: onderdrukt } = await db
    .from('marketing_suppressions')
    .select('reason, scope')
    .eq('email_hash', await sha256(email));
  const besluit = magVersturen({
    soort: 'transactional',
    email,
    consent: 'none',
    suppressies: (onderdrukt ?? []) as { reason: SuppressieReden; scope: 'marketing' | 'all' }[],
    ...instellingen,
  });
  if (!besluit.ok || !provider) {
    resultaat.overgeslagen++;
    await zetRij(db, rij, {
      status: besluit.ok ? 'pending' : 'skipped',
      next_retry_at: new Date(Date.now() + 60 * 60_000).toISOString(),
      last_error: besluit.ok ? 'geen_resend_sleutel' : besluit.reden,
    });
    return;
  }
  const t = NIEUWSBRIEF_TEKSTEN[taal];
  const { html, tekst } = opmaak({
    taal,
    titel: t.lanceringTitel,
    alineas: [t.lanceringTekst],
    knop: { tekst: t.lanceringKnop, url: `${SITE()}/${taal === 'nl' ? '' : `${taal}/`}?utm_source=wachtlijst&utm_medium=email&utm_campaign=lancering` },
    voet: t.lanceringVoet,
  });
  const verstuurd = await provider.verstuur({
    aan: email,
    onderwerp: t.lanceringOnderwerp,
    html,
    tekst,
    idempotencyKey: rij.idempotency_key,
  });
  if (verstuurd.ok) {
    resultaat.verstuurd++;
    // Belofte op de site: één bericht, daarna verwijderen we je adres
    await zetRij(db, rij, {
      status: 'sent',
      provider_message_id: verstuurd.id,
      last_error: null,
      render_context_json: { soort: 'lancering', taal },
    });
    await db.from('wachtlijst').delete().eq('email', email);
  } else {
    resultaat.mislukt++;
    const opnieuw = volgendePoging(rij.attempt_count);
    await zetRij(
      db,
      rij,
      opnieuw
        ? { status: 'pending', next_retry_at: opnieuw.toISOString(), last_error: verstuurd.fout }
        : { status: 'dead', last_error: verstuurd.fout },
    );
  }
}

async function rondAf(db: Db, resultaat: Resultaat) {
  const { data: bezig } = await db.from('newsletter_campaigns').select('id').eq('status', 'sending');
  for (const c of bezig ?? []) {
    const { count: open } = await db
      .from('email_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', c.id)
      .in('status', ['pending', 'sending']);
    if ((open ?? 0) > 0) continue;
    const { count: verstuurd } = await db
      .from('email_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', c.id)
      .eq('status', 'sent');
    await db
      .from('newsletter_campaigns')
      .update({ status: 'completed', sent_count: verstuurd ?? 0 })
      .eq('id', c.id)
      .eq('status', 'sending');
  }
  return resultaat;
}
