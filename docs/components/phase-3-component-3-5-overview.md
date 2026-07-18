# Component 3.5 — Cumulative QA, Phase Documentation, and Public Verification

## What was delivered

A user now has a locally validated release candidate with reproducible evidence
across the full campaign, desktop/mobile accessibility, offline/update safety,
subpath deployment, security, and performance; public verification is correctly
paused at the owner-controlled release gate.

## Public interfaces / contracts exposed

- `docs/phase-3-test-report.md` is the cumulative local verdict and the append
  target for hosted verification after approval.
- `docs/evidence/lighthouse-mobile.json` is the raw mobile audit artifact;
  `docs/evidence/release-audit.md` records its checksum, scores, bundle, cache,
  security, privacy, and workflow findings.
- `pnpm audit:lighthouse` runs exact Lighthouse 12.8.2, the newest version
  compatible with the approved Node 22.12 baseline.
- `docs/release-runbook.md` and `docs/public-release-checklist.md` are the human
  contract for protected merge, visibility, Pages enablement, deployment,
  hosted verification, and recovery.

## Files owned

- `src/pwa/PwaUpdatePrompt.tsx`, `src/styles.css`
- `tests/e2e/pwa.spec.ts`, `tests/e2e/accessibility.spec.ts`
- `package.json`, `pnpm-lock.yaml`
- `docs/evidence/lighthouse-mobile.json`, `docs/evidence/release-audit.md`
- `docs/phase-3-test-report.md`, `docs/release-runbook.md`
- `docs/public-release-checklist.md`
- `docs/implementation-context-phase-3.md`, `docs/agent-team-state.md`,
  `docs/phase-progress.json`

## How to run / verify

Run the exact validation sequence in `docs/project-profile.md`, then follow the
two-terminal Lighthouse step in `docs/release-runbook.md`. Local evidence passes
70 Vitest tests, 29 applicable production Playwright journeys, and mobile scores
of 95 Performance / 100 Accessibility / 100 Best Practices.

## Integration notes & gotchas

- Lighthouse's scored PWA category is deprecated/not exposed. Chromium reports
  zero manifest/installability errors, and Playwright uses a real generated
  worker to prove caching, offline relaunch, defer, activation, and recovery.
- The live offline-ready element is a neutral `div role="status"`; Lighthouse
  caught and the component corrected an incompatible role override on `aside`.
- Responsive evidence checks the rainy forecast badge's actual bounding box at
  360px, because a root scroll-width check alone can hide visual overshoot when
  the body clips horizontal overflow.
- The complete lockfile audit is clean. Lighthouse remains transient because
  the current CLI's retained dependency tree carries an unrelated QA-only
  advisory and its Node floor exceeds the project baseline.
- Local PASS is not hosted PASS. No push, merge, visibility, Pages setting,
  workflow run, deployment, or public URL mutation was performed.
