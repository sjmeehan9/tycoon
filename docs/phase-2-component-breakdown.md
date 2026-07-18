# Phase 2 Component Breakdown — Lean Pointer Contract

## Authority

The normal Tech Lead role is forbidden. The complete specifications are the
matching Component 2.1–2.5 sections, Phase 2 validation targets, and Phase 2
acceptance criteria in `docs/phase-plan.md`, plus all retained Phase 1 behavior,
the approved root-conversation plan, and `docs/requirements.md`.

## Ownership

The same sole Implement agent works sequentially and owns all application,
content, persistence, presentation, configuration, and test files needed under
`src/**`, `public/**`, `tests/**`, and root TypeScript manifests/configuration,
plus `docs/implementation-context-phase-2.md`, Phase 2 component overviews,
`docs/phase-2-test-report.md`, and runbook updates. Planning documents and
generated agent/skill definitions remain read-only.

## Component specifications

- **2.1 — Human Setup:** use the matching phase-plan section; no human setup is
  required before implementation.
- **2.2 — Full Coffee Trading Day:** the matching section is the full vertical
  specification for all drinks, recipes, inventory, segments, demand factors,
  weather/events, explanations, public contracts, and proof.
- **2.3 — Staff, Equipment, and Venue Growth:** the matching section is the full
  vertical specification; extend the same engine/UI/save path rather than
  creating parallel systems.
- **2.4 — Campaign Outcomes, Meta Progress, and Save Transfer:** the matching
  section is the full specification for win/loss/endless/meta and safe portable
  persistence.
- **2.5 — Phase Validation & Documentation:** the matching section, Phase 2
  Validation Targets, and Acceptance Criteria are the full cumulative spec.
  The Implement agent owns tests, fixes, self-review, PASS report, context, and
  runbook under the lean override.

## Technical validation

Re-check package compatibility and browser APIs against the primary sources
named in the Phase 1 pointer and MDN browser-storage/file APIs as needed. Use
only local browser capabilities; do not introduce a backend, telemetry, or
runtime external dependency. Report stale assumptions to the coordinator.

## Definition of done

Every Phase 2 and retained Phase 1 criterion/target passes, complete seeded
campaign simulations prove the required outcomes, save adversarial cases pass,
the exact validation sequence passes, no placeholder/TODO remains, and the
Phase 2 report records cumulative PASS.
