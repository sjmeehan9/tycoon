# Phase 1 Component Breakdown — Lean Pointer Contract

## Authority

This skeleton exists because the normal Tech Lead role is forbidden by the
user's lean-team condition. The complete, approved specifications are the
matching Component 1.1–1.4 sections, Phase 1 validation targets, and Phase 1
acceptance criteria in `docs/phase-plan.md`, interpreted through the approved
root-conversation plan and `docs/requirements.md`. Nothing in this pointer may
reduce that scope.

## Ownership

The sole Implement agent works sequentially and owns, for Phase 1:

- Creation/modification of `package.json`, `pnpm-lock.yaml`, `index.html`,
  TypeScript/Vite/ESLint/Playwright/Vitest/PWA-adjacent configuration needed by
  this phase, `src/**`, `public/**`, and `tests/**`.
- Removal of the obsolete bootstrap `pyproject.toml` and empty Python layout.
- `docs/implementation-context-phase-1.md`,
  `docs/components/phase-1-component-*-overview.md`,
  `docs/phase-1-test-report.md`, and `docs/agent-runbook.md`.
- The agent must not modify generated agent/skill definitions or rewrite the
  approved requirements, brief, solution design, or phase plan.

## Component specifications

### Component 1.1 — Human Setup

The `docs/phase-plan.md` Component 1.1 section is the full specification. There
is no pre-implementation human task. Record the gate as not applicable.

### Component 1.2 — Complete Seeded Cart Day

The matching phase-plan section is the full vertical-slice specification,
including every inclusion, essential proof, exclusion, and dependency. Deliver
the real stack, engine, UI, Canvas scene, representative content, persistence,
and tests together; no layer-only intermediate state counts as complete.

### Component 1.3 — Responsive Autosaved Continuation

The matching phase-plan section is the full specification. Extend the running
slice through real responsive controls and exact-once restore behavior.

### Component 1.4 — Phase Validation & Documentation

The matching phase-plan section, Phase 1 Validation Targets, and Phase 1
Acceptance Criteria are the full specification. Under the lean override, the
same Implement agent writes/fixes/runs all tests, self-reviews, writes the PASS
report and context/runbook, and commits the validated phase components.

## Technical validation

Before coding, re-check the currently approved assumptions against primary
sources: React 19.2 documentation (`https://react.dev/versions`), Vite 8.1 and
static deployment (`https://vite.dev/releases`,
`https://vite.dev/guide/static-deploy`), and Playwright device emulation
(`https://playwright.dev/docs/emulation`). Pin compatible stable packages in the
lockfile. Any genuinely stale assumption is reported to the coordinator; no
other agent is spawned.

## Definition of done

Every Phase 1 acceptance criterion and validation target passes through the
production runtime, the exact project-profile validation sequence passes, no
placeholder/TODO remains, required docs exist, and the phase report records
PASS.
