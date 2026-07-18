# Component 4.2 — Exact Accessible Planner Steppers

## What was delivered

A user can now change every enabled price by exactly $0.10 and every supply
order by exactly one package using non-editable, accessible minus/value/plus
controls that autosave and work by keyboard, pointer, or touch at 360px.

## Public interfaces / contracts exposed

- `DAY_PLAN_LIMITS` centralizes the price and package bounds/increments used by
  both UI and engine validation.
- `adjustPlanPrice(state, drinkId, direction)` and
  `adjustPlanPurchase(state, ingredientId, direction)` are public pure engine
  functions. The matching `GameCommand` variants are `adjustPlanPrice` and
  `adjustPlanPurchase`; `direction` is `-1 | 1`.
- `AccessibleStepper` renders the reusable semantic control. Consumers provide
  visible value text, full button labels, disabled states, and callbacks.

## Files owned

- `src/components/AccessibleStepper.tsx`, `src/components/Planner.tsx`
- `src/content/gameContent.ts`, `src/game/types.ts`, `src/game/engine.ts`,
  `src/game/index.ts`, `src/styles.css`
- `tests/unit/engine.test.ts`, `tests/components/planner-controls.test.tsx`,
  `tests/e2e/planner-controls.spec.ts`
- `docs/components/phase-4-component-4-2-overview.md`,
  `docs/implementation-context-phase-4.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm test`, then
`pnpm exec playwright test tests/e2e/planner-controls.spec.ts`. In the game,
start a campaign and inspect Menu/Supplies: there are no number fields; every
active value is between native minus/plus buttons, and reload restores the
latest planning value.

## Integration notes & gotchas

- Relative commands deliberately derive from current engine state. Do not
  replace them with `prepareDay` patches calculated from a rendered value; that
  would reintroduce lost rapid activations.
- Price buttons are both disabled for drinks outside the active menu but retain
  the saved price ready for later selection. Supply increments may still be
  rejected by the existing cash/overdraft rule before the numeric maximum; the
  current value remains and the normal actionable message is shown.
- Phase 4 retains save schema 2. The planner fields already persisted as integer
  cents/packages, so no migration is required.
