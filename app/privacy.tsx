import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { maakStijlen, useKleuren } from '@/hooks/useThema';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useGedeeld, ScreenHeader } from '@/components/ui';
import { privacyBijgewerkt, privacyverklaring } from '@/constants/privacyverklaring';
import { fonts } from '@/constants/theme';
import { useTaal } from '@/i18n';

export default function PrivacyScherm() {
  const styles = useStyles();
  const gedeeld = useGedeeld();
  const kl = useKleuren();
  const { t, locale } = useTaal();
  const voorrang = t('privacy.voorrang');

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={gedeeld.backLink}
      >
        <Icon name="chevron" color={kl.ink} />
        <Text style={gedeeld.backLinkText}>{t('algemeen.terug')}</Text>
      </Pressable>
      <ScreenHeader kicker={t('privacy.kicker')} titel={t('privacy.titel')} puntKleur="#91B755" />
      <Text style={styles.bijgewerkt}>
        {t('privacy.bijgewerkt', { datum: privacyBijgewerkt(locale) })}
      </Text>
      {voorrang ? <Text style={[styles.tekst, styles.voorrang]}>{voorrang}</Text> : null}
      {privacyverklaring(t).map((sectie) => (
        <View key={sectie.kop} style={styles.sectie}>
          <Text style={styles.kop} accessibilityRole="header">
            {sectie.kop}
          </Text>
          {sectie.alineas?.map((alinea) => (
            <Text key={alinea} style={[styles.tekst, styles.alinea]}>
              {alinea}
            </Text>
          ))}
          {sectie.punten?.map((punt) => (
            <View key={punt} style={styles.punt}>
              <Text style={styles.tekst}>•</Text>
              <Text style={[styles.tekst, styles.puntTekst]}>{punt}</Text>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const useStyles = maakStijlen((k) =>
  StyleSheet.create({
    bijgewerkt: {
      fontFamily: fonts.body600,
      fontSize: 11,
      color: k.tint('#5F6E60'),
      marginBottom: 8,
    },
    sectie: { marginTop: 14 },
    kop: { fontFamily: fonts.body800, fontSize: 14, color: k.ink, marginBottom: 6 },
    tekst: { fontFamily: fonts.body400, fontSize: 13, lineHeight: 19, color: k.tint('#3D4A3F') },
    alinea: { marginBottom: 8 },
    voorrang: { fontStyle: 'italic', marginBottom: 4 },
    punt: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    puntTekst: { flex: 1 },
  }),
);
