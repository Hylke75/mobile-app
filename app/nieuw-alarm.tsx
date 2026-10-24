import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
  doelTekst,
  doelVoor,
  OEFENING_INFO,
  oefeningNaam,
} from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useTaal } from '@/i18n';
import { useToast } from '@/hooks/useToast';
import { haalRechtenOp, vraagRechtenAan } from '@/lib/alarmen';
import { cameraStatus, vraagCameraAan } from '@/lib/camera';
import { tijdTot, volgendeKeer } from '@/lib/tijd';
import type { Alarm, Doelen, Niveau, Oefening } from '@/types/app';

const NIVEAU_RIJEN: (Niveau | null)[][] = [
  ['Vrij', 'Flexibel', 'Uitstelbaar'],
  ['Verplicht', 'Hardcore', null],
];

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
  const { alarms, maakAan, werkBij, verwijder } = useAlarmen();
  const { showToast } = useToast();
  const { t, locale } = useTaal();
  const bestaand = id ? alarms.find((a) => a.id === id) : undefined;
  // Standaardnaam één keer vastleggen, zodat 'gewijzigd' klopt ook als de taal wisselt
  const [standaardNaam] = useState(() => t('editor.standaardNaam'));
  const [naam, setNaam] = useState(bestaand?.naam ?? standaardNaam);
  const [time, setTime] = useState(bestaand?.tijd ?? '07:00');
  const [days, setDays] = useState<number[]>(bestaand?.dagen ?? [0, 1, 2, 3, 4]);
  const [level, setLevel] = useState<Niveau>(bestaand?.niveau ?? 'Verplicht');
  const [exercises, setExercises] = useState<Oefening[]>(
    bestaand?.oefeningen ?? ['Squats', 'Bed opmaken'],
  );
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

  const instelbaar = exercises.filter((o) => OEFENING_INFO[o].eenheid !== 'handeling');

  const verplaats = (index: number, richting: 1 | -1) => {
    const nieuw = [...exercises];
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
        oefeningen: exercises.join(','),
        doelen: doelenNaarTekst(invoer().doelen),
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
    oefeningen: exercises,
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
    if (!exercises.length) return showToast(t('editor.fouten.missie'));
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
      <View style={styles.exerciseOptions}>
        {OEFENINGEN.map((o) => {
          const gekozen = exercises.includes(o);
          return (
            <Pressable
              key={o}
              accessibilityRole="button"
              accessibilityState={{ selected: gekozen }}
              onPress={() => setExercises((e) => wissel(e, o))}
              style={[styles.exercise, gekozen && styles.exerciseSelected]}
            >
              <Text style={[styles.exerciseText, gekozen && styles.exerciseTextSelected]}>
                {gekozen ? '✓ ' : ''}
                {oefeningNaam(o)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {exercises.length > 0 && (
        <>
          <View style={styles.formLabelRow}>
            <Text style={styles.formLabelInRow}>{t('editor.jouwMissie')}</Text>
            <Text style={styles.formLabelHint}>{t('editor.volgordeEnAantal')}</Text>
          </View>
          <View style={styles.doelen}>
            {exercises.map((o, i) => {
              const info = OEFENING_INFO[o];
              const bereik = DOEL_BEREIK[info.eenheid];
              const doel = doelVoor(o, doelen);
              const eenheid =
                info.eenheid === 'seconden'
                  ? t('editor.eenheidSeconden')
                  : t('editor.eenheidHerhalingen');
              const naamOefening = oefeningNaam(o);
              const instelbareOefening = info.eenheid !== 'handeling';
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
                      disabled={i === exercises.length - 1}
                      onPress={() => verplaats(i, 1)}
                      hitSlop={6}
                      style={i === exercises.length - 1 && styles.stepperUit}
                    >
                      <Text style={styles.pijl}>▼</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.doelNaam}>
                    {i + 1}. {info.emoji} {naamOefening}
                  </Text>
                  {instelbareOefening ? (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('editor.minder', { oefening: naamOefening })}
                        disabled={doel <= bereik.min}
                        onPress={() => pasDoelAan(o, -1)}
                        style={[styles.stepper, doel <= bereik.min && styles.stepperUit]}
                      >
                        <Text style={styles.stepperTekst}>−</Text>
                      </Pressable>
                      <Text
                        style={styles.doelWaarde}
                        accessibilityLabel={t('editor.doelLabel', {
                          oefening: naamOefening,
                          doel: doelTekst(o, doelen),
                        })}
                      >
                        {doel}
                        <Text style={styles.doelEenheid}> {eenheid}</Text>
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('editor.meer', { oefening: naamOefening })}
                        disabled={doel >= bereik.max}
                        onPress={() => pasDoelAan(o, 1)}
                        style={[styles.stepper, doel >= bereik.max && styles.stepperUit]}
                      >
                        <Text style={styles.stepperTekst}>+</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.doelEenheid}>{t('algemeen.handeling')}</Text>
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
