import {
  ALL_DRINK_IDS,
  CAMPAIGN_RULES,
  INGREDIENT_DETAILS,
  INGREDIENT_IDS,
  MAX_INVENTORY_BATCHES_PER_INGREDIENT,
  PURCHASE_PACKAGES,
  RUSH_ACTIVITY_LIMIT,
} from '../content/gameContent';
import { batchExpiryDay } from '../game/inventory';
import type {
  AchievementId,
  CampaignOutcome,
  CampaignRecord,
  CosmeticId,
  Customer,
  CustomerSegment,
  DayPlan,
  DayReport,
  EquipmentId,
  GamePhase,
  GameState,
  IngredientId,
  IngredientTotals,
  MetaProgress,
  Preferences,
  RushState,
  SaveEnvelope,
  ScenarioId,
  StaffMember,
  VenueId,
} from '../game';

export const SAVE_KEY = 'laneway-tycoon.save.v3';
export const BACKUP_SAVE_KEY = 'laneway-tycoon.save.backup.v3';
export const LEGACY_V2_SAVE_KEY = 'laneway-tycoon.save.v2';
export const LEGACY_V2_BACKUP_SAVE_KEY = 'laneway-tycoon.save.backup.v2';
export const LEGACY_SAVE_KEY = 'laneway-tycoon.save.v1';
export const LEGACY_BACKUP_SAVE_KEY = 'laneway-tycoon.save.backup.v1';

const GAME_PHASES: GamePhase[] = [
  'planning',
  'rush',
  'event',
  'report',
  'reinvest',
  'victory',
  'defeat',
];
const SEGMENTS: CustomerSegment[] = ['commuter', 'student', 'enthusiast', 'regular'];
const VENUES: VenueId[] = ['cart', 'kiosk', 'cafe'];
const SCENARIOS: ScenarioId[] = ['lanewayClassic', 'rainySeason', 'festivalWeek'];
const COSMETICS: CosmeticId[] = ['classicAwning', 'wattleAwning', 'neonCup'];
const ACHIEVEMENTS: AchievementId[] = ['cafeFounder', 'goldenCup', 'hardLessons'];
const EQUIPMENT_IDS: EquipmentId[] = [
  'grinder',
  'espressoMachine',
  'batchBrewer',
  'refrigeration',
  'pos',
  'serviceCounter',
];

/** User-facing preferences with audio disabled until explicit interaction. */
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

/** Wrap application state in the current versioned save contract. */
export function createSaveEnvelope(
  activeRun: GameState | null,
  preferences: Preferences = createDefaultPreferences(),
  meta: MetaProgress = createDefaultMeta(),
): SaveEnvelope {
  return {
    schemaVersion: 3,
    savedAt: new Date().toISOString(),
    activeRun,
    preferences,
    meta,
  };
}

export interface LoadSaveResult {
  envelope: SaveEnvelope | null;
  source: 'primary' | 'backup' | 'legacy-v2' | 'legacy-v1' | 'empty';
  warning: string | null;
  recoveryAvailable: boolean;
}

/** Error surfaced when browser persistence cannot safely complete. */
export class SaveStoreError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SaveStoreError';
  }
}

/** Error surfaced for malformed, oversized, or incompatible imported data. */
export class SaveValidationError extends Error {
  public constructor(
    message: string,
    public readonly code: 'malformed' | 'tooLarge' | 'unknownVersion' | 'invalidSchema',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SaveValidationError';
  }
}

/**
 * Browser-local, last-known-good save adapter.
 *
 * The pure game engine never imports or reads this class.
 */
export class BrowserSaveStore {
  public constructor(private readonly storage: Storage = window.localStorage) {}

  /** Save a validated envelope while retaining the previous verified payload. */
  public save(envelope: SaveEnvelope): void {
    const serialized = serializeEnvelope(envelope);
    const previous = this.storage.getItem(SAVE_KEY);
    try {
      const previousEnvelope = previous ? parseEnvelope(previous) : null;
      if (previousEnvelope) {
        this.storage.setItem(BACKUP_SAVE_KEY, serializeEnvelope(previousEnvelope));
      } else {
        const legacy = this.firstValidLegacyEnvelope();
        if (legacy) this.storage.setItem(BACKUP_SAVE_KEY, serializeEnvelope(legacy));
      }
      this.storage.setItem(SAVE_KEY, serialized);
      const verified = this.storage.getItem(SAVE_KEY);
      if (verified !== serialized || !parseEnvelope(verified)) {
        throw new SaveStoreError('The browser did not verify the autosave write.');
      }
    } catch (error) {
      if (previous !== null) {
        try {
          this.storage.setItem(SAVE_KEY, previous);
        } catch {
          // The original write error remains the actionable failure.
        }
      }
      if (error instanceof SaveStoreError || error instanceof SaveValidationError) throw error;
      throw new SaveStoreError('The browser could not store this autosave.', { cause: error });
    }
  }

  /** Load current, backup, or supported legacy data in recovery order. */
  public load(): LoadSaveResult {
    const primaryRaw = this.storage.getItem(SAVE_KEY);
    const primary = primaryRaw ? parseEnvelope(primaryRaw) : null;
    if (primary) {
      return { envelope: primary, source: 'primary', warning: null, recoveryAvailable: false };
    }

    const backupRaw = this.storage.getItem(BACKUP_SAVE_KEY);
    const backup = backupRaw ? parseEnvelope(backupRaw) : null;
    if (backup) {
      return {
        envelope: backup,
        source: 'backup',
        warning: 'The latest autosave was unreadable, so the last-known-good save was restored.',
        recoveryAvailable: true,
      };
    }

    for (const [key, source, isBackup] of [
      [LEGACY_V2_SAVE_KEY, 'legacy-v2', false],
      [LEGACY_V2_BACKUP_SAVE_KEY, 'legacy-v2', true],
      [LEGACY_SAVE_KEY, 'legacy-v1', false],
      [LEGACY_BACKUP_SAVE_KEY, 'legacy-v1', true],
    ] as const) {
      const legacyRaw = this.storage.getItem(key);
      const legacy = legacyRaw ? parseEnvelope(legacyRaw) : null;
      if (legacy) {
        return {
          envelope: legacy,
          source,
          warning: isBackup
            ? `The old version ${source === 'legacy-v2' ? '2' : '1'} primary was unreadable, so its last-known-good backup was migrated.`
            : source === 'legacy-v2'
              ? 'A version 2 save was safely migrated to dated stock batches.'
              : 'A version 1 save was safely migrated to the current format.',
          recoveryAvailable: isBackup,
        };
      }
    }

    const hadData = [
      primaryRaw,
      backupRaw,
      this.storage.getItem(LEGACY_V2_SAVE_KEY),
      this.storage.getItem(LEGACY_V2_BACKUP_SAVE_KEY),
      this.storage.getItem(LEGACY_SAVE_KEY),
      this.storage.getItem(LEGACY_BACKUP_SAVE_KEY),
    ].some(Boolean);
    return {
      envelope: null,
      source: 'empty',
      warning: hadData
        ? 'No compatible local save could be read. Import a backup or start a clean campaign.'
        : null,
      recoveryAvailable: false,
    };
  }

  /** Replace an unreadable primary with its validated last-known-good backup. */
  public restoreBackup(): SaveEnvelope {
    const backup = [BACKUP_SAVE_KEY, LEGACY_V2_BACKUP_SAVE_KEY, LEGACY_BACKUP_SAVE_KEY]
      .map((key) => this.storage.getItem(key))
      .map((raw) => (raw ? parseEnvelope(raw) : null))
      .find((candidate): candidate is SaveEnvelope => candidate !== null);
    if (!backup) throw new SaveStoreError('No valid last-known-good save is available.');
    this.storage.setItem(SAVE_KEY, serializeEnvelope(backup));
    return backup;
  }

  /** Remove current, backup, and legacy runs from this browser. */
  public clear(): void {
    this.storage.removeItem(SAVE_KEY);
    this.storage.removeItem(BACKUP_SAVE_KEY);
    this.storage.removeItem(LEGACY_V2_SAVE_KEY);
    this.storage.removeItem(LEGACY_V2_BACKUP_SAVE_KEY);
    this.storage.removeItem(LEGACY_SAVE_KEY);
    this.storage.removeItem(LEGACY_BACKUP_SAVE_KEY);
  }

  private firstValidLegacyEnvelope(): SaveEnvelope | null {
    for (const key of [
      LEGACY_V2_SAVE_KEY,
      LEGACY_V2_BACKUP_SAVE_KEY,
      LEGACY_SAVE_KEY,
      LEGACY_BACKUP_SAVE_KEY,
    ]) {
      const raw = this.storage.getItem(key);
      const envelope = raw ? parseEnvelope(raw) : null;
      if (envelope) return envelope;
    }
    return null;
  }
}

/** Parse, migrate, and fully validate untrusted serialized save data. */
export function importEnvelope(serialized: string): SaveEnvelope {
  if (new TextEncoder().encode(serialized).byteLength > CAMPAIGN_RULES.maximumSaveBytes) {
    throw new SaveValidationError(
      `Save files must be smaller than ${Math.round(CAMPAIGN_RULES.maximumSaveBytes / 1_000)} KB.`,
      'tooLarge',
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch (error) {
    throw new SaveValidationError('The selected file is not valid JSON.', 'malformed', {
      cause: error,
    });
  }
  if (!isRecord(value)) {
    throw new SaveValidationError('The save must contain one JSON object.', 'invalidSchema');
  }
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3) {
    throw new SaveValidationError(
      `Save schema ${String(value.schemaVersion)} is not supported by this version.`,
      'unknownVersion',
    );
  }
  const versionTwo = value.schemaVersion === 1 ? migrateVersionOne(value) : value;
  const migrated = versionTwo.schemaVersion === 2 ? migrateVersionTwo(versionTwo) : versionTwo;
  const normalized = normalizeVersionThree(migrated);
  validateEnvelope(normalized);
  return normalized as unknown as SaveEnvelope;
}

/** Return null for invalid storage payloads; use importEnvelope for actionable errors. */
export function parseEnvelope(serialized: string): SaveEnvelope | null {
  try {
    return importEnvelope(serialized);
  } catch {
    return null;
  }
}

/** Produce canonical, bounded JSON for browser storage and file export. */
export function serializeEnvelope(envelope: SaveEnvelope): string {
  const serialized = JSON.stringify(envelope, null, 2);
  importEnvelope(serialized);
  return serialized;
}

function migrateVersionOne(value: Record<string, unknown>): Record<string, unknown> {
  const activeRun = isRecord(value.activeRun) ? value.activeRun : value.activeRun;
  const migratedRun = isRecord(activeRun)
    ? {
        ...activeRun,
        stateVersion: 2,
        rush: isRecord(activeRun.rush)
          ? { ...activeRun.rush, wageCostCents: finiteOr(activeRun.rush.wageCostCents, 0) }
          : activeRun.rush,
        report: migrateVersionOneReport(activeRun.report),
        history: Array.isArray(activeRun.history)
          ? activeRun.history.map((report) => migrateVersionOneReport(report))
          : activeRun.history,
      }
    : activeRun;
  const meta = isRecord(value.meta) ? value.meta : {};
  return {
    ...value,
    schemaVersion: 2,
    activeRun: migratedRun,
    preferences: isRecord(value.preferences) ? value.preferences : createDefaultPreferences(),
    meta: {
      ...createDefaultMeta(),
      ...meta,
      achievements: Array.isArray(meta.achievements)
        ? meta.achievements.filter((id): id is AchievementId =>
            ACHIEVEMENTS.includes(id as AchievementId),
          )
        : [],
    },
  };
}

function migrateVersionOneReport(value: unknown): unknown {
  return isRecord(value) ? { ...value, wageCostCents: finiteOr(value.wageCostCents, 0) } : value;
}

function migrateVersionTwo(value: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(value.activeRun)) return { ...value, schemaVersion: 3 };
  const activeRun = value.activeRun;
  const day = boundedIntegerOr(activeRun.day, 1, 1, 10_000);
  const equipment = isRecord(activeRun.equipment) ? activeRun.equipment : {};
  const refrigeration = boundedIntegerOr(equipment.refrigeration, 0, 0, 2);
  const flatInventory = activeRun.inventory;
  const migratedInventory = migrateFlatInventory(flatInventory, day, refrigeration);
  const currentTotals = legacyInventoryTotals(flatInventory);
  const purchased = legacyPurchaseTotals(activeRun.plan);
  const report = migrateVersionTwoReport(activeRun.report);
  const rush = isRecord(activeRun.rush)
    ? migrateVersionTwoRush(activeRun.rush, currentTotals, purchased, activeRun.report)
    : activeRun.rush;
  return {
    ...value,
    schemaVersion: 3,
    activeRun: {
      ...activeRun,
      stateVersion: 3,
      inventory: migratedInventory,
      rush,
      report,
      history: Array.isArray(activeRun.history)
        ? activeRun.history.map((historyReport) => migrateVersionTwoReport(historyReport))
        : activeRun.history,
    },
  };
}

function migrateVersionTwoRush(
  value: Record<string, unknown>,
  current: IngredientTotals,
  purchased: IngredientTotals,
  reportValue: unknown,
): Record<string, unknown> {
  const stats = isRecord(value.stats) ? value.stats : {};
  const consumed = boundedTotalsFromUnknown(stats.consumed);
  const report = isRecord(reportValue) ? reportValue : {};
  const expired = boundedTotalsFromUnknown(report.waste);
  const opening = emptyTotalsRecord();
  for (const ingredientId of INGREDIENT_IDS) {
    opening[ingredientId] = Math.max(
      0,
      current[ingredientId] +
        consumed[ingredientId] +
        expired[ingredientId] -
        purchased[ingredientId],
    );
  }
  return {
    ...value,
    wageCostCents: finiteOr(value.wageCostCents, 0),
    recentActivity: value.recentActivity === undefined ? [] : value.recentActivity,
    openingInventory: opening,
    purchasedInventory: purchased,
  };
}

function migrateVersionTwoReport(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return {
    ...value,
    wageCostCents: finiteOr(value.wageCostCents, 0),
    inventoryLifecycle: null,
  };
}

function normalizeVersionThree(value: Record<string, unknown>): Record<string, unknown> {
  return value;
}

function migrateFlatInventory(value: unknown, day: number, refrigerationTier: number): unknown {
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    INGREDIENT_IDS.map((ingredientId) => {
      const quantity = value[ingredientId];
      return [
        ingredientId,
        quantity === 0
          ? []
          : [
              {
                quantity,
                acquiredDay: day,
                expiresAfterDay: batchExpiryDay(ingredientId, day, refrigerationTier),
              },
            ],
      ];
    }),
  );
}

function legacyInventoryTotals(value: unknown): IngredientTotals {
  const inventory = isRecord(value) ? value : {};
  const totals = emptyTotalsRecord();
  for (const ingredientId of INGREDIENT_IDS) {
    totals[ingredientId] = boundedNumberOr(inventory[ingredientId], 0, 0, 1_000_000_000);
  }
  return totals;
}

function legacyPurchaseTotals(value: unknown): IngredientTotals {
  const plan = isRecord(value) ? value : {};
  const purchases = isRecord(plan.purchases) ? plan.purchases : {};
  const totals = emptyTotalsRecord();
  for (const item of PURCHASE_PACKAGES) {
    const packages = boundedIntegerOr(purchases[item.ingredientId], 0, 0, 20);
    totals[item.ingredientId] = packages * item.amount;
  }
  return totals;
}

function boundedTotalsFromUnknown(value: unknown): IngredientTotals {
  const record = isRecord(value) ? value : {};
  const totals = emptyTotalsRecord();
  for (const ingredientId of INGREDIENT_IDS) {
    totals[ingredientId] = boundedNumberOr(record[ingredientId], 0, 0, 1_000_000_000);
  }
  return totals;
}

function emptyTotalsRecord(): IngredientTotals {
  return Object.fromEntries(
    INGREDIENT_IDS.map((ingredientId) => [ingredientId, 0]),
  ) as IngredientTotals;
}

function boundedIntegerOr(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : fallback;
}

function boundedNumberOr(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

function validateEnvelope(value: Record<string, unknown>): void {
  assert(value.schemaVersion === 3, 'Save schema must be version 3.');
  assertString(value.savedAt, 'savedAt', 64);
  assert(!Number.isNaN(Date.parse(value.savedAt)), 'savedAt must be an ISO date.');
  validatePreferences(value.preferences);
  validateMeta(value.meta);
  if (value.activeRun !== null) validateGameState(value.activeRun);
}

function validatePreferences(value: unknown): asserts value is Preferences {
  const record = expectRecord(value, 'preferences');
  for (const key of ['soundEnabled', 'ambienceEnabled', 'reducedMotion', 'onboardingComplete']) {
    assert(typeof record[key] === 'boolean', `preferences.${key} must be boolean.`);
  }
  assertString(record.activeTab, 'preferences.activeTab', 32);
}

function validateMeta(value: unknown): asserts value is MetaProgress {
  const record = expectRecord(value, 'meta');
  assert(typeof record.endlessUnlocked === 'boolean', 'meta.endlessUnlocked must be boolean.');
  assertEnumArray(record.achievements, ACHIEVEMENTS, 20, 'meta.achievements');
  assertEnumArray(record.cosmetics, COSMETICS, 10, 'meta.cosmetics');
  assertEnumArray(record.scenarios, SCENARIOS, 10, 'meta.scenarios');
  const records = expectArray(record.records, 'meta.records', 50);
  records.forEach((item, index) => validateCampaignRecord(item, `meta.records[${index}]`));
}

function validateCampaignRecord(value: unknown, path: string): asserts value is CampaignRecord {
  const record = expectRecord(value, path);
  assertSafeId(record.campaignId, `${path}.campaignId`);
  assertEnum(record.result, ['victory', 'bankruptcy', 'targetMissed'], `${path}.result`);
  assertNumber(record.day, `${path}.day`, 1, 10_000, true);
  assertNumber(record.cashCents, `${path}.cashCents`, -1_000_000_000, 1_000_000_000, true);
  assertNumber(record.reputation, `${path}.reputation`, 0, 100, true);
  assertEnum(record.venueId, VENUES, `${path}.venueId`);
}

function validateGameState(value: unknown): asserts value is GameState {
  const state = expectRecord(value, 'activeRun');
  assert(state.stateVersion === 3, 'activeRun.stateVersion must be 3.');
  assertSafeId(state.campaignId, 'activeRun.campaignId');
  assertNumber(state.seed, 'activeRun.seed', 0, 0xffff_ffff, true);
  assertNumber(state.rngState, 'activeRun.rngState', 0, 0xffff_ffff, true);
  assertEnum(state.scenarioId, SCENARIOS, 'activeRun.scenarioId');
  assertEnum(state.mode, ['campaign', 'endless'], 'activeRun.mode');
  assertEnum(state.phase, GAME_PHASES, 'activeRun.phase');
  assertNumber(state.day, 'activeRun.day', 1, 10_000, true);
  assertNumber(state.cashCents, 'activeRun.cashCents', -1_000_000_000, 1_000_000_000, true);
  assertNumber(state.reputation, 'activeRun.reputation', 0, 100, true);
  assertEnum(state.venueId, VENUES, 'activeRun.venueId');
  assertEnum(state.weather, ['mild', 'sunny', 'rainy', 'coldSnap'], 'activeRun.weather');
  validateInventory(state.inventory, 'activeRun.inventory', state.day);
  validatePlan(state.plan);
  if (state.rush !== null) validateRush(state.rush);
  if (state.report !== null) validateReport(state.report, 'activeRun.report');
  assertNumber(state.lastSettledDay, 'activeRun.lastSettledDay', 0, 10_000, true);
  expectArray(state.staff, 'activeRun.staff', 8).forEach((member, index) =>
    validateStaff(member, `activeRun.staff[${index}]`),
  );
  expectArray(state.candidateStaff, 'activeRun.candidateStaff', 4).forEach((member, index) =>
    validateStaff(member, `activeRun.candidateStaff[${index}]`),
  );
  validateEquipment(state.equipment);
  const improvements = expectArray(state.improvements, 'activeRun.improvements', 20);
  improvements.forEach((item, index) => assertString(item, `activeRun.improvements[${index}]`, 40));
  expectArray(state.history, 'activeRun.history', CAMPAIGN_RULES.maximumHistoryDays).forEach(
    (report, index) => validateReport(report, `activeRun.history[${index}]`),
  );
  if (state.outcome !== null) validateOutcome(state.outcome);
}

function validatePlan(value: unknown): asserts value is DayPlan {
  const plan = expectRecord(value, 'activeRun.plan');
  assertEnumArray(plan.activeMenu, ALL_DRINK_IDS, 10, 'activeRun.plan.activeMenu', 1);
  const prices = expectRecord(plan.pricesCents, 'activeRun.plan.pricesCents');
  for (const id of ALL_DRINK_IDS) assertNumber(prices[id], `price.${id}`, 250, 1_200, true);
  const purchases = expectRecord(plan.purchases, 'activeRun.plan.purchases');
  for (const id of INGREDIENT_IDS) assertNumber(purchases[id], `purchase.${id}`, 0, 20, true);
  assertEnum(plan.dialIn, ['speed', 'balanced', 'quality'], 'activeRun.plan.dialIn');
  assertEnum(
    plan.beanId,
    ['houseBeans', 'singleOriginBeans', 'darkRoastBeans'],
    'activeRun.plan.beanId',
  );
  const scheduled = expectArray(plan.scheduledStaffIds, 'activeRun.plan.scheduledStaffIds', 5);
  scheduled.forEach((id, index) => assertSafeId(id, `scheduledStaffIds[${index}]`));
  assert(new Set(scheduled).size === scheduled.length, 'Scheduled staff IDs must be unique.');
}

function validateRush(value: unknown): asserts value is RushState {
  const rush = expectRecord(value, 'activeRun.rush');
  assertNumber(rush.tick, 'rush.tick', 0, 2_000, true);
  assertNumber(rush.durationTicks, 'rush.durationTicks', 1, 2_000, true);
  assert(typeof rush.isPaused === 'boolean', 'rush.isPaused must be boolean.');
  assertEnum(rush.speed, [1, 2, 4], 'rush.speed');
  expectArray(rush.queue, 'rush.queue', 30).forEach((customer, index) =>
    validateCustomer(customer, `rush.queue[${index}]`),
  );
  if (rush.activeService !== null) {
    const service = expectRecord(rush.activeService, 'rush.activeService');
    validateCustomer(service.customer, 'rush.activeService.customer');
    assertNumber(service.remainingTicks, 'service.remainingTicks', 0, 2_000, true);
    assertNumber(service.totalTicks, 'service.totalTicks', 1, 2_000, true);
  }
  if (rush.pendingEvent !== null) validateEvent(rush.pendingEvent);
  expectArray(rush.resolvedEvents, 'rush.resolvedEvents', 10).forEach((event, index) => {
    const record = expectRecord(event, `rush.resolvedEvents[${index}]`);
    assertSafeId(record.eventId, `resolvedEvents[${index}].eventId`);
    assertSafeId(record.choiceId, `resolvedEvents[${index}].choiceId`);
    assertString(record.summary, `resolvedEvents[${index}].summary`, 240);
  });
  expectArray(rush.eventTriggerTicks, 'rush.eventTriggerTicks', 2).forEach((tick, index) =>
    assertNumber(tick, `eventTriggerTicks[${index}]`, 0, 2_000, true),
  );
  for (const key of [
    'nextCustomerId',
    'openingCashCents',
    'purchaseCostCents',
    'wageCostCents',
    'operatingCostCents',
    'eventCashDeltaCents',
    'eventReputationDelta',
  ]) {
    assertNumber(rush[key], `rush.${key}`, -1_000_000_000, 1_000_000_000, true);
  }
  for (const key of ['demandMultiplier', 'qualityBonus']) {
    assertNumber(rush[key], `rush.${key}`, -10_000, 10_000);
  }
  validateIngredientTotals(rush.openingInventory, 'rush.openingInventory');
  validateIngredientTotals(rush.purchasedInventory, 'rush.purchasedInventory');
  expectArray(rush.recentActivity, 'rush.recentActivity', RUSH_ACTIVITY_LIMIT).forEach(
    (activity, index) => validateCompletedSaleActivity(activity, `rush.recentActivity[${index}]`),
  );
  validateRushStats(rush.stats);
}

function validateCompletedSaleActivity(value: unknown, path: string): void {
  const activity = expectRecord(value, path);
  assert(activity.type === 'sale', `${path}.type is not supported.`);
  assertNumber(activity.tick, `${path}.tick`, 0, 2_000, true);
  assertEnum(activity.drinkId, ALL_DRINK_IDS, `${path}.drinkId`);
  assertEnum(activity.size, ['regular', 'large'], `${path}.size`);
  assertEnum(activity.milk, ['none', 'dairy', 'oat', 'soy'], `${path}.milk`);
  assertNumber(activity.priceCents, `${path}.priceCents`, 0, 10_000, true);
}

function validateRushStats(value: unknown): void {
  const stats = expectRecord(value, 'rush.stats');
  for (const key of [
    'arrivals',
    'served',
    'abandoned',
    'stockouts',
    'revenueCents',
    'ingredientCostCents',
    'totalWaitTicks',
    'satisfactionTotal',
    'peakQueue',
  ]) {
    assertNumber(stats[key], `rush.stats.${key}`, 0, 1_000_000_000);
  }
  validateBoundedNumberRecord(stats.soldByDrink, ALL_DRINK_IDS, 'rush.stats.soldByDrink');
  validateBoundedNumberRecord(stats.consumed, INGREDIENT_IDS, 'rush.stats.consumed');
  validateBoundedNumberRecord(stats.arrivalsBySegment, SEGMENTS, 'rush.stats.arrivalsBySegment');
  validateBoundedNumberRecord(stats.servedBySegment, SEGMENTS, 'rush.stats.servedBySegment');
}

function validateCustomer(value: unknown, path: string): asserts value is Customer {
  const customer = expectRecord(value, path);
  assertSafeId(customer.id, `${path}.id`);
  assertEnum(customer.segment, SEGMENTS, `${path}.segment`);
  const order = expectRecord(customer.order, `${path}.order`);
  assertEnum(order.drinkId, ALL_DRINK_IDS, `${path}.order.drinkId`);
  assertEnum(order.size, ['regular', 'large'], `${path}.order.size`);
  assertEnum(order.milk, ['none', 'dairy', 'oat', 'soy'], `${path}.order.milk`);
  assertNumber(order.priceCents, `${path}.order.priceCents`, 0, 10_000, true);
  const ingredients = expectArray(order.ingredientAmounts, `${path}.order.ingredientAmounts`, 12);
  ingredients.forEach((item, index) => {
    const ingredient = expectRecord(item, `${path}.ingredients[${index}]`);
    assertEnum(ingredient.ingredientId, INGREDIENT_IDS, `${path}.ingredientId`);
    assertNumber(ingredient.amount, `${path}.amount`, 0, 1_000_000);
  });
  assertNumber(order.preparationTicks, `${path}.order.preparationTicks`, 1, 2_000, true);
  for (const key of ['arrivedAtTick', 'patienceTicks', 'waitedTicks']) {
    assertNumber(customer[key], `${path}.${key}`, 0, 2_000, true);
  }
}

function validateEvent(value: unknown): void {
  const event = expectRecord(value, 'rush.pendingEvent');
  assertSafeId(event.id, 'event.id');
  assertString(event.title, 'event.title', 160);
  assertString(event.description, 'event.description', 500);
  expectArray(event.choices, 'event.choices', 4).forEach((choice, index) => {
    const record = expectRecord(choice, `event.choices[${index}]`);
    assertSafeId(record.id, `event.choices[${index}].id`);
    assertString(record.label, `event.choices[${index}].label`, 120);
    assertString(record.description, `event.choices[${index}].description`, 500);
    const effect = expectRecord(record.effect, `event.choices[${index}].effect`);
    for (const effectValue of Object.values(effect)) {
      assertNumber(effectValue, 'event effect', -1_000_000, 1_000_000);
    }
  });
}

function validateReport(value: unknown, path: string): asserts value is DayReport {
  const report = expectRecord(value, path);
  for (const key of [
    'day',
    'openingCashCents',
    'purchaseCostCents',
    'revenueCents',
    'ingredientCostCents',
    'wageCostCents',
    'operatingCostCents',
    'eventCashDeltaCents',
    'netCashFlowCents',
    'closingCashCents',
    'arrivals',
    'served',
    'abandoned',
    'stockouts',
    'averageWaitSeconds',
    'satisfactionPercent',
    'reputationChange',
  ]) {
    assertNumber(report[key], `${path}.${key}`, -1_000_000_000, 1_000_000_000);
  }
  assertEnum(report.weather, ['mild', 'sunny', 'rainy', 'coldSnap'], `${path}.weather`);
  validateBoundedNumberRecord(report.waste, INGREDIENT_IDS, `${path}.waste`);
  validateIngredientTotals(report.remainingInventory, `${path}.remainingInventory`);
  if (report.inventoryLifecycle !== null) {
    const lifecycle = expectRecord(report.inventoryLifecycle, `${path}.inventoryLifecycle`);
    for (const key of ['opening', 'purchased', 'consumed', 'expired', 'remaining']) {
      validateIngredientTotals(lifecycle[key], `${path}.inventoryLifecycle.${key}`);
    }
    const opening = lifecycle.opening as IngredientTotals;
    const purchased = lifecycle.purchased as IngredientTotals;
    const consumed = lifecycle.consumed as IngredientTotals;
    const expired = lifecycle.expired as IngredientTotals;
    const remaining = lifecycle.remaining as IngredientTotals;
    const reportRemaining = report.remainingInventory as IngredientTotals;
    const waste = report.waste as Partial<Record<IngredientId, number>>;
    for (const ingredientId of INGREDIENT_IDS) {
      assert(
        opening[ingredientId] +
          purchased[ingredientId] -
          consumed[ingredientId] -
          expired[ingredientId] ===
          remaining[ingredientId],
        `${path}.inventoryLifecycle.${ingredientId} does not conserve quantity.`,
      );
      assert(
        remaining[ingredientId] === reportRemaining[ingredientId],
        `${path}.remainingInventory.${ingredientId} does not match lifecycle evidence.`,
      );
      assert(
        expired[ingredientId] === (waste[ingredientId] ?? 0),
        `${path}.waste.${ingredientId} does not match expiry evidence.`,
      );
    }
  }
  validateBoundedNumberRecord(report.servedBySegment, SEGMENTS, `${path}.servedBySegment`);
  assertString(report.bottleneck, `${path}.bottleneck`, 300);
  expectArray(report.explanations, `${path}.explanations`, 30).forEach((item, index) =>
    assertString(item, `${path}.explanations[${index}]`, 500),
  );
  assert(typeof report.settled === 'boolean', `${path}.settled must be boolean.`);
}

function validateInventory(value: unknown, path: string, currentDay: number): void {
  const inventory = expectRecord(value, path);
  for (const id of INGREDIENT_IDS) {
    const batches = expectArray(
      inventory[id],
      `${path}.${id}`,
      MAX_INVENTORY_BATCHES_PER_INGREDIENT,
    );
    let total = 0;
    for (const [index, value] of batches.entries()) {
      const batch = expectRecord(value, `${path}.${id}[${index}]`);
      assertNumber(batch.quantity, `${path}.${id}[${index}].quantity`, 1, 1_000_000_000, true);
      assertNumber(batch.acquiredDay, `${path}.${id}[${index}].acquiredDay`, 1, currentDay, true);
      assertNumber(
        batch.expiresAfterDay,
        `${path}.${id}[${index}].expiresAfterDay`,
        Math.max(batch.acquiredDay, currentDay),
        batchExpiryDay(id, batch.acquiredDay, INGREDIENT_DETAILS[id].chilled ? 2 : 0),
        true,
      );
      total += batch.quantity;
    }
    assertNumber(total, `${path}.${id} total`, 0, 1_000_000_000, true);
  }
}

function validateIngredientTotals(value: unknown, path: string): void {
  const totals = expectRecord(value, path);
  assert(Object.keys(totals).length === INGREDIENT_IDS.length, `${path} must be complete.`);
  for (const id of INGREDIENT_IDS)
    assertNumber(totals[id], `${path}.${id}`, 0, 1_000_000_000, true);
}

function validateStaff(value: unknown, path: string): asserts value is StaffMember {
  const member = expectRecord(value, path);
  assertSafeId(member.id, `${path}.id`);
  assertString(member.name, `${path}.name`, 80);
  assertEnum(member.role, ['barista', 'frontOfHouse'], `${path}.role`);
  assertNumber(member.speed, `${path}.speed`, 0, 100, true);
  assertNumber(member.skill, `${path}.skill`, 0, 100, true);
  assertNumber(member.wageCents, `${path}.wageCents`, 0, 100_000, true);
  assertEnum(
    member.trait,
    ['quickHands', 'peoplePerson', 'perfectionist', 'steady'],
    `${path}.trait`,
  );
  assertNumber(member.hiredOnDay, `${path}.hiredOnDay`, 0, 10_000, true);
}

function validateEquipment(value: unknown): void {
  const equipment = expectRecord(value, 'activeRun.equipment');
  for (const id of EQUIPMENT_IDS) assertNumber(equipment[id], `equipment.${id}`, 0, 2, true);
}

function validateOutcome(value: unknown): asserts value is CampaignOutcome {
  const outcome = expectRecord(value, 'activeRun.outcome');
  assertEnum(outcome.type, ['victory', 'bankruptcy', 'targetMissed'], 'outcome.type');
  assertString(outcome.title, 'outcome.title', 200);
  assertString(outcome.message, 'outcome.message', 1_000);
}

function validateBoundedNumberRecord(
  value: unknown,
  allowedKeys: readonly string[],
  path: string,
): void {
  const record = expectRecord(value, path);
  assert(Object.keys(record).length <= allowedKeys.length, `${path} has too many entries.`);
  for (const [key, amount] of Object.entries(record)) {
    assert(allowedKeys.includes(key), `${path}.${key} is unknown.`);
    assertNumber(amount, `${path}.${key}`, 0, 1_000_000_000);
  }
}

function expectRecord(value: unknown, path: string): Record<string, unknown> {
  assert(isRecord(value), `${path} must be an object.`);
  return value;
}

function expectArray(value: unknown, path: string, maximum: number): unknown[] {
  assert(Array.isArray(value), `${path} must be an array.`);
  assert(value.length <= maximum, `${path} exceeds its ${maximum}-item limit.`);
  return value;
}

function assertEnum<T>(value: unknown, values: readonly T[], path: string): asserts value is T {
  assert(values.includes(value as T), `${path} is not supported.`);
}

function assertEnumArray<T>(
  value: unknown,
  values: readonly T[],
  maximum: number,
  path: string,
  minimum = 0,
): void {
  const items = expectArray(value, path, maximum);
  assert(items.length >= minimum, `${path} requires at least ${minimum} item.`);
  items.forEach((item, index) => assertEnum(item, values, `${path}[${index}]`));
  assert(new Set(items).size === items.length, `${path} entries must be unique.`);
}

function assertSafeId(value: unknown, path: string): void {
  assertString(value, path, 100);
  assert(/^[\p{L}\p{N}._’ -]+$/u.test(value), `${path} contains unsafe characters.`);
}

function assertString(value: unknown, path: string, maximum: number): asserts value is string {
  assert(
    typeof value === 'string' && value.length > 0 && value.length <= maximum,
    `${path} is invalid.`,
  );
}

function assertNumber(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
  integer = false,
): asserts value is number {
  assert(
    typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= minimum &&
      value <= maximum &&
      (!integer || Number.isInteger(value)),
    `${path} is outside its allowed bounds.`,
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new SaveValidationError(message, 'invalidSchema');
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
