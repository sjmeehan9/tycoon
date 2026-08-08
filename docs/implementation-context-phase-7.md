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
  and representative-device confirmation request. Access to a representative
  mid-tier WebGL2-capable touch device is therefore **confirmed and reserved**
  for Component 7.6.
- Reservation is not physical-device proof. Device model, operating system,
  browser/WebGL identity, viewport, DPR, dense-scene state, sampling method,
  observed responsiveness/frame range, and visual findings remain to be
  captured during Component 7.6. No synthetic result may be labelled as that
  physical evidence.
- No account, credential, secret, environment variable, paid asset, backend,
  analytics service, asset CDN, runtime API, or publication action is required
  for Phase 7.
- The later human gate remains intact: after Component 7.6 records local Tier 3
  PASS, the user must approve or reject the `phase-7` merge. Phase 7 does not
  publish a Pages release.

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

| Assumption | Primary evidence | Component 7.1 disposition |
|---|---|---|
| React Three Fiber major compatibility | The official [R3F repository](https://github.com/pmndrs/react-three-fiber) states that `@react-three/fiber@9` pairs with React 19. The official [release history](https://github.com/pmndrs/react-three-fiber/releases) records React 19.0–19.2 compatibility from v9.5.0 and identifies v9.7.0 as the latest stable release visible on the check date; v10 remains prerelease. | Architecture remains viable. Do not infer an exact pin from this record; Component 7.2 must select and build-test exact compatible stable versions. |
| WebGL requirement and capability path | Current [Three.js WebGLRenderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html) states that the renderer uses WebGL2 and that WebGL1 has been unsupported since r163. The official [WebGL capability helper](https://threejs.org/docs/pages/WebGL.html) exposes WebGL2 availability and an unsupported message. | Require WebGL2 before mounting the production scene. Unsupported capability receives semantic React guidance, never Canvas gameplay. Runtime/context-loss proof is reserved for 7.2 and 7.6. |
| Fixed-isometric camera | The official [OrthographicCamera contract](https://threejs.org/docs/pages/OrthographicCamera.html) keeps rendered object size independent of camera distance. | Use a responsive orthographic frustum and fixed isometric orientation; executable resize/framing proof belongs to 7.2. |
| Repeated geometry budget | The official [InstancedMesh contract](https://threejs.org/docs/pages/InstancedMesh.html) identifies reduced draw calls as its purpose for repeated geometry/materials. | Repeated people/furnishings use bounded instancing; draw-call evidence belongs to runtime components and the phase gate. |
| High-density mobile rendering | The official [Three.js responsive-rendering guide](https://threejs.org/manual/en/responsive.html) warns that unrestricted device-pixel ratio multiplies GPU work and documents limiting the drawing buffer. | Cap DPR/internal pixel count. Physical mid-tier evidence remains reserved for 7.6. |
| Lazy production chunks | Current [Vite feature documentation](https://vite.dev/guide/features.html) documents dynamic-import code splitting, and [Vite production-build guidance](https://vite.dev/guide/build) exposes chunk strategy configuration. | The service route must be dynamically imported and its emitted graph inspected in 7.2; no chunk claim is made in 7.1. |
| Workbox file ceiling | The official [Workbox build reference](https://developer.chrome.com/docs/workbox/modules/workbox-build) supports `maximumFileSizeToCacheInBytes`. | Retain the stricter project limit of `1_000_000` bytes per precached file and prove the emitted manifest after production builds. |
| Dependency licensing | The official [React Three Fiber license](https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE) and [Three.js license](https://github.com/mrdoob/three.js/blob/dev/LICENSE) are MIT. | Compatible with the repository's MIT release model. Exact installed-package license files must be re-audited in 7.2/7.6. |

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
3. **Component 7.6:** run the cumulative Tier 3 gate for the final global
   fingerprint and collect the reserved desktop, exact 360×780 touch,
   reduced-motion, unsupported/context-loss, and representative physical-device
   evidence without claiming publication.
4. **Post-7.6 human gate:** request explicit approval before merging
   `phase-7`; no hosted publication is part of Phase 7.

## Phase 7 delivery state after Component 7.3

- Component 7.1: documentary Tier 1 gate complete and committed on `phase-7`.
- Component 7.2: Tier 2 PASS at scoped fingerprint
  `8759d86a444de478015effb331e6633fcbae379dd7ab7979537292e5df067824`;
  committed on `phase-7` at `8060579`.
- Component 7.3: Tier 2 PASS at scoped fingerprint
  `6003451b87c5474f8fce64f80d3bf1368d72f271eee9e3d7309a3487ae136733`;
  commit is owned by Implement. All three service venues are WebGL-only and the
  temporary service bridge is gone.
- Component 7.4: next. It owns the approved service information ordering and
  removal of the non-service morning preview.
- Components 7.5–7.6: queued in approved dependency order.

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
