import type { Niveau, Oefening } from '@/types/app';

// Het verdienmodel staat pas aan als de aankopen gekoppeld zijn (fase 3). Tot die tijd heeft
// iedereen volledige toegang; voor een testbuild zet je EXPO_PUBLIC_VERDIENMODEL=1.
export const VERDIENMODEL_AAN = process.env.EXPO_PUBLIC_VERDIENMODEL === '1';

export const PROEF_DAGEN = 14;

// Beperkingen buiten Premium. De proefperiode is beperkt; daarna blijft een gewone wekker over.
export const PROEF = {
  maxAlarmen: 2,
  niveaus: ['Vrij', 'Verplicht'] as readonly Niveau[],
  missies: ['Squats', 'Bed opmaken'] as readonly Oefening[],
};

export const GRATIS = {
  maxAlarmen: 2,
  // Elk ander niveau opent de app voor een missie; zonder missies blijft alleen Vrij over
  niveaus: ['Vrij'] as readonly Niveau[],
  missies: [] as readonly Oefening[],
};

// Prijzen zoals ze in de stores komen; de stores tonen straks de echte prijs per land
export const PRIJZEN = {
  jaar: '€ 19,99',
  maand: '€ 2,99',
  lifetime: '€ 29,99',
  lifetimeNa: '€ 49,99',
  jaarPerMaand: '€ 1,67',
  besparing: 44,
};

// Dagen in de proefperiode waarop Vandaag een melding toont
export const PROEF_MELDDAGEN = [1, 7, 11, 14] as const;
