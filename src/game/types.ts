/** Serializable domain contracts for Laneway Tycoon. */

export type DrinkId =
  | 'espresso'
  | 'longBlack'
  | 'flatWhite'
  | 'latte'
  | 'cappuccino'
  | 'piccolo'
  | 'mocha'
  | 'batchBrew'
  | 'icedLatte'
  | 'coldBrew';

export type IngredientId =
  | 'houseBeans'
  | 'singleOriginBeans'
  | 'darkRoastBeans'
  | 'dairyMilk'
  | 'oatMilk'
  | 'soyMilk'
  | 'chocolate'
  | 'ice'
  | 'coldBrewConcentrate';

export type BeanId = 'houseBeans' | 'singleOriginBeans' | 'darkRoastBeans';
export type MilkChoice = 'none' | 'dairy' | 'oat' | 'soy';
export type DrinkSize = 'regular' | 'large';
export type DialIn = 'speed' | 'balanced' | 'quality';
export type GamePhase =
  'planning' | 'rush' | 'event' | 'report' | 'reinvest' | 'victory' | 'defeat';
export type GameMode = 'campaign' | 'endless';
export type VenueId = 'cart' | 'kiosk' | 'cafe';
export type CustomerSegment = 'commuter' | 'student' | 'enthusiast' | 'regular';
export type StaffRole = 'barista' | 'frontOfHouse';
export type StaffTrait = 'quickHands' | 'peoplePerson' | 'perfectionist' | 'steady';
export type WeatherId = 'mild' | 'sunny' | 'rainy' | 'coldSnap';
export type ScenarioId = 'lanewayClassic' | 'rainySeason' | 'festivalWeek';
export type CosmeticId = 'classicAwning' | 'wattleAwning' | 'neonCup';
export type AchievementId = 'cafeFounder' | 'goldenCup' | 'hardLessons';
export type RushSpeed = 1 | 2 | 4;
export type StepDirection = -1 | 1;

export interface IngredientAmount {
  ingredientId: IngredientId;
  amount: number;
}

export interface RecipeVariant {
  size: DrinkSize;
  ingredients: IngredientAmount[];
  preparationTicks: number;
}

export interface DrinkConfig {
  id: DrinkId;
  name: string;
  description: string;
  basePriceCents: number;
  allowedMilks: MilkChoice[];
  variants: RecipeVariant[];
  qualitySensitivity: number;
  optionalMilkAmount?: number;
}

export interface PurchasePackage {
  ingredientId: IngredientId;
  label: string;
  amount: number;
  costCents: number;
  unit: 'g' | 'ml' | 'serve';
}

/** One dated quantity in the canonical per-ingredient inventory. */
export interface InventoryBatch {
  quantity: number;
  acquiredDay: number;
  /** Inclusive last trading day; expiry is applied after this day's rush. */
  expiresAfterDay: number;
}

export type IngredientInventory = Record<IngredientId, InventoryBatch[]>;
export type IngredientTotals = Record<IngredientId, number>;
export type IngredientPurchases = Record<IngredientId, number>;
export type DrinkPrices = Record<DrinkId, number>;

export interface DayPlan {
  activeMenu: DrinkId[];
  pricesCents: DrinkPrices;
  purchases: IngredientPurchases;
  dialIn: DialIn;
  beanId: BeanId;
  scheduledStaffIds: string[];
}

export interface Order {
  drinkId: DrinkId;
  size: DrinkSize;
  milk: MilkChoice;
  priceCents: number;
  ingredientAmounts: IngredientAmount[];
  preparationTicks: number;
}

export interface Customer {
  id: string;
  segment: CustomerSegment;
  order: Order;
  arrivedAtTick: number;
  patienceTicks: number;
  waitedTicks: number;
}

export interface ServiceJob {
  customer: Customer;
  remainingTicks: number;
  totalTicks: number;
}

/** Walkaway causes emitted at the exact engine transition that removes a customer. */
export type RushWalkawayReason = 'patience' | 'queueFull' | 'stockout' | 'rushEnded';

/** Stable identity shared by every bounded rush observation. */
export interface RushActivityBase {
  id: string;
  sequence: number;
  tick: number;
  customerId: string;
  /** `null` is reserved for honestly migrated observations that predate customer identity. */
  segment: CustomerSegment | null;
}

/** A generated customer reaching the business, whether or not the queue can accept them. */
export interface ArrivalActivityEvent extends RushActivityBase {
  type: 'arrival';
}

/** A queued order whose ingredients were reserved and preparation began. */
export interface ServiceStartedActivityEvent extends RushActivityBase {
  type: 'serviceStarted';
  drinkId: DrinkId;
  size: DrinkSize;
  milk: MilkChoice;
}

/** A completed order charged at the engine-recorded actual price. */
export interface SaleActivityEvent extends RushActivityBase {
  type: 'sale';
  drinkId: DrinkId;
  size: DrinkSize;
  milk: MilkChoice;
  priceCents: number;
}

/** A customer leaving without a completed sale. */
export interface WalkawayActivityEvent extends RushActivityBase {
  type: 'walkaway';
  reason: RushWalkawayReason;
}

/** Ordered, bounded engine observations used by presentation and accessible feedback. */
export type RushActivityEvent =
  ArrivalActivityEvent | ServiceStartedActivityEvent | SaleActivityEvent | WalkawayActivityEvent;

/** Backward-compatible public name for consumers that operate specifically on sale events. */
export type CompletedSaleActivity = SaleActivityEvent;

export interface EventChoiceEffect {
  cashCents?: number;
  demandMultiplier?: number;
  qualityBonus?: number;
  reputation?: number;
  addCustomers?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effect: EventChoiceEffect;
}

export interface SimulationEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface ResolvedEvent {
  eventId: string;
  choiceId: string;
  summary: string;
}

export interface RushStats {
  arrivals: number;
  served: number;
  abandoned: number;
  stockouts: number;
  revenueCents: number;
  ingredientCostCents: number;
  totalWaitTicks: number;
  satisfactionTotal: number;
  peakQueue: number;
  soldByDrink: Partial<Record<DrinkId, number>>;
  consumed: Partial<Record<IngredientId, number>>;
  arrivalsBySegment: Partial<Record<CustomerSegment, number>>;
  servedBySegment: Partial<Record<CustomerSegment, number>>;
}

export interface RushState {
  tick: number;
  durationTicks: number;
  isPaused: boolean;
  speed: RushSpeed;
  queue: Customer[];
  activeService: ServiceJob | null;
  pendingEvent: SimulationEvent | null;
  resolvedEvents: ResolvedEvent[];
  eventTriggerTicks: number[];
  nextCustomerId: number;
  demandMultiplier: number;
  qualityBonus: number;
  eventCashDeltaCents: number;
  eventReputationDelta: number;
  openingCashCents: number;
  purchaseCostCents: number;
  wageCostCents: number;
  operatingCostCents: number;
  openingInventory: IngredientTotals;
  purchasedInventory: IngredientTotals;
  nextActivitySequence: number;
  recentActivity: RushActivityEvent[];
  stats: RushStats;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  speed: number;
  skill: number;
  wageCents: number;
  trait: StaffTrait;
  hiredOnDay: number;
}

export interface EquipmentState {
  grinder: number;
  espressoMachine: number;
  batchBrewer: number;
  refrigeration: number;
  pos: number;
  serviceCounter: number;
}

export type EquipmentId = keyof EquipmentState;

export interface EquipmentTierConfig {
  level: 1 | 2;
  name: string;
  costCents: number;
  operatingCostCents: number;
  requiresVenue: VenueId;
  effect: string;
}

export interface EquipmentConfig {
  id: EquipmentId;
  name: string;
  description: string;
  tiers: [EquipmentTierConfig, EquipmentTierConfig];
}

export interface VenueConfig {
  id: VenueId;
  name: string;
  shortName: string;
  description: string;
  menuCapacity: number;
  staffCapacity: number;
  queueCapacity: number;
  demandFactor: number;
  operatingCostCents: number;
}

export interface VenuePromotion {
  from: Exclude<VenueId, 'cafe'>;
  to: Exclude<VenueId, 'cart'>;
  costCents: number;
  reputationRequired: number;
  requiredEquipment: Partial<Record<EquipmentId, number>>;
}

export interface DayReport {
  day: number;
  weather: WeatherId;
  openingCashCents: number;
  purchaseCostCents: number;
  revenueCents: number;
  ingredientCostCents: number;
  wageCostCents: number;
  operatingCostCents: number;
  eventCashDeltaCents: number;
  netCashFlowCents: number;
  closingCashCents: number;
  arrivals: number;
  served: number;
  abandoned: number;
  stockouts: number;
  averageWaitSeconds: number;
  satisfactionPercent: number;
  reputationChange: number;
  waste: Partial<Record<IngredientId, number>>;
  remainingInventory: IngredientTotals;
  inventoryLifecycle: InventoryLifecycleReport | null;
  servedBySegment: Partial<Record<CustomerSegment, number>>;
  bottleneck: string;
  explanations: string[];
  settled: boolean;
}

/** Exact per-ingredient conservation evidence captured for a completed v3 rush. */
export interface InventoryLifecycleReport {
  opening: IngredientTotals;
  purchased: IngredientTotals;
  consumed: IngredientTotals;
  expired: IngredientTotals;
  remaining: IngredientTotals;
}

export interface CampaignOutcome {
  type: 'victory' | 'bankruptcy' | 'targetMissed';
  title: string;
  message: string;
}

export interface GameState {
  stateVersion: 3;
  campaignId: string;
  seed: number;
  rngState: number;
  scenarioId: ScenarioId;
  mode: GameMode;
  phase: GamePhase;
  day: number;
  cashCents: number;
  reputation: number;
  venueId: VenueId;
  weather: WeatherId;
  inventory: IngredientInventory;
  plan: DayPlan;
  rush: RushState | null;
  report: DayReport | null;
  lastSettledDay: number;
  staff: StaffMember[];
  candidateStaff: StaffMember[];
  equipment: EquipmentState;
  improvements: string[];
  history: DayReport[];
  outcome: CampaignOutcome | null;
}

export interface Preferences {
  soundEnabled: boolean;
  ambienceEnabled: boolean;
  reducedMotion: boolean;
  onboardingComplete: boolean;
  activeTab: string;
}

export interface CampaignRecord {
  campaignId: string;
  result: CampaignOutcome['type'];
  day: number;
  cashCents: number;
  reputation: number;
  venueId: VenueId;
}

export interface MetaProgress {
  endlessUnlocked: boolean;
  achievements: AchievementId[];
  cosmetics: CosmeticId[];
  scenarios: ScenarioId[];
  records: CampaignRecord[];
}

export interface SaveEnvelope {
  schemaVersion: 3;
  savedAt: string;
  activeRun: GameState | null;
  preferences: Preferences;
  meta: MetaProgress;
}

export interface CampaignOptions {
  seed: number;
  scenarioId?: ScenarioId;
}

export interface PlanPatch {
  activeMenu?: DrinkId[];
  pricesCents?: Partial<DrinkPrices>;
  purchases?: Partial<IngredientPurchases>;
  dialIn?: DialIn;
  beanId?: BeanId;
  scheduledStaffIds?: string[];
}

export type GameCommand =
  | { type: 'prepareDay'; patch: PlanPatch }
  | { type: 'adjustPlanPrice'; drinkId: DrinkId; direction: StepDirection }
  | { type: 'adjustPlanPurchase'; ingredientId: IngredientId; direction: StepDirection }
  | { type: 'startRush' }
  | { type: 'advanceTick'; ticks?: number }
  | { type: 'togglePause' }
  | { type: 'setSpeed'; speed: RushSpeed }
  | { type: 'resolveEvent'; choiceId: string }
  | { type: 'closeDay' }
  | { type: 'buyImprovement'; improvementId: string }
  | { type: 'hireStaff'; candidateId: string }
  | { type: 'buyEquipment'; equipmentId: EquipmentId }
  | { type: 'promoteVenue' }
  | { type: 'startNextDay' }
  | { type: 'continueEndless' };
