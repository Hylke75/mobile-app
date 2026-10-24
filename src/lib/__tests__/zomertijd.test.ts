import { berekenStatistiek } from '@/lib/statistiek';
import { dagSleutel, tijdTot, volgendeKeer } from '@/lib/tijd';
import type { Alarm, Sessie } from '@/types/app';

function alarm(opties: Partial<Alarm> = {}): Alarm {
  return {
    id: 'a',
    naam: 'Test',
    tijd: '07:00',
    dagen: [0, 1, 2, 3, 4, 5, 6],
    niveau: 'Verplicht',
    oefeningen: ['Squats'],
    doelen: {},
    aan: true,
    ...opties,
  };
}

describe('zomer- en wintertijd (Europe/Amsterdam)', () => {
  it('draait in de Nederlandse tijdzone', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Amsterdam');
  });

  it('zet een alarm na de overgang naar wintertijd op de juiste kloktijd', () => {
    // Zondag 25 oktober 2026 om 03:00 gaat de klok terug naar 02:00
    const zaterdagAvond = new Date(2026, 9, 24, 22, 0);
    const op = volgendeKeer(alarm(), zaterdagAvond)!;
    expect(op.getDate()).toBe(25);
    expect(op.getHours()).toBe(7);
    expect(op.getMinutes()).toBe(0);
    // Die nacht duurt een uur langer: 22:00 → 07:00 is 10 echte uren
    expect(tijdTot(op, zaterdagAvond)).toBe('10 u');
  });

  it('zet een alarm na de overgang naar zomertijd op de juiste kloktijd', () => {
    // Zondag 29 maart 2026 om 02:00 gaat de klok vooruit naar 03:00
    const zaterdagAvond = new Date(2026, 2, 28, 22, 0);
    const op = volgendeKeer(alarm(), zaterdagAvond)!;
    expect(op.getDate()).toBe(29);
    expect(op.getHours()).toBe(7);
    expect(tijdTot(op, zaterdagAvond)).toBe('8 u');
  });

  it('schuift een alarm in het ontbrekende uur door naar na de overgang', () => {
    const zaterdagAvond = new Date(2026, 2, 28, 22, 0);
    const op = volgendeKeer(alarm({ tijd: '02:30' }), zaterdagAvond)!;
    expect(op.getDate()).toBe(29);
    expect(op > zaterdagAvond).toBe(true);
    expect(op.getHours()).toBe(3);
  });

  it('telt de streak goed door een nacht met klokwissel heen', () => {
    const sessie = (maand: number, dag: number): Sessie => {
      const op = new Date(2026, maand, dag, 7, 30);
      return {
        id: dagSleutel(op),
        alarmId: null,
        gestartOp: op,
        afgerondOp: op,
        status: 'voltooid',
        stappen: [],
        totaalHerhalingen: 0,
      };
    };
    const nu = new Date(2026, 9, 26, 12, 0);
    const s = berekenStatistiek([sessie(9, 24), sessie(9, 25), sessie(9, 26)], 7, nu);
    expect(s.streak).toBe(3);
  });
});
