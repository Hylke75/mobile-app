import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { fonts } from '@/constants/theme';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { toonPremium, usePremium } from '@/hooks/usePremium';
import { useSessies } from '@/hooks/useSessies';
import { maakStijlen } from '@/hooks/useThema';
import { useTaal } from '@/i18n';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';

// Melding over de proefperiode op Vandaag: dag 1, 7, 11–13, 14 en daarna
function meldingVoor(fase: string, dag: number | null, heeftAlarm: boolean): string | null {
  if (fase === 'proefNietGestart') return heeftAlarm ? null : 'nietGestart';
  if (fase === 'gratis') return 'voorbij';
  if (fase !== 'proef' || dag === null) return null;
  if (dag === 1) return 'dag1';
  if (dag === 7) return 'dag7';
  if (dag >= 11 && dag <= 13) return 'dag11';
  if (dag >= 14) return 'dag14';
  return null;
}

export function ProefBanner() {
  const styles = useStyles();
  const { t, locale } = useTaal();
  const toegang = usePremium();
  const { profiel } = useAuth();
  const { alarms } = useAlarmen();
  const { sessies } = useSessies();
  const [weggetikt, setWeggetikt] = useState<string | null | undefined>(undefined);

  const soort = meldingVoor(toegang.fase, toegang.proefDag, alarms.length > 0);
  // Eén sleutel per melding en dag, zodat wegtikken alleen deze melding verbergt
  const sleutel = soort ? `${soort}:${toegang.proefDag ?? ''}` : null;

  useEffect(() => {
    leesLokaal<string>(SLEUTELS.proefMelding).then(setWeggetikt);
  }, []);

  // De eerste keer na de proef: uitleggen wat er verandert (alarmen blijven afgaan)
  useEffect(() => {
    if (toegang.fase !== 'gratis') return;
    let actief = true;
    leesLokaal<boolean>(SLEUTELS.proefOvergang).then((gezien) => {
      if (!actief || gezien) return;
      schrijfLokaal(SLEUTELS.proefOvergang, true);
      const titel = t('premium.overgang.titel');
      const tekst = t('premium.overgang.tekst');
      if (Platform.OS === 'web') window.alert(`${titel}\n\n${tekst}`);
      else
        Alert.alert(titel, tekst, [
          { text: t('premium.later'), style: 'cancel' },
          { text: t('premium.banner.knop'), onPress: () => toonPremium() },
        ]);
    });
    return () => {
      actief = false;
    };
  }, [toegang.fase, t]);

  if (toegang.premium || !soort || weggetikt === undefined || weggetikt === sleutel) return null;

  const start = profiel?.proef_start ? new Date(profiel.proef_start).getTime() : 0;
  const tekst =
    soort === 'dag1' && toegang.proefEinde
      ? t('premium.banner.dag1', {
          datum: new Date(toegang.proefEinde.getTime() - 86400000).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
          }),
        })
      : soort === 'dag7'
        ? t('premium.banner.dag7', {
            n: sessies.filter((s) => s.status === 'voltooid' && s.afgerondOp.getTime() >= start)
              .length,
            dagen: toegang.dagenOver ?? 0,
          })
        : soort === 'dag11'
          ? t('premium.banner.dag11', { dagen: toegang.dagenOver ?? 0 })
          : t(`premium.banner.${soort as 'nietGestart' | 'dag14' | 'voorbij'}`);

  const wegtikken = () => {
    if (!sleutel) return;
    setWeggetikt(sleutel);
    schrijfLokaal(SLEUTELS.proefMelding, sleutel);
  };

  return (
    <View style={styles.kaart} accessibilityRole="summary">
      <View style={styles.flex}>
        <Text style={styles.kicker}>{t('premium.kicker')}</Text>
        <Text style={styles.tekst}>{tekst}</Text>
        {soort !== 'nietGestart' && (
          <Pressable accessibilityRole="button" onPress={() => toonPremium()} style={styles.knop}>
            <Text style={styles.knopTekst}>{t('premium.banner.knop')}</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('premium.later')}
        onPress={wegtikken}
        hitSlop={10}
      >
        <Icon name="close" size={16} color="#B2C2B0" />
      </Pressable>
    </View>
  );
}

const useStyles = maakStijlen((k) =>
  StyleSheet.create({
    flex: { flex: 1 },
    kaart: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: k.donkerVlak,
      borderRadius: 19,
      padding: 16,
      marginBottom: 14,
    },
    kicker: { fontFamily: fonts.body800, fontSize: 10, letterSpacing: 1.4, color: k.lime },
    tekst: {
      fontFamily: fonts.body600,
      fontSize: 14,
      lineHeight: 20,
      color: k.opDonker,
      marginTop: 6,
    },
    knop: {
      alignSelf: 'flex-start',
      backgroundColor: k.lime,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginTop: 10,
    },
    knopTekst: { fontFamily: fonts.body800, fontSize: 12, color: k.opLime },
  }),
);
