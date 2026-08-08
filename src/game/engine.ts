import {
  BEAN_DETAILS,
  CAMPAIGN_RULES,
  CART_IMPROVEMENT_COST_CENTS,
  DAY_PLAN_LIMITS,
  DEPARTMENT_WORKLOAD_DELAYS,
  DRINK_MAP,
  EQUIPMENT,
  EQUIPMENT_IDS,
  INGREDIENT_DETAILS,
  INGREDIENT_UNIT_COST_CENTS,
  INITIAL_CASH_CENTS,
  INITIAL_REPUTATION,
  MILK_SURCHARGE_CENTS,
  PURCHASE_PACKAGES,
  RUSH_ACTIVITY_LIMIT,
  RUSH_DURATION_TICKS,
  SCENARIO_DETAILS,
  SIZE_SURCHARGE_CENTS,
  STAFF_ROLES,
  STAFF_ROLE_DETAILS,
  TICKS_PER_SECOND,
  VENUE_DEMAND_FACTOR,
  VENUE_MENU_CAPACITY,
  VENUE_PROMOTIONS,
  VENUES,
  WEATHER_DETAILS,
  createDefaultPlan,
  emptyInventory,
  emptyPurchases,
  equipmentTierAtLevel,
  milkIngredient,
  venueMeetsRequirement,
  workforceCapacityFor,
  staffRoleAvailableAtVenue,
  weatherForDay,
} from '../content/gameContent';
import { GameRuleError } from './errors';
import { baseDrinkChoiceWeight, milkForDraw, segmentForDraw, sizeForDraw } from './demandModel';
import { applyDemandInfluence, type ArrivalDemandInfluenceId } from './demandInfluences';
import {
  addPlannedPurchases,
  completeIngredientTotals,
  consumeIngredientsLifo,
  expireInventoryAfterRush,
  extendInventoryRefrigeration,
  hasIngredients,
  inventoryTotals,
  plannedPurchaseTotals,
} from './inventory';
import { nextRandom, randomInt } from './prng';
import {
  CANDIDATES_PER_DAY,
  LEGACY_STAFF_NAMES,
  MAX_STAFF_NAME_DAY,
  candidateStaffId,
  candidateStaffName,
} from './staffNames';
import type {
  CampaignOptions,
  Customer,
  CustomerSegment,
  DayPlan,
  DayReport,
  DrinkConfig,
  DrinkId,
  DrinkSize,
  EquipmentId,
  EventChoice,
  GameCommand,
  GameState,
  IngredientAmount,
  IngredientId,
  MilkChoice,
  Order,
  PlanPatch,
  ReportChargeGroup,
  RushSpeed,
  RushActivityEvent,
  RushState,
  RushStats,
  RushWalkawayReason,
  SimulationEvent,
  StaffMember,
  StaffRoleOperationalEffect,
  StaffTrait,
  StepDirection,
} from './types';

const STAFF_TRAITS: StaffTrait[] = ['quickHands', 'peoplePerson', 'perfectionist', 'steady'];

/** Registry identities consumed by the arrival-rate engine path. */
export const ARRIVAL_DEMAND_ENGINE_INFLUENCES = [
  'arrivalAggregatePrice',
  'arrivalReputation',
  'arrivalImprovements',
  'arrivalDialIn',
  'arrivalBean',
  'arrivalWeather',
  'arrivalVenue',
  'arrivalScenario',
  'arrivalTeamEquipment',
  'arrivalQueueWait',
  'arrivalAvailability',
  'arrivalRushEvent',
] as const satisfies readonly ArrivalDemandInfluenceId[];

/** Maximum distinct drink/size/milk variants a single configured rush can charge. */
export const MAX_REPORT_CHARGE_GROUPS = [...DRINK_MAP.values()].reduce(
  (total, drink) => total + drink.variants.length * drink.allowedMilks.length,
  0,
);

/** Highest canonical order charge reachable from bounded plan and modifier values. */
export const MAX_REPORT_CHARGE_PRICE_CENTS =
  DAY_PLAN_LIMITS.priceCents.maximum +
  SIZE_SURCHARGE_CENTS +
  Math.max(...Object.values(MILK_SURCHARGE_CENTS));

/** Lowest canonical order charge reachable from the bounded morning plan. */
export const MIN_REPORT_CHARGE_PRICE_CENTS = DAY_PLAN_LIMITS.priceCents.minimum;

const LANEWAY_EVENT: SimulationEvent = {
  id: 'office-coffee-run',
  title: 'The office coffee run arrives',
  description: 'A nearby studio wants a tray immediately. The queue is already eyeing the clock.',
  choices: [
    {
      id: 'take-order',
      label: 'Take the order',
      description: 'Add three impatient customers and gain a little afternoon buzz.',
      effect: { addCustomers: 3, demandMultiplier: 1.08, qualityBonus: -3 },
    },
    {
      id: 'protect-queue',
      label: 'Protect the queue',
      description: 'Politely decline. The regulars appreciate the calm service.',
      effect: { reputation: 1, qualityBonus: 2 },
    },
  ],
};

const WEATHER_EVENT: SimulationEvent = {
  id: 'sudden-downpour',
  title: 'The heavens open',
  description: 'A sharp Melbourne downpour sends pedestrians under every nearby awning.',
  choices: [
    {
      id: 'shelter-crowd',
      label: 'Shelter the crowd',
      description: 'Welcome them in. Demand rises, but the queue gets lively.',
      effect: { addCustomers: 2, demandMultiplier: 1.12, reputation: 1 },
    },
    {
      id: 'close-awning',
      label: 'Protect the machine',
      description: 'Keep the awning tight and service controlled.',
      effect: { demandMultiplier: 0.94, qualityBonus: 3 },
    },
  ],
};

const RUSH_EVENTS = [LANEWAY_EVENT, WEATHER_EVENT];

/** Create a deterministic, serializable campaign at the first morning plan. */
export function createCampaign(options: CampaignOptions): GameState {
  if (!Number.isFinite(options.seed)) throw new GameRuleError('Campaign seed must be a number.');
  const seed = Math.trunc(options.seed) >>> 0;
  const rngState = seed === 0 ? 0x6d2b79f5 : seed;
  const difficulty = options.difficulty ?? 'standard';
  if (difficulty !== 'standard' && difficulty !== 'hard') {
    throw new GameRuleError('Difficulty must be Standard or Hard.');
  }
  return {
    stateVersion: 4,
    campaignId: `laneway-${difficulty}-${seed.toString(16).padStart(8, '0')}`,
    seed,
    rngState,
    scenarioId: options.scenarioId ?? 'lanewayClassic',
    difficulty,
    mode: 'campaign',
    phase: 'planning',
    day: 1,
    cashCents: INITIAL_CASH_CENTS,
    reputation: INITIAL_REPUTATION,
    venueId: 'cart',
    weather: weatherForDay(seed, 1, options.scenarioId ?? 'lanewayClassic'),
    inventory: emptyInventory(),
    plan: createDefaultPlan(),
    rush: null,
    report: null,
    lastSettledDay: 0,
    staff: [],
    candidateStaff: candidatePoolForDay(seed, 1),
    equipment: {
      grinder: 0,
      espressoMachine: 0,
      batchBrewer: 0,
      refrigeration: 0,
      pos: 0,
      serviceCounter: 0,
    },
    improvements: [],
    history: [],
    outcome: null,
  };
}

/** Apply and validate morning planning changes without mutating campaign state. */
export function prepareDay(state: GameState, patch: PlanPatch): GameState {
  requirePhase(state, 'planning');
  const plan: DayPlan = {
    ...state.plan,
    activeMenu: patch.activeMenu ? [...new Set(patch.activeMenu)] : state.plan.activeMenu,
    pricesCents: { ...state.plan.pricesCents, ...patch.pricesCents },
    purchases: { ...state.plan.purchases, ...patch.purchases },
    dialIn: patch.dialIn ?? state.plan.dialIn,
    beanId: patch.beanId ?? state.plan.beanId,
    scheduledStaffIds: patch.scheduledStaffIds ?? state.plan.scheduledStaffIds,
  };
  validatePlan(state, plan);
  if (purchaseCost(plan) > state.cashCents - CAMPAIGN_RULES.overdraftFloorCents) {
    throw new GameRuleError('Those supplies exceed the available cash and overdraft buffer.');
  }
  return { ...state, plan };
}

/** Adjust one configured menu price by exactly one bounded planner increment. */
export function adjustPlanPrice(
  state: GameState,
  drinkId: DrinkId,
  direction: StepDirection,
): GameState {
  requirePhase(state, 'planning');
  assertStepDirection(direction);
  getDrink(drinkId);
  const limits = DAY_PLAN_LIMITS.priceCents;
  const current = state.plan.pricesCents[drinkId];
  const next = clamp(current + direction * limits.increment, limits.minimum, limits.maximum);
  if (next === current) return state;
  return prepareDay(state, { pricesCents: { [drinkId]: next } });
}

/** Adjust one supply order by exactly one bounded package increment. */
export function adjustPlanPurchase(
  state: GameState,
  ingredientId: IngredientId,
  direction: StepDirection,
): GameState {
  requirePhase(state, 'planning');
  assertStepDirection(direction);
  if (!PURCHASE_PACKAGES.some((item) => item.ingredientId === ingredientId)) {
    throw new GameRuleError('That supply package is not available.');
  }
  const limits = DAY_PLAN_LIMITS.packageQuantity;
  const current = state.plan.purchases[ingredientId];
  const next = clamp(current + direction * limits.increment, limits.minimum, limits.maximum);
  if (next === current) return state;
  return prepareDay(state, { purchases: { [ingredientId]: next } });
}

/** Commit supply purchases and begin the deterministic service rush. */
export function startRush(state: GameState): GameState {
  requirePhase(state, 'planning');
  validatePlan(state, state.plan);
  const suppliesCost = purchaseCost(state.plan);
  if (suppliesCost > state.cashCents - CAMPAIGN_RULES.overdraftFloorCents) {
    throw new GameRuleError('Reduce supply purchases before opening the business.');
  }
  const openingInventory = inventoryTotals(state.inventory);
  const purchasedInventory = plannedPurchaseTotals(state.plan);
  const inventory = addPlannedPurchases(
    state.inventory,
    state.plan,
    state.day,
    state.equipment.refrigeration,
  );
  const effects = operationalEffects(state);
  const rush: RushState = {
    tick: 0,
    durationTicks: RUSH_DURATION_TICKS,
    isPaused: false,
    speed: 1,
    queue: [],
    activeService: null,
    pendingEvent: null,
    resolvedEvents: [],
    eventTriggerTicks: createEventTriggerTicks(state),
    nextCustomerId: 1,
    demandMultiplier: 1,
    qualityBonus: 0,
    eventCashDeltaCents: 0,
    eventReputationDelta: 0,
    openingCashCents: state.cashCents,
    purchaseCostCents: suppliesCost,
    wageCostCents: scheduledStaff(state).reduce((total, member) => total + member.wageCents, 0),
    operatingCostCents: effects.operatingCostCents,
    openingInventory,
    purchasedInventory,
    nextActivitySequence: 0,
    recentActivity: [],
    chargeGroups: [],
    stats: emptyRushStats(),
  };
  return {
    ...state,
    phase: 'rush',
    inventory,
    cashCents: state.cashCents - suppliesCost,
    rush,
    report: null,
  };
}

/** Advance one or more fixed engine ticks; wall-clock speed is deliberately absent. */
export function advanceTick(state: GameState, ticks = 1): GameState {
  requirePhase(state, 'rush');
  if (!Number.isInteger(ticks) || ticks < 1 || ticks > RUSH_DURATION_TICKS) {
    throw new GameRuleError('Tick count must be a positive bounded integer.');
  }
  if (state.rush?.isPaused) return state;
  let current = state;
  for (let index = 0; index < ticks; index += 1) {
    current = advanceSingleTick(current);
    if (current.phase !== 'rush') break;
  }
  return current;
}

/** Pause or resume an active rush. */
export function togglePause(state: GameState): GameState {
  requirePhase(state, 'rush');
  if (!state.rush) throw new GameRuleError('No service rush is active.');
  return { ...state, rush: { ...state.rush, isPaused: !state.rush.isPaused } };
}

/** Change presentation speed without changing deterministic simulation policy. */
export function setRushSpeed(state: GameState, speed: RushSpeed): GameState {
  requirePhase(state, 'rush');
  if (!state.rush) throw new GameRuleError('No service rush is active.');
  if (![1, 2, 4].includes(speed)) throw new GameRuleError('Rush speed must be 1×, 2×, or 4×.');
  return { ...state, rush: { ...state.rush, speed } };
}

/** Resolve the currently pending event choice and resume service. */
export function resolveEvent(state: GameState, choiceId: string): GameState {
  requirePhase(state, 'event');
  const rush = state.rush;
  const event = rush?.pendingEvent;
  if (!rush || !event) throw new GameRuleError('No event choice is waiting.');
  const choice = event.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new GameRuleError('That event choice is not available.');
  const withCustomers = addEventCustomers(state, choice);
  const activeRush = withCustomers.rush;
  if (!activeRush) throw new GameRuleError('The service rush ended unexpectedly.');
  const effect = choice.effect;
  return {
    ...withCustomers,
    phase: 'rush',
    rush: {
      ...activeRush,
      isPaused: false,
      pendingEvent: null,
      demandMultiplier: activeRush.demandMultiplier * (effect.demandMultiplier ?? 1),
      qualityBonus: activeRush.qualityBonus + (effect.qualityBonus ?? 0),
      eventCashDeltaCents: activeRush.eventCashDeltaCents + (effect.cashCents ?? 0),
      eventReputationDelta: activeRush.eventReputationDelta + (effect.reputation ?? 0),
      resolvedEvents: [
        ...activeRush.resolvedEvents,
        {
          eventId: event.id,
          choiceId,
          summary: `${event.title}: ${choice.label}`,
        },
      ],
    },
  };
}

/** Apply a finished report exactly once and enter the reinvestment phase. */
export function closeDay(state: GameState): GameState {
  if (state.lastSettledDay === state.day && state.report?.settled) return state;
  requirePhase(state, 'report');
  if (!state.report) throw new GameRuleError('There is no day report to settle.');
  const settledReport: DayReport = { ...state.report, settled: true };
  const closingReputation = clamp(state.reputation + settledReport.reputationChange, 0, 100);
  const settled: GameState = {
    ...state,
    phase: 'reinvest',
    cashCents: settledReport.closingCashCents,
    reputation: closingReputation,
    report: settledReport,
    lastSettledDay: state.day,
    history: [...state.history, settledReport].slice(-CAMPAIGN_RULES.maximumHistoryDays),
  };
  if (settled.cashCents < CAMPAIGN_RULES.overdraftFloorCents) {
    return {
      ...settled,
      phase: 'defeat',
      outcome: {
        type: 'bankruptcy',
        title: 'The till can’t stretch any further',
        message: `Closing cash crossed the ${formatCents(CAMPAIGN_RULES.overdraftFloorCents)} overdraft floor. The laneway remembers a brave run.`,
      },
    };
  }
  if (settled.mode === 'campaign' && settled.day >= CAMPAIGN_RULES.durationDays) {
    const won =
      settled.venueId === 'departmentStore' &&
      settled.cashCents >= CAMPAIGN_RULES.victoryCashCents &&
      settled.reputation >= CAMPAIGN_RULES.victoryReputation;
    return won
      ? {
          ...settled,
          phase: 'victory',
          outcome: {
            type: 'victory',
            title: 'The city has its coffee institution',
            message: `Day ${CAMPAIGN_RULES.durationDays} closes with a thriving department-store coffee hall, ${formatCents(settled.cashCents)} in the till, and ${settled.reputation} reputation.`,
          },
        }
      : {
          ...settled,
          phase: 'defeat',
          outcome: {
            type: 'targetMissed',
            title: 'A good run, short of the final brief',
            message: `Day ${CAMPAIGN_RULES.durationDays} needs the department-store coffee hall, ${formatCents(CAMPAIGN_RULES.victoryCashCents)}, and ${CAMPAIGN_RULES.victoryReputation} reputation. Your next seed is waiting.`,
          },
        };
  }
  return settled;
}

/** Buy the representative Phase 1 cart improvement during reinvestment. */
export function buyImprovement(state: GameState, improvementId: string): GameState {
  requirePhase(state, 'reinvest');
  if (improvementId !== 'street-sign') throw new GameRuleError('That improvement is unavailable.');
  if (state.improvements.includes(improvementId)) return state;
  if (state.cashCents < CART_IMPROVEMENT_COST_CENTS) {
    throw new GameRuleError('The hand-painted street sign costs $25.00.');
  }
  return {
    ...state,
    cashCents: state.cashCents - CART_IMPROVEMENT_COST_CENTS,
    improvements: [...state.improvements, improvementId],
  };
}

/** Hire one candidate from the current deterministic daily pool. */
export function hireStaff(state: GameState, candidateId: string): GameState {
  requireManagementPhase(state);
  const candidate = state.candidateStaff.find((member) => member.id === candidateId);
  if (!candidate) throw new GameRuleError('That candidate is no longer available today.');
  if (state.staff.some((member) => member.id === candidate.id)) {
    throw new GameRuleError('That candidate already works here.');
  }
  if (!staffRoleAvailableAtVenue(candidate.role, state.venueId)) {
    throw new GameRuleError(
      `${STAFF_ROLE_DETAILS[candidate.role].label} candidates require the Department Store Coffee Hall.`,
    );
  }
  const rosterCapacity = workforceCapacityFor(state.venueId).rosterCapacity;
  if (state.staff.length >= rosterCapacity) {
    throw new GameRuleError(
      `${VENUES[state.venueId].shortName} can employ at most ${rosterCapacity} people.`,
    );
  }
  return {
    ...state,
    staff: [...state.staff, { ...candidate, hiredOnDay: state.day }],
    candidateStaff: state.candidateStaff.filter((member) => member.id !== candidateId),
  };
}

/** Buy the next valid tier in an equipment family during reinvestment. */
export function buyEquipment(state: GameState, equipmentId: EquipmentId): GameState {
  requirePhase(state, 'reinvest');
  if (!EQUIPMENT_IDS.includes(equipmentId))
    throw new GameRuleError('That equipment is unavailable.');
  const currentLevel = state.equipment[equipmentId];
  const nextTier = EQUIPMENT[equipmentId].tiers.find(
    (candidate) => candidate.level === currentLevel + 1,
  );
  if (!nextTier)
    throw new GameRuleError(`${EQUIPMENT[equipmentId].name} is already fully upgraded.`);
  if (!venueMeetsRequirement(state.venueId, nextTier.requiresVenue)) {
    throw new GameRuleError(
      `${nextTier.name} requires a ${VENUES[nextTier.requiresVenue].shortName}.`,
    );
  }
  if (state.cashCents < nextTier.costCents) {
    throw new GameRuleError(`${nextTier.name} costs ${formatCents(nextTier.costCents)}.`);
  }
  const inventory =
    equipmentId === 'refrigeration'
      ? extendInventoryRefrigeration(state.inventory, state.day, currentLevel, nextTier.level)
      : state.inventory;
  return {
    ...state,
    cashCents: state.cashCents - nextTier.costCents,
    equipment: { ...state.equipment, [equipmentId]: nextTier.level },
    inventory,
  };
}

/** Promote the current business when its cash, reputation, and equipment are ready. */
export function promoteVenue(state: GameState): GameState {
  requirePhase(state, 'reinvest');
  if (state.venueId === 'departmentStore') {
    throw new GameRuleError('The department-store coffee hall is the final venue.');
  }
  const promotion = VENUE_PROMOTIONS[state.venueId];
  if (state.reputation < promotion.reputationRequired) {
    throw new GameRuleError(
      `${VENUES[promotion.to].shortName} promotion needs ${promotion.reputationRequired} reputation.`,
    );
  }
  const missing = Object.entries(promotion.requiredEquipment).find(
    ([equipmentId, level]) => state.equipment[equipmentId as EquipmentId] < level,
  );
  if (missing) {
    const [equipmentId, level] = missing;
    throw new GameRuleError(
      `Promotion needs ${EQUIPMENT[equipmentId as EquipmentId].name} level ${level}.`,
    );
  }
  if (state.cashCents < promotion.costCents) {
    throw new GameRuleError(`Promotion costs ${formatCents(promotion.costCents)}.`);
  }
  return {
    ...state,
    cashCents: state.cashCents - promotion.costCents,
    venueId: promotion.to,
  };
}

/** Begin the following morning while retaining prices, menu, stock, and upgrades. */
export function startNextDay(state: GameState): GameState {
  requirePhase(state, 'reinvest');
  if (state.lastSettledDay !== state.day) throw new GameRuleError('Settle the report first.');
  return {
    ...state,
    phase: 'planning',
    day: state.day + 1,
    weather: weatherForDay(state.seed, state.day + 1, state.scenarioId),
    plan: { ...state.plan, purchases: emptyPurchases() },
    candidateStaff: candidatePoolForDay(state.seed, state.day + 1).filter(
      (candidate) => !state.staff.some((member) => member.id === candidate.id),
    ),
    rush: null,
    report: null,
  };
}

/** Continue a won campaign in endless mode. Added now as a stable public boundary. */
export function continueEndless(state: GameState): GameState {
  if (state.phase !== 'victory')
    throw new GameRuleError('Endless mode follows a campaign victory.');
  return {
    ...state,
    mode: 'endless',
    phase: 'planning',
    day: state.day + 1,
    weather: weatherForDay(state.seed, state.day + 1, state.scenarioId),
    candidateStaff: candidatePoolForDay(state.seed, state.day + 1).filter(
      (candidate) => !state.staff.some((member) => member.id === candidate.id),
    ),
    outcome: null,
    rush: null,
    report: null,
    plan: { ...state.plan, purchases: emptyPurchases() },
  };
}

/** Route a typed UI command through the pure engine boundary. */
export function dispatchGameCommand(state: GameState, command: GameCommand): GameState {
  switch (command.type) {
    case 'prepareDay':
      return prepareDay(state, command.patch);
    case 'adjustPlanPrice':
      return adjustPlanPrice(state, command.drinkId, command.direction);
    case 'adjustPlanPurchase':
      return adjustPlanPurchase(state, command.ingredientId, command.direction);
    case 'startRush':
      return startRush(state);
    case 'advanceTick':
      return advanceTick(state, command.ticks);
    case 'togglePause':
      return togglePause(state);
    case 'setSpeed':
      return setRushSpeed(state, command.speed);
    case 'resolveEvent':
      return resolveEvent(state, command.choiceId);
    case 'closeDay':
      return closeDay(state);
    case 'buyImprovement':
      return buyImprovement(state, command.improvementId);
    case 'hireStaff':
      return hireStaff(state, command.candidateId);
    case 'buyEquipment':
      return buyEquipment(state, command.equipmentId);
    case 'promoteVenue':
      return promoteVenue(state);
    case 'startNextDay':
      return startNextDay(state);
    case 'continueEndless':
      return continueEndless(state);
  }
}

/** Calculate the cash committed by the current supply order. */
export function purchaseCost(plan: DayPlan): number {
  return PURCHASE_PACKAGES.reduce(
    (total, item) => total + item.costCents * plan.purchases[item.ingredientId],
    0,
  );
}

export interface OperationalEffects {
  preparationMultiplier: number;
  qualityBonus: number;
  satisfactionBonus: number;
  demandMultiplier: number;
  patienceMultiplier: number;
  queueBonus: number;
  operatingCostCents: number;
  equipmentReliabilityDelayTicks: number;
  managerReductionTicks: number;
  runnerReductionTicks: number;
  coordinationReliabilityDelayTicks: number;
  handoffWorkloadDelayTicks: number;
}

/** Calculate one role's bounded workload reduction without reading or mutating game state. */
export function staffRoleOperationalEffect(member: StaffMember): StaffRoleOperationalEffect {
  const config = STAFF_ROLE_DETAILS[member.role];
  const reduction = config.workloadReduction;
  if (!reduction) return { operation: config.operation, reductionTicks: 0 };
  const attribute = member[reduction.attribute];
  const extraTicks = Math.floor(
    Math.max(0, attribute - reduction.threshold) / reduction.pointsPerExtraTick,
  );
  return {
    operation: config.operation,
    reductionTicks: Math.min(reduction.maximumTicks, reduction.baseTicks + extraTicks),
  };
}

/** Aggregate the exact staff, trait, equipment, and venue effects used by service. */
export function operationalEffects(state: GameState): OperationalEffects {
  let preparationMultiplier = 1;
  let qualityBonus = 0;
  let satisfactionBonus = 0;
  let demandMultiplier = 1;
  let patienceMultiplier = 1;
  let queueBonus = 0;
  let proposedManagerReductionTicks = 0;
  let proposedRunnerReductionTicks = 0;

  for (const equipmentId of EQUIPMENT_IDS) {
    const tier = equipmentTierAtLevel(equipmentId, state.equipment[equipmentId]);
    if (!tier) continue;
    const effects = tier.effects;
    preparationMultiplier *= effects.preparationMultiplier ?? 1;
    qualityBonus += effects.qualityBonus ?? 0;
    demandMultiplier *= effects.demandMultiplier ?? 1;
    queueBonus += effects.queueCapacityBonus ?? 0;
  }

  for (const member of scheduledStaff(state)) {
    const roleEffect = staffRoleOperationalEffect(member);
    switch (roleEffect.operation) {
      case 'coffeePreparation':
        preparationMultiplier *= clamp(1 - (member.speed - 45) * 0.004, 0.78, 1);
        qualityBonus += Math.round((member.skill - 48) / 11);
        break;
      case 'guestFlow':
        preparationMultiplier *= clamp(1 - (member.speed - 45) * 0.0015, 0.91, 1);
        patienceMultiplier *= 1 + Math.max(0, member.skill - 45) / 500;
        satisfactionBonus += Math.round((member.skill - 48) / 14);
        break;
      case 'coordinationReliability':
        proposedManagerReductionTicks += roleEffect.reductionTicks;
        break;
      case 'handoffWorkload':
        proposedRunnerReductionTicks += roleEffect.reductionTicks;
        break;
    }
    if (member.trait === 'quickHands') preparationMultiplier *= 0.9;
    if (member.trait === 'peoplePerson') {
      demandMultiplier *= 1.05;
      satisfactionBonus += 3;
    }
    if (member.trait === 'perfectionist') {
      preparationMultiplier *= 1.08;
      qualityBonus += 5;
    }
    if (member.trait === 'steady') {
      preparationMultiplier *= 0.97;
    }
  }

  const equipmentOperatingCost = EQUIPMENT_IDS.reduce((total, equipmentId) => {
    const tier = equipmentTierAtLevel(equipmentId, state.equipment[equipmentId]);
    return total + (tier?.operatingCostCents ?? 0);
  }, 0);
  const equipmentReliabilityDelayTicks =
    state.venueId === 'departmentStore'
      ? Math.ceil(
          EQUIPMENT_IDS.reduce((total, equipmentId) => {
            const tier = equipmentTierAtLevel(equipmentId, state.equipment[equipmentId]);
            return total + (tier ? 100 - tier.reliabilityPercent : 0);
          }, 0) / DEPARTMENT_WORKLOAD_DELAYS.reliabilityDeficitPointsPerTick,
        )
      : 0;
  const coordinationWorkTicks =
    state.venueId === 'departmentStore'
      ? DEPARTMENT_WORKLOAD_DELAYS.coordinationBaseTicks + equipmentReliabilityDelayTicks
      : 0;
  const handoffWorkTicks =
    state.venueId === 'departmentStore' ? DEPARTMENT_WORKLOAD_DELAYS.handoffBaseTicks : 0;
  const coordinationReliabilityDelayTicks =
    coordinationWorkTicks === 0
      ? 0
      : Math.max(
          DEPARTMENT_WORKLOAD_DELAYS.minimumRemainingTicks,
          coordinationWorkTicks - proposedManagerReductionTicks,
        );
  const handoffWorkloadDelayTicks =
    handoffWorkTicks === 0
      ? 0
      : Math.max(
          DEPARTMENT_WORKLOAD_DELAYS.minimumRemainingTicks,
          handoffWorkTicks - proposedRunnerReductionTicks,
        );
  return {
    preparationMultiplier,
    qualityBonus,
    satisfactionBonus,
    demandMultiplier,
    patienceMultiplier,
    queueBonus,
    operatingCostCents: VENUES[state.venueId].operatingCostCents + equipmentOperatingCost,
    equipmentReliabilityDelayTicks,
    managerReductionTicks: coordinationWorkTicks - coordinationReliabilityDelayTicks,
    runnerReductionTicks: handoffWorkTicks - handoffWorkloadDelayTicks,
    coordinationReliabilityDelayTicks,
    handoffWorkloadDelayTicks,
  };
}

/** Return the equipment-only preparation multiplier for a configured drink. */
export function equipmentPreparationMultiplier(state: GameState, drinkId: DrinkId): number {
  if (drinkId === 'batchBrew') {
    return (
      equipmentTierAtLevel('batchBrewer', state.equipment.batchBrewer)?.effects
        .batchBrewPreparationMultiplier ?? 1
    );
  }
  if (drinkId === 'coldBrew') return 1;
  return (
    equipmentTierAtLevel('espressoMachine', state.equipment.espressoMachine)?.effects
      .espressoPreparationMultiplier ?? 1
  );
}

/** Return the venue plus service-counter queue capacity used by arrivals. */
export function serviceQueueCapacity(state: GameState): number {
  return VENUES[state.venueId].queueCapacity + operationalEffects(state).queueBonus;
}

/** Produce the same four-person candidate pool for a given seed and day. */
export function candidatePoolForDay(seed: number, day: number): StaffMember[] {
  if (!Number.isFinite(seed)) throw new GameRuleError('Candidate seed must be a number.');
  if (!Number.isInteger(day) || day < 1 || day > MAX_STAFF_NAME_DAY) {
    throw new GameRuleError(`Candidate day must be an integer from 1 to ${MAX_STAFF_NAME_DAY}.`);
  }
  const normalizedSeed = Math.trunc(seed) >>> 0;
  let rngState = (normalizedSeed ^ Math.imul(day, 0x9e3779b1)) >>> 0;
  if (rngState === 0) rngState = 0x6d2b79f5;
  const candidates: StaffMember[] = [];
  for (let index = 0; index < CANDIDATES_PER_DAY; index += 1) {
    // Retain the historical name draw so speed, skill, base-wage, and trait
    // draws remain deterministic after names move to direct indexing.
    const legacyNameDraw = randomInt(rngState, 0, LEGACY_STAFF_NAMES.length - 1);
    rngState = legacyNameDraw.state;
    const speedDraw = randomInt(rngState, 52, 88);
    rngState = speedDraw.state;
    const skillDraw = randomInt(rngState, 50, 90);
    rngState = skillDraw.state;
    const traitDraw = randomInt(rngState, 0, STAFF_TRAITS.length - 1);
    rngState = traitDraw.state;
    const role = STAFF_ROLES[index] ?? 'barista';
    const wageCents =
      Math.round((1_200 + speedDraw.value * 8 + skillDraw.value * 10) / 50) * 50 +
      STAFF_ROLE_DETAILS[role].wagePremiumCents;
    candidates.push({
      id: candidateStaffId(normalizedSeed, day, index),
      name: candidateStaffName(normalizedSeed, day, index),
      role,
      speed: speedDraw.value,
      skill: skillDraw.value,
      wageCents,
      trait: STAFF_TRAITS[traitDraw.value] ?? 'steady',
      hiredOnDay: 0,
    });
  }
  return candidates;
}

function advanceSingleTick(state: GameState): GameState {
  const rush = state.rush;
  if (!rush) throw new GameRuleError('No service rush is active.');
  const nextTick = rush.tick + 1;
  if (rush.eventTriggerTicks.includes(nextTick)) {
    const event = RUSH_EVENTS[rush.resolvedEvents.length % RUSH_EVENTS.length] ?? LANEWAY_EVENT;
    return {
      ...state,
      phase: 'event',
      rush: {
        ...rush,
        tick: nextTick,
        isPaused: true,
        pendingEvent: event,
        eventTriggerTicks: rush.eventTriggerTicks.filter((tick) => tick !== nextTick),
      },
    };
  }

  let working = ageQueue({ ...state, rush: { ...rush, tick: nextTick } });
  working = progressService(working);
  working = startNextService(working);
  working = maybeAddArrival(working);
  const updatedRush = working.rush;
  if (updatedRush && updatedRush.tick >= updatedRush.durationTicks) return finishRush(working);
  return working;
}

function ageQueue(state: GameState): GameState {
  const rush = state.rush;
  if (!rush) return state;
  const kept: Customer[] = [];
  let abandoned = 0;
  let observedRush = rush;
  for (const customer of rush.queue) {
    const aged = { ...customer, waitedTicks: customer.waitedTicks + 1 };
    if (aged.waitedTicks >= aged.patienceTicks) {
      abandoned += 1;
      observedRush = appendWalkawayActivity(observedRush, state.day, aged, 'patience');
    } else kept.push(aged);
  }
  return {
    ...state,
    rush: {
      ...observedRush,
      queue: kept,
      stats: { ...observedRush.stats, abandoned: rush.stats.abandoned + abandoned },
    },
  };
}

function progressService(state: GameState): GameState {
  const rush = state.rush;
  const service = rush?.activeService;
  if (!rush || !service) return state;
  const remainingTicks = service.remainingTicks - 1;
  if (remainingTicks > 0) {
    return { ...state, rush: { ...rush, activeService: { ...service, remainingTicks } } };
  }
  const customer = service.customer;
  const satisfaction = calculateSatisfaction(state, customer);
  const soldCount = rush.stats.soldByDrink[customer.order.drinkId] ?? 0;
  const stats: RushStats = {
    ...rush.stats,
    served: rush.stats.served + 1,
    revenueCents: rush.stats.revenueCents + customer.order.priceCents,
    totalWaitTicks: rush.stats.totalWaitTicks + customer.waitedTicks,
    satisfactionTotal: rush.stats.satisfactionTotal + satisfaction,
    soldByDrink: {
      ...rush.stats.soldByDrink,
      [customer.order.drinkId]: soldCount + 1,
    },
    servedBySegment: {
      ...rush.stats.servedBySegment,
      [customer.segment]: (rush.stats.servedBySegment[customer.segment] ?? 0) + 1,
    },
  };
  return {
    ...state,
    rush: appendSaleActivity(
      {
        ...rush,
        activeService: null,
        chargeGroups: recordCanonicalCharge(rush, customer.order),
        stats,
      },
      state.day,
      customer,
    ),
  };
}

function startNextService(state: GameState): GameState {
  let working = state;
  while (working.rush && !working.rush.activeService && working.rush.queue.length > 0) {
    const rush = working.rush;
    const customer = rush.queue[0];
    if (!customer) break;
    const queue = rush.queue.slice(1);
    if (!hasIngredients(working.inventory, customer.order.ingredientAmounts)) {
      const nextRush: RushState = {
        ...rush,
        queue,
        stats: {
          ...rush.stats,
          stockouts: rush.stats.stockouts + 1,
          abandoned: rush.stats.abandoned + 1,
        },
      };
      working = {
        ...working,
        rush: appendWalkawayActivity(nextRush, state.day, customer, 'stockout'),
      };
      continue;
    }
    const consumed = consumeIngredientsLifo(working.inventory, customer.order.ingredientAmounts);
    const ingredientCost = recipeCost(customer.order.ingredientAmounts);
    const consumedTotals = { ...rush.stats.consumed };
    for (const item of customer.order.ingredientAmounts) {
      consumedTotals[item.ingredientId] = (consumedTotals[item.ingredientId] ?? 0) + item.amount;
    }
    const nextRush: RushState = {
      ...rush,
      queue,
      activeService: {
        customer,
        remainingTicks: customer.order.preparationTicks,
        totalTicks: customer.order.preparationTicks,
      },
      stats: {
        ...rush.stats,
        ingredientCostCents: rush.stats.ingredientCostCents + ingredientCost,
        consumed: consumedTotals,
      },
    };
    working = {
      ...working,
      inventory: consumed,
      rush: appendServiceStartedActivity(nextRush, state.day, customer),
    };
  }
  return working;
}

function maybeAddArrival(state: GameState): GameState {
  const rush = state.rush;
  if (!rush) return state;
  const arrivalDraw = nextRandom(state.rngState);
  let updated: GameState = { ...state, rngState: arrivalDraw.state };
  if (arrivalDraw.value >= demandRate(updated)) return updated;
  const created = createCustomer(updated, rush.nextCustomerId);
  updated = created.state;
  const activeRush = updated.rush;
  if (!activeRush) return updated;
  const arrivals = activeRush.stats.arrivals + 1;
  const segmentArrivals = (activeRush.stats.arrivalsBySegment[created.customer.segment] ?? 0) + 1;
  const observedRush = appendArrivalActivity(activeRush, state.day, created.customer);
  if (activeRush.queue.length >= serviceQueueCapacity(state)) {
    const rejectedRush: RushState = {
      ...observedRush,
      nextCustomerId: activeRush.nextCustomerId + 1,
      stats: {
        ...observedRush.stats,
        arrivals,
        arrivalsBySegment: {
          ...observedRush.stats.arrivalsBySegment,
          [created.customer.segment]: segmentArrivals,
        },
        abandoned: observedRush.stats.abandoned + 1,
        peakQueue: Math.max(observedRush.stats.peakQueue, observedRush.queue.length),
      },
    };
    return {
      ...updated,
      rush: appendWalkawayActivity(rejectedRush, state.day, created.customer, 'queueFull'),
    };
  }
  const queue = [...activeRush.queue, created.customer];
  return {
    ...updated,
    rush: {
      ...observedRush,
      queue,
      nextCustomerId: activeRush.nextCustomerId + 1,
      stats: {
        ...observedRush.stats,
        arrivals,
        arrivalsBySegment: {
          ...observedRush.stats.arrivalsBySegment,
          [created.customer.segment]: segmentArrivals,
        },
        peakQueue: Math.max(activeRush.stats.peakQueue, queue.length),
      },
    },
  };
}

function createCustomer(
  state: GameState,
  sequence: number,
): { state: GameState; customer: Customer } {
  let rngState = state.rngState;
  const segmentDraw = nextRandom(rngState);
  rngState = segmentDraw.state;
  const segment = segmentForDraw(segmentDraw.value);
  const drinkDraw = nextRandom(rngState);
  rngState = drinkDraw.state;
  const drinkId = chooseDrink(state, segment, drinkDraw.value);
  const drink = getDrink(drinkId);
  const sizeDraw = nextRandom(rngState);
  rngState = sizeDraw.state;
  const size = sizeForDraw(drink, segment, sizeDraw.value);
  const milkDraw = nextRandom(rngState);
  rngState = milkDraw.state;
  const milk = milkForDraw(drink, milkDraw.value);
  const [minimumPatience, maximumPatience] = patienceRange(segment);
  const patienceDraw = randomInt(rngState, minimumPatience, maximumPatience);
  rngState = patienceDraw.state;
  const order = makeOrder(state, drink, size, milk);
  const tick = state.rush?.tick ?? 0;
  return {
    state: { ...state, rngState },
    customer: {
      id: `d${state.day}-c${sequence}`,
      segment,
      order,
      arrivedAtTick: tick,
      patienceTicks: Math.round(patienceDraw.value * operationalEffects(state).patienceMultiplier),
      waitedTicks: 0,
    },
  };
}

function appendArrivalActivity(rush: RushState, day: number, customer: Customer): RushState {
  return appendRushActivity(rush, {
    ...activityIdentity(rush, day, customer),
    type: 'arrival',
  });
}

function appendServiceStartedActivity(rush: RushState, day: number, customer: Customer): RushState {
  return appendRushActivity(rush, {
    ...activityIdentity(rush, day, customer),
    type: 'serviceStarted',
    drinkId: customer.order.drinkId,
    size: customer.order.size,
    milk: customer.order.milk,
  });
}

function appendSaleActivity(rush: RushState, day: number, customer: Customer): RushState {
  return appendRushActivity(rush, {
    ...activityIdentity(rush, day, customer),
    type: 'sale',
    drinkId: customer.order.drinkId,
    size: customer.order.size,
    milk: customer.order.milk,
    priceCents: customer.order.priceCents,
  });
}

function recordCanonicalCharge(rush: RushState, order: Order): ReportChargeGroup[] | undefined {
  const existingGroups = rush.chargeGroups;
  if (existingGroups === undefined && rush.stats.served > 0) return undefined;
  const groups = existingGroups ?? [];
  const groupIndex = groups.findIndex(
    (group) =>
      group.drinkId === order.drinkId &&
      group.size === order.size &&
      group.milk === order.milk &&
      group.priceCents === order.priceCents,
  );
  if (groupIndex >= 0) {
    return groups.map((group, index) =>
      index === groupIndex
        ? {
            ...group,
            quantity: group.quantity + 1,
            revenueCents: group.revenueCents + order.priceCents,
          }
        : group,
    );
  }
  if (groups.length >= MAX_REPORT_CHARGE_GROUPS) {
    throw new GameRuleError('Canonical sale charge variants exceeded their configured bound.');
  }
  return [
    ...groups,
    {
      drinkId: order.drinkId,
      size: order.size,
      milk: order.milk,
      priceCents: order.priceCents,
      quantity: 1,
      revenueCents: order.priceCents,
    },
  ];
}

function appendWalkawayActivity(
  rush: RushState,
  day: number,
  customer: Customer,
  reason: RushWalkawayReason,
): RushState {
  return appendRushActivity(rush, {
    ...activityIdentity(rush, day, customer),
    type: 'walkaway',
    reason,
  });
}

function activityIdentity(
  rush: RushState,
  day: number,
  customer: Customer,
): Pick<RushActivityEvent, 'id' | 'sequence' | 'tick' | 'customerId' | 'segment'> {
  return {
    id: `d${day}-e${rush.nextActivitySequence}`,
    sequence: rush.nextActivitySequence,
    tick: rush.tick,
    customerId: customer.id,
    segment: customer.segment,
  };
}

function appendRushActivity(rush: RushState, event: RushActivityEvent): RushState {
  return {
    ...rush,
    nextActivitySequence: event.sequence + 1,
    recentActivity: [...rush.recentActivity, event].slice(-RUSH_ACTIVITY_LIMIT),
  };
}

function makeOrder(state: GameState, drink: DrinkConfig, size: DrinkSize, milk: MilkChoice): Order {
  const variant = drink.variants.find((candidate) => candidate.size === size);
  if (!variant) throw new GameRuleError(`${drink.name} is missing its ${size} recipe.`);
  const ingredients = variant.ingredients.map((item) => adaptIngredient(state, item, milk));
  const optionalMilk = drink.optionalMilkAmount ? milkIngredient(milk) : null;
  if (optionalMilk) {
    ingredients.push({ ingredientId: optionalMilk, amount: drink.optionalMilkAmount ?? 0 });
  }
  const dialMultiplier =
    state.plan.dialIn === 'speed' ? 0.8 : state.plan.dialIn === 'quality' ? 1.2 : 1;
  const beanMultiplier = BEAN_DETAILS[state.plan.beanId].speed;
  const signMultiplier = state.improvements.includes('street-sign') ? 0.96 : 1;
  const effects = operationalEffects(state);
  const equipmentMultiplier = equipmentPreparationMultiplier(state, drink.id);
  return {
    drinkId: drink.id,
    size,
    milk,
    priceCents:
      state.plan.pricesCents[drink.id] +
      MILK_SURCHARGE_CENTS[milk] +
      (size === 'large' ? SIZE_SURCHARGE_CENTS : 0),
    ingredientAmounts: ingredients,
    preparationTicks:
      Math.max(
        5,
        Math.round(
          variant.preparationTicks *
            dialMultiplier *
            beanMultiplier *
            signMultiplier *
            effects.preparationMultiplier *
            equipmentMultiplier,
        ),
      ) +
      effects.coordinationReliabilityDelayTicks +
      effects.handoffWorkloadDelayTicks,
  };
}

function adaptIngredient(
  state: GameState,
  ingredient: IngredientAmount,
  milk: MilkChoice,
): IngredientAmount {
  if (ingredient.ingredientId === 'houseBeans') {
    return { ...ingredient, ingredientId: state.plan.beanId };
  }
  if (ingredient.ingredientId === 'dairyMilk') {
    return { ...ingredient, ingredientId: milkIngredient(milk) ?? 'dairyMilk' };
  }
  return ingredient;
}

function patienceRange(segment: CustomerSegment): [number, number] {
  if (segment === 'commuter') return [55, 100];
  if (segment === 'student') return [70, 140];
  if (segment === 'enthusiast') return [85, 160];
  return [80, 150];
}

function chooseDrink(state: GameState, segment: CustomerSegment, draw: number): DrinkId {
  const weighted = state.plan.activeMenu.map((drinkId) => ({
    drinkId,
    weight: drinkChoiceWeight(state, segment, drinkId),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = draw * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.drinkId;
  }
  const fallback = weighted.at(-1)?.drinkId;
  if (!fallback) throw new GameRuleError('The active menu must contain a drink.');
  return fallback;
}

function drinkChoiceWeight(state: GameState, segment: CustomerSegment, drinkId: DrinkId): number {
  const drink = getDrink(drinkId);
  const regularRecipe = drink.variants[0];
  const available = regularRecipe
    ? hasIngredients(
        state.inventory,
        regularRecipe.ingredients.map((item) => adaptIngredient(state, item, 'dairy')),
      )
    : false;
  const availabilityFactor = available ? 1 : 0.12;
  return baseDrinkChoiceWeight(state, segment, drinkId) * availabilityFactor;
}

function addEventCustomers(state: GameState, choice: EventChoice): GameState {
  const count = choice.effect.addCustomers ?? 0;
  let working = state;
  for (let index = 0; index < count; index += 1) {
    const rush = working.rush;
    if (!rush) break;
    const created = createCustomer(working, rush.nextCustomerId);
    const currentRush = created.state.rush;
    if (!currentRush) break;
    const hasSpace = currentRush.queue.length < serviceQueueCapacity(state);
    const observedRush = appendArrivalActivity(currentRush, state.day, created.customer);
    const nextRush: RushState = {
      ...observedRush,
      queue: hasSpace ? [...currentRush.queue, created.customer] : currentRush.queue,
      nextCustomerId: currentRush.nextCustomerId + 1,
      stats: {
        ...observedRush.stats,
        arrivals: observedRush.stats.arrivals + 1,
        arrivalsBySegment: {
          ...observedRush.stats.arrivalsBySegment,
          [created.customer.segment]:
            (observedRush.stats.arrivalsBySegment[created.customer.segment] ?? 0) + 1,
        },
        abandoned: observedRush.stats.abandoned + (hasSpace ? 0 : 1),
        peakQueue: Math.max(
          observedRush.stats.peakQueue,
          currentRush.queue.length + (hasSpace ? 1 : 0),
        ),
      },
    };
    working = {
      ...created.state,
      rush: hasSpace
        ? nextRush
        : appendWalkawayActivity(nextRush, state.day, created.customer, 'queueFull'),
    };
  }
  return working;
}

function finishRush(state: GameState): GameState {
  const rush = state.rush;
  if (!rush) throw new GameRuleError('No service rush is active.');
  let observedRush = rush;
  if (rush.activeService) {
    observedRush = appendWalkawayActivity(
      observedRush,
      state.day,
      rush.activeService.customer,
      'rushEnded',
    );
  }
  for (const customer of rush.queue) {
    observedRush = appendWalkawayActivity(observedRush, state.day, customer, 'rushEnded');
  }
  const expiry = expireInventoryAfterRush(state.inventory, state.day);
  const inventory = expiry.inventory;
  const waste = nonZeroIngredientTotals(expiry.expired);
  const remainingInventory = inventoryTotals(inventory);
  const consumedInventory = completeIngredientTotals(rush.stats.consumed);
  const satisfaction =
    rush.stats.served > 0 ? Math.round(rush.stats.satisfactionTotal / rush.stats.served) : 35;
  const averageWaitSeconds =
    rush.stats.served > 0
      ? Math.round((rush.stats.totalWaitTicks / rush.stats.served / TICKS_PER_SECOND) * 10) / 10
      : 0;
  const reputationChange =
    Math.round((satisfaction - 70) / 8) +
    rush.eventReputationDelta -
    (rush.stats.stockouts > 3 ? 1 : 0);
  const eventCash = rush.eventCashDeltaCents;
  const wageCost = rush.wageCostCents ?? 0;
  const closingCash =
    state.cashCents + rush.stats.revenueCents + eventCash - wageCost - rush.operatingCostCents;
  const explanations = buildExplanations(state, rush, satisfaction);
  const expiredNames = Object.entries(waste).map(
    ([ingredientId, quantity]) =>
      `${INGREDIENT_DETAILS[ingredientId as IngredientId].name} ${String(quantity)}`,
  );
  if (expiredNames.length > 0) {
    explanations.push(
      `Expiry waste after the Day ${state.day} rush: ${expiredNames.join(', ')}; older stock stayed usable through this rush before expiring.`,
    );
  }
  const chargeGroups = finalizedChargeGroups(rush);
  const report: DayReport = {
    day: state.day,
    difficulty: state.difficulty,
    weather: state.weather,
    openingCashCents: rush.openingCashCents,
    purchaseCostCents: rush.purchaseCostCents,
    revenueCents: rush.stats.revenueCents,
    ingredientCostCents: rush.stats.ingredientCostCents,
    wageCostCents: wageCost,
    operatingCostCents: rush.operatingCostCents,
    eventCashDeltaCents: eventCash,
    netCashFlowCents:
      rush.stats.revenueCents +
      eventCash -
      rush.purchaseCostCents -
      wageCost -
      rush.operatingCostCents,
    closingCashCents: closingCash,
    arrivals: rush.stats.arrivals,
    served: rush.stats.served,
    abandoned: rush.stats.abandoned + rush.queue.length + (rush.activeService ? 1 : 0),
    stockouts: rush.stats.stockouts,
    averageWaitSeconds,
    satisfactionPercent: satisfaction,
    reputationChange,
    waste,
    remainingInventory,
    inventoryLifecycle: {
      opening: rush.openingInventory,
      purchased: rush.purchasedInventory,
      consumed: consumedInventory,
      expired: expiry.expired,
      remaining: remainingInventory,
    },
    servedBySegment: rush.stats.servedBySegment,
    bottleneck: determineBottleneck(state, rush),
    explanations,
    ...(chargeGroups === undefined ? {} : { chargeGroups }),
    settled: false,
  };
  return { ...state, phase: 'report', inventory, rush: observedRush, report };
}

function finalizedChargeGroups(rush: RushState): ReportChargeGroup[] | undefined {
  if (rush.chargeGroups === undefined) return undefined;
  const totals = rush.chargeGroups.reduce(
    (result, group) => ({
      quantity: result.quantity + group.quantity,
      revenueCents: result.revenueCents + group.revenueCents,
    }),
    { quantity: 0, revenueCents: 0 },
  );
  if (totals.quantity !== rush.stats.served || totals.revenueCents !== rush.stats.revenueCents) {
    throw new GameRuleError('Canonical sale charges do not reconcile with rush revenue.');
  }
  return rush.chargeGroups.map((group) => ({ ...group }));
}

function nonZeroIngredientTotals(
  totals: ReturnType<typeof completeIngredientTotals>,
): Partial<Record<IngredientId, number>> {
  return Object.fromEntries(Object.entries(totals).filter(([, quantity]) => quantity > 0));
}

function determineBottleneck(state: GameState, rush: RushState): string {
  if (rush.stats.stockouts > Math.max(2, rush.stats.served * 0.15)) return 'Ingredient stockouts';
  if (rush.stats.peakQueue >= serviceQueueCapacity(state) - 1) return 'Coffee preparation speed';
  if (rush.stats.abandoned > 2) return 'Customer wait time';
  return `No major bottleneck — the ${VENUES[state.venueId].shortName.toLowerCase()} flowed well`;
}

function buildExplanations(state: GameState, rush: RushState, satisfaction: number): string[] {
  const explanations = [
    `${state.plan.dialIn[0]?.toUpperCase()}${state.plan.dialIn.slice(1)} dial-in traded preparation time for cup quality.`,
    `${WEATHER_DETAILS[state.weather].name} weather: ${WEATHER_DETAILS[state.weather].note}`,
    `${BEAN_DETAILS[state.plan.beanId].name} changed shot quality and preparation time.`,
    `${rush.stats.peakQueue} was the longest queue during the 75-second rush.`,
    `${VENUES[state.venueId].shortName} supported ${workforceCapacityFor(state.venueId).scheduleCapacity} scheduled staff and a ${serviceQueueCapacity(state)}-person queue.`,
  ];
  const scheduled = scheduledStaff(state);
  if (scheduled.length > 0) {
    explanations.push(
      `${scheduled.length} scheduled team member${scheduled.length === 1 ? '' : 's'} cost ${formatCents(rush.wageCostCents ?? 0)}; their role and trait effects were applied once to service.`,
    );
  }
  if (state.venueId === 'departmentStore') {
    const effects = operationalEffects(state);
    const managers = scheduled.filter((member) => member.role === 'manager').length;
    const runners = scheduled.filter((member) => member.role === 'runner').length;
    explanations.push(
      `Manager coverage: ${managers} scheduled; coordination and reliability delay fell ${effects.managerReductionTicks} ticks to ${effects.coordinationReliabilityDelayTicks} ticks per order, including ${effects.equipmentReliabilityDelayTicks} equipment-reliability ticks.`,
      `Runner coverage: ${runners} scheduled; replenishment and handoff delay fell ${effects.runnerReductionTicks} ticks to ${effects.handoffWorkloadDelayTicks} ticks per order.`,
    );
  }
  const equipped = EQUIPMENT_IDS.filter((equipmentId) => state.equipment[equipmentId] > 0);
  if (equipped.length > 0) {
    explanations.push(
      `Equipment in service: ${equipped.map((id) => `${EQUIPMENT[id].name} L${state.equipment[id]}`).join(', ')}.`,
    );
  }
  if (rush.stats.stockouts > 0)
    explanations.push(`${rush.stats.stockouts} orders were lost to unavailable ingredients.`);
  if (satisfaction >= 80)
    explanations.push('Short waits and careful coffee lifted customer sentiment.');
  else if (satisfaction < 65)
    explanations.push('Long waits or rushed coffee weighed on customer sentiment.');
  const strongestSegment = Object.entries(rush.stats.servedBySegment).sort(
    ([, first], [, second]) => second - first,
  )[0];
  if (strongestSegment) {
    explanations.push(`${strongestSegment[0]} customers were the largest served group.`);
  }
  explanations.push(...rush.resolvedEvents.map((event) => event.summary));
  return explanations;
}

function calculateSatisfaction(state: GameState, customer: Customer): number {
  const rush = state.rush;
  const drink = getDrink(customer.order.drinkId);
  const dialQuality = state.plan.dialIn === 'quality' ? 9 : state.plan.dialIn === 'speed' ? -5 : 2;
  const segmentWaitFactor =
    customer.segment === 'commuter' ? 1.35 : customer.segment === 'student' ? 0.8 : 1;
  const waitPenalty = Math.round(
    (customer.waitedTicks / TICKS_PER_SECOND / 2.5) * segmentWaitFactor,
  );
  const priceDifference = customer.order.priceCents - drink.basePriceCents;
  const priceDivisor = customer.segment === 'student' ? 25 : 38;
  const pricePenalty = Math.max(0, Math.round(priceDifference / priceDivisor));
  const beanQuality = BEAN_DETAILS[state.plan.beanId].quality;
  const enthusiastMultiplier = customer.segment === 'enthusiast' ? 1.3 : 1;
  const qualityEffect = Math.round(
    (dialQuality +
      beanQuality +
      operationalEffects(state).qualityBonus +
      (rush?.qualityBonus ?? 0)) *
      drink.qualitySensitivity *
      enthusiastMultiplier,
  );
  return clamp(
    78 + qualityEffect + operationalEffects(state).satisfactionBonus - waitPenalty - pricePenalty,
    20,
    100,
  );
}

/** Return the configured arrival probability for the next fixed tick. */
export function demandRate(state: GameState): number {
  const rush = state.rush;
  const averagePrice =
    state.plan.activeMenu.reduce((total, id) => total + state.plan.pricesCents[id], 0) /
    state.plan.activeMenu.length;
  const baselinePriceFactor = clamp(1.15 - (averagePrice - 500) / 900, 0.55, 1.25);
  const baselineReputationFactor = 0.8 + state.reputation / 250;
  const baselineSignFactor = state.improvements.includes('street-sign') ? 1.08 : 1;
  const baselineQualityFactor =
    state.plan.dialIn === 'quality' ? 1.06 : state.plan.dialIn === 'speed' ? 0.97 : 1;
  const baselineBeanFactor = 1 + BEAN_DETAILS[state.plan.beanId].quality / 100;
  const baselineWeatherFactor = WEATHER_DETAILS[state.weather].demand;
  const baselineVenueFactor = VENUE_DEMAND_FACTOR[state.venueId];
  const baselineScenarioFactor = SCENARIO_DETAILS[state.scenarioId].demandMultiplier;
  const baselineTeamFactor = operationalEffects(state).demandMultiplier;
  const baselineQueueFactor = clamp(1 - (rush?.queue.length ?? 0) * 0.045, 0.55, 1);
  const availableItems = state.plan.activeMenu.filter((drinkId) => {
    const recipe = getDrink(drinkId).variants[0];
    return recipe
      ? hasIngredients(
          state.inventory,
          recipe.ingredients.map((item) => adaptIngredient(state, item, 'dairy')),
        )
      : false;
  }).length;
  const baselineAvailabilityFactor = 0.35 + 0.65 * (availableItems / state.plan.activeMenu.length);
  const factors = {
    arrivalAggregatePrice: applyDemandInfluence(
      state.difficulty,
      'arrivalAggregatePrice',
      baselinePriceFactor,
    ),
    arrivalReputation: applyDemandInfluence(
      state.difficulty,
      'arrivalReputation',
      baselineReputationFactor,
    ),
    arrivalImprovements: applyDemandInfluence(
      state.difficulty,
      'arrivalImprovements',
      baselineSignFactor,
    ),
    arrivalDialIn: applyDemandInfluence(state.difficulty, 'arrivalDialIn', baselineQualityFactor),
    arrivalBean: applyDemandInfluence(state.difficulty, 'arrivalBean', baselineBeanFactor),
    arrivalWeather: applyDemandInfluence(state.difficulty, 'arrivalWeather', baselineWeatherFactor),
    arrivalVenue: applyDemandInfluence(state.difficulty, 'arrivalVenue', baselineVenueFactor),
    arrivalScenario: applyDemandInfluence(
      state.difficulty,
      'arrivalScenario',
      baselineScenarioFactor,
    ),
    arrivalTeamEquipment: applyDemandInfluence(
      state.difficulty,
      'arrivalTeamEquipment',
      baselineTeamFactor,
    ),
    arrivalQueueWait: applyDemandInfluence(
      state.difficulty,
      'arrivalQueueWait',
      baselineQueueFactor,
    ),
    arrivalAvailability: applyDemandInfluence(
      state.difficulty,
      'arrivalAvailability',
      baselineAvailabilityFactor,
    ),
    arrivalRushEvent: applyDemandInfluence(
      state.difficulty,
      'arrivalRushEvent',
      rush?.demandMultiplier ?? 1,
    ),
  } satisfies Record<ArrivalDemandInfluenceId, number>;
  return clamp(
    ARRIVAL_DEMAND_ENGINE_INFLUENCES.reduce(
      (rate, influenceId) => rate * factors[influenceId],
      0.075,
    ),
    0.005,
    0.3,
  );
}

function recipeCost(ingredients: IngredientAmount[]): number {
  return Math.round(
    ingredients.reduce(
      (total, item) => total + item.amount * INGREDIENT_UNIT_COST_CENTS[item.ingredientId],
      0,
    ),
  );
}

function validatePlan(state: GameState, plan: DayPlan): void {
  const menuCapacity = VENUE_MENU_CAPACITY[state.venueId];
  if (plan.activeMenu.length < 1 || plan.activeMenu.length > menuCapacity) {
    throw new GameRuleError(`Choose between 1 and ${menuCapacity} ${state.venueId} drinks.`);
  }
  for (const drinkId of plan.activeMenu) {
    getDrink(drinkId);
    const price = plan.pricesCents[drinkId];
    const limits = DAY_PLAN_LIMITS.priceCents;
    if (!Number.isInteger(price) || price < limits.minimum || price > limits.maximum) {
      throw new GameRuleError('Drink prices must be between $2.50 and $12.00.');
    }
  }
  for (const item of PURCHASE_PACKAGES) {
    const quantity = plan.purchases[item.ingredientId];
    const limits = DAY_PLAN_LIMITS.packageQuantity;
    if (!Number.isInteger(quantity) || quantity < limits.minimum || quantity > limits.maximum) {
      throw new GameRuleError('Supply package quantities must be whole numbers from 0 to 20.');
    }
  }
  if (new Set(plan.scheduledStaffIds).size !== plan.scheduledStaffIds.length) {
    throw new GameRuleError('A team member can only be scheduled once per day.');
  }
  const scheduleCapacity = workforceCapacityFor(state.venueId).scheduleCapacity;
  if (plan.scheduledStaffIds.length > scheduleCapacity) {
    throw new GameRuleError(
      `${VENUES[state.venueId].shortName} can schedule ${scheduleCapacity} staff.`,
    );
  }
  if (plan.scheduledStaffIds.some((id) => !state.staff.some((member) => member.id === id))) {
    throw new GameRuleError('Only hired staff can be scheduled.');
  }
  if (
    scheduledStaff({ ...state, plan }).some(
      (member) => !staffRoleAvailableAtVenue(member.role, state.venueId),
    )
  ) {
    throw new GameRuleError('Every scheduled role must be eligible for the current venue.');
  }
}

function getDrink(drinkId: DrinkId): DrinkConfig {
  const drink = DRINK_MAP.get(drinkId);
  if (!drink) throw new GameRuleError('That drink is not configured.');
  return drink;
}

function createEventTriggerTicks(state: GameState): number[] {
  const count = (state.seed + state.day) % 3;
  if (count === 0) return [];
  if (count === 1) return [Math.floor(RUSH_DURATION_TICKS * 0.42)];
  return [Math.floor(RUSH_DURATION_TICKS * 0.31), Math.floor(RUSH_DURATION_TICKS * 0.68)];
}

function emptyRushStats(): RushStats {
  return {
    arrivals: 0,
    served: 0,
    abandoned: 0,
    stockouts: 0,
    revenueCents: 0,
    ingredientCostCents: 0,
    totalWaitTicks: 0,
    satisfactionTotal: 0,
    peakQueue: 0,
    soldByDrink: {},
    consumed: {},
    arrivalsBySegment: {},
    servedBySegment: {},
  };
}

function scheduledStaff(state: GameState): StaffMember[] {
  const scheduledIds = new Set(state.plan.scheduledStaffIds);
  return state.staff.filter((member) => scheduledIds.has(member.id));
}

function requireManagementPhase(state: GameState): void {
  if (state.phase !== 'planning' && state.phase !== 'reinvest') {
    throw new GameRuleError('Staff can only be hired while planning or reinvesting.');
  }
}

function assertStepDirection(direction: number): asserts direction is StepDirection {
  if (direction !== -1 && direction !== 1) {
    throw new GameRuleError('Planner adjustments must move by exactly one increment.');
  }
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function requirePhase(state: GameState, expected: GameState['phase']): void {
  if (state.phase !== expected) {
    throw new GameRuleError(
      `This action requires ${expected}; the game is currently ${state.phase}.`,
    );
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
