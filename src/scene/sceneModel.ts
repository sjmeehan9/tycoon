import {
  activeServiceJobs,
  waitingCustomers,
  type CosmeticId,
  type CustomerSegment,
  type EquipmentState,
  type GamePhase,
  type GameState,
  type RushActivityEvent,
  type RushSpeed,
  type StaffRole,
  type VenueId,
  type WeatherId,
} from '../game';
import { DRINK_MAP, VENUES } from '../content/gameContent';
import { describeRushActivity } from '../game/selectors';

export const LOGICAL_SCENE_SIZE = Object.freeze({ width: 320, height: 180 });

export interface SceneSnapshot {
  readonly day: number;
  readonly venueId: VenueId;
  readonly weather: WeatherId;
  readonly phase: GamePhase;
  readonly rushTick: number;
  readonly rushSpeed: RushSpeed;
  readonly isPaused: boolean;
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
  const waiting = game.rush ? waitingCustomers(game.rush) : [];
  const firstActiveJob = game.rush ? activeServiceJobs(game.rush)[0] : undefined;
  const queueCustomers = waiting
    .slice(0, 8)
    .map(({ id, segment }) => Object.freeze({ id, segment }));
  const activeCustomer = firstActiveJob
    ? Object.freeze({
        id: firstActiveJob.customer.id,
        segment: firstActiveJob.customer.segment,
        order: Object.freeze({
          drinkId: firstActiveJob.customer.order.drinkId,
          size: firstActiveJob.customer.order.size,
          milk: firstActiveJob.customer.order.milk,
          priceCents: firstActiveJob.customer.order.priceCents,
        }),
      })
    : null;
  return Object.freeze({
    day: game.day,
    venueId: game.venueId,
    weather: game.weather,
    phase: game.phase,
    rushTick: game.rush?.tick ?? 0,
    rushSpeed: game.rush?.speed ?? 1,
    isPaused: game.rush?.isPaused ?? false,
    queueCount: waiting.length,
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
  const latestSale = snapshot.recentActivity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot.recentActivity.findLast((event) => event.type === 'walkaway');
  const base = `${VENUES[snapshot.venueId].shortName} in ${weatherLabel(snapshot.weather)} weather. Day ${snapshot.day}, ${snapshot.phase} phase, ${queue} customers waiting, ${team} staff scheduled, ${activity}.`;
  const details = [
    snapshot.activeCustomer ? activeCustomerDescription(snapshot.activeCustomer) : null,
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

function activeCustomerDescription(customer: SceneActiveCustomerSnapshot): string {
  const drink = DRINK_MAP.get(customer.order.drinkId)?.name ?? customer.order.drinkId;
  const size = customer.order.size === 'large' ? 'large' : 'regular';
  const milk = customer.order.milk === 'none' ? '' : ` ${customer.order.milk}`;
  return `At the counter: ${segmentLabel(customer.segment)} customer ${customer.id} is being served a ${size}${milk} ${drink}.`;
}

function segmentLabel(segment: CustomerSegment): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function weatherLabel(weather: WeatherId): string {
  if (weather === 'coldSnap') return 'a cold snap';
  return weather;
}
