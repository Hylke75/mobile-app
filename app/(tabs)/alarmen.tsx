import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { maakStijlen, useKleuren } from '@/hooks/useThema';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { LevelTag, RoundPlus, ScreenHeader, Toggle } from '@/components/ui';
import { em, fonts } from '@/constants/theme';
import { dagenTekst, missiesTekst } from '@/constants/alarm';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useNu } from '@/hooks/useNu';
import { isOvergeslagen, tijdTot, volgendeKeer, volgendeOverslaanDatum } from '@/lib/tijd';
import { useToast } from '@/hooks/useToast';
import { useTaal } from '@/i18n';

export default function AlarmenScherm() {
  const styles = useStyles();
  const kl = useKleuren();
  const { alarms, geladen, fout, wisselAan, slaOver, vernieuw } = useAlarmen();
  const { showToast } = useToast();
  const nu = useNu();
  const { t, locale } = useTaal();
  const datumTekst = (sleutel: string) => {
    const [j, m, d] = sleutel.split('-').map(Number);
    return new Date(j!, m! - 1, d!).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const wisselOverslaan = async (id: string, naam: string, datum: string | null) => {
    const melding = await slaOver(id, datum);
    if (melding) return showToast(melding);
    if (datum) showToast(t('alarmen.overslaanToast', { naam, datum: datumTekst(datum) }));
  };
  const nieuwAlarm = () => router.push('/nieuw-alarm');

  const wissel = async (id: string) => {
    const melding = await wisselAan(id);
    if (melding) showToast(melding);
  };

  return (
    <Screen onRefresh={vernieuw}>
      <ScreenHeader
        kicker="STAY CONSISTENT"
        titel={t('alarmen.titel')}
        puntKleur="#8EB64F"
        rechts={<RoundPlus onPress={nieuwAlarm} label={t('alarmen.nieuwAlarm')} />}
      />
      <Text style={styles.description}>{t('alarmen.beschrijving')}</Text>

      {fout && <Text style={styles.fout}>{fout}</Text>}
      {geladen && alarms.length === 0 && <Text style={styles.leeg}>{t('alarmen.leeg')}</Text>}

      {alarms.map((a) => {
        const op = volgendeKeer(a, nu);
        const overgeslagen = a.aan && isOvergeslagen(a, nu) ? a.overslaanOp! : null;
        const teOverslaan = a.aan && !overgeslagen ? volgendeOverslaanDatum(a, nu) : null;
        return (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={t('alarmen.bewerken', { naam: a.naam, tijd: a.tijd })}
            onPress={() => router.push({ pathname: '/nieuw-alarm', params: { id: a.id } })}
            style={[styles.card, !a.aan && styles.cardDisabled]}
          >
            <View style={styles.cardHead}>
              <Text maxFontSizeMultiplier={1.2} style={styles.time}>
                {a.tijd}
              </Text>
              <Toggle
                on={a.aan}
                onPress={() => wissel(a.id)}
                label={t(a.aan ? 'alarmen.uitschakelen' : 'alarmen.inschakelen', { naam: a.naam })}
              />
            </View>
            <Text style={styles.name}>{a.naam}</Text>
            <Text style={styles.days}>
              {dagenTekst(a.dagen)}
              {op ? ` · ${t('alarmen.over', { tijd: tijdTot(op, nu) })}` : ''}
            </Text>
            <View style={styles.footer}>
              <LevelTag level={a.niveau} />
              <Text style={styles.count}>{missiesTekst(a.oefeningen.length)}</Text>
            </View>
            {overgeslagen && (
              <View style={styles.overslaanRij}>
                <Text style={styles.overgeslagen}>
                  {t('alarmen.overgeslagen', { datum: datumTekst(overgeslagen) })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('alarmen.herstelA11y', {
                    naam: a.naam,
                    datum: datumTekst(overgeslagen),
                  })}
                  hitSlop={8}
                  onPress={() => wisselOverslaan(a.id, a.naam, null)}
                >
                  <Text style={styles.overslaanKnop}>{t('alarmen.herstel')}</Text>
                </Pressable>
              </View>
            )}
            {teOverslaan && (
              <View style={styles.overslaanRij}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('alarmen.overslaanA11y', {
                    naam: a.naam,
                    datum: datumTekst(teOverslaan),
                  })}
                  hitSlop={8}
                  onPress={() => wisselOverslaan(a.id, a.naam, teOverslaan)}
                >
                  <Text style={styles.overslaanKnop}>{t('alarmen.overslaan')}</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        );
      })}

      <View style={styles.banner}>
        <View style={styles.flex}>
          <Text style={styles.bannerTitle}>{t('alarmen.bannerTitel')}</Text>
          <Text style={styles.bannerText}>{t('alarmen.bannerTekst')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('alarmen.maakAlarm')}
          onPress={nieuwAlarm}
          style={styles.bannerBtn}
        >
          <Icon name="plus" color={kl.opLime} />
        </Pressable>
      </View>
    </Screen>
  );
}

const useStyles = maakStijlen((k) =>
  StyleSheet.create({
    flex: { flex: 1 },
    description: {
      fontFamily: fonts.body400,
      fontSize: 12,
      color: k.tint('#5F6E60'),
      lineHeight: 18,
      marginTop: -7,
      marginBottom: 20,
    },
    card: {
      borderRadius: 20,
      backgroundColor: k.white,
      borderWidth: 1,
      borderColor: k.line,
      padding: 16,
      marginBottom: 11,
    },
    cardDisabled: { opacity: 0.58 },
    fout: { fontFamily: fonts.body600, fontSize: 12, color: k.tint('#C2462F'), marginBottom: 12 },
    leeg: { fontFamily: fonts.body400, fontSize: 12, color: k.tint('#5F6E60'), marginBottom: 12 },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    time: {
      fontFamily: fonts.head700,
      fontSize: 43,
      lineHeight: 43,
      letterSpacing: em(-0.075, 43),
      color: k.ink,
    },
    name: { fontFamily: fonts.body800, fontSize: 13, marginTop: 7, color: k.ink },
    days: { fontFamily: fonts.body400, fontSize: 10, color: k.tint('#5F6E60'), marginTop: 3 },
    footer: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 15 },
    overslaanRij: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 12,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor: k.line,
    },
    overgeslagen: { flex: 1, fontFamily: fonts.body600, fontSize: 11, color: k.tint('#8A5A14') },
    overslaanKnop: { fontFamily: fonts.body800, fontSize: 11, color: k.tint('#3F6B2A') },
    count: {
      fontFamily: fonts.body400,
      fontSize: 10,
      color: k.tint('#5F6E60'),
      marginLeft: 'auto',
    },
    banner: {
      backgroundColor: k.donkerVlak,
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
    },
    bannerTitle: { fontFamily: fonts.head700, fontSize: 16, color: k.opDonker },
    bannerText: {
      fontFamily: fonts.body400,
      fontSize: 11,
      color: k.tint('#B4C0B4'),
      marginTop: 5,
      maxWidth: 210,
    },
    bannerBtn: {
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: k.lime,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
);
