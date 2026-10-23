import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
  gestartOp: string;
  afgerondOp: string;
};

function naarInsert(sessie: WachtrijItem) {
  return {
    alarm_id: sessie.alarmId,
    gestart_op: sessie.gestartOp,
    afgerond_op: sessie.afgerondOp,
    status: sessie.status,
    stappen: sessie.stappen as unknown as Json,
    totaal_herhalingen: sessie.totaalHerhalingen,
  };
}

// Verstuurt missies die eerder (offline of uitgelogd) niet konden worden opgeslagen
async function verstuurWachtrij(): Promise<number> {
  const wachtrij = (await leesLokaal<WachtrijItem[]>(SLEUTELS.sessieWachtrij)) ?? [];
  if (wachtrij.length === 0) return 0;
  const { error } = await supabase.from('missie_sessies').insert(wachtrij.map(naarInsert));
  if (error) return 0;
  await schrijfLokaal(SLEUTELS.sessieWachtrij, null);
  return wachtrij.length;
}

export function SessiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<{ eigenaar: string | null; sessies: Sessie[] }>({
    eigenaar: null,
    sessies: [],
  });
  const [dag, setDag] = useState(() => new Date().toDateString());
  const eigenaar = user?.id ?? null;
  const sessies = useMemo(
    () => (eigenaar !== null && data.eigenaar === eigenaar ? data.sessies : []),
    [eigenaar, data],
  );

  const vernieuw = useCallback(async () => {
    if (!user) return;
    await verstuurWachtrij();
    const { data: rijen } = await haalSessiesOp();
    if (rijen) setData({ eigenaar: user.id, sessies: rijen.map(naarSessie) });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let actief = true;
    const laad = () =>
      verstuurWachtrij()
        .then(() => haalSessiesOp())
        .then(({ data: rijen }) => {
          if (actief && rijen) setData({ eigenaar: user.id, sessies: rijen.map(naarSessie) });
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
  }, [user]);

  const slaOp = useCallback(
    async (sessie: NieuweSessie) => {
      const item: WachtrijItem = {
        ...sessie,
        gestartOp: sessie.gestartOp.toISOString(),
        afgerondOp: sessie.afgerondOp.toISOString(),
      };
      const { data: rij, error } = user
        ? await supabase.from('missie_sessies').insert(naarInsert(item)).select().single()
        : { data: null, error: new Error('niet ingelogd') };
      if (error || !rij) {
        const wachtrij = (await leesLokaal<WachtrijItem[]>(SLEUTELS.sessieWachtrij)) ?? [];
        await schrijfLokaal(SLEUTELS.sessieWachtrij, [...wachtrij, item]);
        if (user) {
          const lokaal: Sessie = { ...sessie, id: `lokaal-${Date.now()}` };
          setData((h) => ({ eigenaar: user.id, sessies: [lokaal, ...h.sessies] }));
        }
        return null;
      }
      setData((huidig) => ({ ...huidig, sessies: [naarSessie(rij), ...huidig.sessies] }));
      return null;
    },
    [user],
  );

  // Herberekenen bij een nieuwe dag, zodat streak en weekgrafiek na middernacht kloppen
  const statistiek = useMemo(() => {
    void dag;
    return berekenStatistiek(sessies);
  }, [sessies, dag]);

  return (
    <SessiesContext.Provider value={{ sessies, statistiek, slaOp, vernieuw }}>
      {children}
    </SessiesContext.Provider>
  );
}

export function useSessies(): SessiesContextWaarde {
  const context = useContext(SessiesContext);
  if (!context) throw new Error('useSessies moet binnen een SessiesProvider gebruikt worden.');
  return context;
}
