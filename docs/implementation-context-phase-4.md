# Phase 4 Implementation Context

## Component 4.1 — Human Setup and Phase Contracts

- Started `phase-4` at deployed `origin/main` merge `81e74dd`, preserving the
  coordinator's additive lean contract, phase-plan summary edits, and team-state
  edits already present in the shared worktree.
- Confirmed no Phase 4 account, credential, secret, environment variable,
  external service, dependency, or manual platform action is required.
- Extended the profile branch and human-gate contract through Phase 6 and
  completed concise Phase 4–6 sections so the plan now contains all six phases
  and 28 components named by its summary.
- Created the detailed lean Phase 4 breakdown, additive phase-progress entries,
  and component handoff. The sole Implement agent owns Components 4.1–4.4 under
  the user-approved two-role override.
- Technical re-check found no stale external assumption: Phase 4 uses existing
  native buttons, integer state, React command dispatch, browser storage, and
  configured Vitest/RTL/Playwright tooling with no new dependency or API.

## Component 4.2 — Exact Accessible Planner Steppers

- Replaced all 10 drink price and nine supply package `number` inputs with a
  reusable semantic minus/value/plus group. No free-text numeric editing or
  value parsing remains in the planner.
- Centralized price bounds/increment (250–1,200 cents, 10 cents) and package
  bounds/increment (0–20, one package) in typed content configuration shared by
  engine validation and UI disabled states.
- Added `adjustPlanPrice` and `adjustPlanPurchase` commands. They validate the
  planning phase and requested direction, derive the next value from current
  immutable engine state, and no-op only at bounds; consecutive activations
  therefore cannot overwrite one another with a stale absolute UI value.
- Every stepper exposes full decrement/increment names, a labelled polite atomic
  output, native Enter/Space/pointer/touch activation, inactive/bound disabled
  states, and 44×44px buttons. Responsive grid sizing retains 360px no-overflow.
- Unit and component suites pass 74 tests, including rapid double activation,
  keyboard operation, persistence, min/max, inactive drink, and unaffordable
  supply feedback. Focused production Playwright passes the desktop keyboard
  price-max journey and the 360px touch supply-min/max/target/overflow journey.
- Production PWA readiness and onboarding overlays are dismissed through their
  real controls in the new browser flow before manipulating the underlying
  planner; no force-click or test-only runtime seam was added.

## Component 4.3 — Authoritative Sale Pricing and Reconciliation

- Traced and tested the production path: stepper command updates
  `DayPlan.pricesCents`; planning autosave persists it; `makeOrder` reads that
  exact base and adds only the existing 90-cent large plus 60/80-cent soy/oat
  surcharges; successful service adds `Order.priceCents` to rush revenue;
  `finishRush` copies revenue into the report and derives closing cash; and
  `closeDay` settles that closing cash exactly once.
- The engine formula was already correct and was deliberately not rewritten.
  The reported defect was reproducible as an interaction/visibility failure:
  the old planner offered free-text absolute input rather than discrete $0.10
  actions, and service/report exposed only aggregate revenue, so the actual
  amended base plus modifier charge could not be verified by the player.
- Added `CompletedSaleActivity`, the sole Phase 4 precursor to Phase 6's
  `RushActivityEvent` union. `RushState.recentActivity` retains only the newest
  20 successful sale observations (`type`, engine tick, drink, size, milk,
  actual cents). It is not copied into report history or a second ledger.
- Old schema-v2 active rushes normalize an absent activity field to `[]`; a
  present field is fully validated and rejected if malformed or over 20. New
  active-rush/report saves round-trip with the same bounded observations.
- Rush UI now shows the latest actual charge; report UI groups the recent charge
  combinations and, when the bounded window contains the whole day, states the
  observed total matches sales revenue. The cash table now includes event cash
  adjustments so every closing-cash term is visible.
- Unit/RTL suites pass 76 tests. The amended flat-white regression applies ten
  real $0.10 commands to $6.50, verifies every charge against base + size/milk,
  sums observations to rush/report revenue, reconciles closing/settled cash,
  and proves schema compatibility/bounds.
- Focused production Playwright passes eight applicable desktop/touch journeys
  plus two intentional project-routing skips. Both projects set a one-drink
  menu, press + ten times, buy all required milk stock, reload/continue, run at
  4× through real events, validate allowed actual charges, sum them to visible
  revenue, reconcile every cash row, and verify settled header cash. Retained
  cart and coffee-day journeys were migrated from `.fill()` to real steppers and
  remain green.

