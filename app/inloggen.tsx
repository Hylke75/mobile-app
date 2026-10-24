import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

const EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InloggenScherm() {
  const { vraagCodeAan, loginMetWachtwoord } = useAuth();
  const [email, setEmail] = useState('');
  const [metWachtwoord, setMetWachtwoord] = useState(false);
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const verstuur = async () => {
    const adres = email.trim().toLowerCase();
    if (!EMAIL_PATROON.test(adres)) return setFout('Vul een geldig e-mailadres in.');
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
      <Text style={s.tekst}>
        Log in met je e-mailadres. Je krijgt een eenmalige code per e-mail. Met een account bewaren
        we je alarmen, streak en voortgang, ook als je een nieuwe telefoon neemt.
      </Text>
      <Text style={s.label}>E-MAILADRES</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="jij@voorbeeld.nl"
        placeholderTextColor="#668068"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={verstuur}
        accessibilityLabel="E-mailadres"
        style={s.input}
      />
      {metWachtwoord && (
        <>
          <Text style={[s.label, s.labelExtra]}>WACHTWOORD</Text>
          <TextInput
            value={wachtwoord}
            onChangeText={setWachtwoord}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={verstuur}
            accessibilityLabel="Wachtwoord"
            style={s.input}
          />
        </>
      )}
      {fout && <Text style={s.fout}>{fout}</Text>}
      <PrimaryButton
        label={bezig ? 'Bezig…' : metWachtwoord ? 'Inloggen' : 'Stuur mij een code'}
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
          {metWachtwoord ? 'Inloggen met een code' : 'Inloggen met wachtwoord'}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push('/privacy')} style={s.link}>
        <Text style={s.linkTekst}>Privacyverklaring</Text>
      </Pressable>
    </AuthScreen>
  );
}
