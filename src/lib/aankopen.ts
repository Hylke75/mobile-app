// Aankopen via RevenueCat (StoreKit / Google Play Billing). De app-gebruiker in RevenueCat is
// het Supabase-account, zodat de webhook (supabase/functions/revenuecat-webhook) Premium op de
// server kan vastleggen. Zonder publieke sleutel staan aankopen uit.
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { meldFout } from '@/lib/fouten';

const SLEUTEL =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export const aankopenBeschikbaar = Boolean(SLEUTEL);
export const ENTITLEMENT = 'premium';

export type Plan = 'jaar' | 'maand' | 'lifetime';
export type Pakketten = Partial<Record<Plan, { pakket: PurchasesPackage; prijs: string }>>;

let geconfigureerd = false;
let actief = false;
const luisteraars = new Set<(actief: boolean) => void>();

function werkBij(info: CustomerInfo) {
  const nu = Boolean(info.entitlements.active[ENTITLEMENT]);
  if (nu === actief) return;
  actief = nu;
  for (const luisteraar of luisteraars) luisteraar(actief);
}

// Koppelt de winkel aan het ingelogde account (of ontkoppelt bij uitloggen)
export async function koppelGebruiker(userId: string | null): Promise<void> {
  if (!SLEUTEL) return;
  try {
    if (!geconfigureerd) {
      if (!userId) return;
      Purchases.configure({ apiKey: SLEUTEL, appUserID: userId });
      Purchases.addCustomerInfoUpdateListener(werkBij);
      geconfigureerd = true;
    } else if (userId) {
      await Purchases.logIn(userId);
    } else {
      if (!(await Purchases.isAnonymous())) await Purchases.logOut();
      werkBij({ entitlements: { active: {} } } as unknown as CustomerInfo);
      return;
    }
    werkBij(await Purchases.getCustomerInfo());
  } catch (fout) {
    meldFout(fout);
  }
}

export function winkelPremium(): boolean {
  return actief;
}

export function luisterNaarWinkelPremium(luisteraar: (actief: boolean) => void): () => void {
  luisteraars.add(luisteraar);
  return () => luisteraars.delete(luisteraar);
}

// De pakketten van de huidige offering met de prijs zoals de winkel die toont (per land)
export async function haalPakketten(): Promise<Pakketten> {
  if (!geconfigureerd) return {};
  try {
    const aanbod = (await Purchases.getOfferings()).current;
    if (!aanbod) return {};
    const met = (pakket: PurchasesPackage | null) =>
      pakket ? { pakket, prijs: pakket.product.priceString } : undefined;
    return {
      jaar: met(aanbod.annual),
      maand: met(aanbod.monthly),
      lifetime: met(aanbod.lifetime),
    };
  } catch (fout) {
    meldFout(fout);
    return {};
  }
}

export type Uitkomst = 'gekocht' | 'geannuleerd' | 'fout';

export async function koop(pakket: PurchasesPackage): Promise<Uitkomst> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pakket);
    werkBij(customerInfo);
    return customerInfo.entitlements.active[ENTITLEMENT] ? 'gekocht' : 'fout';
  } catch (fout) {
    if ((fout as { userCancelled?: boolean }).userCancelled) return 'geannuleerd';
    meldFout(fout);
    return 'fout';
  }
}

// Herstelt eerdere aankopen (verplicht in de App Store); true als Premium daarna actief is
export async function herstel(): Promise<boolean> {
  if (!geconfigureerd) return false;
  try {
    const info = await Purchases.restorePurchases();
    werkBij(info);
    return Boolean(info.entitlements.active[ENTITLEMENT]);
  } catch (fout) {
    meldFout(fout);
    return false;
  }
}
