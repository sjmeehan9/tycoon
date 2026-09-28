import {
  ALL_DRINK_IDS,
  CAMPAIGN_RULES,
  DEPARTMENT_IMPROVEMENT_IDS,
  EQUIPMENT,
  EQUIPMENT_IDS,
  IMPROVEMENTS,
  PURCHASE_PACKAGES,
  VENUE_IDS,
  VENUE_PROMOTIONS,
  VENUE_WORKFORCE_CAPACITY,
  emptyPurchases,
  staffRoleAvailableAtVenue,
} from '../../src/content/gameContent';
import {
  advanceTick,
  buyEquipment,
  buyImprovement,
  closeDay,
  createCampaign,
  defaultStationAssignments,
  hireStaff,
  ingredientQuantity,
  prepareDay,
  promoteVenue,
  resolveEvent,
  startNextDay,
  startRush,
  type Difficulty,
  type DrinkId,
  type EquipmentId,
  type GameState,
  type IngredientId,
  type IngredientPurchases,
  type StaffRole,
} from '../../src/game';

export const BALANCE_SEEDS = [
  101, 211, 307, 401, 503, 601, 709, 809, 907, 1_009, 1_103, 1_201, 1_301, 1_409, 1_511, 1_601,
  1_709, 1_801, 1_907, 2_011,
] as const;

export type BalanceStrategyId = 'premium-quality' | 'value-throughput';

export interface BalanceStrategySignature {
  id: BalanceStrategyId;
  menu: readonly DrinkId[];
  dialIn: GameState['plan']['dialIn'];
  staffingRoles: readonly StaffRole[];
  equipmentPriority: readonly EquipmentId[];
  expressDrinkIds: readonly DrinkId[];
  averagePriceCents: number;
}

export const BALANCE_STRATEGY_SIGNATURES: Readonly<
  Record<BalanceStrategyId, BalanceStrategySignature>
> = {
  'premium-quality': {
    id: 'premium-quality',
    menu: ['espresso', 'longBlack', 'flatWhite'],
    dialIn: 'quality',
    staffingRoles: ['barista', 'manager'],
    equipmentPriority: ['grinder', 'espressoMachine', 'pos'],
    expressDrinkIds: [],
    averagePriceCents: Math.round((500 + 580 + 660) / 3),
  },
  'value-throughput': {
    id: 'value-throughput',
    menu: ['longBlack', 'batchBrew', 'coldBrew'],
    dialIn: 'balanced',
    staffingRoles: ['frontOfHouse', 'runner'],
    equipmentPriority: ['batchBrewer', 'serviceCounter', 'pos'],
    expressDrinkIds: ['batchBrew'],
    averagePriceCents: Math.round((450 + 450 + 560) / 3),
  },
};

export interface BalanceCampaignResult {
  strategyId: BalanceStrategyId;
  difficulty: Difficulty;
  seed: number;
  final: GameState;
  departmentDay: number | null;
  promotionDays: Partial<Record<GameState['venueId'], number>>;
  equipmentPurchaseDays: EquipmentPurchaseDays;
}

export type EquipmentPurchaseDays = Record<EquipmentId, Partial<Record<1 | 2 | 3, number>>>;

/** Run one complete strategy through public deterministic commands only. */
export function simulateBalanceCampaign(
  seed: number,
  difficulty: Difficulty,
  strategyId: BalanceStrategyId,
): BalanceCampaignResult {
  let state = createCampaign({ seed, difficulty });
  let departmentDay: number | null = null;
  const promotionDays: Partial<Record<GameState['venueId'], number>> = { cart: 1 };
  const equipmentPurchaseDays = emptyEquipmentPurchaseDays();
  while (state.phase === 'planning') {
    state = hireForStrategy(state, strategyId);
    state = prepareDay(state, strategyPlan(state, strategyId));
    state = runRushWithStrategy(startRush(state), strategyId);
    state = closeDay(state);
    if (state.phase !== 'reinvest') break;
    const beforeVenue = state.venueId;
    const beforeEquipment = { ...state.equipment };
    state = investForStrategy(state, strategyId);
    recordEquipmentPurchases(equipmentPurchaseDays, beforeEquipment, state.equipment, state.day);
    if (state.venueId !== beforeVenue) promotionDays[state.venueId] = state.day;
    if (state.venueId === 'departmentStore' && departmentDay === null) {
      departmentDay = state.day;
    }
    state = startNextDay(state);
  }
  return {
    strategyId,
    difficulty,
    seed,
    final: state,
    departmentDay,
    promotionDays,
    equipmentPurchaseDays,
  };
}

function emptyEquipmentPurchaseDays(): EquipmentPurchaseDays {
  return {
    grinder: {},
    espressoMachine: {},
    batchBrewer: {},
    refrigeration: {},
    pos: {},
    serviceCounter: {},
  };
}

function recordEquipmentPurchases(
  purchaseDays: EquipmentPurchaseDays,
  before: GameState['equipment'],
  after: GameState['equipment'],
  day: number,
): void {
  for (const equipmentId of EQUIPMENT_IDS) {
    for (let level = before[equipmentId] + 1; level <= after[equipmentId]; level += 1) {
      if (level >= 1 && level <= 3) purchaseDays[equipmentId][level as 1 | 2 | 3] = day;
    }
  }
}

/** Plausible repeated over-ordering through public commands, with no state or clock overrides. */
export function simulateMismanagement(seed: number, difficulty: Difficulty): GameState {
  let state = createCampaign({ seed, difficulty });
  while (state.phase === 'planning') {
    state = hireMaximumAvailable(state);
    const scheduled = state.staff.slice(
      0,
      VENUE_WORKFORCE_CAPACITY[state.venueId].scheduleCapacity,
    );
    const purchases = affordablePurchases(
      state,
      {
        ...emptyPurchases(),
        houseBeans: 1,
        dairyMilk: 2,
        oatMilk: 2,
        soyMilk: 2,
        ice: 2,
        coldBrewConcentrate: 2,
      },
      ['houseBeans', 'coldBrewConcentrate', 'dairyMilk', 'oatMilk', 'soyMilk', 'ice'],
    );
    state = prepareDay(state, {
      activeMenu: ['espresso'],
      pricesCents: { espresso: 250 },
      purchases,
      dialIn: 'speed',
      scheduledStaffIds: scheduled.map(({ id }) => id),
      stationAssignments: defaultStationAssignments(state.venueId, scheduled),
      expressDrinkIds: [],
    });
    state = closeDay(runRushWithStrategy(startRush(state), 'value-throughput'));
    if (state.phase === 'reinvest') state = startNextDay(mismanageInvestment(state));
  }
  return state;
}

function strategyPlan(
  state: GameState,
  strategyId: BalanceStrategyId,
): Parameters<typeof prepareDay>[1] {
  const signature = BALANCE_STRATEGY_SIGNATURES[strategyId];
  const scheduled = scheduledStrategyStaff(state, strategyId);
  const purchases =
    strategyId === 'premium-quality' ? premiumPurchases(state) : throughputPurchases(state);
  const pricesCents =
    strategyId === 'premium-quality'
      ? { espresso: 500, longBlack: 580, flatWhite: 660 }
      : { longBlack: 450, batchBrew: 450, coldBrew: 560 };
  return {
    activeMenu: [...signature.menu],
    pricesCents,
    purchases,
    dialIn: signature.dialIn,
    beanId: strategyId === 'premium-quality' ? 'singleOriginBeans' : 'houseBeans',
    scheduledStaffIds: scheduled.map(({ id }) => id),
    stationAssignments: strategyStationAssignments(state, strategyId, scheduled),
    expressDrinkIds: state.venueId === 'departmentStore' ? [...signature.expressDrinkIds] : [],
  };
}

function premiumPurchases(state: GameState): IngredientPurchases {
  const target = venueTarget(state.venueId, [500, 750, 1_050, 1_650]);
  const milkTarget = venueTarget(state.venueId, [2_000, 2_800, 3_800, 5_500]);
  return affordablePurchases(
    state,
    {
      ...emptyPurchases(),
      singleOriginBeans: packagesToTarget(state, 'singleOriginBeans', target, 500),
      dairyMilk: packagesToTarget(state, 'dairyMilk', milkTarget, 2_000),
    },
    ['singleOriginBeans', 'dairyMilk'],
  );
}

function throughputPurchases(state: GameState): IngredientPurchases {
  const beanTarget = venueTarget(state.venueId, [500, 800, 1_150, 1_800]);
  const concentrateTarget = venueTarget(state.venueId, [1_000, 1_500, 2_000, 3_000]);
  const iceTarget = venueTarget(state.venueId, [20, 30, 40, 60]);
  const milkTarget = venueTarget(state.venueId, [400, 600, 800, 1_000]);
  return affordablePurchases(
    state,
    {
      ...emptyPurchases(),
      houseBeans: packagesToTarget(state, 'houseBeans', beanTarget, 500),
      coldBrewConcentrate: packagesToTarget(state, 'coldBrewConcentrate', concentrateTarget, 2_000),
      ice: packagesToTarget(state, 'ice', iceTarget, 20),
      dairyMilk: packagesToTarget(state, 'dairyMilk', milkTarget, 2_000),
      oatMilk: packagesToTarget(state, 'oatMilk', milkTarget, 1_000),
      soyMilk: packagesToTarget(state, 'soyMilk', milkTarget, 1_000),
    },
    ['houseBeans', 'coldBrewConcentrate', 'ice', 'dairyMilk', 'oatMilk', 'soyMilk'],
  );
}

function affordablePurchases(
  state: GameState,
  desired: IngredientPurchases,
  priority: readonly IngredientId[],
): IngredientPurchases {
  const purchases = emptyPurchases();
  let availableCents = Math.max(0, state.cashCents - CAMPAIGN_RULES.overdraftFloorCents);
  const orderedIds = [
    ...priority,
    ...PURCHASE_PACKAGES.map(({ ingredientId }) => ingredientId).filter(
      (ingredientId) => !priority.includes(ingredientId),
    ),
  ];
  for (const ingredientId of orderedIds) {
    const packageConfig = PURCHASE_PACKAGES.find((item) => item.ingredientId === ingredientId);
    if (!packageConfig) throw new Error(`Missing package for ${ingredientId}.`);
    const quantity = Math.min(
      desired[ingredientId],
      Math.floor(availableCents / packageConfig.costCents),
    );
    purchases[ingredientId] = quantity;
    availableCents -= quantity * packageConfig.costCents;
  }
  return purchases;
}

function packagesToTarget(
  state: GameState,
  ingredientId: IngredientId,
  target: number,
  packageSize: number,
): number {
  return Math.max(
    0,
    Math.min(
      20,
      Math.ceil((target - ingredientQuantity(state.inventory, ingredientId)) / packageSize),
    ),
  );
}

function venueTarget(
  venueId: GameState['venueId'],
  values: readonly [number, number, number, number],
): number {
  return values[VENUE_IDS.indexOf(venueId)] ?? values[0];
}

function hireForStrategy(state: GameState, strategyId: BalanceStrategyId): GameState {
  const desired =
    strategyId === 'premium-quality'
      ? ({ barista: 1, manager: state.venueId === 'departmentStore' ? 1 : 0 } as const)
      : ({
          frontOfHouse: 2,
          runner: state.venueId === 'departmentStore' ? 2 : 0,
        } as const);
  let working = state;
  for (const [role, count] of Object.entries(desired) as Array<[StaffRole, number]>) {
    while (working.staff.filter((member) => member.role === role).length < count) {
      const candidate = working.candidateStaff.find((member) => member.role === role);
      if (!candidate) break;
      working = hireStaff(working, candidate.id);
    }
  }
  return working;
}

function scheduledStrategyStaff(
  state: GameState,
  strategyId: BalanceStrategyId,
): GameState['staff'] {
  if (state.venueId !== 'departmentStore') return [];
  if (strategyId === 'premium-quality') {
    const barista = state.staff.find((member) => member.role === 'barista');
    const manager = state.staff.find((member) => member.role === 'manager');
    const needsManager = !state.history.some(
      (report) => report.causeSnapshot?.venueId === 'departmentStore',
    );
    return [barista, needsManager ? manager : undefined].filter(
      (member): member is GameState['staff'][number] => member !== undefined,
    );
  }
  const roles = new Set(BALANCE_STRATEGY_SIGNATURES[strategyId].staffingRoles);
  return state.staff.filter((member) => roles.has(member.role));
}

function strategyStationAssignments(
  state: GameState,
  strategyId: BalanceStrategyId,
  scheduled: GameState['staff'],
): ReturnType<typeof defaultStationAssignments> {
  if (state.venueId !== 'departmentStore' || strategyId !== 'premium-quality') {
    return defaultStationAssignments(state.venueId, scheduled);
  }
  return {
    espressoBar: scheduled.map(({ id }) => id),
    brewBar: [],
    coldBar: [],
  };
}

function runRushWithStrategy(initial: GameState, strategyId: BalanceStrategyId): GameState {
  let state = initial;
  let safety = 0;
  while (state.phase !== 'report' && safety < 1_000) {
    if (state.phase === 'event') {
      const choices = state.rush?.pendingEvent?.choices;
      const choice = strategyId === 'premium-quality' ? choices?.at(-1) : choices?.[0];
      if (!choice) throw new Error('Balance event had no configured choice.');
      state = resolveEvent(state, choice.id);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (state.phase !== 'report') throw new Error('Balance rush did not complete.');
  return state;
}

function investForStrategy(initial: GameState, strategyId: BalanceStrategyId): GameState {
  let state = initial;
  const reserve = 3_000;
  const buyNext = (equipmentId: EquipmentId, minimumReserve = reserve): void => {
    const current = state.equipment[equipmentId];
    const tier = EQUIPMENT[equipmentId].tiers.find(({ level }) => level === current + 1);
    if (
      tier &&
      VENUE_IDS.indexOf(state.venueId) >= VENUE_IDS.indexOf(tier.requiresVenue) &&
      state.cashCents >= tier.costCents + minimumReserve
    ) {
      state = buyEquipment(state, equipmentId);
    }
  };

  if (state.venueId === 'cart') {
    buyNext('grinder');
    buyNext('espressoMachine');
    if (
      !state.improvements.includes('street-sign') &&
      state.cashCents >= IMPROVEMENTS['street-sign'].costCents + reserve
    ) {
      state = buyImprovement(state, 'street-sign');
    }
  } else if (state.venueId === 'kiosk') {
    buyNext('grinder');
    buyNext('espressoMachine');
    buyNext('refrigeration');
    buyNext('pos');
    if (strategyId === 'value-throughput') buyNext('batchBrewer');
  } else if (state.venueId === 'cafe' && strategyId === 'value-throughput') {
    buyNext('batchBrewer');
    buyNext('serviceCounter');
  } else if (state.venueId === 'departmentStore') {
    if (strategyId === 'premium-quality') {
      buyNext('espressoMachine', CAMPAIGN_RULES.victoryCashCents + 20_000);
      buyNext('pos', CAMPAIGN_RULES.victoryCashCents + 20_000);
      buyNext('grinder', CAMPAIGN_RULES.victoryCashCents + 20_000);
      if (
        state.equipment.espressoMachine === 3 &&
        state.equipment.pos === 3 &&
        state.cashCents >=
          CAMPAIGN_RULES.victoryCashCents +
            IMPROVEMENTS['espresso-order-pass'].costCents +
            20_000 &&
        !state.improvements.includes('espresso-order-pass')
      ) {
        state = buyImprovement(state, 'espresso-order-pass');
      }
    } else {
      for (const equipmentId of [
        'batchBrewer',
        'serviceCounter',
        'refrigeration',
        'pos',
        'espressoMachine',
        'grinder',
      ] as const) {
        buyNext(equipmentId, CAMPAIGN_RULES.victoryCashCents);
      }
      for (const improvementId of DEPARTMENT_IMPROVEMENT_IDS) {
        const improvement = IMPROVEMENTS[improvementId];
        const prerequisitesMet = Object.entries(improvement.requiredEquipment).every(
          ([equipmentId, level]) => state.equipment[equipmentId as EquipmentId] >= level,
        );
        if (
          prerequisitesMet &&
          !state.improvements.includes(improvementId) &&
          state.cashCents >= improvement.costCents + CAMPAIGN_RULES.victoryCashCents
        ) {
          state = buyImprovement(state, improvementId);
        }
      }
    }
  }

  if (state.venueId !== 'departmentStore') {
    const promotion = VENUE_PROMOTIONS[state.venueId];
    const promotionReserve =
      strategyId === 'premium-quality' && state.venueId === 'cafe' ? 95_000 : reserve;
    const ready =
      state.reputation >= promotion.reputationRequired &&
      state.cashCents >= promotion.costCents + promotionReserve &&
      Object.entries(promotion.requiredEquipment).every(
        ([equipmentId, level]) => state.equipment[equipmentId as EquipmentId] >= level,
      );
    if (ready) state = promoteVenue(state);
  }
  return state;
}

function hireMaximumAvailable(initial: GameState): GameState {
  let state = initial;
  for (const candidate of initial.candidateStaff) {
    if (state.staff.length >= VENUE_WORKFORCE_CAPACITY[state.venueId].rosterCapacity) break;
    if (!staffRoleAvailableAtVenue(candidate.role, state.venueId)) continue;
    state = hireStaff(state, candidate.id);
  }
  return state;
}

function mismanageInvestment(initial: GameState): GameState {
  let state = initial;
  if (state.venueId === 'departmentStore') return state;
  const promotion = VENUE_PROMOTIONS[state.venueId];
  for (const equipmentId of Object.keys(promotion.requiredEquipment) as EquipmentId[]) {
    const targetLevel = promotion.requiredEquipment[equipmentId] ?? 0;
    while (state.equipment[equipmentId] < targetLevel) {
      const tier = EQUIPMENT[equipmentId].tiers.find(
        ({ level }) => level === state.equipment[equipmentId] + 1,
      );
      if (!tier || state.cashCents < tier.costCents) break;
      state = buyEquipment(state, equipmentId);
    }
  }
  if (
    !state.improvements.includes('street-sign') &&
    state.cashCents >= IMPROVEMENTS['street-sign'].costCents
  ) {
    state = buyImprovement(state, 'street-sign');
  }
  const prerequisitesMet = Object.entries(promotion.requiredEquipment).every(
    ([equipmentId, level]) => state.equipment[equipmentId as EquipmentId] >= level,
  );
  if (
    prerequisitesMet &&
    state.reputation >= promotion.reputationRequired &&
    state.cashCents >= promotion.costCents
  ) {
    state = promoteVenue(state);
  }
  return state;
}

/** Static proof that strategy names represent materially different command policies. */
export function validateBalanceStrategyDiversity(): void {
  const premium = BALANCE_STRATEGY_SIGNATURES['premium-quality'];
  const throughput = BALANCE_STRATEGY_SIGNATURES['value-throughput'];
  const overlap = premium.menu.filter((drinkId) => throughput.menu.includes(drinkId)).length;
  if (overlap > 1) throw new Error('Balance menus overlap too heavily.');
  if (premium.averagePriceCents - throughput.averagePriceCents < 80) {
    throw new Error('Balance price positions must differ by at least 80 cents.');
  }
  if (premium.dialIn === throughput.dialIn) throw new Error('Balance dial-ins must differ.');
  if (premium.staffingRoles.some((role) => throughput.staffingRoles.includes(role))) {
    throw new Error('Balance staffing policies must differ.');
  }
  if (premium.equipmentPriority[0] === throughput.equipmentPriority[0]) {
    throw new Error('Balance equipment priorities must differ.');
  }
  if (premium.expressDrinkIds.length === throughput.expressDrinkIds.length) {
    throw new Error('Balance express-lane policies must differ.');
  }
  if (new Set([...premium.menu, ...throughput.menu]).size > ALL_DRINK_IDS.length) {
    throw new Error('Balance strategies reference unconfigured drinks.');
  }
}
