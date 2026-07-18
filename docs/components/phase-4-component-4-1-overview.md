# Component 4.1 — Human Setup and Phase Contracts

## What was delivered

The approved `phase-4` branch can now proceed without manual setup against a
complete six-phase/28-component contract and detailed Phase 4 implementation
specification.

## Public interfaces / contracts exposed

- `docs/phase-4-component-breakdown.md` is the complete Component 4.1–4.4
  implementation, test, compatibility, documentation, and commit contract.
- `docs/phase-plan.md` contains the additive Phase 4–6 outcomes, components,
  validation targets, acceptance criteria, and traceability.
- `docs/project-profile.md` authorizes `phase-4` through `phase-6`, predecessor
  PASS branching, per-phase human merge approval, and the Phase 6 hosted gate.
- `docs/phase-progress.json` is the lifecycle record for all 28 components.

## Files owned

- `docs/project-profile.md`, `docs/phase-plan.md`
- `docs/phase-4-component-breakdown.md`, `docs/phase-progress.json`
- `docs/implementation-context-phase-4.md`
- `docs/components/phase-4-component-4-1-overview.md`
- `docs/agent-team-state.md`

The coordinator-authored `docs/phase-4-6-lean-contract.md` was preserved as the
additive authority pointer.

## How to run / verify

Confirm the current branch is `phase-4`; validate that the plan has Phase 1–6
headings and 28 matching component sections; parse `docs/phase-progress.json`;
then follow Component 4.2 in the Phase 4 breakdown.

## Integration notes & gotchas

- Phase 4 has no human setup gate before code. Its only human action is
  approving or rejecting merge after Component 4.4 PASS.
- Phase 4 must retain schema version 2; Phase 5 owns schema-v3 batch inventory.
- Phase 6 will evolve Component 4.3's minimal completed-sale observation into
  its canonical bounded rush activity stream, so Phase 4 must not add a second
  permanent transaction ledger.
