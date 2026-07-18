import { describe, expect, it } from 'vitest';

import { MILK_SURCHARGE_CENTS, SIZE_SURCHARGE_CENTS } from '../../src/content/gameContent';
import {
  GameRuleError,
  advanceTick,
  adjustPlanPrice,
  adjustPlanPurchase,
  buyImprovement,
  closeDay,
  createCampaign,
  prepareDay,
  resolveEvent,
  setRushSpeed,
  startNextDay,
  startRush,
  togglePause,
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
    const sales = completed.rush?.recentActivity ?? [];
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

  it('runs a 75-second simulated rush', () => {
    const finished = runToReport(startRush(createCampaign({ seed: 99 })));
    expect(finished.rush?.durationTicks).toBe(300);
    expect(finished.rush?.tick).toBe(300);
  });
});
