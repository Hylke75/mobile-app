import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { StapDetector } from '@/components/missie/StapDetector';
import { Screen } from '@/components/Screen';
import { LevelTag, PrimaryButton } from '@/components/ui';
import { isStreng } from '@/constants/alarm';
import { doelenUitTekst, doelVoor, OEFENING_INFO } from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useSessies } from '@/hooks/useSessies';
import { useStartDoel } from '@/hooks/useStartDoel';
import { useToast } from '@/hooks/useToast';
import { alarmenBeschikbaar, planWakkerCheck, rondWekkerAf } from '@/lib/alarmen';
import { actieveMissie, zetActieveMissie } from '@/lib/missieStatus';
import { spreek, stopSpraak } from '@/lib/spraak';
import { volgendAlarm } from '@/lib/tijd';
import type { Niveau, Oefening, StapResultaat } from '@/types/app';

const STANDAARD_MISSIE: Oefening[] = ['Squats', 'Bed opmaken', 'Gordijnen open'];

export default function MissieScherm() {
  const params = useLocalSearchParams<{
    alarmId?: string;
    occurrenceId?: string;
    vervolgId?: string;
    vanWekker?: string;
    niveau?: string;
    oefeningen?: string;
    doelen?: string;
  }>();
  const { alarms, herplan } = useAlarmen();
  const { slaOp, statistiek } = useSessies();
  const { showToast } = useToast();

  const vanWekker = params.vanWekker === '1';
  const startDoel = useStartDoel();
  const alarm = useMemo(() => {
    if (params.alarmId) return alarms.find((a) => a.id === params.alarmId) ?? null;
    return volgendAlarm(alarms)?.alarm ?? null;
  }, [alarms, params.alarmId]);
  // Niveau en oefeningen komen ook mee vanuit het native alarm, zodat dit offline werkt
  const niveau = (alarm?.niveau ?? (params.niveau || undefined)) as Niveau | undefined;
  const [oefeningen] = useState<Oefening[]>(
    () =>
      alarm?.oefeningen ??
      (params.oefeningen ? (params.oefeningen.split(',') as Oefening[]) : STANDAARD_MISSIE),
  );
  const [doelen] = useState(() => alarm?.doelen ?? doelenUitTekst(params.doelen));
  const streng = vanWekker ? isStreng(niveau ?? 'Verplicht') : false;

  const [gestartOp] = useState(() => new Date());
  const [stap, setStap] = useState(0);
  const [poging, setPoging] = useState(0);
  const [gedaan, setGedaan] = useState(0);
  const [stapKlaar, setStapKlaar] = useState(false);
  const [methode, setMethode] = useState<StapResultaat['methode']>('camera');
  const [resultaten, setResultaten] = useState<StapResultaat[]>([]);
  const [klaar, setKlaar] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [stil, setStil] = useState(false);
  const opgeslagen = useRef(false);

  const oefening = oefeningen[stap]!;
  const info = OEFENING_INFO[oefening];
  const doel = doelVoor(oefening, doelen);
  const laatsteStap = stap === oefeningen.length - 1;

  const zegt = useCallback(
    (tekst: string) => {
      setFeedback(tekst);
      if (!stil) spreek(tekst);
    },
    [stil],
  );

  useEffect(() => () => stopSpraak(), []);

  useEffect(() => {
    if (!vanWekker || !params.alarmId) return;
    zetActieveMissie({ alarmId: params.alarmId, vervolgId: params.vervolgId || undefined });
    return () => zetActieveMissie(null);
  }, [vanWekker, params.alarmId, params.vervolgId]);

  const onVoortgang = useCallback(
    (waarde: number) => {
      const begrensd = Math.min(waarde, doel);
      setGedaan(begrensd);
      if (info.eenheid === 'herhalingen') {
        const zin =
          info.spraak[Math.min(Math.floor((begrensd / doel) * 3), info.spraak.length - 1)];
        if (zin && begrensd > 0 && begrensd % 5 === 0 && begrensd < doel) zegt(zin);
      }
    },
    [info, doel, zegt],
  );

  const onKlaar = useCallback(
    (m: 'camera' | 'licht' | 'foto') => {
      setMethode(m);
      setGedaan(doel);
      setStapKlaar(true);
      zegt('Yes! Volgende stap.');
    },
    [doel, zegt],
  );

  const handmatigAfvinken = () => {
    setMethode('handmatig');
    setGedaan(doel);
    setStapKlaar(true);
  };

  const opnieuw = () => {
    setGedaan(0);
    setStapKlaar(false);
    setPoging((p) => p + 1);
  };

  const rondAf = async (status: 'voltooid' | 'afgebroken', stappen: StapResultaat[]) => {
    if (opgeslagen.current) return;
    opgeslagen.current = true;
    // Eerst het alarm stoppen, daarna opslaan: een traag netwerk mag het alarm niet laten herhalen
    if (vanWekker && params.alarmId) {
      const vervolgId = actieveMissie()?.vervolgId ?? params.vervolgId;
      zetActieveMissie(null);
      await rondWekkerAf(params.alarmId, params.occurrenceId, vervolgId).catch(() => {});
      herplan();
      if (status === 'voltooid' && niveau === 'Hardcore') {
        await planWakkerCheck(params.alarmId).catch(() => {});
        showToast('Wakker-check over 5 minuten.');
      }
    }
    const fout = await slaOp({
      alarmId: alarm?.id ?? params.alarmId ?? null,
      gestartOp,
      afgerondOp: new Date(),
      status,
      stappen,
      totaalHerhalingen: stappen
        .filter((s) => OEFENING_INFO[s.oefening].eenheid === 'herhalingen')
        .reduce((som, s) => som + s.gedaan, 0),
    });
    if (fout) showToast(fout);
  };

  const volgende = async () => {
    const nieuw = [...resultaten, { oefening, doel, gedaan: doel, methode }];
    setResultaten(nieuw);
    if (laatsteStap) {
      setKlaar(true);
      zegt('You did it! Je missie is klaar.');
      await rondAf('voltooid', nieuw);
      return;
    }
    setStap(stap + 1);
    setGedaan(0);
    setStapKlaar(false);
  };

  const bevestig = (titel: string, tekst: string, actie: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${titel}\n\n${tekst}`)) actie();
      return;
    }
    Alert.alert(titel, tekst, [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Doorgaan', style: 'destructive', onPress: actie },
    ]);
  };

  const sluitRef = useRef<() => void>(() => {});
  const sluit = () => {
    if (klaar) {
      router.dismissTo('/');
      return;
    }
    if (vanWekker && streng) {
      bevestig(
        'Missie verlaten?',
        'Je alarm gaat binnen een paar minuten opnieuw af tot je missie klaar is.',
        () => router.dismissTo('/'),
      );
    } else {
      router.dismissTo('/');
    }
  };
  useEffect(() => {
    sluitRef.current = sluit;
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      sluitRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  const noodstop = () =>
    bevestig(
      'Noodstop',
      'Het alarm stopt en deze missie wordt als afgebroken opgeslagen.',
      async () => {
        await rondAf('afgebroken', resultaten);
        router.dismissTo('/');
        showToast('Missie gestopt.');
      },
    );

  // Zonder alarm is de missie alleen voor ingelogde gebruikers met een profiel
  if (!vanWekker && startDoel) return <Redirect href={startDoel} />;

  if (klaar) {
    return (
      <Screen dark>
        <StatusBar style="light" />
        <View style={styles.top}>
          <Text style={styles.stage}>MISSION COMPLETE</Text>
          <SluitKnop label="Sluiten" onPress={() => router.dismissTo('/')} />
        </View>
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Icon name="check" size={52} strokeWidth={2.5} color={kleuren.ink} />
          </View>
          <Text style={styles.doneTitle}>
            YOU DID{'\n'}
            <Text style={styles.lime}>IT.</Text>
          </Text>
          <Text style={styles.doneText}>
            Je hebt je hele missie afgemaakt.{'\n'}Dat is hoe je een dag begint. 💪
          </Text>
          <View style={styles.doneStat}>
            <View style={styles.doneStatItem}>
              <Text style={styles.doneStatValue}>{Math.max(statistiek.streak, 1)}</Text>
              <Text style={styles.doneStatLabel}>DAGEN STREAK</Text>
            </View>
            <View style={styles.doneStatItem}>
              <Text style={styles.doneStatValue}>
                {oefeningen.length}/{oefeningen.length}
              </Text>
              <Text style={styles.doneStatLabel}>MISSIES KLAAR</Text>
            </View>
          </View>
          <PrimaryButton label="Terug naar vandaag" onPress={() => router.dismissTo('/')} />
        </View>
      </Screen>
    );
  }

  const [titel, accent] = info.titel;
  const handmatigToegestaan = !streng || !alarmenBeschikbaar;
  const label =
    info.eenheid === 'herhalingen'
      ? 'HERHALINGEN'
      : info.eenheid === 'seconden'
        ? 'SECONDEN'
        : 'UITGEVOERD';

  return (
    <Screen dark>
      <StatusBar style="light" />
      <View style={styles.top}>
        <Text style={styles.stage}>
          LIVE MISSIE{' '}
          <Text style={styles.stageMuted}>
            / {stap + 1} VAN {oefeningen.length}
          </Text>
        </Text>
        <SluitKnop label="Missie verlaten" onPress={sluit} />
      </View>
      <Text style={styles.title}>
        {titel}
        <Text style={styles.lime}>{accent}</Text>
      </Text>
      <Text style={styles.subtitle}>{info.beschrijving}</Text>
      <View style={styles.steps}>
        {oefeningen.map((o, i) => (
          <View key={`${o}-${i}`} style={[styles.step, i <= stap && styles.stepFilled]} />
        ))}
      </View>

      {!stapKlaar ? (
        <StapDetector
          key={`${stap}-${poging}`}
          oefening={oefening}
          doel={doel}
          onVoortgang={onVoortgang}
          onFeedback={zegt}
          onKlaar={onKlaar}
        />
      ) : (
        <View style={styles.stapKlaar}>
          <Text style={styles.stapKlaarEmoji}>{info.emoji}</Text>
          <Text style={styles.stapKlaarTekst}>Stap afgerond</Text>
        </View>
      )}

      <View style={styles.repsRow}>
        <View>
          <Text style={styles.repsLabel}>{label}</Text>
          <Text style={styles.repsCount}>
            {gedaan}
            <Text style={styles.repsTotal}> / {doel}</Text>
          </Text>
        </View>
        <LevelTag level="hard" label={stapKlaar ? 'KLAAR ✓' : 'BEZIG'} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={stil ? 'Spraak aanzetten' : 'Spraak uitzetten'}
        onPress={() => {
          if (!stil) stopSpraak();
          setStil(!stil);
        }}
        style={styles.voice}
      >
        <Icon name="sound" size={17} color={stil ? '#668068' : kleuren.lime} />
        <Text style={styles.voiceText}>{feedback || info.spraak[0]}</Text>
      </Pressable>

      <View style={styles.actions}>
        {stapKlaar ? (
          <PrimaryButton
            label={laatsteStap ? 'Rond missie af' : 'Volgende ronde'}
            onPress={volgende}
            style={styles.flex}
          />
        ) : handmatigToegestaan ? (
          <PrimaryButton
            label="Markeer als uitgevoerd"
            icon="check"
            onPress={handmatigAfvinken}
            style={styles.flex}
          />
        ) : (
          <View style={[styles.flex, styles.wachtKnop]}>
            <Text style={styles.wachtTekst}>Rond de stap af voor de camera</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start ronde opnieuw"
          onPress={opnieuw}
          style={styles.outlineBtn}
        >
          <Text style={styles.outlineBtnText}>↺</Text>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={noodstop} style={styles.emergency}>
        <Text style={styles.emergencyText}>Noodstop</Text>
      </Pressable>
    </Screen>
  );
}

function SluitKnop({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.close}
    >
      <Icon name="close" color={kleuren.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, width: undefined },
  lime: { color: kleuren.lime },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stage: {
    fontFamily: fonts.body800,
    fontSize: 11,
    letterSpacing: em(0.12, 11),
    color: kleuren.lime,
  },
  stageMuted: { color: '#6D856E' },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#4C5C4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.head700,
    fontSize: 37,
    lineHeight: 36.3,
    letterSpacing: em(-0.075, 37),
    color: kleuren.white,
    marginTop: 24,
    marginBottom: 7,
  },
  subtitle: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 18,
    color: '#9EAEA0',
    marginBottom: 17,
  },
  steps: { flexDirection: 'row', gap: 5 },
  step: { flex: 1, height: 5, borderRadius: 10, backgroundColor: '#354337' },
  stepFilled: { backgroundColor: kleuren.lime },
  stapKlaar: {
    height: 285,
    marginTop: 18,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#50674E',
    backgroundColor: '#1B2C22',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stapKlaarEmoji: { fontSize: 90 },
  stapKlaarTekst: {
    fontFamily: fonts.body800,
    fontSize: 11,
    letterSpacing: em(0.13, 11),
    color: kleuren.lime,
  },
  repsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 21,
  },
  repsLabel: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.13, 10),
    color: '#9CB09C',
  },
  repsCount: {
    fontFamily: fonts.head700,
    fontSize: 68,
    lineHeight: 65,
    letterSpacing: em(-0.07, 68),
    color: kleuren.lime,
  },
  repsTotal: { fontSize: 25, color: '#668068' },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#283B2B',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  voiceText: { flex: 1, fontFamily: fonts.body400, fontSize: 12, color: '#D3E2CC' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  wachtKnop: {
    minHeight: 51,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#415C42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wachtTekst: { fontFamily: fonts.body800, fontSize: 12, color: '#9CB09C' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#61735E',
    borderRadius: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { fontFamily: fonts.body800, fontSize: 11, color: kleuren.white },
  emergency: { alignSelf: 'center', marginTop: 17, padding: 4 },
  emergencyText: {
    fontFamily: fonts.body400,
    fontSize: 10,
    color: '#819181',
    textDecorationLine: 'underline',
  },
  done: { alignItems: 'stretch', paddingTop: 60 },
  doneIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: kleuren.lime,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 23,
  },
  doneTitle: {
    fontFamily: fonts.head700,
    fontSize: 48,
    lineHeight: 47,
    letterSpacing: em(-0.07, 48),
    color: kleuren.white,
    textAlign: 'center',
    marginBottom: 15,
  },
  doneText: {
    fontFamily: fonts.body400,
    fontSize: 14,
    lineHeight: 22,
    color: '#B2C2B0',
    textAlign: 'center',
  },
  doneStat: {
    backgroundColor: '#283B2D',
    borderWidth: 1,
    borderColor: '#415C42',
    borderRadius: 19,
    padding: 19,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 36,
  },
  doneStatItem: { alignItems: 'center' },
  doneStatValue: { fontFamily: fonts.head700, fontSize: 28, color: kleuren.lime },
  doneStatLabel: { fontFamily: fonts.body400, fontSize: 10, color: '#99AE97' },
});
