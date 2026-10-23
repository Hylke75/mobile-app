import * as Crypto from 'expo-crypto';
import AlarmScheduler, {
  type AlarmMetadata,
  type AlarmPermissionResponse,
  type AlarmScheduleInput,
  type AlarmWeekday,
} from 'react-native-alarm-scheduler';

import { isStreng, MISSIE_TIMEOUT_MINUTEN, WAKKERCHECK_MINUTEN } from '@/constants/alarm';
import type { Alarm } from '@/types/app';

export const alarmenBeschikbaar = true;

export type WekkerType = 'alarm' | 'test' | 'wakkercheck';

export type Wekker = {
  alarmId: string;
  occurrenceId?: string;
  type: WekkerType;
  snoozes: number;
  missieBezig: boolean;
  doorSysteemGestopt: boolean;
};

const LAUNCH_URI = 'mooove://wekker?alarmId={alarmId}';

function basisOpties(
  titel: string,
  metadata: AlarmMetadata,
  streng: boolean,
): Pick<AlarmScheduleInput, 'ios' | 'android'> {
  if (!streng) {
    return {
      ios: {
        metadata,
        alertTitle: titel,
        alertActionMode: 'default',
        stopButtonTitle: 'Stop',
        secondaryButtonTitle: 'Open Mooove',
        secondaryButtonBehavior: 'openApp',
        stopIntentBehavior: 'recordOnly',
      },
      android: {
        alertBody: 'Tijd om te bewegen',
        launchUri: LAUNCH_URI,
        maxRingDurationSeconds: 300,
      },
    };
  }
  return {
    ios: {
      metadata,
      alertTitle: titel,
      alertActionMode: 'openAppOnly',
      secondaryButtonTitle: 'Start missie',
      secondaryButtonBehavior: 'openApp',
      stopIntentBehavior: 'rescheduleImmediate',
    },
    android: {
      alertBody: 'Rond je missie af om het alarm te stoppen',
      launchUri: LAUNCH_URI,
      maxRingDurationSeconds: 0,
    },
  };
}

function alarmInput(alarm: Alarm, versie: string): AlarmScheduleInput {
  const [uur, minuut] = alarm.tijd.split(':').map(Number);
  // Alleen "Vrij" heeft een stopknop; alle andere niveaus openen de app voor snooze of missie
  const streng = alarm.niveau !== 'Vrij';
  return {
    id: alarm.id,
    hour: uur ?? 7,
    minute: minuut ?? 0,
    title: alarm.naam,
    weekdays: alarm.dagen.map((d) => (d + 1) as AlarmWeekday),
    ...basisOpties(
      alarm.naam,
      { type: 'alarm', niveau: alarm.niveau, versie, streng: isStreng(alarm.niveau) },
      streng,
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

function versieVan(alarm: Alarm): string {
  return [alarm.tijd, alarm.dagen.join(''), alarm.niveau, alarm.naam].join('|');
}

// Brengt de native alarmen in lijn met de alarmen uit de database
export async function synchroniseer(alarms: Alarm[]): Promise<void> {
  const rechten = await AlarmScheduler.getPermissionsAsync();
  if (!rechten.canScheduleExactAlarms) return;

  const gepland = await AlarmScheduler.getScheduledAlarmsAsync();
  const gewenst = new Map(alarms.filter((a) => a.aan).map((a) => [a.id, a]));

  for (const native of gepland) {
    if (native.metadata?.type !== 'alarm') continue;
    const alarm = gewenst.get(native.id);
    if (!alarm || native.metadata?.versie !== versieVan(alarm)) {
      await AlarmScheduler.cancelAlarmAsync(native.id);
    }
  }

  const nogGepland = new Set(
    (await AlarmScheduler.getScheduledAlarmsAsync()).map((native) => native.id),
  );
  for (const alarm of gewenst.values()) {
    if (!nogGepland.has(alarm.id)) {
      await AlarmScheduler.scheduleAlarmAsync(alarmInput(alarm, versieVan(alarm)));
    }
  }
}

export async function annuleerAlarm(id: string): Promise<void> {
  await AlarmScheduler.cancelAlarmAsync(id);
}

export async function planTestAlarm(seconden: number): Promise<string> {
  const id = Crypto.randomUUID();
  const nu = new Date();
  const op = new Date(nu.getTime() + seconden * 1000);
  await AlarmScheduler.scheduleAlarmAsync({
    id,
    hour: op.getHours(),
    minute: op.getMinutes(),
    timestamp: op.getTime(),
    title: 'Mooove testalarm',
    ...basisOpties('Mooove testalarm', { type: 'test' }, false),
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
    title: 'Wakker-check',
    ...basisOpties('Wakker-check', { type: 'wakkercheck', alarmId }, true),
  });
}

function leesWekker(
  alarmId: string,
  occurrenceId: string | undefined,
  metadata: AlarmMetadata | undefined,
  doorSysteemGestopt: boolean,
): Wekker {
  const type = (metadata?.type as WekkerType | undefined) ?? 'alarm';
  return {
    alarmId,
    occurrenceId,
    type,
    snoozes: Number(metadata?.snoozes ?? 0),
    missieBezig: metadata?.missie === 'bezig',
    doorSysteemGestopt,
  };
}

// Leest of de app geopend is door een afgaand alarm
export async function huidigeWekker(): Promise<Wekker | null> {
  const handoff = await AlarmScheduler.getPendingNativeAlarmHandoffAsync();
  const context = await AlarmScheduler.getCurrentAlarmContextAsync();
  await AlarmScheduler.clearPendingNativeAlarmHandoffAsync();

  if (context && (context.state === 'alerting' || handoff)) {
    if (handoff?.action === 'nativeStop' && context.metadata?.streng !== false) {
      await AlarmScheduler.scheduleNativeAlarmBackupAsync(context.id, 0.1);
    }
    return leesWekker(
      context.id,
      context.occurrenceId,
      context.metadata,
      handoff?.action === 'nativeStop',
    );
  }
  if (handoff && handoff.action !== 'nativeStop') {
    return leesWekker(handoff.alarmId, undefined, undefined, false);
  }
  return null;
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

// Stelt het alarm uit; het gaat na het opgegeven aantal minuten opnieuw af
export async function stelUit(
  wekker: Wekker,
  minuten: number,
  extra: AlarmMetadata = {},
): Promise<string | undefined> {
  if (!wekker.occurrenceId) {
    await AlarmScheduler.completeNativeAlarmAsync(wekker.alarmId);
    return undefined;
  }
  const resultaat = await AlarmScheduler.resolveAlarmOccurrenceAsync(wekker.occurrenceId, {
    outcome: 'deferred',
    next: { delaySeconds: minuten * 60, relationship: 'deferred', metadata: extra },
    idempotencyKey: `uitstel:${wekker.occurrenceId}:${minuten}:${JSON.stringify(extra)}`,
  });
  return resultaat.nextOccurrence?.occurrenceId;
}

// Zet het alarm stil terwijl de missie loopt; zonder afronding gaat het na een paar minuten opnieuw
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
  // Herhalende alarmen moeten bij de volgende keer weer volledig afgeschermd zijn
  await AlarmScheduler.resetNativeAlarmCompletionAsync(alarmId);
}

export async function verwijderEenmaligAlarm(alarmId: string): Promise<void> {
  await AlarmScheduler.cancelAlarmAsync(alarmId).catch(() => false);
}
