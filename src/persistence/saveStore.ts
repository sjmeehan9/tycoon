import {
  ALL_DRINK_IDS,
  CAMPAIGN_RULES,
  EVENT_TEMPLATES,
  EVENT_TEMPLATE_IDS,
  DRINK_MAP,
  EQUIPMENT,
  EQUIPMENT_IDS,
  INGREDIENT_DETAILS,
  INGREDIENT_IDS,
  INGREDIENT_UNIT_COST_CENTS,
  IMPROVEMENT_IDS,
  MAX_INVENTORY_BATCHES_PER_INGREDIENT,
  RUSH_ACTIVITY_LIMIT,
  STAFF_ROLES,
  TICKS_PER_SECOND,
  VENUE_IDS,
  VENUES,
  emptyIngredientTotals,
  milkIngredient,
  staffRoleAvailableAtVenue,
  workforceCapacityFor,
} from '../content/gameContent';
import {
  MAX_REPORT_CHARGE_GROUPS,
  MAX_REPORT_CHARGE_PRICE_CENTS,
  MIN_REPORT_CHARGE_PRICE_CENTS,
  candidatePoolForDay,
} from '../game/engine';
import { batchExpiryDay, inventoryTotals } from '../game/inventory';
import {
  LANE_IDS,
  MAX_CONSECUTIVE_EXPRESS_STARTS,
  MAX_EXPRESS_DRINKS,
  MAX_SERVICE_JOBS_PER_RUSH,
  STATION_IDS,
  defaultStationAssignments,
  emptyExpressStartCounters,
  emptyServiceAggregates,
  emptyServiceJobs,
  expressDrinkEligible,
  laneForDrink,
  serviceAggregatesForPlan,
  serviceConfigFor,
  serviceJobId,
  staffStationCompatible,
  stationForDrink,
} from '../game/serviceStations';
import { candidateStaffSlotFromId } from '../game/staffNames';
import type {
  AchievementId,
  CampaignOutcome,
  CampaignRecord,
  CosmeticId,
  Customer,
  CustomerSegment,
  DayPlan,
  DayReport,
  DayReportCauseSnapshot,
  Difficulty,
  DrinkId,
  EquipmentState,
  EventChoiceEffect,
  GamePhase,
  GameState,
  IngredientAmount,
  IngredientId,
  IngredientInventory,
  IngredientTotals,
  LaneId,
  MetaProgress,
  Preferences,
  ReportChargeGroup,
  RushState,
  ResolvedEvent,
  SaveEnvelope,
  ScenarioId,
  ServiceAggregate,
  ServiceJob,
  StaffMember,
  StationId,
} from '../game';

export const SAVE_KEY = 'laneway-tycoon.save.v4';
export const BACKUP_SAVE_KEY = 'laneway-tycoon.save.backup.v4';
export const LEGACY_V3_SAVE_KEY = 'laneway-tycoon.save.v3';
export const LEGACY_V3_BACKUP_SAVE_KEY = 'laneway-tycoon.save.backup.v3';
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
const SCENARIOS: ScenarioId[] = ['lanewayClassic', 'rainySeason', 'festivalWeek'];
const COSMETICS: CosmeticId[] = [
  'classicAwning',
  'wattleAwning',
  'neonCup',
  'mosaicFloor',
  'brassBayPlaques',
  'afterHoursGlow',
];
const ACHIEVEMENTS: AchievementId[] = [
  'cafeFounder',
  'goldenCup',
  'hardLessons',
  'departmentInstitution',
  'threeBayConductor',
];
const DIFFICULTIES: Difficulty[] = ['standard', 'hard'];

export const EVOLUTION_NOTICE =
  'The game has evolved. Your settings were kept, while campaign progress was reset for the new Standard and Hard modes.';

/** User-facing preferences with audio disabled until explicit interaction. */
export function createDefaultPreferences(): Preferences {
  return {
    soundEnabled: false,
    ambienceEnabled: false,
    reducedMotion: false,
    onboardingComplete: false,
    activeTab: 'plan',
    evolutionNoticeSeen: true,
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
    schemaVersion: 4,
    savedAt: new Date().toISOString(),
    activeRun,
    preferences,
    meta,
  };
}

export interface LoadSaveResult {
  envelope: SaveEnvelope | null;
  source: 'primary' | 'backup' | 'legacy-v3' | 'legacy-v2' | 'legacy-v1' | 'empty';
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
    const persistedEnvelope = markEvolutionNoticeSeen(envelope);
    const serialized = serializeEnvelope(persistedEnvelope);
    const previous = this.storage.getItem(SAVE_KEY);
    try {
      const previousEnvelope = previous ? parseEnvelope(previous) : null;
      if (previousEnvelope) {
        this.storage.setItem(
          BACKUP_SAVE_KEY,
          serializeEnvelope(markEvolutionNoticeSeen(previousEnvelope)),
        );
      } else {
        const legacy = this.firstValidLegacyEnvelope();
        if (legacy) {
          this.storage.setItem(BACKUP_SAVE_KEY, serializeEnvelope(markEvolutionNoticeSeen(legacy)));
        }
      }
      this.storage.setItem(SAVE_KEY, serialized);
      const verified = this.storage.getItem(SAVE_KEY);
      if (verified !== serialized || !parseEnvelope(verified)) {
        throw new SaveStoreError('The browser did not verify the autosave write.');
      }
      this.quarantineLegacyCandidates();
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
    if (primary && primaryRaw) {
      const noticePending = !primary.preferences.evolutionNoticeSeen;
      if (noticePending || needsCanonicalRewrite(primaryRaw, primary)) this.save(primary);
      else this.quarantineLegacyCandidates();
      return {
        envelope: markEvolutionNoticeSeen(primary),
        source: 'primary',
        warning: noticePending ? EVOLUTION_NOTICE : null,
        recoveryAvailable: false,
      };
    }

    const backupRaw = this.storage.getItem(BACKUP_SAVE_KEY);
    const backup = backupRaw ? parseEnvelope(backupRaw) : null;
    if (backup && backupRaw) {
      const noticePending = !backup.preferences.evolutionNoticeSeen;
      if (noticePending || needsCanonicalRewrite(backupRaw, backup)) this.save(backup);
      else this.quarantineLegacyCandidates();
      return {
        envelope: markEvolutionNoticeSeen(backup),
        source: 'backup',
        warning: noticePending
          ? `${EVOLUTION_NOTICE} The last-known-good v4 save was restored.`
          : 'The latest autosave was unreadable, so the last-known-good save was restored.',
        recoveryAvailable: true,
      };
    }

    for (const [key, source, isBackup] of [
      [LEGACY_V3_SAVE_KEY, 'legacy-v3', false],
      [LEGACY_V3_BACKUP_SAVE_KEY, 'legacy-v3', true],
      [LEGACY_V2_SAVE_KEY, 'legacy-v2', false],
      [LEGACY_V2_BACKUP_SAVE_KEY, 'legacy-v2', true],
      [LEGACY_SAVE_KEY, 'legacy-v1', false],
      [LEGACY_BACKUP_SAVE_KEY, 'legacy-v1', true],
    ] as const) {
      const legacyRaw = this.storage.getItem(key);
      const legacy = legacyRaw ? parseEnvelope(legacyRaw) : null;
      if (legacy) {
        this.save(legacy);
        return {
          envelope: markEvolutionNoticeSeen(legacy),
          source,
          warning: legacyResetWarning(source, isBackup),
          recoveryAvailable: false,
        };
      }
    }

    const hadData = [
      primaryRaw,
      backupRaw,
      this.storage.getItem(LEGACY_V3_SAVE_KEY),
      this.storage.getItem(LEGACY_V3_BACKUP_SAVE_KEY),
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
    const backup = [BACKUP_SAVE_KEY]
      .map((key) => this.storage.getItem(key))
      .map((raw) => (raw ? parseEnvelope(raw) : null))
      .find((candidate): candidate is SaveEnvelope => candidate !== null);
    if (!backup) throw new SaveStoreError('No valid last-known-good save is available.');
    const restored = markEvolutionNoticeSeen(backup);
    this.save(restored);
    return restored;
  }

  /** Remove current, backup, and legacy runs from this browser. */
  public clear(): void {
    this.storage.removeItem(SAVE_KEY);
    this.storage.removeItem(BACKUP_SAVE_KEY);
    this.storage.removeItem(LEGACY_V3_SAVE_KEY);
    this.storage.removeItem(LEGACY_V3_BACKUP_SAVE_KEY);
    this.storage.removeItem(LEGACY_V2_SAVE_KEY);
    this.storage.removeItem(LEGACY_V2_BACKUP_SAVE_KEY);
    this.storage.removeItem(LEGACY_SAVE_KEY);
    this.storage.removeItem(LEGACY_BACKUP_SAVE_KEY);
  }

  private firstValidLegacyEnvelope(): SaveEnvelope | null {
    for (const key of [
      LEGACY_V3_SAVE_KEY,
      LEGACY_V3_BACKUP_SAVE_KEY,
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

  private quarantineLegacyCandidates(): void {
    for (const key of [
      LEGACY_V3_SAVE_KEY,
      LEGACY_V3_BACKUP_SAVE_KEY,
      LEGACY_V2_SAVE_KEY,
      LEGACY_V2_BACKUP_SAVE_KEY,
      LEGACY_SAVE_KEY,
      LEGACY_BACKUP_SAVE_KEY,
    ]) {
      this.storage.removeItem(key);
    }
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
  if (
    value.schemaVersion !== 1 &&
    value.schemaVersion !== 2 &&
    value.schemaVersion !== 3 &&
    value.schemaVersion !== 4
  ) {
    throw new SaveValidationError(
      `Save schema ${String(value.schemaVersion)} is not supported by this version.`,
      'unknownVersion',
    );
  }
  if (value.schemaVersion !== 4) {
    const reset = resetLegacyEnvelope(normalizeLegacyVersion(value));
    validateEnvelope(reset as unknown as Record<string, unknown>);
    return reset;
  }
  const canonical = canonicalizeCurrentV4Envelope(value);
  validateEnvelope(canonical);
  return canonical as unknown as SaveEnvelope;
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
  const normalized = importEnvelope(JSON.stringify(envelope));
  const serialized = JSON.stringify(normalized, null, 2);
  importEnvelope(serialized);
  return serialized;
}

function normalizeLegacyVersion(value: Record<string, unknown>): Record<string, unknown> {
  if (value.schemaVersion === 1) return { ...value, schemaVersion: 3 };
  if (value.schemaVersion === 2) return { ...value, schemaVersion: 3 };
  return { ...value };
}

/** Convert supported legacy data through one immutable preferences-only boundary. */
function resetLegacyEnvelope(value: Record<string, unknown>): SaveEnvelope {
  const preferences = legacyPreferences(value.preferences);
  return {
    schemaVersion: 4,
    savedAt: '1970-01-01T00:00:00.000Z',
    activeRun: null,
    preferences: {
      ...createDefaultPreferences(),
      ...preferences,
      onboardingComplete: false,
      activeTab: 'plan',
      evolutionNoticeSeen: false,
    },
    meta: createDefaultMeta(),
  };
}

function legacyPreferences(
  value: unknown,
): Pick<Preferences, 'soundEnabled' | 'ambienceEnabled' | 'reducedMotion'> {
  if (value === undefined || value === null) {
    return { soundEnabled: false, ambienceEnabled: false, reducedMotion: false };
  }
  const record = expectRecord(value, 'preferences');
  const retained = {
    soundEnabled: false,
    ambienceEnabled: false,
    reducedMotion: false,
  };
  for (const key of Object.keys(retained) as Array<keyof typeof retained>) {
    if (record[key] === undefined) continue;
    assert(typeof record[key] === 'boolean', `preferences.${key} must be boolean.`);
    retained[key] = record[key];
  }
  return retained;
}

function markEvolutionNoticeSeen(envelope: SaveEnvelope): SaveEnvelope {
  if (envelope.preferences.evolutionNoticeSeen) return envelope;
  return {
    ...envelope,
    preferences: { ...envelope.preferences, evolutionNoticeSeen: true },
  };
}

function needsCanonicalRewrite(serialized: string, envelope: SaveEnvelope): boolean {
  try {
    return JSON.stringify(JSON.parse(serialized)) !== JSON.stringify(envelope);
  } catch {
    return true;
  }
}

function legacyResetWarning(
  source: 'legacy-v3' | 'legacy-v2' | 'legacy-v1',
  fromBackup: boolean,
): string {
  const version = source.slice(-1);
  const location = fromBackup ? `version ${version} recovery backup` : `version ${version} save`;
  return `The game has evolved. Your ${location} kept sound, ambience, and reduced-motion settings; campaign progress was reset for the new Standard and Hard modes.`;
}

/** Canonicalize pre-8.5 v4 shapes before every strict read, recovery, import, and write. */
function canonicalizeCurrentV4Envelope(value: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(value.activeRun)) return value;
  const state = { ...value.activeRun };
  const venueId = VENUE_IDS.includes(state.venueId as GameState['venueId'])
    ? (state.venueId as GameState['venueId'])
    : null;
  const equipment = isRecord(state.equipment) ? state.equipment : null;
  const plan = isRecord(state.plan) ? { ...state.plan } : null;
  const staff = Array.isArray(state.staff) ? state.staff : null;
  const day = typeof state.day === 'number' && Number.isInteger(state.day) ? state.day : null;

  if (plan && venueId) {
    if (plan.stationAssignments === undefined && Array.isArray(plan.scheduledStaffIds) && staff) {
      const staffById = new Map(
        staff
          .filter(isRecord)
          .filter((member) => typeof member.id === 'string')
          .map((member) => [member.id as string, member]),
      );
      const scheduled = plan.scheduledStaffIds.flatMap((id) => {
        const member = typeof id === 'string' ? staffById.get(id) : undefined;
        return member && STAFF_ROLES.includes(member.role as StaffMember['role'])
          ? [member as unknown as StaffMember]
          : [];
      });
      if (scheduled.length === plan.scheduledStaffIds.length) {
        plan.stationAssignments = defaultStationAssignments(venueId, scheduled);
      }
    }
    if (plan.expressDrinkIds === undefined) plan.expressDrinkIds = [];
    state.plan = plan;
  }

  if (isRecord(state.rush) && venueId && equipment && plan && day !== null) {
    state.rush = canonicalizeCurrentV4Rush(state.rush, day, venueId, equipment, plan);
  }
  if (isRecord(state.report)) {
    state.report = canonicalizeCurrentV4Report(state.report);
  }
  if (Array.isArray(state.history)) {
    const history: unknown[] = state.history;
    state.history = history.map((report) =>
      isRecord(report) ? canonicalizeCurrentV4Report(report) : report,
    );
  }
  return { ...value, activeRun: state };
}

function canonicalizeCurrentV4Rush(
  source: Record<string, unknown>,
  day: number,
  venueId: GameState['venueId'],
  equipment: Record<string, unknown>,
  plan: Record<string, unknown>,
): Record<string, unknown> {
  const rush = { ...source };
  const hasLegacyAuthority = 'queue' in rush || 'activeService' in rush;
  if (hasLegacyAuthority) {
    const normalSource = Array.isArray(rush.normalQueue)
      ? rush.normalQueue
      : Array.isArray(rush.queue)
        ? rush.queue
        : [];
    const normalQueue = normalSource.map((customer) =>
      canonicalizeLegacyCustomer(customer, venueId, equipment, plan),
    );
    rush.normalQueue = normalQueue;
    rush.expressQueue = Array.isArray(rush.expressQueue)
      ? rush.expressQueue.map((customer) =>
          canonicalizeLegacyCustomer(customer, venueId, equipment, plan),
        )
      : [];

    const jobs = emptyServiceJobs() as unknown as Record<string, unknown>;
    const legacyService = isRecord(rush.activeService) ? rush.activeService : null;
    let activeJob: Record<string, unknown> | null = null;
    if (legacyService && isRecord(legacyService.customer)) {
      const customer = canonicalizeLegacyCustomer(legacyService.customer, venueId, equipment, plan);
      if (isRecord(customer) && STATION_IDS.includes(customer.stationId as StationId)) {
        const stationId = customer.stationId as StationId;
        activeJob = {
          ...legacyService,
          id: serviceJobId(day, 0),
          stationId,
          laneId: customer.laneId,
          customer,
        };
        jobs[stationId] = activeJob;
      }
    }
    if (!isRecord(rush.serviceJobsByStation)) rush.serviceJobsByStation = jobs;
    if (!isRecord(rush.consecutiveExpressStartsByStation)) {
      rush.consecutiveExpressStartsByStation = emptyExpressStartCounters();
    }
    if (rush.nextServiceJobSequence === undefined) {
      rush.nextServiceJobSequence = activeJob ? 1 : 0;
    }
    if (Array.isArray(rush.recentActivity)) {
      rush.recentActivity = canonicalizeLegacyActivity(
        rush.recentActivity,
        day,
        venueId,
        activeJob,
        Array.isArray(rush.normalQueue) ? rush.normalQueue : [],
        Array.isArray(rush.expressQueue) ? rush.expressQueue : [],
      );
    }
    if (isRecord(rush.stats) && rush.stats.serviceAggregates === undefined) {
      rush.stats = {
        ...rush.stats,
        serviceAggregates: migrateServiceAggregates(
          rush.stats,
          day,
          migratedRushServiceMetadata(venueId, equipment, plan),
        ),
      };
    }
  }
  if (Array.isArray(rush.resolvedEvents)) {
    rush.resolvedEvents = rush.resolvedEvents.map((event) => canonicalizeResolvedEvent(event));
  }
  delete rush.queue;
  delete rush.activeService;
  return rush;
}

function canonicalizeResolvedEvent(value: unknown): unknown {
  if (!isRecord(value) || typeof value.eventId !== 'string' || typeof value.choiceId !== 'string') {
    return value;
  }
  if (
    value.title !== undefined &&
    value.description !== undefined &&
    value.choiceLabel !== undefined &&
    value.choiceDescription !== undefined &&
    value.effect !== undefined
  ) {
    return value;
  }
  const event = EVENT_TEMPLATES.find((candidate) => candidate.id === value.eventId);
  const choice = event?.choices.find((candidate) => candidate.id === value.choiceId);
  if (!event || !choice) return value;
  return {
    ...value,
    title: event.title,
    description: event.description,
    choiceLabel: choice.label,
    choiceDescription: choice.description,
    effect: { ...choice.effect },
  };
}

function canonicalizeLegacyCustomer(
  value: unknown,
  venueId: GameState['venueId'],
  equipment: Record<string, unknown>,
  plan: Record<string, unknown>,
): unknown {
  if (!isRecord(value) || !isRecord(value.order)) return value;
  const drinkId = value.order.drinkId;
  if (!ALL_DRINK_IDS.includes(drinkId as DayPlan['activeMenu'][number])) return value;
  const stationId = stationForDrink(venueId, drinkId as DayPlan['activeMenu'][number]);
  const typedEquipment = equipment as unknown as EquipmentState;
  const expressDrinkIds = Array.isArray(plan.expressDrinkIds)
    ? (plan.expressDrinkIds as DayPlan['expressDrinkIds'])
    : [];
  return {
    ...value,
    stationId,
    laneId: laneForDrink(venueId, typedEquipment, { expressDrinkIds }, drinkId as DrinkId),
  };
}

function canonicalizeLegacyActivity(
  events: unknown[],
  day: number,
  venueId: GameState['venueId'],
  activeJob: Record<string, unknown> | null,
  normalQueue: unknown[],
  expressQueue: unknown[],
): unknown[] {
  const routeByCustomer = new Map<string, { stationId: StationId; laneId: LaneId }>();
  const jobByCustomer = new Map<string, string>();
  for (const customer of [...normalQueue, ...expressQueue]) {
    if (
      isRecord(customer) &&
      typeof customer.id === 'string' &&
      STATION_IDS.includes(customer.stationId as StationId) &&
      LANE_IDS.includes(customer.laneId as LaneId)
    ) {
      routeByCustomer.set(customer.id, {
        stationId: customer.stationId as StationId,
        laneId: customer.laneId as LaneId,
      });
    }
  }
  if (activeJob && isRecord(activeJob.customer) && typeof activeJob.customer.id === 'string') {
    routeByCustomer.set(activeJob.customer.id, {
      stationId: activeJob.stationId as StationId,
      laneId: activeJob.laneId as LaneId,
    });
    jobByCustomer.set(activeJob.customer.id, activeJob.id as string);
  }
  for (const event of events) {
    if (!isRecord(event) || typeof event.customerId !== 'string') continue;
    if (
      (event.type === 'serviceStarted' || event.type === 'sale') &&
      ALL_DRINK_IDS.includes(event.drinkId as DrinkId)
    ) {
      routeByCustomer.set(event.customerId, {
        stationId: stationForDrink(venueId, event.drinkId as DrinkId),
        laneId: 'normal',
      });
      if (!jobByCustomer.has(event.customerId)) {
        jobByCustomer.set(event.customerId, `d${day}-migrated-j${String(event.sequence)}`);
      }
    }
  }
  return events.map((event) => {
    if (!isRecord(event) || typeof event.customerId !== 'string') return event;
    const route = routeByCustomer.get(event.customerId) ?? {
      stationId: 'espressoBar' as const,
      laneId: 'normal' as const,
    };
    const requiresJob = event.type === 'serviceStarted' || event.type === 'sale';
    const activeWalkaway =
      event.type === 'walkaway' &&
      event.reason === 'rushEnded' &&
      activeJob !== null &&
      isRecord(activeJob.customer) &&
      activeJob.customer.id === event.customerId;
    return {
      ...event,
      ...route,
      jobId: requiresJob || activeWalkaway ? (jobByCustomer.get(event.customerId) ?? null) : null,
    };
  });
}

function canonicalizeCurrentV4Report(source: Record<string, unknown>): Record<string, unknown> {
  const report = { ...source };
  if (report.causeSnapshot === undefined) report.causeSnapshot = null;
  if (report.serviceAggregates === undefined && typeof report.day === 'number') {
    report.serviceAggregates = migrateServiceAggregates(
      {
        served: report.served,
        revenueCents: report.revenueCents,
        totalWaitTicks:
          typeof report.averageWaitSeconds === 'number' && typeof report.served === 'number'
            ? Math.round(report.averageWaitSeconds * report.served * TICKS_PER_SECOND)
            : 0,
        satisfactionTotal:
          typeof report.satisfactionPercent === 'number' && typeof report.served === 'number'
            ? report.satisfactionPercent * report.served
            : 0,
      },
      report.day,
    );
  }
  return report;
}

function migrateServiceAggregates(
  totals: Record<string, unknown>,
  day: number,
  metadata: ServiceAggregate[] = emptyServiceAggregates(),
): ServiceAggregate[] {
  const aggregates: ServiceAggregate[] = metadata.map((aggregate) => ({
    ...aggregate,
    assignedStaffIds: [...aggregate.assignedStaffIds],
    equipmentIds: [...aggregate.equipmentIds],
    completedJobIds: [] as string[],
    served: 0,
    revenueCents: 0,
    totalWaitTicks: 0,
    satisfactionTotal: 0,
  }));
  const served = typeof totals.served === 'number' ? Math.max(0, Math.trunc(totals.served)) : 0;
  const revenueCents =
    typeof totals.revenueCents === 'number' ? Math.max(0, Math.trunc(totals.revenueCents)) : 0;
  const legacy = aggregates.find(
    (aggregate) => aggregate.stationId === 'espressoBar' && aggregate.laneId === 'normal',
  );
  if (legacy) {
    const retainedJobCount = Math.min(served, MAX_SERVICE_JOBS_PER_RUSH + 1);
    legacy.served = served;
    legacy.revenueCents = revenueCents;
    legacy.completedJobIds = Array.from(
      { length: retainedJobCount },
      (_, index) => `d${day}-migrated-complete-${index}`,
    );
    legacy.totalWaitTicks =
      typeof totals.totalWaitTicks === 'number' ? Math.max(0, totals.totalWaitTicks) : 0;
    legacy.satisfactionTotal =
      typeof totals.satisfactionTotal === 'number' ? Math.max(0, totals.satisfactionTotal) : 0;
  }
  return aggregates;
}

function migratedRushServiceMetadata(
  venueId: GameState['venueId'],
  equipment: Record<string, unknown>,
  plan: Record<string, unknown>,
): ServiceAggregate[] {
  const assignments = plan.stationAssignments;
  if (
    !isRecord(assignments) ||
    !STATION_IDS.every((stationId) => Array.isArray(assignments[stationId]))
  ) {
    return emptyServiceAggregates();
  }
  return serviceAggregatesForPlan(
    venueId,
    plan as unknown as DayPlan,
    equipment as unknown as EquipmentState,
  );
}

function validateEnvelope(value: Record<string, unknown>): void {
  assert(value.schemaVersion === 4, 'Save schema must be version 4.');
  assertString(value.savedAt, 'savedAt', 64);
  assert(!Number.isNaN(Date.parse(value.savedAt)), 'savedAt must be an ISO date.');
  validatePreferences(value.preferences);
  validateMeta(value.meta);
  if (value.activeRun !== null) validateGameState(value.activeRun);
}

function validatePreferences(value: unknown): asserts value is Preferences {
  const record = expectRecord(value, 'preferences');
  for (const key of [
    'soundEnabled',
    'ambienceEnabled',
    'reducedMotion',
    'onboardingComplete',
    'evolutionNoticeSeen',
  ]) {
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
  assertEnum(record.difficulty, DIFFICULTIES, `${path}.difficulty`);
  assertEnum(record.result, ['victory', 'bankruptcy', 'targetMissed'], `${path}.result`);
  assertNumber(record.day, `${path}.day`, 1, 10_000, true);
  assertNumber(record.cashCents, `${path}.cashCents`, -1_000_000_000, 1_000_000_000, true);
  assertNumber(record.reputation, `${path}.reputation`, 0, 100, true);
  assertEnum(record.venueId, VENUE_IDS, `${path}.venueId`);
}

function validateGameState(value: unknown): asserts value is GameState {
  const state = expectRecord(value, 'activeRun');
  assert(state.stateVersion === 4, 'activeRun.stateVersion must be 4.');
  assertSafeId(state.campaignId, 'activeRun.campaignId');
  assertNumber(state.seed, 'activeRun.seed', 0, 0xffff_ffff, true);
  assertNumber(state.rngState, 'activeRun.rngState', 0, 0xffff_ffff, true);
  assertEnum(state.scenarioId, SCENARIOS, 'activeRun.scenarioId');
  assertEnum(state.difficulty, DIFFICULTIES, 'activeRun.difficulty');
  assertEnum(state.mode, ['campaign', 'endless'], 'activeRun.mode');
  assertEnum(state.phase, GAME_PHASES, 'activeRun.phase');
  assertNumber(state.day, 'activeRun.day', 1, 10_000, true);
  assertNumber(state.cashCents, 'activeRun.cashCents', -1_000_000_000, 1_000_000_000, true);
  assertNumber(state.reputation, 'activeRun.reputation', 0, 100, true);
  assertEnum(state.venueId, VENUE_IDS, 'activeRun.venueId');
  const venueId = state.venueId;
  assertEnum(state.weather, ['mild', 'sunny', 'rainy', 'coldSnap'], 'activeRun.weather');
  validateInventory(state.inventory, 'activeRun.inventory', state.day);
  const inventory = state.inventory;
  validateEquipment(state.equipment);
  const equipment = state.equipment;
  const workforceCapacity = workforceCapacityFor(venueId);
  const staff = validateStaffArray(
    state.staff,
    'activeRun.staff',
    workforceCapacity.rosterCapacity,
  );
  const candidateStaff = validateStaffArray(state.candidateStaff, 'activeRun.candidateStaff', 4);
  validateStaffIdentities(staff, candidateStaff, state.seed, state.day);
  assert(
    staff.every((member) => staffRoleAvailableAtVenue(member.role, venueId)),
    'Every hired role must be eligible for the active venue.',
  );
  validatePlan(state.plan, venueId, staff, equipment);
  const scheduledIds = new Set(state.plan.scheduledStaffIds);
  const expectedPayrollCents = staff
    .filter((member) => scheduledIds.has(member.id))
    .reduce((total, member) => total + member.wageCents, 0);
  if (state.rush !== null) {
    validateRush(state.rush, state.day, venueId, state.plan, equipment, inventory, state.phase);
  }
  if (state.report !== null) {
    validateReport(state.report, 'activeRun.report', expectedPayrollCents);
    assert(
      state.report.difficulty === state.difficulty,
      'activeRun.report difficulty must match its campaign.',
    );
  }
  if (state.rush !== null) {
    assert(
      state.rush.wageCostCents === expectedPayrollCents,
      'activeRun.rush.wageCostCents must equal the exact scheduled payroll.',
    );
  }
  if (state.report !== null) {
    assert(
      state.report.wageCostCents === expectedPayrollCents,
      'activeRun.report.wageCostCents must equal the exact scheduled payroll.',
    );
  }
  assertNumber(state.lastSettledDay, 'activeRun.lastSettledDay', 0, 10_000, true);
  const improvements = expectArray(
    state.improvements,
    'activeRun.improvements',
    IMPROVEMENT_IDS.length,
  );
  improvements.forEach((item, index) =>
    assertEnum(item, IMPROVEMENT_IDS, `activeRun.improvements[${index}]`),
  );
  assert(new Set(improvements).size === improvements.length, 'Improvements must be unique.');
  expectArray(state.history, 'activeRun.history', CAMPAIGN_RULES.maximumHistoryDays).forEach(
    (report, index) => {
      validateReport(report, `activeRun.history[${index}]`);
      assert(
        report.difficulty === state.difficulty,
        `activeRun.history[${index}] difficulty must match its campaign.`,
      );
    },
  );
  if (state.outcome !== null) validateOutcome(state.outcome);
}

function validatePlan(
  value: unknown,
  venueId: GameState['venueId'],
  staff: StaffMember[],
  equipment: EquipmentState,
): asserts value is DayPlan {
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
  const scheduleCapacity = workforceCapacityFor(venueId).scheduleCapacity;
  const scheduledValues = expectArray(
    plan.scheduledStaffIds,
    'activeRun.plan.scheduledStaffIds',
    scheduleCapacity,
  );
  scheduledValues.forEach((id, index) => assertSafeId(id, `scheduledStaffIds[${index}]`));
  const scheduled = scheduledValues as string[];
  assert(new Set(scheduled).size === scheduled.length, 'Scheduled staff IDs must be unique.');
  const staffById = new Map(staff.map((member) => [member.id, member]));
  assert(
    scheduled.every((id) => staffById.has(id)),
    'Every scheduled staff ID must identify a hired team member.',
  );
  assert(
    scheduled.every((id) => {
      const member = staffById.get(id);
      return member !== undefined && staffRoleAvailableAtVenue(member.role, venueId);
    }),
    'Every scheduled role must be eligible for the active venue.',
  );
  const assignments = expectRecord(plan.stationAssignments, 'activeRun.plan.stationAssignments');
  assert(
    Object.keys(assignments).length === STATION_IDS.length &&
      STATION_IDS.every((stationId) => Object.hasOwn(assignments, stationId)),
    'Station assignments must contain every canonical station exactly once.',
  );
  const activeStations = serviceConfigFor(venueId).stationIds;
  const assigned: string[] = [];
  for (const stationId of STATION_IDS) {
    const ids = expectArray(
      assignments[stationId],
      `activeRun.plan.stationAssignments.${stationId}`,
      scheduleCapacity,
    );
    ids.forEach((id, index) =>
      assertSafeId(id, `activeRun.plan.stationAssignments.${stationId}[${index}]`),
    );
    if (!activeStations.includes(stationId)) {
      assert(ids.length === 0, 'Inactive stations cannot contain staff assignments.');
    }
    for (const id of ids as string[]) {
      const member = staffById.get(id);
      assert(member !== undefined, 'Station assignments must identify scheduled hired staff.');
      assert(scheduled.includes(id), 'Unscheduled staff cannot be assigned to a station.');
      assert(
        staffStationCompatible(member.role, stationId, venueId),
        'Station assignments must be role-compatible.',
      );
      assigned.push(id);
    }
  }
  assert(new Set(assigned).size === assigned.length, 'Station assignments must not be duplicated.');
  assert(
    assigned.length === scheduled.length && scheduled.every((id) => assigned.includes(id)),
    'Every scheduled staff member must have exactly one station assignment.',
  );
  const expressDrinkIds = expectArray(
    plan.expressDrinkIds,
    'activeRun.plan.expressDrinkIds',
    MAX_EXPRESS_DRINKS,
  );
  expressDrinkIds.forEach((drinkId, index) =>
    assertEnum(drinkId, ALL_DRINK_IDS, `activeRun.plan.expressDrinkIds[${index}]`),
  );
  assert(
    new Set(expressDrinkIds).size === expressDrinkIds.length,
    'Express drink selections must be unique.',
  );
  for (const drinkId of expressDrinkIds as DrinkId[]) {
    assert(
      (plan.activeMenu as unknown[]).includes(drinkId),
      'Express drinks must be selected from the active menu.',
    );
    assert(
      expressDrinkEligible(venueId, equipment, drinkId),
      'Express drinks must be eligible for their recipe, equipment, and station.',
    );
  }
}

function validateRush(
  value: unknown,
  day: number,
  venueId: GameState['venueId'],
  plan: DayPlan,
  equipment: EquipmentState,
  inventory: IngredientInventory,
  phase: GamePhase,
): asserts value is RushState {
  const rush = expectRecord(value, 'activeRun.rush');
  assert(rush.queue === undefined, 'rush.queue is a removed service authority.');
  assert(rush.activeService === undefined, 'rush.activeService is a removed service authority.');
  assertNumber(rush.tick, 'rush.tick', 0, 2_000, true);
  assertNumber(rush.durationTicks, 'rush.durationTicks', 1, 2_000, true);
  assert(typeof rush.isPaused === 'boolean', 'rush.isPaused must be boolean.');
  assertEnum(rush.speed, [1, 2, 4], 'rush.speed');
  const liveCustomers = new Map<string, Customer>();
  let maximumCustomerSequence = -1;
  const normalQueue = expectArray(rush.normalQueue, 'rush.normalQueue', 40);
  const expressQueue = expectArray(rush.expressQueue, 'rush.expressQueue', 40);
  assert(normalQueue.length + expressQueue.length <= 40, 'Combined service queues exceed 40.');
  for (const [laneId, queue] of [
    ['normal', normalQueue],
    ['express', expressQueue],
  ] as const) {
    queue.forEach((customer, index) => {
      validateCustomer(customer, `rush.${laneId}Queue[${index}]`, venueId, plan, equipment);
      assert(customer.laneId === laneId, `rush.${laneId}Queue contains the wrong lane.`);
      assert(!liveCustomers.has(customer.id), 'Live customer IDs must be unique.');
      const customerSequence = currentDayEntitySequence(customer.id, day, 'c');
      assert(customerSequence !== null, `rush.${laneId}Queue customer IDs must match the day.`);
      maximumCustomerSequence = Math.max(maximumCustomerSequence, customerSequence);
      liveCustomers.set(customer.id, customer);
    });
  }
  const jobs = expectRecord(rush.serviceJobsByStation, 'rush.serviceJobsByStation');
  assertCanonicalRecordKeys(jobs, STATION_IDS, 'rush.serviceJobsByStation');
  const counters = expectRecord(
    rush.consecutiveExpressStartsByStation,
    'rush.consecutiveExpressStartsByStation',
  );
  assertCanonicalRecordKeys(counters, STATION_IDS, 'rush.consecutiveExpressStartsByStation');
  assertNumber(
    rush.nextServiceJobSequence,
    'rush.nextServiceJobSequence',
    0,
    MAX_SERVICE_JOBS_PER_RUSH,
    true,
  );
  const activeStations = serviceConfigFor(venueId).stationIds;
  const activeJobIds = new Set<string>();
  const activeJobs: ServiceJob[] = [];
  let maximumServiceJobSequence = -1;
  for (const stationId of STATION_IDS) {
    assertNumber(
      counters[stationId],
      `rush.consecutiveExpressStartsByStation.${stationId}`,
      0,
      MAX_CONSECUTIVE_EXPRESS_STARTS,
      true,
    );
    const value = jobs[stationId];
    if (!activeStations.includes(stationId)) {
      assert(value === null, 'Inactive venue stations cannot contain service jobs.');
      assert(counters[stationId] === 0, 'Inactive venue station fairness counters must be zero.');
      continue;
    }
    if (value === null) continue;
    const job = validateServiceJob(
      value,
      `rush.serviceJobsByStation.${stationId}`,
      stationId,
      day,
      venueId,
      plan,
      equipment,
      rush.nextServiceJobSequence,
    );
    assert(!activeJobIds.has(job.id), 'Active service-job IDs must be unique.');
    assert(!liveCustomers.has(job.customer.id), 'A customer cannot be queued and in service.');
    const serviceJobSequence = currentDayEntitySequence(job.id, day, 'j');
    assert(serviceJobSequence !== null, 'Active service-job IDs must match the active day.');
    maximumServiceJobSequence = Math.max(maximumServiceJobSequence, serviceJobSequence);
    const customerSequence = currentDayEntitySequence(job.customer.id, day, 'c');
    assert(customerSequence !== null, 'Active customer IDs must match the active day.');
    maximumCustomerSequence = Math.max(maximumCustomerSequence, customerSequence);
    activeJobIds.add(job.id);
    activeJobs.push(job);
    liveCustomers.set(job.customer.id, job.customer);
  }
  if (rush.pendingEvent !== null) validateEvent(rush.pendingEvent);
  const resolvedEventIds = new Set<string>();
  expectArray(rush.resolvedEvents, 'rush.resolvedEvents', 2).forEach((event, index) => {
    const resolved = validateResolvedEvent(event, `rush.resolvedEvents[${index}]`);
    assert(!resolvedEventIds.has(resolved.eventId), 'Resolved event IDs must be unique per rush.');
    resolvedEventIds.add(resolved.eventId);
  });
  expectArray(rush.eventTriggerTicks, 'rush.eventTriggerTicks', 2).forEach((tick, index) =>
    assertNumber(tick, `eventTriggerTicks[${index}]`, 0, 2_000, true),
  );
  assertNumber(rush.nextCustomerId, 'rush.nextCustomerId', 1, 1_000_000_000, true);
  for (const key of [
    'openingCashCents',
    'purchaseCostCents',
    'wageCostCents',
    'operatingCostCents',
    'eventCashDeltaCents',
    'eventReputationDelta',
  ]) {
    assertNumber(rush[key], `rush.${key}`, -1_000_000_000, 1_000_000_000, true);
  }
  assertNumber(rush.nextActivitySequence, 'rush.nextActivitySequence', 0, 1_000_000_000, true);
  for (const key of ['demandMultiplier', 'qualityBonus']) {
    assertNumber(rush[key], `rush.${key}`, -10_000, 10_000);
  }
  validateIngredientTotals(rush.openingInventory, 'rush.openingInventory');
  validateIngredientTotals(rush.purchasedInventory, 'rush.purchasedInventory');
  let previousSequence = -1;
  const activityIds = new Set<string>();
  expectArray(rush.recentActivity, 'rush.recentActivity', RUSH_ACTIVITY_LIMIT).forEach(
    (activity, index) => {
      const validated = validateRushActivityEvent(
        activity,
        `rush.recentActivity[${index}]`,
        day,
        venueId,
        liveCustomers,
      );
      assert(
        validated.sequence > previousSequence,
        'rush.recentActivity sequences must be strictly increasing.',
      );
      assert(!activityIds.has(validated.id), 'rush.recentActivity IDs must be unique.');
      assert(
        validated.sequence < (rush.nextActivitySequence as number),
        'rush.nextActivitySequence must follow every retained activity.',
      );
      previousSequence = validated.sequence;
      activityIds.add(validated.id);
      if (validated.customerSequence !== null) {
        maximumCustomerSequence = Math.max(maximumCustomerSequence, validated.customerSequence);
      }
    },
  );
  assert(
    rush.nextCustomerId > maximumCustomerSequence,
    'rush.nextCustomerId must follow every retained current-day customer identity.',
  );
  const completedJobIds = validateRushStats(rush.stats, plan, equipment, venueId, day);
  const chargeGroups =
    rush.chargeGroups === undefined
      ? null
      : validateChargeGroups(
          rush.chargeGroups,
          'rush.chargeGroups',
          (rush.stats as RushState['stats']).served,
          (rush.stats as RushState['stats']).revenueCents,
        );
  if (phase === 'rush' || phase === 'event') {
    const currentInventory = inventoryTotals(inventory);
    const openingInventory = rush.openingInventory as IngredientTotals;
    const purchasedInventory = rush.purchasedInventory as IngredientTotals;
    const stats = rush.stats as RushState['stats'];
    for (const ingredientId of INGREDIENT_IDS) {
      assert(
        currentInventory[ingredientId] ===
          openingInventory[ingredientId] +
            purchasedInventory[ingredientId] -
            (stats.consumed[ingredientId] ?? 0),
        `activeRun.inventory.${ingredientId} does not conserve active-rush quantity.`,
      );
    }
    if (chargeGroups !== null) {
      const expected = activeRushConsumptionEvidence(plan, chargeGroups, activeJobs);
      for (const ingredientId of INGREDIENT_IDS) {
        assert(
          (stats.consumed[ingredientId] ?? 0) === expected.consumed[ingredientId],
          `rush.stats.consumed.${ingredientId} must equal canonical completed and active job consumption.`,
        );
      }
      assert(
        stats.ingredientCostCents === expected.ingredientCostCents,
        'rush.stats.ingredientCostCents must equal canonical completed and active job cost.',
      );
    }
  }
  for (const jobId of completedJobIds) {
    assert(!activeJobIds.has(jobId), 'An active service-job ID cannot already be completed.');
    const jobSequence = currentDayEntitySequence(jobId, day, 'j');
    if (jobSequence !== null) {
      maximumServiceJobSequence = Math.max(maximumServiceJobSequence, jobSequence);
    }
  }
  assert(
    rush.nextServiceJobSequence > maximumServiceJobSequence,
    'rush.nextServiceJobSequence must follow every active or completed canonical job identity.',
  );
}

function validateServiceJob(
  value: unknown,
  path: string,
  stationId: StationId,
  day: number,
  venueId: GameState['venueId'],
  plan: DayPlan,
  equipment: EquipmentState,
  nextServiceJobSequence: number,
): ServiceJob {
  const job = expectRecord(value, path);
  assertSafeId(job.id, `${path}.id`);
  const identity = new RegExp(`^d${day}-j(\\d+)$`).exec(job.id);
  assert(identity !== null, `${path}.id must match its active day.`);
  const sequence = Number(identity[1]);
  assert(
    Number.isSafeInteger(sequence) && sequence < nextServiceJobSequence,
    `${path}.id must precede rush.nextServiceJobSequence.`,
  );
  assert(job.stationId === stationId, `${path}.stationId must match its station key.`);
  assertEnum(job.laneId, LANE_IDS, `${path}.laneId`);
  validateCustomer(job.customer, `${path}.customer`, venueId, plan, equipment);
  assert(job.customer.stationId === stationId, `${path}.customer must route to its station.`);
  assert(job.customer.laneId === job.laneId, `${path}.customer must route to its lane.`);
  assertNumber(job.remainingTicks, `${path}.remainingTicks`, 1, 2_000, true);
  assertNumber(job.totalTicks, `${path}.totalTicks`, 1, 2_000, true);
  assert(job.remainingTicks <= job.totalTicks, `${path}.remainingTicks exceeds totalTicks.`);
  return job as unknown as ServiceJob;
}

function validateRushActivityEvent(
  value: unknown,
  path: string,
  day: number,
  venueId: GameState['venueId'],
  liveCustomers: ReadonlyMap<string, Customer>,
): { id: string; sequence: number; customerSequence: number | null } {
  const activity = expectRecord(value, path);
  assertEnum(activity.type, ['arrival', 'serviceStarted', 'sale', 'walkaway'], `${path}.type`);
  assertSafeId(activity.id, `${path}.id`);
  assertNumber(activity.sequence, `${path}.sequence`, 0, 1_000_000_000, true);
  assertNumber(activity.tick, `${path}.tick`, 0, 2_000, true);
  assertSafeId(activity.customerId, `${path}.customerId`);
  assertEnum(activity.stationId, STATION_IDS, `${path}.stationId`);
  assertEnum(activity.laneId, LANE_IDS, `${path}.laneId`);
  if (activity.segment === null) {
    assert(
      activity.type === 'sale' &&
        activity.id === `d${day}-legacy-e${activity.sequence}` &&
        /^legacy-sale-\d+$/.test(activity.customerId),
      `${path}.segment may be null only for normalized legacy sales.`,
    );
  } else {
    assertEnum(activity.segment, SEGMENTS, `${path}.segment`);
    assert(
      activity.id === `d${day}-e${activity.sequence}`,
      `${path}.id must match its day and sequence.`,
    );
    assert(
      currentDayEntitySequence(activity.customerId, day, 'c') !== null,
      `${path}.customerId must match its active day.`,
    );
  }
  if (activity.type === 'serviceStarted' || activity.type === 'sale') {
    assertSafeId(activity.jobId, `${path}.jobId`);
    assertEnum(activity.drinkId, ALL_DRINK_IDS, `${path}.drinkId`);
    assertEnum(activity.size, ['regular', 'large'], `${path}.size`);
    assertEnum(activity.milk, ['none', 'dairy', 'oat', 'soy'], `${path}.milk`);
    assert(
      activity.stationId === stationForDrink(venueId, activity.drinkId),
      `${path}.stationId must match the order recipe route.`,
    );
  } else if (activity.type === 'arrival') {
    assert(activity.jobId === null, `${path}.jobId must be null before service starts.`);
  }
  if (activity.type === 'sale') {
    assertNumber(activity.priceCents, `${path}.priceCents`, 0, 10_000, true);
  }
  if (activity.type === 'walkaway') {
    assertEnum(
      activity.reason,
      ['patience', 'queueFull', 'stockout', 'rushEnded'],
      `${path}.reason`,
    );
    if (activity.jobId !== null) {
      assertSafeId(activity.jobId, `${path}.jobId`);
      assert(
        activity.reason === 'rushEnded',
        `${path}.jobId is permitted only for an active rush-end walkaway.`,
      );
    }
  }
  const liveCustomer = liveCustomers.get(activity.customerId);
  if (liveCustomer) {
    assert(
      liveCustomer.stationId === activity.stationId && liveCustomer.laneId === activity.laneId,
      `${path} route must match its retained queued or active customer.`,
    );
  }
  return {
    id: activity.id,
    sequence: activity.sequence,
    customerSequence: currentDayEntitySequence(activity.customerId, day, 'c'),
  };
}

function validateRushStats(
  value: unknown,
  plan: DayPlan,
  equipment: EquipmentState,
  venueId: GameState['venueId'],
  day: number,
): ReadonlySet<string> {
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
    assertNumber(stats[key], `rush.stats.${key}`, 0, 1_000_000_000, true);
  }
  validateBoundedNumberRecord(stats.soldByDrink, ALL_DRINK_IDS, 'rush.stats.soldByDrink');
  validateBoundedNumberRecord(stats.consumed, INGREDIENT_IDS, 'rush.stats.consumed');
  validateBoundedNumberRecord(stats.arrivalsBySegment, SEGMENTS, 'rush.stats.arrivalsBySegment');
  validateBoundedNumberRecord(stats.servedBySegment, SEGMENTS, 'rush.stats.servedBySegment');
  return validateServiceAggregates(
    stats.serviceAggregates,
    'rush.stats.serviceAggregates',
    {
      served: stats.served as number,
      revenueCents: stats.revenueCents as number,
      totalWaitTicks: stats.totalWaitTicks as number,
      satisfactionTotal: stats.satisfactionTotal as number,
    },
    serviceAggregatesForPlan(venueId, plan, equipment),
    day,
  ).completedJobIds;
}

function currentDayEntitySequence(id: string, day: number, marker: 'c' | 'j'): number | null {
  const match = new RegExp(`^d${day}-${marker}(\\d+)$`).exec(id);
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) && (marker === 'j' || sequence >= 1) ? sequence : null;
}

function validateServiceAggregates(
  value: unknown,
  path: string,
  expectedTotals: Partial<
    Pick<ServiceAggregate, 'served' | 'revenueCents' | 'totalWaitTicks' | 'satisfactionTotal'>
  >,
  expectedMetadata: ServiceAggregate[] | null,
  day: number,
): Pick<ServiceAggregate, 'served' | 'revenueCents' | 'totalWaitTicks' | 'satisfactionTotal'> & {
  completedJobIds: ReadonlySet<string>;
} {
  const aggregates = expectArray(value, path, STATION_IDS.length * LANE_IDS.length);
  assert(
    aggregates.length === STATION_IDS.length * LANE_IDS.length,
    `${path} must contain every station/lane bucket.`,
  );
  const completedJobIds = new Set<string>();
  const totals = { served: 0, revenueCents: 0, totalWaitTicks: 0, satisfactionTotal: 0 };
  for (const [index, value] of aggregates.entries()) {
    const aggregatePath = `${path}[${index}]`;
    const aggregate = expectRecord(value, aggregatePath);
    const stationId = STATION_IDS[Math.floor(index / LANE_IDS.length)];
    const laneId = LANE_IDS[index % LANE_IDS.length];
    assert(aggregate.stationId === stationId, `${aggregatePath}.stationId is out of order.`);
    assert(aggregate.laneId === laneId, `${aggregatePath}.laneId is out of order.`);
    const staffIds = expectArray(
      aggregate.assignedStaffIds,
      `${aggregatePath}.assignedStaffIds`,
      12,
    );
    staffIds.forEach((id, staffIndex) =>
      assertSafeId(id, `${aggregatePath}.assignedStaffIds[${staffIndex}]`),
    );
    assert(new Set(staffIds).size === staffIds.length, `${aggregatePath} staff must be unique.`);
    const equipmentIds = expectArray(
      aggregate.equipmentIds,
      `${aggregatePath}.equipmentIds`,
      EQUIPMENT_IDS.length,
    );
    equipmentIds.forEach((id, equipmentIndex) =>
      assertEnum(id, EQUIPMENT_IDS, `${aggregatePath}.equipmentIds[${equipmentIndex}]`),
    );
    assert(
      new Set(equipmentIds).size === equipmentIds.length,
      `${aggregatePath} equipment must be unique.`,
    );
    const expected = expectedMetadata?.[index];
    if (expected) {
      assert(
        JSON.stringify(staffIds) === JSON.stringify(expected.assignedStaffIds),
        `${aggregatePath}.assignedStaffIds must match the rush-start plan.`,
      );
      assert(
        JSON.stringify(equipmentIds) === JSON.stringify(expected.equipmentIds),
        `${aggregatePath}.equipmentIds must match installed station equipment.`,
      );
    }
    const jobs = expectArray(
      aggregate.completedJobIds,
      `${aggregatePath}.completedJobIds`,
      MAX_SERVICE_JOBS_PER_RUSH,
    );
    jobs.forEach((jobId, jobIndex) => {
      assertSafeId(jobId, `${aggregatePath}.completedJobIds[${jobIndex}]`);
      assert(
        currentDayEntitySequence(jobId, day, 'j') !== null ||
          new RegExp(`^d${day}-migrated-complete-\\d+$`).test(jobId),
        `${aggregatePath}.completedJobIds[${jobIndex}] must match the report day.`,
      );
      assert(!completedJobIds.has(jobId), `${path} completed job IDs must be globally unique.`);
      completedJobIds.add(jobId);
    });
    for (const key of ['served', 'revenueCents', 'totalWaitTicks', 'satisfactionTotal'] as const) {
      assertNumber(aggregate[key], `${aggregatePath}.${key}`, 0, 1_000_000_000, true);
      totals[key] += aggregate[key];
    }
    assert(jobs.length === aggregate.served, `${aggregatePath} job IDs must match served count.`);
  }
  assert(completedJobIds.size <= MAX_SERVICE_JOBS_PER_RUSH, `${path} exceeds the job bound.`);
  for (const key of ['served', 'revenueCents', 'totalWaitTicks', 'satisfactionTotal'] as const) {
    if (expectedTotals[key] !== undefined) {
      assert(totals[key] === expectedTotals[key], `${path}.${key} does not reconcile.`);
    }
  }
  return { ...totals, completedJobIds };
}

function validateCustomer(
  value: unknown,
  path: string,
  venueId: GameState['venueId'],
  plan: DayPlan,
  equipment: EquipmentState,
): asserts value is Customer {
  const customer = expectRecord(value, path);
  assertSafeId(customer.id, `${path}.id`);
  assertEnum(customer.segment, SEGMENTS, `${path}.segment`);
  assertEnum(customer.stationId, STATION_IDS, `${path}.stationId`);
  assertEnum(customer.laneId, LANE_IDS, `${path}.laneId`);
  const order = expectRecord(customer.order, `${path}.order`);
  assertEnum(order.drinkId, ALL_DRINK_IDS, `${path}.order.drinkId`);
  assert(
    plan.activeMenu.includes(order.drinkId),
    `${path}.order.drinkId must be selected in the active menu.`,
  );
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
  assert(
    customer.stationId === stationForDrink(venueId, order.drinkId),
    `${path}.stationId must match its order recipe route.`,
  );
  assert(
    customer.laneId === laneForDrink(venueId, equipment, plan, order.drinkId),
    `${path}.laneId must match the validated morning express plan.`,
  );
  for (const key of ['arrivedAtTick', 'patienceTicks', 'waitedTicks']) {
    assertNumber(customer[key], `${path}.${key}`, 0, 2_000, true);
  }
}

function validateEvent(value: unknown): void {
  const event = expectRecord(value, 'rush.pendingEvent');
  assertEnum(event.id, EVENT_TEMPLATE_IDS, 'event.id');
  assertString(event.title, 'event.title', 160);
  assertString(event.description, 'event.description', 500);
  const choices = expectArray(event.choices, 'event.choices', 2);
  assert(choices.length === 2, 'event.choices must contain exactly two choices.');
  choices.forEach((choice, index) => {
    const record = expectRecord(choice, `event.choices[${index}]`);
    assertSafeId(record.id, `event.choices[${index}].id`);
    assertString(record.label, `event.choices[${index}].label`, 120);
    assertString(record.description, `event.choices[${index}].description`, 500);
    validateEventEffect(record.effect, `event.choices[${index}].effect`);
  });
  const configured = EVENT_TEMPLATES.find(({ id }) => id === event.id);
  assert(configured !== undefined, 'Pending event must identify configured content.');
  assert(
    JSON.stringify({
      id: event.id,
      title: event.title,
      description: event.description,
      choices: event.choices,
    }) ===
      JSON.stringify({
        id: configured.id,
        title: configured.title,
        description: configured.description,
        choices: configured.choices,
      }),
    'Pending event must match canonical configured content.',
  );
}

function validateResolvedEvent(value: unknown, path: string): ResolvedEvent {
  const event = expectRecord(value, path);
  assertEnum(event.eventId, EVENT_TEMPLATE_IDS, `${path}.eventId`);
  assertString(event.title, `${path}.title`, 160);
  assertString(event.description, `${path}.description`, 500);
  assertSafeId(event.choiceId, `${path}.choiceId`);
  assertString(event.choiceLabel, `${path}.choiceLabel`, 120);
  assertString(event.choiceDescription, `${path}.choiceDescription`, 500);
  validateEventEffect(event.effect, `${path}.effect`);
  assertString(event.summary, `${path}.summary`, 240);
  const configured = EVENT_TEMPLATES.find(({ id }) => id === event.eventId);
  const choice = configured?.choices.find(({ id }) => id === event.choiceId);
  assert(
    configured !== undefined && choice !== undefined,
    `${path} must reference one configured choice.`,
  );
  assert(
    event.title === configured.title,
    `${path}.title must match canonical configured content.`,
  );
  assert(
    event.description === configured.description,
    `${path}.description must match canonical configured content.`,
  );
  assert(
    event.choiceLabel === choice.label,
    `${path}.choiceLabel must match canonical configured content.`,
  );
  assert(
    event.choiceDescription === choice.description,
    `${path}.choiceDescription must match canonical configured content.`,
  );
  const capturedEffect = event.effect as EventChoiceEffect;
  const capturedKeys = Object.keys(capturedEffect).sort();
  const canonicalKeys = Object.keys(choice.effect).sort();
  assert(
    JSON.stringify(capturedKeys) === JSON.stringify(canonicalKeys) &&
      canonicalKeys.every(
        (key) =>
          capturedEffect[key as keyof EventChoiceEffect] ===
          choice.effect[key as keyof EventChoiceEffect],
      ),
    `${path}.effect must match canonical configured content.`,
  );
  assert(
    event.summary === `${configured.title}: ${choice.label}`,
    `${path}.summary must match canonical configured content.`,
  );
  return event as unknown as ResolvedEvent;
}

function validateEventEffect(value: unknown, path: string): void {
  const effect = expectRecord(value, path);
  const bounds = {
    cashCents: [-1_200, 1_200],
    demandMultiplier: [0.88, 1.12],
    qualityBonus: [-4, 4],
    reputation: [-2, 2],
    addCustomers: [0, 5],
  } as const;
  const entries = Object.entries(effect);
  assert(entries.length > 0, `${path} must contain an observable effect.`);
  for (const [key, effectValue] of entries) {
    const range = bounds[key as keyof typeof bounds];
    assert(range !== undefined, `${path}.${key} is not a supported event effect.`);
    assertNumber(effectValue, `${path}.${key}`, range[0], range[1], key !== 'demandMultiplier');
  }
}

function validateReport(
  value: unknown,
  path: string,
  expectedPayrollCents?: number,
): asserts value is DayReport {
  const report = expectRecord(value, path);
  assertEnum(report.difficulty, DIFFICULTIES, `${path}.difficulty`);
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
  if (expectedPayrollCents !== undefined) {
    assert(
      report.wageCostCents === expectedPayrollCents,
      `${path}.wageCostCents must equal the exact scheduled payroll.`,
    );
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
  const serviceTotals = validateServiceAggregates(
    report.serviceAggregates,
    `${path}.serviceAggregates`,
    { served: report.served as number, revenueCents: report.revenueCents as number },
    null,
    report.day as number,
  );
  const expectedAverageWaitSeconds =
    serviceTotals.served > 0
      ? Math.round((serviceTotals.totalWaitTicks / serviceTotals.served / TICKS_PER_SECOND) * 10) /
        10
      : 0;
  const expectedSatisfaction =
    serviceTotals.served > 0
      ? Math.round(serviceTotals.satisfactionTotal / serviceTotals.served)
      : 35;
  assert(
    report.averageWaitSeconds === expectedAverageWaitSeconds,
    `${path}.averageWaitSeconds must reconcile with station/lane aggregates.`,
  );
  assert(
    report.satisfactionPercent === expectedSatisfaction,
    `${path}.satisfactionPercent must reconcile with station/lane aggregates.`,
  );
  assertString(report.bottleneck, `${path}.bottleneck`, 300);
  expectArray(report.explanations, `${path}.explanations`, 30).forEach((item, index) =>
    assertString(item, `${path}.explanations[${index}]`, 500),
  );
  if (report.causeSnapshot !== null) {
    validateReportCauseSnapshot(
      report.causeSnapshot,
      `${path}.causeSnapshot`,
      report as unknown as DayReport,
      serviceTotals.totalWaitTicks,
    );
  }
  if (report.chargeGroups !== undefined) {
    validateChargeGroups(
      report.chargeGroups,
      `${path}.chargeGroups`,
      report.served as number,
      report.revenueCents as number,
    );
  }
  assert(typeof report.settled === 'boolean', `${path}.settled must be boolean.`);
}

function validateReportCauseSnapshot(
  value: unknown,
  path: string,
  report: DayReport,
  aggregateWaitTicks: number,
): asserts value is DayReportCauseSnapshot {
  const snapshot = expectRecord(value, path);
  assertEnum(snapshot.venueId, VENUE_IDS, `${path}.venueId`);
  const plan = expectRecord(snapshot.plan, `${path}.plan`);
  const menu = expectArray(plan.menu, `${path}.plan.menu`, ALL_DRINK_IDS.length);
  assert(menu.length >= 1, `${path}.plan.menu must contain at least one drink.`);
  const menuIds: DrinkId[] = [];
  menu.forEach((value, index) => {
    const itemPath = `${path}.plan.menu[${index}]`;
    const item = expectRecord(value, itemPath);
    assertEnum(item.drinkId, ALL_DRINK_IDS, `${itemPath}.drinkId`);
    assertNumber(item.priceCents, `${itemPath}.priceCents`, 250, 1_200, true);
    menuIds.push(item.drinkId);
  });
  assert(new Set(menuIds).size === menuIds.length, `${path}.plan.menu must be unique.`);
  assertEnum(plan.dialIn, ['speed', 'balanced', 'quality'], `${path}.plan.dialIn`);
  assertEnum(
    plan.beanId,
    ['houseBeans', 'singleOriginBeans', 'darkRoastBeans'],
    `${path}.plan.beanId`,
  );
  const expressDrinkIds = expectArray(plan.expressDrinkIds, `${path}.plan.expressDrinkIds`, 3);
  expressDrinkIds.forEach((drinkId, index) => {
    assertEnum(drinkId, ALL_DRINK_IDS, `${path}.plan.expressDrinkIds[${index}]`);
    assert(menuIds.includes(drinkId), `${path}.plan express drinks must be on the menu.`);
  });
  assert(
    new Set(expressDrinkIds).size === expressDrinkIds.length,
    `${path}.plan.expressDrinkIds must be unique.`,
  );

  const staffing = expectArray(snapshot.staffing, `${path}.staffing`, 10);
  const staffIds = new Set<string>();
  let wageCostCents = 0;
  staffing.forEach((value, index) => {
    const staffPath = `${path}.staffing[${index}]`;
    const member = expectRecord(value, staffPath);
    assertSafeId(member.staffId, `${staffPath}.staffId`);
    assert(!staffIds.has(member.staffId), `${path}.staffing IDs must be unique.`);
    staffIds.add(member.staffId);
    assertString(member.name, `${staffPath}.name`, 80);
    assertEnum(member.role, STAFF_ROLES, `${staffPath}.role`);
    assertNumber(member.speed, `${staffPath}.speed`, 0, 100, true);
    assertNumber(member.skill, `${staffPath}.skill`, 0, 100, true);
    assertEnum(
      member.trait,
      ['quickHands', 'peoplePerson', 'perfectionist', 'steady'],
      `${staffPath}.trait`,
    );
    assertNumber(member.wageCents, `${staffPath}.wageCents`, 0, 100_000, true);
    if (member.stationId !== null)
      assertEnum(member.stationId, STATION_IDS, `${staffPath}.stationId`);
    wageCostCents += member.wageCents;
  });
  assert(wageCostCents === report.wageCostCents, `${path}.staffing wages must reconcile.`);

  const equipment = expectRecord(snapshot.equipment, `${path}.equipment`);
  validateEquipment(equipment.levels);
  const levels = equipment.levels;
  const improvements = expectArray(
    equipment.improvements,
    `${path}.equipment.improvements`,
    IMPROVEMENT_IDS.length,
  );
  improvements.forEach((id, index) =>
    assertEnum(id, IMPROVEMENT_IDS, `${path}.equipment.improvements[${index}]`),
  );
  assert(
    new Set(improvements).size === improvements.length,
    `${path}.equipment improvements must be unique.`,
  );
  assertNumber(
    equipment.venueOperatingCostCents,
    `${path}.equipment.venueOperatingCostCents`,
    0,
    100_000,
    true,
  );
  assertNumber(
    equipment.equipmentOperatingCostCents,
    `${path}.equipment.equipmentOperatingCostCents`,
    0,
    100_000,
    true,
  );
  const expectedVenueCost = VENUES[snapshot.venueId].operatingCostCents;
  const expectedEquipmentCost = EQUIPMENT_IDS.reduce((total, equipmentId) => {
    const level = levels[equipmentId];
    const tier = EQUIPMENT[equipmentId].tiers.find((candidate) => candidate.level === level);
    return total + (tier?.operatingCostCents ?? 0);
  }, 0);
  assert(
    equipment.venueOperatingCostCents === expectedVenueCost,
    `${path} venue cost must be canonical.`,
  );
  assert(
    equipment.equipmentOperatingCostCents === expectedEquipmentCost,
    `${path} equipment cost must be canonical.`,
  );
  assert(
    expectedVenueCost + expectedEquipmentCost === report.operatingCostCents,
    `${path} operating costs must reconcile with the report.`,
  );

  const events = expectArray(snapshot.events, `${path}.events`, 2);
  const eventIds = new Set<string>();
  let eventCashDeltaCents = 0;
  events.forEach((value, index) => {
    const event = validateResolvedEvent(value, `${path}.events[${index}]`);
    assert(!eventIds.has(event.eventId), `${path}.events must be unique.`);
    eventIds.add(event.eventId);
    eventCashDeltaCents += event.effect.cashCents ?? 0;
  });
  assert(eventCashDeltaCents === report.eventCashDeltaCents, `${path}.events cash must reconcile.`);

  const wait = expectRecord(snapshot.wait, `${path}.wait`);
  assertNumber(wait.peakQueue, `${path}.wait.peakQueue`, 0, 64, true);
  assertNumber(wait.queueCapacity, `${path}.wait.queueCapacity`, 1, 64, true);
  assertNumber(wait.totalWaitTicks, `${path}.wait.totalWaitTicks`, 0, 1_000_000_000, true);
  assert(wait.peakQueue <= wait.queueCapacity, `${path}.wait peak cannot exceed capacity.`);
  assert(wait.totalWaitTicks === aggregateWaitTicks, `${path}.wait ticks must reconcile.`);
}

function activeRushConsumptionEvidence(
  plan: DayPlan,
  chargeGroups: readonly ReportChargeGroup[],
  activeJobs: readonly ServiceJob[],
): { consumed: IngredientTotals; ingredientCostCents: number } {
  const consumed = emptyIngredientTotals();
  let ingredientCostCents = 0;
  for (const group of chargeGroups) {
    const ingredients = chargeGroupIngredientAmounts(plan, group);
    addConsumedIngredients(consumed, ingredients, group.quantity);
    ingredientCostCents += ingredientCostForOrder(ingredients) * group.quantity;
  }
  for (const job of activeJobs) {
    addConsumedIngredients(consumed, job.customer.order.ingredientAmounts, 1);
    ingredientCostCents += ingredientCostForOrder(job.customer.order.ingredientAmounts);
  }
  return { consumed, ingredientCostCents };
}

function chargeGroupIngredientAmounts(plan: DayPlan, group: ReportChargeGroup): IngredientAmount[] {
  const drink = DRINK_MAP.get(group.drinkId);
  assert(drink !== undefined, 'Canonical charge drink must be configured.');
  const variant = drink.variants.find((candidate) => candidate.size === group.size);
  assert(variant !== undefined, 'Canonical charge size must be configured.');
  const ingredients = variant.ingredients.map((ingredient): IngredientAmount => {
    if (ingredient.ingredientId === 'houseBeans') {
      return { ...ingredient, ingredientId: plan.beanId };
    }
    if (ingredient.ingredientId === 'dairyMilk') {
      return { ...ingredient, ingredientId: milkIngredient(group.milk) ?? 'dairyMilk' };
    }
    return { ...ingredient };
  });
  const optionalMilk = drink.optionalMilkAmount ? milkIngredient(group.milk) : null;
  if (optionalMilk) {
    ingredients.push({ ingredientId: optionalMilk, amount: drink.optionalMilkAmount ?? 0 });
  }
  return ingredients;
}

function addConsumedIngredients(
  consumed: IngredientTotals,
  ingredients: readonly IngredientAmount[],
  quantity: number,
): void {
  for (const ingredient of ingredients) {
    consumed[ingredient.ingredientId] += ingredient.amount * quantity;
  }
}

function ingredientCostForOrder(ingredients: readonly IngredientAmount[]): number {
  return Math.round(
    ingredients.reduce(
      (total, ingredient) =>
        total + ingredient.amount * INGREDIENT_UNIT_COST_CENTS[ingredient.ingredientId],
      0,
    ),
  );
}

function validateChargeGroups(
  value: unknown,
  path: string,
  expectedQuantity: number,
  expectedRevenueCents: number,
): ReportChargeGroup[] {
  const groups = expectArray(value, path, MAX_REPORT_CHARGE_GROUPS);
  const identities = new Set<string>();
  let quantity = 0;
  let revenueCents = 0;
  groups.forEach((value, index) => {
    const groupPath = `${path}[${index}]`;
    const group = expectRecord(value, groupPath);
    assertEnum(group.drinkId, ALL_DRINK_IDS, `${groupPath}.drinkId`);
    const drink = DRINK_MAP.get(group.drinkId);
    assert(drink !== undefined, `${groupPath}.drinkId must be configured.`);
    assertEnum(group.size, ['regular', 'large'], `${groupPath}.size`);
    assert(
      drink.variants.some((variant) => variant.size === group.size),
      `${groupPath}.size must be configured for its drink.`,
    );
    assertEnum(group.milk, ['none', 'dairy', 'oat', 'soy'], `${groupPath}.milk`);
    assert(
      drink.allowedMilks.some((milk) => milk === group.milk),
      `${groupPath}.milk must be configured for its drink.`,
    );
    assertNumber(
      group.priceCents,
      `${groupPath}.priceCents`,
      MIN_REPORT_CHARGE_PRICE_CENTS,
      MAX_REPORT_CHARGE_PRICE_CENTS,
      true,
    );
    assertNumber(group.quantity, `${groupPath}.quantity`, 1, 1_000_000_000, true);
    assertNumber(group.revenueCents, `${groupPath}.revenueCents`, 0, 1_000_000_000, true);
    assert(
      group.revenueCents === group.quantity * group.priceCents,
      `${groupPath}.revenueCents must equal quantity × priceCents.`,
    );
    const identity = [group.drinkId, group.size, group.milk].join(':');
    assert(!identities.has(identity), `${path} must not contain duplicate charge variants.`);
    identities.add(identity);
    quantity += group.quantity;
    revenueCents += group.revenueCents;
  });
  assert(quantity === expectedQuantity, `${path} quantity must match served sales.`);
  assert(revenueCents === expectedRevenueCents, `${path} revenue must match report revenue.`);
  return groups as unknown as ReportChargeGroup[];
}

function validateInventory(
  value: unknown,
  path: string,
  currentDay: number,
): asserts value is IngredientInventory {
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
        batchExpiryDay(
          id,
          batch.acquiredDay,
          INGREDIENT_DETAILS[id].chilled ? EQUIPMENT.refrigeration.tiers.at(-1)!.level : 0,
        ),
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
  assertEnum(member.role, STAFF_ROLES, `${path}.role`);
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

function validateStaffArray(value: unknown, path: string, maximum: number): StaffMember[] {
  return expectArray(value, path, maximum).map((member, index) => {
    validateStaff(member, `${path}[${index}]`);
    return member;
  });
}

function validateStaffIdentities(
  staff: StaffMember[],
  candidateStaff: StaffMember[],
  seed: number,
  currentDay: number,
): void {
  const people = [...staff, ...candidateStaff];
  assert(
    new Set(people.map((member) => member.id)).size === people.length,
    'Staff and candidate IDs must be unique.',
  );
  assert(
    new Set(people.map((member) => member.name)).size === people.length,
    'Staff and candidate names must be unique after normalization.',
  );
  staff.forEach((member, index) => {
    assertNumber(member.hiredOnDay, `activeRun.staff[${index}].hiredOnDay`, 1, currentDay, true);
    const slot = validateDeterministicStaffIdentity(member, seed, `activeRun.staff[${index}]`);
    assert(
      slot.day === member.hiredOnDay,
      `activeRun.staff[${index}].hiredOnDay must match its candidate-pool day.`,
    );
  });
  candidateStaff.forEach((member, index) => {
    assert(member.hiredOnDay === 0, `activeRun.candidateStaff[${index}].hiredOnDay must be zero.`);
    const slot = validateDeterministicStaffIdentity(
      member,
      seed,
      `activeRun.candidateStaff[${index}]`,
    );
    assert(
      slot.day === currentDay,
      `activeRun.candidateStaff[${index}] must belong to the active day.`,
    );
  });
  const currentDayPeople = [
    ...candidateStaff,
    ...staff.filter((member) => member.hiredOnDay === currentDay),
  ];
  const expectedCurrentDayIds = candidatePoolForDay(seed, currentDay).map(({ id }) => id);
  assert(
    currentDayPeople.length === expectedCurrentDayIds.length &&
      expectedCurrentDayIds.every((id) => currentDayPeople.some((member) => member.id === id)),
    'Current-day hires and candidates must account for the complete deterministic candidate pool.',
  );
}

function validateDeterministicStaffIdentity(
  member: StaffMember,
  seed: number,
  path: string,
): { day: number; index: number } {
  const slot = candidateStaffSlotFromId(member.id, seed);
  assert(slot !== null, `${path}.id must be a canonical candidate identity for this campaign.`);
  const expected = candidatePoolForDay(seed, slot.day)[slot.index];
  assert(expected !== undefined, `${path}.id must resolve to a configured candidate slot.`);
  for (const key of ['id', 'name', 'role', 'speed', 'skill', 'wageCents', 'trait'] as const) {
    assert(member[key] === expected[key], `${path}.${key} must match its candidate identity.`);
  }
  return slot;
}

function validateEquipment(value: unknown): asserts value is EquipmentState {
  const equipment = expectRecord(value, 'activeRun.equipment');
  for (const id of EQUIPMENT_IDS) {
    const maximumLevel = EQUIPMENT[id].tiers.at(-1)?.level ?? 0;
    assertNumber(equipment[id], `equipment.${id}`, 0, maximumLevel, true);
  }
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

function assertCanonicalRecordKeys(
  record: Record<string, unknown>,
  keys: readonly string[],
  path: string,
): void {
  assert(
    Object.keys(record).length === keys.length && keys.every((key) => Object.hasOwn(record, key)),
    `${path} must contain every canonical key exactly once.`,
  );
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

function assertSafeId(value: unknown, path: string): asserts value is string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
