import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, ScreenHeader } from '@/components/ui';
import { PRIVACY_BIJGEWERKT, PRIVACYVERKLARING } from '@/constants/privacyverklaring';
import { fonts, kleuren } from '@/constants/theme';

export default function PrivacyScherm() {
  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={gedeeld.backLink}
      >
        <Icon name="chevron" color={kleuren.ink} />
        <Text style={gedeeld.backLinkText}>Terug</Text>
      </Pressable>
      <ScreenHeader kicker="JOUW GEGEVENS" titel="Privacy" puntKleur="#91B755" />
      <Text style={styles.bijgewerkt}>Laatst bijgewerkt: {PRIVACY_BIJGEWERKT}</Text>
      {PRIVACYVERKLARING.map((sectie) => (
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

const styles = StyleSheet.create({
  bijgewerkt: { fontFamily: fonts.body600, fontSize: 11, color: '#5F6E60', marginBottom: 8 },
  sectie: { marginTop: 14 },
  kop: { fontFamily: fonts.body800, fontSize: 14, color: kleuren.ink, marginBottom: 6 },
  tekst: { fontFamily: fonts.body400, fontSize: 13, lineHeight: 19, color: '#3D4A3F' },
  alinea: { marginBottom: 8 },
  punt: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  puntTekst: { flex: 1 },
});
