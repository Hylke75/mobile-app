import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useTaal } from '@/i18n';

export default function CodeScherm() {
  const { t } = useTaal();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { controleerCode, vraagCodeAan } = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  // Supabase staat maar één code per minuut toe; daarom een korte wachttijd
  const [wachtTot, setWachtTot] = useState(() => Date.now() + 60000);
  const [nu, setNu] = useState(() => Date.now());
  const resterend = Math.max(0, Math.ceil((wachtTot - nu) / 1000));

  useEffect(() => {
    if (resterend === 0) return;
    const timer = setInterval(() => setNu(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resterend]);

  const controleer = async () => {
    if (!email) return;
    if (!/^\d{6,10}$/.test(code)) return setFout(t('auth.code.ongeldig'));
    setBezig(true);
    setFout(null);
    const resultaat = await controleerCode(email, code);
    setBezig(false);
    if (resultaat) setFout(resultaat);
    else router.replace('/');
  };

  const opnieuw = async () => {
    if (!email || resterend > 0) return;
    setWachtTot(Date.now() + 60000);
    setNu(Date.now());
    const resultaat = await vraagCodeAan(email);
    if (resultaat) setFout(resultaat);
    else showToast(t('auth.code.verstuurd'));
  };

  if (!email) return <Redirect href="/inloggen" />;

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>{t('auth.code.kicker')}</Text>
      <Text style={s.titel}>
        {t('auth.code.titel')}
        <Text style={s.accent}>{t('auth.code.titelAccent')}</Text>
      </Text>
      <Text style={s.tekst}>{t('auth.code.tekst', { email })}</Text>
      <Text style={s.label}>{t('auth.code.label')}</Text>
      <TextInput
        value={code}
        onChangeText={(tekst) => setCode(tekst.replace(/\D/g, ''))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={10}
        autoFocus
        onSubmitEditing={controleer}
        accessibilityLabel={t('auth.code.codeA11y')}
        style={[s.input, s.codeInput]}
      />
      {fout && <Text style={s.fout}>{fout}</Text>}
      <PrimaryButton
        label={bezig ? t('algemeen.bezig') : t('auth.code.inloggen')}
        onPress={bezig ? () => {} : controleer}
        style={s.knop}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: resterend > 0 }}
        disabled={resterend > 0}
        onPress={opnieuw}
        style={s.link}
      >
        <Text style={[s.linkTekst, resterend > 0 && { opacity: 0.5 }]}>
          {resterend > 0 ? t('auth.code.wachten', { n: resterend }) : t('auth.code.nieuweCode')}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.link}>
        <Text style={s.linkTekst}>{t('auth.code.anderAdres')}</Text>
      </Pressable>
    </AuthScreen>
  );
}
