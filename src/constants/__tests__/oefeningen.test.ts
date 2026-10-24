import {
  doelenNaarTekst,
  doelenUitJson,
  doelenUitTekst,
  doelTekst,
  doelVoor,
} from '@/constants/oefeningen';

describe('doelen per oefening', () => {
  it('valt terug op het standaarddoel', () => {
    expect(doelVoor('Squats')).toBe(10);
    expect(doelVoor('Plank', {})).toBe(30);
  });

  it('gebruikt een eigen doel binnen de grenzen', () => {
    expect(doelVoor('Squats', { Squats: 25 })).toBe(25);
    expect(doelVoor('Squats', { Squats: 500 })).toBe(50);
    expect(doelVoor('Plank', { Plank: 1 })).toBe(15);
  });

  it('houdt handelingen altijd op 1', () => {
    expect(doelVoor('Bed opmaken', { 'Bed opmaken': 5 })).toBe(1);
    expect(doelTekst('Bed opmaken')).toBe('1 handeling');
  });

  it('beschrijft het doel met eenheid', () => {
    expect(doelTekst('Push-ups', { 'Push-ups': 15 })).toBe('15 herhalingen');
    expect(doelTekst('Plank', { Plank: 45 })).toBe('45 seconden');
  });

  it('zet doelen om naar tekst en terug', () => {
    const doelen = { Squats: 15, Plank: 45 };
    expect(doelenUitTekst(doelenNaarTekst(doelen))).toEqual(doelen);
    expect(doelenUitTekst('Onbekend:3,Squats:x')).toEqual({});
    expect(doelenUitTekst(undefined)).toEqual({});
  });

  it('leest alleen geldige doelen uit de database', () => {
    expect(doelenUitJson({ Squats: 20, Onzin: 3, Plank: '30' })).toEqual({ Squats: 20 });
    expect(doelenUitJson(null)).toEqual({});
    expect(doelenUitJson([1, 2])).toEqual({});
  });
});
