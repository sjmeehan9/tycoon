# Component 4.4 — Phase Validation and Documentation

## What was delivered

A user can now rely on a cumulatively validated Phase 4 release whose exact
planner increments, actual sale charges, report revenue, closing cash, settled
cash, persistence, desktop behavior, and 360px touch behavior all pass the
production validation gate.

## Public interfaces / contracts exposed

- `docs/phase-4-test-report.md` is the cumulative Phase 4 PASS verdict and maps
  the exact profile sequence to acceptance evidence.
- The supported planner contract is cents/packages only: prices step 10 cents
  within 250–1,200; purchases step one package within 0–20.
- `RushState.recentActivity` remains the bounded, schema-v2-compatible precursor
  that Phase 6 may widen into one rush activity union. It is observation state,
  not the revenue ledger.

## Files owned

- `tests/components/planner-controls.test.tsx`
- `tests/e2e/planner-controls.spec.ts`
- `docs/phase-4-test-report.md`
- `docs/components/phase-4-component-4-4-overview.md`
- `docs/implementation-context-phase-4.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`,
  `docs/agent-runbook.md`

## How to run / verify

Run the exact five-command validation sequence in `docs/project-profile.md`.
The verified result is 76 Vitest/RTL tests and 33 applicable Playwright
journeys across desktop/touch-mobile, with seven intentional project-routing
skips. For only the Phase 4 production flows, run
`pnpm exec playwright test tests/e2e/planner-controls.spec.ts`.

## Integration notes & gotchas

- Do not add another pricing calculation. `makeOrder` is authoritative; surface
  the engine-recorded `priceCents` when sale evidence is needed.
- Do not convert stepper actions back to absolute UI assignments. Relative
  commands derive from current immutable engine state and guarantee one exact
  increment for every accepted activation.
- A high-throughput rush can exceed the 20-observation window. UI must label the
  subset as recent and must not equate its subtotal to full revenue. Phase 6
  should widen this same bounded stream instead of introducing a parallel log.
- The optional numeric seed field on the title screen is intentionally outside
  planner scope.
