import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { annuleerAlarm, synchroniseer } from '@/lib/alarmen';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';
import { supabase } from '@/lib/supabase';
import type { Alarm, Niveau, Oefening } from '@/types/app';
import type { AlarmRij } from '@/types/database';

export type AlarmInvoer = Omit<Alarm, 'id' | 'aan'>;

type AlarmenContextWaarde = {
  alarms: Alarm[];
  geladen: boolean;
  fout: string | null;
  vernieuw: () => Promise<void>;
  herplan: () => void;
  maakAan: (invoer: AlarmInvoer) => Promise<string | null>;
  werkBij: (id: string, invoer: Partial<Alarm>) => Promise<string | null>;
  verwijder: (id: string) => Promise<string | null>;
  wisselAan: (id: string) => Promise<string | null>;
};

type Opgeslagen = { eigenaar: string; alarms: Alarm[] };

const AlarmenContext = createContext<AlarmenContextWaarde | undefined>(undefined);

function naarAlarm(rij: AlarmRij): Alarm {
  return {
    id: rij.id,
    naam: rij.naam,
    tijd: rij.tijd,
    dagen: rij.dagen,
    niveau: rij.niveau as Niveau,
    oefeningen: rij.oefeningen as Oefening[],
    aan: rij.aan,
  };
}

const haalAlarmenOp = () => supabase.from('alarms').select('*').order('tijd');

const sorteer = (lijst: Alarm[]) => [...lijst].sort((a, b) => a.tijd.localeCompare(b.tijd));

export function AlarmenProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // De lijst hoort bij één gebruiker; na uitloggen of wisselen is hij automatisch leeg
  const [data, setData] = useState<{ eigenaar: string | null; alarms: Alarm[] }>({
    eigenaar: null,
    alarms: [],
  });
  const [fout, setFout] = useState<string | null>(null);
  const eigenaar = user?.id ?? null;
  const geladen = eigenaar !== null && data.eigenaar === eigenaar;
  const alarms = useMemo(() => (geladen ? data.alarms : []), [geladen, data.alarms]);
  const huidig = useRef<Alarm[]>([]);

  const plan = useCallback((lijst: Alarm[]) => {
    synchroniseer(lijst)
      .then(() => setFout(null))
      .catch(() => setFout('Alarmen konden niet op je toestel worden ingepland.'));
  }, []);

  const zetEnSync = useCallback(
    (id: string, lijst: Alarm[]) => {
      const gesorteerd = sorteer(lijst);
      huidig.current = gesorteerd;
      setData({ eigenaar: id, alarms: gesorteerd });
      schrijfLokaal<Opgeslagen>(SLEUTELS.alarmen, { eigenaar: id, alarms: gesorteerd });
      plan(gesorteerd);
    },
    [plan],
  );

  const herplan = useCallback(() => plan(huidig.current), [plan]);

  const verwerk = useCallback(
    (id: string, resultaat: Awaited<ReturnType<typeof haalAlarmenOp>>) => {
      if (resultaat.error) {
        setFout('Je alarmen konden niet worden geladen.');
        return;
      }
      setFout(null);
      zetEnSync(id, resultaat.data.map(naarAlarm));
    },
    [zetEnSync],
  );

  const vernieuw = useCallback(async () => {
    if (!user) return;
    verwerk(user.id, await haalAlarmenOp());
  }, [user, verwerk]);

  useEffect(() => {
    if (!user) return;
    let actief = true;
    // Eerst de lokale kopie, zodat alarmen ook offline direct zichtbaar zijn
    leesLokaal<Opgeslagen>(SLEUTELS.alarmen).then((lokaal) => {
      if (actief && lokaal?.eigenaar === user.id && huidig.current.length === 0) {
        huidig.current = lokaal.alarms;
        setData(lokaal);
      }
    });
    haalAlarmenOp().then((resultaat) => {
      if (actief) verwerk(user.id, resultaat);
    });
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') plan(huidig.current);
    });
    return () => {
      actief = false;
      sub.remove();
      huidig.current = [];
    };
  }, [user, verwerk, plan]);

  const maakAan = useCallback(
    async (invoer: AlarmInvoer) => {
      if (!user) return 'Je bent niet ingelogd.';
      const { data: rij, error } = await supabase
        .from('alarms')
        .insert({ ...invoer, aan: true })
        .select()
        .single();
      if (error) return 'Opslaan is niet gelukt. Controleer je internet en probeer het opnieuw.';
      zetEnSync(user.id, [...huidig.current, naarAlarm(rij)]);
      return null;
    },
    [user, zetEnSync],
  );

  const werkBij = useCallback(
    async (id: string, invoer: Partial<Alarm>) => {
      if (!user) return 'Je bent niet ingelogd.';
      const { id: _id, ...wijziging } = invoer;
      const { data: rij, error } = await supabase
        .from('alarms')
        .update(wijziging)
        .eq('id', id)
        .select()
        .single();
      if (error) return 'Opslaan is niet gelukt. Controleer je internet en probeer het opnieuw.';
      zetEnSync(
        user.id,
        huidig.current.map((a) => (a.id === id ? naarAlarm(rij) : a)),
      );
      return null;
    },
    [user, zetEnSync],
  );

  const verwijder = useCallback(
    async (id: string) => {
      if (!user) return 'Je bent niet ingelogd.';
      const { error } = await supabase.from('alarms').delete().eq('id', id);
      if (error)
        return 'Verwijderen is niet gelukt. Controleer je internet en probeer het opnieuw.';
      await annuleerAlarm(id).catch(() => {});
      zetEnSync(
        user.id,
        huidig.current.filter((a) => a.id !== id),
      );
      return null;
    },
    [user, zetEnSync],
  );

  const wisselAan = useCallback(
    async (id: string) => {
      const alarm = huidig.current.find((a) => a.id === id);
      if (!alarm) return null;
      return werkBij(id, { aan: !alarm.aan });
    },
    [werkBij],
  );

  return (
    <AlarmenContext.Provider
      value={{ alarms, geladen, fout, vernieuw, herplan, maakAan, werkBij, verwijder, wisselAan }}
    >
      {children}
    </AlarmenContext.Provider>
  );
}

export function useAlarmen(): AlarmenContextWaarde {
  const context = useContext(AlarmenContext);
  if (!context) throw new Error('useAlarmen moet binnen een AlarmenProvider gebruikt worden.');
  return context;
}
