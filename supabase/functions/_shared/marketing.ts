// Gedeelde marketinglogica voor de Edge Functions. Bewust zonder Deno- of Node-specifieke
// imports (alleen Web Crypto), zodat dezelfde code in Jest getest wordt
// (src/lib/__tests__/marketing.test.ts).

export const TALEN = ['nl', 'en', 'es', 'de', 'fr', 'zh'] as const;
export type Taal = (typeof TALEN)[number];

export type SendMode = 'disabled' | 'test' | 'live';
export type ConsentStatus = 'granted' | 'pending' | 'revoked' | 'none';
export type MailSoort = 'marketing' | 'transactional';
export type SuppressieReden =
  | 'unsubscribe'
  | 'hard_bounce'
  | 'spam_complaint'
  | 'manual'
  | 'deletion_request';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isTaal(waarde: unknown): waarde is Taal {
  return typeof waarde === 'string' && (TALEN as readonly string[]).includes(waarde);
}

// Kleine letters, zonder spaties; null als het geen geldig adres is
export function normaliseerEmail(invoer: unknown): string | null {
  if (typeof invoer !== 'string') return null;
  const email = invoer.normalize('NFC').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return null;
  return email;
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64url(bytes: Uint8Array): string {
  let binair = '';
  for (const b of bytes) binair += String.fromCharCode(b);
  return btoa(binair).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256(tekst: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tekst)));
}

// Willekeurige, niet te raden token (256 bits); in de database staat alleen de hash
export function maakToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function hmac(geheim: string, tekst: string): Promise<string> {
  const sleutel = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(geheim),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const handtekening = await crypto.subtle.sign('HMAC', sleutel, new TextEncoder().encode(tekst));
  return base64url(new Uint8Array(handtekening));
}

function gelijk(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return verschil === 0;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Afmeldlink zonder login: contact-ID plus handtekening; zonder het geheim niet te vervalsen
export async function tekenAfmeldToken(contactId: string, geheim: string): Promise<string> {
  return `${contactId}.${await hmac(geheim, `afmelden:${contactId}`)}`;
}

export async function controleerAfmeldToken(token: unknown, geheim: string): Promise<string | null> {
  if (typeof token !== 'string' || !geheim) return null;
  const [contactId, handtekening] = token.split('.');
  if (!contactId || !handtekening || !UUID.test(contactId)) return null;
  const verwacht = await hmac(geheim, `afmelden:${contactId}`);
  return gelijk(verwacht, handtekening) ? contactId.toLowerCase() : null;
}

type ConsentRij = { status: 'pending' | 'granted' | 'revoked'; created_at: string };

// Huidige status: de laatste beslissing (granted/revoked) telt; een nieuwere aanmelding die nog
// niet bevestigd is, geeft 'pending' zolang er geen toestemming geldt.
export function consentStatus(rijen: readonly ConsentRij[]): ConsentStatus {
  const tijd = (r: ConsentRij) => new Date(r.created_at).getTime();
  const gesorteerd = [...rijen].sort((a, b) => tijd(b) - tijd(a));
  const beslissing = gesorteerd.find((r) => r.status !== 'pending');
  if (beslissing?.status === 'granted') return 'granted';
  const openAanmelding = gesorteerd.find(
    (r) => r.status === 'pending' && (!beslissing || tijd(r) > tijd(beslissing)),
  );
  if (openAanmelding) return 'pending';
  return beslissing ? 'revoked' : 'none';
}

export type VerzendContext = {
  soort: MailSoort;
  email: string;
  consent: ConsentStatus;
  suppressies: readonly { reason: SuppressieReden; scope: 'marketing' | 'all' }[];
  sendMode: SendMode;
  killSwitch: boolean;
  testontvangers: readonly string[];
};

export type VerzendBesluit = { ok: true } | { ok: false; reden: string };

// Centrale controle vlak vóór elke verzending (ook bij uitgestelde of herhaalde pogingen)
export function magVersturen(ctx: VerzendContext): VerzendBesluit {
  if (ctx.sendMode === 'disabled') return { ok: false, reden: 'send_mode_disabled' };
  if (ctx.sendMode === 'test' && !ctx.testontvangers.includes(ctx.email)) {
    return { ok: false, reden: 'not_test_recipient' };
  }
  // Onbestelbaar of klacht: nooit meer iets sturen, ook geen servicebericht
  if (ctx.suppressies.some((s) => s.reason === 'hard_bounce' || s.reason === 'spam_complaint')) {
    return { ok: false, reden: 'undeliverable' };
  }
  if (ctx.suppressies.some((s) => s.scope === 'all' || s.reason === 'deletion_request')) {
    return { ok: false, reden: 'suppressed_all' };
  }
  if (ctx.soort === 'transactional') return { ok: true };
  if (ctx.killSwitch) return { ok: false, reden: 'kill_switch' };
  if (ctx.suppressies.length) return { ok: false, reden: 'suppressed' };
  if (ctx.consent !== 'granted') return { ok: false, reden: 'no_consent' };
  return { ok: true };
}

// Opnieuw aanmelden mag na afmelden, maar niet na een bounce, klacht of verwijderverzoek
export function magOpnieuwAanmelden(redenen: readonly SuppressieReden[]): boolean {
  return redenen.every((r) => r === 'unsubscribe' || r === 'manual');
}
