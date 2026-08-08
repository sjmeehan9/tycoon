# Laneway Tycoon Agent Runbook

## Prerequisites

- Node.js 22.12 or newer
- pnpm 10
- No account, secret, backend, or environment file

Install the pinned dependencies:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

The browser-install command is a one-time local machine setup.

## Run the game

```bash
pnpm dev
```

Open the URL printed by Vite. A campaign is stored entirely in browser local
storage. Use **Game menu → Save transfer** to export/import a campaign, restore
a last-known-good save, or start clean while retaining settings and unlocks.

To exercise the production bundle:

```bash
pnpm build
pnpm preview
```

## Validate

Run these commands exactly and in order:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

Playwright launches desktop Chromium and a 360px touch-mobile Chromium project.
On macOS automation hosts, the browser process may require permission to launch
outside a restricted process sandbox.

## Deterministic engine

- One engine tick is 250ms of simulated time; a rush is 300 ticks.
- A saved game contains the PRNG state, normal/express queues, canonical service
  jobs by station, event, and tick.
- Display speed changes how often the controller dispatches a tick, not the
  calculation performed by a tick.
- Tests and other consumers import public contracts from `src/game/index.ts`.
- Campaign creation locks `standard` or `hard` difficulty independently from
  scenario. `demandInfluences.ts` is the sole difficulty-policy authority:
  Standard applies 1.225 to both price-response slopes only, while Hard applies
  1.70 directly to every registered baseline deviation without compounding.
- The campaign closes on Day 40. Victory requires the department-store hall,
  $350 cash, and 65 reputation; bankruptcy is checked after settlement only
  below −$100.
- Balance maintenance belongs in `tests/unit/campaign.test.ts`: keep at least
  two complete viable strategies and one complete bankruptcy path using public
  commands. Never introduce seed- or test-specific production logic.
- `tests/fixtures/campaignFixtures.ts` contains validated near-outcome and
  growth snapshots for production import UI journeys. If the schema or balance
  changes, update these fixtures and their full-campaign proof together.

## Department workforce and parallel service

- `VENUE_WORKFORCE_CAPACITY` is the sole roster/schedule authority: cart,
  kiosk, and cafe retain schedules of two, three, and five; the department
  roster holds twelve and schedules at most ten.
- `STAFF_ROLES` is exhaustive across Barista, Front of house, Manager, and
  Runner. Manager/Runner are department-only; their bounded workload reductions
  are applied exactly once by the engine and never by animation.
- `STATION_IDS` fixes service order as espresso, brew, then cold;
  `LANE_IDS` fixes normal before express. Department plans assign every
  scheduled person exactly once and select zero to three unique eligible
  express drinks.
- Ingredients are consumed irrevocably when a canonical job starts. Completion
  must never consume them again. Fixed station order, persisted job IDs, and
  report aggregates protect exact-once stock, cash, satisfaction, activity, and
  settlement across pause, speed, reload, and rush end.
- Cart, kiosk, and cafe use the same generalized contracts with one espresso
  station and one normal lane. Do not reintroduce singular `queue` or
  `activeService` authorities.
- Run `tests/unit/engine.test.ts`, `tests/unit/operations.test.ts`,
  `tests/unit/persistence.test.ts`, `tests/e2e/department-workforce.spec.ts`,
  and `tests/e2e/parallel-service.spec.ts` after any workforce, station, lane,
  queue, service-job, inventory, settlement, or report change.

## Planner controls and sale-price tracing

- Drink prices are integer cents and change only through semantic steppers:
  exactly 10 cents per accepted activation within $2.50–$12.00.
- Supply purchases change exactly one package per accepted activation within
  0–20. Boundary buttons are natively disabled; values are polite live outputs.
- `adjustPlanPrice` and `adjustPlanPurchase` derive each update from current
  engine state. Do not replace them with absolute values captured in the UI.
- `makeOrder` is the sole actual-price formula: current planned base plus the
  configured size and milk surcharge. Revenue consumes that recorded order
  value; UI and reports must display it rather than calculate it again.
- `RushState.recentActivity` stores at most the latest 80 ordered arrival,
  service-start, sale, and walkaway observations. Schema-v4 imports validate
  this bounded evidence; v1/v2/v3 activity is discarded with the old campaign
  at the preferences-only reset. It is player feedback, not a second revenue
  ledger. Filter on `type === 'sale'` before reading sale-only fields.
- Run `tests/e2e/planner-controls.spec.ts` in both configured projects after any
  planner, pricing, service, report, settlement, responsive, or persistence
  change. It covers repeated $0.10 actions, reload, modifiers, 360px touch, and
  exact report/settled-cash reconciliation.

## Rush activity and fixed-isometric service world

- Engine activity IDs are `d{day}-e{sequence}` and use persisted monotonic
  sequence, tick, customer, and segment evidence. Walkaway reason is exactly
  patience, queue full, stockout, or rush ended. Append/prune only through the
  engine's bounded authority; never create events from renderer time.
- A queue-full arrival emits adjacent arrival then walkaway observations. A
  successful reservation emits service start; completion later emits the sale
  with the actual engine-recorded charge. At closing, active service precedes
  queued customers in rush-ended order.
- `createRenderSnapshot` is the sole service-render boundary. It detaches and
  deeply freezes exact identity/statistics plus at most 12 queued, three active,
  and three recent terminal customers, 12 activity rows, and 10 scheduled
  staff. It carries no command, store, persistence, random-number, tick,
  inventory-write, or accounting authority.
- `ServiceWorld` is dynamically imported only during `rush`/`event` and
  exhaustively dispatches cart, kiosk, cafe, and department store. Every
  production service route is WebGL2-only; unsupported capability, context
  loss, or renderer failure produces semantic save-safe recovery and never a
  Canvas/DOM gameplay path.
- The camera remains fixed-isometric and orthographic. Device pixel ratio is
  capped at 1.5; repeated crowds/furnishings/weather use bounded instancing;
  global lighting remains two lights with one shadow-caster. `useFrame` may
  alter local mesh matrices only.
- Pause freezes movement. Reduced motion keeps the complete 3D world mounted
  with demand rendering and static transforms. Scene name, figcaption, visible
  HUD, sale/walkaway notes, dashboard, and activity list retain exact textual
  parity; never encode meaning only in colour, motion, direction, or an icon.
- Morning planning is a full-width management layout with no 3D, Canvas,
  thumbnail, placeholder, or reserved preview area. Service direct-child order
  is scene → dashboard/controls → live activity → stock. At 360×780 the first
  two sections must fit together without document scroll.
- Run `tests/unit/scene.test.ts`, `tests/components/presentation.test.tsx`,
  `tests/e2e/webgl-service.spec.ts`, `tests/e2e/service-layout.spec.ts`, and
  `tests/e2e/accessibility.spec.ts` after any engine activity, service UI,
  renderer, persistence, responsive, motion, scheduling, or build-graph change.
  They cover frozen snapshots, engine equality, every venue, orthographic/DPR/
  instancing/light budgets, WebGL2 identity, context loss, unsupported routing,
  speed, reduced motion, reload, exact 360×780 geometry, and cache bounds.

## Campaign-unique staff names

- Candidate ordinal is `(day - 1) × 4 + index` for four candidates through Day
  10,000. `staffNames.ts` directly maps it into a seed/tier-keyed 65,536-name
  namespace; do not add rejection sampling or persisted seen-name history.
- Ordinals 0–39,999 are candidate-only. The remaining deterministic namespace
  is reserved and is not a current migration path. The first 4,096 names omit a
  middle initial; later disjoint tiers add one only when required.
- Candidate generation intentionally consumes the old unused 12-way name draw
  so role, speed, skill, wage, trait, and balance sequences stay exact.
- Current schema-v4 state validates combined hire/candidate IDs and names as
  unique and rejects a forged duplicate. Fresh campaigns generate deterministic
  unique identities. Version 1–3 staff progress is reset with the rest of the
  legacy campaign rather than repaired or carried into v4.
- Run `tests/unit/staff-names.test.ts`, persistence/operations/campaign tests,
  and `tests/e2e/staff-names.spec.ts` after any staff, candidate, day progression,
  save, import, or seed change.

## Dated inventory, capacity, and expiry

- `GameState.inventory` contains arrays of dated batches and is the only mutable
  stock authority. Use `ingredientQuantity` or `inventoryTotals` for exact
  derived totals; never persist a second flat stock record.
- `expiresAfterDay` is inclusive. A Day 1 purchase with the base three-rush life
  serves Days 1–3, then any remainder expires after the Day 3 rush.
- Service reserves complete recipes newest-batch-first. The live stock grid
  therefore falls when service starts, before the actual-charge observation is
  appended at successful completion.
- Refrigeration adds one/two days only to dairy, oat, soy, and cold-brew
  concentrate. An upgrade extends surviving chilled batches by the tier delta
  and never revives expired stock.
- `demandModel.ts` is the shared authority for segment, price, weather, size,
  and milk probabilities. `ingredientCapacities` forecasts intended weighted
  demand without stock suppression; every UI estimate must remain visibly `~`.
- New reports persist exact opening, bought, used, expired, and rolled totals.
  Every row must conserve quantity. Old reports with null lifecycle evidence
  must omit detail instead of reconstructing history.
- Run `tests/e2e/stock-lifecycle.spec.ts` in both configured projects after any
  inventory, demand, planner, rush, report, responsive, or persistence change.
  It covers planning, depletion, pause/reload, LIFO expiry, conservation,
  actual charges, and 360px reachability through the production bundle.

## Save recovery

The current browser adapter uses schema/key version 4 and retains the previous
validated v4 primary as a last-known-good backup. Current storage keys are
`laneway-tycoon.save.v4` and `laneway-tycoon.save.backup.v4`. Readable v1, v2,
and v3 primary/backup/import candidates cross one immutable allowlist reset:
only sound, ambience, and reduced-motion are retained. Active campaigns, meta,
records, history, onboarding progress, and the selected tab restart cleanly;
future versions are rejected. After the new v4 payload is verified, every
legacy primary/backup key is removed so fallback cannot resurrect old progress.

If the primary payload is corrupt and a valid backup exists, the title screen
shows a recovery warning. Open **Game menu → Save transfer → Restore
last-known-good save** to make that snapshot primary again. Export before a
manual browser-data reset whenever possible. Imported files are limited to
750 KB and validated completely before current data changes. An import fails
closed if browser storage is unavailable or its verified write fails; it cannot
consume the evolution notice or replace in-memory state. Do not hand-edit
local-storage payloads.

## Compact completion and report history

- `closeDay` is the sole settlement boundary and is identity-idempotent after a
  report has settled. The current report exposes one **Settle & reinvest**
  action; historical reports expose none.
- The current-day full report is a native disclosure closed by default. Game
  menu → Reports reads only bounded `GameState.history`, and a selected settled
  `DayReport` value is the historical renderer's sole input.
- `RushState.chargeGroups` accumulates bounded canonical actual-price groups at
  the sale transition. A reconciled copy enters a new `DayReport` once. Never
  derive historical charges from `rush.recentActivity`, current stock, or a
  renderer snapshot.
- Read-only schema-v4 reports without charge groups remain unchanged and show
  **Charge breakdown unavailable for this older report.** Do not estimate or
  reconstruct missing evidence.
- Run `tests/unit/engine.test.ts`, `tests/unit/persistence.test.ts`,
  `tests/components/game-loop.test.tsx`, and
  `tests/e2e/report-history.spec.ts` after any report, settlement, history,
  persistence, transfer, or responsive disclosure change.

## Phase 8 cumulative and release gate

The last deployed baseline is the repaired Phase 7 `main` head
`d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752`, workflow run `31246227689`, and
Pages deployment `5806728203` at
`https://sjmeehan9.github.io/tycoon/`. That identity is dependency evidence,
not a verdict for Phase 8.

After every fingerprint-included source, test, configuration, and contract
document is stable, record the unscoped global fingerprint with
`python3 scripts/worktree-fingerprint.py` and run this exact Tier 3 sequence
once against it:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

`docs/phase-8-test-report.md` maps every Phase 8 target and every enduring
Phase 1–7 journey to that immutable candidate. Lighthouse, dependency/license,
title-hash, and static/runtime-network checks are supplemental named-target
commands on the same fingerprint; they do not replace Tier 3.

A local PASS authorizes neither merge nor publication. The repository owner
decides the exact merge first and Pages publication separately afterward.
Automated workflow/deployment identity and owner-hosted browser findings are
recorded as separate evidence classes. Optional physical fields—model/OS,
browser/WebGL identity, viewport/DPR, dense scene and sampling method, frame
range, orientation, all venues, reduced motion, visual findings, and 30fps
disposition—remain pending/unclaimed unless the owner supplies them. Agents do
not access a device. Never publish an intermediate or unvalidated build.
