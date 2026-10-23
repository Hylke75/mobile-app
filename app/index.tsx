import { StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '@/constants/app';

export default function StartScherm() {
  return (
    <View style={styles.container}>
      <Text style={styles.titel}>{APP_NAME}</Text>
      <Text style={styles.subtitel}>Welkom! De app is klaar om te bouwen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  titel: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitel: {
    marginTop: 8,
    fontSize: 16,
    color: '#555555',
  },
});
