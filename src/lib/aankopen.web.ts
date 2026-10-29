// Op web zijn er geen winkelaankopen
export const aankopenBeschikbaar = false;
export const ENTITLEMENT = 'premium';
export type Plan = 'jaar' | 'maand' | 'lifetime';
export type Pakketten = Partial<Record<Plan, { pakket: unknown; prijs: string }>>;
export type Uitkomst = 'gekocht' | 'geannuleerd' | 'fout';

export async function koppelGebruiker(_userId: string | null): Promise<void> {}
export function winkelPremium(): boolean {
  return false;
}
export function luisterNaarWinkelPremium(_luisteraar: (actief: boolean) => void): () => void {
  return () => {};
}
export async function haalPakketten(): Promise<Pakketten> {
  return {};
}
export async function koop(_pakket: unknown): Promise<Uitkomst> {
  return 'fout';
}
export async function herstel(): Promise<boolean> {
  return false;
}
