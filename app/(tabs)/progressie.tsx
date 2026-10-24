import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, RoundPlus, ScreenHeader, SectionTitleRow } from '@/components/ui';
import { dagLetter } from '@/constants/alarm';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useSessies } from '@/hooks/useSessies';
import { useToast } from '@/hooks/useToast';
import { useTaal } from '@/i18n';
import { deelAlsAfbeelding } from '@/lib/delen';
import { badgesVoor } from '@/lib/statistiek';
import { dagIndex } from '@/lib/tijd';

// Korte maandnaam in de gekozen taal, bijvoorbeeld "OKT"
function maand(datum: Date, locale: string): string {
  return datum
    .toLocaleDateString(locale, { month: 'short' })
    .replace(/\./g, '')
    .toLocaleUpperCase(locale);
}

function weekLabel(start: Date, locale: string): string {
  const eind = new Date(start);
  eind.setDate(eind.getDate() + 6);
  if (start.getMonth() === eind.getMonth()) {
    return `${start.getDate()} – ${eind.getDate()} ${maand(eind, locale)}`;
  }
  return `${start.getDate()} ${maand(start, locale)} – ${eind.getDate()} ${maand(eind, locale)}`;
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
  const { t, locale } = useTaal();
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
        titel={t('progressie.titel')}
        puntKleur="#9BBF55"
        rechts={<RoundPlus icon="chart" />}
      />

      <View ref={kaart} collapsable={false} style={styles.hero}>
        <Text style={styles.heroEyebrow}>{t('progressie.momentum')}</Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.heroTitle}>
          {s.streak} {s.streak === 1 ? t('progressie.dag') : t('progressie.dagen')}
          {'\n'}
          <Text style={styles.heroAccent}>{s.streak > 0 ? 'ON FIRE.' : 'LET’S START.'}</Text>
        </Text>
        <Text style={styles.heroText}>
          {s.streak > 0 ? t('progressie.heroBezig') : t('progressie.heroStart')}
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
              s.streak === 1
                ? t('progressie.deelTekstDag')
                : t('progressie.deelTekstDagen', { n: s.streak }),
            ).catch(() => showToast(t('progressie.delenMislukt')))
          }
          style={styles.deel}
        >
          <Text style={styles.deelTekst}>{t('progressie.deelKnop')}</Text>
        </Pressable>
      )}

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {s.voltooidPercentage ?? '–'}
            {s.voltooidPercentage !== null && <Text style={styles.metricUnit}>%</Text>}
          </Text>
          <Text style={styles.metricLabel}>
            {t('progressie.missiesVoltooid')}{' '}
            <Text style={styles.metricChange}>{verschilTekst(s.voltooidVerschil, '%')}</Text>
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{s.repsDezeWeek}</Text>
          <Text style={styles.metricLabel}>
            {t('progressie.repsDezeWeek')}{' '}
            <Text style={styles.metricChange}>{verschilTekst(s.repsVerschil)}</Text>
          </Text>
        </View>
      </View>

      <SectionTitleRow titel={t('progressie.dezeWeek')} rechts={weekLabel(s.weekStart, locale)} />
      <View style={styles.weekly}>
        <View style={gedeeld.rowBetween}>
          <Text style={styles.weeklyTitle}>{t('progressie.beweegmomenten')}</Text>
          <Text style={gedeeld.sectionKicker}>{t('progressie.totaal', { n: s.weekTotaal })}</Text>
        </View>
        <Text style={styles.weekdoel}>
          {weekdoel === 1
            ? t('progressie.weekdoelDag', { actief: actieveDagenDezeWeek })
            : t('progressie.weekdoelDagen', { actief: actieveDagenDezeWeek, doel: weekdoel })}
          {actieveDagenDezeWeek >= weekdoel ? t('progressie.gehaald') : ''}
        </Text>
        <View style={styles.chart}>
          {s.weekBalken.map((waarde, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    { height: `${(waarde / hoogste) * 100}%` },
                    i === vandaag && styles.barActive,
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{dagLetter(i)}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionTitleRow
        titel={t('progressie.badges')}
        rechts={t('progressie.ontgrendeld', { n: ontgrendeld })}
      />
      <View style={styles.badgeRow}>
        {badges.map((b) => (
          <View
            key={b.id}
            accessible
            accessibilityLabel={
              b.behaald
                ? t('progressie.badge.a11yBehaald', { naam: b.naam, detail: b.detail })
                : t('progressie.badge.a11yVoortgang', {
                    naam: b.naam,
                    huidig: b.huidig,
                    doel: b.doel,
                  })
            }
            style={[styles.badge, b.behaald ? styles.badgeBehaald : styles.badgeOpen]}
          >
            <View style={[styles.badgeRond, b.behaald ? styles.badgeRondAan : styles.badgeRondUit]}>
              <Text style={[styles.badgeEmoji, !b.behaald && styles.badgeEmojiUit]}>{b.emoji}</Text>
              {!b.behaald && (
                <View style={styles.badgeSlot}>
                  <Icon name="lock" size={10} color={kleuren.white} strokeWidth={2.2} />
                </View>
              )}
            </View>
            <Text style={[styles.badgeName, !b.behaald && styles.badgeNameUit]} numberOfLines={2}>
              {b.naam}
            </Text>
            <Text style={styles.badgeDetail} numberOfLines={2}>
              {b.detail}
            </Text>
            {b.behaald ? (
              <View style={styles.badgeTag}>
                <Text style={styles.badgeTagTekst}>✓ {t('progressie.badge.behaald')}</Text>
              </View>
            ) : (
              <View style={styles.badgeVoortgang}>
                <View style={styles.badgeBalk}>
                  <View
                    style={[
                      styles.badgeVulling,
                      { width: `${Math.round((b.huidig / b.doel) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.badgeTeller}>
                  {b.huidig}/{b.doel}
                </Text>
              </View>
            )}
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
    maxWidth: 220,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeBehaald: { backgroundColor: kleuren.white, borderColor: '#C9E07A' },
  badgeOpen: { backgroundColor: '#EEF0EA', borderColor: 'transparent' },
  badgeRond: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeRondAan: { backgroundColor: kleuren.lime },
  badgeRondUit: { backgroundColor: '#E0E4DB' },
  badgeEmoji: { fontSize: 26 },
  badgeEmojiUit: { opacity: 0.35 },
  badgeSlot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5F6E60',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EEF0EA',
  },
  badgeName: {
    fontFamily: fonts.head700,
    fontSize: 12,
    color: kleuren.ink,
    textAlign: 'center',
  },
  badgeNameUit: { color: '#4F5D51' },
  badgeDetail: {
    fontFamily: fonts.body400,
    fontSize: 10,
    lineHeight: 13,
    color: '#5F6E60',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeTag: {
    marginTop: 8,
    backgroundColor: '#EDF4D5',
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeTagTekst: { fontFamily: fonts.body800, fontSize: 9, color: '#3F6E35' },
  badgeVoortgang: { alignSelf: 'stretch', marginTop: 8, alignItems: 'center', gap: 4 },
  badgeBalk: {
    alignSelf: 'stretch',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDE2D8',
    overflow: 'hidden',
  },
  badgeVulling: { height: 5, borderRadius: 3, backgroundColor: kleuren.ink },
  badgeTeller: { fontFamily: fonts.body800, fontSize: 9, color: '#5F6E60' },
});
