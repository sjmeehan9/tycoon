# Component 4.3 — Authoritative Sale Pricing and Reconciliation

## What was delivered

A user can now amend one drink's price, reload, trade a real rush, see the
latest base-plus-modifier charge, inspect concise actual-charge evidence in the
report, and trust that observed sales, report revenue, closing cash, and settled
cash use the same integer cents.

## Public interfaces / contracts exposed

- `CompletedSaleActivity` is the minimal Phase 4 sale observation:
  `{ type: 'sale'; tick; drinkId; size; milk; priceCents }`.
- `RushState.recentActivity` holds at most `RUSH_ACTIVITY_LIMIT` (20) newest
  successful sale observations. Phase 6 should widen this same field into its
  bounded rush activity union rather than add a parallel event/transaction log.
- `completedSaleLabel(sale)` formats a configured sale for textual feedback.
- Schema version remains 2. `importEnvelope` defaults a missing
  `recentActivity` to an empty array and validates any present activity.

## Files owned

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/selectors.ts`,
  `src/game/index.ts`, `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`
- `src/components/RushPanel.tsx`, `src/components/ReportPanel.tsx`,
  `src/styles.css`
- `tests/unit/engine.test.ts`, `tests/unit/persistence.test.ts`,
  `tests/components/game-loop.test.tsx`
- `tests/e2e/planner-controls.spec.ts`, `tests/e2e/cart-day.spec.ts`,
  `tests/e2e/coffee-day.spec.ts`
- `docs/components/phase-4-component-4-3-overview.md`,
  `docs/implementation-context-phase-4.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm test`, then
`pnpm exec playwright test tests/e2e/planner-controls.spec.ts`. The two-project
amended-price case changes Flat White from $5.50 to $6.50 using ten presses,
reloads, and reconciles actual charge combinations ($6.50 base plus existing
size/milk surcharges) through report and settlement.

## Integration notes & gotchas

- `makeOrder` remains the only pricing formula and was not changed. Never
  derive price again in UI/report code; display the engine's recorded
  `priceCents`.
- `recentActivity` is feedback state, not the accounting source. Revenue remains
  `RushStats.revenueCents`, updated at the same successful-service boundary.
- A high-throughput day can serve more than 20 customers. The report then labels
  the list as the latest 20 and does not claim its subtotal equals full revenue.
  Phase 4's regression deliberately uses an unupgraded quality-dial single-drink
  day whose complete sales fit in the bound.
- Abandoned, queued, stockout, or unfinished orders do not create sale activity
  or revenue. Phase 6 will add those outcomes by widening the one activity
  stream.
