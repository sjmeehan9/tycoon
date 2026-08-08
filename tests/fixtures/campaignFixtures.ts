import {
  CAMPAIGN_RULES,
  INGREDIENT_UNIT_COST_CENTS,
  emptyPurchases,
} from '../../src/content/gameContent';
import {
  LEGACY_STAFF_NAMES,
  advanceTick,
  candidatePoolForDay,
  consumeIngredientsAtServiceStart,
  createCampaign,
  defaultStationAssignments,
  emptyServiceAggregates,
  emptyServiceJobs,
  inventoryTotals,
  prepareDay,
  reservedStaffName,
  resolveEvent,
  staffRoleAvailableAtVenue,
  startRush,
  togglePause,
  type Customer,
  type DayReport,
  type Difficulty,
  type EquipmentState,
  type GameState,
  type RushStats,
  type SaveEnvelope,
  type VenueId,
  type WeatherId,
} from '../../src/game';
import {
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
} from '../../src/persistence/saveStore';

/** Valid production-import fixture one settlement away from Day 40 victory. */
export function nearVictoryEnvelope(difficulty: Difficulty = 'standard'): SaveEnvelope {
  const base = createCampaign({ seed: 40_040, difficulty });
  const closingCashCents = CAMPAIGN_RULES.victoryCashCents + 12_000;
  const state: GameState = {
    ...base,
    day: CAMPAIGN_RULES.durationDays,
    phase: 'report',
    cashCents: closingCashCents,
    reputation: 82,
    venueId: 'departmentStore',
    candidateStaff: candidatePoolForDay(base.seed, CAMPAIGN_RULES.durationDays),
    lastSettledDay: CAMPAIGN_RULES.durationDays - 1,
    equipment: {
      grinder: 3,
      espressoMachine: 3,
      batchBrewer: 3,
      refrigeration: 3,
      pos: 3,
      serviceCounter: 3,
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
    candidateStaff: candidatePoolForDay(base.seed, 12),
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
    cashCents: 200_000,
    reputation: 80,
    lastSettledDay: 18,
    candidateStaff: candidatePoolForDay(base.seed, 18),
  };
  return createSaveEnvelope(state, fixturePreferences(), createDefaultMeta());
}

/** Day 3 department roster with ten scheduled staff and two role-diverse vacancies. */
export function departmentWorkforceEnvelope(): SaveEnvelope {
  const base = createCampaign({ seed: 8_404, difficulty: 'standard' });
  const firstTwoDays = [1, 2].flatMap((day) =>
    candidatePoolForDay(base.seed, day).map((member) => ({ ...member, hiredOnDay: day })),
  );
  const dayThreePool = candidatePoolForDay(base.seed, 3);
  const dayThreeHires = dayThreePool.slice(0, 2).map((member) => ({ ...member, hiredOnDay: 3 }));
  const staff = [...firstTwoDays, ...dayThreeHires];
  const state: GameState = {
    ...base,
    day: 3,
    cashCents: 200_000,
    reputation: 82,
    venueId: 'departmentStore',
    staff,
    candidateStaff: dayThreePool.slice(2),
    plan: {
      ...base.plan,
      scheduledStaffIds: staff.map(({ id }) => id),
      stationAssignments: defaultStationAssignments('departmentStore', staff),
    },
    equipment: {
      grinder: 3,
      espressoMachine: 3,
      batchBrewer: 3,
      refrigeration: 3,
      pos: 3,
      serviceCounter: 3,
    },
  };
  return createSaveEnvelope(state, fixturePreferences(), createDefaultMeta());
}

/** Valid Day 3 planning fixture proving live LIFO depletion and post-rush expiry. */
export function stockLifecyclePlanningEnvelope(): SaveEnvelope {
  const base = createCampaign({ seed: 50_504 });
  const state: GameState = {
    ...base,
    day: 3,
    candidateStaff: candidatePoolForDay(base.seed, 3),
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
  const venueId = options.venueId ?? campaign.venueId;
  const staff: GameState['staff'] = [];
  let fixtureDay = 1;
  while (staff.length < scheduledStaffCount) {
    const eligible = candidatePoolForDay(campaign.seed, fixtureDay).filter((member) =>
      staffRoleAvailableAtVenue(member.role, venueId),
    );
    for (const member of eligible) {
      if (staff.length >= scheduledStaffCount) break;
      staff.push({ ...member, hiredOnDay: fixtureDay });
    }
    if (staff.length < scheduledStaffCount) fixtureDay += 1;
  }
  const dayPrefix = `d${fixtureDay}`;
  const equipment = { ...campaign.equipment, ...options.equipment };
  const scheduledStaffIds = staff.map(({ id }) => id);
  const stationAssignments = defaultStationAssignments(venueId, staff);
  const started = startRush({
    ...campaign,
    day: fixtureDay,
    candidateStaff: candidatePoolForDay(campaign.seed, fixtureDay).filter(
      ({ id }) => !staff.some((member) => member.id === id),
    ),
    equipment,
    plan: {
      ...campaign.plan,
      activeMenu: ['flatWhite'],
      purchases: { ...campaign.plan.purchases, oatMilk: 1 },
      scheduledStaffIds,
      stationAssignments,
    },
    staff,
    venueId,
    weather: options.weather ?? campaign.weather,
  });
  if (!started.rush) throw new Error('Living-rush fixture requires an active rush.');
  const activeCustomer = livingRushCustomer(`${dayPrefix}-c1`, 'enthusiast');
  const completedCustomer = livingRushCustomer(`${dayPrefix}-c20`, 'student');
  const startedOrders = [completedCustomer.order, activeCustomer.order];
  const consumedInventory = startedOrders.reduce(
    (inventory, order) => consumeIngredientsAtServiceStart(inventory, order.ingredientAmounts),
    started.inventory,
  );
  const consumed = startedOrders
    .flatMap((order) => order.ingredientAmounts)
    .reduce<RushStats['consumed']>((totals, ingredient) => {
      totals[ingredient.ingredientId] = (totals[ingredient.ingredientId] ?? 0) + ingredient.amount;
      return totals;
    }, {});
  const ingredientCostCents = startedOrders.reduce(
    (total, order) =>
      total +
      Math.round(
        order.ingredientAmounts.reduce(
          (cost, ingredient) =>
            cost + ingredient.amount * INGREDIENT_UNIT_COST_CENTS[ingredient.ingredientId],
          0,
        ),
      ),
    0,
  );
  const queue = Array.from({ length: options.queueCount ?? 12 }, (_, index) =>
    livingRushCustomer(
      `${dayPrefix}-c${index + 2}`,
      (['commuter', 'student', 'enthusiast', 'regular'] as const)[index % 4] ?? 'regular',
    ),
  );
  const completedJobId = `${dayPrefix}-j0`;
  const activeJobId = `${dayPrefix}-j1`;
  const serviceAggregates = started.rush.stats.serviceAggregates.map((aggregate) =>
    aggregate.stationId === 'espressoBar' && aggregate.laneId === 'normal'
      ? {
          ...aggregate,
          completedJobIds: [completedJobId],
          served: 1,
          revenueCents: 725,
          totalWaitTicks: 8,
          satisfactionTotal: 90,
        }
      : aggregate,
  );
  const rush = {
    ...started.rush,
    tick: 48,
    durationTicks: options.endingSoon ? 49 : started.rush.durationTicks,
    speed: options.endingSoon ? (1 as const) : (4 as const),
    isPaused: options.paused ?? true,
    normalQueue: queue,
    expressQueue: [],
    serviceJobsByStation: {
      ...emptyServiceJobs(),
      espressoBar: {
        id: activeJobId,
        stationId: 'espressoBar' as const,
        laneId: 'normal' as const,
        customer: activeCustomer,
        remainingTicks: 12,
        totalTicks: 20,
      },
    },
    consecutiveExpressStartsByStation: { espressoBar: 0, brewBar: 0, coldBar: 0 },
    nextServiceJobSequence: 2,
    eventTriggerTicks: [],
    nextCustomerId: 30,
    nextActivitySequence: 7,
    recentActivity: [
      {
        id: `${dayPrefix}-e0`,
        sequence: 0,
        tick: 20,
        customerId: completedCustomer.id,
        segment: completedCustomer.segment,
        stationId: 'espressoBar' as const,
        laneId: 'normal' as const,
        jobId: null,
        type: 'arrival' as const,
      },
      {
        id: `${dayPrefix}-e1`,
        sequence: 1,
        tick: 21,
        customerId: completedCustomer.id,
        segment: completedCustomer.segment,
        stationId: 'espressoBar' as const,
        laneId: 'normal' as const,
        jobId: completedJobId,
        type: 'serviceStarted' as const,
        drinkId: 'flatWhite' as const,
        size: 'large' as const,
        milk: 'oat' as const,
      },
      {
        id: `${dayPrefix}-e2`,
        sequence: 2,
        tick: 40,
        customerId: completedCustomer.id,
        segment: completedCustomer.segment,
        stationId: 'espressoBar' as const,
        laneId: 'normal' as const,
        jobId: completedJobId,
        type: 'sale' as const,
        drinkId: 'flatWhite' as const,
        size: 'large' as const,
        milk: 'oat' as const,
        priceCents: 725,
      },
      {
        id: `${dayPrefix}-e3`,
        sequence: 3,
        tick: 42,
        customerId: `${dayPrefix}-c21`,
        segment: 'commuter' as const,
        stationId: 'espressoBar' as const,
        laneId: 'normal' as const,
        jobId: null,
        type: 'arrival' as const,
      },
      {
        id: `${dayPrefix}-e4`,
        sequence: 4,
        tick: 42,
        customerId: `${dayPrefix}-c21`,
        segment: 'commuter' as const,
        stationId: 'espressoBar' as const,
        laneId: 'normal' as const,
        jobId: null,
        type: 'walkaway' as const,
        reason: 'stockout' as const,
      },
      {
        id: `${dayPrefix}-e5`,
        sequence: 5,
        tick: 45,
        customerId: activeCustomer.id,
        segment: activeCustomer.segment,
        stationId: activeCustomer.stationId,
        laneId: activeCustomer.laneId,
        jobId: null,
        type: 'arrival' as const,
      },
      {
        id: `${dayPrefix}-e6`,
        sequence: 6,
        tick: 46,
        customerId: activeCustomer.id,
        segment: activeCustomer.segment,
        stationId: activeCustomer.stationId,
        laneId: activeCustomer.laneId,
        jobId: activeJobId,
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
      ingredientCostCents,
      totalWaitTicks: 8,
      satisfactionTotal: 90,
      soldByDrink: { flatWhite: 1 },
      consumed,
      arrivalsBySegment: { commuter: 4, student: 4, enthusiast: 4, regular: 3 },
      servedBySegment: { student: 1 },
      peakQueue: 12,
      serviceAggregates,
    },
  };
  return createSaveEnvelope(
    { ...started, inventory: consumedInventory, rush },
    { ...fixturePreferences(), reducedMotion: options.reducedMotion ?? false },
    createDefaultMeta(),
  );
}

/** Paused canonical department rush with three active station jobs and one normal waiter. */
export function parallelServiceEnvelope(): SaveEnvelope {
  const planning = departmentWorkforceEnvelope().activeRun;
  if (!planning) throw new Error('Expected department planning fixture.');
  const configured = prepareDay(planning, {
    activeMenu: ['espresso', 'flatWhite', 'batchBrew', 'coldBrew'],
    expressDrinkIds: ['espresso', 'batchBrew', 'coldBrew'],
    purchases: {
      ...emptyPurchases(),
      houseBeans: 2,
      dairyMilk: 1,
      coldBrewConcentrate: 1,
      ice: 1,
    },
  });
  const started = startRush(configured);
  if (!started.rush) throw new Error('Expected parallel fixture rush.');
  const customers = [
    parallelFixtureCustomer(started.day, 1, 'espresso', 'express'),
    parallelFixtureCustomer(started.day, 2, 'batchBrew', 'express'),
    parallelFixtureCustomer(started.day, 3, 'coldBrew', 'express'),
  ];
  const normal = parallelFixtureCustomer(started.day, 4, 'flatWhite', 'normal');
  const active = advanceTick({
    ...started,
    rngState: 15_365,
    rush: {
      ...started.rush,
      eventTriggerTicks: [],
      normalQueue: [normal],
      expressQueue: customers,
      nextCustomerId: 5,
      stats: {
        ...started.rush.stats,
        arrivals: 4,
        arrivalsBySegment: { commuter: 4 },
        peakQueue: 4,
      },
    },
  });
  return createSaveEnvelope(togglePause(active), fixturePreferences(), createDefaultMeta());
}

/** Active-rush fixture with both canonical and older read-only history reports. */
export function reportHistoryEnvelope(): SaveEnvelope {
  const generated = completeFixtureReportState(7_505).report;
  if (!generated) throw new Error('Expected a completed report.');
  if (!generated.chargeGroups) throw new Error('Expected canonical report charges.');
  const currentReport: DayReport = reportForDay(generated, 2);
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
    stationId: 'espressoBar',
    laneId: 'normal',
    order: {
      drinkId: 'flatWhite',
      size: 'large',
      milk: 'oat',
      priceCents: 725,
      ingredientAmounts: [
        { ingredientId: 'houseBeans', amount: 22 },
        { ingredientId: 'oatMilk', amount: 220 },
      ],
      preparationTicks: 20,
    },
    arrivedAtTick: 20,
    patienceTicks: 1_000,
    waitedTicks: 10,
  };
}

function parallelFixtureCustomer(
  day: number,
  sequence: number,
  drinkId: 'espresso' | 'flatWhite' | 'batchBrew' | 'coldBrew',
  laneId: Customer['laneId'],
): Customer {
  const stationId =
    drinkId === 'batchBrew' ? 'brewBar' : drinkId === 'coldBrew' ? 'coldBar' : 'espressoBar';
  const ingredientAmounts =
    drinkId === 'batchBrew'
      ? [{ ingredientId: 'houseBeans' as const, amount: 15 }]
      : drinkId === 'coldBrew'
        ? [
            { ingredientId: 'coldBrewConcentrate' as const, amount: 90 },
            { ingredientId: 'ice' as const, amount: 1 },
          ]
        : drinkId === 'flatWhite'
          ? [
              { ingredientId: 'houseBeans' as const, amount: 18 },
              { ingredientId: 'dairyMilk' as const, amount: 150 },
            ]
          : [{ ingredientId: 'houseBeans' as const, amount: 18 }];
  return {
    id: `d${day}-c${sequence}`,
    segment: 'commuter',
    stationId,
    laneId,
    order: {
      drinkId,
      size: 'regular',
      milk: drinkId === 'flatWhite' ? 'dairy' : 'none',
      priceCents:
        drinkId === 'espresso'
          ? 400
          : drinkId === 'flatWhite'
            ? 550
            : drinkId === 'batchBrew'
              ? 500
              : 620,
      ingredientAmounts,
      preparationTicks: 20,
    },
    arrivedAtTick: 0,
    patienceTicks: 1_000,
    waitedTicks: 0,
  };
}

function fixtureReport(base: GameState, day: number, closingCashCents: number): DayReport {
  const serviceAggregates = emptyServiceAggregates();
  const legacyAggregate = serviceAggregates[0];
  if (!legacyAggregate) throw new Error('Expected canonical legacy service aggregate.');
  legacyAggregate.completedJobIds = Array.from(
    { length: 18 },
    (_, index) => `d${day}-migrated-complete-${index}`,
  );
  legacyAggregate.served = 18;
  legacyAggregate.totalWaitTicks = 173;
  legacyAggregate.satisfactionTotal = 1_584;
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
    serviceAggregates,
    bottleneck: 'No major bottleneck — service flowed well',
    explanations: ['Validated deterministic outcome fixture ready for final settlement.'],
    settled: false,
  };
}

function reportForDay(report: DayReport, day: number): DayReport {
  return {
    ...report,
    day,
    settled: true,
    serviceAggregates: report.serviceAggregates.map((aggregate) => ({
      ...aggregate,
      completedJobIds: aggregate.completedJobIds.map((jobId) =>
        jobId.replace(/^d\d+-/, `d${day}-`),
      ),
    })),
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
