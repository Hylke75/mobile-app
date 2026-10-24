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

// "7 u 12 min", "45 min" of "minder dan een minuut"
export function tijdTot(op: Date, nu = new Date()): string {
  const minuten = Math.max(0, Math.floor((op.getTime() - nu.getTime()) / 60000));
  if (minuten < 1) return 'minder dan een minuut';
  const dagen = Math.floor(minuten / 1440);
  const uren = Math.floor((minuten % 1440) / 60);
  const rest = minuten % 60;
  if (dagen > 0) return uren > 0 ? `${dagen} d ${uren} u` : `${dagen} d`;
  if (uren > 0) return rest > 0 ? `${uren} u ${rest} min` : `${uren} u`;
  return `${rest} min`;
}

// Pauze "tot en met" een datum (YYYY-MM-DD): alarmen gaan weer af vanaf de dag erna
export function hervatOp(pauzeTot: string | null | undefined, nu = new Date()): Date | null {
  if (!pauzeTot) return null;
  const [j, m, d] = pauzeTot.split('-').map(Number);
  if (!j || !m || !d) return null;
  const hervat = new Date(j, m - 1, d + 1);
  return hervat > nu ? hervat : null;
}

export function naarDatumSleutel(datum: Date): string {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}-${String(datum.getDate()).padStart(2, '0')}`;
}
