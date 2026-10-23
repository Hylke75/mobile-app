import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { AlarmPermissionResponse } from 'react-native-alarm-scheduler';

import { useAuth } from '@/hooks/useAuth';
import { haalRechtenOp, vraagRechtenAan } from '@/lib/alarmen';
import { cameraStatus, vraagCameraAan, type CameraStatus } from '@/lib/camera';

export type CheckRegel = { label: string; ok: boolean; waarde: string };

export function useAlarmCheck() {
  const { profiel } = useAuth();
  const [rechten, setRechten] = useState<AlarmPermissionResponse | null>(null);
  const [camera, setCamera] = useState<CameraStatus>('onbekend');

  const vernieuw = useCallback(() => {
    haalRechtenOp()
      .catch(() => null)
      .then((r) => {
        setRechten(r);
        setCamera(cameraStatus());
      });
  }, []);

  useEffect(() => {
    vernieuw();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') vernieuw();
    });
    return () => sub.remove();
  }, [vernieuw]);

  const vraagAlleRechtenAan = useCallback(async () => {
    setRechten(await vraagRechtenAan().catch(() => null));
    await vraagCameraAan().catch(() => false);
    setCamera(cameraStatus());
  }, []);

  const meldingen = rechten?.canPostNotifications !== false && rechten?.status !== 'unavailable';
  const alarmen = Boolean(rechten?.canScheduleExactAlarms);
  const testGeslaagd = Boolean(profiel?.alarmtest_geslaagd_op);

  const regels: CheckRegel[] = [
    {
      label: 'Meldingen',
      ok: Boolean(rechten) && meldingen,
      waarde: meldingen && rechten ? 'Toegestaan' : 'Niet toegestaan',
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
    vernieuw,
    vraagAlleRechtenAan,
  };
}
