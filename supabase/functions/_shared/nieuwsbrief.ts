// Nieuwsbrief: vaste, veilige blokken, opmaak naar HTML en platte tekst, controles vóór
// goedkeuring, herhaalschema voor de verzendwachtrij en controle van Resend-webhooks.
// Zonder Deno- of Node-specifieke imports, zodat Jest dit test (src/lib/__tests__/nieuwsbrief.test.ts).
import { escape } from './mail.ts';
import type { Taal } from './marketing.ts';
import { NIEUWSBRIEF_TEKSTEN } from './nieuwsbriefTeksten.ts';

export type Blok =
  | { type: 'titel'; tekst: string }
  | { type: 'alinea'; tekst: string }
  | { type: 'afbeelding'; url: string; alt: string; link?: string }
  | { type: 'knop'; tekst: string; url: string }
  | { type: 'kolommen'; links: string; rechts: string }
  | { type: 'scheiding' }
  | { type: 'handtekening'; tekst: string };

export const BLOK_TYPES = [
  'titel',
  'alinea',
  'afbeelding',
  'knop',
  'kolommen',
  'scheiding',
  'handtekening',
] as const;

export const MAX_BLOKKEN = 40;
const MAX_TEKST = 2000;
const SITE_HOST = /(^|\.)mooove-app\.com$/i;

const tekst = (waarde: unknown, max = MAX_TEKST) =>
  typeof waarde === 'string' ? waarde.slice(0, max) : '';

// Alleen https-links; nooit javascript:, data: of iets anders
export function veiligeUrl(waarde: unknown): string | null {
  if (typeof waarde !== 'string' || waarde.length > 500) return null;
  try {
    const url = new URL(waarde.trim());
    return url.protocol === 'https:' && url.hostname.includes('.') ? url.toString() : null;
  } catch {
    return null;
  }
}

// Ongeldige blokken vallen weg; teksten worden ingekort. Validatie met meldingen: controleer().
export function schoonBlokken(invoer: unknown): Blok[] {
  if (!Array.isArray(invoer)) return [];
  const uit: Blok[] = [];
  for (const b of invoer.slice(0, MAX_BLOKKEN)) {
    if (!b || typeof b !== 'object') continue;
    const r = b as Record<string, unknown>;
    switch (r.type) {
      case 'titel':
      case 'alinea':
      case 'handtekening':
        uit.push({ type: r.type, tekst: tekst(r.tekst, r.type === 'titel' ? 200 : MAX_TEKST) });
        break;
      case 'afbeelding':
        uit.push({
          type: 'afbeelding',
          url: tekst(r.url, 500),
          alt: tekst(r.alt, 200),
          ...(r.link ? { link: tekst(r.link, 500) } : {}),
        });
        break;
      case 'knop':
        uit.push({ type: 'knop', tekst: tekst(r.tekst, 80), url: tekst(r.url, 500) });
        break;
      case 'kolommen':
        uit.push({ type: 'kolommen', links: tekst(r.links), rechts: tekst(r.rechts) });
        break;
      case 'scheiding':
        uit.push({ type: 'scheiding' });
        break;
    }
  }
  return uit;
}

// UTM alleen op links naar de eigen site; geen individuele klikmeting
export function metUtm(url: string, campagne: string): string {
  try {
    const u = new URL(url);
    if (!SITE_HOST.test(u.hostname)) return url;
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'newsletter');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'email');
    if (!u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', campagne);
    return u.toString();
  } catch {
    return url;
  }
}

export function slug(naam: string): string {
  return (
    naam
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'nieuwsbrief'
  );
}

export type Campagne = {
  naam: string;
  taal: Taal;
  onderwerp: string;
  preheader: string;
  blokken: Blok[];
};

export type Controle = { fouten: string[]; waarschuwingen: string[] };

const SPAMWOORDEN = /\b(gratis|free|100%|winnen|win|klik hier|click here|urgent|act now)\b|!!|€€|\$\$/i;

// Fouten blokkeren indienen en goedkeuren; waarschuwingen zijn adviezen
export function controleer(c: Campagne): Controle {
  const fouten: string[] = [];
  const waarschuwingen: string[] = [];
  if (!c.onderwerp.trim()) fouten.push('Onderwerp ontbreekt');
  if (c.onderwerp.length > 150) fouten.push('Onderwerp is langer dan 150 tekens');
  else if (c.onderwerp.length > 60) waarschuwingen.push('Onderwerp is langer dan 60 tekens');
  if (!c.preheader.trim()) waarschuwingen.push('Preheader ontbreekt');
  if (!c.blokken.length) fouten.push('De nieuwsbrief heeft nog geen inhoud');
  let links = 0;
  c.blokken.forEach((b, i) => {
    const plek = `Blok ${i + 1}`;
    if ((b.type === 'titel' || b.type === 'alinea') && !b.tekst.trim()) {
      fouten.push(`${plek}: tekst ontbreekt`);
    }
    if (b.type === 'knop') {
      links++;
      if (!b.tekst.trim()) fouten.push(`${plek}: knoptekst ontbreekt`);
      if (!veiligeUrl(b.url)) fouten.push(`${plek}: de link moet met https:// beginnen`);
    }
    if (b.type === 'afbeelding') {
      if (!veiligeUrl(b.url)) fouten.push(`${plek}: de afbeelding moet een https-adres hebben`);
      if (!b.alt.trim()) fouten.push(`${plek}: alt-tekst ontbreekt (voor schermlezers)`);
      if (b.link) {
        links++;
        if (!veiligeUrl(b.link)) fouten.push(`${plek}: de link moet met https:// beginnen`);
      }
    }
  });
  if (!c.blokken.some((b) => b.type === 'knop')) waarschuwingen.push('Er is geen knop (CTA)');
  if (links > 10) waarschuwingen.push('Meer dan 10 links verhoogt de kans op de spammap');
  const alleTekst = [c.onderwerp, c.preheader, ...c.blokken.map(blokTekst)].join(' ');
  if (SPAMWOORDEN.test(alleTekst)) waarschuwingen.push('Bevat woorden of tekens die spamfilters triggeren');
  if (/\b[A-Z]{6,}\b/.test(c.onderwerp.replace(/MOOOVE/g, ''))) {
    waarschuwingen.push('Hoofdletters in het onderwerp lijken op spam');
  }
  return { fouten, waarschuwingen };
}

function blokTekst(b: Blok): string {
  switch (b.type) {
    case 'titel':
    case 'alinea':
    case 'handtekening':
      return b.tekst;
    case 'knop':
      return b.tekst;
    case 'afbeelding':
      return b.alt;
    case 'kolommen':
      return `${b.links} ${b.rechts}`;
    default:
      return '';
  }
}

const KLEUR = { tekst: '#151F18', zacht: '#5F6E60', lime: '#D9F36B', lijn: '#E4E6DC' };
const alineaHtml = (t: string) =>
  t
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${KLEUR.tekst}">${escape(p).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');

export type Opmaak = { onderwerp: string; html: string; tekst: string };

// Volledige mail met logo, inhoud en verplichte voettekst met afmeldlink
export function maakMail(
  c: Campagne,
  opties: { afmeldUrl: string; test?: boolean; campagneSlug?: string },
): Opmaak {
  const t = NIEUWSBRIEF_TEKSTEN[c.taal] ?? NIEUWSBRIEF_TEKSTEN.en;
  const campagne = opties.campagneSlug ?? slug(c.naam);
  const html: string[] = [];
  const platte: string[] = [];
  if (opties.test) {
    html.push(
      `<p style="margin:0 0 16px;padding:8px 12px;background:#FFE8A3;border-radius:8px;font-size:13px;font-weight:700;color:${KLEUR.tekst}">${escape(t.test)}</p>`,
    );
    platte.push(`[${t.test}]`, '');
  }
  for (const b of c.blokken) {
    switch (b.type) {
      case 'titel':
        html.push(
          `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px;color:${KLEUR.tekst}">${escape(b.tekst)}</h1>`,
        );
        platte.push(b.tekst.toUpperCase(), '');
        break;
      case 'alinea':
        html.push(alineaHtml(b.tekst));
        platte.push(b.tekst, '');
        break;
      case 'handtekening':
        html.push(
          `<p style="margin:16px 0;font-size:16px;line-height:24px;color:${KLEUR.tekst};font-style:italic">${escape(b.tekst).replace(/\n/g, '<br>')}</p>`,
        );
        platte.push(b.tekst, '');
        break;
      case 'knop': {
        const url = veiligeUrl(b.url);
        if (!url) break;
        const doel = metUtm(url, campagne);
        html.push(
          `<p style="margin:24px 0"><a href="${escape(doel)}" style="display:inline-block;background:${KLEUR.lime};color:${KLEUR.tekst};font-weight:700;text-decoration:none;padding:14px 22px;border-radius:14px">${escape(b.tekst)}</a></p>`,
        );
        platte.push(`${b.tekst}: ${doel}`, '');
        break;
      }
      case 'afbeelding': {
        const url = veiligeUrl(b.url);
        if (!url) break;
        const img = `<img src="${escape(url)}" alt="${escape(b.alt)}" width="456" style="display:block;width:100%;max-width:456px;height:auto;border:0;border-radius:14px">`;
        const link = b.link ? veiligeUrl(b.link) : null;
        html.push(
          `<p style="margin:0 0 16px">${link ? `<a href="${escape(metUtm(link, campagne))}">${img}</a>` : img}</p>`,
        );
        if (b.alt) platte.push(`[${b.alt}]`, '');
        break;
      }
      case 'kolommen':
        html.push(
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr><td valign="top" width="50%" style="padding-right:8px">${alineaHtml(b.links)}</td><td valign="top" width="50%" style="padding-left:8px">${alineaHtml(b.rechts)}</td></tr></table>`,
        );
        platte.push(b.links, '', b.rechts, '');
        break;
      case 'scheiding':
        html.push(`<hr style="border:0;border-top:1px solid ${KLEUR.lijn};margin:24px 0">`);
        platte.push('—', '');
        break;
    }
  }
  const onderwerp = opties.test ? `[TEST] ${c.onderwerp}` : c.onderwerp;
  const preheader = c.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(c.preheader)}</div>`
    : '';
  const voet = `<p style="margin:24px 0 0;font-size:12px;line-height:18px;color:${KLEUR.zacht}">${escape(t.waarom)}<br><a href="${escape(opties.afmeldUrl)}" style="color:${KLEUR.zacht}">${escape(t.afmelden)}</a></p>`;
  const document = `<!doctype html><html lang="${escape(c.taal)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(onderwerp)}</title></head><body style="margin:0;background:#F3F3ED;font-family:Helvetica,Arial,sans-serif">${preheader}<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:520px;background:#FFFFFF;border-radius:20px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px"><p style="margin:0 0 24px;font-size:22px;font-weight:800;color:${KLEUR.tekst}">mooove<span style="color:#9BC13A">.</span></p>${html.join('')}${voet}</td></tr></table></td></tr></table></body></html>`;
  platte.push('—', t.waarom, `${t.afmelden}: ${opties.afmeldUrl}`);
  return { onderwerp, html: document, tekst: platte.join('\n') };
}

// Welkomstmail na de dubbele bevestiging, met dezelfde opmaak en voettekst
export function welkomCampagne(taal: Taal, site: string): Campagne {
  const t = NIEUWSBRIEF_TEKSTEN[taal] ?? NIEUWSBRIEF_TEKSTEN.en;
  return {
    naam: 'welkom',
    taal,
    onderwerp: t.welkomOnderwerp,
    preheader: t.welkomTekst.slice(0, 90),
    blokken: [
      { type: 'titel', tekst: t.welkomTitel },
      { type: 'alinea', tekst: t.welkomTekst },
      { type: 'knop', tekst: t.welkomKnop, url: `${site}/${taal === 'nl' ? '' : `${taal}/`}` },
    ],
  };
}

// Verzendwachtrij: na een mislukte poging later opnieuw (2, 4, 8, 16 min), daarna 'dead'
export const MAX_POGINGEN = 5;
export function volgendePoging(pogingen: number, nu = Date.now()): Date | null {
  if (pogingen >= MAX_POGINGEN) return null;
  return new Date(nu + Math.min(2 ** pogingen, 60) * 60_000);
}

// Resend-webhooks worden ondertekend via Svix: HMAC-SHA256 over "id.timestamp.body" met het
// base64-deel van de geheime sleutel (whsec_…). Oude berichten (> 5 min) worden geweigerd.
export async function controleerWebhook(opties: {
  id: string | null;
  tijdstip: string | null;
  handtekening: string | null;
  body: string;
  geheim: string;
  nu?: number;
}): Promise<boolean> {
  const { id, tijdstip, handtekening, body, geheim } = opties;
  if (!id || !tijdstip || !handtekening || !geheim.startsWith('whsec_')) return false;
  const seconden = Number(tijdstip);
  const nu = (opties.nu ?? Date.now()) / 1000;
  if (!Number.isFinite(seconden) || Math.abs(nu - seconden) > 300) return false;
  let sleutelBytes: Uint8Array<ArrayBuffer>;
  try {
    sleutelBytes = Uint8Array.from(atob(geheim.slice(6)), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }
  const sleutel = await crypto.subtle.importKey(
    'raw',
    sleutelBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', sleutel, new TextEncoder().encode(`${id}.${tijdstip}.${body}`)),
  );
  let binair = '';
  for (const b of mac) binair += String.fromCharCode(b);
  const verwacht = btoa(binair);
  return handtekening.split(' ').some((deel) => {
    const [versie, sig] = deel.split(',');
    if (versie !== 'v1' || !sig || sig.length !== verwacht.length) return false;
    let verschil = 0;
    for (let i = 0; i < sig.length; i++) verschil |= sig.charCodeAt(i) ^ verwacht.charCodeAt(i);
    return verschil === 0;
  });
}

export type BezorgEvent = {
  type: 'sent' | 'delivered' | 'bounced' | 'complained' | 'delayed' | 'other';
  berichtId: string | null;
  hard: boolean;
  tijdstip: string;
};

// Resend-eventtypes naar onze eigen namen; alleen wat we nodig hebben, zonder inhoud of adressen
export function leesResendEvent(payload: unknown): BezorgEvent {
  const p = (payload ?? {}) as { type?: string; created_at?: string; data?: Record<string, unknown> };
  const data = p.data ?? {};
  const soorten: Record<string, BezorgEvent['type']> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.delivery_delayed': 'delayed',
  };
  const bounce = (data.bounce ?? {}) as { type?: string };
  return {
    type: soorten[p.type ?? ''] ?? 'other',
    berichtId: typeof data.email_id === 'string' ? data.email_id : null,
    // Alleen een permanente bounce blokkeert het adres; een tijdelijke niet
    hard: p.type === 'email.bounced' && (bounce.type ?? 'Permanent') !== 'Transient',
    tijdstip: typeof p.created_at === 'string' ? p.created_at : new Date().toISOString(),
  };
}
