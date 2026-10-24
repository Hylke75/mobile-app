// Op web is er geen camera-detectie; de gebruiker vinkt stappen handmatig af.
import { useEffect } from 'react';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { CameraIllustratie } from '@/components/missie/CameraIllustratie';
import { useTaal } from '@/i18n';
import type { MissieInfo } from '@/lib/missies';

export type StapDetectorProps = {
  missie: MissieInfo;
  // Aantal herhalingen of seconden voor deze stap
  doel: number;
  onVoortgang: (gedaan: number) => void;
  onFeedback: (tekst: string) => void;
  onKlaar: (methode: 'camera' | 'licht' | 'foto') => void;
};

export function StapDetector({ missie, onFeedback }: StapDetectorProps) {
  const { t } = useTaal();

  useEffect(() => {
    onFeedback(t('missie.detector.alleenApp'));
  }, [onFeedback, t]);

  return (
    <CameraFrame
      label={t('missie.detector.geenCamera')}
      notitie={t('missie.camera.alleenInApp')}
      achtergrond={
        <CameraIllustratie
          modus={missie.methode === 'pose' ? 'pose' : 'object'}
          emoji={missie.emoji}
        />
      }
    />
  );
}
