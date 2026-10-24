import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import { Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// Deelt een onderdeel van het scherm als afbeelding; zonder deelvenster als tekst
export async function deelAlsAfbeelding(
  ref: RefObject<ComponentRef<typeof View> | null>,
  tekst: string,
): Promise<void> {
  if (ref.current && (await Sharing.isAvailableAsync())) {
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: tekst, UTI: 'public.png' });
    return;
  }
  await Share.share({ message: tekst });
}
