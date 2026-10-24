import * as Crypto from 'expo-crypto';
import AlarmScheduler, {
  type AlarmMetadata,
  type AlarmPermissionResponse,
  type AlarmScheduleInput,
  type AlarmWeekday,
} from 'react-native-alarm-scheduler';

import { MISSIE_TIMEOUT_MINUTEN, WAKKERCHECK_MINUTEN } from '@/constants/alarm';
import { doelenNaarTekst, doelenUitTekst } from '@/constants/oefeningen';
import {
  geluidVoorAlarm,
  leesAlarmgeluid,
  leesGeluidKeuzes,
  type Alarmgeluid,
} from '@/lib/alarmgeluid';
import { huidigeTaal, t } from '@/i18n';
import { planMoment } from '@/lib/tijd';
import { eigenNaarTekst, eigenUitTekst, isEigen, type EigenMissies } from '@/lib/missies';
import type { Alarm, Doelen, EigenMissie, MissieId, Niveau } from '@/types/app';

export const alarmenBeschikbaar = true;

export type WekkerType = 'alarm' | 'test' | 'wakkercheck';

export type Wekker = {
  alarmId: string;
  occurrenceId?: string;
  type: WekkerType;
  snoozes: number;
  missieBezig: boolean;
  niveau?: Niveau;
  naam?: string;
  oefeningen?: MissieId[];
  eigen?: EigenMissie[];
  doelen?: Doelen;
  wisselend?: boolean;
};

// Opent alleen de app; useWekkerRouting leest daarna de native context en navigeert zelf
const LAUNCH_URI = 'mooove://';
const HANDOFF_GELDIG_MS = 15 * 60 * 1000;

function basisOpties(
  titel: string,
  metadata: AlarmMetadata,
  afgeschermd: boolean,
): Pick<AlarmScheduleInput, 'ios' | 'android'> {
  if (!afgeschermd) {
    return {
      ios: {
        metadata: { ...metadata, afgeschermd: false },
        alertTitle: titel,
        alertActionMode: 'default',
        stopButtonTitle: t('systeem.alarm.stop'),
        secondaryButtonTitle: t('systeem.alarm.openApp'),
        secondaryButtonBehavior: 'openApp',
        stopIntentBehavior: 'recordOnly',
      },
      android: {
        alertBody: t('systeem.alarm.tijdOmTeBewegen'),
        launchUri: LAUNCH_URI,
        maxRingDurationSeconds: 300,
      },
    };
  }
  return {
    ios: {
      metadata: { ...metadata, afgeschermd: true },
      alertTitle: titel,
      alertActionMode: 'openAppOnly',
      secondaryButtonTitle: t('systeem.alarm.startMissie'),
      secondaryButtonBehavior: 'openApp',
      stopIntentBehavior: 'rescheduleImmediate',
    },
    android: {
      alertBody: t('systeem.alarm.rondMissieAf'),
      launchUri: LAUNCH_URI,
      maxRingDurationSeconds: 0,
    },
  };
}

// De eigen missies die dit alarm gebruikt, als tekst voor de native metadata
function eigenVan(alarm: Alarm, eigen: EigenMissies): string {
  const gebruikt = alarm.oefeningen
    .filter(isEigen)
    .map((id) => eigen.get(id.slice('eigen:'.length)))
    .filter((m): m is EigenMissie => !!m);
  return gebruikt.length ? eigenNaarTekst(gebruikt) : '';
}

function versieVan(
  alarm: Alarm,
  geluid: Alarmgeluid | null,
  eenmalig: Date | null,
  eigen: EigenMissies,
): string {
  return [
    alarm.tijd,
    alarm.dagen.join(''),
    alarm.niveau,
    alarm.naam,
    alarm.oefeningen.join(','),
    doelenNaarTekst(alarm.doelen),
    geluid?.uri ?? '',
    eenmalig ? `eenmalig:${eenmalig.getTime()}` : '',
    alarm.wisselend ? 'wisselend' : '',
    huidigeTaal(),
    eigenVan(alarm, eigen),
  ].join('|');
}

function alarmInput(
  alarm: Alarm,
  geluid: Alarmgeluid | null,
  eerste: Date | null,
  eigen: EigenMissies,
): AlarmScheduleInput {
  const [uur, minuut] = alarm.tijd.split(':').map(Number);
  // Alleen "Vrij" heeft een stopknop; alle andere niveaus openen de app voor snooze of missie
  return {
    id: alarm.id,
    hour: uur ?? 7,
    minute: minuut ?? 0,
    title: alarm.naam,
    ...(eerste
      ? { timestamp: eerste.getTime() }
      : { weekdays: alarm.dagen.map((d) => (d + 1) as AlarmWeekday) }),
    soundUri: geluid?.uri,
    ...basisOpties(
      alarm.naam,
      {
        type: 'alarm',
        niveau: alarm.niveau,
        naam: alarm.naam,
        oefeningen: alarm.oefeningen.join(','),
        doelen: doelenNaarTekst(alarm.doelen),
        eigen: eigenVan(alarm, eigen),
        wisselend: alarm.wisselend ? '1' : '',
        versie: versieVan(alarm, geluid, eerste, eigen),
      },
      alarm.niveau !== 'Vrij',
    ),
  };
}

export async function haalRechtenOp(): Promise<AlarmPermissionResponse> {
  return AlarmScheduler.getPermissionsAsync();
}

export async function vraagRechtenAan(): Promise<AlarmPermissionResponse> {
  return AlarmScheduler.requestPermissionsAsync();
}

export async function openAlarmInstellingen(): Promise<void> {
  const rechten = await AlarmScheduler.getPermissionsAsync();
  if (rechten.canUseFullScreenIntent === false) {
    await AlarmScheduler.openFullScreenIntentSettingsAsync();
  } else {
    await AlarmScheduler.openAlarmSettingsAsync();
  }
}

let wachtrij: Promise<void> = Promise.resolve();
// Tijdens uitloggen mag niets opnieuw worden ingepland
let geblokkeerd = false;

function inWachtrij(taak: () => Promise<void>): Promise<void> {
  const run = wachtrij.then(taak);
  wachtrij = run.catch(() => {});
  return run;
}

export type SyncStatus = { op: Date; verwacht: number; gepland: number };

let laatsteSync: SyncStatus | null = null;
const syncLuisteraars = new Set<(status: SyncStatus) => void>();

export function syncStatus(): SyncStatus | null {
  return laatsteSync;
}

export function luisterNaarSync(luisteraar: (status: SyncStatus) => void): () => void {
  syncLuisteraars.add(luisteraar);
  return () => syncLuisteraars.delete(luisteraar);
}

export function deblokkeerSynchronisatie(): void {
  geblokkeerd = false;
}

// Brengt de native alarmen in lijn met de alarmen uit de database; runs lopen na elkaar
export function synchroniseer(
  alarms: Alarm[],
  pauzeTot?: string | null,
  eigen: EigenMissies = new Map(),
): Promise<void> {
  return inWachtrij(async () => {
    if (geblokkeerd) return;
    const rechten = await AlarmScheduler.getPermissionsAsync();
    if (!rechten.canScheduleExactAlarms) return;

    const profielGeluid = await leesAlarmgeluid();
    const keuzes = await leesGeluidKeuzes();
    const plan = new Map<string, { geluid: Alarmgeluid | null; eerste: Date | null }>();
    for (const alarm of alarms.filter((a) => a.aan)) {
      const moment = planMoment(alarm, pauzeTot);
      if (moment.soort === 'geen') continue;
      plan.set(alarm.id, {
        geluid: await geluidVoorAlarm(keuzes[alarm.id], profielGeluid),
        eerste: moment.soort === 'eenmalig' ? moment.op : null,
      });
    }
    const gewenst = new Map(alarms.filter((a) => plan.has(a.id)).map((a) => [a.id, a]));
    for (const native of await AlarmScheduler.getScheduledAlarmsAsync()) {
      if (native.metadata?.type !== 'alarm') continue;
      const alarm = gewenst.get(native.id);
      const p = plan.get(native.id);
      if (!alarm || !p || native.metadata?.versie !== versieVan(alarm, p.geluid, p.eerste, eigen)) {
        await AlarmScheduler.cancelAlarmAsync(native.id);
      }
    }

    const nogGepland = new Set(
      (await AlarmScheduler.getScheduledAlarmsAsync()).map((native) => native.id),
    );
    for (const alarm of gewenst.values()) {
      if (nogGepland.has(alarm.id)) continue;
      const p = plan.get(alarm.id)!;
      await AlarmScheduler.scheduleAlarmAsync(alarmInput(alarm, p.geluid, p.eerste, eigen));
    }

    // Controle achteraf: staat elk ingeschakeld alarm echt op het toestel?
    const opToestel = new Set(
      (await AlarmScheduler.getScheduledAlarmsAsync()).map((native) => native.id),
    );
    laatsteSync = {
      op: new Date(),
      verwacht: gewenst.size,
      gepland: [...gewenst.keys()].filter((id) => opToestel.has(id)).length,
    };
    for (const luisteraar of syncLuisteraars) luisteraar(laatsteSync);
  });
}

// Bij uitloggen of account verwijderen: niets mag nog afgaan op dit toestel
export function annuleerAlles(): Promise<void> {
  geblokkeerd = true;
  return inWachtrij(async () => {
    const gepland = await AlarmScheduler.getScheduledAlarmsAsync().catch(() => []);
    const context = await AlarmScheduler.getCurrentAlarmContextAsync().catch(() => null);
    const ids = new Set([...gepland.map((a) => a.id), ...(context ? [context.id] : [])]);
    for (const id of ids) {
      await AlarmScheduler.completeNativeAlarmAsync(id).catch(() => {});
      await AlarmScheduler.cancelAlarmAsync(id).catch(() => false);
    }
    await AlarmScheduler.clearPendingNativeAlarmHandoffAsync().catch(() => {});
    await AlarmScheduler.clearPendingAlarmActionsAsync().catch(() => {});
  });
}

export async function annuleerAlarm(id: string): Promise<void> {
  await AlarmScheduler.cancelAlarmAsync(id);
}

export async function planTestAlarm(seconden: number): Promise<string> {
  const id = Crypto.randomUUID();
  const op = new Date(Date.now() + seconden * 1000);
  await AlarmScheduler.scheduleAlarmAsync({
    id,
    hour: op.getHours(),
    minute: op.getMinutes(),
    timestamp: op.getTime(),
    title: t('systeem.alarm.testalarm'),
    soundUri: (await leesAlarmgeluid())?.uri,
    ...basisOpties(t('systeem.alarm.testalarm'), { type: 'test' }, false),
  });
  return id;
}

export async function planWakkerCheck(alarmId: string): Promise<void> {
  const op = new Date(Date.now() + WAKKERCHECK_MINUTEN * 60 * 1000);
  await AlarmScheduler.scheduleAlarmAsync({
    id: Crypto.randomUUID(),
    hour: op.getHours(),
    minute: op.getMinutes(),
    timestamp: op.getTime(),
    title: t('systeem.alarm.wakkercheck'),
    ...basisOpties(t('systeem.alarm.wakkercheck'), { type: 'wakkercheck', alarmId }, true),
  });
}

function leesWekker(
  alarmId: string,
  occurrenceId: string | undefined,
  metadata: AlarmMetadata | undefined,
): Wekker {
  const oefeningen = metadata?.oefeningen ? String(metadata.oefeningen).split(',') : undefined;
  return {
    alarmId,
    occurrenceId,
    type: (metadata?.type as WekkerType | undefined) ?? 'alarm',
    snoozes: Number(metadata?.snoozes ?? 0),
    missieBezig: metadata?.missie === 'bezig',
    niveau: metadata?.niveau ? (String(metadata.niveau) as Niveau) : undefined,
    naam: metadata?.naam ? String(metadata.naam) : undefined,
    oefeningen: oefeningen as MissieId[] | undefined,
    eigen: metadata?.eigen ? eigenUitTekst(String(metadata.eigen)) : undefined,
    wisselend: metadata?.wisselend === '1',
    doelen: metadata?.doelen ? doelenUitTekst(String(metadata.doelen)) : undefined,
  };
}

function inMs(tijd: number): number {
  return tijd < 1e12 ? tijd * 1000 : tijd;
}

// Leest of er nu een alarm afgaat (of net de app heeft geopend) dat aandacht nodig heeft
export async function huidigeWekker(): Promise<Wekker | null> {
  const handoff = await AlarmScheduler.getPendingNativeAlarmHandoffAsync();
  const context = await AlarmScheduler.getCurrentAlarmContextAsync();
  await AlarmScheduler.clearPendingNativeAlarmHandoffAsync();

  const handoffRecent = handoff ? Date.now() - inMs(handoff.timestamp) < HANDOFF_GELDIG_MS : false;
  const hoortBijContext = Boolean(handoff && context && handoff.alarmId === context.id);

  if (context?.state === 'alerting' || (handoffRecent && hoortBijContext)) {
    const afgeschermd = context!.metadata?.afgeschermd !== false;
    if (handoff?.action === 'nativeStop' && handoff.alarmId === context!.id) {
      // Bij een alarm met stopknop is "stop" gewoon stoppen; bij een afgeschermd alarm niet
      if (!afgeschermd) return null;
      await AlarmScheduler.scheduleNativeAlarmBackupAsync(context!.id, 0.1);
    }
    return leesWekker(context!.id, context!.occurrenceId, context!.metadata);
  }
  return null;
}

// Haalt bij een geopend wekker-scherm de actuele occurrence en metadata op
export async function contextVoor(alarmId: string): Promise<Wekker | null> {
  const context = await AlarmScheduler.getCurrentAlarmContextAsync();
  if (!context || context.id !== alarmId) return null;
  return leesWekker(context.id, context.occurrenceId, context.metadata);
}

export function luisterNaarAlarmen(callback: () => void): () => void {
  const a = AlarmScheduler.addListener('onAlarmTriggered', callback);
  const b = AlarmScheduler.addListener('onAlarmStateChange', (event) => {
    if (event.state === 'alerting') callback();
  });
  return () => {
    a.remove();
    b.remove();
  };
}

// Stelt het afgaande alarm uit; het gaat na het opgegeven aantal minuten opnieuw af
export async function stelUit(
  wekker: Wekker,
  minuten: number,
  extra: AlarmMetadata = {},
): Promise<string | undefined> {
  let occurrenceId = wekker.occurrenceId;
  if (!occurrenceId) occurrenceId = (await contextVoor(wekker.alarmId))?.occurrenceId;
  if (!occurrenceId) {
    // Zonder occurrence kan de bibliotheek niet uitstellen: zet een eenmalige herhaling klaar
    await AlarmScheduler.scheduleNativeAlarmBackupAsync(wekker.alarmId, minuten * 60);
    return undefined;
  }
  const resultaat = await AlarmScheduler.resolveAlarmOccurrenceAsync(occurrenceId, {
    outcome: 'deferred',
    next: { delaySeconds: minuten * 60, relationship: 'deferred', metadata: extra },
    idempotencyKey: `uitstel:${occurrenceId}:${minuten}:${JSON.stringify(extra)}`,
  });
  return resultaat.nextOccurrence?.occurrenceId;
}

// Zet het alarm stil terwijl de missie loopt; zonder afronding gaat het na een tijdje opnieuw
export async function startMissieVanuitWekker(wekker: Wekker): Promise<string | undefined> {
  return stelUit(wekker, MISSIE_TIMEOUT_MINUTEN, { missie: 'bezig', snoozes: wekker.snoozes });
}

export async function rondWekkerAf(
  alarmId: string,
  occurrenceId?: string,
  vervolgOccurrenceId?: string,
): Promise<void> {
  if (vervolgOccurrenceId) {
    await AlarmScheduler.cancelAlarmOccurrenceAsync(vervolgOccurrenceId).catch(() => false);
  }
  if (occurrenceId) {
    await AlarmScheduler.resolveAlarmOccurrenceAsync(occurrenceId, {
      outcome: 'completed',
      idempotencyKey: `klaar:${occurrenceId}`,
    }).catch(() => null);
  }
  await AlarmScheduler.completeNativeAlarmAsync(alarmId);
  await AlarmScheduler.cancelNativeAlarmBackupAsync(alarmId).catch(() => false);
  // Herhalende alarmen moeten bij de volgende keer weer volledig afgeschermd zijn
  await AlarmScheduler.resetNativeAlarmCompletionAsync(alarmId);
}

export async function verwijderEenmaligAlarm(alarmId: string): Promise<void> {
  await AlarmScheduler.cancelAlarmAsync(alarmId).catch(() => false);
}
