import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { LevelTag, RoundPlus, ScreenHeader, Toggle } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { dagenTekst, missiesTekst } from '@/constants/alarm';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useNu } from '@/hooks/useNu';
import { tijdTot, volgendeKeer } from '@/lib/tijd';
import { useToast } from '@/hooks/useToast';
import { useTaal } from '@/i18n';

export default function AlarmenScherm() {
  const { alarms, geladen, fout, wisselAan, vernieuw } = useAlarmen();
  const { showToast } = useToast();
  const nu = useNu();
  const { t } = useTaal();
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
          <Icon name="plus" color={kleuren.ink} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  description: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: '#5F6E60',
    lineHeight: 18,
    marginTop: -7,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    padding: 16,
    marginBottom: 11,
  },
  cardDisabled: { opacity: 0.58 },
  fout: { fontFamily: fonts.body600, fontSize: 12, color: '#C2462F', marginBottom: 12 },
  leeg: { fontFamily: fonts.body400, fontSize: 12, color: '#5F6E60', marginBottom: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: {
    fontFamily: fonts.head700,
    fontSize: 43,
    lineHeight: 43,
    letterSpacing: em(-0.075, 43),
    color: kleuren.ink,
  },
  name: { fontFamily: fonts.body800, fontSize: 13, marginTop: 7, color: kleuren.ink },
  days: { fontFamily: fonts.body400, fontSize: 10, color: '#5F6E60', marginTop: 3 },
  footer: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 15 },
  count: { fontFamily: fonts.body400, fontSize: 10, color: '#5F6E60', marginLeft: 'auto' },
  banner: {
    backgroundColor: kleuren.ink,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  bannerTitle: { fontFamily: fonts.head700, fontSize: 16, color: kleuren.white },
  bannerText: {
    fontFamily: fonts.body400,
    fontSize: 11,
    color: '#B4C0B4',
    marginTop: 5,
    maxWidth: 210,
  },
  bannerBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: kleuren.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
