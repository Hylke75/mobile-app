// Freemium: fases, beperkingen en hoe alarmen zonder Premium afgaan.
import {
  alarmenBinnenToegang,
  alarmToegestaan,
  bepaalToegang,
  effectiefAlarm,
  missieToegestaan,
} from '@/lib/premium';
import type { Alarm } from '@/types/app';

const nu = new Date('2026-11-20T08:00:00Z');
const dagenTerug = (n: number) => new Date(nu.getTime() - n * 86400000).toISOString();

const alarm = (over: Partial<Alarm> = {}): Alarm => ({
  id: 'a',
  naam: 'Opstaan',
  tijd: '07:00',
  dagen: [0, 1, 2, 3, 4],
  niveau: 'Hardcore',
  oefeningen: ['Push-ups', 'Squats', 'eigen:x'],
  doelen: {},
  aan: true,
  wisselend: true,
  ...over,
});

describe('bepaalToegang', () => {
  it('geeft iedereen alles zolang het verdienmodel uit staat', () => {
    expect(bepaalToegang(null, nu, false).premium).toBe(true);
  });

  it('testers en betalers hebben Premium', () => {
    expect(bepaalToegang({ premium_altijd: true }, nu, true).fase).toBe('premium');
    expect(bepaalToegang({ premium_tot: dagenTerug(-30) }, nu, true).fase).toBe('premium');
    expect(bepaalToegang({ premium_tot: dagenTerug(1) }, nu, true).fase).toBe('proefNietGestart');
  });

  it('de proef start pas bij het eerste alarm en duurt 14 dagen', () => {
    expect(bepaalToegang({ proef_start: null }, nu, true).fase).toBe('proefNietGestart');
    const dag1 = bepaalToegang({ proef_start: nu.toISOString() }, nu, true);
    expect(dag1).toMatchObject({ fase: 'proef', proefDag: 1, dagenOver: 14, maxAlarmen: 2 });
    const dag11 = bepaalToegang({ proef_start: dagenTerug(10) }, nu, true);
    expect(dag11).toMatchObject({ fase: 'proef', proefDag: 11, dagenOver: 4 });
    expect(bepaalToegang({ proef_start: dagenTerug(14) }, nu, true).fase).toBe('gratis');
  });

  it('beperkt de proef tot twee missies en Vrij/Verplicht', () => {
    const proef = bepaalToegang({ proef_start: dagenTerug(2) }, nu, true);
    expect(missieToegestaan(proef, 'Squats')).toBe(true);
    expect(missieToegestaan(proef, 'Push-ups')).toBe(false);
    expect(missieToegestaan(proef, 'eigen:x')).toBe(false);
    expect(proef.niveaus).toEqual(['Vrij', 'Verplicht']);
  });
});

describe('alarmen zonder Premium', () => {
  const proef = bepaalToegang({ proef_start: dagenTerug(2) }, nu, true);
  const gratis = bepaalToegang({ proef_start: dagenTerug(20) }, nu, true);

  it('houdt in de proef alleen toegestane missies en maakt Hardcore Verplicht', () => {
    const a = effectiefAlarm(alarm(), proef);
    expect(a).toMatchObject({ niveau: 'Verplicht', oefeningen: ['Squats'], wisselend: false });
  });

  it('valt in de proef terug op een kennismakingsmissie als er niets overblijft', () => {
    expect(effectiefAlarm(alarm({ oefeningen: ['Plank'] }), proef).oefeningen).toEqual(['Squats']);
  });

  it('maakt na de proef van elk alarm een gewone wekker die blijft afgaan', () => {
    const a = effectiefAlarm(alarm(), gratis);
    expect(a.niveau).toBe('Vrij');
    expect(a.aan).toBe(true);
  });

  it('laat alleen de eerste twee ingeschakelde alarmen afgaan', () => {
    const lijst = ['1', '2', '3'].map((id) => alarm({ id }));
    const uit = alarm({ id: '0', aan: false });
    const resultaat = alarmenBinnenToegang([uit, ...lijst], gratis);
    expect(resultaat.map((a) => a.aan)).toEqual([false, true, true, false]);
    expect(alarmToegestaan(lijst.slice(0, 1), gratis)).toBe(true);
    expect(alarmToegestaan(lijst, gratis)).toBe(false);
  });

  it('laat alarmen met Premium ongemoeid', () => {
    const premium = bepaalToegang({ premium_altijd: true }, nu, true);
    const a = alarm();
    expect(effectiefAlarm(a, premium)).toBe(a);
  });
});
