import { describe, expect, it } from 'vitest';

import {
  applyDemandInfluence,
  ARRIVAL_DEMAND_ENGINE_INFLUENCES,
  advanceTick,
  baseDrinkChoiceWeight,
  createCampaign,
  DEMAND_INFLUENCES,
  DEMAND_INFLUENCE_IDS,
  DIFFICULTY_DEVIATION_MULTIPLIERS,
  demandRate,
  ORDER_CHOICE_DEMAND_ENGINE_INFLUENCES,
  operationalEffects,
  prepareDay,
  resolveEvent,
  startRush,
  type Customer,
  type GameState,
} from '../../src/game';

function stockedCampaign(seed = 700): GameState {
  return prepareDay(createCampaign({ seed }), {
    activeMenu: ['flatWhite', 'mocha', 'icedLatte'],
    purchases: {
      houseBeans: 2,
      dairyMilk: 2,
      oatMilk: 1,
      soyMilk: 1,
      chocolate: 1,
      ice: 1,
    },
  });
}

function completeRush(initial: GameState): GameState {
  let state = initial;
  while (state.phase !== 'report') {
    if (state.phase === 'event') {
      const choice = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choice) throw new Error('Event had no choice.');
      state = resolveEvent(state, choice);
    } else {
      state = advanceTick(state);
    }
  }
  return state;
}

describe('explainable demand factors', () => {
  it('keeps the engine influence sets exhaustive with the typed registry', () => {
    expect(
      [...ARRIVAL_DEMAND_ENGINE_INFLUENCES, ...ORDER_CHOICE_DEMAND_ENGINE_INFLUENCES].sort(),
    ).toEqual([...DEMAND_INFLUENCE_IDS].sort());
    expect(Object.keys(DEMAND_INFLUENCES).sort()).toEqual([...DEMAND_INFLUENCE_IDS].sort());
    for (const definition of Object.values(DEMAND_INFLUENCES)) {
      expect(definition.baseline.length).toBeGreaterThan(0);
      expect(definition.engineSource.length).toBeGreaterThan(0);
      expect(definition.boundary.length).toBeGreaterThan(0);
      expect(definition.clamp.minimum).toBeLessThan(definition.clamp.maximum);
    }
  });

  it('applies domain-aware Hard deviations and Standard price-only policy', () => {
    for (const influenceId of DEMAND_INFLUENCE_IDS) {
      const definition = DEMAND_INFLUENCES[influenceId];
      const positiveDelta = Math.min((definition.clamp.maximum - definition.neutral) / 4, 0.02);
      const negativeDelta = Math.min((definition.neutral - definition.clamp.minimum) / 4, 0.02);
      const hardMultiplier =
        definition.application === 'price-slope'
          ? DIFFICULTY_DEVIATION_MULTIPLIERS.hard.price
          : DIFFICULTY_DEVIATION_MULTIPLIERS.hard.nonPrice;

      expect(applyDemandInfluence('standard', influenceId, definition.neutral)).toBe(
        definition.neutral,
      );
      expect(applyDemandInfluence('hard', influenceId, definition.neutral)).toBe(
        definition.neutral,
      );

      if (definition.domain !== 'negative-only') {
        const baseline = definition.neutral + positiveDelta;
        const hard = applyDemandInfluence('hard', influenceId, baseline);
        expect((hard - definition.neutral) / positiveDelta).toBeCloseTo(hardMultiplier, 8);
      } else {
        expect(applyDemandInfluence('hard', influenceId, definition.neutral + positiveDelta)).toBe(
          definition.neutral,
        );
      }

      if (definition.domain !== 'positive-only') {
        const baseline = definition.neutral - negativeDelta;
        const hard = applyDemandInfluence('hard', influenceId, baseline);
        expect((definition.neutral - hard) / negativeDelta).toBeCloseTo(hardMultiplier, 8);
      } else {
        expect(applyDemandInfluence('hard', influenceId, definition.neutral - negativeDelta)).toBe(
          definition.neutral,
        );
      }

      const standardBaseline =
        definition.domain === 'negative-only'
          ? definition.neutral - negativeDelta
          : definition.neutral + positiveDelta;
      const standard = applyDemandInfluence('standard', influenceId, standardBaseline);
      const expectedMultiplier =
        definition.application === 'price-slope'
          ? DIFFICULTY_DEVIATION_MULTIPLIERS.standard.price
          : DIFFICULTY_DEVIATION_MULTIPLIERS.standard.nonPrice;
      expect(
        Math.abs(standard - definition.neutral) / Math.abs(standardBaseline - definition.neutral),
      ).toBeCloseTo(expectedMultiplier, 8);

      expect(applyDemandInfluence('hard', influenceId, 1_000_000_000)).toBe(
        definition.domain === 'negative-only' ? definition.neutral : definition.clamp.maximum,
      );
      expect(applyDemandInfluence('hard', influenceId, -1_000_000_000)).toBe(
        definition.domain === 'positive-only' ? definition.neutral : definition.clamp.minimum,
      );
    }
  });

  it('uses the configured Standard and Hard slope once on the arrival price path', () => {
    expect(arrivalPriceSlope('standard')).toBeCloseTo(1.225, 8);
    expect(arrivalPriceSlope('hard')).toBeCloseTo(1.675, 8);
    expect(arrivalPriceSlope('hard')).not.toBeCloseTo(1.225 * 1.675, 4);
  });

  it('uses the configured Standard and Hard slope once on segment order price choice', () => {
    expect(orderPriceSlope('standard')).toBeCloseTo(1.225, 8);
    expect(orderPriceSlope('hard')).toBeCloseTo(1.675, 8);
    expect(orderPriceSlope('hard')).not.toBeCloseTo(1.225 * 1.675, 4);
  });

  it('moves in the configured direction for price, reputation, quality, venue, and weather', () => {
    const cheap = startRush(
      prepareDay(stockedCampaign(), {
        pricesCents: { flatWhite: 420, mocha: 480, icedLatte: 500 },
      }),
    );
    const expensive = startRush(
      prepareDay(stockedCampaign(), {
        pricesCents: { flatWhite: 900, mocha: 980, icedLatte: 1_050 },
      }),
    );
    expect(demandRate(cheap)).toBeGreaterThan(demandRate(expensive));
    expect(demandRate({ ...cheap, reputation: 90 })).toBeGreaterThan(
      demandRate({ ...cheap, reputation: 10 }),
    );
    expect(demandRate({ ...cheap, plan: { ...cheap.plan, dialIn: 'quality' } })).toBeGreaterThan(
      demandRate({ ...cheap, plan: { ...cheap.plan, dialIn: 'speed' } }),
    );
    expect(demandRate({ ...cheap, venueId: 'cafe' })).toBeGreaterThan(
      demandRate({ ...cheap, venueId: 'cart' }),
    );
    expect(demandRate({ ...cheap, venueId: 'departmentStore' })).toBeGreaterThan(
      demandRate({ ...cheap, venueId: 'cafe' }),
    );
    expect(demandRate({ ...cheap, weather: 'coldSnap' })).toBeGreaterThan(
      demandRate({ ...cheap, weather: 'rainy' }),
    );
  });

  it('reduces demand for unavailable menus and visible waits, while events can lift it', () => {
    const stocked = startRush(stockedCampaign());
    const empty = startRush(
      prepareDay(createCampaign({ seed: 700 }), {
        activeMenu: ['flatWhite', 'mocha', 'icedLatte'],
        purchases: { houseBeans: 0, dairyMilk: 0, chocolate: 0, ice: 0 },
      }),
    );
    expect(demandRate(stocked)).toBeGreaterThan(demandRate(empty));
    const dummy = createDummyCustomer();
    const queued = {
      ...stocked,
      rush: stocked.rush
        ? { ...stocked.rush, queue: Array.from({ length: 6 }, () => dummy) }
        : null,
    };
    expect(demandRate(stocked)).toBeGreaterThan(demandRate(queued));
    const eventLift = {
      ...stocked,
      rush: stocked.rush ? { ...stocked.rush, demandMultiplier: 1.2 } : null,
    };
    expect(demandRate(eventLift)).toBeGreaterThan(demandRate(stocked));
  });

  it('reproduces zero, one, and two events and all four customer segments', () => {
    const eventCounts = [2, 0, 1].map((seed) => {
      const report = completeRush(startRush(stockedCampaign(seed)));
      return report.rush?.resolvedEvents.length;
    });
    expect(eventCounts).toEqual([0, 1, 2]);

    const seen = new Set<string>();
    for (let seed = 10; seed < 22; seed += 1) {
      const report = completeRush(startRush(stockedCampaign(seed)));
      Object.keys(report.rush?.stats.arrivalsBySegment ?? {}).forEach((segment) =>
        seen.add(segment),
      );
    }
    expect(seen).toEqual(new Set(['commuter', 'student', 'enthusiast', 'regular']));
  });

  it('keeps department venue and commercial team-equipment source values inside exact Hard bounds', () => {
    const venue = DEMAND_INFLUENCES.arrivalVenue;
    expect(venue.engineSource).toBe('engine.demandRate.VENUE_DEMAND_FACTOR[state.venueId]');
    expect(applyDemandInfluence('standard', 'arrivalVenue', 1.62)).toBeCloseTo(1.62, 8);
    expect(applyDemandInfluence('hard', 'arrivalVenue', 1.62)).toBeCloseTo(2.0385, 8);
    expect(venue.clamp.maximum).toBeGreaterThanOrEqual(2.0385);

    const base = createCampaign({ seed: 8_303 });
    const staff = Array.from({ length: 8 }, (_, index) => ({
      ...base.candidateStaff[index % base.candidateStaff.length]!,
      id: `demand-staff-${index}`,
      name: `Demand Staff ${index}`,
      trait: 'peoplePerson' as const,
      hiredOnDay: 1,
    }));
    const department = {
      ...base,
      venueId: 'departmentStore' as const,
      staff,
      equipment: { ...base.equipment, pos: 3 },
      plan: { ...base.plan, scheduledStaffIds: staff.map(({ id }) => id) },
    };
    const baselineTeamEquipment = operationalEffects(department).demandMultiplier;
    const hardTeamEquipment = applyDemandInfluence(
      'hard',
      'arrivalTeamEquipment',
      baselineTeamEquipment,
    );
    expect(DEMAND_INFLUENCES.arrivalTeamEquipment.engineSource).toBe(
      'engine.demandRate.operationalEffects(state).demandMultiplier',
    );
    expect(baselineTeamEquipment).toBeCloseTo(1.05 ** 8 * 1.07, 8);
    expect(hardTeamEquipment).toBeCloseTo(1 + (baselineTeamEquipment - 1) * 1.675, 8);
    expect(hardTeamEquipment).toBeLessThanOrEqual(
      DEMAND_INFLUENCES.arrivalTeamEquipment.clamp.maximum,
    );
  });
});

function arrivalPriceSlope(difficulty: GameState['difficulty']): number {
  const campaign = createCampaign({ seed: 9_001, difficulty });
  const neutral = prepareDay(campaign, {
    activeMenu: ['espresso', 'flatWhite'],
    pricesCents: { espresso: 450, flatWhite: 550 },
  });
  const higher = prepareDay(campaign, {
    activeMenu: ['espresso', 'flatWhite'],
    pricesCents: { espresso: 540, flatWhite: 640 },
  });
  const observedHigherFactor =
    (demandRate(startRush(higher)) / demandRate(startRush(neutral))) * 1.15;
  return (1.15 - observedHigherFactor) / 0.1;
}

function orderPriceSlope(difficulty: GameState['difficulty']): number {
  const campaign = createCampaign({ seed: 9_002, difficulty });
  const neutral = prepareDay(campaign, { pricesCents: { flatWhite: 550 } });
  const higher = prepareDay(campaign, { pricesCents: { flatWhite: 626 } });
  const neutralWeight = baseDrinkChoiceWeight(neutral, 'commuter', 'flatWhite');
  const higherWeight = baseDrinkChoiceWeight(higher, 'commuter', 'flatWhite');
  const observedHigherFactor = (higherWeight / neutralWeight) * 1.25;
  return (1.25 - observedHigherFactor) / 0.1;
}

function createDummyCustomer(): Customer {
  return {
    id: 'waiting',
    segment: 'commuter',
    arrivedAtTick: 0,
    patienceTicks: 100,
    waitedTicks: 20,
    order: {
      drinkId: 'flatWhite',
      size: 'regular',
      milk: 'dairy',
      priceCents: 550,
      ingredientAmounts: [
        { ingredientId: 'houseBeans', amount: 18 },
        { ingredientId: 'dairyMilk', amount: 150 },
      ],
      preparationTicks: 20,
    },
  };
}
