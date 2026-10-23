import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { huidigeWekker, luisterNaarAlarmen } from '@/lib/alarmen';

// Stuurt de gebruiker naar het wekker-scherm zodra een alarm de app opent of afgaat
export function useWekkerRouting(actief: boolean) {
  useEffect(() => {
    if (!actief) return;
    let bezig = false;

    const controleer = async () => {
      if (bezig) return;
      bezig = true;
      try {
        const wekker = await huidigeWekker();
        if (wekker) {
          router.push({
            pathname: '/wekker',
            params: {
              alarmId: wekker.alarmId,
              occurrenceId: wekker.occurrenceId ?? '',
              type: wekker.type,
              snoozes: String(wekker.snoozes),
              missieBezig: wekker.missieBezig ? '1' : '0',
            },
          });
        }
      } catch {
        // Geen alarmmodule beschikbaar (bijvoorbeeld in een omgeving zonder native build)
      } finally {
        bezig = false;
      }
    };

    controleer();
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') controleer();
    });
    const stop = luisterNaarAlarmen(controleer);
    return () => {
      sub.remove();
      stop();
    };
  }, [actief]);
}
