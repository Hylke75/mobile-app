import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VERDIENMODEL_AAN } from '@/constants/premium';
import { fonts, kleuren } from '@/constants/theme';
import { toonPremium, usePremium } from '@/hooks/usePremium';
import { useTaal } from '@/i18n';
import { logAppEvent } from '@/lib/appEvents';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';

// Het beste moment voor Premium: halverwege de proef, direct na een geslaagde ochtend met een
// lopende streak. Eén keer per toestel.
const VANAF_PROEFDAG = 5;
const MINIMALE_STREAK = 3;

export function PremiumMoment({ streak }: { streak: number }) {
  const { t } = useTaal();
  const toegang = usePremium();
  const [tonen, setTonen] = useState(false);
  const geschikt =
    VERDIENMODEL_AAN &&
    toegang.fase === 'proef' &&
    (toegang.proefDag ?? 0) >= VANAF_PROEFDAG &&
    streak >= MINIMALE_STREAK;

  useEffect(() => {
    if (!geschikt) return;
    let actief = true;
    leesLokaal<boolean>(SLEUTELS.premiumMoment).then((gezien) => {
      if (!actief || gezien) return;
      setTonen(true);
      schrijfLokaal(SLEUTELS.premiumMoment, true);
      logAppEvent('premium_moment_shown', { streak });
    });
    return () => {
      actief = false;
    };
  }, [geschikt, streak]);

  if (!tonen) return null;
  return (
    <View style={styles.kaart}>
      <Text style={styles.titel}>{t('premium.momentTitel', { n: streak })}</Text>
      <Text style={styles.tekst}>{t('premium.momentTekst')}</Text>
      <Pressable accessibilityRole="button" onPress={() => toonPremium()} hitSlop={8}>
        <Text style={styles.knop}>{t('premium.momentKnop')} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kaart: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#415C42',
    backgroundColor: '#22342A',
    padding: 16,
    gap: 6,
    marginBottom: 14,
  },
  titel: { fontFamily: fonts.body800, fontSize: 15, color: kleuren.white },
  tekst: { fontFamily: fonts.body500, fontSize: 13, lineHeight: 19, color: '#C7D1C7' },
  knop: { fontFamily: fonts.body800, fontSize: 13, color: kleuren.lime, marginTop: 4 },
});
