import { CAMPAIGN_RULES } from '../../src/content/gameContent';
import { createCampaign, type DayReport, type GameState, type SaveEnvelope } from '../../src/game';
import {
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
} from '../../src/persistence/saveStore';

/** Valid production-import fixture one settlement away from Day 30 victory. */
export function nearVictoryEnvelope(): SaveEnvelope {
  const base = createCampaign({ seed: 30_030 });
  const closingCashCents = CAMPAIGN_RULES.victoryCashCents + 12_000;
  const state: GameState = {
    ...base,
    day: CAMPAIGN_RULES.durationDays,
    phase: 'report',
    cashCents: closingCashCents,
    reputation: 82,
    venueId: 'cafe',
    lastSettledDay: CAMPAIGN_RULES.durationDays - 1,
    equipment: {
      grinder: 2,
      espressoMachine: 2,
      batchBrewer: 1,
      refrigeration: 1,
      pos: 1,
      serviceCounter: 1,
    },
    report: fixtureReport(base, CAMPAIGN_RULES.durationDays, closingCashCents),
  };
  return createSaveEnvelope(state, createDefaultPreferences(), createDefaultMeta());
}

/** Valid production-import fixture one settlement away from bankruptcy. */
export function nearBankruptcyEnvelope(): SaveEnvelope {
  const base = createCampaign({ seed: 12_012 });
  const closingCashCents = CAMPAIGN_RULES.overdraftFloorCents - 1;
  const state: GameState = {
    ...base,
    day: 12,
    phase: 'report',
    cashCents: CAMPAIGN_RULES.overdraftFloorCents + 2_000,
    reputation: 31,
    lastSettledDay: 11,
    report: fixtureReport(base, 12, closingCashCents),
  };
  return createSaveEnvelope(state, createDefaultPreferences(), createDefaultMeta());
}

function fixtureReport(base: GameState, day: number, closingCashCents: number): DayReport {
  return {
    day,
    weather: base.weather,
    openingCashCents: closingCashCents,
    purchaseCostCents: 0,
    revenueCents: 0,
    ingredientCostCents: 0,
    wageCostCents: 0,
    operatingCostCents: 0,
    eventCashDeltaCents: 0,
    netCashFlowCents: 0,
    closingCashCents,
    arrivals: 18,
    served: 18,
    abandoned: 0,
    stockouts: 0,
    averageWaitSeconds: 2.4,
    satisfactionPercent: 88,
    reputationChange: 0,
    waste: {},
    remainingInventory: base.inventory,
    servedBySegment: { commuter: 6, student: 4, enthusiast: 4, regular: 4 },
    bottleneck: 'No major bottleneck — the cafe flowed well',
    explanations: ['Validated deterministic outcome fixture ready for final settlement.'],
    settled: false,
  };
}
