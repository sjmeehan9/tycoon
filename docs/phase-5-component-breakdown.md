# Phase 5 Component Breakdown — Stock Lifecycle and Capacity Intelligence

## Scope integrity

Phase 5 is deliverable in five sequential vertical components without reducing
the approved behavior. Component 5.2 replaces the canonical inventory and save
path end to end before Component 5.3 derives capacity from it; Component 5.4
then exposes those same contracts during service and reporting. Component 5.5
is the cumulative gate. Phase 6 behavior is not part of this phase.

## Locked domain decisions

- Inventory is canonical as per-ingredient dated batches, never a flat mutable
  amount with a parallel batch shadow.
- `expiresAfterDay` is the last trading day on which a batch is usable. Normal
  stock bought on Day 1 is usable during Days 1, 2, and 3, then is removed as
  expiry waste after the Day 3 rush.
- Refrigeration extends dairy, oat, soy, and cold-brew-concentrate batches by
  one day at tier 1 and two days at tier 2. Buying a higher tier extends still-
  usable carried chilled batches by the tier delta; it never revives stock that
  already expired after a completed rush.
- Consumption is true LIFO: newest `acquiredDay` is depleted first and a partial
  draw leaves the remainder in that same batch. Expired quantities are removed
  exactly once and can never be reserved or consumed.
- Capacity is a deterministic weighted estimate, displayed with `~`, not a
  promise of an exact drink count. It uses the engine's menu, segment shares,
  price weighting, drink appeal, weather weighting, size probabilities, milk
  probabilities, recipes, and selected-bean substitution.
- Schema versions 1 and 2 remain importable. Every legacy flat inventory amount
  becomes one current-day, full-life batch using the run's refrigeration tier.
  Old v2 primary and backup browser keys are checked before the first v3 write.

## Component 5.1 — Human Setup and Phase Contracts

### Runtime outcome

Phase 5 can begin from the validated Phase 4 head with its no-setup gate,
ownership, interfaces, ordering, validation, and human merge checkpoint explicit.

### Deliverables

- Confirm there is no account, credential, secret, environment variable,
  publication action, dependency installation, or external service setup.
- Create this detailed component breakdown and the Phase 5 implementation
  context/component overview.
- Advance Phase 5 progress/team state while preserving every Phase 4 PASS record
  and leaving Phase 6 queued.
- Commit as `feat(phase-5): Component 5.1 — Human setup and phase contracts`.

### Files and interfaces

- `docs/phase-5-component-breakdown.md`
- `docs/implementation-context-phase-5.md`
- `docs/components/phase-5-component-5-1-overview.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`

### Dependencies

Phase 4 Component 4.4 PASS at `1c1e2b5` and the approved additive plan/lean
contract.

### Technical validation

No external assumption exists to re-check. The current Node/pnpm/React/TypeScript,
Vitest/RTL/Playwright, local-storage, and static-PWA contracts already passed the
Phase 4 exact validation sequence.

### Acceptance criteria

- The no-setup result and post-PASS human merge decision are explicit.
- Components 5.2–5.5 have complete vertical deliverables, dependencies, owned
  files, technical checks, and runtime acceptance criteria.
- Phase 6 remains queued and no Phase 4 source/history is changed.

## Component 5.2 — Schema-v3 Perishable Batch Inventory

### Runtime outcome

A user can buy, consume, roll, reload, export/import, recover, and expire stock
without losing age, duplicating quantity, or consuming an older batch first.

### Deliverables

- Add central ingredient metadata for display name/unit, three-rush base shelf
  life, and chilled eligibility. Update refrigeration/steady-trait copy and
  effects so expiry fully replaces percentage chilled spoilage.
- Introduce `InventoryBatch { quantity; acquiredDay; expiresAfterDay }`, batched
  `IngredientInventory`, flat `IngredientTotals`, and a nullable historical
  `InventoryLifecycleReport` for honest old-report compatibility.
- Add pure inventory operations for empty inventory, exact totals, purchase-day
  batch creation/merging, pending purchase projection, availability checks,
  newest-first partial consumption, refrigeration-tier extension, earliest
  expiry, and post-rush expiry with per-ingredient totals.
- Make `startRush`, service reservation, demand availability, equipment
  purchase, rush finish, reports, settlement, next-day/endless continuation,
  and public total selectors use the canonical batch path.
- Store opening/purchased totals in the rush and write new report lifecycle rows
  so opening + purchased − consumed − expired = remaining for every ingredient.
- Advance save/game state to version 3. Accept schemas 1/2/3, migrate v1 through
  v2, migrate flat v2 inventory as current-day full-life batches, normalize old
  reports to unavailable lifecycle evidence, and reconstruct active-rush
  opening/purchase totals without losing queue/service/event/report progress.
- Use new v3 primary/backup keys. Load v3 primary/backup first, then old v2
  primary/backup, then v1; seed the first v3 backup from a valid old save before
  writing v3. Preserve size limits, full nested validation, backup restoration,
  export/import, interrupted writes, clear behavior, and unknown-version safety.
- Update every retained fixture/test consumer to use public batch/total
  contracts; do not retain a second flat authoritative inventory.

### Files and interfaces

- `src/game/types.ts`: batch, totals, lifecycle, state/report v3 contracts.
- `src/content/gameContent.ts`: ingredient/shelf-life/chilled metadata and copy.
- `src/game/inventory.ts`: canonical pure batch operations.
- `src/game/engine.ts`, `src/game/selectors.ts`, `src/game/index.ts`: runtime
  integration and public totals.
- `src/persistence/saveStore.ts`: schemas/keys/migration/validation/recovery.
- `tests/unit/inventory.test.ts`, `tests/unit/engine.test.ts`,
  `tests/unit/operations.test.ts`, `tests/unit/persistence.test.ts`, retained
  campaign/content tests and `tests/fixtures/campaignFixtures.ts` where required.
- `docs/components/phase-5-component-5-2-overview.md`,
  `docs/implementation-context-phase-5.md`, `docs/phase-progress.json`.

### Dependencies

Component 5.1 plus Phase 4 planner, sale evidence, report cash, schema-v2
migration/recovery, and exact-once settlement contracts.

### Technical validation

The implementation uses bounded JSON arrays and pure integer quantity/day
operations only. No schema library or external API is needed. Maximum retained
batches per ingredient is centrally bounded above the largest reachable shelf-
life window and below the existing 750 KB save cap.

### Acceptance criteria

- Normal stock is usable on purchase day plus two following trading days and is
  removed as named expiry waste only after the third rush.
- Refrigeration extends only the four configured chilled ingredients by +1/+2
  days; upgrades extend surviving carried batches without resurrection.
- Mixed-age and partial consumption is true LIFO and conserves quantity.
- Expired stock is never reserved/consumed and report lifecycle totals reconcile
  per ingredient; percentage spoilage no longer exists.
- Schema 1/2/3 planning, rush, event, report, reinvestment, primary, backup,
  export, and import paths migrate/round-trip without progress loss; malformed,
  unbounded, oversized, and future data is rejected before current data changes.

## Component 5.3 — Weighted Planning Capacity

### Runtime outcome

During planning, every supply row tells the user the exact usable amount after
the pending order, an honest weighted `~N serves` estimate or `not used today`,
and the earliest amount/day at risk of expiry.

### Deliverables

- Centralize the deterministic segment shares, segment price sensitivities,
  size probabilities, and milk draw probabilities used by real order creation.
- Add a pure per-ingredient capacity selector. Normalize price-weighted drink
  mix inside each segment, apply size/milk recipe probabilities and selected
  bean/milk substitution, and divide usable quantity by weighted expected use.
- Return stable typed rows containing ingredient identity/name/unit, exact
  carried quantity, pending purchase quantity, post-purchase usable quantity,
  expected units per serve, approximate serves or not-used state, active-menu
  relevance, and earliest expiry amount/day.
- Render the result in every planner supply row using labelled polite output.
  Recompute from current state on every menu, price, bean, and package command;
  retain semantic steppers, 44px controls, no free edit, and 360px containment.
- Cover one-factor menu, price, segment, size, milk, recipe, bean, batch,
  purchase, and expiry changes in pure tests; cover immediate UI announcements
  and responsive/no-false-exactness behavior in RTL/production browser tests.

### Files and interfaces

- `src/content/gameContent.ts`, `src/game/demandModel.ts`: shared probability
  and weighting contracts used by engine and capacity logic.
- `src/game/capacity.ts`, `src/game/selectors.ts`, `src/game/engine.ts`,
  `src/game/index.ts`: pure `IngredientCapacity` selection and shared order draws.
- `src/components/Planner.tsx`, `src/styles.css`: accessible planning surface.
- `tests/unit/capacity.test.ts`, `tests/unit/demand.test.ts`,
  `tests/components/planner-controls.test.tsx`,
  `tests/e2e/stock-lifecycle.spec.ts`.
- `docs/components/phase-5-component-5-3-overview.md`,
  `docs/implementation-context-phase-5.md`, `docs/phase-progress.json`.

### Dependencies

Component 5.2 canonical inventory and Component 4.2 atomic planner controls.

### Technical validation

The selector is a pure finite weighted sum over four segments, at most ten
drinks, two sizes, and four milk choices. It mutates neither PRNG nor game state,
adds no runtime loop proportional to save history, and is safe to recompute on
every planner render.

### Acceptance criteria

- Exact quantities include carried batches plus pending packages during
  planning and update after every package activation.
- Weighted usage follows current active menu, prices, configured segment share,
  drink appeal/weather, size/milk probabilities, recipes, and bean substitution.
- Every row displays `~N serves` or `not used today`, never an unmarked exact
  drink promise, and exposes the earliest expiry amount/day when present.
- Labels/live output/keyboard/touch/44px/360px behavior passes unit, RTL, and
  both production browser projects.

## Component 5.4 — Live Rush Stock and Expiry Reporting

### Runtime outcome

During service, a user can watch every stock item fall as orders reserve it;
after service, they can reconcile opening, purchased, consumed, expired waste,
and rolled amounts and understand the causal expiry day.

### Deliverables

- Add a `RushStockGrid` directly beneath the scene for rush/event phases. Render
  every ingredient, active-menu items first, with exact remaining amount/unit,
  weighted `~N serves` or `not used today`, zero/stockout state, and earliest
  post-rush expiry wording. Derive entirely from immutable engine snapshots.
- Update on the existing reservation/consumption boundary, survive rush reload,
  retain textual/reduced-motion parity, and use a responsive semantic grid with
  no tick-spam live region.
- Add a report lifecycle table for every ingredient touched or still held. Show
  exact opening, purchased, consumed, expired waste, and rolled quantities with
  units, a conservation-safe row equation, and causal expiry explanation.
- Preserve the Phase 4 latest-sale/rush/report actual-charge evidence unchanged.
- Add engine/report conservation assertions plus production desktop/360px
  planning → live depletion → reload → report/expiry/LIFO reconciliation,
  reachable content, visible bounds, and no-overflow coverage.

### Files and interfaces

- `src/components/RushStockGrid.tsx`, `src/App.tsx`,
  `src/components/ReportPanel.tsx`, `src/styles.css`.
- `src/game/capacity.ts`, `src/game/selectors.ts` only if display projection
  needs a shared public selector extension.
- `tests/components/game-loop.test.tsx`, `tests/unit/engine.test.ts`,
  `tests/e2e/stock-lifecycle.spec.ts`,
  `tests/fixtures/campaignFixtures.ts`.
- `docs/components/phase-5-component-5-4-overview.md`,
  `docs/implementation-context-phase-5.md`, `docs/phase-progress.json`.

### Dependencies

Components 5.2–5.3 and retained Phase 4 actual-price/reconciliation evidence.

### Technical validation

The scene-column grid reads selectors only; it does not dispatch ticks or alter
simulation. At nine bounded rows, render cost is constant and well below the
mobile budget. Report equations use persisted lifecycle totals, not UI-derived
inventory arithmetic.

### Acceptance criteria

- All nine stock items appear during rush, active-menu ingredients first, and
  exact remaining/weighted serves/zero/unused/expiry states are unambiguous.
- Quantities decrease on engine reservation, persist over reload, and never
  expose expired stock as usable.
- New v3 reports conserve each touched/held ingredient and causally name expiry
  waste; migrated old reports remain honest by omitting unavailable lifecycle
  detail rather than inventing it.
- Desktop and 360px touch production journeys reach the grid/report without
  clipping, overflow, hidden controls, or regression to actual-charge evidence.

## Component 5.5 — Phase Validation and Documentation

### Runtime outcome

Phase 5 has a truthful cumulative PASS handoff across batch lifecycle,
intelligence, persistence, campaign, PWA, desktop, and touch-mobile behavior.

### Deliverables

- Run exactly, in order: `pnpm install --frozen-lockfile`; `pnpm build`;
  `pnpm lint`; `pnpm test`; `pnpm test:e2e`.
- Fix every failure and automate the named multi-day migration/LIFO/expiry/
  refrigeration/capacity/live-grid/report flows in both target environments.
- Self-review source/tests for TODO/FIXME/placeholders, flat shadow inventory,
  duplicate demand math, percentage spoilage, unbounded batches, conservation
  holes, expired consumption, false exactness, and required behavior behind
  test seams.
- Write `docs/phase-5-test-report.md` only after the exact sequence passes;
  complete context, overviews, progress/team state, and runbook guidance.
- Commit as `feat(phase-5): Component 5.5 — Phase validation and documentation`,
  push `phase-5`, do not merge `main`, and stop before Phase 6.

### Files and interfaces

- `docs/phase-5-test-report.md`, `docs/implementation-context-phase-5.md`
- `docs/components/phase-5-component-5-5-overview.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`, `docs/agent-runbook.md`
- Any Phase 5-owned source/test correction required for the passing gate.

### Dependencies

Components 5.1–5.4 and every retained Phase 1–4 validation target.

### Technical validation

The exact sequence and configured desktop/touch-mobile projects are fixed by
`docs/project-profile.md`. A PASS claim requires each Phase 5 scenario to run in
its intended environment; project-routing skips may not hide a required target.

### Acceptance criteria

- Every Phase 5 and retained test passes in the exact profile sequence.
- The report records environment, commands, counts, migration/LIFO/expiry/
  refrigeration/capacity/conservation evidence, automated manual flows,
  compatibility, and self-review truthfully.
- All five component commits exist and `phase-5` is pushed cleanly without a
  main merge or Phase 6 implementation.
