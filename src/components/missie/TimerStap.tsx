import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { CAMERA_HOOGTE } from '@/components/missie/CameraFrame';
import { em, fonts, kleuren } from '@/constants/theme';
import { useTaal } from '@/i18n';

type Props = {
  seconden: number;
  emoji: string;
  onVoortgang: (gedaan: number) => void;
  onKlaar: () => void;
};

const STRAAL = 92;
const OMTREK = 2 * Math.PI * STRAAL;

const klok = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Missie op tijd: pas klaar als de timer helemaal is afgelopen
export function TimerStap({ seconden, emoji, onVoortgang, onKlaar }: Props) {
  const { t } = useTaal();
  const [eind, setEind] = useState<number | null>(null);
  const [verstreken, setVerstreken] = useState(0);
  const voortgang = useRef(onVoortgang);
  const klaar = useRef(onKlaar);
  useEffect(() => {
    voortgang.current = onVoortgang;
    klaar.current = onKlaar;
  });

  useEffect(() => {
    if (eind === null) return;
    const timer = setInterval(() => {
      const gedaan = Math.min(seconden, seconden - Math.ceil((eind - Date.now()) / 1000));
      setVerstreken(gedaan);
      voortgang.current(gedaan);
      if (gedaan >= seconden) {
        clearInterval(timer);
        klaar.current();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [eind, seconden]);

  const rest = Math.max(0, seconden - verstreken);
  const fractie = seconden > 0 ? verstreken / seconden : 0;

  return (
    <View style={styles.kaart}>
      <Text style={styles.label}>{t('missie.timer.label')}</Text>
      <View style={styles.midden}>
        <Svg width={STRAAL * 2 + 16} height={STRAAL * 2 + 16} style={styles.ring}>
          <Circle
            cx={STRAAL + 8}
            cy={STRAAL + 8}
            r={STRAAL}
            stroke="#354337"
            strokeWidth={8}
            fill="none"
          />
          <Circle
            cx={STRAAL + 8}
            cy={STRAAL + 8}
            r={STRAAL}
            stroke={kleuren.lime}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${OMTREK} ${OMTREK}`}
            strokeDashoffset={OMTREK * (1 - fractie)}
            rotation={-90}
            origin={`${STRAAL + 8}, ${STRAAL + 8}`}
          />
        </Svg>
        <View style={styles.binnen}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text
            maxFontSizeMultiplier={1.2}
            style={styles.tijd}
            accessibilityLabel={t('missie.timer.resterend', { tijd: klok(rest) })}
          >
            {klok(rest)}
          </Text>
        </View>
      </View>
      {eind === null ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setEind(Date.now() + seconden * 1000)}
          style={styles.start}
        >
          <Text style={styles.startTekst}>▶ {t('missie.timer.start')}</Text>
        </Pressable>
      ) : (
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {rest > 0 ? t('missie.timer.bezig') : t('missie.timer.klaar')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kaart: {
    height: CAMERA_HOOGTE,
    borderWidth: 1,
    borderColor: '#50674E',
    borderRadius: 23,
    backgroundColor: '#1B2C22',
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  label: {
    position: 'absolute',
    top: 13,
    left: 14,
    fontFamily: fonts.body800,
    fontSize: 9,
    letterSpacing: em(0.12, 9),
    color: '#C5D6BE',
  },
  midden: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  binnen: {
    width: STRAAL * 2 + 16,
    height: STRAAL * 2 + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30, marginBottom: 2 },
  tijd: {
    fontFamily: fonts.head700,
    fontSize: 44,
    letterSpacing: em(-0.05, 44),
    color: kleuren.white,
  },
  start: {
    marginTop: 4,
    backgroundColor: kleuren.lime,
    borderRadius: 100,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  startTekst: { fontFamily: fonts.body800, fontSize: 13, color: kleuren.ink },
  status: {
    marginTop: 8,
    fontFamily: fonts.body600,
    fontSize: 12,
    color: '#C5D6BE',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
