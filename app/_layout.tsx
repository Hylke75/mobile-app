import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
import { SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk/400Regular';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '@/components/Toast';
import { kleuren } from '@/constants/theme';
import { AuthProvider } from '@/hooks/useAuth';
import { DemoProvider } from '@/hooks/useDemo';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsGeladen, fontFout] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsGeladen || fontFout) SplashScreen.hideAsync();
  }, [fontsGeladen, fontFout]);

  if (!fontsGeladen && !fontFout) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DemoProvider>
          <View style={{ flex: 1, backgroundColor: kleuren.paper }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: kleuren.paper },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="nieuw-alarm" />
              <Stack.Screen
                name="missie"
                options={{ contentStyle: { backgroundColor: kleuren.ink } }}
              />
            </Stack>
            <Toast />
          </View>
          <StatusBar style="dark" />
        </DemoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
