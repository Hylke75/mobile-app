import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, PrimaryButton, SectionTitleRow } from '@/components/ui';
import { dagenTekst, missiesTekst } from '@/constants/alarm';
import { doelTekst, OEFENING_INFO } from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmCheck } from '@/hooks/useAlarmCheck';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { useSessies } from '@/hooks/useSessies';
import { alarmenBeschikbaar } from '@/lib/alarmen';
import { datumKicker } from '@/lib/datum';
import { useNu } from '@/hooks/useNu';
import { dagSleutel, hervatOp, startVanDag, tijdTot, volgendAlarm } from '@/lib/tijd';
import type { Oefening } from '@/types/app';

const STANDAARD_MISSIE: Oefening[] = ['Squats', 'Bed opmaken', 'Gordijnen open'];

const WEEKDAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

function wanneerTekst(op: Date): string {
  const vandaag = startVanDag(new Date());
  const dag = startVanDag(op);
  const verschil = Math.round((dag.getTime() - vandaag.getTime()) / 86400000);
  if (verschil === 0) return 'Vandaag';
  if (verschil === 1) return 'Morgen';
  return `A.s. ${WEEKDAGEN[op.getDay()]}`;
}

export default function VandaagScherm() {
  const { profiel, werkProfielBij } = useAuth();
  const { alarms, vernieuw: vernieuwAlarmen } = useAlarmen();
  const { sessies, statistiek, vernieuw, wachtend } = useSessies();
  const { allesInOrde } = useAlarmCheck();
  const voornaam = profiel?.voornaam ?? '';

  const nu = useNu();
  const hervat = hervatOp(profiel?.pauze_tot, nu);
  // Tijdens een pauze is het eerstvolgende alarm het eerste na de pauze
  const volgend = volgendAlarm(alarms, hervat ? new Date(hervat.getTime() - 1) : nu);
  const missie = volgend?.alarm.oefeningen ?? STANDAARD_MISSIE;
  const vandaagKlaar = sessies.some(
    (s) =>
      s.status === 'voltooid' &&
      dagSleutel(s.afgerondOp) === dagSleutel(new Date()) &&
      (!volgend || s.alarmId === volgend.alarm.id),
  );

  return (
    <Screen onRefresh={() => Promise.all([vernieuwAlarmen(), vernieuw()])}>
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
          <Text maxFontSizeMultiplier={1.2} style={styles.streakCount}>
            {statistiek.streak}
          </Text>
          <Text style={styles.streakSmall}>{statistiek.streak === 1 ? 'DAG' : 'DAGEN'}</Text>
        </View>
        <Text style={styles.streakSub}>
          {statistiek.streak > 0
            ? 'Je bent niet te stoppen. Keep going!'
            : 'Rond vandaag je eerste missie af en start je streak.'}
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.sparkle}>
          ✳
        </Text>
      </View>

      <SectionTitleRow
        titel="Volgende alarm"
        rechts={
          <Pressable onPress={() => router.navigate('/alarmen')} hitSlop={8}>
            <Text style={styles.textLink}>Alle alarmen ↗</Text>
          </Pressable>
        }
      />
      {hervat && (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Zet je alarmen weer aan"
          onPress={() => werkProfielBij({ pauze_tot: null })}
          style={styles.pauze}
        >
          <Icon name="calendar" size={17} color={kleuren.ink} />
          <Text style={styles.pauzeTekst}>
            <Text style={styles.insightStrong}>Alarmen gepauzeerd</Text> tot{' '}
            {hervat.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            . Tik om ze nu weer aan te zetten.
          </Text>
        </Pressable>
      )}
      {volgend ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/nieuw-alarm', params: { id: volgend.alarm.id } })
          }
          style={styles.nextAlarm}
        >
          <View style={gedeeld.rowBetween}>
            <View style={styles.alarmTimeRow}>
              <Text maxFontSizeMultiplier={1.2} style={styles.alarmTime}>
                {volgend.alarm.tijd}
              </Text>
              <Text style={styles.alarmTimeSmall}>
                {dagenTekst(volgend.alarm.dagen).toUpperCase()}
              </Text>
            </View>
            <View style={styles.pillLabel}>
              <Text style={styles.pillLabelText}>{volgend.alarm.niveau.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.alarmSub}>{volgend.alarm.naam}</Text>
          <Text style={styles.alarmCaption}>
            {missiesTekst(volgend.alarm.oefeningen.length)} · {wanneerTekst(volgend.op)}
            {volgend.op.getTime() - nu.getTime() < 86400000
              ? ` · over ${tijdTot(volgend.op, nu)}`
              : ''}
          </Text>
          <View style={styles.alarmShape}>
            <Text maxFontSizeMultiplier={1.2} style={styles.alarmShapeArrow}>
              ↗
            </Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/nieuw-alarm')}
          style={styles.nextAlarm}
        >
          <Text style={styles.alarmSub}>Nog geen alarm gepland.</Text>
          <Text style={styles.alarmCaption}>Tik hier om je eerste Mooove-alarm te zetten.</Text>
          <View style={styles.alarmShape}>
            <Text maxFontSizeMultiplier={1.2} style={styles.alarmShapeArrow}>
              ↗
            </Text>
          </View>
        </Pressable>
      )}

      <SectionTitleRow
        titel="Jouw ochtendmissie"
        rechts={`${String(missie.length).padStart(2, '0')} STAPPEN`}
      />
      <View style={styles.missionList}>
        {missie.map((oefening, i) => (
          <View
            key={`${oefening}-${i}`}
            style={[styles.missionRow, i === missie.length - 1 && styles.missionRowLast]}
          >
            <Text style={styles.missionIndex}>{String(i + 1).padStart(2, '0')}</Text>
            <View style={styles.missionEmoji}>
              <Text style={styles.missionEmojiText}>{OEFENING_INFO[oefening].emoji}</Text>
            </View>
            <View>
              <Text style={styles.missionName}>{oefening}</Text>
              <Text style={styles.missionDetail}>{doelTekst(oefening, volgend?.alarm.doelen)}</Text>
            </View>
            <View style={[styles.missionCheck, vandaagKlaar && styles.missionCheckKlaar]}>
              <Icon name="check" size={13} color={vandaagKlaar ? kleuren.ink : '#C1CEC0'} />
            </View>
          </View>
        ))}
      </View>

      <PrimaryButton
        label={vandaagKlaar ? 'Doe je missie nog een keer' : 'Start je missie nu'}
        onPress={() =>
          router.push({
            pathname: '/missie',
            params: volgend ? { alarmId: volgend.alarm.id } : {},
          })
        }
        style={styles.homeStart}
      />
      {alarmenBeschikbaar && (
        <Pressable onPress={() => router.navigate('/profiel')} style={styles.insight}>
          <Icon name="shield" size={17} color={allesInOrde ? '#679E5E' : '#C2462F'} />
          <Text style={styles.insightText}>
            {allesInOrde ? (
              <>
                <Text style={styles.insightStrong}>Ready to go.</Text> Je alarm-check is in orde.
              </>
            ) : (
              <>
                <Text style={styles.insightStrong}>Let op.</Text> Rond je alarm-check af in je
                profiel.
              </>
            )}
          </Text>
        </Pressable>
      )}
      {wachtend > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Probeert de missies nu te versturen"
          onPress={() => vernieuw()}
          style={styles.insight}
        >
          <Icon name="activity" size={17} color="#5F6E60" />
          <Text style={styles.insightText}>
            <Text style={styles.insightStrong}>
              {wachtend === 1 ? '1 missie wacht' : `${wachtend} missies wachten`} op internet.
            </Text>{' '}
            Ze tellen al mee en worden vanzelf verstuurd. Tik om het nu te proberen.
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pauze: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDF4D5',
    borderRadius: 15,
    padding: 13,
    marginBottom: 10,
  },
  pauzeTekst: {
    flex: 1,
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 17,
    color: kleuren.ink,
  },
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
  missionIndex: { fontFamily: fonts.head700, fontSize: 12, color: '#5F6E60', width: 20 },
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
  missionDetail: { fontFamily: fonts.body400, fontSize: 10, color: '#5F6E60', marginTop: 3 },
  missionCheckKlaar: { backgroundColor: kleuren.lime, borderColor: kleuren.lime },
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
  insightText: { flex: 1, fontFamily: fonts.body400, fontSize: 10, color: '#5F6E60' },
  insightStrong: { fontFamily: fonts.body700, color: kleuren.ink },
});
