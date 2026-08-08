# Component 7.3 — Complete Kiosk and Cafe Isometric Worlds

## What was delivered

A user can now run service at the cart, kiosk, or cafe inside a complete,
venue-distinct fixed-isometric WebGL world. The kiosk adds a permanent covered
counter, storage wall, pickup rail, owned equipment, and sheltered service
lane. The cafe adds an open L-shaped counter, display case, full stock wall,
seating, windows, pendant ambience, plants, and the larger staffed operation.

Every world consumes the same detached, deeply frozen render snapshot. Exact
queue/overflow, active service, sale/walkaway, stock, equipment, staff, weather,
and activity truth has matching 3D, HUD, and semantic text evidence. The
temporary kiosk/cafe service-time Canvas bridge is deleted. Unsupported or lost
WebGL2 now receives semantic recovery at every service venue and can never
select Canvas gameplay.

## Public interfaces / contracts exposed

- `VENUE_LAYOUTS` is a deeply frozen `Record<VenueId, VenueLayout>` whose
  `satisfies` constraint fails compilation when a venue is missing.
- `venueLayoutFor(venueId)` returns presentation-only floor bounds, customer,
  staff, owner, service, activity, stock, and overflow anchors plus explicit
  rendering budgets.
- Layout bounds are 12 visible customers, 10 scheduled staff, two lights, one
  shadow-casting light, at most 32 repeated furnishing/effect instances, and
  the existing `1.5` DPR cap.
- `ServiceWorld` accepts every service-phase `VenueId` and dispatches through an
  exhaustive switch to `CartWorld`, `KioskWorld`, or `CafeWorld`. Its default
  branch accepts only `never`.
- `People` uses the selected immutable layout for bounded queue, active
  customer, owner, and scheduled-staff placement. Animation remains local
  transform-only work.
- Stable inspection data now includes venue/world/layout identity, visible and
  maximum crowd counts, staff count, equipment, queue/overflow, light/shadow,
  furnishing, DPR, weather, speed, motion, and snapshot authority.
- `App` dynamically imports `ServiceWorld` for every `rush`/`event` phase. The
  legacy `CanvasScene` is a separate lazy non-service route only.

## Files owned

Created:

- `src/scene/three/venues/KioskWorld.tsx`
- `src/scene/three/venues/CafeWorld.tsx`
- `src/scene/three/venues/venueLayout.ts`
- `docs/components/phase-7-component-7-3-overview.md`

Modified:

- `src/App.tsx`
- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/entities/People.tsx`
- `tests/unit/scene.test.ts`
- `tests/components/presentation.test.tsx`
- `tests/e2e/webgl-service.spec.ts`
- `tests/e2e/presentation.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/implementation-context-phase-7.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

Declared ownership paths `src/scene/CanvasScene.tsx`,
`src/scene/scenePlayback.ts`, `src/scene/sceneModel.ts`,
`src/scene/three/renderSnapshot.ts`, and `src/styles.css` were inspected and
retained unchanged. They remain in the scoped fingerprint.

## How to run / verify

```bash
pnpm build
pnpm lint
pnpm test
pnpm preview --host 127.0.0.1 --port 4173
pnpm exec playwright test tests/e2e/webgl-service.spec.ts tests/e2e/presentation.spec.ts
python3 scripts/worktree-fingerprint.py -- src/App.tsx src/scene/CanvasScene.tsx src/scene/scenePlayback.ts src/scene/sceneModel.ts src/scene/three src/styles.css tests/unit/scene.test.ts tests/components/presentation.test.tsx tests/e2e/webgl-service.spec.ts tests/e2e/presentation.spec.ts tests/fixtures/campaignFixtures.ts
```

The recorded browser gate used one already-built preview. Chromium requires
permission to launch outside the restricted macOS sandbox in this environment.

## Integration notes & gotchas

- Phase 7 service is now WebGL-only at all three current venues. Do not restore
  a venue or capability-based Canvas service branch.
- `CanvasScene` still exists as a separately lazy-loaded non-service planning,
  report, and reinvest presentation. Component 7.4 owns the approved removal of
  the planning preview and service information-flow recomposition; this is not
  a gameplay fallback.
- Phase 8's fourth `VenueId` must add a `VENUE_LAYOUTS` entry and one
  `ServiceWorld` dispatch branch in the same component that generalizes the
  venue contract. TypeScript intentionally fails until both are present.
- World layout data is presentation-only. Static inspection finds no import
  from the engine, persistence, content, app, or component layers.
- Global R3F lighting remains one ambient plus one shadow-casting directional
  light. Pendant/window/sign ambience uses emissive materials rather than
  unbounded scene lights.
- Repeated crowd/furnishing/weather work is bounded and instanced. No bound
  depends on day, retained activity history, or campaign length.
- The approved title art remains byte-identical at SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion | Runtime behavior and files | Proof |
|---|---|---|
| Every existing venue has a complete distinct WebGL world | Exhaustive `ServiceWorld` dispatch, immutable `venueLayout.ts`, procedural `KioskWorld` and `CafeWorld`, retained cart world | Venue-layout/unit assertions, component dispatch matrix, desktop and 360×780 screenshots for all three worlds |
| Venue operations remain accurate and readable | Tier-specific floor plans, counters, storage, equipment, staff/customer anchors, queue markers/overflow, stock racks, activity markers, weather and ambience plus common HUD/figcaption | Full-operation 16-customer fixtures assert equipment, 2/3/5 staff, weather, activity, stock text, queue 16/visible 12/overflow 4 |
| Renderer remains immutable and deterministic | Existing deep-frozen snapshot is the only world input; layouts are deeply frozen; frame callbacks update matrices only | Three-venue snapshot mutation/bound tests and nine full-rush 1×/2×/4× observed-vs-control equality runs |
| Reduced motion and context recovery preserve information | Every world remains mounted with demand framing and static transforms; recovery remounts the same venue snapshot | Kiosk/cafe desktop/touch loss, retry, reduced-motion, speed, reload, and exact persisted-economic-truth checks; retained cart coverage |
| Service can never reach Canvas | All service phases select `LazyServiceWorld`; direct service import never fetches `CanvasScene`; manifest service imports exclude it; WebGL failure uses recovery | Static App/ServiceWorld tests, production manifest/HTML inspection, direct cart/kiosk/cafe resource timing, unsupported/context-loss browser assertions |
| Performance and offline bounds remain explicit | 12 customers, 10 staff, two lights, one shadow light, at most 32 repeated instances, DPR 1.5; WebGL and Canvas remain separate dynamic entries | Layout/unit attributes, real WebGL assertions, emitted-file walk and Workbox manifest inspection; largest file 724,524 bytes |

## Assurance lane

- **Lane:** `fast (lean override)`
- **Validation tier / owner / commit owner:** Tier 2 component gate / Implement /
  Implement
- **Standard Test triggers recorded:** multi-venue WebGL UI, import/reload
  persistence, context loss, reduced motion, responsive mobile rendering, and
  regression-prone replacement of the service renderer.
- **Standard Review triggers recorded:** broad shared renderer, App entry, and
  immutable layout/snapshot contracts.
- **Lean disposition:** the approved two-role restriction assigns the Tier 2
  gate, self-review, correction, and commit to Implement.

## Deviations and decisions

- No product behavior was descoped and no external dependency changed.
- Component 7.2's exact R3F/Three/Vite capability evidence remains current.
  Component 7.3 introduced no new external API assumption; its Technical
  Validation was compiler, static graph, production manifest, and real-browser
  proof.
- Canvas was retained only as a lazy non-service route because Component 7.4
  explicitly owns planning/report-flow recomposition. It is absent from the
  ServiceWorld import graph and every direct service load.
- One focused-test fixture defect initially left hired staff in the candidate
  list. The fixture now removes hired IDs before serialization; the corrected
  candidate passed all targeted and Tier 2 checks.

## Validation evidence

- **Candidate fingerprint:**
  `6003451b87c5474f8fce64f80d3bf1368d72f271eee9e3d7309a3487ae136733`
- **Fingerprint command:** the exact scoped command in **How to run / verify**;
  exit 0 before Tier 2 and exit 0 in 0.012622 seconds after Tier 2 with the same
  hash.
- **Fingerprint scope:** App entry; retained Canvas/model/playback contracts;
  the complete `src/scene/three` graph; styles; named unit, component, and
  browser tests; and campaign fixtures. Overview, context, progress, and team
  state are evidence files excluded by the fingerprint contract.
- **Final targeted proof:** TypeScript no-emit PASS; scene/presentation Vitest
  33/33 PASS; lint/Prettier PASS. Focused desktop WebGL 5/5 PASS; focused
  360×780 WebGL/presentation 6/6 PASS. Kiosk/cafe desktop and mobile screenshots
  were visually inspected for distinct floor plans, fitted framing, readable
  queue/counter/stock/activity cues, and occlusion-safe operation.
- **Tier 2 build:** `pnpm build`; exit 0 in 3.560069 seconds. Dynamic
  `ServiceWorld` is 204,016 bytes; separate dynamic non-service `CanvasScene`
  is 12,910 bytes; isolated `three-webgl` is 724,524 bytes; main is 307,127
  bytes.
- **Tier 2 lint:** `pnpm lint`; exit 0 in 6.870590 seconds.
- **Tier 2 tests:** `pnpm test`; exit 0 in 5.544755 seconds, 16 files and
  140/140 tests.
- **Tier 2 browser:** against one already-built preview,
  `pnpm exec playwright test tests/e2e/webgl-service.spec.ts tests/e2e/presentation.spec.ts`;
  exit 0 in 14.426518 seconds, 12/12 across desktop Chromium and 360×780 touch
  mobile.
- **Production/cache inspection:** `ServiceWorld` is a dynamic entry whose
  imports contain no Canvas chunk; production HTML names neither dynamic scene
  nor `three-webgl`; Workbox precaches 22 entries / 1,727.55 KiB total. A
  recursive emitted-file assertion passed, with every file below 1,000,000
  bytes and `three-webgl` the largest at 724,524 bytes.
- **Renderer/engine separation:** static inspection found only the expected
  read-only `useGame` access and snapshot adapter selector; no command,
  dispatch, engine advance, RNG, or layout import enters the renderer.
- **Title integrity:** SHA-256 remains
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.
- **Raw logs:** none required; final outputs are short and reproducible.

## Manual tests automated

- Desktop and 360×780 screenshots cover normal cart service plus dense kiosk
  and cafe worlds. They are captured in `webgl-service.spec.ts` and were
  visually inspected.
- Direct save import, exact venue dispatch, reload, full equipment, scheduled
  staff, queue overflow, weather, activity, stock text, reduced motion, speed,
  context loss/retry, unsupported WebGL2, Canvas resource exclusion, responsive
  containment, production chunk graph, and cache-size bounds are automated.

## Human tasks

- No Component 7.3 account, credential, secret, asset, backend, or publication
  task exists.
- Representative physical touch-device evidence remains reserved for Component
  7.6 and is not claimed by Playwright.
- Phase 7 merge still requires explicit human approval after Component 7.6.
