import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { maakStijlen, useKleuren } from '@/hooks/useThema';
import { Icon, type IconNaam } from '@/components/Icon';
import { fonts } from '@/constants/theme';
import { useTaal, type Sleutel } from '@/i18n';

const TABS: { route: string; icon: IconNaam; label: Sleutel }[] = [
  { route: 'index', icon: 'home', label: 'navigatie.tabs.vandaag' },
  { route: 'alarmen', icon: 'clock', label: 'navigatie.tabs.alarmen' },
  { route: 'progressie', icon: 'chart', label: 'navigatie.tabs.progressie' },
  { route: 'profiel', icon: 'user', label: 'navigatie.tabs.profiel' },
];

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const styles = useStyles();
  const kl = useKleuren();
  const insets = useSafeAreaInsets();
  const { t } = useTaal();
  const huidig = state.routes[state.index]?.name;

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 18) }]}>
      {TABS.map((tab) => {
        const isActief = huidig === tab.route;
        return (
          <Pressable
            key={tab.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActief }}
            accessibilityLabel={t(tab.label)}
            onPress={() => {
              const route = state.routes.find((r) => r.name === tab.route);
              if (route) navigateToTab(route.key);
            }}
            style={styles.item}
          >
            <View style={[styles.iconWrap, isActief && styles.iconWrapActief]}>
              <Icon name={tab.icon} size={19} color={isActief ? kl.opLime : '#8F9991'} />
            </View>
            <Text style={[styles.label, isActief && styles.labelActief]}>{t(tab.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = maakStijlen((k) =>
  StyleSheet.create({
    nav: {
      minHeight: 86,
      paddingHorizontal: 11,
      backgroundColor: k.white,
      borderTopWidth: 1,
      borderTopColor: k.rand('#E7EAE1'),
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
    iconWrapActief: { backgroundColor: k.lime },
    label: { fontFamily: fonts.body800, fontSize: 9, color: k.tint('#5F6E60') },
    labelActief: { color: k.ink },
  }),
);
