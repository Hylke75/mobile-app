// RevenueCat-webhook: welke Premium-status volgt uit een gebeurtenis. Zonder Deno-imports, zodat
// Jest dit test (src/lib/__tests__/winkel.test.ts).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Lifetime heeft geen einddatum; we leggen een datum ver in de toekomst vast
export const ALTIJD = '9999-12-31T00:00:00.000Z';

export type WinkelEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  product_id?: string;
};

export type Besluit =
  | { soort: 'zet'; gebruiker: string; premiumTot: string }
  | { soort: 'niets'; reden: string };

const ACTIEF = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
]);

// Het Supabase-account achter de aankoop (RevenueCat-gebruiker = Supabase-id)
export function gebruikerVan(e: WinkelEvent): string | null {
  const kandidaten = [e.app_user_id, e.original_app_user_id, ...(e.aliases ?? [])];
  return kandidaten.find((k): k is string => typeof k === 'string' && UUID.test(k)) ?? null;
}

export function besluit(e: WinkelEvent, entitlement = 'premium', nu = Date.now()): Besluit {
  const gebruiker = gebruikerVan(e);
  if (!gebruiker) return { soort: 'niets', reden: 'geen_gebruiker' };
  if (e.entitlement_ids && !e.entitlement_ids.includes(entitlement)) {
    return { soort: 'niets', reden: 'ander_entitlement' };
  }
  if (e.type && ACTIEF.has(e.type)) {
    return {
      soort: 'zet',
      gebruiker,
      premiumTot: e.expiration_at_ms ? new Date(e.expiration_at_ms).toISOString() : ALTIJD,
    };
  }
  if (e.type === 'EXPIRATION') {
    const einde = e.expiration_at_ms && e.expiration_at_ms < nu ? e.expiration_at_ms : nu;
    return { soort: 'zet', gebruiker, premiumTot: new Date(einde).toISOString() };
  }
  // Opzeggen (CANCELLATION) loopt door tot de einddatum; betalingsproblemen en tests negeren
  return { soort: 'niets', reden: e.type ?? 'onbekend' };
}
