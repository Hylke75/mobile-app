import { GRATIS, PROEF, PROEF_DAGEN, VERDIENMODEL_AAN } from '@/constants/premium';
import type { Alarm, MissieId, Niveau, Oefening } from '@/types/app';
import type { Profiel } from '@/types/database';

// premium: betaald, Lifetime of tester. proefNietGestart: nog geen alarm gezet (zelfde
// beperkingen als de proef). gratis: proef voorbij, gewone wekker zonder missies.
export type Fase = 'premium' | 'proefNietGestart' | 'proef' | 'gratis';

export type Toegang = {
  fase: Fase;
  premium: boolean;
  proefEinde: Date | null;
  // Volledige dagen die nog over zijn (alleen tijdens de proef)
  dagenOver: number | null;
  // Dag van de proef, vanaf 1
  proefDag: number | null;
  maxAlarmen: number | null;
  niveaus: readonly Niveau[] | null;
  // null = alle missies, ook eigen missies
  missies: readonly Oefening[] | null;
  missiesActief: boolean;
  eigenMissies: boolean;
  wisselend: boolean;
  herinneringen: boolean;
  volledigeVoortgang: boolean;
};

type PremiumVelden = Pick<Profiel, 'proef_start' | 'premium_tot' | 'premium_altijd'>;

const DAG = 24 * 60 * 60 * 1000;

export const VOLLEDIG: Toegang = {
  fase: 'premium',
  premium: true,
  proefEinde: null,
  dagenOver: null,
  proefDag: null,
  maxAlarmen: null,
  niveaus: null,
  missies: null,
  missiesActief: true,
  eigenMissies: true,
  wisselend: true,
  herinneringen: true,
  volledigeVoortgang: true,
};

function beperkt(
  fase: Fase,
  grenzen: typeof PROEF | typeof GRATIS,
  extra: Partial<Toegang>,
): Toegang {
  return {
    ...VOLLEDIG,
    fase,
    premium: false,
    maxAlarmen: grenzen.maxAlarmen,
    niveaus: grenzen.niveaus,
    missies: grenzen.missies,
    missiesActief: grenzen.missies.length > 0,
    eigenMissies: false,
    wisselend: false,
    herinneringen: false,
    volledigeVoortgang: false,
    ...extra,
  };
}

export function bepaalToegang(
  profiel: Partial<PremiumVelden> | null | undefined,
  nu = new Date(),
  modelAan = VERDIENMODEL_AAN,
): Toegang {
  if (!modelAan) return VOLLEDIG;
  if (profiel?.premium_altijd) return VOLLEDIG;
  if (profiel?.premium_tot && new Date(profiel.premium_tot).getTime() > nu.getTime()) {
    return VOLLEDIG;
  }
  if (!profiel?.proef_start) return beperkt('proefNietGestart', PROEF, {});
  const start = new Date(profiel.proef_start).getTime();
  const einde = new Date(start + PROEF_DAGEN * DAG);
  if (nu.getTime() < einde.getTime()) {
    return beperkt('proef', PROEF, {
      proefEinde: einde,
      dagenOver: Math.ceil((einde.getTime() - nu.getTime()) / DAG),
      proefDag: Math.floor((nu.getTime() - start) / DAG) + 1,
    });
  }
  return beperkt('gratis', GRATIS, { proefEinde: einde });
}

export function missieToegestaan(toegang: Toegang, id: MissieId): boolean {
  if (toegang.missies === null) return true;
  return (toegang.missies as readonly string[]).includes(id);
}

export function niveauToegestaan(toegang: Toegang, niveau: Niveau): boolean {
  return toegang.niveaus === null || toegang.niveaus.includes(niveau);
}

// Dichtstbijzijnde toegestane niveau: strenge niveaus blijven streng waar dat mag
function niveauBinnen(toegang: Toegang, niveau: Niveau): Niveau {
  if (niveauToegestaan(toegang, niveau)) return niveau;
  const streng = niveau === 'Verplicht' || niveau === 'Hardcore';
  if (streng && niveauToegestaan(toegang, 'Verplicht')) return 'Verplicht';
  return 'Vrij';
}

// Zoals een alarm met deze toegang echt afgaat; de opgeslagen keuzes blijven ongewijzigd,
// zodat alles terugkomt zodra iemand Premium neemt.
export function effectiefAlarm(alarm: Alarm, toegang: Toegang): Alarm {
  if (toegang.premium) return alarm;
  const toegestaan = alarm.oefeningen.filter((id) => missieToegestaan(toegang, id));
  const oefeningen: MissieId[] = toegestaan.length
    ? toegestaan
    : toegang.missies?.length
      ? [toegang.missies[0]!]
      : alarm.oefeningen;
  return {
    ...alarm,
    niveau: toegang.missiesActief ? niveauBinnen(toegang, alarm.niveau) : 'Vrij',
    oefeningen,
    wisselend: false,
  };
}

// Alleen de eerste toegestane alarmen (op volgorde van de lijst) gaan echt af
export function alarmenBinnenToegang(alarms: Alarm[], toegang: Toegang): Alarm[] {
  if (toegang.premium) return alarms;
  let actief = 0;
  return alarms.map((alarm) => {
    const effectief = effectiefAlarm(alarm, toegang);
    if (!alarm.aan) return effectief;
    actief++;
    return toegang.maxAlarmen !== null && actief > toegang.maxAlarmen
      ? { ...effectief, aan: false }
      : effectief;
  });
}

// Mag er nog een alarm bij (aanmaken of aanzetten)?
export function alarmToegestaan(alarms: Alarm[], toegang: Toegang): boolean {
  if (toegang.maxAlarmen === null) return true;
  return alarms.filter((a) => a.aan).length < toegang.maxAlarmen;
}
