import { describe, expect, it } from 'vitest';

import {
  ALL_DRINK_IDS,
  BASE_EVENT_TEMPLATE_IDS,
  COSMETIC_DETAILS,
  DEPARTMENT_EVENT_TEMPLATE_IDS,
  DEPARTMENT_IMPROVEMENT_IDS,
  DRINKS,
  DRINK_MAP,
  EQUIPMENT,
  EQUIPMENT_IDS,
  EVENT_TEMPLATES,
  EVENT_TEMPLATE_IDS,
  IMPROVEMENTS,
  IMPROVEMENT_IDS,
  INGREDIENT_IDS,
  PURCHASE_PACKAGES,
  NEW_COSMETIC_IDS,
  UNLOCK_MILESTONES,
  VENUES,
  VENUE_IDS,
  VENUE_PROMOTIONS,
  validateEquipmentContent,
  validateCampaignContent,
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

  it('configures two unchanged base events and exactly six bounded department events', () => {
    expect(BASE_EVENT_TEMPLATE_IDS).toEqual(['office-coffee-run', 'sudden-downpour']);
    expect(DEPARTMENT_EVENT_TEMPLATE_IDS).toHaveLength(6);
    expect(EVENT_TEMPLATE_IDS).toHaveLength(8);
    expect(EVENT_TEMPLATES).toHaveLength(8);
    expect(EVENT_TEMPLATES[0]).toMatchObject({
      id: 'office-coffee-run',
      title: 'The office coffee run arrives',
      description:
        'A nearby studio wants a tray immediately. The queue is already eyeing the clock.',
      choices: [
        {
          id: 'take-order',
          label: 'Take the order',
          description: 'Add three impatient customers and gain a little afternoon buzz.',
          effect: { addCustomers: 3, demandMultiplier: 1.08, qualityBonus: -3 },
        },
        {
          id: 'protect-queue',
          label: 'Protect the queue',
          description: 'Politely decline. The regulars appreciate the calm service.',
          effect: { reputation: 1, qualityBonus: 2 },
        },
      ],
    });
    expect(EVENT_TEMPLATES[1]).toMatchObject({
      id: 'sudden-downpour',
      title: 'The heavens open',
      description: 'A sharp Melbourne downpour sends pedestrians under every nearby awning.',
    });
    expect(
      EVENT_TEMPLATES.filter(({ id }) =>
        DEPARTMENT_EVENT_TEMPLATE_IDS.includes(
          id as (typeof DEPARTMENT_EVENT_TEMPLATE_IDS)[number],
        ),
      ).every(
        ({ eligibleVenues, choices }) =>
          eligibleVenues.length === 1 &&
          eligibleVenues[0] === 'departmentStore' &&
          choices.length === 2,
      ),
    ).toBe(true);
    expect(() => validateCampaignContent()).not.toThrow();
  });

  it('configures four new anchored upgrades, three non-power cosmetics, and two milestones', () => {
    expect(IMPROVEMENT_IDS).toHaveLength(5);
    expect(DEPARTMENT_IMPROVEMENT_IDS).toHaveLength(4);
    expect(DEPARTMENT_IMPROVEMENT_IDS.map((id) => IMPROVEMENTS[id].anchorId)).toEqual([
      'hallEntry',
      'espressoBay',
      'brewBay',
      'coldBay',
    ]);
    expect(DEPARTMENT_IMPROVEMENT_IDS.map((id) => IMPROVEMENTS[id].costCents)).toEqual([
      7_500, 9_000, 8_000, 8_500,
    ]);
    expect(IMPROVEMENTS['street-sign']).toMatchObject({ costCents: 2_500, anchorId: null });
    expect(NEW_COSMETIC_IDS).toEqual(['mosaicFloor', 'brassBayPlaques', 'afterHoursGlow']);
    expect(NEW_COSMETIC_IDS.every((id) => COSMETIC_DETAILS[id].kind === 'presentation')).toBe(true);
    expect(UNLOCK_MILESTONES).toHaveLength(2);
    expect(new Set(UNLOCK_MILESTONES.flatMap(({ cosmetics }) => cosmetics))).toEqual(
      new Set(NEW_COSMETIC_IDS),
    );
  });

  it('rejects duplicate events, invalid choice content/effects, anchors, unlocks, and inventory growth', () => {
    const duplicateEvents = structuredClone(EVENT_TEMPLATES);
    duplicateEvents[7] = { ...duplicateEvents[7]!, id: 'department-lunch-wave' };
    expect(() => validateCampaignContent({ events: duplicateEvents })).toThrow('unique');

    const missingChoice = structuredClone(EVENT_TEMPLATES);
    missingChoice[2]!.choices = missingChoice[2]!.choices.slice(0, 1);
    expect(() => validateCampaignContent({ events: missingChoice })).toThrow('exactly two choices');

    const invalidEffect = structuredClone(EVENT_TEMPLATES);
    invalidEffect[2]!.choices[0]!.effect.demandMultiplier = 1.5;
    expect(() => validateCampaignContent({ events: invalidEffect })).toThrow(
      'invalid demandMultiplier',
    );

    const duplicateAnchor = structuredClone(IMPROVEMENTS);
    duplicateAnchor['brew-gallery'].anchorId = 'espressoBay';
    expect(() => validateCampaignContent({ improvements: duplicateAnchor })).toThrow('one-to-one');

    const invalidMilestones = structuredClone(UNLOCK_MILESTONES);
    invalidMilestones[0]!.effectKind = 'power' as 'presentation';
    expect(() => validateCampaignContent({ milestones: invalidMilestones })).toThrow(
      'cannot grant power',
    );
    expect(() =>
      validateCampaignContent({
        drinkIds: [...ALL_DRINK_IDS, 'espresso'],
      }),
    ).toThrow('exactly ten drinks');
    expect(() =>
      validateCampaignContent({
        ingredientIds: [...INGREDIENT_IDS, 'ice'],
      }),
    ).toThrow('exactly nine ingredients');
  });
});
