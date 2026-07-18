import type {
  CosmeticId,
  CustomerSegment,
  EquipmentState,
  GamePhase,
  GameState,
  RushActivityEvent,
  StaffRole,
  VenueId,
  WeatherId,
} from '../game';
import { VENUES } from '../content/gameContent';
import { describeRushActivity } from '../game/selectors';

export const LOGICAL_SCENE_SIZE = Object.freeze({ width: 320, height: 180 });

export interface SceneSnapshot {
  readonly day: number;
  readonly venueId: VenueId;
  readonly weather: WeatherId;
  readonly phase: GamePhase;
  readonly queueCount: number;
  readonly queueCustomers: readonly SceneCustomerSnapshot[];
  readonly queueSegments: readonly CustomerSegment[];
  readonly activeCustomer: SceneActiveCustomerSnapshot | null;
  readonly recentActivity: readonly RushActivityEvent[];
  readonly isServing: boolean;
  readonly scheduledRoles: readonly StaffRole[];
  readonly equipment: Readonly<EquipmentState>;
  readonly hasStreetSign: boolean;
  readonly awning: CosmeticId;
  readonly reducedMotion: boolean;
}

export interface SceneCustomerSnapshot {
  readonly id: string;
  readonly segment: CustomerSegment;
}

export interface SceneActiveCustomerSnapshot extends SceneCustomerSnapshot {
  readonly order: Readonly<{
    drinkId: RushActivityOrder['drinkId'];
    size: RushActivityOrder['size'];
    milk: RushActivityOrder['milk'];
    priceCents: number;
  }>;
}

type RushActivityOrder = Extract<RushActivityEvent, { type: 'sale' }>;

/** Extract the only immutable game and preference data the presentation layer may consume. */
export function createSceneSnapshot(
  game: GameState,
  reducedMotion: boolean,
  cosmetics: readonly CosmeticId[],
): SceneSnapshot {
  const scheduled = new Set(game.plan.scheduledStaffIds);
  const awning = cosmetics.includes('neonCup')
    ? 'neonCup'
    : cosmetics.includes('wattleAwning')
      ? 'wattleAwning'
      : 'classicAwning';
  const queueCustomers =
    game.rush?.queue.slice(0, 8).map(({ id, segment }) => Object.freeze({ id, segment })) ?? [];
  const activeCustomer = game.rush?.activeService
    ? Object.freeze({
        id: game.rush.activeService.customer.id,
        segment: game.rush.activeService.customer.segment,
        order: Object.freeze({
          drinkId: game.rush.activeService.customer.order.drinkId,
          size: game.rush.activeService.customer.order.size,
          milk: game.rush.activeService.customer.order.milk,
          priceCents: game.rush.activeService.customer.order.priceCents,
        }),
      })
    : null;
  return Object.freeze({
    day: game.day,
    venueId: game.venueId,
    weather: game.weather,
    phase: game.phase,
    queueCount: game.rush?.queue.length ?? 0,
    queueCustomers: Object.freeze(queueCustomers),
    queueSegments: Object.freeze(queueCustomers.map(({ segment }) => segment)),
    activeCustomer,
    recentActivity: Object.freeze(
      game.rush?.recentActivity.map((event) => Object.freeze({ ...event })) ?? [],
    ),
    isServing: activeCustomer !== null,
    scheduledRoles: Object.freeze(
      game.staff.filter(({ id }) => scheduled.has(id)).map(({ role }) => role),
    ),
    equipment: Object.freeze({ ...game.equipment }),
    hasStreetSign: game.improvements.includes('street-sign'),
    awning,
    reducedMotion,
  });
}

/** Human-readable equivalent of every animated scene state. */
export function describeScene(snapshot: SceneSnapshot): string {
  const queue = snapshot.queueCount;
  const team = snapshot.scheduledRoles.length;
  const activity = snapshot.isServing ? 'serving a drink' : 'between drinks';
  const latest = snapshot.recentActivity.at(-1);
  const base = `${VENUES[snapshot.venueId].shortName} in ${weatherLabel(snapshot.weather)} weather. Day ${snapshot.day}, ${snapshot.phase} phase, ${queue} customers waiting, ${team} staff scheduled, ${activity}.`;
  return latest ? `${base} Latest activity: ${describeRushActivity(latest)}` : base;
}

/** Animate visual flourishes only while service is moving and motion is allowed. */
export function shouldAnimateScene(snapshot: SceneSnapshot): boolean {
  return !snapshot.reducedMotion && (snapshot.phase === 'rush' || snapshot.phase === 'event');
}

function weatherLabel(weather: WeatherId): string {
  if (weather === 'coldSnap') return 'a cold snap';
  return weather;
}
