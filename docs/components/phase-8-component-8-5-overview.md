# Component 8.5 — Three Stations, Express Lane, and Parallel Service Truth

## What was delivered

A department-store player can now assign every scheduled team member to one
role-compatible espresso, brew, or cold station, select zero through three
eligible menu drinks for express service, and run three deterministic jobs in
parallel against one shared inventory. Normal customers cannot be starved,
ingredients are consumed once when a canonical job starts, and every completed
job settles into one station/lane activity and report bucket. Cart, kiosk, and
cafe continue through the same generalized engine as one espresso station with
one normal lane.

## Public interfaces / contracts exposed

- `StationId`, `LaneId`, `ServiceJob`, and `ServiceAggregate` are stable shared
  contracts across planning, simulation, persistence, semantic UI, reporting,
  and later render work.
- `STATION_IDS` and `LANE_IDS` define the only deterministic traversal order.
  `serviceConfigFor(venueId)` defines active topology without venue branches in
  consumers.
- `STATION_DETAILS`, `STATION_EQUIPMENT_IDS`,
  `STAFF_STATION_COMPATIBILITY`, `stationForDrink`,
  `staffStationCompatible`, and `stationReadyForService` own department
  configuration and readiness.
- `expressDrinkEligible`, `expressEligibleDrinkIds`, and `laneForDrink` own the
  zero-to-three morning express contract. A drink routes express only when the
  current menu selection, complete recipe timing, required station equipment,
  and venue all qualify; otherwise it remains normal demand.
- `DayPlan.stationAssignments` is a complete canonical station record and
  `DayPlan.expressDrinkIds` is a unique bounded list. Every scheduled staff ID
  appears exactly once, and no unscheduled, duplicate, inactive-station, or
  role-incompatible assignment is accepted.
- `RushState.normalQueue`, `expressQueue`, `serviceJobsByStation`,
  `consecutiveExpressStartsByStation`, and `nextServiceJobSequence` replace the
  removed singular queue/service authorities. `waitingCustomers` and
  `activeServiceJobs` provide fixed-order compatibility projections.
- `consumeIngredientsAtServiceStart` is the irrevocable stock-ownership
  boundary. Starting stations in `STATION_IDS` order makes shared-stock
  contention deterministic; completion never consumes again, and unfinished
  rush-end jobs retain their consumed cost while producing no sale.
- Each service activity contains station, lane, and nullable/canonical job
  identity. Each rush/report contains six ordered station/lane aggregates with
  rush-start staff/equipment metadata only for active topology and globally
  unique completed job IDs. Inactive legacy station/lane buckets stay empty.
- `serviceFlowSummary` exposes normal, express, combined waiting, and active-job
  totals for semantic UI without applying gameplay rules in presentation.
- Current schema-v4 saves that predate Component 8.5 are canonicalized
  idempotently before strict read, write, recovery, or import. Removed
  `queue`/`activeService` fields never remain authoritative. Historical totals
  with no route evidence are represented honestly in espresso/normal buckets
  with empty historical coverage metadata.
- Active rush/event imports conserve every ingredient against opening,
  purchases, and consumed totals. Saves with canonical charge groups also
  derive exact completed-plus-active consumption and ingredient cost, rejecting
  coherent inventory/stat forgeries; optional pre-charge-capture v4 rushes keep
  aggregate conservation because truncated history cannot prove old recipes.
- Strict active rush/event imports reconcile each inventory total to opening
  stock plus purchased stock minus canonical consumed totals. Current-day
  customer identities begin at `c1`, while canonical service-job identities
  intentionally begin at `j0`.

## Files owned

Created:

- `src/game/serviceStations.ts`
- `tests/e2e/parallel-service.spec.ts`
- `docs/components/phase-8-component-8-5-overview.md`

Modified:

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/inventory.ts`
- `src/game/selectors.ts`, `src/game/index.ts`, `src/game/demandInfluences.ts`
- `src/content/gameContent.ts`, `src/persistence/saveStore.ts`
- `src/components/Planner.tsx`, `src/components/TeamPlanner.tsx`
- `src/components/RushPanel.tsx`, `src/components/ReportPanel.tsx`
- `src/accessibility/GameAnnouncer.tsx`, `src/styles.css`
- `tests/unit/engine.test.ts`, `tests/unit/operations.test.ts`
- `tests/unit/demand.test.ts`, `tests/unit/inventory.test.ts`
- `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`,
  `tests/components/accessibility.test.tsx`
- `tests/e2e/department-store.spec.ts`, `tests/fixtures/campaignFixtures.ts`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

Coordinator-approved compatibility ownership:

- `src/scene/sceneModel.ts`, `src/scene/three/renderSnapshot.ts`
- `tests/unit/scene.test.ts`, `tests/e2e/webgl-service.spec.ts`
- `tests/unit/campaign.test.ts`

The scene adapters deliberately project combined queues and the first
fixed-order active job into the existing single-customer visual contract.
Component 8.6 owns dense multi-customer station rendering.

## How to run / verify

Focused deterministic and semantic proof:

```bash
pnpm exec vitest run tests/unit/engine.test.ts tests/unit/operations.test.ts tests/unit/demand.test.ts tests/unit/inventory.test.ts tests/unit/persistence.test.ts tests/unit/scene.test.ts tests/unit/campaign.test.ts tests/components/game-loop.test.tsx tests/components/accessibility.test.tsx
```

Focused desktop/touch parallel-service proof:

```bash
pnpm exec playwright test tests/e2e/parallel-service.spec.ts
```

Retained department/WebGL compatibility proof:

```bash
pnpm exec playwright test tests/e2e/department-store.spec.ts tests/e2e/webgl-service.spec.ts
```

The final Tier 2 gate uses the profile build, lint, and complete Vitest commands
plus exact desktop/touch service, retained cart/accessibility, persistence,
responsive-layout, and WebGL browser paths.

## Integration notes & gotchas

- Never derive a second queue, active-service, station, lane, or settlement
  authority in UI or rendering. Read the canonical rush fields and helper
  projections.
- An express selection is a route, not new demand. Ineligible or unselected
  drinks remain in the normal lane. Fairness permits at most two express starts
  at a station while compatible normal work is already waiting; express-only
  work does not accumulate a false fairness debt.
- Each station is single-server. Stations progress and complete in fixed
  `STATION_IDS` order, then newly available jobs start in that same order.
  Random draws, Promises, wall-clock timing, render frames, and object key order
  never select service work.
- Shared stock is removed atomically at job start. This is intentionally
  consumption rather than a releasable reservation ledger: reload cannot
  consume twice, and a job abandoned only because the rush ended keeps its
  already-incurred ingredients and cost.
- `serviceAggregatesForPlan` captures staffing and installed station equipment
  at rush start. Planning and equipment commands cannot run during a rush, so
  strict import can validate active aggregate metadata against the immutable
  plan/equipment snapshot. It leaves metadata empty unless both the bucket's
  station and lane are active at that venue.
- Combined normal/express waiting counts feed the existing queue/wait demand
  influence once. Shared inventory after exact-once job starts feeds the
  availability influence once. Active jobs are not counted as waiting.
- The current-v4 canonicalizer is not a second schema reset. It upgrades valid
  pre-8.5 v4 runtime shapes in place and rewrites browser storage; v1–v3 still
  follow Component 8.2's preferences-only reset boundary.
- Active rush/event conservation is validated before expiry: importing a save
  with stock or consumed totals altered independently fails closed. Report and
  reinvest states use their existing post-rush lifecycle reconciliation because
  perishable expiry has already run.
- The live service DOM order is scene, dashboard, activity, stock. At the
  representative 360×780 touch viewport, the scaled scene and complete compact
  dashboard fit before the first scroll. Semantic activity and stock retain
  their full content below.
- Automated Chromium/touch-mobile evidence is not physical-device evidence. No
  device, hosted release, deployment, or publication was used or claimed.
- Title art remains SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion                                                                                                          | Runtime behavior and source                                                                                                                                            | Proof                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning accepts valid assignments and 0–3 eligible express drinks and rejects invalid boundaries accessibly                  | Complete `DayPlan` contracts, engine/save validation, role compatibility and eligibility helpers, atomic Team planner selects, menu reasons and disabled fourth choice | Engine adversarial boundaries; persistence forgery/migration tests; component and desktop/touch planner journeys                                   |
| Three stations run simultaneous jobs against shared stock deterministically                                                   | Fixed station order, per-station jobs/readiness/effects, one combined inventory and service-start consumption boundary                                                 | Insufficient shared-stock winner test; three-start and same-tick three-completion tests; browser station strip with three canonical jobs           |
| Every customer/order/job/unit/revenue/report entry settles once across speed, pause, reload, event, abandonment, and rush end | Canonical IDs/counters, exact-once start/completion functions, bounded activities/aggregates, rush-end active-job handling, strict import reconciliation               | 1×/2×/4× equality; pause and mid-job exact reload; event campaign runs; patience/stockout/queue-full/rush-end tests; inventory/report conservation |
| Express does not starve normal and normal demand never disappears                                                             | Per-station two-start fairness counter counts only while normal work waits; routing defaults to normal                                                                 | Three-express-plus-normal order test, express-only fairness reset test, eligibility/routing tests                                                  |
| Canonical activity/report data identifies station and lane before rendering                                                   | Every customer/activity/job carries route; six ordered report buckets contain unique job identities and causal coverage metadata                                       | Activity order assertions, aggregate reconciliation/forgery tests, semantic service/report component tests, compatibility snapshot tests           |
| Legacy venues and current-v4 saves preserve supported behavior                                                                | One-station/normal-lane topology for cart/kiosk/cafe; idempotent pre-8.5 v4 canonicalizer and storage rewrite                                                          | Full seeded campaign tests, retained cart/department/WebGL journeys, pre-8.5 rush/report migration and exact reload tests                          |
| Service hierarchy and compact mobile truth match the approved UX                                                              | Existing service flow now renders dashboard immediately after the scene, then activity and stock; mobile CSS compacts both visible regions                             | DOM-order assertion and 360×780 dashboard-bottom viewport assertion in both browser projects                                                       |

## Assurance lane

`fast (lean override)`, Tier 2. Recorded standard Test triggers: concurrent UI
behavior, responsive desktop/touch layout, current-v4 persistence migration and
reload, cross-component engine/inventory/report round trips, WebGL snapshot
compatibility, deterministic speed/pause/event behavior, and regression-prone
economic settlement. Recorded standard Review triggers: shared core engine,
types, content, persistence, demand, public station/lane/job/report contracts,
removed authorities, and broad runtime/test scope. The approved lean override
assigns targeted checks, self-review, correction, and Tier 2 to Implement; the
Lead Coordinator owns the serialized commit.

## Deviations and decisions

- No required behavior was descoped; Component 8.5 was delivered as one
  vertical slice.
- The approved stock-ownership implementation consumes ingredients
  irrevocably at deterministic service start instead of maintaining a separate
  reservation/release ledger. This preserves conservation and exact reload,
  and unfinished rush-end jobs retain their already-consumed ingredient cost
  without any customer charge, revenue, or sale.
- The Lead Coordinator approved narrow compatibility ownership for the current
  single-customer scene snapshots, their unit/WebGL consumers, and the campaign
  simulation's newly required valid station assignments. No Component 8.6
  multi-customer visual work was started.
- Coordinator pre-freeze audits produced bounded repairs for active-rush
  conservation, active-menu truth, inactive-lane metadata, accepted-array
  immutability, and the Department Store's no-staff planner copy. Each repair
  has focused proof and none introduces a second authority or Component 8.6
  visual work.
- Existing library/platform assumptions remained current and no dependency or
  external capability changed. Technical validation used strict compilation,
  deterministic concurrency/import tests, and local Chromium.
- The first sandboxed Playwright attempt failed before test execution because
  macOS denied Chromium's IPC endpoint. The project-profile fallback outside
  the sandbox executed the browser cases normally.
- Implement performed no Git mutation, physical-device access, merge,
  deployment, or publication.

## Validation evidence

Targeted evidence before final candidate freeze:

- The final pre-freeze strict TypeScript plus complete Vitest diagnostic passed
  all 16 files / 199 tests in 10.63s. The last conservation/topology repair's
  focused engine and persistence run passed 55/55.
- `pnpm exec playwright test tests/e2e/parallel-service.spec.ts` passed 4/4
  desktop/touch cases in 6.6s. The retained department, WebGL, cart-day, and
  accessibility diagnostic passed 16 cases with two intentional project skips.
- Scoped ESLint, Prettier, and `git diff --check` diagnostics passed before
  candidate freeze.

Final scoped candidate identity:

```bash
python3 scripts/worktree-fingerprint.py -- src/game/types.ts src/game/engine.ts src/game/inventory.ts src/game/serviceStations.ts src/game/selectors.ts src/game/index.ts src/game/demandInfluences.ts src/game/capacity.ts src/content/gameContent.ts src/persistence/saveStore.ts src/components/Planner.tsx src/components/TeamPlanner.tsx src/components/RushPanel.tsx src/components/ReportPanel.tsx src/accessibility/GameAnnouncer.tsx src/styles.css src/scene/sceneModel.ts src/scene/three/renderSnapshot.ts tests/unit/engine.test.ts tests/unit/operations.test.ts tests/unit/demand.test.ts tests/unit/inventory.test.ts tests/unit/persistence.test.ts tests/unit/scene.test.ts tests/unit/campaign.test.ts tests/components/game-loop.test.tsx tests/components/accessibility.test.tsx tests/e2e/parallel-service.spec.ts tests/e2e/department-store.spec.ts tests/e2e/webgl-service.spec.ts tests/fixtures/campaignFixtures.ts docs/phase-8-component-breakdown.md docs/components/phase-8-component-8-5-overview.md docs/implementation-context-phase-8.md docs/phase-progress.json
```

The command exited 0 before the gate and again afterward with the identical
fingerprint
`c425989a24deb4a783b0cbfd7237356e1f213325e71c1181a05dca02a533ebe9`.
The explicit scope includes every declared source/test/configuration path,
unchanged capacity/spec contracts, approved scene/browser/campaign
compatibility paths, the shared fixture, and component evidence paths. The
fingerprint tool intentionally excludes the overview and phase-progress
payloads.

The final Tier 2 gate for that unchanged candidate passed:

- `pnpm build` exited 0 in 3.91s. Strict TypeScript and the production Vite/PWA
  build passed; 19 entries / 1,782.13 KiB were precached and the largest emitted
  file remained the isolated 724.51 kB Three.js chunk below the one-megabyte
  Workbox limit.
- `pnpm lint` exited 0 in 8.32s. ESLint reported zero warnings and Prettier
  reported that every checked source/test/configuration file matched.
- `pnpm test` exited 0 in 7.64s. All 16 Vitest files and 199 unit/component
  tests passed.
- `pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/department-store.spec.ts tests/e2e/parallel-service.spec.ts tests/e2e/webgl-service.spec.ts`
  exited 0 through the profiled macOS Chromium fallback in 46.7s. Twenty
  desktop/touch cases passed, none failed or timed out, and the two
  opposite-input cases were intentionally skipped by existing project guards.

All earlier candidate fingerprints, including `510828…`, were invalidated
before this gate by coordinator-requested source/test repairs and are not
completion evidence. No executable scoped path changed after `c425989a…` was
recorded.

Post-gate `git diff --check` passed and the title-art SHA-256 remained exactly
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.
No raw failure log is required: the formatting issue was fully reported by the
bounded command output, and every command for the final fingerprint exited
successfully. The Git index remained empty throughout Implement's handoff.
