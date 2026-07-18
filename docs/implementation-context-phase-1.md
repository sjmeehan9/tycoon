# Phase 1 Implementation Context

## Component 1.1 — Human Setup

- No accounts, credentials, environment variables, or external services are
  required for the playable-cart phase.
- Local prerequisites were verified: Node.js 22.13.1 and pnpm 10.15.0 satisfy
  the project profile.
- The implementation proceeds on `phase-1`; the protected `main` branch remains
  untouched.

## Component 1.2 — Complete Seeded Cart Day

- Replaced the bootstrap Python manifest with the pinned React 19.2.7, Vite
  8.1.5, TypeScript 6.0.3, Vitest 4.1.10, and Playwright 1.61.1 stack.
- Added a pure fixed-tick simulation with serializable PRNG state, arrivals,
  queueing, service, ingredient consumption, stockouts, abandonment, sales,
  satisfaction, waste, reputation, event choice, and cash reconciliation.
- React now routes typed commands through one controller and renders morning,
  rush, event, report, and reinvestment phases beside a functional Canvas cart.
- Added schema-version-1 browser persistence with primary and last-known-good
  keys. Phase transitions and five-second rush checkpoints autosave.
- The exact validation sequence passed with 15 unit/component tests and two
  complete-day Playwright projects (desktop and 360px touch-mobile).

### Design decisions

- A rush contains exactly 300 fixed 250ms ticks (75 simulated seconds).
- Monetary values are integer cents; ingredient values use recipe-native integer
  grams, millilitres, or servings.
- Display speed changes interval frequency only, so 1x/2x/4x reports are equal.
- Phase 1 uses a small four-drink menu while retaining stable public types for
  the Phase 2 expansion.
