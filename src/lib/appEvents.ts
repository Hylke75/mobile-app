import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

export type AppEvent =
  | 'first_alarm_created'
  | 'first_mission_completed'
  | 'day7_active'
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_completed'
  | 'premium_moment_shown';

// Gebeurtenis voor de proeffunnel in het beheer. Mag nooit iets ophouden of laten mislukken.
// Met `eenmalig` (bijv. de gebruikers-id) telt de server hem maar één keer per account.
export function logAppEvent(
  naam: AppEvent,
  eigenschappen: Record<string, string | number | boolean | null> = {},
  eenmalig?: string,
): void {
  const extern = eenmalig ? `${naam}:${eenmalig}` : Crypto.randomUUID();
  supabase.rpc('log_app_event', { naam, eigenschappen, extern_id: extern }).then(
    () => {},
    () => {},
  );
}
