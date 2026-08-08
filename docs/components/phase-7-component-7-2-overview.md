# Component 7.2 — Snapshot-Only WebGL Cart Service

## What was delivered

A user can now run the real cart rush inside a responsive, original low-poly
fixed-isometric 3D laneway. Queue, counter handoff, sale, walkaway, stock,
equipment, weather, staff, and activity state remain readable in the world and
in semantic React text while the deterministic engine remains the sole gameplay
authority.

The WebGL renderer is loaded only for cart service. Unsupported WebGL2,
context loss, and renderer failure receive accessible save-safe recovery
guidance and never select Canvas. Kiosk/cafe service remains runnable through
an explicit temporary branch-only Canvas bridge, so this Component 7.2 head is
**non-mergeable and non-releasable** until Component 7.3 replaces that bridge.

## Public interfaces / contracts exposed

- `createRenderSnapshot(game, reducedMotion, cosmetics)` returns one detached,
  deeply frozen `RenderSnapshot`. It bounds visible queue customers to 12,
  activity to 12 events, and scheduled staff to 10 while preserving exact
  uncapped queue truth and canonical statistics.
- `RenderSnapshot` contains identity, service, operation/stock/equipment, and
  presentation branches only. It carries no command callback, store reference,
  RNG, mutable engine collection, or accounting authority.
- `orthographicProjection` and `configureIsometricCamera` define the responsive
  fixed-isometric camera; `boundedDevicePixelRatio` caps DPR at `1.5`.
- `WebGLBoundary` performs explicit WebGL2 capability detection, observes the
  mounted renderer canvas for `webglcontextlost`/`webglcontextrestored`, and
  exposes retry/reload semantics without receiving game commands.
- `ServiceWorld` is a dynamic entry imported by `App` only when phase is
  `rush`/`event` and venue is `cart`. Its canvas is non-interactive and labelled
  `data-render-authority="snapshot-only"`.
- Stable presentation evidence is exposed on the WebGL figure/stage through
  `data-renderer`, `data-snapshot-only`, `data-camera`, `data-dpr-max`,
  `data-instanced-people`, queue/activity/speed/motion, venue, weather, and
  WebGL-status attributes.
- Exact dependency pins are Three.js `0.185.1`, React Three Fiber `9.7.0`, and
  `@types/three` `0.185.4`; all are MIT licensed and compatible with the
  repository's React `19.2.7` and Vite `8.1.5` pins.

## Files owned

Created:

- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/WebGLBoundary.tsx`
- `src/scene/three/renderSnapshot.ts`
- `src/scene/three/camera.ts`
- `src/scene/three/materials.ts`
- `src/scene/three/entities/People.tsx`
- `src/scene/three/venues/CartWorld.tsx`
- `tests/e2e/webgl-service.spec.ts`
- `docs/components/phase-7-component-7-2-overview.md`

Modified:

- `package.json`, `pnpm-lock.yaml`, `vite.config.ts`
- `src/App.tsx`, `src/styles.css`
- `tests/unit/scene.test.ts`
- `tests/components/presentation.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/fixtures/campaignFixtures.ts`
- `docs/project-profile.md`
- `docs/phase-7-component-breakdown.md`
- `docs/implementation-context-phase-7.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

`src/scene/sceneModel.ts`, `src/components/RushPanel.tsx`, and their existing
contracts were inspected and retained unchanged; they remain in the declared
fingerprint scope.

## How to run / verify

```bash
pnpm build
pnpm lint
pnpm test
pnpm preview --host 127.0.0.1 --port 4173
pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/webgl-service.spec.ts
python3 scripts/worktree-fingerprint.py -- package.json pnpm-lock.yaml vite.config.ts docs/project-profile.md src/App.tsx src/scene/sceneModel.ts src/scene/three src/components/RushPanel.tsx src/styles.css tests/unit/scene.test.ts tests/components/presentation.test.tsx tests/components/accessibility.test.tsx tests/e2e/webgl-service.spec.ts tests/fixtures/campaignFixtures.ts
```

The Playwright command uses the already-built preview in the recorded gate; if
no preview is running, the repository harness starts its own production server.
Chromium needs permission to launch outside the restricted macOS sandbox in
this environment.

## Integration notes & gotchas

- Component 7.3 must implement kiosk/cafe WebGL worlds, delete
  `data-renderer-bridge="temporary-kiosk-cafe"`, and make all service venues use
  `ServiceWorld` before any merge/release claim. Capability failure must still
  use semantic recovery, never that venue bridge.
- Non-service planning/report scenes intentionally remain on the existing
  Canvas path at this intermediate head. Component 7.4 owns the approved
  service/planning information-flow recomposition.
- Workbox precaches the lazy chunks for offline continuity, but the production
  HTML does not preload them and browser resource proof confirms
  `ServiceWorld` is not fetched before service.
- The colour-batched people implementation uses bounded instanced body/head
  meshes per segment/staff palette. `useFrame` changes matrices only; rain uses
  the same local-transform-only rule.
- The stock `low` threshold is a presentation signal only. Exact inventory
  batches/totals remain canonical engine data and are not consumed or changed
  by rendering.
- The 724,513-byte `three-webgl` core exceeds Vite's advisory 500 kB warning but
  is deliberately isolated, lazy, and below the binding 1,000,000-byte Workbox
  ceiling. The app-specific `ServiceWorld` chunk is 178,073 bytes.
- The approved title art remains byte-identical at SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion | Runtime behavior and files | Proof |
|---|---|---|
| Cart service is a real fixed-isometric WebGL world | Lazy `ServiceWorld`, orthographic camera, procedural `CartWorld`, bounded lights/shadows/DPR, instanced people/tiles/rain | Production manifest plus desktop/360px real-WebGL Playwright screenshots and assertions |
| Renderer consumes deeply readonly bounded truth only | `renderSnapshot.ts` clones and recursively freezes queue, active service, activity, staff, equipment, stock, identity, and presentation state; no command crosses the interface | Deep mutation/detachment unit tests and complete seeded rush equivalence at 1×/2×/4× with snapshots enabled/disabled and reduced-motion snapshots |
| Queue/service/sale/exit/walkaway/equipment/weather/activity remain readable | World geometry, segment-coloured queue, handoff cup/progress, sale/walkaway exit markers, equipment meshes, weather effects, compact HUD, figcaption, and existing RushPanel text | Dense fixture unit/component tests and browser accessible-name/HUD/screenshot proof |
| Reduced motion retains complete parity | R3F remains mounted with `frameloop="demand"`; travel/bob/rain motion stops while world, HUD, and semantic text remain | Component parity test plus desktop/touch browser canvas-count, motion, and economic-truth assertions |
| WebGL failure is explicit and save-safe without Canvas fallback | `WebGLBoundary` capability/context/runtime recovery provides retry/reload guidance; App bridge is selected by venue only | Unsupported/context-loss component and browser tests assert alerts, prevented loss, retry/remount, unchanged persisted truth, and zero Canvas bridge |
| Kiosk/cafe saves remain runnable only through the temporary bridge | App marks the non-cart service bridge explicitly and never selects it for WebGL failure | Desktop/touch import tests for both venues; head marked non-mergeable/non-releasable here and in phase state |
| Lazy chunks and cache files satisfy budget | Vite dynamic entry plus explicit `three-webgl` split; Workbox limit retained at 1 MB | Manifest identifies `ServiceWorld` as dynamic; all 19 precache files are at most 724,513 bytes |
| Title art is unchanged | No art mutation | Unit SHA lock plus working-tree/HEAD SHA comparison |

## Assurance lane

- **Lane:** `fast (lean override)`
- **Validation tier / owner / commit owner:** Tier 2 component gate / Implement /
  Implement
- **Standard Test triggers recorded:** first WebGL integration, real browser/UI
  behavior, context loss/unsupported capability, responsive/reduced-motion
  behavior, persistence truth, and complete service round trip.
- **Standard Review triggers recorded:** app entry and build configuration,
  dependency pins, public render-snapshot contract, and broad renderer scope.
- **Lean disposition:** the approved two-role restriction assigns Tier 2,
  self-review, defect correction, and commit to Implement. No risk signal
  required an upgrade outside that approved lane.

## Deviations and decisions

- No product behavior was descoped.
- The coordinator granted a bounded ownership clarification for
  `docs/project-profile.md`: only the pending 3D dependency text was replaced
  with tested exact pins. The clarification was also added to the Component
  7.2 breakdown ownership and fingerprint scope; no other profile/spec contract
  changed.
- Current official/registry evidence selected R3F `9.7.0` rather than the
  planning record's earlier `9.6.1`; its peers explicitly support React/React
  DOM `>=19 <19.3`. Three `0.185.1` is the current stable WebGL2 renderer and
  `@types/three` `0.185.4` matches that line.
- Registry reads initially encountered a root-owned default npm cache. The
  isolated `/private/tmp/tycoon-component-7-2-npm-cache` fallback succeeded and
  was used for installation without changing host ownership.
- The pinned Playwright browser was absent and was installed as validation
  tooling. Chromium launch then hit the managed macOS Mach-port restriction;
  the approved escalated harness path succeeded. This adds no runtime package,
  product permission, or human setup duty.
- The kiosk/cafe Canvas bridge is the exact planned intermediate exception,
  not a capability fallback. It is tracked for mandatory removal in 7.3.

## Validation evidence

- **Candidate fingerprint:**
  `8759d86a444de478015effb331e6633fcbae379dd7ab7979537292e5df067824`
- **Fingerprint command:** the exact scoped command in **How to run / verify**;
  exit 0 in 2.376580 seconds before Tier 2 and exit 0 in 0.003555 seconds after
  Tier 2 with the same hash.
- **Fingerprint scope:** package/lock/build config, exact profile pin line, app
  entry, retained scene/RushPanel contracts, all `src/scene/three` source,
  styles, named unit/component/browser tests, and campaign fixtures. Overview,
  context, progress, and team-state evidence are excluded by contract.
- **Technical capability spike:** `pnpm build` with React 19.2.7, R3F 9.7.0,
  Three 0.185.1, TypeScript 6.0.3, and Vite 8.1.5; exit 0 in 5.020660 seconds.
  It proved real TS/R3F/Vite composition before completing the production
  world. Official Three docs confirm WebGL2-only rendering, orthographic camera
  semantics, and InstancedMesh draw-call reduction; official Vite/Rolldown docs
  confirm dynamic/manual code splitting.
- **Final targeted tests:**
  `pnpm exec vitest run tests/unit/scene.test.ts tests/components/presentation.test.tsx tests/components/accessibility.test.tsx`;
  exit 0 in 2.364292 seconds, 23/23 tests. `pnpm lint`; exit 0 in
  6.242213 seconds. Post-colour-batching desktop WebGL/context/economy visual
  journey; exit 0 in 7.254779 seconds, 1/1.
- **Tier 2 build:** `pnpm build`; exit 0 in 2.979735 seconds. Manifest emitted a
  178,073-byte dynamic `ServiceWorld` entry importing an isolated 724,513-byte
  `three-webgl` chunk. Workbox generated 19 entries / 1,701.60 KiB total; every
  individual emitted/precache file is below 1,000,000 bytes.
- **Tier 2 lint:** `pnpm lint`; exit 0 in 5.542237 seconds.
- **Tier 2 tests:** `pnpm test`; exit 0 in 5.544556 seconds, 16 files and
  126/126 tests.
- **Tier 2 browser:** against one already-built `pnpm preview` instance,
  `pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/webgl-service.spec.ts`;
  exit 0 in 30.0 seconds, 12 passed and 2 project-intentional skips. This covers
  desktop Chromium and 360×780 touch mobile.
- **Production inspection:** `dist/.vite/manifest.json`, `dist/sw.js`, and all
  emitted file byte counts were read directly after the Tier 2 build. The
  production HTML references only the index JS/CSS; browser resource timing
  separately proved no `ServiceWorld` fetch before cart service.
- **Title integrity:** working tree and `HEAD` both produced exact SHA-256
  `5669f4b6…62cc2c37`; the unit suite locks the full digest.
- **Raw logs:** none required; every final result is short and reproducible.

## Manual tests automated

- Desktop and 360×780 touch screenshots are captured by
  `webgl-service.spec.ts` for a normal cart and the 12-customer dense rush.
  Both were visually inspected for fixed-isometric framing, cart/equipment,
  colourful segmented queue, handoff, sale/walkaway markers, compact HUD, and
  viewport containment.
- Capability unavailable, context loss, retry/remount, all speed controls,
  reduced motion, persistence equality, lazy resource loading, kiosk/cafe
  bridge, horizontal overflow, and title bytes are programmatically verified.

## Human tasks

- No Component 7.2 account, credential, secret, paid asset, backend, or
  publication task exists.
- Representative physical touch-device evidence remains reserved for Component
  7.6 and is not claimed by Playwright.
- Phase 7 still requires explicit human merge approval after Component 7.6.
