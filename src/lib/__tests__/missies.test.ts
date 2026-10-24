import { OEFENINGEN } from '@/constants/oefeningen';
import {
  eigenNaarTekst,
  eigenUitTekst,
  isEigen,
  missieInfo,
  missieInfos,
  naarEigenId,
} from '@/lib/missies';
import type { EigenMissie } from '@/types/app';

const lezen: EigenMissie = {
  id: '0b1f1c4e-2f7a-4c55-9f1e-3a2b4c5d6e7f',
  naam: '5 minuten lezen',
  emoji: '📖',
  soort: 'timer',
  duurSeconden: 300,
};
const water: EigenMissie = { ...lezen, id: 'aaaa', naam: 'Plant water geven', soort: 'foto' };
const eigen = new Map([
  [lezen.id, lezen],
  [water.id, water],
]);

describe('missies', () => {
  it('heeft zestien ingebouwde missies met een naam en emoji', () => {
    expect(OEFENINGEN).toHaveLength(16);
    for (const o of OEFENINGEN) {
      const info = missieInfo(o, new Map())!;
      expect(info.naam.length).toBeGreaterThan(0);
      expect(info.emoji.length).toBeGreaterThan(0);
      expect(info.instructie.length).toBeGreaterThan(0);
    }
  });

  it('beschrijft een ingebouwde oefening met eigen doel', () => {
    const info = missieInfo('Squats', new Map(), { Squats: 20 })!;
    expect(info.methode).toBe('pose');
    expect(info.doel).toBe(20);
    expect(info.doelTekst).toBe('20 herhalingen');
  });

  it('toont timers in minuten', () => {
    expect(missieInfo('Tanden poetsen', new Map())!.doelTekst).toBe('2 min');
    expect(missieInfo('Tanden poetsen', new Map())!.methode).toBe('timer');
  });

  it('beschrijft eigen missies met timer of foto', () => {
    const timer = missieInfo(naarEigenId(lezen.id), eigen)!;
    expect(timer.methode).toBe('timer');
    expect(timer.doel).toBe(300);
    expect(timer.doelTekst).toBe('5 min');
    expect(timer.naam).toBe('5 minuten lezen');
    const foto = missieInfo(naarEigenId(water.id), eigen)!;
    expect(foto.methode).toBe('foto');
    expect(foto.doelTekst).toBe('1 foto');
  });

  it('laat verwijderde of onbekende missies weg', () => {
    const lijst = missieInfos(['Squats', 'eigen:bestaat-niet', naarEigenId(lezen.id)], eigen);
    expect(lijst.map((m) => m.id)).toEqual(['Squats', naarEigenId(lezen.id)]);
    expect(isEigen('eigen:x')).toBe(true);
    expect(isEigen('Squats')).toBe(false);
  });

  it('bewaart eigen missies compact voor het native alarm', () => {
    expect(eigenUitTekst(eigenNaarTekst([lezen, water]))).toEqual([lezen, water]);
    expect(eigenUitTekst('geen json')).toEqual([]);
    expect(eigenUitTekst(undefined)).toEqual([]);
  });
});
