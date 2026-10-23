import type { Href } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

// Waar iemand hoort te staan die een open scherm (missie/wekker) zonder alarm opent
export function useStartDoel(): Href | null {
  const { status, profiel } = useAuth();
  if (status !== 'ingelogd') return '/inloggen';
  if (!profiel?.voornaam) return '/welkom';
  return null;
}
