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
import { annuleerAlarm, synchroniseer } from '@/lib/alarmen';
import { supabase } from '@/lib/supabase';
import type { Alarm, Niveau, Oefening } from '@/types/app';
import type { AlarmRij } from '@/types/database';

export type AlarmInvoer = Omit<Alarm, 'id' | 'aan'>;

type AlarmenContextWaarde = {
  alarms: Alarm[];
  geladen: boolean;
  fout: string | null;
  vernieuw: () => Promise<void>;
  maakAan: (invoer: AlarmInvoer) => Promise<string | null>;
  werkBij: (id: string, invoer: Partial<Alarm>) => Promise<string | null>;
  verwijder: (id: string) => Promise<string | null>;
  wisselAan: (id: string) => Promise<string | null>;
};

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

  const zetEnSync = useCallback((id: string, lijst: Alarm[]) => {
    const gesorteerd = sorteer(lijst);
    setData({ eigenaar: id, alarms: gesorteerd });
    synchroniseer(gesorteerd).catch(() => {
      setFout('Alarmen konden niet op je toestel worden ingepland.');
    });
  }, []);

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
    haalAlarmenOp().then((resultaat) => {
      if (actief) verwerk(user.id, resultaat);
    });
    return () => {
      actief = false;
    };
  }, [user, verwerk]);

  const maakAan = useCallback(
    async (invoer: AlarmInvoer) => {
      if (!user) return 'Je bent niet ingelogd.';
      const { data: rij, error } = await supabase
        .from('alarms')
        .insert({ ...invoer, aan: true })
        .select()
        .single();
      if (error) return 'Opslaan is niet gelukt. Probeer het opnieuw.';
      zetEnSync(user.id, [...alarms, naarAlarm(rij)]);
      return null;
    },
    [alarms, user, zetEnSync],
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
      if (error) return 'Opslaan is niet gelukt. Probeer het opnieuw.';
      zetEnSync(
        user.id,
        alarms.map((a) => (a.id === id ? naarAlarm(rij) : a)),
      );
      return null;
    },
    [alarms, user, zetEnSync],
  );

  const verwijder = useCallback(
    async (id: string) => {
      if (!user) return 'Je bent niet ingelogd.';
      const { error } = await supabase.from('alarms').delete().eq('id', id);
      if (error) return 'Verwijderen is niet gelukt. Probeer het opnieuw.';
      await annuleerAlarm(id).catch(() => {});
      zetEnSync(
        user.id,
        alarms.filter((a) => a.id !== id),
      );
      return null;
    },
    [alarms, user, zetEnSync],
  );

  const wisselAan = useCallback(
    async (id: string) => {
      const alarm = alarms.find((a) => a.id === id);
      if (!alarm) return null;
      return werkBij(id, { aan: !alarm.aan });
    },
    [alarms, werkBij],
  );

  return (
    <AlarmenContext.Provider
      value={{ alarms, geladen, fout, vernieuw, maakAan, werkBij, verwijder, wisselAan }}
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
