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

import { Foutscherm } from '@/components/Foutscherm';
import { Toast } from '@/components/Toast';
import { kleuren } from '@/constants/theme';
import { startFoutrapportage } from '@/lib/fouten';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AlarmenProvider } from '@/hooks/useAlarmen';
import { SessiesProvider } from '@/hooks/useSessies';
import { ToastProvider } from '@/hooks/useToast';
import { TaalProvider } from '@/i18n';
import { ThemaProvider, useThema } from '@/hooks/useThema';
import { useHerinneringen } from '@/hooks/useHerinneringen';
import { useWekkerRouting } from '@/hooks/useWekkerRouting';

SplashScreen.preventAutoHideAsync();

startFoutrapportage();

export const ErrorBoundary = Foutscherm;

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
      <TaalProvider>
        <ThemaProvider>
          <ToastProvider>
            <AuthProvider>
              <AlarmenProvider>
                <SessiesProvider>
                  <RootNavigator />
                </SessiesProvider>
              </AlarmenProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemaProvider>
      </TaalProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status, profiel } = useAuth();
  const ingelogd = status === 'ingelogd';
  const heeftNaam = Boolean(profiel?.voornaam);

  const thema = useThema();
  useWekkerRouting(status !== 'laden');
  useHerinneringen();

  useEffect(() => {
    if (status !== 'laden') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'laden') return null;

  return (
    <View style={{ flex: 1, backgroundColor: thema.kleuren.paper }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: thema.kleuren.paper },
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
          <Stack.Screen
            name="klaarzetten"
            options={{ contentStyle: { backgroundColor: kleuren.ink }, gestureEnabled: false }}
          />
        </Stack.Protected>

        <Stack.Screen
          name="missie"
          options={{ contentStyle: { backgroundColor: kleuren.ink }, gestureEnabled: false }}
        />
        <Stack.Screen name="privacy" />
        <Stack.Screen
          name="wekker"
          options={{ contentStyle: { backgroundColor: kleuren.ink }, gestureEnabled: false }}
        />
      </Stack>
      <Toast />
      <StatusBar style={thema.naam === 'donker' ? 'light' : 'dark'} />
    </View>
  );
}
