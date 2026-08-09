# Phase 8 Cumulative Test Report

## Verdict

**LOCAL AUTOMATED PASS** for global fingerprint
`280caa0bd772d94b893718b6300952263cb01bd16b717b7b6f71faf6079e32e1`.

This verdict covers the final local candidate only. The user's merge authority
and publication authority are **APPROVED / RECEIVED** from the root
conversation. The earlier Component 8.9 commit was merged, but its Pages run
failed before artifact upload/deployment. This stabilization candidate is not
yet committed, merged, published, or owner-validated on the public site.
Stabilization commit/PR/merge execution, deployment identity, owner-hosted
gameplay, and optional owner-only physical evidence are separate dispositions
and remain **PENDING / UNCLAIMED** as applicable.

## Candidate identity

- Branch: `phase-8-ci-stabilization`
- Pre-commit base HEAD: `b3b53201162f0570da246eac5e7a5cb8f27f35c3`
- Earlier Component 8.9 commit: `b3b53201162f0570da246eac5e7a5cb8f27f35c3`
- Earlier main merge: `c28ad429`
- Failed merge-triggered Pages run: `31273149320` (no deployment)
- Node.js: 24.18.0
- pnpm: 10.15.0
- Playwright browser: Chromium 149.0.7827.55
- Lighthouse browser: HeadlessChrome 151.0.0.0
- Fingerprint scope: unscoped global executable candidate
- Fingerprint command: `python3 scripts/worktree-fingerprint.py`
- Fingerprint before and after the gate:
  `280caa0bd772d94b893718b6300952263cb01bd16b717b7b6f71faf6079e32e1`

The Lead Coordinator independently reproduced the same frozen fingerprint
before the accepted Tier 3 run. Every Component 8.1–8.8 historical scoped
fingerprint also reproduced at its committed SHA; the exact audit table is in
`docs/phase-8-release-evidence.md`.

## Exact Tier 3 results

All commands ran from the sealed worktree with Node.js 24.18.0 and one
exclusive Playwright worker.

| Command                          | Exit | Duration | Result                                                                       |
| -------------------------------- | ---: | -------: | ---------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` |    0 |    0.40s | Frozen lockfile unchanged; already installed                                 |
| `pnpm build`                     |    0 |    5.62s | TypeScript and Vite production build PASS; 25 precache entries, 1,808.16 KiB |
| `pnpm lint`                      |    0 |   11.00s | ESLint zero warnings; Prettier PASS                                          |
| `pnpm test`                      |    0 |   13.16s | 16 files, 220 tests passed                                                   |
| `pnpm test:e2e`                  |    0 |     9.5m | 88 passed, 8 intentional project-routing skips, 0 failures                   |

The build's largest emitted file is the 724.52 kB Three.js chunk, below the
enforced 1,000,000-byte Workbox ceiling. The Vite 500 kB advisory is therefore
non-blocking and the exact generated graph is browser-verified offline.

## Phase 8 validation-target map

| Target                                                                                                       | Runtime and passing proof                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete v1/v2/v3 reset matrix and schema-v4 safety                                                          | Persistence, campaign, and engine unit suites; `difficulty-reset`, `save-transfer`, `persistence`, `report-history`, and `staff-names` desktop/touch journeys                                                              |
| Immutable Standard/Hard choice, stronger Standard price response, and exhaustive Hard influence registry     | Demand, engine, campaign, and persistence unit suites; difficulty reset plus complete Standard and Hard 40-day browser campaigns                                                                                           |
| Four venues and three equipment tiers                                                                        | Coffee-content, operations, inventory, campaign, and scene unit suites; department-store progression, operations, campaign outcomes, and WebGL reload journeys                                                             |
| Twelve-person roster, ten scheduled staff, Manager/Runner value, payroll, and reload                         | Operations, demand, persistence, campaign, and scene unit suites; department-workforce desktop/touch journey                                                                                                               |
| Three stations, express bounds, two queues, exact-once parallel jobs, and inventory conservation             | Engine, operations, inventory, persistence, demand, and scene unit suites; parallel-service, department-store, stock-lifecycle, persistence, and report-history journeys                                                   |
| Dense heritage hall and canonical multi-entity snapshot truth                                                | Scene and presentation component suites; department-store-scene, living-rush, webgl-service, accessibility, and service-layout browser journeys                                                                            |
| Scene-free planning; scene → dashboard → activity → stock service flow; compact/reopenable reports           | Game-loop, presentation, and accessibility component suites; service-layout, report-history, cart-day, coffee-day, and planner-controls browser journeys                                                                   |
| Complete 40-day content, deterministic balance, causal history, victory/bankruptcy, and endless continuation | Campaign, demand, operations, persistence, and coffee-content unit suites; forty-day-campaign, campaign-outcomes, department-store, and report-history journeys                                                            |
| `/tycoon/` installability, exact offline graph, update deferral/acceptance, and exact persisted continuation | PWA-update component suite; PWA, persistence, service-layout, department-store-scene, save-transfer, and report-history browser journeys                                                                                   |
| Initial-title audio consent and local-only media                                                             | Audio unit suite and presentation component proof; desktop/touch presentation journey confirms no pre-interaction audio resource timing entry, then saved sound/ambience behavior                                          |
| Phase 1–7 regression retention                                                                               | The complete 22-file Playwright matrix ran both projects: accessibility, outcomes, cart/coffee day, planning, operations, persistence, stock, save transfer, staff names, reporting, WebGL, PWA, and every Phase 8 journey |
| Release documentation and operational recovery                                                               | Reconciled requirements, brief, solution design, README, agent/release runbooks, public checklist, phase context, and release evidence; current Pages workflow contract rechecked with no workflow change                  |

No legacy path resurrected invalidated progress, no demand factor was omitted,
no parallel job double-settled, and no Canvas service fallback returned.

## Automated browser, bundle, and network evidence

- Production installability errors: 0.
- Exact precache: 25 files, 1,875,977 bytes total.
- Largest precached file: 724,524 bytes.
- Service worker: 16,496 bytes.
- Runtime request capture: 27 of 27 requests use only
  `http://127.0.0.1:4173/tycoon/`; every path starts with `/tycoon/`.
- Source static scan found no fetch/API/telemetry/advertising transport. The
  only URL in owned source/public configuration is the standard SVG namespace.
- Title artwork SHA-256:
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

Raw runtime artifacts:

- `test-results/pwa-offline-safe-productio-c4c92-nd-complete-offline-service-desktop-chromium/release-cache-and-network-inventory.json`
- `test-results/department-store-scene-den-56830-s-and-settled-bounded-WebGL-desktop-chromium/renderer-frame-cadence.json`
  — SHA-256 `afb298f412182849e655076d7a14a4a35373ab3bb2f0af94a414734ac0b343ac`
- `test-results/department-store-scene-den-56830-s-and-settled-bounded-WebGL-touch-mobile/renderer-frame-cadence.json`
  — SHA-256 `233172048b10798b8826affbb5970b8f1b0264013e0764446532b013a59ebdcc`
- `test-results/component-8-9-stabilization/cadence-before/run-{1..5}.json`
- `test-results/component-8-9-stabilization/cadence-decoration-only/run-{1..5}.json`
- `test-results/component-8-9-stabilization/cadence-final/run-{1..5}.json`

## Renderer performance

| Project          | Viewport / DPR                             | Result                               | Budget             | Environment                                                              |
| ---------------- | ------------------------------------------ | ------------------------------------ | ------------------ | ------------------------------------------------------------------------ |
| Desktop Chromium | 1280×800; browser DPR 1; canvas DPR 0.9    | 57.63 FPS; median 17.0ms; p95 20.2ms | ≥55 FPS; p95 ≤34ms | Playwright Chromium 149, SwiftShader Vulkan, full LOD, 0.9 render scale  |
| Touch-mobile     | 360×780; emulated DPR 2; canvas DPR 1.2493 | 60.03 FPS; median 16.6ms; p95 17.8ms | ≥30 FPS; p95 ≤50ms | Playwright Chromium 149, SwiftShader Vulkan, compact LOD, render scale 1 |

Both records used 30 warm-up callbacks plus 120 rendered-frame deltas and set
`physicalDeviceClaimed: false`.

## Lighthouse confirmation policy and result

The rule was declared before the accepted samples: five sequential isolated
Lighthouse 13.4.1 reports using HeadlessChrome 151.0.0.0 on one unchanged
production candidate; median Performance at least 90; every Accessibility and
Best Practices score at least 90; no runtime or console-error audit failure;
retain every report.

| Run | Performance | Accessibility | Best Practices |    FCP | LCP / TTI | Speed Index |   TBT | CLS |  Transfer | Audio requests |
| --: | ----------: | ------------: | -------------: | -----: | --------: | ----------: | ----: | --: | --------: | -------------: |
|   1 |          93 |           100 |            100 | 1.721s |    3.049s |      1.721s | 7.5ms |   0 | 305,369 B |              0 |
|   2 |          93 |           100 |            100 | 1.670s |    3.158s |      1.670s |   0ms |   0 | 305,369 B |              0 |
|   3 |          93 |           100 |            100 | 1.671s |    3.159s |      1.671s |   0ms |   0 | 305,369 B |              0 |
|   4 |          93 |           100 |            100 | 1.753s |    3.080s |      1.753s |   1ms |   0 | 305,369 B |              0 |
|   5 |          93 |           100 |            100 | 1.670s |    3.158s |      1.670s |   0ms |   0 | 305,369 B |              0 |

Median Performance: **93 — PASS**. Every run recorded zero console-error items,
an errors-in-console score of 1, and no runtime-error audit.

Raw reports and SHA-256 hashes:

| Path                                                             | SHA-256                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `test-results/component-8-9-stabilization/lighthouse-run-1.json` | `d044a58fa1ec46fc153f3afd182266139059d1761598323a021da54bf15e8ace` |
| `test-results/component-8-9-stabilization/lighthouse-run-2.json` | `8575d6b038f686c8ad695b5d37422b6d263959baccc0d88a2b23a2fc4eeef3e4` |
| `test-results/component-8-9-stabilization/lighthouse-run-3.json` | `7fd56f6945acad51f51d4092d958d3612639976351c8ddabcd88c5045b4f47e6` |
| `test-results/component-8-9-stabilization/lighthouse-run-4.json` | `c63c589dfc81e7a08d96784d150d02983758db2932c0b3273101fe26d047e6a5` |
| `test-results/component-8-9-stabilization/lighthouse-run-5.json` | `82f861dc0cb56bd570d951a475eb314c164f2485486c04dc711c4fa33d9e536e` |

## Dependency and license evidence

- `pnpm audit --prod --audit-level high` — exit 0, 0.44s; no known
  vulnerabilities.
- `pnpm audit --prod --json` — exit 0, 0.36s; 19 production dependencies and
  zero info, low, moderate, high, or critical findings.
- `pnpm licenses list --prod` — exit 0, 0.10s; MIT and BSD-3-Clause only.
- `pnpm list --prod --depth Infinity --json` — exit 0, 0.06s; exact frozen
  production graph inspected, with no dependency addition.

## Gate-defect history

Only the final fingerprint above is a PASS. Earlier candidates remain failure
or superseded evidence:

1. `56b6dbb…078f3` exposed stale cart/workforce assertions and invalid
   concurrent renderer sampling.
2. `a5b67c32…bd5c6` exposed two synchronous parallel-service assertions; both
   were replaced with auto-retrying, responsive-aware proof without changing a
   timeout, retry, skip, threshold, or product behavior.
3. `ed65429d…7e33` passed Tier 3 but failed the predeclared five-run Lighthouse
   rule at Performance median 88. Diagnosis found eager pre-interaction WAV
   transfers from media-handle construction.
4. `832a5cf9…873aa` proved the consent-gated audio repair but was superseded
   before acceptance when code audit found manager construction inside an
   impure React updater. Its browser run was intentionally interrupted.
5. `09b45748…a3e59` moved construction outside the updater, used a one-shot ref
   guard and cleanup, and was the original locally accepted Component 8.9
   candidate. It became commit `b3b5320` and merged as `c28ad429`.
6. Merge-triggered Pages run `31273149320` passed install/build/lint and 219
   other Vitest cases, but the 120-campaign proof exceeded its 15-second outer
   hang budget at 19.632 seconds. E2E, upload, and deployment were skipped.
7. `4911bbd9…92b0b` raised only that outer budget to 45 seconds. The unchanged
   proof passed three focused runs in 5.64, 5.52, and 5.45 seconds, but the
   fresh Tier 3 browser matrix failed only desktop cadence at 52.72 FPS. Five
   untouched diagnostic samples (`52.11, 51.85, 52.40, 50.24, 51.56`) proved a
   genuine rendering-margin defect.
8. A decoration-only Lambert candidate reached median 58.01 FPS, but one of
   five samples remained at 52.09; it was superseded without selective
   acceptance.
9. `280caa0b…e32e1` uses Lambert lighting for repeated low-poly hall
   decorations, people, and bounded activity cues without changing geometry,
   entity truth, render scale, or thresholds. Five pre-gate samples all passed
   (`58.80, 59.91, 57.05, 58.32, 58.52`), then exact Tier 3 and all
   supplements passed. This is the sole accepted stabilization candidate.

## Disposition boundaries

- Local automated candidate: **PASS**.
- Human merge authority: **APPROVED / RECEIVED** in the root conversation.
- Human publication authority: **APPROVED / RECEIVED** in the root
  conversation.
- Original Component 8.9 commit/PR/merge: **COMPLETE**, culminating in main
  `c28ad429`; its deployment run failed before upload.
- Stabilization commit / PR / protected merge execution: **PENDING Lead
  Coordinator**.
- GitHub Actions / Pages deployment execution and exact identity: **PENDING**.
- Owner-hosted desktop/touch/WebGL2/offline/update verdict: **PENDING owner**.
- Optional physical Safari/mobile-GPU/orientation/DPR/FPS evidence:
  **PENDING / UNCLAIMED owner-only**.

No agent accessed a physical device or claimed hosted gameplay. The earlier
authorized PR/merge executed, but no Phase 8 Pages deployment exists; this
stabilization engagement did not commit, push, merge, publish, or change
repository settings.
