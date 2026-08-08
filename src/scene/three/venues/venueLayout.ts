import type { VenueId } from '../../../game';

export const MAX_WORLD_VISIBLE_CUSTOMERS = 12;
export const MAX_WORLD_VISIBLE_STAFF = 10;
export const MAX_WORLD_LIGHTS = 2;
export const MAX_WORLD_SHADOW_LIGHTS = 1;

export type WorldPoint = readonly [x: number, y: number, z: number];

export interface VenueLayout {
  readonly venueId: VenueId;
  readonly worldName: string;
  readonly floor: Readonly<{ width: number; depth: number }>;
  readonly activeCustomerAnchor: WorldPoint;
  readonly ownerAnchor: WorldPoint;
  readonly staffAnchors: readonly WorldPoint[];
  readonly queueAnchors: readonly WorldPoint[];
  readonly overflowAnchor: WorldPoint;
  readonly serviceAnchor: WorldPoint;
  readonly activityAnchor: WorldPoint;
  readonly stockAnchor: WorldPoint;
  readonly performance: Readonly<{
    maxVisibleCustomers: number;
    maxVisibleStaff: number;
    maxRepeatedFurnishings: number;
    lightCount: number;
    shadowLightCount: number;
  }>;
}

const CART_QUEUE = Array.from({ length: MAX_WORLD_VISIBLE_CUSTOMERS }, (_, index) =>
  point(2.7 + Math.min(index, 5) * 0.72, 0, 2.35 + Math.floor(index / 6) * 0.78),
);
const KIOSK_QUEUE = Array.from({ length: MAX_WORLD_VISIBLE_CUSTOMERS }, (_, index) =>
  point(2.15 + Math.min(index, 4) * 0.76, 0, 2.05 + Math.floor(index / 5) * 0.76),
);
const CAFE_QUEUE = Array.from({ length: MAX_WORLD_VISIBLE_CUSTOMERS }, (_, index) => {
  const row = Math.floor(index / 4);
  const column = index % 4;
  const serpentineColumn = row % 2 === 0 ? column : 3 - column;
  return point(1.45 + serpentineColumn * 0.82, 0, 1.85 + row * 0.78);
});

/** Complete presentation-only placement registry for every Phase 7 venue. */
export const VENUE_LAYOUTS: Readonly<Record<VenueId, VenueLayout>> = deepFreeze({
  cart: {
    venueId: 'cart',
    worldName: 'laneway-cart',
    floor: { width: 18, depth: 12 },
    activeCustomerAnchor: point(1.85, 0, 0.72),
    ownerAnchor: point(0.42, 0, -0.4),
    staffAnchors: staffLine(-1.05, -0.25, 0.72, 0.5),
    queueAnchors: CART_QUEUE,
    overflowAnchor: point(6.75, 0, 3.2),
    serviceAnchor: point(1.32, 1.95, 0.25),
    activityAnchor: point(6.1, 0, 1.1),
    stockAnchor: point(-2.15, 0.3, -0.25),
    performance: performanceBudget(32),
  },
  kiosk: {
    venueId: 'kiosk',
    worldName: 'sheltered-coffee-kiosk',
    floor: { width: 18, depth: 12 },
    activeCustomerAnchor: point(1.35, 0, 0.78),
    ownerAnchor: point(0.35, 0, -0.5),
    staffAnchors: staffLine(-1.85, -0.45, 0.78, 0.54),
    queueAnchors: KIOSK_QUEUE,
    overflowAnchor: point(5.65, 0, 3.55),
    serviceAnchor: point(1.05, 1.55, 0.08),
    activityAnchor: point(6.05, 0, 0.8),
    stockAnchor: point(-3.2, 0.2, -1.1),
    performance: performanceBudget(28),
  },
  cafe: {
    venueId: 'cafe',
    worldName: 'laneway-specialty-cafe',
    floor: { width: 18, depth: 13 },
    activeCustomerAnchor: point(1.25, 0, 0.72),
    ownerAnchor: point(0.3, 0, -0.52),
    staffAnchors: staffLine(-2.55, -0.5, 0.88, 0.48),
    queueAnchors: CAFE_QUEUE,
    overflowAnchor: point(4.55, 0, 3.65),
    serviceAnchor: point(1.0, 1.52, 0.04),
    activityAnchor: point(6.0, 0, 0.55),
    stockAnchor: point(-3.65, 0.2, -1.25),
    performance: performanceBudget(32),
  },
} satisfies Record<VenueId, VenueLayout>);

/** Return the immutable placement and rendering budget for one venue. */
export function venueLayoutFor(venueId: VenueId): VenueLayout {
  return VENUE_LAYOUTS[venueId];
}

function point(x: number, y: number, z: number): WorldPoint {
  return [x, y, z];
}

function staffLine(startX: number, startZ: number, xStep: number, zStep: number): WorldPoint[] {
  return Array.from({ length: MAX_WORLD_VISIBLE_STAFF }, (_, index) =>
    point(startX + (index % 5) * xStep, 0, startZ - Math.floor(index / 5) * zStep),
  );
}

function performanceBudget(maxRepeatedFurnishings: number): VenueLayout['performance'] {
  return {
    maxVisibleCustomers: MAX_WORLD_VISIBLE_CUSTOMERS,
    maxVisibleStaff: MAX_WORLD_VISIBLE_STAFF,
    maxRepeatedFurnishings,
    lightCount: MAX_WORLD_LIGHTS,
    shadowLightCount: MAX_WORLD_SHADOW_LIGHTS,
  };
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
