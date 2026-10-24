// Op web bestaan geen native alarmen, dus ook geen eigen alarmgeluid.
export type Alarmgeluid = { uri: string; naam: string };

export async function leesAlarmgeluid(): Promise<Alarmgeluid | null> {
  return null;
}

export async function kiesAlarmgeluid(): Promise<Alarmgeluid | null> {
  return null;
}

export async function kiesZachtGeluid(): Promise<Alarmgeluid> {
  throw new Error('Niet beschikbaar op web');
}

export async function wisAlarmgeluid(): Promise<void> {}

export type GeluidKeuze = 'profiel' | 'standaard' | 'zacht';

export async function leesGeluidKeuzes(): Promise<Record<string, GeluidKeuze>> {
  return {};
}

export async function zetGeluidKeuze(): Promise<void> {}

export async function geluidVoorAlarm(): Promise<Alarmgeluid | null> {
  return null;
}
