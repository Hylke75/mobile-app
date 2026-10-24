import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTaal } from '@/i18n';

const EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InloggenScherm() {
  const { t } = useTaal();
  const { vraagCodeAan, loginMetWachtwoord } = useAuth();
  const [email, setEmail] = useState('');
  const [metWachtwoord, setMetWachtwoord] = useState(false);
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const verstuur = async () => {
    const adres = email.trim().toLowerCase();
    if (!EMAIL_PATROON.test(adres)) return setFout(t('auth.inloggen.ongeldigEmail'));
    setBezig(true);
    setFout(null);
    if (metWachtwoord) {
      const resultaat = await loginMetWachtwoord(adres, wachtwoord);
      setBezig(false);
      if (resultaat) setFout(resultaat);
      else router.replace('/');
      return;
    }
    const resultaat = await vraagCodeAan(adres);
    setBezig(false);
    if (resultaat) return setFout(resultaat);
    router.push({ pathname: '/code', params: { email: adres } });
  };

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>STOP SNOOZING. START MOVING.</Text>
      <Text style={s.titel}>
        Wake up{'\n'}& <Text style={s.accent}>move.</Text>
      </Text>
      <Text style={s.tekst}>{t('auth.inloggen.tekst')}</Text>
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
        onSubmitEditing={verstuur}
        accessibilityLabel={t('auth.inloggen.emailA11y')}
        style={s.input}
      />
      {metWachtwoord && (
        <>
          <Text style={[s.label, s.labelExtra]}>{t('auth.inloggen.wachtwoordLabel')}</Text>
          <TextInput
            value={wachtwoord}
            onChangeText={setWachtwoord}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={verstuur}
            accessibilityLabel={t('auth.inloggen.wachtwoordA11y')}
            style={s.input}
          />
        </>
      )}
      {fout && <Text style={s.fout}>{fout}</Text>}
      <PrimaryButton
        label={
          bezig
            ? t('algemeen.bezig')
            : metWachtwoord
              ? t('auth.inloggen.inloggen')
              : t('auth.inloggen.stuurCode')
        }
        onPress={bezig ? () => {} : verstuur}
        style={s.knop}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMetWachtwoord(!metWachtwoord);
          setFout(null);
        }}
        style={s.link}
      >
        <Text style={s.linkTekst}>
          {metWachtwoord ? t('auth.inloggen.metCode') : t('auth.inloggen.metWachtwoord')}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push('/privacy')} style={s.link}>
        <Text style={s.linkTekst}>{t('auth.inloggen.privacy')}</Text>
      </Pressable>
    </AuthScreen>
  );
}
