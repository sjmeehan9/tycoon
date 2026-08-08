# Component 8.8 — Offline, Update, Performance, and Release Readiness

## What was delivered

A user can now install the complete forty-day, four-venue game at `/tycoon/`,
reload and finish a dense department-store service offline after one online
load, defer a waiting update throughout active service, and explicitly accept
that update at a safe point without losing or double-settling schema-v4 play.

The release candidate also has browser-measured dense-scene budgets, a smaller
title entry graph, Lighthouse mobile PASS, canonical sub-megabyte precaching,
current dependency/security/license evidence, and Phase 8 release,
superseding-build, and rollback instructions. Nothing was merged, deployed,
published, or changed in repository/Pages settings.

## Public interfaces and contracts

- `DEPARTMENT_FRAME_PERFORMANCE_BUDGET` exposes immutable full and compact
  cadence budgets: desktop full LOD is at least 55 rendered FPS with p95 no more
  than 34 ms; emulated-touch compact LOD is at least 30 FPS with p95 no more than
  50 ms.
- `DEPARTMENT_FULL_RENDER_SCALE` is `0.9`. Department full LOD combines that
  internal scale with the existing DPR cap; compact LOD retains scale `1`.
- The department scene exposes browser-inspectable cadence and renderer
  attributes including `data-frame-sample-status`, `data-measured-fps`,
  `data-p95-frame-time-ms`, `data-render-scale`, `data-antialias`,
  `data-colour-update-policy`, and `data-shadow-update-policy`.
- Cadence uses 30 React Three Fiber callback warm-up frames followed by 120
  rendered callback deltas. Simulation ticks remain the only gameplay truth.
- Department MSAA is disabled for the established pixel-crisp presentation;
  static instance colours and `BasicShadowMap` refresh only on immutable
  snapshot/layout changes. Transform animation stays in the shared render loop.
- The PWA prompt disables activation in `rush` and `event`, labels the reason,
  and never queues activation after **Keep playing**. A later safe phase requires
  a new explicit **Save and update** choice.
- Accepted activation writes and reads back a current schema-v4 checkpoint
  before `SKIP_WAITING`. Gameplay, preferences, and meta restore identically;
  only top-level `savedAt` is intentionally refreshed monotonically.
- Production uses `/tycoon/` manifest ID, start URL, scope, and base paths.
  `skipWaiting` and `clientsClaim` stay false; the Workbox runtime is inlined and
  the canonical generated runtime graph is precached exactly once.
- TitleScreen, PWA registration, Planner, onboarding, and active rush controls
  remain immediate. Other non-title panels, game tools, and audio/announcement
  directors are accessible lazy chunks and are part of the offline precache.

## Files owned

Exact fingerprint-owned scope:

- `vite.config.ts`
- `package.json`
- `pnpm-lock.yaml`
- `src/main.tsx`
- `src/App.tsx`
- `src/pwa/PwaUpdatePrompt.tsx`
- `src/scene/three/**`
- `src/styles.css`
- `public/**`
- `tests/components/pwa-update.test.tsx`
- `tests/e2e/pwa.spec.ts`
- `tests/e2e/department-store-scene.spec.ts`
- `tests/e2e/persistence.spec.ts`
- `tests/e2e/service-layout.spec.ts`
- `docs/release-runbook.md`
- `docs/public-release-checklist.md`
- `docs/components/phase-8-component-8-8-overview.md`
- `docs/implementation-context-phase-8.md`
- `docs/phase-progress.json`
- `docs/phase-8-component-breakdown.md` (frozen specification input)

Modified delivery paths:

- `vite.config.ts`
- `package.json`
- `src/App.tsx`
- `src/pwa/PwaUpdatePrompt.tsx`
- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/entities/ActivityEffects.tsx`
- `src/scene/three/entities/People.tsx`
- `src/scene/three/materials.ts`
- `src/scene/three/venues/departmentLayout.ts`
- `tests/components/pwa-update.test.tsx`
- `tests/e2e/pwa.spec.ts`
- `tests/e2e/department-store-scene.spec.ts`
- `docs/release-runbook.md`
- `docs/public-release-checklist.md`
- `docs/implementation-context-phase-8.md`
- `docs/components/phase-8-component-8-8-overview.md`
- `docs/phase-progress.json`

Owned but intentionally byte-unchanged: `pnpm-lock.yaml`, `src/main.tsx`,
`src/styles.css`, `public/**`, `tests/e2e/persistence.spec.ts`, and
`tests/e2e/service-layout.spec.ts`. No dependency was added. The title artwork
remains byte-identical at SHA-256
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion                                                                           | Runtime behavior and source                                                                                           | Proof                                                                                                                                                |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete app installs and reloads offline at `/tycoon/` after first load                       | Production base/manifest and canonical Workbox graph in `vite.config.ts`; selected non-title chunks in `src/App.tsx`  | `tests/e2e/pwa.spec.ts` validates Chromium installability, exact generated inventory, every offline response, and warm/cold reload                   |
| Active v4 service survives deferred and accepted updates without reset or duplicate settlement | Active-service guard and verified checkpoint in `src/pwa/PwaUpdatePrompt.tsx`                                         | Five component tests plus two real waiting-worker Playwright paths; full offline service reaches report, settles once, and opens next planning day   |
| Every precached file is below 1 MB                                                             | One canonical 25-file runtime graph, inlined Workbox runtime, explicit 1,000,000-byte ceiling                         | Inventory reports 1,875,977 bytes total; largest file is 724,524 bytes; service worker is 16,496 bytes                                               |
| Dense scene meets automated desktop/mobile responsiveness                                      | Snapshot shadows/colours, department MSAA policy, full render scale, and cadence telemetry under `src/scene/three/**` | Desktop 1280×800: 57.41 FPS, p95 20.9 ms; emulated DPR-2 touch 360×780: 60.01 FPS, p95 17.9 ms                                                       |
| Lighthouse meets exposed profile targets                                                       | Noncritical title-route splitting in `src/App.tsx`; Lighthouse 13.4.1 command pinned in `package.json`                | Performance 90, Accessibility 100, Best Practices 100; Lighthouse 13 exposes no PWA category, so browser installability/offline tests own that proof |
| Dependency/network/release readiness is explicit                                               | Unchanged frozen dependency graph; release and superseding-build instructions in both release docs                    | Zero advisories at every severity, MIT/BSD-3-Clause only, 27 observed requests all same-origin `/tycoon/`, and no publication action                 |
| No publication before human gate                                                               | Separate merge and publication decisions remain unchecked                                                             | `docs/public-release-checklist.md` keeps Component 8.9, merge, publication, hosted, and owner-only physical evidence provisional                     |

## How to run and verify

Use Node.js 22.12+ and pnpm 10; final evidence used Node.js 24.18.0.

```bash
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test tests/e2e/pwa.spec.ts tests/e2e/persistence.spec.ts tests/e2e/service-layout.spec.ts tests/e2e/department-store-scene.spec.ts --workers=1
pnpm preview --host 127.0.0.1 --port 4173
pnpm audit:lighthouse
pnpm audit --prod --audit-level high
pnpm licenses list --prod
pnpm list --prod --depth Infinity
```

The preview and every browser operation require the coordinator's exclusive
port/browser lease. Stop preview after Lighthouse and verify no listener remains
on port 4173.

## Integration notes and gotchas

- Vite development mode remains rooted at `/`; only production uses
  `/tycoon/`. Installability/offline assertions must run against `pnpm preview`,
  never the development server.
- Every generated lazy JavaScript file is release-critical. Adding a runtime
  extension or chunk requires updating the exact production-output inventory
  assertion rather than weakening it.
- The PWA Playwright file temporarily appends a marker to `dist/sw.js` to create
  a real waiting worker and restores the exact built worker after each case. It
  runs serially and must not share a mutable preview/build with another agent.
- **Keep playing** only dismisses the current prompt. It deliberately does not
  cause deferred activation when service later ends.
- Cadence data is applicable only to an animated department scene. Paused or
  reduced-motion snapshots correctly report `not-applicable`; tests resume the
  scene before sampling.
- Desktop full LOD uses 0.9 internal scale and canvas DPR 0.9 at browser DPR 1.
  Compact touch uses scale 1 and the existing 1.25 DPR cap at emulated DPR 2.
- Lighthouse 13.4.1 does not expose a PWA category. Do not infer PWA PASS from
  Lighthouse; use the production CDP manifest/installability and offline suite.
- The optional physical-mobile check is owner-only and may happen only after a
  separately approved publication. It remains pending and unclaimed. Automated
  SwiftShader/Chromium evidence is not a physical Safari, GPU, orientation, or
  device result.
- Neither Component 8.8 completion nor a later merge decision authorizes Pages
  publication. Follow the separate gates in `docs/release-runbook.md`.

## Assurance lane

Lane: **fast (lean override)**, Tier 2, owned by Implement. Commit owner is the
Lead Coordinator under the approved sealed-worktree assignment.

Matched standard Test triggers: service-worker lifecycle and installability,
offline/persistence/service round trips, browser responsive behavior, first
cadence instrumentation, and regression-prone WebGL/update behavior.

Matched standard Review triggers: shared app-entry/build/PWA configuration,
public renderer budget/data contracts, release safety, and broad source/test
scope. The approved lean-team override assigns the component gate and
self-review to Implement without a separate Test/Review agent. The lane was not
downgraded.

## Decisions, technical validation, and remediation

- Current official Workbox/Vite PWA contracts were rechecked for explicit
  message-only `SKIP_WAITING`, prompt registration, `globIgnores`, inlined
  runtime, and maximum precache file size. The production build and real waiting
  worker are the executable capability proof.
- Current React Three Fiber documentation was rechecked for `useFrame` within
  the shared render loop. Browser cadence proves the composed runtime behavior.
- Lighthouse 13.4.1 was verified compatible with Node.js 24.18.0. Its exposed
  default categories are Performance, Accessibility, Best Practices, and SEO;
  the project requests the first three, while PWA proof stays in Playwright.
- `globIgnores` prevents copied manifest/icon duplicates; their generated
  release URLs remain present exactly once in the precache. The runtime graph is
  compared against the actual recursive `dist` inventory, not a hand-maintained
  filename list.
- The first frozen candidate passed build/lint/unit/E2E but Lighthouse
  Performance scored 85. No threshold changed. `src/App.tsx` split noncritical
  title-route work and reduced the entry from 385.59 kB to 352.18 kB.
- A subsequent frozen candidate exposed two existing synchronous Planner
  contracts. A bounded repair restored Planner, onboarding, and rush controls to
  the immediate path while keeping other work lazy. Targeted 4/4, focused 48/48,
  and full 220/220 tests passed before the final candidate was frozen.
- No spec deviation, dependency, schema/key change, remote asset, telemetry,
  device access, merge, deployment, or publication was introduced.

## Validation evidence

Final candidate fingerprint:

```bash
python3 scripts/worktree-fingerprint.py -- vite.config.ts package.json pnpm-lock.yaml src/main.tsx src/App.tsx src/pwa/PwaUpdatePrompt.tsx src/scene/three src/styles.css public tests/components/pwa-update.test.tsx tests/e2e/pwa.spec.ts tests/e2e/department-store-scene.spec.ts tests/e2e/persistence.spec.ts tests/e2e/service-layout.spec.ts docs/release-runbook.md docs/public-release-checklist.md docs/components/phase-8-component-8-8-overview.md docs/implementation-context-phase-8.md docs/phase-progress.json docs/phase-8-component-breakdown.md
```

Result before and after the complete gate:
`292d06c8b4260cc1500474c90ca13b27f10a40bd21ae07ca047d0a1b19619e3b`.
The overview and phase-progress state are declared fingerprint exclusions;
`docs/implementation-context-phase-8.md` is included and was not edited after
the freeze.

Final Node.js 24.18.0 results:

- `pnpm build` — exit 0, 4.06 s. Twenty-five canonical precache entries,
  1,808.16 KiB reported; largest generated runtime file 724.52 kB.
- `pnpm lint` — exit 0, 8.58 s.
- `pnpm test` — exit 0, 8.86 s; 16 files and 220 tests passed.
- Scoped Playwright command above — exit 0, 2.4 minutes; 16 applicable cases
  passed, four intentional project-specific skips, zero failures.
- `pnpm audit:lighthouse` — exit 0, 11.37 s; Performance 90,
  Accessibility 100, Best Practices 100; FCP 1.7 s, LCP/TTI 3.5 s, Speed Index
  1.7 s, TBT 20 ms, CLS 0, no runtime error or warning.
- `pnpm audit --prod --audit-level high` — exit 0, 0.36 s; no known
  vulnerabilities. JSON audit reports 19 dependencies and zero info, low,
  moderate, high, or critical findings.
- `pnpm licenses list --prod` — exit 0, 0.11 s; MIT and BSD-3-Clause only.
- `pnpm list --prod --depth Infinity` — exit 0, 0.08 s; exact frozen production
  graph inspected, with no dependency addition.
- Source/built static inspection plus browser request capture — no configured
  remote asset/API/telemetry path. Built URL literals are standards/library
  metadata only; 27 observed runtime requests use only
  `http://127.0.0.1:4173/tycoon/`.
- `shasum -a 256 public/assets/art/laneway-title.webp` — exact required hash.
- Final `lsof -nP -iTCP:4173 -sTCP:LISTEN` — exit 1 with no output, proving the
  preview was stopped and the lease released.

Raw browser artifacts:

- `test-results/component-8-8/lighthouse-mobile.json`
- `test-results/pwa-offline-safe-productio-c4c92-nd-complete-offline-service-desktop-chromium/release-cache-and-network-inventory.json`
- `test-results/department-store-scene-den-56830-s-and-settled-bounded-WebGL-desktop-chromium/renderer-frame-cadence.json`
- `test-results/department-store-scene-den-56830-s-and-settled-bounded-WebGL-touch-mobile/renderer-frame-cadence.json`

Desktop cadence environment: Chromium 149.0.7827.55, 1280×800, browser DPR 1,
canvas DPR 0.9, cap 1.5, render scale 0.9, SwiftShader Vulkan renderer, 30-frame
warm-up plus 120 callback deltas, 57.41 FPS, median 16.8 ms, p95 20.9 ms.

Touch cadence environment: Chromium 149.0.7827.55 touch-mobile emulation,
360×780, emulated DPR 2, canvas DPR 1.2493, cap 1.25, render scale 1,
SwiftShader Vulkan renderer, the same sampling method, 60.01 FPS, median 16.6
ms, p95 17.9 ms.

Both records set `physicalDeviceClaimed: false`.

## Manual tests automated and human tasks

All programmatically executable manual checks were automated: installability,
base/subpath routing, every-file offline fetch, warm/cold reload, full offline
service/settlement, real waiting-worker deferral and acceptance, exact persisted
content restoration, context recovery, desktop/touch layout, renderer cadence,
request-origin audit, and Lighthouse.

Component 8.8 has no human setup task. The remaining human decisions are the
separate post-Component-8.9 merge gate and later publication gate. Optional
physical-mobile evidence is also owner-only after publication and remains
pending/unclaimed.
