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
  prepareDay,
  resolveEvent,
  serviceQueueCapacity,
  setRushSpeed,
  startNextDay,
  startRush,
  togglePause,
  type Customer,
  type GameState,
  type RushSpeed,
} from '../../src/game';

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
        queue,
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
      rush: { ...base.rush, queue: [patienceCustomer], eventTriggerTicks: [] },
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
      rush: { ...base.rush, queue: [stockoutCustomer], eventTriggerTicks: [] },
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
        activeService: { customer: activeCustomer, remainingTicks: 20, totalTicks: 20 },
        queue: fullQueue,
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
      rngState: 123_456,
      rush: {
        ...base.rush,
        durationTicks: 1,
        activeService: { customer: activeCustomer, remainingTicks: 20, totalTicks: 20 },
        queue: [testCustomer('ending-queue-customer')],
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
          queue: Array.from({ length: 30 }, (_, index) =>
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
