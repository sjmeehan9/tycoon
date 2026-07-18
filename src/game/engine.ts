import {
  BEAN_DETAILS,
  CAMPAIGN_RULES,
  CART_IMPROVEMENT_COST_CENTS,
  DRINK_MAP,
  EQUIPMENT,
  EQUIPMENT_IDS,
  INGREDIENT_UNIT_COST_CENTS,
  INITIAL_CASH_CENTS,
  INITIAL_REPUTATION,
  MILK_SURCHARGE_CENTS,
  PURCHASE_PACKAGES,
  RUSH_DURATION_TICKS,
  SCENARIO_DETAILS,
  SEGMENT_DRINK_APPEAL,
  SIZE_SURCHARGE_CENTS,
  TICKS_PER_SECOND,
  VENUE_DEMAND_FACTOR,
  VENUE_MENU_CAPACITY,
  VENUE_PROMOTIONS,
  VENUE_STAFF_CAPACITY,
  VENUES,
  WEATHER_DETAILS,
  createDefaultPlan,
  emptyInventory,
  emptyPurchases,
  milkIngredient,
  weatherForDay,
} from '../content/gameContent';
import { GameRuleError } from './errors';
import { nextRandom, randomInt } from './prng';
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
  IngredientInventory,
  MilkChoice,
  Order,
  PlanPatch,
  RushSpeed,
  RushState,
  RushStats,
  SimulationEvent,
  StaffMember,
  StaffTrait,
  VenueId,
} from './types';

const MIN_PRICE_CENTS = 250;
const MAX_PRICE_CENTS = 1_200;
const MAX_PURCHASE_PACKAGES = 20;
const MAX_HIRED_STAFF = 8;
const CANDIDATE_NAMES = [
  'Ari Nguyen',
  'Billie Tran',
  'Casey Morgan',
  'Dev Singh',
  'Evie Chen',
  'Frankie Russo',
  'Georgie Walker',
  'Harper Kim',
  'Indi Patel',
  'Jules Martin',
  'Kit O’Connor',
  'Lou Haddad',
] as const;
const STAFF_TRAITS: StaffTrait[] = ['quickHands', 'peoplePerson', 'perfectionist', 'steady'];
const VENUE_ORDER: VenueId[] = ['cart', 'kiosk', 'cafe'];

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
  return {
    stateVersion: 2,
    campaignId: `laneway-${seed.toString(16).padStart(8, '0')}`,
    seed,
    rngState,
    scenarioId: options.scenarioId ?? 'lanewayClassic',
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

/** Commit supply purchases and begin the deterministic service rush. */
export function startRush(state: GameState): GameState {
  requirePhase(state, 'planning');
  validatePlan(state, state.plan);
  const suppliesCost = purchaseCost(state.plan);
  if (suppliesCost > state.cashCents - CAMPAIGN_RULES.overdraftFloorCents) {
    throw new GameRuleError('Reduce supply purchases before opening the business.');
  }
  const inventory = addPurchases(state.inventory, state.plan);
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
      settled.venueId === 'cafe' &&
      settled.cashCents >= CAMPAIGN_RULES.victoryCashCents &&
      settled.reputation >= CAMPAIGN_RULES.victoryReputation;
    return won
      ? {
          ...settled,
          phase: 'victory',
          outcome: {
            type: 'victory',
            title: 'The laneway has its local institution',
            message: `Day ${CAMPAIGN_RULES.durationDays} closes with a thriving specialty cafe, ${formatCents(settled.cashCents)} in the till, and ${settled.reputation} reputation.`,
          },
        }
      : {
          ...settled,
          phase: 'defeat',
          outcome: {
            type: 'targetMissed',
            title: 'A good run, short of the final brief',
            message: `Day ${CAMPAIGN_RULES.durationDays} needs a cafe, ${formatCents(CAMPAIGN_RULES.victoryCashCents)}, and ${CAMPAIGN_RULES.victoryReputation} reputation. Your next seed is waiting.`,
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
  if (state.staff.length >= MAX_HIRED_STAFF) {
    throw new GameRuleError(`The business can employ at most ${MAX_HIRED_STAFF} people.`);
  }
  const candidate = state.candidateStaff.find((member) => member.id === candidateId);
  if (!candidate) throw new GameRuleError('That candidate is no longer available today.');
  if (state.staff.some((member) => member.id === candidate.id)) {
    throw new GameRuleError('That candidate already works here.');
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
  const nextTier = EQUIPMENT[equipmentId].tiers[currentLevel];
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
  return {
    ...state,
    cashCents: state.cashCents - nextTier.costCents,
    equipment: { ...state.equipment, [equipmentId]: nextTier.level },
  };
}

/** Promote the current business when its cash, reputation, and equipment are ready. */
export function promoteVenue(state: GameState): GameState {
  requirePhase(state, 'reinvest');
  if (state.venueId === 'cafe') throw new GameRuleError('The specialty cafe is the final venue.');
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
  wasteMultiplier: number;
  queueBonus: number;
  operatingCostCents: number;
}

/** Aggregate the exact staff, trait, equipment, and venue effects used by service. */
export function operationalEffects(state: GameState): OperationalEffects {
  let preparationMultiplier = 1;
  let qualityBonus = 0;
  let satisfactionBonus = 0;
  let demandMultiplier = 1;
  let patienceMultiplier = 1;
  let wasteMultiplier = state.equipment.refrigeration === 2 ? 0.35 : 1;
  const queueBonus = state.equipment.serviceCounter * 2;

  if (state.equipment.refrigeration === 1) wasteMultiplier = 0.65;
  qualityBonus += state.equipment.grinder === 2 ? 5 : state.equipment.grinder === 1 ? 2 : 0;
  if (state.equipment.pos === 1) {
    preparationMultiplier *= 0.96;
    demandMultiplier *= 1.02;
  } else if (state.equipment.pos === 2) {
    preparationMultiplier *= 0.91;
    demandMultiplier *= 1.04;
  }
  preparationMultiplier *= state.equipment.serviceCounter === 2 ? 0.93 : 1;
  if (state.equipment.serviceCounter === 1) preparationMultiplier *= 0.97;

  for (const member of scheduledStaff(state)) {
    if (member.role === 'barista') {
      preparationMultiplier *= clamp(1 - (member.speed - 45) * 0.004, 0.78, 1);
      qualityBonus += Math.round((member.skill - 48) / 11);
    } else {
      preparationMultiplier *= clamp(1 - (member.speed - 45) * 0.0015, 0.91, 1);
      patienceMultiplier *= 1 + Math.max(0, member.skill - 45) / 500;
      satisfactionBonus += Math.round((member.skill - 48) / 14);
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
      wasteMultiplier *= 0.94;
    }
  }

  const equipmentOperatingCost = EQUIPMENT_IDS.reduce((total, equipmentId) => {
    const level = state.equipment[equipmentId];
    return (
      total + (level > 0 ? (EQUIPMENT[equipmentId].tiers[level - 1]?.operatingCostCents ?? 0) : 0)
    );
  }, 0);
  return {
    preparationMultiplier,
    qualityBonus,
    satisfactionBonus,
    demandMultiplier,
    patienceMultiplier,
    wasteMultiplier,
    queueBonus,
    operatingCostCents: VENUES[state.venueId].operatingCostCents + equipmentOperatingCost,
  };
}

/** Return the equipment-only preparation multiplier for a configured drink. */
export function equipmentPreparationMultiplier(state: GameState, drinkId: DrinkId): number {
  if (drinkId === 'batchBrew') {
    return state.equipment.batchBrewer === 2 ? 0.55 : state.equipment.batchBrewer === 1 ? 0.75 : 1;
  }
  if (drinkId === 'coldBrew') return 1;
  return state.equipment.espressoMachine === 2
    ? 0.82
    : state.equipment.espressoMachine === 1
      ? 0.92
      : 1;
}

/** Return the venue plus service-counter queue capacity used by arrivals. */
export function serviceQueueCapacity(state: GameState): number {
  return VENUES[state.venueId].queueCapacity + operationalEffects(state).queueBonus;
}

/** Produce the same four-person candidate pool for a given seed and day. */
export function candidatePoolForDay(seed: number, day: number): StaffMember[] {
  let rngState = (seed ^ Math.imul(day, 0x9e3779b1)) >>> 0;
  if (rngState === 0) rngState = 0x6d2b79f5;
  const candidates: StaffMember[] = [];
  for (let index = 0; index < 4; index += 1) {
    const nameDraw = randomInt(rngState, 0, CANDIDATE_NAMES.length - 1);
    rngState = nameDraw.state;
    const speedDraw = randomInt(rngState, 52, 88);
    rngState = speedDraw.state;
    const skillDraw = randomInt(rngState, 50, 90);
    rngState = skillDraw.state;
    const traitDraw = randomInt(rngState, 0, STAFF_TRAITS.length - 1);
    rngState = traitDraw.state;
    const role = index % 2 === 0 ? 'barista' : 'frontOfHouse';
    const wageCents = Math.round((1_200 + speedDraw.value * 8 + skillDraw.value * 10) / 50) * 50;
    candidates.push({
      id: `staff-${seed.toString(16)}-${day}-${index}`,
      name: CANDIDATE_NAMES[nameDraw.value] ?? `Candidate ${index + 1}`,
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

  let working: GameState = {
    ...state,
    rush: ageQueue({ ...rush, tick: nextTick }),
  };
  working = progressService(working);
  working = startNextService(working);
  working = maybeAddArrival(working);
  const updatedRush = working.rush;
  if (updatedRush && updatedRush.tick >= updatedRush.durationTicks) return finishRush(working);
  return working;
}

function ageQueue(rush: RushState): RushState {
  const kept: Customer[] = [];
  let abandoned = 0;
  for (const customer of rush.queue) {
    const aged = { ...customer, waitedTicks: customer.waitedTicks + 1 };
    if (aged.waitedTicks >= aged.patienceTicks) abandoned += 1;
    else kept.push(aged);
  }
  return {
    ...rush,
    queue: kept,
    stats: { ...rush.stats, abandoned: rush.stats.abandoned + abandoned },
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
  return { ...state, rush: { ...rush, activeService: null, stats } };
}

function startNextService(state: GameState): GameState {
  let working = state;
  while (working.rush && !working.rush.activeService && working.rush.queue.length > 0) {
    const rush = working.rush;
    const customer = rush.queue[0];
    if (!customer) break;
    const queue = rush.queue.slice(1);
    if (!hasIngredients(working.inventory, customer.order.ingredientAmounts)) {
      working = {
        ...working,
        rush: {
          ...rush,
          queue,
          stats: {
            ...rush.stats,
            stockouts: rush.stats.stockouts + 1,
            abandoned: rush.stats.abandoned + 1,
          },
        },
      };
      continue;
    }
    const consumed = consumeIngredients(working.inventory, customer.order.ingredientAmounts);
    const ingredientCost = recipeCost(customer.order.ingredientAmounts);
    const consumedTotals = { ...rush.stats.consumed };
    for (const item of customer.order.ingredientAmounts) {
      consumedTotals[item.ingredientId] = (consumedTotals[item.ingredientId] ?? 0) + item.amount;
    }
    working = {
      ...working,
      inventory: consumed,
      rush: {
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
      },
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
  if (activeRush.queue.length >= serviceQueueCapacity(state)) {
    return {
      ...updated,
      rush: {
        ...activeRush,
        nextCustomerId: activeRush.nextCustomerId + 1,
        stats: {
          ...activeRush.stats,
          arrivals,
          arrivalsBySegment: {
            ...activeRush.stats.arrivalsBySegment,
            [created.customer.segment]: segmentArrivals,
          },
          abandoned: activeRush.stats.abandoned + 1,
          peakQueue: Math.max(activeRush.stats.peakQueue, activeRush.queue.length),
        },
      },
    };
  }
  const queue = [...activeRush.queue, created.customer];
  return {
    ...updated,
    rush: {
      ...activeRush,
      queue,
      nextCustomerId: activeRush.nextCustomerId + 1,
      stats: {
        ...activeRush.stats,
        arrivals,
        arrivalsBySegment: {
          ...activeRush.stats.arrivalsBySegment,
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
  const segment = chooseSegment(segmentDraw.value);
  const drinkDraw = nextRandom(rngState);
  rngState = drinkDraw.state;
  const drinkId = chooseDrink(state, segment, drinkDraw.value);
  const drink = getDrink(drinkId);
  const sizeDraw = nextRandom(rngState);
  rngState = sizeDraw.state;
  const size = chooseSize(drink, segment, sizeDraw.value);
  const milkDraw = nextRandom(rngState);
  rngState = milkDraw.state;
  const milk = chooseMilk(drink, milkDraw.value);
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
    preparationTicks: Math.max(
      5,
      Math.round(
        variant.preparationTicks *
          dialMultiplier *
          beanMultiplier *
          signMultiplier *
          effects.preparationMultiplier *
          equipmentMultiplier,
      ),
    ),
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

function chooseMilk(drink: DrinkConfig, draw: number): MilkChoice {
  if (drink.allowedMilks.length === 1) return drink.allowedMilks[0] ?? 'none';
  if (drink.allowedMilks.includes('none') && draw < 0.52) return 'none';
  if (drink.allowedMilks.includes('oat') && draw < 0.72) return 'oat';
  if (drink.allowedMilks.includes('soy') && draw < 0.84) return 'soy';
  return drink.allowedMilks.includes('dairy') ? 'dairy' : (drink.allowedMilks[0] ?? 'none');
}

function chooseSegment(draw: number): CustomerSegment {
  if (draw < 0.34) return 'commuter';
  if (draw < 0.59) return 'student';
  if (draw < 0.79) return 'enthusiast';
  return 'regular';
}

function chooseSize(drink: DrinkConfig, segment: CustomerSegment, draw: number): DrinkSize {
  if (!drink.variants.some((variant) => variant.size === 'large')) return 'regular';
  const largeChance = segment === 'student' ? 0.3 : segment === 'commuter' ? 0.35 : 0.42;
  return draw < largeChance ? 'large' : 'regular';
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
  const price = state.plan.pricesCents[drinkId];
  const sensitivity = segment === 'student' ? 520 : segment === 'commuter' ? 760 : 900;
  const priceFactor = clamp(1.25 - (price - drink.basePriceCents) / sensitivity, 0.25, 1.5);
  const weatherFactor = drinkWeatherFactor(drinkId, state.weather);
  const regularRecipe = drink.variants[0];
  const available = regularRecipe
    ? hasIngredients(
        state.inventory,
        regularRecipe.ingredients.map((item) => adaptIngredient(state, item, 'dairy')),
      )
    : false;
  const availabilityFactor = available ? 1 : 0.12;
  return SEGMENT_DRINK_APPEAL[segment][drinkId] * priceFactor * weatherFactor * availabilityFactor;
}

function drinkWeatherFactor(drinkId: DrinkId, weather: GameState['weather']): number {
  const isColdDrink = drinkId === 'icedLatte' || drinkId === 'coldBrew';
  if (weather === 'sunny') return isColdDrink ? 1.65 : 0.9;
  if (weather === 'coldSnap') return isColdDrink ? 0.5 : 1.22;
  if (weather === 'rainy') return isColdDrink ? 0.65 : 1.15;
  return 1;
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
    working = {
      ...created.state,
      rush: {
        ...currentRush,
        queue: hasSpace ? [...currentRush.queue, created.customer] : currentRush.queue,
        nextCustomerId: currentRush.nextCustomerId + 1,
        stats: {
          ...currentRush.stats,
          arrivals: currentRush.stats.arrivals + 1,
          arrivalsBySegment: {
            ...currentRush.stats.arrivalsBySegment,
            [created.customer.segment]:
              (currentRush.stats.arrivalsBySegment[created.customer.segment] ?? 0) + 1,
          },
          abandoned: currentRush.stats.abandoned + (hasSpace ? 0 : 1),
          peakQueue: Math.max(
            currentRush.stats.peakQueue,
            currentRush.queue.length + (hasSpace ? 1 : 0),
          ),
        },
      },
    };
  }
  return working;
}

function finishRush(state: GameState): GameState {
  const rush = state.rush;
  if (!rush) throw new GameRuleError('No service rush is active.');
  const waste = calculateWaste(state);
  const inventory = consumeIngredients(state.inventory, toIngredientAmounts(waste));
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
  const report: DayReport = {
    day: state.day,
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
    remainingInventory: inventory,
    servedBySegment: rush.stats.servedBySegment,
    bottleneck: determineBottleneck(state, rush),
    explanations: buildExplanations(state, rush, satisfaction),
    settled: false,
  };
  return { ...state, phase: 'report', inventory, report };
}

function calculateWaste(state: GameState): Partial<Record<IngredientId, number>> {
  const wasteMultiplier = operationalEffects(state).wasteMultiplier;
  const dairyWaste = Math.floor(state.inventory.dairyMilk * 0.02 * wasteMultiplier);
  const oatWaste = Math.floor(state.inventory.oatMilk * 0.015 * wasteMultiplier);
  const soyWaste = Math.floor(state.inventory.soyMilk * 0.012 * wasteMultiplier);
  return {
    ...(dairyWaste > 0 ? { dairyMilk: dairyWaste } : {}),
    ...(oatWaste > 0 ? { oatMilk: oatWaste } : {}),
    ...(soyWaste > 0 ? { soyMilk: soyWaste } : {}),
  };
}

function determineBottleneck(state: GameState, rush: RushState): string {
  if (rush.stats.stockouts > Math.max(2, rush.stats.served * 0.15)) return 'Ingredient stockouts';
  if (rush.stats.peakQueue >= serviceQueueCapacity(state) - 1) return 'Coffee preparation speed';
  if (rush.stats.abandoned > 2) return 'Customer wait time';
  return 'No major bottleneck — the cart flowed well';
}

function buildExplanations(state: GameState, rush: RushState, satisfaction: number): string[] {
  const explanations = [
    `${state.plan.dialIn[0]?.toUpperCase()}${state.plan.dialIn.slice(1)} dial-in traded preparation time for cup quality.`,
    `${WEATHER_DETAILS[state.weather].name} weather: ${WEATHER_DETAILS[state.weather].note}`,
    `${BEAN_DETAILS[state.plan.beanId].name} changed shot quality and preparation time.`,
    `${rush.stats.peakQueue} was the longest queue during the 75-second rush.`,
    `${VENUES[state.venueId].shortName} supported ${VENUES[state.venueId].staffCapacity} scheduled staff and a ${serviceQueueCapacity(state)}-person queue.`,
  ];
  const scheduled = scheduledStaff(state);
  if (scheduled.length > 0) {
    explanations.push(
      `${scheduled.length} scheduled team member${scheduled.length === 1 ? '' : 's'} cost ${formatCents(rush.wageCostCents ?? 0)} and changed service speed, quality, or patience.`,
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
  const priceFactor = clamp(1.15 - (averagePrice - 500) / 900, 0.55, 1.25);
  const reputationFactor = 0.8 + state.reputation / 250;
  const signFactor = state.improvements.includes('street-sign') ? 1.08 : 1;
  const qualityFactor =
    state.plan.dialIn === 'quality' ? 1.06 : state.plan.dialIn === 'speed' ? 0.97 : 1;
  const beanFactor = 1 + BEAN_DETAILS[state.plan.beanId].quality / 100;
  const weatherFactor = WEATHER_DETAILS[state.weather].demand;
  const venueFactor = VENUE_DEMAND_FACTOR[state.venueId];
  const scenarioFactor = SCENARIO_DETAILS[state.scenarioId].demandMultiplier;
  const teamFactor = operationalEffects(state).demandMultiplier;
  const queueFactor = clamp(1 - (rush?.queue.length ?? 0) * 0.045, 0.55, 1);
  const availableItems = state.plan.activeMenu.filter((drinkId) => {
    const recipe = getDrink(drinkId).variants[0];
    return recipe
      ? hasIngredients(
          state.inventory,
          recipe.ingredients.map((item) => adaptIngredient(state, item, 'dairy')),
        )
      : false;
  }).length;
  const availabilityFactor = 0.35 + 0.65 * (availableItems / state.plan.activeMenu.length);
  return clamp(
    0.075 *
      priceFactor *
      reputationFactor *
      signFactor *
      qualityFactor *
      beanFactor *
      weatherFactor *
      venueFactor *
      scenarioFactor *
      teamFactor *
      queueFactor *
      availabilityFactor *
      (rush?.demandMultiplier ?? 1),
    0.005,
    0.3,
  );
}

function addPurchases(inventory: IngredientInventory, plan: DayPlan): IngredientInventory {
  const updated = { ...inventory };
  for (const item of PURCHASE_PACKAGES) {
    updated[item.ingredientId] += item.amount * plan.purchases[item.ingredientId];
  }
  return updated;
}

function hasIngredients(inventory: IngredientInventory, ingredients: IngredientAmount[]): boolean {
  return ingredients.every((item) => inventory[item.ingredientId] >= item.amount);
}

function consumeIngredients(
  inventory: IngredientInventory,
  ingredients: IngredientAmount[],
): IngredientInventory {
  const updated = { ...inventory };
  for (const item of ingredients) {
    updated[item.ingredientId] = Math.max(0, updated[item.ingredientId] - item.amount);
  }
  return updated;
}

function toIngredientAmounts(values: Partial<Record<IngredientId, number>>): IngredientAmount[] {
  return Object.entries(values).map(([ingredientId, amount]) => ({
    ingredientId: ingredientId as IngredientId,
    amount,
  }));
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
    if (!Number.isInteger(price) || price < MIN_PRICE_CENTS || price > MAX_PRICE_CENTS) {
      throw new GameRuleError('Drink prices must be between $2.50 and $12.00.');
    }
  }
  for (const item of PURCHASE_PACKAGES) {
    const quantity = plan.purchases[item.ingredientId];
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_PURCHASE_PACKAGES) {
      throw new GameRuleError('Supply package quantities must be whole numbers from 0 to 20.');
    }
  }
  if (new Set(plan.scheduledStaffIds).size !== plan.scheduledStaffIds.length) {
    throw new GameRuleError('A team member can only be scheduled once per day.');
  }
  if (plan.scheduledStaffIds.length > VENUE_STAFF_CAPACITY[state.venueId]) {
    throw new GameRuleError(
      `${VENUES[state.venueId].shortName} can schedule ${VENUE_STAFF_CAPACITY[state.venueId]} staff.`,
    );
  }
  if (plan.scheduledStaffIds.some((id) => !state.staff.some((member) => member.id === id))) {
    throw new GameRuleError('Only hired staff can be scheduled.');
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

function venueMeetsRequirement(current: VenueId, required: VenueId): boolean {
  return VENUE_ORDER.indexOf(current) >= VENUE_ORDER.indexOf(required);
}

function requireManagementPhase(state: GameState): void {
  if (state.phase !== 'planning' && state.phase !== 'reinvest') {
    throw new GameRuleError('Staff can only be hired while planning or reinvesting.');
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
