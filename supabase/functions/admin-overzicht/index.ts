// Gebruikersoverzicht voor de beheeromgeving (site/admin). Alleen voor accounts in public.admins.
// Geeft per gebruiker alleen wat nodig is voor ondersteuning en inzicht, nooit camerabeelden of
// inhoud van eigen missies.
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

const PERIODE_DAGEN = 90;
const PAGINA = 1000;

// Datum in Nederlandse tijd als YYYY-MM-DD
const dagVan = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });

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

  // Alle accounts, in pagina's
  const accounts = [];
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: PAGINA });
    if (error) return json({ error: 'Gebruikers ophalen mislukt' }, 500);
    accounts.push(...data.users);
    if (data.users.length < PAGINA) break;
  }

  async function alles<T>(tabel: string, kolommen: string, filter?: (q: any) => any): Promise<T[]> {
    const rijen: T[] = [];
    for (let van = 0; ; van += PAGINA) {
      let query = db
        .from(tabel)
        .select(kolommen)
        .range(van, van + PAGINA - 1);
      if (filter) query = filter(query);
      const { data, error } = await query;
      if (error) throw error;
      rijen.push(...(data as T[]));
      if (data.length < PAGINA) return rijen;
    }
  }

  const vanaf = new Date(Date.now() - PERIODE_DAGEN * 86400000).toISOString();
  type Profiel = {
    id: string;
    voornaam: string | null;
    weekdoel: number;
    pauze_tot: string | null;
  };
  type AlarmRij = { user_id: string; aan: boolean; niveau: string; oefeningen: string[] };
  type SessieRij = {
    user_id: string;
    status: string;
    afgerond_op: string;
    totaal_herhalingen: number;
  };
  type EigenRij = { user_id: string };
  let profielen: Profiel[], alarmen: AlarmRij[], sessies: SessieRij[], eigen: EigenRij[];
  try {
    [profielen, alarmen, sessies, eigen] = await Promise.all([
      alles<Profiel>('profiles', 'id, voornaam, weekdoel, pauze_tot'),
      alles<AlarmRij>('alarms', 'user_id, aan, niveau, oefeningen'),
      alles<SessieRij>('missie_sessies', 'user_id, status, afgerond_op, totaal_herhalingen', (q) =>
        q.gte('afgerond_op', vanaf),
      ),
      alles<EigenRij>('eigen_missies', 'user_id'),
    ]);
  } catch {
    return json({ error: 'Gegevens ophalen mislukt' }, 500);
  }

  const profielVan = new Map(profielen.map((p) => [p.id, p]));
  const laatsteMissie = new Map<string, string>();
  for (const s of sessies) {
    const vorige = laatsteMissie.get(s.user_id);
    if (!vorige || s.afgerond_op > vorige) laatsteMissie.set(s.user_id, s.afgerond_op);
  }
  const telPer = <T extends { user_id: string }>(
    lijst: T[],
    mee: (r: T) => boolean = () => true,
  ) => {
    const telling = new Map<string, number>();
    for (const r of lijst) if (mee(r)) telling.set(r.user_id, (telling.get(r.user_id) ?? 0) + 1);
    return telling;
  };
  const alarmenPer = telPer(alarmen);
  const alarmenAanPer = telPer(alarmen, (a) => a.aan);
  const eigenPer = telPer(eigen);

  return json({
    gegenereerd: new Date().toISOString(),
    periodeDagen: PERIODE_DAGEN,
    gebruikers: accounts.map((a) => {
      const profiel = profielVan.get(a.id);
      return {
        id: a.id,
        email: a.email ?? '',
        voornaam: profiel?.voornaam ?? null,
        aangemeld: a.created_at,
        laatstIngelogd: a.last_sign_in_at ?? null,
        bevestigd: Boolean(a.email_confirmed_at),
        laatsteMissie: laatsteMissie.get(a.id) ?? null,
        weekdoel: profiel?.weekdoel ?? null,
        gepauzeerdTot: profiel?.pauze_tot ?? null,
        alarmen: alarmenPer.get(a.id) ?? 0,
        alarmenAan: alarmenAanPer.get(a.id) ?? 0,
        eigenMissies: eigenPer.get(a.id) ?? 0,
        beheerder: a.id === auth.user.id,
      };
    }),
    // Per missie alleen gebruiker, dag, status en herhalingen, voor grafieken
    missies: sessies.map((s) => ({
      gebruiker: s.user_id,
      dag: dagVan(s.afgerond_op),
      voltooid: s.status === 'voltooid',
      herhalingen: s.totaal_herhalingen,
    })),
    alarmen: alarmen.map((a) => ({
      gebruiker: a.user_id,
      aan: a.aan,
      niveau: a.niveau,
      missies: a.oefeningen.map((o) => (o.startsWith('eigen:') ? 'eigen' : o)),
    })),
  });
});
