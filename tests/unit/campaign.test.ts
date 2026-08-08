import { describe, expect, it } from 'vitest';

import { CAMPAIGN_RULES, EQUIPMENT, VENUE_IDS } from '../../src/content/gameContent';
import {
  advanceTick,
  buyEquipment,
  campaignRecordsByDifficulty,
  closeDay,
  continueEndless,
  createCampaign,
  ingredientQuantity,
  hireStaff,
  prepareDay,
  promoteVenue,
  recordCampaignOutcome,
  resolveEvent,
  startNextDay,
  startRush,
  type DialIn,
  type GameState,
} from '../../src/game';
import { createDefaultMeta } from '../../src/persistence/saveStore';
import { nearBankruptcyEnvelope, nearVictoryEnvelope } from '../fixtures/campaignFixtures';

function closeReady(state: GameState, closingCashCents: number): GameState {
  if (!state.report) throw new Error('Fixture must have a report.');
  return {
    ...state,
    phase: 'report',
    cashCents: closingCashCents,
    report: {
      ...state.report,
      openingCashCents: closingCashCents,
      netCashFlowCents: 0,
      closingCashCents,
      settled: false,
    },
  };
}

function runRush(initial: GameState): GameState {
  let state = initial;
  let safety = 0;
  while (state.phase !== 'report' && safety < 1_000) {
    if (state.phase === 'event') {
      const choice = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choice) throw new Error('Event had no choice.');
      state = resolveEvent(state, choice);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (state.phase !== 'report') throw new Error('Rush did not complete.');
  return state;
}

describe('campaign outcome boundaries', () => {
  it('defaults to Standard and keeps scenario and immutable difficulty orthogonal', () => {
    const standard = createCampaign({ seed: 4_000, scenarioId: 'rainySeason' });
    const hard = createCampaign({
      seed: 4_000,
      scenarioId: 'rainySeason',
      difficulty: 'hard',
    });
    expect(standard).toMatchObject({ difficulty: 'standard', scenarioId: 'rainySeason' });
    expect(hard).toMatchObject({ difficulty: 'hard', scenarioId: 'rainySeason' });
    expect(hard.campaignId).not.toBe(standard.campaignId);
    expect(prepareDay(hard, { dialIn: 'quality' }).difficulty).toBe('hard');
    expect(startRush(hard).difficulty).toBe('hard');
  });

  it('wins exactly at the Day 40 department-store boundary, including target equality', () => {
    const fixture = nearVictoryEnvelope().activeRun;
    if (!fixture) throw new Error('Expected victory fixture.');
    const day39 = closeDay({
      ...fixture,
      day: CAMPAIGN_RULES.durationDays - 1,
      lastSettledDay: CAMPAIGN_RULES.durationDays - 2,
      report: { ...fixture.report!, day: CAMPAIGN_RULES.durationDays - 1 },
    });
    expect(day39.phase).toBe('reinvest');

    const equality = closeReady(
      { ...fixture, reputation: CAMPAIGN_RULES.victoryReputation },
      CAMPAIGN_RULES.victoryCashCents,
    );
    const victory = closeDay(equality);
    expect(victory.phase).toBe('victory');
    expect(victory.outcome?.type).toBe('victory');

    for (const changed of [
      { venueId: 'cart' as const },
      { venueId: 'kiosk' as const },
      { venueId: 'cafe' as const },
      { cashCents: CAMPAIGN_RULES.victoryCashCents - 1 },
      { reputation: CAMPAIGN_RULES.victoryReputation - 1 },
    ]) {
      const candidate = closeReady(
        { ...fixture, ...changed },
        changed.cashCents ?? fixture.cashCents,
      );
      expect(closeDay(candidate).outcome?.type).toBe('targetMissed');
    }
  });

  it('checks bankruptcy after settlement, with equality safe and crossing terminal', () => {
    const fixture = nearBankruptcyEnvelope().activeRun;
    if (!fixture) throw new Error('Expected bankruptcy fixture.');
    const equality = closeDay(closeReady(fixture, CAMPAIGN_RULES.overdraftFloorCents));
    expect(equality.phase).toBe('reinvest');
    expect(equality.outcome).toBeNull();
    const crossed = closeDay(closeReady(fixture, CAMPAIGN_RULES.overdraftFloorCents - 1));
    expect(crossed.phase).toBe('defeat');
    expect(crossed.outcome?.type).toBe('bankruptcy');
  });

  it('orders bankruptcy before Day 40 target evaluation', () => {
    const fixture = nearVictoryEnvelope().activeRun;
    if (!fixture) throw new Error('Expected victory fixture.');
    const bankrupt = closeDay(closeReady(fixture, CAMPAIGN_RULES.overdraftFloorCents - 1));
    expect(bankrupt.outcome?.type).toBe('bankruptcy');
  });

  it('continues a victory into Day 41 endless planning without another campaign ending', () => {
    const fixture = nearVictoryEnvelope().activeRun;
    if (!fixture) throw new Error('Expected victory fixture.');
    const victory = closeDay(fixture);
    const endless = continueEndless(victory);
    expect(endless).toMatchObject({ phase: 'planning', mode: 'endless', day: 41, outcome: null });
    expect(endless.candidateStaff).toHaveLength(4);
  });

  it('reaches supported endless Day 10,000 with fresh names and stops beyond it', () => {
    const base = createCampaign({ seed: 10_000 });
    const retainedStaff = base.candidateStaff.slice(0, 2).map((member) => ({
      ...member,
      hiredOnDay: 1,
    }));
    const day9_999: GameState = {
      ...base,
      mode: 'endless',
      phase: 'reinvest',
      day: 9_999,
      lastSettledDay: 9_999,
      staff: retainedStaff,
      candidateStaff: [],
    };

    const day10_000 = startNextDay(day9_999);
    const people = [...day10_000.staff, ...day10_000.candidateStaff];
    expect(day10_000).toMatchObject({ day: 10_000, phase: 'planning', mode: 'endless' });
    expect(day10_000.candidateStaff).toHaveLength(4);
    expect(new Set(people.map((member) => member.id)).size).toBe(people.length);
    expect(new Set(people.map((member) => member.name)).size).toBe(people.length);
    expect(() => startNextDay({ ...day10_000, phase: 'reinvest', lastSettledDay: 10_000 })).toThrow(
      'from 1 to 10000',
    );
  });

  it('resets one seed reproducibly while a fresh seed permutes candidate names', () => {
    const first = createCampaign({ seed: 4_404 }).candidateStaff.map((member) => member.name);
    const reset = createCampaign({ seed: 4_404 }).candidateStaff.map((member) => member.name);
    const freshSeed = createCampaign({ seed: 4_405 }).candidateStaff.map((member) => member.name);

    expect(reset).toEqual(first);
    expect(freshSeed).not.toEqual(first);
  });
});

describe('cosmetic-only meta progress', () => {
  it('records outcomes exactly once and unlocks no permanent economic bonus', () => {
    const fixture = nearVictoryEnvelope().activeRun;
    if (!fixture) throw new Error('Expected victory fixture.');
    const victory = closeDay({
      ...fixture,
      reputation: 90,
      report: { ...fixture.report!, closingCashCents: 50_000 },
    });
    const initial = createDefaultMeta();
    const unlocked = recordCampaignOutcome(initial, victory);
    const repeated = recordCampaignOutcome(unlocked, victory);
    expect(unlocked.endlessUnlocked).toBe(true);
    expect(unlocked.achievements).toEqual(expect.arrayContaining(['cafeFounder', 'goldenCup']));
    expect(unlocked.cosmetics).toEqual(expect.arrayContaining(['wattleAwning', 'neonCup']));
    expect(unlocked.scenarios).toEqual(expect.arrayContaining(['rainySeason', 'festivalWeek']));
    expect(repeated.records).toHaveLength(1);
    expect(createCampaign({ seed: 8 }).cashCents).toBe(createCampaign({ seed: 9 }).cashCents);
  });

  it('partitions records by difficulty while retaining shared neutral unlocks', () => {
    const source = nearVictoryEnvelope().activeRun;
    if (!source) throw new Error('Expected victory fixture.');
    const standardVictory = closeDay(source);
    const hardVictory = closeDay({
      ...source,
      campaignId: source.campaignId.replace('standard', 'hard'),
      difficulty: 'hard',
      report: source.report ? { ...source.report, difficulty: 'hard' } : null,
    });
    const afterStandard = recordCampaignOutcome(createDefaultMeta(), standardVictory);
    const combined = recordCampaignOutcome(afterStandard, hardVictory);
    const partitioned = campaignRecordsByDifficulty(combined);

    expect(partitioned.standard).toHaveLength(1);
    expect(partitioned.hard).toHaveLength(1);
    expect(combined.endlessUnlocked).toBe(true);
    expect(combined.scenarios).toEqual(afterStandard.scenarios);
    expect(createCampaign({ seed: 71, difficulty: 'hard' }).cashCents).toBe(
      createCampaign({ seed: 72 }).cashCents,
    );
  });
});

describe('seeded full-campaign balance', () => {
  it.each([
    ['Standard careful quality', 'standard', 7_301, 'quality', 0],
    ['Hard value-focused quality', 'hard', 9_909, 'quality', -30],
  ] satisfies ReadonlyArray<readonly [string, GameState['difficulty'], number, DialIn, number]>)(
    '%s strategy reaches the department store and a viable victory',
    (_name, difficulty, seed, dialIn, priceOffset) => {
      const { departmentDay, final } = simulateCampaign(seed, difficulty, dialIn, priceOffset);
      expect(final.outcome?.type).toBe('victory');
      expect(final.venueId).toBe('departmentStore');
      expect(departmentDay).not.toBeNull();
      expect(departmentDay).toBeLessThanOrEqual(CAMPAIGN_RULES.durationDays);
      expect(final.cashCents).toBeGreaterThanOrEqual(CAMPAIGN_RULES.victoryCashCents);
      expect(final.reputation).toBeGreaterThanOrEqual(CAMPAIGN_RULES.victoryReputation);
    },
  );

  it('an overbuying strategy reaches a deterministic bankruptcy', () => {
    let state = createCampaign({ seed: 606 });
    const hiredIds = state.candidateStaff.slice(0, 2).map((candidate) => candidate.id);
    for (const id of hiredIds) state = hireStaff(state, id);
    for (let day = 1; day <= CAMPAIGN_RULES.durationDays && state.phase === 'planning'; day += 1) {
      state = prepareDay(state, {
        activeMenu: ['espresso'],
        pricesCents: { espresso: 250 },
        purchases: {
          houseBeans: Math.max(0, Math.min(20, Math.floor(state.cashCents / 1_600))),
          dairyMilk: 0,
        },
        dialIn: 'quality',
        scheduledStaffIds: hiredIds,
      });
      state = closeDay(runRush(startRush(state)));
      if (state.phase === 'reinvest') state = startNextDay(state);
    }
    expect(state.outcome?.type).toBe('bankruptcy');
  });
});

function simulateCampaign(
  seed: number,
  difficulty: GameState['difficulty'],
  dialIn: DialIn,
  priceOffset: number,
): { final: GameState; departmentDay: number | null } {
  let state = createCampaign({ seed, difficulty });
  let departmentDay: number | null = null;
  while (state.phase === 'planning') {
    state = prepareDay(state, {
      activeMenu: ['espresso', 'longBlack', 'batchBrew'],
      pricesCents: {
        espresso: 450 + priceOffset,
        longBlack: 530 + priceOffset,
        batchBrew: 550 + priceOffset,
      },
      purchases: {
        houseBeans: ingredientQuantity(state.inventory, 'houseBeans') < 280 ? 1 : 0,
        dairyMilk: 0,
      },
      dialIn,
      beanId: 'houseBeans',
    });
    state = closeDay(runRush(startRush(state)));
    if (state.phase !== 'reinvest') break;
    state = investForGrowth(state);
    if (state.venueId === 'departmentStore' && departmentDay === null) departmentDay = state.day;
    state = startNextDay(state);
  }
  return { final: state, departmentDay };
}

function investForGrowth(initial: GameState): GameState {
  let state = initial;
  const reserve = 3_000;
  const buyIfReady = (equipmentId: keyof GameState['equipment']): void => {
    const current = state.equipment[equipmentId];
    const tier = EQUIPMENT[equipmentId].tiers.find((candidate) => candidate.level === current + 1);
    const venueRank = VENUE_IDS.indexOf(state.venueId);
    const requiredRank = tier ? VENUE_IDS.indexOf(tier.requiresVenue) : Number.POSITIVE_INFINITY;
    if (tier && venueRank >= requiredRank && state.cashCents >= tier.costCents + reserve)
      state = buyEquipment(state, equipmentId);
  };
  if (state.venueId === 'cart') {
    buyIfReady('grinder');
    buyIfReady('espressoMachine');
    if (
      state.equipment.grinder >= 1 &&
      state.equipment.espressoMachine >= 1 &&
      state.reputation >= 38 &&
      state.cashCents >= 11_000
    ) {
      state = promoteVenue(state);
    }
  } else if (state.venueId === 'kiosk') {
    buyIfReady('grinder');
    buyIfReady('espressoMachine');
    buyIfReady('refrigeration');
    buyIfReady('pos');
    if (
      state.equipment.grinder >= 2 &&
      state.equipment.espressoMachine >= 2 &&
      state.equipment.refrigeration >= 1 &&
      state.equipment.pos >= 1 &&
      state.reputation >= 55 &&
      state.cashCents >= 23_000
    ) {
      state = promoteVenue(state);
    }
  } else if (state.venueId === 'cafe' && state.reputation >= 70 && state.cashCents >= 23_000) {
    state = promoteVenue(state);
  }
  return state;
}
