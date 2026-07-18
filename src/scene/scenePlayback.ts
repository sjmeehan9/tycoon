import type { CustomerSegment, RushActivityEvent, RushWalkawayReason } from '../game';
import type { SceneSnapshot } from './sceneModel';

/** Hard presentation bounds keep Canvas work independent of campaign history. */
export const MAX_SCENE_TRANSIENTS = 3;
export const MAX_SCENE_QUEUE_SPRITES = 8;
export const QUEUE_SHIFT_DURATION_MS = 420;

export type SceneTransientKind = 'arrival' | 'sale' | 'walkaway';

export interface SceneTransient {
  readonly eventId: string;
  readonly sequence: number;
  readonly kind: SceneTransientKind;
  readonly customerId: string;
  readonly segment: CustomerSegment | null;
  readonly ageMs: number;
  readonly durationMs: number;
  readonly priceCents?: number;
  readonly reason?: RushWalkawayReason;
}

export interface SceneQueueMotion {
  readonly customerId: string;
  readonly segment: CustomerSegment;
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly ageMs: number;
  readonly durationMs: number;
}

export interface ScenePlaybackState {
  readonly lastSequence: number;
  readonly queueOrder: readonly string[];
  readonly queueMotions: readonly SceneQueueMotion[];
  readonly transients: readonly SceneTransient[];
}

/** Initialize at persisted truth without replaying retained history as new motion. */
export function createScenePlayback(snapshot: SceneSnapshot): ScenePlaybackState {
  return freezePlayback({
    lastSequence: snapshot.recentActivity.at(-1)?.sequence ?? -1,
    queueOrder: snapshot.queueCustomers.map(({ id }) => id),
    queueMotions: snapshot.queueCustomers.map(({ id, segment }, index) => ({
      customerId: id,
      segment,
      fromIndex: index,
      toIndex: index,
      ageMs: QUEUE_SHIFT_DURATION_MS,
      durationMs: QUEUE_SHIFT_DURATION_MS,
    })),
    transients: [],
  });
}

/** Consume unseen retained IDs once, coalescing presentation work to fixed bounds. */
export function syncScenePlayback(
  state: ScenePlaybackState,
  snapshot: SceneSnapshot,
): ScenePlaybackState {
  const latestSequence = snapshot.recentActivity.at(-1)?.sequence ?? -1;
  if (latestSequence < state.lastSequence) return createScenePlayback(snapshot);

  const unseen = snapshot.recentActivity.filter((event) => event.sequence > state.lastSequence);
  const transients = snapshot.reducedMotion
    ? []
    : coalesceTransients(state.transients, unseen).slice(-MAX_SCENE_TRANSIENTS);
  const nextOrder = snapshot.queueCustomers.map(({ id }) => id);
  const queueChanged = !sameOrder(state.queueOrder, nextOrder);
  const queueMotions = snapshot.reducedMotion
    ? snapshot.queueCustomers.map(({ id, segment }, toIndex) => ({
        customerId: id,
        segment,
        fromIndex: toIndex,
        toIndex,
        ageMs: QUEUE_SHIFT_DURATION_MS,
        durationMs: QUEUE_SHIFT_DURATION_MS,
      }))
    : queueChanged
      ? snapshot.queueCustomers.map(({ id, segment }, toIndex) => {
          const existing = state.queueMotions.find((motion) => motion.customerId === id);
          const previousIndex = state.queueOrder.indexOf(id);
          const fromIndex = existing
            ? interpolatedQueueIndex(existing)
            : previousIndex >= 0
              ? previousIndex
              : Math.max(toIndex + 3, nextOrder.length + 1);
          return {
            customerId: id,
            segment,
            fromIndex,
            toIndex,
            ageMs: 0,
            durationMs: QUEUE_SHIFT_DURATION_MS,
          };
        })
      : state.queueMotions;

  return freezePlayback({
    lastSequence: latestSequence,
    queueOrder: nextOrder,
    queueMotions,
    transients,
  });
}

/** Advance presentation-only ages; pause and reduced motion freeze all travel. */
export function advanceScenePlayback(
  state: ScenePlaybackState,
  snapshot: SceneSnapshot,
  elapsedMs: number,
): ScenePlaybackState {
  const synced = syncScenePlayback(state, snapshot);
  if (
    snapshot.isPaused ||
    snapshot.reducedMotion ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs <= 0
  ) {
    return synced;
  }
  const boundedElapsed = Math.min(elapsedMs, 250) * snapshot.rushSpeed;
  return freezePlayback({
    ...synced,
    queueMotions: synced.queueMotions.map((motion) => ({
      ...motion,
      ageMs: Math.min(motion.durationMs, motion.ageMs + boundedElapsed),
    })),
    transients: synced.transients
      .map((transient) => ({ ...transient, ageMs: transient.ageMs + boundedElapsed }))
      .filter((transient) => transient.ageMs < transient.durationMs),
  });
}

/** Return eased zero-to-one progress for a bounded transient. */
export function sceneTransientProgress(transient: SceneTransient): number {
  return easeOutCubic(Math.min(1, transient.ageMs / transient.durationMs));
}

/** Return the eased queue index used to draw a shifting customer. */
export function interpolatedQueueIndex(motion: SceneQueueMotion): number {
  const progress = easeOutCubic(Math.min(1, motion.ageMs / motion.durationMs));
  return motion.fromIndex + (motion.toIndex - motion.fromIndex) * progress;
}

/** Colour-independent short labels paired with each distinct walkaway icon/path. */
export function walkawayVisualLabel(reason: RushWalkawayReason): string {
  if (reason === 'patience') return 'WAITED TOO LONG';
  if (reason === 'queueFull') return 'QUEUE FULL';
  if (reason === 'stockout') return 'OUT OF STOCK';
  return 'RUSH CLOSED';
}

function coalesceTransients(
  retained: readonly SceneTransient[],
  unseen: readonly RushActivityEvent[],
): SceneTransient[] {
  const byCustomer = new Map(retained.map((transient) => [transient.customerId, transient]));
  for (const event of unseen) {
    if (event.type === 'serviceStarted') {
      byCustomer.delete(event.customerId);
      continue;
    }
    const transient = transientForEvent(event);
    if (transient) byCustomer.set(event.customerId, transient);
  }
  return [...byCustomer.values()].sort((left, right) => left.sequence - right.sequence);
}

function transientForEvent(event: RushActivityEvent): SceneTransient | null {
  if (event.type === 'arrival') {
    return {
      eventId: event.id,
      sequence: event.sequence,
      kind: 'arrival',
      customerId: event.customerId,
      segment: event.segment,
      ageMs: 0,
      durationMs: 900,
    };
  }
  if (event.type === 'sale') {
    return {
      eventId: event.id,
      sequence: event.sequence,
      kind: 'sale',
      customerId: event.customerId,
      segment: event.segment,
      priceCents: event.priceCents,
      ageMs: 0,
      durationMs: 1_400,
    };
  }
  if (event.type === 'walkaway') {
    return {
      eventId: event.id,
      sequence: event.sequence,
      kind: 'walkaway',
      customerId: event.customerId,
      segment: event.segment,
      reason: event.reason,
      ageMs: 0,
      durationMs: 1_300,
    };
  }
  return null;
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

function freezePlayback(state: ScenePlaybackState): ScenePlaybackState {
  return Object.freeze({
    ...state,
    queueOrder: Object.freeze([...state.queueOrder]),
    queueMotions: Object.freeze(state.queueMotions.map((motion) => Object.freeze({ ...motion }))),
    transients: Object.freeze(state.transients.map((transient) => Object.freeze({ ...transient }))),
  });
}
