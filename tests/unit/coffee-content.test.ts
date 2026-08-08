import { describe, expect, it } from 'vitest';

import {
  ALL_DRINK_IDS,
  DRINKS,
  DRINK_MAP,
  EQUIPMENT,
  EQUIPMENT_IDS,
  INGREDIENT_IDS,
  PURCHASE_PACKAGES,
  VENUES,
  VENUE_IDS,
  VENUE_PROMOTIONS,
  validateEquipmentContent,
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

  it('configures one exhaustive four-venue progression without adding menu content', () => {
    expect(Object.keys(VENUES)).toEqual(VENUE_IDS);
    expect(VENUE_IDS).toEqual(['cart', 'kiosk', 'cafe', 'departmentStore']);
    expect(VENUES.departmentStore).toMatchObject({
      menuCapacity: 10,
      staffCapacity: 10,
      queueCapacity: 24,
      demandFactor: 1.62,
    });
    expect(VENUES.departmentStore.description).toMatch(/heritage dome/i);
    expect(VENUE_PROMOTIONS.cafe).toMatchObject({
      from: 'cafe',
      to: 'departmentStore',
      reputationRequired: 70,
    });
    expect(DRINKS).toHaveLength(10);
    expect(INGREDIENT_IDS).toHaveLength(9);
  });

  it('validates three increasing, costly, venue-bound, operational tiers in every category', () => {
    expect(() => validateEquipmentContent()).not.toThrow();
    expect(Object.keys(EQUIPMENT)).toEqual(EQUIPMENT_IDS);
    for (const equipmentId of EQUIPMENT_IDS) {
      const tiers = EQUIPMENT[equipmentId].tiers;
      expect(tiers.map(({ level }) => level)).toEqual([1, 2, 3]);
      expect(tiers.every(({ costCents }) => costCents > 0)).toBe(true);
      expect(tiers.every(({ operatingCostCents }) => operatingCostCents > 0)).toBe(true);
      expect(tiers.every(({ reliabilityPercent }) => reliabilityPercent >= 90)).toBe(true);
      expect(tiers.every(({ requiresVenue }) => VENUE_IDS.includes(requiresVenue))).toBe(true);
      expect(tiers.every(({ effects }) => Object.keys(effects).length > 0)).toBe(true);
      expect(tiers[2].requiresVenue).toBe('departmentStore');
    }

    const invalid = structuredClone(EQUIPMENT);
    Object.assign(invalid.grinder.tiers[2], { costCents: 0 });
    expect(() => validateEquipmentContent(invalid)).toThrow('costs must be positive');
  });
});
