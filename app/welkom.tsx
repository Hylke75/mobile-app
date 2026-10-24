import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function WelkomScherm() {
  const { slaVoornaamOp } = useAuth();
  const [naam, setNaam] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const opslaan = async () => {
    const voornaam = naam.trim();
    if (voornaam.length < 1 || voornaam.length > 40) return setFout('Vul je voornaam in.');
    setBezig(true);
    const resultaat = await slaVoornaamOp(voornaam);
    setBezig(false);
    if (resultaat) setFout(resultaat);
    else router.replace('/');
  };

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>WELKOM BIJ MOOOVE</Text>
      <Text style={s.titel}>
        Hoe mogen we je <Text style={s.accent}>noemen?</Text>
      </Text>
      <Text style={s.tekst}>Je voornaam gebruiken we alleen om je in de app te begroeten.</Text>
      <Text style={s.label}>VOORNAAM</Text>
      <TextInput
        value={naam}
        onChangeText={setNaam}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={opslaan}
        accessibilityLabel="Voornaam"
        style={s.input}
      />
      {fout && <Text style={s.fout}>{fout}</Text>}
      <PrimaryButton
        label={bezig ? 'Bezig…' : "Let's go"}
        onPress={bezig ? () => {} : opslaan}
        style={s.knop}
      />
      <Text style={[s.tekst, styles.gezondheid]}>
        Mooove is geen medisch hulpmiddel. Beweeg binnen je eigen grenzen en overleg met je arts als
        je twijfelt of je een oefening kunt doen.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  gezondheid: { fontSize: 12, lineHeight: 17, marginTop: 20, marginBottom: 0 },
});
