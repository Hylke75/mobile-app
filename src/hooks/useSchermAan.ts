import { useKeepAwake } from 'expo-keep-awake';

// Houdt het scherm aan zolang het onderdeel zichtbaar is
export function useSchermAan(): void {
  useKeepAwake();
}
