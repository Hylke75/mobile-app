import { t } from '@/i18n';
import type { Doelen, Oefening } from '@/types/app';

export type OefeningInfo = {
  emoji: string;
  doel: number;
  eenheid: 'herhalingen' | 'seconden' | 'handeling';
  methode: 'pose' | 'licht' | 'foto' | 'timer';
  camera: 'front' | 'back';
  groep: 'beweging' | 'routine';
};

const pose = (emoji: string, doel: number, eenheid: 'herhalingen' | 'seconden') =>
  ({ emoji, doel, eenheid, methode: 'pose', camera: 'front', groep: 'beweging' }) as const;
const routine = (emoji: string, methode: 'licht' | 'foto' | 'timer', doel = 1): OefeningInfo => ({
  emoji,
  doel,
  eenheid: methode === 'timer' ? 'seconden' : 'handeling',
  methode,
  camera: 'back',
  groep: 'routine',
});

export const OEFENING_INFO: Record<Oefening, OefeningInfo> = {
  Squats: pose('🏋️', 10, 'herhalingen'),
  'Push-ups': pose('💪', 10, 'herhalingen'),
  'Jumping jacks': pose('⭐', 20, 'herhalingen'),
  Plank: pose('🧱', 30, 'seconden'),
  Lunges: pose('🦵', 10, 'herhalingen'),
  Kuitheffen: pose('🦶', 15, 'herhalingen'),
  Bruggetje: pose('🌉', 10, 'herhalingen'),
  Muurzit: pose('🪑', 30, 'seconden'),
  Zijplank: pose('📐', 30, 'seconden'),
  Boomhouding: pose('🌳', 30, 'seconden'),
  'Bed opmaken': routine('🛏️', 'foto'),
  'Gordijnen open': routine('☀️', 'licht'),
  'Glas water': routine('💧', 'foto'),
  'Tanden poetsen': routine('🪥', 'timer', 120),
  Ademhaling: routine('🌬️', 'timer', 60),
  Stretchen: routine('🤸', 'timer', 120),
};

export const OEFENINGEN = Object.keys(OEFENING_INFO) as Oefening[];

// Teksten in de gekozen taal; de sleutel (bijv. "Bed opmaken") blijft zo in de database staan
export function oefeningNaam(oefening: Oefening): string {
  return t(`oefeningen.${oefening}.naam`);
}

export function oefeningTekst(oefening: Oefening) {
  return {
    naam: oefeningNaam(oefening),
    titel: [t(`oefeningen.${oefening}.titel1`), t(`oefeningen.${oefening}.titel2`)] as const,
    beschrijving: t(`oefeningen.${oefening}.beschrijving`),
    instructie: t(`oefeningen.${oefening}.instructie`),
    spraak: [
      t(`oefeningen.${oefening}.spraak1`),
      t(`oefeningen.${oefening}.spraak2`),
      t(`oefeningen.${oefening}.spraak3`),
    ],
  };
}

// Grenzen en stapgrootte voor een eigen doel in de alarm-editor
export const DOEL_BEREIK: Record<
  OefeningInfo['eenheid'],
  { min: number; max: number; stap: number }
> = {
  herhalingen: { min: 5, max: 50, stap: 5 },
  seconden: { min: 15, max: 300, stap: 15 },
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
  if (info.eenheid === 'herhalingen') return t('algemeen.herhalingen', { n: doel });
  if (info.eenheid === 'seconden') return duurTekst(doel);
  return t('algemeen.handeling');
}

// Compacte vorm voor native metadata en routeparameters, bijv. "Squats:15,Plank:45"
export function doelenNaarTekst(doelen: Doelen | undefined): string {
  // Alarmen uit een oudere cache hebben nog geen doelen
  return Object.entries(doelen ?? {})
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

// "45 seconden" of, bij hele minuten, "2 min"
export function duurTekst(seconden: number): string {
  if (seconden >= 60 && seconden % 60 === 0) return t('missies.minuten', { n: seconden / 60 });
  return t('algemeen.seconden', { n: seconden });
}
