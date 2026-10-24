import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { AlarmPermissionResponse } from 'react-native-alarm-scheduler';

import { useAuth } from '@/hooks/useAuth';
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

export type CheckRegel = { label: string; ok: boolean; waarde: string };

export function useAlarmCheck() {
  const { profiel } = useAuth();
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

  const regels: CheckRegel[] = [
    {
      label: 'Meldingen',
      ok: Boolean(rechten) && meldingen,
      waarde:
        meldingen && rechten
          ? Platform.OS === 'ios'
            ? 'Via AlarmKit'
            : 'Toegestaan'
          : 'Niet toegestaan',
    },
    {
      label: 'Alarmrechten',
      ok: alarmen,
      waarde: alarmen
        ? 'Toegestaan'
        : rechten?.status === 'unavailable'
          ? 'Niet beschikbaar'
          : 'Niet toegestaan',
    },
    {
      label: 'Camera',
      ok: camera === 'toegestaan',
      waarde:
        camera === 'toegestaan'
          ? 'Toegestaan'
          : camera === 'onbekend'
            ? 'Nog niet gevraagd'
            : 'Niet toegestaan',
    },
    ...(Platform.OS === 'android'
      ? [
          {
            label: 'Batterijbesparing',
            ok: !batterijAan,
            waarde: batterijAan ? 'Aan, zet uit' : 'Uit',
          },
        ]
      : []),
    ...(alarmenBeschikbaar && sync && sync.verwacht > 0
      ? [
          {
            label: 'Alarmen op toestel',
            ok: sync.gepland >= sync.verwacht,
            waarde:
              sync.gepland >= sync.verwacht
                ? `${sync.gepland} van ${sync.verwacht} · ${String(sync.op.getHours()).padStart(2, '0')}:${String(sync.op.getMinutes()).padStart(2, '0')}`
                : `${sync.gepland} van ${sync.verwacht}, open de app opnieuw`,
          },
        ]
      : []),
    {
      label: 'Niet storen test',
      ok: testGeslaagd,
      waarde: testGeslaagd ? 'Geslaagd' : 'Nog niet gedaan',
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
