# Phase 3 Implementation Context

## Component 3.1 — Human Setup & Public Release Gate

- Created `phase-3` directly from validated Phase 2 PASS head `633f294`, as
  permitted by the project profile while protected `main` remains untouched.
- Phase 3 requires no account, credential, secret, backend, or environment
  variable for private implementation and local validation.
- Recorded the only human release actions: approve the phase/public release,
  make `sjmeehan9/tycoon` public, enable GitHub Pages with GitHub Actions, and
  confirm the published URL.
- Per the approved gate timing, these actions are intentionally not due until
  Components 3.2–3.4 and the local portion of 3.5 pass. Implementation may
  proceed privately without weakening or bypassing the gate.
- No publication, deployment, repository-setting change, or external write was
  performed.

## Component 3.2 — Cohesive Pixel Scene and Local Audio

- Added an original 1600×901 title-scene WebP (164 KB) generated through the
  built-in image tool and documented the final prompt, generation ID, encoding,
  and ownership in `public/assets/ASSET_PROVENANCE.md`.
- Rebuilt the fixed 320×180 Canvas renderer around frozen `SceneSnapshot` data.
  Cart, kiosk, and cafe now show distinct architecture plus weather, equipment,
  scheduled role, customer segment, improvement, and cosmetic variations.
- Kept animation presentation-only: no renderer advances the engine, active
  rush flourishes use requestAnimationFrame independently, and reduced motion
  produces a still frame with the same accessible textual description.
- Added original deterministic local ambience/confirm/event WAVs and a typed
  regeneration script. Audio is disabled initially, requires pointer/keyboard
  interaction plus explicit independent consent, persists preferences, uses
  base-aware local paths, and treats blocked/unsupported playback as muted.
- Primary-source rechecks confirmed Canvas smoothing control and promise-based
  media/autoplay rejection behavior remain current. No stale assumption or new
  dependency was found.
- Exact validation passed: frozen install, build, lint, 64 Vitest tests, and 24
  Playwright tests across desktop and 360px touch-mobile Chromium.
- The in-app browser runtime exposed no available instance during optional
  interactive QA; real configured Playwright rendering checks passed and this
  did not alter scope or acceptance evidence.

## Component 3.3 — Onboarding, Accessibility, and Mobile Polish

- Added a first-day guide tied directly to planning, service, event, report,
  reinvestment, and ending phases. It can be skipped, finished, or replayed from
  Help; durable completion and active tab choices live in versioned preferences.
- Added shared modal-focus management and WAI-ARIA automatic tab keyboard
  behavior. Game menu and event dialogs now place, trap, and restore focus;
  Escape closes non-critical menu/onboarding dialogs without bypassing required
  event decisions.
- Added concise screen-reader phase announcements, explicit scene/service/report
  summaries, colour-independent icons and text, visible focus, contextual help,
  and progression requirements without per-tick live-region noise.
- Refined the responsive layout for scene-above-controls progressive disclosure,
  coarse-pointer 44px targets, 360px overflow safety, and reduced-motion parity.
- Added `@axe-core/playwright` as a test-only dependency. Component and real
  Chromium tests cover onboarding state, labels, focus trap/restoration,
  keyboard-only desktop completion, touch-only mobile completion, target sizes,
  horizontal overflow, and axe serious/critical findings.
- Primary-source rechecks confirmed the WAI-ARIA tabs/dialog patterns and the
  current axe Playwright package. Exact validation passed: frozen install,
  production build, lint/format, 67 Vitest tests, and 26 Playwright tests with
  two intentional browser-profile skips.

## Component 3.4 — Offline-Safe PWA and Release Artifacts

- Pinned `vite-plugin-pwa@1.3.0` and its direct prompt-client peer
  `workbox-window@7.4.1`, both verified current and compatible with Vite 8.
  Generated Workbox precaches all same-origin HTML, chunks, original art/audio,
  manifest, SVG, and 192px/512px/maskable PNG icons.
- Production Vite and manifest base/scope/start URL are `/tycoon/`; development
  remains root-based. Playwright now always rebuilds and exercises the real
  production preview, so every retained journey validates Pages asset paths.
- Added prompt-mode update UI with no automatic active-run reload. Deferral
  leaves the waiting worker untouched; acceptance synchronously checkpoints and
  verifies the complete current save before activation, and blocks safely if
  browser storage fails.
- Added real service-worker Playwright proof for complete first-load caching,
  offline relaunch and active-save continuation, waiting-worker deferral, and
  checkpointed activation/restoration. Component tests also prove save-before-
  update ordering and failed-checkpoint blocking.
- Replaced template documentation with gameplay, architecture, setup,
  validation, accessibility, privacy, offline/update, save-transfer, and Pages
  guidance; added contribution rules, MIT license, release checklist, and a
  build/validate/deploy workflow restricted to protected `main` publication.
- Current official Vite, Vite PWA, MDN service-worker, and GitHub Pages Actions
  documentation confirmed every external assumption. Workflow YAML parses;
  source/bundle review found no external runtime request, telemetry, ad, secret,
  or personal-data path. No public write or visibility change was performed.
- Cumulative validation passes 70 Vitest tests and 29 Playwright tests with five
  intentional browser-profile skips; generated precache is 17 entries / about
  780 KiB and application JavaScript is about 90 KiB gzip.

## Component 3.5 — Cumulative QA, Phase Documentation, and Public Verification

- Re-ran every Phase 1–3 engine, balance, persistence, component, desktop,
  touch-mobile, accessibility, subpath, offline, and update scenario against the
  production release. Exact validation passes 70 Vitest tests and 29 applicable
  Playwright journeys; five non-matching-project entries are explicit skips.
- Extended the PWA release proof with Chromium's manifest/installability
  diagnostics (zero errors) and retained real waiting-worker lifecycle tests.
- Ran mobile Lighthouse against `/tycoon/`. A minor incompatible `aside` status
  override was corrected; final scores are Performance 95, Accessibility 100,
  and Best Practices 100, with FCP 1.5 s, LCP 2.9 s, TBT 10 ms, and CLS 0.
- Used transient Lighthouse 12.8.2 because current 13.4 requires Node 22.19,
  above the approved 22.12 baseline. The raw report and checksum are committed;
  no Lighthouse PWA score is exposed, so real Chromium installability/offline
  proof supplies that gate.
- Regenerated original audio, inventoried the full 17-entry / 779.57 KiB
  precache, parsed the Pages workflow, reviewed runtime requests/privacy, and
  ran a complete moderate-level dependency audit with no known findings.
- Created the cumulative local test report, evidence summary, release runbook,
  completed local checklist, and component handoff. All explicit requirements
  and non-goals were self-reviewed with no missing or silently deferred local
  behavior.
- Status is LOCAL PASS / HOSTED PENDING. Publication is blocked on the Component
  3.1 human gate; no push, merge, visibility change, Pages configuration,
  workflow dispatch, deployment, or hosted claim was made.
