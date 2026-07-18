# Component 6.5 — Cumulative QA, Documentation, and Release Evidence

## What was delivered

A user can now rely on a cumulatively validated local Phase 6 candidate whose
living-rush feedback, campaign-unique people, actual pricing, dated stock,
campaign, persistence, responsive, accessibility, and PWA contracts all pass.
The unmerged public release remains protected by an explicit human gate.

## Public interfaces / contracts exposed

- `docs/phase-6-test-report.md` is the cumulative **LOCAL PASS — HOSTED
  PENDING** verdict and maps the exact local gate to activity, scene, name,
  compatibility, performance, automated-manual, and self-review evidence.
- `docs/phase-6-release-evidence.md` records the local candidate identity and
  immutable pending fields for approval, merge, Pages, public refresh, desktop,
  360px, activity/name, autosave, service worker, and offline verification.
- The operational validation contract remains the exact five-command sequence
  in `docs/project-profile.md`; focused commands never replace it.
- Hosted PASS may be recorded only against the exact human-approved deployed
  commit after every pending hosted field is verified.

## Files owned

- `docs/phase-6-test-report.md`, `docs/phase-6-release-evidence.md`
- `docs/components/phase-6-component-6-5-overview.md`
- `docs/implementation-context-phase-6.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`,
  `docs/agent-runbook.md`

## How to run / verify

Run, in order: `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`,
`pnpm test`, and `pnpm test:e2e`. The completed local boundary passes 119
Vitest/RTL tests and 47 applicable Playwright production journeys, with seven
intentional project-routing skips across desktop and touch-mobile.

Review the two final static captures under `test-results/living-rush-*`, then
follow the pending checklist in `docs/phase-6-release-evidence.md` only after
the repository owner approves merge/publication.

## Integration notes & gotchas

- The validated feature head before this documentation record is `cea3cc0`.
- Phase 6 adds no dependency and retains schema 3. Activity is bounded feedback,
  Canvas playback is presentation-only, and staff-name allocation is stateless.
- `origin/main` remains the prior public baseline. The existing public URL does
  not demonstrate Phase 6 until the approved merge deploys it.
- Do not edit the reports to **HOSTED PASS** merely because local production
  tests pass. Record the PR, merge SHA, Pages run/deployment, public desktop and
  touch flows, activity/name behavior, refresh/autosave, worker update, offline
  continuation, and runtime health first.
- Component 6.5 stops at a clean pushed `phase-6` branch and returns control to
  the human final release gate. It does not merge or publish.
