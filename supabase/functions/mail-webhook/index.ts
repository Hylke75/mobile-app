// Bezorgmeldingen van Resend (ondertekend via Svix): bezorgd, bounce, klacht. Een permanente
// bounce of een klacht blokkeert het adres voor alle mail. Elke melding wordt één keer verwerkt
// (uniek op svix-id). Er wordt geen mailinhoud of e-mailadres opgeslagen.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { sha256 } from '../_shared/marketing.ts';
import { controleerWebhook, leesResendEvent } from '../_shared/nieuwsbrief.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Methode niet toegestaan' }, 405);
  const body = await req.text();
  if (body.length > 100_000) return json({ error: 'Te groot' }, 413);
  const geldig = await controleerWebhook({
    id: req.headers.get('svix-id'),
    tijdstip: req.headers.get('svix-timestamp'),
    handtekening: req.headers.get('svix-signature'),
    body,
    geheim: Deno.env.get('RESEND_WEBHOOK_SECRET') ?? '',
  });
  if (!geldig) return json({ error: 'Ongeldige handtekening' }, 401);

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400);
  }
  const event = leesResendEvent(payload);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: rij } = event.berichtId
    ? await db
        .from('email_outbox')
        .select('id, contact_id, campaign_id')
        .eq('provider_message_id', event.berichtId)
        .maybeSingle()
    : { data: null };

  const { error: dubbel } = await db.from('email_delivery_events').insert({
    outbox_id: rij?.id ?? null,
    provider: 'resend',
    provider_event_id: req.headers.get('svix-id'),
    provider_message_id: event.berichtId,
    event_type: event.type,
    occurred_at: event.tijdstip,
    safe_payload_json: { hard: event.hard },
  });
  // Al verwerkt (Resend probeert opnieuw): gewoon bevestigen
  if (dubbel) return json({ ok: true, al: true });
  if (!rij) return json({ ok: true });

  const status =
    event.type === 'delivered'
      ? 'delivered'
      : event.type === 'bounced' && event.hard
        ? 'bounced'
        : event.type === 'complained'
          ? 'complained'
          : null;
  if (status && rij.campaign_id && rij.contact_id) {
    await db
      .from('newsletter_campaign_recipients')
      .update({ status })
      .eq('campaign_id', rij.campaign_id)
      .eq('contact_id', rij.contact_id);
  }

  if ((status === 'bounced' || status === 'complained') && rij.contact_id) {
    const { data: contact } = await db
      .from('marketing_contacts')
      .select('email_normalized')
      .eq('id', rij.contact_id)
      .maybeSingle();
    if (contact) {
      await db.from('marketing_suppressions').upsert(
        {
          email_hash: await sha256(contact.email_normalized),
          contact_id: rij.contact_id,
          scope: 'all',
          reason: status === 'bounced' ? 'hard_bounce' : 'spam_complaint',
        },
        { onConflict: 'email_hash,scope,reason', ignoreDuplicates: true },
      );
      await db
        .from('email_outbox')
        .update({ status: 'cancelled', last_error: status })
        .eq('contact_id', rij.contact_id)
        .eq('status', 'pending');
    }
  }
  return json({ ok: true });
});
