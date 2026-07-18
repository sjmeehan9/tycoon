# Component 6.5 — Cumulative QA, Documentation, and Release Evidence

## What was delivered

A user can now play the approved Phase 6 release at
`https://sjmeehan9.github.io/tycoon/` with cumulatively verified living-rush
feedback, campaign-unique people, actual pricing, dated stock, campaign,
persistence, responsive, accessibility, installability, and offline behavior.

## Public interfaces / contracts exposed

- `docs/phase-6-test-report.md` is the cumulative **HOSTED PASS** verdict and
  maps both the exact local gate and the direct-public desktop/touch runs.
- `docs/phase-6-release-evidence.md` records PR #3, merge
  `2ddf8994866660caf37aa89a39618edcb15e67dd`, Pages run/deployment identity,
  public artifact digests, browser journeys, worker/offline state, runtime
  origins, and non-blocking workflow annotations.
- The operational validation contract remains the exact five-command sequence
  in `docs/project-profile.md`; focused commands never replace it.
- The hosted release contract is the exact merge SHA plus the public `/tycoon/`
  subpath; a later release must establish new deployment and hosted evidence.

## Files owned

- `docs/phase-6-test-report.md`, `docs/phase-6-release-evidence.md`
- `docs/components/phase-6-component-6-5-overview.md`
- `docs/implementation-context-phase-6.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`,
  `docs/agent-runbook.md`

## How to run / verify

Open `https://sjmeehan9.github.io/tycoon/`, then review
`docs/phase-6-release-evidence.md` for the exact deployed identity and public
matrix. Locally run, in order: `pnpm install --frozen-lockfile`, `pnpm build`,
`pnpm lint`, `pnpm test`, and `pnpm test:e2e`. The local boundary passes 119
Vitest/RTL tests and 47 applicable Playwright journeys; the direct-hosted
existing/focused runs pass 44+3 applicable cases respectively.

The hosted desktop and touch captures are runtime artifacts rather than golden
files. Both were visually inspected during the recorded hosted audit.

## Integration notes & gotchas

- The reviewed feature head is `c14bd24`; normal PR #3 merge `2ddf899` is the
  deployed release identity.
- Phase 6 adds no dependency and retains schema 3. Activity is bounded feedback,
  Canvas playback is presentation-only, and staff-name allocation is stateless.
- Hosted update verification performs a real update check without fabricating a
  newer production worker. Local production PWA cases remain the waiting-worker
  defer/accept proof.
- The successful Pages workflow has non-blocking Node action-runtime warnings
  and one unsupported upload-artifact input warning. See the release evidence
  before changing action pins or artifact behavior.
- This evidence branch documents the already-approved deployment only; it does
  not create or mutate a public release.
