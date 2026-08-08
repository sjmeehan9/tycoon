import { describe, expect, it } from 'vitest';

import {
  ALL_DRINK_IDS,
  BEAN_DETAILS,
  DRINK_MAP,
  EQUIPMENT,
  EQUIPMENT_IDS,
  STAFF_ROLES,
  VENUE_WORKFORCE_CAPACITY,
} from '../../src/content/gameContent';
import {
  advanceTick,
  buyEquipment,
  batchExpiryDay,
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
  setRushSpeed,
  startNextDay,
  startRush,
  type EquipmentId,
  type GameState,
  type StaffMember,
  type StaffRole,
  type StaffTrait,
} from '../../src/game';
import { createRenderSnapshot } from '../../src/scene/three/renderSnapshot';

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

function advanceToFirstService(initial: GameState): GameState {
  let state = startRush(initial);
  let safety = 0;
  while (!state.rush?.activeService && safety < 500) {
    if (state.phase === 'event') {
      const choice = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choice) throw new Error('Event had no choice.');
      state = resolveEvent(state, choice);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (!state.rush?.activeService) throw new Error('No service began.');
  return state;
}

describe('staff operations', () => {
  it('rotates a deterministic balanced candidate pool each day', () => {
    const first = candidatePoolForDay(2_607, 1);
    expect(first).toEqual(candidatePoolForDay(2_607, 1));
    expect(first).not.toEqual(candidatePoolForDay(2_607, 2));
    expect(first.map((candidate) => candidate.role)).toEqual(STAFF_ROLES);
    expect(new Set(first.map((candidate) => candidate.id)).size).toBe(4);
    expect(new Set(first.map((candidate) => candidate.name)).size).toBe(4);
    expect(
      first.map((member) => ({
        role: member.role,
        speed: member.speed,
        skill: member.skill,
        wageCents: member.wageCents,
        trait: member.trait,
      })),
    ).toEqual([
      {
        role: 'barista',
        speed: 58,
        skill: 51,
        wageCents: 2_150,
        trait: 'perfectionist',
      },
      {
        role: 'frontOfHouse',
        speed: 55,
        skill: 51,
        wageCents: 2_150,
        trait: 'quickHands',
      },
      {
        role: 'manager',
        speed: 62,
        skill: 81,
        wageCents: 3_300,
        trait: 'quickHands',
      },
      {
        role: 'runner',
        speed: 54,
        skill: 69,
        wageCents: 2_650,
        trait: 'perfectionist',
      },
    ]);
  });

  it('keeps hired and rejected identities disjoint from every later daily pool', () => {
    let state = createCampaign({ seed: 83 });
    const hired = state.candidateStaff[0];
    const rejected = state.candidateStaff[3];
    if (!hired || !rejected) throw new Error('Expected four deterministic candidates.');
    state = hireStaff(state, hired.id);
    state = startNextDay({ ...state, phase: 'reinvest', lastSettledDay: state.day });

    const retainedAndNew = [...state.staff, ...state.candidateStaff];
    expect(new Set(retainedAndNew.map((member) => member.id)).size).toBe(retainedAndNew.length);
    expect(new Set(retainedAndNew.map((member) => member.name)).size).toBe(retainedAndNew.length);
    expect(state.candidateStaff.map((member) => member.name)).not.toContain(rejected.name);
  });

  it('uses independent venue roster and schedule limits with department rotation', () => {
    let state = createCampaign({ seed: 83 });
    expect(() => hireStaff(state, state.candidateStaff[2]?.id ?? '')).toThrow(
      'require the Department Store Coffee Hall',
    );
    expect(() => hireStaff(state, state.candidateStaff[3]?.id ?? '')).toThrow(
      'require the Department Store Coffee Hall',
    );
    for (const candidate of state.candidateStaff.slice(0, 2))
      state = hireStaff(state, candidate.id);
    state = { ...state, day: 2, candidateStaff: candidatePoolForDay(state.seed, 2) };
    state = hireStaff(state, state.candidateStaff[0]?.id ?? '');
    expect(state.staff).toHaveLength(3);
    const candidateIds = state.staff.map((candidate) => candidate.id);
    state = prepareDay(state, { scheduledStaffIds: candidateIds.slice(0, 2) });
    expect(state.plan.scheduledStaffIds).toHaveLength(2);
    expect(() => prepareDay(state, { scheduledStaffIds: candidateIds })).toThrow(
      'can schedule 2 staff',
    );
    expect(() => hireStaff(state, candidateIds[0] ?? '')).toThrow('no longer available');

    let department: GameState = {
      ...createCampaign({ seed: 84 }),
      venueId: 'departmentStore',
    };
    for (let day = 1; day <= 3; day += 1) {
      department = {
        ...department,
        day,
        candidateStaff: candidatePoolForDay(department.seed, day),
      };
      for (const candidate of [...department.candidateStaff]) {
        department = hireStaff(department, candidate.id);
      }
    }
    expect(department.staff).toHaveLength(12);
    expect(VENUE_WORKFORCE_CAPACITY.departmentStore).toEqual({
      rosterCapacity: 12,
      scheduleCapacity: 10,
    });
    expect(prepareDay(department, { scheduledStaffIds: [] }).plan.scheduledStaffIds).toEqual([]);
    const scheduledTen = department.staff.slice(0, 10).map(({ id }) => id);
    expect(
      prepareDay(department, { scheduledStaffIds: scheduledTen }).plan.scheduledStaffIds,
    ).toEqual(scheduledTen);
    expect(() =>
      prepareDay(department, {
        scheduledStaffIds: department.staff.slice(0, 11).map(({ id }) => id),
      }),
    ).toThrow('can schedule 10 staff');
    department = {
      ...department,
      day: 4,
      candidateStaff: candidatePoolForDay(department.seed, 4),
    };
    expect(() => hireStaff(department, department.candidateStaff[0]?.id ?? '')).toThrow(
      'employ at most 12 people',
    );
  });

  it.each([
    ['cart', 2],
    ['kiosk', 3],
    ['cafe', 5],
  ] as const)('keeps the %s daily schedule limit at %i', (venueId, capacity) => {
    const base = { ...createCampaign({ seed: 90 }), venueId };
    const staff = Array.from({ length: capacity + 1 }, (_, index) =>
      teamMember(`${venueId}-${index}`, 'barista', 'steady'),
    );
    const scheduled = staff.slice(0, capacity).map(({ id }) => id);
    expect(
      prepareDay({ ...base, staff }, { scheduledStaffIds: scheduled }).plan.scheduledStaffIds,
    ).toEqual(scheduled);
    expect(() =>
      prepareDay({ ...base, staff }, { scheduledStaffIds: staff.map(({ id }) => id) }),
    ).toThrow(`can schedule ${capacity} staff`);
  });

  it('applies legacy roles, new department roles, and every readable trait', () => {
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
    const department = { ...base, venueId: 'departmentStore' as const };
    const departmentBaseline = operationalEffects(department);
    const manager = teamMember('manager', 'manager', 'steady', 82, 84);
    const runner = teamMember('runner', 'runner', 'steady', 82, 84);
    const departmentCovered = operationalEffects(withScheduledStaff(department, [manager, runner]));
    expect(barista.preparationMultiplier).toBeLessThan(baseline.preparationMultiplier);
    expect(barista.qualityBonus).toBeGreaterThan(baseline.qualityBonus);
    expect(frontOfHouse.patienceMultiplier).toBeGreaterThan(baseline.patienceMultiplier);
    expect(frontOfHouse.demandMultiplier).toBeGreaterThan(baseline.demandMultiplier);
    expect(frontOfHouse.satisfactionBonus).toBeGreaterThan(baseline.satisfactionBonus);
    expect(perfectionist.qualityBonus).toBeGreaterThan(barista.qualityBonus);
    expect(steady.preparationMultiplier).toBeLessThan(baseline.preparationMultiplier);
    expect(departmentBaseline).toMatchObject({
      coordinationReliabilityDelayTicks: 3,
      handoffWorkloadDelayTicks: 4,
      managerReductionTicks: 0,
      runnerReductionTicks: 0,
    });
    expect(departmentCovered).toMatchObject({
      coordinationReliabilityDelayTicks: 1,
      handoffWorkloadDelayTicks: 1,
      managerReductionTicks: 2,
      runnerReductionTicks: 3,
    });
    expect(departmentCovered.coordinationReliabilityDelayTicks).toBeGreaterThan(0);
    expect(departmentCovered.handoffWorkloadDelayTicks).toBeGreaterThan(0);
    const stackedCoverage = operationalEffects(
      withScheduledStaff(department, [
        manager,
        { ...manager, id: 'manager-two' },
        runner,
        { ...runner, id: 'runner-two' },
      ]),
    );
    expect(stackedCoverage.coordinationReliabilityDelayTicks).toBe(1);
    expect(stackedCoverage.handoffWorkloadDelayTicks).toBe(1);
    expect(stackedCoverage.managerReductionTicks).toBe(2);
    expect(stackedCoverage.runnerReductionTicks).toBe(3);
  });

  it('applies department work delays once and Runner effects never create stock', () => {
    const base = { ...createCampaign({ seed: 112 }), venueId: 'departmentStore' as const };
    const team = [
      teamMember('manager', 'manager', 'peoplePerson', 82, 84),
      teamMember('runner', 'runner', 'peoplePerson', 82, 84),
    ];
    const planned = withScheduledStaff(base, team);
    const inventoryBefore = structuredClone(planned.inventory);
    const effects = operationalEffects(planned);
    expect(planned.inventory).toEqual(inventoryBefore);
    const serving = advanceToFirstService(planned);
    const order = serving.rush?.activeService?.customer.order;
    if (!order) throw new Error('Expected a prepared order.');
    const drink = DRINK_MAP.get(order.drinkId);
    const variant = drink?.variants.find(({ size }) => size === order.size);
    if (!variant) throw new Error('Expected configured order recipe.');
    const expectedBaseTicks = Math.max(
      5,
      Math.round(
        variant.preparationTicks *
          BEAN_DETAILS[planned.plan.beanId].speed *
          effects.preparationMultiplier *
          equipmentPreparationMultiplier(planned, order.drinkId),
      ),
    );
    expect(order.preparationTicks).toBe(
      expectedBaseTicks +
        effects.coordinationReliabilityDelayTicks +
        effects.handoffWorkloadDelayTicks,
    );
  });

  it('reconciles zero, one, duplicate-role, and ten-person payroll exactly once', () => {
    const base = { ...createCampaign({ seed: 2 }), venueId: 'departmentStore' as const };
    expect(startRush(base).rush?.wageCostCents).toBe(0);
    const one = [teamMember('daily-manager', 'manager', 'steady', 90, 90)];
    expect(startRush(withScheduledStaff(base, one)).rush?.wageCostCents).toBe(2_850);
    const duplicateRole = [
      teamMember('manager-a', 'manager', 'steady'),
      { ...teamMember('manager-b', 'manager', 'steady'), wageCents: 3_150 },
    ];
    expect(startRush(withScheduledStaff(base, duplicateRole)).rush?.wageCostCents).toBe(6_000);
    const team = Array.from({ length: 10 }, (_, index) => ({
      ...teamMember(
        `department-${index}`,
        STAFF_ROLES[index % STAFF_ROLES.length] ?? 'barista',
        'steady',
      ),
      wageCents: 2_000 + index * 125,
    }));
    const payroll = team.reduce((total, member) => total + member.wageCents, 0);
    const reportState = runToReport(startRush(withScheduledStaff(base, team)));
    const report = reportState.report;
    expect(report).not.toBeNull();
    if (!report) return;
    expect(report.wageCostCents).toBe(payroll);
    expect(report.closingCashCents).toBe(report.openingCashCents + report.netCashFlowCents);
    expect(report.explanations.join(' ')).toContain('10 scheduled team members');
    expect(report.explanations.join(' ')).toContain('Manager coverage:');
    expect(report.explanations.join(' ')).toContain('Runner coverage:');
  });

  it('keeps department outcomes equal at 1×, 2×, and 4× presentation speeds', () => {
    const base = { ...createCampaign({ seed: 401 }), venueId: 'departmentStore' as const };
    const team = [
      teamMember('speed-manager', 'manager', 'steady'),
      teamMember('speed-runner', 'runner', 'steady'),
    ];
    const reports = ([1, 2, 4] as const).map((speed) => {
      const started = setRushSpeed(startRush(withScheduledStaff(base, team)), speed);
      return runToReport(started).report;
    });
    expect(reports[1]).toEqual(reports[0]);
    expect(reports[2]).toEqual(reports[0]);
  });

  it('copies all ten scheduled roles into the bounded presentation snapshot', () => {
    const base = { ...createCampaign({ seed: 402 }), venueId: 'departmentStore' as const };
    const team = Array.from({ length: 10 }, (_, index) =>
      teamMember(
        `snapshot-${index}`,
        STAFF_ROLES[index % STAFF_ROLES.length] ?? 'barista',
        'steady',
      ),
    );
    const snapshot = createRenderSnapshot(withScheduledStaff(base, team), false, []);
    expect(snapshot.operation.scheduledRoles).toHaveLength(10);
    expect(snapshot.operation.scheduledRoles).toContain('manager');
    expect(snapshot.operation.scheduledRoles).toContain('runner');
  });
});

describe('equipment and venue growth', () => {
  it('applies every commercial tier through data-driven service calculations', () => {
    const base = createCampaign({ seed: 71 });
    expect(operationalEffects(withEquipment(base, 'grinder')).qualityBonus).toBeGreaterThan(0);
    expect(
      equipmentPreparationMultiplier(withEquipment(base, 'espressoMachine'), 'flatWhite'),
    ).toBe(0.92);
    expect(equipmentPreparationMultiplier(withEquipment(base, 'batchBrewer'), 'batchBrew')).toBe(
      0.75,
    );
    expect(batchExpiryDay('dairyMilk', 1, 1)).toBe(4);
    const withPos = operationalEffects(withEquipment(base, 'pos'));
    expect(withPos.demandMultiplier).toBeGreaterThan(1);
    expect(withPos.preparationMultiplier).toBeLessThan(1);
    expect(serviceQueueCapacity(withEquipment(base, 'serviceCounter'))).toBe(
      serviceQueueCapacity(base) + 2,
    );

    const commercial: GameState = {
      ...base,
      venueId: 'departmentStore',
      equipment: {
        grinder: 3,
        espressoMachine: 3,
        batchBrewer: 3,
        refrigeration: 3,
        pos: 3,
        serviceCounter: 3,
      },
    };
    const commercialEffects = operationalEffects(commercial);
    expect(commercialEffects).toMatchObject({
      qualityBonus: 8,
      demandMultiplier: 1.07,
      queueBonus: 8,
    });
    expect(commercialEffects.equipmentReliabilityDelayTicks).toBeGreaterThan(0);
    expect(commercialEffects.preparationMultiplier).toBeCloseTo(0.84 * 0.86, 8);
    expect(equipmentPreparationMultiplier(commercial, 'flatWhite')).toBe(0.7);
    expect(equipmentPreparationMultiplier(commercial, 'batchBrew')).toBe(0.4);
    expect(batchExpiryDay('dairyMilk', 1, 3)).toBe(7);
    expect(serviceQueueCapacity(commercial)).toBe(32);
    expect(commercialEffects.operatingCostCents).toBe(3_610);
  });

  it.each(EQUIPMENT_IDS)('%s is wired into a complete day and settlement', (equipmentId) => {
    const base = createCampaign({ seed: 2 });
    const equipped = withEquipment(base, equipmentId);
    const reportState = runToReport(startRush(equipped));
    expect(reportState.report?.operatingCostCents).toBeGreaterThan(450);
    expect(reportState.report?.explanations.join(' ')).toContain(EQUIPMENT[equipmentId].name);
  });

  it('moves demand and chilled-stock shelf life in their intended directions', () => {
    const base = startRush(createCampaign({ seed: 2 }));
    const pos = startRush(withEquipment(createCampaign({ seed: 2 }), 'pos'));
    expect(demandRate(pos)).toBeGreaterThan(demandRate(base));
    expect(batchExpiryDay('dairyMilk', 1, 1)).toBe(batchExpiryDay('dairyMilk', 1, 0) + 1);
    expect(batchExpiryDay('dairyMilk', 1, 2)).toBe(batchExpiryDay('dairyMilk', 1, 0) + 2);
    expect(batchExpiryDay('houseBeans', 1, 2)).toBe(batchExpiryDay('houseBeans', 1, 0));
  });

  it('enforces tier availability, affordability, and all three promotion gates', () => {
    const reinvest = closeDay(runToReport(startRush(createCampaign({ seed: 2 }))));
    const funded = { ...reinvest, cashCents: 200_000, reputation: 80 };
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

    expect(() => buyEquipment(cafe, 'grinder')).toThrow('requires a Department Store Coffee Hall');
    const department = promoteVenue(cafe);
    expect(department.venueId).toBe('departmentStore');
    expect(department.cashCents).toBe(cafe.cashCents - 20_000);
    const commercialGrinder = buyEquipment(department, 'grinder');
    expect(commercialGrinder.equipment.grinder).toBe(3);
    expect(() => buyEquipment(commercialGrinder, 'grinder')).toThrow('fully upgraded');
    expect(serviceQueueCapacity(department)).toBe(24);
  });
});
