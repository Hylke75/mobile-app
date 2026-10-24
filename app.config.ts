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
  // Licht of donker volgt het toestel, met een keuze in Profiel
  userInterfaceStyle: 'automatic',
  // Teksten voor iOS-toestemmingen per taal (de rest van de app vertaalt src/i18n)
  locales: {
    nl: './locales/nl.json',
    en: './locales/en.json',
    es: './locales/es.json',
    de: './locales/de.json',
    fr: './locales/fr.json',
  },
  ios: {
    bundleIdentifier: 'nl.linkandlead.mobileapp',
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        'Mooove gebruikt je camera om je missie te controleren, zoals het tellen van squats. Beelden blijven op je toestel.',
      // De camerabibliotheek bevat microfooncode; Mooove vraagt hier nooit om
      NSMicrophoneUsageDescription:
        'Mooove neemt geen geluid op. Camerabeelden worden zonder geluid en alleen op je toestel verwerkt.',
      NSLocalNetworkUsageDescription:
        'Alleen in testversies: Mooove zoekt de ontwikkelserver op je lokale netwerk.',
      // Alleen standaard HTTPS: geen exportdocumentatie nodig
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: 'nl',
    },
    // Required reason API's die de app en bibliotheken zonder eigen manifest gebruiken
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeName',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeUserID',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeFitness',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          // Alleen als Sentry aan staat: crashrapporten zonder koppeling aan het account
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          // Namen van eigen missies
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherUserContent',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeProductInteraction',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
      ],
    },
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
    permissions: ['android.permission.CAMERA'],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      // Komt standaard mee van Expo; Mooove tekent niet over andere apps heen
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-localization',
      {
        supportedLocales: {
          ios: ['nl', 'en', 'es', 'de', 'fr'],
          android: ['nl', 'en', 'es', 'de', 'fr'],
        },
      },
    ],
    // react-native-nitro-pose-exercises vereist minimaal Android 8.0 (API 26)
    [
      'expo-build-properties',
      // iOS 26: AlarmKit (echte alarmen) bestaat pas vanaf deze versie
      { android: { minSdkVersion: 26 }, ios: { deploymentTarget: '26.0' } },
    ],
    [
      './plugins/withAlarmScheduler',
      {
        alarmKitUsageDescription:
          'Mooove zet je alarmen zodat ze ook afgaan als je telefoon op stil staat.',
      },
    ],
    [
      'expo-sensors',
      {
        motionPermission:
          'Mooove gebruikt de bewegingssensor om je sprongen te tellen als de camera je niet herkent.',
      },
    ],
    // Alleen lokale herinneringen: geen push, dus geen aps-environment en geen APNs-sleutel nodig
    ['expo-notifications', { enableRemoteNotifications: false }],
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
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: 'https://u.expo.dev/46bc55fa-0937-4b34-889d-e9b5e62afff8',
  },
  extra: {
    eas: {
      projectId: '46bc55fa-0937-4b34-889d-e9b5e62afff8',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
