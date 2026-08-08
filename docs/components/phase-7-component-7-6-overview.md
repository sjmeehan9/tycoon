# Component 7.6 — Phase-7 Validation and Documentation

## What was delivered

A user can now rely on one cumulative automated Phase 7 candidate whose
fixed-isometric WebGL service, scene-free planning, exact service information
order, compact/reopenable reports, deterministic economy, schema-v3 saves,
offline behavior, and retained Phases 1–6 journeys all pass in production
desktop Chromium and the exact 360×780 touch project.

The phase evidence is explicit about its boundary: automated Tier 3 is PASS;
physical Safari/mobile-GPU/FPS evidence is pending and unclaimed. If requested,
the repository owner performs that check only against the exact candidate after
separate merge/publication approval at the existing public game URL. Component
7.6 performs no device access, push, merge, publication, or Phase 8 runtime work.

## Public interfaces / contracts exposed

No runtime game API, save schema, state version, command, or renderer input
contract changed in this component. Downstream work may rely on these validated
contracts:

- service rendering is WebGL2-only and lazy through `ServiceWorld`; the Three.js
  graph consumes detached immutable snapshots and owns no game command,
  persistence, network, randomness, or time authority;
- all service `VenueId` values render distinct cart/kiosk/cafe worlds through
  the orthographic fixed-isometric path; unsupported/context-loss states remain
  semantic and save-safe, never Canvas fallbacks;
- service DOM order is scene → complete dashboard/controls → live activity →
  stock, with scene and dashboard together above the exact 360×780 fold;
- morning planning and reinvestment are scene-free;
- current reports are compact, full detail is closed by default, settlement is
  **Settle & reinvest**, and Game menu → Reports renders selected bounded
  `DayReport` history read-only;
- schema/state version remain 3, one balanced 30-day cart→kiosk→cafe campaign
  remains current, and all Phase 8 campaign/difficulty/reset behavior remains
  planned only;
- the remediated automated verdict is identified by global fingerprint
  `88dbdaf32cbbe6c59a91bdc5c3853efdf85514fc053b627e1f0962dfa1a2247f`;
  hosted physical validation is a separate owner-owned record.

## Files owned

Created:

- `docs/phase-7-test-report.md`
- `docs/components/phase-7-component-7-6-overview.md`

Modified validation tests:

- `tests/components/game-loop.test.tsx`
- `tests/unit/scene.test.ts`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/campaign-outcomes.spec.ts`
- `tests/e2e/cart-day.spec.ts`
- `tests/e2e/coffee-day.spec.ts`
- `tests/e2e/living-rush.spec.ts`
- `tests/e2e/operations.spec.ts`
- `tests/e2e/persistence.spec.ts`
- `tests/e2e/planner-controls.spec.ts`
- `tests/e2e/presentation.spec.ts`
- `tests/e2e/stock-lifecycle.spec.ts`
- `tests/e2e/webgl-service.spec.ts`

Modified documentation/state:

- `README.md`
- `docs/agent-runbook.md`
- `docs/brief.md`
- `docs/implementation-context-phase-7.md`
- `docs/phase-7-component-breakdown.md`
- `docs/phase-plan.md`
- `docs/release-runbook.md`
- `docs/requirements.md`
- `docs/solution-design.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

The post-merge remediation diff is strictly limited to
`tests/components/game-loop.test.tsx`, this overview, the Phase 7 test report,
phase progress, and team state. The other paths above remain the historical
Component 7.6 delivery manifest and are not restaged by this remediation.

No application runtime source, package manifest, lockfile, Vite configuration,
Playwright configuration, public asset, deployment workflow, or release was
changed by Component 7.6.

## How to run / verify

```bash
python3 scripts/worktree-fingerprint.py
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

The fingerprint must be
`88dbdaf32cbbe6c59a91bdc5c3853efdf85514fc053b627e1f0962dfa1a2247f`
before and after the unchanged candidate gate. Chromium needs the project's
outside-sandbox browser-launch fallback in this macOS environment.

See `docs/phase-7-test-report.md` for the exact automated results, target map,
artifact sizes, visual inspection, residual risks, and the concise owner-only
hosted physical checklist.

## Integration notes & gotchas

- Do not reinterpret the automated 360×780 Chromium project as physical-device
  proof. Model/OS/Safari/WebGL identity, real DPR/orientation, physical FPS, and
  on-device visual findings remain pending.
- PR #7 merged component head `dc34856e` at main merge `4e489198`, but its Pages
  run `31244688241` failed at one synchronous component-test query while the
  lazy WebGL scene was still loading. Build/lint passed; E2E/upload/deploy were
  skipped. The current local remediation is PASS; clean CI/deployment remains
  pending.
- The public URL still serves the prior approved release. Publish only the exact
  audited/approved candidate; never publish an intermediate build for device
  validation.
- The seven Playwright skips are intentional project routing, not missing
  behavior. Desktop-only keyboard flows, touch-only flows, and desktop-only
  mutable service-worker cases each run once in their owning project.
- `three-webgl` is 724,513 bytes. Vite emits its advisory 500 kB warning, but
  the lazy chunk remains below the enforced 1,000,000-byte Workbox ceiling.
- Successful screenshots live under `test-results/webgl-service-*` and are
  reproducible rather than committed product assets.
- Phase 6's Canvas-width/transient assertions were not deleted without proof;
  their enduring queue/activity/reload/reduced-motion/liveness/report outcomes
  now execute through WebGL bounds, frame state, scene-free management, and
  compact disclosure contracts.
- Evidence/state/overview files are excluded from executable fingerprinting;
  writing them after the gate did not mutate candidate identity.

## Spec-to-delivery map

| Acceptance criterion                            | Runtime behavior / owned evidence                                                                           | Proof                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Complete automated Phase 7 target coverage      | Cumulative unit/component/E2E suite covers every plan target                                                | 148 Vitest + 67 applicable Playwright PASS                             |
| Final global identity                           | Unscoped fingerprint before and after remediated Tier 3 is identical                                        | `88dbdaf3…a2247f`                                                      |
| Post-merge Linux scene readiness                | Both paused dense-rush mounts await the lazy scene before checking unchanged current truth                  | Focused 18/18 plus cumulative 148/148 Vitest PASS                      |
| WebGL stack and license compatibility           | Exact installed pins, peers, lock entries, and MIT license files audited                                    | `tests/unit/scene.test.ts`; production build                           |
| Snapshot-only renderer authority                | Recursive renderer graph excludes commands, persistence, storage, network, PRNG, and wall clock             | Unit static audit plus mounted/unmounted/context/speed equality tests  |
| Three distinct fixed-isometric worlds           | Cart, kiosk, and cafe dispatch distinct bounded layouts and captures                                        | `webgl-service.spec.ts` in both projects; visual audit                 |
| WebGL2 and recovery                             | Actual WebGL2 version/renderer/DPR inspected; unsupported and context-loss paths remain save-safe           | Desktop/touch browser assertions                                       |
| No production Canvas service                    | All VenueIds use WebGL, bridge absent, Canvas chunk absent from manifest                                    | Unit source/manifest audit and browser resource checks                 |
| Scene-free morning management                   | Planning/reinvestment have no renderer, preview, placeholder, or reserved column                            | `service-layout.spec.ts`, `operations.spec.ts`, `presentation.spec.ts` |
| Service information order and exact mobile fold | Scene → dashboard → activity → stock; scene plus complete dashboard above fold                              | Exact 360×780 geometry/touch journey                                   |
| Reduced motion and accessibility                | Scene remains; frames stop/minimize; keyboard/touch/dialog/text parity preserved                            | Accessibility, living-rush, service-layout, and WebGL journeys         |
| Compact exact-once day completion               | Full report hidden initially; one canonical settlement; reload cannot resettle                              | Report-history plus cumulative day/outcome journeys                    |
| Truthful reopenable history                     | Selected stored report is sole input; canonical charges round-trip; older charges remain unavailable        | Component/E2E history, export/import, poison-current-rush checks       |
| Schema-v3/campaign compatibility                | No reset, difficulty, fourth venue, or Phase 8 runtime; current saves and campaign outcomes remain coherent | Persistence/save/campaign/economy cumulative tests and reconciled docs |
| Bundle/offline budgets                          | Lazy route, 19-entry precache, every file <1 MB, PWA update/offline path green                              | Build/manifest inspection and PWA journeys                             |
| Physical evidence truthfulness                  | Device result recorded pending/unclaimed; sole pathway is owner-led exact hosted candidate                  | Plan/breakdown/runbooks/report/state override record                   |
| Documentation consistency                       | Stale Canvas/current-vs-planned guidance reconciled                                                         | README, brief, requirements, solution design, plan/context/runbooks    |

## Assurance lane

`phase-gate (lean override)`.

Matched standard Test triggers: first cumulative WebGL phase, UI/real-browser
behavior, exact responsive/touch geometry, context loss, persistence/history
round trips, PWA/offline/update behavior, and regression-prone retained
Phases 1–6 paths.

Matched standard Review triggers: app/build/render architecture, public
snapshot/report contracts, broad cross-component scope, dependency/license and
documentation reconciliation, and a user-authorized validation-gate deviation.
Under the approved lean override, Implement owns the cumulative gate,
self-review, remediation, evidence, and commit candidate; the Lead Coordinator
independently audits and commits.

The lane was not downgraded. The post-merge test correction changed executable
identity, so the recorded completion gate belongs only to the final unchanged
remediation fingerprint.

## Deviations and decisions

- The user superseded the original physical-device prerequisite. Automated
  Tier 3 may record PASS while hosted physical validation remains explicitly
  pending/unclaimed; agents never access the device.
- The sole future physical pathway is owner-led testing of the exact published
  candidate at the existing URL after separate approval. Component 7.6 does not
  push, merge, or publish.
- Cumulative Phase 6 UI assertions were migrated to approved Phase 7 semantics
  while retaining their economic, persistence, accessibility, and gameplay
  outcomes. The mapping is recorded in the implementation context and phase
  report.
- A headless RAF wall-time assertion was replaced by ordered callback liveness
  plus active→paused renderer state. It is stabilization only and makes no
  desktop or physical performance claim.
- The macOS Chromium launch sandbox failed before tests ran; the profile's
  outside-sandbox fallback supplied the real browser completion gate.
- Merge-triggered Pages run `31244688241` exposed a Linux async test race, not
  a product or device failure. Both scene queries now await lazy WebGL readiness
  before asserting the unchanged queue/current-truth/reduced-motion outcomes;
  no arbitrary sleep or runtime change was introduced.

## Validation evidence

- Targeted scene audit: 27 tests PASS before candidate freeze.
- Targeted WebGL route: 2/2 desktop/touch cases PASS before cumulative freeze.
- Remediation: all original cumulative failures green; persistence 2/2 PASS;
  living rush 6/6 PASS.
- Post-merge focused remediation: `game-loop.test.tsx` 18/18 PASS in 5.05s.
- Remediated Tier 3:
  - `pnpm install --frozen-lockfile` — exit 0, 0.20s
  - `pnpm build` — exit 0, 4.81s
  - `pnpm lint` — exit 0, 8.40s
  - `pnpm test` — exit 0, 6.33s, 16 files / 148 tests
  - `pnpm test:e2e` — exit 0, 2.5m, 67 PASS / 7 intentional skips
- Fingerprint command/hash before and after:
  `python3 scripts/worktree-fingerprint.py` →
  `88dbdaf32cbbe6c59a91bdc5c3853efdf85514fc053b627e1f0962dfa1a2247f`.

## Manual tests automated

- Real-browser desktop/exact-touch daily, campaign, report, accessibility,
  persistence, recovery, PWA/offline/update, and service-layout journeys.
- Actual WebGL2 context identity, capped drawing-buffer ratio, all venue worlds,
  context loss/retry, reduced motion, dense crowds, and responsive screenshots.
- Production manifest, dynamic imports, title hash, dependency licenses, and
  every Workbox file size.

The only non-automated check is real physical Safari/mobile GPU/FPS behavior;
it is pending for the repository owner after exact-candidate publication.

## Human tasks

No account, credential, secret, paid asset, or backend task exists. The pending
human workflow is:

1. Lead Coordinator raises the remediation PR from the independently audited,
   committed exact candidate.
2. Confirm a clean GitHub rerun and exact Pages deployment; neither is yet
   claimed.
3. Repository owner completes the optional physical checklist only against the
   exact final hosted build after separate approval and supplies the result; no
   agent accesses the device.
