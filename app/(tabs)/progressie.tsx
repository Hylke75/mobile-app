import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { gedeeld, RoundPlus, ScreenHeader, SectionTitleRow } from '@/components/ui';
import { DAG_LETTERS, DAG_NAMEN } from '@/constants/alarm';
import { em, fonts, kleuren } from '@/constants/theme';
import { useSessies } from '@/hooks/useSessies';
import { dagIndex } from '@/lib/tijd';

const MAANDEN = [
  'JAN',
  'FEB',
  'MRT',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OKT',
  'NOV',
  'DEC',
];

function weekLabel(start: Date): string {
  const eind = new Date(start);
  eind.setDate(eind.getDate() + 6);
  if (start.getMonth() === eind.getMonth()) {
    return `${start.getDate()} – ${eind.getDate()} ${MAANDEN[eind.getMonth()]}`;
  }
  return `${start.getDate()} ${MAANDEN[start.getMonth()]} – ${eind.getDate()} ${MAANDEN[eind.getMonth()]}`;
}

function verschilTekst(waarde: number | null, eenheid = ''): string | null {
  if (waarde === null || waarde === 0) return null;
  return `${waarde > 0 ? '↗ +' : '↘ '}${waarde}${eenheid}`;
}

export default function ProgressieScherm() {
  const { statistiek } = useSessies();
  const s = statistiek;
  const hoogste = Math.max(...s.weekBalken, 1);
  const vandaag = dagIndex(new Date());

  const badges = [
    { emoji: '⚡', naam: 'Early mover', detail: '5 vroege starts', behaald: s.vroegeStarts >= 5 },
    {
      emoji: '🔥',
      naam: 'Streak master',
      detail: '10 dagen op rij',
      behaald: s.langsteStreak >= 10,
    },
    { emoji: '🏆', naam: 'Legend', detail: '30 dagen op rij', behaald: s.langsteStreak >= 30 },
  ];
  const ontgrendeld = badges.filter((b) => b.behaald).length;

  return (
    <Screen>
      <ScreenHeader
        kicker="SHOW UP. LEVEL UP."
        titel="Progressie"
        puntKleur="#9BBF55"
        rechts={<RoundPlus icon="chart" />}
      />

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>JOUW MOMENTUM ↗</Text>
        <Text style={styles.heroTitle}>
          {s.streak} {s.streak === 1 ? 'DAG' : 'DAGEN'}
          {'\n'}
          <Text style={styles.heroAccent}>{s.streak > 0 ? 'ON FIRE.' : 'LET’S START.'}</Text>
        </Text>
        <Text style={styles.heroText}>
          {s.streak > 0
            ? 'Elke beweging telt. Je bouwt een routine die blijft hangen.'
            : 'Rond een missie af om je streak te starten.'}
        </Text>
        <Text style={styles.starburst}>✳</Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {s.voltooidPercentage ?? '–'}
            {s.voltooidPercentage !== null && <Text style={styles.metricUnit}>%</Text>}
          </Text>
          <Text style={styles.metricLabel}>
            Missies voltooid{' '}
            <Text style={styles.metricChange}>{verschilTekst(s.voltooidVerschil, '%')}</Text>
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{s.repsDezeWeek}</Text>
          <Text style={styles.metricLabel}>
            Reps deze week <Text style={styles.metricChange}>{verschilTekst(s.repsVerschil)}</Text>
          </Text>
        </View>
      </View>

      <SectionTitleRow titel="Deze week" rechts={weekLabel(s.weekStart)} />
      <View style={styles.weekly}>
        <View style={gedeeld.rowBetween}>
          <Text style={styles.weeklyTitle}>Beweegmomenten</Text>
          <Text style={gedeeld.sectionKicker}>TOTAAL {s.weekTotaal}</Text>
        </View>
        <View style={styles.chart}>
          {s.weekBalken.map((waarde, i) => (
            <View key={DAG_NAMEN[i]} style={styles.barCol}>
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    { height: `${(waarde / hoogste) * 100}%` },
                    i === vandaag && styles.barActive,
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{DAG_LETTERS[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionTitleRow titel="Badges" rechts={`${ontgrendeld} ONTGRENDELD`} />
      <View style={styles.badgeRow}>
        {badges.map((b) => (
          <View key={b.naam} style={[styles.badge, !b.behaald && styles.badgeLocked]}>
            <Text style={styles.badgeEmoji}>{b.emoji}</Text>
            <Text style={styles.badgeName}>{b.naam}</Text>
            <Text style={styles.badgeDetail}>{b.detail}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: kleuren.lime, borderRadius: 24, padding: 23, overflow: 'hidden' },
  heroEyebrow: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.12, 10),
    color: kleuren.ink,
  },
  heroTitle: {
    fontFamily: fonts.head700,
    fontSize: 47,
    lineHeight: 46,
    letterSpacing: em(-0.075, 47),
    color: kleuren.ink,
    marginTop: 22,
    marginBottom: 12,
  },
  heroAccent: { color: '#587E34' },
  heroText: {
    fontFamily: fonts.body400,
    fontSize: 11,
    lineHeight: 16,
    maxWidth: 210,
    color: kleuren.ink,
  },
  starburst: {
    position: 'absolute',
    right: 12,
    top: 36,
    fontSize: 96,
    color: '#80A844',
    transform: [{ rotate: '14deg' }],
  },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metric: {
    flex: 1,
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 18,
    padding: 17,
  },
  metricValue: {
    fontFamily: fonts.head700,
    fontSize: 34,
    lineHeight: 43,
    letterSpacing: em(-0.07, 34),
    color: kleuren.ink,
  },
  metricUnit: { fontSize: 20 },
  metricLabel: { fontFamily: fonts.body700, fontSize: 10, color: '#798679' },
  metricChange: { fontFamily: fonts.body800, color: '#538A47' },
  weekly: {
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  weeklyTitle: { fontFamily: fonts.body700, fontSize: 11, color: kleuren.ink },
  chart: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 18,
    marginHorizontal: 4,
    marginBottom: 2,
  },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 7 },
  barArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    maxWidth: 29,
    minHeight: 8,
    backgroundColor: '#DAE5C5',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  barActive: { backgroundColor: kleuren.ink },
  barLabel: { fontFamily: fonts.body800, fontSize: 9, color: '#849286' },
  badgeRow: { flexDirection: 'row', gap: 10 },
  badge: {
    flex: 1,
    backgroundColor: '#E8ECE2',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  badgeLocked: { opacity: 0.45 },
  badgeEmoji: { fontSize: 28 },
  badgeName: {
    fontFamily: fonts.head700,
    fontSize: 11,
    marginTop: 7,
    color: kleuren.ink,
    textAlign: 'center',
  },
  badgeDetail: { fontFamily: fonts.body400, fontSize: 9, color: '#8D998B', textAlign: 'center' },
});
