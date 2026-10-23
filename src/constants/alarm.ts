import type { Niveau, Oefening } from '@/types/app';

export const DAG_LETTERS = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'];
export const DAG_NAMEN = [
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag',
  'zondag',
];
export const DAG_AFKORTINGEN = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export const NIVEAUS: Record<Niveau, string> = {
  Vrij: 'Herinnering zonder druk. Je kunt stoppen of snoozen.',
  Flexibel: 'Je kunt verplaatsen naar een beter moment.',
  Uitstelbaar: 'Een paar keer snoozen, daarna echt beginnen.',
  Verplicht: 'Geen snoozen. Alle rondes afronden.',
  Hardcore: 'Maximale focus, inclusief wakker-check.',
};

export const NIVEAU_LIJST = Object.keys(NIVEAUS) as Niveau[];

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
  if (d.length === 7) return 'Elke dag';
  if (sleutel === '0,1,2,3,4') return 'Ma – Vr';
  if (sleutel === '5,6') return 'Weekend';
  return d.map((i) => DAG_AFKORTINGEN[i]).join(', ');
}

export function missiesTekst(aantal: number): string {
  return aantal === 1 ? '1 missie' : `${aantal} missies`;
}

export function isStreng(niveau: Niveau): boolean {
  return niveau === 'Verplicht' || niveau === 'Hardcore';
}
