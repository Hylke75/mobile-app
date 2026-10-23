// DEMO: tellers en feedback zijn gesimuleerd; er is geen echte camera- of bewegingsdetectie.
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CameraCard } from '@/components/CameraCard';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { LevelTag, PrimaryButton } from '@/components/ui';
import { DEMO_STREAK, MISSIE_TAKEN } from '@/constants/demo';
import { em, fonts, kleuren } from '@/constants/theme';
import { useDemo } from '@/hooks/useDemo';

const TITELS: [string, string][] = [
  ['LET’S ', 'GO.'],
  ['MAKE ', 'IT.'],
  ['OPEN ', 'UP.'],
];

export default function MissieScherm() {
  const { showToast } = useDemo();
  const [stap, setStap] = useState(0);
  const [reps, setReps] = useState(0);
  const [klaar, setKlaar] = useState(false);

  const naarVandaag = () => router.dismissTo('/');

  if (klaar) {
    return (
      <Screen dark>
        <StatusBar style="light" />
        <View style={styles.top}>
          <Text style={styles.stage}>MISSION COMPLETE</Text>
          <SluitKnop label="Sluiten" onPress={naarVandaag} />
        </View>
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Icon name="check" size={52} strokeWidth={2.5} color={kleuren.ink} />
          </View>
          <Text style={styles.doneTitle}>
            YOU DID{'\n'}
            <Text style={styles.lime}>IT.</Text>
          </Text>
          <Text style={styles.doneText}>
            Je hebt je hele ochtendmissie afgemaakt.{'\n'}Dat is hoe je een dag begint. 💪
          </Text>
          <View style={styles.doneStat}>
            <View style={styles.doneStatItem}>
              <Text style={styles.doneStatValue}>{DEMO_STREAK}</Text>
              <Text style={styles.doneStatLabel}>DAGEN STREAK</Text>
            </View>
            <View style={styles.doneStatItem}>
              <Text style={styles.doneStatValue}>3/3</Text>
              <Text style={styles.doneStatLabel}>MISSIES KLAAR</Text>
            </View>
          </View>
          <PrimaryButton label="Terug naar vandaag" onPress={naarVandaag} />
        </View>
      </Screen>
    );
  }

  const taak = MISSIE_TAKEN[stap]!;
  const isReps = stap === 0;
  const gedaan = reps >= taak.total;
  const [titel, accent] = TITELS[stap]!;

  const voortgang = () => {
    if (gedaan) {
      if (stap >= MISSIE_TAKEN.length - 1) {
        setKlaar(true);
      } else {
        setStap(stap + 1);
        setReps(0);
      }
    } else {
      setReps(Math.min(taak.total, reps + (isReps ? 5 : 1)));
    }
  };

  const knopLabel = gedaan
    ? stap === 2
      ? 'Rond missie af'
      : 'Volgende ronde'
    : isReps
      ? 'Simuleer 5 herhalingen'
      : 'Markeer als uitgevoerd';

  const spraak = gedaan
    ? 'Yes! Volgende stap.'
    : taak.voice[Math.min(Math.floor(reps / 5), taak.voice.length - 1)];

  return (
    <Screen dark>
      <StatusBar style="light" />
      <View style={styles.top}>
        <Text style={styles.stage}>
          LIVE MISSIE <Text style={styles.stageMuted}>/ {stap + 1} VAN 3</Text>
        </Text>
        <SluitKnop label="Missie verlaten" onPress={naarVandaag} />
      </View>
      <Text style={styles.title}>
        {titel}
        <Text style={styles.lime}>{accent}</Text>
      </Text>
      <Text style={styles.subtitle}>{taak.description}</Text>
      <View style={styles.steps}>
        {MISSIE_TAKEN.map((t, i) => (
          <View key={t.title} style={[styles.step, i <= stap && styles.stepFilled]} />
        ))}
      </View>

      <CameraCard modus={isReps ? 'pose' : 'object'} emoji={stap === 1 ? '🛏️' : '☀️'} />

      <View style={styles.repsRow}>
        <View>
          <Text style={styles.repsLabel}>{isReps ? 'HERHALINGEN' : 'UITGEVOERD'}</Text>
          <Text style={styles.repsCount}>
            {reps}
            <Text style={styles.repsTotal}> / {taak.total}</Text>
          </Text>
        </View>
        <LevelTag level="hard" label={gedaan ? 'KLAAR ✓' : 'BEZIG'} />
      </View>

      <View style={styles.voice}>
        <Icon name="sound" size={17} color={kleuren.lime} />
        <Text style={styles.voiceText}>{spraak}</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label={knopLabel} onPress={voortgang} style={styles.flex} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start ronde opnieuw"
          onPress={() => setReps(0)}
          style={styles.outlineBtn}
        >
          <Text style={styles.outlineBtnText}>↺</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          naarVandaag();
          showToast('Demo-missie gestopt.');
        }}
        style={styles.emergency}
      >
        <Text style={styles.emergencyText}>Noodstop (concept)</Text>
      </Pressable>
    </Screen>
  );
}

function SluitKnop({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.close}
    >
      <Icon name="close" color={kleuren.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, width: undefined },
  lime: { color: kleuren.lime },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stage: {
    fontFamily: fonts.body800,
    fontSize: 11,
    letterSpacing: em(0.12, 11),
    color: kleuren.lime,
  },
  stageMuted: { color: '#6D856E' },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#4C5C4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.head700,
    fontSize: 37,
    lineHeight: 36.3,
    letterSpacing: em(-0.075, 37),
    color: kleuren.white,
    marginTop: 24,
    marginBottom: 7,
  },
  subtitle: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 18,
    color: '#9EAEA0',
    marginBottom: 17,
  },
  steps: { flexDirection: 'row', gap: 5 },
  step: { flex: 1, height: 5, borderRadius: 10, backgroundColor: '#354337' },
  stepFilled: { backgroundColor: kleuren.lime },
  repsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 21,
  },
  repsLabel: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.13, 10),
    color: '#9CB09C',
  },
  repsCount: {
    fontFamily: fonts.head700,
    fontSize: 68,
    lineHeight: 65,
    letterSpacing: em(-0.07, 68),
    color: kleuren.lime,
  },
  repsTotal: { fontSize: 25, color: '#668068' },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#283B2B',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  voiceText: { flex: 1, fontFamily: fonts.body400, fontSize: 12, color: '#D3E2CC' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#61735E',
    borderRadius: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { fontFamily: fonts.body800, fontSize: 11, color: kleuren.white },
  emergency: { alignSelf: 'center', marginTop: 17, padding: 4 },
  emergencyText: {
    fontFamily: fonts.body400,
    fontSize: 10,
    color: '#819181',
    textDecorationLine: 'underline',
  },
  done: { alignItems: 'stretch', paddingTop: 60 },
  doneIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: kleuren.lime,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 23,
  },
  doneTitle: {
    fontFamily: fonts.head700,
    fontSize: 48,
    lineHeight: 47,
    letterSpacing: em(-0.07, 48),
    color: kleuren.white,
    textAlign: 'center',
    marginBottom: 15,
  },
  doneText: {
    fontFamily: fonts.body400,
    fontSize: 14,
    lineHeight: 22,
    color: '#B2C2B0',
    textAlign: 'center',
  },
  doneStat: {
    backgroundColor: '#283B2D',
    borderWidth: 1,
    borderColor: '#415C42',
    borderRadius: 19,
    padding: 19,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 36,
  },
  doneStatItem: { alignItems: 'center' },
  doneStatValue: { fontFamily: fonts.head700, fontSize: 28, color: kleuren.lime },
  doneStatLabel: { fontFamily: fonts.body400, fontSize: 10, color: '#99AE97' },
});
