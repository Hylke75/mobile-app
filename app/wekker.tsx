import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { LevelTag, PrimaryButton, SecondaryButton } from '@/components/ui';
import { dagenTekst, MAX_SNOOZES, missiesTekst, SNOOZE_MINUTEN } from '@/constants/alarm';
import { doelenNaarTekst, doelenUitTekst } from '@/constants/oefeningen';
import { eigenNaarTekst, eigenUitTekst, missiesVanDag } from '@/lib/missies';
import { em, fonts, kleuren } from '@/constants/theme';
import { useTaal } from '@/i18n';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { useStartDoel } from '@/hooks/useStartDoel';
import { useToast } from '@/hooks/useToast';
import {
  contextVoor,
  rondWekkerAf,
  startMissieVanuitWekker,
  stelUit,
  verwijderEenmaligAlarm,
  type Wekker,
  type WekkerType,
} from '@/lib/alarmen';
import { actieveMissie, werkVervolgBij } from '@/lib/missieStatus';
import { effectiefAlarm } from '@/lib/premium';

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
    niveau?: string;
    naam?: string;
    oefeningen?: string;
    doelen?: string;
    eigen?: string;
  }>();
  const { alarms, herplan } = useAlarmen();
  const { werkProfielBij } = useAuth();
  const { showToast } = useToast();
  const { t } = useTaal();
  const [tijd, setTijd] = useState(tijdNu);
  const [bezig, setBezig] = useState(false);

  const [native, setNative] = useState<Wekker | null>(null);
  const startDoel = useStartDoel();

  useEffect(() => {
    const timer = setInterval(() => setTijd(tijdNu()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Het alarm loopt door tot de gebruiker een keuze maakt; terug mag niet
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!params.alarmId) return;
    contextVoor(params.alarmId)
      .then(setNative)
      .catch(() => {});
  }, [params.alarmId, params.occurrenceId]);

  const toegang = usePremium();
  // Zoals het alarm echt is ingepland (zonder Premium: proef- of gratis niveau en missies)
  const opgeslagen = alarms.find((a) => a.id === params.alarmId);
  const alarm = opgeslagen ? effectiefAlarm(opgeslagen, toegang) : undefined;
  const wekker: Wekker = {
    alarmId: params.alarmId,
    occurrenceId: params.occurrenceId || native?.occurrenceId,
    type: params.type ?? native?.type ?? 'alarm',
    snoozes: Number(params.snoozes || native?.snoozes || 0),
    missieBezig: params.missieBezig === '1' || Boolean(native?.missieBezig),
    niveau: alarm?.niveau ?? ((params.niveau || native?.niveau) as Wekker['niveau']),
    naam: alarm?.naam ?? (params.naam || native?.naam),
    oefeningen:
      alarm?.oefeningen ??
      ((params.oefeningen ? params.oefeningen.split(',') : native?.oefeningen) as
        Wekker['oefeningen'] | undefined),
    doelen: alarm?.doelen ?? (params.doelen ? doelenUitTekst(params.doelen) : native?.doelen),
    eigen: params.eigen ? eigenUitTekst(params.eigen) : native?.eigen,
    wisselend: alarm?.wisselend ?? native?.wisselend,
  };

  const voerUit = async (actie: () => Promise<void>) => {
    if (bezig) return;
    setBezig(true);
    try {
      await actie();
    } catch {
      showToast(t('wekker.fout'));
    } finally {
      setBezig(false);
    }
  };

  const startMissie = () =>
    voerUit(async () => {
      const vervolgId = await startMissieVanuitWekker(wekker);
      // Loopt de missie voor dit alarm al, dan gaan we daar gewoon mee verder
      if (actieveMissie()?.alarmId === wekker.alarmId) {
        werkVervolgBij(wekker.alarmId, vervolgId);
        router.back();
        return;
      }
      router.replace({
        pathname: '/missie',
        params: {
          alarmId: wekker.alarmId,
          vervolgId: vervolgId ?? '',
          vanWekker: '1',
          niveau: wekker.niveau ?? '',
          oefeningen: missiesVanDag(wekker.oefeningen ?? [], wekker.wisselend).join(','),
          doelen: wekker.doelen ? doelenNaarTekst(wekker.doelen) : '',
          eigen: wekker.eigen?.length ? eigenNaarTekst(wekker.eigen) : '',
        },
      });
    });

  const snooze = (minuten: number, telt: boolean) =>
    voerUit(async () => {
      await stelUit(wekker, minuten, { snoozes: wekker.snoozes + (telt ? 1 : 0) });
      showToast(t('wekker.snoozeToast', { n: minuten }));
      router.dismissTo('/');
    });

  const stop = () =>
    voerUit(async () => {
      await rondWekkerAf(wekker.alarmId, wekker.occurrenceId);
      herplan();
      router.dismissTo('/');
    });

  if (!params.alarmId) return <Redirect href={startDoel ?? '/'} />;

  if (wekker.type === 'test') {
    return (
      <WekkerLayout tijd={tijd} kicker="MOOOVE SYSTEM CHECK" titel={t('wekker.test.titel')}>
        <Text style={styles.tekst}>{t('wekker.test.tekst')}</Text>
        <PrimaryButton
          label={t('wekker.test.geslaagd')}
          icon="check"
          onPress={() =>
            voerUit(async () => {
              await rondWekkerAf(wekker.alarmId, wekker.occurrenceId);
              await verwijderEenmaligAlarm(wekker.alarmId);
              await werkProfielBij({ alarmtest_geslaagd_op: new Date().toISOString() });
              showToast(t('wekker.test.toast'));
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
      <WekkerLayout
        tijd={tijd}
        kicker={t('wekker.wakkerCheck.kicker')}
        titel={t('wekker.wakkerCheck.titel')}
      >
        <Text style={styles.tekst}>{t('wekker.wakkerCheck.tekst')}</Text>
        <PrimaryButton
          label={t('wekker.wakkerCheck.knop')}
          icon="check"
          onPress={() =>
            voerUit(async () => {
              await rondWekkerAf(wekker.alarmId, wekker.occurrenceId);
              await verwijderEenmaligAlarm(wekker.alarmId);
              showToast(t('wekker.wakkerCheck.toast'));
              router.dismissTo('/');
            })
          }
          style={styles.knop}
        />
      </WekkerLayout>
    );
  }

  // Zonder bekend niveau gedragen we ons streng: liever een missie te veel dan een gemist alarm
  const niveau = wekker.niveau ?? 'Verplicht';
  const snoozesOver = MAX_SNOOZES - wekker.snoozes;

  return (
    <WekkerLayout
      tijd={tijd}
      kicker={wekker.missieBezig ? t('wekker.nietKlaar') : 'WAKE UP & MOVE'}
      titel={wekker.naam ?? t('wekker.standaardTitel')}
    >
      <View style={styles.info}>
        <LevelTag level={niveau} />
        {(alarm || wekker.oefeningen) && (
          <Text style={styles.infoTekst}>
            {alarm ? `${dagenTekst(alarm.dagen)} · ` : ''}
            {missiesTekst(missiesVanDag(wekker.oefeningen ?? [], wekker.wisselend).length)}
          </Text>
        )}
      </View>
      {toegang.missiesActief || wekker.missieBezig ? (
        <PrimaryButton
          label={wekker.missieBezig ? t('wekker.verder') : t('wekker.start')}
          onPress={startMissie}
          style={styles.knop}
        />
      ) : (
        <Text style={styles.streng}>{t('premium.wekker')}</Text>
      )}
      {!wekker.missieBezig && niveau === 'Vrij' && (
        <>
          <SecondaryButton
            label={t('wekker.snooze', { n: SNOOZE_MINUTEN })}
            onPress={() => snooze(SNOOZE_MINUTEN, false)}
            style={styles.knopKlein}
          />
          <SecondaryButton label={t('wekker.stop')} onPress={stop} style={styles.knopKlein} />
        </>
      )}
      {!wekker.missieBezig && niveau === 'Flexibel' && (
        <View style={styles.rij}>
          {[15, 30, 60].map((m) => (
            <SecondaryButton
              key={m}
              label={m === 60 ? t('wekker.plusUur') : t('wekker.plusMin', { n: m })}
              onPress={() => snooze(m, false)}
              style={styles.rijKnop}
            />
          ))}
        </View>
      )}
      {!wekker.missieBezig && niveau === 'Uitstelbaar' && snoozesOver > 0 && (
        <SecondaryButton
          label={t('wekker.snoozeNog', { min: SNOOZE_MINUTEN, n: snoozesOver })}
          onPress={() => snooze(SNOOZE_MINUTEN, true)}
          style={styles.knopKlein}
        />
      )}
      {(niveau === 'Verplicht' || niveau === 'Hardcore') && (
        <Text style={styles.streng}>{t('wekker.streng')}</Text>
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
        <Text maxFontSizeMultiplier={1.2} style={styles.klok}>
          {tijd}
        </Text>
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
