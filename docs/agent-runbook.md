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
- A saved game contains the PRNG state, queue, active service, event, and tick.
- Display speed changes how often the controller dispatches a tick, not the
  calculation performed by a tick.
- Tests and other consumers import public contracts from `src/game/index.ts`.
- The campaign closes on Day 30. Victory requires the cafe, $300 cash, and 65
  reputation; bankruptcy is checked after settlement only below −$100.
- Balance maintenance belongs in `tests/unit/campaign.test.ts`: keep at least
  two complete viable strategies and one complete bankruptcy path using public
  commands. Never introduce seed- or test-specific production logic.
- `tests/fixtures/campaignFixtures.ts` contains validated near-outcome and
  growth snapshots for production import UI journeys. If the schema or balance
  changes, update these fixtures and their full-campaign proof together.

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
  service-start, sale, and walkaway observations. Compatible older rushes
  without activity import as an empty list; legacy sale-only rows normalize to
  honest stable observations. It is player feedback, not a second revenue
  ledger. Filter on `type === 'sale'` before reading sale-only fields.
- Run `tests/e2e/planner-controls.spec.ts` in both configured projects after any
  planner, pricing, service, report, settlement, responsive, or persistence
  change. It covers repeated $0.10 actions, reload, modifiers, 360px touch, and
  exact report/settled-cash reconciliation.

## Rush activity and living scene

- Engine activity IDs are `d{day}-e{sequence}` and use persisted monotonic
  sequence, tick, customer, and segment evidence. Walkaway reason is exactly
  patience, queue full, stockout, or rush ended. Append/prune only through the
  engine's bounded authority; never create events from renderer time.
- A queue-full arrival emits adjacent arrival then walkaway observations. A
  successful reservation emits service start; completion later emits the sale
  with the actual engine-recorded charge. At closing, active service precedes
  queued customers in rush-ended order.
- Canvas always renders from an immutable `SceneSnapshot`. Exact queue truth is
  uncapped; only the first eight identities are sprites and `+N` carries the
  remainder. Playback is presentation-only and bounded to three transients and
  eight queue motions.
- Pause freezes playback. Reduced motion consumes IDs and settles immediately.
  A live report transition may finish its already-synced bounded departures;
  report reload must not replay history or schedule an idle animation loop.
- Canvas, figcaption, visible HUD, sale/walkaway notes, and activity list must
  retain text parity. Never encode meaning only in colour, motion, direction,
  or an icon.
- Run `tests/e2e/living-rush.spec.ts` in both projects after any engine activity,
  rush UI, Canvas, persistence, responsive, motion, or scheduling change. It
  covers exact overflow, counter/service/sale/walkaway evidence, 4× budget,
  pause, reduced motion, reload, rush close, and 360px containment.

## Campaign-unique staff names

- Candidate ordinal is `(day - 1) × 4 + index` for four candidates through Day
  10,000. `staffNames.ts` directly maps it into a seed/tier-keyed 65,536-name
  namespace; do not add rejection sampling or persisted seen-name history.
- Ordinals 0–39,999 are candidate-only. Ordinals 40,000–65,535 are reserved for
  compatible-save repair. The first 4,096 names omit a middle initial; later
  disjoint tiers add one only when required.
- Candidate generation intentionally consumes the old unused 12-way name draw
  so role, speed, skill, wage, trait, and balance sequences stay exact.
- Schema-v3 normalization processes hires then candidates in stable order,
  preserves the first duplicate occurrence and every originally unique name,
  and renames later duplicates from the reserved range. IDs, stats, economics,
  and scheduling do not change; combined IDs and names validate unique.
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

The current browser adapter uses schema/key version 3 and retains the previous
validated primary as a last-known-good backup. Current storage keys are
`laneway-tycoon.save.v3` and `laneway-tycoon.save.backup.v3`. Version-1 and
version-2 exports and legacy local keys migrate automatically; future versions
are rejected. A legacy flat inventory becomes current-day full-life batches
using the saved refrigeration tier. Old lifecycle history is left unavailable
rather than invented.

If the primary payload is corrupt and a valid backup exists, the title screen
shows a recovery warning. Open **Game menu → Save transfer → Restore
last-known-good save** to make that snapshot primary again. Export before a
manual browser-data reset whenever possible. Imported files are limited to
750 KB and validated completely before current data changes; do not hand-edit
local-storage payloads.

## Phase 6 final release gate

`docs/phase-6-test-report.md` and `docs/phase-6-release-evidence.md` record the
validated branch as **LOCAL PASS — HOSTED PENDING**. Local PASS authorizes only
the clean `phase-6` push. It does not authorize merge, Pages publication, or a
hosted PASS claim.

After explicit repository-owner approval, merge through the normal review/check
workflow and observe the main-only Pages deployment. Record the PR, merge SHA,
workflow, deployment, exact deployed commit, public direct load/refresh, desktop
and 360px activity/name flows, autosave reload, service-worker update, offline
continuation, and runtime health. Only replace the pending hosted fields after
all checks pass against the deployed Phase 6 commit.
