import { describe, expect, it } from 'vitest';

import {
  INGREDIENT_IDS,
  MILK_SURCHARGE_CENTS,
  RUSH_ACTIVITY_LIMIT,
  SIZE_SURCHARGE_CENTS,
  emptyInventory,
  emptyPurchases,
} from '../../src/content/gameContent';
import {
  GameRuleError,
  MAX_REPORT_CHARGE_GROUPS,
  advanceTick,
  adjustPlanPrice,
  adjustPlanPurchase,
  buyImprovement,
  closeDay,
  createCampaign,
  defaultStationAssignments,
  inventoryTotals,
  laneForDrink,
  prepareDay,
  resolveEvent,
  serviceQueueCapacity,
  setRushSpeed,
  startNextDay,
  startRush,
  togglePause,
  type Customer,
  type DrinkId,
  type GameState,
  type RushSpeed,
} from '../../src/game';
import { departmentWorkforceEnvelope } from '../fixtures/campaignFixtures';

function runToReport(initial: GameState, choiceId = 'protect-queue'): GameState {
  let state = initial;
  let safety = 0;
  while (state.phase !== 'report' && safety < 1_000) {
    if (state.phase === 'event') {
      const availableChoice =
        state.rush?.pendingEvent?.choices.find((choice) => choice.id === choiceId)?.id ??
        state.rush?.pendingEvent?.choices[0]?.id;
      if (!availableChoice) throw new Error('Event had no available choice.');
      state = resolveEvent(state, availableChoice);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (state.phase !== 'report') throw new Error('Rush did not reach its report.');
  return state;
}

function testCustomer(id: string, waitedTicks = 0, patienceTicks = 1_000): Customer {
  return {
    id,
    segment: 'commuter',
    stationId: 'espressoBar',
    laneId: 'normal',
    order: {
      drinkId: 'espresso',
      size: 'regular',
      milk: 'none',
      priceCents: 400,
      ingredientAmounts: [{ ingredientId: 'houseBeans', amount: 18 }],
      preparationTicks: 20,
    },
    arrivedAtTick: 0,
    patienceTicks,
    waitedTicks,
  };
}

describe('seeded cart engine', () => {
  it('replays equal seed and commands exactly', () => {
    const first = runToReport(startRush(createCampaign({ seed: 7_777 })), 'take-order');
    const second = runToReport(startRush(createCampaign({ seed: 7_777 })), 'take-order');
    expect(first).toEqual(second);
    expect(first.report?.arrivals).toBeGreaterThan(0);
    expect(first.rush?.resolvedEvents).toHaveLength(2);
  });

  it.each([1, 2, 4] satisfies RushSpeed[])('produces the same report at %d×', (speed) => {
    const baseline = runToReport(startRush(createCampaign({ seed: 18_002 })));
    const accelerated = runToReport(
      setRushSpeed(startRush(createCampaign({ seed: 18_002 })), speed),
    );
    expect(accelerated.report).toEqual(baseline.report);
    expect(accelerated.inventory).toEqual(baseline.inventory);
    expect(accelerated.rngState).toBe(baseline.rngState);
    expect(accelerated.rush?.recentActivity).toEqual(baseline.rush?.recentActivity);
    expect(accelerated.rush?.nextActivitySequence).toBe(baseline.rush?.nextActivitySequence);
  });

  it('keeps inactive legacy station and lane coverage empty through reporting', () => {
    const base = createCampaign({ seed: 18_003 });
    const candidate = base.candidateStaff.find((member) => member.role === 'barista');
    if (!candidate) throw new Error('Expected a cart Barista.');
    const hired = { ...candidate, hiredOnDay: 1 };
    const planned = prepareDay(
      {
        ...base,
        equipment: { ...base.equipment, grinder: 1, espressoMachine: 1 },
        staff: [hired],
        candidateStaff: base.candidateStaff.filter(({ id }) => id !== hired.id),
      },
      {
        scheduledStaffIds: [hired.id],
        stationAssignments: defaultStationAssignments('cart', [hired]),
      },
    );
    const started = startRush(planned);
    const reported = runToReport(started);
    const aggregateSets = [
      started.rush?.stats.serviceAggregates,
      reported.report?.serviceAggregates,
    ];

    for (const aggregates of aggregateSets) {
      if (!aggregates) throw new Error('Expected rush and report service aggregates.');
      const active = aggregates.find(
        (aggregate) => aggregate.stationId === 'espressoBar' && aggregate.laneId === 'normal',
      );
      expect(active?.assignedStaffIds).toEqual([hired.id]);
      expect(active?.equipmentIds.length).toBeGreaterThan(0);
      for (const aggregate of aggregates.filter((candidate) => candidate !== active)) {
        expect(aggregate.assignedStaffIds).toEqual([]);
        expect(aggregate.equipmentIds).toEqual([]);
      }
    }
  });

  it('keeps Hard demand seeded and independent of presentation speed', () => {
    const baseline = runToReport(startRush(createCampaign({ seed: 18_102, difficulty: 'hard' })));
    const accelerated = runToReport(
      setRushSpeed(startRush(createCampaign({ seed: 18_102, difficulty: 'hard' })), 4),
    );
    expect(accelerated.report).toEqual(baseline.report);
    expect(accelerated.rngState).toBe(baseline.rngState);
    expect(accelerated.report?.difficulty).toBe('hard');
  });

  it('retains complete canonical charges after the mixed activity feed truncates', () => {
    const planning = prepareDay(createCampaign({ seed: 7_505 }), {
      activeMenu: ['espresso'],
      purchases: { ...emptyPurchases(), houseBeans: 15 },
    });
    const started = startRush(planning);
    if (!started.rush) throw new Error('Expected a rush.');
    const queue = Array.from({ length: 45 }, (_, index) => {
      const customer = testCustomer(`high-volume-${index + 1}`);
      return {
        ...customer,
        order: { ...customer.order, preparationTicks: 5 },
      };
    });
    const completed = runToReport({
      ...started,
      rush: {
        ...started.rush,
        durationTicks: 280,
        eventTriggerTicks: [],
        demandMultiplier: 0,
        normalQueue: queue,
        stats: {
          ...started.rush.stats,
          arrivals: queue.length,
          arrivalsBySegment: { commuter: queue.length },
          peakQueue: queue.length,
        },
      },
    });
    const report = completed.report;
    if (!report?.chargeGroups) throw new Error('Expected complete canonical charges.');
    const retainedSales =
      completed.rush?.recentActivity.filter((event) => event.type === 'sale') ?? [];
    expect(completed.rush?.nextActivitySequence).toBeGreaterThan(RUSH_ACTIVITY_LIMIT);
    expect(completed.rush?.recentActivity).toHaveLength(RUSH_ACTIVITY_LIMIT);
    expect(retainedSales.length).toBeLessThan(report.served);
    expect(report.chargeGroups.length).toBeLessThanOrEqual(MAX_REPORT_CHARGE_GROUPS);
    expect(report.chargeGroups.reduce((total, group) => total + group.quantity, 0)).toBe(
      report.served,
    );
    expect(report.chargeGroups.reduce((total, group) => total + group.revenueCents, 0)).toBe(
      report.revenueCents,
    );

    const settled = closeDay(completed);
    const repeated = closeDay(settled);
    expect(repeated).toBe(settled);
    expect(repeated.history).toHaveLength(1);
    expect(repeated.history[0]?.chargeGroups).toEqual(report.chargeGroups);
  });

  it('emits ordered customer transitions with all four locked walkaway reasons', () => {
    const natural = runToReport(startRush(createCampaign({ seed: 7_777 })), 'take-order');
    expect(new Set(natural.rush?.recentActivity.map(({ type }) => type))).toEqual(
      new Set(['arrival', 'serviceStarted', 'sale', 'walkaway']),
    );

    const base = startRush(createCampaign({ seed: 31 }));
    if (!base.rush) throw new Error('Expected rush state.');
    const patienceCustomer = testCustomer('patience-customer', 4, 5);
    const patience = advanceTick({
      ...base,
      rush: { ...base.rush, normalQueue: [patienceCustomer], eventTriggerTicks: [] },
    });
    expect(
      patience.rush?.recentActivity.find(
        (event) => event.type === 'walkaway' && event.customerId === patienceCustomer.id,
      ),
    ).toMatchObject({ reason: 'patience' });

    const stockoutCustomer = testCustomer('stockout-customer');
    const stockout = advanceTick({
      ...base,
      inventory: emptyInventory(),
      rush: { ...base.rush, normalQueue: [stockoutCustomer], eventTriggerTicks: [] },
    });
    expect(
      stockout.rush?.recentActivity.find(
        (event) => event.type === 'walkaway' && event.customerId === stockoutCustomer.id,
      ),
    ).toMatchObject({ reason: 'stockout' });

    const activeCustomer = testCustomer('active-customer');
    const capacity = serviceQueueCapacity(base);
    const fullQueue = Array.from({ length: capacity }, (_, index) =>
      testCustomer(`queued-${index + 1}`),
    );
    const queueFull = advanceTick({
      ...base,
      rngState: 1,
      rush: {
        ...base.rush,
        serviceJobsByStation: {
          ...base.rush.serviceJobsByStation,
          espressoBar: {
            id: 'd1-j0',
            stationId: 'espressoBar',
            laneId: 'normal',
            customer: activeCustomer,
            remainingTicks: 20,
            totalTicks: 20,
          },
        },
        nextServiceJobSequence: 1,
        normalQueue: fullQueue,
        demandMultiplier: 100,
        eventTriggerTicks: [],
      },
    });
    const rejected = queueFull.rush?.recentActivity.slice(-2) ?? [];
    expect(rejected.map(({ type }) => type)).toEqual(['arrival', 'walkaway']);
    expect(rejected[0]?.customerId).toBe(rejected[1]?.customerId);
    expect(rejected[1]).toMatchObject({ type: 'walkaway', reason: 'queueFull' });

    const ending = advanceTick({
      ...base,
      rngState: 15_365,
      rush: {
        ...base.rush,
        durationTicks: 1,
        serviceJobsByStation: {
          ...base.rush.serviceJobsByStation,
          espressoBar: {
            id: 'd1-j0',
            stationId: 'espressoBar',
            laneId: 'normal',
            customer: activeCustomer,
            remainingTicks: 20,
            totalTicks: 20,
          },
        },
        nextServiceJobSequence: 1,
        normalQueue: [testCustomer('ending-queue-customer')],
        eventTriggerTicks: [],
      },
    });
    const endedIds = ending.rush?.recentActivity
      .filter((event) => event.type === 'walkaway' && event.reason === 'rushEnded')
      .map(({ customerId }) => customerId);
    expect(endedIds).toEqual(['active-customer', 'ending-queue-customer']);
  });

  it('keeps one bounded, contiguous, identity-stable activity tail', () => {
    let working = startRush(createCampaign({ seed: 9_119 }));
    for (let batch = 0; batch < 3; batch += 1) {
      if (!working.rush) throw new Error('Expected active rush observations.');
      working = advanceTick({
        ...working,
        rngState: 123_456,
        rush: {
          ...working.rush,
          eventTriggerTicks: [],
          normalQueue: Array.from({ length: 30 }, (_, index) =>
            testCustomer(`batch-${batch}-customer-${index}`, 0, 1),
          ),
        },
      });
    }
    const rush = working.rush;
    if (!rush) throw new Error('Expected bounded rush observations.');
    expect(rush.recentActivity).toHaveLength(RUSH_ACTIVITY_LIMIT);
    expect(rush.nextActivitySequence).toBeGreaterThan(RUSH_ACTIVITY_LIMIT);
    expect(new Set(rush.recentActivity.map(({ id }) => id)).size).toBe(RUSH_ACTIVITY_LIMIT);
    for (let index = 1; index < rush.recentActivity.length; index += 1) {
      expect(rush.recentActivity[index]?.sequence).toBe(
        (rush.recentActivity[index - 1]?.sequence ?? -1) + 1,
      );
    }
    expect(rush.recentActivity.at(-1)?.sequence).toBe(rush.nextActivitySequence - 1);
  });

  it('starts stations in fixed order when parallel jobs compete for insufficient shared stock', () => {
    const planning = departmentPlanningState([]);
    const started = startRush(planning);
    if (!started.rush) throw new Error('Expected department rush.');
    const espresso = stationCustomer(started.day, 0, 'espresso', 'normal', 5);
    const batch = stationCustomer(started.day, 1, 'batchBrew', 'normal', 5);
    const contested: GameState = {
      ...started,
      rngState: 15_365,
      inventory: {
        ...started.inventory,
        houseBeans: [{ quantity: 20, acquiredDay: started.day, expiresAfterDay: started.day + 2 }],
      },
      rush: {
        ...started.rush,
        eventTriggerTicks: [],
        normalQueue: [espresso, batch],
        nextCustomerId: 2,
      },
    };

    const advanced = advanceTick(contested);
    expect(advanced.rush?.serviceJobsByStation.espressoBar).toMatchObject({
      id: `d${started.day}-j0`,
      stationId: 'espressoBar',
      customer: { id: espresso.id },
    });
    expect(advanced.rush?.serviceJobsByStation.brewBar).toBeNull();
    expect(inventoryTotals(advanced.inventory).houseBeans).toBe(2);
    expect(advanced.rush?.stats.consumed.houseBeans).toBe(18);
    expect(advanced.rush?.stats.stockouts).toBe(1);
    expect(advanced.rush?.recentActivity.map((event) => [event.type, event.customerId])).toEqual([
      ['serviceStarted', espresso.id],
      ['walkaway', batch.id],
    ]);
  });

  it('forces normal service after two express starts while compatible normal work waits', () => {
    const planning = departmentPlanningState(['espresso']);
    const started = startRush(planning);
    if (!started.rush) throw new Error('Expected department rush.');
    const normal = stationCustomer(started.day, 0, 'espresso', 'normal', 1);
    const express = Array.from({ length: 3 }, (_, index) =>
      stationCustomer(started.day, index + 1, 'espresso', 'express', 1),
    );
    let working: GameState = {
      ...started,
      rngState: 15_365,
      inventory: {
        ...started.inventory,
        houseBeans: [{ quantity: 500, acquiredDay: started.day, expiresAfterDay: started.day + 2 }],
      },
      rush: {
        ...started.rush,
        eventTriggerTicks: [],
        normalQueue: [normal],
        expressQueue: express,
        nextCustomerId: 4,
      },
    };
    working = advanceTick(working);
    working = advanceTick(working);
    working = advanceTick(working);

    const starts =
      working.rush?.recentActivity.filter((event) => event.type === 'serviceStarted') ?? [];
    expect(starts.map(({ laneId }) => laneId)).toEqual(['express', 'express', 'normal']);
    expect(working.rush?.serviceJobsByStation.espressoBar?.customer.id).toBe(normal.id);
    expect(working.rush?.consecutiveExpressStartsByStation.espressoBar).toBe(0);
    expect(working.rush?.expressQueue).toHaveLength(1);
  });

  it('counts express fairness only while compatible normal work is already waiting', () => {
    const planning = departmentPlanningState(['espresso']);
    const started = startRush(planning);
    if (!started.rush) throw new Error('Expected department rush.');
    const first = stationCustomer(started.day, 0, 'espresso', 'express', 1);
    const second = stationCustomer(started.day, 1, 'espresso', 'express', 1);
    let working: GameState = {
      ...started,
      rngState: 15_365,
      inventory: {
        ...started.inventory,
        houseBeans: [{ quantity: 500, acquiredDay: started.day, expiresAfterDay: started.day + 2 }],
      },
      rush: {
        ...started.rush,
        eventTriggerTicks: [],
        expressQueue: [first, second],
        nextCustomerId: 2,
      },
    };
    working = advanceTick(working);
    working = advanceTick(working);
    expect(working.rush?.consecutiveExpressStartsByStation.espressoBar).toBe(0);

    if (!working.rush) throw new Error('Expected active department rush.');
    const normal = stationCustomer(started.day, 2, 'espresso', 'normal', 1);
    const third = stationCustomer(started.day, 3, 'espresso', 'express', 1);
    working = {
      ...working,
      rush: {
        ...working.rush,
        normalQueue: [normal],
        expressQueue: [third],
        nextCustomerId: 4,
      },
    };
    working = advanceTick(working);

    expect(working.rush?.serviceJobsByStation.espressoBar?.customer.id).toBe(third.id);
    expect(working.rush?.consecutiveExpressStartsByStation.espressoBar).toBe(1);
    expect(working.rush?.normalQueue).toEqual([expect.objectContaining({ id: normal.id })]);
  });

  it('settles three same-tick completions once in fixed station order', () => {
    const planning = departmentPlanningState([]);
    const started = startRush(planning);
    if (!started.rush) throw new Error('Expected department rush.');
    const customers = [
      stationCustomer(started.day, 0, 'espresso', 'normal', 1),
      stationCustomer(started.day, 1, 'batchBrew', 'normal', 1),
      stationCustomer(started.day, 2, 'coldBrew', 'normal', 1),
    ];
    let working = advanceTick({
      ...started,
      rngState: 15_365,
      inventory: {
        ...started.inventory,
        houseBeans: [{ quantity: 100, acquiredDay: started.day, expiresAfterDay: started.day + 2 }],
        coldBrewConcentrate: [
          { quantity: 100, acquiredDay: started.day, expiresAfterDay: started.day + 2 },
        ],
        ice: [{ quantity: 2, acquiredDay: started.day, expiresAfterDay: started.day + 2 }],
      },
      rush: {
        ...started.rush,
        eventTriggerTicks: [],
        normalQueue: customers,
        nextCustomerId: 3,
      },
    });
    expect(
      working.rush?.recentActivity
        .filter((event) => event.type === 'serviceStarted')
        .map(({ stationId, jobId }) => [stationId, jobId]),
    ).toEqual([
      ['espressoBar', `d${started.day}-j0`],
      ['brewBar', `d${started.day}-j1`],
      ['coldBar', `d${started.day}-j2`],
    ]);

    working = advanceTick(working);
    const sales = working.rush?.recentActivity.filter((event) => event.type === 'sale') ?? [];
    expect(sales.map(({ stationId, jobId }) => [stationId, jobId])).toEqual([
      ['espressoBar', `d${started.day}-j0`],
      ['brewBar', `d${started.day}-j1`],
      ['coldBar', `d${started.day}-j2`],
    ]);
    expect(working.rush?.stats).toMatchObject({ served: 3, revenueCents: 1_520 });
    expect(
      working.rush?.stats.serviceAggregates.flatMap((aggregate) => aggregate.completedJobIds),
    ).toEqual([`d${started.day}-j0`, `d${started.day}-j1`, `d${started.day}-j2`]);
    expect(new Set(sales.map(({ jobId }) => jobId)).size).toBe(3);
  });

  it('keeps active-job stock consumed but records no sale when the rush ends mid-service', () => {
    const planning = departmentPlanningState([]);
    const started = startRush(planning);
    if (!started.rush) throw new Error('Expected department rush.');
    const first = stationCustomer(started.day, 0, 'espresso', 'normal', 10);
    const waiting = stationCustomer(started.day, 1, 'espresso', 'normal', 10);
    let working = advanceTick({
      ...started,
      rngState: 123_456,
      inventory: {
        ...started.inventory,
        houseBeans: [{ quantity: 100, acquiredDay: started.day, expiresAfterDay: started.day + 2 }],
      },
      rush: {
        ...started.rush,
        eventTriggerTicks: [],
        normalQueue: [first, waiting],
        nextCustomerId: 2,
      },
    });
    const activeJob = working.rush?.serviceJobsByStation.espressoBar;
    if (!working.rush || !activeJob) throw new Error('Expected an active exact-once job.');
    const afterStartInventory = inventoryTotals(working.inventory);
    const abandonedBeforeClose = working.rush.stats.abandoned;
    expect(afterStartInventory.houseBeans).toBe(82);
    expect(working.rush.stats.served).toBe(0);

    working = advanceTick({
      ...working,
      rush: { ...working.rush, durationTicks: working.rush.tick + 1 },
    });
    expect(working.phase).toBe('report');
    expect(inventoryTotals(working.inventory)).toEqual(afterStartInventory);
    const rushEnded =
      working.rush?.recentActivity.filter(
        (event) => event.type === 'walkaway' && event.reason === 'rushEnded',
      ) ?? [];
    expect(working.report).toMatchObject({ served: 0, revenueCents: 0 });
    expect(working.report?.abandoned).toBe(abandonedBeforeClose + rushEnded.length);
    expect(new Set(rushEnded.map(({ customerId }) => customerId)).size).toBe(rushEnded.length);
    expect(rushEnded.filter(({ customerId }) => customerId === first.id)).toHaveLength(1);
    expect(rushEnded.filter(({ customerId }) => customerId === waiting.id)).toHaveLength(1);
    expect(
      working.rush?.recentActivity.find(
        (event) =>
          event.type === 'walkaway' &&
          event.customerId === first.id &&
          event.reason === 'rushEnded',
      ),
    ).toMatchObject({ jobId: activeJob.id, stationId: 'espressoBar', laneId: 'normal' });
    expect(
      working.rush?.recentActivity.find(
        (event) => event.type === 'sale' && event.jobId === activeJob.id,
      ),
    ).toBeUndefined();
    expect(
      working.report?.serviceAggregates.flatMap((aggregate) => aggregate.completedJobIds),
    ).toEqual([]);
  });

  it('reconciles every completed parallel job into one bounded station/lane report bucket', () => {
    const reportState = runToReport(startRush(departmentPlanningState(['espresso'])));
    const report = reportState.report;
    if (!report) throw new Error('Expected department report.');
    const completedJobIds = report.serviceAggregates.flatMap(
      (aggregate) => aggregate.completedJobIds,
    );
    expect(report.serviceAggregates).toHaveLength(6);
    expect(report.serviceAggregates.reduce((total, aggregate) => total + aggregate.served, 0)).toBe(
      report.served,
    );
    expect(
      report.serviceAggregates.reduce((total, aggregate) => total + aggregate.revenueCents, 0),
    ).toBe(report.revenueCents);
    expect(completedJobIds).toHaveLength(report.served);
    expect(new Set(completedJobIds).size).toBe(completedJobIds.length);
    expect(report.served).toBeGreaterThan(0);
  });

  it('pauses without advancing and rejects commands from the wrong phase', () => {
    const planning = createCampaign({ seed: 3 });
    expect(() => advanceTick(planning)).toThrow(GameRuleError);
    const paused = togglePause(startRush(planning));
    expect(advanceTick(paused)).toBe(paused);
    expect(paused.rush?.tick).toBe(0);
  });

  it('conserves inventory and reconciles cash at settlement', () => {
    const reportState = runToReport(startRush(createCampaign({ seed: 4_400 })));
    const report = reportState.report;
    expect(report).not.toBeNull();
    if (!report) return;
    expect(Object.values(report.remainingInventory).every((amount) => amount >= 0)).toBe(true);
    expect(report.inventoryLifecycle).not.toBeNull();
    if (!report.inventoryLifecycle) throw new Error('Expected schema-v3 inventory lifecycle.');
    for (const ingredientId of INGREDIENT_IDS) {
      const lifecycle = report.inventoryLifecycle;
      expect(
        lifecycle.opening[ingredientId] +
          lifecycle.purchased[ingredientId] -
          lifecycle.consumed[ingredientId] -
          lifecycle.expired[ingredientId],
      ).toBe(lifecycle.remaining[ingredientId]);
      expect(lifecycle.remaining[ingredientId]).toBe(report.remainingInventory[ingredientId]);
      expect(lifecycle.expired[ingredientId]).toBe(report.waste[ingredientId] ?? 0);
    }
    expect(report.ingredientCostCents).toBeGreaterThan(0);
    expect(report.closingCashCents).toBe(report.openingCashCents + report.netCashFlowCents);
    const settled = closeDay(reportState);
    expect(settled.cashCents).toBe(report.closingCashCents);
    expect(closeDay(settled)).toBe(settled);
    expect(settled.history).toHaveLength(1);
  });

  it('validates menu, pricing, purchases, improvement, and next-day rules', () => {
    const campaign = createCampaign({ seed: 55 });
    expect(() => prepareDay(campaign, { activeMenu: [] })).toThrow('Choose between 1 and 3');
    expect(() => prepareDay(campaign, { pricesCents: { flatWhite: 100 } })).toThrow(
      'between $2.50 and $12.00',
    );
    expect(() => prepareDay(campaign, { purchases: { houseBeans: 21 } })).toThrow('whole numbers');
    const settled = closeDay(runToReport(startRush(campaign)));
    const improved = buyImprovement(settled, 'street-sign');
    expect(improved.improvements).toContain('street-sign');
    expect(buyImprovement(improved, 'street-sign')).toBe(improved);
    const tomorrow = startNextDay(improved);
    expect(tomorrow.day).toBe(2);
    expect(tomorrow.phase).toBe('planning');
    expect(tomorrow.plan.purchases.houseBeans).toBe(0);
  });

  it('accepts three eligible express drinks and rejects every station/express plan boundary', () => {
    const department = departmentPlanningState([]);
    const activeMenu: DrinkId[] = ['espresso', 'longBlack', 'flatWhite', 'batchBrew', 'coldBrew'];
    const scheduledStaffIds = [...department.plan.scheduledStaffIds];
    const expressDrinkIds: DrinkId[] = ['espresso', 'batchBrew', 'coldBrew'];
    const valid = prepareDay(department, {
      activeMenu,
      scheduledStaffIds,
      expressDrinkIds,
    });
    expect(valid.plan.expressDrinkIds).toEqual(['espresso', 'batchBrew', 'coldBrew']);
    expect(valid.plan.expressDrinkIds).not.toBe(expressDrinkIds);
    expect(valid.plan.scheduledStaffIds).not.toBe(scheduledStaffIds);
    expressDrinkIds.splice(0);
    scheduledStaffIds.splice(0);
    expect(valid.plan.expressDrinkIds).toEqual(['espresso', 'batchBrew', 'coldBrew']);
    expect(valid.plan.scheduledStaffIds).toEqual(department.plan.scheduledStaffIds);
    expect(laneForDrink(valid.venueId, valid.equipment, valid.plan, 'espresso')).toBe('express');
    expect(laneForDrink(valid.venueId, valid.equipment, valid.plan, 'flatWhite')).toBe('normal');
    expect(() =>
      prepareDay(department, {
        activeMenu,
        expressDrinkIds: ['espresso', 'longBlack', 'batchBrew', 'coldBrew'],
      }),
    ).toThrow('Choose no more than 3 express drinks');
    expect(() => prepareDay(department, { activeMenu, expressDrinkIds: ['flatWhite'] })).toThrow(
      'not eligible for express service',
    );
    expect(() =>
      prepareDay(department, { activeMenu, expressDrinkIds: ['espresso', 'espresso'] }),
    ).toThrow('Express drink selections must be unique');
    expect(() =>
      prepareDay(department, { activeMenu: ['flatWhite'], expressDrinkIds: ['espresso'] }),
    ).toThrow('Express drinks must be selected from the active menu');

    const assignedId = department.plan.stationAssignments.espressoBar[0];
    if (!assignedId) throw new Error('Expected an assigned department team member.');
    expect(() =>
      prepareDay(department, {
        stationAssignments: {
          ...department.plan.stationAssignments,
          brewBar: [...department.plan.stationAssignments.brewBar, assignedId],
        },
      }),
    ).toThrow('only be assigned to one station');
    expect(() =>
      prepareDay(department, {
        stationAssignments: {
          ...department.plan.stationAssignments,
          espressoBar: department.plan.stationAssignments.espressoBar.filter(
            (id) => id !== assignedId,
          ),
        },
      }),
    ).toThrow('exactly one station assignment');
    const unscheduledId = department.candidateStaff[0]?.id;
    if (!unscheduledId) throw new Error('Expected an unscheduled department candidate.');
    expect(() =>
      prepareDay(department, {
        stationAssignments: {
          ...department.plan.stationAssignments,
          espressoBar: department.plan.stationAssignments.espressoBar.map((id) =>
            id === assignedId ? unscheduledId : id,
          ),
        },
      }),
    ).toThrow('exactly one station assignment');

    const manager = department.staff.find((member) => member.role === 'manager');
    if (!manager) throw new Error('Expected a department Manager.');
    expect(() =>
      prepareDay(department, {
        stationAssignments: {
          espressoBar: department.plan.stationAssignments.espressoBar.filter(
            (id) => id !== manager.id,
          ),
          brewBar: department.plan.stationAssignments.brewBar.filter((id) => id !== manager.id),
          coldBar: [...department.plan.stationAssignments.coldBar, manager.id],
        },
      }),
    ).toThrow('match the team member’s role');

    const cart = createCampaign({ seed: 5_575 });
    const cartBarista = cart.candidateStaff.find((member) => member.role === 'barista');
    if (!cartBarista) throw new Error('Expected a cart Barista.');
    expect(() =>
      prepareDay(
        { ...cart, staff: [{ ...cartBarista, hiredOnDay: 1 }] },
        {
          scheduledStaffIds: [cartBarista.id],
          stationAssignments: { espressoBar: [], brewBar: [cartBarista.id], coldBar: [] },
        },
      ),
    ).toThrow('Inactive stations cannot receive staff assignments');
  });

  it('applies exact relative planner increments atomically and stops at bounds', () => {
    let state = createCampaign({ seed: 56 });
    for (let index = 0; index < 65; index += 1) {
      state = adjustPlanPrice(state, 'flatWhite', 1);
    }
    expect(state.plan.pricesCents.flatWhite).toBe(1_200);
    expect(adjustPlanPrice(state, 'flatWhite', 1)).toBe(state);

    for (let index = 0; index < 95; index += 1) {
      state = adjustPlanPrice(state, 'flatWhite', -1);
    }
    expect(state.plan.pricesCents.flatWhite).toBe(250);
    expect(adjustPlanPrice(state, 'flatWhite', -1)).toBe(state);

    for (let index = 0; index < 19; index += 1) {
      state = adjustPlanPurchase(state, 'ice', 1);
    }
    expect(state.plan.purchases.ice).toBe(19);
    state = adjustPlanPurchase(state, 'ice', 1);
    expect(state.plan.purchases.ice).toBe(20);
    expect(adjustPlanPurchase(state, 'ice', 1)).toBe(state);

    for (let index = 0; index < 20; index += 1) {
      state = adjustPlanPurchase(state, 'ice', -1);
    }
    expect(state.plan.purchases.ice).toBe(0);
    expect(adjustPlanPurchase(state, 'ice', -1)).toBe(state);
    expect(() => adjustPlanPrice(startRush(state), 'flatWhite', 1)).toThrow('requires planning');
  });

  it('charges an amended base price through real orders, revenue, report, and settlement', () => {
    let planning = createCampaign({ seed: 5_504 });
    planning = prepareDay(planning, {
      activeMenu: ['flatWhite'],
      dialIn: 'quality',
      purchases: {
        houseBeans: 4,
        dairyMilk: 4,
        oatMilk: 4,
        soyMilk: 4,
      },
    });
    for (let index = 0; index < 10; index += 1) {
      planning = adjustPlanPrice(planning, 'flatWhite', 1);
    }
    expect(planning.plan.pricesCents.flatWhite).toBe(650);

    const completed = runToReport(startRush(planning));
    const report = completed.report;
    const sales = completed.rush?.recentActivity.filter((event) => event.type === 'sale') ?? [];
    expect(report).not.toBeNull();
    expect(sales.length).toBe(report?.served);
    expect(sales.length).toBeGreaterThan(0);
    for (const sale of sales) {
      expect(sale.type).toBe('sale');
      expect(sale.drinkId).toBe('flatWhite');
      expect(sale.priceCents).toBe(
        650 + MILK_SURCHARGE_CENTS[sale.milk] + (sale.size === 'large' ? SIZE_SURCHARGE_CENTS : 0),
      );
    }
    expect(sales.some(({ milk, size }) => milk !== 'dairy' || size === 'large')).toBe(true);
    const observedRevenue = sales.reduce((total, sale) => total + sale.priceCents, 0);
    expect(completed.rush?.stats.revenueCents).toBe(observedRevenue);
    expect(report?.revenueCents).toBe(observedRevenue);
    expect(report?.closingCashCents).toBe(
      (report?.openingCashCents ?? 0) + (report?.netCashFlowCents ?? 0),
    );
    expect(closeDay(completed).cashCents).toBe(report?.closingCashCents);
  });

  it('uses old stock through its final rush, then expires its untouched LIFO remainder once', () => {
    const base = createCampaign({ seed: 5_503 });
    const planning: GameState = {
      ...base,
      day: 3,
      inventory: {
        ...base.inventory,
        dairyMilk: [{ quantity: 500, acquiredDay: 1, expiresAfterDay: 3 }],
      },
      plan: {
        ...base.plan,
        activeMenu: ['flatWhite'],
        dialIn: 'quality',
        purchases: {
          ...emptyPurchases(),
          houseBeans: 4,
          dairyMilk: 4,
          oatMilk: 4,
          soyMilk: 4,
        },
      },
    };

    const completed = runToReport(startRush(planning));
    const lifecycle = completed.report?.inventoryLifecycle;
    if (!lifecycle) throw new Error('Expected completed inventory lifecycle.');
    expect(completed.report?.served).toBeGreaterThan(0);
    expect(lifecycle.opening.dairyMilk).toBe(500);
    expect(lifecycle.purchased.dairyMilk).toBe(8_000);
    expect(lifecycle.expired.dairyMilk).toBe(500);
    expect(lifecycle.remaining.dairyMilk).toBe(8_000 - lifecycle.consumed.dairyMilk);
    expect(completed.report?.waste.dairyMilk).toBe(500);
    expect(completed.report?.explanations.join(' ')).toContain('Expiry waste after the Day 3 rush');
    expect(lifecycle.opening.dairyMilk + lifecycle.purchased.dairyMilk).toBe(
      lifecycle.consumed.dairyMilk + lifecycle.expired.dairyMilk + lifecycle.remaining.dairyMilk,
    );
    expect(lifecycle.consumed.dairyMilk).toBeGreaterThan(0);
    expect(
      completed.inventory.dairyMilk.every(
        (batch) => batch.acquiredDay === 3 && batch.expiresAfterDay > 3,
      ),
    ).toBe(true);

    const settled = closeDay(completed);
    const tomorrow = startNextDay(settled);
    expect(tomorrow.inventory.dairyMilk).toEqual(completed.inventory.dairyMilk);
    expect(settled.history.at(-1)?.waste.dairyMilk).toBe(500);
  });

  it('runs a 75-second simulated rush', () => {
    const finished = runToReport(startRush(createCampaign({ seed: 99 })));
    expect(finished.rush?.durationTicks).toBe(300);
    expect(finished.rush?.tick).toBe(300);
  });
});

function departmentPlanningState(expressDrinkIds: DrinkId[]): GameState {
  const state = departmentWorkforceEnvelope().activeRun;
  if (!state) throw new Error('Expected department planning fixture.');
  return prepareDay(state, {
    activeMenu: ['espresso', 'batchBrew', 'coldBrew'],
    expressDrinkIds,
  });
}

function stationCustomer(
  day: number,
  sequence: number,
  drinkId: 'espresso' | 'batchBrew' | 'coldBrew',
  laneId: 'normal' | 'express',
  preparationTicks: number,
): Customer {
  const route =
    drinkId === 'batchBrew' ? 'brewBar' : drinkId === 'coldBrew' ? 'coldBar' : 'espressoBar';
  const ingredients =
    drinkId === 'batchBrew'
      ? [{ ingredientId: 'houseBeans' as const, amount: 15 }]
      : drinkId === 'coldBrew'
        ? [
            { ingredientId: 'coldBrewConcentrate' as const, amount: 90 },
            { ingredientId: 'ice' as const, amount: 1 },
          ]
        : [{ ingredientId: 'houseBeans' as const, amount: 18 }];
  return {
    id: `d${day}-c${sequence}`,
    segment: 'commuter',
    stationId: route,
    laneId,
    order: {
      drinkId,
      size: 'regular',
      milk: 'none',
      priceCents: drinkId === 'espresso' ? 400 : drinkId === 'batchBrew' ? 500 : 620,
      ingredientAmounts: ingredients,
      preparationTicks,
    },
    arrivedAtTick: 0,
    patienceTicks: 1_000,
    waitedTicks: 0,
  };
}
