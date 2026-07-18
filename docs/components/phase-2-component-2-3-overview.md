# Component 2.3 — Staff, Equipment, and Venue Growth

## What was delivered

A user can now hire from a deterministic daily candidate pool, schedule
barista/front-of-house staff, pay wages, upgrade six equipment families, and
promote one persistent business from cart to kiosk to cafe, with every choice
changing the next service day, report, capacity, cost, and visible scene.

## Public interfaces / contracts exposed

- `StaffMember`, `EquipmentState`, `EquipmentConfig`, `VenueConfig`, and
  `VenuePromotion` are serialisable public contracts in `src/game/types.ts`.
- Engine commands add `hireStaff`, `buyEquipment`, and `promoteVenue`; daily
  scheduling continues through `prepareDay({ scheduledStaffIds })`.
- `candidatePoolForDay(seed, day)` is the deterministic four-candidate source.
- `operationalEffects`, `equipmentPreparationMultiplier`, and
  `serviceQueueCapacity` expose the exact calculations used by live service.
- `src/content/gameContent.ts` is the canonical catalogue for role/trait copy,
  six two-tier equipment families, three venue stages, and promotion rules.

## Files owned

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/index.ts`
- `src/content/gameContent.ts`
- `src/components/Planner.tsx`, `src/components/TeamPlanner.tsx`
- `src/components/ReinvestPanel.tsx`, `src/components/ReportPanel.tsx`
- `src/components/GameHeader.tsx`, `src/App.tsx`
- `src/scene/CanvasScene.tsx`, `src/styles.css`
- `tests/unit/operations.test.ts`, `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`, `tests/e2e/operations.spec.ts`

## How to run / verify

Run the profile validation sequence. Component 2.3 passes 42 Vitest tests and
eight Playwright project tests across desktop Chromium and 360px touch-mobile.
To exercise it manually, start a campaign, open the Team planner tab, hire and
schedule staff, trade and settle the day, then use Equipment Workshop and the
promotion card.

## Integration notes & gotchas

- Candidates derive from campaign seed and day without consuming rush PRNG, so
  opening the management panel cannot change simulation outcomes.
- Only scheduled staff incur wages or apply effects; the owner remains the
  baseline automatic worker.
- Equipment is sequential within each family and venue-gated. Promotion is
  atomic and requires cash, reputation, and configured equipment levels.
- Venue, staff, schedule, candidates, and equipment already round-trip through
  the existing save envelope. Component 2.4 upgrades and hardens that envelope.
- Operating costs snapshot when the rush opens, preventing later UI state from
  changing an in-progress day's settlement.
