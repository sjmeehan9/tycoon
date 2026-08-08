# Phase 7 Implementation Context

## Approved phase contract

- The user approved the complete Phases 7–8 plan on 2026-08-08 and authorized
  immediate implementation.
- Phase 7 is isolated on `phase-7` at approved base
  `1f54d612f0e34b779dc83c76ba5ce50d3f720fa4`. At Component 7.1 entry,
  `main`, `phase-7`, and their merge base all resolved to that exact commit;
  neither branch was ahead of the other.
- `docs/phase-7-component-breakdown.md` and
  `docs/phase-8-component-breakdown.md` are both `Spec-Validated`. Together
  they define 15 additive components: six in Phase 7 and nine in Phase 8.
- One Implement engagement owns the components sequentially. Phase 7 runtime
  Components 7.2–7.5 use Tier 2 under `fast (lean override)`; Component 7.6
  uses Tier 3 under `phase-gate (lean override)`. Component 7.1 is a
  documentary Tier 1 gate and changes no product runtime.
- Phase 7 changes service presentation and daily information flow only. It
  retains schema v3, the existing cart/kiosk/cafe campaign, menu, progression,
  economics, and deterministic engine authority. Phase 8 owns the breaking v4
  reset, difficulty, fourth venue, 40-day campaign, and department operation.

## Component 7.1 — Human Setup and Phase-7 Gate Reservation

### Human and external setup

- The user's approval-and-proceed response answered the combined plan approval
  and original representative-device confirmation request. The user later
  superseded that gate: Component 7.6 must perform no physical-device access or
  interaction. Automated Tier 3 covers desktop Chromium and the exact 360×780
  touch-browser suite.
- If physical validation is requested after implementation, its sole permitted
  path is owner-led testing of the exact candidate at the existing public game
  URL after automated PASS and separate merge/publication approval. That hosted
  check remains pending and unclaimed; emulation or desktop WebGL evidence is
  never labelled physical proof.
- No account, credential, secret, environment variable, paid asset, backend,
  analytics service, asset CDN, runtime API, or publication action is required
  for Phase 7.
- The later human gate remains intact: after Component 7.6 records automated
  local Tier 3 PASS, the coordinator requests explicit merge/publication
  direction. Component 7.6 itself performs no push, merge, publication, or
  device interaction, and no intermediate/unvalidated build is published.

### Branch and Git boundary

- Entry branch: `phase-7`
- Approved base and entry head:
  `1f54d612f0e34b779dc83c76ba5ce50d3f720fa4`
- Entry `main` head and merge base:
  `1f54d612f0e34b779dc83c76ba5ce50d3f720fa4`
- Entry ahead/behind counts: `0/0`
- Entry staged paths: none
- The initial worktree delta contained approved documentation only. Component
  7.1 installs no package and changes no application source, tests, build
  configuration, deployment, merge, or publication state.
- Component commit contract:
  `feat(phase-7): Component 7.1 — Human Setup and Phase-7 Gate Reservation`

## Official-source compatibility checklist

Checked on 2026-08-08. This is a documentary architecture re-check. Exact
dependency selection, lockfile mutation, production build composition, browser
capability spike, manifest inspection, and cache-size proof remain Component
7.2 work and must be repeated against the chosen exact versions immediately
before installation.

| Assumption                            | Primary evidence                                                                                                                                                                                                                                                                                                                                                                | Component 7.1 disposition                                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Three Fiber major compatibility | The official [R3F repository](https://github.com/pmndrs/react-three-fiber) states that `@react-three/fiber@9` pairs with React 19. The official [release history](https://github.com/pmndrs/react-three-fiber/releases) records React 19.0–19.2 compatibility from v9.5.0 and identifies v9.7.0 as the latest stable release visible on the check date; v10 remains prerelease. | Architecture remains viable. Do not infer an exact pin from this record; Component 7.2 must select and build-test exact compatible stable versions.                                          |
| WebGL requirement and capability path | Current [Three.js WebGLRenderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html) states that the renderer uses WebGL2 and that WebGL1 has been unsupported since r163. The official [WebGL capability helper](https://threejs.org/docs/pages/WebGL.html) exposes WebGL2 availability and an unsupported message.                                               | Require WebGL2 before mounting the production scene. Unsupported capability receives semantic React guidance, never Canvas gameplay. Runtime/context-loss proof is reserved for 7.2 and 7.6. |
| Fixed-isometric camera                | The official [OrthographicCamera contract](https://threejs.org/docs/pages/OrthographicCamera.html) keeps rendered object size independent of camera distance.                                                                                                                                                                                                                   | Use a responsive orthographic frustum and fixed isometric orientation; executable resize/framing proof belongs to 7.2.                                                                       |
| Repeated geometry budget              | The official [InstancedMesh contract](https://threejs.org/docs/pages/InstancedMesh.html) identifies reduced draw calls as its purpose for repeated geometry/materials.                                                                                                                                                                                                          | Repeated people/furnishings use bounded instancing; draw-call evidence belongs to runtime components and the phase gate.                                                                     |
| High-density mobile rendering         | The official [Three.js responsive-rendering guide](https://threejs.org/manual/en/responsive.html) warns that unrestricted device-pixel ratio multiplies GPU work and documents limiting the drawing buffer.                                                                                                                                                                     | Cap DPR/internal pixel count and prove it in the exact 360×780 browser project. Owner-led hosted-device validation remains a post-completion check.                                          |
| Lazy production chunks                | Current [Vite feature documentation](https://vite.dev/guide/features.html) documents dynamic-import code splitting, and [Vite production-build guidance](https://vite.dev/guide/build) exposes chunk strategy configuration.                                                                                                                                                    | The service route must be dynamically imported and its emitted graph inspected in 7.2; no chunk claim is made in 7.1.                                                                        |
| Workbox file ceiling                  | The official [Workbox build reference](https://developer.chrome.com/docs/workbox/modules/workbox-build) supports `maximumFileSizeToCacheInBytes`.                                                                                                                                                                                                                               | Retain the stricter project limit of `1_000_000` bytes per precached file and prove the emitted manifest after production builds.                                                            |
| Dependency licensing                  | The official [React Three Fiber license](https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE) and [Three.js license](https://github.com/mrdoob/three.js/blob/dev/LICENSE) are MIT.                                                                                                                                                                                  | Compatible with the repository's MIT release model. Exact installed-package license files must be re-audited in 7.2/7.6.                                                                     |

No capability assumption failed. The only time-sensitive change from the
planning research is that the official R3F release page now presents v9.7.0 as
the latest stable v9 release rather than v9.6.1. This does not select a package
version and does not change the approved architecture.

## Reserved downstream gates

1. **Component 7.2:** repeat official version/license compatibility checks,
   select exact stable package versions, pin them in `pnpm-lock.yaml`, prove the
   React 19.2/Vite 8.1 production build, exercise WebGL2 capability/context
   behavior, and inspect lazy chunks plus Workbox sizes.
2. **Components 7.2–7.5:** complete one Tier 2 gate for each unchanged scoped
   candidate and commit sequentially before entering the next component.
3. **Component 7.6:** run the cumulative automated Tier 3 gate for the final
   global fingerprint and collect desktop, exact 360×780 touch, reduced-motion,
   unsupported/context-loss, and all named Phase 7 evidence. Record physical
   validation as pending/unclaimed.
4. **Post-7.6 human gate:** request explicit merge/publication direction. If
   approved, publish only the exact validated candidate at the existing public
   game URL so the owner—not an agent—can perform any physical-device check.

## Phase 7 delivery state after Component 7.5

- Component 7.1: documentary Tier 1 gate complete and committed on `phase-7`.
- Component 7.2: Tier 2 PASS at scoped fingerprint
  `8759d86a444de478015effb331e6633fcbae379dd7ab7979537292e5df067824`;
  committed on `phase-7` at `8060579`.
- Component 7.3: Tier 2 PASS at scoped fingerprint
  `6003451b87c5474f8fce64f80d3bf1368d72f271eee9e3d7309a3487ae136733`;
  committed on `phase-7` at `f73900c`. All three service venues are WebGL-only
  and the temporary service bridge is gone.
- Component 7.4: Tier 2 PASS at scoped fingerprint
  `8b454480fd409f29f3f56bb20722bd4ea944a39ae946dbc189eb19c5e71db700`;
  committed on `phase-7` at `59934be`. Planning is scene-free and service now
  reads scene → dashboard/controls → live activity → stock.
- Component 7.5: Tier 2 PASS at scoped fingerprint
  `ea64d40f3f724941cfa9abdea3e24e4f47a619a144c46ab00f2445eb9c835f71`;
  committed on `phase-7` at `385bfe2`. Day completion is compact, settlement
  remains exact-once, and bounded campaign reports are reopenable as read-only
  stored values.
- Component 7.6: in progress. It owns the cumulative automated phase gate,
  full-suite reconciliation, and phase documentation. Owner-led hosted-device
  validation is a separate post-completion action and remains pending. No Phase
  8 runtime work has started.

## Component 7.2 — Snapshot-Only WebGL Cart Service

### Exact dependency and capability record

- Pinned: Three.js `0.185.1`, `@react-three/fiber` `9.7.0`, and
  `@types/three` `0.185.4`. Installed license metadata/files are MIT.
- Registry peer metadata for R3F 9.7.0 accepts React and React DOM
  `>=19 <19.3` and Three `>=0.156`; the repository uses React 19.2.7.
- A TypeScript/R3F/Three/Vite production capability build passed before the
  production world was completed. Current official Three documentation remains
  WebGL2-only and current R3F releases retain React 19.2 support.
- `docs/project-profile.md` now records these exact pins under the coordinator's
  bounded ownership clarification; the same clarification is present in the
  Component 7.2 breakdown ownership and progress fingerprint scope.

### Runtime and authority boundary

- `App` dynamically imports `ServiceWorld` only for cart `rush`/`event` phases.
  Production HTML loads no 3D chunk initially, and browser resource timing
  confirms `ServiceWorld` is absent before service.
- `createRenderSnapshot` copies and recursively freezes bounded identity,
  queue, active service, activity, staff, equipment, stock, statistics, and
  motion data. It carries no command or store reference.
- Fixed-isometric camera, procedural cart geometry, capped 1.5 DPR, 1,024px
  basic shadow map, bounded instanced tiles/people/rain, and local transform-only
  animation form the production renderer. Reduced motion retains the entire
  world with demand rendering and static transforms.
- Queue/counter/service, sale/walkaway exits, equipment, stock, weather, and
  activity have both 3D/HUD and semantic text parity.
- Explicit unsupported WebGL2, context loss/restoration, and renderer-error
  paths give retry/reload guidance. Renderer failure never selects Canvas and
  never issues a game command.

### Intermediate merge boundary

- Kiosk and cafe service saves remain runnable through
  `data-renderer-bridge="temporary-kiosk-cafe"`. This bridge is selected only
  by venue and is exercised for both venues on desktop and touch mobile.
- The Component 7.2 head is therefore **non-mergeable and non-releasable**.
  Component 7.3 must replace both remaining service worlds and delete the
  bridge. Component 7.4 later owns removal of non-service planning animation and
  the approved service information-flow ordering.

### Production and validation evidence

- Scoped fingerprint:
  `8759d86a444de478015effb331e6633fcbae379dd7ab7979537292e5df067824`.
- Tier 2: build PASS; lint PASS; 126/126 Vitest PASS; profiled cart-day,
  accessibility, and WebGL service paths PASS with 12 browser tests and two
  intentional project skips across desktop and 360×780 touch mobile.
- Production chunks: `ServiceWorld` 178,073 bytes; `three-webgl` 724,513 bytes;
  main 322,544 bytes. All 19 Workbox entries are below 1,000,000 bytes.
- Approved title SHA-256 remains
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.
- Full contracts, commands, durations, screenshots, caveats, and spec mapping
  are in `docs/components/phase-7-component-7-2-overview.md`.

## Component 7.3 — Complete Kiosk and Cafe Isometric Worlds

### Complete venue registry and worlds

- `VENUE_LAYOUTS` is a deeply frozen compiler-exhaustive `Record<VenueId,
VenueLayout>`. It defines bounded customer/staff/service/activity/stock
  anchors, floor extents, and inspectable performance limits for cart, kiosk,
  and cafe.
- Kiosk service now uses a permanent sheltered counter, pickup rail, stock
  wall, tiered owned equipment, instanced floor/furnishings/rain, and its own
  queue/staff geometry.
- Cafe service now uses an open L counter, display/storage areas, full stock
  wall, tiered owned equipment, instanced tiles/seating/rain, windows, plants,
  and emissive pendant ambience without adding scene lights.
- `People` consumes the venue layout while retaining the existing segment/staff
  palette and local matrix-only animation. The shared frozen snapshot remains
  the only engine-derived renderer input.

### Final service renderer boundary

- `ServiceWorld` dispatch is exhaustive for cart, kiosk, and cafe; a missing
  future venue fails TypeScript through both the layout record and `never`
  dispatch branch.
- Every `rush`/`event` phase selects the lazy `ServiceWorld`. The temporary
  kiosk/cafe service bridge and its marker are deleted.
- `CanvasScene` remains a separate lazy route only outside service until 7.4
  removes the planning preview and recomposes the approved information flow.
  Direct cart/kiosk/cafe service imports do not fetch the Canvas chunk.
- Unsupported WebGL2 and context loss remain semantic recovery only. Browser
  tests cover capability loss or recovery at all three current venues and find
  no Canvas gameplay.

### Performance, visual, and validation evidence

- Explicit limits remain 12 visible queued customers, 10 scheduled staff, two
  global lights, one shadow light, at most 32 repeated furnishing/effect
  instances, 1,024px basic shadow map, and DPR 1.5.
- Desktop and 360×780 screenshots confirm the two new floor plans are distinct,
  fitted, and keep queue/counter/sale/walkaway/stock cues readable. Exact
  equipment, 3/5 staff, rainy/cold weather, activity, 16-person queue, visible
  12-person crowd, and `+4` overflow are asserted through imported saves.
- Tier 2 PASS: build, lint, 140/140 Vitest, and 12/12 exact WebGL/presentation
  Playwright paths at scoped fingerprint
  `6003451b87c5474f8fce64f80d3bf1368d72f271eee9e3d7309a3487ae136733`.
- Production emits separate dynamic `ServiceWorld` (204,016 bytes) and
  non-service `CanvasScene` (12,910 bytes) entries. `ServiceWorld` imports no
  Canvas entry; the largest Workbox file is `three-webgl` at 724,524 bytes and
  all 22 precache entries remain below 1,000,000 bytes.
- Full interfaces, source/test ownership, screenshots, exact commands,
  durations, manifest/cache evidence, and acceptance mapping are in
  `docs/components/phase-7-component-7-3-overview.md`.

## Component 7.4 — Immersive Service Information Flow

### Scene-free management and ordered service composition

- `App` no longer imports or mounts `CanvasScene`. Planning, report,
  reinvestment, victory, and defeat use one full-width management flow with no
  preview, placeholder, caption, or reserved scene column.
- Rush and event phases use one service flow whose direct regions are exactly
  scene, dashboard, activity, and stock. Onboarding follows those regions so it
  cannot break their reading or focus order.
- `SERVICE_DASHBOARD_FIELDS` is the shared visible completeness contract for
  time, cash, revenue, served, lost, queue, satisfaction, reputation, event,
  pause, and speed. The dashboard exposes every field and every current service
  command in DOM-native controls.
- Live activity retains exact canonical sale/walkaway descriptions and the
  bounded recent stream. Exact live stock remains immediately after activity.

### Responsive and accessible service boundary

- At exact 360×780, compact service header treatment, 2:1 WebGL framing,
  compact complete metrics, and 44px controls keep the full scene and complete
  dashboard visible at `scrollY === 0`. No truth or command is hidden.
- Safe-area insets cover header, service layout, and the fixed Game Tools
  trigger. The isometric camera continues to reframe through R3F resize; a
  bounded landscape treatment is exercised at 780×360.
- DOM-native pause/speed controls retain keyboard and touch operation. Event
  state is explicit text and the modal focus contract is unchanged. The phase
  announcer speaks the service reading order without adding per-tick chatter.
- Reduced motion retains the same 3D world and complete dashboard/activity
  text with animation stopped. Unsupported/context-lost WebGL remains
  save-safe semantic recovery, never Canvas gameplay.

### Production and validation evidence

- Scoped fingerprint:
  `8b454480fd409f29f3f56bb20722bd4ea944a39ae946dbc189eb19c5e71db700`.
- Tier 2 PASS: build in 3.153462 seconds, lint in 7.122089 seconds, 141/141
  Vitest assertions in 5.564851 seconds, and exact service-layout,
  accessibility, and WebGL Playwright journeys in 28.384557 seconds with 18
  PASS and two intentional project skips.
- Desktop and exact 360×780 browser assertions cover every current venue,
  management preview absence, direct region order, every dashboard field,
  scroll position/bounding boxes, 44px controls, activity/stock reachability,
  resize/orientation, event focus/resolution, keyboard/touch, and reduced
  motion.
- Production emits only `ServiceWorld` as the App scene dynamic entry;
  `CanvasScene` has no manifest entry or runtime resource. All 19 Workbox
  entries remain below the 1,000,000-byte ceiling. Approved title SHA-256 is
  unchanged.
- Full contracts, source/test ownership, exact commands, durations, decisions,
  and acceptance mapping are in
  `docs/components/phase-7-component-7-4-overview.md`.

## Component 7.5 — Compact Completion and Reopenable Reports

### Exact-once compact completion

- The report phase now opens on a compact six-metric result, explicit
  bottleneck, and exactly one **Settle & reinvest** action. Cash reconciliation,
  canonical charges, inventory lifecycle, customer mix, and explanations live
  in a native disclosure that is closed by default.
- `ReportViewProps` is a discriminated current/historical contract. Current
  mode requires the one settlement callback; historical mode forbids it. The
  value renderer has no Game Context access.
- `closeDay` retains its identity no-op after settlement. Game Context now
  recognizes all identity no-ops before meta or persistence work. Two
  synchronous activations, rerender, reload, and later menu updates retain one
  settlement and one history entry.

### Complete stored charges and honest legacy absence

- New rushes maintain a cumulative, engine-owned charge aggregate at the
  canonical sale transition. Its maximum group count is derived from the finite
  configured drink/size/milk variants, and its price bounds are derived from
  the planner and modifier bounds.
- Report finalization copies the aggregate only after exact served/revenue
  reconciliation. A 45-sale regression exceeds and truncates the 80-item mixed
  activity feed while the stored report still contains every served unit and
  revenue cent.
- Schema/state version remains 3. Existing report history and older active
  rushes receive no synthesized field or migration. Missing historical charge
  data renders the exact accessible message “Charge breakdown unavailable for
  this older report.”
- Save validation rejects unconfigured variants, out-of-bound prices, duplicate
  variants, invalid group arithmetic, excessive groups, and aggregate/report
  parity failures. Present active-rush aggregates must also match current
  canonical rush statistics.

### Bounded read-only history and responsive access

- Game menu now includes Reports and reads only the current campaign's bounded
  `GameState.history`. Selecting a day passes that stored report directly to a
  keyed historical `ReportView`, whose disclosure starts closed and exposes no
  settlement command.
- Desktop keyboard and 360×780 touch activation, reduced-motion reload,
  44px targets, modal focus restoration, and no horizontal dialog overflow are
  browser-proven. A poisoned `$99.99` live activity remains visible in the
  service world but absent from the selected historical report, proving the
  value boundary.
- Mixed old/new history survives schema-v3 export, clean reset, import, and
  reload without synthesis. Victory, bankruptcy, endless continuation, and
  current autosave remain intact.

### Production and validation evidence

- Scoped fingerprint:
  `ea64d40f3f724941cfa9abdea3e24e4f47a619a144c46ab00f2445eb9c835f71`.
- Tier 2 PASS: build in 3.294412 seconds, lint in 7.063231 seconds, 146/146
  Vitest assertions in 5.926605 seconds, and 14/14 exact report-history,
  persistence, and save-transfer Playwright journeys in 25.791309 seconds
  across desktop Chromium and exact 360×780 touch mobile.
- Production retains 19 Workbox entries / 1,724.22 KiB; every emitted file is
  below 1,000,000 bytes. Approved title SHA-256 remains unchanged.
- Full interfaces, ownership, commands, decisions, gotchas, spec mapping, and
  validation evidence are in
  `docs/components/phase-7-component-7-5-overview.md`.

## Component 7.6 — Phase-7 Validation and Documentation

### Cumulative proof boundary

- Components 7.1–7.5 are committed in dependency order at `a586120`,
  `8060579`, `f73900c`, `59934be`, and `385bfe2`; their scoped fingerprints and
  unchanged overview evidence remain reusable.
- Existing Vitest/React Testing Library/Playwright coverage maps every named
  Phase 7 target across deterministic engine equality, immutable snapshot
  separation, all three venues, WebGL2 capability/context loss, reduced motion,
  exact 360×780 geometry, compact/history reports, schema-v3 persistence and
  transfer, Phases 1–6 journeys, PWA/offline behavior, and the production
  manifest/cache graph.
- `tests/unit/scene.test.ts` now additionally audits the exact installed
  R3F/Three/type pins, React 19 peer contract, MIT metadata/license texts, and
  a complete renderer-source graph free of gameplay/persistence authorities.
  `tests/e2e/webgl-service.spec.ts` now records actual WebGL2 identity and
  drawing-buffer DPR against the 1.5 ceiling.
- The superseded agent-led physical harness was removed. Component 7.6 neither
  launches nor controls a device. The test report carries a concise owner
  checklist for the exact hosted candidate and labels every physical field
  pending/unclaimed until the user supplies it.

### Cumulative Phase 6 assertion reconciliation

- Compact reports retain the same cash, staffing, charge, lifecycle, causal,
  victory, bankruptcy, and exact-once settlement proofs. Cumulative journeys
  now first activate `View full Day N report`, assert the details were collapsed
  beforehand where relevant, and settle through the canonical
  `Settle & reinvest` action.
- The new Reports tab sits between Settings and Records. The keyboard journey
  now proves both ArrowRight transitions plus Home return instead of assuming
  the old adjacent Settings → Records order.
- Management-screen Canvas expectations are replaced with stronger scene-free
  planning/reinvestment assertions. Original art remains checked on the title
  screen; service then proves the responsive snapshot-only WebGL stage, bounded
  viewport, WebGL2-ready canvas, and absence of the 320×180 Canvas bridge.
- The living-rush journey preserves queue/activity/HUD truth, reload equality,
  reduced-motion, active-to-paused frame-loop behavior, responsive bounds, and
  report transition. Obsolete Canvas width/height and transient-sprite
  attributes are replaced by WebGL frame/snapshot bounds and complete renderer
  teardown at the compact report.
- Browser-loop liveness now proves ordered callbacks plus the renderer's
  active-to-paused transition without an unprofiled wall-time/FPS threshold.
  The autosave journey retains its `progress >= 20` checkpoint with enough wait
  time for four simultaneous production WebGL contexts to share the local
  runner. These stabilizations are not desktop or physical FPS claims; the
  physical disposition remains pending for the owner-hosted check.

### Documentation boundary

- `docs/brief.md`, `docs/requirements.md`, `docs/solution-design.md`, README,
  and both runbooks now describe the Phase 7 WebGL service authority, scene-free
  planning, service-first information order, compact/reopenable reports, and
  automated browser gate without retaining contradictory Canvas/2D guidance.
- The same documents explicitly separate current Phase 7 behavior—schema v3,
  one balanced mode, 30 days, cart/kiosk/cafe—from planned Phase 8 behavior:
  one v4 reset, Standard/Hard demand, 40 days, and the department-store venue.
  No Phase 8 runtime behavior is implemented or represented as current.

### Automated final gate and hosted-device handoff

- After every fingerprinted source, test, configuration, and contract document
  is stable, compute one unscoped global fingerprint and run exactly one
  unchanged Tier 3 sequence: frozen install, build, lint, unit/component tests,
  then complete Playwright. Only fingerprint-excluded reports/state may be
  finalized afterward.
- Tier 3 is authoritative for the automated Phase 7 verdict. It includes the
  production desktop project and the exact 360×780 touch-browser project, all
  three WebGL worlds, capability/context-loss/reduced-motion fixtures,
  deterministic engine separation, layout/report journeys, cumulative Phases
  1–6, performance/bundle targets, and offline behavior.
- Physical Safari/GPU/FPS behavior is not claimed by Component 7.6. The report
  records model/OS, browser/WebGL identity, viewport/DPR, portrait/landscape,
  all venues, dense responsiveness/frame range, reduced motion, visual
  findings, and 30fps disposition as pending/unclaimed.
- Component 7.6 stops after automated PASS and its verified handoff. It does not
  push, merge, publish, or access a device. Following explicit human approval,
  the coordinator may arrange publication of that exact validated candidate at
  the existing public game URL; only the repository owner performs the later
  physical check. No intermediate/unvalidated build may be published.
