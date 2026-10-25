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
  CALF_RAISE_CONFIG,
  type ExerciseConfig,
  GLUTE_BRIDGE_CONFIG,
  LUNGE_CONFIG,
  nitroPoseExercises,
  PLANK_CONFIG,
  PUSHUP_CONFIG,
  SIDE_PLANK_CONFIG,
  SQUAT_CONFIG,
  TREE_POSE_CONFIG,
  WALL_SIT_CONFIG,
} from 'react-native-nitro-pose-exercises';
import { scheduleOnRN } from 'react-native-worklets';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { OEFENING_INFO } from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import { t, useTaal } from '@/i18n';
import { missieInfo, type MissieInfo } from '@/lib/missies';
import type { Oefening } from '@/types/app';

export type StapDetectorProps = {
  // Ingebouwde oefening of eigen foto-missie (timers lopen via TimerStap)
  missie: MissieInfo;
  // Aantal herhalingen of seconden voor deze stap
  doel: number;
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
    // Ruime grenzen: bij een vlot tempo komen de armen niet helemaal tot langs het lichaam
    { phase: 'down', angleName: 'leftShoulderAbduction', minAngle: 0, maxAngle: 60 },
    { phase: 'up', angleName: 'leftShoulderAbduction', minAngle: 120, maxAngle: 180 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [],
  holdDurationMs: 0,
};

// Aanpassingen op de standaardinstellingen van de bibliotheek, getoetst met een simulatie van de
// telregels (vanaf de plaatsing die de app per oefening voorschrijft):
// - lunges: de bibliotheek eist een liggende houding, zijwaarts staand telt dan niets
// - kuitheffen: van opzij is de enkelhoek in rust ±105° en op de tenen ±115–130°
// - bruggetje: met de heupen op de grond is de heuphoek ±130–150°, niet 80–120°
const LUNGE: ExerciseConfig = { ...LUNGE_CONFIG, postureFamily: 'none' };
const KUITHEFFEN: ExerciseConfig = {
  ...CALF_RAISE_CONFIG,
  cameraAngle: 'side',
  phases: [
    { phase: 'down', angleName: 'leftAnkle', minAngle: 85, maxAngle: 108 },
    { phase: 'up', angleName: 'leftAnkle', minAngle: 113, maxAngle: 160 },
  ],
};
const BRUGGETJE: ExerciseConfig = {
  ...GLUTE_BRIDGE_CONFIG,
  phases: [
    { phase: 'down', angleName: 'hipExtension', minAngle: 95, maxAngle: 150 },
    { phase: 'up', angleName: 'hipExtension', minAngle: 160, maxAngle: 180 },
  ],
};

function poseConfig(oefening: Oefening, doel: number): ExerciseConfig {
  switch (oefening) {
    case 'Squats':
      return SQUAT_CONFIG;
    case 'Push-ups':
      return PUSHUP_CONFIG;
    case 'Jumping jacks':
      return JUMPING_JACK_CONFIG;
    case 'Lunges':
      return LUNGE;
    case 'Kuitheffen':
      return KUITHEFFEN;
    case 'Bruggetje':
      return BRUGGETJE;
    // Houdingen: zo lang vasthouden als het doel in seconden
    case 'Muurzit':
      return { ...WALL_SIT_CONFIG, holdDurationMs: doel * 1000 };
    case 'Zijplank':
      return { ...SIDE_PLANK_CONFIG, holdDurationMs: doel * 1000 };
    case 'Boomhouding':
      return { ...TREE_POSE_CONFIG, holdDurationMs: doel * 1000 };
    default:
      return { ...PLANK_CONFIG, holdDurationMs: doel * 1000 };
  }
}

export function StapDetector(props: StapDetectorProps) {
  const methode = props.missie.methode;
  const { hasPermission, requestPermission, canRequestPermission } = useCameraPermission();
  const { t } = useTaal();

  if (!hasPermission) {
    return (
      <CameraFrame label={t('missie.detector.cameraNodig')}>
        <View style={styles.midden}>
          <Text style={styles.uitleg}>{t('missie.detector.cameraUitleg')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => (canRequestPermission ? requestPermission() : Linking.openSettings())}
            style={styles.knop}
          >
            <Text style={styles.knopTekst}>
              {canRequestPermission
                ? t('missie.detector.geefToegang')
                : t('missie.detector.openInstellingen')}
            </Text>
          </Pressable>
        </View>
      </CameraFrame>
    );
  }

  if (methode === 'pose' && props.missie.oefening) {
    return <PoseStap {...props} oefening={props.missie.oefening} />;
  }
  if (methode === 'licht') return <LichtStap {...props} />;
  return <FotoStap {...props} />;
}

let poseGeneratie = 0;

function useLaatste<T>(waarde: T) {
  const ref = useRef(waarde);
  useEffect(() => {
    ref.current = waarde;
  });
  return ref;
}

function PoseStap({
  missie,
  oefening,
  doel,
  onVoortgang,
  onFeedback,
  onKlaar,
}: StapDetectorProps & { oefening: Oefening }) {
  const info = OEFENING_INFO[oefening];
  const runner = useAsyncRunner();
  const [gestart, setGestart] = useState(false);
  const isIos = Platform.OS === 'ios';
  const { t: vertaal } = useTaal();
  // Callbacks via refs: een nieuwe callback (bijv. spraak aan/uit) mag de sessie niet herstarten
  const voortgang = useLaatste(onVoortgang);
  const feedback = useLaatste(onFeedback);
  const klaar = useLaatste(onKlaar);

  useEffect(() => {
    const stap = OEFENING_INFO[oefening];
    const generatie = ++poseGeneratie;
    let interval: ReturnType<typeof setInterval> | undefined;
    let actief = true;

    (async () => {
      await nitroPoseExercises.initialize('');
      if (!actief) return;
      nitroPoseExercises.loadExercise(poseConfig(oefening, doel));
      nitroPoseExercises.onRepComplete = (data) => voortgang.current(data.repNumber);
      nitroPoseExercises.onHoldProgress = (p) => voortgang.current(Math.floor(p.elapsedMs / 1000));
      nitroPoseExercises.onSessionComplete = () => klaar.current('camera');
      nitroPoseExercises.onPostureLost = () => feedback.current(t('missie.detector.positieKwijt'));
      nitroPoseExercises.onPostureRegained = () =>
        feedback.current(t('missie.detector.positieTerug'));
      nitroPoseExercises.onPoseLost = () => feedback.current(t('missie.detector.nietInBeeld'));
      feedback.current(missie.instructie);
      // De engine verwerkt pas frames als de sessie loopt; houding wordt intern gecontroleerd
      nitroPoseExercises.startSession(stap.eenheid === 'seconden' ? 1 : doel, 3);
      interval = setInterval(() => {
        if (nitroPoseExercises.status === 'active') {
          clearInterval(interval);
          setGestart(true);
          feedback.current(missie.spraak[0] ?? '');
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
      // Pas vrijgeven als er intussen geen nieuwe stap is gestart (de engine is gedeeld)
      setTimeout(() => {
        if (poseGeneratie === generatie) nitroPoseExercises.release();
      }, 500);
    };
    // missie-teksten bewust niet als afhankelijkheid: een taalwissel herstart de sessie niet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oefening, doel, voortgang, feedback, klaar]);

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
    <CameraFrame label={gestart ? 'POSE DETECTION' : vertaal('missie.detector.inPositie')}>
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
  const { t: vertaal } = useTaal();

  useEffect(() => {
    start.current = Date.now();
    feedback.current(GORDIJNEN().instructie);
    const timer = setTimeout(() => {
      if (!afgerond.current) {
        setTerugval(true);
        feedback.current(t('missie.detector.lichtTerugval'));
      }
    }, LICHT_TERUGVAL_MS);
    return () => clearTimeout(timer);
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
        feedback.current(t('missie.detector.daglicht'));
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
        missie={GORDIJNEN()}
        doel={1}
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
    <CameraFrame label={vertaal('missie.detector.lichtmeting')}>
      <Camera
        style={StyleSheet.absoluteFill}
        device="back"
        isActive
        outputs={[frameOutput]}
        resizeMode="cover"
      />
      {helderheid !== null && (
        <View style={styles.meter}>
          <Text style={styles.meterTekst}>
            {vertaal('missie.detector.licht', { n: Math.round((helderheid / 255) * 100) })}
          </Text>
        </View>
      )}
    </CameraFrame>
  );
}

const GORDIJNEN = () => missieInfo('Gordijnen open', new Map())!;

function FotoStap({ missie, onFeedback, onKlaar }: StapDetectorProps) {
  const oefening = missie.oefening;
  const photoOutput = usePhotoOutput({ qualityPrioritization: 'speed' });
  const [bezig, setBezig] = useState(false);
  const [gemaakt, setGemaakt] = useState(false);
  const { t: vertaal } = useTaal();
  const feedback = useLaatste(onFeedback);
  const klaar = useLaatste(onKlaar);

  useEffect(() => {
    if (oefening !== 'Gordijnen open') feedback.current(missie.instructie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oefening, feedback]);

  const maakFoto = async () => {
    setBezig(true);
    try {
      // De foto dient alleen als bevestiging en wordt direct weer weggegooid
      const foto = await photoOutput.capturePhoto({ flashMode: 'off' }, {});
      foto.dispose();
      setGemaakt(true);
      feedback.current(
        oefening === 'Bed opmaken' ? t('missie.detector.bedKlaar') : t('missie.detector.top'),
      );
      klaar.current('foto');
    } catch {
      feedback.current(t('missie.detector.fotoMislukt'));
    } finally {
      setBezig(false);
    }
  };

  return (
    <CameraFrame label={vertaal('missie.detector.fotoBevestiging')}>
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
            accessibilityLabel={
              oefening === 'Bed opmaken'
                ? vertaal('missie.detector.fotoBedA11y')
                : oefening === 'Gordijnen open'
                  ? vertaal('missie.detector.fotoGordijnenA11y')
                  : `${vertaal('missie.detector.maakFoto')}: ${missie.naam}`
            }
            disabled={bezig}
            onPress={maakFoto}
            style={styles.fotoKnop}
          >
            <Text style={styles.knopTekst}>
              {bezig ? vertaal('algemeen.bezig') : vertaal('missie.detector.maakFoto')}
            </Text>
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
