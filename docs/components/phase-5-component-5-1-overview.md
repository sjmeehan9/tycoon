# Component 5.1 — Human Setup and Phase Contracts

## What was delivered

A user-facing Phase 5 implementation can now proceed from the validated Phase 4
head with exact batch-expiry, LIFO, migration, capacity, live-stock, reporting,
validation, ownership, and merge-gate contracts and no setup dependency.

## Public interfaces / contracts exposed

- `docs/phase-5-component-breakdown.md` is the complete component authority.
- Normal `expiresAfterDay` is purchase day + 2, inclusive through that rush.
- Refrigeration protects dairy, oat, soy, and cold-brew concentrate by +1/+2
  days at tiers 1/2; true LIFO consumes newest stock first.
- Legacy flat stock migrates as current-day full-life batches; weighted capacity
  is always marked approximate with `~`.

## Files owned

- `docs/phase-5-component-breakdown.md`
- `docs/implementation-context-phase-5.md`
- `docs/components/phase-5-component-5-1-overview.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`

## How to run / verify

Read the breakdown in order and verify `docs/phase-progress.json` records 5.1 as
committed while 5.2–5.5 and every Phase 6 component remain queued. No command,
account, secret, environment file, or third-party console action is required.

## Integration notes & gotchas

- Batches are canonical. A second mutable flat inventory is prohibited; expose
  exact totals through pure selectors.
- Expiry happens after the last usable rush, not before it. Equipment upgrades
  can extend surviving chilled stock but cannot revive an expired batch.
- Old reports lacking lifecycle evidence must remain honest (`null`) instead of
  receiving invented historical quantities.
- Component 5.5 must stop after pushing `phase-5`; Phase 6 starts only under a
  separate coordinator instruction.
