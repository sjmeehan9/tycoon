import type {
  BeanId,
  CustomerSegment,
  DayPlan,
  DrinkConfig,
  DrinkId,
  DrinkPrices,
  EquipmentConfig,
  EquipmentId,
  IngredientId,
  IngredientInventory,
  IngredientPurchases,
  IngredientTotals,
  MilkChoice,
  PurchasePackage,
  ScenarioId,
  StaffRole,
  StaffTrait,
  VenueConfig,
  VenueId,
  VenuePromotion,
  WeatherId,
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
    description: 'The balanced original 30-day campaign.',
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

/** Functional venue stages used by planning, service, settlement, and the scene. */
export const VENUES: Record<VenueId, VenueConfig> = {
  cart: {
    id: 'cart',
    name: 'Hardware Lane Cart',
    shortName: 'Coffee Cart',
    description: 'One compact bar, close conversation, and no spare elbow room.',
    menuCapacity: 3,
    staffCapacity: 2,
    queueCapacity: 8,
    demandFactor: 1,
    operatingCostCents: 450,
  },
  kiosk: {
    id: 'kiosk',
    name: 'Laneway Coffee Kiosk',
    shortName: 'Coffee Kiosk',
    description: 'A permanent counter with storage, shelter, and a faster service lane.',
    menuCapacity: 6,
    staffCapacity: 3,
    queueCapacity: 11,
    demandFactor: 1.18,
    operatingCostCents: 700,
  },
  cafe: {
    id: 'cafe',
    name: 'Laneway Specialty Cafe',
    shortName: 'Specialty Cafe',
    description: 'A full neighbourhood cafe with room for every coffee on the board.',
    menuCapacity: 10,
    staffCapacity: 5,
    queueCapacity: 15,
    demandFactor: 1.38,
    operatingCostCents: 1_100,
  },
};

export const VENUE_MENU_CAPACITY: Record<VenueId, number> = {
  cart: VENUES.cart.menuCapacity,
  kiosk: VENUES.kiosk.menuCapacity,
  cafe: VENUES.cafe.menuCapacity,
};
export const VENUE_STAFF_CAPACITY: Record<VenueId, number> = {
  cart: VENUES.cart.staffCapacity,
  kiosk: VENUES.kiosk.staffCapacity,
  cafe: VENUES.cafe.staffCapacity,
};
export const VENUE_DEMAND_FACTOR: Record<VenueId, number> = {
  cart: VENUES.cart.demandFactor,
  kiosk: VENUES.kiosk.demandFactor,
  cafe: VENUES.cafe.demandFactor,
};

/** Two practical tiers for every required equipment family. */
export const EQUIPMENT: Record<EquipmentId, EquipmentConfig> = {
  grinder: equipment('grinder', 'Grinder', 'Controls dose consistency and extraction clarity.', [
    tier(1, 'Stepless grinder', 2_500, 90, 'cart', '+2 cup quality'),
    tier(2, 'Precision twin grinder', 5_500, 170, 'kiosk', '+5 cup quality total'),
  ]),
  espressoMachine: equipment(
    'espressoMachine',
    'Espresso machine',
    'Adds stable pressure and faster recovery between espresso drinks.',
    [
      tier(1, 'Dual-boiler machine', 3_500, 140, 'cart', '8% faster espresso service'),
      tier(2, 'Three-group workhorse', 7_500, 280, 'kiosk', '18% faster espresso service'),
    ],
  ),
  batchBrewer: equipment('batchBrewer', 'Batch brewer', 'Keeps filter coffee ready at peak time.', [
    tier(1, 'Bench batch brewer', 2_200, 85, 'kiosk', '25% faster batch brew'),
    tier(2, 'Twin thermal brewer', 4_800, 150, 'cafe', '45% faster batch brew'),
  ]),
  refrigeration: equipment(
    'refrigeration',
    'Refrigeration',
    'Extends the usable life of milk and cold-brew concentrate.',
    [
      tier(1, 'Under-counter fridge', 2_500, 110, 'kiosk', '+1 chilled-stock day'),
      tier(2, 'Cold-room system', 5_200, 210, 'cafe', '+2 chilled-stock days total'),
    ],
  ),
  pos: equipment(
    'pos',
    'Point of sale',
    'Moves orders cleanly from the till to the coffee station.',
    [
      tier(1, 'Touch POS', 1_800, 65, 'cart', '4% faster hand-off and +2% demand'),
      tier(2, 'Integrated order rail', 4_000, 120, 'kiosk', '9% faster hand-off and +4% demand'),
    ],
  ),
  serviceCounter: equipment(
    'serviceCounter',
    'Service counter',
    'Creates a clearer collection point and more room for a patient queue.',
    [
      tier(1, 'Marked collection rail', 1_600, 45, 'cart', '+2 queue spaces, 3% faster service'),
      tier(
        2,
        'Dedicated service counter',
        3_800,
        90,
        'kiosk',
        '+4 queue spaces, 7% faster service',
      ),
    ],
  ),
};

export const EQUIPMENT_IDS = Object.keys(EQUIPMENT) as EquipmentId[];

export const VENUE_PROMOTIONS: Record<Exclude<VenueId, 'cafe'>, VenuePromotion> = {
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
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  barista: 'Barista',
  frontOfHouse: 'Front of house',
};

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
  durationDays: 30,
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
  level: 1 | 2,
  name: string,
  costCents: number,
  operatingCostCents: number,
  requiresVenue: VenueId,
  effect: string,
): EquipmentConfig['tiers'][number] {
  return { level, name, costCents, operatingCostCents, requiresVenue, effect };
}
