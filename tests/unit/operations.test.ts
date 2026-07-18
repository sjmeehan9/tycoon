import { describe, expect, it } from 'vitest';

import { ALL_DRINK_IDS, EQUIPMENT, EQUIPMENT_IDS } from '../../src/content/gameContent';
import {
  advanceTick,
  buyEquipment,
  candidatePoolForDay,
  closeDay,
  createCampaign,
  demandRate,
  equipmentPreparationMultiplier,
  hireStaff,
  operationalEffects,
  prepareDay,
  promoteVenue,
  resolveEvent,
  serviceQueueCapacity,
  startRush,
  type EquipmentId,
  type GameState,
  type StaffMember,
  type StaffRole,
  type StaffTrait,
} from '../../src/game';

function runToReport(initial: GameState): GameState {
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

function teamMember(
  id: string,
  role: StaffRole,
  trait: StaffTrait,
  speed = 82,
  skill = 84,
): StaffMember {
  return { id, name: id, role, trait, speed, skill, wageCents: 2_850, hiredOnDay: 1 };
}

function withScheduledStaff(state: GameState, members: StaffMember[]): GameState {
  return {
    ...state,
    staff: members,
    plan: { ...state.plan, scheduledStaffIds: members.map((member) => member.id) },
  };
}

function withEquipment(state: GameState, equipmentId: EquipmentId, level = 1): GameState {
  return { ...state, equipment: { ...state.equipment, [equipmentId]: level } };
}

describe('staff operations', () => {
  it('rotates a deterministic balanced candidate pool each day', () => {
    const first = candidatePoolForDay(2_607, 1);
    expect(first).toEqual(candidatePoolForDay(2_607, 1));
    expect(first).not.toEqual(candidatePoolForDay(2_607, 2));
    expect(first.filter((candidate) => candidate.role === 'barista')).toHaveLength(2);
    expect(first.filter((candidate) => candidate.role === 'frontOfHouse')).toHaveLength(2);
    expect(new Set(first.map((candidate) => candidate.id)).size).toBe(4);
  });

  it('hires, schedules, and enforces venue staff capacity', () => {
    let state = createCampaign({ seed: 83 });
    const candidateIds = state.candidateStaff.slice(0, 3).map((candidate) => candidate.id);
    for (const candidateId of candidateIds) state = hireStaff(state, candidateId);
    expect(state.staff).toHaveLength(3);
    state = prepareDay(state, { scheduledStaffIds: candidateIds.slice(0, 2) });
    expect(state.plan.scheduledStaffIds).toHaveLength(2);
    expect(() => prepareDay(state, { scheduledStaffIds: candidateIds })).toThrow(
      'can schedule 2 staff',
    );
    expect(() => hireStaff(state, candidateIds[0] ?? '')).toThrow('no longer available');
  });

  it('applies both roles and every readable trait to the real operational model', () => {
    const base = createCampaign({ seed: 41 });
    const baseline = operationalEffects(base);
    const barista = operationalEffects(
      withScheduledStaff(base, [teamMember('barista', 'barista', 'quickHands')]),
    );
    const frontOfHouse = operationalEffects(
      withScheduledStaff(base, [teamMember('foh', 'frontOfHouse', 'peoplePerson')]),
    );
    const perfectionist = operationalEffects(
      withScheduledStaff(base, [teamMember('perfect', 'barista', 'perfectionist')]),
    );
    const steady = operationalEffects(
      withScheduledStaff(base, [teamMember('steady', 'barista', 'steady')]),
    );
    expect(barista.preparationMultiplier).toBeLessThan(baseline.preparationMultiplier);
    expect(barista.qualityBonus).toBeGreaterThan(baseline.qualityBonus);
    expect(frontOfHouse.patienceMultiplier).toBeGreaterThan(baseline.patienceMultiplier);
    expect(frontOfHouse.demandMultiplier).toBeGreaterThan(baseline.demandMultiplier);
    expect(frontOfHouse.satisfactionBonus).toBeGreaterThan(baseline.satisfactionBonus);
    expect(perfectionist.qualityBonus).toBeGreaterThan(barista.qualityBonus);
    expect(steady.wasteMultiplier).toBeLessThan(baseline.wasteMultiplier);
  });

  it('charges scheduled payroll and exposes its causal service contribution', () => {
    const member = teamMember('daily-barista', 'barista', 'quickHands', 90, 90);
    const reportState = runToReport(
      startRush(withScheduledStaff(createCampaign({ seed: 2 }), [member])),
    );
    const report = reportState.report;
    expect(report).not.toBeNull();
    if (!report) return;
    expect(report.wageCostCents).toBe(member.wageCents);
    expect(report.closingCashCents).toBe(report.openingCashCents + report.netCashFlowCents);
    expect(report.explanations.join(' ')).toContain('scheduled team member');
  });
});

describe('equipment and venue growth', () => {
  it('applies all six equipment families to service calculations', () => {
    const base = createCampaign({ seed: 71 });
    expect(operationalEffects(withEquipment(base, 'grinder')).qualityBonus).toBeGreaterThan(0);
    expect(
      equipmentPreparationMultiplier(withEquipment(base, 'espressoMachine'), 'flatWhite'),
    ).toBe(0.92);
    expect(equipmentPreparationMultiplier(withEquipment(base, 'batchBrewer'), 'batchBrew')).toBe(
      0.75,
    );
    expect(operationalEffects(withEquipment(base, 'refrigeration')).wasteMultiplier).toBe(0.65);
    const withPos = operationalEffects(withEquipment(base, 'pos'));
    expect(withPos.demandMultiplier).toBeGreaterThan(1);
    expect(withPos.preparationMultiplier).toBeLessThan(1);
    expect(serviceQueueCapacity(withEquipment(base, 'serviceCounter'))).toBe(
      serviceQueueCapacity(base) + 2,
    );
  });

  it.each(EQUIPMENT_IDS)('%s is wired into a complete day and settlement', (equipmentId) => {
    const base = createCampaign({ seed: 2 });
    const equipped = withEquipment(base, equipmentId);
    const reportState = runToReport(startRush(equipped));
    expect(reportState.report?.operatingCostCents).toBeGreaterThan(450);
    expect(reportState.report?.explanations.join(' ')).toContain(EQUIPMENT[equipmentId].name);
  });

  it('moves demand, preparation, waste, and capacity in their intended directions', () => {
    const base = startRush(createCampaign({ seed: 2 }));
    const pos = startRush(withEquipment(createCampaign({ seed: 2 }), 'pos'));
    expect(demandRate(pos)).toBeGreaterThan(demandRate(base));
    const refrigerated = runToReport(
      startRush(
        prepareDay(withEquipment(createCampaign({ seed: 2 }), 'refrigeration'), {
          purchases: { dairyMilk: 4 },
        }),
      ),
    );
    const unrefrigerated = runToReport(
      startRush(prepareDay(createCampaign({ seed: 2 }), { purchases: { dairyMilk: 4 } })),
    );
    expect(refrigerated.report?.waste.dairyMilk ?? 0).toBeLessThan(
      unrefrigerated.report?.waste.dairyMilk ?? 0,
    );
  });

  it('enforces tier availability, affordability, and both promotion gates', () => {
    const reinvest = closeDay(runToReport(startRush(createCampaign({ seed: 2 }))));
    const funded = { ...reinvest, cashCents: 100_000, reputation: 60 };
    const grinderOne = buyEquipment(funded, 'grinder');
    expect(grinderOne.equipment.grinder).toBe(1);
    expect(() => buyEquipment(grinderOne, 'grinder')).toThrow('requires a Coffee Kiosk');
    expect(() => promoteVenue(funded)).toThrow('Grinder level 1');

    const kioskReady = {
      ...funded,
      equipment: { ...funded.equipment, grinder: 1, espressoMachine: 1 },
    };
    const kiosk = promoteVenue(kioskReady);
    expect(kiosk.venueId).toBe('kiosk');
    expect(kiosk.cashCents).toBe(kioskReady.cashCents - 8_000);

    const cafeReady = {
      ...kiosk,
      cashCents: 100_000,
      equipment: {
        ...kiosk.equipment,
        grinder: 2,
        espressoMachine: 2,
        refrigeration: 1,
        pos: 1,
      },
    };
    const cafe = promoteVenue(cafeReady);
    expect(cafe.venueId).toBe('cafe');
    expect(
      prepareDay({ ...cafe, phase: 'planning' }, { activeMenu: ALL_DRINK_IDS }).plan.activeMenu,
    ).toHaveLength(10);
  });
});
