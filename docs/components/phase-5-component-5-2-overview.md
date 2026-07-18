# Component 5.2 — Schema-v3 Perishable Batch Inventory

## What was delivered

A user can now carry dated ingredient batches across days, consume newest stock
first, use each batch through its final eligible rush, see expired remainder
recorded as waste, install refrigeration that extends surviving chilled stock,
and reload/import/recover without losing progress or creating stock.

## Public interfaces / contracts exposed

- `InventoryBatch { quantity; acquiredDay; expiresAfterDay }` uses an inclusive
  last-usable day. `IngredientInventory` maps every ingredient to batches;
  `IngredientTotals` is derived output only.
- `addPlannedPurchases`, `consumeIngredientsLifo`, `hasIngredients`,
  `expireInventoryAfterRush`, `extendInventoryRefrigeration`,
  `inventoryTotals`, `ingredientQuantity`, `plannedPurchaseTotals`, and expiry
  helpers are pure public game APIs.
- `InventoryLifecycleReport` conserves complete opening, purchased, consumed,
  expired, and remaining totals. Legacy reports expose `null` because their
  historical lifecycle cannot be reconstructed honestly.
- Game/save state is version 3. Current keys are
  `laneway-tycoon.save.v3`/`laneway-tycoon.save.backup.v3`; v2 and v1 primary/
  backup keys remain migration inputs and are cleared with current saves.
- `INGREDIENT_DETAILS` centralizes names, units, three-rush shelf life, and the
  chilled set: dairy, oat, soy, and cold-brew concentrate.

## Files owned

- `src/game/types.ts`, `src/content/gameContent.ts`, `src/game/inventory.ts`
- `src/game/engine.ts`, `src/game/selectors.ts`, `src/game/index.ts`
- `src/persistence/saveStore.ts`
- `tests/unit/inventory.test.ts`, `tests/unit/engine.test.ts`,
  `tests/unit/operations.test.ts`, `tests/unit/persistence.test.ts`,
  `tests/unit/campaign.test.ts`, `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-5-component-5-2-overview.md`,
  `docs/implementation-context-phase-5.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm build`, `pnpm lint`, `pnpm test`, then
`pnpm exec playwright test tests/e2e/persistence.spec.ts tests/e2e/save-transfer.spec.ts`.
The verified result is 86 Vitest/RTL tests and ten focused production browser
passes across desktop and touch-mobile.

## Integration notes & gotchas

- Never write or persist a second mutable flat inventory. Use
  `ingredientQuantity`/`inventoryTotals` for exact totals.
- `expiresAfterDay` is inclusive. Expiry runs after service, so Day 1 stock can
  serve Days 1–3 before its remainder is removed after the Day 3 rush.
- Buying refrigeration during reinvestment extends only still-retained chilled
  batches by the tier delta. It cannot revive stock removed by the prior rush.
- LIFO reservation occurs when service starts, matching live stock depletion.
  Completed sales remain recorded later at the existing successful-service
  boundary; Phase 4 pricing/accounting behavior is unchanged.
- Schema-v2 active rush opening stock is reconstructed as current + consumed +
  prior waste − purchased. Its canonical inventory still migrates as current-
  day full-life batches per the locked compatibility rule.
