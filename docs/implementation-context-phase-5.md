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
