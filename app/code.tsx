import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function CodeScherm() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { controleerCode, vraagCodeAan } = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const controleer = async () => {
    if (!email) return;
    if (!/^\d{6,10}$/.test(code)) return setFout('Vul de code uit je e-mail in.');
    setBezig(true);
    setFout(null);
    const resultaat = await controleerCode(email, code);
    setBezig(false);
    if (resultaat) setFout(resultaat);
  };

  const opnieuw = async () => {
    if (!email) return;
    const resultaat = await vraagCodeAan(email);
    if (resultaat) setFout(resultaat);
    else showToast('Nieuwe code verstuurd.');
  };

  if (!email) return <Redirect href="/inloggen" />;

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>BIJNA KLAAR</Text>
      <Text style={s.titel}>
        Check je <Text style={s.accent}>mail.</Text>
      </Text>
      <Text style={s.tekst}>We hebben een code gestuurd naar {email}.</Text>
      <Text style={s.label}>JOUW CODE</Text>
      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={10}
        autoFocus
        onSubmitEditing={controleer}
        accessibilityLabel="Code uit je e-mail"
        style={[s.input, s.codeInput]}
      />
      {fout && <Text style={s.fout}>{fout}</Text>}
      <PrimaryButton
        label={bezig ? 'Bezig…' : 'Inloggen'}
        onPress={bezig ? () => {} : controleer}
        style={s.knop}
      />
      <Pressable accessibilityRole="button" onPress={opnieuw} style={s.link}>
        <Text style={s.linkTekst}>Stuur een nieuwe code</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.link}>
        <Text style={s.linkTekst}>Ander e-mailadres gebruiken</Text>
      </Pressable>
    </AuthScreen>
  );
}
