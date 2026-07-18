import { describe, expect, it } from 'vitest';

import { CAMPAIGN_RULES, EQUIPMENT } from '../../src/content/gameContent';
import {
  advanceTick,
  buyEquipment,
  closeDay,
  continueEndless,
  createCampaign,
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
  it('wins only at Day 30 with cafe, cash, and reputation targets', () => {
    const fixture = nearVictoryEnvelope().activeRun;
    if (!fixture) throw new Error('Expected victory fixture.');
    const day29 = closeDay({
      ...fixture,
      day: 29,
      lastSettledDay: 28,
      report: { ...fixture.report!, day: 29 },
    });
    expect(day29.phase).toBe('reinvest');

    const victory = closeDay(fixture);
    expect(victory.phase).toBe('victory');
    expect(victory.outcome?.type).toBe('victory');

    for (const changed of [
      { venueId: 'kiosk' as const },
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

  it('orders bankruptcy before Day 30 target evaluation', () => {
    const fixture = nearVictoryEnvelope().activeRun;
    if (!fixture) throw new Error('Expected victory fixture.');
    const bankrupt = closeDay(closeReady(fixture, CAMPAIGN_RULES.overdraftFloorCents - 1));
    expect(bankrupt.outcome?.type).toBe('bankruptcy');
  });

  it('continues a victory into Day 31 endless planning without a Day 30 ending', () => {
    const fixture = nearVictoryEnvelope().activeRun;
    if (!fixture) throw new Error('Expected victory fixture.');
    const victory = closeDay(fixture);
    const endless = continueEndless(victory);
    expect(endless).toMatchObject({ phase: 'planning', mode: 'endless', day: 31, outcome: null });
    expect(endless.candidateStaff).toHaveLength(4);
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
});

describe('seeded full-campaign balance', () => {
  it.each([
    ['careful quality', 7_301, 'quality', 0],
    ['value-focused quality', 9_909, 'quality', -30],
  ] satisfies ReadonlyArray<readonly [string, number, DialIn, number]>)(
    '%s strategy reaches a viable victory',
    (_name, seed, dialIn, priceOffset) => {
      const final = simulateCampaign(seed, dialIn, priceOffset);
      expect(final.outcome?.type).toBe('victory');
      expect(final.venueId).toBe('cafe');
      expect(final.cashCents).toBeGreaterThanOrEqual(CAMPAIGN_RULES.victoryCashCents);
      expect(final.reputation).toBeGreaterThanOrEqual(CAMPAIGN_RULES.victoryReputation);
    },
  );

  it('an overbuying strategy reaches a deterministic bankruptcy', () => {
    let state = createCampaign({ seed: 606 });
    const hiredIds = state.candidateStaff.slice(0, 2).map((candidate) => candidate.id);
    for (const id of hiredIds) state = hireStaff(state, id);
    for (let day = 1; day <= 30 && state.phase === 'planning'; day += 1) {
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

function simulateCampaign(seed: number, dialIn: DialIn, priceOffset: number): GameState {
  let state = createCampaign({ seed });
  while (state.phase === 'planning') {
    state = prepareDay(state, {
      activeMenu: ['espresso', 'longBlack', 'batchBrew'],
      pricesCents: {
        espresso: 450 + priceOffset,
        longBlack: 530 + priceOffset,
        batchBrew: 550 + priceOffset,
      },
      purchases: {
        houseBeans: state.inventory.houseBeans < 280 ? 1 : 0,
        dairyMilk: 0,
      },
      dialIn,
      beanId: 'houseBeans',
    });
    state = closeDay(runRush(startRush(state)));
    if (state.phase !== 'reinvest') break;
    state = investForGrowth(state);
    state = startNextDay(state);
  }
  return state;
}

function investForGrowth(initial: GameState): GameState {
  let state = initial;
  const reserve = 3_000;
  const buyIfReady = (equipmentId: keyof GameState['equipment']): void => {
    const current = state.equipment[equipmentId];
    const tier = EQUIPMENT[equipmentId].tiers[current];
    const venueRank = state.venueId === 'cart' ? 0 : state.venueId === 'kiosk' ? 1 : 2;
    const requiredRank =
      tier?.requiresVenue === 'cart' ? 0 : tier?.requiresVenue === 'kiosk' ? 1 : 2;
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
  }
  return state;
}
