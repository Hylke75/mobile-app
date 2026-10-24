import { planHerinneringen } from '@/lib/herinneringPlan';
import type { Alarm, Sessie } from '@/types/app';

// Zaterdag 24 oktober 2026, 12:00
const NU = new Date(2026, 9, 24, 12, 0);

function alarm(opties: Partial<Alarm> = {}): Alarm {
  return {
    id: 'a',
    naam: 'Werkdag',
    tijd: '06:30',
    dagen: [0, 1, 2, 3, 4],
    niveau: 'Verplicht',
    oefeningen: ['Squats', 'Bed opmaken'],
    doelen: {},
    aan: true,
    ...opties,
  };
}

function sessie(dag: number): Sessie {
  const op = new Date(2026, 9, dag, 7, 30);
  return {
    id: `s-${dag}`,
    alarmId: null,
    gestartOp: op,
    afgerondOp: op,
    status: 'voltooid',
    stappen: [],
    totaalHerhalingen: 10,
  };
}

const basis = {
  eigen: new Map(),
  sessies: [] as Sessie[],
  weekdoel: 7,
  pauzeTot: null,
  nu: NU,
};

describe('planHerinneringen', () => {
  it('plant niets als alles uit staat', () => {
    const lijst = planHerinneringen({
      ...basis,
      alarms: [alarm()],
      instellingen: { avond: false, streak: false },
    });
    expect(lijst).toEqual([]);
  });

  it('meldt om 21:00 de avond voor elk ochtendalarm, met de missies', () => {
    const lijst = planHerinneringen({
      ...basis,
      alarms: [alarm()],
      instellingen: { avond: true, streak: false },
    });
    expect(lijst.map((h) => h.op)).toEqual([
      new Date(2026, 9, 25, 21, 0),
      new Date(2026, 9, 26, 21, 0),
      new Date(2026, 9, 27, 21, 0),
      new Date(2026, 9, 28, 21, 0),
      new Date(2026, 9, 29, 21, 0),
    ]);
    expect(lijst[0]!.titel).toBe('Morgen om 06:30: Werkdag');
    expect(lijst[0]!.tekst).toBe('Leg je telefoon klaar voor Squats, Bed opmaken.');
  });

  it('slaat overgeslagen dagen, pauzes en middagalarmen over', () => {
    const lijst = planHerinneringen({
      ...basis,
      pauzeTot: '2026-10-27',
      alarms: [alarm({ overslaanOp: '2026-10-29' }), alarm({ id: 'b', tijd: '14:00' })],
      instellingen: { avond: true, streak: false },
    });
    expect(lijst.map((h) => h.op)).toEqual([
      new Date(2026, 9, 27, 21, 0),
      new Date(2026, 9, 29, 21, 0),
    ]);
  });

  it('kiest per ochtend het vroegste alarm', () => {
    const lijst = planHerinneringen({
      ...basis,
      alarms: [alarm({ dagen: [0] }), alarm({ id: 'b', naam: 'Vroeg', tijd: '05:45', dagen: [0] })],
      instellingen: { avond: true, streak: false },
    });
    expect(lijst).toHaveLength(1);
    expect(lijst[0]!.titel).toBe('Morgen om 05:45: Vroeg');
  });

  it('waarschuwt om 19:00 als de streak in gevaar is', () => {
    const lijst = planHerinneringen({
      ...basis,
      sessies: [sessie(19), sessie(21), sessie(22), sessie(23)],
      alarms: [],
      instellingen: { avond: false, streak: true },
    });
    expect(lijst).toHaveLength(1);
    expect(lijst[0]!.op).toEqual(new Date(2026, 9, 24, 19, 0));
    expect(lijst[0]!.titel).toBe('Je streak van 4 dagen staat op het spel 🔥');
  });

  it('waarschuwt niet meer na 19:00 of als vandaag al gedaan is', () => {
    const laat = planHerinneringen({
      ...basis,
      nu: new Date(2026, 9, 24, 20, 0),
      sessies: [sessie(22), sessie(23)],
      alarms: [],
      instellingen: { avond: false, streak: true },
    });
    const gedaan = planHerinneringen({
      ...basis,
      sessies: [sessie(23), sessie(24)],
      alarms: [],
      instellingen: { avond: false, streak: true },
    });
    expect(laat).toEqual([]);
    expect(gedaan).toEqual([]);
  });
});
