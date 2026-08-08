/** Deterministic station, lane, assignment, routing, and fairness configuration. */

import { DRINK_MAP, EQUIPMENT_IDS } from '../content/gameContent';
import { GameRuleError } from './errors';
import type {
  DayPlan,
  DrinkId,
  EquipmentId,
  EquipmentState,
  LaneId,
  RushState,
  ServiceAggregate,
  ServiceJob,
  StaffMember,
  StaffRole,
  StationId,
  VenueId,
} from './types';

/** Fixed simulation order for starts, completions, cleanup, persistence, and rendering adapters. */
export const STATION_IDS = [
  'espressoBar',
  'brewBar',
  'coldBar',
] as const satisfies readonly StationId[];

/** Fixed lane order used whenever both queues must be traversed. */
export const LANE_IDS = ['normal', 'express'] as const satisfies readonly LaneId[];

/** Maximum configured express drinks in one morning plan. */
export const MAX_EXPRESS_DRINKS = 3;

/** Maximum express starts at a station while compatible normal work is waiting. */
export const MAX_CONSECUTIVE_EXPRESS_STARTS = 2;

/** Defensive bound covering 300 seeded arrival ticks plus every configured event arrival. */
export const MAX_SERVICE_JOBS_PER_RUSH = 320;

export interface StationConfig {
  id: StationId;
  label: string;
  shortLabel: string;
  requiredEquipment: EquipmentId;
  expressPreparationLimitTicks: number;
}

export interface VenueServiceConfig {
  stationIds: readonly StationId[];
  laneIds: readonly LaneId[];
}

/** Station labels and express constraints grounded in existing recipe/equipment content. */
export const STATION_DETAILS: Readonly<Record<StationId, StationConfig>> = {
  espressoBar: {
    id: 'espressoBar',
    label: 'Espresso bar',
    shortLabel: 'Espresso',
    requiredEquipment: 'espressoMachine',
    expressPreparationLimitTicks: 17,
  },
  brewBar: {
    id: 'brewBar',
    label: 'Brew bar',
    shortLabel: 'Brew',
    requiredEquipment: 'batchBrewer',
    expressPreparationLimitTicks: 9,
  },
  coldBar: {
    id: 'coldBar',
    label: 'Cold bar',
    shortLabel: 'Cold',
    requiredEquipment: 'refrigeration',
    expressPreparationLimitTicks: 10,
  },
};

/** Equipment whose access, reliability, and generic effects belong to each department station. */
export const STATION_EQUIPMENT_IDS: Readonly<Record<StationId, readonly EquipmentId[]>> = {
  espressoBar: ['grinder', 'espressoMachine', 'pos', 'serviceCounter'],
  brewBar: ['grinder', 'batchBrewer', 'pos', 'serviceCounter'],
  coldBar: ['grinder', 'espressoMachine', 'refrigeration', 'pos', 'serviceCounter'],
};

/** Legacy venues retain one serial normal lane; the department activates all configured work. */
export const VENUE_SERVICE_CONFIG: Readonly<Record<VenueId, VenueServiceConfig>> = {
  cart: { stationIds: ['espressoBar'], laneIds: ['normal'] },
  kiosk: { stationIds: ['espressoBar'], laneIds: ['normal'] },
  cafe: { stationIds: ['espressoBar'], laneIds: ['normal'] },
  departmentStore: { stationIds: STATION_IDS, laneIds: LANE_IDS },
};

/** Role/station compatibility used by strict commands and deterministic v4 migration defaults. */
export const STAFF_STATION_COMPATIBILITY: Readonly<Record<StaffRole, readonly StationId[]>> = {
  barista: STATION_IDS,
  frontOfHouse: ['espressoBar', 'coldBar'],
  manager: ['espressoBar', 'brewBar'],
  runner: ['brewBar', 'coldBar'],
};

/** Create a complete empty assignment record in fixed station order. */
export function emptyStationAssignments(): Record<StationId, string[]> {
  return { espressoBar: [], brewBar: [], coldBar: [] };
}

/** Create a complete empty active-job record in fixed station order. */
export function emptyServiceJobs(): Record<StationId, ServiceJob | null> {
  return { espressoBar: null, brewBar: null, coldBar: null };
}

/** Create complete per-station express fairness counters. */
export function emptyExpressStartCounters(): Record<StationId, number> {
  return { espressoBar: 0, brewBar: 0, coldBar: 0 };
}

/** Create six bounded aggregate buckets in fixed station/lane order. */
export function emptyServiceAggregates(): ServiceAggregate[] {
  return STATION_IDS.flatMap((stationId) =>
    LANE_IDS.map((laneId) => ({
      stationId,
      laneId,
      assignedStaffIds: [],
      equipmentIds: [],
      completedJobIds: [],
      served: 0,
      revenueCents: 0,
      totalWaitTicks: 0,
      satisfactionTotal: 0,
    })),
  );
}

/** Capture immutable staffing and installed-equipment ownership at rush start. */
export function serviceAggregatesForPlan(
  venueId: VenueId,
  plan: Pick<DayPlan, 'stationAssignments'>,
  equipment: EquipmentState,
): ServiceAggregate[] {
  const serviceConfig = VENUE_SERVICE_CONFIG[venueId];
  return emptyServiceAggregates().map((aggregate) => {
    if (
      !serviceConfig.stationIds.includes(aggregate.stationId) ||
      !serviceConfig.laneIds.includes(aggregate.laneId)
    ) {
      return aggregate;
    }
    const equipmentIds = (
      venueId === 'departmentStore' ? STATION_EQUIPMENT_IDS[aggregate.stationId] : EQUIPMENT_IDS
    ).filter((equipmentId) => equipment[equipmentId] > 0);
    return {
      ...aggregate,
      assignedStaffIds: [...plan.stationAssignments[aggregate.stationId]],
      equipmentIds,
    };
  });
}

/** Return immutable service topology for one venue. */
export function serviceConfigFor(venueId: VenueId): VenueServiceConfig {
  return VENUE_SERVICE_CONFIG[venueId];
}

/** Return whether a role may be assigned to a station active at the venue. */
export function staffStationCompatible(
  role: StaffRole,
  stationId: StationId,
  venueId: VenueId,
): boolean {
  return (
    VENUE_SERVICE_CONFIG[venueId].stationIds.includes(stationId) &&
    STAFF_STATION_COMPATIBILITY[role].includes(stationId)
  );
}

/** Return staff IDs assigned to one station by the complete morning plan. */
export function assignedStaffIds(
  plan: Pick<DayPlan, 'stationAssignments'>,
  stationId: StationId,
): readonly string[] {
  return plan.stationAssignments[stationId];
}

/** Return whether a venue station has the staffing and equipment needed to begin work. */
export function stationReadyForService(
  venueId: VenueId,
  equipment: EquipmentState,
  plan: Pick<DayPlan, 'stationAssignments'>,
  stationId: StationId,
): boolean {
  if (!VENUE_SERVICE_CONFIG[venueId].stationIds.includes(stationId)) return false;
  if (venueId !== 'departmentStore') return true;
  return (
    plan.stationAssignments[stationId].length > 0 &&
    equipment[STATION_DETAILS[stationId].requiredEquipment] > 0
  );
}

/** Build one stable, balanced, role-compatible assignment for existing scheduled staff. */
export function defaultStationAssignments(
  venueId: VenueId,
  scheduledStaff: readonly StaffMember[],
): Record<StationId, string[]> {
  const assignments = emptyStationAssignments();
  for (const member of scheduledStaff) {
    const compatible = VENUE_SERVICE_CONFIG[venueId].stationIds.filter((stationId) =>
      staffStationCompatible(member.role, stationId, venueId),
    );
    const stationId = compatible.reduce<StationId | null>((selected, candidate) => {
      if (!selected) return candidate;
      return assignments[candidate].length < assignments[selected].length ? candidate : selected;
    }, null);
    if (!stationId) {
      throw new GameRuleError(`${member.name} has no compatible station at this venue.`);
    }
    assignments[stationId].push(member.id);
  }
  return assignments;
}

/** Route every legacy-venue recipe through its one station and department recipes by content. */
export function stationForDrink(venueId: VenueId, drinkId: DrinkId): StationId {
  if (venueId !== 'departmentStore') return 'espressoBar';
  const drink = DRINK_MAP.get(drinkId);
  if (!drink) throw new GameRuleError('That drink is not configured.');
  const ingredients = drink.variants.flatMap((variant) => variant.ingredients);
  if (
    ingredients.some(
      ({ ingredientId }) => ingredientId === 'ice' || ingredientId === 'coldBrewConcentrate',
    )
  ) {
    return 'coldBar';
  }
  if (drinkId === 'batchBrew') return 'brewBar';
  return 'espressoBar';
}

/** Return whether existing recipe, equipment, and station policy permit express routing. */
export function expressDrinkEligible(
  venueId: VenueId,
  equipment: EquipmentState,
  drinkId: DrinkId,
): boolean {
  if (!VENUE_SERVICE_CONFIG[venueId].laneIds.includes('express')) return false;
  const drink = DRINK_MAP.get(drinkId);
  if (!drink) return false;
  const station = STATION_DETAILS[stationForDrink(venueId, drinkId)];
  const maximumPreparationTicks = Math.max(
    ...drink.variants.map((variant) => variant.preparationTicks),
  );
  return (
    equipment[station.requiredEquipment] > 0 &&
    maximumPreparationTicks <= station.expressPreparationLimitTicks
  );
}

/** Return eligible express choices in canonical menu order. */
export function expressEligibleDrinkIds(
  venueId: VenueId,
  equipment: EquipmentState,
  activeMenu: readonly DrinkId[],
): DrinkId[] {
  return activeMenu.filter((drinkId) => expressDrinkEligible(venueId, equipment, drinkId));
}

/** Route an order to express only when the strict morning plan selected an eligible drink. */
export function laneForDrink(
  venueId: VenueId,
  equipment: EquipmentState,
  plan: Pick<DayPlan, 'expressDrinkIds'>,
  drinkId: DrinkId,
): LaneId {
  return plan.expressDrinkIds.includes(drinkId) && expressDrinkEligible(venueId, equipment, drinkId)
    ? 'express'
    : 'normal';
}

/** Return all waiting customers in canonical lane order for aggregate presentation. */
export function waitingCustomers(rush: RushState): RushState['normalQueue'] {
  return [...rush.normalQueue, ...rush.expressQueue];
}

/** Return active service jobs in fixed station order. */
export function activeServiceJobs(rush: RushState): ServiceJob[] {
  return STATION_IDS.flatMap((stationId) => {
    const job = rush.serviceJobsByStation[stationId];
    return job ? [job] : [];
  });
}

/** Return one canonical serializable service-job identity. */
export function serviceJobId(day: number, sequence: number): string {
  return `d${day}-j${sequence}`;
}
