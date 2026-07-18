# Component 6.1 — Human Setup and Final Release Gate

## What was delivered

A user can now rely on a complete Phase 6 implementation/validation contract,
with local work unblocked and the final public release protected by one explicit
human approve/reject and hosted-confirmation gate.

## Public interfaces / contracts exposed

- `docs/phase-6-component-breakdown.md` is the binding detailed Phase 6
  component authority beneath the approved root directive.
- Local Components 6.2–6.5 require no human setup or approval pause.
- Component 6.5 may record local PASS and push `phase-6`; only a human-approved
  merge/Pages deployment can unlock hosted verification and hosted PASS.
- Candidate-name uniqueness is a stateless indexed/permuted namespace, not a
  persisted displayed-name history.

## Files owned

- `docs/phase-6-component-breakdown.md`
- `docs/implementation-context-phase-6.md`
- `docs/components/phase-6-component-6-1-overview.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`

## How to run / verify

Confirm `git branch --show-current` prints `phase-6`, `git status --short` is
clean before implementation, and the branch starts at Phase 5 PASS head
`212232c`. No local environment action is required beyond the existing profile.

## Integration notes & gotchas

- Preserve schema version 3 unless a genuine incompatible state shape requires
  otherwise; compatible missing activity/name fields normalize in place.
- Activity events are presentation evidence, never an accounting ledger.
- Renderer time and staff-name allocation must never consume simulation PRNG or
  change economy outcomes.
- Do not merge/publish `main` or claim hosted PASS from this branch.
