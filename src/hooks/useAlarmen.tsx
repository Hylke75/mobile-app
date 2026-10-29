import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { luisterNaarTaal, t } from '@/i18n';
import { doelenUitJson } from '@/constants/oefeningen';
import { useAuth } from '@/hooks/useAuth';
import { toonPremium, usePremium } from '@/hooks/usePremium';
import { alarmenBinnenToegang, alarmToegestaan } from '@/lib/premium';
import { annuleerAlarm, deblokkeerSynchronisatie, synchroniseer } from '@/lib/alarmen';
import { zetGeluidKeuze, type GeluidKeuze } from '@/lib/alarmgeluid';
import { meldFout } from '@/lib/fouten';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';
import { supabase } from '@/lib/supabase';
import type { Alarm, EigenMissie, MissieId, Niveau } from '@/types/app';
import type { AlarmRij, EigenMissieRij } from '@/types/database';

// Het geluid per alarm staat alleen op dit toestel, niet in de database
export type AlarmInvoer = Omit<Alarm, 'id' | 'aan'> & { geluid?: GeluidKeuze };
type AlarmWijziging = Partial<Alarm> & { geluid?: GeluidKeuze };

type AlarmenContextWaarde = {
  alarms: Alarm[];
  geladen: boolean;
  fout: string | null;
  vernieuw: () => Promise<void>;
  herplan: () => void;
  maakAan: (invoer: AlarmInvoer) => Promise<string | null>;
  werkBij: (id: string, invoer: AlarmWijziging) => Promise<string | null>;
  verwijder: (id: string) => Promise<string | null>;
  wisselAan: (id: string) => Promise<string | null>;
  slaOver: (id: string, datum: string | null) => Promise<string | null>;
  eigenMissies: EigenMissie[];
  eigenMap: ReadonlyMap<string, EigenMissie>;
  maakEigenMissie: (
    invoer: Omit<EigenMissie, 'id'>,
  ) => Promise<{ fout: string | null; missie?: EigenMissie }>;
  verwijderEigenMissie: (id: string) => Promise<string | null>;
};

type Opgeslagen = { eigenaar: string; alarms: Alarm[] };
type OpgeslagenEigen = { eigenaar: string; lijst: EigenMissie[] };

function naarEigenMissie(rij: EigenMissieRij): EigenMissie {
  return {
    id: rij.id,
    naam: rij.naam,
    emoji: rij.emoji,
    soort: rij.soort === 'foto' ? 'foto' : 'timer',
    duurSeconden: rij.duur_seconden,
  };
}

const AlarmenContext = createContext<AlarmenContextWaarde | undefined>(undefined);

function naarAlarm(rij: AlarmRij): Alarm {
  return {
    id: rij.id,
    naam: rij.naam,
    tijd: rij.tijd,
    dagen: rij.dagen,
    niveau: rij.niveau as Niveau,
    oefeningen: rij.oefeningen as MissieId[],
    doelen: doelenUitJson(rij.doelen),
    aan: rij.aan,
    overslaanOp: rij.overslaan_op,
    wisselend: rij.wisselend,
    feestdagenOverslaan: rij.feestdagen_overslaan,
  };
}

// Velden van de app naar kolommen in de database
function naarRij({ overslaanOp, feestdagenOverslaan, ...rest }: Partial<Omit<Alarm, 'id'>>) {
  return {
    ...rest,
    ...(overslaanOp === undefined ? {} : { overslaan_op: overslaanOp }),
    ...(feestdagenOverslaan === undefined ? {} : { feestdagen_overslaan: feestdagenOverslaan }),
  };
}

const haalAlarmenOp = () => supabase.from('alarms').select('*').order('tijd');

const sorteer = (lijst: Alarm[]) => [...lijst].sort((a, b) => a.tijd.localeCompare(b.tijd));

export function AlarmenProvider({ children }: { children: ReactNode }) {
  const { user, profiel, startProef } = useAuth();
  const pauzeTot = profiel?.pauze_tot ?? null;
  const pauze = useRef(pauzeTot);
  const toegang = usePremium();
  const toegangRef = useRef(toegang);
  // De lijst hoort bij één gebruiker; na uitloggen of wisselen is hij automatisch leeg
  const [data, setData] = useState<{ eigenaar: string | null; alarms: Alarm[] }>({
    eigenaar: null,
    alarms: [],
  });
  const [fout, setFout] = useState<string | null>(null);
  const eigenaar = user?.id ?? null;
  const userId = eigenaar;
  const geladen = eigenaar !== null && data.eigenaar === eigenaar;
  const alarms = useMemo(() => (geladen ? data.alarms : []), [geladen, data.alarms]);
  const huidig = useRef<Alarm[]>([]);
  // Alleen plannen met een lijst die echt van de server of uit de cache komt;
  // een lege lijst zou anders alle alarmen op het toestel annuleren
  const lijstBekend = useRef(false);
  const serverGeladen = useRef(false);
  const [eigenData, setEigenData] = useState<OpgeslagenEigen | null>(null);
  const eigenMissies = useMemo(
    () => (eigenaar && eigenData?.eigenaar === eigenaar ? eigenData.lijst : []),
    [eigenaar, eigenData],
  );
  const eigenMap = useMemo(() => new Map(eigenMissies.map((m) => [m.id, m])), [eigenMissies]);
  const eigenRef = useRef<ReadonlyMap<string, EigenMissie>>(eigenMap);

  const plan = useCallback((lijst: Alarm[]) => {
    if (!lijstBekend.current) return;
    // Zonder Premium gaan alarmen af zoals de proef of de gratis versie toestaat
    synchroniseer(alarmenBinnenToegang(lijst, toegangRef.current), pauze.current, eigenRef.current)
      .then(() => setFout(null))
      .catch((e) => {
        meldFout(e);
        setFout(t('meldingen.alarmenNietGepland'));
      });
  }, []);

  const zetEnSync = useCallback(
    (id: string, lijst: Alarm[]) => {
      const gesorteerd = sorteer(lijst);
      huidig.current = gesorteerd;
      lijstBekend.current = true;
      serverGeladen.current = true;
      deblokkeerSynchronisatie();
      setData({ eigenaar: id, alarms: gesorteerd });
      schrijfLokaal<Opgeslagen>(SLEUTELS.alarmen, { eigenaar: id, alarms: gesorteerd });
      plan(gesorteerd);
    },
    [plan],
  );

  const herplan = useCallback(() => plan(huidig.current), [plan]);

  // Andere taal: de knoppen en teksten op het native alarm opnieuw zetten
  useEffect(() => luisterNaarTaal(() => plan(huidig.current)), [plan]);

  // Proef gestart of verlopen, of Premium genomen: alles opnieuw inplannen
  useEffect(() => {
    if (toegangRef.current.fase === toegang.fase) return;
    toegangRef.current = toegang;
    plan(huidig.current);
  }, [toegang, plan]);

  // Pauze aan, uit of verlengd: alles opnieuw inplannen
  useEffect(() => {
    pauze.current = pauzeTot;
    plan(huidig.current);
  }, [pauzeTot, plan]);

  const verwerk = useCallback(
    (id: string, resultaat: Awaited<ReturnType<typeof haalAlarmenOp>>) => {
      if (resultaat.error) {
        setFout(t('meldingen.alarmenNietGeladen'));
        return;
      }
      setFout(null);
      zetEnSync(id, resultaat.data.map(naarAlarm));
    },
    [zetEnSync],
  );

  const vernieuw = useCallback(async () => {
    if (!userId) return;
    verwerk(userId, await haalAlarmenOp());
  }, [userId, verwerk]);

  useEffect(() => {
    if (!userId) return;
    let actief = true;
    if (data.eigenaar !== userId) {
      huidig.current = [];
      lijstBekend.current = false;
      serverGeladen.current = false;
    }
    // Eerst de lokale kopie, zodat alarmen ook offline direct zichtbaar zijn
    leesLokaal<Opgeslagen>(SLEUTELS.alarmen).then((lokaal) => {
      if (actief && lokaal?.eigenaar === userId && !serverGeladen.current) {
        // Oudere caches kennen nog geen doelen per oefening
        lokaal = {
          ...lokaal,
          alarms: lokaal.alarms.map((a) => ({ ...a, doelen: a.doelen ?? {} })),
        };
        huidig.current = lokaal.alarms;
        lijstBekend.current = true;
        deblokkeerSynchronisatie();
        setData(lokaal);
      }
    });
    haalAlarmenOp().then((resultaat) => {
      if (actief) verwerk(userId, resultaat);
    });
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') plan(huidig.current);
    });
    return () => {
      actief = false;
      sub.remove();
    };
    // data.eigenaar bewust niet als afhankelijkheid: alleen een andere gebruiker herstart dit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, verwerk, plan]);

  // Eigen missies: eerst de lokale kopie, dan de server
  useEffect(() => {
    if (!userId) return;
    let actief = true;
    leesLokaal<OpgeslagenEigen>(SLEUTELS.eigenMissies).then((lokaal) => {
      if (actief && lokaal?.eigenaar === userId) {
        setEigenData((huidigeData) => (huidigeData?.eigenaar === userId ? huidigeData : lokaal));
      }
    });
    supabase
      .from('eigen_missies')
      .select('*')
      .order('created_at')
      .then(({ data: rijen, error }) => {
        if (!actief || error || !rijen) return;
        const nieuw = { eigenaar: userId, lijst: rijen.map(naarEigenMissie) };
        setEigenData(nieuw);
        schrijfLokaal(SLEUTELS.eigenMissies, nieuw);
      });
    return () => {
      actief = false;
    };
  }, [userId]);

  // Andere eigen missies (naam, duur): ook de native alarmen bijwerken
  useEffect(() => {
    eigenRef.current = eigenMap;
    plan(huidig.current);
  }, [eigenMap, plan]);

  const zetEigen = useCallback((id: string, lijst: EigenMissie[]) => {
    const nieuw = { eigenaar: id, lijst };
    setEigenData(nieuw);
    schrijfLokaal(SLEUTELS.eigenMissies, nieuw);
  }, []);

  const maakEigenMissie = useCallback(
    async (invoer: Omit<EigenMissie, 'id'>) => {
      if (!user) return { fout: t('meldingen.nietIngelogd') };
      const { data: rij, error } = await supabase
        .from('eigen_missies')
        .insert({
          naam: invoer.naam,
          emoji: invoer.emoji,
          soort: invoer.soort,
          duur_seconden: invoer.duurSeconden,
        })
        .select()
        .single();
      if (error) return { fout: t('meldingen.opslaanMisluktInternet') };
      const missie = naarEigenMissie(rij);
      zetEigen(user.id, [...eigenMissies, missie]);
      return { fout: null, missie };
    },
    [user, eigenMissies, zetEigen],
  );

  const maakAan = useCallback(
    async (invoer: AlarmInvoer) => {
      if (!user) return t('meldingen.nietIngelogd');
      if (!alarmToegestaan(huidig.current, toegangRef.current)) {
        toonPremium('alarmen');
        return t('premium.slot.alarmen', { n: toegangRef.current.maxAlarmen ?? 0 });
      }
      // Een nieuw (of teruggezet) alarm begint zonder overgeslagen dag
      const { overslaanOp: _overslaan, geluid, ...velden } = invoer;
      const { data: rij, error } = await supabase
        .from('alarms')
        .insert({
          ...naarRij(velden),
          tijd: velden.tijd,
          dagen: velden.dagen,
          niveau: velden.niveau,
          oefeningen: velden.oefeningen,
          aan: true,
        })
        .select()
        .single();
      if (error) return t('meldingen.opslaanMisluktInternet');
      if (geluid) await zetGeluidKeuze(rij.id, geluid);
      // Het eerste alarm start de (eenmalige) proefperiode
      if (!toegangRef.current.premium) await startProef();
      zetEnSync(user.id, [...huidig.current, naarAlarm(rij)]);
      return null;
    },
    [user, zetEnSync, startProef],
  );

  const werkBij = useCallback(
    async (id: string, invoer: AlarmWijziging) => {
      if (!user) return t('meldingen.nietIngelogd');
      const { id: _id, geluid, ...wijziging } = invoer;
      const { data: rij, error } = await supabase
        .from('alarms')
        .update(naarRij(wijziging))
        .eq('id', id)
        .select()
        .single();
      if (error) return t('meldingen.opslaanMisluktInternet');
      if (geluid) await zetGeluidKeuze(id, geluid);
      zetEnSync(
        user.id,
        huidig.current.map((a) => (a.id === id ? naarAlarm(rij) : a)),
      );
      return null;
    },
    [user, zetEnSync],
  );

  const verwijder = useCallback(
    async (id: string) => {
      if (!user) return t('meldingen.nietIngelogd');
      const { error } = await supabase.from('alarms').delete().eq('id', id);
      if (error) return t('meldingen.verwijderenMisluktInternet');
      await annuleerAlarm(id).catch(() => {});
      await zetGeluidKeuze(id, null);
      zetEnSync(
        user.id,
        huidig.current.filter((a) => a.id !== id),
      );
      return null;
    },
    [user, zetEnSync],
  );

  // Een eigen missie verwijderen haalt hem ook uit de alarmen waarin hij zit
  const verwijderEigenMissie = useCallback(
    async (id: string) => {
      if (!user) return t('meldingen.nietIngelogd');
      const missieId: MissieId = `eigen:${id}`;
      const betrokken = huidig.current.filter((a) => a.oefeningen.includes(missieId));
      if (betrokken.some((a) => a.oefeningen.length === 1)) return t('missies.enigeMissie');
      for (const alarm of betrokken) {
        const { error } = await supabase
          .from('alarms')
          .update({ oefeningen: alarm.oefeningen.filter((o) => o !== missieId) })
          .eq('id', alarm.id);
        if (error) return t('meldingen.verwijderenMisluktInternet');
      }
      const { error } = await supabase.from('eigen_missies').delete().eq('id', id);
      if (error) return t('meldingen.verwijderenMisluktInternet');
      zetEigen(
        user.id,
        eigenMissies.filter((m) => m.id !== id),
      );
      if (betrokken.length) {
        zetEnSync(
          user.id,
          huidig.current.map((a) =>
            a.oefeningen.includes(missieId)
              ? { ...a, oefeningen: a.oefeningen.filter((o) => o !== missieId) }
              : a,
          ),
        );
      }
      return null;
    },
    [user, eigenMissies, zetEigen, zetEnSync],
  );

  const wisselAan = useCallback(
    async (id: string) => {
      const alarm = huidig.current.find((a) => a.id === id);
      if (!alarm) return null;
      if (!alarm.aan && !alarmToegestaan(huidig.current, toegangRef.current)) {
        toonPremium('alarmen');
        return t('premium.slot.alarmen', { n: toegangRef.current.maxAlarmen ?? 0 });
      }
      return werkBij(id, { aan: !alarm.aan });
    },
    [werkBij],
  );

  const slaOver = useCallback(
    (id: string, datum: string | null) => werkBij(id, { overslaanOp: datum }),
    [werkBij],
  );

  return (
    <AlarmenContext.Provider
      value={{
        alarms,
        geladen,
        fout,
        vernieuw,
        herplan,
        maakAan,
        werkBij,
        verwijder,
        wisselAan,
        slaOver,
        eigenMissies,
        eigenMap,
        maakEigenMissie,
        verwijderEigenMissie,
      }}
    >
      {children}
    </AlarmenContext.Provider>
  );
}

export function useAlarmen(): AlarmenContextWaarde {
  const context = useContext(AlarmenContext);
  if (!context) throw new Error('useAlarmen moet binnen een AlarmenProvider gebruikt worden.');
  return context;
}
