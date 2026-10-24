import * as Speech from 'expo-speech';

import { huidigeLocale } from '@/i18n';

export function spreek(tekst: string): void {
  Speech.stop();
  Speech.speak(tekst, { language: huidigeLocale(), rate: 1.02 });
}

export function stopSpraak(): void {
  Speech.stop();
}
