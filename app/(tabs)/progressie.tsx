import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { maakStijlen, useKleuren } from '@/hooks/useThema';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useGedeeld, RoundPlus, ScreenHeader, SectionTitleRow } from '@/components/ui';
import { dagLetter } from '@/constants/alarm';
import { em, fonts } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { toonPremium, usePremium } from '@/hooks/usePremium';
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
  const styles = useStyles();
  const gedeeld = useGedeeld();
  const kl = useKleuren();
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

  const toegang = usePremium();
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
      {s.streak > 0 && (
        <View style={styles.joker} accessible>
          <Text style={styles.jokerTitel}>{t('progressie.jokerTitel')}</Text>
          <Text style={styles.jokerTekst}>
            {s.jokerGebruiktOp
              ? t('progressie.jokerGebruikt', {
                  datum: s.jokerGebruiktOp.toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                  }),
                })
              : t('progressie.jokerBeschikbaar')}
          </Text>
        </View>
      )}
      {s.aantalVoltooid > 0 && toegang.volledigeVoortgang && (
        <View style={styles.joker} accessible>
          <Text style={styles.jokerTitel}>{t('progressie.gevoel.titel')}</Text>
          <Text style={styles.jokerTekst}>
            {s.gevoel.some((n) => n > 0)
              ? t('progressie.gevoel.tekst')
              : t('progressie.gevoel.leeg')}
          </Text>
          {s.gevoel.some((n) => n > 0) && (
            <View style={styles.gevoelRij}>
              {(
                [
                  ['💪', 'missie.klaar.gevoel.sterk', s.gevoel[2]],
                  ['🙂', 'missie.klaar.gevoel.oke', s.gevoel[1]],
                  ['😴', 'missie.klaar.gevoel.moe', s.gevoel[0]],
                ] as const
              ).map(([emoji, sleutel, n]) => (
                <View key={sleutel} style={styles.gevoelVak}>
                  <Text style={styles.gevoelEmoji}>{emoji}</Text>
                  <Text style={styles.gevoelAantal}>{n}×</Text>
                  <Text style={styles.gevoelLabel}>{t(sleutel)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
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
      {!toegang.volledigeVoortgang && (
        <Pressable
          accessibilityRole="button"
          onPress={() => toonPremium('voortgang')}
          style={styles.joker}
        >
          <Text style={styles.jokerTitel}>🔒 {t('premium.naam')}</Text>
          <Text style={styles.jokerTekst}>{t('premium.slot.voortgang')}</Text>
        </Pressable>
      )}
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
                  <Icon name="lock" size={10} color={kl.opDonker} strokeWidth={2.2} />
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

const useStyles = maakStijlen((k) =>
  StyleSheet.create({
    joker: {
      backgroundColor: k.white,
      borderWidth: 1,
      borderColor: k.line,
      borderRadius: 18,
      padding: 14,
      marginTop: 12,
    },
    gevoelRij: { flexDirection: 'row', gap: 8, marginTop: 12 },
    gevoelVak: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: k.paper,
      borderRadius: 14,
      paddingVertical: 10,
    },
    gevoelEmoji: { fontSize: 20 },
    gevoelAantal: { fontFamily: fonts.head700, fontSize: 20, color: k.ink, marginTop: 2 },
    gevoelLabel: { fontFamily: fonts.body600, fontSize: 11, color: k.tint('#5F6E60') },
    jokerTitel: { fontFamily: fonts.body800, fontSize: 12, color: k.ink },
    jokerTekst: {
      fontFamily: fonts.body400,
      fontSize: 11,
      lineHeight: 16,
      color: k.tint('#5F6E60'),
      marginTop: 4,
    },
    hero: { backgroundColor: k.lime, borderRadius: 24, padding: 23, overflow: 'hidden' },
    heroEyebrow: {
      fontFamily: fonts.body800,
      fontSize: 10,
      letterSpacing: em(0.12, 10),
      color: k.opLime,
    },
    heroTitle: {
      fontFamily: fonts.head700,
      fontSize: 47,
      lineHeight: 46,
      letterSpacing: em(-0.075, 47),
      color: k.opLime,
      marginTop: 22,
      marginBottom: 12,
    },
    heroAccent: { color: '#587E34' },
    heroText: {
      fontFamily: fonts.body400,
      fontSize: 11,
      lineHeight: 16,
      maxWidth: 210,
      color: k.opLime,
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
      backgroundColor: k.white,
      borderWidth: 1,
      borderColor: k.line,
      borderRadius: 18,
      padding: 17,
    },
    metricValue: {
      fontFamily: fonts.head700,
      fontSize: 34,
      lineHeight: 43,
      letterSpacing: em(-0.07, 34),
      color: k.ink,
    },
    metricUnit: { fontSize: 20 },
    metricLabel: { fontFamily: fonts.body700, fontSize: 10, color: k.tint('#5F6E60') },
    metricChange: { fontFamily: fonts.body800, color: k.tint('#3F6E35') },
    weekly: {
      backgroundColor: k.white,
      borderWidth: 1,
      borderColor: k.line,
      borderRadius: 20,
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    weekdoel: { fontFamily: fonts.body600, fontSize: 10, color: k.tint('#3F6E35'), marginTop: 6 },
    weeklyTitle: { fontFamily: fonts.body700, fontSize: 11, color: k.ink },
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
      backgroundColor: k.vlak('#DAE5C5'),
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    },
    barActive: { backgroundColor: k.donkerVlak },
    barLabel: { fontFamily: fonts.body800, fontSize: 9, color: k.tint('#5F6E60') },
    heroMerk: {
      fontFamily: fonts.head700,
      fontSize: 15,
      color: k.opLime,
      marginTop: 12,
      opacity: 0.7,
    },
    deel: { alignSelf: 'flex-end', marginTop: 8, padding: 6 },
    deelTekst: { fontFamily: fonts.body800, fontSize: 12, color: k.ink },
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
    badgeBehaald: { backgroundColor: k.white, borderColor: k.rand('#C9E07A') },
    badgeOpen: { backgroundColor: k.vlak('#EEF0EA'), borderColor: 'transparent' },
    badgeRond: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    badgeRondAan: { backgroundColor: k.lime },
    badgeRondUit: { backgroundColor: k.vlak('#E0E4DB') },
    badgeEmoji: { fontSize: 26 },
    badgeEmojiUit: { opacity: 0.35 },
    badgeSlot: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: k.vlak('#5F6E60'),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: k.rand('#EEF0EA'),
    },
    badgeName: {
      fontFamily: fonts.head700,
      fontSize: 12,
      color: k.ink,
      textAlign: 'center',
    },
    badgeNameUit: { color: k.tint('#4F5D51') },
    badgeDetail: {
      fontFamily: fonts.body400,
      fontSize: 10,
      lineHeight: 13,
      color: k.tint('#5F6E60'),
      textAlign: 'center',
      marginTop: 2,
    },
    badgeTag: {
      marginTop: 8,
      backgroundColor: k.vlak('#EDF4D5'),
      borderRadius: 100,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    badgeTagTekst: { fontFamily: fonts.body800, fontSize: 9, color: k.tint('#3F6E35') },
    badgeVoortgang: { alignSelf: 'stretch', marginTop: 8, alignItems: 'center', gap: 4 },
    badgeBalk: {
      alignSelf: 'stretch',
      height: 5,
      borderRadius: 3,
      backgroundColor: k.vlak('#DDE2D8'),
      overflow: 'hidden',
    },
    badgeVulling: { height: 5, borderRadius: 3, backgroundColor: k.donkerVlak },
    badgeTeller: { fontFamily: fonts.body800, fontSize: 9, color: k.tint('#5F6E60') },
  }),
);
