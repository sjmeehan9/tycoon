/** Pure weighted per-ingredient capacity forecasts derived from real order probabilities. */

import {
  DRINK_MAP,
  INGREDIENT_DETAILS,
  PURCHASE_PACKAGES,
  SEGMENT_DEMAND_SHARES,
  emptyIngredientTotals,
  milkIngredient,
} from '../content/gameContent';
import { baseDrinkChoiceWeight, milkProbabilities, sizeProbabilities } from './demandModel';
import {
  addPlannedPurchases,
  earliestInventoryExpiry,
  ingredientQuantity,
  plannedPurchaseTotals,
} from './inventory';
import type {
  CustomerSegment,
  DrinkConfig,
  GameState,
  IngredientAmount,
  IngredientId,
  IngredientTotals,
  MilkChoice,
} from './types';

const SEGMENTS = Object.keys(SEGMENT_DEMAND_SHARES) as CustomerSegment[];

/** Stable capacity row consumed by planning and live-stock presentation. */
export interface IngredientCapacity {
  ingredientId: IngredientId;
  name: string;
  unit: 'g' | 'ml' | 'serve';
  carriedQuantity: number;
  pendingPurchaseQuantity: number;
  postPurchaseQuantity: number;
  usableQuantity: number;
  expectedUnitsPerServe: number;
  estimatedServes: number | null;
  isUsedToday: boolean;
  isLimiting: boolean;
  earliestExpiry: { day: number; quantity: number } | null;
}

/** Return weighted expected ingredient units consumed by one served order. */
export function weightedIngredientUse(state: GameState): IngredientTotals {
  const expected = emptyIngredientTotals();
  const menu = [...new Set(state.plan.activeMenu)];
  if (menu.length === 0) return expected;

  for (const segment of SEGMENTS) {
    const segmentShare = SEGMENT_DEMAND_SHARES[segment];
    const weightedDrinks = menu
      .map((drinkId) => ({
        drink: DRINK_MAP.get(drinkId),
        weight: baseDrinkChoiceWeight(state, segment, drinkId),
      }))
      .filter((item): item is { drink: DrinkConfig; weight: number } => Boolean(item.drink));
    const totalDrinkWeight = weightedDrinks.reduce((total, item) => total + item.weight, 0);
    if (totalDrinkWeight <= 0) continue;

    for (const { drink, weight } of weightedDrinks) {
      const drinkProbability = segmentShare * (weight / totalDrinkWeight);
      const sizes = sizeProbabilities(drink, segment);
      const milks = milkProbabilities(drink);
      for (const [size, sizeProbability] of Object.entries(sizes)) {
        if (sizeProbability <= 0) continue;
        const variant = drink.variants.find((candidate) => candidate.size === size);
        if (!variant) continue;
        for (const [milk, milkProbability] of Object.entries(milks)) {
          if (milkProbability <= 0) continue;
          const combinationProbability = drinkProbability * sizeProbability * milkProbability;
          for (const ingredient of orderIngredientAmounts(
            state,
            drink,
            variant.ingredients,
            milk as MilkChoice,
          )) {
            expected[ingredient.ingredientId] += ingredient.amount * combinationProbability;
          }
        }
      }
    }
  }
  return expected;
}

/** Return all exact quantities and weighted serves estimates for the current day. */
export function ingredientCapacities(state: GameState): IngredientCapacity[] {
  const expected = weightedIngredientUse(state);
  const includesPendingPurchases = state.phase === 'planning';
  const pending = includesPendingPurchases
    ? plannedPurchaseTotals(state.plan)
    : emptyIngredientTotals();
  const usableInventory = includesPendingPurchases
    ? addPlannedPurchases(state.inventory, state.plan, state.day, state.equipment.refrigeration)
    : state.inventory;

  const rows = PURCHASE_PACKAGES.map((item): IngredientCapacity => {
    const expectedUnitsPerServe = expected[item.ingredientId];
    const isUsedToday = expectedUnitsPerServe > 0;
    const usableQuantity = ingredientQuantity(usableInventory, item.ingredientId);
    return {
      ingredientId: item.ingredientId,
      name: INGREDIENT_DETAILS[item.ingredientId].name,
      unit: INGREDIENT_DETAILS[item.ingredientId].unit,
      carriedQuantity: ingredientQuantity(state.inventory, item.ingredientId),
      pendingPurchaseQuantity: pending[item.ingredientId],
      postPurchaseQuantity: usableQuantity,
      usableQuantity,
      expectedUnitsPerServe,
      estimatedServes: isUsedToday ? Math.floor(usableQuantity / expectedUnitsPerServe) : null,
      isUsedToday,
      isLimiting: false,
      earliestExpiry: earliestInventoryExpiry(usableInventory, item.ingredientId),
    };
  });
  const limitingServes = Math.min(
    ...rows
      .filter((row) => row.isUsedToday && row.estimatedServes !== null)
      .map((row) => row.estimatedServes as number),
  );
  return rows.map((row) => ({
    ...row,
    isLimiting:
      Number.isFinite(limitingServes) && row.isUsedToday && row.estimatedServes === limitingServes,
  }));
}

/** Format one exact ingredient quantity with its configured unit. */
export function formatIngredientQuantity(
  quantity: number,
  unit: IngredientCapacity['unit'],
): string {
  const formatted = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 }).format(quantity);
  if (unit === 'serve') return `${formatted} ${quantity === 1 ? 'serve' : 'serves'}`;
  return `${formatted} ${unit}`;
}

function orderIngredientAmounts(
  state: GameState,
  drink: DrinkConfig,
  ingredients: IngredientAmount[],
  milk: MilkChoice,
): IngredientAmount[] {
  const adapted = ingredients.map((ingredient) => {
    if (ingredient.ingredientId === 'houseBeans') {
      return { ...ingredient, ingredientId: state.plan.beanId };
    }
    if (ingredient.ingredientId === 'dairyMilk') {
      return { ...ingredient, ingredientId: milkIngredient(milk) ?? 'dairyMilk' };
    }
    return ingredient;
  });
  const optionalMilk = drink.optionalMilkAmount ? milkIngredient(milk) : null;
  if (optionalMilk) {
    adapted.push({ ingredientId: optionalMilk, amount: drink.optionalMilkAmount ?? 0 });
  }
  return adapted;
}
