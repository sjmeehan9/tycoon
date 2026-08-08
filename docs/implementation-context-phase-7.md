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

## Phase 7 delivery state after Component 7.1

- Component 7.1: documentary Tier 1 gate complete and committed on `phase-7`.
- Component 7.2: next, queued; no package or runtime work has begun.
- Components 7.3–7.6: queued in approved dependency order.
