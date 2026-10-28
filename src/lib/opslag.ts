// Kleine lokale cache zodat de app zonder internet blijft werken.
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function leesLokaal<T>(sleutel: string): Promise<T | null> {
  try {
    const waarde = await AsyncStorage.getItem(sleutel);
    return waarde ? (JSON.parse(waarde) as T) : null;
  } catch {
    return null;
  }
}

export async function schrijfLokaal<T>(sleutel: string, waarde: T | null): Promise<void> {
  try {
    if (waarde === null) await AsyncStorage.removeItem(sleutel);
    else await AsyncStorage.setItem(sleutel, JSON.stringify(waarde));
  } catch {
    // Cache is een extraatje; zonder cache werkt de app gewoon online
  }
}

export const SLEUTELS = {
  profiel: 'mooove.profiel',
  alarmen: 'mooove.alarmen',
  sessieWachtrij: 'mooove.sessie-wachtrij',
  sessies: 'mooove.sessies',
  eigenMissies: 'mooove.eigen-missies',
  klaargezet: 'mooove.klaargezet',
  alarmgeluid: 'mooove.alarmgeluid',
  beoordelingGevraagd: 'mooove.beoordeling-gevraagd',
  weekoverzichtGezien: 'mooove.weekoverzicht-gezien',
  taal: 'mooove.taal',
  herinneringen: 'mooove.herinneringen',
  geluidPerAlarm: 'mooove.geluid-per-alarm',
  gevoelWachtrij: 'mooove.gevoel-wachtrij',
  thema: 'mooove.thema',
  proefMelding: 'mooove.proef-melding',
  proefOvergang: 'mooove.proef-overgang',
} as const;

export async function wisLokaal(): Promise<void> {
  const perAccount = [
    SLEUTELS.profiel,
    SLEUTELS.alarmen,
    SLEUTELS.sessieWachtrij,
    SLEUTELS.sessies,
    SLEUTELS.eigenMissies,
    SLEUTELS.gevoelWachtrij,
    SLEUTELS.proefMelding,
    SLEUTELS.proefOvergang,
  ];
  await Promise.all(perAccount.map((s) => schrijfLokaal(s, null)));
}
