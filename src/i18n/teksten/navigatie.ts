import type { Vertalingen } from '@/i18n/talen';

const nl = {
  tabs: {
    vandaag: 'Vandaag',
    alarmen: 'Alarmen',
    progressie: 'Progressie',
    profiel: 'Profiel',
  },
};

export const navigatie: Vertalingen<typeof nl> = {
  nl,
  en: {
    tabs: { vandaag: 'Today', alarmen: 'Alarms', progressie: 'Progress', profiel: 'Profile' },
  },
  es: {
    tabs: { vandaag: 'Hoy', alarmen: 'Alarmas', progressie: 'Progreso', profiel: 'Perfil' },
  },
  de: {
    tabs: { vandaag: 'Heute', alarmen: 'Wecker', progressie: 'Fortschritt', profiel: 'Profil' },
  },
  fr: {
    tabs: {
      vandaag: 'Aujourd’hui',
      alarmen: 'Alarmes',
      progressie: 'Progrès',
      profiel: 'Profil',
    },
  },
};
