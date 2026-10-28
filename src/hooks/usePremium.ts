import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { bepaalToegang, type Toegang } from '@/lib/premium';

// Wat de ingelogde gebruiker mag; wordt opnieuw bepaald als de app weer op de voorgrond komt
// (de proef kan intussen verlopen zijn).
export function usePremium(): Toegang {
  const { profiel } = useAuth();
  const [nu, setNu] = useState(() => new Date());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNu(new Date());
    });
    return () => sub.remove();
  }, []);
  return useMemo(() => bepaalToegang(profiel, nu), [profiel, nu]);
}

export type PremiumReden =
  | 'missie'
  | 'niveau'
  | 'alarmen'
  | 'eigen'
  | 'wisselend'
  | 'herinneringen'
  | 'voortgang'
  | 'missieStarten';

// Opent het Premium-scherm, met een regel over waarom (bijv. een vergrendelde missie)
export function toonPremium(reden?: PremiumReden): void {
  router.push(reden ? { pathname: '/premium', params: { reden } } : '/premium');
}
