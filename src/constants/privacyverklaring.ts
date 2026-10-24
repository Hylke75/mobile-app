import { huidigeLocale, t, type Sleutel } from '@/i18n';

// Inhoud van docs/store/privacyverklaring.md, zodat de verklaring ook offline in de app te lezen is.
// De teksten staan per taal in src/i18n/teksten/privacy.ts. Pas alles aan als de verklaring verandert
// (ook site/privacy.html); de Nederlandse tekst is leidend.
export const PRIVACY_BIJGEWERKT = '2026-10-24';

// Datum van de laatste wijziging, opgemaakt voor de huidige taal
export function privacyBijgewerkt(locale: string = huidigeLocale()): string {
  const [jaar, maand, dag] = PRIVACY_BIJGEWERKT.split('-').map(Number);
  return new Date(jaar!, maand! - 1, dag!).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export type PrivacySectie = { kop: string; alineas?: string[]; punten?: string[] };

type SectieSleutels = {
  kop: Sleutel;
  alineas?: readonly Sleutel[];
  punten?: readonly Sleutel[];
};

const SECTIES: readonly SectieSleutels[] = [
  { kop: 'privacy.over.kop', alineas: ['privacy.over.a1'] },
  {
    kop: 'privacy.gegevens.kop',
    alineas: ['privacy.gegevens.a1'],
    punten: [
      'privacy.gegevens.p1',
      'privacy.gegevens.p2',
      'privacy.gegevens.p3',
      'privacy.gegevens.p4',
      'privacy.gegevens.p5',
      'privacy.gegevens.p6',
    ],
  },
  { kop: 'privacy.camera.kop', alineas: ['privacy.camera.a1', 'privacy.camera.a2'] },
  { kop: 'privacy.lokaal.kop', alineas: ['privacy.lokaal.a1'] },
  { kop: 'privacy.foutrapporten.kop', alineas: ['privacy.foutrapporten.a1'] },
  {
    kop: 'privacy.nietDoen.kop',
    punten: ['privacy.nietDoen.p1', 'privacy.nietDoen.p2', 'privacy.nietDoen.p3'],
  },
  { kop: 'privacy.verwerkers.kop', alineas: ['privacy.verwerkers.a1'] },
  { kop: 'privacy.beheer.kop', alineas: ['privacy.beheer.a1'] },
  { kop: 'privacy.grondslag.kop', alineas: ['privacy.grondslag.a1'] },
  { kop: 'privacy.rechten.kop', alineas: ['privacy.rechten.a1', 'privacy.rechten.a2'] },
  { kop: 'privacy.beveiliging.kop', alineas: ['privacy.beveiliging.a1'] },
  { kop: 'privacy.contact.kop', alineas: ['privacy.contact.a1'] },
];

// De verklaring in de huidige taal; geef de t van useTaal() mee in een scherm
export function privacyverklaring(vertaal: (sleutel: Sleutel) => string = t): PrivacySectie[] {
  return SECTIES.map((sectie) => ({
    kop: vertaal(sectie.kop),
    alineas: sectie.alineas?.map((sleutel) => vertaal(sleutel)),
    punten: sectie.punten?.map((sleutel) => vertaal(sleutel)),
  }));
}
