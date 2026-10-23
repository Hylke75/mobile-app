import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Mooove',
  slug: 'mobile-app',
  owner: 'link-and-lead',
  scheme: 'mooove',
  version: '1.0.0',
  orientation: 'portrait',
  // Conceptlogo uit docs/ontwerp; het merk is nog niet definitief vastgelegd
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'nl.linkandlead.mobileapp',
    buildNumber: '1',
    supportsTablet: true,
  },
  android: {
    package: 'nl.linkandlead.mobileapp',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#D8FB59',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F3F3ED',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '46bc55fa-0937-4b34-889d-e9b5e62afff8',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
