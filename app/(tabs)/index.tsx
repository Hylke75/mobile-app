import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, PrimaryButton, SectionTitleRow } from '@/components/ui';
import { dagenTekst, dagNaam, missiesTekst, niveauNaam } from '@/constants/alarm';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmCheck } from '@/hooks/useAlarmCheck';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { useSessies } from '@/hooks/useSessies';
import { useTaal, type t as T } from '@/i18n';
import { alarmenBeschikbaar } from '@/lib/alarmen';
import { datumKicker } from '@/lib/datum';
import { useNu } from '@/hooks/useNu';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';
import { vorigeWeek } from '@/lib/statistiek';
import { dagIndex, dagSleutel, hervatOp, startVanDag, tijdTot, volgendAlarm } from '@/lib/tijd';
import { missieInfos, missiesVanDag } from '@/lib/missies';
import type { MissieId } from '@/types/app';

const STANDAARD_MISSIE: MissieId[] = ['Squats', 'Bed opmaken', 'Gordijnen open'];

function wanneerTekst(op: Date, t: typeof T): string {
  const vandaag = startVanDag(new Date());
  const dag = startVanDag(op);
  const verschil = Math.round((dag.getTime() - vandaag.getTime()) / 86400000);
  if (verschil === 0) return t('vandaag.vandaag');
  if (verschil === 1) return t('vandaag.morgen');
  return t('vandaag.aanstaande', { dag: dagNaam(dagIndex(op)) });
}

export default function VandaagScherm() {
  const { profiel, werkProfielBij } = useAuth();
  const { alarms, vernieuw: vernieuwAlarmen, eigenMap } = useAlarmen();
  const { sessies, statistiek, vernieuw, wachtend } = useSessies();
  const { allesInOrde } = useAlarmCheck();
  const { t, locale } = useTaal();
  const voornaam = profiel?.voornaam ?? '';

  const nu = useNu();
  const overzicht = vorigeWeek(sessies, nu);
  const weekSleutel = dagSleutel(overzicht.weekStart);
  // Weekoverzicht op maandag en dinsdag, tot je het wegtikt
  const [gezien, setGezien] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    leesLokaal<string>(SLEUTELS.weekoverzichtGezien).then(setGezien);
  }, []);
  const toonOverzicht =
    gezien !== undefined && gezien !== weekSleutel && dagIndex(nu) <= 1 && overzicht.missies > 0;
  const hervat = hervatOp(profiel?.pauze_tot, nu);
  // Tijdens een pauze is het eerstvolgende alarm het eerste na de pauze
  const volgend = volgendAlarm(alarms, hervat ? new Date(hervat.getTime() - 1) : nu);
  const missie = missieInfos(
    volgend
      ? missiesVanDag(volgend.alarm.oefeningen, volgend.alarm.wisselend, volgend.op)
      : STANDAARD_MISSIE,
    eigenMap,
    volgend?.alarm.doelen,
  );
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
          <Text style={styles.helloName}>{t('vandaag.groet', { naam: voornaam })}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('vandaag.profielOpenen')}
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
          <Text style={styles.streakToplineText}>{t('vandaag.jouwStreak')}</Text>
          <View style={styles.flameTag}>
            <Icon name="flame" color={kleuren.lime} />
          </View>
        </View>
        <View style={styles.streakRow}>
          <Text maxFontSizeMultiplier={1.2} style={styles.streakCount}>
            {statistiek.streak}
          </Text>
          <Text style={styles.streakSmall}>
            {statistiek.streak === 1 ? t('vandaag.dag') : t('vandaag.dagen')}
          </Text>
        </View>
        <Text style={styles.streakSub}>
          {statistiek.streak > 0 ? t('vandaag.streakBezig') : t('vandaag.streakStart')}
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.sparkle}>
          ✳
        </Text>
      </View>

      {toonOverzicht && (
        <View style={styles.week} accessibilityRole="summary">
          <View style={styles.flex}>
            <Text style={styles.weekKicker}>{t('vandaag.vorigeWeek')}</Text>
            <Text style={styles.weekTekst}>
              {overzicht.actieveDagen === 1
                ? t('vandaag.weekDag')
                : t('vandaag.weekDagen', { n: overzicht.actieveDagen })}{' '}
              · {missiesTekst(overzicht.missies)} · {t('vandaag.reps', { n: overzicht.reps })}
            </Text>
            <Text style={styles.weekSub}>
              {overzicht.actieveDagen >= (profiel?.weekdoel ?? 7)
                ? t('vandaag.weekdoelGehaald')
                : t('vandaag.nieuweWeek')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('vandaag.weekoverzichtSluiten')}
            hitSlop={10}
            onPress={() => {
              setGezien(weekSleutel);
              schrijfLokaal(SLEUTELS.weekoverzichtGezien, weekSleutel);
            }}
          >
            <Icon name="close" size={16} color={kleuren.paper} />
          </Pressable>
        </View>
      )}

      <SectionTitleRow
        titel={t('vandaag.volgendeAlarm')}
        rechts={
          <Pressable onPress={() => router.navigate('/alarmen')} hitSlop={8}>
            <Text style={styles.textLink}>{t('vandaag.alleAlarmen')}</Text>
          </Pressable>
        }
      />
      {hervat && (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('vandaag.pauzeHint')}
          onPress={() => werkProfielBij({ pauze_tot: null })}
          style={styles.pauze}
        >
          <Icon name="calendar" size={17} color={kleuren.ink} />
          <Text style={styles.pauzeTekst}>
            <Text style={styles.insightStrong}>{t('vandaag.pauzeTitel')}</Text>{' '}
            {t('vandaag.pauzeTekst', {
              datum: hervat.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }),
            })}
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
                {dagenTekst(volgend.alarm.dagen).toLocaleUpperCase(locale)}
              </Text>
            </View>
            <View style={styles.pillLabel}>
              <Text style={styles.pillLabelText}>
                {niveauNaam(volgend.alarm.niveau).toLocaleUpperCase(locale)}
              </Text>
            </View>
          </View>
          <Text style={styles.alarmSub}>{volgend.alarm.naam}</Text>
          <Text style={styles.alarmCaption}>
            {missiesTekst(missie.length)} · {wanneerTekst(volgend.op, t)}
            {volgend.op.getTime() - nu.getTime() < 86400000
              ? ` · ${t('vandaag.over', { tijd: tijdTot(volgend.op, nu) })}`
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
          <Text style={styles.alarmSub}>{t('vandaag.geenAlarm')}</Text>
          <Text style={styles.alarmCaption}>{t('vandaag.geenAlarmTekst')}</Text>
          <View style={styles.alarmShape}>
            <Text maxFontSizeMultiplier={1.2} style={styles.alarmShapeArrow}>
              ↗
            </Text>
          </View>
        </Pressable>
      )}

      <SectionTitleRow
        titel={t('vandaag.ochtendmissie')}
        rechts={t(missie.length === 1 ? 'vandaag.stap' : 'vandaag.stappen', {
          n: String(missie.length).padStart(2, '0'),
        })}
      />
      <View style={styles.missionList}>
        {missie.map((m, i) => (
          <View
            key={`${m.id}-${i}`}
            style={[styles.missionRow, i === missie.length - 1 && styles.missionRowLast]}
          >
            <Text style={styles.missionIndex}>{String(i + 1).padStart(2, '0')}</Text>
            <View style={styles.missionEmoji}>
              <Text style={styles.missionEmojiText}>{m.emoji}</Text>
            </View>
            <View>
              <Text style={styles.missionName}>{m.naam}</Text>
              <Text style={styles.missionDetail}>{m.doelTekst}</Text>
            </View>
            <View style={[styles.missionCheck, vandaagKlaar && styles.missionCheckKlaar]}>
              <Icon name="check" size={13} color={vandaagKlaar ? kleuren.ink : '#C1CEC0'} />
            </View>
          </View>
        ))}
      </View>

      <PrimaryButton
        label={vandaagKlaar ? t('vandaag.missieOpnieuw') : t('vandaag.missieStart')}
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
                <Text style={styles.insightStrong}>Ready to go.</Text> {t('vandaag.checkInOrde')}
              </>
            ) : (
              <>
                <Text style={styles.insightStrong}>{t('vandaag.letOp')}</Text>{' '}
                {t('vandaag.checkAfronden')}
              </>
            )}
          </Text>
        </Pressable>
      )}
      {wachtend > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('vandaag.wachtHint')}
          onPress={() => vernieuw()}
          style={styles.insight}
        >
          <Icon name="activity" size={17} color="#5F6E60" />
          <Text style={styles.insightText}>
            <Text style={styles.insightStrong}>
              {wachtend === 1 ? t('vandaag.wachtEen') : t('vandaag.wachtMeer', { n: wachtend })}
            </Text>{' '}
            {t('vandaag.wachtTekst')}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  week: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: kleuren.ink,
    borderRadius: 19,
    padding: 16,
    marginBottom: 14,
  },
  weekKicker: { fontFamily: fonts.body800, fontSize: 10, letterSpacing: 1.4, color: kleuren.lime },
  weekTekst: { fontFamily: fonts.body800, fontSize: 15, color: kleuren.paper, marginTop: 6 },
  weekSub: { fontFamily: fonts.body400, fontSize: 12, color: '#B2C2B0', marginTop: 4 },
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
  // Lange dagnamen (bijv. Frans) mogen afbreken; het niveaulabel blijft altijd zichtbaar
  alarmTimeRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  alarmTime: {
    fontFamily: fonts.head700,
    fontSize: 47,
    lineHeight: 45,
    letterSpacing: em(-0.075, 47),
    color: kleuren.ink,
  },
  alarmTimeSmall: {
    flex: 1,
    fontFamily: fonts.body800,
    fontSize: 11,
    color: '#637566',
    marginLeft: 10,
  },
  pillLabel: {
    flexShrink: 0,
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
