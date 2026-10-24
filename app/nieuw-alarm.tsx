import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { gedeeld, PrimaryButton, SecondaryButton } from '@/components/ui';
import { DAG_LETTERS, DAG_NAMEN, NIVEAUS, OEFENINGEN } from '@/constants/alarm';
import { DOEL_BEREIK, doelVoor, OEFENING_INFO } from '@/constants/oefeningen';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useToast } from '@/hooks/useToast';
import { haalRechtenOp, vraagRechtenAan } from '@/lib/alarmen';
import { cameraStatus, vraagCameraAan } from '@/lib/camera';
import type { Doelen, Niveau, Oefening } from '@/types/app';

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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { alarms, maakAan, werkBij, verwijder } = useAlarmen();
  const { showToast } = useToast();
  const bestaand = id ? alarms.find((a) => a.id === id) : undefined;
  const [naam, setNaam] = useState(bestaand?.naam ?? 'Mijn Mooove-missie');
  const [time, setTime] = useState(bestaand?.tijd ?? '07:00');
  const [days, setDays] = useState<number[]>(bestaand?.dagen ?? [0, 1, 2, 3, 4]);
  const [level, setLevel] = useState<Niveau>(bestaand?.niveau ?? 'Verplicht');
  const [exercises, setExercises] = useState<Oefening[]>(
    bestaand?.oefeningen ?? ['Squats', 'Bed opmaken'],
  );
  const [doelen, setDoelen] = useState<Doelen>(bestaand?.doelen ?? {});
  const [bezig, setBezig] = useState(false);
  const [iosPickerOpen, setIosPickerOpen] = useState(false);

  const wissel = <T,>(lijst: T[], waarde: T) =>
    lijst.includes(waarde) ? lijst.filter((x) => x !== waarde) : [...lijst, waarde];

  const instelbaar = exercises.filter((o) => OEFENING_INFO[o].eenheid !== 'handeling');

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

  const opslaan = async () => {
    if (bezig) return;
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) return showToast('Kies een geldige tijd.');
    if (!naam.trim()) return showToast('Geef je alarm een naam.');
    if (!days.length) return showToast('Kies minimaal één dag.');
    if (!exercises.length) return showToast('Kies minimaal één missie.');
    setBezig(true);

    const rechten = await haalRechtenOp().catch(() => null);
    if (rechten && !rechten.canScheduleExactAlarms && rechten.status !== 'unavailable') {
      await vraagRechtenAan().catch(() => null);
    }
    if (cameraStatus() === 'onbekend') await vraagCameraAan().catch(() => false);

    const invoer = {
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
    };
    const fout = bestaand ? await werkBij(bestaand.id, invoer) : await maakAan(invoer);
    setBezig(false);
    if (fout) return showToast(fout);
    router.dismissTo('/alarmen');
    showToast(bestaand ? 'Je alarm is bijgewerkt.' : 'Je nieuwe alarm staat in de lijst!');
  };

  const verwijderAlarm = () => {
    if (!bestaand) return;
    const actie = async () => {
      const fout = await verwijder(bestaand.id);
      if (fout) return showToast(fout);
      router.dismissTo('/alarmen');
      showToast('Alarm verwijderd.');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Alarm verwijderen?')) actie();
      return;
    }
    Alert.alert('Alarm verwijderen?', 'Dit alarm gaat daarna niet meer af.', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Verwijderen', style: 'destructive', onPress: actie },
    ]);
  };

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.dismissTo('/alarmen')}
        style={gedeeld.backLink}
      >
        <Icon name="chevron" color={kleuren.ink} />
        <Text style={gedeeld.backLinkText}>Terug naar alarmen</Text>
      </Pressable>
      <Text style={styles.title}>
        {bestaand ? 'Alarm bewerken' : 'Nieuw alarm'}
        <Text style={{ color: '#91B755' }}>.</Text>
      </Text>

      <View style={styles.timeEditor}>
        <Text style={styles.timeLabel}>KIES JE TIJDSTIP</Text>
        {Platform.OS === 'web' ? (
          <TextInput
            accessibilityLabel="Alarmtijd"
            value={time}
            onChangeText={setTime}
            maxLength={5}
            style={styles.timeValue}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alarmtijd"
            onPress={openTijdkiezer}
          >
            <Text style={styles.timeValue}>{time}</Text>
          </Pressable>
        )}
        {Platform.OS === 'ios' && iosPickerOpen && (
          <DateTimePicker
            value={naarDatum(time)}
            mode="time"
            display="spinner"
            is24Hour
            locale="nl-NL"
            themeVariant="light"
            onChange={onTijdGekozen}
          />
        )}
      </View>

      <Text style={styles.formLabel}>Naam</Text>
      <TextInput
        value={naam}
        onChangeText={setNaam}
        maxLength={40}
        accessibilityLabel="Naam van het alarm"
        style={styles.naamInput}
      />

      <Text style={styles.formLabel}>Herhaal op</Text>
      <View style={styles.days}>
        {DAG_LETTERS.map((letter, i) => {
          const actief = days.includes(i);
          return (
            <Pressable
              key={DAG_NAMEN[i]}
              accessibilityRole="button"
              accessibilityState={{ selected: actief }}
              accessibilityLabel={DAG_NAMEN[i]}
              onPress={() => setDays((d) => wissel(d, i))}
              style={[styles.dayChip, actief && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, actief && styles.dayChipTextActive]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.formLabelRow}>
        <Text style={styles.formLabelInRow}>Strengheidsniveau</Text>
        <Text style={styles.formLabelHint}>5 opties</Text>
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
                    {l}
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
        <Text style={styles.levelExplainText}>{NIVEAUS[level]}</Text>
      </View>

      <View style={styles.formLabelRow}>
        <Text style={styles.formLabelInRow}>Kies jouw missies</Text>
        <Text style={styles.formLabelHint}>Meerdere mogelijk</Text>
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
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {instelbaar.length > 0 && (
        <>
          <Text style={styles.formLabel}>Hoeveel per oefening</Text>
          <View style={styles.doelen}>
            {instelbaar.map((o, i) => {
              const info = OEFENING_INFO[o];
              const bereik = DOEL_BEREIK[info.eenheid];
              const doel = doelVoor(o, doelen);
              const eenheid = info.eenheid === 'seconden' ? 'sec' : 'x';
              return (
                <View key={o} style={[styles.doelRij, i > 0 && styles.doelRijRand]}>
                  <Text style={styles.doelNaam}>
                    {info.emoji} {o}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Minder ${o}`}
                    disabled={doel <= bereik.min}
                    onPress={() => pasDoelAan(o, -1)}
                    style={[styles.stepper, doel <= bereik.min && styles.stepperUit]}
                  >
                    <Text style={styles.stepperTekst}>−</Text>
                  </Pressable>
                  <Text
                    style={styles.doelWaarde}
                    accessibilityLabel={`${doel} ${info.eenheid} ${o}`}
                  >
                    {doel}
                    <Text style={styles.doelEenheid}> {eenheid}</Text>
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Meer ${o}`}
                    disabled={doel >= bereik.max}
                    onPress={() => pasDoelAan(o, 1)}
                    style={[styles.stepper, doel >= bereik.max && styles.stepperUit]}
                  >
                    <Text style={styles.stepperTekst}>+</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </>
      )}

      <PrimaryButton
        label={bezig ? 'Bezig…' : 'Alarm opslaan'}
        onPress={opslaan}
        style={styles.save}
      />
      {bestaand && (
        <SecondaryButton label="Alarm verwijderen" onPress={verwijderAlarm} style={styles.delete} />
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
