import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { PrimaryButton, ScreenHeader, SecondaryButton, SectionTitleRow } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmCheck } from '@/hooks/useAlarmCheck';
import { useAuth } from '@/hooks/useAuth';
import { openBatterijInstellingen } from '@/lib/batterij';
import { useSessies } from '@/hooks/useSessies';
import { useToast } from '@/hooks/useToast';
import {
  alarmenBeschikbaar,
  haalRechtenOp,
  openAlarmInstellingen,
  planTestAlarm,
  rondWekkerAf,
  verwijderEenmaligAlarm,
} from '@/lib/alarmen';

const TEST_SECONDEN = 30;

function doelTekst(weekdoel: number): string {
  return weekdoel === 7 ? 'Iedere dag bewegen' : `${weekdoel} dagen per week`;
}

export default function ProfielScherm() {
  const { showToast } = useToast();
  const { profiel, user, uitloggen, verwijderAccount, werkProfielBij } = useAuth();
  const { statistiek } = useSessies();
  const { regels, allesInOrde, rechten, batterijAan, vraagAlleRechtenAan } = useAlarmCheck();
  const [test, setTest] = useState<'uit' | 'aftellen' | 'vraag'>('uit');
  const [resterend, setResterend] = useState(TEST_SECONDEN);
  const [doelOpen, setDoelOpen] = useState(false);
  const testId = useRef<string | null>(null);

  // Opent de wekker-routing het testalarm, dan neemt dat scherm het over
  useFocusEffect(
    useCallback(() => {
      return () => setTest('uit');
    }, []),
  );
  const voornaam = profiel?.voornaam ?? '';
  const meldingenAan = regels[0]?.ok ?? false;

  useEffect(() => {
    if (test !== 'aftellen') return;
    const eind = Date.now() + TEST_SECONDEN * 1000;
    const t = setInterval(() => {
      const over = Math.max(0, Math.ceil((eind - Date.now()) / 1000));
      setResterend(over);
      if (over === 0) {
        clearInterval(t);
        setTest('vraag');
      }
    }, 250);
    return () => clearInterval(t);
  }, [test]);

  const bevestig = (titel: string, tekst: string, knop: string, actie: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${titel}\n\n${tekst}`)) actie();
      return;
    }
    Alert.alert(titel, tekst, [
      { text: 'Annuleren', style: 'cancel' },
      { text: knop, style: 'destructive', onPress: actie },
    ]);
  };

  const startTest = async () => {
    if (!alarmenBeschikbaar) return showToast('Het testalarm werkt alleen in de app.');
    if (!rechten?.canScheduleExactAlarms) {
      await vraagAlleRechtenAan();
      const nieuw = await haalRechtenOp().catch(() => null);
      if (!nieuw?.canScheduleExactAlarms) {
        return showToast('Geef Mooove eerst toestemming voor alarmen.');
      }
    }
    try {
      testId.current = await planTestAlarm(TEST_SECONDEN);
      setResterend(TEST_SECONDEN);
      setTest('aftellen');
    } catch {
      showToast('Het testalarm kon niet worden ingepland.');
    }
  };

  const ruimTestOp = async () => {
    const id = testId.current;
    testId.current = null;
    if (!id) return;
    await rondWekkerAf(id).catch(() => {});
    await verwijderEenmaligAlarm(id);
  };

  const annuleerTest = async () => {
    setTest('uit');
    await ruimTestOp();
  };

  const testResultaat = async (gelukt: boolean) => {
    setTest('uit');
    await ruimTestOp();
    if (gelukt) {
      const fout = await werkProfielBij({ alarmtest_geslaagd_op: new Date().toISOString() });
      showToast(fout ?? 'Testalarm geslaagd ✓');
    } else {
      Alert.alert(
        'Alarm niet gehoord?',
        'Controleer of Mooove alarmen en meldingen mag tonen en of je alarmvolume aan staat. Op Android: zet batterij-optimalisatie voor Mooove uit.',
        [
          { text: 'Sluiten', style: 'cancel' },
          { text: 'Open instellingen', onPress: () => openAlarmInstellingen() },
        ],
      );
    }
  };

  const onUitloggen = () =>
    bevestig('Uitloggen?', 'Je kunt altijd weer inloggen met je e-mailadres.', 'Uitloggen', () => {
      uitloggen();
    });

  const onVerwijderen = () =>
    bevestig(
      'Account verwijderen?',
      'Je account, alarmen en voortgang worden definitief verwijderd. Dit kun je niet ongedaan maken.',
      'Verwijderen',
      async () => {
        const fout = await verwijderAccount();
        if (fout) showToast(fout);
      },
    );

  const kiesDoel = async (doel: number) => {
    setDoelOpen(false);
    const fout = await werkProfielBij({ weekdoel: doel });
    if (fout) showToast(fout);
  };

  return (
    <Screen>
      <ScreenHeader kicker="YOUR MOOOVE SPACE" titel="Profiel" puntKleur="#9FBC63" />
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{voornaam.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{voornaam}</Text>
          <Text style={styles.profileSub}>
            Mooove member · {statistiek.actieveDagen}{' '}
            {statistiek.actieveDagen === 1 ? 'dag' : 'dagen'} actief
          </Text>
        </View>
      </View>

      <SectionTitleRow titel="Alarm-check" rechts={allesInOrde ? 'ALLES GEREED' : 'ACTIE NODIG'} />
      <View style={styles.setupCard}>
        <View style={styles.setupTop}>
          <Text style={styles.setupTitle}>{allesInOrde ? 'Ready to Mooove.' : 'Bijna klaar.'}</Text>
          <View style={[styles.secureTag, !allesInOrde && styles.secureTagOpen]}>
            <Text style={[styles.secureTagText, !allesInOrde && styles.secureTagTextOpen]}>
              {allesInOrde ? '✓ Veilig ingesteld' : 'Nog niet compleet'}
            </Text>
          </View>
        </View>
        {regels.map((r, i) => (
          <View
            key={r.label}
            style={[styles.setupLine, i === regels.length - 1 && styles.noBorder]}
          >
            <View style={[styles.setupCheck, !r.ok && styles.setupCheckOpen]}>
              <Icon
                name={r.ok ? 'check' : 'close'}
                size={13}
                color={r.ok ? '#4B8E42' : '#C2462F'}
              />
            </View>
            <Text style={styles.setupLabel}>{r.label}</Text>
            <Text style={styles.setupValue}>{r.waarde}</Text>
          </View>
        ))}
        {!regels.slice(0, 3).every((r) => r.ok) && (
          <SecondaryButton
            label="Geef toestemming"
            onPress={async () => {
              const inOrde = await vraagAlleRechtenAan();
              if (!inOrde) Linking.openSettings();
            }}
            style={styles.testBtn}
          />
        )}
        {batterijAan && (
          <SecondaryButton
            label="Zet batterijbesparing uit"
            onPress={openBatterijInstellingen}
            style={styles.testBtn}
          />
        )}
        <SecondaryButton label="Test je alarm ↗" onPress={startTest} style={styles.testBtn} />
      </View>

      <Text style={styles.sectionHeading}>MEER MOOOVE</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/coach')}
        style={styles.setting}
      >
        <Icon name="heart" color={kleuren.ink} />
        <Text style={styles.settingLabel}>Fysio & trainer</Text>
        <Text style={styles.settingValue}>Bekijk concept →</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => setDoelOpen(true)}
        style={styles.setting}
      >
        <Icon name="target" color={kleuren.ink} />
        <Text style={styles.settingLabel}>Mijn doelen</Text>
        <Text style={styles.settingValue}>{doelTekst(profiel?.weekdoel ?? 7)}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => (alarmenBeschikbaar ? Linking.openSettings() : undefined)}
        style={styles.setting}
      >
        <Icon name="bell" color={kleuren.ink} />
        <Text style={styles.settingLabel}>Meldingen</Text>
        <Text style={styles.settingValue}>{meldingenAan ? 'Ingeschakeld' : 'Uitgeschakeld'}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert(
            'Privacy',
            'Camerabeelden worden alleen op je toestel verwerkt en nooit opgeslagen of verstuurd. We bewaren alleen je naam, e-mailadres, alarmen en de uitkomst van je missies.',
          )
        }
        style={styles.setting}
      >
        <Icon name="shield" color={kleuren.ink} />
        <Text style={styles.settingLabel}>Privacy</Text>
        <Text style={styles.settingValue}>Op je toestel</Text>
      </Pressable>

      <Text style={styles.sectionHeading}>ACCOUNT</Text>
      <View style={styles.setting}>
        <Icon name="user" color={kleuren.ink} />
        <Text style={styles.settingLabel}>E-mailadres</Text>
        <Text style={styles.settingValue}>{user?.email}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onUitloggen} style={styles.setting}>
        <Icon name="arrow" color={kleuren.ink} />
        <Text style={styles.settingLabel}>Uitloggen</Text>
        <Text style={styles.settingValue}>→</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onVerwijderen} style={styles.setting}>
        <Icon name="close" color="#C2462F" />
        <Text style={[styles.settingLabel, styles.gevaar]}>Account verwijderen</Text>
        <Text style={styles.settingValue}>Definitief</Text>
      </Pressable>

      <Modal
        visible={test !== 'uit'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={annuleerTest}
      >
        <StatusBar style="light" />
        <View style={styles.overlay}>
          <Text style={styles.testLabel}>MOOOVE SYSTEM CHECK</Text>
          <Text style={styles.testClock}>
            00:{String(test === 'aftellen' ? resterend : 0).padStart(2, '0')}
          </Text>
          <Text style={styles.testTitle}>{test === 'aftellen' ? 'Even testen.' : 'Gehoord?'}</Text>
          <Text style={styles.testText}>
            {test === 'aftellen'
              ? 'Zet je telefoon op stil of Niet storen en vergrendel hem. Over een paar seconden gaat je testalarm af.'
              : 'Ging het alarm af terwijl je telefoon op stil of Niet storen stond?'}
          </Text>
          {test === 'vraag' ? (
            <>
              <PrimaryButton
                label="Ja, test geslaagd"
                icon="check"
                onPress={() => testResultaat(true)}
                style={styles.testCta}
              />
              <SecondaryButton
                label="Nee, ik hoorde niets"
                onPress={() => testResultaat(false)}
                style={styles.testSecundair}
              />
            </>
          ) : (
            <SecondaryButton label="Annuleren" onPress={annuleerTest} style={styles.testCta} />
          )}
        </View>
      </Modal>

      <Modal
        visible={doelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDoelOpen(false)}
      >
        <Pressable style={styles.doelOverlay} onPress={() => setDoelOpen(false)}>
          <View style={styles.doelKaart}>
            <Text style={styles.setupTitle}>Hoe vaak wil je bewegen?</Text>
            {[7, 5, 3].map((d) => (
              <Pressable
                key={d}
                accessibilityRole="button"
                onPress={() => kiesDoel(d)}
                style={[styles.doelOptie, profiel?.weekdoel === d && styles.doelOptieActief]}
              >
                <Text style={styles.settingLabel}>{doelTekst(d)}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: kleuren.ink,
    padding: 18,
    borderRadius: 19,
  },
  avatar: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: kleuren.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.head700, fontSize: 22, color: kleuren.ink },
  profileName: { fontFamily: fonts.head700, fontSize: 18, color: kleuren.white },
  profileSub: { fontFamily: fonts.body400, fontSize: 10, color: '#A5B4A6', marginVertical: 5 },
  setupCard: {
    borderRadius: 20,
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    padding: 17,
  },
  setupTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  setupTitle: { fontFamily: fonts.head700, fontSize: 16, color: kleuren.ink },
  secureTag: {
    backgroundColor: '#E6F4D8',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  secureTagOpen: { backgroundColor: '#FBE4DE' },
  secureTagText: { fontFamily: fonts.body800, fontSize: 9, color: '#578149' },
  secureTagTextOpen: { color: '#C2462F' },
  setupLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0E9',
  },
  noBorder: { borderBottomWidth: 0 },
  setupCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DDF2CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupCheckOpen: { backgroundColor: '#FBE4DE' },
  setupLabel: { fontFamily: fonts.body700, fontSize: 11, color: kleuren.ink },
  setupValue: { marginLeft: 'auto', fontFamily: fonts.body700, fontSize: 10, color: '#91A092' },
  testBtn: { marginTop: 12 },
  sectionHeading: {
    fontFamily: fonts.body800,
    fontSize: 11,
    marginTop: 23,
    marginBottom: 9,
    color: kleuren.ink,
  },
  setting: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAE0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: { fontFamily: fonts.body800, fontSize: 12, color: kleuren.ink },
  gevaar: { color: '#C2462F' },
  settingValue: { fontFamily: fonts.body800, fontSize: 10, color: '#8B9A8A' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16,23,20,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  testLabel: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.18, 10),
    color: kleuren.lime,
  },
  testClock: {
    fontFamily: fonts.head700,
    fontSize: 90,
    letterSpacing: em(-0.08, 90),
    color: kleuren.lime,
    marginTop: 24,
    marginBottom: 7,
  },
  testTitle: {
    fontFamily: fonts.head700,
    fontSize: 27,
    letterSpacing: em(-0.04, 27),
    color: kleuren.white,
    marginVertical: 18,
  },
  testText: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 19,
    color: '#B3BFB5',
    textAlign: 'center',
  },
  testCta: { marginTop: 30 },
  testSecundair: { marginTop: 10 },
  doelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,23,20,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  doelKaart: { backgroundColor: kleuren.white, borderRadius: 20, padding: 18, gap: 8 },
  doelOptie: {
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  doelOptieActief: { backgroundColor: kleuren.lime, borderColor: kleuren.lime },
});
