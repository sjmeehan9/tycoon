import { describe, expect, it } from 'vitest';

import {
  advanceTick,
  closeDay,
  createCampaign,
  resolveEvent,
  setRushSpeed,
  startRush,
  togglePause,
} from '../../src/game';
import {
  BACKUP_SAVE_KEY,
  BrowserSaveStore,
  SAVE_KEY,
  createSaveEnvelope,
  parseEnvelope,
} from '../../src/persistence/saveStore';

describe('Phase 1 save envelope', () => {
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
    expect(window.localStorage.getItem(BACKUP_SAVE_KEY)).toBe(JSON.stringify(first));
    window.localStorage.setItem(SAVE_KEY, '{broken');
    const restored = store.load();
    expect(restored.source).toBe('backup');
    expect(restored.envelope?.activeRun?.seed).toBe(1);
    expect(restored.warning).toContain('last-known-good');
  });

  it('rejects malformed or wrong-version payloads', () => {
    expect(parseEnvelope('{')).toBeNull();
    expect(parseEnvelope(JSON.stringify({ schemaVersion: 99 }))).toBeNull();
    expect(
      parseEnvelope(JSON.stringify({ schemaVersion: 1, savedAt: '', activeRun: {} })),
    ).toBeNull();
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
