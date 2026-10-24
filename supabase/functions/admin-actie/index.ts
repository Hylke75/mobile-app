// Hulpacties vanuit de beheeromgeving. Alleen voor accounts in public.admins; elke actie komt
// in public.beheer_log. Maximaal 30 acties per uur per beheerder.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

const MAX_PER_UUR = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Methode niet toegestaan' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: auth, error: authFout } = await db.auth.getUser(token);
  if (authFout || !auth.user) return json({ error: 'Niet ingelogd' }, 401);
  const { data: beheerder } = await db
    .from('admins')
    .select('user_id')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!beheerder) return json({ error: 'Geen toegang' }, 403);

  const sleutel = `admin-actie:${auth.user.id}`;
  const { count } = await db
    .from('misbruikrem')
    .select('id', { count: 'exact', head: true })
    .eq('sleutel', sleutel)
    .gte('created_at', new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= MAX_PER_UUR) return json({ error: 'Te veel acties, probeer het later' }, 429);
  await db.from('misbruikrem').insert({ sleutel });

  let invoer: { actie?: unknown; id?: unknown };
  try {
    invoer = await req.json();
  } catch {
    return json({ error: 'Ongeldig verzoek' }, 400);
  }
  const id = typeof invoer.id === 'string' ? invoer.id : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Ongeldig id' }, 400);
  const log = (actie: string, doel: string) =>
    db.from('beheer_log').insert({ beheerder_id: auth.user.id, actie, doel });

  switch (invoer.actie) {
    case 'stuurCode': {
      const { data } = await db.auth.admin.getUserById(id);
      const email = data.user?.email;
      if (!email) return json({ error: 'Gebruiker niet gevonden' }, 404);
      const { error } = await db.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) return json({ error: 'Code sturen mislukt' }, 500);
      await log('stuurCode', id);
      return json({ ok: true });
    }
    case 'verwijderAccount': {
      if (id === auth.user.id) return json({ error: 'Je kunt jezelf hier niet verwijderen' }, 400);
      const { data: anderBeheerder } = await db
        .from('admins')
        .select('user_id')
        .eq('user_id', id)
        .maybeSingle();
      if (anderBeheerder) return json({ error: 'Beheerders verwijder je via de database' }, 400);
      const { error } = await db.auth.admin.deleteUser(id);
      if (error) return json({ error: 'Verwijderen mislukt' }, 500);
      await log('verwijderAccount', id);
      return json({ ok: true });
    }
    case 'verwijderWachtlijst': {
      const { error } = await db.from('wachtlijst').delete().eq('id', id);
      if (error) return json({ error: 'Verwijderen mislukt' }, 500);
      await log('verwijderWachtlijst', id);
      return json({ ok: true });
    }
    default:
      return json({ error: 'Onbekende actie' }, 400);
  }
});
