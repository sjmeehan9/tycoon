# Phase 8 Cumulative Test Report

## Verdict

**LOCAL AUTOMATED PASS** for global fingerprint
`09b45748f9afd3315ca632ae45bdce26c46efd7fcbb6312bb8193323692a3e59`.

This verdict covers the final local candidate only. The user's merge authority
and publication authority are **APPROVED / RECEIVED** from the root
conversation. The candidate is not yet committed, merged, published, or
owner-validated on the public site. Commit/PR/merge execution, deployment
identity, owner-hosted gameplay, and optional owner-only physical evidence are
separate dispositions and remain **PENDING / UNCLAIMED** as applicable.

## Candidate identity

- Branch: `phase-8-sealed`
- Pre-commit base HEAD: `86b99e93c52d9102e5af7d013d3b67674b1273e5`
- Node.js: 24.18.0
- pnpm: 10.15.0
- Playwright browser: Chromium 149.0.7827.55
- Lighthouse browser: HeadlessChrome 151.0.0.0
- Fingerprint scope: unscoped global executable candidate
- Fingerprint command: `python3 scripts/worktree-fingerprint.py`
- Fingerprint before and after the gate:
  `09b45748f9afd3315ca632ae45bdce26c46efd7fcbb6312bb8193323692a3e59`

The Lead Coordinator independently reproduced the same frozen fingerprint
before the accepted Tier 3 run. Every Component 8.1–8.8 historical scoped
fingerprint also reproduced at its committed SHA; the exact audit table is in
`docs/phase-8-release-evidence.md`.

## Exact Tier 3 results

All commands ran from the sealed worktree with Node.js 24.18.0 and one
exclusive Playwright worker.

| Command                          | Exit | Duration | Result                                                                       |
| -------------------------------- | ---: | -------: | ---------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` |    0 |    0.27s | Frozen lockfile unchanged; already installed                                 |
| `pnpm build`                     |    0 |    5.20s | TypeScript and Vite production build PASS; 25 precache entries, 1,808.29 KiB |
| `pnpm lint`                      |    0 |    9.64s | ESLint zero warnings; Prettier PASS                                          |
| `pnpm test`                      |    0 |    9.58s | 16 files, 220 tests passed                                                   |
| `pnpm test:e2e`                  |    0 |     9.3m | 88 passed, 8 intentional project-routing skips, 0 failures                   |

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
- Exact precache: 25 files, 1,876,102 bytes total.
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
- `test-results/department-store-scene-den-56830-s-and-settled-bounded-WebGL-touch-mobile/renderer-frame-cadence.json`

## Renderer performance

| Project          | Viewport / DPR                             | Result                               | Budget             | Environment                                                              |
| ---------------- | ------------------------------------------ | ------------------------------------ | ------------------ | ------------------------------------------------------------------------ |
| Desktop Chromium | 1280×800; browser DPR 1; canvas DPR 0.9    | 58.09 FPS; median 16.6ms; p95 20.2ms | ≥55 FPS; p95 ≤34ms | Playwright Chromium 149, SwiftShader Vulkan, full LOD, 0.9 render scale  |
| Touch-mobile     | 360×780; emulated DPR 2; canvas DPR 1.2493 | 60.05 FPS; median 16.6ms; p95 17.8ms | ≥30 FPS; p95 ≤50ms | Playwright Chromium 149, SwiftShader Vulkan, compact LOD, render scale 1 |

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
|   1 |          93 |           100 |            100 | 1.716s |    3.045s |      1.716s | 6.5ms |   0 | 305,355 B |              0 |
|   2 |          93 |           100 |            100 | 1.666s |    3.154s |      1.666s |   0ms |   0 | 305,355 B |              0 |
|   3 |          93 |           100 |            100 | 1.666s |    3.154s |      1.666s |   0ms |   0 | 305,355 B |              0 |
|   4 |          93 |           100 |            100 | 1.666s |    3.154s |      1.666s |   0ms |   0 | 305,355 B |              0 |
|   5 |          93 |           100 |            100 | 1.666s |    3.154s |      1.666s |   0ms |   0 | 305,355 B |              0 |

Median Performance: **93 — PASS**. Every run recorded zero console-error items,
an errors-in-console score of 1, and no runtime-error audit.

Raw reports and SHA-256 hashes:

| Path                                               | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `test-results/component-8-9/lighthouse-run-1.json` | `5b1629ec1f83dba02f0fd65e05e94ceddd9592703c00318267feece652acea2c` |
| `test-results/component-8-9/lighthouse-run-2.json` | `e44b57145f6ef902093edf5d54ac5cc477933fa9810455d8d3bcefada5503944` |
| `test-results/component-8-9/lighthouse-run-3.json` | `b1f1075e5ea91cb844730da6fc084f9e0b16209c3e5a4cfc5a4804bde9e285ff` |
| `test-results/component-8-9/lighthouse-run-4.json` | `0f39a440e130c66107391262e4c7d9fde32ca1540a6e43a57a5824a9d143e9ea` |
| `test-results/component-8-9/lighthouse-run-5.json` | `f1f4b0cfb5ceaf6aa7933fa9b1ece540697fb882f405bcff96fa8be115648dac` |

## Dependency and license evidence

- `pnpm audit --prod --audit-level high` — exit 0, 0.41s; no known
  vulnerabilities.
- `pnpm audit --prod --json` — exit 0, 0.35s; 19 production dependencies and
  zero info, low, moderate, high, or critical findings.
- `pnpm licenses list --prod` — exit 0, 0.09s; MIT and BSD-3-Clause only.
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
5. `09b45748…a3e59` moves construction outside the updater, uses a one-shot ref
   guard and cleanup, and is the sole accepted candidate.

## Disposition boundaries

- Local automated candidate: **PASS**.
- Human merge authority: **APPROVED / RECEIVED** in the root conversation.
- Human publication authority: **APPROVED / RECEIVED** in the root
  conversation.
- Git commit / PR / protected merge execution: **PENDING Lead Coordinator**.
- GitHub Actions / Pages deployment execution and exact identity: **PENDING**.
- Owner-hosted desktop/touch/WebGL2/offline/update verdict: **PENDING owner**.
- Optional physical Safari/mobile-GPU/orientation/DPR/FPS evidence:
  **PENDING / UNCLAIMED owner-only**.

No agent accessed a physical device, pushed, opened a pull request, merged,
published, changed repository settings, or claimed hosted gameplay.
