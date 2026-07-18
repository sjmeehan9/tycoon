# Phase 4 Test Report — PASS

## Release under test

- Branch: `phase-4`
- Validated feature head before final validation records: `f239fd8`
- Runtime: Node.js 22.13.1, pnpm 10.15.0
- Browser harness: Playwright 1.61.1, Chromium 149
- Projects: 1280×800 desktop Chromium and 360×780 touch-mobile Chromium

## Exact validation sequence

Executed in the project-profile order after the final Phase 4 test assertions:

| Command                          | Result                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS — lockfile current                                                               |
| `pnpm build`                     | PASS — strict TypeScript, production Vite build, and 17-entry service-worker precache |
| `pnpm lint`                      | PASS — zero ESLint warnings and Prettier clean                                        |
| `pnpm test`                      | PASS — 76 engine, persistence, component, accessibility, audio, scene, and PWA tests  |
| `pnpm test:e2e`                  | PASS — 33 applicable production journeys; 7 intentional non-matching-project skips    |

The seven skips are explicit routing: the keyboard planner/accessibility flows
run only in desktop Chromium, the touch planner/accessibility flows run only in
the mobile project, and three real service-worker lifecycle cases run once in
desktop Chromium. Every Phase 4 scenario runs in its intended environment.

## Phase acceptance evidence

- All ten price controls use semantic minus/value/plus steppers. Each activation
  changes current engine state by exactly 10 cents within $2.50–$12.00; repeated
  activation cannot overwrite a newer value with stale absolute UI state.
- All nine supply controls use the same interaction with one-package increments
  within 0–20. Native buttons provide keyboard, pointer, and touch activation;
  disabled states stop at both bounds; labelled live outputs announce values.
- Stepper targets are at least 44×44px. The touch flow verifies target sizes and
  the actual-charge evidence remains within the 360px viewport with no
  horizontal document overflow.
- The production amended-price journey selects only Flat White, presses + ten
  times to move $5.50 → $6.50, persists through reload, trades through real
  events, and accepts only the engine's exact base + size/milk charge variants.
- Successful completed services alone append bounded actual-sale observations
  and revenue. The journey sums complete observed charges to rush/report sales,
  reconciles every closing-cash row, closes the day, and matches settled cash.
- Old schema-v2 active rushes without `recentActivity` normalize to an empty
  list. New observations fully validate, round-trip, reject malformed or over-
  bound input, and retain only the newest 20 successful sales.
- Every retained Phase 1–3 campaign, operations, save transfer, presentation,
  accessibility, persistence, offline, update, desktop, and mobile test remains
  green.

## Pricing-authority audit

`makeOrder` remains the one actual-charge formula. It reads the current
`DayPlan.pricesCents` base and adds only the configured milk and large-size
surcharges. Service accounting consumes `Order.priceCents`; the report and
settlement consume the resulting revenue and closing cash. UI/report code only
formats engine-recorded values and does not re-price a sale.

The static trace therefore confirmed the economic formula was already correct.
Phase 4 fixes the reproducible interaction and visibility defect: free-text
absolute edits are replaced by atomic persisted commands, and the exact actual
charge is now observable during rush and in the report.

## Manual tests automated

`tests/e2e/planner-controls.spec.ts` automates the named desktop keyboard,
360px touch, bounds, target-size, repeated-$0.10, reload, modifier-charge,
revenue, report, and settled-cash flows against the production bundle. Retained
`cart-day.spec.ts` and `coffee-day.spec.ts` exercise the steppers in full-day
journeys. Unit and RTL coverage automates rapid activation, inactive controls,
unaffordable purchases, bounds, persistence compatibility, activity retention,
actual-charge feedback, and cash reconciliation.

## Self-review

- No placeholder, TODO, FIXME, unimplemented exception, test-only runtime seam,
  or free-edit numeric input remains in the planner.
- Price and package rules are centralized in `DAY_PLAN_LIMITS`; the UI disabled
  state and engine validation consume the same typed limits.
- `RushState.recentActivity` is capped at `RUSH_ACTIVITY_LIMIT` (20), is fully
  import-validated, and is feedback rather than a second accounting ledger.
- The only remaining production `number` input is the existing title-screen
  optional seed control, outside planner scope.
- No dependency, schema-version, backend, secret, remote API, or runtime-network
  path was added. Phase 5 and Phase 6 implementation has not begun.

## Verdict

**PASS.** Every Phase 4 acceptance criterion and the cumulative Phase 1–3
validation contract passes on desktop and touch-mobile production builds.
