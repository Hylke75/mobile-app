import type { Vertalingen } from '@/i18n/talen';

const nl = {
  tabs: {
    vandaag: 'Vandaag',
    alarmen: 'Alarmen',
    progressie: 'Progressie',
    profiel: 'Profiel',
  },
  update: { klaar: 'Nieuwe versie klaar', herstart: 'Herstart' },
};

export const navigatie: Vertalingen<typeof nl> = {
  nl,
  en: {
    tabs: { vandaag: 'Today', alarmen: 'Alarms', progressie: 'Progress', profiel: 'Profile' },
    update: { klaar: 'New version ready', herstart: 'Restart' },
  },
  es: {
    tabs: { vandaag: 'Hoy', alarmen: 'Alarmas', progressie: 'Progreso', profiel: 'Perfil' },
    update: { klaar: 'Nueva versión lista', herstart: 'Reiniciar' },
  },
  de: {
    tabs: { vandaag: 'Heute', alarmen: 'Wecker', progressie: 'Fortschritt', profiel: 'Profil' },
    update: { klaar: 'Neue Version bereit', herstart: 'Neu starten' },
  },
  fr: {
    tabs: {
      vandaag: 'Aujourd’hui',
      alarmen: 'Alarmes',
      progressie: 'Progrès',
      profiel: 'Profil',
    },
    update: { klaar: 'Nouvelle version prête', herstart: 'Redémarrer' },
  },
  zh: {
    tabs: {
      vandaag: '今天',
      alarmen: '闹钟',
      progressie: '进度',
      profiel: '我的',
    },
    update: {
      klaar: '新版本已就绪',
      herstart: '重启',
    },
  },
};
