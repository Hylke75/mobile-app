import { isFeestdag } from '@/lib/feestdagen';

const d = (j: number, m: number, dag: number) => new Date(j, m - 1, dag);

describe('feestdagen', () => {
  it('kent de Nederlandse feestdagen van 2026', () => {
    for (const dag of [
      d(2026, 1, 1),
      d(2026, 4, 5), // Pasen
      d(2026, 4, 6),
      d(2026, 4, 27), // Koningsdag
      d(2026, 5, 14), // Hemelvaart
      d(2026, 5, 24), // Pinksteren
      d(2026, 5, 25),
      d(2026, 12, 25),
      d(2026, 12, 26),
    ]) {
      expect(isFeestdag(dag, 'NL')).toBe(true);
    }
    expect(isFeestdag(d(2026, 5, 5), 'NL')).toBe(false); // Bevrijdingsdag alleen in lustrumjaren
    expect(isFeestdag(d(2025, 5, 5), 'NL')).toBe(true);
    expect(isFeestdag(d(2026, 10, 26), 'NL')).toBe(false);
  });

  it('verschuift Koningsdag naar zaterdag als 27 april op zondag valt', () => {
    expect(isFeestdag(d(2025, 4, 26), 'NL')).toBe(true);
    expect(isFeestdag(d(2025, 4, 27), 'NL')).toBe(false);
  });

  it('kent landspecifieke dagen', () => {
    expect(isFeestdag(d(2026, 10, 3), 'DE')).toBe(true);
    expect(isFeestdag(d(2026, 7, 14), 'FR')).toBe(true);
    expect(isFeestdag(d(2026, 7, 21), 'BE')).toBe(true);
    expect(isFeestdag(d(2026, 10, 12), 'ES')).toBe(true);
    expect(isFeestdag(d(2026, 11, 26), 'US')).toBe(true); // Thanksgiving
    expect(isFeestdag(d(2026, 8, 31), 'GB')).toBe(true); // Summer bank holiday
    expect(isFeestdag(d(2026, 12, 28), 'GB')).toBe(true); // Boxing Day doorgeschoven
  });

  it('heeft geen feestdagen voor een onbekend land', () => {
    expect(isFeestdag(d(2026, 12, 25), null)).toBe(false);
  });
});
