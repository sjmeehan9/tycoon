# Component 6.2 — Deterministic Rush Activity Stream

## What was delivered

A user can now see and reload an exact, ordered account of every arrival,
service start, sale, and walkaway without changing simulation decisions,
inventory, or accounting. The same engine observations drive accessible text
and immutable scene snapshots at every presentation speed.

## Public interfaces / contracts exposed

- `RushActivityEvent` is the discriminated `arrival | serviceStarted | sale |
  walkaway` union. Every event carries `id`, `sequence`, `tick`, `customerId`,
  and `segment`; only migrated legacy sales may use `segment: null`.
- `RushWalkawayReason` is exactly `patience | queueFull | stockout |
  rushEnded`. `SaleActivityEvent` retains the actual engine-recorded
  `priceCents`; `CompletedSaleActivity` remains a sale-only compatibility alias.
- `RushState.nextActivitySequence` is persisted monotonic identity state.
  `recentActivity` retains the latest 80 observations through one append/prune
  authority; IDs are `d{day}-e{sequence}` and do not depend on renderer time.
- `describeRushActivity(event)` provides colour- and motion-independent text for
  every event and reason.
- `SceneSnapshot` exposes exact uncapped `queueCount`, the first eight immutable
  `queueCustomers`, an immutable active customer/order, and the immutable
  bounded event tail. `queueSegments` remains available for the current Canvas.
- Schema-v3 import normalizes sale-only activity into stable honest legacy
  events and derives the next sequence. Validation rejects unknown variants,
  reasons, unsafe identity, non-monotonic/duplicate observations, and over-bound
  arrays before state replacement.

## Files owned

- `src/game/types.ts`, `src/content/gameContent.ts`, `src/game/engine.ts`
- `src/game/selectors.ts`, `src/game/index.ts`
- `src/persistence/saveStore.ts`, `src/scene/sceneModel.ts`
- `src/components/RushPanel.tsx`, `src/components/ReportPanel.tsx`
- `tests/unit/engine.test.ts`, `tests/unit/persistence.test.ts`,
  `tests/unit/scene.test.ts`, `tests/components/game-loop.test.tsx`
- `docs/components/phase-6-component-6-2-overview.md`,
  `docs/implementation-context-phase-6.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm test`,
then `pnpm test:e2e`. The component boundary passed 100 Vitest/RTL tests and 37
Playwright production-browser tests with seven intentional project skips.

## Integration notes & gotchas

- Events observe transitions only. Accounting remains authoritative in
  `RushStats`/`DayReport`; inventory remains authoritative in dated batches.
- A queue-full customer emits adjacent `arrival` then `walkaway(queueFull)`
  events. A customer whose ingredients reserve successfully emits
  `serviceStarted`; completion later emits `sale` with the actual charge.
- At rush completion, an unfinished active customer is observed first, followed
  by queued customers in queue order, all with `rushEnded`.
- The retained event array can begin above sequence zero after pruning. Consume
  `sequence`/`id` rather than array index, and filter on `type === 'sale'` before
  using sale-only fields.
- Component 6.3 should animate only from immutable snapshot/event identity. It
  must use `queueCount` for exact text and overflow, not the capped visual list.
