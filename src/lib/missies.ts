import {
  doelTekst,
  doelVoor,
  duurTekst,
  OEFENING_INFO,
  oefeningTekst,
  type OefeningInfo,
} from '@/constants/oefeningen';
import { t } from '@/i18n';
import type { Doelen, EigenMissie, MissieId, Oefening } from '@/types/app';

// Eén beschrijving voor elke missie in een alarm, ingebouwd of zelfgemaakt
export type MissieInfo = {
  id: MissieId;
  oefening: Oefening | null;
  eigen: EigenMissie | null;
  naam: string;
  emoji: string;
  methode: OefeningInfo['methode'];
  eenheid: OefeningInfo['eenheid'];
  doel: number;
  doelTekst: string;
  titel: readonly [string, string];
  beschrijving: string;
  instructie: string;
  spraak: string[];
};

export type EigenMissies = ReadonlyMap<string, EigenMissie>;

export const isEigen = (id: string): id is `eigen:${string}` => id.startsWith('eigen:');
export const naarEigenId = (id: string): MissieId => `eigen:${id}`;
export const isOefening = (id: string): id is Oefening => id in OEFENING_INFO;

export function missieInfo(id: MissieId, eigen: EigenMissies, doelen?: Doelen): MissieInfo | null {
  if (isOefening(id)) {
    const info = OEFENING_INFO[id];
    const tekst = oefeningTekst(id);
    return {
      id,
      oefening: id,
      eigen: null,
      naam: tekst.naam,
      emoji: info.emoji,
      methode: info.methode,
      eenheid: info.eenheid,
      doel: doelVoor(id, doelen),
      doelTekst: doelTekst(id, doelen),
      titel: tekst.titel,
      beschrijving: tekst.beschrijving,
      instructie: tekst.instructie,
      spraak: tekst.spraak,
    };
  }
  if (!isEigen(id)) return null;
  const missie = eigen.get(id.slice('eigen:'.length));
  if (!missie) return null;
  const timer = missie.soort === 'timer';
  return {
    id,
    oefening: null,
    eigen: missie,
    naam: missie.naam,
    emoji: missie.emoji,
    methode: timer ? 'timer' : 'foto',
    eenheid: timer ? 'seconden' : 'handeling',
    doel: timer ? missie.duurSeconden : 1,
    doelTekst: timer ? duurTekst(missie.duurSeconden) : t('missies.foto'),
    titel: [t('missies.eigenTitel1'), t('missies.eigenTitel2')],
    beschrijving: missie.naam,
    instructie: timer ? t('missies.instructieTimer') : t('missies.instructieFoto'),
    spraak: [t('missies.spraak1'), t('missies.spraak2'), t('missies.spraak3')],
  };
}

// Alle bekende missies uit een lijst; verwijderde eigen missies vallen weg
export function missieInfos(
  ids: readonly MissieId[],
  eigen: EigenMissies,
  doelen?: Doelen,
): MissieInfo[] {
  return ids.map((id) => missieInfo(id, eigen, doelen)).filter((m): m is MissieInfo => !!m);
}

// Compacte vorm voor de native metadata, zodat eigen missies ook offline bekend zijn
export function eigenNaarTekst(missies: readonly EigenMissie[]): string {
  return JSON.stringify(missies.map((m) => [m.id, m.naam, m.emoji, m.soort, m.duurSeconden]));
}

export function eigenUitTekst(tekst: string | undefined): EigenMissie[] {
  if (!tekst) return [];
  try {
    const lijst = JSON.parse(tekst) as unknown;
    if (!Array.isArray(lijst)) return [];
    return lijst
      .filter(
        (r): r is [string, string, string, string, number] => Array.isArray(r) && r.length === 5,
      )
      .map(([id, naam, emoji, soort, duurSeconden]) => ({
        id: String(id),
        naam: String(naam),
        emoji: String(emoji),
        soort: soort === 'foto' ? 'foto' : 'timer',
        duurSeconden: Number(duurSeconden) || 60,
      }));
  } catch {
    return [];
  }
}

// Wisselende missie: per kalenderdag één missie uit de lijst, steeds een andere
export function missiesVanDag(
  ids: readonly MissieId[],
  wisselend: boolean | undefined,
  datum = new Date(),
): MissieId[] {
  if (!wisselend || ids.length <= 1) return [...ids];
  const dag = Math.floor(
    Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()) / 86400000,
  );
  return [ids[dag % ids.length]!];
}
