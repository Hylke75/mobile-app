import { dagIndex, startVanWeek, volgendAlarm, volgendeKeer } from '@/lib/tijd';
import type { Alarm } from '@/types/app';

// Zaterdag 24 oktober 2026, 12:00
const NU = new Date(2026, 9, 24, 12, 0);

function alarm(opties: Partial<Alarm> = {}): Alarm {
  return {
    id: 'a',
    naam: 'Test',
    tijd: '07:00',
    dagen: [0, 1, 2, 3, 4],
    niveau: 'Verplicht',
    oefeningen: ['Squats'],
    doelen: {},
    aan: true,
    ...opties,
  };
}

describe('tijd', () => {
  it('nummert maandag als 0 en zondag als 6', () => {
    expect(dagIndex(new Date(2026, 9, 19))).toBe(0);
    expect(dagIndex(new Date(2026, 9, 25))).toBe(6);
  });

  it('begint de week op maandag', () => {
    expect(startVanWeek(NU)).toEqual(new Date(2026, 9, 19));
  });

  it('slaat het weekend over voor een werkdagalarm', () => {
    // Zaterdag 24 okt: volgende werkdag is maandag 26 okt
    expect(volgendeKeer(alarm(), NU)).toEqual(new Date(2026, 9, 26, 7, 0));
  });

  it('gebruikt vandaag als de tijd nog moet komen', () => {
    expect(volgendeKeer(alarm({ tijd: '18:30', dagen: [5] }), NU)).toEqual(
      new Date(2026, 9, 24, 18, 30),
    );
  });

  it('negeert alarmen die uit staan', () => {
    expect(volgendeKeer(alarm({ aan: false }), NU)).toBeNull();
  });

  it('kiest het eerstvolgende alarm', () => {
    const vroeg = alarm({ id: 'vroeg', tijd: '06:00' });
    const laat = alarm({ id: 'laat', tijd: '20:00', dagen: [5] }); // vanavond
    expect(volgendAlarm([vroeg, laat], NU)?.alarm.id).toBe('laat');
  });
});
