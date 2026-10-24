import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/theme';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { maakStijlen } from '@/hooks/useThema';
import { useTaal } from '@/i18n';

// Balk boven de tabbalk zodra een OTA-update is opgehaald
export function UpdateMelding() {
  const styles = useStyles();
  const { t } = useTaal();
  const { klaar, herstart } = useAppUpdate();
  if (!klaar) return null;

  return (
    <View style={styles.balk} accessibilityRole="alert">
      <Text style={styles.tekst}>{t('navigatie.update.klaar')}</Text>
      <Pressable accessibilityRole="button" onPress={herstart} style={styles.knop}>
        <Text style={styles.knopTekst}>{t('navigatie.update.herstart')}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = maakStijlen((k) =>
  StyleSheet.create({
    balk: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: k.donkerVlak,
    },
    tekst: { flex: 1, fontFamily: fonts.body800, fontSize: 13, color: k.opDonker },
    knop: { backgroundColor: k.lime, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
    knopTekst: { fontFamily: fonts.body800, fontSize: 12, color: k.opLime },
  }),
);
