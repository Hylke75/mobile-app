// Lokale demo-state; niets wordt opgeslagen tussen herstarts.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import { DAG_AFKORTINGEN, STANDAARD_ALARMEN } from '@/constants/demo';
import type { Alarm, Niveau } from '@/types/demo';

type NieuwAlarm = {
  time: string;
  days: number[];
  level: Niveau;
  exercises: string[];
};

type DemoContextWaarde = {
  alarms: Alarm[];
  toggleAlarm: (id: number) => void;
  addAlarm: (alarm: NieuwAlarm) => void;
  toast: string;
  showToast: (bericht: string) => void;
};

const DemoContext = createContext<DemoContextWaarde | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>(STANDAARD_ALARMEN);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleAlarm = useCallback((id: number) => {
    setAlarms((huidig) => huidig.map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
  }, []);

  const addAlarm = useCallback(({ time, days, level, exercises }: NieuwAlarm) => {
    const gesorteerd = [...days].sort((a, b) => a - b);
    setAlarms((huidig) => [
      {
        id: Date.now(),
        time,
        name: 'Mijn Moov-missie',
        days:
          gesorteerd.length === 7
            ? 'Elke dag'
            : gesorteerd.map((i) => DAG_AFKORTINGEN[i]).join(', '),
        level,
        count: `${exercises.length} missies`,
        on: true,
      },
      ...huidig,
    ]);
  }, []);

  const showToast = useCallback((bericht: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(bericht);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  return (
    <DemoContext.Provider value={{ alarms, toggleAlarm, addAlarm, toast, showToast }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextWaarde {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo moet binnen een DemoProvider gebruikt worden.');
  }
  return context;
}
