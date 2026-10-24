import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { kleuren } from '@/constants/theme';

// Vangt onverwachte fouten op, zodat de gebruiker nooit een leeg scherm ziet.
// Gebruikt systeemlettertypes: de eigen lettertypes zijn op dit punt mogelijk niet geladen.
export function Foutscherm({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const meld = () =>
    Linking.openURL(
      `mailto:hylke@linkandlead.nl?subject=${encodeURIComponent('Fout in Mooove')}&body=${encodeURIComponent(error.message)}`,
    ).catch(() => {});

  return (
    <View style={styles.root} accessibilityRole="alert">
      <Text style={styles.titel}>Oeps, er ging iets mis.</Text>
      <Text style={styles.tekst}>
        Je alarmen blijven gewoon ingesteld. Probeer het opnieuw; lukt het niet, sluit de app dan
        helemaal af en open hem opnieuw.
      </Text>
      <Pressable accessibilityRole="button" onPress={retry} style={styles.knop}>
        <Text style={styles.knopTekst}>Probeer opnieuw</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={meld} style={styles.link}>
        <Text style={styles.linkTekst}>Meld deze fout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: kleuren.ink,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  titel: { color: kleuren.paper, fontSize: 30, fontWeight: '800', marginBottom: 12 },
  tekst: { color: '#B2C2B0', fontSize: 15, lineHeight: 22, marginBottom: 28 },
  knop: {
    backgroundColor: kleuren.lime,
    borderRadius: 15,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knopTekst: { color: kleuren.ink, fontSize: 16, fontWeight: '800' },
  link: { alignSelf: 'center', marginTop: 18, padding: 6 },
  linkTekst: { color: kleuren.lime, fontSize: 14, fontWeight: '700' },
});
