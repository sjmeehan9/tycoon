# Phase 8 Component Breakdown — Forty-Day Department-Store Campaign

## Approval and phase contract

Status: **Spec-Validated**

The user approved this breakdown's parent plan on 2026-08-08. Phase 8 begins
only from the validated Phase 7 PASS head and uses a separate `phase-8` branch.
It introduces one breaking save boundary and ships the complete campaign
expansion as a coherent phase: immutable difficulty, a 40-day campaign, a fourth
department-store venue, three equipment tiers, department staffing and roles,
three parallel stations, a configurable express lane, multi-customer service,
new content/unlocks, final balance, and hosted PWA release evidence.

The menu remains the existing ten drinks, sizes, milks, recipes, and ingredients.
There is no food, manual drink-making, weekly roster, second location, account,
backend, telemetry, paid content, or renderer-side simulation. Standard and Hard
are independent of scenario choice. Records are separated by difficulty; shared
unlocks remain non-economic.

One Implement engagement owns every component in strict order. Components
8.2–8.8 use `fast (lean override)` and Tier 2. Component 8.9 uses
`phase-gate (lean override)` and Tier 3 plus separately authorized hosted
evidence. Component 8.1 is documentary Tier 1 proof. Intermediate component
heads must remain internally playable even though Phase 8 is not merged until
the cumulative gate passes.

## Phase-wide Technical Validation

- Treat `SaveEnvelope`/`GameState` v4 as the only breaking boundary. Normalize
  every currently supported v1/v2/v3 primary, backup, recovery, and imported
  envelope through one bounded preferences-only conversion.
- Copy only `soundEnabled`, `ambienceEnabled`, and `reducedMotion`. Discard all
  active/endless progress, history, records, achievements, cosmetics, scenarios,
  and onboarding completion. A verified v4 marker prevents resurrection or a
  repeated automatic reset/notice.
- Centralize difficulty in a typed demand-influence registry. Technical
  Validation must map every arrival and order-choice influence in the current
  engine to exactly one entry and fail when a new source is unregistered.
- Standard uses one selected 1.20–1.25 multiplier for both registered price
  paths: aggregate/average-menu-price arrival response and segment-specific
  per-drink order-choice price response. Every non-price factor remains today's
  baseline.
- Hard uses one selected 1.60–1.75 multiplier over today's baseline—not
  Standard—for every registered factor's deviation from neutral. Registry
  domains are `bidirectional`, `positive-only`, or `negative-only`; tests cover
  every supported direction, neutral, clamp, and boundary without inventing an
  unsupported sign.
- Keep station/queue/job processing pure and serial. Stable IDs and deterministic
  ordering resolve simultaneous arrivals, stock reservations, completions,
  abandonment, events, and settlement exactly once.
- Build department visuals only from immutable canonical snapshots after engine
  station/lane contracts exist. Visual entities cannot create customers or
  choose service order.
- Run deterministic multi-seed Day 1–40 simulations from typed configuration.
  At least two materially distinct strategies per difficulty must be viable;
  plausible mismanagement must still produce bankruptcy.
- Re-verify official Three.js/R3F/Vite/Workbox/browser guidance before final
  dependency/configuration locks. Keep the WebGL route lazy, each precached file
  under 1 MB, the dense mobile target responsive at 30 FPS, and desktop target
  60 FPS. Agent evidence is limited to automated browser measurements; any
  physical Safari/mobile-GPU/FPS result is optional, owner-only, hosted, and
  remains pending/unclaimed until the repository owner supplies it.

## Component 8.1 — Human Setup and Final Release Gates

Status: **Spec-Validated**

### Runtime outcome

Phase 8 can start from an identified Phase 7 PASS head with the final merge and
GitHub Pages publication explicitly reserved for later human approval.

### Deliverables and ownership

- Record the validated Phase 7 base/head and create `phase-8` without committing
  directly to `main`.
- Confirm read-only access to the existing repository and Actions/Pages
  controls.
- Record the optional physical Safari/mobile-GPU/orientation/FPS path as
  owner-only against the exact final hosted candidate after separate approval.
  Agents never access, reserve, identify, or claim availability of a device.
- Record that no new account, credential, secret, paid asset, backend, or
  runtime service is required.
- Reserve two later human decisions after local Component 8.9 PASS: approve the
  Phase 8 merge, then approve public Pages publication/hosted verification.
- Initialize Phase 8 context, overview, progress, and team state.

### File ownership

- `docs/phase-8-component-breakdown.md`
- `docs/implementation-context-phase-8.md`
- `docs/components/phase-8-component-8-1-overview.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`

### Dependencies

Component 7.6 local PASS, human-approved Phase 7 merge, and the existing Pages
channel.

### Technical Validation

This is documentary setup only. Validate exact branch ancestry, the Phase 7
PASS fingerprint, repository/release-channel availability, the pending and
unclaimed owner-only physical path, and the separation between local PASS,
merge approval, publication approval, automated deployment identity, and
owner-supplied hosted evidence. Do not infer any future human action.

### Acceptance mapping

- Exact base/head, owner-only optional physical path, ownership, validation,
  merge, and publication gates are recorded without a device identifier or
  availability claim.
- No runtime, package, deployment, merge, publication, or visibility change is
  made in this component.

### Validation gate

Assurance lane `fast (lean override)`, Tier 1 documentary proof, branch/head
inspection, and `git diff --check`.

## Component 8.2 — One-Time Reset and Immutable Difficulty

Status: **Spec-Validated**

### Runtime outcome

Every supported legacy save crosses one safe preferences-only boundary into a
fresh v4 campaign. A player then creates a Standard or Hard campaign with
Standard preselected, scenario chosen independently, immutable difficulty, and
transparent demand rules.

### Deliverables

- Introduce `Difficulty = 'standard' | 'hard'` in v4 `GameState`, campaign
  options, reports, records, commands/selectors, UI, and public exports.
- Build one v1/v2/v3 primary/backup/recovery/import normalization path. Copy only
  sound, ambience, and reduced-motion. Initialize onboarding incomplete, clean
  v4 meta/progress/history, and a one-time evolution notice marker.
- Quarantine legacy backup/recovery candidates after a verified v4 write so
  fallback cannot resurrect discarded data. Keep corrupt/unsupported handling
  bounded and honest.
- Make a v4 round trip idempotent. Repeated startup, autosave, recovery, and
  export/import must not reset a verified v4 campaign or repeat the notice.
- Fail imported data closed when no concrete browser store exists or its v4
  write fails. Do not consume the notice marker or mutate refs/React state until
  persistence succeeds; surface an actionable storage error.
- Put Standard first and visibly preselect it on new-campaign creation. Changing
  scenario does not change difficulty, and changing difficulty does not change
  scenario. Difficulty cannot change after creation.
- Partition records by difficulty. Achievements, scenarios, cosmetics, and
  endless/shared unlocks remain common and economically neutral.
- Add `demandInfluences.ts` as the typed registry and the only difficulty
  application authority. Register:
  - arrival: aggregate price, reputation, street sign/improvements, dial-in,
    bean, weather, venue, scenario, scheduled team/traits/equipment, queue/wait,
    availability/stock, and rush-event demand multiplier;
  - order choice: segment-specific per-drink price, segment appeal, and weather.
- Each entry declares baseline, neutral, domain, application, clamp/boundary,
  and engine source. An exhaustiveness test fails if engine and registry differ.
- Standard multiplies both price-response slopes by the same configured value
  within 1.20–1.25; all non-price entries remain baseline.
- Hard multiplies every supported deviation from neutral by the same configured
  value within 1.60–1.75, referenced to today's baseline and never compounded on
  Standard.
- Surface concise accessible explanations of Standard and Hard in campaign
  creation, onboarding, and Game menu help.

### File ownership

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/demandModel.ts`
- `src/game/demandInfluences.ts`, `src/game/selectors.ts`, `src/game/index.ts`
- `src/game/meta.ts`, `src/game/capacity.ts`
- `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`
- `src/app/GameContext.tsx`
- `src/components/TitleScreen.tsx`
- `src/components/OnboardingGuide.tsx`, `src/components/GameTools.tsx`
- `src/components/ReportPanel.tsx`, `src/styles.css`
- `tests/unit/demand.test.ts`, `tests/unit/engine.test.ts`
- `tests/unit/persistence.test.ts`, `tests/unit/campaign.test.ts`
- `tests/components/game-loop.test.tsx`, `tests/components/accessibility.test.tsx`
- `tests/e2e/difficulty-reset.spec.ts`
- `tests/e2e/persistence.spec.ts`, `tests/e2e/save-transfer.spec.ts`
- `tests/e2e/report-history.spec.ts`, `tests/e2e/staff-names.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `README.md`, `docs/agent-runbook.md`
- `docs/phase-8-component-breakdown.md`
- `docs/components/phase-8-component-8-2-overview.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

### Dependencies

Component 8.1, every supported legacy fixture, Phase 7 report-history contract,
current demand calculations, preferences, scenarios, onboarding, and meta
progression.

### Technical Validation

- Use one pure allowlist converter after existing v1/v2 normalization; do not
  maintain parallel migration paths that can disagree.
- The converter never mutates input and validates bounds before persistence.
  Backup/recovery behavior must prefer verified v4 after the boundary.
- Standard has two separate one-factor price tests: arrival response and
  segment-specific order-choice response.
- Bidirectional registry entries test neutral and both supported signs.
  Positive/negative-only entries test neutral, every supported sign, clamps,
  boundaries, and absence of an invented opposite direction.
- Demand equality remains seeded and independent of render frames/speed.
- Force unavailable browser storage in a component test and prove a legacy
  import changes no run, preferences, meta progress, marker, or success notice.
- Reconcile only the superseded schema-v3 and legacy-progress-repair expectations
  in cumulative report-history/staff-name browser specs. Preserve their report,
  naming, reload, and accessibility outcomes.

### Acceptance mapping

- v1/v2/v3 primary, backup, recovery, and import fixtures all retain exactly the
  three allowed preferences and discard every progress/meta/history field.
- Onboarding and the evolution notice replay once; verified v4 never resets or
  resurrects legacy state.
- An unavailable or failed store leaves the current in-memory/save state
  unchanged and never claims a successful import or reset.
- Standard is the accessible preselected default; difficulty/scenario are
  orthogonal and difficulty is immutable after campaign creation.
- Records are separate by difficulty; shared unlocks give no economic bonus.
- Both Standard price paths measure 1.20–1.25× baseline. Hard measures
  1.60–1.75× supported deviation for every registered factor with domain-aware
  proofs and no Standard compounding.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run focused migration,
demand-registry, accessibility, and real-browser reset/creation tests before the
profile sequence for the final scoped fingerprint.

## Component 8.3 — Fourth Venue and Three-Tier Commercial Equipment

Status: **Spec-Validated**

### Runtime outcome

A fresh v4 campaign progresses cart → kiosk → cafe → department store over 40
days, can buy a meaningful third tier in every equipment category, and can reach
a playable Day-40 victory requiring the department store.

### Deliverables

- Extend `VenueId` with `departmentStore` and make every content map, selector,
  engine switch, report, persistence validator, UI, audio, fixture, and scene
  dispatch compiler-exhaustive across four venues.
- Add a complete department venue configuration: ten scheduled-staff capacity,
  larger queue/demand/operating scale, menu capacity for the existing ten
  drinks, promotion requirements, and heritage-hall presentation data.
- Generalize equipment logic from two fixed levels to validated tier arrays.
  Add one commercial tier-three option to grinder, espresso machine, batch
  brewer, refrigeration, POS, and service counter, each with visible cost,
  requirement, maintenance/reliability, capacity/throughput/quality/waste effect.
- Change campaign duration/victory to exactly 40 days. Day-40 victory requires
  department-store ownership plus configured cash and reputation; bankruptcy
  remains a day-close boundary and victory may continue to endless.
- Keep Component 8.3 playable using the generalized single service contract.
  Add a complete department WebGL shell with truthful single-queue snapshots;
  station/express behavior arrives only in 8.5.
- Add baseline seeded campaigns proving promotion and victory are reachable
  before later workforce/service/content retuning.

### File ownership

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/inventory.ts`
- `src/game/selectors.ts`
- `src/game/demandInfluences.ts`
- `src/game/index.ts`, `src/game/capacity.ts`, `src/game/meta.ts`
- `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`
- `src/audio/AudioDirector.tsx`
- `src/components/Planner.tsx`, `src/components/ReinvestPanel.tsx`
- `src/components/EndingPanel.tsx`, `src/components/GameHeader.tsx`
- `src/components/GameTools.tsx`, `src/components/OnboardingGuide.tsx`
- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/renderSnapshot.ts`
- `src/scene/three/venues/DepartmentStoreWorld.tsx`
- `src/scene/three/venues/venueLayout.ts`
- `src/styles.css`
- `tests/unit/coffee-content.test.ts`, `tests/unit/operations.test.ts`
- `tests/unit/demand.test.ts`
- `tests/unit/inventory.test.ts`
- `tests/unit/scene.test.ts`
- `tests/unit/campaign.test.ts`, `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`, `tests/components/presentation.test.tsx`
- `tests/e2e/department-store.spec.ts`, `tests/e2e/campaign-outcomes.spec.ts`
- `tests/e2e/operations.spec.ts`, `tests/e2e/save-transfer.spec.ts`
- `tests/e2e/service-layout.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-8-component-8-3-overview.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

### Dependencies

Component 8.2 v4/difficulty/record contracts and the Phase 7 WebGL venue
dispatcher.

### Technical Validation

- Use exhaustive records/helpers rather than scattered three-venue arrays.
- Validate every equipment tier for increasing level, positive cost, valid venue,
  bounded effect, and a complete category; engine reads tier data rather than
  `level === 2` conditionals.
- Refrigeration tier three extends only surviving chilled batches through the
  shared inventory authority, never revives expiry, and has focused conservation
  and waste-boundary proof.
- Keep 40-day rules typed and difficulty-aware. Boundary fixtures cover Day 39,
  Day 40, equality, missing department venue, bankruptcy, victory, target miss,
  and endless continuation.
- Department venue and tier-three equipment values change the registered venue
  and scheduled-team/equipment demand ranges. Update their registry baselines,
  clamps, boundaries, and engine sources; keep engine/registry identities
  exhaustive and retain exact Standard/Hard deviation proofs.
- The department scene reads existing engine truth only; it does not prebuild
  station outcomes.
- Retained current-v4 operations, save-transfer, and all-venue service-layout
  journeys must follow the same 40-day/fourth-venue contract. Legacy-schema
  fixture literals remain historical evidence and are not rewritten.

### Acceptance mapping

- All four venues persist, import/export, render, report, promote, and validate
  exhaustively.
- Every existing equipment category has three meaningful tiers and exact
  operational/economic effects.
- A baseline seeded 40-day Standard and Hard fixture can reach the department
  store and configured victory; Day-40 victory cannot occur at a legacy venue.
- No food, new drink, or new ingredient is introduced.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run exhaustive content,
progression, persistence, WebGL department-shell, and campaign browser tests,
then the profile sequence for the final scoped fingerprint.

## Component 8.4 — Department Workforce and Operational Roles

Status: **Spec-Validated**

### Runtime outcome

The department store can maintain a larger roster, schedule exactly ten people,
and hire Manager and Runner roles with visible, deterministic operational value.

### Deliverables

- Replace global `MAX_HIRED_STAFF` and implicit schedule caps with typed per-
  venue roster/schedule limits. Department daily scheduling accepts ten and
  rejects eleven; its roster limit must exceed ten enough to support rotation.
- Extend `StaffRole` with `manager` and `runner` across generation, unique names,
  hiring, wages, traits, reports, persistence, accessibility, and help.
- Define bounded pure effects:
  - a scheduled Manager improves coordination/reliability through typed engine
    modifiers and never bypasses equipment/staffing requirements;
  - a scheduled Runner reduces replenishment/handoff delay through typed engine
    workload modifiers and never creates stock.
- Keep smaller-venue capacity rules unchanged and reject ineligible schedules
  before purchases/service.
- Make role value, wages, traits, and applied effects visible in the planner and
  report explanations.
- Preserve campaign-unique names and deterministic candidate generation.

### File ownership

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/selectors.ts`
- `src/game/demandInfluences.ts`
- `src/game/staffNames.ts`, `src/game/index.ts`
- `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`
- `src/components/TeamPlanner.tsx`, `src/components/Planner.tsx`
- `src/components/ReportPanel.tsx`, `src/components/OnboardingGuide.tsx`
- `src/scene/three/renderSnapshot.ts`, `src/scene/three/entities/People.tsx`
- `src/styles.css`
- `tests/unit/operations.test.ts`, `tests/unit/staff-names.test.ts`
- `tests/unit/demand.test.ts`
- `tests/unit/persistence.test.ts`, `tests/unit/campaign.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/e2e/department-workforce.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-8-component-8-4-overview.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

### Dependencies

Component 8.3 venue/equipment capacity and existing staff/name/payroll systems.

### Technical Validation

- Capacity values have one typed authority shared by engine validation and UI.
- Manager/Runner effects are bounded pure modifiers with one application point;
  animation never applies them.
- Ten-person scheduling and new operational roles expand the registered
  scheduled-team/traits/equipment demand range. Update its baseline/clamp/
  boundary metadata and prove Standard remains baseline while Hard applies one
  direct domain-aware deviation through the sole registry authority.
- Payroll/report totals reconcile for zero, one, duplicate-role, and ten-person
  schedules across reload/import.
- Candidate/name uniqueness remains deterministic through 40-day/endless runs.

### Acceptance mapping

- Department schedules 0–10 valid staff and accessibly rejects an eleventh;
  smaller venues retain their configured limits.
- Manager and Runner are hireable, persisted, named uniquely, paid exactly once,
  and visibly affect the stated operations.
- Same seed/team/plan produces equal outcomes at all speeds and after reload.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run focused staff/capacity/
payroll/persistence and department-planner browser tests, then the profile
sequence for the final scoped fingerprint.

## Component 8.5 — Three Stations, Express Lane, and Parallel Service Truth

Status: **Spec-Validated**

### Runtime outcome

A department player assigns ten scheduled staff across espresso, brew, and cold
stations, configures zero to three eligible existing drinks for express service,
and serves normal/express customers concurrently with exact-once economic truth.

### Deliverables

- Add stable `StationId = 'espressoBar' | 'brewBar' | 'coldBar'` and
  `LaneId = 'normal' | 'express'` contracts.
- Extend `DayPlan` with validated station assignments and unique
  `expressDrinkIds`. Reject unscheduled staff, duplicate/missing assignments,
  incompatible stations, ineligible drinks, and a fourth express selection.
- Define express eligibility from existing recipe/equipment/station content.
  Non-selected or ineligible demand routes to normal service; it never vanishes.
- Replace singular queue/active service with bounded `normalQueue`,
  `expressQueue`, and `serviceJobsByStation`. Generalize cart/kiosk/cafe with
  configured station/lane counts that preserve their observable outcomes.
- Use stable seeded ordering for arrivals, routing, fairness, abandonment,
  service starts/completions, shared-stock reservations, replenishment, event
  effects, and rush-end cleanup.
- Reserve/consume each ingredient unit exactly once and settle each customer,
  revenue amount, satisfaction result, activity event, and report aggregate once
  across pause, speed, reload, and simultaneous completions.
- Add station/lane/job identity to bounded canonical activity and DayReport
  aggregates before any multi-customer renderer work.
- Add accessible station assignment and express-menu planning UI plus causal
  service/report text.

### File ownership

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/inventory.ts`
- `src/game/serviceStations.ts`, `src/game/selectors.ts`, `src/game/index.ts`
- `src/game/demandInfluences.ts`
- `src/game/capacity.ts`, `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`
- `src/components/Planner.tsx`, `src/components/TeamPlanner.tsx`
- `src/components/RushPanel.tsx`, `src/components/ReportPanel.tsx`
- `src/accessibility/GameAnnouncer.tsx`, `src/styles.css`
- `tests/unit/engine.test.ts`, `tests/unit/operations.test.ts`
- `tests/unit/demand.test.ts`
- `tests/unit/inventory.test.ts`, `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`, `tests/components/accessibility.test.tsx`
- `tests/e2e/parallel-service.spec.ts`
- `tests/e2e/department-store.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-8-component-8-5-overview.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

### Dependencies

Component 8.4 workforce/roles, Component 8.3 equipment tiers, and Component 8.2
v4 persistence.

### Technical Validation

- Engine concurrency is modeled as deterministic serial transitions over stable
  station/job IDs; no Promise, wall-clock, frame, or renderer ordering enters
  game state.
- Stock reservations have explicit ownership/release rules and conservation
  invariants. Completion and reload cannot consume or settle twice.
- Queue fairness is typed/bounded and tested so express does not starve normal.
- Normal/express queues, station jobs, and shared-stock availability must still
  feed the registered queue/wait and availability influences exactly once.
  Update their engine sources/bounds as needed and keep the registry
  exhaustiveness and Standard/Hard domain proofs green.
- Legacy venues use generalized structures but retain established seeded
  outcomes unless an explicitly required contract changes.

### Acceptance mapping

- Planning accepts valid assignments and 0–3 eligible express drinks, and
  rejects every invalid boundary accessibly.
- Three stations can run simultaneous jobs against shared stock deterministically.
- Every customer/order/job/unit/revenue/report entry settles exactly once across
  speed, pause, reload, event, abandonment, and rush-end paths.
- Canonical activity/report data identifies station and lane before rendering.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run adversarial concurrency,
conservation, persistence, fairness, planner, and real-browser service tests,
then the profile sequence for the final scoped fingerprint.

## Component 8.6 — Dense Multi-Customer Heritage Hall

Status: **Spec-Validated**

### Runtime outcome

The department-store service world visibly matches authoritative parallel
service: up to ten scheduled staff, multiple customers/jobs, three stations,
normal/express lanes, commercial equipment, and a grand Melbourne heritage
interior.

### Deliverables

- Extend the immutable snapshot to bounded arrays of customer/staff render
  entities with stable entity, station, lane, job, pose, destination, and status
  identifiers sourced from Component 8.5 truth.
- Build the complete warm low-poly hall with patterned heritage tiles, timber
  counters/panelling, brass rails/details, visible escalators, and three distinct
  service bays. Display tier-three equipment and physical-upgrade anchors.
- Use instanced crowds/furnishings, orthographic framing, capped DPR, bounded
  lights/shadows, LOD/detail tiers, occlusion-safe labels, and a smaller mobile
  framing without hiding operational truth.
- Animate approach, queue, station service, handoff/payment, exit, stockout, and
  abandonment only from canonical snapshots/activity. Visual clones cannot
  represent nonexistent customers.
- Reduced motion keeps the complete hall/static poses and equivalent text.
  Context loss, reload, pause, and speed changes never alter engine outcomes.
- Keep scene + complete dashboard visible at 360×780 during the densest rush.

### File ownership

- `src/scene/sceneModel.ts`
- `src/scene/three/renderSnapshot.ts`
- `src/scene/three/ServiceWorld.tsx`
- `src/scene/three/entities/People.tsx`
- `src/scene/three/entities/ActivityEffects.tsx`
- `src/scene/three/venues/DepartmentStoreWorld.tsx`
- `src/scene/three/venues/departmentLayout.ts`
- `src/scene/three/materials.ts`, `src/scene/three/camera.ts`
- `src/components/RushPanel.tsx`, `src/accessibility/GameAnnouncer.tsx`
- `src/styles.css`
- `tests/unit/scene.test.ts`, `tests/components/presentation.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/e2e/department-store-scene.spec.ts`
- `tests/e2e/service-layout.spec.ts`, `tests/e2e/parallel-service.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-8-component-8-6-overview.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

### Dependencies

Component 8.5 station/lane/jobs/activity truth and Component 8.3 department
venue/equipment presentation.

### Technical Validation

- Snapshot creation is pure, frozen, bounded, and independent of frame count.
- Stable IDs reconcile every visible entity to queue/job/activity truth.
- Draw-call/entity/light/DPR/LOD budgets are explicit and browser-inspectable.
- Real Playwright evidence—not jsdom—proves automated WebGL, context, layout,
  and performance behavior. It is not physical-device proof; optional physical
  evidence remains owner-only, hosted, and pending/unclaimed until supplied.

### Acceptance mapping

- Hall visuals and accessible text agree on customers, staff, stations, lanes,
  jobs, equipment, sales, and departures.
- All five approved heritage motifs are visibly present and readable.
- Dense mobile play remains responsive at the target and retains scene + full
  dashboard in the initial 360×780 viewport.
- Renderer paths never route service, create demand, consume stock, or settle
  accounting.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run snapshot/entity/component,
dense WebGL, exact-layout, reduced-motion, and automated browser-performance
checks, then the profile sequence for the final scoped fingerprint. No agent
device access is permitted.

## Component 8.7 — Complete Forty-Day Content, Balance, and History

Status: **Spec-Validated**

### Runtime outcome

Standard and Hard each provide a satisfying complete 40-day campaign with
department-scale events, visible physical upgrades, shared cosmetic unlocks,
station-aware history, multiple viable strategies, fair bankruptcy pressure,
and department-required Day-40 victory.

### Deliverables

- Add a bounded typed content inventory of six department-scale event templates
  with accessible causal text and zero to two service choices on any day.
- Add four purchasable physical upgrades with visible hall changes and bounded
  deterministic operational effects; none creates food/ingredients or hidden
  economic meta bonuses.
- Add three original cosmetic unlocks and two achievement/unlock milestones
  shared across Standard/Hard. Cosmetics change presentation only.
- Extend report/history detail with difficulty, venue, station, lane, staffing,
  equipment, event, stock, wait, and financial causes captured canonically at
  settlement. Reopened reports never recompute from current service state.
- Tune typed arrival volume, prices, wages, equipment/upgrades, promotion gates,
  capacity, event weights, overdraft, cash/reputation targets, and the final
  difficulty multipliers using deterministic simulations.
- Run at least 20 representative seeds per difficulty across at least two
  materially distinct scripted viable strategies. Include near-boundary,
  bankruptcy/mismanagement, department-promotion, Day-40 target, victory, target
  miss, and endless fixtures.
- Freeze exact Standard/Hard multipliers within approved ranges only after
  one-factor and full-campaign evidence. Do not weaken Hard by adding hidden
  starting resources or permanent power unlocks.
- Keep the established ten-drink/ingredient inventory exactly unchanged.

### File ownership

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/demandInfluences.ts`
- `src/game/capacity.ts`, `src/game/meta.ts`, `src/game/selectors.ts`
- `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`
- `src/components/Planner.tsx`, `src/components/ReinvestPanel.tsx`
- `src/components/ReportPanel.tsx`, `src/components/GameTools.tsx`
- `src/components/EndingPanel.tsx`, `src/components/OnboardingGuide.tsx`
- `src/scene/three/renderSnapshot.ts`
- `src/scene/three/venues/DepartmentStoreWorld.tsx`
- `src/styles.css`
- `tests/unit/campaign.test.ts`, `tests/unit/demand.test.ts`
- `tests/unit/operations.test.ts`, `tests/unit/persistence.test.ts`
- `tests/unit/coffee-content.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/e2e/forty-day-campaign.spec.ts`
- `tests/e2e/department-store.spec.ts`, `tests/e2e/report-history.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `tests/fixtures/balanceStrategies.ts`
- `docs/components/phase-8-component-8-7-overview.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

### Dependencies

Components 8.2–8.6: difficulty/records, progression/equipment, workforce,
parallel service, and final hall snapshots.

### Technical Validation

- Content validators reject duplicate IDs, invalid choices/effects, missing
  accessible text, power-bearing cosmetics, invalid unlock references, and any
  eleventh drink/new ingredient.
- Balance scripts call public deterministic engine commands and keep tuning in
  typed production configuration—not test-only overrides.
- Strategy diversity is demonstrated by materially different pricing/menu/
  staffing/equipment/express choices, not renamed identical command sequences.
- Report extensions are bounded, schema-validated, exact-once, and survive
  reload/export/import.

### Acceptance mapping

- Six events, four physical upgrades, three cosmetics, and two shared unlock
  milestones are complete, original, visible/explained, and non-placeholder.
- At least two distinct strategies win across representative seeds on Standard
  and Hard; plausible mismanagement can bankrupt; department promotion remains
  reachable; Day-40 boundaries are correct.
- Separate difficulty records and shared non-power unlocks persist accurately.
- Station/lane-aware history reopens truthfully without recomputation.
- The menu/ingredient inventory remains exactly the established set.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run content validation, multi-seed
balance, boundary, persistence, history, and complete-campaign browser fixtures,
then the profile sequence for the final scoped fingerprint.

## Component 8.8 — Offline, Update, Performance, and Release Readiness

Status: **Spec-Validated**

### Runtime outcome

The complete expanded game installs, resumes, and finishes service offline;
updates require consent and never discard an active v4 run; dense department
service meets the release bundle/cache/responsiveness targets locally.

### Deliverables

- Audit the final lazy module/asset graph. Cache all runtime files needed after
  a successful online load, including every venue/chunk, without a file over the
  1 MB Workbox ceiling.
- Verify `/tycoon/` base paths, cold/warm offline reload, installability,
  context recovery, cache invalidation, and Pages routing locally.
- Keep update prompting consent-based. Never activate/reload over active service;
  persist v4 safely and resume after accepted activation.
- Tune bounded crowds, instancing, LOD, capped DPR, lights/shadows, and reduced-
  motion work for automated dense-mobile responsiveness evidence and the 60 FPS
  desktop target. The physical 30 FPS mobile disposition remains optional,
  owner-only, hosted, and pending/unclaimed.
- Run Lighthouse mobile against production preview and target at least 90 in
  every profile-named category it exposes.
- Re-verify dependency licenses/security, no runtime network/API/telemetry, and
  complete offline cache behavior.
- Prepare release notes and rollback/superseding-build instructions without
  publishing.

### File ownership

- `vite.config.ts`, `package.json`, `pnpm-lock.yaml`
- `src/main.tsx`, `src/App.tsx`, `src/pwa/PwaUpdatePrompt.tsx`
- `src/scene/three/**`, `src/styles.css`
- `public/**` except the unchanged title artwork content
- `tests/components/pwa-update.test.tsx`
- `tests/e2e/pwa.spec.ts`, `tests/e2e/department-store-scene.spec.ts`
- `tests/e2e/persistence.spec.ts`, `tests/e2e/service-layout.spec.ts`
- `docs/release-runbook.md`, `docs/public-release-checklist.md`
- `docs/components/phase-8-component-8-8-overview.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

### Dependencies

Components 8.2–8.7 final runtime/content graph and the Phase 7 PWA/WebGL base.

### Technical Validation

- Manifest/cache tests inspect actual production outputs and offline requests.
- Automated FPS evidence records browser, viewport, emulated DPR, scene state,
  sampling method, and observed range; it is never called a physical-device
  result. Any physical model/OS/Safari/GPU/DPR/orientation/FPS evidence may be
  supplied only by the repository owner against the exact final hosted build.
- Service-worker tests prove update deferral during active service and valid v4
  continuation after acceptance.
- Dependency/network audit confirms no remote runtime asset or hidden service.

### Acceptance mapping

- The complete app installs and reloads offline at `/tycoon/` after first load.
- Active v4 service survives deferred and accepted updates without reset or
  duplicate settlement.
- Every precached file is under 1 MB; dense scene meets the automated
  mobile/desktop responsiveness targets; Lighthouse meets exposed profile
  targets. The optional physical-mobile result stays pending/unclaimed unless
  the owner supplies it.
- No publication occurs before the human gate.

### Validation gate

Assurance lane `fast (lean override)`, Tier 2. Run focused PWA, persistence,
bundle, offline/update, Lighthouse, and automated browser-performance checks,
then the profile sequence for the final scoped fingerprint. No agent device
access is permitted.

## Component 8.9 — Cumulative Phase Gate, Publication, and Release Evidence

Status: **Spec-Validated**

### Runtime outcome

The final Phase 8 head passes every cumulative local requirement. After separate
explicit human merge and publication approvals, the exact build is deployed.
GitHub workflow/API evidence identifies that deployment; the repository owner
performs and supplies any public-game browser validation. Optional physical
validation remains a separate pending/unclaimed owner-only path.

### Deliverables

- Complete all Phase 8 unit, component, deterministic simulation, Playwright,
  PWA, bundle, automated performance, accessibility, and migration checks while
  retaining all Phase 1–7 journeys. Owner-supplied hosted checks occur only
  after the separate approvals.
- Run Tier 3 once against the final global fingerprint after all focused
  failures are resolved. Record `docs/phase-8-test-report.md` local PASS only
  when every named Phase 8 Validation Target passes.
- Verify the complete legacy reset matrix, both difficulty price paths and
  registry domains, four venues, three equipment tiers, ten-person planning,
  Manager/Runner, three stations, express bounds, exact-once parallel service,
  dense hall, 40-day balance/content/history, and PWA release behavior.
- Reconcile stale 30-day, Canvas, single-difficulty, three-venue, two-tier,
  two-role, and single-service statements in requirements, brief, solution
  design, README, and runbooks.
- Complete phase context, release notes, component overview, team state, and
  exact local evidence. Push the validated branch, then stop for explicit human
  merge/publication approval.
- After both approvals, merge/publish through the profiled workflow and capture
  the public URL, commit/build identity, and Actions/Pages result. The
  repository owner supplies desktop/touch WebGL2, save/reload, offline, update,
  complete-day, and optional physical findings. Report local automated,
  deployment-identity, owner-hosted, and optional physical results separately.

### File ownership

- All Phase 8 source/test/configuration files required to correct gate failures
- `docs/phase-8-test-report.md`
- `docs/phase-8-release-evidence.md`
- `docs/implementation-context-phase-8.md`
- `docs/components/phase-8-component-8-9-overview.md`
- `docs/brief.md`, `docs/requirements.md`, `docs/solution-design.md`
- `README.md`, `docs/agent-runbook.md`, `docs/release-runbook.md`
- `docs/public-release-checklist.md`
- `docs/phase-progress.json`, `docs/agent-team-state.md`
- `.github/workflows/**` only when required for the exact approved release

### Dependencies

Components 8.1–8.8 complete and committed with reusable unchanged evidence.

### Technical Validation

- Tier 3 is exactly the profile's frozen install, production build, lint, full
  unit/component suite, and full Playwright suite plus every named Phase 8
  Validation Target.
- Local PASS and hosted PASS use exact fingerprints/build identities and cannot
  be inferred from one another.
- Automated browser/deployment evidence is never physical-device evidence. No
  agent may access a device; an optional physical result remains pending and
  unclaimed unless the owner supplies it against the exact final hosted build.
- No final PASS if a legacy path resurrects progress, a demand factor is
  unregistered, concurrent service can double-settle, WebGL/mobile/PWA budgets
  fail, or documentation contradicts delivered behavior.
- Publication/visibility/merge actions occur only after explicit human approval.

### Acceptance mapping

- Every Phase 8 and cumulative Phase 1–7 criterion has named passing evidence.
- `docs/phase-8-test-report.md` records local Tier 3 PASS for the final head.
- After approval, GitHub evidence identifies the exact deployed commit/build;
  owner-supplied hosted evidence covers the public
  desktop/touch/WebGL2/offline/update/service flows.
- Final release is declared complete only after local automated PASS, successful
  exact deployment, and the owner-hosted verdict. Optional physical evidence is
  reported separately and never inferred.

### Validation gate

Assurance lane `phase-gate (lean override)`, Tier 3 cumulative phase gate plus
separately approved publication and owner-hosted verification. The same
Implement engagement owns local fixes, reruns, self-review, reports, and the
commit candidate. Merge/publication requires the reserved human decisions;
public-game and optional physical findings come only from the repository owner.
