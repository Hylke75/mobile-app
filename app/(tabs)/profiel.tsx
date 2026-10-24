import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import {
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  SectionTitleRow,
  Toggle,
} from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useAlarmCheck } from '@/hooks/useAlarmCheck';
import { useAlarmen } from '@/hooks/useAlarmen';
import { useAuth } from '@/hooks/useAuth';
import { useHerinneringInstellingen } from '@/hooks/useHerinneringen';
import { TAALNAMEN, TALEN, useTaal, type TaalKeuze } from '@/i18n';
import {
  kiesAlarmgeluid,
  kiesZachtGeluid,
  leesAlarmgeluid,
  wisAlarmgeluid,
  type Alarmgeluid,
} from '@/lib/alarmgeluid';
import { appVersie, toestelInfo } from '@/lib/appInfo';
import { supabase } from '@/lib/supabase';
import { openBatterijInstellingen } from '@/lib/batterij';
import { openInstellingen } from '@/lib/instellingen';
import { verzamelMijnGegevens } from '@/lib/export';
import {
  herinneringenBeschikbaar,
  vraagMeldingToestemming,
  zetHerinneringInstellingen,
} from '@/lib/herinneringen';
import type { HerinneringInstellingen } from '@/lib/herinneringPlan';
import { hervatOp, naarDatumSleutel } from '@/lib/tijd';
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
const CONTACT_EMAIL = 'hylke@linkandlead.nl';

function doelTekst(weekdoel: number, t: ReturnType<typeof useTaal>['t']): string {
  return weekdoel === 7
    ? t('profiel.weekdoel.elkeDag')
    : t('profiel.weekdoel.dagenPerWeek', { n: weekdoel });
}

const TAALKEUZES: TaalKeuze[] = ['auto', ...TALEN];

export default function ProfielScherm() {
  const { showToast } = useToast();
  const { t, locale, keuze, kiesTaal } = useTaal();
  const { profiel, user, uitloggen, verwijderAccount, werkProfielBij } = useAuth();
  const { statistiek } = useSessies();
  const { regels, allesInOrde, rechten, batterijAan, vraagAlleRechtenAan } = useAlarmCheck();
  const [test, setTest] = useState<'uit' | 'aftellen' | 'vraag'>('uit');
  const [resterend, setResterend] = useState(TEST_SECONDEN);
  const [doelOpen, setDoelOpen] = useState(false);
  const [taalOpen, setTaalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSoort, setFeedbackSoort] = useState<'probleem' | 'idee' | 'anders'>('idee');
  const [feedbackTekst, setFeedbackTekst] = useState('');
  const [feedbackBezig, setFeedbackBezig] = useState(false);

  const verstuurFeedback = async () => {
    const tekst = feedbackTekst.trim();
    if (!tekst) return showToast(t('profiel.feedback.leeg'));
    setFeedbackBezig(true);
    const { error } = await supabase.from('feedback').insert({
      soort: feedbackSoort,
      tekst: tekst.slice(0, 2000),
      appversie: appVersie(),
      toestel: toestelInfo(),
    });
    setFeedbackBezig(false);
    if (error) return showToast(t('profiel.feedback.fout'));
    setFeedbackOpen(false);
    setFeedbackTekst('');
    showToast(t('profiel.feedback.dank'));
  };
  const testId = useRef<string | null>(null);
  const { herplan } = useAlarmen();
  const [geluid, setGeluid] = useState<Alarmgeluid | null>(null);
  const herinneringen = useHerinneringInstellingen();

  const wisselHerinnering = async (soort: keyof HerinneringInstellingen) => {
    if (!herinneringenBeschikbaar) return showToast(t('herinneringen.alleenOpTelefoon'));
    const aan = !herinneringen[soort];
    if (aan && !(await vraagMeldingToestemming())) {
      showToast(t('herinneringen.geenToestemming'));
      return openInstellingen();
    }
    await zetHerinneringInstellingen({ ...herinneringen, [soort]: aan });
  };

  useEffect(() => {
    leesAlarmgeluid().then(setGeluid);
  }, []);

  const hervat = hervatOp(profiel?.pauze_tot);
  const pauzeTekst = hervat
    ? t('profiel.pauze.tot', {
        datum: hervat.toLocaleDateString(locale, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      })
    : t('profiel.pauze.uit');

  const zetPauze = async (dagen: number | null) => {
    let pauzeTot: string | null = null;
    if (dagen) {
      const laatste = new Date();
      laatste.setDate(laatste.getDate() + dagen - 1);
      pauzeTot = naarDatumSleutel(laatste);
    }
    const fout = await werkProfielBij({ pauze_tot: pauzeTot });
    if (fout) return showToast(fout);
    showToast(
      pauzeTot
        ? t('profiel.pauze.gepauzeerd', {
            datum:
              hervatOp(pauzeTot)?.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }) ?? '',
          })
        : t('profiel.pauze.hervat'),
    );
  };

  const pauzeOpties = () => {
    if (Platform.OS === 'web') {
      if (hervat) zetPauze(null);
      else if (window.confirm(t('profiel.pauze.webVraag'))) zetPauze(7);
      return;
    }
    Alert.alert(t('profiel.pauze.label'), t('profiel.pauze.uitleg'), [
      ...(hervat ? [{ text: t('profiel.pauze.stoppen'), onPress: () => zetPauze(null) }] : []),
      { text: t('profiel.pauze.drieDagen'), onPress: () => zetPauze(3) },
      { text: t('profiel.pauze.eenWeek'), onPress: () => zetPauze(7) },
      { text: t('profiel.pauze.tweeWeken'), onPress: () => zetPauze(14) },
      { text: t('algemeen.annuleren'), style: 'cancel' as const },
    ]);
  };

  const kiesGeluid = async () => {
    try {
      const nieuw = await kiesAlarmgeluid();
      if (!nieuw) return;
      setGeluid(nieuw);
      herplan();
      showToast(t('profiel.geluid.gekozen'));
    } catch {
      showToast(t('profiel.geluid.fout'));
    }
  };

  const zetGeluid = async (actie: () => Promise<Alarmgeluid | null>, melding: string) => {
    try {
      const nieuw = await actie();
      setGeluid(nieuw);
      herplan();
      showToast(melding);
    } catch {
      showToast(t('profiel.geluid.fout'));
    }
  };

  const geluidOpties = () => {
    Alert.alert(
      t('profiel.geluid.label'),
      t('profiel.geluid.nu', { naam: geluid?.naam ?? t('profiel.geluid.standaard') }),
      [
        {
          text: t('profiel.geluid.standaardGeluid'),
          onPress: () =>
            zetGeluid(async () => {
              await wisAlarmgeluid();
              return null;
            }, t('profiel.geluid.terugStandaard')),
        },
        {
          text: t('profiel.geluid.zacht'),
          onPress: () => zetGeluid(kiesZachtGeluid, t('profiel.geluid.zachtGekozen')),
        },
        { text: t('profiel.geluid.eigen'), onPress: kiesGeluid },
        { text: t('algemeen.annuleren'), style: 'cancel' },
      ],
    );
  };

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
      { text: t('algemeen.annuleren'), style: 'cancel' },
      { text: knop, style: 'destructive', onPress: actie },
    ]);
  };

  const startTest = async () => {
    if (!alarmenBeschikbaar) return showToast(t('profiel.test.alleenInApp'));
    if (!rechten?.canScheduleExactAlarms) {
      await vraagAlleRechtenAan();
      const nieuw = await haalRechtenOp().catch(() => null);
      if (!nieuw?.canScheduleExactAlarms) {
        return showToast(t('profiel.test.geenToestemming'));
      }
    }
    try {
      testId.current = await planTestAlarm(TEST_SECONDEN);
      setResterend(TEST_SECONDEN);
      setTest('aftellen');
    } catch {
      showToast(t('profiel.test.nietGepland'));
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
      showToast(fout ?? t('profiel.test.geslaagd'));
    } else {
      Alert.alert(t('profiel.test.nietGehoordTitel'), t('profiel.test.nietGehoordTekst'), [
        { text: t('algemeen.sluiten'), style: 'cancel' },
        { text: t('profiel.test.openInstellingen'), onPress: () => openAlarmInstellingen() },
      ]);
    }
  };

  const downloadGegevens = async () => {
    try {
      const json = await verzamelMijnGegevens(user?.email);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mooove-gegevens.json';
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      await Share.share({ title: t('profiel.downloadTitel'), message: json });
    } catch {
      showToast(t('profiel.downloadFout'));
    }
  };

  const onUitloggen = () =>
    bevestig(
      t('profiel.uitloggen.titel'),
      t('profiel.uitloggen.tekst'),
      t('profiel.uitloggen.label'),
      () => {
        uitloggen();
      },
    );

  const onVerwijderen = () =>
    bevestig(
      t('profiel.verwijderen.titel'),
      t('profiel.verwijderen.tekst'),
      t('algemeen.verwijderen'),
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

  const kiesTaalKeuze = (nieuw: TaalKeuze) => {
    setTaalOpen(false);
    kiesTaal(nieuw);
  };

  return (
    <Screen>
      <ScreenHeader kicker="YOUR MOOOVE SPACE" titel={t('profiel.titel')} puntKleur="#9FBC63" />
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{voornaam.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{voornaam}</Text>
          <Text style={styles.profileSub}>
            {statistiek.actieveDagen === 1
              ? t('profiel.memberDag', { n: statistiek.actieveDagen })
              : t('profiel.memberDagen', { n: statistiek.actieveDagen })}
          </Text>
        </View>
      </View>

      <SectionTitleRow
        titel={t('profiel.check.titel')}
        rechts={allesInOrde ? t('profiel.check.allesGereed') : t('profiel.check.actieNodig')}
      />
      <View style={styles.setupCard}>
        <View style={styles.setupTop}>
          <Text style={styles.setupTitle}>
            {allesInOrde ? t('profiel.check.klaar') : t('profiel.check.bijnaKlaar')}
          </Text>
          <View style={[styles.secureTag, !allesInOrde && styles.secureTagOpen]}>
            <Text style={[styles.secureTagText, !allesInOrde && styles.secureTagTextOpen]}>
              {allesInOrde ? t('profiel.check.veilig') : t('profiel.check.nietCompleet')}
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
            label={t('profiel.check.geefToestemming')}
            onPress={async () => {
              if (!alarmenBeschikbaar) return showToast(t('profiel.test.alleenOpTelefoon'));
              const inOrde = await vraagAlleRechtenAan();
              if (!inOrde) await openInstellingen();
            }}
            style={styles.testBtn}
          />
        )}
        {batterijAan && (
          <SecondaryButton
            label={t('profiel.check.batterijUit')}
            onPress={openBatterijInstellingen}
            style={styles.testBtn}
          />
        )}
        <SecondaryButton
          label={t('profiel.check.testKnop')}
          onPress={startTest}
          style={styles.testBtn}
        />
      </View>

      <Text style={styles.sectionHeading}>{t('profiel.meer')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setDoelOpen(true)}
        style={styles.setting}
      >
        <Icon name="target" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.mijnDoelen')}</Text>
        <Text style={styles.settingValue}>{doelTekst(profiel?.weekdoel ?? 7, t)}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={pauzeOpties} style={styles.setting}>
        <Icon name="calendar" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.pauze.label')}</Text>
        <Text style={styles.settingValue}>{pauzeTekst}</Text>
      </Pressable>
      {alarmenBeschikbaar && (
        <Pressable accessibilityRole="button" onPress={geluidOpties} style={styles.setting}>
          <Icon name="sound" color={kleuren.ink} />
          <Text style={styles.settingLabel}>{t('profiel.geluid.label')}</Text>
          <Text style={styles.settingValue} numberOfLines={1}>
            {geluid?.naam ?? t('profiel.geluid.standaard')}
          </Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => setTaalOpen(true)}
        style={styles.setting}
      >
        <Icon name="globe" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.taal.label')}</Text>
        <Text style={styles.settingValue} numberOfLines={1}>
          {keuze === 'auto' ? t('profiel.taal.automatisch') : TAALNAMEN[keuze]}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          alarmenBeschikbaar ? openInstellingen() : showToast(t('profiel.test.alleenOpTelefoon'))
        }
        style={styles.setting}
      >
        <Icon name="bell" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.meldingen')}</Text>
        <Text style={styles.settingValue}>
          {meldingenAan ? t('profiel.ingeschakeld') : t('profiel.uitgeschakeld')}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/privacy')}
        style={styles.setting}
      >
        <Icon name="shield" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.privacy')}</Text>
        <Text style={styles.settingValue}>{t('profiel.leesVerklaring')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Linking.openURL(
            `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('profiel.mailOnderwerp'))}&body=${encodeURIComponent(`\n\n—\n${toestelInfo()}`)}`,
          ).catch(() => showToast(t('profiel.mailOnsOp', { email: CONTACT_EMAIL })))
        }
        style={styles.setting}
      >
        <Icon name="info" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.hulp')}</Text>
        <Text style={styles.settingValue}>{t('profiel.mailOns')}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => setFeedbackOpen(true)}
        style={styles.setting}
      >
        <Icon name="info" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.feedback.label')}</Text>
        <Text style={styles.settingValue}>{t('profiel.feedback.waarde')}</Text>
      </Pressable>

      <Text style={styles.sectionHeading}>{t('herinneringen.kop')}</Text>
      {(['avond', 'streak'] as const).map((soort) => (
        <View key={soort} style={styles.setting}>
          <View style={styles.herinneringTekst}>
            <Text style={styles.settingLabel}>{t(`herinneringen.${soort}.label`)}</Text>
            <Text style={styles.herinneringUitleg}>{t(`herinneringen.${soort}.uitleg`)}</Text>
          </View>
          <Toggle
            on={herinneringen[soort]}
            onPress={() => wisselHerinnering(soort)}
            label={t(`herinneringen.${soort}.label`)}
          />
        </View>
      ))}

      <Text style={styles.sectionHeading}>{t('profiel.account')}</Text>
      <View style={styles.setting}>
        <Icon name="user" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.email')}</Text>
        <Text style={styles.settingValue}>{user?.email}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={downloadGegevens} style={styles.setting}>
        <Icon name="shield" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.download')}</Text>
        <Text style={styles.settingValue}>JSON →</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onUitloggen} style={styles.setting}>
        <Icon name="arrow" color={kleuren.ink} />
        <Text style={styles.settingLabel}>{t('profiel.uitloggen.label')}</Text>
        <Text style={styles.settingValue}>→</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onVerwijderen} style={styles.setting}>
        <Icon name="close" color="#C2462F" />
        <Text style={[styles.settingLabel, styles.gevaar]}>{t('profiel.verwijderen.label')}</Text>
        <Text style={styles.settingValue}>{t('profiel.verwijderen.waarde')}</Text>
      </Pressable>
      <Text style={styles.versie}>Mooove {appVersie()}</Text>

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
          <Text maxFontSizeMultiplier={1.2} style={styles.testClock}>
            00:{String(test === 'aftellen' ? resterend : 0).padStart(2, '0')}
          </Text>
          <Text style={styles.testTitle}>
            {test === 'aftellen' ? t('profiel.test.evenTesten') : t('profiel.test.gehoord')}
          </Text>
          <Text style={styles.testText}>
            {test === 'aftellen' ? t('profiel.test.aftellenTekst') : t('profiel.test.vraagTekst')}
          </Text>
          {test === 'vraag' ? (
            <>
              <PrimaryButton
                label={t('profiel.test.ja')}
                icon="check"
                onPress={() => testResultaat(true)}
                style={styles.testCta}
              />
              <SecondaryButton
                label={t('profiel.test.nee')}
                onPress={() => testResultaat(false)}
                style={styles.testSecundair}
              />
            </>
          ) : (
            <SecondaryButton
              label={t('algemeen.annuleren')}
              onPress={annuleerTest}
              style={styles.testCta}
            />
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
            <Text style={styles.setupTitle}>{t('profiel.weekdoel.titel')}</Text>
            <Text style={styles.doelUitleg}>{t('profiel.weekdoel.uitleg')}</Text>
            {[7, 5, 3].map((d) => (
              <Pressable
                key={d}
                accessibilityRole="button"
                onPress={() => kiesDoel(d)}
                style={[styles.doelOptie, profiel?.weekdoel === d && styles.doelOptieActief]}
              >
                <Text style={styles.settingLabel}>{doelTekst(d, t)}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={feedbackOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.doelOverlay}
        >
          <View style={styles.doelKaart}>
            <Text style={styles.setupTitle}>{t('profiel.feedback.titel')}</Text>
            <View style={styles.feedbackSoorten}>
              {(['probleem', 'idee', 'anders'] as const).map((soort) => (
                <Pressable
                  key={soort}
                  accessibilityRole="button"
                  accessibilityState={{ selected: feedbackSoort === soort }}
                  onPress={() => setFeedbackSoort(soort)}
                  style={[styles.feedbackSoort, feedbackSoort === soort && styles.doelOptieActief]}
                >
                  <Text style={styles.settingLabel}>{t(`profiel.feedback.${soort}`)}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={feedbackTekst}
              onChangeText={setFeedbackTekst}
              placeholder={t('profiel.feedback.plaats')}
              placeholderTextColor="#8A968C"
              multiline
              maxLength={2000}
              accessibilityLabel={t('profiel.feedback.titel')}
              style={styles.feedbackInvoer}
            />
            <PrimaryButton
              label={feedbackBezig ? t('algemeen.bezig') : t('profiel.feedback.stuur')}
              onPress={verstuurFeedback}
            />
            <SecondaryButton
              label={t('profiel.feedback.annuleer')}
              onPress={() => setFeedbackOpen(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={taalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTaalOpen(false)}
      >
        <Pressable style={styles.doelOverlay} onPress={() => setTaalOpen(false)}>
          <View style={styles.doelKaart}>
            <Text style={styles.setupTitle}>{t('profiel.taal.titel')}</Text>
            {TAALKEUZES.map((k) => (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityState={{ selected: keuze === k }}
                onPress={() => kiesTaalKeuze(k)}
                style={[styles.doelOptie, keuze === k && styles.doelOptieActief]}
              >
                <Text style={styles.settingLabel}>
                  {k === 'auto' ? t('profiel.taal.automatischLang') : TAALNAMEN[k]}
                </Text>
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
  setupValue: { marginLeft: 'auto', fontFamily: fonts.body700, fontSize: 10, color: '#5F6E60' },
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
  herinneringTekst: { flex: 1, paddingRight: 14 },
  herinneringUitleg: {
    fontFamily: fonts.body400,
    fontSize: 11,
    lineHeight: 15,
    color: '#5F6E60',
    marginTop: 3,
  },
  versie: {
    fontFamily: fonts.body600,
    fontSize: 11,
    color: '#5F6E60',
    textAlign: 'center',
    marginTop: 18,
  },
  gevaar: { color: '#C2462F' },
  settingValue: { fontFamily: fonts.body800, fontSize: 10, color: '#5F6E60', maxWidth: 150 },
  doelUitleg: {
    fontFamily: fonts.body400,
    fontSize: 12,
    lineHeight: 17,
    color: '#4F5D51',
    marginBottom: 6,
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
  feedbackSoorten: { flexDirection: 'row', gap: 6 },
  feedbackSoort: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 12,
    paddingVertical: 10,
  },
  feedbackInvoer: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.body400,
    fontSize: 14,
    color: kleuren.ink,
    textAlignVertical: 'top',
  },
});
