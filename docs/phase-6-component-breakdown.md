# Phase 6 Component Breakdown — Living Rush and Unique People

## Phase contract

Phase 6 starts from validated Phase 5 head `212232c`. It adds deterministic
rush activity, expressive Canvas/text feedback, and collision-free staff names
without changing simulation outcomes, accounting, inventory, or prior release
behavior. The same sole Implement agent owns source, tests, fixes, self-review,
documentation, commits, and the local release-evidence handoff.

Local implementation needs no account, credential, secret, environment file,
external service, dependency installation beyond the pinned lockfile, or manual
platform action. After Component 6.5 local PASS and branch push, the human must
approve or reject the final merge/publication and confirm the updated GitHub
Pages build before anyone records hosted PASS. This phase does not merge `main`
or publish from the implementation branch.

The approved root execution directive is additive authority over the older
Phase 6 outline in `docs/phase-plan.md` where they differ. In particular, staff
name uniqueness is mathematical and stateless: no unbounded displayed-name
history is persisted.

## Component 6.1 — Human Setup and Final Release Gate

### Runtime outcome

Local Phase 6 implementation can proceed with a complete ownership/validation
contract, while final merge and hosted verification remain explicitly human
gated.

### Deliverables

- Confirm Phase 5 PASS head and a clean `phase-6` branch.
- Record that local implementation has no human/manual setup task.
- Refine Components 6.2–6.5 into complete vertical slices with exact interfaces,
  compatibility, performance, accessibility, validation, and file ownership.
- Record the final human gate: approve/reject merge, allow Pages publication,
  then confirm the public URL before hosted PASS.
- Initialize Phase 6 context, overview, progress, and team state.

### Files and interfaces

- `docs/phase-6-component-breakdown.md`
- `docs/implementation-context-phase-6.md`
- `docs/components/phase-6-component-6-1-overview.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`

### Dependencies

Validated Phase 5 and the existing GitHub Pages workflow.

### Technical validation

No external API or platform assumption is required for local work. The feature
uses the existing pure TypeScript engine, schema-v3 bounded JSON persistence,
Canvas 2D renderer, React accessibility surface, and configured Vitest/RTL/
Playwright stack. The public deployment remains deliberately outside local
agent authority until the recorded human gate.

### Acceptance criteria

- No local setup task is silently skipped.
- Every later component has full runtime behavior, concrete file ownership,
  compatibility rules, and environment-specific proof.
- Final merge/publication/hosted verification is the only remaining human task.

## Component 6.2 — Deterministic Rush Activity Stream

### Runtime outcome

Every arrival, service start, completed sale, and walkaway is represented by one
ordered bounded engine event that survives reload and drives exact scene/text
snapshots without changing gameplay or accounting.

### Deliverables

- Replace the sale-only `recentActivity` element type with the discriminated
  `RushActivityEvent` union: `arrival`, `serviceStarted`, `sale`, `walkaway`.
  Every record carries stable event ID, monotonic sequence, tick, customer ID,
  and segment (`null` only for honestly migrated legacy observations). Sale
  records retain drink/size/milk and the engine-recorded actual `priceCents`.
  Walkaway reason is exactly `patience`, `queueFull`, `stockout`, or `rushEnded`.
- Add bounded monotonic sequence state and one append/prune authority. Emit at
  real engine transitions: accepted/generated arrival; immediate queue-full
  rejection; patience removal; stockout removal; successful reservation/service
  start; successful sale; and every unfinished customer at rush end.
- Preserve event ordering through event-added customers, pause, speed changes,
  reload, import/export, and completion. Renderer time/frame count must never
  enter engine state or event identity.
- Keep `recentActivity` as the evolved public field for schema-v3 compatibility.
  Normalize sale-only v3 payloads into honest legacy sale events, supply the
  next sequence, and validate every union variant and bound before state changes.
- Expose immutable scene snapshots containing exact uncapped queue count, active
  customer identity/segment/order, and bounded recent events. Add colour-
  independent accessible descriptions for all event/reason variants.
- Adapt actual-charge report/rush selectors to filter sale events while keeping
  Phase 4 revenue/accounting and Phase 5 stock behavior unchanged.
- Prove equal seed/commands, 1×/2×/4×, bounded pruning, ordering, exact prices,
  all four walkaway reasons, reload continuation, legacy normalization, invalid
  rejection, and exact queue counts beyond the visual sprite cap.

### Files and interfaces

- `src/game/types.ts`, `src/content/gameContent.ts`, `src/game/engine.ts`
- `src/game/selectors.ts`, `src/game/index.ts`
- `src/persistence/saveStore.ts`
- `src/scene/sceneModel.ts`
- `src/components/RushPanel.tsx`, `src/components/ReportPanel.tsx`
- `tests/unit/engine.test.ts`, `tests/unit/operations.test.ts`,
  `tests/unit/persistence.test.ts`, `tests/unit/scene.test.ts`
- `tests/components/game-loop.test.tsx`
- `docs/components/phase-6-component-6-2-overview.md`
- `docs/implementation-context-phase-6.md`, `docs/phase-progress.json`

### Dependencies

Phase 4 bounded actual-sale observation and Phase 5 engine/persistence/report
contracts.

### Technical validation

The stream is a fixed-size array capped by `RUSH_ACTIVITY_LIMIT`; append work is
constant in the campaign domain and serialized size is bounded. IDs derive from
day plus persisted monotonic sequence, never PRNG or renderer time. Observation
events do not write stats, cash, inventory, queue policy, or order outcomes.

### Acceptance criteria

- Equal deterministic commands yield byte-equal event sequences independent of
  presentation speed/frame rate.
- Each real customer transition emits exactly one appropriate ordered record;
  every walkaway uses one locked reason and sales expose actual charged price.
- Compatible v3 saves normalize/reload without duplicate IDs or lost ordering;
  malformed/future/over-bound activity is rejected safely.
- Scene snapshots report exact queue count, active customer, and recent events
  even when the Canvas displays fewer sprites.

## Component 6.3 — Expressive Queue, Sale, Exit, and Walkaway Scene

### Runtime outcome

A user can see and read customers approach, queue, order, pay, carry coffee away,
or depart for a distinct reason at 1×/2×/4×, on desktop and at 360px, with
equivalent static reduced-motion feedback.

### Deliverables

- Rework Canvas presentation around immutable `SceneSnapshot` plus the canonical
  event stream. Render walking arrivals from the street, eased queue-position
  shifts, a visible exact `QUEUE N`, up to eight segment-distinct detailed
  sprites, and `+N` overflow without truncating textual truth.
- Move the front customer to the counter while active. On sale, animate cup
  handoff, actual `+$X.XX`, and a served customer exiting with coffee. Render
  distinct departures for patience, queue-full, stockout, and rush-end events
  using movement, iconography, and exact colour-independent labels.
- Implement a bounded/coalesced playback controller that consumes only retained
  event IDs, catches up to the latest snapshot at high speed, clears stale
  transients after bounded durations, and never accumulates an unbounded event
  backlog. Pause freezes motion; reload begins from persisted current state and
  recent canonical evidence without replaying an old history as new gameplay.
- Reduced motion must immediately render current static queue/active state and
  equivalent exact latest-sale, walkaway reason, and queue text; it performs no
  travel animation. Canvas `figcaption`/rush textual activity remain exact and
  accessible regardless of pixels or colour perception.
- Retain the fixed responsive scene frame, Phase 5 stock grid, Phase 4 actual
  charge evidence, local bundled assets, and simulation/render separation. Add
  no dependency or external asset/network request.
- Add pure scene/playback tests, Canvas draw/component tests, and production
  desktop/touch journeys for animation states, exact queue count over eight,
  sale/walkaway text, pause/reload catch-up, reduced-motion parity, Canvas-fixed
  bounds, no document overflow, and practical frame/render budgets. Capture a
  stable paused/reduced-motion screenshot baseline where deterministic.

### Files and interfaces

- `src/scene/sceneModel.ts`, `src/scene/scenePlayback.ts`,
  `src/scene/CanvasScene.tsx`
- `src/components/RushPanel.tsx`, `src/styles.css`
- `tests/unit/scene.test.ts`, `tests/components/presentation.test.tsx`,
  `tests/components/accessibility.test.tsx`, `tests/components/game-loop.test.tsx`
- `tests/e2e/living-rush.spec.ts`, optional deterministic screenshot baseline
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-6-component-6-3-overview.md`
- `docs/implementation-context-phase-6.md`, `docs/phase-progress.json`

### Dependencies

Component 6.2 and retained Phase 3 scene/accessibility contracts.

### Technical validation

Canvas uses a fixed logical coordinate system and at most eight detailed queue
sprites plus a small bounded transient set. Playback state exists only in React
refs/local presentation state; engine snapshots remain immutable. Coalescing by
stable ID and bounded age keeps render work independent of historical playtime.

### Acceptance criteria

- Arrival, queue shift, service, cup/payment/sale, served exit, and four distinct
  walkaway reasons are visually and textually distinguishable.
- Exact `QUEUE N`, actual charge, active customer, latest walkaway, and overflow
  remain truthful at all speeds and after reload.
- Reduced motion exposes equivalent ordered state/text immediately with no
  travel animation.
- Desktop and 360px production proof passes accessibility, performance, visible
  bounds, fixed Canvas sizing, and no-overflow targets without gameplay change.

## Component 6.4 — Campaign-Unique Staff Names

### Runtime outcome

Every candidate identity displayed from Day 1 through supported endless Day
10,000 has a readable name that no other candidate or hire in that campaign can
ever share, with equal seed/day reproducibility and no growing seen-name state.

### Deliverables

- Add a pure staff-name module containing diverse Australian given/surname
  components and a collision-free indexed/permuted namespace of at least 65,536
  identities. Candidate slot ordinal is `(day - 1) × 4 + index`; a seed-keyed
  bijection permutes each 4,096-name tier. Initial-free names serve the first
  tier; readable middle initials extend later tiers only when required.
- Guarantee all 40,000 supported candidate slots (four × 10,000 days) are unique
  inside a campaign without rejection sampling or stored history. Same seed/day
  returns the same four names. A different seed permutes allocation while exact
  roles, speed, skill, wage, and trait generation remains deterministic.
- Ensure generated names cannot equal any of the legacy 12 curated names.
  Reserve generated ordinals outside the supported candidate range for migration
  repair only.
- Normalize compatible schema-v3 saves by processing current hires then current
  candidates in stable array order: preserve the first existing occurrence of
  each exact name and deterministically rename later duplicates from the reserved
  namespace. Never rename unique existing people, store unbounded seen-name
  history, or alter IDs/stats/economics.
- Validate candidate/staff IDs and uniqueness after normalization, and prove
  hiring, rejected candidates, next-day/endless progression, reload/import,
  duplicate migration, 40,000-slot exhaustion, fresh-campaign reset, save-size
  bounds, and retained campaign balance.

### Files and interfaces

- `src/game/staffNames.ts`, `src/game/engine.ts`, `src/game/index.ts`
- `src/persistence/saveStore.ts`
- `tests/unit/staff-names.test.ts`, `tests/unit/operations.test.ts`,
  `tests/unit/persistence.test.ts`, `tests/unit/campaign.test.ts`
- `tests/components/game-loop.test.tsx`, `tests/e2e/staff-names.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-6-component-6-4-overview.md`
- `docs/implementation-context-phase-6.md`, `docs/phase-progress.json`

### Dependencies

Phase 5 schema-v3 persistence and candidate/hiring/next-day/endless flows.

### Technical validation

An affine permutation over 4,096 pair indices uses an odd multiplier, making it
a bijection modulo `2^12`; tier-specific initials make outputs disjoint. Forty
thousand direct-index calls are finite and easily unit-testable. Runtime stores
only names already present on bounded staff/candidate records, never a campaign
history proportional to day count.

### Acceptance criteria

- All 40,000 supported displayed candidate slots are exact-name unique for one
  campaign, deterministic for equal seed/day, and disjoint from legacy names.
- Candidate role/stat/economy behavior remains deterministic and campaign
  strategy tests stay green.
- Reload/import/hire/reject/endless flows create no collision, and migration
  preserves first unique occurrences while repairing every duplicate.
- Save size remains bounded; no seen-name collection is added to game state.

## Component 6.5 — Cumulative QA, Documentation, and Release Evidence

### Runtime outcome

Phase 6 has a truthful local PASS handoff across living-rush feedback, unique
people, every retained gameplay/PWA contract, and a clearly pending human-
approved hosted release gate.

### Deliverables

- Run exactly, in order: `pnpm install --frozen-lockfile`; `pnpm build`;
  `pnpm lint`; `pnpm test`; `pnpm test:e2e`. Fix every failure before PASS.
- Exercise activity determinism/order/reasons/bounds/reload, exact scene queue
  overflow, animation catch-up, pause, reduced motion, actual charges, name
  exhaustion/migration/endless, inventory/report retention, desktop, 360px,
  offline, service-worker update, save transfer, and campaign balance.
- Self-review source/tests for placeholders, duplicate event/accounting state,
  renderer-to-engine writes, wall-clock/PRNG coupling, stale/unbounded playback,
  inaccessible colour-only feedback, name collisions/rejection loops/history,
  Phase 4/5 regressions, and required behavior behind test seams.
- Write `docs/phase-6-test-report.md` as **LOCAL PASS — HOSTED PENDING** only
  after the exact local sequence passes. Update context/overviews/progress/team
  state/runbook and create `docs/phase-6-release-evidence.md` with local evidence
  plus explicit pending fields for human-approved merge, Pages workflow, public
  refresh/reload, mobile, activity/name, and offline verification.
- Commit and push `phase-6` cleanly. Do not merge `main`, trigger/claim a public
  release, or mark hosted PASS. Stop at the final human release gate.

### Files and interfaces

- `docs/phase-6-test-report.md`, `docs/phase-6-release-evidence.md`
- `docs/components/phase-6-component-6-5-overview.md`
- `docs/implementation-context-phase-6.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`, `docs/agent-runbook.md`
- Any Phase 6-owned source/test correction needed for the passing gate.

### Dependencies

Components 6.1–6.4 and every retained Phase 1–5 validation target.

### Technical validation

The exact local commands and both Playwright projects are fixed by
`docs/project-profile.md`. GitHub Pages verification is technically impossible
to complete truthfully before the human-approved merge deploys this branch, so
local PASS and hosted pending are separate states by design.

### Acceptance criteria

- Every Phase 6 and retained test passes in the exact profile sequence.
- Reports record environment, commands/counts, activity/scene/name evidence,
  compatibility, automated manual flows, performance, and self-review.
- Five Phase 6 component commits exist and `phase-6` is pushed cleanly.
- `main` is unmerged/unpublished, hosted PASS remains unclaimed, Phase 4 actual
  charges and Phase 5 stock lifecycle remain intact, and the human release gate
  is explicit.
