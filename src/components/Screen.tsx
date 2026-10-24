import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { maakStijlen, useKleuren } from '@/hooks/useThema';

type Props = {
  children: ReactNode;
  dark?: boolean;
  // Omlaag trekken om te verversen
  onRefresh?: () => Promise<unknown>;
};

export function Screen({ children, dark = false, onRefresh }: Props) {
  const styles = useStyles();
  const kl = useKleuren();
  const insets = useSafeAreaInsets();
  const [verversen, setVerversen] = useState(false);
  const ververs = () => {
    if (!onRefresh) return;
    setVerversen(true);
    onRefresh()
      .catch(() => {})
      .finally(() => setVerversen(false));
  };
  const achtergrond = dark ? kl.ink : kl.paper;

  return (
    <View style={[styles.root, { backgroundColor: achtergrond, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={dark ? styles.contentDark : styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={verversen}
              onRefresh={ververs}
              tintColor={dark ? kl.lime : kl.ink}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

const useStyles = maakStijlen((k) =>
  StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    content: { paddingTop: 22, paddingHorizontal: 24, paddingBottom: 32 },
    contentDark: { paddingTop: 14, paddingHorizontal: 21, paddingBottom: 30 },
  }),
);
