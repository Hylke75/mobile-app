import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { gedeeld, RoundPlus, ScreenHeader, SectionTitleRow } from '@/components/ui';
import { DAG_LETTERS, DAG_NAMEN } from '@/constants/alarm';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useSessies } from '@/hooks/useSessies';
import { useToast } from '@/hooks/useToast';
import { deelAlsAfbeelding } from '@/lib/delen';
import { badgesVoor } from '@/lib/statistiek';
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
  const { statistiek, vernieuw } = useSessies();
  const { showToast } = useToast();
  const kaart = useRef<ComponentRef<typeof View>>(null);
  const { profiel } = useAuth();
  const s = statistiek;
  const weekdoel = profiel?.weekdoel ?? 7;
  const actieveDagenDezeWeek = s.weekBalken.filter((w) => w > 0).length;
  const hoogste = Math.max(...s.weekBalken, 1);
  const vandaag = dagIndex(new Date());

  const badges = badgesVoor(s);
  const ontgrendeld = badges.filter((b) => b.behaald).length;

  return (
    <Screen onRefresh={vernieuw}>
      <ScreenHeader
        kicker="SHOW UP. LEVEL UP."
        titel="Progressie"
        puntKleur="#9BBF55"
        rechts={<RoundPlus icon="chart" />}
      />

      <View ref={kaart} collapsable={false} style={styles.hero}>
        <Text style={styles.heroEyebrow}>JOUW MOMENTUM ↗</Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.heroTitle}>
          {s.streak} {s.streak === 1 ? 'DAG' : 'DAGEN'}
          {'\n'}
          <Text style={styles.heroAccent}>{s.streak > 0 ? 'ON FIRE.' : 'LET’S START.'}</Text>
        </Text>
        <Text style={styles.heroText}>
          {s.streak > 0
            ? 'Elke beweging telt. Je bouwt een routine die blijft hangen.'
            : 'Rond een missie af om je streak te starten.'}
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.starburst}>
          ✳
        </Text>
        <Text style={styles.heroMerk}>mooove.</Text>
      </View>
      {s.streak > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            deelAlsAfbeelding(
              kaart,
              `${s.streak} ${s.streak === 1 ? 'dag' : 'dagen'} op rij in beweging met Mooove 🔥`,
            ).catch(() => showToast('Delen is niet gelukt.'))
          }
          style={styles.deel}
        >
          <Text style={styles.deelTekst}>Deel je streak ↗</Text>
        </Pressable>
      )}

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
        <Text style={styles.weekdoel}>
          {actieveDagenDezeWeek} van {weekdoel} {weekdoel === 1 ? 'dag' : 'dagen'} van je weekdoel
          {actieveDagenDezeWeek >= weekdoel ? ' · gehaald! 🎉' : ''}
        </Text>
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
  metricLabel: { fontFamily: fonts.body700, fontSize: 10, color: '#5F6E60' },
  metricChange: { fontFamily: fonts.body800, color: '#3F6E35' },
  weekly: {
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  weekdoel: { fontFamily: fonts.body600, fontSize: 10, color: '#3F6E35', marginTop: 6 },
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
  barLabel: { fontFamily: fonts.body800, fontSize: 9, color: '#5F6E60' },
  heroMerk: {
    fontFamily: fonts.head700,
    fontSize: 15,
    color: kleuren.ink,
    marginTop: 12,
    opacity: 0.7,
  },
  deel: { alignSelf: 'flex-end', marginTop: 8, padding: 6 },
  deelTekst: { fontFamily: fonts.body800, fontSize: 12, color: kleuren.ink },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    flexBasis: '30%',
    flexGrow: 1,
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
  badgeDetail: { fontFamily: fonts.body400, fontSize: 9, color: '#5F6E60', textAlign: 'center' },
});
