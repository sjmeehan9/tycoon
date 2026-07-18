import { describe, expect, it } from 'vitest';

import {
  GameRuleError,
  advanceTick,
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
    state = state.phase === 'event' ? resolveEvent(state, choiceId) : advanceTick(state);
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
    expect(first.rush?.resolvedEvents).toHaveLength(1);
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

  it('runs a 75-second simulated rush', () => {
    const finished = runToReport(startRush(createCampaign({ seed: 99 })));
    expect(finished.rush?.durationTicks).toBe(300);
    expect(finished.rush?.tick).toBe(300);
  });
});
