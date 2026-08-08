import { describe, expect, it } from 'vitest';

import {
  CAMPAIGN_RULES,
  MAX_INVENTORY_BATCHES_PER_INGREDIENT,
} from '../../src/content/gameContent';
import {
  advanceTick,
  createCampaign,
  prepareDay,
  resolveEvent,
  startRush,
  type SaveEnvelope,
} from '../../src/game';
import {
  BACKUP_SAVE_KEY,
  BrowserSaveStore,
  EVOLUTION_NOTICE,
  LEGACY_BACKUP_SAVE_KEY,
  LEGACY_SAVE_KEY,
  LEGACY_V2_BACKUP_SAVE_KEY,
  LEGACY_V2_SAVE_KEY,
  LEGACY_V3_BACKUP_SAVE_KEY,
  LEGACY_V3_SAVE_KEY,
  SAVE_KEY,
  SaveValidationError,
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
  importEnvelope,
  parseEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import { nearVictoryEnvelope, reportHistoryEnvelope } from '../fixtures/campaignFixtures';

const LEGACY_KEYS = [
  LEGACY_V3_SAVE_KEY,
  LEGACY_V3_BACKUP_SAVE_KEY,
  LEGACY_V2_SAVE_KEY,
  LEGACY_V2_BACKUP_SAVE_KEY,
  LEGACY_SAVE_KEY,
  LEGACY_BACKUP_SAVE_KEY,
] as const;

describe('schema-v4 save envelope', () => {
  it.each(['standard', 'hard'] as const)(
    'round-trips one %s campaign idempotently',
    (difficulty) => {
      const source = createSaveEnvelope(createCampaign({ seed: 12_345, difficulty }));
      const once = importEnvelope(serializeEnvelope(source));
      const twice = importEnvelope(serializeEnvelope(once));

      expect(once).toEqual(twice);
      expect(once).toEqual(source);
      expect(once.schemaVersion).toBe(4);
      expect(once.activeRun).toMatchObject({ stateVersion: 4, difficulty });
      expect(once.preferences.evolutionNoticeSeen).toBe(true);
    },
  );

  it('retains and restores only a verified v4 last-known-good payload', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const first = createSaveEnvelope(createCampaign({ seed: 1, difficulty: 'standard' }));
    const second = createSaveEnvelope(createCampaign({ seed: 2, difficulty: 'hard' }));
    store.save(first);
    store.save(second);

    expect(window.localStorage.getItem(BACKUP_SAVE_KEY)).toBe(serializeEnvelope(first));
    window.localStorage.setItem(SAVE_KEY, '{broken');
    const loaded = store.load();
    expect(loaded).toMatchObject({ source: 'backup', recoveryAvailable: true });
    expect(loaded.envelope?.activeRun).toMatchObject({ seed: 1, difficulty: 'standard' });
    expect(store.restoreBackup()).toEqual(first);
    expect(parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')).toEqual(first);
  });

  it('persists difficulty, staff, scheduling, equipment, reports, and venue state', () => {
    let state = createCampaign({ seed: 4_204, difficulty: 'hard' });
    const candidate = state.candidateStaff[0];
    if (!candidate) throw new Error('Expected a daily candidate.');
    state = prepareDay(
      {
        ...state,
        staff: [{ ...candidate, hiredOnDay: 1 }],
        candidateStaff: state.candidateStaff.slice(1),
        venueId: 'departmentStore',
        equipment: {
          grinder: 3,
          espressoMachine: 3,
          batchBrewer: 3,
          refrigeration: 3,
          pos: 3,
          serviceCounter: 3,
        },
      },
      { scheduledStaffIds: [candidate.id] },
    );
    const parsed = parseEnvelope(JSON.stringify(createSaveEnvelope(state)));

    expect(parsed?.activeRun).toEqual(state);
    expect(parsed?.activeRun).toMatchObject({
      difficulty: 'hard',
      venueId: 'departmentStore',
      equipment: {
        grinder: 3,
        espressoMachine: 3,
        batchBrewer: 3,
        refrigeration: 3,
        pos: 3,
        serviceCounter: 3,
      },
    });
    expect(parsed?.activeRun?.plan.scheduledStaffIds).toEqual([candidate.id]);
  });

  it('rejects unknown venues and equipment beyond the commercial third tier', () => {
    const unknownVenue = structuredClone(nearVictoryEnvelope());
    if (!unknownVenue.activeRun) throw new Error('Expected active campaign.');
    (unknownVenue.activeRun as { venueId: string }).venueId = 'airport';
    expect(() => importEnvelope(JSON.stringify(unknownVenue))).toThrow(
      'activeRun.venueId is not supported',
    );

    const futureEquipment = structuredClone(nearVictoryEnvelope());
    if (!futureEquipment.activeRun) throw new Error('Expected active campaign.');
    futureEquipment.activeRun.equipment.grinder = 4;
    expect(() => importEnvelope(JSON.stringify(futureEquipment))).toThrow(
      'equipment.grinder is outside its allowed bounds',
    );
  });

  it('rejects malformed, oversized, unsafe, and future v4 imports', () => {
    const valid = createSaveEnvelope(createCampaign({ seed: 8_088 }));
    expect(parseEnvelope('{')).toBeNull();
    expect(() => importEnvelope('x'.repeat(CAMPAIGN_RULES.maximumSaveBytes + 1))).toThrow(
      SaveValidationError,
    );
    expect(() => importEnvelope(JSON.stringify({ ...valid, schemaVersion: 99 }))).toThrow(
      'not supported',
    );
    expect(() =>
      importEnvelope(
        JSON.stringify({
          ...valid,
          activeRun: { ...valid.activeRun, campaignId: '<script>alert(1)</script>' },
        }),
      ),
    ).toThrow('unsafe characters');
  });

  it('rejects forged difficulty and mismatched report difficulty', () => {
    const invalidDifficulty = structuredClone(createSaveEnvelope(createCampaign({ seed: 70 })));
    if (!invalidDifficulty.activeRun) throw new Error('Expected active campaign.');
    (invalidDifficulty.activeRun as { difficulty: string }).difficulty = 'nightmare';
    expect(() => importEnvelope(JSON.stringify(invalidDifficulty))).toThrow(
      'activeRun.difficulty is not supported',
    );

    const report = completeReport(71, 'hard');
    if (!report.activeRun?.report) throw new Error('Expected a completed report.');
    report.activeRun.report.difficulty = 'standard';
    expect(() => importEnvelope(JSON.stringify(report))).toThrow(
      'report difficulty must match its campaign',
    );
  });

  it('rejects impossible report charges and non-conserving stock evidence', () => {
    const charges = structuredClone(reportHistoryEnvelope());
    const group = charges.activeRun?.history[1]?.chargeGroups?.[0];
    if (!group) throw new Error('Expected canonical report charge.');
    group.quantity += 1;
    group.revenueCents += group.priceCents;
    expect(() => importEnvelope(JSON.stringify(charges))).toThrow(
      'quantity must match served sales',
    );

    const state = startRush(createCampaign({ seed: 811 }));
    const tooMany = structuredClone(createSaveEnvelope(state));
    if (!tooMany.activeRun) throw new Error('Expected active run.');
    tooMany.activeRun.inventory.dairyMilk = Array.from(
      { length: MAX_INVENTORY_BATCHES_PER_INGREDIENT + 1 },
      () => ({ quantity: 1, acquiredDay: 1, expiresAfterDay: 3 }),
    );
    expect(() => importEnvelope(JSON.stringify(tooMany))).toThrow(
      `${MAX_INVENTORY_BATCHES_PER_INGREDIENT}-item limit`,
    );
  });

  it('restores the previous v4 primary when a write is interrupted', () => {
    const storage = new InterruptingStorage();
    const store = new BrowserSaveStore(storage);
    const previous = createSaveEnvelope(createCampaign({ seed: 31 }));
    store.save(previous);
    storage.failNextPrimaryWrite = true;
    expect(() => store.save(createSaveEnvelope(createCampaign({ seed: 32 })))).toThrow(
      'could not store',
    );
    expect(store.load().envelope).toEqual(previous);
  });
});

describe('one-time preferences-only legacy boundary', () => {
  it.each([1, 2, 3] as const)(
    'converts version %d through the same pure allowlist and discards all progress',
    (schemaVersion) => {
      const legacy = legacyEnvelope(schemaVersion);
      const before = structuredClone(legacy);
      const reset = importEnvelope(JSON.stringify(legacy));

      expect(legacy).toEqual(before);
      expect(reset).toEqual({
        schemaVersion: 4,
        savedAt: '1970-01-01T00:00:00.000Z',
        activeRun: null,
        preferences: {
          soundEnabled: true,
          ambienceEnabled: false,
          reducedMotion: true,
          onboardingComplete: false,
          activeTab: 'plan',
          evolutionNoticeSeen: false,
        },
        meta: createDefaultMeta(),
      });
      expect(importEnvelope(JSON.stringify(legacy))).toEqual(reset);
    },
  );

  it('defaults missing old preferences but rejects corrupt retained preference values', () => {
    const withoutPreferences = legacyEnvelope(1);
    delete withoutPreferences.preferences;
    expect(importEnvelope(JSON.stringify(withoutPreferences)).preferences).toMatchObject({
      soundEnabled: false,
      ambienceEnabled: false,
      reducedMotion: false,
    });

    const corrupt = legacyEnvelope(3);
    corrupt.preferences = { soundEnabled: 'yes' };
    expect(() => importEnvelope(JSON.stringify(corrupt))).toThrow(
      'preferences.soundEnabled must be boolean',
    );
  });

  it.each([
    [LEGACY_V3_SAVE_KEY, 'legacy-v3', 3],
    [LEGACY_V3_BACKUP_SAVE_KEY, 'legacy-v3', 3],
    [LEGACY_V2_SAVE_KEY, 'legacy-v2', 2],
    [LEGACY_V2_BACKUP_SAVE_KEY, 'legacy-v2', 2],
    [LEGACY_SAVE_KEY, 'legacy-v1', 1],
    [LEGACY_BACKUP_SAVE_KEY, 'legacy-v1', 1],
  ] as const)('resets and quarantines legacy storage candidate %s', (key, source, version) => {
    window.localStorage.setItem(key, JSON.stringify(legacyEnvelope(version)));
    const loaded = new BrowserSaveStore(window.localStorage).load();

    expect(loaded).toMatchObject({ source, recoveryAvailable: false });
    expect(loaded.envelope).toMatchObject({ activeRun: null, meta: createDefaultMeta() });
    expect(loaded.envelope?.preferences).toMatchObject({
      soundEnabled: true,
      ambienceEnabled: false,
      reducedMotion: true,
      onboardingComplete: false,
      evolutionNoticeSeen: true,
    });
    expect(loaded.warning).toContain('campaign progress was reset');
    expect(parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')).toMatchObject({
      activeRun: null,
      preferences: { evolutionNoticeSeen: true },
    });
    for (const legacyKey of LEGACY_KEYS) {
      expect(window.localStorage.getItem(legacyKey)).toBeNull();
    }
  });

  it('prefers verified v4 and cannot resurrect a legacy primary or recovery backup', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const current = createSaveEnvelope(createCampaign({ seed: 404, difficulty: 'hard' }));
    window.localStorage.setItem(LEGACY_V3_SAVE_KEY, JSON.stringify(legacyEnvelope(3)));
    window.localStorage.setItem(LEGACY_BACKUP_SAVE_KEY, JSON.stringify(legacyEnvelope(1)));
    store.save(current);

    expect(store.load()).toMatchObject({ source: 'primary', envelope: current, warning: null });
    for (const key of LEGACY_KEYS) expect(window.localStorage.getItem(key)).toBeNull();

    store.save(createSaveEnvelope(createCampaign({ seed: 405 })));
    window.localStorage.setItem(SAVE_KEY, '{corrupt');
    window.localStorage.setItem(LEGACY_V3_BACKUP_SAVE_KEY, JSON.stringify(legacyEnvelope(3)));
    const recovered = store.load();
    expect(recovered).toMatchObject({ source: 'backup' });
    expect(recovered.envelope?.activeRun).toMatchObject({ seed: 404, difficulty: 'hard' });
    expect(recovered.warning).not.toContain(EVOLUTION_NOTICE);
    expect(window.localStorage.getItem(LEGACY_V3_BACKUP_SAVE_KEY)).toBeNull();
  });

  it('consumes the evolution marker once across autosave, reload, recovery, and export', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const pending = importEnvelope(JSON.stringify(legacyEnvelope(3)));
    expect(pending.preferences.evolutionNoticeSeen).toBe(false);
    store.save(pending);

    const firstReload = store.load();
    expect(firstReload.warning).toBeNull();
    expect(firstReload.envelope?.preferences.evolutionNoticeSeen).toBe(true);
    const exported = serializeEnvelope(firstReload.envelope!);
    expect(importEnvelope(exported)).toEqual(firstReload.envelope);

    store.save(createSaveEnvelope(createCampaign({ seed: 501 })));
    window.localStorage.setItem(SAVE_KEY, '{broken');
    const recovery = store.load();
    expect(recovery.warning).toContain('last-known-good');
    expect(recovery.warning).not.toContain('game has evolved');
    expect(recovery.envelope?.preferences.evolutionNoticeSeen).toBe(true);
  });
});

function legacyEnvelope(schemaVersion: 1 | 2 | 3): Record<string, unknown> {
  const legacy = JSON.parse(JSON.stringify(nearVictoryEnvelope())) as Record<string, unknown>;
  legacy.schemaVersion = schemaVersion;
  legacy.preferences = {
    ...createDefaultPreferences(),
    soundEnabled: true,
    ambienceEnabled: false,
    reducedMotion: true,
    onboardingComplete: true,
    activeTab: 'team',
    evolutionNoticeSeen: true,
    injectedProgress: 'discard-me',
  };
  legacy.meta = {
    ...createDefaultMeta(),
    endlessUnlocked: true,
    achievements: ['cafeFounder'],
    cosmetics: ['classicAwning', 'neonCup'],
    scenarios: ['lanewayClassic', 'festivalWeek'],
    records: [{ campaignId: 'old-progress' }],
  };
  return legacy;
}

function completeReport(seed: number, difficulty: 'standard' | 'hard'): SaveEnvelope {
  let state = startRush(createCampaign({ seed, difficulty }));
  let safety = 0;
  while (state.phase !== 'report' && safety < 1_000) {
    if (state.phase === 'event') {
      const choiceId = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choiceId) throw new Error('Expected event choice.');
      state = resolveEvent(state, choiceId);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (state.phase !== 'report') throw new Error('Expected report state.');
  return createSaveEnvelope(state);
}

class InterruptingStorage implements Storage {
  readonly #values = new Map<string, string>();
  public failNextPrimaryWrite = false;

  public get length(): number {
    return this.#values.size;
  }

  public clear(): void {
    this.#values.clear();
  }

  public getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.#values.delete(key);
  }

  public setItem(key: string, value: string): void {
    if (key === SAVE_KEY && this.failNextPrimaryWrite) {
      this.failNextPrimaryWrite = false;
      throw new DOMException('Simulated quota interruption', 'QuotaExceededError');
    }
    this.#values.set(key, value);
  }
}
