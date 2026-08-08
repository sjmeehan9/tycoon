import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  advanceTick,
  createCampaign,
  describeRushActivity,
  setRushSpeed,
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
import {
  MAX_SCENE_QUEUE_SPRITES,
  MAX_SCENE_TRANSIENTS,
  QUEUE_SHIFT_DURATION_MS,
  advanceScenePlayback,
  createScenePlayback,
  interpolatedQueueIndex,
  syncScenePlayback,
  walkawayVisualLabel,
} from '../../src/scene/scenePlayback';
import {
  ORTHOGRAPHIC_VERTICAL_HALF_EXTENT,
  orthographicProjection,
} from '../../src/scene/three/camera';
import { MAX_DEVICE_PIXEL_RATIO, boundedDevicePixelRatio } from '../../src/scene/three/materials';
import {
  MAX_RENDER_ACTIVITY_EVENTS,
  MAX_RENDER_QUEUE_CUSTOMERS,
  createRenderSnapshot,
} from '../../src/scene/three/renderSnapshot';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

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
    expect(
      (['patience', 'queueFull', 'stockout', 'rushEnded'] as const).map(walkawayVisualLabel),
    ).toEqual(['WAITED TOO LONG', 'QUEUE FULL', 'OUT OF STOCK', 'RUSH CLOSED']);
  });

  it('initializes from persisted truth without replaying retained activity', () => {
    const game = livingRushEnvelope().activeRun;
    if (!game) throw new Error('Expected living-rush fixture.');
    const snapshot = createSceneSnapshot(game, false, ['classicAwning']);
    const playback = createScenePlayback(snapshot);
    expect(playback.lastSequence).toBe(6);
    expect(playback.transients).toEqual([]);
    expect(playback.queueMotions).toHaveLength(MAX_SCENE_QUEUE_SPRITES);
    expect(playback.queueMotions.every((motion) => motion.fromIndex === motion.toIndex)).toBe(true);
    expect(Object.isFrozen(playback)).toBe(true);
    expect(Object.isFrozen(playback.queueMotions)).toBe(true);
  });

  it('coalesces unseen identities and bounds high-speed transient playback', () => {
    const game = livingRushEnvelope({ paused: false }).activeRun;
    if (!game?.rush) throw new Error('Expected living-rush fixture.');
    const initial = createSceneSnapshot(game, false, ['classicAwning']);
    let playback = createScenePlayback(initial);
    const newActivity: RushActivityEvent[] = [
      {
        id: 'd1-e7',
        sequence: 7,
        tick: 49,
        customerId: 'd1-c29',
        segment: 'regular',
        type: 'arrival',
      },
      {
        id: 'd1-e8',
        sequence: 8,
        tick: 49,
        customerId: 'd1-c29',
        segment: 'regular',
        type: 'walkaway',
        reason: 'queueFull',
      },
      ...Array.from({ length: 7 }, (_, index) => ({
        id: `d1-e${index + 9}`,
        sequence: index + 9,
        tick: 50,
        customerId: `d1-c${index + 30}`,
        segment: 'student' as const,
        type: 'sale' as const,
        drinkId: 'flatWhite' as const,
        size: 'large' as const,
        milk: 'oat' as const,
        priceCents: 725 + index,
      })),
    ];
    const arrivalGame = {
      ...game,
      rush: {
        ...game.rush,
        nextActivitySequence: 8,
        recentActivity: [...game.rush.recentActivity, newActivity[0]!],
      },
    };
    const arrival = createSceneSnapshot(arrivalGame, false, ['classicAwning']);
    playback = syncScenePlayback(playback, arrival);
    expect(playback.transients).toEqual([
      expect.objectContaining({ sequence: 7, kind: 'arrival', customerId: 'd1-c29' }),
    ]);

    const queueFullGame = {
      ...arrivalGame,
      rush: {
        ...arrivalGame.rush,
        nextActivitySequence: 9,
        recentActivity: [...arrivalGame.rush.recentActivity, newActivity[1]!],
      },
    };
    const queueFull = createSceneSnapshot(queueFullGame, false, ['classicAwning']);
    playback = syncScenePlayback(playback, queueFull);
    expect(playback.transients).toEqual([
      expect.objectContaining({
        sequence: 8,
        kind: 'walkaway',
        customerId: 'd1-c29',
        reason: 'queueFull',
      }),
    ]);

    const updated = createSceneSnapshot(
      {
        ...queueFullGame,
        rush: {
          ...queueFullGame.rush,
          nextActivitySequence: 16,
          recentActivity: [...queueFullGame.rush.recentActivity, ...newActivity.slice(2)],
        },
      },
      false,
      ['classicAwning'],
    );
    playback = syncScenePlayback(playback, updated);
    expect(playback.lastSequence).toBe(15);
    expect(playback.transients).toHaveLength(MAX_SCENE_TRANSIENTS);
    expect(playback.transients.map(({ sequence }) => sequence)).toEqual([13, 14, 15]);
    expect(playback.transients.every(({ kind }) => kind === 'sale')).toBe(true);
    const advanced = advanceScenePlayback(playback, updated, 100);
    expect(advanced.transients[0]?.ageMs).toBe(400);
    const cleared = advanceScenePlayback(advanced, updated, 250);
    expect(cleared.transients).toEqual([]);
  });

  it('eases queue shifts while pause freezes and reduced motion settles immediately', () => {
    const game = livingRushEnvelope({ paused: false }).activeRun;
    if (!game?.rush) throw new Error('Expected living-rush fixture.');
    const initial = createSceneSnapshot(game, false, ['classicAwning']);
    const playback = createScenePlayback(initial);
    const shiftedGame = { ...game, rush: { ...game.rush, queue: game.rush.queue.slice(1) } };
    const shifted = createSceneSnapshot(shiftedGame, false, ['classicAwning']);
    const moving = syncScenePlayback(playback, shifted);
    const front = moving.queueMotions[0];
    if (!front) throw new Error('Expected a shifting front customer.');
    expect(front).toMatchObject({ fromIndex: 1, toIndex: 0, ageMs: 0 });
    expect(interpolatedQueueIndex(front)).toBe(1);

    const paused = createSceneSnapshot(
      { ...shiftedGame, rush: { ...shiftedGame.rush, isPaused: true } },
      false,
      ['classicAwning'],
    );
    expect(advanceScenePlayback(moving, paused, QUEUE_SHIFT_DURATION_MS)).toEqual(moving);

    const settled = syncScenePlayback(moving, createSceneSnapshot(shiftedGame, true, []));
    expect(settled.transients).toEqual([]);
    expect(settled.queueMotions.every((motion) => motion.fromIndex === motion.toIndex)).toBe(true);
  });
});

describe('snapshot-only WebGL contract', () => {
  it('copies, bounds, and deeply freezes every renderer-facing branch', () => {
    const game = livingRushEnvelope({ paused: true, reducedMotion: true }).activeRun;
    if (!game?.rush) throw new Error('Expected living-rush fixture.');
    const snapshot = createRenderSnapshot(game, true, ['classicAwning']);
    expect(snapshot.service.queue).toHaveLength(MAX_RENDER_QUEUE_CUSTOMERS);
    expect(snapshot.service.activity.length).toBeLessThanOrEqual(MAX_RENDER_ACTIVITY_EVENTS);
    expect(snapshot.service.queueCount).toBe(12);
    expect(snapshot.service.active).toMatchObject({ id: 'd1-c1', progress: 0.4 });
    expect(snapshot.presentation).toEqual({ reducedMotion: true, animate: false });
    expect(snapshot.operation.stock).toHaveLength(9);
    expect(deeplyFrozen(snapshot)).toBe(true);

    const capturedCustomer = snapshot.service.queue[0]?.id;
    game.rush.queue[0]!.id = 'mutated-after-snapshot';
    expect(snapshot.service.queue[0]?.id).toBe(capturedCustomer);
    expect(() => {
      (snapshot.operation.stock[0] as { quantity: number }).quantity = 999_999;
    }).toThrow(TypeError);
  });

  it.each([1, 2, 4] as const)(
    'cannot alter deterministic engine truth while mounted at %d× or reduced motion',
    (speed) => {
      const base = livingRushEnvelope({ paused: false }).activeRun;
      if (!base?.rush) throw new Error('Expected living-rush fixture.');
      let observed = setRushSpeed(base, speed);
      let control = setRushSpeed(base, speed);
      let ticks = 0;
      while (observed.phase === 'rush' && ticks < 400) {
        createRenderSnapshot(observed, false, ['classicAwning']);
        createRenderSnapshot(observed, true, ['classicAwning']);
        observed = advanceTick(observed);
        ticks += 1;
      }
      let controlTicks = 0;
      while (control.phase === 'rush' && controlTicks < 400) {
        control = advanceTick(control);
        controlTicks += 1;
      }
      expect(ticks).toBeLessThan(400);
      expect(controlTicks).toBe(ticks);
      expect(observed.phase).toBe('report');
      expect(observed).toEqual(control);
      expect(observed).toMatchObject({
        cashCents: control.cashCents,
        inventory: control.inventory,
        reputation: control.reputation,
        report: control.report,
      });
    },
  );

  it('keeps a fixed orthographic scale and caps invalid or dense displays', () => {
    expect(orthographicProjection(1_600, 900)).toEqual({
      left: -(ORTHOGRAPHIC_VERTICAL_HALF_EXTENT * 1_600) / 900,
      right: (ORTHOGRAPHIC_VERTICAL_HALF_EXTENT * 1_600) / 900,
      top: ORTHOGRAPHIC_VERTICAL_HALF_EXTENT,
      bottom: -ORTHOGRAPHIC_VERTICAL_HALF_EXTENT,
      near: 0.1,
      far: 100,
    });
    expect(orthographicProjection(320, 180).top).toBe(orthographicProjection(1_600, 900).top);
    expect(boundedDevicePixelRatio(3)).toBe(MAX_DEVICE_PIXEL_RATIO);
    expect(boundedDevicePixelRatio(0)).toBe(1);
    expect(boundedDevicePixelRatio(Number.NaN)).toBe(1);
  });

  it('keeps the approved title art byte-identical', () => {
    const digest = createHash('sha256')
      .update(readFileSync('public/assets/art/laneway-title.webp'))
      .digest('hex');
    expect(digest).toBe('5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37');
  });
});

function deeplyFrozen(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return true;
  return Object.isFrozen(value) && Object.values(value).every((nested) => deeplyFrozen(nested));
}

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
