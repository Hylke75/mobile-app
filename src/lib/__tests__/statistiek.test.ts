import {
  badgesVoor,
  berekenStatistiek,
  bereiktMijlpaal,
  ochtendrapport,
  snelleWeken,
  streakInGevaar,
  weekUitdaging,
} from '@/lib/statistiek';
import type { Sessie } from '@/types/app';

// Vaste "nu": zaterdag 24 oktober 2026, 12:00
const NU = new Date(2026, 9, 24, 12, 0);

function sessie(dag: number, opties: Partial<Sessie> = {}): Sessie {
  const op = new Date(2026, 9, dag, 7, 30);
  return {
    id: `s-${dag}-${Math.random()}`,
    alarmId: null,
    gestartOp: op,
    afgerondOp: op,
    status: 'voltooid',
    stappen: [],
    totaalHerhalingen: 10,
    ...opties,
  };
}

describe('berekenStatistiek', () => {
  it('geeft nullen zonder sessies', () => {
    const s = berekenStatistiek([], 7, NU);
    expect(s.streak).toBe(0);
    expect(s.langsteStreak).toBe(0);
    expect(s.voltooidPercentage).toBeNull();
    expect(s.weekBalken).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('telt een aaneengesloten streak tot en met vandaag', () => {
    const s = berekenStatistiek([sessie(22), sessie(23), sessie(24)], 7, NU);
    expect(s.streak).toBe(3);
  });

  it('breekt de streak niet omdat vandaag nog niet gedaan is', () => {
    const s = berekenStatistiek([sessie(22), sessie(23)], 7, NU);
    expect(s.streak).toBe(2);
  });

  it('breekt de streak bij een tweede gemiste dag in dezelfde maand', () => {
    const s = berekenStatistiek(
      [sessie(17), sessie(19), sessie(21), sessie(22), sessie(23)],
      7,
      NU,
    );
    expect(s.streak).toBe(3);
    expect(s.jokerBeschikbaar).toBe(false);
  });

  it('vangt één gemiste dag per maand op met de joker', () => {
    const s = berekenStatistiek([sessie(20), sessie(22), sessie(23)], 7, NU);
    expect(s.streak).toBe(3);
    expect(s.jokerBeschikbaar).toBe(false);
    expect(s.jokerGebruiktOp).toEqual(new Date(2026, 9, 21));
  });

  it('geeft elke maand een nieuwe joker', () => {
    const sept = (dag: number) => sessie(dag, { afgerondOp: new Date(2026, 8, dag, 7, 30) });
    const s = berekenStatistiek(
      [sept(28), sept(30), sessie(1), sessie(3)],
      7,
      new Date(2026, 9, 3, 12),
    );
    expect(s.streak).toBe(4);
    expect(s.jokerGebruiktOp).toEqual(new Date(2026, 9, 2));
  });

  it('gebruikt geen joker zonder lopende streak', () => {
    const s = berekenStatistiek([sessie(24)], 7, NU);
    expect(s.jokerBeschikbaar).toBe(true);
  });

  it('staat rustdagen toe volgens het weekdoel', () => {
    // Weekdoel 5: twee rustdagen per week mogen
    const s = berekenStatistiek([sessie(19), sessie(21), sessie(23)], 5, NU);
    expect(s.streak).toBe(3);
  });

  it('breekt bij meer rustdagen dan het weekdoel toestaat', () => {
    // Ma 19 gedaan, di 20 t/m vr 23 niet: vier gemiste dagen in één week bij weekdoel 5
    const s = berekenStatistiek([sessie(19), sessie(24)], 5, NU);
    expect(s.streak).toBe(1);
    expect(s.langsteStreak).toBe(1);
  });

  it('telt afgebroken missies niet mee voor de streak, wel voor het percentage', () => {
    const s = berekenStatistiek([sessie(23), sessie(24, { status: 'afgebroken' })], 7, NU);
    expect(s.streak).toBe(1);
    expect(s.voltooidPercentage).toBe(50);
  });

  it('vult de weekgrafiek per dag en telt de reps van deze week', () => {
    const s = berekenStatistiek([sessie(19), sessie(24), sessie(24), sessie(12)], 7, NU);
    expect(s.weekBalken).toEqual([1, 0, 0, 0, 0, 2, 0]);
    expect(s.weekTotaal).toBe(3);
    expect(s.repsDezeWeek).toBe(30);
    expect(s.repsVerschil).toBe(20);
  });
});

describe('badges en mijlpalen', () => {
  it('ontgrendelt badges op basis van de statistiek', () => {
    const basis = berekenStatistiek([], 7, NU);
    expect(badgesVoor(basis).filter((b) => b.behaald)).toHaveLength(0);
    const namen = badgesVoor({ ...basis, vroegeStarts: 5, langsteStreak: 12, aantalVoltooid: 3 })
      .filter((b) => b.behaald)
      .map((b) => b.naam);
    expect(namen).toEqual(['Eerste stap', 'Early mover', 'Streak master']);
  });

  it('telt herhalingen per oefening en het weekend', () => {
    const stappen = [
      { oefening: 'Squats' as const, doel: 60, gedaan: 60, methode: 'camera' as const },
    ];
    // Zaterdag 17 en zondag 18 oktober
    const s = berekenStatistiek([sessie(17, { stappen }), sessie(18, { stappen })], 7, NU);
    expect(s.totaalPerOefening.Squats).toBe(120);
    expect(s.weekendWarrior).toBe(true);
    const namen = badgesVoor(s)
      .filter((b) => b.behaald)
      .map((b) => b.naam);
    expect(namen).toContain('Squat squad');
    expect(namen).toContain('Weekend warrior');
  });

  it('meldt een mijlpaal alleen als die net is bereikt', () => {
    expect(bereiktMijlpaal(6, 7)).toBe(7);
    expect(bereiktMijlpaal(7, 8)).toBeNull();
    expect(bereiktMijlpaal(0, 3)).toBe(3);
    expect(bereiktMijlpaal(2, 2)).toBeNull();
  });
});

describe('streakInGevaar', () => {
  const AVOND = new Date(2026, 9, 24, 19, 0);

  it('is niet in gevaar als vandaag al gedaan is', () => {
    expect(streakInGevaar([sessie(23), sessie(24)], 7, AVOND)).toBeNull();
  });

  it('zet de joker op het spel als die er nog is', () => {
    expect(streakInGevaar([sessie(22), sessie(23)], 7, AVOND)).toEqual({ streak: 2, joker: true });
  });

  it('waarschuwt dat de streak breekt als de joker al op is', () => {
    const lijst = [sessie(19), sessie(21), sessie(22), sessie(23)];
    expect(streakInGevaar(lijst, 7, AVOND)).toEqual({ streak: 4, joker: false });
  });

  it('is niet in gevaar op een toegestane rustdag', () => {
    expect(streakInGevaar([sessie(22), sessie(23)], 5, AVOND)).toBeNull();
  });

  it('is niet in gevaar zonder streak', () => {
    expect(streakInGevaar([], 7, AVOND)).toBeNull();
  });
});

describe('weekuitdaging en ochtendrapport', () => {
  // Alarm om 07:30; sessies van maandag 19 t/m vrijdag 23 oktober
  const tijden = new Map([['a', '07:30']]);
  const snel = (dag: number, minuten: number) =>
    sessie(dag, { alarmId: 'a', gestartOp: new Date(2026, 9, dag, 7, 30 + minuten) });

  it('telt ochtenden binnen twee minuten na het alarm, per week', () => {
    const week = [snel(19, 1), snel(20, 2), snel(21, 5), snel(22, 0), snel(23, 1)];
    expect(weekUitdaging(week, tijden, NU)).toEqual({ gehaald: 4, doel: 5 });
    expect(snelleWeken(week, tijden)).toBe(0);
    expect(snelleWeken([...week, snel(24, 1)], tijden)).toBe(1);
  });

  it('geeft de badge Snelle starter na een gehaalde week', () => {
    const s = berekenStatistiek([], 7, NU);
    expect(badgesVoor(s, { snelleWeken: 1 }).find((b) => b.id === 'snelleStarter')?.behaald).toBe(
      true,
    );
  });

  it('vat de ochtend van vandaag samen', () => {
    expect(ochtendrapport([], tijden, NU)).toBeNull();
    const rapport = ochtendrapport([snel(24, 3), sessie(24, { gevoel: 3 })], tijden, NU);
    expect(rapport).toEqual({ missies: 2, reps: 20, reactie: 3, gevoel: 3 });
  });
});
