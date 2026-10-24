// Aanmelden voor de wachtlijst vanaf de website. Openbaar (zonder account), daarom met een
// misbruikrem: maximaal 5 aanmeldingen per uur per bezoeker en 300 per uur in totaal. Van de bezoeker bewaren we alleen
// een hash van IP-adres + dag, nooit het IP-adres zelf.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const TALEN = ['nl', 'en', 'es', 'de', 'fr'];
const MAX_PER_UUR = 5;
const MAX_TOTAAL_PER_UUR = 300;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hash(tekst: string): Promise<string> {
  const data = new TextEncoder().encode(tekst);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Methode niet toegestaan' }, 405);

  let invoer: { email?: unknown; taal?: unknown };
  try {
    invoer = await req.json();
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400);
  }
  const email = typeof invoer.email === 'string' ? invoer.email.trim().toLowerCase() : '';
  const taal = typeof invoer.taal === 'string' && TALEN.includes(invoer.taal) ? invoer.taal : 'nl';
  if (email.length > 254 || !EMAIL.test(email)) return json({ error: 'Ongeldig e-mailadres' }, 400);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const ip =
    req.headers.get('cf-connecting-ip') ??
    ((req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'onbekend');
  const dag = new Date().toISOString().slice(0, 10);
  const sleutel = `wachtlijst:${await hash(`${ip}|${dag}|${Deno.env.get('SUPABASE_URL')}`)}`;
  const uurGeleden = new Date(Date.now() - 3600_000).toISOString();
  const tel = async (s: string) =>
    (
      await db
        .from('misbruikrem')
        .select('id', { count: 'exact', head: true })
        .eq('sleutel', s)
        .gte('created_at', uurGeleden)
    ).count ?? 0;
  if ((await tel(sleutel)) >= MAX_PER_UUR || (await tel('wachtlijst:totaal')) >= MAX_TOTAAL_PER_UUR) {
    return json({ error: 'Te veel aanmeldingen, probeer het later' }, 429);
  }
  await db.from('misbruikrem').insert([{ sleutel }, { sleutel: 'wachtlijst:totaal' }]);
  // Oude sporen opruimen
  await db
    .from('misbruikrem')
    .delete()
    .lt('created_at', new Date(Date.now() - 2 * 86400_000).toISOString());

  const { error } = await db
    .from('wachtlijst')
    .upsert({ email, taal }, { onConflict: 'email', ignoreDuplicates: true });
  if (error) return json({ error: 'Aanmelden mislukt' }, 500);
  // Altijd hetzelfde antwoord, zodat niet te zien is of een adres al op de lijst stond
  return json({ ok: true });
});
