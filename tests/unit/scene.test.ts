import { describe, expect, it } from 'vitest';

import {
  createCampaign,
  describeRushActivity,
  startRush,
  type Customer,
  type RushActivityEvent,
} from '../../src/game';
import {
  LOGICAL_SCENE_SIZE,
  createSceneSnapshot,
  describeScene,
  shouldAnimateScene,
} from '../../src/scene/sceneModel';

describe('snapshot-driven pixel scene', () => {
  it('uses one fixed logical resolution and exposes weather/venue textual parity', () => {
    const state = {
      ...createCampaign({ seed: 9_001 }),
      venueId: 'cafe' as const,
      weather: 'rainy' as const,
      equipment: {
        grinder: 2,
        espressoMachine: 2,
        batchBrewer: 1,
        refrigeration: 1,
        pos: 1,
        serviceCounter: 1,
      },
    };
    const snapshot = createSceneSnapshot(state, false, ['classicAwning', 'wattleAwning']);
    expect(LOGICAL_SCENE_SIZE).toEqual({ width: 320, height: 180 });
    expect(snapshot).toMatchObject({
      venueId: 'cafe',
      weather: 'rainy',
      awning: 'wattleAwning',
      equipment: { grinder: 2, espressoMachine: 2 },
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.equipment)).toBe(true);
    expect(describeScene(snapshot)).toBe(
      'Specialty Cafe in rainy weather. Day 1, planning phase, 0 customers waiting, 0 staff scheduled, between drinks.',
    );
  });

  it('animates only an active rush when reduced motion is not requested', () => {
    const rush = startRush(createCampaign({ seed: 14 }));
    expect(shouldAnimateScene(createSceneSnapshot(rush, false, ['classicAwning']))).toBe(true);
    expect(shouldAnimateScene(createSceneSnapshot(rush, true, ['classicAwning']))).toBe(false);
    expect(shouldAnimateScene(createSceneSnapshot(createCampaign({ seed: 14 }), false, []))).toBe(
      false,
    );
  });

  it('captures segment and scheduled-role variations without retaining mutable game arrays', () => {
    const base = createCampaign({ seed: 222 });
    const hired = base.candidateStaff.slice(0, 2);
    const state = startRush({
      ...base,
      staff: hired,
      plan: { ...base.plan, scheduledStaffIds: hired.map(({ id }) => id) },
    });
    const snapshot = createSceneSnapshot(state, false, ['neonCup']);
    expect(snapshot.scheduledRoles).toEqual(hired.map(({ role }) => role));
    expect(snapshot.awning).toBe('neonCup');
    expect(snapshot.queueSegments).not.toBe(state.rush?.queue);
  });

  it('preserves exact queue truth, active order identity, and immutable activity beyond the sprite cap', () => {
    const base = startRush(createCampaign({ seed: 7_010 }));
    if (!base.rush) throw new Error('Expected active rush.');
    const customer = sceneCustomer('active-customer');
    const queue = Array.from({ length: 12 }, (_, index) =>
      sceneCustomer(`queue-customer-${index + 1}`),
    );
    const state = {
      ...base,
      rush: {
        ...base.rush,
        queue,
        activeService: { customer, remainingTicks: 10, totalTicks: 20 },
        nextActivitySequence: 1,
        recentActivity: [
          {
            id: 'd1-e0',
            sequence: 0,
            tick: 0,
            customerId: customer.id,
            segment: customer.segment,
            type: 'arrival' as const,
          },
        ],
      },
    };
    const snapshot = createSceneSnapshot(state, false, ['classicAwning']);
    expect(snapshot.queueCount).toBe(12);
    expect(snapshot.queueCustomers).toHaveLength(8);
    expect(snapshot.activeCustomer).toEqual({
      id: customer.id,
      segment: customer.segment,
      order: { drinkId: 'espresso', size: 'regular', milk: 'none', priceCents: 400 },
    });
    expect(snapshot.recentActivity).toEqual(state.rush.recentActivity);
    expect(Object.isFrozen(snapshot.queueCustomers)).toBe(true);
    expect(Object.isFrozen(snapshot.queueCustomers[0])).toBe(true);
    expect(Object.isFrozen(snapshot.activeCustomer?.order)).toBe(true);
    expect(Object.isFrozen(snapshot.recentActivity[0])).toBe(true);
    expect(describeScene(snapshot)).toContain('12 customers waiting');
    expect(describeScene(snapshot)).toContain('Commuter customer active-customer arrived.');
  });

  it('describes every activity and walkaway reason without visual-only meaning', () => {
    const base = {
      id: 'd1-e0',
      sequence: 0,
      tick: 12,
      customerId: 'd1-c1',
      segment: 'student' as const,
    };
    const events: RushActivityEvent[] = [
      { ...base, type: 'arrival' },
      {
        ...base,
        type: 'serviceStarted',
        drinkId: 'flatWhite',
        size: 'large',
        milk: 'oat',
      },
      {
        ...base,
        type: 'sale',
        drinkId: 'flatWhite',
        size: 'large',
        milk: 'oat',
        priceCents: 725,
      },
      ...(['patience', 'queueFull', 'stockout', 'rushEnded'] as const).map((reason) => ({
        ...base,
        type: 'walkaway' as const,
        reason,
      })),
    ];
    expect(events.map(describeRushActivity)).toEqual([
      'Student customer d1-c1 arrived.',
      'Student customer d1-c1 started large oat Flat White service.',
      'Student customer d1-c1 received Large oat Flat White and paid $7.25.',
      'Student customer d1-c1 left after waiting too long.',
      'Student customer d1-c1 left because the queue was full.',
      'Student customer d1-c1 left because their order was out of stock.',
      'Student customer d1-c1 left when the rush ended.',
    ]);
  });
});

function sceneCustomer(id: string): Customer {
  return {
    id,
    segment: 'commuter',
    order: {
      drinkId: 'espresso',
      size: 'regular',
      milk: 'none',
      priceCents: 400,
      ingredientAmounts: [{ ingredientId: 'houseBeans', amount: 18 }],
      preparationTicks: 20,
    },
    arrivedAtTick: 0,
    patienceTicks: 100,
    waitedTicks: 0,
  };
}
