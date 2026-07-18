import { describe, expect, it } from 'vitest';

import { CAMPAIGN_RULES } from '../../src/content/gameContent';
import {
  advanceTick,
  closeDay,
  createCampaign,
  hireStaff,
  prepareDay,
  resolveEvent,
  setRushSpeed,
  startRush,
  togglePause,
} from '../../src/game';
import {
  BACKUP_SAVE_KEY,
  BrowserSaveStore,
  LEGACY_SAVE_KEY,
  SAVE_KEY,
  SaveValidationError,
  createSaveEnvelope,
  importEnvelope,
  parseEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import { nearVictoryEnvelope } from '../fixtures/campaignFixtures';

interface MutableLegacyEnvelope {
  schemaVersion: number;
  activeRun: {
    stateVersion: number;
    report: Record<string, unknown>;
    history: Array<Record<string, unknown>>;
  };
  meta: { achievements: string[] };
}

describe('versioned save envelope', () => {
  it('round-trips a campaign through browser storage', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const envelope = createSaveEnvelope(createCampaign({ seed: 12_345 }));
    store.save(envelope);
    expect(store.load()).toMatchObject({ source: 'primary', envelope });
  });

  it('retains and restores the last-known-good payload', () => {
    const store = new BrowserSaveStore(window.localStorage);
    const first = createSaveEnvelope(createCampaign({ seed: 1 }));
    const second = createSaveEnvelope(createCampaign({ seed: 2 }));
    store.save(first);
    store.save(second);
    expect(window.localStorage.getItem(BACKUP_SAVE_KEY)).toBe(serializeEnvelope(first));
    window.localStorage.setItem(SAVE_KEY, '{broken');
    const restored = store.load();
    expect(restored.source).toBe('backup');
    expect(restored.envelope?.activeRun?.seed).toBe(1);
    expect(restored.warning).toContain('last-known-good');
  });

  it('persists hired staff, scheduling, equipment, candidates, and venue state', () => {
    let state = createCampaign({ seed: 4_204 });
    const candidateId = state.candidateStaff[0]?.id;
    if (!candidateId) throw new Error('Expected a daily candidate.');
    state = hireStaff(state, candidateId);
    state = prepareDay(state, { scheduledStaffIds: [candidateId] });
    state = {
      ...state,
      venueId: 'kiosk',
      equipment: { ...state.equipment, grinder: 1, espressoMachine: 1, pos: 1 },
    };
    const parsed = parseEnvelope(JSON.stringify(createSaveEnvelope(state)));
    expect(parsed?.activeRun).toEqual(state);
    expect(parsed?.activeRun?.staff[0]?.id).toBe(candidateId);
    expect(parsed?.activeRun?.candidateStaff).toHaveLength(3);
    expect(parsed?.activeRun?.equipment).toMatchObject({ grinder: 1, espressoMachine: 1, pos: 1 });
    expect(parsed?.activeRun?.venueId).toBe('kiosk');
  });

  it('rejects malformed or wrong-version payloads', () => {
    expect(parseEnvelope('{')).toBeNull();
    expect(parseEnvelope(JSON.stringify({ schemaVersion: 99 }))).toBeNull();
    expect(
      parseEnvelope(JSON.stringify({ schemaVersion: 1, savedAt: '', activeRun: {} })),
    ).toBeNull();
  });

  it('migrates every supported version 1 field into schema version 2', () => {
    const legacy = JSON.parse(JSON.stringify(nearVictoryEnvelope())) as MutableLegacyEnvelope;
    legacy.schemaVersion = 1;
    legacy.activeRun.stateVersion = 1;
    delete legacy.activeRun.report.wageCostCents;
    legacy.activeRun.history = [{ ...legacy.activeRun.report }];
    const legacyHistoryReport = legacy.activeRun.history[0];
    if (!legacyHistoryReport) throw new Error('Expected legacy history report.');
    delete legacyHistoryReport.wageCostCents;
    legacy.meta.achievements = ['legacy-unknown'];
    const migrated = importEnvelope(JSON.stringify(legacy));
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.activeRun?.stateVersion).toBe(2);
    expect(migrated.activeRun?.report?.wageCostCents).toBe(0);
    expect(migrated.activeRun?.history[0]?.wageCostCents).toBe(0);
    expect(migrated.meta.achievements).toEqual([]);
  });

  it('discovers and migrates a legacy browser key', () => {
    const legacy = JSON.parse(
      JSON.stringify(createSaveEnvelope(createCampaign({ seed: 91 }))),
    ) as MutableLegacyEnvelope;
    legacy.schemaVersion = 1;
    legacy.activeRun.stateVersion = 1;
    window.localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(legacy));
    const loaded = new BrowserSaveStore(window.localStorage).load();
    expect(loaded.source).toBe('legacy');
    expect(loaded.envelope?.activeRun?.stateVersion).toBe(2);
    expect(loaded.warning).toContain('migrated');
  });

  it('rejects oversized, unbounded, non-finite, unsafe, and incompatible imports', () => {
    const valid = nearVictoryEnvelope();
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
          activeRun: { ...valid.activeRun, history: Array(501).fill(valid.activeRun?.report) },
        }),
      ),
    ).toThrow('500-item limit');
    expect(() =>
      importEnvelope(
        JSON.stringify({
          ...valid,
          activeRun: { ...valid.activeRun, campaignId: '<script>alert(1)</script>' },
        }),
      ),
    ).toThrow('unsafe characters');
    const serialized = JSON.stringify(valid).replace(
      `"cashCents":${valid.activeRun?.cashCents}`,
      '"cashCents":1e999',
    );
    expect(() => importEnvelope(serialized)).toThrow('allowed bounds');
  });

  it('round-trips every playable game phase and exact rush controls', () => {
    const planning = createCampaign({ seed: 808 });
    const rush = togglePause(setRushSpeed(startRush(planning), 4));
    let event = togglePause(rush);
    while (event.phase === 'rush') event = advanceTick(event);
    let report = resolveEvent(event, 'protect-queue');
    while (report.phase !== 'report') {
      if (report.phase === 'event') {
        const choice = report.rush?.pendingEvent?.choices[0]?.id;
        if (!choice) throw new Error('Event had no choice.');
        report = resolveEvent(report, choice);
      } else {
        report = advanceTick(report);
      }
    }
    const reinvest = closeDay(report);
    for (const state of [planning, rush, event, report, reinvest]) {
      const parsed = parseEnvelope(JSON.stringify(createSaveEnvelope(state)));
      expect(parsed?.activeRun).toEqual(state);
    }
    expect(rush.rush).toMatchObject({ speed: 4, isPaused: true, tick: 0 });
  });

  it('restores the previous primary payload when a write is interrupted', () => {
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
