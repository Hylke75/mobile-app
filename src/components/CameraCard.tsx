// Gesimuleerde camerakaart: er wordt geen echt camerabeeld gebruikt.
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { em, fonts, kleuren } from '@/constants/theme';

const HOOGTE = 285;

function Achtergrond({ breedte }: { breedte: number }) {
  const lijnen = [];
  for (let x = 0; x <= breedte; x += 32) {
    lijnen.push(<Line key={`x${x}`} x1={x} y1={0} x2={x} y2={HOOGTE} />);
  }
  for (let y = 0; y <= HOOGTE; y += 32) {
    lijnen.push(<Line key={`y${y}`} x1={0} y1={y} x2={breedte} y2={y} />);
  }
  return (
    <Svg width={breedte} height={HOOGTE} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="cam" cx="50%" cy="44%" r="70%" fx="50%" fy="44%">
          <Stop offset="0" stopColor="#314A32" />
          <Stop offset="0.57" stopColor="#1B2C22" />
          <Stop offset="1" stopColor="#142117" />
        </RadialGradient>
      </Defs>
      <Rect width={breedte} height={HOOGTE} fill="url(#cam)" />
      <G stroke="#D7F7C9" strokeOpacity={0.03} strokeWidth={1}>
        {lijnen}
      </G>
    </Svg>
  );
}

function Lichaamsfiguur() {
  return (
    <Svg width={200} height={250} viewBox="0 0 200 260" style={styles.figure}>
      <G
        stroke={kleuren.lime}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Circle cx="100" cy="45" r="19" />
        <Path d="M100 65 98 127M98 82 65 107 42 133M100 83l31 29 30-11M98 127 69 168 40 194M98 127l37 41 33 28" />
      </G>
      <G fill={kleuren.lime} stroke="#18321E" strokeWidth={3}>
        <Circle cx="100" cy="66" r="5" />
        <Circle cx="98" cy="127" r="5" />
        <Circle cx="65" cy="107" r="5" />
        <Circle cx="131" cy="112" r="5" />
        <Circle cx="69" cy="168" r="5" />
        <Circle cx="135" cy="168" r="5" />
      </G>
    </Svg>
  );
}

export function CameraCard({ modus, emoji }: { modus: 'pose' | 'object'; emoji?: string }) {
  const [breedte, setBreedte] = useState(0);
  const [scan] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animatie = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scan, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animatie.start();
    return () => animatie.stop();
  }, [scan]);

  return (
    <View style={styles.card} onLayout={(e) => setBreedte(e.nativeEvent.layout.width)}>
      {breedte > 0 && <Achtergrond breedte={breedte} />}
      <View style={styles.topLeft}>
        <View style={styles.recDot} />
        <Text style={styles.topLeftText}>
          {modus === 'pose' ? 'POSE DETECTION' : 'OBJECT DETECTION'}
        </Text>
      </View>
      <View style={[styles.corner, styles.cornerTl]} />
      <View style={[styles.corner, styles.cornerTr]} />
      <View style={[styles.corner, styles.cornerBl]} />
      <View style={[styles.corner, styles.cornerBr]} />
      {modus === 'pose' ? (
        <Lichaamsfiguur />
      ) : (
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      )}
      <Animated.View
        style={[
          styles.scanLine,
          {
            opacity: scan.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
            transform: [
              {
                translateY: scan.interpolate({
                  inputRange: [0, 1],
                  outputRange: [HOOGTE * 0.34, HOOGTE * 0.75],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.noteWrap} pointerEvents="none">
        <View style={styles.note}>
          <Icon name="shield" size={11} color="#C5D6BE" />
          <Text style={styles.noteText}>CAMERA PREVIEW · DEMO</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: HOOGTE,
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
  figure: {
    position: 'absolute',
    top: 25,
    alignSelf: 'center',
  },
  emojiWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 110 },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(216,251,89,0.38)',
    shadowColor: kleuren.lime,
    shadowOpacity: 1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
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
