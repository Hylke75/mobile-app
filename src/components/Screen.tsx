import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { kleuren } from '@/constants/theme';

type Props = {
  children: ReactNode;
  dark?: boolean;
};

export function Screen({ children, dark = false }: Props) {
  const insets = useSafeAreaInsets();
  const achtergrond = dark ? kleuren.ink : kleuren.paper;

  return (
    <View style={[styles.root, { backgroundColor: achtergrond, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={dark ? styles.contentDark : styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: 22, paddingHorizontal: 24, paddingBottom: 32 },
  contentDark: { paddingTop: 14, paddingHorizontal: 21, paddingBottom: 30 },
});
