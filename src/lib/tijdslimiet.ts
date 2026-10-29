import { meldFout } from '@/lib/fouten';

// Wacht hooguit `ms` op een (native) actie. Antwoordt die niet op tijd, dan gaat de app verder
// met `undefined` en komt er een melding in de foutrapporten, zodat een scherm nooit blijft hangen.
export async function metTijdslimiet<T>(
  belofte: Promise<T>,
  ms: number,
  naam: string,
): Promise<T | undefined> {
  let klok: ReturnType<typeof setTimeout> | undefined;
  const limiet = new Promise<undefined>((klaar) => {
    klok = setTimeout(() => {
      meldFout(new Error(`Geen antwoord binnen ${ms} ms: ${naam}`));
      klaar(undefined);
    }, ms);
  });
  try {
    return await Promise.race([belofte, limiet]);
  } finally {
    clearTimeout(klok);
  }
}
