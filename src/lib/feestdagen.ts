import { getLocales } from 'expo-localization';

// Landelijke officiële feestdagen voor de landen waar de app-talen vooral gesproken worden.
// Regionale feestdagen (bijv. per Duitse deelstaat) tellen niet mee.
export const FEESTDAG_LANDEN = ['NL', 'BE', 'DE', 'AT', 'FR', 'ES', 'GB', 'US'] as const;
export type FeestdagLand = (typeof FEESTDAG_LANDEN)[number];

export function huidigLand(): FeestdagLand | null {
  const regio = getLocales()[0]?.regionCode?.toUpperCase();
  return FEESTDAG_LANDEN.includes(regio as FeestdagLand) ? (regio as FeestdagLand) : null;
}

const sleutel = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

// Paaszondag (gregoriaans, anonieme algoritme)
function pasen(jaar: number): Date {
  const a = jaar % 19;
  const b = Math.floor(jaar / 100);
  const c = jaar % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const maand = Math.floor((h + l - 7 * m + 114) / 31);
  const dag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jaar, maand - 1, dag);
}

const na = (d: Date, dagen: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + dagen);

// n-de weekdag van een maand (weekdag: 0 = zondag … 6 = zaterdag); n = -1 is de laatste
function nDeWeekdag(jaar: number, maand: number, weekdag: number, n: number): Date {
  if (n > 0) {
    const eerste = new Date(jaar, maand, 1);
    return new Date(jaar, maand, 1 + ((weekdag - eerste.getDay() + 7) % 7) + (n - 1) * 7);
  }
  const laatste = new Date(jaar, maand + 1, 0);
  return new Date(jaar, maand, laatste.getDate() - ((laatste.getDay() - weekdag + 7) % 7));
}

// In het Verenigd Koninkrijk schuift een feestdag in het weekend door naar een werkdag
function doorschuiven(dagen: Date[]): Date[] {
  const bezet = new Set<string>();
  return dagen.map((d) => {
    let dag = d;
    while (dag.getDay() === 0 || dag.getDay() === 6 || bezet.has(sleutel(dag))) dag = na(dag, 1);
    bezet.add(sleutel(dag));
    return dag;
  });
}

function lijst(jaar: number, land: FeestdagLand): Date[] {
  const p = pasen(jaar);
  const d = (maand: number, dag: number) => new Date(jaar, maand - 1, dag);
  switch (land) {
    case 'NL': {
      const koningsdag = d(4, 27).getDay() === 0 ? d(4, 26) : d(4, 27);
      return [
        d(1, 1),
        p,
        na(p, 1),
        koningsdag,
        ...(jaar % 5 === 0 ? [d(5, 5)] : []),
        na(p, 39),
        na(p, 49),
        na(p, 50),
        d(12, 25),
        d(12, 26),
      ];
    }
    case 'BE':
      return [
        d(1, 1),
        na(p, 1),
        d(5, 1),
        na(p, 39),
        na(p, 50),
        d(7, 21),
        d(8, 15),
        d(11, 1),
        d(11, 11),
        d(12, 25),
      ];
    case 'DE':
      return [
        d(1, 1),
        na(p, -2),
        na(p, 1),
        d(5, 1),
        na(p, 39),
        na(p, 50),
        d(10, 3),
        d(12, 25),
        d(12, 26),
      ];
    case 'AT':
      return [
        d(1, 1),
        d(1, 6),
        na(p, 1),
        d(5, 1),
        na(p, 39),
        na(p, 50),
        na(p, 60),
        d(8, 15),
        d(10, 26),
        d(11, 1),
        d(12, 8),
        d(12, 25),
        d(12, 26),
      ];
    case 'FR':
      return [
        d(1, 1),
        na(p, 1),
        d(5, 1),
        d(5, 8),
        na(p, 39),
        na(p, 50),
        d(7, 14),
        d(8, 15),
        d(11, 1),
        d(11, 11),
        d(12, 25),
      ];
    case 'ES':
      return [
        d(1, 1),
        d(1, 6),
        na(p, -2),
        d(5, 1),
        d(8, 15),
        d(10, 12),
        d(11, 1),
        d(12, 6),
        d(12, 8),
        d(12, 25),
      ];
    case 'GB':
      return [
        ...doorschuiven([d(1, 1)]),
        na(p, -2),
        na(p, 1),
        nDeWeekdag(jaar, 4, 1, 1),
        nDeWeekdag(jaar, 4, 1, -1),
        nDeWeekdag(jaar, 7, 1, -1),
        ...doorschuiven([d(12, 25), d(12, 26)]),
      ];
    case 'US':
      return [
        d(1, 1),
        nDeWeekdag(jaar, 0, 1, 3),
        nDeWeekdag(jaar, 1, 1, 3),
        nDeWeekdag(jaar, 4, 1, -1),
        d(6, 19),
        d(7, 4),
        nDeWeekdag(jaar, 8, 1, 1),
        nDeWeekdag(jaar, 9, 1, 2),
        d(11, 11),
        nDeWeekdag(jaar, 10, 4, 4),
        d(12, 25),
      ];
  }
}

const cache = new Map<string, Set<string>>();

export function isFeestdag(datum: Date, land: FeestdagLand | null): boolean {
  if (!land) return false;
  const jaar = datum.getFullYear();
  const id = `${land}-${jaar}`;
  let dagen = cache.get(id);
  if (!dagen) {
    dagen = new Set(lijst(jaar, land).map(sleutel));
    cache.set(id, dagen);
  }
  return dagen.has(sleutel(datum));
}
