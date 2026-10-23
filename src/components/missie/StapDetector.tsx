// Herkent een missiestap op het toestel zelf; er gaan geen camerabeelden naar een server.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useAsyncRunner,
  useCameraPermission,
  useFrameOutput,
  usePhotoOutput,
} from 'react-native-vision-camera';
import {
  type ExerciseConfig,
  nitroPoseExercises,
  PLANK_CONFIG,
  PUSHUP_CONFIG,
  SQUAT_CONFIG,
} from 'react-native-nitro-pose-exercises';
import { scheduleOnRN } from 'react-native-worklets';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { OEFENING_INFO } from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import type { Oefening } from '@/types/app';

export type StapDetectorProps = {
  oefening: Oefening;
  onVoortgang: (gedaan: number) => void;
  onFeedback: (tekst: string) => void;
  onKlaar: (methode: 'camera' | 'licht' | 'foto') => void;
};

const JUMPING_JACK_CONFIG: ExerciseConfig = {
  name: 'Jumping Jack',
  type: 'rep',
  postureFamily: 'standingUpright',
  visibilityThreshold: 0.3,
  cameraAngle: 'front',
  angles: [
    { name: 'leftShoulderAbduction', landmarkA: 23, landmarkB: 11, landmarkC: 15 },
    { name: 'rightShoulderAbduction', landmarkA: 24, landmarkB: 12, landmarkC: 16 },
  ],
  phases: [
    { phase: 'down', angleName: 'leftShoulderAbduction', minAngle: 0, maxAngle: 45 },
    { phase: 'up', angleName: 'leftShoulderAbduction', minAngle: 130, maxAngle: 180 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [],
  holdDurationMs: 0,
};

function poseConfig(oefening: Oefening): ExerciseConfig {
  switch (oefening) {
    case 'Squats':
      return SQUAT_CONFIG;
    case 'Push-ups':
      return PUSHUP_CONFIG;
    case 'Jumping jacks':
      return JUMPING_JACK_CONFIG;
    default:
      return { ...PLANK_CONFIG, holdDurationMs: OEFENING_INFO.Plank.doel * 1000 };
  }
}

export function StapDetector(props: StapDetectorProps) {
  const info = OEFENING_INFO[props.oefening];
  const { hasPermission, requestPermission, canRequestPermission } = useCameraPermission();

  if (!hasPermission) {
    return (
      <CameraFrame label="CAMERA NODIG">
        <View style={styles.midden}>
          <Text style={styles.uitleg}>
            Mooove gebruikt je camera om je missie te controleren. Beelden blijven op je toestel.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => (canRequestPermission ? requestPermission() : Linking.openSettings())}
            style={styles.knop}
          >
            <Text style={styles.knopTekst}>
              {canRequestPermission ? 'Geef toegang tot camera' : 'Open instellingen'}
            </Text>
          </Pressable>
        </View>
      </CameraFrame>
    );
  }

  if (info.methode === 'pose') return <PoseStap {...props} />;
  if (info.methode === 'licht') return <LichtStap {...props} />;
  return <FotoStap {...props} />;
}

function useLaatste<T>(waarde: T) {
  const ref = useRef(waarde);
  useEffect(() => {
    ref.current = waarde;
  });
  return ref;
}

function PoseStap({ oefening, onVoortgang, onFeedback, onKlaar }: StapDetectorProps) {
  const info = OEFENING_INFO[oefening];
  const runner = useAsyncRunner();
  const [gestart, setGestart] = useState(false);
  const isIos = Platform.OS === 'ios';
  // Callbacks via refs: een nieuwe callback (bijv. spraak aan/uit) mag de sessie niet herstarten
  const voortgang = useLaatste(onVoortgang);
  const feedback = useLaatste(onFeedback);
  const klaar = useLaatste(onKlaar);

  useEffect(() => {
    const stap = OEFENING_INFO[oefening];
    let interval: ReturnType<typeof setInterval> | undefined;
    let actief = true;

    (async () => {
      await nitroPoseExercises.initialize('');
      if (!actief) return;
      nitroPoseExercises.loadExercise(poseConfig(oefening));
      nitroPoseExercises.onRepComplete = (data) => voortgang.current(data.repNumber);
      nitroPoseExercises.onHoldProgress = (p) => voortgang.current(Math.floor(p.elapsedMs / 1000));
      nitroPoseExercises.onSessionComplete = () => klaar.current('camera');
      nitroPoseExercises.onPostureLost = () => feedback.current('Ga weer in positie.');
      nitroPoseExercises.onPostureRegained = () => feedback.current('Top, ga door!');
      nitroPoseExercises.onPoseLost = () =>
        feedback.current('Ik zie je niet goed. Zorg dat je helemaal in beeld bent.');
      feedback.current(stap.instructie);
      interval = setInterval(() => {
        if (nitroPoseExercises.isReady()) {
          clearInterval(interval);
          nitroPoseExercises.startSession(stap.eenheid === 'seconden' ? 1 : stap.doel, 3);
          setGestart(true);
          feedback.current(stap.spraak[0] ?? 'Daar gaan we!');
        }
      }, 300);
    })();

    return () => {
      actief = false;
      if (interval) clearInterval(interval);
      nitroPoseExercises.onRepComplete = undefined;
      nitroPoseExercises.onHoldProgress = undefined;
      nitroPoseExercises.onSessionComplete = undefined;
      nitroPoseExercises.onPostureLost = undefined;
      nitroPoseExercises.onPostureRegained = undefined;
      nitroPoseExercises.onPoseLost = undefined;
      nitroPoseExercises.stopSession();
      // Even wachten zodat een frame dat nog wordt verwerkt eerst klaar is
      setTimeout(() => nitroPoseExercises.release(), 500);
    };
  }, [oefening, voortgang, feedback, klaar]);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    onFrame(frame) {
      'worklet';
      const geaccepteerd = runner.runAsync(() => {
        'worklet';
        try {
          if (isIos) nitroPoseExercises.processFrameIOS(frame);
          else nitroPoseExercises.processFrameAndroid(frame);
        } finally {
          frame.dispose();
        }
      });
      if (!geaccepteerd) frame.dispose();
    },
  });

  return (
    <CameraFrame label={gestart ? 'POSE DETECTION' : 'GA IN POSITIE'}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={info.camera}
        isActive
        outputs={[frameOutput]}
        resizeMode="cover"
      />
    </CameraFrame>
  );
}

const LICHT_STAPPEN_NODIG = 2;
const LICHT_OPWARMEN_MS = 1500;
const LICHT_TERUGVAL_MS = 45000;

function LichtStap({ onFeedback, onKlaar }: StapDetectorProps) {
  const basis = useRef<number[]>([]);
  const lichtTeller = useRef(0);
  const afgerond = useRef(false);
  const laatsteMeting = useRef(0);
  const start = useRef(0);
  const [helderheid, setHelderheid] = useState<number | null>(null);
  const [terugval, setTerugval] = useState(false);
  const feedback = useLaatste(onFeedback);
  const klaar = useLaatste(onKlaar);

  useEffect(() => {
    start.current = Date.now();
    feedback.current(OEFENING_INFO['Gordijnen open'].instructie);
    const t = setTimeout(() => {
      if (!afgerond.current) {
        setTerugval(true);
        feedback.current('Lukt de lichtmeting niet? Maak dan een foto van je open gordijnen.');
      }
    }, LICHT_TERUGVAL_MS);
    return () => clearTimeout(t);
  }, [feedback]);

  const verwerk = useCallback(
    (waarde: number) => {
      const nu = Date.now();
      // De automatische belichting moet eerst tot rust komen
      if (afgerond.current || nu - start.current < LICHT_OPWARMEN_MS) return;
      if (nu - laatsteMeting.current < 200) return;
      laatsteMeting.current = nu;
      setHelderheid(waarde);
      if (basis.current.length < 8) {
        basis.current.push(waarde);
        return;
      }
      const gemiddeld = basis.current.reduce((a, b) => a + b, 0) / basis.current.length;
      const genoeg = waarde >= gemiddeld + 30 && waarde >= gemiddeld * 1.3;
      lichtTeller.current = genoeg ? lichtTeller.current + 1 : 0;
      if (lichtTeller.current >= LICHT_STAPPEN_NODIG) {
        afgerond.current = true;
        feedback.current('Daglicht gedetecteerd. Goedemorgen!');
        klaar.current('licht');
      }
    },
    [feedback, klaar],
  );

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      try {
        // Gemiddelde helderheid uit het Y-vlak, steekproefsgewijs
        const vlak = frame.getPlanes()[0];
        if (vlak) {
          const pixels = new Uint8Array(vlak.getPixelBuffer());
          let som = 0;
          let aantal = 0;
          for (let i = 0; i < pixels.length; i += 997) {
            som += pixels[i]!;
            aantal++;
          }
          if (aantal > 0) scheduleOnRN(verwerk, som / aantal);
        }
      } finally {
        frame.dispose();
      }
    },
  });

  if (terugval) {
    return (
      <FotoStap
        oefening="Gordijnen open"
        onVoortgang={() => {}}
        onFeedback={() => {}}
        onKlaar={() => {
          afgerond.current = true;
          klaar.current('foto');
        }}
      />
    );
  }

  return (
    <CameraFrame label="LICHTMETING">
      <Camera
        style={StyleSheet.absoluteFill}
        device="back"
        isActive
        outputs={[frameOutput]}
        resizeMode="cover"
      />
      {helderheid !== null && (
        <View style={styles.meter}>
          <Text style={styles.meterTekst}>LICHT {Math.round((helderheid / 255) * 100)}%</Text>
        </View>
      )}
    </CameraFrame>
  );
}

function FotoStap({ oefening, onFeedback, onKlaar }: StapDetectorProps) {
  const photoOutput = usePhotoOutput({ qualityPrioritization: 'speed' });
  const [bezig, setBezig] = useState(false);
  const [gemaakt, setGemaakt] = useState(false);
  const feedback = useLaatste(onFeedback);
  const klaar = useLaatste(onKlaar);

  useEffect(() => {
    if (oefening === 'Bed opmaken') feedback.current(OEFENING_INFO['Bed opmaken'].instructie);
  }, [oefening, feedback]);

  const maakFoto = async () => {
    setBezig(true);
    try {
      // De foto dient alleen als bevestiging en wordt direct weer weggegooid
      const foto = await photoOutput.capturePhoto({ flashMode: 'off' }, {});
      foto.dispose();
      setGemaakt(true);
      feedback.current(oefening === 'Bed opmaken' ? 'Netjes! Je bed is opgemaakt.' : 'Top!');
      klaar.current('foto');
    } catch {
      feedback.current('De foto lukte niet. Probeer het nog eens.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <CameraFrame label="FOTO-BEVESTIGING">
      <Camera
        style={StyleSheet.absoluteFill}
        device="back"
        isActive={!gemaakt}
        outputs={[photoOutput]}
        resizeMode="cover"
      />
      {!gemaakt && (
        <View style={styles.fotoKnopWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Maak foto van je bed"
            disabled={bezig}
            onPress={maakFoto}
            style={styles.fotoKnop}
          >
            <Text style={styles.knopTekst}>{bezig ? 'Bezig…' : '📸  Maak foto'}</Text>
          </Pressable>
        </View>
      )}
    </CameraFrame>
  );
}

const styles = StyleSheet.create({
  midden: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  uitleg: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 18,
    color: '#C5D6BE',
    textAlign: 'center',
  },
  knop: {
    backgroundColor: kleuren.lime,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  knopTekst: { fontFamily: fonts.body800, fontSize: 13, color: kleuren.ink },
  meter: {
    position: 'absolute',
    top: 10,
    right: 14,
    borderRadius: 30,
    backgroundColor: 'rgba(31,48,38,0.73)',
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  meterTekst: {
    fontFamily: fonts.body800,
    fontSize: 9,
    letterSpacing: em(0.13, 9),
    color: kleuren.lime,
  },
  fotoKnopWrap: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  fotoKnop: {
    backgroundColor: kleuren.lime,
    borderRadius: 30,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
});
