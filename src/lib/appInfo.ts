import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function appVersie(): string {
  const versie = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '?';
  const build = Application.nativeBuildVersion;
  return build ? `${versie} (${build})` : versie;
}

// Voor supportmails: helpt bij het nazoeken van een probleem
export function toestelInfo(): string {
  const systeem = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
  return `Mooove ${appVersie()} · ${systeem} ${String(Platform.Version)}`;
}
