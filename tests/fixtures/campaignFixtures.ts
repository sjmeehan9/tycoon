import { CAMPAIGN_RULES, emptyPurchases } from '../../src/content/gameContent';
import {
  LEGACY_STAFF_NAMES,
  advanceTick,
  candidatePoolForDay,
  createCampaign,
  inventoryTotals,
  reservedStaffName,
  resolveEvent,
  startRush,
  type Customer,
  type DayReport,
  type EquipmentState,
  type GameState,
  type SaveEnvelope,
  type VenueId,
  type WeatherId,
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

/** Valid Day 3 planning fixture proving live LIFO depletion and post-rush expiry. */
export function stockLifecyclePlanningEnvelope(): SaveEnvelope {
  const base = createCampaign({ seed: 50_504 });
  const state: GameState = {
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
        houseBeans: 2,
        dairyMilk: 4,
        oatMilk: 4,
        soyMilk: 4,
      },
    },
  };
  return createSaveEnvelope(state, fixturePreferences(), createDefaultMeta());
}

/** Legacy schema-v3 planning save with duplicate names for reset-boundary proof. */
export function duplicateStaffNamesEnvelope(): Record<string, unknown> {
  const seed = 6_404;
  const base = createCampaign({ seed });
  const duplicateName = LEGACY_STAFF_NAMES[0];
  const staff = candidatePoolForDay(seed, 1)
    .slice(0, 2)
    .map((member, index) => ({
      ...member,
      hiredOnDay: 1,
      name: duplicateName,
      id: `legacy-hire-${index + 1}`,
    }));
  const candidateStaff = candidatePoolForDay(seed, 10_000).map((member, index) => ({
    ...member,
    name: index === 0 ? reservedStaffName(seed, 0) : index === 2 ? 'Marnie Unique' : duplicateName,
  }));
  const current = createSaveEnvelope(
    {
      ...base,
      mode: 'endless',
      day: 10_000,
      staff,
      candidateStaff,
    },
    fixturePreferences(),
    createDefaultMeta(),
  );
  const legacy = JSON.parse(JSON.stringify(current)) as {
    schemaVersion: number;
    activeRun: Record<string, unknown>;
    preferences: Record<string, unknown>;
  };
  legacy.schemaVersion = 3;
  legacy.activeRun.stateVersion = 3;
  delete legacy.activeRun.difficulty;
  delete legacy.preferences.evolutionNoticeSeen;
  return legacy;
}

/** Valid endless reinvestment save ready to generate the final supported daily pool. */
export function endlessDay9_999Envelope(): SaveEnvelope {
  const seed = 6_499;
  const base = createCampaign({ seed });
  const staff = base.candidateStaff.slice(0, 2).map((member) => ({
    ...member,
    hiredOnDay: 1,
  }));
  return createSaveEnvelope(
    {
      ...base,
      mode: 'endless',
      phase: 'reinvest',
      day: 9_999,
      lastSettledDay: 9_999,
      staff,
      candidateStaff: candidatePoolForDay(seed, 9_999),
    },
    fixturePreferences(),
    createDefaultMeta(),
  );
}

export interface LivingRushOptions {
  endingSoon?: boolean;
  equipment?: Partial<EquipmentState>;
  paused?: boolean;
  queueCount?: number;
  reducedMotion?: boolean;
  scheduledStaffCount?: number;
  venueId?: VenueId;
  weather?: WeatherId;
}

/** Deterministic dense rush used to prove queue overflow, evidence, and static parity. */
export function livingRushEnvelope(options: LivingRushOptions = {}): SaveEnvelope {
  const campaign = createCampaign({ seed: 6_303 });
  const scheduledStaffCount = options.scheduledStaffCount ?? 0;
  const staff = [...campaign.candidateStaff, ...candidatePoolForDay(campaign.seed, 2)]
    .slice(0, scheduledStaffCount)
    .map((member) => ({ ...member, hiredOnDay: 1 }));
  const started = startRush({
    ...campaign,
    candidateStaff: campaign.candidateStaff.filter(
      ({ id }) => !staff.some((member) => member.id === id),
    ),
    equipment: { ...campaign.equipment, ...options.equipment },
    plan: { ...campaign.plan, scheduledStaffIds: staff.map(({ id }) => id) },
    staff,
    venueId: options.venueId ?? campaign.venueId,
    weather: options.weather ?? campaign.weather,
  });
  if (!started.rush) throw new Error('Living-rush fixture requires an active rush.');
  const activeCustomer = livingRushCustomer('d1-c1', 'enthusiast');
  const queue = Array.from({ length: options.queueCount ?? 12 }, (_, index) =>
    livingRushCustomer(
      `d1-c${index + 2}`,
      (['commuter', 'student', 'enthusiast', 'regular'] as const)[index % 4] ?? 'regular',
    ),
  );
  const rush = {
    ...started.rush,
    tick: 48,
    durationTicks: options.endingSoon ? 49 : started.rush.durationTicks,
    speed: options.endingSoon ? (1 as const) : (4 as const),
    isPaused: options.paused ?? true,
    queue,
    activeService: { customer: activeCustomer, remainingTicks: 12, totalTicks: 20 },
    eventTriggerTicks: [],
    nextCustomerId: 30,
    nextActivitySequence: 7,
    recentActivity: [
      {
        id: 'd1-e0',
        sequence: 0,
        tick: 20,
        customerId: 'd1-c20',
        segment: 'student' as const,
        type: 'arrival' as const,
      },
      {
        id: 'd1-e1',
        sequence: 1,
        tick: 21,
        customerId: 'd1-c20',
        segment: 'student' as const,
        type: 'serviceStarted' as const,
        drinkId: 'flatWhite' as const,
        size: 'large' as const,
        milk: 'oat' as const,
      },
      {
        id: 'd1-e2',
        sequence: 2,
        tick: 40,
        customerId: 'd1-c20',
        segment: 'student' as const,
        type: 'sale' as const,
        drinkId: 'flatWhite' as const,
        size: 'large' as const,
        milk: 'oat' as const,
        priceCents: 725,
      },
      {
        id: 'd1-e3',
        sequence: 3,
        tick: 42,
        customerId: 'd1-c21',
        segment: 'commuter' as const,
        type: 'arrival' as const,
      },
      {
        id: 'd1-e4',
        sequence: 4,
        tick: 42,
        customerId: 'd1-c21',
        segment: 'commuter' as const,
        type: 'walkaway' as const,
        reason: 'stockout' as const,
      },
      {
        id: 'd1-e5',
        sequence: 5,
        tick: 45,
        customerId: activeCustomer.id,
        segment: activeCustomer.segment,
        type: 'arrival' as const,
      },
      {
        id: 'd1-e6',
        sequence: 6,
        tick: 46,
        customerId: activeCustomer.id,
        segment: activeCustomer.segment,
        type: 'serviceStarted' as const,
        drinkId: activeCustomer.order.drinkId,
        size: activeCustomer.order.size,
        milk: activeCustomer.order.milk,
      },
    ],
    chargeGroups: [
      {
        drinkId: 'flatWhite' as const,
        size: 'large' as const,
        milk: 'oat' as const,
        priceCents: 725,
        quantity: 1,
        revenueCents: 725,
      },
    ],
    stats: {
      ...started.rush.stats,
      arrivals: 15,
      served: 1,
      abandoned: 1,
      stockouts: 1,
      revenueCents: 725,
      soldByDrink: { flatWhite: 1 },
      arrivalsBySegment: { commuter: 4, student: 4, enthusiast: 4, regular: 3 },
      servedBySegment: { student: 1 },
      peakQueue: 12,
    },
  };
  return createSaveEnvelope(
    { ...started, rush },
    { ...fixturePreferences(), reducedMotion: options.reducedMotion ?? false },
    createDefaultMeta(),
  );
}

/** Active-rush fixture with both canonical and older read-only history reports. */
export function reportHistoryEnvelope(): SaveEnvelope {
  const generated = completeFixtureReportState(7_505).report;
  if (!generated) throw new Error('Expected a completed report.');
  if (!generated.chargeGroups) throw new Error('Expected canonical report charges.');
  const currentReport: DayReport = { ...generated, day: 2, settled: true };
  const legacyReport: DayReport = { ...generated, day: 1, settled: true };
  delete legacyReport.chargeGroups;
  const activeRush = livingRushEnvelope({ paused: true });
  if (!activeRush.activeRun) throw new Error('Expected an active rush fixture.');
  return createSaveEnvelope(
    { ...activeRush.activeRun, history: [legacyReport, currentReport] },
    activeRush.preferences,
    activeRush.meta,
  );
}

/** Current, unsettled report used to prove compact exact-once day completion. */
export function currentReportEnvelope(): SaveEnvelope {
  return createSaveEnvelope(
    completeFixtureReportState(7_506),
    fixturePreferences(),
    createDefaultMeta(),
  );
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

function livingRushCustomer(id: string, segment: Customer['segment']): Customer {
  return {
    id,
    segment,
    order: {
      drinkId: 'flatWhite',
      size: 'large',
      milk: 'oat',
      priceCents: 725,
      ingredientAmounts: [
        { ingredientId: 'houseBeans', amount: 18 },
        { ingredientId: 'oatMilk', amount: 250 },
      ],
      preparationTicks: 20,
    },
    arrivedAtTick: 20,
    patienceTicks: 1_000,
    waitedTicks: 10,
  };
}

function fixtureReport(base: GameState, day: number, closingCashCents: number): DayReport {
  return {
    day,
    difficulty: base.difficulty,
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

function completeFixtureReportState(seed: number): GameState {
  let state = startRush(createCampaign({ seed }));
  let safety = 0;
  while (state.phase !== 'report' && safety < 2_000) {
    if (state.phase === 'event') {
      const choiceId = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choiceId) throw new Error('Fixture event requires a choice.');
      state = resolveEvent(state, choiceId);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (!state.report) throw new Error('Fixture rush did not reach a report.');
  return state;
}
