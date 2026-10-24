// Op web is er geen camera-detectie; de gebruiker vinkt stappen handmatig af.
import { useEffect } from 'react';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { CameraIllustratie } from '@/components/missie/CameraIllustratie';
import { OEFENING_INFO } from '@/constants/oefeningen';
import { useTaal } from '@/i18n';
import type { Oefening } from '@/types/app';

export type StapDetectorProps = {
  oefening: Oefening;
  // Aantal herhalingen of seconden voor deze stap
  doel: number;
  onVoortgang: (gedaan: number) => void;
  onFeedback: (tekst: string) => void;
  onKlaar: (methode: 'camera' | 'licht' | 'foto') => void;
};

export function StapDetector({ oefening, onFeedback }: StapDetectorProps) {
  const info = OEFENING_INFO[oefening];
  const { t } = useTaal();

  useEffect(() => {
    onFeedback(t('missie.detector.alleenApp'));
  }, [onFeedback, t]);

  return (
    <CameraFrame
      label={t('missie.detector.geenCamera')}
      notitie={t('missie.camera.alleenInApp')}
      achtergrond={
        <CameraIllustratie modus={info.methode === 'pose' ? 'pose' : 'object'} emoji={info.emoji} />
      }
    />
  );
}
