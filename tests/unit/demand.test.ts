import { describe, expect, it } from 'vitest';

import {
  advanceTick,
  createCampaign,
  demandRate,
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
});

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
