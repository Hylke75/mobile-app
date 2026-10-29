import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { useTaal, type Sleutel } from '@/i18n';
import { supabase } from '@/lib/supabase';

const SITE = 'https://www.mooove-app.com';
const UITKOMST: Record<string, Sleutel> = {
  ok: 'uitnodigen.ok',
  ongeldig: 'uitnodigen.ongeldig',
  eigen: 'uitnodigen.eigen',
  al: 'uitnodigen.al',
  te_laat: 'uitnodigen.teLaat',
};

// Vrienden uitnodigen: eigen code delen of de code van een vriend verzilveren (30 dagen Premium)
export default function UitnodigenScherm() {
  const { t } = useTaal();
  const { showToast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [invoer, setInvoer] = useState('');
  const [melding, setMelding] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    supabase.rpc('mijn_verwijzingscode').then(({ data }) => setCode(data ?? null));
  }, []);

  const deel = () => {
    if (!code) return;
    Share.share({
      message: t('uitnodigen.deelTekst', { code, link: `${SITE}/?code=${code}` }),
    }).catch(() => {});
  };

  const verzilver = async () => {
    const schoon = invoer.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(schoon)) return setMelding(t('uitnodigen.ongeldig'));
    setBezig(true);
    const { data, error } = await supabase.rpc('verzilver_code', { invoer: schoon });
    setBezig(false);
    if (error) return setMelding(t('uitnodigen.fout'));
    const sleutel = UITKOMST[data ?? ''] ?? 'uitnodigen.fout';
    if (data === 'ok') {
      showToast(t(sleutel));
      router.back();
      return;
    }
    setMelding(t(sleutel));
  };

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>{t('uitnodigen.kicker')}</Text>
      <Text style={s.titel}>
        {t('uitnodigen.titel')}
        <Text style={s.accent}>{t('uitnodigen.titelAccent')}</Text>
      </Text>
      <Text style={s.tekst}>{t('uitnodigen.tekst')}</Text>

      <Text style={s.label}>{t('uitnodigen.jouwCode')}</Text>
      <Text style={styles.code} selectable>
        {code ?? t('uitnodigen.laden')}
      </Text>
      <PrimaryButton label={t('uitnodigen.delen')} onPress={deel} style={s.knop} />

      <Text style={[s.label, styles.ruimte]}>{t('uitnodigen.invoerLabel')}</Text>
      <TextInput
        value={invoer}
        onChangeText={(tekst) => setInvoer(tekst.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        onSubmitEditing={verzilver}
        accessibilityLabel={t('uitnodigen.invoerA11y')}
        style={[s.input, s.codeInput]}
      />
      {melding && <Text style={s.fout}>{melding}</Text>}
      <Pressable accessibilityRole="button" onPress={bezig ? undefined : verzilver} style={s.link}>
        <Text style={s.linkTekst}>{bezig ? t('algemeen.bezig') : t('uitnodigen.verzilver')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.link}>
        <Text style={s.linkTekst}>{t('algemeen.terug')}</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: fonts.head700,
    fontSize: 34,
    letterSpacing: em(34, 0.2),
    color: kleuren.lime,
    marginBottom: 14,
  },
  ruimte: { marginTop: 26 },
});
