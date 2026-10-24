import { t } from '@/i18n';
import { missieInfos, type EigenMissies } from '@/lib/missies';
import { streakInGevaar } from '@/lib/statistiek';
import { dagIndex, hervatOp, naarDatumSleutel, startVanDag } from '@/lib/tijd';
import type { Alarm, Sessie } from '@/types/app';

export type HerinneringInstellingen = { avond: boolean; streak: boolean };

export const STANDAARD_HERINNERINGEN: HerinneringInstellingen = { avond: false, streak: false };

export type Herinnering = { id: string; titel: string; tekst: string; op: Date };

export const HERINNERING_PREFIX = 'mooove-herinnering-';
const AVOND_UUR = 21;
const STREAK_UUR = 19;
// Alleen ochtendalarmen krijgen een melding op de avond ervoor
const OCHTEND_TOT = '12:00';
const DAGEN_VOORUIT = 7;

type Invoer = {
  alarms: Alarm[];
  eigen: EigenMissies;
  sessies: Sessie[];
  weekdoel: number;
  pauzeTot: string | null;
  instellingen: HerinneringInstellingen;
  nu?: Date;
};

// Welke lokale meldingen er nu zouden moeten staan; de native kant plant ze alleen in
export function planHerinneringen({
  alarms,
  eigen,
  sessies,
  weekdoel,
  pauzeTot,
  instellingen,
  nu = new Date(),
}: Invoer): Herinnering[] {
  const lijst: Herinnering[] = [];
  const hervat = hervatOp(pauzeTot, nu);

  if (instellingen.avond) {
    for (let i = 1; i <= DAGEN_VOORUIT; i++) {
      const dag = startVanDag(nu);
      dag.setDate(dag.getDate() + i);
      if (hervat && dag < hervat) continue;
      const sleutel = naarDatumSleutel(dag);
      const eerste = alarms
        .filter(
          (a) =>
            a.aan &&
            a.tijd < OCHTEND_TOT &&
            a.dagen.includes(dagIndex(dag)) &&
            a.overslaanOp !== sleutel,
        )
        .sort((a, b) => a.tijd.localeCompare(b.tijd))[0];
      if (!eerste) continue;
      const op = new Date(dag);
      op.setDate(op.getDate() - 1);
      op.setHours(AVOND_UUR, 0, 0, 0);
      if (op <= nu) continue;
      const missies = missieInfos(eerste.oefeningen, eigen, eerste.doelen).map((m) => m.naam);
      lijst.push({
        id: `${HERINNERING_PREFIX}avond-${sleutel}`,
        titel: t('herinneringen.avond.titel', { tijd: eerste.tijd, naam: eerste.naam }),
        tekst: t('herinneringen.avond.tekst', { missies: missies.join(', ') }),
        op,
      });
    }
  }

  if (instellingen.streak) {
    const op = new Date(nu);
    op.setHours(STREAK_UUR, 0, 0, 0);
    const gevaar = op > nu ? streakInGevaar(sessies, weekdoel, nu) : null;
    if (gevaar) {
      lijst.push({
        id: `${HERINNERING_PREFIX}streak-${naarDatumSleutel(nu)}`,
        titel: t('herinneringen.streak.titel', { n: gevaar.streak }),
        tekst: t(gevaar.joker ? 'herinneringen.streak.tekstJoker' : 'herinneringen.streak.tekst'),
        op,
      });
    }
  }

  return lijst;
}
