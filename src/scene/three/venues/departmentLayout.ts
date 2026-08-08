import type { StaffRole, StationId } from '../../../game';
import type { SceneCustomerEntitySnapshot, SceneStaffEntitySnapshot } from '../../sceneModel';
import type { WorldPoint } from './venueLayout';

export const DEPARTMENT_HERITAGE_MOTIFS = Object.freeze([
  'patterned-heritage-tiles',
  'timber-panelling-counters',
  'brass-rails-details',
  'visible-escalators',
  'three-distinct-service-bays',
] as const);

export const DEPARTMENT_EQUIPMENT_REGISTRY = Object.freeze([
  'grinder',
  'espressoMachine',
  'batchBrewer',
  'refrigeration',
  'pos',
  'serviceCounter',
] as const);

export const DEPARTMENT_PHYSICAL_UPGRADE_REGISTRY = Object.freeze([
  'hallEntry',
  'espressoBay',
  'brewBay',
  'coldBay',
] as const);

export type DepartmentLod = 'full' | 'compact';

export interface DepartmentStationLayout {
  readonly id: StationId;
  readonly label: string;
  readonly counter: WorldPoint;
  readonly service: WorldPoint;
  readonly handoff: WorldPoint;
  readonly payment: WorldPoint;
  readonly stockout: WorldPoint;
  readonly abandonment: WorldPoint;
  readonly exit: WorldPoint;
  readonly normalQueue: readonly WorldPoint[];
  readonly expressQueue: readonly WorldPoint[];
  readonly staff: readonly WorldPoint[];
}

export interface DepartmentPerformanceBudget {
  readonly drawCalls: number;
  readonly triangles: number;
  readonly devicePixelRatio: number;
  readonly shadowMapSize: number;
  readonly repeatedFurnishings: number;
  readonly lights: number;
  readonly shadowLights: number;
}

export interface DepartmentFramePerformanceBudget {
  readonly maximumP95FrameTimeMs: number;
  readonly minimumFramesPerSecond: number;
}

/** Automated render-loop budgets; mobile describes browser emulation, not a physical device. */
export const DEPARTMENT_FRAME_PERFORMANCE_BUDGET = Object.freeze({
  full: Object.freeze({
    maximumP95FrameTimeMs: 34,
    minimumFramesPerSecond: 55,
  }),
  compact: Object.freeze({
    maximumP95FrameTimeMs: 50,
    minimumFramesPerSecond: 30,
  }),
} satisfies Readonly<Record<DepartmentLod, DepartmentFramePerformanceBudget>>);

const STATION_X: Readonly<Record<StationId, number>> = Object.freeze({
  espressoBar: -4.25,
  brewBar: 0,
  coldBar: 4.25,
});

/** Immutable placement and performance registry for the department-store hall. */
export const DEPARTMENT_LAYOUT = deepFreeze({
  floor: { width: 22, depth: 15 },
  stations: {
    espressoBar: stationLayout('espressoBar', 'Espresso Bay', STATION_X.espressoBar),
    brewBar: stationLayout('brewBar', 'Brew Bay', STATION_X.brewBar),
    coldBar: stationLayout('coldBar', 'Cold Bay', STATION_X.coldBar),
  },
  equipment: {
    grinder: point(-5.25, 1.68, -1.66),
    espressoMachine: point(-4.15, 1.7, -1.67),
    batchBrewer: point(-0.15, 1.7, -1.67),
    refrigeration: point(3.52, 0.78, -1.75),
    pos: point(4.75, 1.7, -1.43),
    serviceCounter: point(4.25, 0.74, -1.5),
  },
  physicalUpgradeAnchors: {
    hallEntry: point(-8.35, 2.45, -3.48),
    espressoBay: point(STATION_X.espressoBar, 2.85, -3.48),
    brewBay: point(STATION_X.brewBar, 2.85, -3.48),
    coldBay: point(STATION_X.coldBar, 2.85, -3.48),
  },
  activity: {
    sale: point(0, 2.2, -0.35),
    walkaway: point(5.9, 0.5, 2.7),
    stockout: point(-5.9, 0.5, 2.7),
  },
  stock: point(-6.8, 0.2, -2.05),
  performance: {
    full: performanceBudget(72, 60_000, 1.5, 1_024, 64),
    compact: performanceBudget(52, 30_000, 1.25, 512, 40),
  },
} as const);

/** Resolve one canonical customer destination into the hall without losing entities in compact LOD. */
export function departmentCustomerPoint(customer: SceneCustomerEntitySnapshot): WorldPoint {
  const station = DEPARTMENT_LAYOUT.stations[customer.stationId];
  if (customer.status === 'service') return station.service;
  if (customer.status === 'handoff') return station.handoff;
  if (customer.status === 'payment') return station.payment;
  if (customer.status === 'stockout') return station.stockout;
  if (customer.status === 'abandonment') return station.abandonment;
  if (customer.status === 'exit') {
    const origin = customer.walkawayReason === null ? station.payment : station.abandonment;
    return interpolate(origin, station.exit, Math.max(0, (customer.progress - 0.4) / 0.6));
  }
  const queue = customer.laneId === 'express' ? station.expressQueue : station.normalQueue;
  const index = queueIndex(customer.destinationId, queue.length);
  return queue[index] ?? station.abandonment;
}

/** Resolve a canonical scheduled staff member into their assigned station bay. */
export function departmentStaffPoint(staff: SceneStaffEntitySnapshot): WorldPoint {
  const anchors = DEPARTMENT_LAYOUT.stations[staff.stationId].staff;
  const requestedSlot = Number.parseInt(staff.destinationId.split(':').at(-1) ?? '0', 10);
  return (
    anchors[Number.isFinite(requestedSlot) ? requestedSlot % anchors.length : 0] ?? anchors[0]!
  );
}

/** Return the approved immutable rendering budget for a responsive detail tier. */
export function departmentPerformanceBudget(lod: DepartmentLod): DepartmentPerformanceBudget {
  return DEPARTMENT_LAYOUT.performance[lod];
}

function stationLayout(id: StationId, label: string, x: number): DepartmentStationLayout {
  return {
    id,
    label,
    counter: point(x, 0.72, -1.45),
    service: point(x, 0, -0.28),
    handoff: point(x + 0.85, 0, -0.28),
    payment: point(x + 1.15, 0, 0.42),
    stockout: point(x - 1.15, 0, 0.58),
    abandonment: point(x - 1.15, 0, 1.45),
    exit: point(x < 0 ? -7.25 : 7.25, 0, 3.4),
    normalQueue: queueLine(x - 0.48, 1.0, 0.68, 12),
    expressQueue: queueLine(x + 0.48, 0.85, 0.62, 12),
    staff: staffAnchors(x),
  };
}

function queueLine(x: number, startZ: number, step: number, count: number): WorldPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const column = Math.floor(index / 6);
    return point(x + column * 0.28, 0, startZ + (index % 6) * step);
  });
}

function staffAnchors(x: number): WorldPoint[] {
  const roleOffset: Readonly<Record<StaffRole, number>> = {
    barista: -0.72,
    frontOfHouse: 0.72,
    manager: 0,
    runner: 1.18,
  };
  return (Object.keys(roleOffset) as StaffRole[]).flatMap((role, roleIndex) => [
    point(x + roleOffset[role], 0, -2.48 - roleIndex * 0.03),
    point(x + roleOffset[role] * 0.72, 0, -2.9 - roleIndex * 0.03),
  ]);
}

function performanceBudget(
  drawCalls: number,
  triangles: number,
  devicePixelRatio: number,
  shadowMapSize: number,
  repeatedFurnishings: number,
): DepartmentPerformanceBudget {
  return {
    drawCalls,
    triangles,
    devicePixelRatio,
    shadowMapSize,
    repeatedFurnishings,
    lights: 2,
    shadowLights: 1,
  };
}

function queueIndex(destinationId: string, length: number): number {
  const raw = Number.parseInt(destinationId.split(':').at(-1) ?? '0', 10);
  return Number.isFinite(raw) ? Math.max(0, raw) % Math.max(1, length) : 0;
}

function point(x: number, y: number, z: number): WorldPoint {
  return [x, y, z];
}

function interpolate(from: WorldPoint, to: WorldPoint, progress: number): WorldPoint {
  const bounded = Math.min(1, Math.max(0, progress));
  return [
    from[0] + (to[0] - from[0]) * bounded,
    from[1] + (to[1] - from[1]) * bounded,
    from[2] + (to[2] - from[2]) * bounded,
  ];
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
