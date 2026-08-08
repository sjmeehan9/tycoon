/** Shared deterministic order-choice probabilities for simulation and capacity forecasts. */

import {
  DRINK_MAP,
  SEGMENT_DEMAND_SHARES,
  SEGMENT_DRINK_APPEAL,
  SEGMENT_LARGE_SIZE_PROBABILITY,
  SEGMENT_PRICE_SENSITIVITY_CENTS,
} from '../content/gameContent';
import { applyDemandInfluence, type OrderChoiceDemandInfluenceId } from './demandInfluences';
import type {
  CustomerSegment,
  DrinkConfig,
  DrinkId,
  DrinkSize,
  GameState,
  MilkChoice,
} from './types';

const SEGMENT_ORDER: CustomerSegment[] = ['commuter', 'student', 'enthusiast', 'regular'];
const MILK_INTERVALS = [0, 0.52, 0.72, 0.84, 1] as const;

/** Registry identities consumed by the order-choice engine path. */
export const ORDER_CHOICE_DEMAND_ENGINE_INFLUENCES = [
  'orderSegmentPrice',
  'orderSegmentAppeal',
  'orderWeather',
] as const satisfies readonly OrderChoiceDemandInfluenceId[];

/** Select a customer segment from the service PRNG draw. */
export function segmentForDraw(draw: number): CustomerSegment {
  const boundedDraw = clampDraw(draw);
  let cumulative = 0;
  for (const segment of SEGMENT_ORDER) {
    cumulative = Math.round((cumulative + SEGMENT_DEMAND_SHARES[segment]) * 1_000_000) / 1_000_000;
    if (boundedDraw < cumulative) return segment;
  }
  return 'regular';
}

/** Return the non-stock-suppressed drink-choice weight for one segment. */
export function baseDrinkChoiceWeight(
  state: GameState,
  segment: CustomerSegment,
  drinkId: DrinkId,
): number {
  const drink = DRINK_MAP.get(drinkId);
  if (!drink) return 0;
  const price = state.plan.pricesCents[drinkId];
  const sensitivity = SEGMENT_PRICE_SENSITIVITY_CENTS[segment];
  const baselinePriceFactor = clamp(1.25 - (price - drink.basePriceCents) / sensitivity, 0.25, 1.5);
  const factors = {
    orderSegmentPrice: applyDemandInfluence(
      state.difficulty,
      'orderSegmentPrice',
      baselinePriceFactor,
    ),
    orderSegmentAppeal: applyDemandInfluence(
      state.difficulty,
      'orderSegmentAppeal',
      SEGMENT_DRINK_APPEAL[segment][drinkId],
    ),
    orderWeather: applyDemandInfluence(
      state.difficulty,
      'orderWeather',
      drinkWeatherChoiceMultiplier(drinkId, state.weather),
    ),
  } satisfies Record<OrderChoiceDemandInfluenceId, number>;
  return ORDER_CHOICE_DEMAND_ENGINE_INFLUENCES.reduce(
    (weight, influenceId) => weight * factors[influenceId],
    1,
  );
}

/** Return weather's configured drink-choice multiplier. */
export function drinkWeatherChoiceMultiplier(
  drinkId: DrinkId,
  weather: GameState['weather'],
): number {
  const isColdDrink = drinkId === 'icedLatte' || drinkId === 'coldBrew';
  if (weather === 'sunny') return isColdDrink ? 1.65 : 0.9;
  if (weather === 'coldSnap') return isColdDrink ? 0.5 : 1.22;
  if (weather === 'rainy') return isColdDrink ? 0.65 : 1.15;
  return 1;
}

/** Select the configured size from a service PRNG draw. */
export function sizeForDraw(drink: DrinkConfig, segment: CustomerSegment, draw: number): DrinkSize {
  const probabilities = sizeProbabilities(drink, segment);
  return clampDraw(draw) < probabilities.large ? 'large' : 'regular';
}

/** Return exact regular/large probabilities for a drink and segment. */
export function sizeProbabilities(
  drink: DrinkConfig,
  segment: CustomerSegment,
): Record<DrinkSize, number> {
  const hasLarge = drink.variants.some((variant) => variant.size === 'large');
  const large = hasLarge ? SEGMENT_LARGE_SIZE_PROBABILITY[segment] : 0;
  return { regular: 1 - large, large };
}

/** Select the configured milk from a service PRNG draw. */
export function milkForDraw(drink: DrinkConfig, draw: number): MilkChoice {
  if (drink.allowedMilks.length === 1) return drink.allowedMilks[0] ?? 'none';
  const boundedDraw = clampDraw(draw);
  if (drink.allowedMilks.includes('none') && boundedDraw < 0.52) return 'none';
  if (drink.allowedMilks.includes('oat') && boundedDraw < 0.72) return 'oat';
  if (drink.allowedMilks.includes('soy') && boundedDraw < 0.84) return 'soy';
  return drink.allowedMilks.includes('dairy') ? 'dairy' : (drink.allowedMilks[0] ?? 'none');
}

/** Return exact milk probabilities induced by the service draw thresholds. */
export function milkProbabilities(drink: DrinkConfig): Record<MilkChoice, number> {
  const probabilities: Record<MilkChoice, number> = { none: 0, dairy: 0, oat: 0, soy: 0 };
  for (let index = 0; index < MILK_INTERVALS.length - 1; index += 1) {
    const start = MILK_INTERVALS[index] ?? 0;
    const end = MILK_INTERVALS[index + 1] ?? 1;
    const milk = milkForDraw(drink, start + (end - start) / 2);
    probabilities[milk] = roundProbability(probabilities[milk] + end - start);
  }
  return probabilities;
}

function clampDraw(draw: number): number {
  if (!Number.isFinite(draw)) return 0;
  return clamp(draw, 0, 1 - Number.EPSILON);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundProbability(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
