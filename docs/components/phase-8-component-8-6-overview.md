# Component 8.6 — Dense Multi-Customer Heritage Hall

## What was delivered

A user can now watch the department-store rush as one dense, warm low-poly
heritage hall whose three bays, up to three simultaneous jobs, twelve sampled
queued customers, three recent departures, ten scheduled staff, commercial
equipment, and service effects all reconcile to the immutable simulation
snapshot. Exact totals and every omitted customer remain available in the
scene description and the complete dashboard. The full scene and dashboard fit
inside the initial 360×780 mobile viewport without hiding operational truth.

## Public interfaces / contracts exposed

- `SceneCustomerEntitySnapshot` and `SceneStaffEntitySnapshot` provide stable
  `customer:<id>` / `staff:<id>` identities plus canonical station, lane, job,
  activity, status, pose, destination, and progress fields. They are copied and
  deeply frozen before rendering.
- `SceneQueueSummary` retains exact normal, express, omitted, and per-station /
  lane totals. The scene represents at most twelve queued, three active, and
  three terminal customers; deterministic bucket round-robin gives every
  non-empty station/lane a fair visual sample before filling remaining slots.
- Terminal visual lifecycle is tick-derived: sale handoff at age zero, payment
  at age one, then exit through age five; stockouts and other abandonment remain
  explicit for ages zero and one, then exit. Frame time never advances status.
- `RenderSnapshot.snapshotId`, `service.customers`, `service.staff`,
  `service.activeJobs`, and `service.queueSummary` are the frozen renderer
  boundary. Existing singular active and queue projections remain for cart,
  kiosk, and cafe compatibility.
- `DEPARTMENT_LAYOUT` is the immutable venue placement authority for three
  stations, both queue lanes, lifecycle destinations, staff positions, six
  equipment anchors, four physical-upgrade anchors, and full/compact budgets.
- `DEPARTMENT_HERITAGE_MOTIFS`, `DEPARTMENT_EQUIPMENT_REGISTRY`, and
  `DEPARTMENT_PHYSICAL_UPGRADE_REGISTRY` expose the complete browser-inspectable
  hall contract.
- `departmentCustomerPoint`, `departmentStaffPoint`, and
  `departmentPerformanceBudget` are the venue-scoped placement/budget helpers.
  Compact mode changes detail only; it never drops a canonical customer, staff
  member, job, equipment category, station, or lane.
- The department renderer publishes configured caps and settled
  `WebGLRenderer.info.render.calls` / `triangles` on the scene figure and canvas
  without per-frame React state updates.

## Files owned

Created:

- `src/scene/three/entities/ActivityEffects.tsx`
- `src/scene/three/venues/departmentLayout.ts`
- `tests/e2e/department-store-scene.spec.ts`
- `docs/components/phase-8-component-8-6-overview.md`

Modified:

- `src/scene/sceneModel.ts`, `src/scene/three/renderSnapshot.ts`
- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/entities/People.tsx`
- `src/scene/three/venues/DepartmentStoreWorld.tsx`
- `src/scene/three/materials.ts`, `src/scene/three/camera.ts`
- `src/components/RushPanel.tsx`, `src/accessibility/GameAnnouncer.tsx`
- `src/styles.css`
- `tests/unit/scene.test.ts`, `tests/components/presentation.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/e2e/service-layout.spec.ts`, `tests/e2e/parallel-service.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

## How to run / verify

Focused snapshot, component, and accessibility proof:

```bash
pnpm exec vitest run tests/unit/scene.test.ts tests/components/presentation.test.tsx tests/components/accessibility.test.tsx
```

Focused dense WebGL and exact desktop/touch layout proof:

```bash
pnpm exec playwright test tests/e2e/department-store-scene.spec.ts tests/e2e/service-layout.spec.ts tests/e2e/parallel-service.spec.ts
```

The final Tier 2 gate uses the profile build, lint, and complete Vitest commands
plus the exact desktop/touch matrix below:

```bash
pnpm exec playwright test tests/e2e/department-store-scene.spec.ts tests/e2e/service-layout.spec.ts tests/e2e/parallel-service.spec.ts tests/e2e/webgl-service.spec.ts tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts
```

## Integration notes & gotchas

- Renderer code consumes snapshots only. It must never route demand, mutate a
  queue/job, consume inventory, settle money, or persist state.
- Entity source precedence is active jobs, fair queue samples, then the newest
  eligible terminal activity, with global customer-ID deduplication. The
  twelve-customer queue cap is visual only; `queueSummary` and the semantic
  dashboard retain all thirty waiting customers in the dense fixture.
- Animation uses frame time only for bounded transform flourishes. Canonical
  ticks own lifecycle state and service progress. Pause and reduced motion stop
  local movement; speed is applied only by the simulation clock.
- Customer and staff rendering use four instanced geometry calls in total;
  activity uses one bounded instanced call. Reusable colour objects avoid
  per-entity allocations in the animation loop.
- Full/compact budgets are respectively 72/52 draw calls, 60,000/30,000
  triangles, DPR 1.5/1.25, 1,024/512 shadow maps, 64/40 repeated furnishings,
  two lights, and one shadow-casting light. Compact equipment keeps all six
  meshes while disabling their six shadow passes.
- At 360×780, the hard layout limits are header ≤60 px, top padding ≤6 px,
  scene 150–180 px, scene/dashboard gap ≤7 px, dashboard ≤500 px, and dashboard
  bottom ≤760 px. Activity and stock remain below the dashboard in semantic and
  visual order.
- WebGL context recovery remounts only the renderer generation. Snapshot ID,
  customer/staff identities, and accessible scene text must match before and
  after recovery and reload.
- Existing cart, kiosk, and cafe world components, camera framing, and singular
  compatibility fields remain supported and were not replaced.
- Automated Chromium/touch-mobile results are browser evidence, not physical
  device proof. No physical device, hosted release, merge, deployment, or
  publication was accessed or claimed.
- Title art remains SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion                                                                                            | Runtime behavior and source                                                                                                                                                                               | Proof                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual customers, staff, stations, lanes, jobs, equipment, sales, and departures agree with authoritative truth | Frozen canonical entity arrays and exact queue summary in `sceneModel.ts` / `renderSnapshot.ts`; semantic scene, station strip, activity log, and inspectable IDs in `ServiceWorld.tsx` / `RushPanel.tsx` | Dense reconciliation/freeze/lifecycle unit tests; component and accessibility parity tests; desktop/touch entity and reload assertions         |
| Five heritage motifs, three bays, commercial equipment, and physical upgrades are visibly present               | Instanced tile, timber, brass, escalator, bay, equipment, and plaque geometry in `DepartmentStoreWorld.tsx`, driven by the immutable registry in `departmentLayout.ts`                                    | Registry/source unit assertions, DOM registry assertions, real-WebGL screenshot and settled non-zero geometry evidence                         |
| Approach, queue, service, handoff, payment, exit, stockout, and abandonment remain snapshot-derived             | Stable status/pose/destination contracts and tick-age terminal state; `People.tsx` and `ActivityEffects.tsx` alter transforms only                                                                        | Lifecycle tests across ticks with equal pause/speed status; renderer authority source audit; context-loss/reload identity browser flow         |
| Dense rendering remains bounded without hiding truth                                                            | 18 customer / 10 staff / 6 effect caps, instancing, full/compact LOD, bounded camera/DPR/shadows/furnishings, actual renderer telemetry                                                                   | Immutable cap/budget unit tests; full and compact actual-call/triangle assertions; all entity IDs retained in compact mode                     |
| Reduced motion and context recovery retain equivalent text and state                                            | Static complete scene when animation is disabled; existing `WebGLBoundary` generation recovery with stable snapshot identity                                                                              | Reduced-motion component/accessibility assertions and real-browser context loss, retry, and reload equality                                    |
| Scene plus complete dashboard fits at 360×780 with correct reading order                                        | Mobile-scoped scene/header/dashboard CSS and unchanged scene → dashboard → activity → stock application order                                                                                             | Hard geometry and every dashboard-field bounding assertion in touch-mobile; strengthened retained service-layout and parallel-service journeys |

## Assurance lane

`fast (lean override)`, Tier 2. Recorded standard Test triggers: first dense
multi-entity WebGL path, responsive desktop/touch behavior, actual renderer
metrics, context loss and reload, reduced motion, pause/speed behavior, and a
cross-component simulation-to-snapshot-to-semantic-UI path. Recorded standard
Review triggers: expanded public snapshot/layout contracts, shared renderer and
responsive styles, and broad runtime/test scope. The approved lean override
assigns targeted checks, self-review, correction, and Tier 2 to Implement; the
Lead Coordinator owns Git serialization and commit.

## Deviations and decisions

- No required behavior was descoped; Component 8.6 was delivered as one
  vertical slice with no dependency, schema, engine, or external asset change.
- Twelve queued customers is strictly a visual cap. Sampling visits every
  non-empty station/lane bucket once and then repeats the same fixed-order
  round-robin, preserving FIFO inside each bucket. Active identities take
  precedence and the terminal selector retains only the newest unique events.
- Lifecycle status and progress are derived only from the persisted rush tick
  and canonical job/activity data. Frame interpolation never advances status or
  applies rush speed.
- Four explicit physical-upgrade anchors are represented as one instanced
  plaque call, while the existing street-sign upgrade remains conditional.
- Compact LOD preserves every entity and equipment item. Its six-call saving is
  achieved by disabling compact equipment shadow passes rather than removing
  scene truth.
- `WebGLRenderer.info` was rechecked against the installed Three.js 0.185.1
  API. A focused real-runtime capability check confirmed settled call and
  triangle counters are readable from the mounted renderer after rendering;
  no architecture-changing assumption failed.
- Implement performed no Git mutation, physical-device access, merge,
  deployment, publication, engine change, or persistence change.
- The first full browser fallback exposed one owned harness-ordering defect:
  the import helper attempted to dismiss a background global message while the
  correctly opened pending-event dialog owned the interaction layer. The one
  bounded author-remediation now skips background notice dismissal whenever a
  modal dialog is present; it does not resolve or alter the event, and the
  original visibility, focus, choice, result, reduced-motion, and DOM-order
  assertions remain intact.

## Validation evidence

Targeted evidence before candidate freeze:

- Profile-compatible Node 24.18 strict TypeScript exited 0 in 4.01s.
- Scoped ESLint exited 0 in 4.70s with zero warnings.
- `pnpm exec vitest run tests/unit/scene.test.ts tests/components/presentation.test.tsx tests/components/accessibility.test.tsx`
  exited 0 in 4.09s: 3 files / 53 tests passed. A final focused rerun after the
  allocation-free animation-loop polish also passed 53/53 in 2.56s.
- Focused real-browser development evidence passed the dense department suite
  in both projects: five applicable cases passed with one intentional
  mobile-only project skip. Desktop settled at 58 calls / 8,242 triangles
  against 72 / 60,000. Compact settled at 52 calls / 7,098 triangles against
  52 / 30,000 while retaining all 18 customer and 10 staff identities. Context
  recovery and reload identity passed in both projects.
- The retained service-layout and parallel-service checks passed nine
  application cases; one transient-notice ordering harness failure was repaired
  by dismissing the two notices semantically, after which the affected mobile
  case passed. This was targeted feedback, not the final completion gate.
- In the first final-gate browser attempt, the sandbox denied every Chromium
  launch at macOS MachPort setup before application execution; the two
  browser-free bundle cases passed. The immediate profiled fallback executed
  the full matrix: 27 passed, three project-routed cases skipped intentionally,
  and only the event-flow case failed in both projects because its background
  message click was blocked by the expected modal backdrop. After the bounded
  helper correction, the exact event-flow case passed 2/2 in desktop Chromium
  and touch-mobile in 7.2s.

Final scoped candidate identity:

```bash
python3 scripts/worktree-fingerprint.py -- src/scene/sceneModel.ts src/scene/three/renderSnapshot.ts src/scene/three/ServiceWorld.tsx src/scene/three/entities/People.tsx src/scene/three/entities/ActivityEffects.tsx src/scene/three/venues/DepartmentStoreWorld.tsx src/scene/three/venues/departmentLayout.ts src/scene/three/materials.ts src/scene/three/camera.ts src/components/RushPanel.tsx src/accessibility/GameAnnouncer.tsx src/styles.css tests/unit/scene.test.ts tests/components/presentation.test.tsx tests/components/accessibility.test.tsx tests/e2e/department-store-scene.spec.ts tests/e2e/service-layout.spec.ts tests/e2e/parallel-service.spec.ts tests/fixtures/campaignFixtures.ts docs/components/phase-8-component-8-6-overview.md docs/implementation-context-phase-8.md docs/phase-progress.json docs/phase-8-component-breakdown.md
```

The invocation exited 0 before and after the repaired completion gate with the
identical fingerprint
`ea3595b9dbc5c3f9527286085e280a62e42b2458684175cf6162b82f32c766d9`.
It enumerates all nineteen executable source/test paths and all four approved
documentation paths. The fingerprint tool intentionally excludes evidence
payloads while preserving the executable/specification candidate identity.

The one final repaired Tier 2 gate for that unchanged candidate passed under
the profile-compatible Node 24.18 runtime:

- `pnpm build` exited 0 in 3.50s. Strict TypeScript and the production Vite/PWA
  build passed; 19 entries / 1,796.34 KiB were precached and the largest emitted
  file remained the isolated 724.51 kB Three.js chunk below the one-megabyte
  Workbox limit.
- `pnpm lint` exited 0 in 8.08s. ESLint reported zero warnings and Prettier
  reported that every checked source/test/configuration file matched.
- `pnpm test` exited 0 in 7.51s. All 16 Vitest files and 204 unit/component tests
  passed.
- `pnpm exec playwright test tests/e2e/department-store-scene.spec.ts tests/e2e/service-layout.spec.ts tests/e2e/parallel-service.spec.ts tests/e2e/webgl-service.spec.ts tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts`
  exited 0 through the profiled macOS Chromium fallback in 56.1s. Twenty-nine
  applicable desktop/touch cases passed, three opposite-input/mobile-only cases
  were skipped intentionally by project guards, and none failed or timed out.

The earlier `ea1bd6…` attempt is retained only as invalidated evidence: its
sandboxed browser launch was denied before application execution, and the
fallback exposed the repaired event-import harness defect. It is not completion
proof. The `ea3595…` gate above is the sole final completion result.

Post-gate `git diff --check` passed, port 4173 had no listener, the canonical
fingerprint remained `ea3595…`, and the title-art SHA-256 remained exactly
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.
No raw final-gate failure log is required because every final command exited
successfully.
