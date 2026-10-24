// Op web zijn er geen lokale meldingen; de instellingen worden niet gebruikt
import { STANDAARD_HERINNERINGEN, type HerinneringInstellingen } from '@/lib/herinneringPlan';

export const herinneringenBeschikbaar = false;

export async function leesHerinneringInstellingen(): Promise<HerinneringInstellingen> {
  return STANDAARD_HERINNERINGEN;
}

export function luisterNaarHerinneringInstellingen(): () => void {
  return () => {};
}

export async function zetHerinneringInstellingen(): Promise<void> {}

export async function vraagMeldingToestemming(): Promise<boolean> {
  return false;
}

export async function synchroniseerHerinneringen(): Promise<void> {}

export async function annuleerHerinneringen(): Promise<void> {}
