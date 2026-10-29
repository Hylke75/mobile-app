// RevenueCat-webhook: legt Premium vast in profiles.premium_tot (alleen de server mag dat; zie de
// trigger bewaak_premium). Beveiligd met een geheime Authorization-header die in RevenueCat is
// ingesteld (REVENUECAT_WEBHOOK_SECRET). Elke gebeurtenis wordt één keer verwerkt (event-id).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { besluit, type WinkelEvent } from '../_shared/winkel.ts';

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
  const geheim = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
  const header = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  if (!geheim || !gelijk(header, geheim)) return json({ error: 'Geen toegang' }, 401);

  let event: WinkelEvent;
  try {
    event = ((await req.json()) as { event?: WinkelEvent }).event ?? {};
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400);
  }
  if (!event.id || !event.type) return json({ error: 'Ongeldig verzoek' }, 400);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const uitkomst = besluit(event);
  const gebruiker = uitkomst.soort === 'zet' ? uitkomst.gebruiker : null;

  // Eerst vastleggen: een herhaalde aflevering van dezelfde gebeurtenis doet niets meer
  const { error: dubbel } = await db.from('marketing_events').insert({
    subject_user_id: gebruiker,
    event_name: `store_${event.type.toLowerCase()}`.replace(/[^a-z_]/g, '').slice(0, 60),
    event_source: 'store',
    external_event_id: event.id.slice(0, 120),
    properties: { product: event.product_id ?? null },
  });
  if (dubbel) return json({ ok: true, al: true });

  if (uitkomst.soort === 'zet') {
    const { error } = await db
      .from('profiles')
      .update({ premium_tot: uitkomst.premiumTot })
      .eq('id', uitkomst.gebruiker);
    if (error) return json({ error: 'Bijwerken mislukt' }, 500);
  }
  return json({ ok: true, ...uitkomst });
});
