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

const secureStoreOpslag = {
  async getItem(key: string): Promise<string | null> {
    const aantal = await SecureStore.getItemAsync(`${key}.aantal`);
    if (!aantal) return null;
    const delen: string[] = [];
    for (let i = 0; i < Number(aantal); i++) {
      const deel = await SecureStore.getItemAsync(`${key}.${i}`);
      if (deel === null) return null;
      delen.push(deel);
    }
    return delen.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    await secureStoreOpslag.removeItem(key);
    const aantal = Math.ceil(value.length / CHUNK_GROOTTE);
    for (let i = 0; i < aantal; i++) {
      await SecureStore.setItemAsync(
        `${key}.${i}`,
        value.slice(i * CHUNK_GROOTTE, (i + 1) * CHUNK_GROOTTE),
      );
    }
    await SecureStore.setItemAsync(`${key}.aantal`, String(aantal));
  },
  async removeItem(key: string): Promise<void> {
    const aantal = await SecureStore.getItemAsync(`${key}.aantal`);
    if (aantal) {
      for (let i = 0; i < Number(aantal); i++) {
        await SecureStore.deleteItemAsync(`${key}.${i}`);
      }
    }
    await SecureStore.deleteItemAsync(`${key}.aantal`);
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
