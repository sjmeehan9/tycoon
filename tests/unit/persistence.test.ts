import { describe, expect, it } from 'vitest';

import {
  CAMPAIGN_RULES,
  MAX_INVENTORY_BATCHES_PER_INGREDIENT,
} from '../../src/content/gameContent';
import {
  advanceTick,
  activeServiceJobs,
  candidatePoolForDay,
  closeDay,
  createCampaign,
  defaultStationAssignments,
  inventoryTotals,
  prepareDay,
  resolveEvent,
  setRushSpeed,
  startRush,
  startNextDay,
  togglePause,
  type GameState,
  type SaveEnvelope,
} from '../../src/game';
import {
  BACKUP_SAVE_KEY,
  BrowserSaveStore,
  EVOLUTION_NOTICE,
  LEGACY_BACKUP_SAVE_KEY,
  LEGACY_SAVE_KEY,
  LEGACY_V2_BACKUP_SAVE_KEY,
  LEGACY_V2_SAVE_KEY,
  LEGACY_V3_BACKUP_SAVE_KEY,
  LEGACY_V3_SAVE_KEY,
  SAVE_KEY,
  SaveValidationError,
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
  importEnvelope,
  parseEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import {
  livingRushEnvelope,
  nearVictoryEnvelope,
  parallelServiceEnvelope,
  reportHistoryEnvelope,
} from '../fixtures/campaignFixtures';

const LEGACY_KEYS = [
  LEGACY_V3_SAVE_KEY,
  LEGACY_V3_BACKUP_SAVE_KEY,
  LEGACY_V2_SAVE_KEY,
  LEGACY_V2_BACKUP_SAVE_KEY,
  LEGACY_SAVE_KEY,
  LEGACY_BACKUP_SAVE_KEY,
] as const;

describe('schema-v4 save envelope', () => {
  it.each(['standard', 'hard'] as const)(
    'round-trips one %s campaign idempotently',
    (difficulty) => {
      const source = createSaveEnvelope(createCampaign({ seed: 12_345, difficulty }));
      const once = importEnvelope(serializeEnvelope(source));
      const twice = importEnvelope(serializeEnvelope(once));

      expect(once).toEqual(twice);
      expect(once).toEqual(source);
      expect(once.schemaVersion).toBe(4);
      expect(once.activeRun).toMatchObject({ stateVersion: 4, difficulty });
      expect(once.preferences.evolutionNoticeSeen).toBe(true);
    },
  );

  it('retains and restores only a verified v4 last-known-good payload', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const first = createSaveEnvelope(createCampaign({ seed: 1, difficulty: 'standard' }));
    const second = createSaveEnvelope(createCampaign({ seed: 2, difficulty: 'hard' }));
    store.save(first);
    store.save(second);

    expect(window.localStorage.getItem(BACKUP_SAVE_KEY)).toBe(serializeEnvelope(first));
    window.localStorage.setItem(SAVE_KEY, '{broken');
    const loaded = store.load();
    expect(loaded).toMatchObject({ source: 'backup', recoveryAvailable: true });
    expect(loaded.envelope?.activeRun).toMatchObject({ seed: 1, difficulty: 'standard' });
    expect(store.restoreBackup()).toEqual(first);
    expect(parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')).toEqual(first);
  });

  it('persists difficulty, staff, scheduling, equipment, reports, and venue state', () => {
    let state = createCampaign({ seed: 4_204, difficulty: 'hard' });
    const candidate = state.candidateStaff[0];
    if (!candidate) throw new Error('Expected a daily candidate.');
    state = prepareDay(
      {
        ...state,
        staff: [{ ...candidate, hiredOnDay: 1 }],
        candidateStaff: state.candidateStaff.slice(1),
        venueId: 'departmentStore',
        equipment: {
          grinder: 3,
          espressoMachine: 3,
          batchBrewer: 3,
          refrigeration: 3,
          pos: 3,
          serviceCounter: 3,
        },
      },
      {
        scheduledStaffIds: [candidate.id],
        stationAssignments: defaultStationAssignments('departmentStore', [candidate]),
      },
    );
    const parsed = parseEnvelope(JSON.stringify(createSaveEnvelope(state)));

    expect(parsed?.activeRun).toEqual(state);
    expect(parsed?.activeRun).toMatchObject({
      difficulty: 'hard',
      venueId: 'departmentStore',
      equipment: {
        grinder: 3,
        espressoMachine: 3,
        batchBrewer: 3,
        refrigeration: 3,
        pos: 3,
        serviceCounter: 3,
      },
    });
    expect(parsed?.activeRun?.plan.scheduledStaffIds).toEqual([candidate.id]);
  });

  it('round-trips a ten-person department roster, all roles, schedule, and exact payroll', () => {
    const state = departmentWorkforceState(4_205, 10);
    const expectedPayroll = state.staff.reduce((total, member) => total + member.wageCents, 0);
    const started = startRush(state);
    const parsed = importEnvelope(serializeEnvelope(createSaveEnvelope(started)));

    expect(parsed.activeRun?.staff).toEqual(state.staff);
    expect(parsed.activeRun?.plan.scheduledStaffIds).toEqual(state.staff.map(({ id }) => id));
    expect(parsed.activeRun?.rush?.wageCostCents).toBe(expectedPayroll);
    expect(new Set(parsed.activeRun?.staff.map(({ role }) => role))).toEqual(
      new Set(['barista', 'frontOfHouse', 'manager', 'runner']),
    );
  });

  it('reconciles zero, one, duplicate-role, and ten-person reports across import', () => {
    const scenarios: Array<[string, GameState]> = [
      ['zero', departmentWorkforceState(4_214, 0)],
      ['one', departmentWorkforceState(4_215, 1)],
      ['duplicate-role', duplicateManagerState(4_216)],
      ['ten', departmentWorkforceState(4_217, 10)],
    ];
    for (const [label, planned] of scenarios) {
      const expectedPayroll = planned.staff
        .filter(({ id }) => planned.plan.scheduledStaffIds.includes(id))
        .reduce((total, member) => total + member.wageCents, 0);
      const reported = runToReportState(startRush(planned));
      const imported = importEnvelope(serializeEnvelope(createSaveEnvelope(reported))).activeRun;
      expect(imported?.rush?.wageCostCents, `${label} rush payroll`).toBe(expectedPayroll);
      expect(imported?.report?.wageCostCents, `${label} report payroll`).toBe(expectedPayroll);
    }
  });

  it('rejects impossible roster, schedule, role, ID, candidate-day, and candidate-value imports', () => {
    const oversizedRoster = createSaveEnvelope(departmentWorkforceState(4_206, 13));
    expect(() => importEnvelope(JSON.stringify(oversizedRoster))).toThrow(
      'activeRun.staff exceeds its 12-item limit',
    );

    const oversizedSchedule = createSaveEnvelope(departmentWorkforceState(4_207, 12));
    if (!oversizedSchedule.activeRun) throw new Error('Expected department run.');
    oversizedSchedule.activeRun.plan.scheduledStaffIds = oversizedSchedule.activeRun.staff
      .slice(0, 11)
      .map(({ id }) => id);
    expect(() => importEnvelope(JSON.stringify(oversizedSchedule))).toThrow(
      'scheduledStaffIds exceeds its 10-item limit',
    );

    const ineligibleRole = createSaveEnvelope(createCampaign({ seed: 4_208 }));
    if (!ineligibleRole.activeRun) throw new Error('Expected cart run.');
    const manager = ineligibleRole.activeRun.candidateStaff[2];
    if (!manager) throw new Error('Expected Manager candidate.');
    ineligibleRole.activeRun.staff = [{ ...manager, hiredOnDay: 1 }];
    ineligibleRole.activeRun.candidateStaff = ineligibleRole.activeRun.candidateStaff.filter(
      ({ id }) => id !== manager.id,
    );
    expect(() => importEnvelope(JSON.stringify(ineligibleRole))).toThrow(
      'Every hired role must be eligible',
    );

    const unknownSchedule = createSaveEnvelope(departmentWorkforceState(4_209, 10));
    if (!unknownSchedule.activeRun) throw new Error('Expected department run.');
    unknownSchedule.activeRun.plan.scheduledStaffIds[0] = 'staff-forged-schedule';
    expect(() => importEnvelope(JSON.stringify(unknownSchedule))).toThrow(
      'Every scheduled staff ID must identify a hired team member',
    );

    const wrongDay = createSaveEnvelope(createCampaign({ seed: 4_210 }));
    if (!wrongDay.activeRun) throw new Error('Expected active run.');
    wrongDay.activeRun.candidateStaff = candidatePoolForDay(wrongDay.activeRun.seed, 2);
    expect(() => importEnvelope(JSON.stringify(wrongDay))).toThrow('must belong to the active day');

    const wrongIdentity = createSaveEnvelope(createCampaign({ seed: 4_211 }));
    if (!wrongIdentity.activeRun) throw new Error('Expected active run.');
    wrongIdentity.activeRun.candidateStaff[0]!.name = 'Forged Candidate';
    expect(() => importEnvelope(JSON.stringify(wrongIdentity))).toThrow(
      'name must match its candidate identity',
    );

    const wrongHireDay = createSaveEnvelope(departmentWorkforceState(4_212, 1));
    if (!wrongHireDay.activeRun) throw new Error('Expected active run.');
    wrongHireDay.activeRun.day = 2;
    wrongHireDay.activeRun.candidateStaff = candidatePoolForDay(wrongHireDay.activeRun.seed, 2);
    wrongHireDay.activeRun.staff[0]!.hiredOnDay = 2;
    expect(() => importEnvelope(JSON.stringify(wrongHireDay))).toThrow(
      'hiredOnDay must match its candidate-pool day',
    );
  });

  it('rejects forged rush and report payroll while preserving exact reload outcomes', () => {
    const planned = departmentWorkforceState(4_213, 10);
    const started = setRushSpeed(startRush(planned), 4);
    const midRush = advanceTick(started, 40);
    const restored = importEnvelope(serializeEnvelope(createSaveEnvelope(midRush))).activeRun;
    if (!restored) throw new Error('Expected restored department rush.');
    expect(runToReportState(restored)).toEqual(runToReportState(midRush));

    const forgedRush = createSaveEnvelope(midRush);
    if (!forgedRush.activeRun?.rush) throw new Error('Expected active rush.');
    forgedRush.activeRun.rush.wageCostCents += 1;
    expect(() => importEnvelope(JSON.stringify(forgedRush))).toThrow(
      'rush.wageCostCents must equal the exact scheduled payroll',
    );

    const reportState = runToReportState(startRush(planned));
    const forgedReport = createSaveEnvelope(reportState);
    if (!forgedReport.activeRun?.report) throw new Error('Expected report.');
    forgedReport.activeRun.report.wageCostCents += 1;
    expect(() => importEnvelope(JSON.stringify(forgedReport))).toThrow(
      'report.wageCostCents must equal the exact scheduled payroll',
    );
  });

  it('rejects unknown venues and equipment beyond the commercial third tier', () => {
    const unknownVenue = structuredClone(nearVictoryEnvelope());
    if (!unknownVenue.activeRun) throw new Error('Expected active campaign.');
    (unknownVenue.activeRun as { venueId: string }).venueId = 'airport';
    expect(() => importEnvelope(JSON.stringify(unknownVenue))).toThrow(
      'activeRun.venueId is not supported',
    );

    const futureEquipment = structuredClone(nearVictoryEnvelope());
    if (!futureEquipment.activeRun) throw new Error('Expected active campaign.');
    futureEquipment.activeRun.equipment.grinder = 4;
    expect(() => importEnvelope(JSON.stringify(futureEquipment))).toThrow(
      'equipment.grinder is outside its allowed bounds',
    );
  });

  it('canonicalizes a pre-8.5 v4 rush idempotently and rewrites browser storage', () => {
    const legacy = pre85DepartmentRushEnvelope();
    const imported = importEnvelope(JSON.stringify(legacy));
    const rush = imported.activeRun?.rush;
    if (!rush) throw new Error('Expected canonical active rush.');
    expect(rush.normalQueue[0]).toMatchObject({
      id: 'd1-c2',
      stationId: 'coldBar',
      laneId: 'normal',
    });
    expect(
      rush.recentActivity.find((event) => event.customerId === 'd1-c2' && event.type === 'arrival'),
    ).toMatchObject({ stationId: 'coldBar', laneId: 'normal', jobId: null });
    expect(rush.serviceJobsByStation.espressoBar).toMatchObject({
      id: 'd1-j0',
      stationId: 'espressoBar',
      laneId: 'normal',
    });
    expect(rush.stats.serviceAggregates).toHaveLength(6);
    expect(rush.stats.serviceAggregates[0]?.assignedStaffIds.length).toBeGreaterThan(0);
    expect(importEnvelope(serializeEnvelope(imported))).toEqual(imported);

    window.localStorage.setItem(SAVE_KEY, JSON.stringify(legacy));
    const loaded = new BrowserSaveStore(window.localStorage).load();
    expect(loaded.source).toBe('primary');
    const rewritten = JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? '{}') as {
      activeRun?: { rush?: Record<string, unknown> };
    };
    expect(rewritten.activeRun?.rush).not.toHaveProperty('queue');
    expect(rewritten.activeRun?.rush).not.toHaveProperty('activeService');
    expect(rewritten.activeRun?.rush).toHaveProperty('normalQueue');
    expect(rewritten.activeRun?.rush).toHaveProperty('serviceJobsByStation');
  });

  it('canonicalizes old report causes honestly and keeps new causes byte-stable and historical', () => {
    const generatedEnvelope = completeReport(70, 'standard');
    const generatedReport = generatedEnvelope.activeRun?.report;
    if (!generatedReport?.causeSnapshot) throw new Error('Expected immutable report causes.');
    expect(generatedReport.causeSnapshot.events).toHaveLength(2);
    expect(generatedReport.causeSnapshot.wait.totalWaitTicks).toBe(
      generatedReport.serviceAggregates.reduce(
        (total, aggregate) => total + aggregate.totalWaitTicks,
        0,
      ),
    );

    const exported = serializeEnvelope(generatedEnvelope);
    const imported = importEnvelope(exported);
    expect(serializeEnvelope(imported)).toBe(exported);
    expect(imported.activeRun?.report?.causeSnapshot).toEqual(generatedReport.causeSnapshot);

    const settled = closeDay(imported.activeRun!);
    const originalHistory = JSON.stringify(settled.history[0]?.causeSnapshot);
    const nextDay = prepareDay(startNextDay(settled), {
      pricesCents: { espresso: 1_200, longBlack: 1_200 },
      dialIn: 'speed',
    });
    expect(JSON.stringify(nextDay.history[0]?.causeSnapshot)).toBe(originalHistory);
    const reloadedNextDay = importEnvelope(serializeEnvelope(createSaveEnvelope(nextDay)));
    expect(JSON.stringify(reloadedNextDay.activeRun?.history[0]?.causeSnapshot)).toBe(
      originalHistory,
    );

    const older = JSON.parse(exported) as Record<string, unknown>;
    const olderRun = older.activeRun as { report?: Record<string, unknown> };
    if (!olderRun.report) throw new Error('Expected serializable report.');
    delete olderRun.report.causeSnapshot;
    const canonical = importEnvelope(JSON.stringify(older));
    expect(canonical.activeRun?.report?.causeSnapshot).toBeNull();
    expect(importEnvelope(serializeEnvelope(canonical))).toEqual(canonical);
  });

  it('rejects malformed immutable cause details and non-canonical resolved effects', () => {
    const source = completeReport(70, 'standard');
    if (!source.activeRun?.report?.causeSnapshot) {
      throw new Error('Expected a report with immutable causes.');
    }

    const invalidPrice = structuredClone(source);
    invalidPrice.activeRun!.report!.causeSnapshot!.plan.menu[0]!.priceCents = 1_201;
    expect(() => importEnvelope(JSON.stringify(invalidPrice))).toThrow(
      /causeSnapshot\.plan\.menu\[0\]\.priceCents/,
    );

    const invalidWait = structuredClone(source);
    invalidWait.activeRun!.report!.causeSnapshot!.wait.totalWaitTicks += 1;
    expect(() => importEnvelope(JSON.stringify(invalidWait))).toThrow(
      /causeSnapshot\.wait ticks must reconcile/,
    );

    const forgedEffect = structuredClone(source);
    const resolvedEvent = forgedEffect.activeRun!.report!.causeSnapshot!.events[0];
    if (!resolvedEvent) throw new Error('Expected a resolved event.');
    resolvedEvent.effect = { ...resolvedEvent.effect, reputation: 0 };
    expect(() => importEnvelope(JSON.stringify(forgedEffect))).toThrow(
      /effect must match canonical configured content/,
    );

    const forgedChoiceText = structuredClone(source);
    forgedChoiceText.activeRun!.report!.causeSnapshot!.events[0]!.choiceDescription =
      'This was not the choice that resolved during service.';
    expect(() => importEnvelope(JSON.stringify(forgedChoiceText))).toThrow(
      /choiceDescription must match canonical configured content/,
    );
  });

  it('keeps migrated historical service identity independent of current department topology', () => {
    const legacy = structuredClone(nearVictoryEnvelope());
    if (!legacy.activeRun?.report) throw new Error('Expected report fixture.');
    const cartEraReport = { ...legacy.activeRun.report, day: 39, settled: true };
    delete (cartEraReport as Partial<typeof cartEraReport>).serviceAggregates;
    delete (legacy.activeRun.report as Partial<typeof legacy.activeRun.report>).serviceAggregates;
    legacy.activeRun.history = [cartEraReport];

    const imported = importEnvelope(JSON.stringify(legacy));
    for (const report of [imported.activeRun?.report, imported.activeRun?.history[0]]) {
      if (!report) throw new Error('Expected migrated historical report.');
      const settled = report.serviceAggregates.filter((aggregate) => aggregate.served > 0);
      expect(settled).toHaveLength(1);
      expect(settled[0]).toMatchObject({
        stationId: 'espressoBar',
        laneId: 'normal',
        assignedStaffIds: [],
        equipmentIds: [],
        served: 18,
      });
    }
  });

  it('rejects lowered identity counters and active reuse of a completed service job', () => {
    const loweredCustomer = structuredClone(livingRushEnvelope());
    if (!loweredCustomer.activeRun?.rush) throw new Error('Expected active rush fixture.');
    loweredCustomer.activeRun.rush.nextCustomerId = 2;
    expect(() => importEnvelope(JSON.stringify(loweredCustomer))).toThrow(
      'nextCustomerId must follow every retained current-day customer identity',
    );

    const loweredJob = structuredClone(livingRushEnvelope());
    if (!loweredJob.activeRun?.rush) throw new Error('Expected active rush fixture.');
    loweredJob.activeRun.rush.nextServiceJobSequence = 1;
    expect(() => importEnvelope(JSON.stringify(loweredJob))).toThrow(
      'id must precede rush.nextServiceJobSequence',
    );

    const reusedJob = structuredClone(livingRushEnvelope());
    const reusedRush = reusedJob.activeRun?.rush;
    if (!reusedRush?.serviceJobsByStation.espressoBar) {
      throw new Error('Expected active espresso job fixture.');
    }
    reusedRush.serviceJobsByStation.espressoBar.id =
      reusedRush.stats.serviceAggregates[0]?.completedJobIds[0] ?? '';
    expect(() => importEnvelope(JSON.stringify(reusedJob))).toThrow(
      'active service-job ID cannot already be completed',
    );
  });

  it('reloads three active station jobs exactly between stock consumption and completion', () => {
    const paused = parallelServiceEnvelope().activeRun;
    if (!paused?.rush) throw new Error('Expected paused parallel-service fixture.');
    expect(activeServiceJobs(paused.rush)).toHaveLength(3);
    expect(advanceTick(paused)).toBe(paused);
    let midJob = setRushSpeed(togglePause(paused), 4);
    if (!midJob.rush) throw new Error('Expected resumed parallel rush.');
    midJob = {
      ...midJob,
      rush: {
        ...midJob.rush,
        eventTriggerTicks: [midJob.rush.tick + 2],
      },
    };
    const midRush = midJob.rush;
    if (!midRush) throw new Error('Expected configured mid-job rush.');
    expect(activeServiceJobs(midRush)).toHaveLength(3);
    expect(midRush.stats.consumed).toMatchObject({
      houseBeans: 33,
      coldBrewConcentrate: 90,
      ice: 1,
    });
    const restored = importEnvelope(serializeEnvelope(createSaveEnvelope(midJob))).activeRun;
    if (!restored?.rush) throw new Error('Expected restored mid-job rush.');
    expect(restored).toEqual(midJob);
    expect(activeServiceJobs(restored.rush)).toHaveLength(3);
    expect(activeServiceJobs(restored.rush)).toEqual(activeServiceJobs(midRush));
    expect(restored.inventory).toEqual(midJob.inventory);
    expect(restored.rush.stats).toEqual(midRush.stats);

    const uninterrupted = runToReportState(midJob);
    const reloaded = runToReportState(restored);
    expect(JSON.stringify(reloaded)).toBe(JSON.stringify(uninterrupted));
    expect(reloaded).toEqual(uninterrupted);
    expect(reloaded.inventory).toEqual(uninterrupted.inventory);
    expect(reloaded.report).toMatchObject({
      revenueCents: uninterrupted.report?.revenueCents,
      satisfactionPercent: uninterrupted.report?.satisfactionPercent,
      serviceAggregates: uninterrupted.report?.serviceAggregates,
    });
    expect(reloaded.rush?.recentActivity).toEqual(uninterrupted.rush?.recentActivity);
    expect(reloaded.rush?.resolvedEvents).toEqual(uninterrupted.rush?.resolvedEvents);
    expect(reloaded.rush?.resolvedEvents.length).toBeGreaterThan(0);
  });

  it('rejects rush and event saves whose inventory no longer reconciles with consumption', () => {
    const forgedRushInventory = structuredClone(parallelServiceEnvelope());
    const houseBeansBatch = forgedRushInventory.activeRun?.inventory.houseBeans[0];
    if (!houseBeansBatch) throw new Error('Expected retained house beans.');
    houseBeansBatch.quantity += 1;
    expect(() => importEnvelope(JSON.stringify(forgedRushInventory))).toThrow(
      'activeRun.inventory.houseBeans does not conserve active-rush quantity',
    );

    const paused = parallelServiceEnvelope().activeRun;
    if (!paused?.rush) throw new Error('Expected paused parallel-service fixture.');
    const running = togglePause(paused);
    if (!running.rush) throw new Error('Expected resumed parallel-service rush.');
    const eventState = advanceTick({
      ...running,
      rush: {
        ...running.rush,
        eventTriggerTicks: [running.rush.tick + 1],
      },
    });
    expect(eventState.phase).toBe('event');
    expect(() => importEnvelope(serializeEnvelope(createSaveEnvelope(eventState)))).not.toThrow();

    const forgedEventConsumption = createSaveEnvelope(eventState);
    const eventRush = forgedEventConsumption.activeRun?.rush;
    if (!eventRush) throw new Error('Expected event rush state.');
    eventRush.stats.consumed.ice = (eventRush.stats.consumed.ice ?? 0) - 1;
    expect(() => importEnvelope(JSON.stringify(forgedEventConsumption))).toThrow(
      'activeRun.inventory.ice does not conserve active-rush quantity',
    );
  });

  it('derives canonical completed and active job consumption against coherent forgeries', () => {
    const honest = livingRushEnvelope({ paused: true });
    const honestRun = honest.activeRun;
    const honestRush = honestRun?.rush;
    if (!honestRun || !honestRush) throw new Error('Expected an honest living-rush fixture.');
    expect(() => importEnvelope(serializeEnvelope(honest))).not.toThrow();
    expect(honestRush.stats.consumed).toMatchObject({ houseBeans: 44, oatMilk: 440 });
    expect(honestRush.stats.ingredientCostCents).toBe(338);
    const honestInventory = inventoryTotals(honestRun.inventory);
    expect(honestInventory.houseBeans).toBe(
      honestRush.openingInventory.houseBeans +
        honestRush.purchasedInventory.houseBeans -
        (honestRush.stats.consumed.houseBeans ?? 0),
    );
    expect(honestInventory.oatMilk).toBe(
      honestRush.openingInventory.oatMilk +
        honestRush.purchasedInventory.oatMilk -
        (honestRush.stats.consumed.oatMilk ?? 0),
    );

    const coherentConsumptionForgery = structuredClone(honest);
    const forgedRun = coherentConsumptionForgery.activeRun;
    const forgedRush = forgedRun?.rush;
    const forgedBatch = forgedRun?.inventory.houseBeans[0];
    if (!forgedRun || !forgedRush || !forgedBatch) {
      throw new Error('Expected forgeable active-rush beans.');
    }
    forgedRush.stats.consumed.houseBeans = (forgedRush.stats.consumed.houseBeans ?? 0) + 1;
    forgedBatch.quantity -= 1;
    expect(inventoryTotals(forgedRun.inventory).houseBeans).toBe(
      forgedRush.openingInventory.houseBeans +
        forgedRush.purchasedInventory.houseBeans -
        (forgedRush.stats.consumed.houseBeans ?? 0),
    );
    expect(() => importEnvelope(JSON.stringify(coherentConsumptionForgery))).toThrow(
      'rush.stats.consumed.houseBeans must equal canonical completed and active job consumption',
    );

    const forgedIngredientCost = structuredClone(honest);
    if (!forgedIngredientCost.activeRun?.rush) throw new Error('Expected active rush cost.');
    forgedIngredientCost.activeRun.rush.stats.ingredientCostCents += 1;
    expect(() => importEnvelope(JSON.stringify(forgedIngredientCost))).toThrow(
      'rush.stats.ingredientCostCents must equal canonical completed and active job cost',
    );

    const offMenuOrder = structuredClone(honest);
    if (!offMenuOrder.activeRun) throw new Error('Expected active run menu.');
    offMenuOrder.activeRun.plan.activeMenu = ['espresso'];
    expect(() => importEnvelope(JSON.stringify(offMenuOrder))).toThrow(
      'order.drinkId must be selected in the active menu',
    );
  });

  it('rejects current-day customer sequence zero while retaining service job j0', () => {
    const valid = parallelServiceEnvelope();
    expect(() => importEnvelope(serializeEnvelope(valid))).not.toThrow();
    expect(valid.activeRun?.rush?.serviceJobsByStation.espressoBar?.id).toBe('d3-j0');

    const forged = structuredClone(valid);
    const rush = forged.activeRun?.rush;
    if (!rush?.normalQueue[0]) throw new Error('Expected a canonical waiting customer.');
    rush.normalQueue[0].id = 'd3-c0';
    expect(() => importEnvelope(JSON.stringify(forged))).toThrow('customer IDs must match the day');

    const emptyCounter = createSaveEnvelope(startRush(createCampaign({ seed: 3_303 })));
    if (!emptyCounter.activeRun?.rush) throw new Error('Expected an empty current rush.');
    emptyCounter.activeRun.rush.nextCustomerId = 0;
    expect(() => importEnvelope(JSON.stringify(emptyCounter))).toThrow(
      'rush.nextCustomerId is outside its allowed bounds',
    );
  });

  it('rejects malformed, oversized, unsafe, and future v4 imports', () => {
    const valid = createSaveEnvelope(createCampaign({ seed: 8_088 }));
    expect(parseEnvelope('{')).toBeNull();
    expect(() => importEnvelope('x'.repeat(CAMPAIGN_RULES.maximumSaveBytes + 1))).toThrow(
      SaveValidationError,
    );
    expect(() => importEnvelope(JSON.stringify({ ...valid, schemaVersion: 99 }))).toThrow(
      'not supported',
    );
    expect(() =>
      importEnvelope(
        JSON.stringify({
          ...valid,
          activeRun: { ...valid.activeRun, campaignId: '<script>alert(1)</script>' },
        }),
      ),
    ).toThrow('unsafe characters');
  });

  it('rejects forged difficulty and mismatched report difficulty', () => {
    const invalidDifficulty = structuredClone(createSaveEnvelope(createCampaign({ seed: 70 })));
    if (!invalidDifficulty.activeRun) throw new Error('Expected active campaign.');
    (invalidDifficulty.activeRun as { difficulty: string }).difficulty = 'nightmare';
    expect(() => importEnvelope(JSON.stringify(invalidDifficulty))).toThrow(
      'activeRun.difficulty is not supported',
    );

    const report = completeReport(71, 'hard');
    if (!report.activeRun?.report) throw new Error('Expected a completed report.');
    report.activeRun.report.difficulty = 'standard';
    expect(() => importEnvelope(JSON.stringify(report))).toThrow(
      'report difficulty must match its campaign',
    );
  });

  it('rejects impossible report charges and non-conserving stock evidence', () => {
    const charges = structuredClone(reportHistoryEnvelope());
    const group = charges.activeRun?.history[1]?.chargeGroups?.[0];
    if (!group) throw new Error('Expected canonical report charge.');
    group.quantity += 1;
    group.revenueCents += group.priceCents;
    expect(() => importEnvelope(JSON.stringify(charges))).toThrow(
      'quantity must match served sales',
    );

    const state = startRush(createCampaign({ seed: 811 }));
    const tooMany = structuredClone(createSaveEnvelope(state));
    if (!tooMany.activeRun) throw new Error('Expected active run.');
    tooMany.activeRun.inventory.dairyMilk = Array.from(
      { length: MAX_INVENTORY_BATCHES_PER_INGREDIENT + 1 },
      () => ({ quantity: 1, acquiredDay: 1, expiresAfterDay: 3 }),
    );
    expect(() => importEnvelope(JSON.stringify(tooMany))).toThrow(
      `${MAX_INVENTORY_BATCHES_PER_INGREDIENT}-item limit`,
    );
  });

  it('restores the previous v4 primary when a write is interrupted', () => {
    const storage = new InterruptingStorage();
    const store = new BrowserSaveStore(storage);
    const previous = createSaveEnvelope(createCampaign({ seed: 31 }));
    store.save(previous);
    storage.failNextPrimaryWrite = true;
    expect(() => store.save(createSaveEnvelope(createCampaign({ seed: 32 })))).toThrow(
      'could not store',
    );
    expect(store.load().envelope).toEqual(previous);
  });
});

describe('one-time preferences-only legacy boundary', () => {
  it.each([1, 2, 3] as const)(
    'converts version %d through the same pure allowlist and discards all progress',
    (schemaVersion) => {
      const legacy = legacyEnvelope(schemaVersion);
      const before = structuredClone(legacy);
      const reset = importEnvelope(JSON.stringify(legacy));

      expect(legacy).toEqual(before);
      expect(reset).toEqual({
        schemaVersion: 4,
        savedAt: '1970-01-01T00:00:00.000Z',
        activeRun: null,
        preferences: {
          soundEnabled: true,
          ambienceEnabled: false,
          reducedMotion: true,
          onboardingComplete: false,
          activeTab: 'plan',
          evolutionNoticeSeen: false,
        },
        meta: createDefaultMeta(),
      });
      expect(importEnvelope(JSON.stringify(legacy))).toEqual(reset);
    },
  );

  it('defaults missing old preferences but rejects corrupt retained preference values', () => {
    const withoutPreferences = legacyEnvelope(1);
    delete withoutPreferences.preferences;
    expect(importEnvelope(JSON.stringify(withoutPreferences)).preferences).toMatchObject({
      soundEnabled: false,
      ambienceEnabled: false,
      reducedMotion: false,
    });

    const corrupt = legacyEnvelope(3);
    corrupt.preferences = { soundEnabled: 'yes' };
    expect(() => importEnvelope(JSON.stringify(corrupt))).toThrow(
      'preferences.soundEnabled must be boolean',
    );
  });

  it.each([
    [LEGACY_V3_SAVE_KEY, 'legacy-v3', 3],
    [LEGACY_V3_BACKUP_SAVE_KEY, 'legacy-v3', 3],
    [LEGACY_V2_SAVE_KEY, 'legacy-v2', 2],
    [LEGACY_V2_BACKUP_SAVE_KEY, 'legacy-v2', 2],
    [LEGACY_SAVE_KEY, 'legacy-v1', 1],
    [LEGACY_BACKUP_SAVE_KEY, 'legacy-v1', 1],
  ] as const)('resets and quarantines legacy storage candidate %s', (key, source, version) => {
    window.localStorage.setItem(key, JSON.stringify(legacyEnvelope(version)));
    const loaded = new BrowserSaveStore(window.localStorage).load();

    expect(loaded).toMatchObject({ source, recoveryAvailable: false });
    expect(loaded.envelope).toMatchObject({ activeRun: null, meta: createDefaultMeta() });
    expect(loaded.envelope?.preferences).toMatchObject({
      soundEnabled: true,
      ambienceEnabled: false,
      reducedMotion: true,
      onboardingComplete: false,
      evolutionNoticeSeen: true,
    });
    expect(loaded.warning).toContain('campaign progress was reset');
    expect(parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')).toMatchObject({
      activeRun: null,
      preferences: { evolutionNoticeSeen: true },
    });
    for (const legacyKey of LEGACY_KEYS) {
      expect(window.localStorage.getItem(legacyKey)).toBeNull();
    }
  });

  it('prefers verified v4 and cannot resurrect a legacy primary or recovery backup', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const current = createSaveEnvelope(createCampaign({ seed: 404, difficulty: 'hard' }));
    window.localStorage.setItem(LEGACY_V3_SAVE_KEY, JSON.stringify(legacyEnvelope(3)));
    window.localStorage.setItem(LEGACY_BACKUP_SAVE_KEY, JSON.stringify(legacyEnvelope(1)));
    store.save(current);

    expect(store.load()).toMatchObject({ source: 'primary', envelope: current, warning: null });
    for (const key of LEGACY_KEYS) expect(window.localStorage.getItem(key)).toBeNull();

    store.save(createSaveEnvelope(createCampaign({ seed: 405 })));
    window.localStorage.setItem(SAVE_KEY, '{corrupt');
    window.localStorage.setItem(LEGACY_V3_BACKUP_SAVE_KEY, JSON.stringify(legacyEnvelope(3)));
    const recovered = store.load();
    expect(recovered).toMatchObject({ source: 'backup' });
    expect(recovered.envelope?.activeRun).toMatchObject({ seed: 404, difficulty: 'hard' });
    expect(recovered.warning).not.toContain(EVOLUTION_NOTICE);
    expect(window.localStorage.getItem(LEGACY_V3_BACKUP_SAVE_KEY)).toBeNull();
  });

  it('consumes the evolution marker once across autosave, reload, recovery, and export', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const pending = importEnvelope(JSON.stringify(legacyEnvelope(3)));
    expect(pending.preferences.evolutionNoticeSeen).toBe(false);
    store.save(pending);

    const firstReload = store.load();
    expect(firstReload.warning).toBeNull();
    expect(firstReload.envelope?.preferences.evolutionNoticeSeen).toBe(true);
    const exported = serializeEnvelope(firstReload.envelope!);
    expect(importEnvelope(exported)).toEqual(firstReload.envelope);

    store.save(createSaveEnvelope(createCampaign({ seed: 501 })));
    window.localStorage.setItem(SAVE_KEY, '{broken');
    const recovery = store.load();
    expect(recovery.warning).toContain('last-known-good');
    expect(recovery.warning).not.toContain('game has evolved');
    expect(recovery.envelope?.preferences.evolutionNoticeSeen).toBe(true);
  });
});

function legacyEnvelope(schemaVersion: 1 | 2 | 3): Record<string, unknown> {
  const legacy = JSON.parse(JSON.stringify(nearVictoryEnvelope())) as Record<string, unknown>;
  legacy.schemaVersion = schemaVersion;
  legacy.preferences = {
    ...createDefaultPreferences(),
    soundEnabled: true,
    ambienceEnabled: false,
    reducedMotion: true,
    onboardingComplete: true,
    activeTab: 'team',
    evolutionNoticeSeen: true,
    injectedProgress: 'discard-me',
  };
  legacy.meta = {
    ...createDefaultMeta(),
    endlessUnlocked: true,
    achievements: ['cafeFounder'],
    cosmetics: ['classicAwning', 'neonCup'],
    scenarios: ['lanewayClassic', 'festivalWeek'],
    records: [{ campaignId: 'old-progress' }],
  };
  return legacy;
}

function pre85DepartmentRushEnvelope(): Record<string, unknown> {
  const envelope = structuredClone(
    livingRushEnvelope({
      equipment: {
        grinder: 3,
        espressoMachine: 3,
        batchBrewer: 3,
        refrigeration: 3,
        pos: 3,
        serviceCounter: 3,
      },
      scheduledStaffCount: 3,
      venueId: 'departmentStore',
    }),
  ) as unknown as Record<string, unknown>;
  const activeRun = envelope.activeRun as Record<string, unknown>;
  const plan = activeRun.plan as Record<string, unknown>;
  plan.activeMenu = ['flatWhite', 'coldBrew'];
  delete plan.stationAssignments;
  delete plan.expressDrinkIds;
  const rush = activeRun.rush as Record<string, unknown>;
  const normalQueue = rush.normalQueue as Array<Record<string, unknown>>;
  const firstCustomer = normalQueue[0];
  if (!firstCustomer) throw new Error('Expected a waiting migration customer.');
  firstCustomer.order = {
    drinkId: 'coldBrew',
    size: 'regular',
    milk: 'none',
    priceCents: 620,
    ingredientAmounts: [
      { ingredientId: 'coldBrewConcentrate', amount: 90 },
      { ingredientId: 'ice', amount: 1 },
    ],
    preparationTicks: 8,
  };
  const legacyQueue = normalQueue.map(stripCustomerRoute);
  const jobs = rush.serviceJobsByStation as Record<string, Record<string, unknown> | null>;
  const activeJob = jobs.espressoBar;
  if (!activeJob) throw new Error('Expected active migration job.');
  rush.queue = legacyQueue;
  rush.activeService = {
    customer: stripCustomerRoute(activeJob.customer as Record<string, unknown>),
    remainingTicks: activeJob.remainingTicks,
    totalTicks: activeJob.totalTicks,
  };
  const activity = (rush.recentActivity as Array<Record<string, unknown>>).map((event) => {
    const legacyEvent = { ...event };
    delete legacyEvent.stationId;
    delete legacyEvent.laneId;
    delete legacyEvent.jobId;
    return legacyEvent;
  });
  activity.push({
    id: 'd1-e7',
    sequence: 7,
    tick: 47,
    customerId: 'd1-c2',
    segment: 'commuter',
    type: 'arrival',
  });
  rush.recentActivity = activity;
  rush.nextActivitySequence = 8;
  delete (rush.stats as Record<string, unknown>).serviceAggregates;
  delete rush.normalQueue;
  delete rush.expressQueue;
  delete rush.serviceJobsByStation;
  delete rush.consecutiveExpressStartsByStation;
  delete rush.nextServiceJobSequence;
  return envelope;
}

function stripCustomerRoute(customer: Record<string, unknown>): Record<string, unknown> {
  const legacy = { ...customer };
  delete legacy.stationId;
  delete legacy.laneId;
  return legacy;
}

function completeReport(seed: number, difficulty: 'standard' | 'hard'): SaveEnvelope {
  let state = startRush(createCampaign({ seed, difficulty }));
  let safety = 0;
  while (state.phase !== 'report' && safety < 1_000) {
    if (state.phase === 'event') {
      const choiceId = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choiceId) throw new Error('Expected event choice.');
      state = resolveEvent(state, choiceId);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (state.phase !== 'report') throw new Error('Expected report state.');
  return createSaveEnvelope(state);
}

function departmentWorkforceState(seed: number, staffCount: number): GameState {
  const base = createCampaign({ seed });
  const staff: GameState['staff'] = [];
  let day = 1;
  while (staff.length < staffCount) {
    for (const candidate of candidatePoolForDay(seed, day)) {
      if (staff.length >= staffCount) break;
      staff.push({ ...candidate, hiredOnDay: day });
    }
    if (staff.length < staffCount) day += 1;
  }
  const currentPool = candidatePoolForDay(seed, day);
  const hiredIds = new Set(staff.map(({ id }) => id));
  return prepareDay(
    {
      ...base,
      day,
      venueId: 'departmentStore',
      staff,
      candidateStaff: currentPool.filter(({ id }) => !hiredIds.has(id)),
      equipment: {
        grinder: 3,
        espressoMachine: 3,
        batchBrewer: 3,
        refrigeration: 3,
        pos: 3,
        serviceCounter: 3,
      },
    },
    {
      scheduledStaffIds: staff.slice(0, 10).map(({ id }) => id),
      stationAssignments: defaultStationAssignments('departmentStore', staff.slice(0, 10)),
    },
  );
}

function duplicateManagerState(seed: number): GameState {
  const base = createCampaign({ seed });
  const dayOneManager = candidatePoolForDay(seed, 1)[2];
  const dayTwoPool = candidatePoolForDay(seed, 2);
  const dayTwoManager = dayTwoPool[2];
  if (!dayOneManager || !dayTwoManager) throw new Error('Expected deterministic Managers.');
  const staff = [
    { ...dayOneManager, hiredOnDay: 1 },
    { ...dayTwoManager, hiredOnDay: 2 },
  ];
  return prepareDay(
    {
      ...base,
      day: 2,
      venueId: 'departmentStore',
      staff,
      candidateStaff: dayTwoPool.filter(({ id }) => id !== dayTwoManager.id),
    },
    {
      scheduledStaffIds: staff.map(({ id }) => id),
      stationAssignments: defaultStationAssignments('departmentStore', staff),
    },
  );
}

function runToReportState(initial: GameState): GameState {
  let state = initial;
  let safety = 0;
  while (state.phase !== 'report' && safety < 1_000) {
    if (state.phase === 'event') {
      const choiceId = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choiceId) throw new Error('Expected event choice.');
      state = resolveEvent(state, choiceId);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (state.phase !== 'report') throw new Error('Expected report state.');
  return state;
}

class InterruptingStorage implements Storage {
  readonly #values = new Map<string, string>();
  public failNextPrimaryWrite = false;

  public get length(): number {
    return this.#values.size;
  }

  public clear(): void {
    this.#values.clear();
  }

  public getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.#values.delete(key);
  }

  public setItem(key: string, value: string): void {
    if (key === SAVE_KEY && this.failNextPrimaryWrite) {
      this.failNextPrimaryWrite = false;
      throw new DOMException('Simulated quota interruption', 'QuotaExceededError');
    }
    this.#values.set(key, value);
  }
}
