import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n';
import {
  HERINNERING_PREFIX,
  STANDAARD_HERINNERINGEN,
  type Herinnering,
  type HerinneringInstellingen,
} from '@/lib/herinneringPlan';
import { leesLokaal, schrijfLokaal, SLEUTELS } from '@/lib/opslag';

export const herinneringenBeschikbaar = true;

const KANAAL = 'herinneringen';

// Herinneringen mogen ook verschijnen terwijl de app open is
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let instellingen: HerinneringInstellingen = STANDAARD_HERINNERINGEN;
const luisteraars = new Set<(waarde: HerinneringInstellingen) => void>();
const geladen = leesLokaal<HerinneringInstellingen>(SLEUTELS.herinneringen).then((lokaal) => {
  if (lokaal) instellingen = { ...STANDAARD_HERINNERINGEN, ...lokaal };
  for (const luisteraar of luisteraars) luisteraar(instellingen);
});

export async function leesHerinneringInstellingen(): Promise<HerinneringInstellingen> {
  await geladen;
  return instellingen;
}

export function luisterNaarHerinneringInstellingen(
  luisteraar: (waarde: HerinneringInstellingen) => void,
): () => void {
  luisteraars.add(luisteraar);
  return () => luisteraars.delete(luisteraar);
}

export async function zetHerinneringInstellingen(waarde: HerinneringInstellingen): Promise<void> {
  instellingen = waarde;
  await schrijfLokaal(SLEUTELS.herinneringen, waarde);
  for (const luisteraar of luisteraars) luisteraar(waarde);
}

export async function vraagMeldingToestemming(): Promise<boolean> {
  const huidig = await Notifications.getPermissionsAsync();
  if (huidig.granted) return true;
  if (!huidig.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

let wachtrij: Promise<void> = Promise.resolve();

function inWachtrij(taak: () => Promise<void>): Promise<void> {
  const run = wachtrij.then(taak);
  wachtrij = run.catch(() => {});
  return run;
}

async function annuleerOnze(): Promise<void> {
  const gepland = await Notifications.getAllScheduledNotificationsAsync();
  for (const melding of gepland) {
    if (melding.identifier.startsWith(HERINNERING_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(melding.identifier);
    }
  }
}

// Zet precies deze herinneringen klaar en haalt de rest van Mooove weg
export function synchroniseerHerinneringen(lijst: Herinnering[]): Promise<void> {
  return inWachtrij(async () => {
    await annuleerOnze();
    if (!lijst.length || !(await Notifications.getPermissionsAsync()).granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(KANAAL, {
        name: t('herinneringen.kanaal'),
        // Het enum komt via een doorverwijzing die de lint-regel niet volgt
        // eslint-disable-next-line import/namespace
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    for (const herinnering of lijst) {
      await Notifications.scheduleNotificationAsync({
        identifier: herinnering.id,
        content: { title: herinnering.titel, body: herinnering.tekst },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: herinnering.op,
          channelId: KANAAL,
        },
      });
    }
  });
}

// Bij uitloggen of account verwijderen
export function annuleerHerinneringen(): Promise<void> {
  return inWachtrij(annuleerOnze);
}
