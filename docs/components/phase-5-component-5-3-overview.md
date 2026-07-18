# Component 5.3 — Weighted Planning Capacity

## What was delivered

A user can now see the exact usable amount after each selected supply purchase,
an honestly approximate weighted serve capacity, whether an ingredient is
unused by today's menu, and the earliest quantity/day at risk of expiry. Every
estimate updates immediately when menu, price, bean, milk, or package choices
change.

## Public interfaces / contracts exposed

- `segmentForDraw`, `sizeForDraw`, and `milkForDraw` are now the simulation's
  shared deterministic order-draw authorities. Their matching probability
  functions expose the exact distributions used by capacity forecasts.
- `baseDrinkChoiceWeight` exposes the engine's segment appeal, price, and
  weather weighting without stock suppression.
- `weightedIngredientUse(state)` returns expected ingredient units per served
  order across the current menu mix. It applies segment shares, normalized
  drink weights, sizes, milk modifiers, recipes, and selected-bean substitution.
- `ingredientCapacities(state)` returns a stable row for every purchased
  ingredient: identity/name/unit, carried and pending quantities, usable total,
  expected units per serve, floored `estimatedServes`, menu relevance, limiting
  state, and earliest expiry. Pending purchases count only during planning.
- `formatIngredientQuantity` is the shared exact quantity/unit formatter.

## Files owned

- `src/content/gameContent.ts`, `src/game/demandModel.ts`, `src/game/capacity.ts`
- `src/game/engine.ts`, `src/game/index.ts`
- `src/components/Planner.tsx`, `src/styles.css`
- `tests/unit/capacity.test.ts`, `tests/components/planner-controls.test.tsx`,
  `tests/e2e/stock-lifecycle.spec.ts`
- `docs/components/phase-5-component-5-3-overview.md`,
  `docs/implementation-context-phase-5.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm build`, `pnpm lint`, `pnpm test`, then
`pnpm exec playwright test tests/e2e/stock-lifecycle.spec.ts`. The completed
boundary passes 92 Vitest/RTL tests and both desktop and touch-mobile focused
production browser projects.

## Integration notes & gotchas

- Capacity forecasts model intended demand, deliberately excluding the
  engine's current-stock choice suppression. This avoids circularly presenting
  zero stock as zero demand while preserving the exact configured mix.
- `estimatedServes` is always floored and must be displayed with `~`; it is a
  weighted planning estimate, not an exact order promise.
- `postPurchaseQuantity` and `usableQuantity` are presently equal. Both names
  are retained in the typed contract so planning and rush consumers can state
  their intent without reconstructing inventory.
- `isLimiting` may identify multiple tied ingredients. `not used today` is
  represented by `estimatedServes: null`, never by an invented zero estimate.
- The selector is pure and finite, and neither advances the PRNG nor mutates
  inventory. It is safe to derive directly from every immutable game snapshot.
