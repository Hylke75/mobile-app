import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { kleuren } from '@/constants/theme';

type Props = {
  children: ReactNode;
  // Lang drukken op het logo opent de wachtwoord-login voor de reviewers van de stores
  onLogoLangIngedrukt?: () => void;
};

export function AuthScreen({ children, onLogoLangIngedrukt }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onLongPress={onLogoLangIngedrukt}
          delayLongPress={1500}
          accessible={false}
          style={styles.logo}
        >
          <Logo />
        </Pressable>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: kleuren.ink },
  content: { flexGrow: 1, paddingTop: 22, paddingHorizontal: 24, paddingBottom: 32 },
  logo: { alignSelf: 'flex-start' },
  body: { flex: 1, justifyContent: 'center', paddingVertical: 32 },
});
