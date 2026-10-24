import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

// Alleen relevant op Android: fabrikanten sluiten apps af die batterij-optimalisatie aan hebben
export async function batterijOptimalisatieAan(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  return Battery.isBatteryOptimizationEnabledAsync().catch(() => false);
}

export async function openBatterijInstellingen(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
    );
  } catch {
    await Linking.openSettings();
  }
}
