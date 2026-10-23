import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { MISSIE_TIMEOUT_MINUTEN } from '@/constants/alarm';
import { huidigeWekker, luisterNaarAlarmen, stelUit } from '@/lib/alarmen';
import { actieveMissie, werkVervolgBij } from '@/lib/missieStatus';

// Stuurt de gebruiker naar het wekker-scherm zodra een alarm afgaat of de app opent.
// Werkt los van inloggen en internet, zodat een alarm altijd af te ronden is.
export function useWekkerRouting() {
  const pad = usePathname();
  const huidigPad = useRef(pad);
  const laatsteSleutel = useRef<string | null>(null);

  useEffect(() => {
    huidigPad.current = pad;
  }, [pad]);

  useEffect(() => {
    let bezig = false;

    const controleer = async () => {
      if (bezig) return;
      bezig = true;
      try {
        const wekker = await huidigeWekker();
        if (!wekker) {
          laatsteSleutel.current = null;
          return;
        }

        // Alarm gaat opnieuw af terwijl de missie nog loopt: opnieuw stilzetten, missie gaat door
        const missie = actieveMissie();
        if (missie && missie.alarmId === wekker.alarmId && huidigPad.current === '/missie') {
          const vervolgId = await stelUit(wekker, MISSIE_TIMEOUT_MINUTEN, {
            missie: 'bezig',
            snoozes: wekker.snoozes,
          });
          werkVervolgBij(wekker.alarmId, vervolgId);
          return;
        }

        const sleutel = `${wekker.alarmId}:${wekker.occurrenceId ?? ''}`;
        if (huidigPad.current === '/wekker' && laatsteSleutel.current === sleutel) return;
        laatsteSleutel.current = sleutel;

        const params = {
          alarmId: wekker.alarmId,
          occurrenceId: wekker.occurrenceId ?? '',
          type: wekker.type,
          snoozes: String(wekker.snoozes),
          missieBezig: wekker.missieBezig ? '1' : '0',
          niveau: wekker.niveau ?? '',
          naam: wekker.naam ?? '',
          oefeningen: wekker.oefeningen?.join(',') ?? '',
        };
        if (huidigPad.current === '/wekker') router.setParams(params);
        else router.push({ pathname: '/wekker', params });
      } catch {
        // Geen alarmmodule beschikbaar (bijvoorbeeld zonder native build)
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
  }, []);
}
