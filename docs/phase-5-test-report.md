# Phase 5 Test Report — PASS

## Release under test

- Branch: `phase-5`
- Validated feature head before final validation records: `2938cc4`
- Runtime: Node.js 22.13.1, pnpm 10.15.0
- Browser harness: Playwright 1.61.1 with managed Chromium
- Projects: 1280×800 desktop Chromium and 360×780 touch-mobile Chromium

## Exact validation sequence

Executed in the project-profile order after the final Phase 5 source and test
assertions:

| Command                          | Result                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS — lockfile current; no dependency change                                          |
| `pnpm build`                     | PASS — strict TypeScript, production Vite build, and 17-entry service-worker precache |
| `pnpm lint`                      | PASS — zero ESLint warnings and Prettier clean                                        |
| `pnpm test`                      | PASS — 94 engine, inventory, migration, persistence, component, and retained tests    |
| `pnpm test:e2e`                  | PASS — 37 applicable production journeys; 7 intentional project-routing skips         |

The complete Playwright command executed 44 project cases in 1.6 minutes. The
seven skips are explicit routing: desktop-only keyboard planner/accessibility,
touch-only planner/accessibility, and three real service-worker lifecycle cases
that run once in desktop Chromium. Both Phase 5 capacity/lifecycle journeys ran
and passed in both projects; no required target was hidden by a skip.

## Batch lifecycle and migration evidence

- Canonical inventory contains only bounded per-ingredient dated batches. Unit
  tests prove exact full and partial newest-first consumption, merge behavior,
  inclusive last-rush use, once-only post-rush expiry, and rejection of attempts
  to consume removed stock.
- All nine ingredient definitions carry a unit and three-rush base life. Dairy,
  oat, soy, and cold-brew concentrate alone receive the tested +1/+2 day
  refrigeration extension. Installing refrigeration extends surviving chilled
  batches by only the tier delta and cannot restore expired quantities.
- Save/import schema 3 validates at most eight batches per ingredient, positive
  integer quantities, bounded acquisition/expiry days, total bounds, and complete
  lifecycle conservation before replacing current data.
- Schema-2 flat stock migrates to current-day full-life batches using the run's
  refrigeration tier. Schema-1 and schema-2 imports, active rush/event/report
  progress, old primary/backup key order, corrupt-primary recovery, interrupted
  writes, and export/reimport all pass. Legacy reports use null lifecycle detail
  rather than invented historical evidence.
- The v3 browser keys check validated v2 primary/backup data before the first v3
  write and seed a current backup. Version-1 keys remain supported afterward;
  clearing a campaign removes current and legacy save keys.

## Capacity and live-report evidence

- Service and forecast share one deterministic demand model for four segment
  shares, price sensitivities, drink appeal/weather weights, size draws, and milk
  draws. Pure tests cover draw boundaries, normalized menu mix, price direction,
  recipes, modifiers, and selected-bean substitution without advancing PRNG.
- Every planning supply row shows exact carried + pending usable quantity,
  labelled polite/atomic output, an explicitly approximate `~N serves` or `Not
  used today`, limiting state, and earliest expiry amount/day. Package changes
  update immediately; semantic 44px steppers and 360px containment remain green.
- The rush/event scene grid renders all nine items with active-menu ingredients
  first. It reads immutable selector output only, has no tick-frequency live
  region, falls at the canonical reservation boundary, and restores an exact
  paused snapshot and 4× speed after production reload.
- New reports render every touched/held ingredient from persisted lifecycle
  totals. Each exact unit row satisfies opening + bought − used − expired =
  rolled; expiry evidence names Day N and the removed quantity. Imported old
  reports explicitly omit unavailable lifecycle detail.
- Phase 4 actual-charge evidence is retained. The lifecycle production journey
  still reaches latest actual charge, grouped completed-sale charges, observed
  revenue equality, cash reconciliation, and settlement behavior.

## Automated manual journeys

`tests/e2e/stock-lifecycle.spec.ts` automates the named desktop and 360px touch
flows against the production bundle:

- planning capacity reacts to package and menu changes without false exactness;
- a validated schema-v3 Day 3 file imports through the real upload control;
- opening stock reserves and visibly depletes, including all nine row states;
- a paused rush reloads to exactly matching displayed quantities and resumes;
- event-phase stock remains present without announcement spam;
- new dairy is consumed before old dairy, then the untouched 500 ml Day 1 batch
  expires exactly once after its final eligible Day 3 rush;
- report cells conserve exact amounts, the causal expiry sentence is visible,
  actual-charge evidence remains present, and the 360px document does not
  overflow while the semantic table remains touch/keyboard reachable.

Retained campaign, operations, persistence, save-transfer, pixel presentation,
accessibility, actual-price, offline cache, and real service-worker update flows
also passed cumulatively.

## Component commits and handoff

- `3edf94d` — Component 5.1, human setup and phase contracts
- `6d50d9d` — Component 5.2, schema-v3 perishable batch inventory
- `d64328a` — Component 5.3, weighted planning capacity
- `2938cc4` — Component 5.4, live rush stock and expiry reporting
- Component 5.5 is this final validation/documentation record; its SHA and clean
  `origin/phase-5` push are reported by the completion handoff after the commit.

## Self-review

- No placeholder, TODO, FIXME, unimplemented exception, test-only runtime seam,
  percentage spoilage rule, or mutable flat shadow inventory exists in Phase 5
  production code. Flat `IngredientTotals` appear only as derived selector,
  migration, rush-opening, and report evidence.
- Batches are capped at eight on import; same-day/same-expiry purchases merge
  and post-rush expiry bounds live runtime history to the configured shelf life.
- Expiry runs only after the inclusive last usable rush. Service checks exact
  canonical availability and consumes batches before report expiry; stale
  imported batches are rejected.
- Report lifecycle equality is enforced both by engine tests and import
  validation, including equality with `remainingInventory` and `waste`.
- Demand math is centralized in `demandModel.ts`; engine and capacity import it.
  Capacity is marked with `~` everywhere and unavailable demand is represented
  as `Not used today`, never an exact promise.
- The default application path renders both planner capacity and live/report
  evidence. No feature depends on a mock, injected executor, manual workaround,
  or optional wiring.
- No dependency, backend, account, secret, environment file, remote API, or
  runtime network path was added. Phase 6 implementation has not begun.

## Verdict

**PASS.** Every Phase 5 acceptance criterion and every retained Phase 1–4
validation target passes on the production build across desktop and touch-mobile.
The branch is ready for its final Component 5.5 documentation commit and push,
then human approve/reject review; it must not merge or begin Phase 6 at this gate.
