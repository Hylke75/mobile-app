import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useTaal } from '@/i18n';

const EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gast (anoniem account) koppelt een e-mailadres, zodat alarmen en voortgang bewaard blijven
export default function KoppelEmailScherm() {
  const { t } = useTaal();
  const { koppelEmail, bevestigKoppeling } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [verstuurdNaar, setVerstuurdNaar] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const stuurCode = async () => {
    const adres = email.trim().toLowerCase();
    if (!EMAIL_PATROON.test(adres)) return setFout(t('auth.inloggen.ongeldigEmail'));
    setBezig(true);
    setFout(null);
    const resultaat = await koppelEmail(adres);
    setBezig(false);
    if (resultaat) return setFout(resultaat);
    setVerstuurdNaar(adres);
  };

  const bevestig = async () => {
    if (!verstuurdNaar) return;
    if (!/^\d{6,10}$/.test(code)) return setFout(t('auth.code.ongeldig'));
    setBezig(true);
    setFout(null);
    const resultaat = await bevestigKoppeling(verstuurdNaar, code);
    setBezig(false);
    if (resultaat) return setFout(resultaat);
    showToast(t('auth.koppel.gelukt'));
    router.back();
  };

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>{t('auth.koppel.kicker')}</Text>
      <Text style={s.titel}>
        {t('auth.koppel.titel')}
        <Text style={s.accent}>{t('auth.koppel.titelAccent')}</Text>
      </Text>
      {verstuurdNaar ? (
        <>
          <Text style={s.tekst}>{t('auth.koppel.codeTekst', { email: verstuurdNaar })}</Text>
          <Text style={s.label}>{t('auth.code.label')}</Text>
          <TextInput
            value={code}
            onChangeText={(tekst) => setCode(tekst.replace(/\D/g, ''))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
            autoFocus
            onSubmitEditing={bevestig}
            accessibilityLabel={t('auth.code.codeA11y')}
            style={[s.input, s.codeInput]}
          />
        </>
      ) : (
        <>
          <Text style={s.tekst}>{t('auth.koppel.tekst')}</Text>
          <Text style={s.label}>{t('auth.inloggen.emailLabel')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.inloggen.emailVoorbeeld')}
            placeholderTextColor="#668068"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={stuurCode}
            accessibilityLabel={t('auth.inloggen.emailA11y')}
            style={s.input}
          />
        </>
      )}
      {fout && <Text style={s.fout}>{fout}</Text>}
      <PrimaryButton
        label={
          bezig
            ? t('algemeen.bezig')
            : verstuurdNaar
              ? t('auth.koppel.bevestig')
              : t('auth.inloggen.stuurCode')
        }
        onPress={bezig ? () => {} : verstuurdNaar ? bevestig : stuurCode}
        style={s.knop}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (verstuurdNaar) {
            setVerstuurdNaar(null);
            setCode('');
            setFout(null);
          } else router.back();
        }}
        style={s.link}
      >
        <Text style={s.linkTekst}>
          {verstuurdNaar ? t('auth.code.anderAdres') : t('algemeen.terug')}
        </Text>
      </Pressable>
    </AuthScreen>
  );
}
