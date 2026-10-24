import { Linking } from 'react-native';

// Opent de instellingen van Mooove op het toestel (rechten, meldingen)
export async function openInstellingen(): Promise<void> {
  await Linking.openSettings().catch(() => {});
}
