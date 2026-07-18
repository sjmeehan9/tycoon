import { describe, expect, it } from 'vitest';

import {
  CAMPAIGN_RULES,
  MAX_INVENTORY_BATCHES_PER_INGREDIENT,
  RUSH_ACTIVITY_LIMIT,
} from '../../src/content/gameContent';
import {
  advanceTick,
  closeDay,
  createCampaign,
  hireStaff,
  inventoryTotals,
  prepareDay,
  reservedStaffName,
  resolveEvent,
  setRushSpeed,
  startRush,
  togglePause,
  type StaffMember,
} from '../../src/game';
import {
  BACKUP_SAVE_KEY,
  BrowserSaveStore,
  LEGACY_SAVE_KEY,
  LEGACY_V2_BACKUP_SAVE_KEY,
  LEGACY_V2_SAVE_KEY,
  SAVE_KEY,
  SaveValidationError,
  createSaveEnvelope,
  importEnvelope,
  parseEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import { duplicateStaffNamesEnvelope, nearVictoryEnvelope } from '../fixtures/campaignFixtures';

interface MutableLegacyEnvelope {
  schemaVersion: number;
  activeRun: {
    stateVersion: number;
    inventory: unknown;
    rush:
      | ({
          recentActivity?: unknown;
          openingInventory?: unknown;
          purchasedInventory?: unknown;
        } & Record<string, unknown>)
      | null;
    report: Record<string, unknown> | null;
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

  it('repairs duplicate schema-v3 names in hires-then-candidates order', () => {
    const source = duplicateStaffNamesEnvelope();
    const sourceRun = source.activeRun;
    if (!sourceRun) throw new Error('Expected duplicate staff fixture.');
    const migrated = importEnvelope(JSON.stringify(source));
    const migratedRun = migrated.activeRun;
    if (!migratedRun) throw new Error('Expected migrated staff fixture.');

    const sourcePeople = [...sourceRun.staff, ...sourceRun.candidateStaff];
    const migratedPeople = [...migratedRun.staff, ...migratedRun.candidateStaff];
    const migratedNames = migratedPeople.map((member) => member.name);
    expect(migratedNames[0]).toBe(sourcePeople[0]?.name);
    expect(migratedNames[1]).not.toBe(sourcePeople[1]?.name);
    expect(migratedNames[2]).toBe(reservedStaffName(sourceRun.seed, 0));
    expect(migratedNames[3]).not.toBe(sourcePeople[3]?.name);
    expect(migratedNames[4]).toBe('Marnie Unique');
    expect(migratedNames[5]).not.toBe(sourcePeople[5]?.name);
    expect(new Set(migratedNames).size).toBe(migratedPeople.length);
    expect(migratedPeople.map(staffIdentityWithoutName)).toEqual(
      sourcePeople.map(staffIdentityWithoutName),
    );
    expect(importEnvelope(JSON.stringify(source)).activeRun).toEqual(migratedRun);
    expect(parseEnvelope(serializeEnvelope(migrated))?.activeRun).toEqual(migratedRun);
  });

  it('rejects duplicate staff IDs after name normalization', () => {
    const envelope = createSaveEnvelope(createCampaign({ seed: 8_088 }));
    const run = envelope.activeRun;
    if (!run) throw new Error('Expected active campaign.');
    const firstId = run.candidateStaff[0]?.id;
    if (!firstId || !run.candidateStaff[1]) throw new Error('Expected candidate IDs.');
    const candidateStaff = run.candidateStaff.map((member, index) =>
      index === 1 ? { ...member, id: firstId } : member,
    );

    expect(() =>
      importEnvelope(JSON.stringify({ ...envelope, activeRun: { ...run, candidateStaff } })),
    ).toThrow('Staff and candidate IDs must be unique');
  });

  it('keeps repaired saves bounded without persisted name-allocation history', () => {
    const normalized = importEnvelope(JSON.stringify(duplicateStaffNamesEnvelope()));
    const serialized = serializeEnvelope(normalized);

    expect(new TextEncoder().encode(serialized).byteLength).toBeLessThan(
      CAMPAIGN_RULES.maximumSaveBytes,
    );
    expect(serialized).not.toMatch(/seenNames|nameHistory|usedStaffNames/i);
    expect(normalized.activeRun).not.toHaveProperty('seenNames');
    expect(normalized.activeRun).not.toHaveProperty('staffNameHistory');
  });

  it('rejects malformed or wrong-version payloads', () => {
    expect(parseEnvelope('{')).toBeNull();
    expect(parseEnvelope(JSON.stringify({ schemaVersion: 99 }))).toBeNull();
    expect(
      parseEnvelope(JSON.stringify({ schemaVersion: 1, savedAt: '', activeRun: {} })),
    ).toBeNull();
  });

  it('migrates every supported version 1 field into schema version 3', () => {
    const legacy = versionTwoFixture(nearVictoryEnvelope());
    legacy.schemaVersion = 1;
    legacy.activeRun.stateVersion = 1;
    if (!legacy.activeRun.report) throw new Error('Expected legacy report.');
    delete legacy.activeRun.report.wageCostCents;
    legacy.activeRun.history = [{ ...legacy.activeRun.report }];
    const legacyHistoryReport = legacy.activeRun.history[0];
    if (!legacyHistoryReport) throw new Error('Expected legacy history report.');
    delete legacyHistoryReport.wageCostCents;
    legacy.meta.achievements = ['legacy-unknown'];
    const migrated = importEnvelope(JSON.stringify(legacy));
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.activeRun?.stateVersion).toBe(3);
    expect(migrated.activeRun?.report?.wageCostCents).toBe(0);
    expect(migrated.activeRun?.history[0]?.wageCostCents).toBe(0);
    expect(migrated.meta.achievements).toEqual([]);
  });

  it('discovers and migrates a legacy browser key', () => {
    const legacy = versionTwoFixture(createSaveEnvelope(createCampaign({ seed: 91 })));
    legacy.schemaVersion = 1;
    legacy.activeRun.stateVersion = 1;
    window.localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(legacy));
    const loaded = new BrowserSaveStore(window.localStorage).load();
    expect(loaded.source).toBe('legacy-v1');
    expect(loaded.envelope?.activeRun?.stateVersion).toBe(3);
    expect(loaded.warning).toContain('migrated');
  });

  it('checks v2 primary and backup keys before the first v3 write', () => {
    const primary = versionTwoFixture(createSaveEnvelope(createCampaign({ seed: 92 })));
    const backup = versionTwoFixture(createSaveEnvelope(createCampaign({ seed: 93 })));
    window.localStorage.setItem(LEGACY_V2_SAVE_KEY, '{broken');
    window.localStorage.setItem(LEGACY_V2_BACKUP_SAVE_KEY, JSON.stringify(backup));
    const store = new BrowserSaveStore(window.localStorage);
    const loadedBackup = store.load();
    expect(loadedBackup).toMatchObject({ source: 'legacy-v2' });
    expect(loadedBackup.envelope?.activeRun?.seed).toBe(93);

    window.localStorage.setItem(LEGACY_V2_SAVE_KEY, JSON.stringify(primary));
    const loadedPrimary = store.load();
    expect(loadedPrimary.envelope?.activeRun?.seed).toBe(92);
    if (!loadedPrimary.envelope) throw new Error('Expected migrated v2 primary.');
    store.save(loadedPrimary.envelope);
    expect(parseEnvelope(window.localStorage.getItem(BACKUP_SAVE_KEY) ?? '')?.activeRun?.seed).toBe(
      92,
    );
    expect(parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')?.schemaVersion).toBe(3);
  });

  it('migrates flat v2 stock as current-day full-life batches without losing an active rush', () => {
    let active = startRush(
      prepareDay(createCampaign({ seed: 94 }), {
        purchases: { houseBeans: 2, dairyMilk: 2 },
      }),
    );
    for (let index = 0; index < 35 && active.phase === 'rush'; index += 1) {
      active = advanceTick(active);
    }
    const legacy = versionTwoFixture(createSaveEnvelope(active));
    legacy.activeRun.stateVersion = 2;
    const flat = legacy.activeRun.inventory as Record<string, number>;
    flat.dairyMilk = 777;
    flat.houseBeans = 333;
    const migrated = importEnvelope(JSON.stringify(legacy));

    expect(migrated.activeRun?.phase).toBe(active.phase);
    expect(migrated.activeRun?.rngState).toBe(active.rngState);
    expect(migrated.activeRun?.rush?.tick).toBe(active.rush?.tick);
    expect(migrated.activeRun?.rush?.queue).toEqual(active.rush?.queue);
    expect(migrated.activeRun?.rush?.activeService).toEqual(active.rush?.activeService);
    expect(migrated.activeRun?.inventory.dairyMilk).toEqual([
      { quantity: 777, acquiredDay: active.day, expiresAfterDay: active.day + 2 },
    ]);
    expect(migrated.activeRun?.inventory.houseBeans).toEqual([
      { quantity: 333, acquiredDay: active.day, expiresAfterDay: active.day + 2 },
    ]);
    expect(migrated.activeRun?.rush?.purchasedInventory).toMatchObject({
      houseBeans: 1_000,
      dairyMilk: 4_000,
    });
  });

  it('migrates legacy stock with the existing refrigeration tier at full shelf life', () => {
    const state = {
      ...createCampaign({ seed: 95 }),
      day: 7,
      equipment: { ...createCampaign({ seed: 95 }).equipment, refrigeration: 2 },
    };
    const legacy = versionTwoFixture(createSaveEnvelope(state));
    const flat = legacy.activeRun.inventory as Record<string, number>;
    flat.dairyMilk = 600;
    flat.coldBrewConcentrate = 900;
    flat.houseBeans = 500;
    const migrated = importEnvelope(JSON.stringify(legacy));

    expect(migrated.activeRun?.inventory.dairyMilk[0]?.expiresAfterDay).toBe(11);
    expect(migrated.activeRun?.inventory.coldBrewConcentrate[0]?.expiresAfterDay).toBe(11);
    expect(migrated.activeRun?.inventory.houseBeans[0]?.expiresAfterDay).toBe(9);
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

  it('normalizes sale-only v3/v2 activity and validates the bounded event union', () => {
    const started = createSaveEnvelope(startRush(createCampaign({ seed: 809 })));
    const withoutActivity = versionTwoFixture(started);
    if (!withoutActivity.activeRun.rush) throw new Error('Expected active v2 rush.');
    delete withoutActivity.activeRun.rush.recentActivity;
    expect(importEnvelope(JSON.stringify(withoutActivity)).activeRun?.rush?.recentActivity).toEqual(
      [],
    );

    let withSale = startRush(createCampaign({ seed: 810 }));
    while (
      withSale.phase === 'rush' &&
      !withSale.rush?.recentActivity.some((event) => event.type === 'sale')
    ) {
      withSale = advanceTick(withSale);
    }
    const sale = withSale.rush?.recentActivity.find((event) => event.type === 'sale');
    expect(sale).toBeDefined();
    const roundTrip = importEnvelope(JSON.stringify(createSaveEnvelope(withSale)));
    expect(roundTrip.activeRun?.rush?.recentActivity).toEqual(withSale.rush?.recentActivity);

    if (!sale || !started.activeRun?.rush) throw new Error('Expected a completed sale fixture.');
    const legacyV3 = JSON.parse(JSON.stringify(createSaveEnvelope(withSale))) as {
      activeRun: { rush: Record<string, unknown> };
    };
    legacyV3.activeRun.rush.recentActivity = [
      {
        type: sale.type,
        tick: sale.tick,
        drinkId: sale.drinkId,
        size: sale.size,
        milk: sale.milk,
        priceCents: sale.priceCents,
      },
    ];
    delete legacyV3.activeRun.rush.nextActivitySequence;
    const normalized = importEnvelope(JSON.stringify(legacyV3)).activeRun?.rush;
    expect(normalized?.recentActivity).toEqual([
      expect.objectContaining({
        id: 'd1-legacy-e0',
        sequence: 0,
        customerId: 'legacy-sale-1',
        segment: null,
        type: 'sale',
        priceCents: sale.priceCents,
      }),
    ]);
    expect(normalized?.nextActivitySequence).toBe(1);

    started.activeRun.rush.recentActivity = Array.from(
      { length: RUSH_ACTIVITY_LIMIT + 1 },
      () => sale,
    );
    expect(() => importEnvelope(JSON.stringify(started))).toThrow(
      `${RUSH_ACTIVITY_LIMIT}-item limit`,
    );

    const invalid = JSON.parse(JSON.stringify(createSaveEnvelope(withSale))) as {
      activeRun: { rush: { recentActivity: Array<Record<string, unknown>> } };
    };
    const first = invalid.activeRun.rush.recentActivity[0];
    if (!first) throw new Error('Expected activity for invalid fixture.');
    invalid.activeRun.rush.recentActivity[0] = {
      ...first,
      type: 'walkaway',
      reason: 'futureReason',
    };
    expect(() => importEnvelope(JSON.stringify(invalid))).toThrow('reason is not supported');

    const falseLegacy = JSON.parse(JSON.stringify(createSaveEnvelope(withSale))) as {
      activeRun: { rush: { recentActivity: Array<Record<string, unknown>> } };
    };
    const current = falseLegacy.activeRun.rush.recentActivity[0];
    if (!current) throw new Error('Expected activity for false-legacy fixture.');
    falseLegacy.activeRun.rush.recentActivity[0] = { ...current, segment: null };
    expect(() => importEnvelope(JSON.stringify(falseLegacy))).toThrow(
      'segment may be null only for normalized legacy sales',
    );

    const forgedId = JSON.parse(JSON.stringify(createSaveEnvelope(withSale))) as {
      activeRun: { rush: { recentActivity: Array<Record<string, unknown>> } };
    };
    const canonical = forgedId.activeRun.rush.recentActivity[0];
    if (!canonical) throw new Error('Expected activity for forged-ID fixture.');
    forgedId.activeRun.rush.recentActivity[0] = { ...canonical, id: 'safe-but-forged' };
    expect(() => importEnvelope(JSON.stringify(forgedId))).toThrow(
      'id must match its day and sequence',
    );
  });

  it('continues event identity and ordering exactly after an export/import reload', () => {
    let live = startRush(createCampaign({ seed: 810 }));
    for (let index = 0; index < 40; index += 1) live = advanceTick(live);
    const reloaded = importEnvelope(JSON.stringify(createSaveEnvelope(live))).activeRun;
    if (!reloaded) throw new Error('Expected reloaded active rush.');
    let uninterrupted = live;
    let continued = reloaded;
    for (let index = 0; index < 40; index += 1) {
      uninterrupted = advanceTick(uninterrupted);
      continued = advanceTick(continued);
    }
    expect(continued.rush?.recentActivity).toEqual(uninterrupted.rush?.recentActivity);
    expect(continued.rush?.nextActivitySequence).toBe(uninterrupted.rush?.nextActivitySequence);
    expect(continued).toEqual(uninterrupted);
  });

  it('rejects malformed, unbounded, and non-conserving v3 inventory evidence', () => {
    const valid = createSaveEnvelope(startRush(createCampaign({ seed: 811 })));
    const tooMany = JSON.parse(JSON.stringify(valid)) as {
      activeRun: { inventory: { dairyMilk: unknown[] } };
    };
    tooMany.activeRun.inventory.dairyMilk = Array.from(
      { length: MAX_INVENTORY_BATCHES_PER_INGREDIENT + 1 },
      (_, index) => ({ quantity: 1, acquiredDay: 1, expiresAfterDay: 3 + index }),
    );
    expect(() => importEnvelope(JSON.stringify(tooMany))).toThrow('8-item limit');

    const invalidExpiry = JSON.parse(JSON.stringify(valid)) as {
      activeRun: { inventory: { dairyMilk: unknown[] } };
    };
    invalidExpiry.activeRun.inventory.dairyMilk = [
      { quantity: 1, acquiredDay: 1, expiresAfterDay: 6 },
    ];
    expect(() => importEnvelope(JSON.stringify(invalidExpiry))).toThrow('allowed bounds');

    const alreadyExpired = JSON.parse(JSON.stringify(valid)) as {
      activeRun: { day: number; inventory: { dairyMilk: unknown[] } };
    };
    alreadyExpired.activeRun.day = 4;
    alreadyExpired.activeRun.inventory.dairyMilk = [
      { quantity: 1, acquiredDay: 1, expiresAfterDay: 3 },
    ];
    expect(() => importEnvelope(JSON.stringify(alreadyExpired))).toThrow('allowed bounds');

    let reportState = startRush(createCampaign({ seed: 812 }));
    while (reportState.phase === 'rush') reportState = advanceTick(reportState);
    if (reportState.phase === 'event') reportState = resolveEvent(reportState, 'protect-queue');
    while (reportState.phase !== 'report') {
      if (reportState.phase === 'event') {
        const choice = reportState.rush?.pendingEvent?.choices[0]?.id;
        if (!choice) throw new Error('Expected event choice.');
        reportState = resolveEvent(reportState, choice);
      } else reportState = advanceTick(reportState);
    }
    const brokenConservation = JSON.parse(JSON.stringify(createSaveEnvelope(reportState))) as {
      activeRun: { report: { inventoryLifecycle: { remaining: { dairyMilk: number } } } };
    };
    brokenConservation.activeRun.report.inventoryLifecycle.remaining.dairyMilk += 1;
    expect(() => importEnvelope(JSON.stringify(brokenConservation))).toThrow(
      'does not conserve quantity',
    );
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

function staffIdentityWithoutName(member: StaffMember): Omit<StaffMember, 'name'> {
  return {
    id: member.id,
    role: member.role,
    speed: member.speed,
    skill: member.skill,
    wageCents: member.wageCents,
    trait: member.trait,
    hiredOnDay: member.hiredOnDay,
  };
}

function versionTwoFixture(envelope: ReturnType<typeof createSaveEnvelope>): MutableLegacyEnvelope {
  if (!envelope.activeRun) throw new Error('Legacy fixture requires an active run.');
  const fixture = JSON.parse(JSON.stringify(envelope)) as MutableLegacyEnvelope;
  fixture.schemaVersion = 2;
  fixture.activeRun.stateVersion = 2;
  fixture.activeRun.inventory = inventoryTotals(envelope.activeRun.inventory);
  if (fixture.activeRun.rush) {
    delete fixture.activeRun.rush.openingInventory;
    delete fixture.activeRun.rush.purchasedInventory;
  }
  if (fixture.activeRun.report) delete fixture.activeRun.report.inventoryLifecycle;
  for (const report of fixture.activeRun.history) delete report.inventoryLifecycle;
  return fixture;
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
