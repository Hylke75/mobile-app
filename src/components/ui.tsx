import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconNaam } from '@/components/Icon';
import { niveauNaam } from '@/constants/alarm';
import { em, fonts, kleuren } from '@/constants/theme';
import { useTaal } from '@/i18n';
import type { Niveau } from '@/types/app';

export function ScreenHeader({
  kicker,
  titel,
  puntKleur,
  rechts,
}: {
  kicker: string;
  titel: string;
  puntKleur: string;
  rechts?: ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.flex}>
        <Text style={styles.screenKicker}>{kicker}</Text>
        <Text style={styles.screenTitle}>
          {titel}
          <Text style={{ color: puntKleur }}>.</Text>
        </Text>
      </View>
      {rechts}
    </View>
  );
}

export function SectionTitleRow({ titel, rechts }: { titel: string; rechts?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{titel}</Text>
      {typeof rechts === 'string' ? <Text style={styles.sectionKicker}>{rechts}</Text> : rechts}
    </View>
  );
}

export function PrimaryButton({
  label,
  icon = 'arrow',
  onPress,
  style,
}: {
  label: string;
  icon?: IconNaam;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, style]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
      <Icon name={icon} color={kleuren.ink} />
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed, style]}
    >
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function RoundPlus({
  onPress,
  icon = 'plus',
  label,
}: {
  onPress?: () => void;
  icon?: IconNaam;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      style={styles.roundPlus}
    >
      <Icon name={icon} size={24} color={kleuren.ink} />
    </Pressable>
  );
}

export function LevelTag({ level, label }: { level: Niveau | 'hard'; label?: string }) {
  // Via useTaal, zodat de niveaunaam meewisselt met de taal
  useTaal();
  const variant =
    level === 'hard' || level === 'Verplicht' || level === 'Hardcore'
      ? styles.levelHard
      : level === 'Flexibel'
        ? styles.levelFlex
        : null;
  const tekstVariant =
    level === 'hard' || level === 'Verplicht' || level === 'Hardcore'
      ? styles.levelHardText
      : level === 'Flexibel'
        ? styles.levelFlexText
        : null;
  return (
    <View style={[styles.levelTag, variant]}>
      <Text style={[styles.levelTagText, tekstVariant]}>
        {label ?? (level === 'hard' ? level : niveauNaam(level))}
      </Text>
    </View>
  );
}

export function Toggle({
  on,
  onPress,
  label,
}: {
  on: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[styles.switch, on && styles.switchOn]}
    >
      <View style={[styles.switchKnob, on && styles.switchKnobOn]} />
    </Pressable>
  );
}

export const gedeeld = StyleSheet.create({
  sectionKicker: {
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.16, 10),
    color: '#5F6E60',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    borderRadius: 20,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backLinkText: { fontFamily: fonts.body800, fontSize: 12, color: kleuren.ink },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenKicker: {
    marginBottom: 7,
    fontFamily: fonts.body800,
    fontSize: 10,
    letterSpacing: em(0.14, 10),
    color: '#5F6E60',
  },
  screenTitle: {
    fontFamily: fonts.head700,
    fontSize: 34,
    letterSpacing: em(-0.065, 34),
    color: kleuren.ink,
  },
  sectionTitleRow: {
    marginTop: 25,
    marginBottom: 12,
    marginHorizontal: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: fonts.head700,
    fontSize: 18,
    letterSpacing: em(-0.045, 18),
    color: kleuren.ink,
  },
  sectionKicker: gedeeld.sectionKicker,
  primaryBtn: {
    width: '100%',
    borderRadius: 15,
    minHeight: 51,
    backgroundColor: kleuren.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  primaryBtnText: { fontFamily: fonts.body800, fontSize: 13, color: kleuren.ink },
  secondaryBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D7DCD3',
    borderRadius: 15,
    minHeight: 48,
    backgroundColor: kleuren.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: fonts.body800, fontSize: 12, color: kleuren.ink },
  pressed: { opacity: 0.92 },
  roundPlus: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: kleuren.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTag: {
    backgroundColor: '#EDF1E7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  levelTagText: { fontFamily: fonts.body800, fontSize: 9, color: '#62775B' },
  levelHard: { backgroundColor: '#E6F5A4' },
  levelHardText: { color: '#344B21' },
  levelFlex: { backgroundColor: '#D8EFF0' },
  levelFlexText: { color: '#38727A' },
  switch: {
    width: 42,
    height: 25,
    borderRadius: 30,
    padding: 3,
    backgroundColor: '#D5DDD5',
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: '#2D4B32' },
  switchKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: kleuren.white },
  switchKnobOn: { transform: [{ translateX: 17 }] },
});
