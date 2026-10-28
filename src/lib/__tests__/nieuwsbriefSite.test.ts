/**
 * @jest-environment node
 */
// Nieuwsbriefformulier op de gebouwde site (npm run site): aparte, niet-aangevinkte toestemming
// met precies de tekst die de Edge Function als bewijs opslaat.
import { NIEUWSBRIEF_TEKSTEN } from '../../../supabase/functions/_shared/nieuwsbriefTeksten';
import { TALEN } from '../../../supabase/functions/_shared/marketing';

// Geen Node-types in dit project; alleen wat deze test nodig heeft
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('fs') as {
  readFileSync: (pad: string, codering: 'utf8') => string;
};

const pagina = (taal: string) =>
  readFileSync(`${process.cwd()}/site/${taal === 'nl' ? '' : `${taal}/`}index.html`, 'utf8');

describe.each(TALEN)('nieuwsbriefformulier (%s)', (taal) => {
  const html = pagina(taal);
  const formulier = html.slice(
    html.indexOf('id="nieuwsbrief"'),
    html.indexOf('</form>', html.indexOf('id="nieuwsbrief"')),
  );

  it('heeft een eigen formulier, los van de wachtlijst', () => {
    expect(html).toContain('id="wachtlijst"');
    expect(formulier.length).toBeGreaterThan(0);
  });

  it('vraagt toestemming met een niet-aangevinkt vakje', () => {
    const vakje = formulier.match(/<input[^>]*name="toestemming"[^>]*>/)?.[0];
    expect(vakje).toBeDefined();
    expect(vakje).toContain('type="checkbox"');
    expect(vakje).not.toMatch(/\bchecked\b/);
  });

  it('toont dezelfde toestemmingstekst als in het bewijs wordt opgeslagen', () => {
    const tekst = NIEUWSBRIEF_TEKSTEN[taal].toestemming
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    expect(formulier).toContain(tekst);
  });
});
