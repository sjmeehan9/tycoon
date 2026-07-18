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
- `RushState.recentActivity` stores at most the latest 20 successful sale
  observations. Old schema-v2 rushes without the field import as an empty list.
  It is diagnostic player feedback, not a second revenue ledger.
- Run `tests/e2e/planner-controls.spec.ts` in both configured projects after any
  planner, pricing, service, report, settlement, responsive, or persistence
  change. It covers repeated $0.10 actions, reload, modifiers, 360px touch, and
  exact report/settled-cash reconciliation.

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
