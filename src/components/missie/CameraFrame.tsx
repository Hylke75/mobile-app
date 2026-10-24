import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { em, fonts, kleuren } from '@/constants/theme';
import { useTaal } from '@/i18n';

export const CAMERA_HOOGTE = 285;

export function CameraFrame({
  label,
  notitie,
  achtergrond,
  children,
}: {
  label: string;
  notitie?: string;
  achtergrond?: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useTaal();
  return (
    <View style={styles.card}>
      {achtergrond}
      {children}
      <View style={styles.topLeft} pointerEvents="none">
        <View style={styles.recDot} />
        <Text style={styles.topLeftText}>{label}</Text>
      </View>
      <View pointerEvents="none" style={[styles.corner, styles.cornerTl]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerTr]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBl]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBr]} />
      <View style={styles.noteWrap} pointerEvents="none">
        <View style={styles.note}>
          <Icon name="shield" size={11} color="#C5D6BE" />
          <Text style={styles.noteText}>{notitie ?? t('missie.camera.notitie')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CAMERA_HOOGTE,
    borderWidth: 1,
    borderColor: '#50674E',
    borderRadius: 23,
    backgroundColor: '#1B2C22',
    overflow: 'hidden',
    marginTop: 18,
  },
  topLeft: {
    position: 'absolute',
    top: 13,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topLeftText: {
    fontFamily: fonts.body800,
    fontSize: 9,
    letterSpacing: em(0.13, 9),
    color: '#A4C4A0',
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: kleuren.lime,
    shadowColor: kleuren.lime,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  corner: {
    position: 'absolute',
    width: 27,
    height: 27,
    borderColor: kleuren.lime,
    opacity: 0.7,
  },
  cornerTl: { top: 38, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTr: { top: 38, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBl: { bottom: 25, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBr: { bottom: 25, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
  noteWrap: { position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 30,
    backgroundColor: 'rgba(31,48,38,0.73)',
    borderWidth: 1,
    borderColor: '#546E54',
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  noteText: {
    fontFamily: fonts.body400,
    fontSize: 9,
    letterSpacing: em(0.06, 9),
    color: '#C5D6BE',
  },
});
