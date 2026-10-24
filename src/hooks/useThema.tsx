import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { DONKER, LICHT, type Kleuren, type ThemaNaam } from '@/constants/theme';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';

export type ThemaKeuze = 'auto' | ThemaNaam;

type ThemaWaarde = {
  naam: ThemaNaam;
  kleuren: Kleuren;
  keuze: ThemaKeuze;
  kiesThema: (keuze: ThemaKeuze) => void;
};

const ThemaContext = createContext<ThemaWaarde>({
  naam: 'licht',
  kleuren: LICHT,
  keuze: 'auto',
  kiesThema: () => {},
});

export function ThemaProvider({ children }: { children: ReactNode }) {
  const systeem = useColorScheme();
  const [keuze, setKeuze] = useState<ThemaKeuze>('auto');

  useEffect(() => {
    leesLokaal<ThemaKeuze>(SLEUTELS.thema).then((lokaal) => {
      if (lokaal) setKeuze(lokaal);
    });
  }, []);

  const kiesThema = useCallback((nieuw: ThemaKeuze) => {
    setKeuze(nieuw);
    schrijfLokaal(SLEUTELS.thema, nieuw === 'auto' ? null : nieuw);
  }, []);

  const naam: ThemaNaam = keuze === 'auto' ? (systeem === 'dark' ? 'donker' : 'licht') : keuze;
  const waarde = useMemo(
    () => ({ naam, kleuren: naam === 'donker' ? DONKER : LICHT, keuze, kiesThema }),
    [naam, keuze, kiesThema],
  );
  return <ThemaContext.Provider value={waarde}>{children}</ThemaContext.Provider>;
}

export function useThema(): ThemaWaarde {
  return useContext(ThemaContext);
}

export function useKleuren(): Kleuren {
  return useContext(ThemaContext).kleuren;
}

// Stijlen per thema, één keer aangemaakt per thema
export function maakStijlen<T>(maak: (k: Kleuren) => T): () => T {
  const cache = new Map<ThemaNaam, T>();
  return function useStijlen() {
    const { naam, kleuren } = useContext(ThemaContext);
    let stijlen = cache.get(naam);
    if (!stijlen) {
      stijlen = maak(kleuren);
      cache.set(naam, stijlen);
    }
    return stijlen;
  };
}
