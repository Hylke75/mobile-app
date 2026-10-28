// Verzendwachtrij verwerken. Wordt elke minuut aangeroepen door pg_cron (zie
// docs/marketing/SETUP.md) met de header x-cron-secret. Zonder geldig geheim gebeurt er niets.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { verwerkWachtrij } from '../_shared/verzending.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

function gelijk(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return verschil === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Methode niet toegestaan' }, 405);
  const geheim = Deno.env.get('MARKETING_CRON_SECRET') ?? '';
  if (!geheim || !gelijk(req.headers.get('x-cron-secret') ?? '', geheim)) {
    return json({ error: 'Geen toegang' }, 401);
  }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const resultaat = await verwerkWachtrij(db);
  return json({ ok: true, ...resultaat });
});
