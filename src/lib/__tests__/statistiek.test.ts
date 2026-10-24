import { badgesVoor, berekenStatistiek, bereiktMijlpaal } from '@/lib/statistiek';
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

  it('breekt de streak bij een gemiste dag als het weekdoel elke dag is', () => {
    const s = berekenStatistiek([sessie(20), sessie(22), sessie(23)], 7, NU);
    expect(s.streak).toBe(2);
    expect(s.langsteStreak).toBe(2);
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
    const namen = badgesVoor({ ...basis, vroegeStarts: 5, langsteStreak: 12 })
      .filter((b) => b.behaald)
      .map((b) => b.naam);
    expect(namen).toEqual(['Early mover', 'Streak master']);
  });

  it('meldt een mijlpaal alleen als die net is bereikt', () => {
    expect(bereiktMijlpaal(6, 7)).toBe(7);
    expect(bereiktMijlpaal(7, 8)).toBeNull();
    expect(bereiktMijlpaal(0, 3)).toBe(3);
    expect(bereiktMijlpaal(2, 2)).toBeNull();
  });
});
