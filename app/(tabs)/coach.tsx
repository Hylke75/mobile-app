// TOEKOMSTCONCEPT (V2): geen werkende zorgfunctionaliteit; alle inhoud is voorbeelddata.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, ScreenHeader, SecondaryButton, SectionTitleRow } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';

const TAKEN = [
  ['01 · Arm circles', '2 × 12'],
  ['02 · Wall slides', '3 × 10'],
  ['03 · Shoulder stretch', '30 sec'],
];

export default function CoachScherm() {
  const { showToast } = useToast();

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/profiel')}
        style={gedeeld.backLink}
      >
        <Icon name="chevron" color={kleuren.ink} />
        <Text style={gedeeld.backLinkText}>Terug naar profiel</Text>
      </Pressable>
      <ScreenHeader kicker="FUTURE FEATURE / V2" titel="Mooove Coach" puntKleur="#6BA7AA" />

      <View style={styles.hero}>
        <View style={styles.swirl} />
        <Text style={styles.eyebrow}>MOVE WITH PURPOSE</Text>
        <Text style={styles.heroTitle}>Jouw herstel.{'\n'}Jouw ritme.</Text>
        <Text style={styles.heroText}>
          Oefenprogramma’s van je fysio of trainer, gewoon in jouw dagelijkse flow.
        </Text>
        <View style={styles.futurePill}>
          <Text style={styles.futurePillText}>BINNENKORT BESCHIKBAAR</Text>
        </View>
      </View>

      <SectionTitleRow titel="Voorbeeldprogramma" rechts="DEMO" />
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.coachAvatar}>
            <Text style={styles.coachAvatarText}>S</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>Schoudermobiliteit</Text>
            <Text style={styles.cardSub}>Van je fysiotherapeut · 3× per week</Text>
          </View>
        </View>
        <View style={styles.tasks}>
          {TAKEN.map(([naam, dosering]) => (
            <View key={naam} style={styles.task}>
              <Text style={styles.taskName}>{naam}</Text>
              <Text style={styles.taskDose}>{dosering}</Text>
            </View>
          ))}
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>8/10</Text>
          <View>
            <Text style={styles.scoreLabel}>Sessies gedaan</Text>
            <Text style={styles.scoreSub}>80% therapietrouw</Text>
          </View>
        </View>
      </View>

      <Text style={styles.note}>
        Voor behandelaren komt later een apart webportaal om programma&apos;s samen te stellen en
        voortgang in te zien. Dit scherm is een ontwerpverkenning, nog geen werkende
        zorgfunctionaliteit.
      </Text>
      <SecondaryButton
        label="Houd me op de hoogte ↗"
        onPress={() => showToast('Mooove Coach staat op de roadmap.')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#DCECEF', borderRadius: 23, padding: 20, overflow: 'hidden' },
  swirl: {
    position: 'absolute',
    right: -30,
    bottom: -61,
    width: 165,
    height: 165,
    borderRadius: 83,
    borderWidth: 18,
    borderColor: '#B2D8DC',
  },
  eyebrow: {
    fontFamily: fonts.body800,
    fontSize: 9,
    letterSpacing: em(0.14, 9),
    color: '#45757A',
  },
  heroTitle: {
    fontFamily: fonts.head700,
    fontSize: 28,
    lineHeight: 28,
    letterSpacing: em(-0.06, 28),
    color: kleuren.ink,
    marginTop: 18,
    marginBottom: 10,
    maxWidth: 220,
  },
  heroText: {
    fontFamily: fonts.body400,
    fontSize: 11,
    lineHeight: 17,
    maxWidth: 240,
    color: '#45666A',
  },
  futurePill: {
    alignSelf: 'flex-start',
    backgroundColor: kleuren.white,
    borderRadius: 30,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 17,
  },
  futurePillText: { fontFamily: fonts.body800, fontSize: 9, color: '#5B7A7E' },
  card: {
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 20,
    padding: 17,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coachAvatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: kleuren.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachAvatarText: { fontFamily: fonts.head700, fontSize: 20, color: '#407579' },
  cardTitle: { fontFamily: fonts.body700, fontSize: 13, color: kleuren.ink },
  cardSub: { fontFamily: fonts.body400, fontSize: 10, color: '#5F6E60', marginTop: 4 },
  tasks: { marginTop: 17, gap: 10 },
  task: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskName: { fontFamily: fonts.body700, fontSize: 12, color: kleuren.ink },
  taskDose: { fontFamily: fonts.body700, fontSize: 10, color: '#5F6E60' },
  score: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#EDF4EB',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  scoreValue: { fontFamily: fonts.head700, fontSize: 28, color: kleuren.ink },
  scoreLabel: { fontFamily: fonts.body700, fontSize: 11, color: '#5F6E60' },
  scoreSub: { fontFamily: fonts.body400, fontSize: 9, color: '#5F6E60' },
  note: {
    fontFamily: fonts.body400,
    fontSize: 11,
    lineHeight: 17.6,
    color: '#5F6E60',
    marginTop: 16,
    marginBottom: 14,
  },
});
