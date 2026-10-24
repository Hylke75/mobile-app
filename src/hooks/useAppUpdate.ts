import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { meldFout } from '@/lib/fouten';

// Haalt een OTA-update op de achtergrond op (bij start en bij terugkeer naar de voorgrond);
// geeft true zodra er een update klaarstaat die na een herstart actief wordt.
export function useAppUpdate(): { klaar: boolean; herstart: () => void } {
  const [klaar, zetKlaar] = useState(false);

  useEffect(() => {
    if (!Updates.isEnabled || __DEV__) return;
    let bezig = false;
    const controleer = async () => {
      if (bezig) return;
      bezig = true;
      try {
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          const resultaat = await Updates.fetchUpdateAsync();
          if (resultaat.isNew) zetKlaar(true);
        }
      } catch (fout) {
        meldFout(fout);
      } finally {
        bezig = false;
      }
    };
    controleer();
    const sub = AppState.addEventListener('change', (stand) => {
      if (stand === 'active') controleer();
    });
    return () => sub.remove();
  }, []);

  return {
    klaar,
    herstart: () => {
      Updates.reloadAsync().catch(meldFout);
    },
  };
}
