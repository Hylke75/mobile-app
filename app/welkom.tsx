import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { PrimaryButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTaal } from '@/i18n';

export default function WelkomScherm() {
  const { t } = useTaal();
  const { slaVoornaamOp } = useAuth();
  const [naam, setNaam] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const opslaan = async () => {
    const voornaam = naam.trim();
    if (voornaam.length < 1 || voornaam.length > 40) return setFout(t('auth.welkom.ongeldig'));
    setBezig(true);
    const resultaat = await slaVoornaamOp(voornaam);
    setBezig(false);
    if (resultaat) setFout(resultaat);
    else router.replace('/');
  };

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>{t('auth.welkom.kicker')}</Text>
      <Text style={s.titel}>
        {t('auth.welkom.titel')}
        <Text style={s.accent}>{t('auth.welkom.titelAccent')}</Text>
      </Text>
      <Text style={s.tekst}>{t('auth.welkom.tekst')}</Text>
      <Text style={s.label}>{t('auth.welkom.label')}</Text>
      <TextInput
        value={naam}
        onChangeText={setNaam}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={opslaan}
        accessibilityLabel={t('auth.welkom.voornaamA11y')}
        style={s.input}
      />
      {fout && <Text style={s.fout}>{fout}</Text>}
      <PrimaryButton
        label={bezig ? t('algemeen.bezig') : "Let's go"}
        onPress={bezig ? () => {} : opslaan}
        style={s.knop}
      />
      <Text style={[s.tekst, styles.gezondheid]}>{t('auth.welkom.gezondheid')}</Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  gezondheid: { fontSize: 12, lineHeight: 17, marginTop: 20, marginBottom: 0 },
});
