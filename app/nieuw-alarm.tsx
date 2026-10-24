import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, PrimaryButton, SecondaryButton } from '@/components/ui';
import {
  DAGEN,
  dagenTekst,
  dagLetter,
  dagNaam,
  niveauNaam,
  niveauUitleg,
  OEFENINGEN,
} from '@/constants/alarm';
import {
  DOEL_BEREIK,
  doelenNaarTekst,
  doelVoor,
  duurTekst,
  OEFENING_INFO,
  oefeningNaam,
} from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useTaal } from '@/i18n';
import { useToast } from '@/hooks/useToast';
import { haalRechtenOp, vraagRechtenAan } from '@/lib/alarmen';
import { cameraStatus, vraagCameraAan } from '@/lib/camera';
import { eigenNaarTekst, isOefening, missieInfos, naarEigenId } from '@/lib/missies';
import { tijdTot, volgendeKeer } from '@/lib/tijd';
import type { Alarm, Doelen, EigenMissie, MissieId, Niveau, Oefening } from '@/types/app';

const NIVEAU_RIJEN: (Niveau | null)[][] = [
  ['Vrij', 'Flexibel', 'Uitstelbaar'],
  ['Verplicht', 'Hardcore', null],
];

const MAX_MISSIES = 12;
const EMOJIS = ['⭐', '📖', '🧘', '🚿', '🍎', '☕', '🐕', '🎵', '✍️', '🌿', '🚶', '💊'];
const DUREN = [30, 60, 120, 180, 300, 600, 900, 1200, 1800];

const naarDatum = (tijd: string) => {
  const [uur, minuut] = tijd.split(':').map(Number);
  const d = new Date();
  d.setHours(uur ?? 7, minuut ?? 0, 0, 0);
  return d;
};

const naarTijd = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function NieuwAlarmScherm() {
  const { id, eerste } = useLocalSearchParams<{ id?: string; eerste?: string }>();
  const {
    alarms,
    maakAan,
    werkBij,
    verwijder,
    eigenMissies,
    eigenMap,
    maakEigenMissie,
    verwijderEigenMissie,
  } = useAlarmen();
  const { showToast } = useToast();
  const { t, locale } = useTaal();
  const bestaand = id ? alarms.find((a) => a.id === id) : undefined;
  // Standaardnaam één keer vastleggen, zodat 'gewijzigd' klopt ook als de taal wisselt
  const [standaardNaam] = useState(() => t('editor.standaardNaam'));
  const [naam, setNaam] = useState(bestaand?.naam ?? standaardNaam);
  const [time, setTime] = useState(bestaand?.tijd ?? '07:00');
  const [days, setDays] = useState<number[]>(bestaand?.dagen ?? [0, 1, 2, 3, 4]);
  const [level, setLevel] = useState<Niveau>(bestaand?.niveau ?? 'Verplicht');
  const [exercises, setExercises] = useState<MissieId[]>(
    bestaand?.oefeningen ?? ['Squats', 'Bed opmaken'],
  );
  // Formulier voor een nieuwe eigen missie
  const [eigenOpen, setEigenOpen] = useState(false);
  const [eigenNaam, setEigenNaam] = useState('');
  const [eigenEmoji, setEigenEmoji] = useState(EMOJIS[0]!);
  const [eigenSoort, setEigenSoort] = useState<EigenMissie['soort']>('timer');
  const [eigenDuur, setEigenDuur] = useState(300);
  const [doelen, setDoelen] = useState<Doelen>(bestaand?.doelen ?? {});
  const [bezig, setBezig] = useState(false);
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const navigation = useNavigation();
  // Na opslaan of verwijderen mag het scherm zonder vraag dicht: eerst de blokkade
  // opheffen, dan (na de volgende render) pas navigeren
  const [vervolg, setVervolg] = useState<{ actie: () => void } | null>(null);
  useEffect(() => {
    vervolg?.actie();
  }, [vervolg]);
  const sluitEn = (actie: () => void) => setVervolg({ actie });

  const wissel = <T,>(lijst: T[], waarde: T) =>
    lijst.includes(waarde) ? lijst.filter((x) => x !== waarde) : [...lijst, waarde];

  const instelbaar = exercises.filter(
    (o): o is Oefening => isOefening(o) && OEFENING_INFO[o].eenheid !== 'handeling',
  );
  // Verwijderde eigen missies vallen hier vanzelf weg
  const gekozen = missieInfos(exercises, eigenMap, doelen);

  const kies = (id: MissieId) => {
    if (!exercises.includes(id) && exercises.length >= MAX_MISSIES) {
      return showToast(t('editor.eigen.max'));
    }
    setExercises((e) => wissel(e, id));
  };

  const voegEigenToe = async () => {
    if (!eigenNaam.trim()) return showToast(t('editor.eigen.naamFout'));
    if (exercises.length >= MAX_MISSIES) return showToast(t('editor.eigen.max'));
    setBezig(true);
    const { fout, missie } = await maakEigenMissie({
      naam: eigenNaam.trim(),
      emoji: eigenEmoji,
      soort: eigenSoort,
      duurSeconden: eigenSoort === 'timer' ? eigenDuur : 60,
    });
    setBezig(false);
    if (fout || !missie) return showToast(fout ?? t('meldingen.ietsMis'));
    setExercises((e) => [...e, naarEigenId(missie.id)]);
    setEigenOpen(false);
    setEigenNaam('');
    showToast(t('editor.eigen.toegevoegd', { naam: missie.naam }));
  };

  const verwijderEigen = (missie: EigenMissie) => {
    const actie = async () => {
      const fout = await verwijderEigenMissie(missie.id);
      if (fout) return showToast(fout);
      setExercises((e) => e.filter((o) => o !== naarEigenId(missie.id)));
      showToast(t('editor.eigen.verwijderd'));
    };
    const titel = t('editor.eigen.verwijderTitel');
    const tekst = t('editor.eigen.verwijderTekst', { naam: missie.naam });
    if (Platform.OS === 'web') {
      if (window.confirm(`${titel}\n\n${tekst}`)) actie();
      return;
    }
    Alert.alert(titel, tekst, [
      { text: t('algemeen.annuleren'), style: 'cancel' },
      { text: t('algemeen.verwijderen'), style: 'destructive', onPress: actie },
    ]);
  };

  const verplaats = (index: number, richting: 1 | -1) => {
    const nieuw = gekozen.map((m) => m.id);
    const doelIndex = index + richting;
    if (doelIndex < 0 || doelIndex >= nieuw.length) return;
    [nieuw[index], nieuw[doelIndex]] = [nieuw[doelIndex]!, nieuw[index]!];
    setExercises(nieuw);
  };

  // Proefronde zonder alarm: zo weet je vooraf waar je je telefoon neerzet
  const oefen = () =>
    router.push({
      pathname: '/missie',
      params: {
        oefeningen: gekozen.map((m) => m.id).join(','),
        doelen: doelenNaarTekst(invoer().doelen),
        eigen: eigenNaarTekst(gekozen.flatMap((m) => (m.eigen ? [m.eigen] : []))),
        oefen: '1',
      },
    });

  const pasDoelAan = (oefening: Oefening, richting: 1 | -1) => {
    const bereik = DOEL_BEREIK[OEFENING_INFO[oefening].eenheid];
    const nieuw = doelVoor(oefening, doelen) + richting * bereik.stap;
    setDoelen({ ...doelen, [oefening]: Math.min(bereik.max, Math.max(bereik.min, nieuw)) });
  };

  const onTijdGekozen = (event: DateTimePickerEvent, datum?: Date) => {
    if (event.type === 'set' && datum) setTime(naarTijd(datum));
  };

  const openTijdkiezer = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: naarDatum(time),
        mode: 'time',
        is24Hour: true,
        onChange: onTijdGekozen,
      });
    } else {
      setIosPickerOpen((open) => !open);
    }
  };

  const geldigeTijd = /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  const invoer = () => ({
    naam: naam.trim(),
    tijd: time,
    dagen: [...days].sort((a, b) => a - b),
    niveau: level,
    oefeningen: gekozen.map((m) => m.id),
    // Alleen doelen bewaren voor gekozen oefeningen die afwijken van de standaard
    doelen: Object.fromEntries(
      instelbaar
        .map((o) => [o, doelVoor(o, doelen)] as const)
        .filter(([o, n]) => n !== OEFENING_INFO[o].doel),
    ) as Doelen,
  });
  const volgende =
    geldigeTijd && days.length ? volgendeKeer({ ...invoer(), id: '', aan: true } as Alarm) : null;

  const gewijzigd =
    JSON.stringify(invoer()) !==
    JSON.stringify(
      bestaand
        ? {
            naam: bestaand.naam,
            tijd: bestaand.tijd,
            dagen: bestaand.dagen,
            niveau: bestaand.niveau,
            oefeningen: bestaand.oefeningen,
            doelen: bestaand.doelen ?? {},
          }
        : {
            naam: standaardNaam,
            tijd: '07:00',
            dagen: [0, 1, 2, 3, 4],
            niveau: 'Verplicht',
            oefeningen: ['Squats', 'Bed opmaken'],
            doelen: {},
          },
    );

  usePreventRemove(gewijzigd && !vervolg && Platform.OS !== 'web', ({ data }) => {
    Alert.alert(t('editor.weggooien.titel'), t('editor.weggooien.tekst'), [
      { text: t('editor.weggooien.verderBewerken'), style: 'cancel' },
      {
        text: t('editor.weggooien.weggooien'),
        style: 'destructive',
        onPress: () => sluitEn(() => navigation.dispatch(data.action)),
      },
    ]);
  });

  const vraag = (titel: string, tekst: string, knop: string) =>
    new Promise<boolean>((klaar) => {
      if (Platform.OS === 'web') return klaar(window.confirm(`${titel}\n\n${tekst}`));
      Alert.alert(titel, tekst, [
        { text: t('algemeen.annuleren'), style: 'cancel', onPress: () => klaar(false) },
        { text: knop, onPress: () => klaar(true) },
      ]);
    });

  const opslaan = async () => {
    if (bezig) return;
    if (!geldigeTijd) return showToast(t('editor.fouten.tijd'));
    if (!naam.trim()) return showToast(t('editor.fouten.naam'));
    if (!days.length) return showToast(t('editor.fouten.dag'));
    if (!gekozen.length) return showToast(t('editor.fouten.missie'));
    const dubbel = alarms.find(
      (a) =>
        a.id !== bestaand?.id && a.aan && a.tijd === time && a.dagen.some((d) => days.includes(d)),
    );
    if (
      dubbel &&
      !(await vraag(
        t('editor.dubbel.titel'),
        t('editor.dubbel.tekst', {
          naam: dubbel.naam,
          tijd: time,
          dagen: dagenTekst(dubbel.dagen),
        }),
        t('algemeen.opslaan'),
      ))
    ) {
      return;
    }
    setBezig(true);

    const rechten = await haalRechtenOp().catch(() => null);
    if (rechten && !rechten.canScheduleExactAlarms && rechten.status !== 'unavailable') {
      await vraagRechtenAan().catch(() => null);
    }
    if (cameraStatus() === 'onbekend') await vraagCameraAan().catch(() => false);

    const gegevens = invoer();
    const fout = bestaand ? await werkBij(bestaand.id, gegevens) : await maakAan(gegevens);
    setBezig(false);
    if (fout) return showToast(fout);
    sluitEn(() => router.dismissTo('/alarmen'));
    const wanneer = volgendeKeer({ ...gegevens, id: '', aan: true } as Alarm);
    showToast(
      wanneer
        ? t('editor.opgeslagen', { tijd: tijdTot(wanneer) })
        : bestaand
          ? t('editor.bijgewerkt')
          : t('editor.nieuwInLijst'),
    );
  };

  const dupliceer = async () => {
    if (!bestaand || bezig) return;
    setBezig(true);
    const kopieNaam = t('editor.kopieNaam', { naam: naam.trim() || bestaand.naam }).slice(0, 40);
    const fout = await maakAan({ ...invoer(), naam: kopieNaam });
    setBezig(false);
    if (fout) return showToast(fout);
    sluitEn(() => router.dismissTo('/alarmen'));
    showToast(t('editor.kopieInLijst', { naam: kopieNaam }));
  };

  const verwijderAlarm = () => {
    if (!bestaand) return;
    const actie = async () => {
      const { id: _id, aan: _aan, ...kopie } = bestaand;
      const fout = await verwijder(bestaand.id);
      if (fout) return showToast(fout);
      sluitEn(() => router.dismissTo('/alarmen'));
      showToast(t('editor.verwijderd'), {
        label: t('editor.ongedaanMaken'),
        onPress: async () => {
          const terug = await maakAan(kopie);
          showToast(terug ?? t('editor.teruggezet'));
        },
      });
    };
    if (Platform.OS === 'web') {
      if (window.confirm(t('editor.verwijderVraag.titel'))) actie();
      return;
    }
    Alert.alert(t('editor.verwijderVraag.titel'), t('editor.verwijderVraag.tekst'), [
      { text: t('algemeen.annuleren'), style: 'cancel' },
      { text: t('algemeen.verwijderen'), style: 'destructive', onPress: actie },
    ]);
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={gedeeld.backLink}>
        <Icon name="chevron" color={kleuren.ink} />
        <Text style={gedeeld.backLinkText}>{t('editor.terugNaarAlarmen')}</Text>
      </Pressable>
      {eerste === '1' && !bestaand && (
        <View style={styles.eerste}>
          <Text style={styles.eersteKop}>{t('editor.eersteKop')}</Text>
          <Text style={styles.eersteTekst}>{t('editor.eersteTekst')}</Text>
        </View>
      )}
      <Text style={styles.title}>
        {bestaand ? t('editor.titelBewerken') : t('editor.titelNieuw')}
        <Text style={{ color: '#91B755' }}>.</Text>
      </Text>

      <View style={styles.timeEditor}>
        <Text style={styles.timeLabel}>{t('editor.tijdLabel')}</Text>
        {Platform.OS === 'web' ? (
          <TextInput
            accessibilityLabel={t('editor.alarmtijd')}
            value={time}
            onChangeText={setTime}
            maxLength={5}
            style={styles.timeValue}
            maxFontSizeMultiplier={1.2}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editor.alarmtijd')}
            onPress={openTijdkiezer}
          >
            <Text maxFontSizeMultiplier={1.2} style={styles.timeValue}>
              {time}
            </Text>
          </Pressable>
        )}
        <Text style={styles.timeHint} accessibilityLiveRegion="polite">
          {volgende ? t('editor.gaatAf', { tijd: tijdTot(volgende) }) : t('editor.kiesTijdEnDag')}
        </Text>
        {Platform.OS === 'ios' && iosPickerOpen && (
          <DateTimePicker
            value={naarDatum(time)}
            mode="time"
            display="spinner"
            is24Hour
            locale={locale}
            themeVariant="light"
            onChange={onTijdGekozen}
          />
        )}
      </View>

      <Text style={styles.formLabel}>{t('editor.naam')}</Text>
      <TextInput
        value={naam}
        onChangeText={setNaam}
        maxLength={40}
        accessibilityLabel={t('editor.naamLabel')}
        style={styles.naamInput}
      />

      <Text style={styles.formLabel}>{t('editor.herhaalOp')}</Text>
      <View style={styles.days}>
        {DAGEN.map((i) => {
          const letter = dagLetter(i);
          const actief = days.includes(i);
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{ selected: actief }}
              accessibilityLabel={dagNaam(i)}
              onPress={() => setDays((d) => wissel(d, i))}
              style={[styles.dayChip, actief && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, actief && styles.dayChipTextActive]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.formLabelRow}>
        <Text style={styles.formLabelInRow}>{t('editor.niveau')}</Text>
        <Text style={styles.formLabelHint}>{t('editor.vijfOpties')}</Text>
      </View>
      <View style={styles.levelGrid}>
        {NIVEAU_RIJEN.map((rij, r) => (
          <View key={r} style={styles.levelRow}>
            {rij.map((l, k) =>
              l ? (
                <Pressable
                  key={l}
                  accessibilityRole="button"
                  accessibilityState={{ selected: level === l }}
                  onPress={() => setLevel(l)}
                  style={[styles.levelChoice, level === l && styles.levelChoiceSelected]}
                >
                  <Text
                    style={[styles.levelChoiceText, level === l && styles.levelChoiceTextSelected]}
                  >
                    {niveauNaam(l)}
                  </Text>
                </Pressable>
              ) : (
                <View key={`leeg-${k}`} style={styles.levelPlaceholder} />
              ),
            )}
          </View>
        ))}
      </View>
      <View style={styles.levelExplain}>
        <Icon name={level === 'Verplicht' ? 'lock' : 'info'} color="#657265" />
        <Text style={styles.levelExplainText}>{niveauUitleg(level)}</Text>
      </View>

      <View style={styles.formLabelRow}>
        <Text style={styles.formLabelInRow}>{t('editor.kiesMissies')}</Text>
        <Text style={styles.formLabelHint}>{t('editor.meerdereMogelijk')}</Text>
      </View>
      {(['beweging', 'routine'] as const).map((groep) => (
        <View key={groep}>
          <Text style={styles.groepKop}>
            {groep === 'beweging'
              ? t('editor.eigen.groepBeweging')
              : t('editor.eigen.groepRoutine')}
          </Text>
          <View style={styles.exerciseOptions}>
            {OEFENINGEN.filter((o) => OEFENING_INFO[o].groep === groep).map((o) => {
              const aan = exercises.includes(o);
              return (
                <Pressable
                  key={o}
                  accessibilityRole="button"
                  accessibilityState={{ selected: aan }}
                  onPress={() => kies(o)}
                  style={[styles.exercise, aan && styles.exerciseSelected]}
                >
                  <Text style={[styles.exerciseText, aan && styles.exerciseTextSelected]}>
                    {aan ? '✓ ' : `${OEFENING_INFO[o].emoji} `}
                    {oefeningNaam(o)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <Text style={styles.groepKop}>{t('editor.eigen.groepEigen')}</Text>
      <View style={styles.exerciseOptions}>
        {eigenMissies.map((m) => {
          const missieId = naarEigenId(m.id);
          const aan = exercises.includes(missieId);
          return (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityState={{ selected: aan }}
              accessibilityHint={t('editor.eigen.verwijderHint')}
              onPress={() => kies(missieId)}
              onLongPress={() => verwijderEigen(m)}
              style={[styles.exercise, aan && styles.exerciseSelected]}
            >
              <Text style={[styles.exerciseText, aan && styles.exerciseTextSelected]}>
                {aan ? '✓ ' : `${m.emoji} `}
                {m.naam}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => setEigenOpen(true)}
          style={[styles.exercise, styles.exerciseNieuw]}
        >
          <Text style={[styles.exerciseText, styles.exerciseTextSelected]}>
            {t('editor.eigen.nieuwe')}
          </Text>
        </Pressable>
      </View>
      {eigenMissies.length > 0 && (
        <Text style={styles.formLabelHint}>{t('editor.eigen.verwijderHint')}</Text>
      )}

      {gekozen.length > 0 && (
        <>
          <View style={styles.formLabelRow}>
            <Text style={styles.formLabelInRow}>{t('editor.jouwMissie')}</Text>
            <Text style={styles.formLabelHint}>{t('editor.volgordeEnAantal')}</Text>
          </View>
          <View style={styles.doelen}>
            {gekozen.map((missie, i) => {
              const o = missie.id;
              const bereik = DOEL_BEREIK[missie.eenheid];
              const doel = missie.doel;
              const eenheid =
                missie.eenheid === 'seconden'
                  ? t('editor.eenheidSeconden')
                  : t('editor.eenheidHerhalingen');
              const naamOefening = missie.naam;
              // Alleen ingebouwde oefeningen met herhalingen of seconden hebben een teller
              const instelbareOefening = missie.oefening !== null && missie.eenheid !== 'handeling';
              return (
                <View key={o} style={[styles.doelRij, i > 0 && styles.doelRijRand]}>
                  <View style={styles.volgorde}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('editor.eerder', { oefening: naamOefening })}
                      disabled={i === 0}
                      onPress={() => verplaats(i, -1)}
                      hitSlop={6}
                      style={i === 0 && styles.stepperUit}
                    >
                      <Text style={styles.pijl}>▲</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('editor.later', { oefening: naamOefening })}
                      disabled={i === gekozen.length - 1}
                      onPress={() => verplaats(i, 1)}
                      hitSlop={6}
                      style={i === gekozen.length - 1 && styles.stepperUit}
                    >
                      <Text style={styles.pijl}>▼</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.doelNaam}>
                    {i + 1}. {missie.emoji} {naamOefening}
                  </Text>
                  {instelbareOefening ? (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('editor.minder', { oefening: naamOefening })}
                        disabled={doel <= bereik.min}
                        onPress={() => missie.oefening && pasDoelAan(missie.oefening, -1)}
                        style={[styles.stepper, doel <= bereik.min && styles.stepperUit]}
                      >
                        <Text style={styles.stepperTekst}>−</Text>
                      </Pressable>
                      <Text
                        style={styles.doelWaarde}
                        accessibilityLabel={t('editor.doelLabel', {
                          oefening: naamOefening,
                          doel: missie.doelTekst,
                        })}
                      >
                        {doel}
                        <Text style={styles.doelEenheid}> {eenheid}</Text>
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('editor.meer', { oefening: naamOefening })}
                        disabled={doel >= bereik.max}
                        onPress={() => missie.oefening && pasDoelAan(missie.oefening, 1)}
                        style={[styles.stepper, doel >= bereik.max && styles.stepperUit]}
                      >
                        <Text style={styles.stepperTekst}>+</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.doelEenheid}>{missie.doelTekst}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <SecondaryButton label={t('editor.oefen')} onPress={oefen} style={styles.oefen} />
        </>
      )}

      <PrimaryButton
        label={bezig ? t('algemeen.bezig') : t('editor.opslaan')}
        onPress={opslaan}
        style={styles.save}
      />
      {bestaand && (
        <>
          <SecondaryButton
            label={t('editor.dupliceer')}
            onPress={dupliceer}
            style={styles.delete}
          />
          <SecondaryButton
            label={t('editor.verwijder')}
            onPress={verwijderAlarm}
            style={styles.delete}
          />
        </>
      )}
      <Modal
        visible={eigenOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEigenOpen(false)}
      >
        <Pressable style={styles.modalAchtergrond} onPress={() => setEigenOpen(false)}>
          <Pressable style={styles.modalKaart} onPress={() => {}}>
            <Text style={styles.modalTitel}>{t('editor.eigen.titel')}</Text>
            <Text style={styles.formLabel}>{t('editor.eigen.naam')}</Text>
            <TextInput
              value={eigenNaam}
              onChangeText={setEigenNaam}
              maxLength={40}
              placeholder={t('editor.eigen.naamVoorbeeld')}
              placeholderTextColor="#8A968B"
              accessibilityLabel={t('editor.eigen.naam')}
              style={styles.naamInput}
            />
            <Text style={styles.formLabel}>{t('editor.eigen.icoon')}</Text>
            <View style={styles.emojis}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  accessibilityRole="button"
                  accessibilityState={{ selected: eigenEmoji === e }}
                  onPress={() => setEigenEmoji(e)}
                  style={[styles.emoji, eigenEmoji === e && styles.emojiGekozen]}
                >
                  <Text style={styles.emojiTekst}>{e}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.formLabel}>{t('editor.eigen.soort')}</Text>
            <View style={styles.soorten}>
              {(['timer', 'foto'] as const).map((soort) => (
                <Pressable
                  key={soort}
                  accessibilityRole="button"
                  accessibilityState={{ selected: eigenSoort === soort }}
                  onPress={() => setEigenSoort(soort)}
                  style={[styles.soort, eigenSoort === soort && styles.soortGekozen]}
                >
                  <Text style={styles.soortNaam}>
                    {soort === 'timer'
                      ? `⏱ ${t('editor.eigen.timer')}`
                      : `📷 ${t('editor.eigen.foto')}`}
                  </Text>
                  <Text style={styles.soortUitleg}>
                    {soort === 'timer'
                      ? t('editor.eigen.timerUitleg')
                      : t('editor.eigen.fotoUitleg')}
                  </Text>
                </Pressable>
              ))}
            </View>
            {eigenSoort === 'timer' && (
              <>
                <Text style={styles.formLabel}>{t('editor.eigen.duur')}</Text>
                <View style={styles.exerciseOptions}>
                  {DUREN.map((d) => (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityState={{ selected: eigenDuur === d }}
                      onPress={() => setEigenDuur(d)}
                      style={[styles.exercise, eigenDuur === d && styles.exerciseSelected]}
                    >
                      <Text
                        style={[
                          styles.exerciseText,
                          eigenDuur === d && styles.exerciseTextSelected,
                        ]}
                      >
                        {duurTekst(d)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <PrimaryButton
              label={bezig ? t('algemeen.bezig') : t('editor.eigen.toevoegen')}
              onPress={voegEigenToe}
              style={styles.save}
            />
            <SecondaryButton
              label={t('algemeen.annuleren')}
              onPress={() => setEigenOpen(false)}
              style={styles.delete}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.head700,
    fontSize: 31,
    letterSpacing: em(-0.06, 31),
    marginBottom: 14,
    color: kleuren.ink,
  },
  timeEditor: {
    backgroundColor: kleuren.white,
    borderRadius: 19,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: kleuren.line,
  },
  timeLabel: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.14, 10),
    color: '#5F6E60',
    marginBottom: 8,
  },
  eerste: {
    backgroundColor: '#EDF4D5',
    borderRadius: 15,
    padding: 14,
    marginBottom: 14,
  },
  eersteKop: { fontFamily: fonts.body800, fontSize: 13, color: kleuren.ink },
  eersteTekst: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 17,
    color: '#3D4A3F',
    marginTop: 4,
  },
  timeHint: { fontFamily: fonts.body600, fontSize: 11, color: '#5F6E60', marginTop: 6 },
  timeValue: {
    fontFamily: fonts.head700,
    fontSize: 55,
    letterSpacing: em(-0.09, 55),
    color: kleuren.ink,
    textAlign: 'center',
    minWidth: 215,
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  formLabel: {
    fontFamily: fonts.body800,
    fontSize: 11,
    color: kleuren.ink,
    marginTop: 20,
    marginBottom: 10,
  },
  formLabelInRow: { fontFamily: fonts.body800, fontSize: 11, color: kleuren.ink },
  formLabelHint: { fontFamily: fonts.body600, fontSize: 10, color: '#5F6E60' },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  dayChip: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#E8ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: kleuren.ink },
  dayChipText: { fontFamily: fonts.body800, fontSize: 11, color: '#5F6E60' },
  dayChipTextActive: { color: kleuren.lime },
  levelGrid: { gap: 6 },
  levelRow: { flexDirection: 'row', gap: 6 },
  levelChoice: {
    flex: 1,
    flexBasis: 0,
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  levelChoiceSelected: { backgroundColor: kleuren.lime, borderColor: kleuren.lime },
  levelChoiceText: { fontFamily: fonts.body800, fontSize: 10, color: '#5F6E60' },
  levelChoiceTextSelected: { color: kleuren.ink },
  levelPlaceholder: { flex: 1, flexBasis: 0 },
  levelExplain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E9EEE5',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginTop: 8,
  },
  levelExplainText: {
    flex: 1,
    fontFamily: fonts.body400,
    fontSize: 10,
    lineHeight: 14,
    color: '#657265',
  },
  exerciseOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  exercise: {
    borderWidth: 1,
    borderColor: '#DCE1D8',
    borderRadius: 100,
    backgroundColor: kleuren.white,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  exerciseSelected: { borderColor: kleuren.ink, backgroundColor: '#EDF4D5' },
  exerciseText: { fontFamily: fonts.body800, fontSize: 11, color: '#5F6E60' },
  exerciseTextSelected: { color: kleuren.ink },
  doelen: {
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 15,
    paddingHorizontal: 14,
  },
  doelRij: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  doelRijRand: { borderTopWidth: 1, borderTopColor: kleuren.line },
  doelNaam: { flex: 1, fontFamily: fonts.body800, fontSize: 12, color: kleuren.ink },
  stepper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E8ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperUit: { opacity: 0.4 },
  stepperTekst: { fontFamily: fonts.body800, fontSize: 16, color: kleuren.ink },
  doelWaarde: {
    minWidth: 58,
    textAlign: 'center',
    fontFamily: fonts.head700,
    fontSize: 18,
    color: kleuren.ink,
  },
  doelEenheid: { fontFamily: fonts.body700, fontSize: 10, color: '#5F6E60' },
  volgorde: { gap: 2, marginRight: 2 },
  pijl: { fontSize: 10, color: kleuren.ink, paddingHorizontal: 2 },
  oefen: { marginTop: 10 },
  groepKop: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.12, 10),
    color: '#5F6E60',
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 8,
  },
  exerciseNieuw: { borderStyle: 'dashed', borderColor: kleuren.ink },
  modalAchtergrond: { flex: 1, backgroundColor: 'rgba(16,23,20,0.5)', justifyContent: 'flex-end' },
  modalKaart: {
    backgroundColor: kleuren.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
    maxHeight: '92%',
  },
  modalTitel: { fontFamily: fonts.head700, fontSize: 24, color: kleuren.ink },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiGekozen: { borderColor: kleuren.ink, backgroundColor: '#EDF4D5' },
  emojiTekst: { fontSize: 22 },
  soorten: { flexDirection: 'row', gap: 8 },
  soort: {
    flex: 1,
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 14,
    padding: 12,
  },
  soortGekozen: { borderColor: kleuren.ink, backgroundColor: '#EDF4D5' },
  soortNaam: { fontFamily: fonts.body800, fontSize: 13, color: kleuren.ink },
  soortUitleg: { fontFamily: fonts.body400, fontSize: 11, color: '#5F6E60', marginTop: 3 },
  save: { marginTop: 22 },
  delete: { marginTop: 10 },
  naamInput: {
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 15,
    minHeight: 48,
    paddingHorizontal: 16,
    fontFamily: fonts.body700,
    fontSize: 14,
    color: kleuren.ink,
  },
});
