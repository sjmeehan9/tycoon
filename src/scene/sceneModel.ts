import type {
  CosmeticId,
  CustomerSegment,
  EquipmentState,
  GamePhase,
  GameState,
  StaffRole,
  VenueId,
  WeatherId,
} from '../game';
import { VENUES } from '../content/gameContent';

export const LOGICAL_SCENE_SIZE = Object.freeze({ width: 320, height: 180 });

export interface SceneSnapshot {
  readonly day: number;
  readonly venueId: VenueId;
  readonly weather: WeatherId;
  readonly phase: GamePhase;
  readonly queueSegments: readonly CustomerSegment[];
  readonly isServing: boolean;
  readonly scheduledRoles: readonly StaffRole[];
  readonly equipment: Readonly<EquipmentState>;
  readonly hasStreetSign: boolean;
  readonly awning: CosmeticId;
  readonly reducedMotion: boolean;
}

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
  return Object.freeze({
    day: game.day,
    venueId: game.venueId,
    weather: game.weather,
    phase: game.phase,
    queueSegments: Object.freeze(game.rush?.queue.slice(0, 6).map(({ segment }) => segment) ?? []),
    isServing: Boolean(game.rush?.activeService),
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
  const queue = snapshot.queueSegments.length;
  const team = snapshot.scheduledRoles.length;
  const activity = snapshot.isServing ? 'serving a drink' : 'between drinks';
  return `${VENUES[snapshot.venueId].shortName} in ${weatherLabel(snapshot.weather)} weather. Day ${snapshot.day}, ${snapshot.phase} phase, ${queue} customers waiting, ${team} staff scheduled, ${activity}.`;
}

/** Animate visual flourishes only while service is moving and motion is allowed. */
export function shouldAnimateScene(snapshot: SceneSnapshot): boolean {
  return !snapshot.reducedMotion && (snapshot.phase === 'rush' || snapshot.phase === 'event');
}

function weatherLabel(weather: WeatherId): string {
  if (weather === 'coldSnap') return 'a cold snap';
  return weather;
}
