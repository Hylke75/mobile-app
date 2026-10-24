import { t } from '@/i18n';
import type { Niveau, Oefening } from '@/types/app';

// Dagen: 0 = maandag … 6 = zondag
export const DAGEN = [0, 1, 2, 3, 4, 5, 6] as const;

const dag = (i: number) => `d${i}` as 'd0';

export const dagLetter = (i: number) => t(`algemeen.dagLetters.${dag(i)}`);
export const dagNaam = (i: number) => t(`algemeen.dagNamen.${dag(i)}`);
export const dagAfkorting = (i: number) => t(`algemeen.dagAfkortingen.${dag(i)}`);

export const NIVEAU_LIJST: Niveau[] = ['Vrij', 'Flexibel', 'Uitstelbaar', 'Verplicht', 'Hardcore'];

export const niveauNaam = (niveau: Niveau) => t(`algemeen.niveaus.${niveau}.naam`);
export const niveauUitleg = (niveau: Niveau) => t(`algemeen.niveaus.${niveau}.uitleg`);

export const OEFENINGEN: Oefening[] = [
  'Squats',
  'Push-ups',
  'Jumping jacks',
  'Plank',
  'Bed opmaken',
  'Gordijnen open',
];

export const MAX_SNOOZES = 3;
export const SNOOZE_MINUTEN = 9;
export const MISSIE_TIMEOUT_MINUTEN = 10;
export const WAKKERCHECK_MINUTEN = 5;

export function dagenTekst(dagen: number[]): string {
  const d = [...dagen].sort((a, b) => a - b);
  const sleutel = d.join(',');
  if (d.length === 7) return t('algemeen.elkeDag');
  if (sleutel === '0,1,2,3,4') return t('algemeen.werkdagen');
  if (sleutel === '5,6') return t('algemeen.weekend');
  return d.map((i) => dagAfkorting(i)).join(', ');
}

export function missiesTekst(aantal: number): string {
  return aantal === 1 ? t('algemeen.missie') : t('algemeen.missies', { n: aantal });
}

export function isStreng(niveau: Niveau): boolean {
  return niveau === 'Verplicht' || niveau === 'Hardcore';
}
