import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconNaam } from '@/components/Icon';
import { fonts, kleuren } from '@/constants/theme';

const TABS: { route: string; icon: IconNaam; label: string }[] = [
  { route: 'index', icon: 'home', label: 'Vandaag' },
  { route: 'alarmen', icon: 'clock', label: 'Alarmen' },
  { route: 'progressie', icon: 'chart', label: 'Progressie' },
  { route: 'profiel', icon: 'user', label: 'Profiel' },
];

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const huidig = state.routes[state.index]?.name;
  const actief = huidig === 'coach' ? 'profiel' : huidig;

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 18) }]}>
      {TABS.map((tab) => {
        const isActief = actief === tab.route;
        return (
          <Pressable
            key={tab.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActief }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const route = state.routes.find((r) => r.name === tab.route);
              if (route) navigateToTab(route.key);
            }}
            style={styles.item}
          >
            <View style={[styles.iconWrap, isActief && styles.iconWrapActief]}>
              <Icon name={tab.icon} size={19} color={isActief ? kleuren.ink : '#8F9991'} />
            </View>
            <Text style={[styles.label, isActief && styles.labelActief]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    minHeight: 86,
    paddingHorizontal: 11,
    backgroundColor: kleuren.white,
    borderTopWidth: 1,
    borderTopColor: '#E7EAE1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 1,
  },
  iconWrap: {
    height: 34,
    width: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActief: { backgroundColor: kleuren.lime },
  label: { fontFamily: fonts.body800, fontSize: 9, color: '#8F9991' },
  labelActief: { color: kleuren.ink },
});
