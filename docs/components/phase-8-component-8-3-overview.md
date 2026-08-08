# Component 8.3 — Fourth Venue and Three-Tier Commercial Equipment

## What was delivered

A user can now grow one schema-v4 Standard or Hard campaign from cart through
kiosk and cafe into the Merriweather Department Store Coffee Hall, buy a third
meaningful tier in every existing equipment category, operate the fourth venue
through the existing single-service contract, and win exactly on Day 40 when
the department venue, cash, and reputation targets are all met.

The new heritage hall keeps the existing ten-drink and nine-ingredient content
boundary. It raises venue demand, operating cost, menu, staff, and queue scale;
shows the complete owned commercial setup in WebGL; and preserves truthful
queue, sale, walkaway, stock, staff, weather, and activity snapshots. It does
not prebuild the Manager/Runner, station, or express-lane behavior owned by
Components 8.4 and 8.5.

## Public interfaces / contracts exposed

- `VenueId` now exhaustively includes `departmentStore`.
- `VENUE_IDS` is the canonical typed progression order:
  `cart`, `kiosk`, `cafe`, `departmentStore`. `VENUES`,
  `VENUE_MENU_CAPACITY`, `VENUE_STAFF_CAPACITY`, and
  `VENUE_DEMAND_FACTOR` cover all four venues.
- `VenueConfig.actionName` provides readable venue-specific planning actions.
  The department venue exposes ten menu slots, ten scheduled-team slots, a
  base queue of 24, demand factor `1.62`, and daily venue cost of 1,850 cents.
- `VENUE_PROMOTIONS` now includes cafe → department store with a 20,000-cent
  cost, reputation 70, and explicit core-equipment prerequisites.
- `EquipmentConfig.tiers` is an exact three-tier tuple. Every tier exposes
  purchase price, daily maintenance, reliability, required venue, readable
  effect, and typed `EquipmentTierEffects` consumed by the live engine.
- `equipmentTierAtLevel(equipmentId, level)` is the shared safe lookup for an
  installed tier. `venueMeetsRequirement(current, required)` compares venues
  through canonical progression order. `validateEquipmentContent(catalogue?)`
  rejects incomplete, out-of-order, non-positive, unreliable, unknown-venue,
  effect-free, or out-of-bound tier data.
- `CAMPAIGN_RULES.durationDays` is exactly `40`. Day-40 victory requires
  `departmentStore`, at least 30,000 cents, and at least 65 reputation.
  Bankruptcy still resolves first, target equality is valid, and victory may
  continue as Day-41 endless play.
- `DEMAND_INFLUENCES.arrivalVenue` admits the exact Hard department factor
  `2.0385`; `arrivalTeamEquipment` admits the current eight-person roster and
  commercial POS while Component 8.4 still owns the ten-person roster change.
- `venueLabel(venueId)` is the shared short-name selector.
- `VENUE_AMBIENCE_VOLUME` is exhaustive across all four venues.
- `VENUE_LAYOUTS.departmentStore` and `DepartmentStoreWorld` define a bounded
  `heritage-department-store-coffee-hall` presentation. `RenderSnapshot.service`
  now includes the engine-derived `queueCapacity`, and `ServiceWorld` exposes
  it as `data-queue-capacity` without creating a second gameplay authority.
- Save schema remains exactly v4. Persistence accepts the fourth venue and
  equipment levels 0–3, while rejecting unknown venues and level 4.

## Files owned

Created:

- `src/scene/three/venues/DepartmentStoreWorld.tsx`
- `tests/e2e/department-store.spec.ts`
- `docs/components/phase-8-component-8-3-overview.md`

Modified:

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/inventory.ts`
- `src/game/selectors.ts`, `src/game/demandInfluences.ts`, `src/game/index.ts`
- `src/game/meta.ts`, `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`, `src/audio/AudioDirector.tsx`
- `src/components/Planner.tsx`, `src/components/ReinvestPanel.tsx`
- `src/components/EndingPanel.tsx`, `src/components/GameTools.tsx`
- `src/components/OnboardingGuide.tsx`
- `src/scene/three/ServiceWorld.tsx`, `src/scene/three/renderSnapshot.ts`
- `src/scene/three/venues/venueLayout.ts`, `src/styles.css`
- `tests/unit/coffee-content.test.ts`, `tests/unit/operations.test.ts`
- `tests/unit/inventory.test.ts`, `tests/unit/demand.test.ts`
- `tests/unit/scene.test.ts`, `tests/unit/campaign.test.ts`
- `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/components/presentation.test.tsx`
- `tests/e2e/campaign-outcomes.spec.ts`
- `tests/e2e/operations.spec.ts`, `tests/e2e/save-transfer.spec.ts`
- `tests/e2e/service-layout.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/phase-8-component-breakdown.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`
- `docs/agent-team-state.md`

Owned and deliberately unchanged because their existing generic contracts
already support the new content:

- `src/game/capacity.ts`
- `src/components/GameHeader.tsx`

## How to run / verify

Focused content, economy, inventory, demand, campaign, persistence, scene, and
presentation proof:

```bash
pnpm exec vitest run tests/unit/coffee-content.test.ts tests/unit/operations.test.ts tests/unit/inventory.test.ts tests/unit/demand.test.ts tests/unit/campaign.test.ts tests/unit/persistence.test.ts tests/unit/scene.test.ts tests/components/game-loop.test.tsx tests/components/presentation.test.tsx
```

Focused real-browser progression, reload, commercial unlock, WebGL shell,
responsive screenshot, and Day-40 outcome proof:

```bash
pnpm exec playwright test tests/e2e/department-store.spec.ts tests/e2e/campaign-outcomes.spec.ts
```

Coordinator-audit proof for retained current-v4 progression, portable reports,
and canonical all-venue composition:

```bash
pnpm exec playwright test tests/e2e/operations.spec.ts tests/e2e/save-transfer.spec.ts tests/e2e/service-layout.spec.ts
```

The exact Tier 2 completion gate for the final scoped fingerprint is:

```bash
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts
```

## Integration notes & gotchas

- `VENUE_IDS` is the source of progression order. Future venue-exhaustive code
  must derive from it or use a `Record<VenueId, ...>` / exhaustive switch.
- Equipment consumers must read the installed tier's `effects`; do not restore
  `level === 1` / `level === 2` branches. Tier-three values are totals, not
  deltas from tier two.
- Refrigeration uses the shared batch-inventory authority. Tier three extends
  only surviving chilled batches by the configured total shelf-life delta; it
  cannot revive expired stock or alter ambient ingredients.
- The department venue declares ten staff slots for the approved progression,
  but the current global roster remains eight. Component 8.4 owns per-venue
  roster limits plus Manager and Runner roles.
- The scene is presentation-only and reads one detached snapshot. Its single
  grand counter and queue markers do not imply stations, express priority, or
  concurrent settlement; Component 8.5 owns those engine contracts.
- Department base queue 24 plus service-counter tier three bonus 8 produces the
  observable capacity 32. The layout still renders a bounded 12 customer
  anchors plus overflow truth rather than one mesh per unbounded arrival.
- The demand registry remains the sole difficulty authority. Venue and
  team/equipment clamp/source changes retain direct Standard and Hard proofs.
- Campaign save schema remains v4; this component extends current v4 content
  validation and deliberately introduces no new reset or migration.
- Browser evidence uses desktop Chromium and exact 360×780 touch emulation.
  No physical device, hosted build, deployment, or publication result is
  claimed.
- The approved title art remains byte-identical at SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion | Runtime behavior and source | Proof |
| --- | --- | --- |
| All four venues persist, import/export, render, report, promote, and validate exhaustively | Typed `VenueId`/`VENUE_IDS`; complete venue/config/promotion maps; v4 persistence validation; shared labels/actions/audio; exhaustive scene dispatch | Content, operations, persistence, scene, component matrix, full promotion, Day-40 save-transfer, and canonical all-venue production-browser tests |
| Department store adds larger truthful operating scale without new menu content | Ten-drink menu cap, ten scheduled slots, queue 24, demand 1.62, venue cost 1,850, cafe promotion gate, heritage WebGL hall | Catalogue identity assertions prove exactly ten drinks/nine ingredients; operational and browser assertions prove venue values and queue 32 with counter tier three |
| Every existing equipment category has three meaningful tiers | Six exact tier tuples with validated cost, maintenance, reliability, venue, text, and typed quality/throughput/demand/queue/shelf-life effects | Invalid-catalogue matrix plus exact engine/inventory/economy effects and all-six Level 3/3 browser progression |
| Refrigeration tier three conserves inventory and respects expiry | Batch extension reads configured `chilledShelfLifeDays`; only live chilled batches receive the difference | Focused surviving/expired/ambient, conservation, consumption, and waste-boundary tests |
| Standard and Hard can reach a valid forty-day win | Day-40 close requires department/cash/reputation; bankruptcy precedes target evaluation; endless continuation increments to Day 41 | Seeded full Standard and Hard simulations, Day 39/40 equality/miss/legacy-venue/bankruptcy/endless unit matrix, desktop/touch outcome E2E |
| Demand bounds and sources remain truthful | Registry venue and team/equipment entries name exact engine sources and admit department/POS deviations without clipping | Direct baseline, Hard deviation, sign, clamp, source-string, and department-over-cafe assertions |
| Department WebGL is truthful and snapshot-only | One heritage hall, one service counter/queue, bounded layout, engine-derived queue capacity, owned equipment/stock/staff/activity cues | Static no-station/no-express source checks, immutable snapshot tests, exhaustive dispatch attributes, desktop/touch screenshot E2E |
| No food, drink, ingredient, schema, or later workforce/service feature leaks in | Existing drink/ingredient identities retained; schema stays v4; staff roles remain barista/front-of-house; no station/express contract exists | Compile-time unions, catalogue/persistence tests, static scene assertions, and scoped diff audit |

## Assurance lane

`fast (lean override)`, Tier 2, with Implement owning targeted validation,
self-review, correction, and the one component gate; the Lead Coordinator owns
the serialized commit after independently checking scope and evidence.

Recorded standard Test triggers: WebGL and responsive UI behavior, browser
promotion/reload persistence, cross-component engine/inventory/demand/campaign
round trips, deterministic 40-day balance, and regression-prone observable
progression. Recorded standard Review triggers: shared core engine/content/
persistence contracts, expanded public unions and data schemas, scene snapshot
contract, and broad runtime/test scope. The user-approved lean TBA + Implement
override retains those reasons while routing the gate through this Implement
engagement.

## Deviations and decisions

- No approved product behavior was descoped and Component 8.3 was delivered as
  one complete vertical slice.
- The Lead Coordinator approved bounded ownership clarification for
  `src/game/inventory.ts`, `tests/unit/inventory.test.ts`,
  `src/scene/three/venues/venueLayout.ts`, `tests/unit/scene.test.ts`,
  `tests/components/presentation.test.tsx`, and the component breakdown. Those
  paths are required to prove the specified tier-three shelf life and fourth
  exhaustive scene layout; no unrelated ownership expanded.
- The coordinator's completion audit found retained current-v4 assumptions in
  `operations.spec.ts`, `save-transfer.spec.ts`, and `service-layout.spec.ts`.
  A second bounded ownership clarification added exactly those paths. Their
  contracts now prove full department promotion, Day-40 department transfer,
  and canonical four-venue planning/service/mobile composition without
  weakening legacy report, storage, or layout assertions. The earlier
  `9a77dd9d…10cdae74` fingerprint and Tier 2 evidence were invalidated and not
  reused.
- An exhaustive current-v4 E2E source scan found no other genuine `/30`, Day
  30/31, cafe-final, or hard-coded all-three-venue assumption. The specifically
  scoped kiosk/cafe WebGL recovery journey and legacy-schema fixture evidence
  remain intentionally unchanged.
- The current eight-person roster remains intentional. Raising it here would
  leak Component 8.4's per-venue roster, Manager, and Runner contracts into the
  wrong slice.
- One grand counter and one queue are intentional. Parallel stations and the
  express lane remain Component 8.5 so the visual shell cannot overstate
  current simulation authority.
- Existing pinned R3F/Three/Vite capabilities remain current and no dependency
  changed. Technical Validation therefore used startup content validation,
  strict compilation, production build, deterministic simulations, and real
  Chromium composition rather than a new external capability spike.
- The existing production chunk warning remains non-blocking: the isolated
  `three-webgl` file is 724.51 kB and below the one-megabyte Workbox limit.
- Implement performed no Git mutation, device access, merge, deploy, or
  publication. The Lead Coordinator independently reproduced the repaired
  fingerprint and 128-test focused gate, then audited, staged, and committed
  the exact candidate.

## Validation evidence

The coordinator audit invalidated the earlier `9a77dd9d…10cdae74` candidate.
Its completion gate was not reused. Targeted proof on the repaired final
source/test state:

- `pnpm exec vitest run tests/unit/coffee-content.test.ts tests/unit/operations.test.ts tests/unit/inventory.test.ts tests/unit/demand.test.ts tests/unit/campaign.test.ts tests/unit/persistence.test.ts tests/unit/scene.test.ts tests/components/game-loop.test.tsx tests/components/presentation.test.tsx`
  exited 0 in 5.03s: 9 files and 128 tests passed.
- `pnpm exec playwright test tests/e2e/department-store.spec.ts tests/e2e/campaign-outcomes.spec.ts`
  exited 0 in 9.1s: 6 tests passed across desktop Chromium and exact 360×780
  touch-mobile.
- Both generated department-service screenshots were visually inspected. The
  heritage hall is distinct and readable; the mobile scene plus complete rush
  dashboard fit above the 780px fold, with activity and stock following below.
- `pnpm exec playwright test tests/e2e/operations.spec.ts tests/e2e/save-transfer.spec.ts tests/e2e/service-layout.spec.ts`
  exited 0 in 30.7s: all 18 retained current-v4 cases passed across desktop
  Chromium and exact 360×780 touch-mobile. The audit source scan then found no
  remaining genuine 30-day, cafe-final, or all-three-venue E2E contract.

Final candidate identity:

```bash
python3 scripts/worktree-fingerprint.py -- src/game/types.ts src/game/engine.ts src/game/inventory.ts src/game/selectors.ts src/game/demandInfluences.ts src/game/index.ts src/game/capacity.ts src/game/meta.ts src/content/gameContent.ts src/persistence/saveStore.ts src/audio/AudioDirector.tsx src/components/Planner.tsx src/components/ReinvestPanel.tsx src/components/EndingPanel.tsx src/components/GameHeader.tsx src/components/GameTools.tsx src/components/OnboardingGuide.tsx src/scene/three/ServiceWorld.tsx src/scene/three/renderSnapshot.ts src/scene/three/venues/DepartmentStoreWorld.tsx src/scene/three/venues/venueLayout.ts src/styles.css tests/unit/coffee-content.test.ts tests/unit/operations.test.ts tests/unit/inventory.test.ts tests/unit/demand.test.ts tests/unit/scene.test.ts tests/unit/campaign.test.ts tests/unit/persistence.test.ts tests/components/game-loop.test.tsx tests/components/presentation.test.tsx tests/e2e/department-store.spec.ts tests/e2e/campaign-outcomes.spec.ts tests/e2e/operations.spec.ts tests/e2e/save-transfer.spec.ts tests/e2e/service-layout.spec.ts tests/fixtures/campaignFixtures.ts docs/phase-8-component-breakdown.md docs/components/phase-8-component-8-3-overview.md docs/implementation-context-phase-8.md docs/phase-progress.json docs/agent-team-state.md
```

The command exited 0 before the gate and the post-gate integrity bundle exited
0 with the same fingerprint:
`3f9f94858ea0aef70bb5e83243a854ea1837efaded2d5aecda9e91e408253067`.
The explicit scope covers every Component 8.3-owned source, test, fixture, and
documentation path, including declared unchanged files and the approved
ownership clarifications plus retained current-v4 operations, transfer, and
service-layout tests. The fingerprint tool intentionally excludes the overview,
phase-progress, and team-state evidence payloads.

Final Tier 2 gate, run exactly once for that unchanged fingerprint:

- `pnpm build` exited 0 in 3.84s. Strict TypeScript and production Vite/PWA
  build passed; 19 entries / 1,745.14 KiB were precached and the largest file
  remained the 724.51 kB isolated Three.js chunk.
- `pnpm lint` exited 0 in 7.82s. ESLint reported zero warnings and Prettier
  check passed.
- `pnpm test` exited 0 in 6.32s: 16 files and 168 tests passed.
- `pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts`
  exited 0 in 35.2s: 4 applicable tests passed and 2 intentional
  project-routing cases skipped across desktop Chromium and touch-mobile.

Component gate: **PASS**.

## Manual tests automated

- The full cart → kiosk → cafe → department promotion path, every commercial
  purchase, autosave reload, all-ten-drink planning, service open, venue/world/
  queue/equipment/snapshot attributes, and screenshots run through the
  production browser adapter in both Playwright projects.
- Day-40 victory/miss and Day-41 endless continuation run through production
  UI and deterministic engine paths in both Standard and Hard.
- Retained operations now proves cafe is not final and the department is;
  portable save transfer restores exact Day-40 department/report detail; and
  scene-free planning plus service/mobile composition iterate canonical
  `VENUE_IDS` across all four venues.
- Catalogue corruption, persistence forgery, inventory expiry, demand clamps,
  scene bounds, and single-queue source constraints are automated regressions.
- Screenshot inspection replaced no assertion and claims browser-emulated
  presentation only, not physical mobile/GPU performance.

## Human tasks

None. Component 8.3 requires no account, credential, secret, external service,
physical device, merge, deployment, or publication action.
