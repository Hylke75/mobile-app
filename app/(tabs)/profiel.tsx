// MOCKDATA: de alarm-check en instellingen zijn niet gemeten; het testalarm is een simulatie.
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconNaam } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { PrimaryButton, ScreenHeader, SecondaryButton, SectionTitleRow } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';

const CHECKS = [
  ['Meldingen', 'Toegestaan'],
  ['Alarmrechten', 'Toegestaan'],
  ['Camera', 'Toegestaan'],
  ['Niet storen test', 'Geslaagd'],
];

const INSTELLINGEN: { icon: IconNaam; label: string; waarde: string }[] = [
  { icon: 'target', label: 'Mijn doelen', waarde: 'Iedere dag bewegen' },
  { icon: 'bell', label: 'Meldingen', waarde: 'Ingeschakeld' },
  { icon: 'shield', label: 'Privacy', waarde: 'Op je toestel' },
];

export default function ProfielScherm() {
  const { showToast } = useDemo();
  const { profiel, user, uitloggen, verwijderAccount } = useAuth();
  const [testOpen, setTestOpen] = useState(false);
  const voornaam = profiel?.voornaam ?? '';
  const lidSinds = profiel ? lidSindsTekst(profiel.created_at) : '';

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

  const onUitloggen = () =>
    bevestig('Uitloggen?', 'Je kunt altijd weer inloggen met je e-mailadres.', 'Uitloggen', () => {
      uitloggen();
    });

  const onVerwijderen = () =>
    bevestig(
      'Account verwijderen?',
      'Je account en al je gegevens worden definitief verwijderd. Dit kun je niet ongedaan maken.',
      'Verwijderen',
      async () => {
        const fout = await verwijderAccount();
        if (fout) showToast(fout);
      },
    );

  return (
    <Screen>
      <ScreenHeader kicker="YOUR MOOOVE SPACE" titel="Profiel" puntKleur="#9FBC63" />
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{voornaam.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{voornaam}</Text>
          <Text style={styles.profileSub}>Mooove member · {lidSinds}</Text>
        </View>
      </View>

      <SectionTitleRow titel="Alarm-check" rechts="ALLES GEREED" />
      <View style={styles.setupCard}>
        <View style={styles.setupTop}>
          <Text style={styles.setupTitle}>Ready to Mooove.</Text>
          <View style={styles.secureTag}>
            <Text style={styles.secureTagText}>✓ Veilig ingesteld</Text>
          </View>
        </View>
        {CHECKS.map(([label, waarde], i) => (
          <View key={label} style={[styles.setupLine, i === CHECKS.length - 1 && styles.noBorder]}>
            <View style={styles.setupCheck}>
              <Icon name="check" size={13} color="#4B8E42" />
            </View>
            <Text style={styles.setupLabel}>{label}</Text>
            <Text style={styles.setupValue}>{waarde}</Text>
          </View>
        ))}
        <SecondaryButton
          label="Simuleer testalarm ↗"
          onPress={() => setTestOpen(true)}
          style={styles.testBtn}
        />
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
      {INSTELLINGEN.map((s) => (
        <View key={s.label} style={styles.setting}>
          <Icon name={s.icon} color={kleuren.ink} />
          <Text style={styles.settingLabel}>{s.label}</Text>
          <Text style={styles.settingValue}>{s.waarde}</Text>
        </View>
      ))}

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
      <Text style={styles.disclaimer}>
        Deze demo gebruikt fictieve statistieken en simulaties. Er worden geen echte alarmen gepland
        of camerabeelden verwerkt.
      </Text>

      <Modal
        visible={testOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setTestOpen(false)}
      >
        <StatusBar style="light" />
        <View style={styles.overlay}>
          <Text style={styles.testLabel}>MOOOVE SYSTEM CHECK</Text>
          <Text style={styles.testClock}>00:30</Text>
          <Text style={styles.testTitle}>Even testen.</Text>
          <Text style={styles.testText}>
            In de echte app controleert dit of alarmen door Stil en Niet storen heen gaan. Hier zie
            je hoe het testscherm eruitziet.
          </Text>
          <PrimaryButton
            label="Test geslaagd"
            icon="check"
            onPress={() => {
              setTestOpen(false);
              showToast('Testalarm gesimuleerd ✓');
            }}
            style={styles.testCta}
          />
        </View>
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
  secureTagText: { fontFamily: fonts.body800, fontSize: 9, color: '#578149' },
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
  disclaimer: {
    fontFamily: fonts.body400,
    fontSize: 10,
    lineHeight: 15.5,
    color: '#9AA69A',
    marginTop: 18,
  },
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
});

const MAANDEN = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];

function lidSindsTekst(iso: string): string {
  const d = new Date(iso);
  return `lid sinds ${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}
