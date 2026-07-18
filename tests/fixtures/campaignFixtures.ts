import { CAMPAIGN_RULES } from '../../src/content/gameContent';
import {
  createCampaign,
  inventoryTotals,
  type DayReport,
  type GameState,
  type SaveEnvelope,
} from '../../src/game';
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
  return createSaveEnvelope(state, fixturePreferences(), createDefaultMeta());
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
  return createSaveEnvelope(state, fixturePreferences(), createDefaultMeta());
}

/** Valid production-import fixture with enough earned progress to exercise both promotions. */
export function growthReadyEnvelope(): SaveEnvelope {
  const base = createCampaign({ seed: 20_204 });
  const state: GameState = {
    ...base,
    day: 18,
    phase: 'reinvest',
    cashCents: 100_000,
    reputation: 70,
    lastSettledDay: 18,
  };
  return createSaveEnvelope(state, fixturePreferences(), createDefaultMeta());
}

/** Supported version-1 fixture used to prove migration through the production upload control. */
export function versionOneVictorySave(): string {
  const legacy = JSON.parse(JSON.stringify(nearVictoryEnvelope())) as MutableLegacyEnvelope;
  legacy.schemaVersion = 1;
  legacy.activeRun.stateVersion = 1;
  legacy.activeRun.inventory = inventoryTotals(nearVictoryEnvelope().activeRun!.inventory);
  delete legacy.activeRun.report.wageCostCents;
  delete legacy.activeRun.report.inventoryLifecycle;
  return JSON.stringify(legacy);
}

interface MutableLegacyEnvelope {
  schemaVersion: number;
  activeRun: {
    stateVersion: number;
    inventory: unknown;
    report: Partial<DayReport>;
  };
}

function fixturePreferences(): ReturnType<typeof createDefaultPreferences> {
  return { ...createDefaultPreferences(), onboardingComplete: true };
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
    remainingInventory: inventoryTotals(base.inventory),
    inventoryLifecycle: null,
    servedBySegment: { commuter: 6, student: 4, enthusiast: 4, regular: 4 },
    bottleneck: 'No major bottleneck — the cafe flowed well',
    explanations: ['Validated deterministic outcome fixture ready for final settlement.'],
    settled: false,
  };
}
