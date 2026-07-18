# Phase 4 Component Breakdown — Trustworthy Planning and Sales

## Authority and scope

The approved Phases 4–6 plan, `docs/phase-4-6-lean-contract.md`, the Phase 4
section of `docs/phase-plan.md`, and this breakdown are the complete Phase 4
specification. Under the lean override, the same sole Implement agent owns
source, tests, fixes, self-review, component documentation, validation evidence,
commits, and push. Phase 5 work is out of scope until Phase 4 is complete.

## Ownership

Phase 4 may modify `src/**`, `tests/**`, the Phase 4 planning/context/progress
documents, `docs/project-profile.md`, `docs/phase-plan.md`,
`docs/agent-team-state.md`, and `docs/agent-runbook.md`. It may create Phase 4
component overviews and `docs/phase-4-test-report.md`. It must not change
generated agent/skill definitions, dependencies, PWA release configuration, or
Phase 5 runtime contracts.

## Component 4.1 — Human Setup and Phase Contracts

### Runtime outcome

The authorized `phase-4` branch has an accurate six-phase workflow contract and
a complete, executable Phase 4 specification before gameplay code changes.

### Deliverables

- Confirm no account, credential, secret, service, environment variable, or
  manual platform action is required.
- Extend the project profile to branches `phase-4` through `phase-6` and record
  their merge/hosted human gates.
- Complete concise Phase 4–6 phase-plan sections so six phases and 28 components
  are represented consistently without changing approved product decisions.
- Create this breakdown, `docs/implementation-context-phase-4.md`, the 4.1
  overview, and Phase 4–6 progress entries; update team state.

### Files and interfaces

- `docs/project-profile.md`, `docs/phase-plan.md`,
  `docs/phase-4-component-breakdown.md`, `docs/phase-progress.json`
- `docs/implementation-context-phase-4.md`,
  `docs/components/phase-4-component-4-1-overview.md`
- `docs/agent-team-state.md`, `docs/phase-4-6-lean-contract.md`

### Dependencies

Phase 3 hosted PASS at `81e74dd`; approved additive lean contract. No human task
blocks implementation.

### Technical validation

The repository is on `phase-4` at the deployed `origin/main` baseline. The
profile still names the actual pnpm/Vite/React/Playwright stack and exact
validation sequence. Phase 4 adds no library, browser API, platform entitlement,
or external service assumption requiring a version workaround.

### Acceptance criteria

- Profile, plan, progress, team state, and breakdown agree on six phases, 28
  components, Phase 4 scope, branch flow, and human gates.
- Existing coordinator/TBA changes are preserved.
- No human task remains open before Component 4.2.

## Component 4.2 — Exact Accessible Planner Steppers

### Runtime outcome

A user can adjust every enabled drink price and every supply package quantity
through semantic minus/value/plus controls. Each accepted activation changes
current state atomically by exactly 10 cents or one package, persists
immediately, announces its value, and never permits free-text entry.

### Deliverables

- Central typed limits: prices 250–1,200 integer cents in 10-cent increments;
  supply quantities 0–20 packages in one-package increments.
- Reusable semantic stepper with labelled decrement/increment buttons, a polite
  atomic value output, at least 44×44px buttons, and disabled controls at bounds
  or when a drink is not active.
- Relative typed price/quantity engine commands. Each command derives from the
  current immutable state, clamps only at the configured bound, passes through
  normal plan validation, and therefore cannot lose rapid consecutive
  activations to a stale absolute UI value.
- Replace all planner price and quantity `number` inputs and their parsing code;
  retain active-menu rules, cash feedback, immediate planning autosave, mobile
  tabs, and 360px no-overflow behavior.

### Files and interfaces

- Create `src/components/AccessibleStepper.tsx` exposing
  `AccessibleStepper(props): React.JSX.Element`.
- Modify `src/components/Planner.tsx`, `src/styles.css`,
  `src/content/gameContent.ts`, `src/game/types.ts`, `src/game/engine.ts`, and
  `src/game/index.ts`.
- Add/extend `tests/unit/engine.test.ts`, component planner tests, and production
  Playwright planner-control tests.
- Create the 4.2 overview; append Phase 4 context and progress.

### Dependencies

Component 4.1; existing `prepareDay` validation, `GameProvider.command`
functional state updates, and immediate non-rush persistence.

### Technical validation

Native HTML `button` activation remains supported by keyboard, pointer, touch,
and assistive technology on the project's Safari 16.4+ and Chromium baseline.
The implementation uses no custom `spinbutton`, gesture-only handler, editable
field, new dependency, or unstable browser API.

### Acceptance criteria

- Every visible planner price/quantity is a minus/value/plus group; no numeric
  textbox remains.
- Repeated actions apply one exact configured increment and reload with the same
  integer value.
- Buttons are semantic, labelled, 44px minimum, keyboard/touch operable,
  value-announcing, disabled at bounds, and fit at 360px.
- Unit/component and desktop/mobile production-browser tests cover happy,
  boundary, rapid, keyboard, touch, disabled, and error-feedback paths.

## Component 4.3 — Authoritative Sale Pricing and Reconciliation

### Runtime outcome

A user can set a one-drink amended base price, reload the plan, complete a real
rush, see the actual amount charged (including size/milk), and reconcile the
same cents through rush revenue, report revenue, closing cash, and settlement.

### Deliverables

- Add one minimal bounded `CompletedSale` observation containing only drink,
  size, milk, and actual `priceCents`. Record it on successful service only.
  Store a small recent bounded window on rush state and copy it into the report;
  accept legacy schema-v2 saves/reports by supplying an empty default.
- Deliberately shape the observation so Phase 6 can promote it into the canonical
  `RushActivityEvent` stream. Do not create a permanent parallel transaction
  ledger, customer identity trail, or unbounded history.
- Preserve the existing `makeOrder` formula: authoritative
  `DayPlan.pricesCents[drinkId]` plus configured milk and large-size surcharges.
- Show the latest actual charge during the rush and concise grouped actual-charge
  evidence in the report. Avoid duplicating the complete accounting report.
- Reproduce the player path in production Playwright and prove completed-sale
  sums equal rush/report revenue; prove report net/closing cash and settled cash
  reconcile exactly.

### Files and interfaces

- Modify `src/game/types.ts`, `src/game/engine.ts`,
  `src/persistence/saveStore.ts`, `src/components/RushPanel.tsx`,
  `src/components/ReportPanel.tsx`, and `src/styles.css`.
- Extend unit, persistence, component, fixture, and production Playwright tests.
- Create the 4.3 overview; append Phase 4 context and progress.

### Dependencies

Component 4.2; existing `makeOrder`, successful-service, `finishRush`,
`closeDay`, save validation, RushPanel, and ReportPanel paths.

### Technical validation

Static integration tracing confirms `makeOrder` already reads current plan
prices and adds existing modifier surcharges; `progressService` is the sole
successful-sale revenue mutation; `finishRush` copies that revenue into the
report; and `closeDay` settles `closingCashCents`. No economic formula change or
external assumption is needed. Compatibility remains schema version 2 because
the new bounded field is defaulted when absent and fully validated when present.

### Acceptance criteria

- Actual charges use amended base plus exact modifier surcharges with no formula
  fork.
- Only successful completed services create observations and revenue; the
  observation window is bounded and safe to import/reload.
- Visible rush/report charge evidence resolves the amended-price perception and
  sums to revenue; report/settlement cash is exact.
- Old schema-v2 saves still load and new active-rush/report observations
  round-trip.
- Desktop and 360px Playwright execute repeated $0.10 presses, reload,
  single-drink service, modifiers, revenue, and cash reconciliation.

## Component 4.4 — Phase Validation and Documentation

### Runtime outcome

Phase 4 has truthful cumulative PASS evidence and a downstream-ready handoff;
all released campaign, persistence, accessibility, PWA, desktop, and mobile
behavior remains green.

### Deliverables

- Run exactly, in order:
  `pnpm install --frozen-lockfile`; `pnpm build`; `pnpm lint`; `pnpm test`;
  `pnpm test:e2e`.
- Fix all failures; automate the named desktop/mobile manual flows; self-review
  source/tests for TODO, FIXME, placeholders, unbounded observations, duplicate
  pricing formulas, and required behavior hidden behind test seams.
- Write `docs/phase-4-test-report.md` only if the full sequence passes; finish
  all Phase 4 overviews/context/progress/team-state/runbook updates.
- Commit as `feat(phase-4): Component 4.4 — <name>` and push `phase-4`; do not
  merge `main` and do not begin Phase 5.

### Files and interfaces

- `docs/phase-4-test-report.md`, `docs/implementation-context-phase-4.md`
- `docs/components/phase-4-component-4-4-overview.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`,
  `docs/agent-runbook.md`, plus any Phase 4-owned source/test fix required for a
  passing gate.

### Dependencies

Components 4.1–4.3 and every retained Phase 1–3 validation target.

### Technical validation

The exact sequence and browser projects are fixed by `docs/project-profile.md`.
A PASS claim requires both configured production Playwright projects and no
intentional skip of a Phase 4 scenario in its target environment.

### Acceptance criteria

- Every Phase 4 and retained test passes in the exact sequence.
- Test report records commands, environments, counts, regression evidence,
  manual-flow automation, compatibility, and self-review truthfully.
- All component overviews and implementation context expose downstream
  contracts/gotchas in one read.
- Component commits exist and `phase-4` is pushed without merge or Phase 5 work.
