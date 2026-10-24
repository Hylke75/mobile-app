import type { Vertalingen } from '@/i18n/talen';

const nl = {
  titel: 'Oeps, er ging iets mis.',
  tekst:
    'Je alarmen blijven gewoon ingesteld. Probeer het opnieuw; lukt het niet, sluit de app dan helemaal af en open hem opnieuw.',
  opnieuw: 'Probeer opnieuw',
  melden: 'Meld deze fout',
  onderwerp: 'Fout in Mooove',
};

export const fout: Vertalingen<typeof nl> = {
  nl,
  en: {
    titel: 'Oops, something went wrong.',
    tekst:
      'Your alarms are still set. Try again; if that doesn’t work, close the app completely and open it again.',
    opnieuw: 'Try again',
    melden: 'Report this error',
    onderwerp: 'Error in Mooove',
  },
  es: {
    titel: 'Vaya, algo ha salido mal.',
    tekst:
      'Tus alarmas siguen configuradas. Inténtalo de nuevo; si no funciona, cierra la app por completo y vuelve a abrirla.',
    opnieuw: 'Reintentar',
    melden: 'Informar del error',
    onderwerp: 'Error en Mooove',
  },
  de: {
    titel: 'Ups, da ist etwas schiefgelaufen.',
    tekst:
      'Deine Alarme bleiben eingestellt. Versuch es noch einmal; klappt es nicht, schließ die App komplett und öffne sie erneut.',
    opnieuw: 'Erneut versuchen',
    melden: 'Fehler melden',
    onderwerp: 'Fehler in Mooove',
  },
  fr: {
    titel: 'Oups, un problème est survenu.',
    tekst:
      'Tes alarmes restent programmées. Réessaie ; si ça ne marche pas, ferme complètement l’app et rouvre-la.',
    opnieuw: 'Réessayer',
    melden: 'Signaler cette erreur',
    onderwerp: 'Erreur dans Mooove',
  },
};
