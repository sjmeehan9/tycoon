# Component 7.4 — Immersive Service Information Flow

## What was delivered

A user can now plan on one full-width decision surface with no animation,
thumbnail, placeholder, or reserved scene column. During service, every current
venue instead follows one exact reading and document order: complete 3D scene,
complete live dashboard and controls, textual activity, then exact stock.

At 360×780, the scaled-down scene and every dashboard metric/control are
simultaneously visible at document scroll position zero. Activity and stock
remain the next two keyboard/touch-reachable regions below. The same flow keeps
its desktop presentation, safe-area spacing, resize/orientation behavior,
event-dialog operation, and reduced-motion information parity.

## Public interfaces / contracts exposed

- `SERVICE_DASHBOARD_FIELDS` is the stable ordered completeness contract for
  `time`, `cash`, `revenue`, `served`, `lost`, `queue`, `satisfaction`,
  `reputation`, `event`, `pause`, and `speed`.
- Each dashboard contract item is a visible
  `[data-dashboard-field="<field>"]`; responsive CSS must not hide one.
- `App` exposes `[data-game-layout="management"]` outside service and
  `[data-game-layout="service"]` during `rush`/`event`.
- Direct children of `.service-flow` expose
  `data-service-section="scene|dashboard|activity|stock"` in that exact order.
- `RushPanel` deliberately renders two sibling sections: the complete
  dashboard first and the complete live-activity region second.
- `ServiceWorld` remains the only production scene route and now identifies
  its figure as the service `scene` region. No game command or engine authority
  moved into presentation.

## Files owned

Created:

- `tests/e2e/service-layout.spec.ts`
- `docs/components/phase-7-component-7-4-overview.md`

Modified:

- `src/App.tsx`
- `src/components/RushPanel.tsx`
- `src/components/RushStockGrid.tsx`
- `src/components/GameHeader.tsx`
- `src/accessibility/GameAnnouncer.tsx`
- `src/scene/three/ServiceWorld.tsx`
- `src/styles.css`
- `tests/components/game-loop.test.tsx`
- `tests/components/presentation.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/webgl-service.spec.ts`
- `docs/implementation-context-phase-7.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

Declared ownership path `src/components/Planner.tsx` was inspected and retained
unchanged. Its full-width behavior is supplied by the App composition that owns
its surrounding layout.

## How to run / verify

```bash
pnpm build
pnpm lint
pnpm test
pnpm preview --host 127.0.0.1 --port 4173
pnpm exec playwright test tests/e2e/service-layout.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/webgl-service.spec.ts
python3 scripts/worktree-fingerprint.py -- src/App.tsx src/components/Planner.tsx src/components/RushPanel.tsx src/components/RushStockGrid.tsx src/components/GameHeader.tsx src/accessibility/GameAnnouncer.tsx src/scene/three/ServiceWorld.tsx src/styles.css tests/components/game-loop.test.tsx tests/components/presentation.test.tsx tests/components/accessibility.test.tsx tests/e2e/service-layout.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/webgl-service.spec.ts
```

The recorded browser gate used the already-built preview. Chromium requires
the project profile's outside-sandbox fallback in this macOS environment.

## Integration notes & gotchas

- `src/scene/CanvasScene.tsx` remains in source history but has no production
  App import, emitted manifest entry, runtime resource, or WebGL recovery path.
  Do not restore it as a planning preview or gameplay fallback.
- Planning, report, reinvestment, victory, and defeat all use the scene-free
  management flow. Component 7.5 may recompose report content inside that flow
  without adding a preview column.
- The service onboarding guide follows stock so it cannot interrupt the four
  asserted information regions. Its `.control-column` focus target is retained
  for the existing “Show current step” behavior.
- Dashboard cash and revenue are separate canonical values: `game.cashCents`
  is current stored cash and `rush.stats.revenueCents` is live service revenue.
  Satisfaction is the current served-customer average; before the first rating
  it reads “No ratings yet”.
- Event state is textual and colour-independent: pending decisions identify
  their title, resolved decisions identify the latest summary, and an ordinary
  rush explicitly says no decision is active.
- The future department-store venue inherits this information flow once its
  Phase 8 world is added to the existing exhaustive service renderer.

## Spec-to-delivery map

| Acceptance criterion                                                             | Runtime behavior and files                                                                                                                   | Proof                                                                                                                                                  |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Planning is full-width with no preview in every venue state                      | `App.tsx` has a scene-free `management-layout`; the Canvas dynamic import, caption, placeholder, and two-column scene reservation are absent | Three-venue planning imports at desktop and touch widths; component assertions for planning/report/reinvest/ending; production manifest/App inspection |
| Service order is scene, dashboard, activity, stock                               | `App.tsx`, `RushPanel.tsx`, `RushStockGrid.tsx`, and `ServiceWorld.tsx` expose four direct ordered regions                                   | Shared component assertion and real-browser direct-child order across cart, kiosk, and cafe                                                            |
| Dashboard is complete and immediately below the scene                            | `SERVICE_DASHBOARD_FIELDS` and visible data markers cover time, economic/throughput/sentiment truth, event state, pause, and all speeds      | Shared contract imported by component, accessibility, and desktop/mobile layout tests                                                                  |
| Exact 360×780 composition needs no document scroll                               | Service-only compact header, 2:1 mobile WebGL stage, dense dashboard grid, 44px controls, and safe-area padding in `styles.css`              | Bounding-box assertions prove `scrollY === 0`, full scene height, adjacency, dashboard bottom and every field bottom at or above 780px                 |
| Activity and stock remain complete and reachable below                           | `RushPanel` preserves service note, sale/walkaway evidence and recent activity; `RushStockGrid` follows it unchanged in truth                | DOM/bounding order, `scrollIntoViewIfNeeded`, semantic list, reduced-motion parity, and touch journeys                                                 |
| Desktop, touch, keyboard, event, orientation, and reduced motion remain playable | Responsive CSS, DOM-native controls, phase announcer, modal focus, orthographic resize, and unchanged snapshot renderer                      | 1280×800 and 360×780 projects; landscape resize; keyboard/touch event and speed/pause; accessibility and WebGL recovery suites                         |

## Assurance lane

- **Lane:** `fast (lean override)`
- **Validation tier / owner / commit owner:** Tier 2 component gate / Implement /
  Implement
- **Standard Test triggers recorded:** responsive touch/keyboard UI,
  event-dialog and reduced-motion behavior, real WebGL composition, and
  regression-prone service navigation.
- **Standard Review triggers recorded:** App-entry composition, shared public
  dashboard/DOM contracts, broad responsive styles, and removal of a production
  route.
- **Lean disposition:** the approved two-role restriction assigns the Tier 2
  gate, self-review, correction, and commit to Implement.

## Deviations and decisions

- No required behavior was split, deferred, or descoped. No dependency,
  persistence schema, simulation rule, asset, or external service changed.
- Component 7.3's exact R3F/Three/Vite capability evidence remains current.
  This component introduced no new external API assumption.
- A first sandboxed Playwright launch was rejected by macOS Mach rendezvous
  permissions. The project profile's outside-sandbox fallback launched the same
  installed Chromium and all focused/final journeys passed.
- The approved title art remains byte-identical at SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Validation evidence

- **Candidate fingerprint:**
  `8b454480fd409f29f3f56bb20722bd4ea944a39ae946dbc189eb19c5e71db700`
- **Fingerprint command and scope:** the exact command in **How to run /
  verify**; it returned the same hash before and after Tier 2. Overview,
  context, progress, and team-state evidence are excluded by the repository
  fingerprint contract.
- **Targeted proof:** focused production build PASS; lint/format PASS; named
  component suites 30/30 PASS; exact service-layout browser suite 6/6 PASS
  across desktop and touch mobile; focused production-graph inspection 2/2
  PASS.
- **Tier 2 build:** `pnpm build`; exit 0 in 3.153462 seconds. Dynamic
  `ServiceWorld` is 206.14 kB, isolated `three-webgl` is 724.51 kB, and no
  Canvas scene entry is emitted.
- **Tier 2 lint:** `pnpm lint`; exit 0 in 7.122089 seconds.
- **Tier 2 tests:** `pnpm test`; exit 0 in 5.564851 seconds, 16 files and
  141/141 tests.
- **Tier 2 browser:** against one already-built preview,
  `pnpm exec playwright test tests/e2e/service-layout.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/webgl-service.spec.ts`;
  exit 0 in 28.384557 seconds, 18 PASS and two intentional project skips
  across desktop Chromium and exact 360×780 touch mobile.
- **Production/cache inspection:** `ServiceWorld` is the only App scene dynamic
  entry; App and service imports contain no Canvas reference; production HTML
  names no lazy 3D chunk; Workbox precaches 19 entries / 1,718.42 KiB; every
  emitted file remains below 1,000,000 bytes.
- **Renderer/engine separation:** the existing frozen render-snapshot boundary,
  bounded crowd/lighting/DPR budgets, and command-free ServiceWorld remain
  intact; WebGL context-loss, unsupported, speed, reload, and persisted-economy
  assertions all pass.
- **Raw logs:** none required; final command output is concise and reproducible.

## Manual tests automated

- Exact 360×780 scroll position and bounding boxes, full dashboard field
  visibility, all 44px service controls, direct DOM/visual order, three venues,
  below-fold reachability, 780×360 resize, desktop containment, keyboard/touch
  event resolution, pause/speed, reduced motion, unsupported WebGL, context
  recovery, production chunk graph, and cache ceiling are executable tests.

## Human tasks

- No Component 7.4 account, credential, secret, asset, backend, publication, or
  manual setup task exists.
- Representative physical touch-device evidence remains reserved for Component
  7.6 and is not claimed by Playwright.
- Phase 7 merge still requires explicit human approval after Component 7.6.
