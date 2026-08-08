import type { Difficulty } from './types';

/** Arrival factors consumed by `demandRate`. */
export type ArrivalDemandInfluenceId =
  | 'arrivalAggregatePrice'
  | 'arrivalReputation'
  | 'arrivalImprovements'
  | 'arrivalDialIn'
  | 'arrivalBean'
  | 'arrivalWeather'
  | 'arrivalVenue'
  | 'arrivalScenario'
  | 'arrivalTeamEquipment'
  | 'arrivalQueueWait'
  | 'arrivalAvailability'
  | 'arrivalRushEvent';

/** Per-order factors consumed by drink-choice weighting. */
export type OrderChoiceDemandInfluenceId =
  'orderSegmentPrice' | 'orderSegmentAppeal' | 'orderWeather';

export type DemandInfluenceId = ArrivalDemandInfluenceId | OrderChoiceDemandInfluenceId;
export type DemandInfluenceDomain = 'bidirectional' | 'positive-only' | 'negative-only';
export type DemandInfluenceApplication = 'factor' | 'price-slope';

/** Auditable contract for one engine factor affected by campaign difficulty. */
export interface DemandInfluenceDefinition {
  scope: 'arrival' | 'order-choice';
  label: string;
  baseline: string;
  neutral: number;
  domain: DemandInfluenceDomain;
  application: DemandInfluenceApplication;
  clamp: { minimum: number; maximum: number };
  boundary: string;
  engineSource: string;
}

/** Standard changes price response only; Hard amplifies every supported baseline deviation. */
export const DIFFICULTY_DEVIATION_MULTIPLIERS = {
  standard: { price: 1.225, nonPrice: 1 },
  hard: { price: 1.675, nonPrice: 1.675 },
} as const satisfies Record<Difficulty, { price: number; nonPrice: number }>;

/** Complete registry of factors that shape arrivals or order choice. */
export const DEMAND_INFLUENCES = {
  arrivalAggregatePrice: definition(
    'arrival',
    'Average menu price',
    '1.15 − (average price − $5.00) / $9.00',
    1.15,
    'bidirectional',
    'price-slope',
    0.55,
    1.25,
    'Final arrival price factor is clamped from 0.55 to 1.25.',
    'engine.demandRate.aggregatePrice',
  ),
  arrivalReputation: definition(
    'arrival',
    'Reputation',
    '0.8 + reputation / 250',
    1,
    'bidirectional',
    'factor',
    0.8,
    1.2,
    'Reputation is bounded from 0 to 100.',
    'engine.demandRate.reputation',
  ),
  arrivalImprovements: definition(
    'arrival',
    'Street sign and improvements',
    'Street sign multiplies arrivals by 1.08; no sign is neutral.',
    1,
    'positive-only',
    'factor',
    1,
    1.14,
    'Values below neutral are not invented for positive-only improvements.',
    'engine.demandRate.improvements',
  ),
  arrivalDialIn: definition(
    'arrival',
    'Dial-in',
    'Speed 0.97, balanced 1, quality 1.06.',
    1,
    'bidirectional',
    'factor',
    0.94,
    1.11,
    'Only the three configured dial-in factors are accepted by the engine.',
    'engine.demandRate.dialIn',
  ),
  arrivalBean: definition(
    'arrival',
    'Bean choice',
    '1 + configured bean quality / 100.',
    1,
    'bidirectional',
    'factor',
    0.94,
    1.12,
    'Bean quality is bounded by the configured bean catalogue.',
    'engine.demandRate.bean',
  ),
  arrivalWeather: definition(
    'arrival',
    'Weather',
    'Configured weather demand multiplier.',
    1,
    'bidirectional',
    'factor',
    0.86,
    1.17,
    'Weather must be one of the configured deterministic day values.',
    'engine.demandRate.weather',
  ),
  arrivalVenue: definition(
    'arrival',
    'Venue',
    'Configured venue demand factor; the cart is neutral.',
    1,
    'positive-only',
    'factor',
    1,
    1.65,
    'Venue progression never creates a negative demand factor.',
    'engine.demandRate.venue',
  ),
  arrivalScenario: definition(
    'arrival',
    'Scenario',
    'Configured scenario demand multiplier; Laneway Classic is neutral.',
    1,
    'positive-only',
    'factor',
    1,
    1.14,
    'Scenario unlocks remain shared and add no hidden economic modifier.',
    'engine.demandRate.scenario',
  ),
  arrivalTeamEquipment: definition(
    'arrival',
    'Scheduled team, traits, and equipment',
    'Product of scheduled people-person and POS demand multipliers.',
    1,
    'positive-only',
    'factor',
    1,
    1.56,
    'Only scheduled staff and owned equipment contribute.',
    'engine.demandRate.teamEquipment',
  ),
  arrivalQueueWait: definition(
    'arrival',
    'Visible queue and wait pressure',
    '1 − queue length × 0.045.',
    1,
    'negative-only',
    'factor',
    0.24,
    1,
    'A visible queue can suppress arrivals but cannot create a bonus.',
    'engine.demandRate.queueWait',
  ),
  arrivalAvailability: definition(
    'arrival',
    'Menu availability and stock',
    '0.35 + 0.65 × available menu share.',
    1,
    'negative-only',
    'factor',
    0,
    1,
    'Unavailable recipes can suppress arrivals but cannot create a bonus.',
    'engine.demandRate.availability',
  ),
  arrivalRushEvent: definition(
    'arrival',
    'Rush-event demand',
    'Product of resolved event demand multipliers.',
    1,
    'bidirectional',
    'factor',
    0.75,
    1.45,
    'Only resolved event choices affect the active rush multiplier.',
    'engine.demandRate.rushEvent',
  ),
  orderSegmentPrice: definition(
    'order-choice',
    'Segment-specific drink price',
    '1.25 − (drink price − base price) / segment sensitivity.',
    1.25,
    'bidirectional',
    'price-slope',
    0.25,
    1.5,
    'Final drink price weight is clamped from 0.25 to 1.5.',
    'demandModel.baseDrinkChoiceWeight.segmentPrice',
  ),
  orderSegmentAppeal: definition(
    'order-choice',
    'Segment drink appeal',
    'Configured segment-by-drink appeal weight.',
    1,
    'positive-only',
    'factor',
    0.1,
    2.5,
    'Unconfigured drinks stay neutral; appeal cannot invent an aversion.',
    'demandModel.baseDrinkChoiceWeight.segmentAppeal',
  ),
  orderWeather: definition(
    'order-choice',
    'Weather drink preference',
    'Configured hot/cold drink weather multiplier.',
    1,
    'bidirectional',
    'factor',
    0.1,
    2.2,
    'Weather preference remains positive after difficulty amplification.',
    'demandModel.baseDrinkChoiceWeight.weather',
  ),
} as const satisfies Record<DemandInfluenceId, DemandInfluenceDefinition>;

export const DEMAND_INFLUENCE_IDS = Object.keys(DEMAND_INFLUENCES) as DemandInfluenceId[];

/** Apply the one authoritative difficulty policy to a baseline engine factor. */
export function applyDemandInfluence(
  difficulty: Difficulty,
  influenceId: DemandInfluenceId,
  baselineValue: number,
): number {
  const definition = DEMAND_INFLUENCES[influenceId];
  const domainValue = constrainToDomain(baselineValue, definition);
  const policy = DIFFICULTY_DEVIATION_MULTIPLIERS[difficulty];
  const multiplier = definition.application === 'price-slope' ? policy.price : policy.nonPrice;
  const adjusted = definition.neutral + (domainValue - definition.neutral) * multiplier;
  return clamp(adjusted, definition.clamp.minimum, definition.clamp.maximum);
}

function constrainToDomain(value: number, definition: DemandInfluenceDefinition): number {
  if (!Number.isFinite(value)) return definition.neutral;
  if (definition.domain === 'positive-only') return Math.max(definition.neutral, value);
  if (definition.domain === 'negative-only') return Math.min(definition.neutral, value);
  return value;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function definition(
  scope: DemandInfluenceDefinition['scope'],
  label: string,
  baseline: string,
  neutral: number,
  domain: DemandInfluenceDomain,
  application: DemandInfluenceApplication,
  minimum: number,
  maximum: number,
  boundary: string,
  engineSource: string,
): DemandInfluenceDefinition {
  return {
    scope,
    label,
    baseline,
    neutral,
    domain,
    application,
    clamp: { minimum, maximum },
    boundary,
    engineSource,
  };
}
