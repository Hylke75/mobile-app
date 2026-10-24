import type { Doelen, Oefening } from '@/types/app';

export type OefeningInfo = {
  titel: [string, string];
  beschrijving: string;
  emoji: string;
  doel: number;
  eenheid: 'herhalingen' | 'seconden' | 'handeling';
  methode: 'pose' | 'licht' | 'foto';
  camera: 'front' | 'back';
  instructie: string;
  spraak: string[];
};

export const OEFENING_INFO: Record<Oefening, OefeningInfo> = {
  Squats: {
    titel: ['LET’S ', 'GO.'],
    beschrijving: 'Zak door je knieën en kom weer omhoog',
    emoji: '🏋️',
    doel: 10,
    eenheid: 'herhalingen',
    methode: 'pose',
    camera: 'front',
    instructie: 'Zet je telefoon rechtop, zo’n 2 meter van je af. Ga er zijdelings voor staan.',
    spraak: [
      'Zakken maar. Jij kunt dit!',
      'Mooi! Hou je rug recht.',
      'Lekker bezig. Nog even doorzetten.',
    ],
  },
  'Push-ups': {
    titel: ['PUSH ', 'IT.'],
    beschrijving: 'Laat je borst zakken en duw jezelf weer omhoog',
    emoji: '💪',
    doel: 10,
    eenheid: 'herhalingen',
    methode: 'pose',
    camera: 'front',
    instructie:
      'Leg je telefoon op de grond, zijdelings van je af, zodat je hele lichaam zichtbaar is.',
    spraak: ['Lichaam recht, daar gaan we!', 'Sterk! Blijf ademen.', 'Laatste paar, kom op!'],
  },
  'Jumping jacks': {
    titel: ['JUMP ', 'IN.'],
    beschrijving: 'Spring met je armen en benen wijd en weer terug',
    emoji: '⭐',
    doel: 20,
    eenheid: 'herhalingen',
    methode: 'pose',
    camera: 'front',
    instructie: 'Zet je telefoon rechtop, zo’n 2 meter van je af. Ga er recht voor staan.',
    spraak: ['Springen maar!', 'Armen helemaal omhoog.', 'Bijna! Hou het tempo vast.'],
  },
  Plank: {
    titel: ['HOLD ', 'ON.'],
    beschrijving: 'Houd je lichaam recht op je onderarmen',
    emoji: '🧱',
    doel: 30,
    eenheid: 'seconden',
    methode: 'pose',
    camera: 'front',
    instructie:
      'Leg je telefoon op de grond, zijdelings van je af, zodat je hele lichaam zichtbaar is.',
    spraak: ['Buik aan, rug recht.', 'Je doet het goed, vasthouden!', 'Nog heel even!'],
  },
  'Bed opmaken': {
    titel: ['MAKE ', 'IT.'],
    beschrijving: 'Maak je bed netjes op',
    emoji: '🛏️',
    doel: 1,
    eenheid: 'handeling',
    methode: 'foto',
    camera: 'back',
    instructie: 'Maak je bed op en maak daarna een foto van je bed als bevestiging.',
    spraak: ['Top! Maak nu je bed op.'],
  },
  'Gordijnen open': {
    titel: ['OPEN ', 'UP.'],
    beschrijving: 'Laat het daglicht binnen',
    emoji: '☀️',
    doel: 1,
    eenheid: 'handeling',
    methode: 'licht',
    camera: 'back',
    instructie:
      'Richt je camera op het raam en open de gordijnen. Mooove meet of het lichter wordt.',
    spraak: ['Laat die dag maar beginnen.'],
  },
};

// Grenzen en stapgrootte voor een eigen doel in de alarm-editor
export const DOEL_BEREIK: Record<
  OefeningInfo['eenheid'],
  { min: number; max: number; stap: number }
> = {
  herhalingen: { min: 5, max: 50, stap: 5 },
  seconden: { min: 15, max: 120, stap: 15 },
  handeling: { min: 1, max: 1, stap: 1 },
};

export function doelVoor(oefening: Oefening, doelen?: Doelen): number {
  const info = OEFENING_INFO[oefening];
  const bereik = DOEL_BEREIK[info.eenheid];
  const eigen = doelen?.[oefening];
  if (typeof eigen !== 'number' || !Number.isFinite(eigen)) return info.doel;
  return Math.min(bereik.max, Math.max(bereik.min, Math.round(eigen)));
}

export function doelTekst(oefening: Oefening, doelen?: Doelen): string {
  const info = OEFENING_INFO[oefening];
  const doel = doelVoor(oefening, doelen);
  if (info.eenheid === 'herhalingen') return `${doel} herhalingen`;
  if (info.eenheid === 'seconden') return `${doel} seconden`;
  return '1 handeling';
}

// Compacte vorm voor native metadata en routeparameters, bijv. "Squats:15,Plank:45"
export function doelenNaarTekst(doelen: Doelen): string {
  return Object.entries(doelen)
    .map(([o, n]) => `${o}:${n}`)
    .join(',');
}

export function doelenUitTekst(tekst: string | undefined): Doelen {
  const doelen: Doelen = {};
  if (!tekst) return doelen;
  for (const deel of tekst.split(',')) {
    const [o, n] = deel.split(':');
    if (o && o in OEFENING_INFO && Number.isFinite(Number(n))) {
      doelen[o as Oefening] = Number(n);
    }
  }
  return doelen;
}

export function doelenUitJson(json: unknown): Doelen {
  const doelen: Doelen = {};
  if (!json || typeof json !== 'object' || Array.isArray(json)) return doelen;
  for (const [o, n] of Object.entries(json)) {
    if (o in OEFENING_INFO && typeof n === 'number') doelen[o as Oefening] = n;
  }
  return doelen;
}
