// Op web is er geen camera-detectie; de gebruiker vinkt stappen handmatig af.
import { useEffect } from 'react';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { CameraIllustratie } from '@/components/missie/CameraIllustratie';
import { OEFENING_INFO } from '@/constants/oefeningen';
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

  useEffect(() => {
    onFeedback('Camera-controle werkt alleen in de app op je telefoon.');
  }, [onFeedback]);

  return (
    <CameraFrame
      label="GEEN CAMERA"
      notitie="ALLEEN IN DE APP"
      achtergrond={
        <CameraIllustratie modus={info.methode === 'pose' ? 'pose' : 'object'} emoji={info.emoji} />
      }
    />
  );
}
