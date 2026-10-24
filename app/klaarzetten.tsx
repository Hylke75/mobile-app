import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { Icon } from '@/components/Icon';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmCheck } from '@/hooks/useAlarmCheck';
import { alarmenBeschikbaar, vraagRechtenAan } from '@/lib/alarmen';
import { openBatterijInstellingen } from '@/lib/batterij';
import { vraagCameraAan } from '@/lib/camera';
import { schrijfLokaal, SLEUTELS } from '@/lib/opslag';

type Stap = { titel: string; uitleg: string; ok: boolean; actie: () => void; knop: string };

export default function KlaarzettenScherm() {
  const { rechten, regels, batterijAan, vernieuw } = useAlarmCheck();
  const [bezig, setBezig] = useState(false);
  const camera = regels.find((r) => r.label === 'Camera')?.ok ?? false;

  const metBezig = (actie: () => Promise<unknown>) => async () => {
    setBezig(true);
    try {
      await actie();
    } finally {
      vernieuw();
      setBezig(false);
    }
  };

  const stappen: Stap[] = [
    {
      titel: 'Alarmen',
      uitleg: 'Zodat je alarm afgaat, ook als je telefoon op stil of Niet storen staat.',
      ok: Boolean(rechten?.canScheduleExactAlarms),
      knop: 'Sta alarmen toe',
      actie: metBezig(async () => {
        const nieuw = await vraagRechtenAan().catch(() => null);
        if (!nieuw?.canScheduleExactAlarms && nieuw?.canOpenSettings) await Linking.openSettings();
      }),
    },
    {
      titel: 'Camera',
      uitleg: 'Om je oefeningen te herkennen. Beelden blijven altijd op je toestel.',
      ok: camera,
      knop: 'Sta camera toe',
      actie: metBezig(async () => {
        const gelukt = await vraagCameraAan().catch(() => false);
        if (!gelukt) await Linking.openSettings();
      }),
    },
    ...(Platform.OS === 'android'
      ? [
          {
            titel: 'Batterijbesparing uit',
            uitleg:
              'Sommige telefoons sluiten apps om batterij te sparen. Zet dit voor Mooove uit, anders kan een alarm wegvallen.',
            ok: !batterijAan,
            knop: 'Open instellingen',
            actie: metBezig(openBatterijInstellingen),
          },
        ]
      : []),
  ];

  const klaar = async (naarTest: boolean) => {
    await schrijfLokaal(SLEUTELS.klaargezet, true);
    // Terug naar de tabs die er al onder liggen, zonder een tweede kopie te openen
    if (router.canGoBack()) router.back();
    else router.replace('/');
    if (naarTest) router.navigate('/profiel');
  };

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>NOG ÉÉN DING</Text>
      <Text style={s.titel}>
        Zet je wekker <Text style={s.accent}>klaar.</Text>
      </Text>
      <Text style={s.tekst}>
        {alarmenBeschikbaar
          ? 'Mooove heeft een paar rechten nodig om je echt wakker te krijgen.'
          : 'Alarmen en camera werken alleen in de app op je telefoon.'}
      </Text>

      {alarmenBeschikbaar &&
        stappen.map((stap) => (
          <View key={stap.titel} style={styles.stap}>
            <View style={[styles.vink, stap.ok && styles.vinkOk]}>
              <Icon
                name={stap.ok ? 'check' : 'info'}
                size={14}
                color={stap.ok ? kleuren.ink : '#9CB09C'}
              />
            </View>
            <View style={styles.stapTekst}>
              <Text style={styles.stapTitel}>{stap.titel}</Text>
              <Text style={styles.stapUitleg}>{stap.uitleg}</Text>
              {!stap.ok && (
                <Pressable
                  accessibilityRole="button"
                  disabled={bezig}
                  onPress={stap.actie}
                  style={styles.stapKnop}
                >
                  <Text style={styles.stapKnopTekst}>{stap.knop}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

      <PrimaryButton
        label={alarmenBeschikbaar ? 'Klaar, test mijn alarm' : 'Verder'}
        onPress={() => klaar(alarmenBeschikbaar)}
        style={s.knop}
      />
      {alarmenBeschikbaar && (
        <SecondaryButton label="Later" onPress={() => klaar(false)} style={styles.later} />
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  stap: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#1B2C22',
    borderWidth: 1,
    borderColor: '#415C42',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  vink: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#415C42',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  vinkOk: { backgroundColor: kleuren.lime, borderColor: kleuren.lime },
  stapTekst: { flex: 1 },
  stapTitel: { fontFamily: fonts.head700, fontSize: 16, color: kleuren.white },
  stapUitleg: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 18,
    color: '#B2C2B0',
    marginTop: 4,
  },
  stapKnop: {
    alignSelf: 'flex-start',
    backgroundColor: kleuren.lime,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  stapKnopTekst: {
    fontFamily: fonts.body800,
    fontSize: 12,
    letterSpacing: em(0.02, 12),
    color: kleuren.ink,
  },
  later: { marginTop: 10, backgroundColor: 'transparent', borderColor: '#415C42' },
});
