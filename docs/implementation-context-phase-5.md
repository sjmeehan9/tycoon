# Phase 5 Implementation Context

## Component 5.1 — Human Setup and Phase Contracts

- Continued on `phase-5`, branched by the coordinator from validated Phase 4
  head `1c1e2b5`. Phase 4 source, tests, PASS evidence, and commits are retained.
- Confirmed no Phase 5 account, credential, secret, environment variable,
  external service, dependency, publication action, or manual platform task is
  required. The only human action is approve/reject after Component 5.5 PASS.
- Converted the approved Phase 5 plan and locked defaults into a detailed lean
  component breakdown with vertical ownership, interfaces, validation targets,
  exact expiry semantics, migration/storage order, and downstream gotchas.
- Scope integrity passed: Components 5.2–5.5 can deliver the complete phase in
  dependency order without a split, descope, placeholder, or Phase 6 behavior.
- Technical re-check found no stale external assumption. The phase uses only
  the already-validated pure TypeScript engine, bounded JSON/local storage,
  React UI, and configured Vitest/RTL/Playwright stack.

## Component 5.2 — Schema-v3 Perishable Batch Inventory

- Replaced canonical flat stock with complete per-ingredient arrays of dated
  batches (`quantity`, `acquiredDay`, inclusive `expiresAfterDay`). Exact flat
  totals now exist only as pure selector/report output.
- Centralized all nine ingredient names, units, three-rush shelf life, chilled
  eligibility, and the eight-batch defensive import bound. Purchases merge one
  full-life current-day batch; reservation consumes newest `acquiredDay` first
  and retains exact partial remainders without mutating input state.
- Expiry now runs once after the batch's last usable rush and fully replaces the
  former percentage milk spoilage. Expired totals are removed before the report
  state is persisted, copied to `waste`, and cannot serve a later order.
- Refrigeration adds one/two days to dairy, oat, soy, and cold-brew concentrate.
  Buying a higher tier extends surviving chilled batches by only the tier delta;
  beans/chocolate/ice are unchanged and removed stock is never resurrected.
- Rush state captures exact opening and purchased totals. New reports persist a
  complete conservation record satisfying opening + purchased − consumed −
  expired = remaining per ingredient; old reports use `null` lifecycle evidence
  instead of invented quantities. Cash and Phase 4 sale evidence are unchanged.
- Advanced game/save contracts and browser primary/backup keys to version 3.
  Imports accept schemas 1/2/3; flat legacy amounts become current-day full-life
  batches at the run's existing refrigeration tier. Active rush/event/report
  tick, PRNG, queue, service, events, stats, report, and recovery progress remain
  intact. Old v2 primary/backup keys are checked and seed a v3 backup before the
  first v3 write; v1 keys remain supported afterward.
- Nested validation caps arrays/quantities/days, rejects stale/over-life batches,
  validates report conservation, retains the 750 KB limit, and rejects malformed
  or future data before current state changes.
- Production build and zero-warning lint pass. Fourteen Vitest/RTL files pass 86
  tests, including exact LIFO partial depletion, expiry boundaries, tier effects,
  conservation, in-progress migrations, legacy key order, bounds, and interrupted
  writes. Ten focused persistence/save-transfer Playwright journeys pass across
  desktop and touch-mobile.

## Component 5.3 — Weighted Planning Capacity

- Centralized deterministic segment shares, price sensitivity, size selection,
  milk selection, drink/weather weighting, and draw thresholds. The service
  engine and planner forecast now consume the same public demand model instead
  of maintaining parallel probability rules.
- Added a pure bounded capacity selector over the four segments, active menu,
  configured appeal and prices, weather, sizes, milk modifiers, recipes, and
  selected-bean substitution. Drink weights normalize inside each segment;
  intended demand deliberately does not inherit current-stock suppression.
- Every ingredient row exposes exact carried, pending, and post-order usable
  quantities, weighted expected units per order, floored approximate serves,
  active-menu relevance, tied limiting state, and earliest expiry quantity/day.
  Pending packages count only while planning and are projected as real dated
  batches using the current refrigeration tier.
- Planner supply rows now use labelled polite/atomic output and visibly retain
  the `~` approximation marker. Exact quantities, unused ingredients, limiting
  ingredients, and expiry risk update immediately after atomic menu, price,
  bean, milk, and package commands without advancing the game PRNG.
- Production build and zero-warning lint pass. Fifteen Vitest/RTL files pass 92
  tests, including draw boundaries, weighted recipes, price/menu direction,
  substitutions, batch/purchase/expiry projection, and immediate announcements.
  The focused planning-capacity browser journey passes desktop and touch-mobile,
  including 360px containment and explicit no-false-exactness assertions.

## Component 5.4 — Live Rush Stock and Expiry Reporting

- Added a semantic nine-item stock grid to the scene column for both rush and
  event phases. Intended-demand ingredients sort first, exact remaining amounts
  update at engine reservation, weighted capacity retains the `~` marker, and
  unused, zero/stockout, and earliest post-rush expiry states remain explicit.
- The grid reads the immutable state snapshot only. It dispatches no tick,
  creates no secondary inventory, and has no live region that could announce at
  service frequency. Existing autosave checkpoints plus pause persistence restore
  the exact same row quantities and service speed after reload.
- Added a semantic report lifecycle table for every ingredient touched or still
  held. Each row displays exact opening, bought, used, expired waste, and rolled
  quantities plus the complete conservation equation with configured units.
  Expired rows generate a causal Day N explanation based on persisted report
  totals; old migrated reports with null evidence state that detail is unavailable.
- Retained the Phase 4 latest-sale and report charge grouping, observed revenue,
  cash reconciliation, and settlement behavior unchanged. The lifecycle surface
  is additive and the production journey verifies both evidence families together.
- Reused a module-level ingredient number formatter to keep the constant nine-row
  tick render inexpensive. The responsive grid collapses to one column at 360px;
  the wide semantic lifecycle table stays keyboard/touch scrollable inside a
  bounded container without introducing document overflow.
- Production build and zero-warning lint pass. Fifteen Vitest/RTL files pass 94
  tests, including exact live ordering/states, conservation, once-only expiry,
  surviving-batch eligibility, causal reporting, and honest legacy omission.
  The production Day 3 flow passes desktop and touch-mobile through planning,
  depletion, pause/reload restoration, event parity, report, LIFO expiry, actual
  charges, visible bounds, and 360px no-overflow assertions.

## Component 5.5 — Phase Validation and Documentation

- Ran the project-profile sequence exactly after the final Phase 5 source/test
  head: frozen install, production build, zero-warning lint/format, Vitest/RTL,
  then the complete Playwright suite. All five commands passed without a source
  correction or validation rerun.
- Vitest/RTL passed 94 tests across 15 files. Playwright passed 37 applicable
  production journeys across desktop and touch-mobile in 1.6 minutes, with seven
  intentional non-matching-project skips. Both Phase 5 capacity/lifecycle cases
  ran in both configured projects.
- Audited source/tests for placeholders, flat mutable inventory, duplicate
  probability math, percentage spoilage, unbounded imported batches, stale
  consumption, conservation gaps, unmarked estimates, and test-only wiring. No
  required behavior is deferred or hidden; derived totals remain evidence only.
- Recorded complete batch, migration, refrigeration, capacity, live-grid,
  report, persistence, compatibility, automated-manual-flow, and retained Phase
  1–4 evidence in `docs/phase-5-test-report.md`. Updated the runbook from schema
  2 to schema 3 and added the operational inventory/capacity contracts.
- No dependency, external service, secret, environment, backend, publication,
  main merge, or Phase 6 implementation was introduced. Phase 5 ends at the
  pushed branch and human approve/reject gate.
