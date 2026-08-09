# Phase 8 Cumulative Test Report

## Verdict

**LOCAL AUTOMATED PASS** for global fingerprint
`6b31368c6a0ddf2b7ec255543365c896716f5a818b28c2c75938de88020c9ae2`.

This verdict covers the final local candidate only. The user's merge authority
and publication authority are **APPROVED / RECEIVED** from the root
conversation. The original Component 8.9 candidate and first stabilization
were each committed and merged, but both Pages runs failed before artifact
upload/deployment. This final stabilization candidate is not yet committed,
merged, published, or owner-validated on the public site. Its commit/PR/merge
execution, deployment identity, owner-hosted gameplay, and optional owner-only
physical evidence are separate dispositions and remain **PENDING / UNCLAIMED**
as applicable.

## Candidate identity

- Branch: `phase-8-ci-stabilization`
- Pre-commit base HEAD: `b7aba4df943a190943a9fb627bbb6c0fb679558f`
- Earlier Component 8.9 commit: `b3b53201162f0570da246eac5e7a5cb8f27f35c3`
- Earlier main merge: `c28ad429`
- First stabilization commit: `b7aba4df943a190943a9fb627bbb6c0fb679558f`
- First stabilization main merge: `864c1703c0ed08a259bdae13074450bac7ce12d0`
- Failed merge-triggered Pages runs: `31273149320` and `31289567300`
  (neither produced a deployment)
- Node.js: 24.18.0
- pnpm: 10.15.0
- Playwright browser: Chromium 149.0.7827.55
- Lighthouse browser: HeadlessChrome 151.0.0.0
- Fingerprint scope: unscoped global executable candidate
- Fingerprint command: `python3 scripts/worktree-fingerprint.py`
- Fingerprint before and after the gate:
  `6b31368c6a0ddf2b7ec255543365c896716f5a818b28c2c75938de88020c9ae2`

The Lead Coordinator independently reproduced the same frozen fingerprint
before the accepted Tier 3 run. Every Component 8.1–8.8 historical scoped
fingerprint also reproduced at its committed SHA; the exact audit table is in
`docs/phase-8-release-evidence.md`.

## Exact Tier 3 results

All commands ran from the sealed worktree with Node.js 24.18.0 and one
exclusive Playwright worker.

| Command                          | Exit | Duration | Result                                                                       |
| -------------------------------- | ---: | -------: | ---------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` |    0 |    0.58s | Frozen lockfile unchanged; already installed                                 |
| `pnpm build`                     |    0 |    5.85s | TypeScript and Vite production build PASS; 25 precache entries, 1,807.79 KiB |
| `pnpm lint`                      |    0 |   11.22s | ESLint zero warnings; Prettier PASS                                          |
| `pnpm test`                      |    0 |   13.30s | 16 files, 220 tests passed                                                   |
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
| Release documentation and operational recovery                                                               | Reconciled requirements, brief, solution design, README, agent/release runbooks, public checklist, phase context, and release evidence; Pages deployment contract unchanged with explicit fail-closed E2E observation mode |

No legacy path resurrected invalidated progress, no demand factor was omitted,
no parallel job double-settled, and no Canvas service fallback returned.

## Automated browser, bundle, and network evidence

- Production installability errors: 0.
- Exact precache: 25 files, 1,875,599 bytes total.
- Largest precached file: 724,524 bytes.
- Service worker: 16,496 bytes.
- Runtime request capture: 27 of 27 requests use only
  `http://127.0.0.1:4173/tycoon/`; every path starts with `/tycoon/`.
- Source static scan found no fetch/API/telemetry/advertising transport. The
  only URL in owned source/public configuration is the standard SVG namespace.
- Title artwork SHA-256:
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

Raw runtime artifacts:

- `test-results/component-8-9-ci-final/tier3-release-cache-network.json`
  — SHA-256 `c67bb44c0e30a7527b288f70d0a23e8c1187586ae68a0c1f1df1bfec771a8605`
- `test-results/component-8-9-ci-final/tier3-renderer-desktop.json`
  — SHA-256 `8bf3660bef24d0091aa17af90c609f4c4900468910116314294a5ac806a26664`
- `test-results/component-8-9-ci-final/tier3-renderer-touch.json`
  — SHA-256 `39b7fe5af0f6be4746ec060be42be64b7f6978b0908c57e9e3466ec7e07507d3`
- `test-results/component-8-9-ci-final/preproof-renderer-run-{1..5}.json`
  — SHA-256 `6d98359a…0644a`, `96b2c065…a611`, `eb8047e2…8096`,
  `cdc5802d…d92`, and `26c1f95b…8a8d`

## Renderer performance

| Project          | Viewport / DPR                             | Result                               | Budget             | Environment                                                              |
| ---------------- | ------------------------------------------ | ------------------------------------ | ------------------ | ------------------------------------------------------------------------ |
| Desktop Chromium | 1280×800; browser DPR 1; canvas DPR 0.9    | 60.08 FPS; median 16.7ms; p95 18.4ms | ≥55 FPS; p95 ≤34ms | Playwright Chromium 149, SwiftShader Vulkan, full LOD, 0.9 render scale  |
| Touch-mobile     | 360×780; emulated DPR 2; canvas DPR 1.2493 | 60.06 FPS; median 16.6ms; p95 17.7ms | ≥30 FPS; p95 ≤50ms | Playwright Chromium 149, SwiftShader Vulkan, compact LOD, render scale 1 |

Both records used 30 warm-up callbacks plus 120 rendered-frame deltas and set
`physicalDeviceClaimed: false`.

## Lighthouse confirmation policy and result

The rule was declared before the accepted samples: five sequential isolated
Lighthouse 13.4.1 reports using HeadlessChrome 151.0.0.0 on one unchanged
production candidate; median Performance at least 90; every Accessibility and
Best Practices score at least 90; no runtime or console-error audit failure;
retain every report.

| Run | Performance | Accessibility | Best Practices |    FCP | LCP / TTI | Speed Index |    TBT | CLS |  Transfer | Audio requests |
| --: | ----------: | ------------: | -------------: | -----: | --------: | ----------: | -----: | --: | --------: | -------------: |
|   1 |          93 |           100 |            100 | 1.725s |    3.049s |      1.725s | 14.5ms |   0 | 305,354 B |              0 |
|   2 |          93 |           100 |            100 | 1.671s |    3.157s |      1.671s |    0ms |   0 | 305,354 B |              0 |
|   3 |          93 |           100 |            100 | 1.727s |    3.051s |      1.727s | 10.5ms |   0 | 305,354 B |              0 |
|   4 |          93 |           100 |            100 | 1.718s |    3.046s |      1.718s |  6.5ms |   0 | 305,354 B |              0 |
|   5 |          93 |           100 |            100 | 1.731s |    3.058s |      1.731s |    9ms |   0 | 305,354 B |              0 |

Median Performance: **93 — PASS**. Every run recorded zero console-error items,
an errors-in-console score of 1, and no runtime-error audit.

Raw reports and SHA-256 hashes:

| Path                                                        | SHA-256                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `test-results/component-8-9-ci-final/lighthouse-run-1.json` | `9b266b90b77acfcaf1214224b3c2366c610bc995aab842dc8c5d6863007c13bc` |
| `test-results/component-8-9-ci-final/lighthouse-run-2.json` | `63e0b05937e9d5329d9d2f472f169e6dc8880fc7f0577c8a1c6d5440557c2bbd` |
| `test-results/component-8-9-ci-final/lighthouse-run-3.json` | `e13a16b341f1d238f767ecc1a4a6a42d7d896f2ece11c07d579289648b67572d` |
| `test-results/component-8-9-ci-final/lighthouse-run-4.json` | `dd596b1eba540da380cf37c2f731acafd98cf25f5e219b689ace6f3ccd5bc232` |
| `test-results/component-8-9-ci-final/lighthouse-run-5.json` | `fd8f26d5b411bdf6d2708c1297216245cfe02057c2deae22150bff962228664c` |

## Dependency and license evidence

- `pnpm audit --prod --audit-level high` — exit 0, 0.84s; no known
  vulnerabilities.
- `pnpm audit --prod --json` — exit 0, 0.61s; 19 production dependencies and
  zero info, low, moderate, high, or critical findings.
- `pnpm licenses list --prod` — exit 0, 0.30s; MIT and BSD-3-Clause only.
- `pnpm list --prod --depth Infinity --json` — exit 0, 0.33s; exact frozen
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
   supplements passed. It became commit `b7aba4d` and merged to exact main
   `864c1703c0ed08a259bdae13074450bac7ce12d0`.
10. Merge-triggered Pages run `31289567300` passed install/build/lint and all
    unit/component cases, then exposed GitHub Chromium 149's non-representative
    `SwiftShader Device (Subzero)` backend at 17.28–17.57 FPS and a causal
    initial-stock race after one coherent 220 ml service-start consumption.
    The fail-closed workflow mode now records exact GitHub/Subzero desktop
    cadence as software observation while default desktop and all touch runs
    retain calibrated authority. Playwright's clock and real Pause/Resume
    controls create the stock journey's tick-zero barrier without weakening any
    later inventory/accounting assertion.
11. `841466d8…032b1` changed the department hall's remaining Standard materials
    to Lambert or Phong according to surface intent. Five pre-gate samples all
    passed (`59.02, 55.70, 60.13, 59.98, 60.22`), but exact Tier 3 stopped when
    the calibrated hall measured 54.59 FPS. It was not rerun or accepted.
12. `6b31368c…9ae2` changes only the department hall's nine remaining Phong
    materials to Lambert while preserving every base/emissive/transparent cue,
    entity and visual-story contract. Five pre-gate samples all passed
    (`57.70, 60.12, 60.17, 60.08, 60.10`), then exact Tier 3 and all supplements
    passed. This is the sole current accepted stabilization candidate.

## Disposition boundaries

- Local automated candidate: **PASS**.
- Human merge authority: **APPROVED / RECEIVED** in the root conversation.
- Human publication authority: **APPROVED / RECEIVED** in the root
  conversation.
- Original Component 8.9 commit/PR/merge: **COMPLETE**, culminating in main
  `c28ad429`; its deployment run failed before upload.
- First stabilization commit/PR/protected merge: **COMPLETE**, culminating in
  commit `b7aba4d` and main `864c1703`; Pages run `31289567300` failed before
  upload.
- Final stabilization commit / PR / protected merge execution: **PENDING Lead
  Coordinator**.
- GitHub Actions / Pages deployment execution and exact identity: **PENDING**.
- Owner-hosted desktop/touch/WebGL2/offline/update verdict: **PENDING owner**.
- Optional physical Safari/mobile-GPU/orientation/DPR/FPS evidence:
  **PENDING / UNCLAIMED owner-only**.

No agent accessed a physical device or claimed hosted gameplay. The two earlier
authorized PR/merges executed, but no Phase 8 Pages deployment exists; this
final stabilization engagement did not commit, push, merge, publish, or change
repository settings.
