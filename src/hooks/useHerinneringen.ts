import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useTaal } from '@/i18n';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { useSessies } from '@/hooks/useSessies';
import {
  STANDAARD_HERINNERINGEN,
  planHerinneringen,
  type HerinneringInstellingen,
} from '@/lib/herinneringPlan';
import {
  leesHerinneringInstellingen,
  luisterNaarHerinneringInstellingen,
  synchroniseerHerinneringen,
} from '@/lib/herinneringen';

export function useHerinneringInstellingen(): HerinneringInstellingen {
  const [waarde, setWaarde] = useState(STANDAARD_HERINNERINGEN);
  useEffect(() => {
    let actief = true;
    leesHerinneringInstellingen().then((lokaal) => actief && setWaarde(lokaal));
    const stop = luisterNaarHerinneringInstellingen(setWaarde);
    return () => {
      actief = false;
      stop();
    };
  }, []);
  return waarde;
}

// Houdt de lokale meldingen in lijn met alarmen, voortgang, pauze en taal
export function useHerinneringen(): void {
  const { status, profiel } = useAuth();
  const { alarms, geladen, eigenMap } = useAlarmen();
  const { sessies } = useSessies();
  const { taal } = useTaal();
  const ingesteld = useHerinneringInstellingen();
  // Herinneringen horen bij Premium; zonder Premium worden ze niet ingepland
  const { herinneringen: toegestaan } = usePremium();
  const instellingen = useMemo(
    () => (toegestaan ? ingesteld : STANDAARD_HERINNERINGEN),
    [toegestaan, ingesteld],
  );
  const [moment, setMoment] = useState(0);
  const weekdoel = profiel?.weekdoel ?? 7;
  const pauzeTot = profiel?.pauze_tot ?? null;

  // Terug naar de voorgrond: een nieuwe dag kan andere herinneringen vragen
  useEffect(() => {
    const sub = AppState.addEventListener('change', (stand) => {
      if (stand === 'active') setMoment((m) => m + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Uitloggen ruimt alles zelf op; zonder geladen alarmen niets weghalen
    if (status !== 'ingelogd' || !geladen) return;
    const lijst = planHerinneringen({
      alarms,
      eigen: eigenMap,
      sessies,
      weekdoel,
      pauzeTot,
      instellingen,
    });
    synchroniseerHerinneringen(lijst).catch(() => {});
  }, [status, geladen, alarms, eigenMap, sessies, weekdoel, pauzeTot, instellingen, taal, moment]);
}
