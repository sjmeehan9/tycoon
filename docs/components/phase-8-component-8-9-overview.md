# Component 8.9 — Cumulative Phase Gate, Publication, and Release Evidence

## What was delivered

A user can now play the complete locally validated Phase 8 campaign: schema-v4
reset, immutable Standard/Hard difficulty, forty days, four venues, commercial
equipment, department workforce and roles, parallel stations/lanes, dense 3D
service, complete causal history, and offline-safe PWA continuation all pass one
cumulative desktop/touch release gate.

The gate also removed pre-interaction audio transfers without changing consent
semantics. The title route creates no media handles before the first pointer or
keyboard interaction; after interaction, local sound/ambience preferences,
venue volume, transition cues, disposal, offline caching, and local-only assets
behave as before.

This is a **local automated PASS** only. The user's merge and publication
authorities are **APPROVED / RECEIVED**. Commit/PR/merge execution, publication
execution and deployment identity, owner-hosted gameplay, and optional
owner-only physical evidence remain separate pending dispositions.

## Public interfaces and contracts exposed

- No game/save/schema/content public API changed in Component 8.9.
- `BrowserAudioManager` retains its constructor and methods. `AudioDirector`
  now creates exactly one manager after first input and disposes that committed
  instance through a ref-backed cleanup path.
- Playwright runs one worker because renderer cadence is release evidence and
  must not compete with another browser worker.
- Parallel-service checks use auto-retrying rendered-section assertions and the
  runtime's existing 620px mobile-tab breakpoint.
- `docs/phase-8-test-report.md` is the sole authoritative mutable local verdict.
- `docs/phase-8-release-evidence.md` separates local, deployment, hosted, and
  physical evidence. The phase report and progress state distinguish the two
  received human authorities from pending release execution and evidence.

## Files owned

Runtime/test/configuration gate repairs:

- `src/audio/AudioDirector.tsx`
- `playwright.config.ts`
- `tests/components/presentation.test.tsx`
- `tests/e2e/cart-day.spec.ts`
- `tests/e2e/department-workforce.spec.ts`
- `tests/e2e/parallel-service.spec.ts`
- `tests/e2e/presentation.spec.ts`

Reconciled candidate documentation:

- `README.md`
- `docs/agent-runbook.md`
- `docs/brief.md`
- `docs/implementation-context-phase-8.md`
- `docs/public-release-checklist.md`
- `docs/release-runbook.md`
- `docs/requirements.md`
- `docs/solution-design.md`
- `docs/phase-8-release-evidence.md`

Fingerprint-excluded handoff evidence:

- `docs/phase-8-test-report.md`
- `docs/components/phase-8-component-8-9-overview.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

No workflow file changed.

## How to run and verify

Use Node.js 24.18.0 and pnpm 10.15.0:

```bash
python3 scripts/worktree-fingerprint.py
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm preview --host 127.0.0.1 --port 4173
pnpm dlx lighthouse@13.4.1 http://127.0.0.1:4173/tycoon/ \
  --output=json --only-categories=performance,accessibility,best-practices \
  --form-factor=mobile --chrome-flags='--headless=new --no-sandbox' --quiet
pnpm audit --prod --audit-level high
pnpm licenses list --prod
pnpm list --prod --depth Infinity --json
shasum -a 256 public/assets/art/laneway-title.webp
```

Run Lighthouse five times sequentially against one unchanged preview and apply
the policy in the phase report. Preview/browser use requires an exclusive port
4173 lease; stop preview afterward and prove the port is clear.

## Integration notes and gotchas

- Do not construct media handles in a React functional state updater. StrictMode
  may evaluate an updater more than once. The event handler constructs once
  outside the updater and a ref guards allocation and cleanup.
- PWA precaching still downloads bundled audio for offline completeness. The
  title-performance contract concerns page-initiated media requests before
  interaction; service-worker cache inventory remains canonical.
- Desktop planning panels are always visible and expose no accessible mobile
  tabs. At 620px or narrower, the tabs are the interaction contract.
- `evaluateAll` does not auto-retry. Wait on the expected element count before
  reading ordered attributes from lazy service sections.
- Lighthouse is variable. Retain all five reports and use the declared median
  rule; never publish a selected best score.
- The 724.52 kB Three.js file produces Vite's 500 kB advisory but remains below
  the enforced 1 MB release ceiling and is fully precached/offline-tested.
- Playwright Chromium 149/SwiftShader evidence is not physical Safari, device
  GPU, orientation, DPR, or FPS evidence. The accepted Lighthouse reports used
  HeadlessChrome 151.0.0.0.
- Merge and publication are already authorized by the user; local PASS does not
  claim that commit, PR, merge, workflow, deployment, or hosted validation has
  executed.

## Spec-to-delivery map

| Acceptance criterion                                                                                                            | Delivery and proof                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every Phase 8 and retained Phase 1–7 criterion has named passing evidence                                                       | Complete 220-test Vitest suite and 96-case desktop/touch Playwright matrix; target map in `docs/phase-8-test-report.md`                                                                                                       |
| Final report records Tier 3 PASS for one frozen global candidate                                                                | Unscoped fingerprint `09b45748f9afd3315ca632ae45bdce26c46efd7fcbb6312bb8193323692a3e59`; install/build/lint/test/E2E all PASS                                                                                                 |
| Complete reset, difficulty, progression, workforce, parallel service, dense hall, 40-day history, and PWA behavior are verified | Unit/component and browser evidence mapped target-by-target in the phase report                                                                                                                                               |
| Release documents match delivered behavior                                                                                      | README, requirements, brief, solution design, runbooks, context, checklist, and release evidence reconciled to schema v4, Standard/Hard, 40 days, four venues, three tiers, four roles, parallel service, and 3D-only service |
| Performance/accessibility/release targets pass                                                                                  | Lighthouse Performance median 93, A11y/BP 100; renderer 58.09 desktop and 60.05 touch FPS; zero dependency findings; local-only network evidence                                                                              |
| Deployment and hosted evidence remain identity-bound after authorization                                                        | Progress state records both human authorities as received while leaving commit/merge/deployment execution, exact deployment identity, hosted verdict, and optional physical evidence pending; no external mutation performed  |

## Assurance lane

Lane: **phase-gate (lean override)**, Tier 3. Local validation owner: Implement.
Commit owner: Lead Coordinator.

Matched Test triggers include destructive migration, persistence/offline/update
round trips, concurrent service, responsive UI, WebGL cadence, accessibility,
and regression-prone cumulative behavior. Matched Review triggers include broad
core/app/config/documentation scope, public save/game contracts, release safety,
and candidate identity. The approved lean contract assigns cumulative local
self-review and validation to this Implement engagement; the Lead Coordinator
retains Git and human-gate orchestration.

## Deviations and decisions

- The component planned no feature work, but its gate exposed real release
  defects. Coordinator-approved scope added only browser synchronization repairs
  and consent-gated local-audio construction.
- No retry, timeout, skip, performance threshold, project, title artwork,
  gameplay rule, or canonical-state assertion was weakened.
- Four concurrent Playwright workers made renderer cadence non-authoritative;
  the whole cumulative matrix is serialized at one worker.
- An initial consent-gated implementation constructed the manager inside a
  React state updater. Code audit rejected it before acceptance; final code
  constructs outside the updater and proves no second-input allocation.
- The spec's push/deploy language is superseded for this engagement by explicit
  coordinator ownership. Root-conversation audit confirmed both human
  authorities were already received; this does not transfer Git or deployment
  execution to Implement.
- The fingerprint-included release-evidence document was frozen before that
  authority audit. These fingerprint-excluded status artifacts correct the
  current disposition without mutating the validated executable candidate.
- Current official GitHub Pages custom-workflow guidance was rechecked on
  2026-08-09. The existing configure-pages v5, upload-pages-artifact v4, and
  deploy-pages v4 workflow remains correct; no workflow edit was required.

## Validation evidence

Final candidate fingerprint:

```bash
python3 scripts/worktree-fingerprint.py
```

Result before and after all accepted checks:
`09b45748f9afd3315ca632ae45bdce26c46efd7fcbb6312bb8193323692a3e59`.
The Lead Coordinator independently reproduced it before Tier 3.

- Install: exit 0, 0.27s.
- Build: exit 0, 5.20s; 25-entry, 1,808.29 KiB precache graph.
- Lint/format: exit 0, 9.64s.
- Vitest: exit 0, 9.58s; 16 files, 220 tests.
- Playwright: exit 0, 9.3m; 88 passed, 8 intentional skips, 0 failures.
- Lighthouse: five Performance 93 results, median 93; Accessibility and Best
  Practices 100 in every run; no runtime/console errors or audio requests.
- Dependency audit: 19 production dependencies, zero findings at all
  severities; MIT/BSD-3-Clause only.
- Runtime network: 27/27 requests same-origin under `/tycoon/`; zero
  installability errors; largest precached file 724,524 bytes.
- Renderer: desktop 58.09 FPS/p95 20.2ms; touch 60.05 FPS/p95 17.8ms.
- Final port check: no listener on 4173.

Raw logs/artifacts and all Lighthouse report hashes are listed in
`docs/phase-8-test-report.md`.

## Manual tests automated and human tasks

All programmatically executable manual checks were automated: exact reset and
save recovery, both difficulties and full campaigns, responsive planning and
service, keyboard/touch, WebGL/context recovery, offline install/reload/full
service, waiting-worker update consent, local-audio request timing, renderer
cadence, Lighthouse, bundle/cache inventory, title integrity, dependency
security/licenses, and runtime request origin.

There was no Component 8.9 human setup task. Merge and publication authority
are already approved/received, so no repeat approval request is required.
Remaining actions are:

1. Lead Coordinator audits and commits the unchanged candidate, then executes
   the normal PR/protected-merge path under the received authority.
2. The release owner executes the authorized Pages publication and records its
   exact workflow/deployment identity.
3. The repository owner records the hosted desktop/touch/WebGL2/offline/update
   verdict.
4. Optional physical evidence remains owner-only, hosted, pending, and
   unclaimed.
