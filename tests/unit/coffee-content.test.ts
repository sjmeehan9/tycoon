import { describe, expect, it } from 'vitest';

import {
  ALL_DRINK_IDS,
  DRINKS,
  DRINK_MAP,
  INGREDIENT_IDS,
  PURCHASE_PACKAGES,
  weatherForDay,
} from '../../src/content/gameContent';

describe('complete coffee content', () => {
  it('configures every named drink exactly once with bounded recipes', () => {
    expect(DRINKS.map((drink) => drink.id)).toEqual(ALL_DRINK_IDS);
    expect(new Set(DRINKS.map((drink) => drink.id)).size).toBe(10);
    for (const drink of DRINKS) {
      expect(drink.basePriceCents).toBeGreaterThan(0);
      expect(drink.allowedMilks.length).toBeGreaterThan(0);
      expect(drink.variants.length).toBeGreaterThan(0);
      for (const variant of drink.variants) {
        expect(variant.preparationTicks).toBeGreaterThan(0);
        expect(variant.ingredients.length).toBeGreaterThan(0);
        expect(variant.ingredients.every((item) => item.amount > 0)).toBe(true);
      }
    }
  });

  it('keeps authentic base quantities for representative Australian drinks', () => {
    expect(DRINK_MAP.get('espresso')?.variants[0]?.ingredients).toEqual([
      { ingredientId: 'houseBeans', amount: 18 },
    ]);
    expect(DRINK_MAP.get('flatWhite')?.variants[0]?.ingredients).toEqual([
      { ingredientId: 'houseBeans', amount: 18 },
      { ingredientId: 'dairyMilk', amount: 150 },
    ]);
    expect(DRINK_MAP.get('mocha')?.variants[0]?.ingredients).toContainEqual({
      ingredientId: 'chocolate',
      amount: 20,
    });
    expect(DRINK_MAP.get('coldBrew')?.variants[0]?.ingredients).toContainEqual({
      ingredientId: 'coldBrewConcentrate',
      amount: 90,
    });
  });

  it('provides a purchase path for every consumed ingredient', () => {
    expect(new Set(PURCHASE_PACKAGES.map((item) => item.ingredientId))).toEqual(
      new Set(INGREDIENT_IDS),
    );
  });

  it('derives all weather branches deterministically', () => {
    const first = Array.from({ length: 40 }, (_, index) =>
      weatherForDay(8_212, index + 1, 'lanewayClassic'),
    );
    const second = Array.from({ length: 40 }, (_, index) =>
      weatherForDay(8_212, index + 1, 'lanewayClassic'),
    );
    expect(first).toEqual(second);
    expect(new Set(first)).toEqual(new Set(['mild', 'sunny', 'rainy', 'coldSnap']));
  });
});
