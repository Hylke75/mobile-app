// Het alarmsysteem tegen een nagebootste native alarmmodule: inplannen per niveau, pauze,
// overslaan, opnieuw synchroniseren, uitstellen, afronden en alles annuleren bij uitloggen.
import type { Alarm } from '@/types/app';

type MockGepland = { id: string; metadata?: Record<string, unknown>; [k: string]: unknown };

const mockNep = {
  gepland: new Map<string, MockGepland>(),
  rechten: { canScheduleExactAlarms: true },
  context: null as null | {
    id: string;
    occurrenceId?: string;
    state: string;
    metadata?: Record<string, unknown>;
  },
  handoff: null as null | { alarmId: string; timestamp: number; action?: string },
  log: [] as string[],
};

jest.mock('react-native-alarm-scheduler', () => ({
  __esModule: true,
  default: {
    getPermissionsAsync: jest.fn(async () => mockNep.rechten),
    getScheduledAlarmsAsync: jest.fn(async () => [...mockNep.gepland.values()]),
    scheduleAlarmAsync: jest.fn(async (input: MockGepland) => {
      mockNep.log.push(`plan:${input.id}`);
      mockNep.gepland.set(input.id, { ...input, metadata: (input.ios as MockGepland)?.metadata });
    }),
    cancelAlarmAsync: jest.fn(async (id: string) => {
      mockNep.log.push(`annuleer:${id}`);
      return mockNep.gepland.delete(id);
    }),
    getCurrentAlarmContextAsync: jest.fn(async () => mockNep.context),
    getPendingNativeAlarmHandoffAsync: jest.fn(async () => mockNep.handoff),
    clearPendingNativeAlarmHandoffAsync: jest.fn(async () => {
      mockNep.handoff = null;
    }),
    clearPendingAlarmActionsAsync: jest.fn(async () => {}),
    completeNativeAlarmAsync: jest.fn(async (id: string) => mockNep.log.push(`klaar:${id}`)),
    resetNativeAlarmCompletionAsync: jest.fn(async (id: string) => mockNep.log.push(`reset:${id}`)),
    cancelNativeAlarmBackupAsync: jest.fn(async () => true),
    scheduleNativeAlarmBackupAsync: jest.fn(async (id: string, s: number) =>
      mockNep.log.push(`backup:${id}:${s}`),
    ),
    resolveAlarmOccurrenceAsync: jest.fn(async (occ: string, opties: Record<string, unknown>) => {
      mockNep.log.push(`resolve:${occ}:${opties.outcome}`);
      return opties.outcome === 'deferred' ? { nextOccurrence: { occurrenceId: `${occ}-v` } } : {};
    }),
    cancelAlarmOccurrenceAsync: jest.fn(async (occ: string) =>
      mockNep.log.push(`stopvervolg:${occ}`),
    ),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid-test' }));
jest.mock('@/lib/alarmgeluid', () => ({
  leesAlarmgeluid: jest.fn(async () => null),
  leesGeluidKeuzes: jest.fn(async () => ({})),
  geluidVoorAlarm: jest.fn(async () => null),
}));

// eslint-disable-next-line import/first
import AlarmScheduler from 'react-native-alarm-scheduler';
// eslint-disable-next-line import/first
import {
  annuleerAlles,
  deblokkeerSynchronisatie,
  huidigeWekker,
  planWakkerCheck,
  rondWekkerAf,
  startMissieVanuitWekker,
  stelUit,
  synchroniseer,
  syncStatus,
} from '@/lib/alarmen';

const alarm = (extra: Partial<Alarm> = {}): Alarm => ({
  id: 'a1',
  naam: 'Ochtend',
  tijd: '07:00',
  dagen: [0, 1, 2, 3, 4],
  niveau: 'Verplicht',
  oefeningen: ['Squats', 'Bed opmaken'],
  doelen: { Squats: 15 },
  aan: true,
  ...extra,
});

const input = (id = 'a1') =>
  (AlarmScheduler.scheduleAlarmAsync as jest.Mock).mock.calls
    .map((c) => c[0])
    .filter((i) => i.id === id)
    .pop();

beforeEach(() => {
  mockNep.gepland.clear();
  mockNep.rechten = { canScheduleExactAlarms: true };
  mockNep.context = null;
  mockNep.handoff = null;
  mockNep.log = [];
  jest.clearAllMocks();
  deblokkeerSynchronisatie();
  // Zondag 25 oktober 2026, 10:00 (Europe/Amsterdam)
  jest.useFakeTimers({ now: new Date('2026-10-25T10:00:00+01:00'), doNotFake: ['nextTick'] });
});

afterEach(() => jest.useRealTimers());

describe('synchroniseer', () => {
  it('plant een herhalend alarm op de juiste weekdagen (1 = maandag)', async () => {
    await synchroniseer([alarm()]);
    const i = input();
    expect(i.hour).toBe(7);
    expect(i.minute).toBe(0);
    expect(i.weekdays).toEqual([1, 2, 3, 4, 5]);
    expect(i.timestamp).toBeUndefined();
    expect(syncStatus()).toMatchObject({ verwacht: 1, gepland: 1 });
  });

  it('Vrij heeft een stopknop; strengere niveaus openen alleen de app en blijven rinkelen', async () => {
    await synchroniseer([
      alarm({ id: 'vrij', niveau: 'Vrij' }),
      alarm({ id: 'flex', niveau: 'Flexibel' }),
      alarm({ id: 'uit', niveau: 'Uitstelbaar' }),
      alarm({ id: 'verpl', niveau: 'Verplicht' }),
      alarm({ id: 'hard', niveau: 'Hardcore' }),
    ]);
    const vrij = input('vrij');
    expect(vrij.ios.alertActionMode).toBe('default');
    expect(vrij.ios.stopIntentBehavior).toBe('recordOnly');
    expect(vrij.android.maxRingDurationSeconds).toBe(300);
    for (const id of ['flex', 'uit', 'verpl', 'hard']) {
      const streng = input(id);
      expect(streng.ios.alertActionMode).toBe('openAppOnly');
      expect(streng.ios.stopIntentBehavior).toBe('rescheduleImmediate');
      expect(streng.android.maxRingDurationSeconds).toBe(0);
      expect(streng.ios.metadata.afgeschermd).toBe(true);
    }
  });

  it('zet niveau, missies en doelen in de metadata, zodat de missie ook offline werkt', async () => {
    await synchroniseer([alarm({ wisselend: true })]);
    expect(input().ios.metadata).toMatchObject({
      type: 'alarm',
      niveau: 'Verplicht',
      naam: 'Ochtend',
      oefeningen: 'Squats,Bed opmaken',
      wisselend: '1',
    });
    expect(String(input().ios.metadata.doelen)).toContain('15');
  });

  it('plant uitgeschakelde alarmen niet en haalt ze van het toestel', async () => {
    await synchroniseer([alarm()]);
    await synchroniseer([alarm({ aan: false })]);
    expect(mockNep.gepland.has('a1')).toBe(false);
    expect(syncStatus()).toMatchObject({ verwacht: 0, gepland: 0 });
  });

  it('plant niets opnieuw als er niets veranderd is', async () => {
    await synchroniseer([alarm()]);
    mockNep.log = [];
    await synchroniseer([alarm()]);
    expect(mockNep.log).toEqual([]);
  });

  it('plant opnieuw na een wijziging van tijd, niveau of missies', async () => {
    await synchroniseer([alarm()]);
    for (const wijziging of [
      { tijd: '06:30' },
      { niveau: 'Hardcore' as const },
      { oefeningen: ['Plank' as const] },
    ]) {
      mockNep.log = [];
      await synchroniseer([alarm(wijziging)]);
      expect(mockNep.log).toEqual(['annuleer:a1', 'plan:a1']);
    }
    await synchroniseer([alarm({ tijd: '06:30' })]);
    expect(input()).toMatchObject({ hour: 6, minute: 30 });
  });

  it('verwijderde alarmen worden van het toestel gehaald', async () => {
    await synchroniseer([alarm(), alarm({ id: 'a2' })]);
    await synchroniseer([alarm()]);
    expect([...mockNep.gepland.keys()]).toEqual(['a1']);
  });

  it('laat testalarmen en wakker-checks met rust', async () => {
    mockNep.gepland.set('test', { id: 'test', metadata: { type: 'test' } });
    await synchroniseer([]);
    expect(mockNep.gepland.has('test')).toBe(true);
  });

  it('één keer overslaan: alleen het eerste alarm daarna, eenmalig', async () => {
    // Maandag 26 oktober overslaan → dinsdag 27 oktober 07:00
    await synchroniseer([alarm({ overslaanOp: '2026-10-26' })]);
    const i = input();
    expect(i.weekdays).toBeUndefined();
    expect(new Date(i.timestamp).toString()).toContain('Tue Oct 27 2026 07:00');
  });

  it('pauze t/m woensdag: eerste alarm op donderdag, eenmalig', async () => {
    await synchroniseer([alarm()], '2026-10-28');
    expect(new Date(input().timestamp).toString()).toContain('Thu Oct 29 2026 07:00');
  });

  it('zonder toestemming voor exacte alarmen wordt niets ingepland', async () => {
    mockNep.rechten = { canScheduleExactAlarms: false };
    await synchroniseer([alarm()]);
    expect(AlarmScheduler.scheduleAlarmAsync).not.toHaveBeenCalled();
  });

  it('wintertijd: het alarm na de klokwissel staat gewoon op 07:00', async () => {
    jest.setSystemTime(new Date('2026-10-24T22:00:00+02:00'));
    await synchroniseer([alarm({ overslaanOp: '2026-10-26' })]);
    const op = new Date(input().timestamp);
    expect(op.getHours()).toBe(7);
    expect(op.getMinutes()).toBe(0);
  });
});

describe('annuleerAlles (uitloggen / account verwijderen)', () => {
  it('annuleert alles, ook een afgaand alarm, en blokkeert daarna nieuw inplannen', async () => {
    await synchroniseer([alarm(), alarm({ id: 'a2' })]);
    mockNep.context = { id: 'a1', state: 'alerting' };
    await annuleerAlles();
    expect(mockNep.gepland.size).toBe(0);
    expect(mockNep.log).toEqual(expect.arrayContaining(['klaar:a1', 'klaar:a2']));
    await synchroniseer([alarm()]);
    expect(mockNep.gepland.size).toBe(0);
    deblokkeerSynchronisatie();
    await synchroniseer([alarm()]);
    expect(mockNep.gepland.size).toBe(1);
  });
});

describe('afgaand alarm', () => {
  it('leest niveau, missies en snoozes uit de native context', async () => {
    mockNep.context = {
      id: 'a1',
      occurrenceId: 'o1',
      state: 'alerting',
      metadata: { type: 'alarm', niveau: 'Uitstelbaar', oefeningen: 'Squats,Plank', snoozes: '2' },
    };
    expect(await huidigeWekker()).toMatchObject({
      alarmId: 'a1',
      occurrenceId: 'o1',
      niveau: 'Uitstelbaar',
      oefeningen: ['Squats', 'Plank'],
      snoozes: 2,
      missieBezig: false,
    });
  });

  it('stop bij een afgeschermd alarm: het alarm gaat direct opnieuw af', async () => {
    mockNep.context = { id: 'a1', state: 'alerting', metadata: { afgeschermd: true } };
    mockNep.handoff = { alarmId: 'a1', timestamp: Date.now(), action: 'nativeStop' };
    expect(await huidigeWekker()).not.toBeNull();
    expect(mockNep.log).toContain('backup:a1:0.1');
  });

  it('stop bij Vrij: gewoon gestopt, geen wekkerscherm', async () => {
    mockNep.context = { id: 'a1', state: 'stopped', metadata: { afgeschermd: false } };
    mockNep.handoff = { alarmId: 'a1', timestamp: Date.now(), action: 'nativeStop' };
    expect(await huidigeWekker()).toBeNull();
    expect(mockNep.log).toEqual([]);
  });

  it('een handoff ouder dan 15 minuten wordt genegeerd', async () => {
    mockNep.context = { id: 'a1', state: 'stopped' };
    mockNep.handoff = { alarmId: 'a1', timestamp: Date.now() - 16 * 60_000 };
    expect(await huidigeWekker()).toBeNull();
  });

  it('snooze stelt de occurrence 9 minuten uit en telt mee', async () => {
    const wekker = {
      alarmId: 'a1',
      occurrenceId: 'o1',
      type: 'alarm' as const,
      snoozes: 1,
      missieBezig: false,
    };
    await stelUit(wekker, 9, { snoozes: 2 });
    const [, opties] = (AlarmScheduler.resolveAlarmOccurrenceAsync as jest.Mock).mock.calls[0];
    expect(opties).toMatchObject({
      outcome: 'deferred',
      next: { delaySeconds: 540, metadata: { snoozes: 2 } },
    });
  });

  it('missie starten: alarm 10 minuten stil, gaat daarna opnieuw af als de missie niet klaar is', async () => {
    const wekker = {
      alarmId: 'a1',
      occurrenceId: 'o1',
      type: 'alarm' as const,
      snoozes: 0,
      missieBezig: false,
    };
    const vervolg = await startMissieVanuitWekker(wekker);
    const [, opties] = (AlarmScheduler.resolveAlarmOccurrenceAsync as jest.Mock).mock.calls[0];
    expect(opties.next).toMatchObject({ delaySeconds: 600, metadata: { missie: 'bezig' } });
    expect(vervolg).toBe('o1-v');
  });

  it('zonder occurrence valt uitstellen terug op een eenmalige herhaling', async () => {
    await stelUit({ alarmId: 'a1', type: 'alarm', snoozes: 0, missieBezig: false }, 9);
    expect(mockNep.log).toContain('backup:a1:540');
  });

  it('missie klaar: vervolg geannuleerd, occurrence afgerond en klaar voor de volgende keer', async () => {
    await rondWekkerAf('a1', 'o1', 'o1-v');
    expect(mockNep.log).toEqual([
      'stopvervolg:o1-v',
      'resolve:o1:completed',
      'klaar:a1',
      'reset:a1',
    ]);
  });

  it('Hardcore: de wakker-check gaat 5 minuten later af en is afgeschermd', async () => {
    await planWakkerCheck('a1');
    const i = input('uuid-test');
    expect(i.timestamp - Date.now()).toBe(5 * 60_000);
    expect(i.ios.metadata).toMatchObject({ type: 'wakkercheck', alarmId: 'a1', afgeschermd: true });
  });
});
