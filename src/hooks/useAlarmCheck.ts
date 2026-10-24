import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { AlarmPermissionResponse } from 'react-native-alarm-scheduler';

import { useAuth } from '@/hooks/useAuth';
import { useTaal } from '@/i18n';
import {
  alarmenBeschikbaar,
  haalRechtenOp,
  luisterNaarSync,
  syncStatus,
  vraagRechtenAan,
  type SyncStatus,
} from '@/lib/alarmen';
import { batterijOptimalisatieAan } from '@/lib/batterij';
import { cameraStatus, vraagCameraAan, type CameraStatus } from '@/lib/camera';

export type CheckRegel = {
  id: 'meldingen' | 'alarmen' | 'camera' | 'batterij' | 'opToestel' | 'test';
  label: string;
  ok: boolean;
  waarde: string;
};

export function useAlarmCheck() {
  const { profiel } = useAuth();
  // Labels in de gekozen taal; opnieuw berekend bij een taalwissel
  const { t } = useTaal();
  const [rechten, setRechten] = useState<AlarmPermissionResponse | null>(null);
  const [camera, setCamera] = useState<CameraStatus>('onbekend');
  const [batterijAan, setBatterijAan] = useState(false);
  const [sync, setSync] = useState<SyncStatus | null>(() => syncStatus());

  useEffect(() => luisterNaarSync(setSync), []);

  const vernieuw = useCallback(() => {
    haalRechtenOp()
      .catch(() => null)
      .then((r) => {
        setRechten(r);
        setCamera(cameraStatus());
      });
    batterijOptimalisatieAan().then(setBatterijAan);
  }, []);

  useEffect(() => {
    vernieuw();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') vernieuw();
    });
    return () => sub.remove();
  }, [vernieuw]);

  // Geeft terug of alle rechten nu in orde zijn
  const vraagAlleRechtenAan = useCallback(async () => {
    const nieuw = await vraagRechtenAan().catch(() => null);
    setRechten(nieuw);
    await vraagCameraAan().catch(() => false);
    const cam = cameraStatus();
    setCamera(cam);
    return Boolean(nieuw?.canScheduleExactAlarms) && cam === 'toegestaan';
  }, []);

  // Op iOS lopen alarmen via AlarmKit en zijn meldingen geen aparte voorwaarde
  const meldingen =
    Platform.OS === 'ios'
      ? Boolean(rechten?.canScheduleExactAlarms)
      : rechten?.canPostNotifications !== false && rechten?.status !== 'unavailable';
  const alarmen = Boolean(rechten?.canScheduleExactAlarms);
  const testGeslaagd = Boolean(profiel?.alarmtest_geslaagd_op);

  const tijdVan = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const regels: CheckRegel[] = [
    {
      id: 'meldingen',
      label: t('systeem.check.meldingen'),
      ok: Boolean(rechten) && meldingen,
      waarde:
        meldingen && rechten
          ? Platform.OS === 'ios'
            ? t('systeem.check.viaAlarmKit')
            : t('systeem.check.toegestaan')
          : t('systeem.check.nietToegestaan'),
    },
    {
      id: 'alarmen',
      label: t('systeem.check.alarmrechten'),
      ok: alarmen,
      waarde: alarmen
        ? t('systeem.check.toegestaan')
        : rechten?.status === 'unavailable'
          ? t('systeem.check.nietBeschikbaar')
          : t('systeem.check.nietToegestaan'),
    },
    {
      id: 'camera',
      label: t('systeem.check.camera'),
      ok: camera === 'toegestaan',
      waarde:
        camera === 'toegestaan'
          ? t('systeem.check.toegestaan')
          : camera === 'onbekend'
            ? t('systeem.check.nogNietGevraagd')
            : t('systeem.check.nietToegestaan'),
    },
    ...(Platform.OS === 'android'
      ? [
          {
            id: 'batterij' as const,
            label: t('systeem.check.batterij'),
            ok: !batterijAan,
            waarde: batterijAan ? t('systeem.check.batterijAan') : t('systeem.check.uit'),
          },
        ]
      : []),
    ...(alarmenBeschikbaar && sync && sync.verwacht > 0
      ? [
          {
            id: 'opToestel' as const,
            label: t('systeem.check.opToestel'),
            ok: sync.gepland >= sync.verwacht,
            waarde:
              sync.gepland >= sync.verwacht
                ? t('systeem.check.opToestelOk', {
                    gepland: sync.gepland,
                    verwacht: sync.verwacht,
                    tijd: tijdVan(sync.op),
                  })
                : t('systeem.check.opToestelFout', {
                    gepland: sync.gepland,
                    verwacht: sync.verwacht,
                  }),
          },
        ]
      : []),
    {
      id: 'test',
      label: t('systeem.check.test'),
      ok: testGeslaagd,
      waarde: testGeslaagd ? t('systeem.check.geslaagd') : t('systeem.check.nogNietGedaan'),
    },
  ];

  return {
    rechten,
    regels,
    allesInOrde: regels.every((r) => r.ok),
    rechtenInOrde: alarmen && camera === 'toegestaan',
    batterijAan,
    vernieuw,
    vraagAlleRechtenAan,
  };
}
