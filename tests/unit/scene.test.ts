import { describe, expect, it } from 'vitest';

import { createCampaign, startRush } from '../../src/game';
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
});
