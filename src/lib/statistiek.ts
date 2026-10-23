import { dagIndex, dagSleutel, startVanDag, startVanWeek } from '@/lib/tijd';
import type { Sessie } from '@/types/app';

export type Statistiek = {
  streak: number;
  langsteStreak: number;
  actieveDagen: number;
  voltooidPercentage: number | null;
  voltooidVerschil: number | null;
  repsDezeWeek: number;
  repsVerschil: number;
  weekBalken: number[];
  weekTotaal: number;
  weekStart: Date;
  vroegeStarts: number;
};

function streakVanaf(dagen: Set<string>, start: Date): number {
  let teller = 0;
  const d = new Date(start);
  while (dagen.has(dagSleutel(d))) {
    teller++;
    d.setDate(d.getDate() - 1);
  }
  return teller;
}

export function berekenStatistiek(sessies: Sessie[], nu = new Date()): Statistiek {
  const voltooid = sessies.filter((s) => s.status === 'voltooid');
  const dagen = new Set(voltooid.map((s) => dagSleutel(s.afgerondOp)));

  const vandaag = startVanDag(nu);
  const gisteren = new Date(vandaag);
  gisteren.setDate(gisteren.getDate() - 1);
  const streak = dagen.has(dagSleutel(vandaag))
    ? streakVanaf(dagen, vandaag)
    : streakVanaf(dagen, gisteren);

  let langsteStreak = 0;
  for (const sleutel of dagen) {
    const [j, m, d] = sleutel.split('-').map(Number);
    const datum = new Date(j!, m! - 1, d!);
    const vorige = new Date(datum);
    vorige.setDate(vorige.getDate() - 1);
    if (!dagen.has(dagSleutel(vorige))) {
      let teller = 0;
      const loop = new Date(datum);
      while (dagen.has(dagSleutel(loop))) {
        teller++;
        loop.setDate(loop.getDate() + 1);
      }
      langsteStreak = Math.max(langsteStreak, teller);
    }
  }

  const periode = 30 * 24 * 3600 * 1000;
  const recent = sessies.filter((s) => nu.getTime() - s.afgerondOp.getTime() < periode);
  const vorigePeriode = sessies.filter((s) => {
    const leeftijd = nu.getTime() - s.afgerondOp.getTime();
    return leeftijd >= periode && leeftijd < 2 * periode;
  });
  const percentage = (lijst: Sessie[]) =>
    lijst.length
      ? Math.round((lijst.filter((s) => s.status === 'voltooid').length / lijst.length) * 100)
      : null;
  const voltooidPercentage = percentage(recent);
  const vorigPercentage = percentage(vorigePeriode);

  const weekStart = startVanWeek(nu);
  const vorigeWeekStart = new Date(weekStart);
  vorigeWeekStart.setDate(vorigeWeekStart.getDate() - 7);
  const dezeWeek = voltooid.filter((s) => s.afgerondOp >= weekStart);
  const vorigeWeek = voltooid.filter(
    (s) => s.afgerondOp >= vorigeWeekStart && s.afgerondOp < weekStart,
  );
  const repsDezeWeek = dezeWeek.reduce((som, s) => som + s.totaalHerhalingen, 0);
  const repsVorigeWeek = vorigeWeek.reduce((som, s) => som + s.totaalHerhalingen, 0);

  const weekBalken = [0, 0, 0, 0, 0, 0, 0];
  for (const s of dezeWeek) weekBalken[dagIndex(s.afgerondOp)]! += 1;

  return {
    streak,
    langsteStreak,
    actieveDagen: dagen.size,
    voltooidPercentage,
    voltooidVerschil:
      voltooidPercentage !== null && vorigPercentage !== null
        ? voltooidPercentage - vorigPercentage
        : null,
    repsDezeWeek,
    repsVerschil: repsDezeWeek - repsVorigeWeek,
    weekBalken,
    weekTotaal: dezeWeek.length,
    weekStart,
    vroegeStarts: voltooid.filter((s) => s.gestartOp.getHours() < 8).length,
  };
}
