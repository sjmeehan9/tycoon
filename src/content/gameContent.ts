import type {
  BeanId,
  CustomerSegment,
  DayPlan,
  DrinkConfig,
  DrinkId,
  DrinkPrices,
  IngredientId,
  IngredientInventory,
  IngredientPurchases,
  MilkChoice,
  PurchasePackage,
  ScenarioId,
  VenueId,
  WeatherId,
} from '../game/types';

/** Fixed number of deterministic engine ticks in one simulated second. */
export const TICKS_PER_SECOND = 4;
/** Every trading rush lasts 75 simulated seconds. */
export const RUSH_DURATION_TICKS = 75 * TICKS_PER_SECOND;

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

export const SEGMENT_DRINK_APPEAL: Record<CustomerSegment, Record<DrinkId, number>> = {
  commuter: weights({ longBlack: 1.5, flatWhite: 1.4, batchBrew: 1.6, piccolo: 1.1 }),
  student: weights({ latte: 1.35, mocha: 1.65, icedLatte: 1.45, coldBrew: 1.25 }),
  enthusiast: weights({ espresso: 1.8, longBlack: 1.4, piccolo: 1.6, batchBrew: 1.5 }),
  regular: weights({ flatWhite: 1.55, latte: 1.3, cappuccino: 1.45, longBlack: 1.2 }),
};

export const VENUE_MENU_CAPACITY: Record<VenueId, number> = { cart: 3, kiosk: 6, cafe: 10 };
export const VENUE_DEMAND_FACTOR: Record<VenueId, number> = { cart: 1, kiosk: 1.18, cafe: 1.38 };
export const SIZE_SURCHARGE_CENTS = 90;
export const MILK_SURCHARGE_CENTS: Record<MilkChoice, number> = {
  none: 0,
  dairy: 0,
  oat: 80,
  soy: 60,
};
export const INITIAL_CASH_CENTS = 18_000;
export const INITIAL_REPUTATION = 35;
export const CART_IMPROVEMENT_COST_CENTS = 2_500;
export const MAX_QUEUE_LENGTH = 8;

/** Create a full inventory record with zero stock. */
export function emptyInventory(): IngredientInventory {
  return Object.fromEntries(INGREDIENT_IDS.map((id) => [id, 0])) as IngredientInventory;
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
