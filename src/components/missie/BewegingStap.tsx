import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CameraFrame } from '@/components/missie/CameraFrame';
import { fonts, kleuren } from '@/constants/theme';

export const SPRONGEN_DOEL = 20;

// Drempels in g: een sprong is een duidelijke piek gevolgd door weer rustig
const PIEK = 1.8;
const RUST = 1.15;
const MIN_TUSSENPOOS_MS = 280;

type Props = {
  onVoortgang: (gedaan: number) => void;
  onKlaar: () => void;
};

// Alternatief als de camera je niet herkent: sprongen tellen met de bewegingssensor
export function BewegingStap({ onVoortgang, onKlaar }: Props) {
  const voortgang = useRef(onVoortgang);
  const klaar = useRef(onKlaar);
  useEffect(() => {
    voortgang.current = onVoortgang;
    klaar.current = onKlaar;
  });

  useEffect(() => {
    let teller = 0;
    let inPiek = false;
    let laatste = 0;
    let afgerond = false;
    Accelerometer.setUpdateInterval(40);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (afgerond) return;
      const g = Math.sqrt(x * x + y * y + z * z);
      const nu = Date.now();
      if (!inPiek && g > PIEK && nu - laatste > MIN_TUSSENPOOS_MS) {
        inPiek = true;
        laatste = nu;
        teller += 1;
        voortgang.current(teller);
        if (teller >= SPRONGEN_DOEL) {
          afgerond = true;
          klaar.current();
        }
      } else if (inPiek && g < RUST) {
        inPiek = false;
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <CameraFrame label="BEWEGINGSSENSOR" notitie="SENSOR · OP JE TOESTEL">
      <View style={styles.midden}>
        <Text style={styles.emoji}>🤸</Text>
        <Text style={styles.uitleg}>
          Houd je telefoon stevig vast en spring {SPRONGEN_DOEL} keer. Mooove telt elke sprong.
        </Text>
      </View>
    </CameraFrame>
  );
}

const styles = StyleSheet.create({
  midden: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 64, marginBottom: 12 },
  uitleg: {
    fontFamily: fonts.body600,
    fontSize: 14,
    lineHeight: 20,
    color: kleuren.paper,
    textAlign: 'center',
  },
});
