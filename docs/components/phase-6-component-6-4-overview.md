# Component 6.4 — Campaign-Unique Staff Names

## What was delivered

A user can now encounter four readable, exact-name-unique candidates on every
day from Day 1 through endless Day 10,000. The allocation is reproducible for a
campaign seed, requires no seen-name history, remains unique across hires and
rejected candidates, and safely repairs compatible saves containing old name
collisions.

## Public interfaces / contracts exposed

- `staffNames.ts` exports `candidateStaffOrdinal`, `candidateStaffName`,
  `staffNameAtOrdinal`, and `reservedStaffName` plus the supported day,
  candidate, tier, namespace, and repair-range constants.
- Candidate ordinal is exactly `(day - 1) × 4 + index`. Each 4,096-name tier is
  a seed-keyed affine permutation with an odd multiplier; 16 display-disjoint
  tiers provide 65,536 names. Ordinals 0–39,999 are candidate-only and
  40,000–65,535 are migration-only.
- `candidatePoolForDay(seed, day)` retains its public signature, IDs, role
  balance, stat ranges, wage calculation, traits, and historical PRNG draw
  order. It rejects days outside 1–10,000.
- Schema-v3 import normalizes hires first and candidates second in stable order.
  The first exact occurrence is retained; later duplicates receive an unused
  seed-keyed reserved name. All original unique names and every non-name field
  remain unchanged.
- Save validation rejects duplicate IDs and requires exact names to be unique
  across the combined hired/candidate records after normalization.

## Files owned

- `src/game/staffNames.ts`, `src/game/engine.ts`, `src/game/index.ts`
- `src/persistence/saveStore.ts`
- `tests/unit/staff-names.test.ts`, `tests/unit/operations.test.ts`,
  `tests/unit/persistence.test.ts`, `tests/unit/campaign.test.ts`
- `tests/components/game-loop.test.tsx`, `tests/e2e/staff-names.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-6-component-6-4-overview.md`,
  `docs/implementation-context-phase-6.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm test`,
then `pnpm test:e2e`. Focus the allocation and production journeys with:

```bash
pnpm exec vitest run tests/unit/staff-names.test.ts tests/unit/persistence.test.ts
pnpm exec playwright test tests/e2e/staff-names.spec.ts
```

The finalized component passed the exact profile sequence with 119 Vitest/RTL
tests and 47 Playwright browser passes; seven configured project cases were
intentionally skipped.

## Integration notes & gotchas

- Never add a persisted seen-name collection or rejection sampling. Direct
  ordinal allocation is the uniqueness authority.
- The first 4,096 names intentionally have no middle initial. Later tiers use a
  tier-specific initial, making equal given/surname pairs exact-name distinct.
- The 12 pre-component curated names are deliberately outside the generated
  component set. They remain valid imported identities and may be retained as
  the first occurrence during migration.
- Candidate generation still consumes the old unused 12-way name draw. This is
  intentional compatibility behavior that keeps speed, skill, wage, and trait
  sequences identical to earlier releases.
- Duplicate repair excludes every original exact name before allocating from
  the reserved range, so a repair can never steal a later person's otherwise
  unique imported name. Matching is exact and case-sensitive.
- `serializeEnvelope` writes the normalized representation. Repair metadata is
  never persisted; only the bounded names on the existing 8+4 people records
  are stored.
