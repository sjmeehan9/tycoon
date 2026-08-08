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
/** Immutable demand policy selected when a campaign is created. */
export type Difficulty = 'standard' | 'hard';
export type VenueId = 'cart' | 'kiosk' | 'cafe' | 'departmentStore';
/** Stable preparation stations used by planning, service, persistence, and reports. */
export type StationId = 'espressoBar' | 'brewBar' | 'coldBar';
/** Stable customer lanes used by routing, fairness, activity, and reports. */
export type LaneId = 'normal' | 'express';
export type CustomerSegment = 'commuter' | 'student' | 'enthusiast' | 'regular';
export type StaffRole = 'barista' | 'frontOfHouse' | 'manager' | 'runner';
export type StaffTrait = 'quickHands' | 'peoplePerson' | 'perfectionist' | 'steady';
export type WeatherId = 'mild' | 'sunny' | 'rainy' | 'coldSnap';
export type ScenarioId = 'lanewayClassic' | 'rainySeason' | 'festivalWeek';
export type CosmeticId =
  | 'classicAwning'
  | 'wattleAwning'
  | 'neonCup'
  | 'mosaicFloor'
  | 'brassBayPlaques'
  | 'afterHoursGlow';
export type AchievementId =
  'cafeFounder' | 'goldenCup' | 'hardLessons' | 'departmentInstitution' | 'threeBayConductor';
export type BaseEventTemplateId = 'office-coffee-run' | 'sudden-downpour';
export type DepartmentEventTemplateId =
  | 'department-lunch-wave'
  | 'tram-service-disruption'
  | 'escalator-service-pause'
  | 'window-display-launch'
  | 'heritage-gala-interval'
  | 'late-trading-coach-load';
export type EventTemplateId = BaseEventTemplateId | DepartmentEventTemplateId;
export type EventChoiceId =
  | 'take-order'
  | 'protect-queue'
  | 'shelter-crowd'
  | 'close-awning'
  | 'open-concourse-pickup'
  | 'stagger-department-orders'
  | 'open-commuter-relief'
  | 'hold-the-express-line'
  | 'deploy-wayfinding'
  | 'protect-three-bays'
  | 'run-tasting-bench'
  | 'keep-curated-service'
  | 'serve-the-interval'
  | 'reservation-pickup-only'
  | 'open-all-bays'
  | 'focused-last-orders';
export type ImprovementId =
  | 'street-sign'
  | 'heritage-welcome-marquee'
  | 'espresso-order-pass'
  | 'brew-gallery'
  | 'cold-collection-rail';
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
  stationAssignments: Record<StationId, string[]>;
  expressDrinkIds: DrinkId[];
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
  stationId: StationId;
  laneId: LaneId;
  arrivedAtTick: number;
  patienceTicks: number;
  waitedTicks: number;
}

export interface ServiceJob {
  id: string;
  stationId: StationId;
  laneId: LaneId;
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
  stationId: StationId;
  laneId: LaneId;
  /** `null` until preparation starts; started/completed observations require a job ID. */
  jobId: string | null;
  /** `null` is reserved for honestly migrated observations that predate customer identity. */
  segment: CustomerSegment | null;
}

/** A generated customer reaching the business, whether or not the queue can accept them. */
export interface ArrivalActivityEvent extends RushActivityBase {
  type: 'arrival';
}

/** A queued order whose ingredients were consumed exactly once and preparation began. */
export interface ServiceStartedActivityEvent extends RushActivityBase {
  type: 'serviceStarted';
  jobId: string;
  drinkId: DrinkId;
  size: DrinkSize;
  milk: MilkChoice;
}

/** A completed order charged at the engine-recorded actual price. */
export interface SaleActivityEvent extends RushActivityBase {
  type: 'sale';
  jobId: string;
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

/** Canonical, bounded charge evidence retained independently of the activity feed. */
export interface ReportChargeGroup {
  drinkId: DrinkId;
  size: DrinkSize;
  milk: MilkChoice;
  priceCents: number;
  quantity: number;
  revenueCents: number;
}

export interface EventChoiceEffect {
  cashCents?: number;
  demandMultiplier?: number;
  qualityBonus?: number;
  reputation?: number;
  addCustomers?: number;
}

export interface EventChoice {
  id: EventChoiceId;
  label: string;
  description: string;
  effect: EventChoiceEffect;
}

export interface SimulationEvent {
  id: EventTemplateId;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface ResolvedEvent {
  eventId: EventTemplateId;
  title: string;
  description: string;
  choiceId: EventChoiceId;
  choiceLabel: string;
  choiceDescription: string;
  effect: EventChoiceEffect;
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
  serviceAggregates: ServiceAggregate[];
}

/** Bounded exact-once service evidence for one station/lane combination. */
export interface ServiceAggregate {
  stationId: StationId;
  laneId: LaneId;
  assignedStaffIds: string[];
  equipmentIds: EquipmentId[];
  completedJobIds: string[];
  served: number;
  revenueCents: number;
  totalWaitTicks: number;
  satisfactionTotal: number;
}

export interface RushState {
  tick: number;
  durationTicks: number;
  isPaused: boolean;
  speed: RushSpeed;
  normalQueue: Customer[];
  expressQueue: Customer[];
  serviceJobsByStation: Record<StationId, ServiceJob | null>;
  consecutiveExpressStartsByStation: Record<StationId, number>;
  nextServiceJobSequence: number;
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
  /** Absent only when a legacy active rush predates complete charge capture. */
  chargeGroups?: ReportChargeGroup[];
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

/** The two independent workforce limits configured for one venue. */
export interface WorkforceCapacity {
  rosterCapacity: number;
  scheduleCapacity: number;
}

/** Engine operation owned by a role; every role has exactly one primary value path. */
export type StaffRoleOperation =
  'coffeePreparation' | 'guestFlow' | 'coordinationReliability' | 'handoffWorkload';

/** Data-driven bounded reduction contributed by one scheduled operational role. */
export interface StaffWorkloadReduction {
  attribute: 'speed' | 'skill';
  baseTicks: number;
  pointsPerExtraTick: number;
  threshold: number;
  maximumTicks: number;
}

/** Canonical role contract shared by generation, eligibility, engine, and UI. */
export interface StaffRoleConfig {
  id: StaffRole;
  label: string;
  description: string;
  operation: StaffRoleOperation;
  requiresVenue: VenueId;
  wagePremiumCents: number;
  workloadReduction: StaffWorkloadReduction | null;
}

/** Pure bounded operational value calculated for one scheduled team member. */
export interface StaffRoleOperationalEffect {
  operation: StaffRoleOperation;
  reductionTicks: number;
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

/** Numeric service effects applied by an installed equipment tier. */
export interface EquipmentTierEffects {
  preparationMultiplier?: number;
  qualityBonus?: number;
  demandMultiplier?: number;
  queueCapacityBonus?: number;
  espressoPreparationMultiplier?: number;
  batchBrewPreparationMultiplier?: number;
  chilledShelfLifeDays?: number;
}

export interface EquipmentTierConfig {
  level: 1 | 2 | 3;
  name: string;
  costCents: number;
  operatingCostCents: number;
  reliabilityPercent: number;
  requiresVenue: VenueId;
  effect: string;
  effects: Readonly<EquipmentTierEffects>;
}

export interface EquipmentConfig {
  id: EquipmentId;
  name: string;
  description: string;
  tiers: readonly [EquipmentTierConfig, EquipmentTierConfig, EquipmentTierConfig];
}

export interface VenueConfig {
  id: VenueId;
  name: string;
  shortName: string;
  actionName: string;
  description: string;
  menuCapacity: number;
  /** Derived daily schedule projection retained for existing presentation consumers. */
  staffCapacity: number;
  queueCapacity: number;
  demandFactor: number;
  operatingCostCents: number;
}

export interface VenuePromotion {
  from: Exclude<VenueId, 'departmentStore'>;
  to: Exclude<VenueId, 'cart'>;
  costCents: number;
  reputationRequired: number;
  requiredEquipment: Partial<Record<EquipmentId, number>>;
}

/** Immutable service inputs copied into a report when its rush settles. */
export interface DayReportCauseSnapshot {
  venueId: VenueId;
  plan: {
    menu: Array<{ drinkId: DrinkId; priceCents: number }>;
    dialIn: DialIn;
    beanId: BeanId;
    expressDrinkIds: DrinkId[];
  };
  staffing: Array<{
    staffId: string;
    name: string;
    role: StaffRole;
    speed: number;
    skill: number;
    trait: StaffTrait;
    wageCents: number;
    stationId: StationId | null;
  }>;
  equipment: {
    levels: EquipmentState;
    improvements: ImprovementId[];
    venueOperatingCostCents: number;
    equipmentOperatingCostCents: number;
  };
  events: ResolvedEvent[];
  wait: {
    peakQueue: number;
    queueCapacity: number;
    totalWaitTicks: number;
  };
}

export interface DayReport {
  day: number;
  difficulty: Difficulty;
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
  serviceAggregates: ServiceAggregate[];
  bottleneck: string;
  explanations: string[];
  /** `null` means an earlier current-v4 report predates immutable cause capture. */
  causeSnapshot: DayReportCauseSnapshot | null;
  /** Absent means the historical report predates complete charge capture. */
  chargeGroups?: ReportChargeGroup[];
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
  stateVersion: 4;
  campaignId: string;
  seed: number;
  rngState: number;
  scenarioId: ScenarioId;
  difficulty: Difficulty;
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
  improvements: ImprovementId[];
  history: DayReport[];
  outcome: CampaignOutcome | null;
}

export interface Preferences {
  soundEnabled: boolean;
  ambienceEnabled: boolean;
  reducedMotion: boolean;
  onboardingComplete: boolean;
  activeTab: string;
  /** Prevents the preferences-only v4 evolution notice from replaying. */
  evolutionNoticeSeen: boolean;
}

export interface CampaignRecord {
  campaignId: string;
  difficulty: Difficulty;
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
  schemaVersion: 4;
  savedAt: string;
  activeRun: GameState | null;
  preferences: Preferences;
  meta: MetaProgress;
}

export interface CampaignOptions {
  seed: number;
  scenarioId?: ScenarioId;
  difficulty?: Difficulty;
}

export interface PlanPatch {
  activeMenu?: DrinkId[];
  pricesCents?: Partial<DrinkPrices>;
  purchases?: Partial<IngredientPurchases>;
  dialIn?: DialIn;
  beanId?: BeanId;
  scheduledStaffIds?: string[];
  stationAssignments?: Partial<Record<StationId, string[]>>;
  expressDrinkIds?: DrinkId[];
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
  | { type: 'buyImprovement'; improvementId: ImprovementId }
  | { type: 'hireStaff'; candidateId: string }
  | { type: 'buyEquipment'; equipmentId: EquipmentId }
  | { type: 'promoteVenue' }
  | { type: 'startNextDay' }
  | { type: 'continueEndless' };
