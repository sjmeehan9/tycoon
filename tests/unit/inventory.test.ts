import { describe, expect, it } from 'vitest';

import { createDefaultPlan, emptyInventory } from '../../src/content/gameContent';
import {
  addPlannedPurchases,
  batchExpiryDay,
  consumeIngredientsLifo,
  consumeIngredientsAtServiceStart,
  expireInventoryAfterRush,
  extendInventoryRefrigeration,
  hasIngredients,
  ingredientQuantity,
  inventoryTotals,
  plannedPurchaseTotals,
  type IngredientInventory,
} from '../../src/game';

describe('dated perishable inventory', () => {
  it('creates purchase-day batches usable through the third rush', () => {
    const plan = {
      ...createDefaultPlan(),
      purchases: { ...createDefaultPlan().purchases, houseBeans: 2, dairyMilk: 1 },
    };
    const inventory = addPlannedPurchases(emptyInventory(), plan, 4, 0);

    expect(inventory.houseBeans).toEqual([{ quantity: 1_000, acquiredDay: 4, expiresAfterDay: 6 }]);
    expect(inventory.dairyMilk).toEqual([{ quantity: 2_000, acquiredDay: 4, expiresAfterDay: 6 }]);
    expect(expireInventoryAfterRush(inventory, 5).inventory).toEqual(inventory);
    expect(expireInventoryAfterRush(inventory, 6)).toMatchObject({
      expired: { houseBeans: 1_000, dairyMilk: 2_000 },
    });
  });

  it('consumes true newest-first LIFO and preserves a partial batch', () => {
    const inventory = inventoryWithDairy([
      { quantity: 100, acquiredDay: 1, expiresAfterDay: 3 },
      { quantity: 200, acquiredDay: 2, expiresAfterDay: 4 },
      { quantity: 300, acquiredDay: 3, expiresAfterDay: 5 },
    ]);

    const consumed = consumeIngredientsLifo(inventory, [
      { ingredientId: 'dairyMilk', amount: 350 },
    ]);

    expect(consumed.dairyMilk).toEqual([
      { quantity: 150, acquiredDay: 2, expiresAfterDay: 4 },
      { quantity: 100, acquiredDay: 1, expiresAfterDay: 3 },
    ]);
    expect(inventory.dairyMilk).toHaveLength(3);
    expect(ingredientQuantity(consumed, 'dairyMilk')).toBe(250);
  });

  it('makes service-start consumption an explicit irrevocable exact-once transition', () => {
    const inventory = inventoryWithDairy([{ quantity: 200, acquiredDay: 1, expiresAfterDay: 3 }]);
    const consumed = consumeIngredientsAtServiceStart(inventory, [
      { ingredientId: 'dairyMilk', amount: 75 },
    ]);

    expect(ingredientQuantity(inventory, 'dairyMilk')).toBe(200);
    expect(ingredientQuantity(consumed, 'dairyMilk')).toBe(125);
    expect(() =>
      consumeIngredientsAtServiceStart(consumed, [{ ingredientId: 'dairyMilk', amount: 150 }]),
    ).toThrow('not available in full');
  });

  it('never silently consumes unavailable or expired quantities', () => {
    const inventory = inventoryWithDairy([{ quantity: 100, acquiredDay: 1, expiresAfterDay: 3 }]);
    const afterExpiry = expireInventoryAfterRush(inventory, 3).inventory;

    expect(hasIngredients(afterExpiry, [{ ingredientId: 'dairyMilk', amount: 1 }])).toBe(false);
    expect(() =>
      consumeIngredientsLifo(afterExpiry, [{ ingredientId: 'dairyMilk', amount: 1 }]),
    ).toThrow('not available in full');
  });

  it('extends only configured chilled stock by the refrigeration tier delta', () => {
    const inventory = emptyInventory();
    inventory.dairyMilk = [{ quantity: 400, acquiredDay: 2, expiresAfterDay: 4 }];
    inventory.coldBrewConcentrate = [{ quantity: 600, acquiredDay: 2, expiresAfterDay: 4 }];
    inventory.houseBeans = [{ quantity: 500, acquiredDay: 2, expiresAfterDay: 4 }];

    const tierOne = extendInventoryRefrigeration(inventory, 2, 0, 1);
    const tierTwo = extendInventoryRefrigeration(tierOne, 2, 1, 2);
    const tierThree = extendInventoryRefrigeration(tierTwo, 2, 2, 3);

    expect(tierOne.dairyMilk[0]?.expiresAfterDay).toBe(5);
    expect(tierTwo.dairyMilk[0]?.expiresAfterDay).toBe(6);
    expect(tierThree.dairyMilk[0]?.expiresAfterDay).toBe(8);
    expect(tierThree.coldBrewConcentrate[0]?.expiresAfterDay).toBe(8);
    expect(tierTwo.coldBrewConcentrate[0]?.expiresAfterDay).toBe(6);
    expect(tierThree.houseBeans[0]?.expiresAfterDay).toBe(4);
    expect(batchExpiryDay('oatMilk', 7, 3)).toBe(13);
    expect(batchExpiryDay('chocolate', 7, 3)).toBe(9);

    const lifecycle = expireInventoryAfterRush(tierThree, 7);
    expect(lifecycle.expired.dairyMilk).toBe(0);
    expect(lifecycle.expired.houseBeans).toBe(500);
    expect(inventoryTotals(lifecycle.inventory)).toMatchObject({
      dairyMilk: 400,
      coldBrewConcentrate: 600,
      houseBeans: 0,
    });
  });

  it('projects purchase totals without mutating carried stock', () => {
    const plan = createDefaultPlan();
    const original = inventoryWithDairy([{ quantity: 250, acquiredDay: 1, expiresAfterDay: 3 }]);
    const projected = addPlannedPurchases(original, plan, 2, 0);

    expect(plannedPurchaseTotals(plan)).toMatchObject({ houseBeans: 500, dairyMilk: 2_000 });
    expect(inventoryTotals(projected)).toMatchObject({ houseBeans: 500, dairyMilk: 2_250 });
    expect(inventoryTotals(original)).toMatchObject({ houseBeans: 0, dairyMilk: 250 });
  });
});

function inventoryWithDairy(batches: IngredientInventory['dairyMilk']): IngredientInventory {
  return { ...emptyInventory(), dairyMilk: batches };
}
