# Phase 3 Test Report — HOSTED PASS

## Release under test

- Branch: `phase-3`
- Validated release baseline before follow-up fixes: `9a85186`
- Public merge commit: `2e011eb63b75530a610adb177e352a1bd52f2538`
- Public URL: `https://sjmeehan9.github.io/tycoon/`
- Runtime: Node.js 22.13.1, pnpm 10.15.0
- Browser harness: Playwright 1.61.1, Chromium 149
- Projects: 1280×800 desktop Chromium and 360×780 touch-mobile Chromium
- Performance harness: Lighthouse 12.8.2 mobile simulation

## Exact validation sequence

Executed in the project-profile order after every local release fix:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — lockfile current |
| `pnpm build` | PASS — strict TypeScript, `/tycoon/` Vite build, 17-entry service-worker precache |
| `pnpm lint` | PASS — zero ESLint warnings and Prettier clean |
| `pnpm test` | PASS — 70 engine, balance, persistence, audio, scene, PWA, accessibility, and component tests |
| `pnpm test:e2e` | PASS — 29 applicable production desktop/touch journeys; 5 intentional non-matching-profile skips |

The five skips are explicit routing: the keyboard-only accessibility flow runs
only in desktop Chromium, the touch-only accessibility flow only in the mobile
project, and three real service-worker lifecycle cases run once in desktop
Chromium. No required scenario is skipped in its intended environment.

## Phase acceptance evidence

- Original nearest-neighbour Canvas scenes distinguish cart, kiosk, and cafe and
  expose staff, customers, equipment, weather, cosmetics, service activity, and
  equivalent textual summaries. Rendering consumes immutable engine snapshots.
- Locally bundled original audio starts disabled, requires explicit interaction
  and independent consent, persists settings, and fails safely when unavailable.
- First-day onboarding follows real phases and can be skipped or replayed.
  Keyboard/touch flows cover focus traps/restoration, automatic tabs, 44px
  targets, root and visible-element boundaries at 360px, reduced motion,
  non-colour cues, textual outcomes, and axe serious/critical checks.
- The production manifest and complete same-origin runtime install without
  Chromium manifest/installability errors. One online visit supports offline
  relaunch and autosave continuation. A real waiting worker can be deferred;
  acceptance verifies a full local checkpoint before activation and restores
  the same run after reload.
- All ten drinks, recipes/modifiers, beans, demand factors, four customer
  segments, staff, six equipment families, cart → kiosk → cafe, causal reports,
  two successful 30-day strategies, bankruptcy, target miss, endless mode,
  records/unlocks, migration, import/export, and recovery tests remain green.
- README, contribution guide, MIT license, privacy/offline/save guidance,
  `/tycoon/` configuration, main-only Pages workflow, and public release
  checklist are complete. The repository and game are publicly available.

## Performance and release evidence

Mobile Lighthouse passes every exposed project threshold: Performance 95,
Accessibility 100, Best Practices 100; FCP 1.5 s, LCP 2.9 s, TBT 10 ms, CLS 0,
and 294 KiB transferred over 11 initial requests. Lighthouse's deprecated PWA
category is not exposed, so real Chromium diagnostics and lifecycle tests are
the installability/offline gate. Full evidence and bundle sizes are in
`docs/evidence/release-audit.md`; the raw report is
`docs/evidence/lighthouse-mobile.json`.

A subsequent 360px browser smoke found the rainy forecast badge ending at
365.546875px despite the root scroll metric appearing clipped in automated
Chromium. A new element-boundary assertion reproduced that exact failure, then
passed after the mobile badge was constrained and allowed to wrap. The exact
validation sequence and Lighthouse audit above were rerun after the correction.

## Manual tests automated

The human-readable desktop/mobile day, operations, outcome, save-recovery,
accessibility, responsive, subpath, offline, and update paths live in every file
under `tests/e2e/`. They drive the production UI with real keyboard/touch input,
production imports, browser storage, downloads/uploads, Canvas, media consent,
generated service workers, root scroll metrics, and visible element boundaries.
`pnpm assets:audio`, Chromium's manifest checks, the asset inventory, workflow
parse, and full dependency audit were also executed programmatically and passed.

## Self-review

- Every requirement traces to a component and passing automated evidence in
  `docs/phase-plan.md`; public domain types and engine boundaries are exported
  through `src/game/index.ts`.
- No placeholder, TODO, FIXME, unimplemented exception, production `any`, test-
  only runtime hook, backend, secret, analytics, ad, external-content, or
  personal-data path remains.
- Simulation is pure, seeded, serializable, independent of display speed and
  rendering, and unchanged by PWA/presentation behavior. Imported data cannot
  execute and is validated before replacing state.
- The complete lockfile has no known moderate-or-higher advisory. Lighthouse is
  an exact transient QA command rather than a retained advisory-bearing tree.
- Version 1 contains none of the explicit non-goals: food, manual drink-making,
  weekly rosters, multiple locations, cloud accounts, multiplayer,
  localization, paid content, analytics, or live services.

## Hosted verification

Hosted verification completed **PASS** on 18 July 2026:

- PR `https://github.com/sjmeehan9/tycoon/pull/1` merged normally at
  `2e011eb63b75530a610adb177e352a1bd52f2538` after its release check passed.
- The public, HTTPS-enforced, workflow-based Pages release deployed through
  `https://github.com/sjmeehan9/tycoon/actions/runs/29631697939` and deployment
  `5499050417`.
- Direct load and refresh returned `200`; manifest, three icons, original title
  art, and all three audio files also returned `200` from `/tycoon/`.
- Chromium reported zero manifest/installability errors. The desktop Day 1
  event/report survived online and offline reloads with the same autosave under
  active service-worker control.
- The 360px touch flow completed planning/settings/service controls without
  hover. `clientWidth` and `scrollWidth` were both 360px; the rainy badge stayed
  within 27.78125px–332.21875px, and no visible control was undersized.
- Desktop and mobile visual review found no clipping; both profiles had zero
  console errors, page errors, or unexpected online request failures.

Complete hosted evidence is in `docs/evidence/hosted-verification.md`.

## Verdict

**HOSTED PASS.** Every local Phase 1–3 gate, deployment check, and hosted
desktop/mobile/offline target passes at the public release URL.
