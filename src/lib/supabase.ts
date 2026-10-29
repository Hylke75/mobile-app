import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL en EXPO_PUBLIC_SUPABASE_ANON_KEY ontbreken. Kopieer .env.example naar .env en vul ze in.',
  );
}

// SecureStore waarschuwt boven ~2 KB per waarde; een sessie kan groter zijn, dus opslaan in delen.
const CHUNK_GROOTTE = 1800;

// Leesbaar na de eerste ontgrendeling sinds het opstarten: een alarm kan de app starten terwijl
// de telefoon op slot zit, en dan moet de sessie al te lezen zijn (de iOS-standaard is
// "alleen ontgrendeld", wat "User interaction is not allowed" gaf).
const TOEGANG: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

// Zit de sleutelhanger nog op slot (vlak na een herstart), dan wachten tot hij leesbaar is in
// plaats van een fout te geven: Supabase mag de sessie dan niet als 'weg' zien.
async function lees(sleutel: string): Promise<string | null> {
  for (let poging = 0; ; poging++) {
    try {
      return await SecureStore.getItemAsync(sleutel, TOEGANG);
    } catch (fout) {
      if (poging >= 600) throw fout;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// Sessies van vóór deze versie staan nog met de oude toegang opgeslagen: één keer opnieuw schrijven
const omgezet = new Set<string>();

const secureStoreOpslag = {
  async getItem(key: string): Promise<string | null> {
    const aantal = await lees(`${key}.aantal`);
    if (!aantal) return null;
    const delen: string[] = [];
    for (let i = 0; i < Number(aantal); i++) {
      const deel = await lees(`${key}.${i}`);
      if (deel === null) return null;
      delen.push(deel);
    }
    const waarde = delen.join('');
    if (!omgezet.has(key)) {
      omgezet.add(key);
      await secureStoreOpslag.setItem(key, waarde).catch(() => {});
    }
    return waarde;
  },
  async setItem(key: string, value: string): Promise<void> {
    await secureStoreOpslag.removeItem(key);
    const aantal = Math.ceil(value.length / CHUNK_GROOTTE);
    for (let i = 0; i < aantal; i++) {
      await SecureStore.setItemAsync(
        `${key}.${i}`,
        value.slice(i * CHUNK_GROOTTE, (i + 1) * CHUNK_GROOTTE),
        TOEGANG,
      );
    }
    await SecureStore.setItemAsync(`${key}.aantal`, String(aantal), TOEGANG);
  },
  async removeItem(key: string): Promise<void> {
    const aantal = await lees(`${key}.aantal`);
    if (aantal) {
      for (let i = 0; i < Number(aantal); i++) {
        await SecureStore.deleteItemAsync(`${key}.${i}`, TOEGANG);
      }
    }
    await SecureStore.deleteItemAsync(`${key}.aantal`, TOEGANG);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // SecureStore bestaat niet op web; daar valt Supabase terug op localStorage
    storage: Platform.OS === 'web' ? undefined : secureStoreOpslag,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tokens alleen verversen zolang de app op de voorgrond staat
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => {
    if (status === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
