import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/ui';
import { PRIJZEN } from '@/constants/premium';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { useTaal, type Sleutel } from '@/i18n';

type Plan = 'jaar' | 'maand' | 'lifetime';

// Standaard-EULA van Apple; eigen gebruiksvoorwaarden volgen met de echte aankopen
const VOORWAARDEN_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export default function PremiumScherm() {
  const { t } = useTaal();
  const { reden } = useLocalSearchParams<{ reden?: string }>();
  const { profiel } = useAuth();
  const toegang = usePremium();
  const [plan, setPlan] = useState<Plan>('jaar');

  const tekst =
    toegang.fase === 'gratis'
      ? t('premium.tekstVoorbij')
      : toegang.fase === 'proef' && toegang.dagenOver
        ? t('premium.tekstProef', { n: toegang.dagenOver })
        : t('premium.tekstAlgemeen');

  const planNaam = {
    jaar: t('premium.jaar'),
    maand: t('premium.maand'),
    lifetime: t('premium.lifetime'),
  };

  const kies = () => {
    // Aankopen worden in fase 3 gekoppeld (StoreKit / Google Play Billing via RevenueCat)
    const melding = t('premium.binnenkort');
    if (Platform.OS === 'web') window.alert(melding);
    else Alert.alert(t('premium.naam'), melding);
  };

  if (toegang.premium) {
    return (
      <AuthScreen>
        <StatusBar style="light" />
        <Text style={s.kicker}>{t('premium.kicker')}</Text>
        <Text style={s.tekst}>
          {profiel?.premium_altijd ? t('premium.tester') : t('premium.heeftPremium')}
        </Text>
        <PrimaryButton label={t('algemeen.terug')} onPress={() => router.back()} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>{t('premium.kicker')}</Text>
      <Text style={s.titel}>
        {t('premium.titel')}
        <Text style={s.accent}>{t('premium.titelAccent')}</Text>
      </Text>
      {reden ? <Text style={styles.reden}>{t(`premium.slot.${reden}` as Sleutel)}</Text> : null}
      <Text style={s.tekst}>{tekst}</Text>

      <View style={styles.voordelen}>
        {(['voordeel1', 'voordeel2', 'voordeel3', 'voordeel4'] as const).map((v) => (
          <View key={v} style={styles.voordeel}>
            <Icon name="check" size={15} color={kleuren.lime} />
            <Text style={styles.voordeelTekst}>{t(`premium.${v}`)}</Text>
          </View>
        ))}
      </View>

      <PlanKaart
        gekozen={plan === 'jaar'}
        onPress={() => setPlan('jaar')}
        titel={t('premium.jaar')}
        sub={t('premium.jaarSub', { n: PRIJZEN.besparing })}
        prijs={PRIJZEN.jaar}
        eenheid={t('premium.perJaar')}
        extra={t('premium.jaarPerMaand', { prijs: PRIJZEN.jaarPerMaand })}
      />
      <PlanKaart
        gekozen={plan === 'maand'}
        onPress={() => setPlan('maand')}
        titel={t('premium.maand')}
        sub={t('premium.maandSub')}
        prijs={PRIJZEN.maand}
        eenheid={t('premium.perMaand')}
      />
      <PlanKaart
        gekozen={plan === 'lifetime'}
        onPress={() => setPlan('lifetime')}
        titel={t('premium.lifetime')}
        sub={t('premium.lifetimeSub')}
        prijs={PRIJZEN.lifetime}
        eenheid={t('premium.eenmalig')}
        extra={t('premium.lifetimeNa', { prijs: PRIJZEN.lifetimeNa })}
      />

      <PrimaryButton
        label={t('premium.kies', { plan: planNaam[plan] })}
        onPress={kies}
        style={s.knop}
      />
      <Text style={styles.voorwaarden}>{t('premium.voorwaarden')}</Text>
      <View style={styles.links}>
        <Pressable accessibilityRole="button" onPress={kies} style={styles.linkKnop}>
          <Text style={s.linkTekst}>{t('premium.herstel')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(VOORWAARDEN_URL)}
          style={styles.linkKnop}
        >
          <Text style={s.linkTekst}>{t('premium.gebruiksvoorwaarden')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/privacy')}
          style={styles.linkKnop}
        >
          <Text style={s.linkTekst}>{t('premium.privacy')}</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.link}>
        <Text style={s.linkTekst}>{t('premium.later')}</Text>
      </Pressable>
    </AuthScreen>
  );
}

function PlanKaart({
  gekozen,
  onPress,
  titel,
  sub,
  prijs,
  eenheid,
  extra,
}: {
  gekozen: boolean;
  onPress: () => void;
  titel: string;
  sub: string;
  prijs: string;
  eenheid: string;
  extra?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: gekozen }}
      onPress={onPress}
      style={[styles.kaart, gekozen && styles.kaartGekozen]}
    >
      <View style={styles.flex}>
        <Text style={styles.kaartTitel}>{titel}</Text>
        <Text style={[styles.kaartSub, gekozen && styles.kaartSubGekozen]}>{sub}</Text>
        {extra ? <Text style={styles.kaartExtra}>{extra}</Text> : null}
      </View>
      <View style={styles.prijsKolom}>
        <Text style={styles.prijs}>{prijs}</Text>
        <Text style={styles.eenheid}>{eenheid}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  reden: {
    fontFamily: fonts.body700,
    fontSize: 13,
    lineHeight: 19,
    color: kleuren.lime,
    marginBottom: 8,
  },
  voordelen: { gap: 9, marginBottom: 22 },
  voordeel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voordeelTekst: { fontFamily: fonts.body600, fontSize: 14, color: kleuren.white, flex: 1 },
  kaart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#415C42',
    backgroundColor: '#22342A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  kaartGekozen: { borderColor: kleuren.lime, borderWidth: 2, backgroundColor: '#2B4232' },
  kaartTitel: { fontFamily: fonts.body800, fontSize: 15, color: kleuren.white },
  kaartSub: { fontFamily: fonts.body600, fontSize: 12, color: '#9CB09C', marginTop: 3 },
  kaartSubGekozen: { color: kleuren.lime },
  kaartExtra: { fontFamily: fonts.body400, fontSize: 11, color: '#9CB09C', marginTop: 3 },
  prijsKolom: { alignItems: 'flex-end' },
  prijs: {
    fontFamily: fonts.head700,
    fontSize: 20,
    letterSpacing: em(-0.02, 20),
    color: kleuren.white,
  },
  eenheid: { fontFamily: fonts.body400, fontSize: 11, color: '#9CB09C' },
  voorwaarden: {
    fontFamily: fonts.body400,
    fontSize: 11,
    lineHeight: 16,
    color: '#8EA48C',
    marginTop: 14,
    textAlign: 'center',
  },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14 },
  linkKnop: { paddingVertical: 8 },
});
