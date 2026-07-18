import { describe, expect, it } from 'vitest';

import { emptyPurchases } from '../../src/content/gameContent';
import {
  createCampaign,
  ingredientCapacities,
  milkProbabilities,
  prepareDay,
  segmentForDraw,
  sizeProbabilities,
  weightedIngredientUse,
} from '../../src/game';
import { DRINK_MAP } from '../../src/content/gameContent';

describe('weighted planning capacity', () => {
  it('uses exact segment, size, and milk draw probabilities', () => {
    expect([
      segmentForDraw(0.339_999),
      segmentForDraw(0.34),
      segmentForDraw(0.59),
      segmentForDraw(0.79),
    ]).toEqual(['commuter', 'student', 'enthusiast', 'regular']);
    const flatWhite = DRINK_MAP.get('flatWhite');
    const espresso = DRINK_MAP.get('espresso');
    const coldBrew = DRINK_MAP.get('coldBrew');
    if (!flatWhite || !espresso || !coldBrew) throw new Error('Expected configured drinks.');
    expect(sizeProbabilities(flatWhite, 'commuter')).toEqual({ regular: 0.65, large: 0.35 });
    expect(sizeProbabilities(espresso, 'commuter')).toEqual({ regular: 1, large: 0 });
    expect(milkProbabilities(flatWhite)).toEqual({ none: 0, dairy: 0.16, oat: 0.72, soy: 0.12 });
    expect(milkProbabilities(coldBrew)).toEqual({
      none: 0.52,
      dairy: 0.16,
      oat: 0.2,
      soy: 0.12,
    });
  });

  it('matches fixed recipes, weighted variants, modifiers, and bean substitution', () => {
    const espresso = prepareDay(createCampaign({ seed: 5_301 }), {
      activeMenu: ['espresso'],
      purchases: emptyPurchases(),
    });
    expect(weightedIngredientUse(espresso)).toMatchObject({
      houseBeans: 18,
      singleOriginBeans: 0,
      dairyMilk: 0,
    });
    const substituted = prepareDay(espresso, { beanId: 'singleOriginBeans' });
    expect(weightedIngredientUse(substituted)).toMatchObject({
      houseBeans: 0,
      singleOriginBeans: 18,
    });

    const flatWhite = prepareDay(espresso, { activeMenu: ['flatWhite'], beanId: 'houseBeans' });
    const expected = weightedIngredientUse(flatWhite);
    expect(expected.houseBeans).toBeCloseTo(19.4648, 4);
    expect(expected.dairyMilk).toBeCloseTo(28.10144, 5);
    expect(expected.oatMilk).toBeCloseTo(126.45648, 5);
    expect(expected.soyMilk).toBeCloseTo(21.07608, 5);
  });

  it('responds in the expected direction to menu and price-weighted drink mix', () => {
    const base = prepareDay(createCampaign({ seed: 5_302 }), {
      activeMenu: ['espresso', 'coldBrew'],
      purchases: emptyPurchases(),
    });
    const cheapColdBrew = prepareDay(base, { pricesCents: { coldBrew: 250, espresso: 800 } });
    const expensiveColdBrew = prepareDay(base, {
      pricesCents: { coldBrew: 1_200, espresso: 250 },
    });
    expect(weightedIngredientUse(cheapColdBrew).coldBrewConcentrate).toBeGreaterThan(
      weightedIngredientUse(expensiveColdBrew).coldBrewConcentrate,
    );
    expect(weightedIngredientUse(cheapColdBrew).houseBeans).toBeLessThan(
      weightedIngredientUse(expensiveColdBrew).houseBeans,
    );

    const coldOnly = prepareDay(base, { activeMenu: ['coldBrew'] });
    expect(weightedIngredientUse(coldOnly).houseBeans).toBe(0);
    expect(weightedIngredientUse(coldOnly).coldBrewConcentrate).toBeGreaterThan(0);
  });

  it('returns exact carried, pending, post-purchase, serves, unused, and expiry fields', () => {
    const base = createCampaign({ seed: 5_303 });
    const state = prepareDay(
      {
        ...base,
        day: 2,
        inventory: {
          ...base.inventory,
          houseBeans: [{ quantity: 100, acquiredDay: 1, expiresAfterDay: 2 }],
        },
      },
      {
        activeMenu: ['espresso'],
        purchases: { ...emptyPurchases(), houseBeans: 1 },
      },
    );
    const rows = ingredientCapacities(state);
    const beans = rows.find((row) => row.ingredientId === 'houseBeans');
    const milk = rows.find((row) => row.ingredientId === 'dairyMilk');

    expect(beans).toMatchObject({
      carriedQuantity: 100,
      pendingPurchaseQuantity: 500,
      postPurchaseQuantity: 600,
      usableQuantity: 600,
      expectedUnitsPerServe: 18,
      estimatedServes: 33,
      isUsedToday: true,
      isLimiting: true,
      earliestExpiry: { day: 2, quantity: 100 },
    });
    expect(milk).toMatchObject({
      pendingPurchaseQuantity: 0,
      usableQuantity: 0,
      estimatedServes: null,
      isUsedToday: false,
      earliestExpiry: null,
    });
  });

  it('projects full refrigeration life for a pending chilled purchase', () => {
    const base = createCampaign({ seed: 5_304 });
    const state = prepareDay(
      {
        ...base,
        equipment: { ...base.equipment, refrigeration: 2 },
      },
      {
        activeMenu: ['flatWhite'],
        purchases: { ...emptyPurchases(), dairyMilk: 1 },
      },
    );
    const dairy = ingredientCapacities(state).find((row) => row.ingredientId === 'dairyMilk');
    expect(dairy?.earliestExpiry).toEqual({ day: 5, quantity: 2_000 });
  });
});
