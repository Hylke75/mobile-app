import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { berekenStatistiek, type Statistiek } from '@/lib/statistiek';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';
import { supabase } from '@/lib/supabase';
import type { Sessie, StapResultaat } from '@/types/app';
import type { Json, SessieRij } from '@/types/database';

type NieuweSessie = Omit<Sessie, 'id'>;

type SessiesContextWaarde = {
  sessies: Sessie[];
  statistiek: Statistiek;
  slaOp: (sessie: NieuweSessie) => Promise<string | null>;
  vernieuw: () => Promise<void>;
  // Missies die nog op internet wachten
  wachtend: number;
};

const SessiesContext = createContext<SessiesContextWaarde | undefined>(undefined);

function naarSessie(rij: SessieRij): Sessie {
  return {
    id: rij.id,
    alarmId: rij.alarm_id,
    gestartOp: new Date(rij.gestart_op),
    afgerondOp: new Date(rij.afgerond_op),
    status: rij.status as Sessie['status'],
    stappen: (rij.stappen as unknown as StapResultaat[]) ?? [],
    totaalHerhalingen: rij.totaal_herhalingen,
  };
}

function haalSessiesOp() {
  const vanaf = new Date();
  vanaf.setDate(vanaf.getDate() - 400);
  return supabase
    .from('missie_sessies')
    .select('*')
    .gte('afgerond_op', vanaf.toISOString())
    .order('afgerond_op', { ascending: false });
}

type WachtrijItem = Omit<NieuweSessie, 'gestartOp' | 'afgerondOp'> & {
  id: string;
  eigenaar: string | null;
  gestartOp: string;
  afgerondOp: string;
};

function naarInsert(sessie: WachtrijItem, metAlarm = true) {
  return {
    id: sessie.id,
    alarm_id: metAlarm ? sessie.alarmId : null,
    gestart_op: sessie.gestartOp,
    afgerond_op: sessie.afgerondOp,
    status: sessie.status,
    stappen: sessie.stappen as unknown as Json,
    totaal_herhalingen: sessie.totaalHerhalingen,
  };
}

async function verstuurItem(item: WachtrijItem): Promise<boolean> {
  const opslaan = (metAlarm: boolean) =>
    supabase
      .from('missie_sessies')
      .upsert(naarInsert(item, metAlarm), { onConflict: 'id', ignoreDuplicates: true });
  let { error } = await opslaan(true);
  // Alarm intussen verwijderd: de missie telt nog steeds mee, alleen zonder koppeling
  if (error?.code === '23503') ({ error } = await opslaan(false));
  return !error;
}

let versturen: Promise<void> | null = null;

// Verstuurt missies die eerder (offline of uitgelogd) niet konden worden opgeslagen
function verstuurWachtrij(userId: string): Promise<void> {
  if (versturen) return versturen;
  versturen = (async () => {
    const wachtrij = (await leesLokaal<WachtrijItem[]>(SLEUTELS.sessieWachtrij)) ?? [];
    const verstuurd = new Set<string>();
    for (const item of wachtrij) {
      if (item.eigenaar && item.eigenaar !== userId) continue;
      if (await verstuurItem(item)) verstuurd.add(item.id);
      else break;
    }
    if (verstuurd.size > 0) {
      // Opnieuw lezen: er kan intussen een nieuwe missie aan de wachtrij zijn toegevoegd
      const actueel = (await leesLokaal<WachtrijItem[]>(SLEUTELS.sessieWachtrij)) ?? [];
      const rest = actueel.filter((i) => !verstuurd.has(i.id));
      await schrijfLokaal(SLEUTELS.sessieWachtrij, rest.length ? rest : null);
    }
  })().finally(() => {
    versturen = null;
  });
  return versturen;
}

type Opgeslagen = { eigenaar: string; rijen: SessieRij[] };

function uitWachtrij(item: WachtrijItem): Sessie {
  return {
    id: item.id,
    alarmId: item.alarmId,
    gestartOp: new Date(item.gestartOp),
    afgerondOp: new Date(item.afgerondOp),
    status: item.status,
    stappen: item.stappen,
    totaalHerhalingen: item.totaalHerhalingen,
  };
}

// Server eerst, anders de lokale kopie; missies in de wachtrij tellen altijd mee
async function laadSessies(userId: string): Promise<{ sessies: Sessie[]; wachtend: number }> {
  await verstuurWachtrij(userId).catch(() => {});
  const { data: rijen, error } = await haalSessiesOp();
  let lijst: SessieRij[] = [];
  if (!error && rijen) {
    lijst = rijen;
    await schrijfLokaal<Opgeslagen>(SLEUTELS.sessies, { eigenaar: userId, rijen });
  } else {
    const lokaal = await leesLokaal<Opgeslagen>(SLEUTELS.sessies);
    if (lokaal?.eigenaar === userId) lijst = lokaal.rijen;
  }
  const wachtrij = ((await leesLokaal<WachtrijItem[]>(SLEUTELS.sessieWachtrij)) ?? []).filter(
    (i) => !i.eigenaar || i.eigenaar === userId,
  );
  const bekend = new Set(lijst.map((r) => r.id));
  const sessies = [
    ...wachtrij.filter((i) => !bekend.has(i.id)).map(uitWachtrij),
    ...lijst.map(naarSessie),
  ].sort((a, b) => b.afgerondOp.getTime() - a.afgerondOp.getTime());
  return { sessies, wachtend: wachtrij.filter((i) => !bekend.has(i.id)).length };
}

export function SessiesProvider({ children }: { children: ReactNode }) {
  const { user, profiel } = useAuth();
  const weekdoel = profiel?.weekdoel ?? 7;
  const [data, setData] = useState<{
    eigenaar: string | null;
    sessies: Sessie[];
    wachtend: number;
  }>({ eigenaar: null, sessies: [], wachtend: 0 });
  const [dag, setDag] = useState(() => new Date().toDateString());
  const eigenaar = user?.id ?? null;
  const sessies = useMemo(
    () => (eigenaar !== null && data.eigenaar === eigenaar ? data.sessies : []),
    [eigenaar, data],
  );

  const userId = eigenaar;
  const wachtend = eigenaar !== null && data.eigenaar === eigenaar ? data.wachtend : 0;

  const vernieuw = useCallback(async () => {
    if (!userId) return;
    const resultaat = await laadSessies(userId);
    setData({ eigenaar: userId, ...resultaat });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let actief = true;
    const laad = () =>
      laadSessies(userId).then((resultaat) => {
        if (actief) setData({ eigenaar: userId, ...resultaat });
      });
    laad();
    const sub = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      setDag(new Date().toDateString());
      laad();
    });
    return () => {
      actief = false;
      sub.remove();
    };
  }, [userId]);

  const slaOp = useCallback(
    async (sessie: NieuweSessie) => {
      const lokaalProfiel = await leesLokaal<{ id: string }>(SLEUTELS.profiel);
      const item: WachtrijItem = {
        ...sessie,
        id: Crypto.randomUUID(),
        eigenaar: userId ?? lokaalProfiel?.id ?? null,
        gestartOp: sessie.gestartOp.toISOString(),
        afgerondOp: sessie.afgerondOp.toISOString(),
      };
      const gelukt = userId ? await verstuurItem(item) : false;
      if (!gelukt) {
        const wachtrij = (await leesLokaal<WachtrijItem[]>(SLEUTELS.sessieWachtrij)) ?? [];
        await schrijfLokaal(SLEUTELS.sessieWachtrij, [...wachtrij, item]);
      }
      if (userId) {
        const nieuw: Sessie = { ...sessie, id: item.id };
        setData((h) => ({
          eigenaar: userId,
          sessies: [nieuw, ...h.sessies.filter((x) => x.id !== item.id)],
          wachtend: (h.eigenaar === userId ? h.wachtend : 0) + (gelukt ? 0 : 1),
        }));
      }
      return null;
    },
    [userId],
  );

  // Herberekenen bij een nieuwe dag, zodat streak en weekgrafiek na middernacht kloppen
  const statistiek = useMemo(() => {
    void dag;
    return berekenStatistiek(sessies, weekdoel);
  }, [sessies, weekdoel, dag]);

  return (
    <SessiesContext.Provider value={{ sessies, statistiek, slaOp, vernieuw, wachtend }}>
      {children}
    </SessiesContext.Provider>
  );
}

export function useSessies(): SessiesContextWaarde {
  const context = useContext(SessiesContext);
  if (!context) throw new Error('useSessies moet binnen een SessiesProvider gebruikt worden.');
  return context;
}
