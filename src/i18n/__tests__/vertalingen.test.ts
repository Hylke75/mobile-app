import { t, TALEN, zetTaal } from '@/i18n';
import { teksten } from '@/i18n/teksten';

type Boom = { [sleutel: string]: string | Boom };

function bladeren(boom: Boom, voor = ''): [string, string][] {
  return Object.entries(boom).flatMap(([k, v]) =>
    typeof v === 'string' ? [[`${voor}${k}`, v] as [string, string]] : bladeren(v, `${voor}${k}.`),
  );
}

// Teksten die bewust leeg mogen zijn (de voorrangsregel van de privacyverklaring geldt niet in het Nederlands)
const MAG_LEEG = new Set(['nl:privacy.voorrang']);

const plekken = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort();

describe('vertalingen', () => {
  afterAll(() => zetTaal('nl'));

  for (const [groep, talen] of Object.entries(teksten)) {
    const bron = bladeren(talen.nl as Boom, `${groep}.`);

    it(`${groep}: elke taal heeft precies dezelfde sleutels`, () => {
      const sleutels = bron.map(([k]) => k).sort();
      for (const taal of TALEN) {
        const vertaald = bladeren((talen as Record<string, Boom>)[taal]!, `${groep}.`)
          .map(([k]) => k)
          .sort();
        expect(vertaald).toEqual(sleutels);
      }
    });

    it(`${groep}: geen lege teksten en dezelfde invulplekken`, () => {
      for (const taal of TALEN) {
        const vertaald = new Map(bladeren((talen as Record<string, Boom>)[taal]!, `${groep}.`));
        for (const [sleutel, nl] of bron) {
          const tekst = vertaald.get(sleutel) ?? '';
          if (!MAG_LEEG.has(`${taal}:${sleutel}`)) {
            expect({ taal, sleutel, gevuld: tekst.trim().length > 0 }).toEqual({
              taal,
              sleutel,
              gevuld: true,
            });
          }
          expect({ taal, sleutel, plekken: plekken(tekst) }).toEqual({
            taal,
            sleutel,
            plekken: plekken(nl),
          });
        }
      }
    });
  }

  it('wisselt van taal en vult waarden in', () => {
    zetTaal('de');
    expect(t('algemeen.missies', { n: 3 })).toBe('3 Missionen');
    zetTaal('fr');
    expect(t('algemeen.elkeDag')).toBe('Tous les jours');
    zetTaal('nl');
    expect(t('algemeen.missies', { n: 3 })).toBe('3 missies');
  });
});
