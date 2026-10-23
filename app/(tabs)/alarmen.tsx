import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { LevelTag, RoundPlus, ScreenHeader, Toggle } from '@/components/ui';
import { em, fonts, kleuren } from '@/constants/theme';
import { useDemo } from '@/hooks/useDemo';

export default function AlarmenScherm() {
  const { alarms, toggleAlarm } = useDemo();
  const nieuwAlarm = () => router.push('/nieuw-alarm');

  return (
    <Screen>
      <ScreenHeader
        kicker="STAY CONSISTENT"
        titel="Mijn alarmen"
        puntKleur="#8EB64F"
        rechts={<RoundPlus onPress={nieuwAlarm} label="Nieuw alarm" />}
      />
      <Text style={styles.description}>
        Jouw momenten om in beweging te komen. Kies zelf hoe streng Mooove voor je is.
      </Text>

      {alarms.map((a) => (
        <View key={a.id} style={[styles.card, !a.on && styles.cardDisabled]}>
          <View style={styles.cardHead}>
            <Text style={styles.time}>{a.time}</Text>
            <Toggle
              on={a.on}
              onPress={() => toggleAlarm(a.id)}
              label={`${a.name} ${a.on ? 'uitschakelen' : 'inschakelen'}`}
            />
          </View>
          <Text style={styles.name}>{a.name}</Text>
          <Text style={styles.days}>{a.days}</Text>
          <View style={styles.footer}>
            <LevelTag level={a.level} />
            <Text style={styles.count}>{a.count}</Text>
          </View>
        </View>
      ))}

      <View style={styles.banner}>
        <View style={styles.flex}>
          <Text style={styles.bannerTitle}>Maak je eigen routine.</Text>
          <Text style={styles.bannerText}>Meer bewegen begint met één goed moment.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Maak een alarm"
          onPress={nieuwAlarm}
          style={styles.bannerBtn}
        >
          <Icon name="plus" color={kleuren.ink} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  description: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: '#77857D',
    lineHeight: 18,
    marginTop: -7,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    backgroundColor: kleuren.white,
    borderWidth: 1,
    borderColor: kleuren.line,
    padding: 16,
    marginBottom: 11,
  },
  cardDisabled: { opacity: 0.58 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: {
    fontFamily: fonts.head700,
    fontSize: 43,
    lineHeight: 43,
    letterSpacing: em(-0.075, 43),
    color: kleuren.ink,
  },
  name: { fontFamily: fonts.body800, fontSize: 13, marginTop: 7, color: kleuren.ink },
  days: { fontFamily: fonts.body400, fontSize: 10, color: '#829087', marginTop: 3 },
  footer: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 15 },
  count: { fontFamily: fonts.body400, fontSize: 10, color: '#9AA59A', marginLeft: 'auto' },
  banner: {
    backgroundColor: kleuren.ink,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  bannerTitle: { fontFamily: fonts.head700, fontSize: 16, color: kleuren.white },
  bannerText: {
    fontFamily: fonts.body400,
    fontSize: 11,
    color: '#B4C0B4',
    marginTop: 5,
    maxWidth: 210,
  },
  bannerBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: kleuren.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
