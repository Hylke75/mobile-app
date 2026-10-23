import * as Speech from 'expo-speech';

export function spreek(tekst: string): void {
  Speech.stop();
  Speech.speak(tekst, { language: 'nl-NL', rate: 1.02 });
}

export function stopSpraak(): void {
  Speech.stop();
}
