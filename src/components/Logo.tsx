import { StyleSheet, Text, View } from 'react-native';

import { fonts, kleuren } from '@/constants/theme';

// Conceptlogo uit docs/ontwerp/DESIGN_SYSTEM.md §4
export function Logo({ woordKleur = kleuren.paper }: { woordKleur?: string }) {
  return (
    <View style={styles.lockup} accessibilityLabel="Mooove">
      <View style={styles.glyph}>
        <Text style={styles.glyphText}>
          m<Text style={styles.glyphDot}>.</Text>
        </Text>
      </View>
      <Text style={[styles.word, { color: woordKleur }]}>
        mooove<Text style={styles.wordDot}>.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  glyph: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: kleuren.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 5,
  },
  glyphText: {
    fontFamily: fonts.head700,
    fontSize: 29,
    lineHeight: 29,
    letterSpacing: -3,
    color: kleuren.ink,
  },
  glyphDot: { color: '#569126' },
  word: { fontFamily: fonts.head700, fontSize: 30, letterSpacing: -2 },
  wordDot: { color: kleuren.lime },
});
