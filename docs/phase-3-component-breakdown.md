# Phase 3 Component Breakdown — Lean Pointer Contract

## Authority

The complete specifications are the matching Component 3.1–3.5 sections,
Phase 3 validation targets, and Phase 3 acceptance criteria in
`docs/phase-plan.md`, plus every retained earlier behavior and the approved
root-conversation plan. This skeleton replaces Tech Lead refinement solely
because the user prohibited that role.

## Ownership

The same sole Implement agent owns application/test/assets/configuration under
`src/**`, `public/**`, `tests/**`, TypeScript manifests/configs,
`.github/workflows/**`, `README.md`, `LICENSE`, final runbook/release files,
Phase 3 component overviews, `docs/implementation-context-phase-3.md`, and
`docs/phase-3-test-report.md`. Generated agent/skill definitions and approved
planning documents remain read-only.

## Component specifications

- **3.1 — Human Setup & Public Release Gate:** use the matching phase-plan
  section. Prepare everything privately; repository visibility and Pages
  publication wait for the human gate.
- **3.2 — Cohesive Pixel Scene and Local Audio:** the matching section is the
  full specification. Use the available image-generation skill for original
  raster pixel assets when it improves quality, retain provenance/prompts, and
  do not use copyrighted third-party media.
- **3.3 — Onboarding, Accessibility, and Mobile Polish:** the matching section
  is the full accessible vertical-slice specification.
- **3.4 — Offline-Safe PWA and Release Artifacts:** the matching section is the
  full PWA/update/subpath/documentation/workflow specification.
- **3.5 — Cumulative QA, Phase Documentation, and Public Verification:** the
  matching section, all Phase 3 Validation Targets, and Acceptance Criteria are
  the full cumulative specification. The Implement agent owns all tests, fixes,
  self-review, Lighthouse evidence, PASS report, context, and runbook.

## Technical validation

Re-check Vite PWA configuration (`https://vite-pwa-org.netlify.app/guide/`),
GitHub Pages Actions (`https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages`), Vite `/tycoon/` base behavior,
and relevant accessibility/browser APIs before implementation. No publication
occurs before the human gate.

## Definition of done

Every cumulative requirement and validation target passes locally; required
art/audio/accessibility/PWA/release artifacts are complete; the exact validation
sequence and applicable Lighthouse budgets pass; no placeholder/TODO remains;
the Phase 3 report records local PASS and, after the human gate, hosted PASS.
