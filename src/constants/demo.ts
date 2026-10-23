// MOCKDATA: alle waarden hieronder komen uit de ontwerp-demo en zijn niet gemeten of opgeslagen.
import type { Alarm, MissieTaak, Niveau } from '@/types/demo';

export const DEMO_GEBRUIKER = { voornaam: 'Hylke', naam: 'Hylke Thiry', initiaal: 'H' };
export const DEMO_STREAK = 12;

export const STANDAARD_ALARMEN: Alarm[] = [
  {
    id: 1,
    time: '07:00',
    name: 'Wake up & move',
    days: 'Ma – Vr',
    level: 'Verplicht',
    count: '3 missies',
    on: true,
  },
  {
    id: 2,
    time: '11:30',
    name: 'Active break',
    days: 'Elke werkdag',
    level: 'Uitstelbaar',
    count: '1 missie',
    on: true,
  },
  {
    id: 3,
    time: '19:00',
    name: 'Even stretchen',
    days: 'Ma, Wo, Vr',
    level: 'Flexibel',
    count: '2 missies',
    on: false,
  },
];

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

export const OEFENINGEN = [
  'Squats',
  'Push-ups',
  'Jumping jacks',
  'Plank',
  'Bed opmaken',
  'Gordijnen open',
];

export const MISSIE_TAKEN: MissieTaak[] = [
  {
    title: '10 squats',
    description: 'Zak door je knieën en kom weer omhoog',
    total: 10,
    voice: [
      'Zakken maar. Jij kunt dit!',
      'Mooi! Hou je rug recht.',
      'Lekker bezig. Nog even doorzetten.',
    ],
  },
  {
    title: 'Bed opmaken',
    description: 'Maak je bed netjes op',
    total: 1,
    voice: ['Top! Maak nu je bed op.'],
  },
  {
    title: 'Gordijnen open',
    description: 'Laat het daglicht binnen',
    total: 1,
    voice: ['Laat die dag maar beginnen.'],
  },
];

export const OCHTENDMISSIE = [
  { index: '01', emoji: '🏋️', naam: 'Squats', detail: '10 herhalingen' },
  { index: '02', emoji: '🛏️', naam: 'Bed opmaken', detail: '1 handeling' },
  { index: '03', emoji: '☀️', naam: 'Gordijnen open', detail: '1 handeling' },
];

export const WEEK_BALKEN = [58, 83, 72, 100, 88, 46, 13];
