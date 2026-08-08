import { INGREDIENT_DETAILS, INGREDIENT_IDS } from '../../content/gameContent';
import {
  inventoryTotals,
  type CosmeticId,
  type CustomerSegment,
  type EquipmentState,
  type GamePhase,
  type GameState,
  type IngredientId,
  type RushActivityEvent,
  type RushSpeed,
  type StaffRole,
  type VenueId,
  type WeatherId,
} from '../../game';
import { createSceneSnapshot, describeScene } from '../sceneModel';

export const MAX_RENDER_QUEUE_CUSTOMERS = 12;
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
    queue: readonly RenderCustomerSnapshot[];
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
  const scheduledIds = new Set(game.plan.scheduledStaffIds);
  const activeService = game.rush?.activeService;
  const active = activeService
    ? {
        id: activeService.customer.id,
        segment: activeService.customer.segment,
        drinkId: activeService.customer.order.drinkId,
        size: activeService.customer.order.size,
        milk: activeService.customer.order.milk,
        progress: boundedProgress(activeService.remainingTicks, activeService.totalTicks),
      }
    : null;
  const snapshot: RenderSnapshot = {
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
      queueCount: game.rush?.queue.length ?? 0,
      queue:
        game.rush?.queue.slice(0, MAX_RENDER_QUEUE_CUSTOMERS).map(({ id, segment }) => ({
          id,
          segment,
        })) ?? [],
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
      scheduledRoles: game.staff
        .filter(({ id }) => scheduledIds.has(id))
        .slice(0, MAX_RENDER_STAFF)
        .map(({ role }) => role),
      equipment: { ...game.equipment },
      stock: INGREDIENT_IDS.map((ingredientId) => ({
        ingredientId,
        name: INGREDIENT_DETAILS[ingredientId].name,
        quantity: totals[ingredientId],
        level: stockLevel(totals[ingredientId]),
      })),
      hasStreetSign: game.improvements.includes('street-sign'),
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

function boundedProgress(remainingTicks: number, totalTicks: number): number {
  if (totalTicks <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingTicks / totalTicks));
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
