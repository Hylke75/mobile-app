import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';
import { Icon } from '@/components/Icon';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmCheck } from '@/hooks/useAlarmCheck';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useTaal } from '@/i18n';
import { alarmenBeschikbaar, vraagRechtenAan } from '@/lib/alarmen';
import { openBatterijInstellingen } from '@/lib/batterij';
import { openInstellingen } from '@/lib/instellingen';
import { cameraStatus, vraagCameraAan } from '@/lib/camera';
import { schrijfLokaal, SLEUTELS } from '@/lib/opslag';

type Stap = { titel: string; uitleg: string; ok: boolean; actie: () => void; knop: string };

export default function KlaarzettenScherm() {
  const { t } = useTaal();
  // De hook rendert opnieuw na elke vernieuw(), dus de camerastatus is hier actueel
  const { rechten, batterijAan, vernieuw } = useAlarmCheck();
  const { alarms, geladen } = useAlarmen();
  const [bezig, setBezig] = useState(false);
  const camera = cameraStatus() === 'toegestaan';

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
      titel: t('auth.klaarzetten.alarmenTitel'),
      uitleg: t('auth.klaarzetten.alarmenUitleg'),
      ok: Boolean(rechten?.canScheduleExactAlarms),
      knop: t('auth.klaarzetten.alarmenKnop'),
      actie: metBezig(async () => {
        const nieuw = await vraagRechtenAan().catch(() => null);
        if (!nieuw?.canScheduleExactAlarms && nieuw?.canOpenSettings) await openInstellingen();
      }),
    },
    {
      titel: t('auth.klaarzetten.cameraTitel'),
      uitleg: t('auth.klaarzetten.cameraUitleg'),
      ok: camera,
      knop: t('auth.klaarzetten.cameraKnop'),
      actie: metBezig(async () => {
        const gelukt = await vraagCameraAan().catch(() => false);
        if (!gelukt) await openInstellingen();
      }),
    },
    ...(Platform.OS === 'android'
      ? [
          {
            titel: t('auth.klaarzetten.batterijTitel'),
            uitleg: t('auth.klaarzetten.batterijUitleg'),
            ok: !batterijAan,
            knop: t('auth.klaarzetten.batterijKnop'),
            actie: metBezig(openBatterijInstellingen),
          },
        ]
      : []),
  ];

  const klaar = async (naarTest: boolean) => {
    await schrijfLokaal(SLEUTELS.klaargezet, true);
    // Nieuwe gebruiker: direct door naar het eerste alarm, zodat Vandaag nooit leeg begint
    if (!naarTest && geladen && alarms.length === 0) {
      router.replace({ pathname: '/nieuw-alarm', params: { eerste: '1' } });
      return;
    }
    // Terug naar de tabs die er al onder liggen, zonder een tweede kopie te openen
    if (router.canGoBack()) router.back();
    else router.replace('/');
    if (naarTest) router.navigate('/profiel');
  };

  return (
    <AuthScreen>
      <StatusBar style="light" />
      <Text style={s.kicker}>{t('auth.klaarzetten.kicker')}</Text>
      <Text style={s.titel}>
        {t('auth.klaarzetten.titel')}
        <Text style={s.accent}>{t('auth.klaarzetten.titelAccent')}</Text>
      </Text>
      <Text style={s.tekst}>
        {alarmenBeschikbaar ? t('auth.klaarzetten.tekst') : t('auth.klaarzetten.tekstWeb')}
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
        label={alarmenBeschikbaar ? t('auth.klaarzetten.testen') : t('auth.klaarzetten.verder')}
        onPress={() => klaar(alarmenBeschikbaar)}
        style={s.knop}
      />
      {alarmenBeschikbaar && (
        <SecondaryButton
          label={t('auth.klaarzetten.later')}
          onPress={() => klaar(false)}
          style={styles.later}
        />
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
