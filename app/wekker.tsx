import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { LevelTag, PrimaryButton, SecondaryButton } from '@/components/ui';
import { dagenTekst, MAX_SNOOZES, missiesTekst, SNOOZE_MINUTEN } from '@/constants/alarm';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import {
  rondWekkerAf,
  startMissieVanuitWekker,
  stelUit,
  verwijderEenmaligAlarm,
  type Wekker,
  type WekkerType,
} from '@/lib/alarmen';

function tijdNu(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function WekkerScherm() {
  const params = useLocalSearchParams<{
    alarmId: string;
    occurrenceId?: string;
    type?: WekkerType;
    snoozes?: string;
    missieBezig?: string;
  }>();
  const { alarms } = useAlarmen();
  const { werkProfielBij } = useAuth();
  const { showToast } = useToast();
  const [tijd, setTijd] = useState(tijdNu);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTijd(tijdNu()), 10000);
    return () => clearInterval(t);
  }, []);

  const wekker: Wekker = {
    alarmId: params.alarmId,
    occurrenceId: params.occurrenceId || undefined,
    type: params.type ?? 'alarm',
    snoozes: Number(params.snoozes ?? 0),
    missieBezig: params.missieBezig === '1',
    doorSysteemGestopt: false,
  };
  const alarm = alarms.find((a) => a.id === wekker.alarmId);

  const voerUit = async (actie: () => Promise<void>) => {
    if (bezig) return;
    setBezig(true);
    try {
      await actie();
    } catch {
      showToast('Er ging iets mis met het alarm. Probeer het opnieuw.');
    } finally {
      setBezig(false);
    }
  };

  const startMissie = () =>
    voerUit(async () => {
      const vervolgId = await startMissieVanuitWekker(wekker);
      router.replace({
        pathname: '/missie',
        params: {
          alarmId: wekker.alarmId,
          vervolgId: vervolgId ?? '',
          vanWekker: '1',
        },
      });
    });

  const snooze = (minuten: number, telt: boolean) =>
    voerUit(async () => {
      await stelUit(wekker, minuten, { snoozes: wekker.snoozes + (telt ? 1 : 0) });
      showToast(`Alarm gaat over ${minuten} minuten opnieuw.`);
      router.dismissTo('/');
    });

  const stop = () =>
    voerUit(async () => {
      await rondWekkerAf(wekker.alarmId, wekker.occurrenceId);
      router.dismissTo('/');
    });

  if (wekker.type === 'test') {
    return (
      <WekkerLayout tijd={tijd} kicker="MOOOVE SYSTEM CHECK" titel="Testalarm.">
        <Text style={styles.tekst}>
          Hoorde je het alarm, ook met je telefoon op stil? Dan werken je alarmen zoals het hoort.
        </Text>
        <PrimaryButton
          label="Test geslaagd"
          icon="check"
          onPress={() =>
            voerUit(async () => {
              await rondWekkerAf(wekker.alarmId, wekker.occurrenceId);
              await verwijderEenmaligAlarm(wekker.alarmId);
              await werkProfielBij({ alarmtest_geslaagd_op: new Date().toISOString() });
              showToast('Testalarm geslaagd ✓');
              router.dismissTo('/profiel');
            })
          }
          style={styles.knop}
        />
      </WekkerLayout>
    );
  }

  if (wekker.type === 'wakkercheck') {
    return (
      <WekkerLayout tijd={tijd} kicker="HARDCORE · WAKKER-CHECK" titel="Nog wakker?">
        <Text style={styles.tekst}>Bevestig dat je niet weer in slaap bent gevallen.</Text>
        <PrimaryButton
          label="Ja, ik ben wakker"
          icon="check"
          onPress={() =>
            voerUit(async () => {
              await rondWekkerAf(wekker.alarmId, wekker.occurrenceId);
              await verwijderEenmaligAlarm(wekker.alarmId);
              showToast('Lekker bezig. Fijne dag!');
              router.dismissTo('/');
            })
          }
          style={styles.knop}
        />
      </WekkerLayout>
    );
  }

  const niveau = alarm?.niveau ?? 'Verplicht';
  const snoozesOver = MAX_SNOOZES - wekker.snoozes;

  return (
    <WekkerLayout
      tijd={tijd}
      kicker={wekker.missieBezig ? 'JE MISSIE IS NOG NIET KLAAR' : 'WAKE UP & MOVE'}
      titel={alarm?.naam ?? 'Tijd om te bewegen.'}
    >
      {alarm && (
        <View style={styles.info}>
          <LevelTag level={niveau} />
          <Text style={styles.infoTekst}>
            {dagenTekst(alarm.dagen)} · {missiesTekst(alarm.oefeningen.length)}
          </Text>
        </View>
      )}
      <PrimaryButton
        label={wekker.missieBezig ? 'Ga verder met je missie' : 'Start missie'}
        onPress={startMissie}
        style={styles.knop}
      />
      {!wekker.missieBezig && niveau === 'Vrij' && (
        <>
          <SecondaryButton
            label={`Snooze ${SNOOZE_MINUTEN} minuten`}
            onPress={() => snooze(SNOOZE_MINUTEN, false)}
            style={styles.knopKlein}
          />
          <SecondaryButton label="Stop alarm" onPress={stop} style={styles.knopKlein} />
        </>
      )}
      {!wekker.missieBezig && niveau === 'Flexibel' && (
        <View style={styles.rij}>
          {[15, 30, 60].map((m) => (
            <SecondaryButton
              key={m}
              label={m === 60 ? '+1 uur' : `+${m} min`}
              onPress={() => snooze(m, false)}
              style={styles.rijKnop}
            />
          ))}
        </View>
      )}
      {!wekker.missieBezig && niveau === 'Uitstelbaar' && snoozesOver > 0 && (
        <SecondaryButton
          label={`Snooze ${SNOOZE_MINUTEN} min (nog ${snoozesOver}×)`}
          onPress={() => snooze(SNOOZE_MINUTEN, true)}
          style={styles.knopKlein}
        />
      )}
      {(niveau === 'Verplicht' || niveau === 'Hardcore') && (
        <Text style={styles.streng}>Geen snooze. Het alarm stopt pas als je missie klaar is.</Text>
      )}
    </WekkerLayout>
  );
}

function WekkerLayout({
  tijd,
  kicker,
  titel,
  children,
}: {
  tijd: string;
  kicker: string;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <Screen dark>
      <StatusBar style="light" />
      <View style={styles.wrap}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.klok}>{tijd}</Text>
        <Text style={styles.titel}>{titel}</Text>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 48 },
  kicker: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.18, 10),
    color: kleuren.lime,
    textAlign: 'center',
  },
  klok: {
    fontFamily: fonts.head700,
    fontSize: 90,
    letterSpacing: em(-0.08, 90),
    color: kleuren.lime,
    textAlign: 'center',
    marginTop: 24,
  },
  titel: {
    fontFamily: fonts.head700,
    fontSize: 27,
    letterSpacing: em(-0.04, 27),
    color: kleuren.white,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  tekst: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 19,
    color: '#B3BFB5',
    textAlign: 'center',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoTekst: { fontFamily: fonts.body400, fontSize: 11, color: '#B3BFB5' },
  knop: { marginTop: 24 },
  knopKlein: { marginTop: 10 },
  rij: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rijKnop: { flex: 1, width: undefined },
  streng: {
    fontFamily: fonts.body400,
    fontSize: 11,
    lineHeight: 17,
    color: '#819181',
    textAlign: 'center',
    marginTop: 16,
  },
});
