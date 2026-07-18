# Component 1.2 — Complete Seeded Cart Day

## What was delivered

A user can now start a seeded cart campaign, set a representative Australian
coffee menu and prices, buy supplies, choose an espresso dial-in, control a
75-second rush, resolve a meaningful event, inspect a reconciled report,
reinvest, and enter the following day.

## Public interfaces / contracts exposed

- `src/game/index.ts` exports the serializable game contracts and pure commands:
  `createCampaign`, `prepareDay`, `startRush`, `advanceTick`, `resolveEvent`,
  `closeDay`, `buyImprovement`, `startNextDay`, and `continueEndless`.
- `dispatchGameCommand` is the single typed UI command path.
- `BrowserSaveStore` stores schema-version-1 `SaveEnvelope` values with a
  last-known-good backup.

The engine uses 250ms fixed ticks, integer money and ingredient quantities, and
a serializable xorshift PRNG. Rush speed never enters an engine calculation.

## Files owned

- Root TypeScript/Vite/Vitest/Playwright/ESLint/Prettier manifests and lockfile.
- `src/game/**`, `src/content/**`, `src/app/**`, `src/components/**`,
  `src/persistence/**`, `src/scene/**`, `src/App.tsx`, and presentation styles.
- `tests/unit/**`, `tests/components/**`, and `tests/e2e/cart-day.spec.ts`.
- The obsolete `pyproject.toml` was removed.

## How to run / verify

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

`pnpm dev` opens the playable cart locally. Playwright uses desktop Chromium and
a 360px touch-mobile Chromium project.

## Integration notes & gotchas

- Browser autosaves are deliberately isolated from the pure engine.
- An event pauses the engine and must be resolved before ticks continue.
- `closeDay` returns the already-settled state unchanged when repeated.
- Phase 1 intentionally exposes four representative drinks; complete content,
  staff, equipment, venues, and campaign endings arrive in Phase 2.

