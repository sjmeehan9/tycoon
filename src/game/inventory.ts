/** Pure canonical operations for dated per-ingredient inventory batches. */

import {
  INGREDIENT_DETAILS,
  INGREDIENT_IDS,
  PURCHASE_PACKAGES,
  emptyIngredientTotals,
  emptyInventory,
} from '../content/gameContent';
import { GameRuleError } from './errors';
import type {
  DayPlan,
  IngredientAmount,
  IngredientId,
  IngredientInventory,
  IngredientTotals,
  InventoryBatch,
} from './types';

export interface InventoryExpiryResult {
  inventory: IngredientInventory;
  expired: IngredientTotals;
}

/** Return the shelf-life extension supplied to one ingredient by refrigeration. */
export function refrigerationExtensionDays(
  ingredientId: IngredientId,
  refrigerationTier: number,
): number {
  if (!INGREDIENT_DETAILS[ingredientId].chilled) return 0;
  if (refrigerationTier >= 2) return 2;
  if (refrigerationTier === 1) return 1;
  return 0;
}

/** Return the inclusive last usable day for a newly acquired ingredient batch. */
export function batchExpiryDay(
  ingredientId: IngredientId,
  acquiredDay: number,
  refrigerationTier: number,
): number {
  return (
    acquiredDay +
    INGREDIENT_DETAILS[ingredientId].shelfLifeRushes -
    1 +
    refrigerationExtensionDays(ingredientId, refrigerationTier)
  );
}

/** Sum every retained batch into an exact, complete flat-total record. */
export function inventoryTotals(inventory: IngredientInventory): IngredientTotals {
  const totals = emptyIngredientTotals();
  for (const ingredientId of INGREDIENT_IDS) {
    totals[ingredientId] = inventory[ingredientId].reduce(
      (total, batch) => total + batch.quantity,
      0,
    );
  }
  return totals;
}

/** Return the exact retained quantity for one ingredient. */
export function ingredientQuantity(
  inventory: IngredientInventory,
  ingredientId: IngredientId,
): number {
  return inventory[ingredientId].reduce((total, batch) => total + batch.quantity, 0);
}

/** Expand a partial total record into all configured ingredients. */
export function completeIngredientTotals(
  partial: Partial<Record<IngredientId, number>>,
): IngredientTotals {
  const totals = emptyIngredientTotals();
  for (const ingredientId of INGREDIENT_IDS) totals[ingredientId] = partial[ingredientId] ?? 0;
  return totals;
}

/** Return exact ingredient quantities selected in the current supply order. */
export function plannedPurchaseTotals(plan: DayPlan): IngredientTotals {
  const totals = emptyIngredientTotals();
  for (const item of PURCHASE_PACKAGES) {
    totals[item.ingredientId] = item.amount * plan.purchases[item.ingredientId];
  }
  return totals;
}

/** Add the current order as one current-day full-life batch per purchased ingredient. */
export function addPlannedPurchases(
  inventory: IngredientInventory,
  plan: DayPlan,
  day: number,
  refrigerationTier: number,
): IngredientInventory {
  const updated = cloneInventory(inventory);
  const purchases = plannedPurchaseTotals(plan);
  for (const ingredientId of INGREDIENT_IDS) {
    const quantity = purchases[ingredientId];
    if (quantity <= 0) continue;
    updated[ingredientId] = appendOrMergeBatch(updated[ingredientId], {
      quantity,
      acquiredDay: day,
      expiresAfterDay: batchExpiryDay(ingredientId, day, refrigerationTier),
    });
  }
  return updated;
}

/** Create current-day full-life batches from validated legacy flat totals. */
export function inventoryFromLegacyTotals(
  totals: IngredientTotals,
  day: number,
  refrigerationTier: number,
): IngredientInventory {
  const inventory = emptyInventory();
  for (const ingredientId of INGREDIENT_IDS) {
    const quantity = totals[ingredientId];
    if (quantity <= 0) continue;
    inventory[ingredientId] = [
      {
        quantity,
        acquiredDay: day,
        expiresAfterDay: batchExpiryDay(ingredientId, day, refrigerationTier),
      },
    ];
  }
  return inventory;
}

/** Return whether every requested ingredient can be reserved in full. */
export function hasIngredients(
  inventory: IngredientInventory,
  ingredients: IngredientAmount[],
): boolean {
  const requested = ingredientAmountsToTotals(ingredients);
  return INGREDIENT_IDS.every(
    (ingredientId) => ingredientQuantity(inventory, ingredientId) >= requested[ingredientId],
  );
}

/** Consume requested quantities newest-first, preserving exact partial batches. */
export function consumeIngredientsLifo(
  inventory: IngredientInventory,
  ingredients: IngredientAmount[],
): IngredientInventory {
  const requested = ingredientAmountsToTotals(ingredients);
  if (
    INGREDIENT_IDS.some(
      (ingredientId) => ingredientQuantity(inventory, ingredientId) < requested[ingredientId],
    )
  ) {
    throw new GameRuleError('The requested ingredients are not available in full.');
  }

  const updated = cloneInventory(inventory);
  for (const ingredientId of INGREDIENT_IDS) {
    let remaining = requested[ingredientId];
    if (remaining === 0) continue;
    const depleted: InventoryBatch[] = [];
    for (const batch of newestFirst(updated[ingredientId])) {
      if (remaining === 0) {
        depleted.push(batch);
        continue;
      }
      const consumed = Math.min(batch.quantity, remaining);
      remaining -= consumed;
      if (batch.quantity > consumed)
        depleted.push({ ...batch, quantity: batch.quantity - consumed });
    }
    updated[ingredientId] = depleted;
  }
  return updated;
}

/** Remove all batches whose last usable rush just completed and total the waste. */
export function expireInventoryAfterRush(
  inventory: IngredientInventory,
  completedDay: number,
): InventoryExpiryResult {
  const retained = emptyInventory();
  const expired = emptyIngredientTotals();
  for (const ingredientId of INGREDIENT_IDS) {
    for (const batch of newestFirst(inventory[ingredientId])) {
      if (batch.expiresAfterDay <= completedDay) expired[ingredientId] += batch.quantity;
      else retained[ingredientId].push({ ...batch });
    }
  }
  return { inventory: retained, expired };
}

/** Extend surviving chilled batches when a higher refrigeration tier is installed. */
export function extendInventoryRefrigeration(
  inventory: IngredientInventory,
  currentDay: number,
  previousTier: number,
  nextTier: number,
): IngredientInventory {
  const delta = Math.max(0, Math.min(2, nextTier) - Math.min(2, previousTier));
  if (delta === 0) return inventory;
  const updated = cloneInventory(inventory);
  for (const ingredientId of INGREDIENT_IDS) {
    if (!INGREDIENT_DETAILS[ingredientId].chilled) continue;
    updated[ingredientId] = updated[ingredientId].map((batch) =>
      batch.expiresAfterDay >= currentDay
        ? { ...batch, expiresAfterDay: batch.expiresAfterDay + delta }
        : batch,
    );
  }
  return updated;
}

/** Return the earliest retained expiry day and total quantity sharing that day. */
export function earliestInventoryExpiry(
  inventory: IngredientInventory,
  ingredientId: IngredientId,
): { day: number; quantity: number } | null {
  const batches = inventory[ingredientId];
  if (batches.length === 0) return null;
  const day = Math.min(...batches.map((batch) => batch.expiresAfterDay));
  return {
    day,
    quantity: batches
      .filter((batch) => batch.expiresAfterDay === day)
      .reduce((total, batch) => total + batch.quantity, 0),
  };
}

function ingredientAmountsToTotals(ingredients: IngredientAmount[]): IngredientTotals {
  const totals = emptyIngredientTotals();
  for (const item of ingredients) totals[item.ingredientId] += item.amount;
  return totals;
}

function appendOrMergeBatch(batches: InventoryBatch[], incoming: InventoryBatch): InventoryBatch[] {
  const existingIndex = batches.findIndex(
    (batch) =>
      batch.acquiredDay === incoming.acquiredDay &&
      batch.expiresAfterDay === incoming.expiresAfterDay,
  );
  const updated = batches.map((batch) => ({ ...batch }));
  if (existingIndex >= 0) {
    const existing = updated[existingIndex];
    if (existing)
      updated[existingIndex] = { ...existing, quantity: existing.quantity + incoming.quantity };
  } else {
    updated.push({ ...incoming });
  }
  return newestFirst(updated);
}

function cloneInventory(inventory: IngredientInventory): IngredientInventory {
  return Object.fromEntries(
    INGREDIENT_IDS.map((ingredientId) => [
      ingredientId,
      inventory[ingredientId].map((batch) => ({ ...batch })),
    ]),
  ) as IngredientInventory;
}

function newestFirst(batches: InventoryBatch[]): InventoryBatch[] {
  return [...batches].sort(
    (first, second) =>
      second.acquiredDay - first.acquiredDay || second.expiresAfterDay - first.expiresAfterDay,
  );
}
