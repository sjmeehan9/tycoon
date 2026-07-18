import { describe, expect, it } from 'vitest';

import { createCampaign } from '../../src/game';
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
});
