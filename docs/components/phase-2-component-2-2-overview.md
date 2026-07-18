# Component 2.2 — Full Coffee Trading Day

## What was delivered

A user can now configure and trade a complete Australian specialty-coffee day,
with ten drinks, authentic fixed recipes, sizes, dairy/oat/soy modifiers, bean
selection, four customer segments, seeded weather and rush events, and causal
planner/report feedback that explains demand, service, satisfaction, waste, and
profit.

## Public interfaces / contracts exposed

- `src/game/types.ts` exposes the complete serialisable `GameState`, `DayPlan`,
  `Customer`, `SimulationEvent`, `DayReport`, drink/ingredient/variant, weather,
  and customer-segment contracts.
- `src/game/index.ts` exports the deterministic command engine and `demandRate`
  so tests and later components can vary demand factors independently.
- `src/content/gameContent.ts` exports the canonical menu, recipe, purchase,
  bean, weather, customer-appeal, venue-capacity, and economy tables plus the
  initial plan/inventory factories.
- Existing commands remain the runtime boundary: prepare a plan, start/advance
  a rush, resolve events, close the day, reinvest, and start the next day.

## Files owned

- `src/content/gameContent.ts` (replaces `src/content/phase1.ts`)
- `src/game/types.ts`
- `src/game/engine.ts`
- `src/game/index.ts`
- `src/game/selectors.ts`
- `src/components/Planner.tsx`
- `src/components/ReinvestPanel.tsx`
- `src/components/ReportPanel.tsx`
- `src/styles.css`
- `tests/unit/coffee-content.test.ts`
- `tests/unit/demand.test.ts`
- `tests/unit/engine.test.ts`
- `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/e2e/coffee-day.spec.ts`

## How to run / verify

Run the profile validation sequence from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

The component passes 26 Vitest tests and six Playwright project tests across
desktop Chromium and the 360px touch-mobile viewport.

## Integration notes & gotchas

- Simulation remains fixed-tick and seeded: identical state plus command input
  yields identical arrivals, orders, weather, events, and settlement.
- A venue's active-menu capacity is enforced by the engine, not only the UI.
- Alternative beans transparently replace the recipe's base bean inventory;
  oat/soy replace dairy where allowed and apply configured surcharges.
- Component 2.3 must extend this single engine, report, planner, and save shape;
  it must not create a second staffing, equipment, or venue simulation path.
