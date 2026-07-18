import type {
  DayPlan,
  DrinkConfig,
  DrinkId,
  DrinkPrices,
  IngredientId,
  IngredientInventory,
  IngredientPurchases,
  MilkChoice,
  PurchasePackage,
} from '../game/types';

/** Fixed number of deterministic engine ticks in one simulated second. */
export const TICKS_PER_SECOND = 4;
/** A service rush lasts 75 simulated seconds. */
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

export const PHASE_ONE_DRINKS: DrinkConfig[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'A compact double shot with no room to hide.',
    basePriceCents: 400,
    allowedMilks: ['none'],
    qualitySensitivity: 1.25,
    variants: [
      {
        size: 'regular',
        ingredients: [{ ingredientId: 'houseBeans', amount: 18 }],
        preparationTicks: 12,
      },
    ],
  },
  {
    id: 'longBlack',
    name: 'Long Black',
    description: 'Hot water, then espresso, preserving the crema.',
    basePriceCents: 480,
    allowedMilks: ['none'],
    qualitySensitivity: 1,
    variants: [
      {
        size: 'regular',
        ingredients: [{ ingredientId: 'houseBeans', amount: 18 }],
        preparationTicks: 14,
      },
    ],
  },
  {
    id: 'flatWhite',
    name: 'Flat White',
    description: 'Double espresso with silky, finely textured milk.',
    basePriceCents: 550,
    allowedMilks: ['dairy', 'oat'],
    qualitySensitivity: 1.15,
    variants: [
      {
        size: 'regular',
        ingredients: [
          { ingredientId: 'houseBeans', amount: 18 },
          { ingredientId: 'dairyMilk', amount: 150 },
        ],
        preparationTicks: 20,
      },
    ],
  },
  {
    id: 'icedLatte',
    name: 'Iced Latte',
    description: 'Espresso, cold milk and plenty of ice.',
    basePriceCents: 650,
    allowedMilks: ['dairy', 'oat'],
    qualitySensitivity: 0.8,
    variants: [
      {
        size: 'regular',
        ingredients: [
          { ingredientId: 'houseBeans', amount: 18 },
          { ingredientId: 'dairyMilk', amount: 180 },
          { ingredientId: 'ice', amount: 1 },
        ],
        preparationTicks: 18,
      },
    ],
  },
];

export const PHASE_ONE_DRINK_MAP = new Map(
  PHASE_ONE_DRINKS.map((drink) => [drink.id, drink] as const),
);

export const PURCHASE_PACKAGES: PurchasePackage[] = [
  {
    ingredientId: 'houseBeans',
    label: 'House blend · 500 g',
    amount: 500,
    costCents: 1600,
    unit: 'g',
  },
  {
    ingredientId: 'dairyMilk',
    label: 'Dairy milk · 2 L',
    amount: 2000,
    costCents: 600,
    unit: 'ml',
  },
  {
    ingredientId: 'oatMilk',
    label: 'Oat milk · 1 L',
    amount: 1000,
    costCents: 450,
    unit: 'ml',
  },
  {
    ingredientId: 'ice',
    label: 'Ice · 20 serves',
    amount: 20,
    costCents: 200,
    unit: 'serve',
  },
];

export const INGREDIENT_UNIT_COST_CENTS: Record<IngredientId, number> = {
  houseBeans: 3.2,
  singleOriginBeans: 4.6,
  darkRoastBeans: 2.8,
  dairyMilk: 0.3,
  oatMilk: 0.45,
  soyMilk: 0.4,
  chocolate: 2,
  ice: 10,
  coldBrewConcentrate: 1.5,
};

export const INITIAL_CASH_CENTS = 18_000;
export const INITIAL_REPUTATION = 35;
export const MAX_CART_MENU_ITEMS = 3;
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

/** Create price defaults for current and future menu content. */
export function defaultPrices(): DrinkPrices {
  const prices = Object.fromEntries(ALL_DRINK_IDS.map((id) => [id, 500])) as DrinkPrices;
  for (const drink of PHASE_ONE_DRINKS) prices[drink.id] = drink.basePriceCents;
  return prices;
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
