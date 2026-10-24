import { StyleSheet, Text, View } from 'react-native';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { fonts, kleuren } from '@/constants/theme';
import { useTaal } from '@/i18n';

export const SPRONGEN_DOEL = 20;

// In de browser is er geen bewegingssensor; de missie vink je daar met de hand af.
export function BewegingStap(_props: {
  onVoortgang: (gedaan: number) => void;
  onKlaar: () => void;
}) {
  const { t } = useTaal();
  return (
    <CameraFrame label={t('missie.beweging.label')} notitie={t('missie.camera.alleenInApp')}>
      <View style={styles.midden}>
        <Text style={styles.uitleg}>{t('missie.beweging.alleenApp')}</Text>
      </View>
    </CameraFrame>
  );
}

const styles = StyleSheet.create({
  midden: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  uitleg: { fontFamily: fonts.body600, fontSize: 14, color: kleuren.paper, textAlign: 'center' },
});
