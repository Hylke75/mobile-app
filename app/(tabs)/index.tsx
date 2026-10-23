import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, PrimaryButton, SectionTitleRow } from '@/components/ui';
import { DEMO_STREAK, OCHTENDMISSIE } from '@/constants/demo';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { datumKicker } from '@/lib/datum';

export default function VandaagScherm() {
  const { profiel } = useAuth();
  const voornaam = profiel?.voornaam ?? '';

  return (
    <Screen>
      <View style={[gedeeld.rowBetween, styles.helloRow]}>
        <View>
          <Text style={[gedeeld.sectionKicker, styles.helloKicker]}>{datumKicker()}</Text>
          <Text style={styles.helloName}>Hey {voornaam} ✌️</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profiel"
          onPress={() => router.navigate('/profiel')}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{voornaam.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      <Text style={styles.pageHeading}>
        Let&apos;s get{'\n'}
        <Text style={styles.pageHeadingAccent}>moving.</Text>
      </Text>

      <View style={styles.streakCard}>
        <Svg width={302} height={302} style={styles.streakRings}>
          <Circle
            cx={151}
            cy={151}
            r={138}
            stroke="#D8FB59"
            strokeOpacity={0.035}
            strokeWidth={26}
            fill="none"
          />
          <Circle
            cx={151}
            cy={151}
            r={112.5}
            stroke="#D8FB59"
            strokeOpacity={0.06}
            strokeWidth={25}
            fill="none"
          />
          <Circle
            cx={151}
            cy={151}
            r={99.5}
            stroke="#A3BE77"
            strokeOpacity={0.376}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
        <View style={styles.streakTopline}>
          <Text style={styles.streakToplineText}>JOUW STREAK</Text>
          <View style={styles.flameTag}>
            <Icon name="flame" color={kleuren.lime} />
          </View>
        </View>
        <View style={styles.streakRow}>
          <Text style={styles.streakCount}>{DEMO_STREAK}</Text>
          <Text style={styles.streakSmall}>DAGEN</Text>
        </View>
        <Text style={styles.streakSub}>Je bent niet te stoppen. Keep going!</Text>
        <Text style={styles.sparkle}>✳</Text>
      </View>

      <SectionTitleRow
        titel="Volgende alarm"
        rechts={
          <Pressable onPress={() => router.navigate('/alarmen')} hitSlop={8}>
            <Text style={styles.textLink}>Alle alarmen ↗</Text>
          </Pressable>
        }
      />
      <View style={styles.nextAlarm}>
        <View style={gedeeld.rowBetween}>
          <View style={styles.alarmTimeRow}>
            <Text style={styles.alarmTime}>07:00</Text>
            <Text style={styles.alarmTimeSmall}>MA – VR</Text>
          </View>
          <View style={styles.pillLabel}>
            <Text style={styles.pillLabelText}>VERPLICHT</Text>
          </View>
        </View>
        <Text style={styles.alarmSub}>Wake up & move</Text>
        <Text style={styles.alarmCaption}>3 missies · Je start sterk</Text>
        <View style={styles.alarmShape}>
          <Text style={styles.alarmShapeArrow}>↗</Text>
        </View>
      </View>

      <SectionTitleRow titel="Jouw ochtendmissie" rechts="03 STAPPEN" />
      <View style={styles.missionList}>
        {OCHTENDMISSIE.map((rij, i) => (
          <View
            key={rij.index}
            style={[styles.missionRow, i === OCHTENDMISSIE.length - 1 && styles.missionRowLast]}
          >
            <Text style={styles.missionIndex}>{rij.index}</Text>
            <View style={styles.missionEmoji}>
              <Text style={styles.missionEmojiText}>{rij.emoji}</Text>
            </View>
            <View>
              <Text style={styles.missionName}>{rij.naam}</Text>
              <Text style={styles.missionDetail}>{rij.detail}</Text>
            </View>
            <View style={styles.missionCheck}>
              <Icon name="check" size={13} color="#C1CEC0" />
            </View>
          </View>
        ))}
      </View>

      <PrimaryButton
        label="Bekijk de missie-demo"
        onPress={() => router.push('/missie')}
        style={styles.homeStart}
      />
      <View style={styles.insight}>
        <Icon name="shield" size={17} color="#679E5E" />
        <Text style={styles.insightText}>
          <Text style={styles.insightStrong}>Ready to go.</Text> Je alarm-check is in orde.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  helloRow: { marginTop: 5, marginBottom: 17 },
  helloKicker: { marginBottom: 4 },
  helloName: {
    fontFamily: fonts.head700,
    fontSize: 20,
    letterSpacing: em(-0.05, 20),
    color: kleuren.ink,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: kleuren.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.head700, fontSize: 18, color: kleuren.lime },
  pageHeading: {
    fontFamily: fonts.head700,
    fontSize: 35,
    lineHeight: 34.6,
    letterSpacing: em(-0.065, 35),
    marginTop: 8,
    marginBottom: 17,
    color: kleuren.ink,
  },
  pageHeadingAccent: { color: '#6C7D64' },
  streakCard: {
    minHeight: 158,
    backgroundColor: kleuren.ink,
    borderRadius: 23,
    padding: 21,
    overflow: 'hidden',
  },
  streakRings: { position: 'absolute', right: -126, top: -96 },
  streakTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakToplineText: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.12, 10),
    color: '#B1BCB0',
  },
  flameTag: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: '#283326',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  streakCount: {
    fontFamily: fonts.head700,
    fontSize: 77,
    lineHeight: 73,
    letterSpacing: em(-0.09, 77),
    color: kleuren.lime,
  },
  streakSmall: {
    fontFamily: fonts.head700,
    fontSize: 17,
    letterSpacing: em(-0.02, 17),
    color: kleuren.white,
    marginLeft: 10,
  },
  streakSub: { fontFamily: fonts.body400, fontSize: 11, color: '#A1AFA2', marginTop: 10 },
  sparkle: {
    position: 'absolute',
    right: 39,
    bottom: 25,
    color: kleuren.lime,
    fontSize: 56,
    fontFamily: fonts.head700,
    transform: [{ rotate: '17deg' }],
  },
  textLink: { fontFamily: fonts.body800, fontSize: 11, color: '#496B40' },
  nextAlarm: {
    backgroundColor: '#E4ECD9',
    borderRadius: 21,
    paddingVertical: 17,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  alarmTimeRow: { flexDirection: 'row', alignItems: 'center' },
  alarmTime: {
    fontFamily: fonts.head700,
    fontSize: 47,
    lineHeight: 45,
    letterSpacing: em(-0.075, 47),
    color: kleuren.ink,
  },
  alarmTimeSmall: { fontFamily: fonts.body800, fontSize: 11, color: '#637566', marginLeft: 10 },
  pillLabel: {
    borderRadius: 50,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#B9D7A8',
  },
  pillLabelText: {
    fontFamily: fonts.body800,
    fontSize: 9,
    letterSpacing: em(0.07, 9),
    color: kleuren.ink,
  },
  alarmSub: { fontFamily: fonts.body800, fontSize: 13, marginTop: 8, color: kleuren.ink },
  alarmCaption: { fontFamily: fonts.body400, fontSize: 10, color: '#67796A', marginTop: 4 },
  alarmShape: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: kleuren.lime,
    right: -16,
    bottom: -28,
  },
  alarmShapeArrow: {
    position: 'absolute',
    top: -15,
    left: 6,
    fontFamily: fonts.head700,
    fontSize: 50,
    color: kleuren.ink,
    transform: [{ rotate: '-17deg' }],
  },
  missionList: {
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: kleuren.white,
  },
  missionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: kleuren.line,
  },
  missionRowLast: { borderBottomWidth: 0 },
  missionIndex: { fontFamily: fonts.head700, fontSize: 12, color: '#89958C', width: 20 },
  missionEmoji: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F0F3EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionEmojiText: { fontSize: 18 },
  missionName: { fontFamily: fonts.body800, fontSize: 12, color: kleuren.ink },
  missionDetail: { fontFamily: fonts.body400, fontSize: 10, color: '#879489', marginTop: 3 },
  missionCheck: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D9DED4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeStart: { marginTop: 14 },
  insight: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  insightText: { flex: 1, fontFamily: fonts.body400, fontSize: 10, color: '#7A877B' },
  insightStrong: { fontFamily: fonts.body700, color: kleuren.ink },
});
