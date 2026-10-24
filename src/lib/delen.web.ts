import type { ComponentRef, RefObject } from 'react';
import { Share, View } from 'react-native';

// In de browser delen we alleen de tekst (Web Share API waar beschikbaar)
export async function deelAlsAfbeelding(
  _ref: RefObject<ComponentRef<typeof View> | null>,
  tekst: string,
): Promise<void> {
  await Share.share({ message: tekst });
}
