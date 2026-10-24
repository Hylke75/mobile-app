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
const DAG = 86400000;

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

  // Misbruikrem: maximaal 120 keer per uur per beheerder
  const sleutel = `admin-overzicht:${auth.user.id}`;
  const { count } = await db
    .from('misbruikrem')
    .select('id', { count: 'exact', head: true })
    .eq('sleutel', sleutel)
    .gte('created_at', new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= 120) return json({ error: 'Te vaak vernieuwd, probeer het later' }, 429);
  await db.from('misbruikrem').insert({ sleutel });

  // Alle accounts, in pagina's
  const accounts = [];
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: PAGINA });
    if (error) return json({ error: 'Gebruikers ophalen mislukt' }, 500);
    accounts.push(...data.users);
    if (data.users.length < PAGINA) break;
  }

  async function alles<T>(tabel: string, kolommen: string, volgorde = 'created_at'): Promise<T[]> {
    const rijen: T[] = [];
    for (let van = 0; ; van += PAGINA) {
      const { data, error } = await db
        .from(tabel)
        .select(kolommen)
        .order(volgorde)
        .range(van, van + PAGINA - 1);
      if (error) throw error;
      rijen.push(...(data as T[]));
      if (data.length < PAGINA) return rijen;
    }
  }

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
    gevoel: number | null;
  };
  type EigenRij = { user_id: string };
  type FeedbackRij = {
    id: string;
    user_id: string;
    soort: string;
    tekst: string;
    appversie: string | null;
    toestel: string | null;
    created_at: string;
  };
  type WachtRij = { id: string; email: string; taal: string; created_at: string };
  let profielen: Profiel[];
  let alarmen: AlarmRij[];
  let sessies: SessieRij[];
  let eigen: EigenRij[];
  let feedback: FeedbackRij[];
  let wachtlijst: WachtRij[];
  try {
    [profielen, alarmen, sessies, eigen, feedback, wachtlijst] = await Promise.all([
      alles<Profiel>('profiles', 'id, voornaam, weekdoel, pauze_tot', 'id'),
      alles<AlarmRij>('alarms', 'user_id, aan, niveau, oefeningen', 'id'),
      alles<SessieRij>(
        'missie_sessies',
        'user_id, status, afgerond_op, totaal_herhalingen, gevoel',
        'afgerond_op',
      ),
      alles<EigenRij>('eigen_missies', 'user_id', 'id'),
      alles<FeedbackRij>('feedback', 'id, user_id, soort, tekst, appversie, toestel, created_at'),
      alles<WachtRij>('wachtlijst', 'id, email, taal, created_at'),
    ]);
  } catch {
    return json({ error: 'Gegevens ophalen mislukt' }, 500);
  }

  const aangemeld = new Map(accounts.map((a) => [a.id, new Date(a.created_at).getTime()]));
  const profielVan = new Map(profielen.map((p) => [p.id, p]));
  const laatsteMissie = new Map<string, string>();
  const eersteMissie = new Map<string, string>();
  // Weken na aanmelding (0 = eerste week) waarin iemand een missie voltooide, voor de retentie
  const actieveWeken = new Map<string, Set<number>>();
  for (const s of sessies) {
    const vorige = laatsteMissie.get(s.user_id);
    if (!vorige || s.afgerond_op > vorige) laatsteMissie.set(s.user_id, s.afgerond_op);
    if (s.status !== 'voltooid') continue;
    const eerste = eersteMissie.get(s.user_id);
    if (!eerste || s.afgerond_op < eerste) eersteMissie.set(s.user_id, s.afgerond_op);
    const start = aangemeld.get(s.user_id);
    if (start === undefined) continue;
    const week = Math.floor((new Date(s.afgerond_op).getTime() - start) / (7 * DAG));
    if (week < 0) continue;
    if (!actieveWeken.has(s.user_id)) actieveWeken.set(s.user_id, new Set());
    actieveWeken.get(s.user_id)!.add(week);
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
  const emailVan = new Map(accounts.map((a) => [a.id, a.email ?? '']));
  const vanaf = new Date(Date.now() - PERIODE_DAGEN * DAG).toISOString();

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
        eersteMissie: eersteMissie.get(a.id) ?? null,
        laatsteMissie: laatsteMissie.get(a.id) ?? null,
        actieveWeken: [...(actieveWeken.get(a.id) ?? [])].sort((x, y) => x - y),
        weekdoel: profiel?.weekdoel ?? null,
        gepauzeerdTot: profiel?.pauze_tot ?? null,
        alarmen: alarmenPer.get(a.id) ?? 0,
        alarmenAan: alarmenAanPer.get(a.id) ?? 0,
        eigenMissies: eigenPer.get(a.id) ?? 0,
        beheerder: a.id === auth.user.id,
      };
    }),
    // Per missie alleen gebruiker, dag, status, herhalingen en gevoel, voor grafieken
    missies: sessies
      .filter((s) => s.afgerond_op >= vanaf)
      .map((s) => ({
        gebruiker: s.user_id,
        dag: dagVan(s.afgerond_op),
        voltooid: s.status === 'voltooid',
        herhalingen: s.totaal_herhalingen,
        gevoel: s.gevoel,
      })),
    alarmen: alarmen.map((a) => ({
      gebruiker: a.user_id,
      aan: a.aan,
      niveau: a.niveau,
      missies: a.oefeningen.map((o) => (o.startsWith('eigen:') ? 'eigen' : o)),
    })),
    feedback: feedback.map((f) => ({ ...f, email: emailVan.get(f.user_id) ?? '' })).reverse(),
    wachtlijst: wachtlijst.reverse(),
  });
});
