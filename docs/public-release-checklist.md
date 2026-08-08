# Laneway Tycoon Phase 8 Public Release Checklist

This checklist separates the local candidate, cumulative phase gate, protected
merge, publication, and hosted verification. Component 8.8 prepares evidence
only; it does not merge or publish.

## Component 8.8 candidate readiness

Component 8.8 passed its immutable Tier 2 gate at commit
`86b99e93c52d9102e5af7d013d3b67674b1273e5` and scoped fingerprint
`292d06c8b4260cc1500474c90ca13b27f10a40bd21ae07ca047d0a1b19619e3b`.
Component 8.9 independently consumes and supersedes these release-readiness
facts through its cumulative gate.

- [x] The production build uses `/tycoon/` manifest, scope, start URL, and asset
      paths.
- [x] The generated canonical precache contains the complete runtime graph with
      no duplicate URL and no file of 1,000,000 bytes or more.
- [x] Every precached file returns 200 offline after one successful online load.
- [x] Warm and cold offline reload preserve the exact schema-v4 continuation.
- [x] A dense department rush can resume, finish, settle once, and continue to
      the next planning day entirely offline.
- [x] Active-service update controls cannot activate or reload the waiting
      worker, and dismissing the prompt does not queue activation.
- [x] Safe-phase acceptance verifies a fresh schema-v4 checkpoint, activates the
      waiting worker, and restores all persisted gameplay, preferences, and meta
      content exactly after reload; only top-level `savedAt` is intentionally
      refreshed monotonically.
- [x] Automated 1280×800 desktop and 360×780 DPR-2 touch-emulation evidence
      records its environment and meets the configured FPS/p95 budgets.
- [x] Lighthouse mobile meets at least 90 in Performance, Accessibility, and
      Best Practices; PWA capability is proved by the browser suite because the
      installed Lighthouse version exposes no PWA category.
- [x] Production dependency security reports zero known vulnerabilities.
- [x] Production dependency licenses are MIT or BSD-3-Clause; no dependency was
      added for Component 8.8.
- [x] Source, production output, and browser request inspection find no runtime
      external API, remote asset, analytics, telemetry, advertising, secret, or
      personal-data path.
- [x] The title artwork remains byte-identical at SHA-256
      `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Component 8.9 cumulative phase gate

The authoritative mutable verdict belongs only in the fingerprint-excluded
`docs/phase-8-test-report.md`. These operator boxes remain unchecked until that
report identifies one unchanged global candidate as PASS; do not edit this
candidate-scoped checklist after the fingerprint freeze merely to duplicate the
verdict.

- [ ] `pnpm install --frozen-lockfile` passes for the frozen global fingerprint.
- [ ] `pnpm build`, `pnpm lint`, and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes all applicable desktop and touch-mobile journeys.
- [ ] Every Phase 8 validation target passes and is mapped in
      `docs/phase-8-test-report.md`.
- [ ] The final global fingerprint, commands, durations, and artifact paths are
      recorded as a Phase 8 PASS.

## Required human merge gate

- [ ] The repository owner explicitly approves the Phase 8 merge.
- [ ] The validated `phase-8` branch is pushed without force.
- [ ] A pull request into `main` identifies the exact validated commit.
- [ ] Required checks pass and the pull request is merged without bypassing the
      normal check workflow.

## Separate human publication gate

- [ ] After merge, the repository owner separately approves publication.
- [ ] GitHub Pages remains configured to use **GitHub Actions**.
- [ ] **Deploy Laneway Tycoon to Pages** publishes the approved `main` commit.
- [ ] The workflow run, commit, deployment ID, timestamp, and reported URL are
      recorded in the Phase 8 release evidence.

## Hosted verification

- [ ] Direct load and refresh succeed at
      `https://sjmeehan9.github.io/tycoon/` and every `/tycoon/` asset returns
      successfully.
- [ ] The manifest is installable and the service worker controls the page
      without console or registration errors.
- [ ] A forty-day Standard or Hard campaign can start and continue through all
      four venues with schema-v4 persistence intact.
- [ ] At 1280×800, service order is 3D scene, rush dashboard, activity, then
      stock, with all controls usable.
- [ ] At 360×780 touch-mobile, the compact 3D scene and complete rush dashboard
      share the initial viewport without document scrolling; activity and stock
      follow below.
- [ ] One online visit supports cold/warm offline reload and a fully offline
      service completion without duplicate settlement.
- [ ] A real waiting worker stays deferred during active service and restores
      the verified save after explicit safe-phase acceptance.

## Optional owner-only physical mobile evidence

- [ ] The repository owner elects to perform the optional hosted device check.
- [ ] Owner-supplied evidence records exact device model, OS/browser version,
      orientation, DPR, GPU/renderer, dense scene state, method, FPS, and p95.
- [ ] The owner-supplied dense-service result meets 30 FPS and all touch/layout
      interactions remain usable.

Status: **pending and unclaimed**. Agents do not access, reserve, identify, or
make claims about a physical device.

## Recovery

- [ ] Any failed hosted check stops the release and is recorded against the
      exact published commit.
- [ ] A fix uses the superseding-build process in `docs/release-runbook.md` and
      repeats validation, merge approval, publication approval, and hosted
      verification.
- [ ] An emergency last-known-good redeploy occurs only with explicit owner
      approval and proven schema-v4 compatibility; protected history and cached
      assets are never rewritten manually.
