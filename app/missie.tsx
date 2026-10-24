import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '@/components/Icon';
import { BewegingStap, SPRONGEN_DOEL } from '@/components/missie/BewegingStap';
import { StapDetector } from '@/components/missie/StapDetector';
import { TimerStap } from '@/components/missie/TimerStap';
import { Screen } from '@/components/Screen';
import { LevelTag, PrimaryButton } from '@/components/ui';
import { isStreng } from '@/constants/alarm';
import { useTaal } from '@/i18n';
import { doelenUitTekst, OEFENING_INFO } from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { useSchermAan } from '@/hooks/useSchermAan';
import { useSessies } from '@/hooks/useSessies';
import { useStartDoel } from '@/hooks/useStartDoel';
import { useToast } from '@/hooks/useToast';
import { alarmenBeschikbaar, planWakkerCheck, rondWekkerAf } from '@/lib/alarmen';
import { vraagBeoordelingNaStreak } from '@/lib/beoordeling';
import { actieveMissie, zetActieveMissie } from '@/lib/missieStatus';
import { spreek, stopSpraak } from '@/lib/spraak';
import {
  badgesVoor,
  berekenStatistiek,
  bereiktMijlpaal,
  gemiddeldeReactie,
  minutenNaAlarm,
} from '@/lib/statistiek';
import { volgendAlarm, volgendeKeer } from '@/lib/tijd';
import { succes, tik } from '@/lib/trilling';
import { eigenUitTekst, isOefening, missieInfos, missiesVanDag } from '@/lib/missies';
import type { MissieId, Niveau, StapResultaat } from '@/types/app';

const STANDAARD_MISSIE: MissieId[] = ['Squats', 'Bed opmaken', 'Gordijnen open'];

export default function MissieScherm() {
  const params = useLocalSearchParams<{
    alarmId?: string;
    occurrenceId?: string;
    vervolgId?: string;
    vanWekker?: string;
    niveau?: string;
    oefeningen?: string;
    doelen?: string;
    oefen?: string;
    eigen?: string;
  }>();
  const { alarms, herplan, eigenMap } = useAlarmen();
  const { slaOp, zetGevoel, statistiek, sessies } = useSessies();
  const { showToast } = useToast();
  const { t, taal } = useTaal();
  const weekdoel = useAuth().profiel?.weekdoel ?? 7;

  const vanWekker = params.vanWekker === '1';
  // Proefronde vanuit de editor: eigen oefeningen, niet gekoppeld aan een alarm en niet opgeslagen
  const proef = params.oefen === '1';
  const startDoel = useStartDoel();
  const alarm = useMemo(() => {
    if (proef) return null;
    if (params.alarmId) return alarms.find((a) => a.id === params.alarmId) ?? null;
    return volgendAlarm(alarms)?.alarm ?? null;
  }, [alarms, params.alarmId, proef]);
  // Niveau en oefeningen komen ook mee vanuit het native alarm, zodat dit offline werkt
  const niveau = (alarm?.niveau ?? (params.niveau || undefined)) as Niveau | undefined;
  // Bij een wisselend alarm alleen de missie van vandaag (de wekker geeft die al mee)
  const [ids] = useState<MissieId[]>(() =>
    alarm && !params.oefeningen
      ? missiesVanDag(alarm.oefeningen, alarm.wisselend, volgendeKeer(alarm) ?? new Date())
      : params.oefeningen
        ? (params.oefeningen.split(',') as MissieId[])
        : (alarm?.oefeningen ?? STANDAARD_MISSIE),
  );
  const [doelen] = useState(() => alarm?.doelen ?? doelenUitTekst(params.doelen));
  // Eigen missies uit het account, aangevuld met die uit het native alarm (werkt ook offline)
  const eigen = useMemo(() => {
    const kaart = new Map(eigenMap);
    for (const m of eigenUitTekst(params.eigen)) if (!kaart.has(m.id)) kaart.set(m.id, m);
    return kaart;
  }, [eigenMap, params.eigen]);
  // Opnieuw opbouwen bij een taalwissel, zodat namen en uitleg meevertalen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gevonden = useMemo(() => missieInfos(ids, eigen, doelen), [ids, eigen, doelen, taal]);
  const oefeningen = gevonden.length ? gevonden : missieInfos(STANDAARD_MISSIE, eigen, doelen);
  const streng = vanWekker ? isStreng(niveau ?? 'Verplicht') : false;

  // Het scherm mag niet op slot gaan terwijl de camera je oefeningen volgt
  useSchermAan();
  const [gestartOp] = useState(() => new Date());
  const [stap, setStap] = useState(0);
  const [poging, setPoging] = useState(0);
  const [gedaan, setGedaan] = useState(0);
  const [gevoel, setGevoel] = useState<number | null>(null);
  const bewaardGevoel = useRef<number | null>(null);
  // Pas bewaren als de missie zelf in de lijst staat (opslaan kan nog bezig zijn)
  useEffect(() => {
    if (!gevoel || bewaardGevoel.current === gevoel) return;
    if (!sessies.some((s) => Math.abs(s.gestartOp.getTime() - gestartOp.getTime()) < 1000)) return;
    bewaardGevoel.current = gevoel;
    zetGevoel(gestartOp, gevoel).catch(() => {});
  }, [gevoel, sessies, gestartOp, zetGevoel]);
  const [stapKlaar, setStapKlaar] = useState(false);
  const [methode, setMethode] = useState<StapResultaat['methode']>('camera');
  const [resultaten, setResultaten] = useState<StapResultaat[]>([]);
  const [klaar, setKlaar] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [stil, setStil] = useState(false);
  const opgeslagen = useRef(false);
  const teller = useRef(0);

  const missie = oefeningen[Math.min(stap, oefeningen.length - 1)]!;
  const oefening = missie.id;
  const info = missie;
  const tekst = missie;
  const volgendeMissie = oefeningen[stap + 1];
  // Herkent de camera je niet, dan mag je in plaats daarvan springen met je telefoon
  const [alternatief, setAlternatief] = useState(false);
  const [wisselZichtbaar, setWisselZichtbaar] = useState(false);
  const doel = alternatief ? SPRONGEN_DOEL : missie.doel;
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
    if (info.methode !== 'pose' || stapKlaar || alternatief || gedaan > 0) return;
    const timer = setTimeout(() => setWisselZichtbaar(true), 90000);
    return () => clearTimeout(timer);
  }, [info.methode, stapKlaar, alternatief, gedaan, stap, poging]);

  const kiesAlternatief = () => {
    setAlternatief(true);
    setWisselZichtbaar(false);
    setGedaan(0);
    teller.current = 0;
    zegt(t('missie.spraak.alternatief', { n: SPRONGEN_DOEL }));
  };

  useEffect(() => {
    if (!vanWekker || !params.alarmId) return;
    zetActieveMissie({ alarmId: params.alarmId, vervolgId: params.vervolgId || undefined });
    return () => zetActieveMissie(null);
  }, [vanWekker, params.alarmId, params.vervolgId]);

  const onVoortgang = useCallback(
    (waarde: number) => {
      const begrensd = Math.min(waarde, doel);
      if (begrensd > teller.current) {
        tik();
        if (begrensd % 5 === 0 || begrensd === doel) {
          AccessibilityInfo.announceForAccessibility(t('missie.teller', { n: begrensd, doel }));
        }
      }
      teller.current = begrensd;
      setGedaan(begrensd);
      if (info.eenheid === 'herhalingen') {
        const zin =
          tekst.spraak[Math.min(Math.floor((begrensd / doel) * 3), tekst.spraak.length - 1)];
        if (zin && begrensd > 0 && begrensd % 5 === 0 && begrensd < doel) zegt(zin);
      }
    },
    [info, tekst, doel, zegt, t],
  );

  const onKlaar = useCallback(
    (m: 'camera' | 'licht' | 'foto' | 'timer' | 'beweging') => {
      setMethode(m);
      setGedaan(doel);
      setStapKlaar(true);
      succes();
      zegt(t('missie.spraak.volgendeStap'));
    },
    [doel, zegt, t],
  );

  const handmatigAfvinken = () => {
    setMethode('handmatig');
    setGedaan(doel);
    setStapKlaar(true);
  };

  const opnieuw = () => {
    setGedaan(0);
    teller.current = 0;
    setAlternatief(false);
    setWisselZichtbaar(false);
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
        showToast(t('missie.wakkerCheckToast'));
      }
    }
    if (proef) return;
    const fout = await slaOp({
      alarmId: alarm?.id ?? params.alarmId ?? null,
      gestartOp,
      afgerondOp: new Date(),
      status,
      stappen,
      totaalHerhalingen: stappen
        .filter(
          (s) => isOefening(s.oefening) && OEFENING_INFO[s.oefening].eenheid === 'herhalingen',
        )
        .reduce((som, s) => som + s.gedaan, 0),
    });
    if (fout) showToast(fout);
  };

  const volgende = async () => {
    const nieuw = [...resultaten, { oefening, doel, gedaan: doel, methode }];
    setResultaten(nieuw);
    if (laatsteStap) {
      setKlaar(true);
      succes();
      zegt(t('missie.spraak.klaar'));
      await rondAf('voltooid', nieuw);
      return;
    }
    setStap(stap + 1);
    setFeedback('');
    setGedaan(0);
    teller.current = 0;
    setAlternatief(false);
    setWisselZichtbaar(false);
    setStapKlaar(false);
  };

  const bevestig = (titel: string, tekst: string, actie: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${titel}\n\n${tekst}`)) actie();
      return;
    }
    Alert.alert(titel, tekst, [
      { text: t('algemeen.annuleren'), style: 'cancel' },
      { text: t('algemeen.doorgaan'), style: 'destructive', onPress: actie },
    ]);
  };

  const sluitRef = useRef<() => void>(() => {});
  const sluit = () => {
    if (proef) {
      router.back();
      return;
    }
    if (klaar) {
      router.dismissTo('/');
      return;
    }
    if (vanWekker && streng) {
      bevestig(t('missie.verlatenTitel'), t('missie.verlatenTekst'), () => router.dismissTo('/'));
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
    bevestig(t('missie.noodstop'), t('missie.noodstopTekst'), async () => {
      await rondAf('afgebroken', resultaten);
      if (proef) {
        router.back();
        return;
      }
      router.dismissTo('/');
      showToast(t('missie.gestopt'));
    });

  // Zonder alarm is de missie alleen voor ingelogde gebruikers met een profiel
  if (!vanWekker && startDoel) return <Redirect href={startDoel} />;

  if (klaar) {
    // Vergelijk met de voortgang zonder deze missie, zodat alleen echt nieuwe badges verschijnen
    const voor = berekenStatistiek(
      sessies.filter((s) => Math.abs(s.gestartOp.getTime() - gestartOp.getTime()) > 1000),
      weekdoel,
    );
    const alBehaald = new Set(
      badgesVoor(voor)
        .filter((b) => b.behaald)
        .map((b) => b.id),
    );
    const nieuweBadges = badgesVoor(statistiek).filter((b) => b.behaald && !alBehaald.has(b.id));
    const mijlpaal = bereiktMijlpaal(voor.streak, statistiek.streak);
    const zichtbaar = nieuweBadges.slice(0, mijlpaal ? 2 : 3);
    const meer = nieuweBadges.length - zichtbaar.length;
    const reactie = vanWekker && alarm ? minutenNaAlarm(gestartOp, alarm.tijd) : null;
    const gemiddeld =
      reactie !== null
        ? gemiddeldeReactie(sessies, new Map(alarms.map((a) => [a.id, a.tijd])))
        : null;
    if (proef) {
      return (
        <Screen dark>
          <StatusBar style="light" />
          <View style={styles.done}>
            <View style={styles.doneIcon}>
              <Icon name="check" size={52} strokeWidth={2.5} color={kleuren.ink} />
            </View>
            <Text maxFontSizeMultiplier={1.2} style={styles.doneTitle}>
              {t('missie.proef.titel')}
              {'\n'}
              <Text style={styles.lime}>{t('missie.proef.accent')}</Text>
            </Text>
            <Text style={styles.doneText}>
              {t('missie.proef.tekst')}
              {'\n'}
              {t('missie.proef.telt')}
            </Text>
            <PrimaryButton
              label={t('missie.proef.terug')}
              onPress={() => router.back()}
              style={styles.proefKnop}
            />
          </View>
        </Screen>
      );
    }
    return (
      <Screen dark>
        <StatusBar style="light" />
        <View style={styles.top}>
          <Text style={styles.stage}>MISSION COMPLETE</Text>
          <SluitKnop label={t('algemeen.sluiten')} onPress={() => router.dismissTo('/')} />
        </View>
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Icon name="check" size={52} strokeWidth={2.5} color={kleuren.ink} />
          </View>
          <Text maxFontSizeMultiplier={1.2} style={styles.doneTitle}>
            YOU DID{'\n'}
            <Text style={styles.lime}>IT.</Text>
          </Text>
          <Text style={styles.doneText}>
            {t('missie.klaar.tekst')}
            {'\n'}
            {t('missie.klaar.tekst2')}
          </Text>
          {reactie !== null && (
            <Text style={styles.reactie}>
              {t(reactie === 0 ? 'missie.klaar.reactieSnel' : 'missie.klaar.reactie', {
                n: reactie,
                gemiddeld: gemiddeld !== null ? t('missie.klaar.gemiddeld', { n: gemiddeld }) : '',
              })}
            </Text>
          )}
          <View style={styles.doneStat}>
            <View style={styles.doneStatItem}>
              <Text style={styles.doneStatValue}>{Math.max(statistiek.streak, 1)}</Text>
              <Text style={styles.doneStatLabel}>{t('missie.klaar.dagenStreak')}</Text>
            </View>
            <View style={styles.doneStatItem}>
              <Text style={styles.doneStatValue}>
                {oefeningen.length}/{oefeningen.length}
              </Text>
              <Text style={styles.doneStatLabel}>{t('missie.klaar.missiesKlaar')}</Text>
            </View>
          </View>
          {(mijlpaal || nieuweBadges.length > 0) && (
            <View style={styles.nieuw} accessibilityLiveRegion="polite">
              {mijlpaal && (
                <Text style={styles.nieuwTekst}>{t('missie.klaar.mijlpaal', { n: mijlpaal })}</Text>
              )}
              {zichtbaar.map((b) => (
                <Text key={b.id} style={styles.nieuwTekst}>
                  {t('missie.klaar.badge', { emoji: b.emoji, naam: b.naam })}
                </Text>
              ))}
              {meer > 0 && (
                <Text style={styles.nieuwTekst}>{t('missie.klaar.meerBadges', { n: meer })}</Text>
              )}
            </View>
          )}
          {!proef && (
            <View style={styles.gevoel}>
              <Text style={styles.gevoelVraag}>
                {gevoel ? t('missie.klaar.gevoel.dank') : t('missie.klaar.gevoel.vraag')}
              </Text>
              <View style={styles.gevoelRij}>
                {(
                  [
                    [1, '😴', 'missie.klaar.gevoel.moe'],
                    [2, '🙂', 'missie.klaar.gevoel.oke'],
                    [3, '💪', 'missie.klaar.gevoel.sterk'],
                  ] as const
                ).map(([waarde, emoji, sleutel]) => (
                  <Pressable
                    key={waarde}
                    accessibilityRole="button"
                    accessibilityState={{ selected: gevoel === waarde }}
                    accessibilityLabel={t('missie.klaar.gevoel.a11y', { gevoel: t(sleutel) })}
                    onPress={() => setGevoel(waarde)}
                    style={[styles.gevoelKnop, gevoel === waarde && styles.gevoelGekozen]}
                  >
                    <Text style={styles.gevoelEmoji}>{emoji}</Text>
                    <Text
                      style={[styles.gevoelLabel, gevoel === waarde && styles.gevoelLabelGekozen]}
                    >
                      {t(sleutel)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <PrimaryButton
            label={t('missie.klaar.terug')}
            onPress={() => {
              router.dismissTo('/');
              vraagBeoordelingNaStreak(statistiek.streak);
            }}
          />
        </View>
      </Screen>
    );
  }

  const [titel, accent] = tekst.titel;
  const handmatigToegestaan = !streng || !alarmenBeschikbaar;
  const eenheid =
    info.eenheid === 'herhalingen'
      ? 'herhalingen'
      : info.eenheid === 'seconden'
        ? 'seconden'
        : 'uitgevoerd';
  const label = t(`missie.eenheid.${eenheid}`);

  return (
    <Screen dark>
      <StatusBar style="light" />
      <View style={styles.top}>
        <Text style={styles.stage}>
          {proef ? t('missie.proefronde') : t('missie.live')}{' '}
          <Text style={styles.stageMuted}>
            {t('missie.stapVan', { stap: stap + 1, totaal: oefeningen.length })}
          </Text>
        </Text>
        <SluitKnop label={t('missie.verlaten')} onPress={sluit} />
      </View>
      <Text maxFontSizeMultiplier={1.2} style={styles.title}>
        {titel}
        <Text style={styles.lime}>{accent}</Text>
      </Text>
      <Text style={styles.subtitle}>{tekst.beschrijving}</Text>
      <View style={styles.steps}>
        {oefeningen.map((o, i) => (
          <View key={`${o.id}-${i}`} style={[styles.step, i <= stap && styles.stepFilled]} />
        ))}
      </View>

      <View style={styles.opdracht}>
        <Text style={styles.opdrachtEmoji}>{missie.emoji}</Text>
        <View style={styles.flex}>
          <Text style={styles.opdrachtNaam}>{missie.naam}</Text>
          <Text style={styles.opdrachtDoel}>
            {t('missie.kaart.doel')}: {alternatief ? `${SPRONGEN_DOEL} ×` : missie.doelTekst}
          </Text>
        </View>
      </View>
      {!stapKlaar && (
        <View style={styles.plaatsing}>
          <Icon name="info" size={15} color="#C5D6BE" />
          <Text style={styles.plaatsingTekst}>{missie.instructie}</Text>
        </View>
      )}

      {!stapKlaar && alternatief ? (
        <BewegingStap onVoortgang={onVoortgang} onKlaar={() => onKlaar('beweging')} />
      ) : !stapKlaar && missie.methode === 'timer' ? (
        <TimerStap
          key={`${stap}-${poging}`}
          seconden={missie.doel}
          emoji={missie.emoji}
          onVoortgang={onVoortgang}
          onKlaar={() => onKlaar('timer')}
        />
      ) : !stapKlaar ? (
        <StapDetector
          key={`${stap}-${poging}`}
          missie={missie}
          doel={doel}
          onVoortgang={onVoortgang}
          onFeedback={zegt}
          onKlaar={onKlaar}
        />
      ) : (
        <View style={styles.stapKlaar}>
          <Text maxFontSizeMultiplier={1.2} style={styles.stapKlaarEmoji}>
            {info.emoji}
          </Text>
          <Text style={styles.stapKlaarTekst}>{t('missie.stapAfgerond')}</Text>
        </View>
      )}

      {wisselZichtbaar && !stapKlaar && !alternatief && (
        <Pressable accessibilityRole="button" onPress={kiesAlternatief} style={styles.wissel}>
          <Text style={styles.wisselTekst}>{t('missie.wissel', { n: SPRONGEN_DOEL })}</Text>
        </Pressable>
      )}

      <Text style={styles.hierna}>
        {volgendeMissie
          ? t('missie.kaart.hierna', { naam: `${volgendeMissie.emoji} ${volgendeMissie.naam}` })
          : t('missie.kaart.laatste')}
      </Text>

      <View style={styles.repsRow}>
        <View>
          <Text style={styles.repsLabel}>{label}</Text>
          <Text
            maxFontSizeMultiplier={1.2}
            style={styles.repsCount}
            accessibilityLabel={t(`missie.tellerA11y.${eenheid}`, { n: gedaan, doel })}
          >
            {gedaan}
            <Text style={styles.repsTotal}> / {doel}</Text>
          </Text>
        </View>
        <LevelTag level="hard" label={stapKlaar ? t('missie.klaarTag') : t('missie.bezig')} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={stil ? t('missie.spraakAan') : t('missie.spraakUit')}
        onPress={() => {
          if (!stil) stopSpraak();
          setStil(!stil);
        }}
        style={styles.voice}
      >
        <Icon name="sound" size={17} color={stil ? '#668068' : kleuren.lime} />
        <Text style={styles.voiceText}>{feedback || tekst.spraak[0]}</Text>
      </Pressable>

      <View style={styles.actions}>
        {stapKlaar ? (
          <PrimaryButton
            label={laatsteStap ? t('missie.rondAf') : t('missie.volgendeRonde')}
            onPress={volgende}
            style={styles.flex}
          />
        ) : handmatigToegestaan ? (
          <PrimaryButton
            label={t('missie.markeer')}
            icon="check"
            onPress={handmatigAfvinken}
            style={styles.flex}
          />
        ) : (
          <View style={[styles.flex, styles.wachtKnop]}>
            <Text style={styles.wachtTekst}>{t('missie.wachtCamera')}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('missie.opnieuw')}
          onPress={opnieuw}
          style={styles.outlineBtn}
        >
          <Text style={styles.outlineBtnText}>↺</Text>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={noodstop} style={styles.emergency}>
        <Text style={styles.emergencyText}>{t('missie.noodstop')}</Text>
      </Pressable>
      <Text style={styles.gezondheid}>{t('missie.gezondheid')}</Text>
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
  opdracht: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#22342A',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  opdrachtEmoji: { fontSize: 30 },
  opdrachtNaam: { fontFamily: fonts.body800, fontSize: 17, color: kleuren.white },
  opdrachtDoel: { fontFamily: fonts.body700, fontSize: 13, color: kleuren.lime, marginTop: 2 },
  plaatsing: { flexDirection: 'row', gap: 8, marginTop: 10, paddingHorizontal: 2 },
  plaatsingTekst: {
    flex: 1,
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 17,
    color: '#C5D6BE',
  },
  hierna: { fontFamily: fonts.body600, fontSize: 12, color: '#9CB09C', marginTop: 12 },
  wissel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D8FB59',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  wisselTekst: {
    fontFamily: fonts.body800,
    fontSize: 12,
    color: kleuren.lime,
    textAlign: 'center',
  },
  gezondheid: {
    fontFamily: fonts.body400,
    fontSize: 11,
    lineHeight: 16,
    color: '#9CB09C',
    textAlign: 'center',
    marginTop: 8,
  },
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
  reactie: {
    fontFamily: fonts.body700,
    fontSize: 13,
    lineHeight: 19,
    color: kleuren.lime,
    textAlign: 'center',
    marginTop: 12,
  },
  proefKnop: { marginTop: 32, alignSelf: 'stretch' },
  nieuw: {
    backgroundColor: '#D8FB59',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    gap: 4,
    alignSelf: 'stretch',
  },
  gevoel: { alignSelf: 'stretch', marginBottom: 16, gap: 10 },
  gevoelVraag: { fontFamily: fonts.body800, fontSize: 13, color: '#C7D1C7', textAlign: 'center' },
  gevoelRij: { flexDirection: 'row', gap: 8 },
  gevoelKnop: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2C3A31',
  },
  gevoelGekozen: { backgroundColor: kleuren.lime, borderColor: kleuren.lime },
  gevoelEmoji: { fontSize: 24 },
  gevoelLabel: { fontFamily: fonts.body800, fontSize: 12, color: '#F3F3ED' },
  gevoelLabelGekozen: { color: kleuren.ink },
  nieuwTekst: { fontFamily: fonts.body800, fontSize: 13, color: kleuren.ink, textAlign: 'center' },
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
