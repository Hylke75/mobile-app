import type { Vertalingen } from '@/i18n/talen';

// Teksten voor eigen missies en duur-aanduidingen
const nl = {
  minuten: '{{n}} min',
  foto: '1 foto',
  eigenTitel1: 'JOUW ',
  eigenTitel2: 'MISSIE.',
  instructieTimer: 'Start de timer en doe je missie tot hij klaar is. Laat de app open.',
  instructieFoto: 'Doe je missie en maak daarna een foto als bevestiging.',
  spraak1: 'Daar gaan we!',
  spraak2: 'Goed bezig, ga zo door.',
  spraak3: 'Bijna klaar!',
  enigeMissie: 'Deze missie is de enige in een alarm. Voeg daar eerst een andere missie toe.',
};

export const missies: Vertalingen<typeof nl> = {
  nl,
  en: {
    minuten: '{{n}} min',
    foto: '1 photo',
    eigenTitel1: 'YOUR ',
    eigenTitel2: 'MISSION.',
    instructieTimer: 'Start the timer and do your mission until it’s done. Keep the app open.',
    instructieFoto: 'Do your mission, then take a photo as confirmation.',
    spraak1: 'Here we go!',
    spraak2: 'Nice work, keep going.',
    spraak3: 'Almost done!',
    enigeMissie: 'This is the only mission in one of your alarms. Add another mission there first.',
  },
  es: {
    minuten: '{{n}} min',
    foto: '1 foto',
    eigenTitel1: 'TU ',
    eigenTitel2: 'MISIÓN.',
    instructieTimer:
      'Inicia el temporizador y haz tu misión hasta que termine. Deja la app abierta.',
    instructieFoto: 'Haz tu misión y después haz una foto como confirmación.',
    spraak1: '¡Vamos allá!',
    spraak2: 'Muy bien, sigue así.',
    spraak3: '¡Casi listo!',
    enigeMissie: 'Es la única misión de una de tus alarmas. Añade primero otra misión allí.',
  },
  de: {
    minuten: '{{n}} Min.',
    foto: '1 Foto',
    eigenTitel1: 'DEINE ',
    eigenTitel2: 'MISSION.',
    instructieTimer:
      'Starte den Timer und mach deine Mission, bis er abgelaufen ist. Lass die App offen.',
    instructieFoto: 'Mach deine Mission und fotografiere sie danach als Bestätigung.',
    spraak1: 'Los geht’s!',
    spraak2: 'Gut gemacht, weiter so.',
    spraak3: 'Fast geschafft!',
    enigeMissie:
      'Das ist die einzige Mission in einem deiner Wecker. Füge dort zuerst eine andere Mission hinzu.',
  },
  fr: {
    minuten: '{{n}} min',
    foto: '1 photo',
    eigenTitel1: 'TA ',
    eigenTitel2: 'MISSION.',
    instructieTimer: 'Lance le minuteur et fais ta mission jusqu’à la fin. Laisse l’app ouverte.',
    instructieFoto: 'Fais ta mission, puis prends une photo pour confirmer.',
    spraak1: 'C’est parti !',
    spraak2: 'Bien joué, continue.',
    spraak3: 'Presque fini !',
    enigeMissie:
      'C’est la seule mission d’une de tes alarmes. Ajoutes-y d’abord une autre mission.',
  },
};
