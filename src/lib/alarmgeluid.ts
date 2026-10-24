import { Asset } from 'expo-asset';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';

import { t } from '@/i18n';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';

export type Alarmgeluid = { uri: string; naam: string };

export function leesAlarmgeluid(): Promise<Alarmgeluid | null> {
  return leesLokaal<Alarmgeluid>(SLEUTELS.alarmgeluid);
}

function ruimOp(uri: string | undefined) {
  if (!uri) return;
  try {
    const bestand = new File(uri);
    if (bestand.exists) bestand.delete();
  } catch {
    // Een achtergebleven bestand is niet erg
  }
}

// Kopieert het gekozen geluid naar vaste opslag, zodat het ook later nog ingepland kan worden
export async function kiesAlarmgeluid(): Promise<Alarmgeluid | null> {
  const keuze = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  const asset = keuze.canceled ? undefined : keuze.assets[0];
  if (!asset) return null;
  const extensie = asset.name.includes('.') ? asset.name.split('.').pop() : 'mp3';
  const doel = new File(Paths.document, `alarmgeluid-${Date.now()}.${extensie}`);
  await new File(asset.uri).copy(doel);
  const vorig = await leesAlarmgeluid();
  const geluid = { uri: doel.uri, naam: asset.name.replace(/\.[^.]+$/, '') };
  await schrijfLokaal(SLEUTELS.alarmgeluid, geluid);
  ruimOp(vorig?.uri);
  return geluid;
}

// Meegeleverd geluid dat in 24 seconden van zacht naar luid gaat
export async function kiesZachtGeluid(): Promise<Alarmgeluid> {
  const asset = Asset.fromModule(require('../../assets/sounds/zacht-wakker.wav'));
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Geluid niet beschikbaar');
  const doel = new File(Paths.document, `alarmgeluid-zacht-${Date.now()}.wav`);
  await new File(asset.localUri).copy(doel);
  const vorig = await leesAlarmgeluid();
  const geluid = { uri: doel.uri, naam: t('systeem.geluid.zacht') };
  await schrijfLokaal(SLEUTELS.alarmgeluid, geluid);
  ruimOp(vorig?.uri);
  return geluid;
}

export async function wisAlarmgeluid(): Promise<void> {
  const vorig = await leesAlarmgeluid();
  await schrijfLokaal(SLEUTELS.alarmgeluid, null);
  ruimOp(vorig?.uri);
}

// Geluid per alarm: zoals in Profiel ingesteld, het standaardgeluid van het toestel of zacht
export type GeluidKeuze = 'profiel' | 'standaard' | 'zacht';

export async function leesGeluidKeuzes(): Promise<Record<string, GeluidKeuze>> {
  return (await leesLokaal<Record<string, GeluidKeuze>>(SLEUTELS.geluidPerAlarm)) ?? {};
}

export async function zetGeluidKeuze(alarmId: string, keuze: GeluidKeuze | null): Promise<void> {
  const { [alarmId]: _oud, ...rest } = await leesGeluidKeuzes();
  const nieuw = keuze && keuze !== 'profiel' ? { ...rest, [alarmId]: keuze } : rest;
  await schrijfLokaal(SLEUTELS.geluidPerAlarm, Object.keys(nieuw).length ? nieuw : null);
}

// Vaste kopie van het zachte geluid voor alarmen die dat per alarm gebruiken
async function vastZachtGeluid(): Promise<Alarmgeluid> {
  const doel = new File(Paths.document, 'alarmgeluid-zacht-vast.wav');
  if (!doel.exists) {
    const asset = Asset.fromModule(require('../../assets/sounds/zacht-wakker.wav'));
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error('Geluid niet beschikbaar');
    await new File(asset.localUri).copy(doel);
  }
  return { uri: doel.uri, naam: t('systeem.geluid.zacht') };
}

export async function geluidVoorAlarm(
  keuze: GeluidKeuze | undefined,
  profiel: Alarmgeluid | null,
): Promise<Alarmgeluid | null> {
  if (keuze === 'standaard') return null;
  if (keuze === 'zacht') return vastZachtGeluid().catch(() => profiel);
  return profiel;
}
