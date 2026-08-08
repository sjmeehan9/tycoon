import {
  LANE_IDS,
  STATION_IDS,
  activeServiceJobs,
  type CosmeticId,
  type Customer,
  type CustomerSegment,
  type EquipmentState,
  type GamePhase,
  type GameState,
  type LaneId,
  type RushActivityEvent,
  type RushSpeed,
  type RushWalkawayReason,
  type StaffRole,
  type StationId,
  type VenueId,
  type WeatherId,
} from '../game';
import { DRINK_MAP, VENUES } from '../content/gameContent';
import { describeRushActivity } from '../game/selectors';

export const LOGICAL_SCENE_SIZE = Object.freeze({ width: 320, height: 180 });
export const MAX_SCENE_QUEUED_CUSTOMERS = 12;
export const MAX_SCENE_ACTIVE_CUSTOMERS = 3;
export const MAX_SCENE_TERMINAL_CUSTOMERS = 3;
export const MAX_SCENE_CUSTOMERS =
  MAX_SCENE_QUEUED_CUSTOMERS + MAX_SCENE_ACTIVE_CUSTOMERS + MAX_SCENE_TERMINAL_CUSTOMERS;
export const MAX_SCENE_STAFF = 10;
export const MAX_SCENE_EFFECTS = 6;
export const TERMINAL_ENTITY_RETENTION_TICKS = 5;
const LEGACY_SCENE_QUEUE_CUSTOMERS = 8;

export type SceneCustomerStatus =
  'approach' | 'queued' | 'service' | 'handoff' | 'payment' | 'exit' | 'stockout' | 'abandonment';

export type ScenePersonPose =
  'walking' | 'waiting' | 'working' | 'receiving' | 'paying' | 'leaving' | 'disappointed' | 'ready';

export type SceneStaffStatus = 'serving' | 'ready' | 'coordinating' | 'handoff';

export interface SceneQueueSummary {
  readonly total: number;
  readonly normal: number;
  readonly express: number;
  readonly omitted: number;
  readonly byStationLane: Readonly<Record<StationId, Readonly<Record<LaneId, number>>>>;
}

export interface SceneCustomerSnapshot {
  readonly id: string;
  readonly segment: CustomerSegment;
}

export interface SceneCustomerEntitySnapshot extends SceneCustomerSnapshot {
  readonly entityId: `customer:${string}`;
  readonly stationId: StationId;
  readonly laneId: LaneId;
  readonly jobId: string | null;
  readonly activityId: string | null;
  readonly activitySequence: number | null;
  readonly status: SceneCustomerStatus;
  readonly pose: ScenePersonPose;
  readonly destinationId: string;
  readonly progress: number;
  readonly order: SceneOrderSnapshot | null;
  readonly walkawayReason: RushWalkawayReason | null;
}

export interface SceneStaffEntitySnapshot {
  readonly entityId: `staff:${string}`;
  readonly id: string;
  readonly name: string;
  readonly role: StaffRole;
  readonly stationId: StationId;
  readonly status: SceneStaffStatus;
  readonly pose: ScenePersonPose;
  readonly destinationId: string;
}

export interface SceneActiveCustomerSnapshot extends SceneCustomerSnapshot {
  readonly order: SceneOrderSnapshot;
}

export interface SceneOrderSnapshot {
  readonly drinkId: RushActivityOrder['drinkId'];
  readonly size: RushActivityOrder['size'];
  readonly milk: RushActivityOrder['milk'];
  readonly priceCents: number;
}

export interface SceneSnapshot {
  readonly snapshotId: string;
  readonly day: number;
  readonly venueId: VenueId;
  readonly weather: WeatherId;
  readonly phase: GamePhase;
  readonly rushTick: number;
  readonly rushSpeed: RushSpeed;
  readonly isPaused: boolean;
  readonly queueCount: number;
  readonly queueSummary: SceneQueueSummary;
  readonly queueCustomers: readonly SceneCustomerSnapshot[];
  readonly queueSegments: readonly CustomerSegment[];
  readonly customerEntities: readonly SceneCustomerEntitySnapshot[];
  readonly staffEntities: readonly SceneStaffEntitySnapshot[];
  readonly activeCustomer: SceneActiveCustomerSnapshot | null;
  readonly recentActivity: readonly RushActivityEvent[];
  readonly isServing: boolean;
  readonly scheduledRoles: readonly StaffRole[];
  readonly equipment: Readonly<EquipmentState>;
  readonly hasStreetSign: boolean;
  readonly awning: CosmeticId;
  readonly reducedMotion: boolean;
}

type RushActivityOrder = Extract<RushActivityEvent, { type: 'sale' }>;

interface QueuedCustomerSelection {
  readonly customer: Customer;
  readonly bucketIndex: number;
}

/** Extract the only immutable game and preference data the presentation layer may consume. */
export function createSceneSnapshot(
  game: GameState,
  reducedMotion: boolean,
  cosmetics: readonly CosmeticId[],
): SceneSnapshot {
  const awning = cosmetics.includes('neonCup')
    ? 'neonCup'
    : cosmetics.includes('wattleAwning')
      ? 'wattleAwning'
      : 'classicAwning';
  const rush = game.rush;
  const activeJobs = rush ? activeServiceJobs(rush).slice(0, MAX_SCENE_ACTIVE_CUSTOMERS) : [];
  const queueSelection = rush ? selectQueuedCustomers(rush.normalQueue, rush.expressQueue) : [];
  const queueSummary = createQueueSummary(
    rush?.normalQueue ?? [],
    rush?.expressQueue ?? [],
    queueSelection.length,
  );
  const seenCustomerIds = new Set<string>();
  const customerEntities: SceneCustomerEntitySnapshot[] = [];

  for (const job of activeJobs) {
    const latest = latestActivityForCustomer(rush?.recentActivity ?? [], job.customer.id);
    seenCustomerIds.add(job.customer.id);
    customerEntities.push({
      ...customerIdentity(job.customer),
      entityId: `customer:${job.customer.id}`,
      jobId: job.id,
      activityId: latest?.id ?? null,
      activitySequence: latest?.sequence ?? null,
      status: 'service',
      pose: 'working',
      destinationId: `station:${job.stationId}:service`,
      progress: boundedProgress(job.remainingTicks, job.totalTicks),
      order: copyOrder(job.customer),
      walkawayReason: null,
    });
  }

  for (const selection of queueSelection) {
    if (seenCustomerIds.has(selection.customer.id)) continue;
    seenCustomerIds.add(selection.customer.id);
    const latest = latestActivityForCustomer(rush?.recentActivity ?? [], selection.customer.id);
    const isApproaching = latest?.type === 'arrival' && latest.tick === (rush?.tick ?? 0);
    customerEntities.push({
      ...customerIdentity(selection.customer),
      entityId: `customer:${selection.customer.id}`,
      jobId: null,
      activityId: latest?.id ?? null,
      activitySequence: latest?.sequence ?? null,
      status: isApproaching ? 'approach' : 'queued',
      pose: isApproaching ? 'walking' : 'waiting',
      destinationId: `queue:${selection.customer.stationId}:${selection.customer.laneId}:${selection.bucketIndex}`,
      progress: isApproaching ? 0 : 1,
      order: copyOrder(selection.customer),
      walkawayReason: null,
    });
  }

  const terminalEntities = terminalActivityEntities(
    rush?.recentActivity ?? [],
    rush?.tick ?? 0,
    seenCustomerIds,
  );
  customerEntities.push(...terminalEntities);

  const activeStations = new Set(activeJobs.map(({ stationId }) => stationId));
  const staffEntities = createStaffEntities(game, activeStations);
  const firstActive = activeJobs[0]?.customer;
  const recentActivity = (rush?.recentActivity ?? []).map((event) => ({ ...event }));
  const snapshotId = sceneSnapshotId(
    game,
    customerEntities,
    staffEntities,
    recentActivity.at(-1)?.sequence ?? -1,
  );

  return deepFreeze({
    snapshotId,
    day: game.day,
    venueId: game.venueId,
    weather: game.weather,
    phase: game.phase,
    rushTick: rush?.tick ?? 0,
    rushSpeed: rush?.speed ?? 1,
    isPaused: rush?.isPaused ?? false,
    queueCount: queueSummary.total,
    queueSummary,
    queueCustomers: queueSelection.slice(0, LEGACY_SCENE_QUEUE_CUSTOMERS).map(({ customer }) => ({
      id: customer.id,
      segment: customer.segment,
    })),
    queueSegments: queueSelection
      .slice(0, LEGACY_SCENE_QUEUE_CUSTOMERS)
      .map(({ customer }) => customer.segment),
    customerEntities,
    staffEntities,
    activeCustomer: firstActive
      ? { id: firstActive.id, segment: firstActive.segment, order: copyOrder(firstActive) }
      : null,
    recentActivity,
    isServing: activeJobs.length > 0,
    scheduledRoles: staffEntities.map(({ role }) => role),
    equipment: { ...game.equipment },
    hasStreetSign: game.improvements.includes('street-sign'),
    awning,
    reducedMotion,
  });
}

/** Human-readable equivalent of every animated scene state. */
export function describeScene(snapshot: SceneSnapshot): string {
  const queue = snapshot.queueCount;
  const team = snapshot.staffEntities.length;
  const active = snapshot.customerEntities.filter(({ status }) => status === 'service');
  const activity = active.length > 0 ? `${active.length} active service jobs` : 'between drinks';
  const latest = snapshot.recentActivity.at(-1);
  const latestSale = snapshot.recentActivity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot.recentActivity.findLast((event) => event.type === 'walkaway');
  const queueDetail =
    snapshot.phase === 'rush' || snapshot.phase === 'event'
      ? ` (${snapshot.queueSummary.normal} normal, ${snapshot.queueSummary.express} express; ${snapshot.queueSummary.omitted} represented by overflow text)`
      : '';
  const base = `${VENUES[snapshot.venueId].shortName} in ${weatherLabel(snapshot.weather)} weather. Day ${snapshot.day}, ${snapshot.phase} phase, ${queue} customers waiting${queueDetail}, ${team} staff scheduled, ${activity}.`;
  const details = [
    ...active.map(activeEntityDescription),
    latest ? `Latest activity: ${describeRushActivity(latest)}` : null,
    latestSale && latestSale !== latest ? `Latest sale: ${describeRushActivity(latestSale)}` : null,
    latestWalkaway && latestWalkaway !== latest
      ? `Latest walkaway: ${describeRushActivity(latestWalkaway)}`
      : null,
  ].filter((detail): detail is string => detail !== null);
  return [base, ...details].join(' ');
}

/** Animate visual flourishes only while service is moving and motion is allowed. */
export function shouldAnimateScene(snapshot: SceneSnapshot): boolean {
  return !snapshot.reducedMotion && !snapshot.isPaused && snapshot.phase === 'rush';
}

function selectQueuedCustomers(
  normalQueue: readonly Customer[],
  expressQueue: readonly Customer[],
): QueuedCustomerSelection[] {
  const buckets = STATION_IDS.flatMap((stationId) =>
    LANE_IDS.map((laneId) => ({
      customers: (laneId === 'normal' ? normalQueue : expressQueue).filter(
        (customer) => customer.stationId === stationId,
      ),
      cursor: 0,
    })),
  );
  const selected: QueuedCustomerSelection[] = [];
  let added = true;
  while (selected.length < MAX_SCENE_QUEUED_CUSTOMERS && added) {
    added = false;
    for (const bucket of buckets) {
      if (selected.length >= MAX_SCENE_QUEUED_CUSTOMERS) break;
      const customer = bucket.customers[bucket.cursor];
      if (!customer) continue;
      selected.push({ customer, bucketIndex: bucket.cursor });
      bucket.cursor += 1;
      added = true;
    }
  }
  return selected;
}

function createQueueSummary(
  normalQueue: readonly Customer[],
  expressQueue: readonly Customer[],
  renderedCount: number,
): SceneQueueSummary {
  const byStationLane = Object.fromEntries(
    STATION_IDS.map((stationId) => [
      stationId,
      Object.fromEntries(
        LANE_IDS.map((laneId) => [
          laneId,
          (laneId === 'normal' ? normalQueue : expressQueue).filter(
            (customer) => customer.stationId === stationId,
          ).length,
        ]),
      ) as Record<LaneId, number>,
    ]),
  ) as Record<StationId, Record<LaneId, number>>;
  const total = normalQueue.length + expressQueue.length;
  return {
    total,
    normal: normalQueue.length,
    express: expressQueue.length,
    omitted: Math.max(0, total - renderedCount),
    byStationLane,
  };
}

function terminalActivityEntities(
  activity: readonly RushActivityEvent[],
  tick: number,
  seenCustomerIds: ReadonlySet<string>,
): SceneCustomerEntitySnapshot[] {
  const selected: Extract<RushActivityEvent, { type: 'sale' | 'walkaway' }>[] = [];
  const seen = new Set(seenCustomerIds);
  for (let index = activity.length - 1; index >= 0; index -= 1) {
    const event = activity[index];
    if (!event || (event.type !== 'sale' && event.type !== 'walkaway')) continue;
    if (event.segment === null || seen.has(event.customerId)) continue;
    const age = Math.max(0, tick - event.tick);
    if (age > TERMINAL_ENTITY_RETENTION_TICKS) continue;
    seen.add(event.customerId);
    selected.push(event);
    if (selected.length >= MAX_SCENE_TERMINAL_CUSTOMERS) break;
  }
  return selected.reverse().map((event) => terminalEntity(event, tick));
}

function terminalEntity(
  event: Extract<RushActivityEvent, { type: 'sale' | 'walkaway' }>,
  tick: number,
): SceneCustomerEntitySnapshot {
  const age = Math.max(0, tick - event.tick);
  const route = terminalRoute(event, age);
  return {
    entityId: `customer:${event.customerId}`,
    id: event.customerId,
    segment: event.segment ?? 'regular',
    stationId: event.stationId,
    laneId: event.laneId,
    jobId: event.jobId,
    activityId: event.id,
    activitySequence: event.sequence,
    status: route.status,
    pose: route.pose,
    destinationId: route.destinationId,
    progress: Math.min(1, age / TERMINAL_ENTITY_RETENTION_TICKS),
    order:
      event.type === 'sale'
        ? {
            drinkId: event.drinkId,
            size: event.size,
            milk: event.milk,
            priceCents: event.priceCents,
          }
        : null,
    walkawayReason: event.type === 'walkaway' ? event.reason : null,
  };
}

function terminalRoute(
  event: Extract<RushActivityEvent, { type: 'sale' | 'walkaway' }>,
  age: number,
): Pick<SceneCustomerEntitySnapshot, 'status' | 'pose' | 'destinationId'> {
  if (event.type === 'sale') {
    if (age === 0) {
      return {
        status: 'handoff',
        pose: 'receiving',
        destinationId: `station:${event.stationId}:handoff`,
      };
    }
    if (age === 1) {
      return {
        status: 'payment',
        pose: 'paying',
        destinationId: `station:${event.stationId}:payment`,
      };
    }
    return { status: 'exit', pose: 'leaving', destinationId: `exit:${event.stationId}` };
  }
  if (age <= 1) {
    return event.reason === 'stockout'
      ? {
          status: 'stockout',
          pose: 'disappointed',
          destinationId: `station:${event.stationId}:stockout`,
        }
      : {
          status: 'abandonment',
          pose: 'disappointed',
          destinationId: `station:${event.stationId}:abandonment`,
        };
  }
  return { status: 'exit', pose: 'leaving', destinationId: `exit:${event.stationId}` };
}

function createStaffEntities(
  game: GameState,
  activeStations: ReadonlySet<StationId>,
): SceneStaffEntitySnapshot[] {
  const staffById = new Map(game.staff.map((member) => [member.id, member]));
  const stationSlot = new Map<StationId, number>(STATION_IDS.map((stationId) => [stationId, 0]));
  return game.plan.scheduledStaffIds.slice(0, MAX_SCENE_STAFF).flatMap((staffId) => {
    const member = staffById.get(staffId);
    if (!member) return [];
    const stationId = STATION_IDS.find((candidate) =>
      game.plan.stationAssignments[candidate].includes(staffId),
    );
    if (!stationId) return [];
    const slot = stationSlot.get(stationId) ?? 0;
    stationSlot.set(stationId, slot + 1);
    const status: SceneStaffStatus =
      member.role === 'manager'
        ? 'coordinating'
        : member.role === 'runner'
          ? 'handoff'
          : activeStations.has(stationId)
            ? 'serving'
            : 'ready';
    return [
      {
        entityId: `staff:${member.id}` as const,
        id: member.id,
        name: member.name,
        role: member.role,
        stationId,
        status,
        pose: status === 'ready' ? ('ready' as const) : ('working' as const),
        destinationId: `staff:${stationId}:${member.role}:${slot}`,
      },
    ];
  });
}

function customerIdentity(
  customer: Customer,
): Pick<SceneCustomerEntitySnapshot, 'id' | 'segment' | 'stationId' | 'laneId'> {
  return {
    id: customer.id,
    segment: customer.segment,
    stationId: customer.stationId,
    laneId: customer.laneId,
  };
}

function copyOrder(customer: Customer): SceneOrderSnapshot {
  return {
    drinkId: customer.order.drinkId,
    size: customer.order.size,
    milk: customer.order.milk,
    priceCents: customer.order.priceCents,
  };
}

function latestActivityForCustomer(
  events: readonly RushActivityEvent[],
  customerId: string,
): RushActivityEvent | undefined {
  return events.findLast((event) => event.customerId === customerId);
}

function sceneSnapshotId(
  game: GameState,
  customers: readonly SceneCustomerEntitySnapshot[],
  staff: readonly SceneStaffEntitySnapshot[],
  latestSequence: number,
): string {
  const jobs = game.rush
    ? STATION_IDS.map((stationId) => game.rush?.serviceJobsByStation[stationId]?.id ?? '-').join(
        ',',
      )
    : '-';
  return [
    `d${game.day}`,
    `t${game.rush?.tick ?? 0}`,
    `q${game.rush?.normalQueue.length ?? 0}:${game.rush?.expressQueue.length ?? 0}`,
    `j${jobs}`,
    `a${latestSequence}`,
    `c${customers.map(({ id, status }) => `${id}:${status}`).join(',')}`,
    `s${staff.map(({ id, status }) => `${id}:${status}`).join(',')}`,
  ].join('|');
}

function boundedProgress(remainingTicks: number, totalTicks: number): number {
  if (totalTicks <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingTicks / totalTicks));
}

function activeEntityDescription(customer: SceneCustomerEntitySnapshot): string {
  const drink = customer.order
    ? (DRINK_MAP.get(customer.order.drinkId)?.name ?? customer.order.drinkId)
    : 'drink';
  return `At the counter: ${segmentLabel(customer.segment)} customer ${customer.id} is job ${customer.jobId ?? 'unknown'} at the ${stationLabel(customer.stationId)} ${customer.laneId} lane for ${drink}.`;
}

function stationLabel(stationId: StationId): string {
  if (stationId === 'espressoBar') return 'espresso bar';
  if (stationId === 'brewBar') return 'brew bar';
  return 'cold bar';
}

function segmentLabel(segment: CustomerSegment): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function weatherLabel(weather: WeatherId): string {
  if (weather === 'coldSnap') return 'a cold snap';
  return weather;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
