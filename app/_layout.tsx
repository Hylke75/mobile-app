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
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AlarmenProvider } from '@/hooks/useAlarmen';
import { SessiesProvider } from '@/hooks/useSessies';
import { ToastProvider } from '@/hooks/useToast';
import { useWekkerRouting } from '@/hooks/useWekkerRouting';

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

  if (!fontsGeladen && !fontFout) return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <AlarmenProvider>
            <SessiesProvider>
              <RootNavigator />
            </SessiesProvider>
          </AlarmenProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status, profiel } = useAuth();
  const ingelogd = status === 'ingelogd';
  const heeftNaam = Boolean(profiel?.voornaam);

  useWekkerRouting();

  useEffect(() => {
    if (status !== 'laden') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'laden') return null;

  return (
    <View style={{ flex: 1, backgroundColor: kleuren.paper }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: kleuren.paper },
        }}
      >
        <Stack.Protected guard={!ingelogd}>
          <Stack.Screen
            name="inloggen"
            options={{ contentStyle: { backgroundColor: kleuren.ink } }}
          />
          <Stack.Screen name="code" options={{ contentStyle: { backgroundColor: kleuren.ink } }} />
        </Stack.Protected>
        <Stack.Protected guard={ingelogd && !heeftNaam}>
          <Stack.Screen
            name="welkom"
            options={{ contentStyle: { backgroundColor: kleuren.ink } }}
          />
        </Stack.Protected>
        <Stack.Protected guard={ingelogd && heeftNaam}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="nieuw-alarm" />
        </Stack.Protected>

        <Stack.Screen
          name="missie"
          options={{ contentStyle: { backgroundColor: kleuren.ink }, gestureEnabled: false }}
        />
        <Stack.Screen
          name="wekker"
          options={{ contentStyle: { backgroundColor: kleuren.ink }, gestureEnabled: false }}
        />
      </Stack>
      <Toast />
      <StatusBar style="dark" />
    </View>
  );
}
