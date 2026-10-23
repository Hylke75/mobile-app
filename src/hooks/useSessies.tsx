import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/hooks/useAuth';
import { berekenStatistiek, type Statistiek } from '@/lib/statistiek';
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

export function SessiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<{ eigenaar: string | null; sessies: Sessie[] }>({
    eigenaar: null,
    sessies: [],
  });
  const eigenaar = user?.id ?? null;
  const sessies = useMemo(
    () => (eigenaar !== null && data.eigenaar === eigenaar ? data.sessies : []),
    [eigenaar, data],
  );

  const vernieuw = useCallback(async () => {
    if (!user) return;
    const { data: rijen } = await haalSessiesOp();
    if (rijen) setData({ eigenaar: user.id, sessies: rijen.map(naarSessie) });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let actief = true;
    haalSessiesOp().then(({ data: rijen }) => {
      if (actief && rijen) setData({ eigenaar: user.id, sessies: rijen.map(naarSessie) });
    });
    return () => {
      actief = false;
    };
  }, [user]);

  const slaOp = useCallback(async (sessie: NieuweSessie) => {
    const { data: rij, error } = await supabase
      .from('missie_sessies')
      .insert({
        alarm_id: sessie.alarmId,
        gestart_op: sessie.gestartOp.toISOString(),
        afgerond_op: sessie.afgerondOp.toISOString(),
        status: sessie.status,
        stappen: sessie.stappen as unknown as Json,
        totaal_herhalingen: sessie.totaalHerhalingen,
      })
      .select()
      .single();
    if (error) return 'Je missie kon niet worden opgeslagen.';
    setData((huidig) => ({ ...huidig, sessies: [naarSessie(rij), ...huidig.sessies] }));
    return null;
  }, []);

  const statistiek = useMemo(() => berekenStatistiek(sessies), [sessies]);

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
