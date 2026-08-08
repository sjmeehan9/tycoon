# Phase 7 Component Breakdown — Fixed-Isometric Service World

## Approval and phase contract

Status: **Spec-Validated**

The user approved the complete Phases 7–8 plan on 2026-08-08 and authorized
immediate implementation. Phase 7 starts from repository head `1f54d61` on the
`phase-7` branch, including the approved planning-document changes. It replaces
the service presentation for cart, kiosk, and cafe, and streamlines the daily
flow without changing campaign length, progression, difficulty, menu content,
or authoritative simulation outcomes.

The pure engine remains the only authority for time, demand, orders, queues,
inventory, cash, reputation, reports, and settlement. React owns semantic
controls and accessible text. Three.js/React Three Fiber consume immutable,
bounded snapshots and may own presentation state only. Morning planning has no
scene. The Phase 7 merge candidate is WebGL2-only during service and retains no
Canvas gameplay path.

One Implement engagement owns every component sequentially, including source,
tests, fixes, self-review, evidence, documentation, and commits. No other task
agent writes implementation. Components 7.2–7.5 use `fast (lean override)` and
the Tier 2 component gate. Component 7.6 uses `phase-gate (lean override)` and
the complete Tier 3 gate. Component 7.1 is documentary Tier 1 proof.

## Phase-wide Technical Validation

- Re-verify and record official compatibility before dependency installation:
  React Three Fiber v9 with React 19 and Vite, current stable Three.js, WebGL2,
  package licensing, and the existing Vite/Workbox build.
- Primary references:
  - <https://r3f.docs.pmnd.rs/getting-started/installation>
  - <https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide>
  - <https://github.com/pmndrs/react-three-fiber/releases>
  - <https://threejs.org/docs/pages/WebGLRenderer.html>
  - <https://threejs.org/docs/pages/WebGL.html>
  - <https://threejs.org/docs/pages/InstancedMesh.html>
  - <https://threejs.org/docs/pages/OrthographicCamera.html>
  - <https://threejs.org/manual/en/responsive.html>
- Pin exact mutually compatible dependency versions in `pnpm-lock.yaml`. Do not
  add a remote model, texture, font, telemetry, asset CDN, or runtime API.
- Keep the 3D route lazy. Every generated production file precached by Workbox
  must remain below `1_000_000` bytes. Split vendor/venue code where required.
- Require WebGL2. Capability loss produces a semantic, focus-managed message
  with safe navigation; it never selects Canvas or DOM gameplay.
- Use an orthographic fixed-isometric camera, controlled DPR, bounded lighting,
  instancing for repeated meshes, and bounded customer/staff entities.
- Treat Playwright in a real browser as the WebGL/layout source of truth. Unit
  tests cover pure snapshot adapters and deterministic presentation models;
  jsdom tests must not pretend to prove GPU rendering.
- Preserve `public/assets/art/laneway-title.webp` byte-for-byte.
- Human validation is reserved on a representative mid-tier WebGL2 touch device
  at the Phase 7 gate. Desktop target is 1280×800; mobile target is exactly
  360×780 with the scene and complete rush dashboard visible together without
  document scrolling.

## Component 7.1 — Human Setup and Phase-7 Gate Reservation

Status: **Spec-Validated**

### Runtime outcome

The approved branch, ownership, compatibility checklist, device evidence path,
and merge gate are recorded before package or gameplay work begins.

### Deliverables and ownership

- Confirm `phase-7` branches from approved head `1f54d61` and contains no
  gameplay commit on `main`.
- Record the user's 2026-08-08 approval and the representative WebGL2 touch
  device reservation for Component 7.6.
- Record that Phase 7 requires no account, credential, secret, paid asset,
  backend, or publication action.
- Initialize the phase implementation context, progress record, component
  overview, and agent state.
- Preserve the human merge gate after Component 7.6 PASS.

### File ownership

- `docs/phase-7-component-breakdown.md`
- `docs/phase-8-component-breakdown.md`
- `docs/implementation-context-phase-7.md`
- `docs/components/phase-7-component-7-1-overview.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

### Dependencies

Approved `docs/phase-plan.md`, approved profile validation tiers, completed
Phases 1–6, and both component breakdowns marked `Spec-Validated`.

### Technical Validation

Branch/head and documentation inspection are sufficient because this component
changes no runtime. The recorded compatibility checklist must cite primary
sources and distinguish planned physical-device evidence from completed proof.
No package or product test is required until the first runtime slice.

### Acceptance mapping

- Both Phase 7 and Phase 8 breakdowns name files, dependencies, Technical
  Validation, acceptance criteria, assurance lane, and validation tier for all
  15 additive components.
- The compatibility checklist and device gate are explicit and unclaimed work
  is not recorded as complete.
- No package, runtime source, deployment, merge, or publication change occurs.

### Validation gate

Assurance lane `fast (lean override)`, Tier 1 documentary inspection,
`git diff --check`, branch/head inspection, and the component overview. Commit
only after the evidence is internally coherent.

## Component 7.2 — Snapshot-Only WebGL Cart Service

Status: **Spec-Validated**

### Runtime outcome

A cart campaign can complete a real service rush through a warm, original,
low-poly fixed-isometric WebGL world while all gameplay remains engine-owned and
all controls/text remain semantic React UI.

### Deliverables

- Pin verified Three.js and React Three Fiber dependencies.
- Add a lazy service-world boundary that is mounted only during service.
- Add explicit WebGL2 capability and context-loss handling with accessible,
  save-safe recovery guidance and no 2D capability fallback.
- Define one deeply readonly, bounded render snapshot derived from existing
  `GameState`, canonical activity, venue, weather, scheduled staff, equipment,
  queue, active service, and stock signals. Freeze/mutation tests must prove the
  renderer cannot write engine state.
- Build the cart world with an orthographic isometric camera, procedural
  geometry/materials, bounded lights/shadows, instanced furnishings/people, and
  controlled DPR. Reproduce queue, service, sale, exit, walkaway, equipment,
  weather, and activity cues without computing outcomes.
- Reduced motion retains the complete 3D world and text while stopping or
  minimizing travel/pose transitions.
- Split production chunks so no Workbox-precache file exceeds 1 MB.
- Keep the existing Canvas renderer reachable only for kiosk/cafe on the
  unmerged Phase 7 branch until Component 7.3. It must not activate because of
  WebGL failure and makes the Component 7.2 head non-mergeable/non-releasable.
- Preserve `public/assets/art/laneway-title.webp` byte-for-byte.

### File ownership

- `package.json`, `pnpm-lock.yaml`, `vite.config.ts`
- `docs/project-profile.md` (exact 3D dependency pins only)
- `src/App.tsx`
- `src/scene/sceneModel.ts`
- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/WebGLBoundary.tsx`
- `src/scene/three/renderSnapshot.ts`
- `src/scene/three/camera.ts`
- `src/scene/three/materials.ts`
- `src/scene/three/entities/People.tsx`
- `src/scene/three/venues/CartWorld.tsx`
- `src/components/RushPanel.tsx`, `src/styles.css`
- `tests/unit/scene.test.ts`
- `tests/components/presentation.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/e2e/webgl-service.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-7-component-7-2-overview.md`
- `docs/implementation-context-phase-7.md`, `docs/phase-progress.json`

The Implement agent may introduce a smaller supporting module inside
`src/scene/three/` when its single responsibility and dependency direction are
documented in the component overview. It may not relocate engine authority.

### Dependencies

Component 7.1, Phase 6 canonical activity and scene snapshot contracts, the
existing service commands, and the frozen official-source validation record.

### Technical Validation

- R3F v9 is paired with React 19; the chosen exact versions must build under the
  repository's Vite version and license policy.
- Current Three.js WebGLRenderer requires WebGL2. Use its capability helpers or
  equivalent feature detection before mounting the production scene.
- Orthographic projection must keep scale stable under resize. DPR is explicitly
  capped rather than blindly matching high-density displays.
- Repeated meshes use `InstancedMesh` or an equally bounded draw-call strategy.
- `useFrame` and presentation callbacks may update local transforms only. They
  may not dispatch game commands, choose random outcomes, consume inventory, or
  derive accounting.
- Production manifest inspection proves the service route is lazy and every
  precached file is under 1 MB.

### Acceptance mapping

- A seeded cart rush produces identical `GameState`, report, activity, cash,
  inventory, and reputation with WebGL mounted/unmounted, at every speed, under
  reduced motion, and after a simulated context loss.
- Cart queue/service/sale/walkaway states are visibly and textually readable.
- Unsupported WebGL2 receives one semantic explanation and safe exit; Canvas is
  not selected as a fallback.
- The title asset hash is unchanged.
- Existing kiosk/cafe saves remain runnable through the explicitly temporary
  branch-only bridge, and the head is marked ineligible for merge/release.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run focused snapshot/capability/
browser tests during development, then the profile's final component sequence
once for the scoped fingerprint. Record build manifest and cache-size evidence.

## Component 7.3 — Complete Kiosk and Cafe Isometric Worlds

Status: **Spec-Validated**

### Runtime outcome

Cart, kiosk, and cafe each have a complete venue-distinct WebGL service world;
the temporary Canvas service bridge is deleted and cannot ship.

### Deliverables

- Add kiosk and cafe procedural worlds with tier-accurate floor plans, counters,
  storage, equipment, staff/customer anchors, queue overflow, weather, ambience,
  and occlusion-safe operational cues.
- Share the immutable snapshot, camera, materials, people, activity, and
  performance grammar introduced in 7.2 rather than creating venue-specific
  simulation paths.
- Use instancing for repeated furnishings/crowds and bound crowd detail, lights,
  shadows, and DPR for the mobile budget.
- Remove every App/service selector, import, and runtime branch that can mount
  `CanvasScene` for gameplay. The old file may remain temporarily only when no
  production import reaches it; deletion is preferred when tests/docs permit.
- Add exhaustive scene dispatch for every Phase 7 `VenueId` and regression
  proof across reload, pause/speed, reduced motion, and context recovery.

### File ownership

- `src/App.tsx`
- `src/scene/CanvasScene.tsx`, `src/scene/scenePlayback.ts`
- `src/scene/sceneModel.ts`
- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/renderSnapshot.ts`
- `src/scene/three/entities/People.tsx`
- `src/scene/three/venues/KioskWorld.tsx`
- `src/scene/three/venues/CafeWorld.tsx`
- `src/scene/three/venues/venueLayout.ts`
- `src/styles.css`
- `tests/unit/scene.test.ts`
- `tests/components/presentation.test.tsx`
- `tests/e2e/webgl-service.spec.ts`
- `tests/e2e/presentation.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-7-component-7-3-overview.md`
- `docs/implementation-context-phase-7.md`, `docs/phase-progress.json`

### Dependencies

Component 7.2 renderer/snapshot contract and existing cart/kiosk/cafe content,
equipment, staffing, and canonical activity.

### Technical Validation

- Venue dispatch is compiler-exhaustive and cannot silently render the wrong
  world.
- World layout data is presentation-only and never imported by the engine.
- Draw-call/entity/light/DPR bounds are explicit, inspectable, and independent
  of historical campaign length.
- Static inspection plus browser tests prove no production service import or
  capability path reaches Canvas.

### Acceptance mapping

- Every existing venue completes planning → service → report → reinvest with a
  complete distinct WebGL world and unchanged engine outcomes.
- Equipment, scheduled staff, queue, active service, weather, activity, and
  stock cues agree with accessible text at all three venues.
- Reduced motion and context recovery preserve the same world/information.
- The final Phase 7 candidate is WebGL-only for service; unsupported WebGL2
  never receives Canvas gameplay.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Use venue-exhaustive unit and
Playwright coverage, production bundle inspection, and the profile sequence for
the final scoped fingerprint.

## Component 7.4 — Immersive Service Information Flow

Status: **Spec-Validated**

### Runtime outcome

Planning is a full-width decision surface with no preview, while service reads
scene → complete dashboard → live activity → stock. At exactly 360×780, the
scene and complete dashboard fit together without document scrolling.

### Deliverables

- Mount the 3D scene only in service. Remove planning thumbnails, reserved scene
  columns, Canvas, and 3D placeholders so the planner uses the full available
  width.
- Compose a compact complete dashboard immediately below the scene with time,
  cash/revenue, served/lost/queue, satisfaction/reputation, speed/pause, active
  event state, and every required service control.
- Place live activity after the dashboard and stock after activity. They may use
  progressive disclosure below the initial viewport but remain keyboard/touch
  reachable and textually complete.
- Use a smaller mobile scene/camera framing and compact dashboard typography;
  do not hide truth or remove controls to satisfy the viewport.
- Preserve 44px touch targets, logical focus order, non-colour state, screen-
  reader announcements, safe areas, resize/orientation behavior, and reduced-
  motion parity.
- Add automated geometry assertions at 360×780 and desktop layout coverage at
  1280×800.

### File ownership

- `src/App.tsx`
- `src/components/Planner.tsx`
- `src/components/RushPanel.tsx`
- `src/components/RushStockGrid.tsx`
- `src/components/GameHeader.tsx`
- `src/accessibility/GameAnnouncer.tsx`
- `src/scene/three/ServiceWorld.tsx`
- `src/styles.css`
- `tests/components/game-loop.test.tsx`
- `tests/components/presentation.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/e2e/service-layout.spec.ts`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/webgl-service.spec.ts`
- `docs/components/phase-7-component-7-4-overview.md`
- `docs/implementation-context-phase-7.md`, `docs/phase-progress.json`

### Dependencies

Component 7.3's final WebGL-only three-venue renderer and existing semantic
React commands/selectors.

### Technical Validation

- The no-scroll condition measures document scroll position and bounding boxes,
  not screenshots alone. Browser chrome is excluded consistently; safe-area CSS
  is included.
- The dashboard completeness list is assertion-driven and shared between
  desktop/mobile tests so responsive CSS cannot silently omit an item.
- Canvas focus is not used for gameplay controls. React DOM remains the only
  keyboard/touch command surface.

### Acceptance mapping

- Planning is full-width and contains no preview scene in every venue/day state.
- Service DOM order and visible order are scene, dashboard, activity, stock.
- At 360×780, scene and complete dashboard are simultaneously visible before
  document scroll; activity and stock remain reachable immediately below.
- Desktop, touch, keyboard, screen-reader, orientation, reduced-motion, and
  event-dialog flows remain playable without hidden or hover-only controls.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run focused component and exact
360×780 Playwright geometry tests, then the profile sequence once for the final
scoped fingerprint.

## Component 7.5 — Compact Completion and Reopenable Reports

Status: **Spec-Validated**

### Runtime outcome

Day completion defaults to a compact summary with the full report collapsed, a
single exact-once `Settle & reinvest` action, and settled report history
reopenable from a Reports section in the existing Game menu.

### Deliverables

- Split current-day report presentation into compact completion and explicitly
  disclosed full detail. Keep settlement available from one primary
  `Settle & reinvest` action that calls the existing `closeDay` boundary once.
- Add a Reports tab/section to `GameTools` backed by the already-required,
  bounded `GameState.history`. It is current-campaign local history only.
- Render a selected historical report from that immutable settled `DayReport`
  alone. Never read current `game.rush`, `recentActivity`, scene state, or a
  recomputed ledger for historical detail.
- Add an optional bounded canonical charge-group aggregate to `DayReport` for
  reports settled after 7.5. Capture it once at settlement from canonical sale
  activity; validate bounds and round-trip through autosave/export/import.
- Do not rewrite or infer charge groups for existing v3 history. Older reports
  render every stored canonical field plus the accessible message “Charge
  breakdown unavailable for this older report.”
- Preserve schema version 3 and the existing `GameState.history` field. Missing
  optional charge detail is valid and causes no history migration/reset.
- Make report selection, disclosure, close/focus return, settlement, reload,
  victory, bankruptcy, and endless continuation accessible on desktop/mobile.

### File ownership

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/selectors.ts`,
  `src/game/index.ts`
- `src/persistence/saveStore.ts`
- `src/app/GameContext.tsx`
- `src/components/ReportPanel.tsx`
- `src/components/GameTools.tsx`
- `src/components/ReinvestPanel.tsx`
- `src/accessibility/useModalFocus.ts`, `src/styles.css`
- `tests/unit/engine.test.ts`, `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/e2e/report-history.spec.ts`
- `tests/e2e/persistence.spec.ts`, `tests/e2e/save-transfer.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-7-component-7-5-overview.md`
- `docs/implementation-context-phase-7.md`, `docs/phase-progress.json`

### Dependencies

Component 7.4 daily composition, existing exact-once `closeDay`, bounded
`GameState.history`, `DayReport`, save validation, and Game menu focus patterns.

### Technical Validation

- Charge groups are canonical report evidence, not a second ledger. Their sum
  must equal report revenue, and their quantities must equal served count when
  complete. Bounds derive from the finite configured order variants.
- Current-day settlement remains idempotent under repeated clicks, rerender,
  reload, and service-worker update. Historical reports expose no settlement
  command.
- Existing v3 fixtures load without mutation or synthesized charge data.
- Report rendering receives an explicit report value/mode so historical UI
  cannot accidentally close over current rush state.

### Acceptance mapping

- Full report is collapsed by default and the compact result explains the day.
- `Settle & reinvest` settles current cash/inventory/reputation/history exactly
  once and moves safely to reinvestment.
- Reports is reachable from Game menu and reopens bounded settled history after
  reload/export/import.
- Post-7.5 reports show full charge parity; pre-7.5 reports show all stored
  fields and the truthful unavailable-detail state without inference.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run focused engine/persistence/
component/history Playwright tests, then the profile sequence once for the final
scoped fingerprint.

## Component 7.6 — Phase-7 Validation and Documentation

Status: **Spec-Validated**

### Runtime outcome

The final Phase 7 head has cumulative local PASS evidence for all three WebGL
venues, the daily layout/report loop, existing gameplay, accessibility,
persistence, performance, and offline build integrity; it is ready for the
human merge gate.

### Deliverables

- Complete or extend all Phase 7 unit, component, Playwright, capability,
  geometry, persistence, bundle/cache, and deterministic separation coverage.
- Run Tier 3 exactly once against the final global fingerprint after all focused
  failures are resolved.
- Inspect the 1280×800 desktop build, exact 360×780 touch layout, reduced-motion
  mode, unsupported/context-loss fixtures, and representative mid-tier WebGL2
  touch device.
- Record frame responsiveness, capped DPR, instancing/draw-call strategy, lazy
  chunking, and Workbox per-file sizes without claiming synthetic results as
  physical-device evidence.
- Reconcile stale Canvas guidance in `docs/brief.md`,
  `docs/requirements.md`, `docs/solution-design.md`, README, and runbooks while
  leaving Phase 8 campaign changes marked planned until delivered.
- Create `docs/phase-7-test-report.md` with exact commands, environment,
  duration, global fingerprint, PASS/FAIL, and any residual risk.
- Complete phase implementation context, component overview, progress, and
  agent state; commit only after PASS.

### File ownership

- All Phase 7 source/test files required to correct gate failures
- `tests/e2e/*.spec.ts`, `playwright.config.ts`, `vite.config.ts`
- `docs/phase-7-test-report.md`
- `docs/implementation-context-phase-7.md`
- `docs/components/phase-7-component-7-6-overview.md`
- `docs/brief.md`, `docs/requirements.md`, `docs/solution-design.md`
- `README.md`, `docs/agent-runbook.md`, `docs/release-runbook.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`

### Dependencies

Components 7.1–7.5 complete and committed with reusable unchanged evidence.

### Technical Validation

- Tier 3 is exactly: frozen install, production build, lint, complete unit/
  component suite, and complete Playwright suite, plus every named Phase 7
  Validation Target from `docs/phase-plan.md`.
- Engine equality fixtures compare outcomes with WebGL mounted, unmounted,
  context-lost, reduced-motion, and speed changes.
- Browser geometry proves the exact mobile viewport contract. Production
  manifest inspection proves lazy chunks and the 1 MB/file cache ceiling.
- No PASS is recorded if the Canvas gameplay bridge remains, the title asset
  changes, report history reads current rush state, or device evidence is absent.

### Acceptance mapping

- Every Phase 7 acceptance criterion in `docs/phase-plan.md` has named evidence.
- Completed Phases 1–6 journeys remain passing.
- `docs/phase-7-test-report.md` records Tier 3 PASS for the final fingerprint.
- The branch is pushed only after PASS and awaits explicit human merge approval;
  no hosted publication is required for Phase 7.

### Validation gate

Assurance lane `phase-gate (lean override)`, Tier 3 cumulative phase gate. The
same Implement engagement fixes failures, reruns invalidated evidence, performs
self-review, writes the report, and commits the validated final head.
