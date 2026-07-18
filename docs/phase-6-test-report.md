# Phase 6 Test Report — LOCAL PASS — HOSTED PENDING

## Release under test

- Branch: `phase-6`
- Validated feature head before final evidence records:
  `cea3cc0d54a5cd55458e206959dc115ce776e84b`
- Pushed feature ref: `origin/phase-6` at the same commit
- Runtime: Node.js 22.13.1, pnpm 10.15.0
- Browser harness: Playwright 1.61.1 with managed Chromium
- Projects: 1280×800 desktop Chromium and 360×780 touch-mobile Chromium
- Public URL: `https://sjmeehan9.github.io/tycoon/` currently represents the
  earlier `main` release, not this unmerged Phase 6 candidate

## Exact validation sequence

Executed in project-profile order after all Phase 6 source and test changes:

| Command                          | Result                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS — lockfile current; no Phase 6 dependency change                                 |
| `pnpm build`                     | PASS — strict TypeScript, production Vite build, and 17-entry service-worker precache |
| `pnpm lint`                      | PASS — zero ESLint warnings and Prettier clean                                        |
| `pnpm test`                      | PASS — 119 engine, scene, name, persistence, balance, PWA, and component tests        |
| `pnpm test:e2e`                  | PASS — 47 applicable production journeys; 7 intentional project-routing skips         |

The complete Playwright command executed 54 project cases in 1.6 minutes. The
seven skips are explicit routing: desktop-only keyboard planner/accessibility,
touch-only planner/accessibility, and three real service-worker lifecycle cases
that run once in desktop Chromium. Both new living-rush and staff-name journeys
ran and passed in both projects; no required target is hidden by a skip.

## Activity-stream evidence

- The pure engine emits stable, monotonically sequenced arrivals, service
  starts, actual-price sales, and walkaways at the transition that owns each
  fact. Unit tests prove equal observations at 1×/2×/4×, adjacent queue-full
  arrival/departure order, patience, stockout, rush-end ordering, and sale
  completion after service start.
- One append/prune authority retains at most 80 events. Import validates safe
  IDs, increasing sequence, unique event identity, exact discriminants/reasons,
  bounds, and legacy sale-only normalization before replacing the active run.
- Events are player feedback, not a second ledger. Revenue remains in
  `RushStats`/reports, inventory remains in dated batches, and actual charges
  remain the engine-recorded `Order.priceCents` proven by the retained Phase 4
  reconciliation journey.
- Reload restores the exact retained tail and next sequence. Scene playback
  initializes that history as current truth rather than replaying it as new
  motion.

## Living-scene and accessibility evidence

- The fixed 320×180 Canvas shows exact `QUEUE N`, up to eight detailed
  segment-distinct sprites, `+N` overflow, active counter service/cup handoff,
  actual `+$X.XX` sales, served exits, and distinct visual paths/labels for all
  four walkaway reasons.
- Presentation consumes only immutable snapshots and stable event IDs. Bounded
  playback retains at most three transients/eight queue motions, coalesces by
  customer, caps frame deltas, catches up at 4× without changing engine ticks,
  freezes on pause, and settles immediately for reduced motion.
- A live rush-to-report transition finishes only already-synced bounded closing
  departures and then stops its animation frame loop. Reloading a report
  schedules no replay and no idle Canvas loop.
- Canvas name, figcaption, visible HUD, actual-sale note, walkaway note, and
  ordered activity list provide motion-, icon-, and colour-independent parity.
  The desktop and 360px production journeys enforce exact 12/`+4` truth,
  counter segment, $7.25 sale, stockout, pause/reload, frame budget, fixed bounds,
  and no document overflow.
- Fresh final-run artifacts at
  `test-results/living-rush-*/living-rush-static.png` were visually inspected in
  both projects. The complete HUD, counter, eight customers, overflow, sale, and
  walkaway evidence are readable and contained in each capture.

## Campaign-unique name evidence

- Exhaustive tests address all 65,536 names and find 65,536 exact unique
  results. A separate Day 1–10,000 loop proves all 40,000 candidate slots unique
  for one campaign and disjoint from every legacy curated name.
- Candidate ordinal is direct `(day - 1) × 4 + index`. Each 4,096-pair tier is
  an odd-multiplier seed-keyed affine bijection; tier formatting makes equal
  pairs disjoint. No rejection sampling, random loop, or persisted name history
  exists.
- Candidate generation deliberately consumes its prior unused 12-way name draw,
  retaining exact role, speed, skill, wage, trait, and campaign-balance output.
  Hire, reject, next-day, fresh reset, victory-to-endless, Day 10,000, reload,
  and import paths all pass.
- Compatible schema-v3 saves normalize hires then candidates in stable order,
  retain the first duplicate occurrence and every originally unique name, and
  rename later duplicates from ordinals 40,000–65,535. IDs, stats, economics,
  scheduling, and bounded save shape remain unchanged; duplicate IDs reject.

## Retained compatibility and gameplay evidence

- Phase 4 semantic price/package steppers, repeated $0.10 update, actual charge,
  sale/revenue equality, report cash reconciliation, and settled-cash journey
  pass in their intended keyboard/touch projects.
- Phase 5 dated batches, newest-first reservation, inclusive expiry,
  refrigeration, weighted capacity, all-nine live stock, pause/reload, exact
  inventory conservation, migration, and actual-charge retention pass on
  desktop and 360px touch-mobile.
- Full cart and specialty-coffee days, staff/equipment/venue growth, two viable
  campaign strategies, bankruptcy, target miss, victory, endless mode, cosmetic
  records, save import/export, future-version rejection, and backup recovery
  remain green.
- Production subpath cache, offline continuation, deferred waiting worker,
  verified update/checkpoint/restore, manifest/media presentation, audio consent,
  keyboard/touch accessibility, and responsive layout all pass cumulatively.

## Performance and build evidence

- Production output: application JavaScript 321.19 kB raw / 100.27 kB gzip;
  CSS 23.34 kB raw / 5.51 kB gzip; Workbox client 5.65 kB raw / 2.20 kB gzip.
- The generated service worker precaches 17 entries totalling 817.27 KiB. No
  runtime dependency, remote asset, secret, account, backend, or analytics path
  was added in Phase 6.
- The living-rush production journey measures 30 frames at 4× within its
  two-second budget in both projects, then proves immediate pause freeze and
  bounded closing-transient clearance.

## Automated manual journeys

Every named manual flow that can run locally is automated against the production
bundle:

- `living-rush.spec.ts`: exact static scene, responsive screenshot, animation
  budget, pause, reduced motion, reload, queue overflow, actual sale, walkaway,
  and post-rush RAF clearance in both projects;
- `staff-names.spec.ts`: compatible duplicate import, hire/autosave/reload, and
  final endless Day 10,000 pool in both projects;
- `planner-controls.spec.ts` and `stock-lifecycle.spec.ts`: retained Phase 4/5
  exact economics, stock, report, and 360px contracts;
- `pwa.spec.ts`: real production cache, offline continuation, waiting-worker
  deferral, safe update, and exact restored save;
- all other E2E files: complete days, operations, outcomes, persistence,
  accessibility, presentation, save transfer, and recovery.

Hosted Pages checks cannot be automated truthfully until the human-approved
merge deploys this branch. Their pending fields live in
`docs/phase-6-release-evidence.md`.

## Self-review

- Static inspection found no placeholder, TODO, FIXME, unimplemented exception,
  production test seam, external runtime request, or new mutable shadow state.
- Activity is bounded observation only. No event path mutates accounting twice;
  sale evidence reads actual engine charges and report code filters event type.
- `src/scene` contains no command dispatch, tick, inventory, cash, revenue, or
  PRNG write. Its only runtime scheduler is bounded Canvas animation; simulation
  ticking remains in `GameContext` and depends on saved speed, not renderer time.
- Game/name code contains no `Math.random`, wall-clock name allocation,
  rejection sampling, or unbounded seen-name collection. The only repair loop is
  capped by the finite 25,536-name reserved range and bounded 8+4 people input.
- Playback is capped, stale transients expire, pause/reduced-motion paths are
  explicit, and report reload cannot start an idle loop. All activity meaning is
  duplicated in readable text.
- Phase 4 pricing and Phase 5 batch inventory remain their single authorities.
  The default application/import paths exercise every Phase 6 contract; no
  required behavior exists only behind mocks or optional injection.

## Component commits and branch state

- `7ecd797` — Component 6.1, human setup and final release gate
- `ccbe119` — Component 6.2, deterministic rush activity stream
- `1ade6d9` — Component 6.3, expressive rush scene
- `cea3cc0` — Component 6.4, campaign-unique staff names
- Component 6.5 is this final local validation/evidence record; its SHA and clean
  `origin/phase-6` push are reported by the completion handoff after commit.

Before this documentation commit, `origin/main` was the direct ancestor and the
candidate was 13 commits ahead; the candidate was not an ancestor of
`origin/main`. No merge, Pages workflow, deployment, or hosted mutation occurred.

## Verdict

**LOCAL PASS — HOSTED PENDING.** Every Phase 6 acceptance criterion and every
retained Phase 1–5 local target passes on the production bundle across desktop
and touch-mobile. Human approval is now required before merge/publication; the
branch must not claim hosted PASS until the deployed Phase 6 commit passes the
explicit public checks.
