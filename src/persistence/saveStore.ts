import type { GameState, MetaProgress, Preferences, SaveEnvelope } from '../game';

export const SAVE_KEY = 'laneway-tycoon.save.v1';
export const BACKUP_SAVE_KEY = 'laneway-tycoon.save.backup.v1';

/** User-facing preferences available before the production-polish phase. */
export function createDefaultPreferences(): Preferences {
  return {
    soundEnabled: false,
    ambienceEnabled: false,
    reducedMotion: false,
    onboardingComplete: false,
    activeTab: 'plan',
  };
}

/** Meta progress starts cosmetic-only and never changes campaign economics. */
export function createDefaultMeta(): MetaProgress {
  return {
    endlessUnlocked: false,
    achievements: [],
    cosmetics: ['classicAwning'],
    scenarios: ['lanewayClassic'],
    records: [],
  };
}

/** Wrap application state in the first versioned save contract. */
export function createSaveEnvelope(
  activeRun: GameState | null,
  preferences: Preferences = createDefaultPreferences(),
  meta: MetaProgress = createDefaultMeta(),
): SaveEnvelope {
  return {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    activeRun,
    preferences,
    meta,
  };
}

export interface LoadSaveResult {
  envelope: SaveEnvelope | null;
  source: 'primary' | 'backup' | 'empty';
  warning: string | null;
}

/** Error surfaced when browser persistence cannot safely complete. */
export class SaveStoreError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SaveStoreError';
  }
}

/**
 * Browser-local, last-known-good save adapter.
 *
 * The pure game engine never imports or reads this class.
 */
export class BrowserSaveStore {
  public constructor(private readonly storage: Storage = window.localStorage) {}

  /** Save an envelope while retaining the previous verified payload as backup. */
  public save(envelope: SaveEnvelope): void {
    const serialized = JSON.stringify(envelope);
    const previous = this.storage.getItem(SAVE_KEY);
    try {
      if (previous && parseEnvelope(previous)) this.storage.setItem(BACKUP_SAVE_KEY, previous);
      this.storage.setItem(SAVE_KEY, serialized);
      if (this.storage.getItem(SAVE_KEY) !== serialized) {
        throw new SaveStoreError('The browser did not verify the autosave write.');
      }
    } catch (error) {
      if (previous !== null) {
        try {
          this.storage.setItem(SAVE_KEY, previous);
        } catch {
          // The original write error below remains the actionable failure.
        }
      }
      if (error instanceof SaveStoreError) throw error;
      throw new SaveStoreError('The browser could not store this autosave.', { cause: error });
    }
  }

  /** Load the primary save, falling back to a verified backup when necessary. */
  public load(): LoadSaveResult {
    const primary = this.storage.getItem(SAVE_KEY);
    const primaryEnvelope = primary ? parseEnvelope(primary) : null;
    if (primaryEnvelope) return { envelope: primaryEnvelope, source: 'primary', warning: null };
    const backup = this.storage.getItem(BACKUP_SAVE_KEY);
    const backupEnvelope = backup ? parseEnvelope(backup) : null;
    if (backupEnvelope) {
      return {
        envelope: backupEnvelope,
        source: 'backup',
        warning: 'The latest autosave was unreadable, so the last-known-good save was restored.',
      };
    }
    return {
      envelope: null,
      source: 'empty',
      warning: primary || backup ? 'No valid local save could be read.' : null,
    };
  }

  /** Remove the active and backup run from this browser. */
  public clear(): void {
    this.storage.removeItem(SAVE_KEY);
    this.storage.removeItem(BACKUP_SAVE_KEY);
  }
}

/** Parse and minimally validate a Phase 1 save without executing imported data. */
export function parseEnvelope(serialized: string): SaveEnvelope | null {
  try {
    const value: unknown = JSON.parse(serialized);
    if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.savedAt !== 'string')
      return null;
    if (!isRecord(value.preferences) || !isRecord(value.meta)) return null;
    if (value.activeRun !== null && !isGameStateShape(value.activeRun)) return null;
    return value as unknown as SaveEnvelope;
  } catch {
    return null;
  }
}

function isGameStateShape(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  return (
    value.stateVersion === 1 &&
    typeof value.campaignId === 'string' &&
    typeof value.seed === 'number' &&
    typeof value.day === 'number' &&
    typeof value.cashCents === 'number' &&
    typeof value.phase === 'string' &&
    isRecord(value.plan) &&
    isRecord(value.inventory)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
