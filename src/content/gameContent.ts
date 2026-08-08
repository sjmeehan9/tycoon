import type {
  BeanId,
  CustomerSegment,
  DayPlan,
  DrinkConfig,
  DrinkId,
  DrinkPrices,
  EquipmentConfig,
  EquipmentId,
  EquipmentTierEffects,
  IngredientId,
  IngredientInventory,
  IngredientPurchases,
  IngredientTotals,
  MilkChoice,
  PurchasePackage,
  ScenarioId,
  StaffRole,
  StaffRoleConfig,
  StaffTrait,
  VenueConfig,
  VenueId,
  VenuePromotion,
  WeatherId,
  WorkforceCapacity,
} from '../game/types';

/** Fixed number of deterministic engine ticks in one simulated second. */
export const TICKS_PER_SECOND = 4;
/** Every trading rush lasts 75 simulated seconds. */
export const RUSH_DURATION_TICKS = 75 * TICKS_PER_SECOND;
/** Recent engine observations retained for player feedback and reload continuity. */
export const RUSH_ACTIVITY_LIMIT = 80;

export const INGREDIENT_IDS: IngredientId[] = [
  'houseBeans',
  'singleOriginBeans',
  'darkRoastBeans',
  'dairyMilk',
  'oatMilk',
  'soyMilk',
  'chocolate',
  'ice',
  'coldBrewConcentrate',
];

export interface IngredientDetails {
  name: string;
  unit: PurchasePackage['unit'];
  shelfLifeRushes: number;
  chilled: boolean;
}

/** Canonical display and shelf-life rules shared by engine, persistence, and UI. */
export const INGREDIENT_DETAILS: Record<IngredientId, IngredientDetails> = {
  houseBeans: { name: 'House blend', unit: 'g', shelfLifeRushes: 3, chilled: false },
  singleOriginBeans: {
    name: 'Single origin',
    unit: 'g',
    shelfLifeRushes: 3,
    chilled: false,
  },
  darkRoastBeans: { name: 'Dark roast', unit: 'g', shelfLifeRushes: 3, chilled: false },
  dairyMilk: { name: 'Dairy milk', unit: 'ml', shelfLifeRushes: 3, chilled: true },
  oatMilk: { name: 'Oat milk', unit: 'ml', shelfLifeRushes: 3, chilled: true },
  soyMilk: { name: 'Soy milk', unit: 'ml', shelfLifeRushes: 3, chilled: true },
  chocolate: { name: 'Chocolate', unit: 'g', shelfLifeRushes: 3, chilled: false },
  ice: { name: 'Ice', unit: 'serve', shelfLifeRushes: 3, chilled: false },
  coldBrewConcentrate: {
    name: 'Cold brew concentrate',
    unit: 'ml',
    shelfLifeRushes: 3,
    chilled: true,
  },
};

/** Defensive import bound; reachable stock retains at most five daily batches. */
export const MAX_INVENTORY_BATCHES_PER_INGREDIENT = 8;

export const ALL_DRINK_IDS: DrinkId[] = [
  'espresso',
  'longBlack',
  'flatWhite',
  'latte',
  'cappuccino',
  'piccolo',
  'mocha',
  'batchBrew',
  'icedLatte',
  'coldBrew',
];

const MILK_CHOICES: MilkChoice[] = ['dairy', 'oat', 'soy'];
const OPTIONAL_MILK_CHOICES: MilkChoice[] = ['none', ...MILK_CHOICES];

/** Complete Australian specialty-cafe launch menu and fixed recipe table. */
export const DRINKS: DrinkConfig[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'A compact double shot with no room to hide.',
    basePriceCents: 400,
    allowedMilks: ['none'],
    qualitySensitivity: 1.35,
    variants: [recipe('regular', 12, { houseBeans: 18 })],
  },
  {
    id: 'longBlack',
    name: 'Long Black',
    description: 'Hot water, then espresso, preserving the crema.',
    basePriceCents: 480,
    allowedMilks: ['none'],
    qualitySensitivity: 1.15,
    variants: [recipe('regular', 14, { houseBeans: 18 }), recipe('large', 17, { houseBeans: 22 })],
  },
  {
    id: 'flatWhite',
    name: 'Flat White',
    description: 'Double espresso with silky, finely textured milk.',
    basePriceCents: 550,
    allowedMilks: MILK_CHOICES,
    qualitySensitivity: 1.2,
    variants: [
      recipe('regular', 20, { houseBeans: 18, dairyMilk: 150 }),
      recipe('large', 24, { houseBeans: 22, dairyMilk: 220 }),
    ],
  },
  {
    id: 'latte',
    name: 'Latte',
    description: 'Espresso and steamed milk with a soft cap of microfoam.',
    basePriceCents: 560,
    allowedMilks: MILK_CHOICES,
    qualitySensitivity: 1,
    variants: [
      recipe('regular', 21, { houseBeans: 18, dairyMilk: 200 }),
      recipe('large', 25, { houseBeans: 22, dairyMilk: 280 }),
    ],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Espresso, textured milk, proud foam, optional choc dust.',
    basePriceCents: 560,
    allowedMilks: MILK_CHOICES,
    qualitySensitivity: 1.1,
    variants: [
      recipe('regular', 22, { houseBeans: 18, dairyMilk: 160 }),
      recipe('large', 26, { houseBeans: 22, dairyMilk: 230 }),
    ],
  },
  {
    id: 'piccolo',
    name: 'Piccolo',
    description: 'A ristretto-length shot softened with a little warm milk.',
    basePriceCents: 470,
    allowedMilks: MILK_CHOICES,
    qualitySensitivity: 1.3,
    variants: [recipe('regular', 17, { houseBeans: 18, dairyMilk: 90 })],
  },
  {
    id: 'mocha',
    name: 'Mocha',
    description: 'Espresso, chocolate and steamed milk in happy cooperation.',
    basePriceCents: 640,
    allowedMilks: MILK_CHOICES,
    qualitySensitivity: 0.85,
    variants: [
      recipe('regular', 24, { houseBeans: 18, dairyMilk: 180, chocolate: 20 }),
      recipe('large', 29, { houseBeans: 22, dairyMilk: 260, chocolate: 28 }),
    ],
  },
  {
    id: 'batchBrew',
    name: 'Batch Brew',
    description: 'Filter coffee brewed in batches for speed and clarity.',
    basePriceCents: 500,
    allowedMilks: OPTIONAL_MILK_CHOICES,
    qualitySensitivity: 1.2,
    optionalMilkAmount: 30,
    variants: [recipe('regular', 7, { houseBeans: 15 }), recipe('large', 9, { houseBeans: 22 })],
  },
  {
    id: 'icedLatte',
    name: 'Iced Latte',
    description: 'Espresso, cold milk and plenty of ice.',
    basePriceCents: 650,
    allowedMilks: MILK_CHOICES,
    qualitySensitivity: 0.8,
    variants: [
      recipe('regular', 18, { houseBeans: 18, dairyMilk: 180, ice: 1 }),
      recipe('large', 22, { houseBeans: 22, dairyMilk: 270, ice: 2 }),
    ],
  },
  {
    id: 'coldBrew',
    name: 'Cold Brew',
    description: 'Slow-steeped concentrate, water and ice; smooth and calm.',
    basePriceCents: 620,
    allowedMilks: OPTIONAL_MILK_CHOICES,
    qualitySensitivity: 0.75,
    optionalMilkAmount: 30,
    variants: [
      recipe('regular', 8, { coldBrewConcentrate: 90, ice: 1 }),
      recipe('large', 10, { coldBrewConcentrate: 130, ice: 2 }),
    ],
  },
];

export const DRINK_MAP = new Map(DRINKS.map((drink) => [drink.id, drink] as const));

export const PURCHASE_PACKAGES: PurchasePackage[] = [
  supply('houseBeans', 'House blend · 500 g', 500, 1_600, 'g'),
  supply('singleOriginBeans', 'Single origin · 500 g', 500, 2_300, 'g'),
  supply('darkRoastBeans', 'Dark roast · 500 g', 500, 1_400, 'g'),
  supply('dairyMilk', 'Dairy milk · 2 L', 2_000, 600, 'ml'),
  supply('oatMilk', 'Oat milk · 1 L', 1_000, 450, 'ml'),
  supply('soyMilk', 'Soy milk · 1 L', 1_000, 400, 'ml'),
  supply('chocolate', 'Chocolate · 500 g', 500, 550, 'g'),
  supply('ice', 'Ice · 20 serves', 20, 200, 'serve'),
  supply('coldBrewConcentrate', 'Cold brew concentrate · 2 L', 2_000, 1_800, 'ml'),
];

export const INGREDIENT_UNIT_COST_CENTS: Record<IngredientId, number> = {
  houseBeans: 3.2,
  singleOriginBeans: 4.6,
  darkRoastBeans: 2.8,
  dairyMilk: 0.3,
  oatMilk: 0.45,
  soyMilk: 0.4,
  chocolate: 1.1,
  ice: 10,
  coldBrewConcentrate: 0.9,
};

export const BEAN_DETAILS: Record<
  BeanId,
  { name: string; description: string; quality: number; speed: number }
> = {
  houseBeans: {
    name: 'House blend',
    description: 'Balanced, forgiving and familiar.',
    quality: 0,
    speed: 1,
  },
  singleOriginBeans: {
    name: 'Bright single origin',
    description: 'More nuanced, slower to dial, loved by enthusiasts.',
    quality: 7,
    speed: 1.08,
  },
  darkRoastBeans: {
    name: 'Dark roast',
    description: 'Fast-flowing, bold and less delicate.',
    quality: -3,
    speed: 0.93,
  },
};

export const WEATHER_DETAILS: Record<WeatherId, { name: string; demand: number; note: string }> = {
  mild: { name: 'Mild', demand: 1, note: 'Steady all-round coffee weather.' },
  sunny: { name: 'Sunny', demand: 1.03, note: 'Cold drinks will draw extra attention.' },
  rainy: { name: 'Rainy', demand: 0.92, note: 'Less foot traffic, but hot drinks feel essential.' },
  coldSnap: { name: 'Cold snap', demand: 1.1, note: 'Hot, comforting cups are in demand.' },
};

export const SCENARIO_DETAILS: Record<
  ScenarioId,
  { name: string; description: string; demandMultiplier: number }
> = {
  lanewayClassic: {
    name: 'Laneway Classic',
    description: 'The balanced 40-day journey from laneway cart to landmark coffee hall.',
    demandMultiplier: 1,
  },
  rainySeason: {
    name: 'Rainy Season',
    description: 'More wet days reward a strong hot-drink and shelter strategy.',
    demandMultiplier: 1,
  },
  festivalWeek: {
    name: 'Festival Week',
    description: 'Busier foot traffic tests queue capacity from the opening bell.',
    demandMultiplier: 1.08,
  },
};

export const SEGMENT_DRINK_APPEAL: Record<CustomerSegment, Record<DrinkId, number>> = {
  commuter: weights({ longBlack: 1.5, flatWhite: 1.4, batchBrew: 1.6, piccolo: 1.1 }),
  student: weights({ latte: 1.35, mocha: 1.65, icedLatte: 1.45, coldBrew: 1.25 }),
  enthusiast: weights({ espresso: 1.8, longBlack: 1.4, piccolo: 1.6, batchBrew: 1.5 }),
  regular: weights({ flatWhite: 1.55, latte: 1.3, cappuccino: 1.45, longBlack: 1.2 }),
};

/** Exact deterministic segment probabilities used by service and capacity forecasts. */
export const SEGMENT_DEMAND_SHARES: Record<CustomerSegment, number> = {
  commuter: 0.34,
  student: 0.25,
  enthusiast: 0.2,
  regular: 0.21,
};

/** Price-response divisor used for each segment's drink-choice weighting. */
export const SEGMENT_PRICE_SENSITIVITY_CENTS: Record<CustomerSegment, number> = {
  commuter: 760,
  student: 520,
  enthusiast: 900,
  regular: 900,
};

/** Probability of choosing large when a configured drink offers that variant. */
export const SEGMENT_LARGE_SIZE_PROBABILITY: Record<CustomerSegment, number> = {
  commuter: 0.35,
  student: 0.3,
  enthusiast: 0.42,
  regular: 0.42,
};

/** Canonical progression order shared by every exhaustive venue consumer. */
export const VENUE_IDS = [
  'cart',
  'kiosk',
  'cafe',
  'departmentStore',
] as const satisfies readonly VenueId[];

/** Exhaustive generation and presentation order for staff roles. */
export const STAFF_ROLES = [
  'barista',
  'frontOfHouse',
  'manager',
  'runner',
] as const satisfies readonly StaffRole[];

/** Independent per-venue roster and daily scheduling authority. */
export const VENUE_WORKFORCE_CAPACITY: Readonly<Record<VenueId, WorkforceCapacity>> = {
  cart: { rosterCapacity: 8, scheduleCapacity: 2 },
  kiosk: { rosterCapacity: 8, scheduleCapacity: 3 },
  cafe: { rosterCapacity: 8, scheduleCapacity: 5 },
  departmentStore: { rosterCapacity: 12, scheduleCapacity: 10 },
};

/** Bounded department-only work added once to each prepared order. */
export const DEPARTMENT_WORKLOAD_DELAYS = {
  coordinationBaseTicks: 3,
  handoffBaseTicks: 4,
  reliabilityDeficitPointsPerTick: 12,
  minimumRemainingTicks: 1,
} as const;

/** Canonical eligibility, wage, value, and workload definition for every role. */
export const STAFF_ROLE_DETAILS: Readonly<Record<StaffRole, StaffRoleConfig>> = {
  barista: {
    id: 'barista',
    label: 'Barista',
    description: 'Prepares drinks faster and contributes coffee skill.',
    operation: 'coffeePreparation',
    requiresVenue: 'cart',
    wagePremiumCents: 0,
    workloadReduction: null,
  },
  frontOfHouse: {
    id: 'frontOfHouse',
    label: 'Front of house',
    description: 'Keeps guests patient and lifts service satisfaction.',
    operation: 'guestFlow',
    requiresVenue: 'cart',
    wagePremiumCents: 0,
    workloadReduction: null,
  },
  manager: {
    id: 'manager',
    label: 'Manager',
    description: 'Reduces department coordination and equipment-reliability delay.',
    operation: 'coordinationReliability',
    requiresVenue: 'departmentStore',
    wagePremiumCents: 800,
    workloadReduction: {
      attribute: 'skill',
      baseTicks: 2,
      pointsPerExtraTick: 20,
      threshold: 50,
      maximumTicks: 4,
    },
  },
  runner: {
    id: 'runner',
    label: 'Runner',
    description: 'Reduces department replenishment and handoff workload delay.',
    operation: 'handoffWorkload',
    requiresVenue: 'departmentStore',
    wagePremiumCents: 350,
    workloadReduction: {
      attribute: 'speed',
      baseTicks: 2,
      pointsPerExtraTick: 18,
      threshold: 52,
      maximumTicks: 4,
    },
  },
};

/** Return the single workforce-capacity authority for a venue. */
export function workforceCapacityFor(venueId: VenueId): WorkforceCapacity {
  return VENUE_WORKFORCE_CAPACITY[venueId];
}

/** Return whether a role is unlocked at the current venue progression stage. */
export function staffRoleAvailableAtVenue(role: StaffRole, venueId: VenueId): boolean {
  return venueMeetsRequirement(venueId, STAFF_ROLE_DETAILS[role].requiresVenue);
}

/** Functional venue stages used by planning, service, settlement, and the scene. */
export const VENUES: Record<VenueId, VenueConfig> = {
  cart: {
    id: 'cart',
    name: 'Hardware Lane Cart',
    shortName: 'Coffee Cart',
    actionName: 'cart',
    description: 'One compact bar, close conversation, and no spare elbow room.',
    menuCapacity: 3,
    staffCapacity: VENUE_WORKFORCE_CAPACITY.cart.scheduleCapacity,
    queueCapacity: 8,
    demandFactor: 1,
    operatingCostCents: 450,
  },
  kiosk: {
    id: 'kiosk',
    name: 'Laneway Coffee Kiosk',
    shortName: 'Coffee Kiosk',
    actionName: 'kiosk',
    description: 'A permanent counter with storage, shelter, and a faster service lane.',
    menuCapacity: 6,
    staffCapacity: VENUE_WORKFORCE_CAPACITY.kiosk.scheduleCapacity,
    queueCapacity: 11,
    demandFactor: 1.18,
    operatingCostCents: 700,
  },
  cafe: {
    id: 'cafe',
    name: 'Laneway Specialty Cafe',
    shortName: 'Specialty Cafe',
    actionName: 'cafe',
    description: 'A full neighbourhood cafe with room for every coffee on the board.',
    menuCapacity: 10,
    staffCapacity: VENUE_WORKFORCE_CAPACITY.cafe.scheduleCapacity,
    queueCapacity: 15,
    demandFactor: 1.38,
    operatingCostCents: 1_100,
  },
  departmentStore: {
    id: 'departmentStore',
    name: 'Merriweather Department Store Coffee Hall',
    shortName: 'Department Store Coffee Hall',
    actionName: 'department-store coffee hall',
    description:
      'A landmark coffee operation beneath a restored heritage dome, built for ten staff and the city crowd.',
    menuCapacity: ALL_DRINK_IDS.length,
    staffCapacity: VENUE_WORKFORCE_CAPACITY.departmentStore.scheduleCapacity,
    queueCapacity: 24,
    demandFactor: 1.62,
    operatingCostCents: 1_850,
  },
};

export const VENUE_MENU_CAPACITY = venueRecord(({ menuCapacity }) => menuCapacity);
/** @deprecated Use `VENUE_WORKFORCE_CAPACITY`; this is a derived schedule projection. */
export const VENUE_STAFF_CAPACITY = venueRecord(
  ({ id }) => VENUE_WORKFORCE_CAPACITY[id].scheduleCapacity,
);
export const VENUE_DEMAND_FACTOR = venueRecord(({ demandFactor }) => demandFactor);

/** Three practical tiers for every required equipment family. */
export const EQUIPMENT: Record<EquipmentId, EquipmentConfig> = {
  grinder: equipment('grinder', 'Grinder', 'Controls dose consistency and extraction clarity.', [
    tier(1, 'Stepless grinder', 2_500, 90, 96, 'cart', '+2 cup quality', {
      qualityBonus: 2,
    }),
    tier(2, 'Precision twin grinder', 5_500, 170, 98, 'kiosk', '+5 cup quality total', {
      qualityBonus: 5,
    }),
    tier(3, 'Commercial grinder bank', 8_500, 280, 99, 'departmentStore', '+8 cup quality total', {
      qualityBonus: 8,
    }),
  ]),
  espressoMachine: equipment(
    'espressoMachine',
    'Espresso machine',
    'Adds stable pressure and faster recovery between espresso drinks.',
    [
      tier(1, 'Dual-boiler machine', 3_500, 140, 94, 'cart', '8% faster espresso service', {
        espressoPreparationMultiplier: 0.92,
      }),
      tier(2, 'Three-group workhorse', 7_500, 280, 97, 'kiosk', '18% faster espresso service', {
        espressoPreparationMultiplier: 0.82,
      }),
      tier(
        3,
        'Six-group commercial line',
        11_500,
        460,
        99,
        'departmentStore',
        '30% faster espresso service',
        { espressoPreparationMultiplier: 0.7 },
      ),
    ],
  ),
  batchBrewer: equipment('batchBrewer', 'Batch brewer', 'Keeps filter coffee ready at peak time.', [
    tier(1, 'Bench batch brewer', 2_200, 85, 94, 'kiosk', '25% faster batch brew', {
      batchBrewPreparationMultiplier: 0.75,
    }),
    tier(2, 'Twin thermal brewer', 4_800, 150, 97, 'cafe', '45% faster batch brew', {
      batchBrewPreparationMultiplier: 0.55,
    }),
    tier(3, 'High-volume urn battery', 8_500, 280, 99, 'departmentStore', '60% faster batch brew', {
      batchBrewPreparationMultiplier: 0.4,
    }),
  ]),
  refrigeration: equipment(
    'refrigeration',
    'Refrigeration',
    'Extends the usable life of milk and cold-brew concentrate.',
    [
      tier(1, 'Under-counter fridge', 2_500, 110, 95, 'kiosk', '+1 chilled-stock day', {
        chilledShelfLifeDays: 1,
      }),
      tier(2, 'Cold-room system', 5_200, 210, 98, 'cafe', '+2 chilled-stock days total', {
        chilledShelfLifeDays: 2,
      }),
      tier(
        3,
        'Commercial chilled store',
        9_000,
        360,
        99,
        'departmentStore',
        '+4 chilled-stock days total',
        { chilledShelfLifeDays: 4 },
      ),
    ],
  ),
  pos: equipment(
    'pos',
    'Point of sale',
    'Moves orders cleanly from the till to the coffee station.',
    [
      tier(1, 'Touch POS', 1_800, 65, 96, 'cart', '4% faster hand-off and +2% demand', {
        preparationMultiplier: 0.96,
        demandMultiplier: 1.02,
      }),
      tier(
        2,
        'Integrated order rail',
        4_000,
        120,
        98,
        'kiosk',
        '9% faster hand-off and +4% demand',
        { preparationMultiplier: 0.91, demandMultiplier: 1.04 },
      ),
      tier(
        3,
        'Department order console',
        7_000,
        210,
        99,
        'departmentStore',
        '16% faster hand-off and +7% demand',
        { preparationMultiplier: 0.84, demandMultiplier: 1.07 },
      ),
    ],
  ),
  serviceCounter: equipment(
    'serviceCounter',
    'Service counter',
    'Creates a clearer collection point and more room for a patient queue.',
    [
      tier(
        1,
        'Marked collection rail',
        1_600,
        45,
        100,
        'cart',
        '+2 queue spaces, 3% faster service',
        {
          queueCapacityBonus: 2,
          preparationMultiplier: 0.97,
        },
      ),
      tier(
        2,
        'Dedicated service counter',
        3_800,
        90,
        100,
        'kiosk',
        '+4 queue spaces, 7% faster service',
        { queueCapacityBonus: 4, preparationMultiplier: 0.93 },
      ),
      tier(
        3,
        'Marble collection island',
        7_500,
        170,
        100,
        'departmentStore',
        '+8 queue spaces, 14% faster service',
        { queueCapacityBonus: 8, preparationMultiplier: 0.86 },
      ),
    ],
  ),
};

export const EQUIPMENT_IDS = Object.keys(EQUIPMENT) as EquipmentId[];

export const VENUE_PROMOTIONS: Record<Exclude<VenueId, 'departmentStore'>, VenuePromotion> = {
  cart: {
    from: 'cart',
    to: 'kiosk',
    costCents: 8_000,
    reputationRequired: 38,
    requiredEquipment: { grinder: 1, espressoMachine: 1 },
  },
  kiosk: {
    from: 'kiosk',
    to: 'cafe',
    costCents: 20_000,
    reputationRequired: 55,
    requiredEquipment: { grinder: 2, espressoMachine: 2, refrigeration: 1, pos: 1 },
  },
  cafe: {
    from: 'cafe',
    to: 'departmentStore',
    costCents: 20_000,
    reputationRequired: 70,
    requiredEquipment: { grinder: 2, espressoMachine: 2, refrigeration: 1, pos: 1 },
  },
};

validateEquipmentContent();

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = Object.fromEntries(
  STAFF_ROLES.map((role) => [role, STAFF_ROLE_DETAILS[role].label]),
) as Record<StaffRole, string>;

export const STAFF_TRAIT_DETAILS: Record<StaffTrait, { name: string; effect: string }> = {
  quickHands: { name: 'Quick hands', effect: 'Works 10% faster.' },
  peoplePerson: { name: 'People person', effect: 'Lifts demand and satisfaction.' },
  perfectionist: { name: 'Perfectionist', effect: 'Adds quality but takes extra care.' },
  steady: { name: 'Steady', effect: 'Works consistently and keeps service moving.' },
};
export const SIZE_SURCHARGE_CENTS = 90;
export const MILK_SURCHARGE_CENTS: Record<MilkChoice, number> = {
  none: 0,
  dairy: 0,
  oat: 80,
  soy: 60,
};

/** Exact integer bounds and activation increments shared by planner UI and validation. */
export const DAY_PLAN_LIMITS = {
  priceCents: { minimum: 250, maximum: 1_200, increment: 10 },
  packageQuantity: { minimum: 0, maximum: 20, increment: 1 },
} as const;

export const INITIAL_CASH_CENTS = 18_000;
export const INITIAL_REPUTATION = 35;
export const CART_IMPROVEMENT_COST_CENTS = 2_500;
export const MAX_QUEUE_LENGTH = 8;

/** Typed, centrally tuned campaign outcome and portability bounds. */
export const CAMPAIGN_RULES = {
  durationDays: 40,
  victoryCashCents: 30_000,
  victoryReputation: 65,
  overdraftFloorCents: -10_000,
  maximumHistoryDays: 500,
  maximumSaveBytes: 750_000,
} as const;

/** Create a full inventory record with zero stock. */
export function emptyInventory(): IngredientInventory {
  return {
    houseBeans: [],
    singleOriginBeans: [],
    darkRoastBeans: [],
    dairyMilk: [],
    oatMilk: [],
    soyMilk: [],
    chocolate: [],
    ice: [],
    coldBrewConcentrate: [],
  };
}

/** Create a complete flat ingredient-total record for selectors and reports. */
export function emptyIngredientTotals(): IngredientTotals {
  return Object.fromEntries(INGREDIENT_IDS.map((id) => [id, 0])) as IngredientTotals;
}

/** Create a full purchase record with zero selected packages. */
export function emptyPurchases(): IngredientPurchases {
  return Object.fromEntries(INGREDIENT_IDS.map((id) => [id, 0])) as IngredientPurchases;
}

/** Create configured price defaults for the complete menu. */
export function defaultPrices(): DrinkPrices {
  return Object.fromEntries(DRINKS.map((drink) => [drink.id, drink.basePriceCents])) as DrinkPrices;
}

/** Create the first playable morning plan. */
export function createDefaultPlan(): DayPlan {
  return {
    activeMenu: ['longBlack', 'flatWhite'],
    pricesCents: defaultPrices(),
    purchases: {
      ...emptyPurchases(),
      houseBeans: 1,
      dairyMilk: 1,
    },
    dialIn: 'balanced',
    beanId: 'houseBeans',
    scheduledStaffIds: [],
    stationAssignments: { espressoBar: [], brewBar: [], coldBar: [] },
    expressDrinkIds: [],
  };
}

/** Map a milk order choice to its inventory ingredient. */
export function milkIngredient(milk: MilkChoice): IngredientId | null {
  if (milk === 'dairy') return 'dairyMilk';
  if (milk === 'oat') return 'oatMilk';
  if (milk === 'soy') return 'soyMilk';
  return null;
}

/** Derive deterministic daily weather without consuming simulation PRNG state. */
export function weatherForDay(seed: number, day: number, scenario: ScenarioId): WeatherId {
  const scenarioOffset = scenario === 'rainySeason' ? 3 : scenario === 'festivalWeek' ? 7 : 0;
  const value = ((seed ^ Math.imul(day + scenarioOffset, 2_654_435_761)) >>> 0) % 100;
  if (scenario === 'rainySeason' && value < 60) return 'rainy';
  if (value < 24) return 'rainy';
  if (value < 49) return 'sunny';
  if (value < 68) return 'coldSnap';
  return 'mild';
}

function recipe(
  size: 'regular' | 'large',
  preparationTicks: number,
  values: Partial<Record<IngredientId, number>>,
): DrinkConfig['variants'][number] {
  return {
    size,
    preparationTicks,
    ingredients: Object.entries(values).map(([ingredientId, amount]) => ({
      ingredientId: ingredientId as IngredientId,
      amount,
    })),
  };
}

function supply(
  ingredientId: IngredientId,
  label: string,
  amount: number,
  costCents: number,
  unit: PurchasePackage['unit'],
): PurchasePackage {
  return { ingredientId, label, amount, costCents, unit };
}

function weights(overrides: Partial<Record<DrinkId, number>>): Record<DrinkId, number> {
  return Object.fromEntries(ALL_DRINK_IDS.map((id) => [id, overrides[id] ?? 1])) as Record<
    DrinkId,
    number
  >;
}

function equipment(
  id: EquipmentId,
  name: string,
  description: string,
  tiers: EquipmentConfig['tiers'],
): EquipmentConfig {
  return { id, name, description, tiers };
}

function tier(
  level: 1 | 2 | 3,
  name: string,
  costCents: number,
  operatingCostCents: number,
  reliabilityPercent: number,
  requiresVenue: VenueId,
  effect: string,
  effects: Readonly<EquipmentTierEffects>,
): EquipmentConfig['tiers'][number] {
  return {
    level,
    name,
    costCents,
    operatingCostCents,
    reliabilityPercent,
    requiresVenue,
    effect,
    effects,
  };
}

/** Return the installed tier definition, or null for owner equipment. */
export function equipmentTierAtLevel(
  equipmentId: EquipmentId,
  level: number,
): EquipmentConfig['tiers'][number] | null {
  if (level === 0) return null;
  return EQUIPMENT[equipmentId].tiers.find((candidate) => candidate.level === level) ?? null;
}

/** Return whether one venue satisfies a configured progression requirement. */
export function venueMeetsRequirement(current: VenueId, required: VenueId): boolean {
  return VENUE_IDS.indexOf(current) >= VENUE_IDS.indexOf(required);
}

/** Validate the complete commercial equipment catalogue at startup and in tests. */
export function validateEquipmentContent(
  catalogue: Readonly<Record<EquipmentId, EquipmentConfig>> = EQUIPMENT,
): void {
  const effectBounds: Record<keyof EquipmentTierEffects, readonly [number, number]> = {
    preparationMultiplier: [0.4, 1],
    qualityBonus: [0, 20],
    demandMultiplier: [1, 1.2],
    queueCapacityBonus: [0, 12],
    espressoPreparationMultiplier: [0.4, 1],
    batchBrewPreparationMultiplier: [0.3, 1],
    chilledShelfLifeDays: [0, 7],
  };
  for (const equipmentId of EQUIPMENT_IDS) {
    const config = catalogue[equipmentId];
    if (!config || config.id !== equipmentId || config.tiers.length !== 3) {
      throw new Error(`${equipmentId} must define one complete three-tier category.`);
    }
    let previousLevel = 0;
    for (const tierConfig of config.tiers) {
      if (tierConfig.level !== previousLevel + 1) {
        throw new Error(`${equipmentId} tiers must use increasing consecutive levels.`);
      }
      if (tierConfig.costCents <= 0 || tierConfig.operatingCostCents <= 0) {
        throw new Error(`${equipmentId} tier ${tierConfig.level} costs must be positive.`);
      }
      if (
        !Number.isInteger(tierConfig.reliabilityPercent) ||
        tierConfig.reliabilityPercent < 90 ||
        tierConfig.reliabilityPercent > 100
      ) {
        throw new Error(`${equipmentId} tier ${tierConfig.level} reliability is out of bounds.`);
      }
      if (!VENUE_IDS.includes(tierConfig.requiresVenue)) {
        throw new Error(`${equipmentId} tier ${tierConfig.level} requires an unknown venue.`);
      }
      const effects = Object.entries(tierConfig.effects) as Array<
        [keyof EquipmentTierEffects, number]
      >;
      if (effects.length === 0) {
        throw new Error(`${equipmentId} tier ${tierConfig.level} needs an operational effect.`);
      }
      for (const [effectId, value] of effects) {
        const bounds = effectBounds[effectId];
        if (!bounds || !Number.isFinite(value) || value < bounds[0] || value > bounds[1]) {
          throw new Error(`${equipmentId} tier ${tierConfig.level} has an invalid ${effectId}.`);
        }
      }
      previousLevel = tierConfig.level;
    }
  }
}

function venueRecord<T>(select: (venue: VenueConfig) => T): Record<VenueId, T> {
  return Object.fromEntries(
    VENUE_IDS.map((venueId) => [venueId, select(VENUES[venueId])]),
  ) as Record<VenueId, T>;
}
