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
