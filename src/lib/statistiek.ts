import { t } from '@/i18n';
import { isOefening } from '@/lib/missies';
import { dagIndex, dagSleutel, startVanDag, startVanWeek } from '@/lib/tijd';
import type { Oefening, Sessie } from '@/types/app';

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
  aantalVoltooid: number;
  totaalPerOefening: Partial<Record<Oefening, number>>;
  weekendWarrior: boolean;
  // Eén joker per kalendermaand: een gemiste dag die de streak anders zou breken
  jokerBeschikbaar: boolean;
  jokerGebruiktOp: Date | null;
  // Ochtendgevoel na voltooide missies van de laatste 30 dagen: [moe, oké, sterk]
  gevoel: [number, number, number];
};

const maandSleutel = (datum: Date) => `${datum.getFullYear()}-${datum.getMonth()}`;

// Een gemiste dag breekt de streak pas als er in die week meer rustdagen zijn
// dan het weekdoel toestaat (weekdoel 7 = elke dag, 5 = twee rustdagen per week).
// Eén keer per kalendermaand vangt een joker zo'n gemiste dag op.
function streaks(voltooid: Sessie[], weekdoel: number, vandaag: Date) {
  const rustdagen = 7 - Math.min(7, Math.max(1, weekdoel));
  const dagen = new Set(voltooid.map((s) => dagSleutel(s.afgerondOp)));
  const jokers = new Map<string, Date>();
  if (!voltooid.length) return { streak: 0, langsteStreak: 0, actieveDagen: 0, jokers };
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
      if (aantal <= rustdagen) {
        gemist.set(week, aantal);
      } else if (teller > 0 && !jokers.has(maandSleutel(dag))) {
        // De joker telt niet als rustdag, zodat de rest van de week gewoon doorloopt
        jokers.set(maandSleutel(dag), new Date(dag));
      } else {
        gemist.set(week, aantal);
        teller = 0;
      }
    }
    dag.setDate(dag.getDate() + 1);
  }
  return { streak: teller, langsteStreak: langste, actieveDagen: dagen.size, jokers };
}

function totalen(voltooid: Sessie[]): Partial<Record<Oefening, number>> {
  const som: Partial<Record<Oefening, number>> = {};
  for (const sessie of voltooid) {
    for (const stap of sessie.stappen) {
      // Sprongen als alternatief tellen niet als herhalingen van de oorspronkelijke oefening
      if (stap.methode === 'beweging' || !isOefening(stap.oefening)) continue;
      som[stap.oefening] = (som[stap.oefening] ?? 0) + stap.gedaan;
    }
  }
  return som;
}

// Een missie op zowel zaterdag als de zondag erna
function heeftHeelWeekend(voltooid: Sessie[]): boolean {
  const dagen = new Set(voltooid.map((s) => dagSleutel(s.afgerondOp)));
  return voltooid.some((s) => {
    if (dagIndex(s.afgerondOp) !== 5) return false;
    const zondag = new Date(s.afgerondOp);
    zondag.setDate(zondag.getDate() + 1);
    return dagen.has(dagSleutel(zondag));
  });
}

export function berekenStatistiek(sessies: Sessie[], weekdoel = 7, nu = new Date()): Statistiek {
  const voltooid = sessies.filter((s) => s.status === 'voltooid');
  const { streak, langsteStreak, actieveDagen, jokers } = streaks(
    voltooid,
    weekdoel,
    startVanDag(nu),
  );
  const jokerGebruiktOp = jokers.get(maandSleutel(nu)) ?? null;

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
    aantalVoltooid: voltooid.length,
    totaalPerOefening: totalen(voltooid),
    weekendWarrior: heeftHeelWeekend(voltooid),
    jokerBeschikbaar: !jokerGebruiktOp,
    jokerGebruiktOp,
    gevoel: [1, 2, 3].map(
      (g) => recent.filter((x) => x.status === 'voltooid' && x.gevoel === g).length,
    ) as [number, number, number],
  };
}

export type StreakGevaar = { streak: number; joker: boolean } | null;

// Breekt de streak (of gaat de joker op) als er vandaag geen missie meer komt?
export function streakInGevaar(sessies: Sessie[], weekdoel = 7, nu = new Date()): StreakGevaar {
  const vandaag = berekenStatistiek(sessies, weekdoel, nu);
  if (vandaag.streak === 0) return null;
  const dag = dagSleutel(nu);
  if (sessies.some((s) => s.status === 'voltooid' && dagSleutel(s.afgerondOp) === dag)) {
    return null;
  }
  const morgen = startVanDag(nu);
  morgen.setDate(morgen.getDate() + 1);
  const dan = streaks(
    sessies.filter((s) => s.status === 'voltooid'),
    weekdoel,
    morgen,
  );
  if (dan.streak === 0) return { streak: vandaag.streak, joker: false };
  const joker = dan.jokers.get(maandSleutel(nu));
  if (joker && dagSleutel(joker) === dag) return { streak: vandaag.streak, joker: true };
  return null;
}

export type Badge = {
  id: string;
  emoji: string;
  naam: string;
  detail: string;
  behaald: boolean;
  // Voortgang richting de badge, bijv. 34 van 100 squats
  huidig: number;
  doel: number;
};

type BadgeId =
  | 'eersteStap'
  | 'earlyMover'
  | 'weekendWarrior'
  | 'squatSquad'
  | 'pushupPro'
  | 'plankmeester'
  | 'streakMaster'
  | 'legend'
  | 'honderd';

const badge = (id: BadgeId, emoji: string, waarde: number, doel: number): Badge => ({
  id,
  emoji,
  naam: t(`badges.${id}.naam`),
  detail: t(`badges.${id}.detail`),
  behaald: waarde >= doel,
  huidig: Math.min(waarde, doel),
  doel,
});

export function badgesVoor(s: Statistiek): Badge[] {
  const totaal = (o: Oefening) => s.totaalPerOefening[o] ?? 0;
  return [
    badge('eersteStap', '🌱', s.aantalVoltooid, 1),
    badge('earlyMover', '⚡', s.vroegeStarts, 5),
    badge('weekendWarrior', '🏖️', s.weekendWarrior ? 1 : 0, 1),
    badge('squatSquad', '🦵', totaal('Squats'), 100),
    badge('pushupPro', '💪', totaal('Push-ups'), 100),
    // Plank in minuten, zodat de voortgang leesbaar blijft (bijv. 4/10)
    badge('plankmeester', '🧱', Math.floor(totaal('Plank') / 60), 10),
    badge('streakMaster', '🔥', s.langsteStreak, 10),
    badge('legend', '🏆', s.langsteStreak, 30),
    badge('honderd', '💯', s.aantalVoltooid, 100),
  ];
}

const MIJLPALEN = [3, 7, 14, 21, 30, 50, 100, 365];

// Geeft de mijlpaal terug als de streak die net heeft bereikt
export function bereiktMijlpaal(voor: number, na: number): number | null {
  return MIJLPALEN.find((m) => voor < m && na >= m) ?? null;
}

// Minuten tussen het (laatste) alarmmoment en de start van de missie; null als het niet past
export function minutenNaAlarm(gestartOp: Date, tijd: string): number | null {
  const [uur, minuut] = tijd.split(':').map(Number);
  const alarmMoment = new Date(gestartOp);
  alarmMoment.setHours(uur ?? 0, minuut ?? 0, 0, 0);
  if (alarmMoment > gestartOp) alarmMoment.setDate(alarmMoment.getDate() - 1);
  const minuten = Math.round((gestartOp.getTime() - alarmMoment.getTime()) / 60000);
  // Langer dan drie uur na het alarm is geen reactie meer op dat alarm
  return minuten <= 180 ? minuten : null;
}

// Gemiddelde reactietijd van de afgelopen 7 dagen, op basis van de huidige alarmtijden
export function gemiddeldeReactie(
  sessies: Sessie[],
  alarmTijden: Map<string, string>,
  nu = new Date(),
): number | null {
  const week = nu.getTime() - 7 * 86400000;
  const waarden = sessies
    .filter((s) => s.status === 'voltooid' && s.alarmId && s.gestartOp.getTime() >= week)
    .map((s) => {
      const tijd = alarmTijden.get(s.alarmId!);
      return tijd ? minutenNaAlarm(s.gestartOp, tijd) : null;
    })
    .filter((m): m is number => m !== null);
  if (!waarden.length) return null;
  return Math.round(waarden.reduce((a, b) => a + b, 0) / waarden.length);
}

export type Weekoverzicht = {
  weekStart: Date;
  actieveDagen: number;
  missies: number;
  reps: number;
};

// Overzicht van de vorige kalenderweek (maandag t/m zondag)
export function vorigeWeek(sessies: Sessie[], nu = new Date()): Weekoverzicht {
  const dezeWeek = startVanWeek(nu);
  const weekStart = new Date(dezeWeek);
  weekStart.setDate(weekStart.getDate() - 7);
  const inWeek = sessies.filter(
    (s) => s.status === 'voltooid' && s.afgerondOp >= weekStart && s.afgerondOp < dezeWeek,
  );
  return {
    weekStart,
    actieveDagen: new Set(inWeek.map((s) => dagSleutel(s.afgerondOp))).size,
    missies: inWeek.length,
    reps: inWeek.reduce((som, s) => som + s.totaalHerhalingen, 0),
  };
}
