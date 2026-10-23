import type { Alarm } from '@/types/app';

// 0 = maandag … 6 = zondag
export function dagIndex(datum: Date): number {
  return (datum.getDay() + 6) % 7;
}

export function startVanDag(datum: Date): Date {
  const d = new Date(datum);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dagSleutel(datum: Date): string {
  return `${datum.getFullYear()}-${datum.getMonth() + 1}-${datum.getDate()}`;
}

export function startVanWeek(datum: Date): Date {
  const d = startVanDag(datum);
  d.setDate(d.getDate() - dagIndex(d));
  return d;
}

export function volgendeKeer(alarm: Alarm, nu = new Date()): Date | null {
  if (!alarm.aan || alarm.dagen.length === 0) return null;
  const [uur, minuut] = alarm.tijd.split(':').map(Number);
  for (let i = 0; i < 8; i++) {
    const kandidaat = startVanDag(nu);
    kandidaat.setDate(kandidaat.getDate() + i);
    kandidaat.setHours(uur ?? 0, minuut ?? 0, 0, 0);
    if (kandidaat > nu && alarm.dagen.includes(dagIndex(kandidaat))) return kandidaat;
  }
  return null;
}

export function volgendAlarm(alarms: Alarm[], nu = new Date()): { alarm: Alarm; op: Date } | null {
  let beste: { alarm: Alarm; op: Date } | null = null;
  for (const alarm of alarms) {
    const op = volgendeKeer(alarm, nu);
    if (op && (!beste || op < beste.op)) beste = { alarm, op };
  }
  return beste;
}
