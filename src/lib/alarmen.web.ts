// Op web bestaan geen native alarmen; alle functies zijn hier no-ops.
import type { AlarmPermissionResponse } from 'react-native-alarm-scheduler';

import type { EigenMissies } from '@/lib/missies';
import type { Alarm, Doelen, EigenMissie, MissieId, Niveau } from '@/types/app';

export const alarmenBeschikbaar = false;

export type WekkerType = 'alarm' | 'test' | 'wakkercheck';

export type Wekker = {
  alarmId: string;
  occurrenceId?: string;
  type: WekkerType;
  snoozes: number;
  missieBezig: boolean;
  niveau?: Niveau;
  naam?: string;
  oefeningen?: MissieId[];
  eigen?: EigenMissie[];
  doelen?: Doelen;
};

const geenRechten: AlarmPermissionResponse = {
  platform: 'ios',
  status: 'unavailable',
  canScheduleExactAlarms: false,
  canOpenSettings: false,
  canUseFullScreenIntent: false,
  canPostNotifications: false,
};

export async function haalRechtenOp(): Promise<AlarmPermissionResponse> {
  return geenRechten;
}
export async function vraagRechtenAan(): Promise<AlarmPermissionResponse> {
  return geenRechten;
}
export async function openAlarmInstellingen(): Promise<void> {}
export async function synchroniseer(
  _alarms: Alarm[],
  _pauzeTot?: string | null,
  _eigen?: EigenMissies,
): Promise<void> {}
export async function annuleerAlles(): Promise<void> {}
export function deblokkeerSynchronisatie(): void {}
export async function annuleerAlarm(_id: string): Promise<void> {}
export async function planTestAlarm(_seconden: number): Promise<string> {
  throw new Error('Alarmen zijn niet beschikbaar op web.');
}
export async function planWakkerCheck(_alarmId: string): Promise<void> {}
export async function huidigeWekker(): Promise<Wekker | null> {
  return null;
}
export async function contextVoor(_alarmId: string): Promise<Wekker | null> {
  return null;
}
export function luisterNaarAlarmen(_callback: () => void): () => void {
  return () => {};
}
export async function stelUit(_w: Wekker, _m: number): Promise<string | undefined> {
  return undefined;
}
export async function startMissieVanuitWekker(_w: Wekker): Promise<string | undefined> {
  return undefined;
}
export async function rondWekkerAf(_a: string, _o?: string, _v?: string): Promise<void> {}
export async function verwijderEenmaligAlarm(_alarmId: string): Promise<void> {}

export type SyncStatus = { op: Date; verwacht: number; gepland: number };

export function syncStatus(): SyncStatus | null {
  return null;
}

export function luisterNaarSync(_luisteraar: (status: SyncStatus) => void): () => void {
  return () => {};
}
