# Component 5.4 — Live Rush Stock and Expiry Reporting

## What was delivered

A user can now watch all nine stock items fall at the exact reservation boundary
during service, reload without losing those quantities, and reconcile opening,
bought, used, expired, and rolled-forward stock after the rush. Expiry evidence
names the affected ingredient, quantity, and causal day while actual sale-charge
evidence remains intact.

## Public interfaces / contracts exposed

- `RushStockGrid` is the rush/event scene-column presentation. It derives only
  from the immutable current `GameState` through `ingredientCapacities` and does
  not dispatch ticks, mutate inventory, or create a live-region announcement.
- All nine rows expose `data-ingredient="<IngredientId>"` for stable testing and
  diagnostics. Active-menu ingredients sort first; configured supplier order
  breaks ties.
- `Inventory lifecycle reconciliation` is the report's semantic table contract.
  It renders only ingredients touched or still held and shows the persisted v3
  equation `opening + bought − used − expired = rolled` with exact units.
- A report with `inventoryLifecycle: null` presents an explicit unavailable
  note. Historical quantities are never reconstructed for migrated old reports.

## Files owned

- `src/components/RushStockGrid.tsx`, `src/App.tsx`,
  `src/components/ReportPanel.tsx`, `src/styles.css`, `src/game/capacity.ts`
- `tests/components/game-loop.test.tsx`, `tests/unit/engine.test.ts`,
  `tests/e2e/stock-lifecycle.spec.ts`, `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-5-component-5-4-overview.md`,
  `docs/implementation-context-phase-5.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm build`, `pnpm lint`, `pnpm test`, then
`pnpm exec playwright test tests/e2e/stock-lifecycle.spec.ts`. The completed
boundary passes 94 Vitest/RTL tests, the desktop full lifecycle journey, and the
touch-mobile full lifecycle journey at 360 CSS pixels.

## Integration notes & gotchas

- Inventory falls when an order reserves ingredients, before its sale completes.
  That is the canonical engine boundary and is why a paused/reloaded grid may
  show reserved stock before the corresponding actual-charge row exists.
- During rush/event phases, pending purchases are already canonical batches and
  are not added a second time by `ingredientCapacities`.
- An expiry day is inclusive. `expires after this Day N rush` means the stock is
  still usable throughout that rush, then removed before Day N+1.
- The lifecycle table is horizontally scrollable and keyboard focusable at
  narrow widths; its container, live grid, and page remain within 360px.
- The production regression fixture is a validated schema-v3 Day 3 import. New
  dairy is consumed LIFO while the untouched Day 1 remainder expires exactly
  once, proving the complete planning → rush → reload → report path.
