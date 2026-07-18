import {
  CART_IMPROVEMENT_COST_CENTS,
  INGREDIENT_UNIT_COST_CENTS,
  INITIAL_CASH_CENTS,
  INITIAL_REPUTATION,
  MAX_CART_MENU_ITEMS,
  MAX_QUEUE_LENGTH,
  PHASE_ONE_DRINK_MAP,
  PURCHASE_PACKAGES,
  RUSH_DURATION_TICKS,
  TICKS_PER_SECOND,
  createDefaultPlan,
  emptyInventory,
  emptyPurchases,
  milkIngredient,
} from '../content/phase1';
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
} from './types';

const CART_OPERATING_COST_CENTS = 450;
const MIN_PRICE_CENTS = 250;
const MAX_PRICE_CENTS = 1_200;
const MAX_PURCHASE_PACKAGES = 20;

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

/** Create a deterministic, serializable campaign at the first morning plan. */
export function createCampaign(options: CampaignOptions): GameState {
  if (!Number.isFinite(options.seed)) throw new GameRuleError('Campaign seed must be a number.');
  const seed = Math.trunc(options.seed) >>> 0;
  const rngState = seed === 0 ? 0x6d2b79f5 : seed;
  return {
    stateVersion: 1,
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
    weather: 'mild',
    inventory: emptyInventory(),
    plan: createDefaultPlan(),
    rush: null,
    report: null,
    lastSettledDay: 0,
    staff: [],
    candidateStaff: [],
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
  validatePlan(plan);
  if (purchaseCost(plan) > state.cashCents) {
    throw new GameRuleError('Those supplies cost more cash than the cart has available.');
  }
  return { ...state, plan };
}

/** Commit supply purchases and begin the deterministic service rush. */
export function startRush(state: GameState): GameState {
  requirePhase(state, 'planning');
  validatePlan(state.plan);
  const suppliesCost = purchaseCost(state.plan);
  if (suppliesCost > state.cashCents) {
    throw new GameRuleError('Reduce supply purchases before opening the cart.');
  }
  const inventory = addPurchases(state.inventory, state.plan);
  const rush: RushState = {
    tick: 0,
    durationTicks: RUSH_DURATION_TICKS,
    isPaused: false,
    speed: 1,
    queue: [],
    activeService: null,
    pendingEvent: null,
    resolvedEvents: [],
    eventTriggerTicks: [Math.floor(RUSH_DURATION_TICKS * 0.42)],
    nextCustomerId: 1,
    demandMultiplier: 1,
    qualityBonus: 0,
    eventCashDeltaCents: 0,
    eventReputationDelta: 0,
    openingCashCents: state.cashCents,
    purchaseCostCents: suppliesCost,
    operatingCostCents: CART_OPERATING_COST_CENTS,
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
  return {
    ...state,
    phase: 'reinvest',
    cashCents: settledReport.closingCashCents,
    reputation: clamp(state.reputation + settledReport.reputationChange, 0, 100),
    report: settledReport,
    lastSettledDay: state.day,
    history: [...state.history, settledReport],
  };
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

/** Begin the following morning while retaining prices, menu, stock, and upgrades. */
export function startNextDay(state: GameState): GameState {
  requirePhase(state, 'reinvest');
  if (state.lastSettledDay !== state.day) throw new GameRuleError('Settle the report first.');
  return {
    ...state,
    phase: 'planning',
    day: state.day + 1,
    plan: { ...state.plan, purchases: emptyPurchases() },
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

function advanceSingleTick(state: GameState): GameState {
  const rush = state.rush;
  if (!rush) throw new GameRuleError('No service rush is active.');
  const nextTick = rush.tick + 1;
  if (rush.eventTriggerTicks.includes(nextTick)) {
    return {
      ...state,
      phase: 'event',
      rush: {
        ...rush,
        tick: nextTick,
        isPaused: true,
        pendingEvent: LANEWAY_EVENT,
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
  if (arrivalDraw.value >= arrivalChance(updated)) return updated;
  const created = createCustomer(updated, rush.nextCustomerId);
  updated = created.state;
  const activeRush = updated.rush;
  if (!activeRush) return updated;
  const arrivals = activeRush.stats.arrivals + 1;
  if (activeRush.queue.length >= MAX_QUEUE_LENGTH) {
    return {
      ...updated,
      rush: {
        ...activeRush,
        nextCustomerId: activeRush.nextCustomerId + 1,
        stats: {
          ...activeRush.stats,
          arrivals,
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
  const segment: CustomerSegment = segmentDraw.value < 0.68 ? 'commuter' : 'regular';
  const drinkDraw = nextRandom(rngState);
  rngState = drinkDraw.state;
  const menuIndex = Math.min(
    state.plan.activeMenu.length - 1,
    Math.floor(drinkDraw.value * state.plan.activeMenu.length),
  );
  const drinkId = state.plan.activeMenu[menuIndex];
  if (!drinkId) throw new GameRuleError('The active menu must contain a drink.');
  const drink = getDrink(drinkId);
  const milkDraw = nextRandom(rngState);
  rngState = milkDraw.state;
  const milk = chooseMilk(drink, milkDraw.value);
  const patienceDraw = randomInt(rngState, 70, 130);
  rngState = patienceDraw.state;
  const order = makeOrder(state, drink, milk);
  const tick = state.rush?.tick ?? 0;
  return {
    state: { ...state, rngState },
    customer: {
      id: `d${state.day}-c${sequence}`,
      segment,
      order,
      arrivedAtTick: tick,
      patienceTicks: patienceDraw.value,
      waitedTicks: 0,
    },
  };
}

function makeOrder(state: GameState, drink: DrinkConfig, milk: MilkChoice): Order {
  const variant = drink.variants[0];
  if (!variant) throw new GameRuleError(`${drink.name} is missing its regular recipe.`);
  const ingredients = variant.ingredients.map((item) => adaptIngredient(state, item, milk));
  const milkSurcharge = milk === 'oat' ? 80 : 0;
  const dialMultiplier =
    state.plan.dialIn === 'speed' ? 0.8 : state.plan.dialIn === 'quality' ? 1.2 : 1;
  const signMultiplier = state.improvements.includes('street-sign') ? 0.96 : 1;
  return {
    drinkId: drink.id,
    size: variant.size,
    milk,
    priceCents: state.plan.pricesCents[drink.id] + milkSurcharge,
    ingredientAmounts: ingredients,
    preparationTicks: Math.max(
      5,
      Math.round(variant.preparationTicks * dialMultiplier * signMultiplier),
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
  if (drink.allowedMilks.includes('oat') && draw < 0.22) return 'oat';
  return drink.allowedMilks.includes('dairy') ? 'dairy' : (drink.allowedMilks[0] ?? 'none');
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
    const hasSpace = currentRush.queue.length < MAX_QUEUE_LENGTH;
    working = {
      ...created.state,
      rush: {
        ...currentRush,
        queue: hasSpace ? [...currentRush.queue, created.customer] : currentRush.queue,
        nextCustomerId: currentRush.nextCustomerId + 1,
        stats: {
          ...currentRush.stats,
          arrivals: currentRush.stats.arrivals + 1,
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
  const waste = calculateWaste(state.inventory);
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
  const closingCash =
    state.cashCents + rush.stats.revenueCents + eventCash - rush.operatingCostCents;
  const report: DayReport = {
    day: state.day,
    weather: state.weather,
    openingCashCents: rush.openingCashCents,
    purchaseCostCents: rush.purchaseCostCents,
    revenueCents: rush.stats.revenueCents,
    ingredientCostCents: rush.stats.ingredientCostCents,
    wageCostCents: 0,
    operatingCostCents: rush.operatingCostCents,
    eventCashDeltaCents: eventCash,
    netCashFlowCents:
      rush.stats.revenueCents + eventCash - rush.purchaseCostCents - rush.operatingCostCents,
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
    bottleneck: determineBottleneck(rush),
    explanations: buildExplanations(state, rush, satisfaction),
    settled: false,
  };
  return { ...state, phase: 'report', inventory, report };
}

function calculateWaste(inventory: IngredientInventory): Partial<Record<IngredientId, number>> {
  const dairyWaste = Math.floor(inventory.dairyMilk * 0.02);
  const oatWaste = Math.floor(inventory.oatMilk * 0.015);
  return {
    ...(dairyWaste > 0 ? { dairyMilk: dairyWaste } : {}),
    ...(oatWaste > 0 ? { oatMilk: oatWaste } : {}),
  };
}

function determineBottleneck(rush: RushState): string {
  if (rush.stats.stockouts > Math.max(2, rush.stats.served * 0.15)) return 'Ingredient stockouts';
  if (rush.stats.peakQueue >= MAX_QUEUE_LENGTH - 1) return 'Coffee preparation speed';
  if (rush.stats.abandoned > 2) return 'Customer wait time';
  return 'No major bottleneck — the cart flowed well';
}

function buildExplanations(state: GameState, rush: RushState, satisfaction: number): string[] {
  const explanations = [
    `${state.plan.dialIn[0]?.toUpperCase()}${state.plan.dialIn.slice(1)} dial-in traded preparation time for cup quality.`,
    `${rush.stats.peakQueue} was the longest queue during the 75-second rush.`,
  ];
  if (rush.stats.stockouts > 0)
    explanations.push(`${rush.stats.stockouts} orders were lost to unavailable ingredients.`);
  if (satisfaction >= 80)
    explanations.push('Short waits and careful coffee lifted customer sentiment.');
  else if (satisfaction < 65)
    explanations.push('Long waits or rushed coffee weighed on customer sentiment.');
  if (rush.resolvedEvents[0]) explanations.push(rush.resolvedEvents[0].summary);
  return explanations;
}

function calculateSatisfaction(state: GameState, customer: Customer): number {
  const rush = state.rush;
  const drink = getDrink(customer.order.drinkId);
  const dialQuality = state.plan.dialIn === 'quality' ? 9 : state.plan.dialIn === 'speed' ? -5 : 2;
  const waitPenalty = Math.round(customer.waitedTicks / TICKS_PER_SECOND / 2.5);
  const priceDifference = customer.order.priceCents - drink.basePriceCents;
  const pricePenalty = Math.max(0, Math.round(priceDifference / 35));
  const qualityEffect = Math.round(
    (dialQuality + (rush?.qualityBonus ?? 0)) * drink.qualitySensitivity,
  );
  return clamp(78 + qualityEffect - waitPenalty - pricePenalty, 20, 100);
}

function arrivalChance(state: GameState): number {
  const rush = state.rush;
  const averagePrice =
    state.plan.activeMenu.reduce((total, id) => total + state.plan.pricesCents[id], 0) /
    state.plan.activeMenu.length;
  const priceFactor = clamp(1.15 - (averagePrice - 500) / 900, 0.55, 1.25);
  const reputationFactor = 0.8 + state.reputation / 250;
  const signFactor = state.improvements.includes('street-sign') ? 1.08 : 1;
  return clamp(
    0.075 * priceFactor * reputationFactor * signFactor * (rush?.demandMultiplier ?? 1),
    0.025,
    0.22,
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

function validatePlan(plan: DayPlan): void {
  if (plan.activeMenu.length < 1 || plan.activeMenu.length > MAX_CART_MENU_ITEMS) {
    throw new GameRuleError(`Choose between 1 and ${MAX_CART_MENU_ITEMS} cart drinks.`);
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
}

function getDrink(drinkId: DrinkId): DrinkConfig {
  const drink = PHASE_ONE_DRINK_MAP.get(drinkId);
  if (!drink) throw new GameRuleError('That drink has not been unlocked for the cart yet.');
  return drink;
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
  };
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
