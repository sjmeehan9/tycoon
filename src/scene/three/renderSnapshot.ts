import { INGREDIENT_DETAILS, INGREDIENT_IDS } from '../../content/gameContent';
import {
  inventoryTotals,
  serviceQueueCapacity,
  type CosmeticId,
  type CustomerSegment,
  type EquipmentState,
  type GamePhase,
  type GameState,
  type IngredientId,
  type ImprovementId,
  type RushActivityEvent,
  type RushSpeed,
  type StaffRole,
  type VenueId,
  type WeatherId,
} from '../../game';
import {
  MAX_SCENE_QUEUED_CUSTOMERS,
  createSceneSnapshot,
  describeScene,
  type SceneCustomerEntitySnapshot,
  type SceneQueueSummary,
  type SceneStaffEntitySnapshot,
} from '../sceneModel';

export const MAX_RENDER_QUEUE_CUSTOMERS = MAX_SCENE_QUEUED_CUSTOMERS;
export const MAX_RENDER_ACTIVITY_EVENTS = 12;
export const MAX_RENDER_STAFF = 10;

export type RenderStockLevel = 'available' | 'low' | 'empty';

export interface RenderCustomerSnapshot {
  readonly id: string;
  readonly segment: CustomerSegment;
}

export interface RenderActiveServiceSnapshot extends RenderCustomerSnapshot {
  readonly drinkId: string;
  readonly size: string;
  readonly milk: string;
  readonly progress: number;
}

export interface RenderStockSnapshot {
  readonly ingredientId: IngredientId;
  readonly name: string;
  readonly quantity: number;
  readonly level: RenderStockLevel;
}

export interface RenderSnapshot {
  readonly snapshotId: string;
  readonly description: string;
  readonly identity: Readonly<{
    day: number;
    venueId: VenueId;
    weather: WeatherId;
    phase: GamePhase;
  }>;
  readonly service: Readonly<{
    tick: number;
    speed: RushSpeed;
    isPaused: boolean;
    queueCount: number;
    queueCapacity: number;
    queueSummary: SceneQueueSummary;
    queue: readonly RenderCustomerSnapshot[];
    customers: readonly SceneCustomerEntitySnapshot[];
    staff: readonly SceneStaffEntitySnapshot[];
    activeJobs: readonly SceneCustomerEntitySnapshot[];
    active: RenderActiveServiceSnapshot | null;
    activity: readonly RushActivityEvent[];
    served: number;
    abandoned: number;
    revenueCents: number;
  }>;
  readonly operation: Readonly<{
    scheduledRoles: readonly StaffRole[];
    equipment: Readonly<EquipmentState>;
    stock: readonly RenderStockSnapshot[];
    hasStreetSign: boolean;
    improvements: readonly ImprovementId[];
    cosmetics: readonly CosmeticId[];
    awning: CosmeticId;
  }>;
  readonly presentation: Readonly<{
    reducedMotion: boolean;
    animate: boolean;
  }>;
}

/**
 * Copy game truth into a bounded, deeply frozen presentation-only contract.
 * No engine object reference or command crosses this boundary.
 */
export function createRenderSnapshot(
  game: GameState,
  reducedMotion: boolean,
  cosmetics: readonly CosmeticId[],
): RenderSnapshot {
  const scene = createSceneSnapshot(game, reducedMotion, cosmetics);
  const totals = inventoryTotals(game.inventory);
  const queued = scene.customerEntities.filter(
    ({ status }) => status === 'approach' || status === 'queued',
  );
  const activeJobs = scene.customerEntities.filter(({ status }) => status === 'service');
  const firstActiveJob = activeJobs[0];
  const active = firstActiveJob?.order
    ? {
        id: firstActiveJob.id,
        segment: firstActiveJob.segment,
        drinkId: firstActiveJob.order.drinkId,
        size: firstActiveJob.order.size,
        milk: firstActiveJob.order.milk,
        progress: firstActiveJob.progress,
      }
    : null;
  const snapshot: RenderSnapshot = {
    snapshotId: scene.snapshotId,
    description: describeScene(scene),
    identity: {
      day: game.day,
      venueId: game.venueId,
      weather: game.weather,
      phase: game.phase,
    },
    service: {
      tick: game.rush?.tick ?? 0,
      speed: game.rush?.speed ?? 1,
      isPaused: game.rush?.isPaused ?? false,
      queueCount: scene.queueSummary.total,
      queueCapacity: serviceQueueCapacity(game),
      queueSummary: scene.queueSummary,
      queue: queued.map(({ id, segment }) => ({
        id,
        segment,
      })),
      customers: scene.customerEntities,
      staff: scene.staffEntities,
      activeJobs,
      active,
      activity:
        game.rush?.recentActivity
          .slice(-MAX_RENDER_ACTIVITY_EVENTS)
          .map((activity) => cloneActivity(activity)) ?? [],
      served: game.rush?.stats.served ?? 0,
      abandoned: game.rush?.stats.abandoned ?? 0,
      revenueCents: game.rush?.stats.revenueCents ?? 0,
    },
    operation: {
      scheduledRoles: scene.staffEntities.slice(0, MAX_RENDER_STAFF).map(({ role }) => role),
      equipment: { ...game.equipment },
      stock: INGREDIENT_IDS.map((ingredientId) => ({
        ingredientId,
        name: INGREDIENT_DETAILS[ingredientId].name,
        quantity: totals[ingredientId],
        level: stockLevel(totals[ingredientId]),
      })),
      hasStreetSign: game.improvements.includes('street-sign'),
      improvements: [...game.improvements],
      cosmetics: [...cosmetics],
      awning: scene.awning,
    },
    presentation: {
      reducedMotion,
      animate: !reducedMotion && !scene.isPaused && scene.phase === 'rush',
    },
  };
  return deepFreeze(snapshot);
}

/** Recursively freeze a serializable value while preserving its static type. */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function stockLevel(quantity: number): RenderStockLevel {
  if (quantity <= 0) return 'empty';
  if (quantity < 300) return 'low';
  return 'available';
}

function cloneActivity(activity: RushActivityEvent): RushActivityEvent {
  if (activity.type === 'arrival') return { ...activity };
  if (activity.type === 'walkaway') return { ...activity };
  if (activity.type === 'serviceStarted') return { ...activity };
  return { ...activity };
}
