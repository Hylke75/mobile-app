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

// Een gemiste dag breekt de streak pas als er in die week meer rustdagen zijn
// dan het weekdoel toestaat (weekdoel 7 = elke dag, 5 = twee rustdagen per week)
function streaks(voltooid: Sessie[], weekdoel: number, vandaag: Date) {
  const rustdagen = 7 - Math.min(7, Math.max(1, weekdoel));
  const dagen = new Set(voltooid.map((s) => dagSleutel(s.afgerondOp)));
  if (!voltooid.length) return { streak: 0, langsteStreak: 0, actieveDagen: 0 };
  const dag = startVanDag(new Date(Math.min(...voltooid.map((s) => s.afgerondOp.getTime()))));
  const gemist = new Map<string, number>();
  let teller = 0;
  let langste = 0;
  while (dag <= vandaag) {
    const sleutel = dagSleutel(dag);
    if (dagen.has(sleutel)) {
      teller++;
      langste = Math.max(langste, teller);
    } else if (sleutel !== dagSleutel(vandaag)) {
      // Vandaag kan nog: die dag telt pas mee als hij voorbij is
      const week = dagSleutel(startVanWeek(dag));
      const aantal = (gemist.get(week) ?? 0) + 1;
      gemist.set(week, aantal);
      if (aantal > rustdagen) teller = 0;
    }
    dag.setDate(dag.getDate() + 1);
  }
  return { streak: teller, langsteStreak: langste, actieveDagen: dagen.size };
}

export function berekenStatistiek(sessies: Sessie[], weekdoel = 7, nu = new Date()): Statistiek {
  const voltooid = sessies.filter((s) => s.status === 'voltooid');
  const { streak, langsteStreak, actieveDagen } = streaks(voltooid, weekdoel, startVanDag(nu));

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
    actieveDagen,
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
