import * as StoreReview from 'expo-store-review';

import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';

// Vraagt eenmalig om een beoordeling, pas na een week volhouden
export async function vraagBeoordelingNaStreak(streak: number): Promise<void> {
  if (streak < 7) return;
  if (await leesLokaal<boolean>(SLEUTELS.beoordelingGevraagd)) return;
  if (!(await StoreReview.isAvailableAsync().catch(() => false))) return;
  await schrijfLokaal(SLEUTELS.beoordelingGevraagd, true);
  await StoreReview.requestReview().catch(() => {});
}
