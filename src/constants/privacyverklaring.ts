// Inhoud van docs/store/privacyverklaring.md, zodat de verklaring ook offline in de app te lezen is.
// Pas beide aan als de verklaring verandert.
export const PRIVACY_BIJGEWERKT = '24 oktober 2026';

export type PrivacySectie = { kop: string; alineas?: string[]; punten?: string[] };

export const PRIVACYVERKLARING: PrivacySectie[] = [
  {
    kop: 'Over deze verklaring',
    alineas: [
      'Mooove is een wekker-app die je helpt om \'s ochtends in beweging te komen. Mooove wordt aangeboden door Link & Lead ("wij"). Hier lees je welke gegevens we verwerken, waarom, en welke rechten je hebt.',
    ],
  },
  {
    kop: 'Welke gegevens verwerken we?',
    alineas: ['We bewaren deze gegevens zolang je account bestaat:'],
    punten: [
      'E-mailadres: om in te loggen met een eenmalige code en je account te beheren.',
      'Voornaam: om je in de app te begroeten.',
      'Alarmen (tijd, dagen, niveau, gekozen oefeningen en aantallen, naam): om je alarmen in te plannen en op al je toestellen beschikbaar te maken.',
      'Missieresultaten (start- en eindtijd, oefeningen, aantal herhalingen, voltooid of afgebroken): om je streak, voortgang en badges te tonen.',
      'Weekdoel en datum van je laatste geslaagde alarmtest: om je instellingen en alarm-check te tonen.',
    ],
  },
  {
    kop: 'Camera',
    alineas: [
      'Mooove gebruikt de camera tijdens een missie om oefeningen te herkennen (bijvoorbeeld het tellen van squats), om te meten of het lichter wordt als je de gordijnen opent, en voor een foto als bevestiging dat je bed is opgemaakt.',
      'Deze beelden worden uitsluitend op je eigen toestel verwerkt. Ze worden nooit opgeslagen, nooit naar onze servers gestuurd en nooit met anderen gedeeld. De bevestigingsfoto wordt direct na het maken weer verwijderd. Mooove neemt geen geluid op.',
    ],
  },
  {
    kop: 'Alleen op je toestel',
    alineas: [
      'Een eigen alarmgeluid dat je kiest, blijft op je toestel en wordt niet naar ons verstuurd. Hetzelfde geldt voor de lokale kopie van je alarmen en voortgang, die Mooove bewaart zodat de app ook zonder internet werkt.',
    ],
  },
  {
    kop: 'Wat we niet doen',
    punten: [
      'We tonen geen advertenties en gebruiken geen advertentie- of trackingdiensten.',
      'We verkopen of delen je gegevens niet met derden voor marketing.',
      'We verwerken geen gezondheids- of medische gegevens.',
    ],
  },
  {
    kop: 'Verwerkers',
    alineas: [
      'Je gegevens worden opgeslagen bij Supabase (database en inloggen), in een datacenter in de Europese Unie (Frankfurt, Duitsland). Supabase verwerkt de gegevens uitsluitend in onze opdracht.',
    ],
  },
  {
    kop: 'Grondslag',
    alineas: [
      'We verwerken je gegevens omdat dit nodig is om de app aan je te leveren (uitvoering van de overeenkomst, artikel 6 lid 1 sub b AVG).',
    ],
  },
  {
    kop: 'Je rechten',
    alineas: [
      'Je hebt het recht om je gegevens in te zien, te corrigeren en te laten verwijderen. Via Profiel → Mijn gegevens downloaden krijg je direct een kopie van al je gegevens. Je kunt je account en al je gegevens op elk moment zelf verwijderen via Profiel → Account verwijderen. Alle gegevens worden dan direct en definitief gewist.',
      'Heb je een klacht over hoe we met je gegevens omgaan? Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.',
    ],
  },
  {
    kop: 'Beveiliging',
    alineas: [
      'Gegevens worden versleuteld verzonden (HTTPS). Je sessie wordt versleuteld op je toestel bewaard. In de database kan elke gebruiker alleen bij zijn eigen gegevens.',
    ],
  },
  {
    kop: 'Contact',
    alineas: ['Link & Lead — hylke@linkandlead.nl'],
  },
];
