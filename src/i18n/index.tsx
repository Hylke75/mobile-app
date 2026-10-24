import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { LOCALES, isTaal, type Taal } from '@/i18n/talen';
import { teksten } from '@/i18n/teksten';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';

export { LOCALES, TAALNAMEN, TALEN, type Taal } from '@/i18n/talen';

type Bron = { [N in keyof typeof teksten]: (typeof teksten)[N]['nl'] };

// Alle sleutels als "groep.sleutel" of "groep.sub.sleutel"
type Paden<T, Voor extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Voor}${K}` : Paden<T[K], `${Voor}${K}.`>;
}[keyof T & string];

export type Sleutel = Paden<Bron>;
export type Waarden = Record<string, string | number>;
export type TaalKeuze = Taal | 'auto';

export function apparaatTaal(): Taal {
  for (const locale of getLocales()) {
    if (isTaal(locale.languageCode)) return locale.languageCode;
  }
  return 'en';
}

let huidig: Taal = apparaatTaal();
const luisteraars = new Set<(taal: Taal) => void>();

// Wisselt de taal voor alles buiten React (meldingen, native alarmen, spraak)
export function zetTaal(taal: Taal): void {
  if (taal === huidig) return;
  huidig = taal;
  for (const luisteraar of luisteraars) luisteraar(taal);
}

function zoek(taal: Taal, sleutel: string): string | undefined {
  const [groep, ...rest] = sleutel.split('.');
  let waarde: unknown = (teksten as Record<string, Record<Taal, unknown>>)[groep!]?.[taal];
  for (const deel of rest) waarde = (waarde as Record<string, unknown> | undefined)?.[deel];
  return typeof waarde === 'string' ? waarde : undefined;
}

// Werkt ook buiten React (meldingen, native alarmen); valt terug op Nederlands
export function t(sleutel: Sleutel, waarden?: Waarden): string {
  const tekst = zoek(huidig, sleutel) ?? zoek('nl', sleutel) ?? sleutel;
  if (!waarden) return tekst;
  return tekst.replace(/\{\{(\w+)\}\}/g, (_, naam: string) =>
    waarden[naam] !== undefined ? String(waarden[naam]) : `{{${naam}}}`,
  );
}

export function huidigeTaal(): Taal {
  return huidig;
}

export function huidigeLocale(): string {
  return LOCALES[huidig];
}

export function luisterNaarTaal(luisteraar: (taal: Taal) => void): () => void {
  luisteraars.add(luisteraar);
  return () => luisteraars.delete(luisteraar);
}

type TaalContextWaarde = {
  taal: Taal;
  keuze: TaalKeuze;
  locale: string;
  kiesTaal: (keuze: TaalKeuze) => void;
  t: typeof t;
};

const TaalContext = createContext<TaalContextWaarde | undefined>(undefined);

export function TaalProvider({ children }: { children: ReactNode }) {
  const [keuze, setKeuze] = useState<TaalKeuze>('auto');
  const [taal, setTaal] = useState<Taal>(huidig);

  const pasToe = useCallback((nieuweKeuze: TaalKeuze) => {
    const nieuw = nieuweKeuze === 'auto' ? apparaatTaal() : nieuweKeuze;
    zetTaal(nieuw);
    setKeuze(nieuweKeuze);
    setTaal(nieuw);
  }, []);

  useEffect(() => {
    leesLokaal<TaalKeuze>(SLEUTELS.taal).then((opgeslagen) => {
      if (opgeslagen && (opgeslagen === 'auto' || isTaal(opgeslagen))) pasToe(opgeslagen);
    });
  }, [pasToe]);

  const kiesTaal = useCallback(
    (nieuweKeuze: TaalKeuze) => {
      pasToe(nieuweKeuze);
      schrijfLokaal(SLEUTELS.taal, nieuweKeuze);
    },
    [pasToe],
  );

  // Een nieuwe t bij elke taalwissel, zodat schermen opnieuw renderen
  const waarde = useMemo<TaalContextWaarde>(
    () => ({ taal, keuze, locale: LOCALES[taal], kiesTaal, t: (s, w) => t(s, w) }),
    [taal, keuze, kiesTaal],
  );

  return <TaalContext.Provider value={waarde}>{children}</TaalContext.Provider>;
}

export function useTaal(): TaalContextWaarde {
  const context = useContext(TaalContext);
  if (!context) throw new Error('useTaal moet binnen een TaalProvider gebruikt worden.');
  return context;
}
