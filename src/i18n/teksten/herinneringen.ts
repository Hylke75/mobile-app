import type { Vertalingen } from '@/i18n/talen';

// Lokale meldingen (src/lib/herinneringen.ts) en de instellingen ervan in Profiel
const nl = {
  kop: 'HERINNERINGEN',
  avond: {
    label: 'De avond ervoor',
    uitleg: 'Om 21:00 zie je welk ochtendalarm en welke missies er morgen klaarstaan.',
    titel: 'Morgen om {{tijd}}: {{naam}}',
    tekst: 'Leg je telefoon klaar voor {{missies}}.',
  },
  streak: {
    label: 'Streak in gevaar',
    uitleg: 'Om 19:00 een seintje als je vandaag nog geen missie hebt gedaan.',
    titel: 'Je streak van {{n}} dagen staat op het spel 🔥',
    tekst: 'Doe vandaag nog een missie om hem te houden.',
    tekstJoker: 'Doe vandaag nog een missie, anders gaat je joker van deze maand op.',
  },
  geenToestemming: 'Zet meldingen voor Mooove aan in de instellingen van je telefoon.',
  alleenOpTelefoon: 'Herinneringen werken alleen in de app op je telefoon.',
  kanaal: 'Herinneringen',
};

export const herinneringen: Vertalingen<typeof nl> = {
  nl,
  en: {
    kop: 'REMINDERS',
    avond: {
      label: 'The evening before',
      uitleg: 'At 9:00 pm you’ll see which morning alarm and missions are set for tomorrow.',
      titel: 'Tomorrow at {{tijd}}: {{naam}}',
      tekst: 'Get your phone ready for {{missies}}.',
    },
    streak: {
      label: 'Streak at risk',
      uitleg: 'A nudge at 7:00 pm if you haven’t done a mission yet today.',
      titel: 'Your {{n}}-day streak is at stake 🔥',
      tekst: 'Do a mission today to keep it going.',
      tekstJoker: 'Do a mission today, or this month’s joker will be used.',
    },
    geenToestemming: 'Turn on notifications for Mooove in your phone’s settings.',
    alleenOpTelefoon: 'Reminders only work in the app on your phone.',
    kanaal: 'Reminders',
  },
  es: {
    kop: 'RECORDATORIOS',
    avond: {
      label: 'La noche anterior',
      uitleg: 'A las 21:00 verás qué alarma de la mañana y qué misiones tienes para mañana.',
      titel: 'Mañana a las {{tijd}}: {{naam}}',
      tekst: 'Prepara tu teléfono para {{missies}}.',
    },
    streak: {
      label: 'Racha en peligro',
      uitleg: 'Un aviso a las 19:00 si hoy aún no has hecho ninguna misión.',
      titel: 'Tu racha de {{n}} días está en juego 🔥',
      tekst: 'Haz una misión hoy para mantenerla.',
      tekstJoker: 'Haz una misión hoy o se usará el comodín de este mes.',
    },
    geenToestemming: 'Activa las notificaciones de Mooove en los ajustes de tu teléfono.',
    alleenOpTelefoon: 'Los recordatorios solo funcionan en la app del teléfono.',
    kanaal: 'Recordatorios',
  },
  de: {
    kop: 'ERINNERUNGEN',
    avond: {
      label: 'Am Abend davor',
      uitleg: 'Um 21:00 Uhr siehst du, welcher Morgenwecker und welche Missionen morgen anstehen.',
      titel: 'Morgen um {{tijd}}: {{naam}}',
      tekst: 'Leg dein Handy bereit für {{missies}}.',
    },
    streak: {
      label: 'Serie in Gefahr',
      uitleg: 'Ein Hinweis um 19:00 Uhr, wenn du heute noch keine Mission gemacht hast.',
      titel: 'Deine Serie von {{n}} Tagen steht auf dem Spiel 🔥',
      tekst: 'Mach heute noch eine Mission, um sie zu halten.',
      tekstJoker:
        'Mach heute noch eine Mission, sonst wird dein Joker für diesen Monat eingesetzt.',
    },
    geenToestemming: 'Erlaube Mitteilungen für Mooove in den Einstellungen deines Handys.',
    alleenOpTelefoon: 'Erinnerungen funktionieren nur in der App auf deinem Handy.',
    kanaal: 'Erinnerungen',
  },
  fr: {
    kop: 'RAPPELS',
    avond: {
      label: 'La veille au soir',
      uitleg: 'À 21 h, tu vois quelle alarme du matin et quelles missions t’attendent demain.',
      titel: 'Demain à {{tijd}} : {{naam}}',
      tekst: 'Prépare ton téléphone pour {{missies}}.',
    },
    streak: {
      label: 'Série en danger',
      uitleg: 'Un petit rappel à 19 h si tu n’as pas encore fait de mission aujourd’hui.',
      titel: 'Ta série de {{n}} jours est en jeu 🔥',
      tekst: 'Fais une mission aujourd’hui pour la garder.',
      tekstJoker: 'Fais une mission aujourd’hui, sinon ton joker du mois sera utilisé.',
    },
    geenToestemming: 'Active les notifications de Mooove dans les réglages de ton téléphone.',
    alleenOpTelefoon: 'Les rappels ne fonctionnent que dans l’app sur ton téléphone.',
    kanaal: 'Rappels',
  },
  zh: {
    kop: '提醒',
    avond: {
      label: '前一天晚上',
      uitleg: '晚上 9 点告诉你明天早上设了哪个闹钟和哪些任务。',
      titel: '明天 {{tijd}}：{{naam}}',
      tekst: '为{{missies}}准备好你的手机。',
    },
    streak: {
      label: '连续纪录有危险',
      uitleg: '如果你今天还没做任务，晚上 7 点提醒你一下。',
      titel: '你连续 {{n}} 天的纪录岌岌可危 🔥',
      tekst: '今天做一个任务，保持下去。',
      tekstJoker: '今天做一个任务，否则会用掉本月的补签卡。',
    },
    geenToestemming: '请在手机设置中为 Mooove 开启通知。',
    alleenOpTelefoon: '提醒只能在手机上的应用中使用。',
    kanaal: '提醒',
  },
};
