import { StyleSheet, Text, View } from 'react-native';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { fonts, kleuren } from '@/constants/theme';

export const SPRONGEN_DOEL = 20;

// In de browser is er geen bewegingssensor; de missie vink je daar met de hand af.
export function BewegingStap(_props: {
  onVoortgang: (gedaan: number) => void;
  onKlaar: () => void;
}) {
  return (
    <CameraFrame label="BEWEGINGSSENSOR" notitie="ALLEEN IN DE APP">
      <View style={styles.midden}>
        <Text style={styles.uitleg}>De bewegingssensor werkt alleen in de app op je telefoon.</Text>
      </View>
    </CameraFrame>
  );
}

const styles = StyleSheet.create({
  midden: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  uitleg: { fontFamily: fonts.body600, fontSize: 14, color: kleuren.paper, textAlign: 'center' },
});
