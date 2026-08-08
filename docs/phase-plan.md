# Phase Plan: Laneway Tycoon

## Overview

Delivery now comprises eight cumulative, demonstrable phases. Completed Phases
1-6 remain intact: the original playable release followed by exact planning,
perishable stock intelligence, and the living rush. The Next-Level Evolution is
an additive two-phase programme. Phase 7 replaces service presentation with a
fixed-isometric WebGL world and streamlines the daily flow without changing the
established cart, kiosk, cafe, campaign, progression, or save semantics. Phase 8
then introduces one deliberate breaking campaign boundary and delivers the
complete 40-day department-store expansion, difficulty contract, parallel
service operation, final balance, and hosted release.

Every implementation component is a vertical slice with a user-visible runtime
outcome, production wiring, persistence where its outcome changes durable state,
and essential tests. Infrastructure is introduced only by the first slice that
uses it. Phase validation is cumulative: a later phase must retain all earlier
behavior and pass the complete validation sequence.

### Lean execution contract

- One `implement` agent delivers every component in sequence. That same agent
  owns source, tests, fixes, self-review, the exact validation sequence, phase
  test reports, implementation context, and runbook updates. No other
  task-agent role participates.
- The Implement agent must not silently reduce observable scope to fit an
  engagement. If a component proves too large, it remains the same component
  and is completed in sequential internal passes; required behavior is not
  moved to an unnamed future task.
- Next-Level components are authored strictly in dependency order by that one
  Implement engagement. Every runtime component uses `fast (lean override)` and
  Tier 2 even where the recorded standard trigger set would ordinarily require
  independent gates; each phase-final component uses
  `phase-gate (lean override)` and Tier 3. The Technical Business Analyst owns
  only this plan.
- Human approval of this plan opens one administrative entry gate. Before
  Component 7.1, the coordinator materializes
  `docs/phase-7-component-breakdown.md` and
  `docs/phase-8-component-breakdown.md` directly from the approved plan. Each
  breakdown must assign file ownership, map acceptance criteria, declare exact
  dependencies, record Technical Validation, preserve the approved lane/tier,
  and mark every component `Spec-Validated`. This is no-further-approval
  planning materialization, is not delegated to another task-agent role, and
  authorizes no gameplay or source change. The Implement engagement cannot
  begin Component 7.1 until both files satisfy that contract.
- Each component is committed to its phase branch only after its primary paths
  pass. A phase ends only when its final validation component records PASS and
  the human approves the merge under the repository workflow contract.

## Summary

- **Number of phases:** 8
- **Number of components:** 43
- **Delivery sequence:** Playable Cart -> Complete Campaign -> Production Finish
  -> Exact Planning Controls -> Perishable Batch Inventory -> Living Rush Scene
  -> Isometric Service World -> Department-Store Campaign
- **Serialized delivery and critical path:** 1.1 -> 1.2 -> 1.3 -> 1.4 ->
  2.1 -> 2.2 -> 2.3 -> 2.4 -> 2.5 -> 3.1 -> 3.2 -> 3.3 -> 3.4 ->
  3.5 -> 4.1 -> 4.2 -> 4.3 -> 4.4 -> 5.1 -> 5.2 -> 5.3 -> 5.4 ->
  5.5 -> 6.1 -> 6.2 -> 6.3 -> 6.4 -> 6.5 -> 7.1 -> 7.2 -> 7.3 ->
  7.4 -> 7.5 -> 7.6 -> 8.1 -> 8.2 -> 8.3 -> 8.4 -> 8.5 -> 8.6 ->
  8.7 -> 8.8 -> 8.9
- **Next-Level entry gate:** Plan approval -> coordinator materializes both
  `Spec-Validated` component breakdowns -> Component 7.1.

---

## Phase 1: Playable Cart (Walking Skeleton)

### Phase Overview

**Feature statement:** A user can now start or continue a seeded coffee-cart
campaign, plan a day, watch and control a service rush, read the day report,
reinvest, and begin the next day on desktop or mobile without losing progress.

**Overview:** This phase establishes the thinnest complete path through the real
architecture. It deliberately uses a small representative cart content set,
but all delivered actions are real: decisions affect a deterministic rush,
settlement changes cash/inventory/reputation, and versioned autosaves restore
the active run. Functional visuals and responsive controls are sufficient for
play; the complete content model and release polish belong to later phases.

**Objective:** Prove the plan -> rush -> report -> reinvest loop, pure-engine
boundary, Canvas/React composition, responsive interaction, and safe local
continuation before expanding simulation breadth.

**Dependencies:** Approved requirements, brief, solution design, project
profile, Node 22.12+, and pnpm 10. There are no accounts, secrets, or external
services.

### Phase Key Deliverables

- A runnable React 19.2/Vite 8.1 application on the real production stack.
- A pure seeded TypeScript cart simulation with a functional Canvas scene and
  accessible React management panels.
- A complete representative cart day, including planning, 60-90 simulated
  seconds of service, zero or one representative event choice, settlement,
  reinvestment, and next-day continuation.
- Versioned local autosave at phase transitions and safe service checkpoints,
  plus desktop and 360px-wide touch-mobile layouts.

### Phase Components

#### Component 1.1 — Human Setup

- **Human setup:** None. This phase needs no account, credential, environment
  variable, or external-service configuration.
- **Post-validation action:** After Component 1.4 records PASS, the human
  approves or rejects the `phase-1` merge; no implementation work waits on an
  earlier human action.
- **Dependencies:** None.

#### Component 1.2 — Complete Seeded Cart Day

- **Runtime outcome:** A user can start a seeded campaign, make a meaningful
  cart plan, run service to completion, inspect a calculated report, spend
  available cash on the next plan or a representative cart improvement, and
  enter the following day.
- **Inclusions:** Create the TypeScript/Vite/React scaffold and remove the
  obsolete bootstrap-only Python file; introduce typed content for a small
  representative menu, ingredients, one venue, and tuning; implement the pure
  seeded engine and immutable command path for campaign creation, planning,
  rush start/ticks, one choice-bearing event, day close, and next-day setup;
  model arrivals, queues, fulfillment, sales, inventory/waste, satisfaction,
  cash, reputation, and a readable bottleneck; connect React planner/report
  panels and a basic Canvas 2D side view; provide price, purchase, menu, and
  speed/balanced/quality dial-in decisions; run a 60-90 second simulated rush
  with pause and 1x/2x/4x controls; and persist day-boundary checkpoints in the
  first versioned `SaveEnvelope`.
- **Essential proof:** Vitest demonstrates seed reproducibility, command/phase
  validity, inventory and cash conservation, speed-independent results, and
  report calculations. React Testing Library covers planning constraints,
  rush controls/event choice, report semantics, and reinvestment controls.
- **Exclusions:** The other drinks and modifiers, hireable staff, full
  equipment/venue progression, the 30-day ending, meta unlocks, import/export,
  polished pixel assets/audio, and offline installation are explicitly assigned
  to Phases 2-3.
- **Dependencies:** Component 1.1; this component owns all stack and runtime
  infrastructure first needed by the playable loop.

#### Component 1.3 — Responsive Autosaved Continuation

- **Runtime outcome:** A desktop or touch-mobile user can leave or reload during
  planning, service, reporting, or reinvestment and safely continue the same
  cart day without duplicated settlement, lost decisions, or an unusable
  layout.
- **Inclusions:** Make the scene-and-panels desktop layout and scene-above-
  tabbed-controls mobile layout functional from 360 CSS pixels upward; avoid
  hover-only actions; add touch-sized primary controls and keyboard-operable
  phase navigation; persist active run and preferences at every phase
  transition and recoverable checkpoints during service; use last-known-good
  writes and idempotent close-day behavior; restore the deterministic PRNG,
  elapsed simulated time, queue, pending event, and speed/pause state; and offer
  clear new/continue behavior. Autosave remains small, JSON-compatible, and
  isolated behind a browser adapter that the engine never reads directly.
- **Essential proof:** Unit tests cover serialization round trips, interrupted
  writes, reload at every game phase, and close-day idempotency. Component tests
  cover new/continue choices and responsive control access.
- **Exclusions:** General old-schema migration, JSON file transfer, corrupt or
  incompatible-save recovery UI, final accessibility polish, and service-worker
  offline behavior remain assigned to Phases 2-3.
- **Dependencies:** Component 1.2.

#### Component 1.4 — Phase Validation & Documentation

- **Runtime outcome:** The walking skeleton has reproducible evidence that its
  complete cart loop works on desktop and touch-mobile and survives reload.
- **Inclusions:** Build/extend Playwright desktop Chromium and representative
  touch-mobile projects for every named target below; run the critical engine
  and persistence tests; run the exact project-profile validation sequence;
  fix all failures; self-review the phase against this plan; write
  `docs/phase-1-test-report.md` with PASS evidence and known non-required Phase
  1 exclusions; write/update `docs/implementation-context-phase-1.md` and the
  agent runbook with start, build, and E2E instructions.
- **Exclusions:** No Phase 2 or 3 feature is required to claim Phase 1 PASS.
- **Dependencies:** Components 1.2 and 1.3.

### Phase Validation Targets

- **Desktop Playwright flow:** New seeded campaign -> choose the representative
  menu/prices/purchases/dial-in -> start rush -> pause/resume -> change among
  1x/2x/4x -> answer the seeded event -> finish service -> verify P&L,
  satisfaction, inventory/waste, bottleneck, and reputation -> reinvest ->
  enter the next day.
- **Touch-mobile Playwright flow:** Repeat the complete day at 360px width using
  touch controls and the stacked/tabbed layout, with no horizontal clipping or
  hover-only blocker.
- **Persistence Playwright flow:** Reload once during planning and once during
  service, continue from the restored state, reload after settlement, and prove
  that the report and balance were applied exactly once.
- **Critical engine behavior:** Equal seed + initial state + commands produce
  equal arrivals, event, orders, and report regardless of animation frame rate
  or selected display speed; invalid phase commands are rejected; inventory,
  waste, revenue, cost, and closing cash reconcile.
- **Critical persistence behavior:** Every phase transition and service
  checkpoint round-trips through `SaveEnvelope`; last-known-good recovery and
  idempotent day close prevent progress loss or duplicate settlement.

### Phase Acceptance Criteria

- [ ] The real app loads through Vite and completes the full Phase 1 feature
      statement without mocks or a backend.
- [ ] The rush lasts 60-90 simulated seconds and supports pause and 1x/2x/4x
      while producing speed-independent results.
- [ ] The report visibly reconciles the day's business outcome and supports a
      valid reinvestment/next-day decision.
- [ ] The desktop, 360px touch-mobile, and reload Playwright flows pass.
- [ ] Seeded engine and persistence tests pass for every critical behavior named
      above.
- [ ] `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm test`,
      and `pnpm test:e2e` pass in that order.
- [ ] `docs/phase-1-test-report.md` records PASS and phase context/runbook
      documentation matches the commands actually used.

---

## Phase 2: Complete Campaign

### Phase Overview

**Feature statements:** A user can now operate the full ten-drink coffee
business with staff, equipment, weather, events, and venue growth; finish or
lose a seeded 30-day campaign; continue after victory in endless mode; retain
non-economic unlocks and records; and transfer or recover a local save.

**Overview:** This phase expands the proven day loop into the complete strategy
game. Coffee operations land first, people/assets/venues build on those
economics, and campaign/meta/persistence completion closes the lifecycle. All
numbers remain typed content configuration and are exercised by deterministic
campaign simulations so balance can change without coupling policy to engine
code.

**Objective:** Deliver every required gameplay, progression, and portable-save
behavior at production depth before presentation and distribution hardening.

**Dependencies:** Phase 1 Component 1.4 PASS; Phase 2 branches from the validated
Phase 1 head. No external services or human setup are required.

### Phase Key Deliverables

- All ten drinks, authentic recipes/modifiers, ingredients, bean and dial-in
  strategy, four customer segments, weather, local events, and explainable
  demand/satisfaction effects.
- Hireable/schedulable staff, equipment, and cart -> kiosk -> cafe progression.
- Configured Day 30 victory and day-close bankruptcy, endless mode, records,
  achievements/cosmetics/alternate-scenario unlocks, and no meta power bonuses.
- Validated export/import, schema migration, and corrupt/incompatible-save
  recovery.

### Phase Components

#### Component 2.1 — Human Setup

- **Human setup:** None. Phase 2 introduces no accounts, credentials, secrets,
  or external services.
- **Post-validation action:** After Component 2.5 records PASS, the human
  approves or rejects the `phase-2` merge.
- **Dependencies:** Phase 1 PASS.

#### Component 2.2 — Full Coffee Trading Day

- **Runtime outcome:** A user can configure and run a strategically complete
  day in which drink range, variants, ingredients, beans, prices, dial-in,
  customer mix, weather, and event choices visibly change demand, throughput,
  quality, waste, satisfaction, and profit.
- **Inclusions:** Add espresso, long black, flat white, latte, cappuccino,
  piccolo, mocha, batch brew, iced latte, and cold brew; fixed authentic base
  recipes; regular/large where appropriate; dairy/oat/soy modifiers; typed bean,
  milk, chocolate, ice/cold-brew, and other recipe inventory; menu capacity and
  availability handling; at least commuters, students, coffee enthusiasts, and
  local regulars with readable preferences; price, quality, wait, reputation,
  venue, weather, local-event, and availability demand effects; zero to two
  seeded meaningful rush choices; textual causal explanations in the planner
  and report; and complete `GameState`, `DayPlan`, `Customer`,
  `SimulationEvent`, and `DayReport` contracts at the public engine boundary.
- **Essential proof:** Recipe/material tables validate exhaustively; seeded
  tests vary one factor at a time and assert the intended demand/economy
  direction; all segment/weather/event branches are reproducible; component
  tests cover menu constraints, modifier availability, explanations, and event
  choices.
- **Exclusions:** Hireable staff, the equipment catalogue, venue promotion, and
  campaign endings are not part of this slice and retain the Phase 1 baseline
  until Components 2.3-2.4.
- **Dependencies:** Components 1.2-1.4 and 2.1.

#### Component 2.3 — Staff, Equipment, and Venue Growth

- **Runtime outcome:** A user can hire from a rotating pool, schedule a daily
  front-of-house/barista team, invest in equipment, and promote the same
  business from cart to kiosk to cafe, with every choice changing the next
  playable day and its visible scene/report.
- **Inclusions:** Staff roles, speed, skill, wages, and one readable trait;
  deterministic rotating candidates and daily scheduling without weekly
  rostering; grinders, espresso machines, batch brewers, refrigeration, POS,
  and service-counter upgrades affecting quality, throughput, reliability, or
  waste; affordability and mutually valid upgrade rules; cart/kiosk/cafe menu
  capacity, staff capacity, equipment access, demand, and distinct functional
  scene states; wage/depreciation or configured operating costs in settlement;
  and the public `StaffMember` contract. Staff continue to serve automatically
  while the player observes queues and handles events.
- **Essential proof:** Tests demonstrate each role/trait/equipment effect in a
  real day, capacity enforcement, deterministic candidate rotation, payroll
  settlement, promotion prerequisites/costs, and persisted staff/equipment/
  venue state. Component tests cover hiring, scheduling, upgrades, and promotion
  feedback at desktop and mobile breakpoints.
- **Exclusions:** Detailed weekly rosters, manual drink making, multiple
  locations, and permanent meta-progression bonuses remain non-goals.
- **Dependencies:** Component 2.2; it extends the same demand, queue, report,
  and save paths rather than creating parallel systems.

#### Component 2.4 — Campaign Outcomes, Meta Progress, and Save Transfer

- **Runtime outcome:** A user can play through Day 30 to a configured victory or
  cross the overdraft floor at day close to bankruptcy, continue a victory in
  endless mode, retain cosmetic/record/scenario unlocks, and safely export,
  import, migrate, or recover a save.
- **Inclusions:** Typed configurable cash, reputation, overdraft, promotion, and
  balance values; Day 30 victory requiring cafe plus cash/reputation targets;
  bankruptcy only at close-day settlement; ending screens with restart and
  valid continuation actions; `continueEndless`; first-victory endless unlock;
  achievements that unlock only cosmetics, records, and alternate scenarios;
  settings/history/meta persistence through `MetaProgress`; validated JSON
  download/upload using `SaveEnvelope`; bounded schema validation; supported
  old-version migrations; last-known-good/restart/export recovery choices for
  corrupt saves and safe rejection for unknown versions; filename/content
  safety; and reachable settings, records, help, and transfer controls that do
  not disrupt an active run.
- **Essential proof:** Multiple deterministic full-campaign simulations include
  viable victory, alternative viable strategies, and bankruptcy; boundary tests
  cover Day 30 and overdraft equality/ordering; unlock tests prove no economic
  bonus crosses runs; migration fixtures cover every supported version; import
  tests reject malformed, unbounded, and incompatible input without executing
  or crashing.
- **Exclusions:** Cloud accounts/sync, multiplayer, analytics, external content,
  and live services remain non-goals. Offline runtime caching and safe app-code
  updates belong to Phase 3.
- **Dependencies:** Components 2.2 and 2.3.

#### Component 2.5 — Phase Validation & Documentation

- **Runtime outcome:** The complete campaign has cumulative evidence for its
  gameplay breadth, endings, portability, desktop/mobile usability, and balance.
- **Inclusions:** Extend Playwright for every named target below; use production
  import UI with validated deterministic fixtures for practical near-ending
  win/loss journeys while Vitest executes complete Day 1-30 simulations; run
  all Phase 1 and 2 engine/component/E2E tests and the exact validation
  sequence; fix failures and self-review; write `docs/phase-2-test-report.md`,
  `docs/implementation-context-phase-2.md`, and updated runbook instructions,
  including seeded balance-fixture maintenance and save recovery.
- **Exclusions:** Visual/audio release polish, offline installation/update
  safety, Lighthouse release budgets, and hosted Pages checks remain Phase 3.
- **Dependencies:** Components 2.2-2.4.

### Phase Validation Targets

- **Desktop Playwright operations flow:** Plan with all drink families and
  representative size/milk modifiers -> buy ingredients -> select beans and
  dial-in -> hire/schedule both staff roles -> buy representative equipment ->
  run weather/event-driven service -> inspect causal report -> promote cart to
  kiosk and kiosk to cafe through deterministic validated states.
- **Touch-mobile Playwright operations flow:** Complete planning, hiring,
  equipment, one choice-bearing rush, report, and promotion actions at 360px
  using touch only, with every required panel and explanation reachable.
- **Playwright outcome flows:** Import a validated near-victory state through
  the production UI -> finish Day 30 -> verify cafe/cash/reputation victory ->
  unlock and enter endless mode; separately import a near-floor state -> close
  the day below the configured overdraft -> verify bankruptcy/restart.
- **Playwright transfer/recovery flows:** Export an active campaign, start a
  different state, import the exported JSON, and resume the identical snapshot;
  then exercise supported-old, malformed, corrupt, and unknown-version files
  and select each offered recovery action.
- **Critical engine behavior:** Every recipe consumes exact ingredients; demand
  responds in the configured direction to every named factor; four segments,
  staff, equipment, venues, weather, and events are deterministic; full 30-day
  scripted campaigns can win and lose; victory/bankruptcy boundaries and
  endless continuation are exact.
- **Critical persistence behavior:** All expanded state round-trips; every
  supported migration preserves meaning; invalid imports are bounded and
  non-executable; meta unlocks persist but never alter starting economics.

### Phase Acceptance Criteria

- [ ] All ten drinks, valid sizes/milks, fixed recipes, required ingredients,
      four customer segments, weather, local events, and zero-to-two event
      choices work in the production day loop.
- [ ] Staff, equipment, and cart -> kiosk -> cafe progression create the stated
      engine, economy, capacity, report, persistence, and visible-scene effects.
- [ ] Seeded full-campaign tests demonstrate at least one victory path, one
      bankruptcy path, and more than one viable strategy without special-case
      test logic in the production engine.
- [ ] Day 30 victory, day-close bankruptcy, endless unlock/continuation,
      achievements/cosmetics/records/scenarios, and no-power-bonus behavior pass.
- [ ] Export/import, all supported migrations, corrupt recovery, and unknown-
      version rejection pass without damaging the last-known-good save.
- [ ] All named desktop/touch-mobile Phase 2 Playwright flows and every retained
      Phase 1 flow pass.
- [ ] The exact validation sequence passes and `docs/phase-2-test-report.md`
      records cumulative PASS with current context/runbook documentation.

---

## Phase 3: Production Finish

### Phase Overview

**Feature statements:** A user can now enjoy the complete game with cohesive
pixel visuals and optional local audio; learn and operate it accessibly on
desktop or mobile; install it and keep playing offline after first load without
unsafe updates; and access the release-ready MIT-licensed project at its public
GitHub Pages `/tycoon/` URL once the human release gate is approved.

**Overview:** This phase preserves Phase 2 rules while finishing presentation,
accessibility, mobile interaction, offline/update resilience, and distribution.
Release files and workflow are prepared without changing repository visibility.
The final validation component runs locally first, pauses for the sole public
release gate recorded in Component 3.1, and then completes hosted/subpath checks.

**Objective:** Turn the feature-complete campaign into a cohesive, accessible,
performant, offline-capable public release with cumulative evidence.

**Dependencies:** Phase 2 Component 2.5 PASS; Phase 3 branches from the validated
Phase 2 head. Public publication additionally depends on Component 3.1's gated
human actions.

### Phase Key Deliverables

- Original cohesive 16-bit-style pixel scenes, characters, weather, and UI
  accents, plus optional locally bundled ambience/interface cues.
- Onboarding, help, keyboard/touch accessibility, reduced motion, non-colour
  communication, textual outcome summaries, and production mobile layout.
- Installable offline PWA, explicit safe-update consent, save compatibility,
  optimized assets, Pages `/tycoon/` base support, CI deployment artifacts,
  README, contribution steps, and MIT license.
- Complete cumulative functional, accessibility, persistence, performance,
  offline, subpath, and hosted-release validation.

### Phase Components

#### Component 3.1 — Human Setup & Public Release Gate

- **Human setup:** No credentials or local environment variables are required.
  At the release checkpoint inside Component 3.5, the human must approve the
  `phase-3` merge/release, make `sjmeehan9/tycoon` public, enable GitHub Pages
  with GitHub Actions as its source, and confirm the published game URL. All
  public-visibility and Pages console actions are confined to this component.
- **Gate timing:** Components 3.2-3.4 and the local portion of 3.5 may prepare
  and validate every release artifact while the repository remains private.
  Component 3.5 pauses after local PASS, the human executes this gate, and the
  same Implement agent resumes deployment/hosted checks. Withheld approval
  blocks publication but does not invalidate recorded local evidence.
- **Dependencies:** Phase 2 PASS for authorization; Components 3.2-3.4 and local
  release-candidate validation must pass before the visibility/Pages actions.

#### Component 3.2 — Cohesive Pixel Scene and Local Audio

- **Runtime outcome:** A user sees a warm, readable, lightly humorous Melbourne
  coffee business evolve visibly from cart to kiosk to cafe and can opt into
  locally bundled ambience and interface cues without gameplay changing.
- **Inclusions:** Original constrained-palette 16-bit-style art for all three
  venues, representative staff/customer variations, equipment, weather, and UI
  accents; a fixed logical Canvas resolution, nearest-neighbour scaling, sprite
  animation driven from immutable snapshots rather than engine time, readable
  queue/service feedback, and distinct venue scenes; optimized raster/sprite
  assets with source/provenance notes; bundled ambience and essential interface
  cues; audio disabled initially and enabled only after user interaction;
  independent ambience/cue controls persisted in preferences; graceful muted
  and unavailable-audio behavior.
- **Essential proof:** Snapshot/state-driven scene tests cover venues, weather,
  rush states, and resize behavior; component tests cover consent, persisted
  audio preferences, and muted operation; Playwright observes representative
  visual states without relying on animation timing for game correctness.
- **Exclusions:** Food, manual drink-making, licensed third-party media, streamed
  audio, or runtime asset APIs remain non-goals.
- **Dependencies:** Phase 2 PASS. It may be developed independently of Component
  3.4, but must integrate before Component 3.3's final responsive pass.

#### Component 3.3 — Onboarding, Accessibility, and Mobile Polish

- **Runtime outcome:** A first-time or returning user can understand the game,
  reach every action, interpret every status and animated outcome, and complete
  the campaign flow with keyboard or touch at desktop and 360px mobile sizes.
- **Inclusions:** Skippable/replayable onboarding tied to the real first-day
  actions; contextual help for pricing, dial-in, recipes, queues, reports,
  progression, endings, saves, audio, and offline behavior; semantic DOM and
  logical headings/dialog focus; full keyboard navigation and visible focus;
  44px minimum touch targets; no hover-only functionality; scene-above-large-
  tabbed-controls mobile layout with progressive disclosure; colour-safe status
  icons/text; reduced-motion behavior that preserves state/readability;
  textual service and event/report summaries; sensible screen-reader names and
  live announcements without tick spam; and durable accessibility/preferences
  settings.
- **Essential proof:** React Testing Library covers focus, dialog, labels,
  summaries, onboarding state, reduced motion, and non-colour cues. Playwright
  covers keyboard-only desktop and touch-only mobile completion with automated
  accessibility checks supplemented by explicit semantic assertions.
- **Exclusions:** Localization is not required; all launch content is English.
- **Dependencies:** Phase 2 PASS and Component 3.2 for final visual/layout
  integration. It can begin against Phase 2 functional UI while art is prepared.

#### Component 3.4 — Offline-Safe PWA and Release Artifacts

- **Runtime outcome:** After one successful online load, a user can install and
  launch the complete game offline; a new app version prompts without reloading
  an active run; and the built app, documentation, and workflow are ready for
  GitHub Pages under `/tycoon/` without yet changing public repository settings.
- **Inclusions:** `vite-plugin-pwa` manifest, icons, display/theme metadata, and
  complete same-origin runtime asset caching; offline navigation/startup and
  locally persisted saves; update-available UI with defer/accept choices;
  protection against automatic refresh during active play; save-before-update,
  schema compatibility, and recovery on accepted update; Vite base and asset
  paths for `/tycoon/`; GitHub Actions build/validate/deploy workflow with no
  secrets beyond standard Pages permissions; optimized initial assets; README
  with gameplay, local pnpm commands, architecture, validation, contribution,
  privacy/offline/save-transfer, and Pages instructions; MIT license; and public
  release checklist. This component prepares but does not publish or change
  repository visibility.
- **Essential proof:** Service-worker tests and Playwright cover first-load cache,
  offline relaunch, active-save continuation, deferred update, accepted update,
  and subpath assets/routes. A local production preview exercises the same
  built artifacts. Dependency and workflow review confirms no runtime network,
  secret, telemetry, ad, or personal-data path.
- **Exclusions:** Cloud sync, push notifications, analytics, advertisements, and
  runtime external services remain non-goals.
- **Dependencies:** Phase 2 PASS; integrates the finalized Component 3.2 asset
  inventory before final cache/performance assertions and Component 3.3 update
  messaging before validation.

#### Component 3.5 — Cumulative QA, Phase Documentation, and Public Verification

- **Runtime outcome:** The local release candidate and, after Component 3.1
  approval, the public Pages build have reproducible PASS evidence across the
  complete game, desktop/mobile UX, offline/update paths, and release budgets.
- **Inclusions:** Execute every named Phase 1-3 Playwright flow in desktop
  Chromium and representative touch-mobile projects; run all engine,
  component, balance, save, accessibility, service-worker, and subpath tests;
  run the exact validation sequence; exercise human-readable desktop/mobile
  play flows via dev/preview; run Lighthouse mobile against the production
  build and meet the project-profile thresholds where exposed; inspect the
  complete asset bundle and update behavior; fix every failure and self-review
  against requirements traceability. Write `docs/phase-3-test-report.md`,
  `docs/implementation-context-phase-3.md`, final agent runbook/release
  instructions, and release checklist evidence. After local PASS, pause for
  Component 3.1; then deploy through the prepared workflow and repeat the hosted
  load, subpath, save/reload, responsive, and offline checks at the confirmed
  public URL.
- **Exclusions:** No required behavior may be deferred from this component; an
  unapproved public gate must be reported as blocked rather than represented as
  a hosted PASS.
- **Dependencies:** Components 3.2-3.4, all earlier phase validation PASS, and
  Component 3.1 for the deployment/hosted portion.

### Phase Validation Targets

- **Desktop Playwright cumulative flow:** First launch/onboarding -> create
  campaign -> complete a strategic cart day with keyboard controls/audio opt-in
  -> inspect accessible report -> exercise kiosk/cafe, victory, endless,
  bankruptcy, records/help/settings, and import/export through deterministic
  production UI fixtures -> reload and retain progress/preferences.
- **Touch-mobile Playwright cumulative flow:** At 360px, use touch only to
  complete onboarding, planning, staff/equipment changes, a rush/event/report,
  venue progression, recovery/import, and settings; assert 44px targets, no
  hover dependency, no clipped required content, and textual outcome access.
- **Accessibility/reduced-motion flow:** Complete the primary day with keyboard
  only, verify focus restoration for dialogs/tabs, non-colour status text and
  announcements, then repeat the rush with reduced motion and muted audio.
- **PWA/update Playwright flow:** Load once online -> create and autosave a run ->
  relaunch offline -> finish the current phase -> simulate an available update
  -> defer it without refresh -> accept it at a safe point -> resume the same
  migrated state.
- **Pages/subpath flow:** Build and preview at `/tycoon/` before release; after
  the human gate, load the confirmed public URL directly and by refresh, verify
  all assets, play/save/reload a day on desktop and mobile, and relaunch cached
  runtime offline.
- **Critical engine/persistence behavior:** Every Phase 1-2 deterministic,
  economy, progression, ending, meta, migration, recovery, and idempotency suite
  remains green; PWA updates never bypass save validation or mutate engine
  outcomes.
- **Performance/release behavior:** The rush stays responsive on representative
  mid-tier mobile emulation and under reduced motion; 360px through large
  desktop layouts remain usable; optimized compressed assets are practical for
  mobile broadband; Lighthouse mobile scores are at least 90 for performance,
  accessibility, best practices, and PWA/installability wherever reported.

### Phase Acceptance Criteria

- [ ] Original pixel visuals cover cart, kiosk, cafe, staff, customers, weather,
      equipment, and UI accents with crisp nearest-neighbour rendering.
- [ ] Optional bundled audio starts disabled, requires user interaction, and
      behaves safely when muted or unavailable.
- [ ] Onboarding/help, keyboard, touch, 44px targets, reduced motion, colour-safe
      communication, focus behavior, and textual animated-outcome summaries pass.
- [ ] A first online load enables install/offline relaunch of the complete game,
      and update defer/accept paths preserve an active saved run.
- [ ] README, contribution/local-run guidance, MIT license, workflow, `/tycoon/`
      base configuration, and public release checklist are complete and accurate.
- [ ] All named Phase 3 and retained Phase 1-2 Playwright/engine/persistence
      targets pass on the local production build.
- [ ] Mobile Lighthouse scores meet every project-profile threshold where the
      category is exposed, and the performance/asset budgets have evidence.
- [ ] After human approval, the public Pages URL passes hosted load, refresh,
      responsive play, save/reload, asset, subpath, and offline checks.
- [ ] The exact validation sequence passes and `docs/phase-3-test-report.md`
      records cumulative local and hosted PASS with final context/runbook docs.

---

## Phase 4: Trustworthy Planning and Sales

### Phase Overview

**Feature statement:** A user can now set every menu price and supply quantity
through accessible, exact steppers and trust that an amended base price is the
price used by real orders, rush sales, the day report, and closing cash.

**Overview:** This phase removes free-text numeric planning. Every activation is
an atomic integer adjustment, the selected value autosaves immediately, and the
service/report path exposes enough actual-charge detail to prove base price,
size surcharge, and milk surcharge without changing established economics.

**Dependencies:** Phase 3 hosted PASS. No account, credential, secret, runtime
service, dependency addition, or human setup is required.

### Phase Key Deliverables

- Semantic minus/value/plus price steppers at exactly 10 cents per activation,
  bounded from 250 to 1,200 cents.
- Semantic minus/value/plus supply steppers at exactly one package per
  activation, bounded from 0 to 20 packages.
- Atomic planner commands, autosave/reload continuity, and 44px keyboard/touch
  controls that remain usable at 360 CSS pixels.
- Observable actual sale charges and exact amended-price revenue/report/cash
  reconciliation while retaining size and milk surcharges.

### Phase Components

#### Component 4.1 — Human Setup and Phase Contracts

- **Human setup:** None. Phase 4 uses the existing static local-first runtime
  and public repository with no new service or credential.
- **Inclusions:** Reconcile the six-phase plan/profile contracts, create the
  lean Phase 4 component specification and implementation context, and register
  Components 4.1–4.4 in phase progress.
- **Post-validation action:** After Component 4.4 records PASS, the human
  approves or rejects the `phase-4` merge.
- **Dependencies:** Phase 3 hosted PASS and the approved Phases 4–6 lean
  contract.

#### Component 4.2 — Exact Accessible Planner Steppers

- **Runtime outcome:** A keyboard, pointer, or touch user can adjust any active
  menu price or supply quantity by one exact configured increment without
  entering text, including repeated rapid activations and boundary states.
- **Inclusions:** Replace every planner `number` input with reusable semantic
  minus/value/plus controls; centralize integer bounds/increments; use relative
  typed commands so each activation applies to current state; expose labelled
  polite value announcements; disable decrement/increment controls at their
  respective bounds; retain active-menu availability and immediate autosave;
  and prevent horizontal clipping at 360px.
- **Essential proof:** Engine tests cover exact relative changes and bounds;
  React tests cover labels, announcements, disabled states, absence of editable
  numeric inputs, rapid clicks, Enter/Space, and supply affordability feedback;
  Playwright covers desktop keyboard and 360px touch targets.
- **Dependencies:** Component 4.1 and the existing planning command/persistence
  path.

#### Component 4.3 — Authoritative Sale Pricing and Reconciliation

- **Runtime outcome:** A user can amend a single drink's base price, reload,
  trade a real deterministic rush, see actual charges with modifiers, and
  reconcile those sales through the day report and settled cash.
- **Inclusions:** Reproduce the reported planner-to-report journey; retain the
  existing authoritative `DayPlan.pricesCents` order formula; add only a
  minimal bounded completed-sale observation compatible with old schema-v2
  saves and the future rush activity stream; show the most recent actual charge
  during service and concise grouped charge evidence in the report; and prove
  revenue, net flow, closing cash, and exact-once settlement from those sales.
- **Essential proof:** Unit tests assert every order charge equals amended base
  price plus configured size/milk surcharges and that sale sums equal rush and
  report revenue; persistence tests cover old/new active-rush and report data;
  production Playwright repeats $0.10 activations, reloads planning, runs a
  single-drink rush on desktop and touch-mobile, and reconciles visible charges
  to revenue and cash.
- **Dependencies:** Component 4.2 and the existing order, rush, report, and
  settlement path.

#### Component 4.4 — Phase Validation and Documentation

- **Runtime outcome:** Trustworthy planning and sales have cumulative PASS
  evidence without weakening any released campaign, accessibility, offline, or
  mobile behavior.
- **Inclusions:** Run all Phase 1–4 tests and the exact profile validation
  sequence; fix every failure; execute the desktop/mobile planner-price flows;
  self-review for placeholders, formula drift, and unbounded state; then write
  `docs/phase-4-test-report.md`, component overviews, implementation context,
  progress/team state, and runbook guidance.
- **Dependencies:** Components 4.2–4.3 and all earlier phase PASS evidence.

### Phase Validation Targets

- **Desktop production flow:** Set a one-drink menu; adjust its price by
  repeated keyboard-operable $0.10 activations; exercise price and quantity
  boundaries; reload and continue the same plan; complete service; verify each
  visible actual charge and exact report/closing-cash arithmetic.
- **Touch-mobile production flow:** At 360px, repeat representative price and
  supply adjustments with touch only; verify all visible targets are at least
  44px, values announce/fit, bound controls disable, no text editing exists,
  and the amended-price day reconciles.
- **Critical engine/persistence behavior:** Relative commands are exact and
  bounded; the plan remains integer cents/packages through autosave; every
  completed sale retains the amended base plus configured modifiers; observed
  charge totals equal rush revenue, report revenue, and settlement exactly.

### Phase Acceptance Criteria

- [ ] Every planner price and supply quantity uses a semantic
      minus/value/plus stepper with no free-text numeric editing.
- [ ] Prices change by exactly 10 cents within 250–1,200 cents and supplies by
      exactly one package within 0–20; controls disable at bounds.
- [ ] Labels, value announcements, keyboard/touch operation, 44px targets, and
      the 360px layout pass component and production-browser tests.
- [ ] An amended price survives reload and is authoritative for every order,
      actual charge, rush/report revenue, and closing/settled cash while size
      and milk surcharges remain exact.
- [ ] The cumulative exact validation sequence passes and
      `docs/phase-4-test-report.md` records PASS.

---

## Phase 5: Stock Lifecycle and Capacity Intelligence

### Phase Overview

**Feature statement:** A user can now reason about perishable supplies as dated
batches, plan from an honest weighted serves estimate, follow live rush stock,
and understand what was consumed, rolled, or expired.

**Overview:** This phase replaces flat inventory persistence with schema-v3
per-ingredient batches. Purchase-day stock is usable for that rush and the next
two trading days, true LIFO consumes newest stock first, and refrigeration adds
one or two configured days to chilled ingredients at tiers 1 and 2. Player
surfaces explain capacity without promising a false exact drink count.

**Dependencies:** Phase 4 PASS. No external service or human setup is required.

### Phase Key Deliverables

- Schema-v3 dated inventory batches with bounded validation, legacy migration,
  LIFO consumption, three-rush shelf life, and refrigeration extensions.
- Deterministic weighted `~N serves` planning estimates derived from menu,
  recipes, variants, modifiers, and available batches.
- A live rush stock grid and report evidence for opening, purchased, consumed,
  rolled, and expired supply.
- Cumulative desktop and 360px touch-mobile persistence/economy proof.

### Phase Components

#### Component 5.1 — Human Setup

- **Human setup:** None. Schema migration and inventory behavior are entirely
  local and require no account, credential, secret, or service.
- **Post-validation action:** After Component 5.5 records PASS, the human
  approves or rejects the `phase-5` merge.
- **Dependencies:** Phase 4 PASS.

#### Component 5.2 — Schema-v3 Perishable Batch Inventory

- **Runtime outcome:** Purchased and rolled supplies retain purchase age,
  consume newest-first, expire after their configured usable rushes, and reload
  without loss or duplication.
- **Inclusions:** Introduce bounded dated batches per ingredient; migrate every
  legacy flat amount into a current-day full-life batch; consume true LIFO;
  keep stock usable on purchase day plus two following trading days; extend
  configured chilled stock one/two days at refrigeration tiers 1/2; and make
  purchase, service, waste, close-day expiry, import/export, and backup recovery
  use the same batch path.
- **Essential proof:** Migration fixtures, age/expiry boundaries, mixed-age
  LIFO consumption, refrigeration tiers, conservation, reload, malformed input,
  and exact-once settlement tests.
- **Dependencies:** Component 5.1 and Phase 4 persistence/economy contracts.

#### Component 5.3 — Weighted Planning Capacity

- **Runtime outcome:** During planning, a user sees a deterministic `~N serves`
  estimate for servable stock that changes honestly with menu, variants,
  modifiers, purchases, carried batches, and unavailable ingredients.
- **Inclusions:** Derive the estimate from configured demand weights and real
  recipes without mutating engine state; label it explicitly approximate;
  explain limiting stock and expiry risk; and update it immediately through the
  production planner controls.
- **Essential proof:** One-factor estimate tests cover menu/recipe/modifier and
  batch changes; component/desktop/mobile tests cover announcement, responsive
  display, and no false exactness.
- **Dependencies:** Component 5.2 and Component 4.2 planner controls.

#### Component 5.4 — Live Rush Stock and Expiry Reporting

- **Runtime outcome:** A user can watch relevant stock fall during service and
  read which quantities were purchased, consumed, carried, wasted, or expired
  after the rush.
- **Inclusions:** Add a responsive textual live-stock grid driven by current
  batch totals; retain reduced-motion parity; add concise per-ingredient
  lifecycle rows to the report; distinguish recipe consumption, waste, and
  expiry; and preserve exact cash/inventory reconciliation.
- **Essential proof:** Engine/report conservation tests and production
  desktop/360px flows verify live depletion, stockout states, expiry labels,
  refrigeration extensions, reload, and no clipped grid content.
- **Dependencies:** Components 5.2–5.3.

#### Component 5.5 — Phase Validation and Documentation

- **Runtime outcome:** Schema-v3 stock lifecycle and capacity intelligence have
  cumulative PASS evidence across campaign, migration, offline, desktop, and
  touch-mobile paths.
- **Inclusions:** Run the exact validation sequence; fix all regressions;
  execute migration, multi-day expiry/LIFO, weighted-estimate, live-grid, and
  report journeys; self-review bounds/conservation; and write Phase 5 report,
  context, overviews, progress/team state, and runbook updates.
- **Dependencies:** Components 5.2–5.4 and all earlier phase PASS evidence.

### Phase Validation Targets

- **Multi-day inventory flow:** Import or create known flat stock -> migrate to
  current-day batches -> buy multiple dated batches -> prove newest-first
  consumption -> advance rushes -> prove normal and refrigerated expiry days ->
  reload/export/import without changing totals or age.
- **Desktop/mobile intelligence flow:** At planning, compare the weighted
  `~N serves` estimate with real menu/purchase changes; during service, observe
  the live grid; at report, reconcile purchased, consumed, rolled, wasted, and
  expired quantities at desktop and 360px touch-mobile.
- **Critical persistence/economy behavior:** Migration is deterministic and
  bounded, no stock is created or double-consumed, expiry occurs exactly once,
  and inventory plus cash settlement remains conserved.

### Phase Acceptance Criteria

- [ ] Schema-v3 batches migrate legacy flat inventory safely and persist every
      ingredient's age and quantity through all save/recovery paths.
- [ ] LIFO, purchase-day-plus-two shelf life, and tier-1/tier-2 chilled-stock
      extensions match the locked defaults exactly.
- [ ] Planning shows deterministic weighted `~N serves` estimates with useful
      limiting/expiry explanations and no false exact promise.
- [ ] Live rush and report stock surfaces reconcile consumed, rolled, wasted,
      and expired quantities on desktop and at 360px.
- [ ] The cumulative exact validation sequence passes and
      `docs/phase-5-test-report.md` records PASS.

---

## Phase 6: Living Rush and Unique People

### Phase Overview

**Feature statement:** A user can now read a lively but deterministic rush as
customers queue, order, pay, leave, or walk away, and every staff candidate
shown during the same campaign has a unique name.

**Overview:** This phase promotes the minimal Phase 4 sale observation into one
bounded deterministic activity stream consumed by both Canvas and textual UI.
Presentation becomes more expressive without advancing or changing simulation,
reduced motion retains the same outcomes, and campaign name allocation prevents
repetition after a person has been displayed.

**Dependencies:** Phase 5 PASS. No new account, credential, secret, or runtime
service is required; the final updated Pages release retains a human merge and
hosted-verification gate.

### Phase Key Deliverables

- A bounded serializable rush activity stream for queue, service, sale, exit,
  stockout, and walkaway outcomes, emitted only by deterministic engine logic.
- Clearer Canvas queue/order/sale/exit/walkaway animation and equivalent text,
  with reduced-motion and reload parity.
- Campaign-wide non-repeating displayed staff names with deterministic
  generation/allocation and safe persistence.
- Cumulative local and hosted desktop/mobile/offline validation.

### Phase Components

#### Component 6.1 — Human Setup and Final Release Gate

- **Human setup:** None before local implementation. After Component 6.5 local
  PASS, the human approves or rejects the final merge and confirms the updated
  GitHub Pages URL before hosted PASS.
- **Dependencies:** Phase 5 PASS and the existing public Pages workflow.

#### Component 6.2 — Deterministic Rush Activity Stream

- **Runtime outcome:** Every meaningful rush transition emits one compact,
  ordered, bounded activity record that survives reload and can drive both
  visual and textual feedback without affecting simulation outcomes.
- **Inclusions:** Evolve the Phase 4 completed-sale precursor into one canonical
  event contract covering arrival/queue, service start, sale with actual charge,
  exit, stockout, and walkaway; define pruning bounds and stable sequence/tick
  identity; validate/migrate persisted activity; and keep renderer time absent
  from engine policy.
- **Essential proof:** Equal seed/commands produce equal streams; speed/frame
  rate do not change them; reload resumes ordering without duplicates; bounds,
  actual sale charge, stockout, and walkaway events are exact.
- **Dependencies:** Phase 5 engine/persistence and the minimal Component 4.3 sale
  observation.

#### Component 6.3 — Expressive Queue, Sale, Exit, and Walkaway Scene

- **Runtime outcome:** A user can visually and textually distinguish waiting,
  ordering, successful sale/payment, normal exit, stockout, and impatience
  walkaway while the rush remains readable on desktop and mobile.
- **Inclusions:** Consume only the canonical activity stream and immutable scene
  snapshots; improve movement/state cues and actual-charge feedback; retain
  colour-independent text; make reduced motion show the same ordered outcomes
  without travel animation; and preserve Canvas performance and 360px layout.
- **Essential proof:** Snapshot/Canvas/component tests cover every activity;
  production desktop/mobile flows cover visible and textual parity, reduced
  motion, reload mid-rush, no overflow, and no simulation mutation.
- **Dependencies:** Component 6.2 and Phase 3 scene/accessibility contracts.

#### Component 6.4 — Campaign-Unique Staff Names

- **Runtime outcome:** Once a staff candidate's name is displayed, that name is
  never shown for another person in the same campaign, including after reload
  and across long/endless play.
- **Inclusions:** Persist campaign-level displayed-name history; allocate names
  deterministically without replacement; provide deterministic generated
  fallback names after the curated pool is exhausted; migrate existing saves;
  and keep names cosmetic with no economic effect.
- **Essential proof:** Multi-day and long/endless tests exhaust the curated pool
  without repeats; rejected/hired candidates remain reserved; reload/import,
  equal-seed determinism, safe bounds, and fresh-campaign reset all pass.
- **Dependencies:** Phase 5 persistence and existing staff candidate flow; may
  proceed alongside Component 6.3 after Component 6.2 contracts settle.

#### Component 6.5 — Cumulative QA, Documentation, and Hosted Verification

- **Runtime outcome:** The complete updated game has local and hosted PASS
  evidence for deterministic living-rush feedback and unique people while all
  prior planning, stock, campaign, accessibility, offline, and release behavior
  remains intact.
- **Inclusions:** Run/fix the exact cumulative validation sequence; exercise all
  activity/reduced-motion/name-exhaustion paths; self-review determinism and
  renderer separation; write Phase 6 report/context/overviews/runbook/release
  evidence; then, after Component 6.1 approval, verify the deployed Pages build
  on desktop and 360px touch-mobile including refresh, save/reload, and offline.
- **Dependencies:** Components 6.2–6.4 and the Component 6.1 hosted gate.

### Phase Validation Targets

- **Deterministic activity flow:** Equal campaign state and commands emit equal
  bounded activity sequences across 1×/2×/4× and differing animation frames;
  a mid-rush reload resumes without missing or duplicated customer outcomes.
- **Desktop/mobile scene flow:** Observe queue, service, actual sale/payment,
  exit, stockout, and walkaway cues plus their text on desktop and at 360px;
  repeat with reduced motion and prove equivalent ordered outcomes.
- **Unique-name flow:** Display candidate pools across enough campaign/endless
  days to exhaust curated names, reject/hire varied people, reload/import, and
  prove no displayed name repeats until a fresh campaign begins.
- **Hosted cumulative flow:** After human-approved merge, repeat responsive,
  autosave/reload, activity, staff-name, asset/subpath, service-worker, and
  offline checks at the public Pages URL.

### Phase Acceptance Criteria

- [ ] One bounded deterministic activity stream covers all required rush
      outcomes and is unchanged by speed, frames, reload, or presentation.
- [ ] Canvas and textual surfaces clearly distinguish queue, sale/payment,
      normal exit, stockout, and walkaway with actual charge feedback.
- [ ] Reduced-motion and 360px touch-mobile users receive equivalent ordered
      outcomes with accessible controls/text and no clipping.
- [ ] No staff name repeats after display within a campaign, including after
      pool exhaustion, rejection, hire, reload, import, and endless play.
- [ ] The cumulative exact validation sequence and hosted Pages verification
      pass and `docs/phase-6-test-report.md` records hosted PASS.

---

## Phase 7: Fixed-Isometric Service World

### Phase Overview

**Feature statements:**

- A user can now run service in a fixed-isometric, procedurally built WebGL
  world for the cart, kiosk, and cafe while retaining the exact campaign,
  progression, economy, stock, staffing, activity, and save outcomes established
  through Phase 6.
- A user can now move through the daily flow with service-first information
  ordering, see the 3D scene and complete rush dashboard together at 360×780
  without document scrolling, inspect accessible textual outcomes, open a
  compact day-complete summary, disclose the full report, and reopen prior day
  reports.
- A user whose browser cannot provide WebGL2 receives an accessible explanation
  and recovery guidance; a reduced-motion user receives the same 3D world and
  complete information with movement stopped or minimized.

**Overview:** Phase 7 is the lowest-risk bridge from the released Canvas
presentation to the next campaign. It changes service rendering and daily-flow
composition only. React remains authoritative for accessible controls and
text; the pure engine remains authoritative for all simulation and accounting.
Three.js and React Three Fiber consume immutable, bounded snapshots. They never
advance time, generate demand, choose orders, move inventory, settle cash, or
infer outcomes. The service scene mounts only during service: morning planning
remains a focused management interface with no decorative planning scene.

The first rendering slice proves the real WebGL architecture with the cart
before the kiosk and cafe are added. The daily flow and report history then land
on top of all three complete venue scenes. SaveEnvelope v3 and the already-
required bounded `GameState.history` remain authoritative throughout this
phase; no history field or v3 history migration is introduced. No progress
reset, difficulty, fourth venue, department-store content, parallel queues, or
new menu content enters Phase 7.

**Objective:** Establish a production-grade snapshot-only 3D presentation and a
more legible service/report loop without changing existing game truth.

**Dependencies:** Phase 6 PASS head; its deterministic canonical activity,
campaign-unique people, report data, and SaveEnvelope v3; Node/pnpm/browser
baseline from the project profile. Implement must re-verify current Three.js,
React Three Fiber, React 19, Vite 8, WebGL2/browser, licensing, and bundle
compatibility against official primary sources immediately before pinning
dependencies.

**Critical path:** 7.1 -> 7.2 -> 7.3 -> 7.4 -> 7.5 -> 7.6. Component authoring,
Tier 2 gates, commits, preview/browser use, and the final Tier 3 gate are
strictly sequential.

### Phase Key Deliverables

- A lazy-loaded Three.js/React Three Fiber service route with an orthographic
  fixed-isometric camera, capped device-pixel ratio, procedural low-poly/pixel-
  compatible materials, instanced repeated meshes, bounded lights/shadows, and
  no renderer-owned game state.
- Warm, original low-poly classic-tycoon art direction across each service
  world while preserving `public/assets/art/laneway-title.webp` byte-for-byte.
- Complete cart, kiosk, and cafe service worlds driven only by immutable engine
  snapshots, including staff/customer placement, weather/ambience, equipment,
  service activity, queues, stock signals, and deterministic visual inspection.
- Explicit WebGL2 capability handling, context-loss recovery messaging,
  reduced-motion behavior, keyboard/touch parity, and complete textual outcome
  parity without a 2D gameplay fallback.
- Service information ordered scene -> dashboard -> live activity -> stock,
  with the scene and full dashboard visible together at 360×780 without
  document scrolling.
- A full-width morning planner with no preview scene, compact day-complete
  disclosure, a collapsed-by-default full report, an exact-once
  `Settle & reinvest` action, and Reports in the existing Game menu backed by
  bounded `GameState.history` without a v3 history migration.
- Lazy route/chunk and asset strategy that keeps every Workbox-precached file
  below the configured one-megabyte-per-file ceiling.

### Phase Components

- **Component 7.1 — Human Setup and Phase-7 Gate Reservation:** All Phase 7
  human tasks are isolated here. No account, credential, secret, paid asset, or
  external service is required. The human confirms that any physical-device
  validation will be owner-led against the exact candidate published at the
  existing public game URL only after local validation, merge, and publication
  approval. After Component 7.6 records automated PASS, the human approves or
  rejects the post-gate merge/publication handoff. The Implement engagement
  records the phase branch/base and official-source compatibility checklist but
  makes no runtime change. **Explicit exclusion:** this component does not
  install packages, alter source/configuration, access a physical device,
  publish an intermediate build, or claim device, merge, or publication
  approval in advance. **Dependencies:** Phase 6 PASS head plus both
  coordinator-materialized component breakdowns complete and `Spec-Validated`.
  **Preliminary assurance lane:** fast (lean override); no standard Test
  or Review trigger because this is a non-runtime setup record.
  **Validation tier:** Tier 1 targeted documentary proof.

- **Component 7.2 — Snapshot-Only WebGL Cart Service:** A user can complete a
  cart service rush through the production React route while viewing the first
  fixed-isometric WebGL scene and the existing accessible rush controls. The
  slice re-verifies official compatibility sources, pins the approved Three.js
  and React Three Fiber versions, introduces a lazy service-scene boundary,
  WebGL2 capability/context handling, an orthographic camera with fixed
  isometric orientation, capped DPR, bounded lights, instancing helpers, and a
  typed immutable render-snapshot adapter. It procedurally constructs the full
  cart venue, people, equipment, weather, and activity cues in the warm,
  original low-poly classic-tycoon direction and proves that pause/speed/reload/
  reduced-motion change presentation only through existing commands and
  snapshots. The existing
  `public/assets/art/laneway-title.webp` is preserved unchanged. WebGL chunks
  and generated textures/material assets are split so each precached file
  remains under Workbox's 1 MB limit.
  To keep phase-branch kiosk/cafe saves runnable between the 7.2 and 7.3
  commits, the existing Canvas service renderer remains temporarily reachable
  only for those two VenueId values. This bridge is not an unsupported-WebGL
  fallback, never activates in response to capability failure, may exist only
  on the unmerged phase-7 development branch, and makes that intermediate head
  ineligible for merge or release.
  Unsupported WebGL2 produces a semantic explanatory panel with browser/device
  guidance and save-safe navigation, not Canvas or DOM gameplay. **Explicit
  exclusions:** no kiosk/cafe WebGL scene yet, no permanent Canvas path, no
  planning scene, no renderer-side simulation/accounting, no Phase-8 contracts,
  and no SaveEnvelope version change. **Dependencies:** 7.1 and Phase-6
  immutable activity/selectors.
  **Preliminary assurance lane:** fast (lean override). Standard Test triggers
  otherwise matched: first WebGL integration pattern, UI/browser behavior,
  context loss, responsive and reduced-motion behavior, and a real service
  round trip. Standard Review triggers otherwise matched: app-entry/build
  configuration, new dependencies, shared render contract, and public snapshot
  API. **Validation tier:** Tier 2 component gate.

- **Component 7.3 — Complete Kiosk and Cafe Isometric Worlds:** A user can run
  the unchanged campaign at every existing venue and see a complete,
  venue-distinct kiosk or cafe world whenever those tiers are active. The slice
  extends the same snapshot schema and procedural scene grammar with tier-
  accurate floor plans, counters, owned equipment, staff/customer anchors,
  queue positions, stock/activity cues, weather, ambience, occlusion-safe
  inspection, deterministic camera framing, and bounded draw calls. Repeated
  furnishings and crowds use instancing; the camera remains orthographic and
  fixed-isometric; DPR, crowd detail, lighting, and effects honor the mobile
  performance budget without altering snapshot truth. Scene assertions cover
  all three VenueId values, owned equipment, phase transitions, reloads, and
  reduced motion. This slice removes the 7.2 Canvas bridge completely and adds
  regression proof that no service VenueId imports, mounts, or selects the
  Canvas renderer; the Phase-7 merge candidate is WebGL-only for gameplay.
  **Explicit exclusions:** no fourth venue, no renderer
  commands other than forwarding existing player controls, no hidden outcome
  calculations, and no new food, drinks, or ingredients. **Dependencies:** 7.2
  renderer/snapshot contract and the Phase-6 cart/kiosk/cafe progression.
  **Preliminary assurance lane:** fast (lean override). Standard Test triggers
  otherwise matched: regression-prone multi-venue UI, WebGL browser rendering,
  persistence/reload, and mobile performance. Standard Review triggers
  otherwise matched: broad shared renderer and snapshot-contract scope.
  **Validation tier:** Tier 2 component gate.

- **Component 7.4 — Immersive Service Information Flow:** A user can start a
  service day and encounter information in the fixed order scene -> dashboard
  -> live activity -> stock on desktop and touch-mobile. React composes the
  snapshot-only scene with a compact but complete dashboard containing time,
  cash/revenue, served/lost/queue, satisfaction/reputation, speed/pause, active
  event state, and all required service controls. At exactly 360×780 the full
  scene and dashboard are simultaneously visible without document scrolling;
  live activity and stock follow below through deliberate progressive
  disclosure. Focus order, keyboard operation, 44px targets, non-colour status,
  reduced-motion text, screen-reader announcements, landscape/resize behavior,
  and safe-area handling are production paths. Morning planning is explicitly
  full-width and contains no 3D, Canvas, thumbnail, or other preview scene; the
  complete width remains focused on decisions. **Explicit exclusions:** no
  omission of existing dashboard truth, no hover-only inspection, no gameplay
  control inside the WebGL canvas, and no engine/store contract changes.
  **Dependencies:** complete three-venue renderer from 7.3 and existing React
  selectors/commands. **Preliminary assurance lane:** fast (lean override).
  Standard Test triggers otherwise matched: responsive/touch/keyboard UI and
  regression-prone service navigation. Standard Review triggers otherwise
  matched: app composition and broad shared layout changes. **Validation tier:**
  Tier 2 component gate.

- **Component 7.5 — Compact Day Completion and Reopenable Reports:** A user can
  finish a day, understand its result from a compact completion panel, open the
  full report when wanted, settle once, reinvest, and reopen settled reports
  through a new Reports entry in the existing Game menu. The current-day full
  report is collapsed by default, and the compact completion flow retains one
  explicit `Settle & reinvest` action wired to the existing exact-once
  settlement boundary.

  Reports lists the already-required bounded `GameState.history`; it adds no
  history field and performs no v3 history migration. Selecting a historical
  `DayReport` makes that selected immutable settled report the sole rendering
  input. The report UI never reads current `rush.recentActivity` when a
  historical report is selected. Because the current report presently derives
  actual-charge evidence from `rush.recentActivity`, `DayReport` receives
  canonical bounded charge aggregates/detail additively only where required for
  full-report parity between current and reopened views for reports settled
  after Component 7.5. `closeDay` captures that evidence once into the settled
  report; rendering never recomputes it.

  Existing Phase-6/v3 historical reports lack the transient grouped-charge
  detail that was never stored. Reopening one renders every canonical field
  present in that selected `DayReport` plus the explicit accessible state
  “charge breakdown unavailable for this older report.” It never reconstructs,
  estimates, or infers missing charges from current rush activity or any other
  state.

  Existing v3 saves, bounded history, autosave, export/import, reload, victory,
  bankruptcy, and endless continuation remain coherent. Desktop and 360×780
  disclosure, menu navigation, keyboard/touch focus return, reduced-motion
  behavior, and textual parity are complete. **Explicit exclusions:** no new
  history storage, no v3 migration, no cross-campaign cloud history, no report
  data sourced from the renderer, and no Phase-8 difficulty records.
  **Dependencies:** 7.4 flow and existing `closeDay`, `DayReport`,
  `GameState.history`, persistence, export/import, and records contracts.
  **Preliminary assurance lane:** fast (lean override).
  Standard Test triggers otherwise matched: settled-history persistence/export
  round trips, additive `DayReport` evolution, UI disclosure/menu navigation,
  and exact-once settlement. Standard Review triggers otherwise matched:
  `DayReport` public contract and cross-component report navigation.
  **Validation tier:** Tier 2 component gate.

- **Component 7.6 — Phase-7 Validation and Documentation:** The Implement
  engagement builds or extends the exact Vitest, React Testing Library, and
  Playwright coverage for every Phase-7 Validation Target, then runs the
  profile's complete Tier 3 sequence once against the final global fingerprint.
  The automated phase gate includes desktop Chromium and the exact 360×780
  touch-browser project, reduced-motion/text parity, unsupported/context-loss
  handling, all three venue scenes, full daily flow, history persistence,
  cumulative Phases 1-6 journeys, performance/bundle evidence, and
  deterministic renderer/engine separation. It records
  `docs/phase-7-test-report.md` as automated Tier 3 PASS and leaves physical
  validation explicitly pending and unclaimed. If requested after completion,
  the repository owner validates the exact hosted candidate at the existing
  public game URL; agents never access the device. It updates the phase
  implementation context and runbooks and reconciles stale Canvas references
  in `docs/brief.md`, `docs/requirements.md`, `docs/solution-design.md`, and
  README. **Explicit exclusions:** no Phase-8 runtime behavior, physical-device
  interaction, push, merge, publication, or intermediate/unvalidated hosted
  build. **Dependencies:** 7.1-7.5 complete with reusable unchanged evidence.
  **Preliminary assurance lane:** phase-gate (lean override).
  The Implement engagement owns the cumulative gate, self-review, fixes,
  report, and commit. **Validation tier:** Tier 3 phase gate.

### Phase Validation Targets

- **Desktop user-facing flows:** At 1280×800, continue a Phase-6 v3 save at
  cart, kiosk, and cafe; verify full-width planning has no preview scene; start
  service; inspect each isometric world; pause and use 1x/2x/4x; resolve an
  event; inspect dashboard/activity/stock; close the day; verify the full report
  starts collapsed; activate `Settle & reinvest` exactly once; open Reports
  from the Game menu; reopen one post-7.5 report with complete charge parity and
  one Phase-6/v3 report with all stored fields plus the accessible older-report
  charge-unavailable state; reload and continue with unchanged values.
- **Touch-mobile user-facing flows:** At exactly 360×780, complete the same
  service and report journey using touch only, proving the scene and complete
  dashboard are concurrently visible without document scroll, all controls are
  at least 44px, live activity/stock remain reachable, disclosure/focus works,
  and no hover or landscape assumption blocks play.
- **WebGL and accessibility flows:** In real Chromium at desktop and exact
  360×780 touch-browser viewports, validate all three venue worlds,
  resize/orientation fixtures, context recovery, capped DPR, fixed orthographic
  framing, and dense-service responsiveness. In an unsupported-capability
  fixture, validate the accessible explanation and save-safe exit. With reduced
  motion, confirm the 3D scene remains present, motion stops/minimizes, and
  textual outcomes exactly match. The final Phase-7 candidate contains no
  Canvas service route for any VenueId, preserves
  `public/assets/art/laneway-title.webp` unchanged, and carries the warm,
  original low-poly classic-tycoon direction through all three worlds.
- **Post-completion physical check (not part of automated Tier 3):** Only after
  the automated candidate passes and receives separate merge/publication
  approval, the repository owner may validate the exact build at the existing
  public game URL on a representative WebGL2 touch device. Record model/OS,
  browser/WebGL identity, portrait and landscape behavior, viewport/DPR, all
  three venues, dense-scene responsiveness, reduced motion, visual findings,
  and the 30fps disposition as pending until the owner supplies them. Do not
  infer a physical result from emulation, access the device through agent
  tooling, or publish an intermediate candidate.
- **Critical engine/persistence features:** Equal seeds/plans produce identical
  GameState, DayReport, canonical activity, cash, inventory, and reputation
  with WebGL mounted, unmounted, context-lost, reduced-motion, and at every speed.
  SaveEnvelope v3 reload/export/import preserves the active campaign and bounded
  `GameState.history` without reset or duplicate settlement. A selected
  historical `DayReport` is the report renderer's sole input. Reports settled
  after 7.5 retain canonical bounded charge evidence matching their current-day
  report. Phase-6/v3 reports render every canonical stored field plus “charge
  breakdown unavailable for this older report”; no missing charge is
  reconstructed or inferred, and current `rush.recentActivity` is never
  consulted for historical rendering.
- **Performance/build targets:** No renderer code mutates engine state; all
  scene inputs are immutable bounded snapshots; instancing is used for repeated
  meshes; camera is orthographic; DPR is capped; no individual Workbox-precache
  file exceeds 1 MB; dense existing-cafe service remains responsive against the
  profile budgets.

### Phase Acceptance Criteria

- [ ] Before Component 7.1 starts, both required component-breakdown documents
      exist, map file ownership/acceptance/dependencies/Technical Validation/
      lane/tier for all 15 additive components, and mark each `Spec-Validated`
      without adding or removing runtime scope.
- [ ] The production build lazy-loads the Three.js/React Three Fiber service
      scene, and the Implement record cites re-verification of official
      compatibility, browser, licensing, and bundling sources.
- [ ] Cart, kiosk, and cafe each render a complete, visually distinct
      fixed-isometric procedural world from immutable snapshots; no renderer
      path advances simulation or computes accounting.
- [ ] The final Phase-7 candidate has removed the temporary 7.2 Canvas bridge
      for kiosk/cafe, no service VenueId selects Canvas, and unsupported WebGL2
      never activates that development-only bridge.
- [ ] All three worlds use the warm, original low-poly classic-tycoon direction,
      and `public/assets/art/laneway-title.webp` is byte-identical to the
      Phase-6 baseline.
- [ ] A WebGL2-capable user can complete the full existing campaign/day flow;
      an unsupported user receives the accessible explanation rather than a
      broken canvas or 2D gameplay fallback.
- [ ] At 360×780, automated geometry assertions and touch Playwright evidence
      show the scene plus complete rush dashboard without document scrolling,
      with activity and stock reachable below.
- [ ] Morning planning is full-width with no 3D, Canvas, thumbnail, or preview
      scene on desktop or touch-mobile.
- [ ] Reduced-motion presentation retains the 3D scene and produces textual and
      engine outcomes identical to normal motion.
- [ ] The day-complete panel is compact, the full report starts collapsed, and
      `Settle & reinvest` can settle the current day exactly once.
- [ ] Reports is reachable from the existing Game menu and reads the bounded
      `GameState.history`; each selected historical `DayReport` is the sole
      input and never consults current rush state.
- [ ] A report settled after 7.5 reopens with charge aggregates/detail identical
      to its current-day full report.
- [ ] A Phase-6/v3 historical report reopens every canonical stored field and
      the accessible “charge breakdown unavailable for this older report”
      state, without reconstructing, estimating, or inferring missing charges.
- [ ] Existing v3 campaign/progression/save outcomes remain coherent; no user
      progress reset, difficulty, fourth VenueId, parallel service, or menu
      expansion occurs.
- [ ] Every precached file is under the Workbox 1 MB/file ceiling, and dense
      service meets the profile's mobile/desktop responsiveness budgets.
- [ ] Component 7.6 records Tier 3 PASS for all named Phase-7 targets and the
      unchanged cumulative suite before merge/publication approval is
      requested; owner-led hosted physical validation remains pending and
      unclaimed until the exact approved build is public.

### Phase Risks and Mitigations

| Risk                                                                             | Impact                                                                           | Mitigation                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebGL work leaks game logic into frame callbacks                                 | Determinism, saves, and accounting diverge                                       | One immutable snapshot boundary, renderer dependency rules, mutation/freeze tests, and mount/context/speed equality checks                                                                                                                        |
| Three-dimensional scenes exceed mobile GPU or Workbox budgets                    | Touch play stutters or offline install fails                                     | Procedural geometry, instancing, fixed camera, capped DPR, bounded lights/crowds, lazy chunks, per-file precache assertions, automated exact-viewport evidence, and an owner-led post-publication device check against the exact hosted candidate |
| Isometric presentation hides important operational state                         | Strategy becomes less legible than Phase 6                                       | React dashboard/text stays authoritative; occlusion-safe anchors, non-colour cues, activity/stock panels, and desktop/touch inspections                                                                                                           |
| Reopened reports read current rush state, invent legacy charges, or settle again | Historical evidence lies or cash/inventory changes twice                         | Use bounded existing `GameState.history`, selected `DayReport` as sole input, post-7.5 charge evidence captured once by `closeDay`, explicit legacy charge-unavailable state, and no-inference/exact-once reload/export tests                     |
| Temporary Canvas bridge survives Component 7.3                                   | Phase 7 could merge with mixed renderers or become an unsupported-WebGL fallback | Make the 7.2 head non-mergeable/non-releasable, remove all Canvas service selection in 7.3, and assert every service VenueId is WebGL-only                                                                                                        |
| Mobile composition scrolls the dashboard below the fold                          | Core controls fail the 360×780 contract                                          | Fixed geometry assertions, compact dashboard content budget, safe-area tests, and a dedicated touch Playwright journey                                                                                                                            |

---

## Phase 8: Forty-Day Department-Store Campaign

### Phase Overview

**Feature statements:**

- A returning user can now cross one explicit v3-to-v4 breaking boundary:
  every supported v1/v2/v3 primary, backup, recovery, or imported envelope
  normalizes through the same reset exactly once; only sound, ambience, and
  reduced-motion preferences survive; onboarding replays; and every subsequent
  verified v4 save/reload is stable.
- A user can now choose Standard or Hard when creating a campaign, keep that
  choice immutable for the run, leave the accessible preselected Standard
  default in place or change it independently of scenario, build separate
  difficulty records with shared non-power unlocks, and experience transparent
  demand behavior appropriate to the selected difficulty.
- A user can now grow the existing cart -> kiosk -> cafe business through a
  complete 40-day campaign into a grand Melbourne-heritage department-store
  coffee hall, hire and schedule a department-scale team, assign staff across
  three parallel service stations, configure an express lane with up to three
  eligible existing drinks, serve larger crowds, buy tier-three commercial
  equipment and physical upgrades, experience new events/cosmetics, and win a
  balanced Day-40 campaign.
- A user can now install, update with consent, reload offline, and play the full
  WebGL campaign at the public GitHub Pages URL on desktop and touch-mobile.

**Overview:** Phase 8 is intentionally one coherent breaking feature phase, not
a collection of partially compatible releases. SaveEnvelope v4 is the single
reset boundary. It creates the new campaign/difficulty/records foundation before
the fourth venue and equipment generalization, department workforce, station
assignments, parallel queue/service contracts, canonical activity identities,
multi-customer snapshots, content/balance, report-history adaptation, and
release packaging are layered in that exact order.

The coffee product remains the existing ten-drink menu with existing sizes,
milk choices, recipes, and ingredients. The expansion adds throughput,
operations, place, people, events, cosmetics, and physical/equipment progression
only: there is no food, no new drink, no new ingredient, no manual drink-making,
and no renderer-side simulation or accounting. A typed baseline demand-
influence registry is exhaustive against the current arrival and order-choice
engine. Standard applies one chosen 1.20-1.25 multiplier to two distinct
registered price paths: aggregate/average-menu-price arrival sensitivity and
segment-specific per-drink order-choice price sensitivity. Segment appeal,
order-choice weather, and every other non-price influence remain at today's
baseline. Hard
independently applies 1.60-1.75 times today's baseline signed deviation from
each registry entry's neutral value, preserving beneficial/harmful direction,
clamping safely at engine boundaries, and never compounding on Standard.
Each registry entry declares a bidirectional, positive-only, or negative-only
domain so its executable proof covers neutral, every supported direction, and
clamps/boundaries without inventing an unsupported direction.
Exact multipliers are centralized in typed configuration, surfaced accessibly
to the player, and frozen only after domain-aware direction/clamp/boundary tests
and seeded balance evidence select values within those approved ranges.

**Objective:** Deliver the definitive expanded campaign and public release while
preserving deterministic truth, accessible textual parity, offline safety, and
the mobile/WebGL performance budgets.

**Dependencies:** Phase 7 PASS head and its snapshot-only renderer, three legacy
venue worlds, service information order, v3 report history, and cumulative
suite. Phase 8 branches from that validated head. GitHub Actions/Pages remain
the only external release infrastructure; publication requires the explicit
human gate isolated in Component 8.1.

**Critical path:** 8.1 -> 8.2 -> 8.3 -> 8.4 -> 8.5 -> 8.6 -> 8.7 -> 8.8 ->
8.9. Inside that path, contract migration order is mandatory: v3 -> v4
allowlisted preferences-only reset -> difficulty in GameState and records ->
fourth VenueId -> equipment
two-to-three-tier generalization -> roster/scheduled limits -> station
assignments -> normal/express queues and multiple service jobs -> station/lane
identities in canonical activity -> multi-customer immutable 3D snapshots ->
Phase-8 report-history UI.

### Phase Key Deliverables

- An idempotent v3 -> v4 preferences-only boundary through which every supported
  v1/v2/v3 primary, backup, recovery, and imported envelope normalizes. It
  retains only sound, ambience, and reduced-motion settings; discards active
  progress, records, achievements, cosmetics, scenarios, report history, and
  onboarding completion; explains the reset once; and cannot resurrect legacy
  data or repeat after a verified v4 marker.
- Immutable Standard/Hard campaign difficulty, separate records per difficulty,
  shared cosmetic/scenario unlocks with no economic power, Standard visibly
  preselected independently of scenario, an exhaustive typed baseline demand-
  influence registry with explicit factor domains, visible rules, separate
  one-factor proofs for both Standard price paths, domain-aware clamp/boundary
  tests, and deterministic campaign balance proof.
- A fourth VenueId and complete department-store tier, a generalized
  two-to-three-tier equipment model, commercial tier-three equipment across the
  existing categories, and a complete Day 1-40 progression/victory contract.
- Department-scale roster and daily schedule limits supporting exactly ten
  scheduled staff, with hireable Manager and Runner roles and readable,
  deterministic operational effects.
- Three authoritative station assignments, a player-configured express lane
  containing zero to three validated eligible existing drinks, separate normal
  and express queues, multiple simultaneous service jobs, and exact-once
  inventory/cash/report settlement.
- Station/lane-aware bounded canonical activity, immutable multi-customer/
  multi-staff render snapshots, and a complete dense Melbourne-heritage coffee
  hall using instancing, orthographic framing, capped DPR, and snapshot-only
  React Three Fiber rendering.
- New 40-day events, cosmetics, physical upgrades, greater customer demand,
  station/lane report history, viable Standard/Hard strategies, fair bankruptcy
  pressure, and balanced Day-40 victory.
- Complete lazy-loaded PWA/offline/update behavior under Workbox's 1 MB/file
  ceiling, Lighthouse and WebGL performance evidence, GitHub Pages subpath
  publication, and hosted desktop/touch-mobile/WebGL/offline release evidence.

### Phase Components

- **Component 8.1 — Human Setup and Final Release Gates:** All Phase 8 human
  tasks are isolated here. No new account, credential, secret, paid asset, or
  runtime service is required. Before implementation, the human confirms access
  to the existing GitHub repository/Actions/Pages controls and confirms whether
  the owner will perform a physical check against the exact hosted candidate.
  After the local Component-8.9 phase gate records PASS, the human separately
  approves or rejects the phase-8 merge and public Pages publication; only after
  approval does the Implement engagement run the established release workflow
  and collect automated hosted evidence. The owner alone accesses the physical
  device. Repository visibility changes remain human-authorized. **Explicit
  exclusion:** no publication, merge, package change, device access, or claimed
  approval occurs in this setup component. **Dependencies:** Phase 7 PASS head
  and existing Pages channel.
  **Preliminary assurance lane:** fast (lean override); no standard Test or
  Review trigger because this is a non-runtime setup record.
  **Validation tier:** Tier 1 targeted documentary proof.

- **Component 8.2 — One-Time Reset and Immutable Difficulty:** A returning user
  sees one clear evolution notice, retains only sound/ambience/reduced-motion,
  replays onboarding, and creates a fresh Standard or Hard v4 campaign whose
  difficulty cannot change until another campaign is created.

  The sole breaking v3 -> v4 boundary accepts every currently supported v1,
  v2, and v3 primary save, backup/last-known-good save, recovery candidate, and
  imported envelope through one normalization-and-reset path. Its explicit
  allowlist copies only `soundEnabled`, `ambienceEnabled`, and
  `reducedMotion` (using the actual typed preference names selected during
  Technical Validation). It discards active/endless progress, records,
  achievements, cosmetics, scenarios, report history, and onboarding
  completion. A verified persisted v4 marker prevents both another reset and
  another reset notice; legacy backup/recovery fallback is quarantined after
  that marker and can never resurrect discarded state. Corrupt or unsupported
  inputs retain the existing safe recovery choices without bypassing this
  boundary.

  Difficulty is authoritative in `GameState`, campaign creation commands,
  autosave/export/import, report/record keys, onboarding/help, and seeded
  simulation. Standard is the visibly preselected accessible default.
  Difficulty and scenario are orthogonal controls and persist independently;
  choosing either never changes the other. Records are partitioned by
  Standard/Hard, while new unlocks are shared and remain non-economic.

  A typed baseline demand-influence registry must be exhaustive against the
  current engine. Arrival entries cover aggregate/average-menu-price arrival
  sensitivity, reputation, street-sign/improvements, dial-in quality, bean,
  weather, venue, scenario, scheduled team/traits/equipment demand effects,
  queue/wait pressure, availability/stock, and the distinct rush-event demand
  multiplier. Order-choice entries separately cover segment-specific per-drink
  price sensitivity, segment appeal, and weather.

  Each entry declares its current baseline, neutral value, domain
  (`bidirectional`, `positive-only`, or `negative-only`), signed
  application, clamp/boundary behavior, and engine source. Technical Validation
  maps every current arrival/order-choice calculation to exactly one registry
  entry; an executable exhaustiveness check fails if engine influence and
  registry membership diverge. Any new Phase-8 demand source must first register
  a neutral baseline, domain, supported direction(s), clamps/boundaries, and
  matching one-factor proof. Bidirectional entries require neutral plus both
  signed directions; one-sided entries require neutral plus every supported
  direction and explicit proof that no unsupported direction is invented.

  Standard applies the same configured 1.20-1.25 multiplier versus today's
  baseline to both registered price entries: aggregate/average-menu-price
  arrival sensitivity and segment-specific per-drink order-choice price
  sensitivity. Separate one-factor fixtures prove each path. Segment appeal,
  order-choice weather, and every other non-price arrival/order-choice influence
  remain at today's baseline. Hard applies one configured 1.60-1.75 multiplier
  versus today's baseline—not Standard—to every registered influence's
  domain-supported deviation from neutral, including the distinct rush-event
  multiplier. It preserves beneficial/harmful direction and clamps only at the
  declared engine boundary. Per-entry fixtures prove neutral invariance, every
  supported direction, no invented unsupported direction for one-sided entries,
  clamping, and boundary behavior before seeded campaign balance.

  **Explicit exclusions:** no second migration boundary, no retained legacy
  progress/meta/history, no recovery resurrection, no repeated notice/reset,
  no mid-campaign difficulty switch, no scenario coupling, no unregistered
  demand source, no fourth venue, and no renderer calculation of demand.
  **Dependencies:** 8.1, all supported v1/v2/v3 primary/backup/recovery/import
  fixtures, the Phase-7 history/report contract, pure arrival/order-choice
  engine, preferences adapter, records, scenarios, and onboarding.
  **Preliminary assurance lane:** fast (lean override).
  Standard Test triggers otherwise matched: destructive migration/recovery,
  persistence/import round trips, regression-prone demand behavior, accessible
  campaign creation, and full-campaign balance. Standard Review triggers
  otherwise matched: public `GameState`/`SaveEnvelope`/records schema,
  security-bounded import/recovery behavior, registry exhaustiveness, and the
  cross-component campaign contract.
  **Validation tier:** Tier 2 component gate.

- **Component 8.3 — Fourth Venue and Three-Tier Commercial Equipment:** A v4
  player can progress through cart -> kiosk -> cafe -> department store, enter a
  complete playable Melbourne-heritage coffee hall, purchase commercial
  tier-three equipment, and pursue a Day-40 victory that requires owning the
  final venue. VenueId becomes an exhaustive four-value contract across typed
  content, progression, demand, planner, reports/history, persistence, import,
  tests, and the WebGL scene selector. Equipment assumptions are generalized
  from two tiers to data-driven tier arrays with validated unlock venue,
  capacity, price, maintenance, reliability, quality, throughput, and waste
  effects; every existing category receives a meaningful tier-three commercial
  option. Campaign length, promotion gates, bankruptcy/endless transitions,
  and victory checks become difficulty-aware Day 1-40 rules. The department
  hall is already a complete snapshot-only venue at this boundary, using the
  existing single service contract until later station slices enrich it; it is
  not a blank shell or future hook. Seeded baseline campaigns prove the new
  tier can be reached and won before later operational content retunes the
  final balance. **Explicit exclusions:** no food, new drink/ingredient,
  incomplete equipment category, fifth venue, parallel service, or DOM/renderer
  progression truth. **Dependencies:** 8.2 v4 GameState/difficulty/records
  contract and Phase-7 venue-render dispatch.
  **Preliminary assurance lane:** fast (lean override).
  Standard Test triggers otherwise matched: public persistence/progression
  round trips, first four-tier runtime path, campaign win/loss behavior, and
  WebGL UI. Standard Review triggers otherwise matched: VenueId/public schema,
  shared content/configuration, exhaustive selectors, and broad progression/
  equipment scope. **Validation tier:** Tier 2 component gate.

- **Component 8.4 — Department Workforce and Operational Roles:** A department-
  store player can hire a Manager or Runner, maintain the enlarged roster, and
  schedule exactly ten staff for a day while smaller venues retain their
  configured limits. Roster and scheduled caps move from implicit fixed
  assumptions to validated per-venue configuration across hiring, planner,
  payroll, save/import, UI summaries, and engine guards; the department roster
  capacity is sufficient to rotate a ten-person daily team, and an eleventh
  scheduled person is rejected accessibly. Manager and Runner join barista and
  front-of-house as full hire-pool roles with wages, skill/speed/trait/name,
  onboarding/help, records, reports, and deterministic effects: a scheduled
  Manager improves bounded coordination/reliability, while a scheduled Runner
  reduces bounded replenishment and handoff delays. Those effects operate
  through pure engine workload commands and existing inventory/equipment truth,
  never through animation. This slice remains fully playable under the current
  single-service contract; station assignment begins only in 8.5. **Explicit
  exclusions:** no weekly roster, manual task control, unbounded staff, hidden
  power unlock, station assignment UI, or queue replacement. **Dependencies:**
  8.3 per-venue capacity and equipment rules plus existing unique-name/staff
  contracts. **Preliminary assurance lane:** fast (lean override). Standard
  Test triggers otherwise matched: cross-component schedule/persistence/payroll
  round trips and regression-prone engine behavior. Standard Review triggers
  otherwise matched: StaffRole/DayPlan schema, shared capacity configuration,
  and broad planner/engine/report changes. **Validation tier:** Tier 2 component
  gate.

- **Component 8.5 — Three Stations, Express Lane, and Parallel Service Truth:**
  A department-store player can assign the scheduled team across three named
  service stations, choose zero to three eligible drinks from the unchanged
  coffee menu for an express lane, and watch normal and express customers be
  served concurrently by authoritative engine jobs. The stable typed station
  identities are espressoBar, brewBar, and coldBar; lane identities are normal
  and express. The slice first adds validated station assignments to
  DayPlan/GameState and makes each station authoritative for staffing,
  equipment access, throughput, reliability, replenishment, and reports. It
  then replaces the
  single queue/activeService assumption with bounded normalQueue,
  expressQueue, and serviceJobsByStation contracts. Express eligibility is
  typed recipe/equipment content; selection is unique, limited to three, and
  validated against the active menu and station capability. Non-selected,
  ineligible, or overflow demand routes to normal service without disappearing.
  Stable seeded ordering resolves simultaneous arrivals, shared-stock
  contention, job completion, abandonment, event effects, wages, satisfaction,
  inventory consumption, revenue, and settlement exactly once. Finally,
  station and lane identities are written into bounded canonical activity
  records and DayReport aggregates for downstream rendering and history.
  Legacy cart/kiosk/cafe use the same generalized contracts with configured
  station/queue counts that preserve their observable outcomes. **Explicit
  exclusions:** no renderer queue authority, manual drink-making, duplicate
  stock reservations, more than three express drinks, food, or nondeterministic
  concurrency. **Dependencies:** 8.4 roster/scheduled bounds and roles; 8.3
  equipment tiers; 8.2 v4 persistence.
  **Preliminary assurance lane:** fast (lean override).
  Standard Test triggers otherwise matched: concurrency, persistence round
  trips, destructive replacement of primary engine state, first parallel-
  service pattern, and exact-once economic behavior. Standard Review triggers
  otherwise matched: DayPlan/GameState/activity/report public schemas, core
  engine contracts, and broad cross-component scope.
  **Validation tier:** Tier 2 component gate.

- **Component 8.6 — Dense Multi-Customer Heritage Hall:** A user can inspect the
  complete department-store coffee hall during a dense rush and see up to ten
  scheduled staff, multiple simultaneous customers, three stations, normal/
  express lanes, active jobs, equipment, physical space, and service outcomes
  agree with textual engine truth. The snapshot adapter expands only after
  Component 8.5 establishes station/lane-aware canonical activity: it emits
  bounded immutable arrays of customer/staff render entities, stable entity and
  station/lane identities, poses, destinations, status, and occlusion-safe
  labels. The final procedural hall carries the warm, original low-poly classic-
  tycoon direction into an unmistakably Melbourne interior with heritage tiles,
  timber, brass, escalators, and three visually distinct service bays. It also
  includes visible commercial equipment, instanced crowds/furnishings,
  orthographic fixed-isometric framing, capped DPR, bounded shadows/lights,
  level of detail, and reduced-motion pose transitions. More customers are
  achieved through typed demand/capacity and bounded engine state, not visual
  clones. Context loss, reload, pause/speed, equal-seed replay, and screen-reader
  activity descriptions retain exact parity. **Explicit exclusions:** no
  renderer-side pathfinding that changes
  service order, no visual-only customers, no accounting from animations, no
  planning scene, and no 2D fallback. **Dependencies:** 8.5 authoritative
  queues/jobs/activity identities and 8.3 complete hall scene.
  **Preliminary assurance lane:** fast (lean override).
  Standard Test triggers otherwise matched: dense WebGL/mobile UI, first multi-
  entity snapshot path, context/reload behavior, and performance. Standard
  Review triggers otherwise matched: shared snapshot API, renderer
  architecture, and broad scene scope.
  **Validation tier:** Tier 2 component gate.

- **Component 8.7 — Complete Forty-Day Content, Balance, and History:** A user
  can play every day of a satisfying Standard or Hard campaign, encounter
  department-scale events, buy visible physical upgrades, earn cosmetics/shared
  unlocks, review station/lane-aware history, and win on Day 40 only after
  reaching the department-store hall and the configured cash/reputation goals.
  Typed content adds enough scheduled events and weighted choices to vary the
  extended campaign without exceeding zero to two service choices per day;
  choices have bounded causal effects and complete text. Physical upgrades have
  visible hall and deterministic operational effects without introducing food
  or ingredients. Cosmetics remain non-power progression shared across
  difficulties. Deterministic multi-seed simulations tune arrival volume,
  prices, wages, equipment/upgrades, venue gates, capacity, event weights,
  overdraft, target cash/reputation, and the already-approved difficulty
  multipliers so multiple strategies can win and plausible mismanagement can
  bankrupt. Phase-8 report history lands last in the contract sequence: it
  partitions records by difficulty, retains shared unlock context, displays
  venue/station/lane/customer/staff/equipment/event causes, and reopens after
  reload/export/import without recomputing canonical reports. **Explicit
  exclusions:** no time-based content descope, placeholder event/cosmetic/
  upgrade, permanent economic unlock, live service, food, eleventh drink, new
  ingredient, or post-Day-40 victory shortcut. **Dependencies:** 8.2 difficulty
  and records, 8.3 progression/equipment, 8.4 workforce, 8.5 parallel service,
  and 8.6 final hall snapshots.
  **Preliminary assurance lane:** fast (lean override).
  Standard Test triggers otherwise matched: full persistence and campaign
  round trips, balance across seeds, victory/bankruptcy, and report UI. Standard
  Review triggers otherwise matched: broad typed content, economy, and public
  report/records contracts. **Validation tier:** Tier 2 component gate.

- **Component 8.8 — Offline, Update, Performance, and Release Readiness:** A
  user can install the complete expanded game, finish or resume service offline,
  and accept or defer an update without losing an active v4 run. The slice
  audits the complete lazy module/asset graph, ensures all WebGL procedural
  assets and route chunks required after first successful load are cached,
  keeps every Workbox-precache file below 1 MB, and verifies the /tycoon/ base
  path. Update prompting never refreshes active service without consent and
  safely resumes the v4 campaign. Dense department-store rendering uses bounded
  crowds, instancing, LOD, capped DPR, orthographic camera, minimized reduced-
  motion work, and practical initial compressed assets to meet automated
  responsiveness budgets and target 60 FPS desktop. The owner records the real
  mid-tier-device 30fps disposition only against the exact hosted candidate
  after local PASS and publication approval. Lighthouse mobile evidence targets
  at least 90 in every profile-named category it exposes.
  Dependency/license/security, no-runtime-network,
  offline cold/warm reload, cache invalidation, Pages routing, and update
  recovery are release-complete locally. Implement re-verifies current official
  Three.js/R3F/Vite/Workbox/browser guidance before final lock/config changes.
  **Explicit exclusion:** no public publication before the 8.1 human gate, no
  oversized precache bypass, no remote asset/API, and no silent active-run
  refresh. **Dependencies:** 8.2-8.7 final runtime/content graph and Phase-7 PWA
  baseline. **Preliminary assurance lane:** fast (lean override). Standard Test
  triggers otherwise matched: PWA/browser/offline/update behavior, external
  Pages path, mobile WebGL performance, and persistence recovery. Standard
  Review triggers otherwise matched: build/service-worker/app-entry/config,
  dependencies, and release-critical broad scope. **Validation tier:** Tier 2
  component gate.

- **Component 8.9 — Cumulative Phase Gate, Publication, and Release Evidence:**
  The Implement engagement builds or extends Vitest, React Testing Library,
  Playwright, deterministic campaign simulation, PWA, bundle, performance, and
  hosted checks for every Phase-8 Validation Target and all enduring Phase-1-7
  journeys. The gate may not sample away the complete v1/v2/v3 primary, backup,
  recovery, and import reset matrix or the engine-to-registry demand
  exhaustiveness, separate Standard price-path proofs, and domain-aware
  direction/clamp/boundary proofs. It runs the exact Tier 3
  sequence once against the final global
  fingerprint and records docs/phase-8-test-report.md PASS only when the entire
  local cumulative gate passes. It completes the phase implementation context,
  release notes, and agent runbook and reconciles the now-stale 30-day,
  Canvas-2D, single-difficulty, three-venue, two-role/two-tier/single-service
  statements in docs/brief.md, docs/requirements.md, docs/solution-design.md,
  README, and the runbook as planned documentation work. After the explicit
  human approvals isolated in 8.1, the same sequential Implement engagement
  merges/publishes through the profiled workflow and captures the public URL,
  commit/build identity, desktop/touch-mobile/WebGL2/offline/update checks, and
  rollback/release-safety evidence. Local PASS and hosted PASS are reported
  distinctly; neither is inferred. **Explicit exclusion:** no release claim
  before local Tier 3 PASS and human approval, and no additional runtime scope.
  **Dependencies:** 8.1-8.8 complete with unchanged reusable evidence.
  **Preliminary assurance lane:** phase-gate (lean override); the Implement
  engagement owns the cumulative gate, fixes, self-review, reports, release
  execution after approval, and commit. **Validation tier:** Tier 3 phase gate
  plus the approved hosted release evidence.

### Phase Validation Targets

- **Desktop user-facing flows:** At 1280×800, cross representative legacy
  primary/recovery/import fixtures through the one-time reset notice; verify
  only sound/ambience/reduced-motion survive and onboarding replays; verify
  Standard is visibly preselected and accessible; change scenario without
  changing difficulty; create Standard and, in a separate run, Hard; prove each
  choice is immutable; progress representative promotion boundaries through
  department store; buy tier-three equipment; hire/schedule ten staff including
  Manager/Runner; assign all three stations; configure three express drinks;
  run parallel service; resolve an event; inspect the dense hall; close the day;
  reopen difficulty/station/lane-aware history; verify Day-40 victory,
  bankruptcy, and endless unlock fixtures.
- **Touch-mobile user-facing flows:** At exactly 360×780, complete onboarding,
  planning, department service, event, compact/full report, history, records,
  and next-day navigation using touch only. During the densest rush the scene
  and complete dashboard remain together without document scroll, all controls
  are at least 44px, station and express configuration are accessible without
  hover, and activity/stock/report detail remain reachable.
- **WebGL/accessibility/performance flows:** In the automated desktop and exact
  touch-browser projects, validate the complete heritage hall, ten scheduled
  staff, multiple customers/jobs, three stations, both lanes, equipment and
  physical upgrades, warm original low-poly direction, Melbourne heritage
  tiles, timber, brass, escalators, distinct service bays, fixed orthographic
  framing, capped DPR, instancing/LOD, context recovery, pause/speed/reload, at
  least responsive automated mobile behavior, and target 60 FPS desktop.
  Unsupported WebGL2 and reduced-motion fixtures retain accessible explanation
  or complete text parity as applicable. After exact-candidate publication,
  only the owner may record the representative-device 30fps disposition.
- **Reset/difficulty engine targets:** Every supported v1/v2/v3 primary,
  backup/last-known-good, recovery, and imported envelope traverses the same
  allowlisted v4 reset. Exactly sound, ambience, and reduced motion survive;
  active/endless progress, records, achievements, cosmetics, scenarios,
  `GameState.history`, and onboarding completion do not. Recovery cannot
  resurrect any discarded field, and a verified v4 marker prevents repeated
  reset or notice across startup/import/recovery.

  Standard is the accessible, visibly preselected default and is orthogonal to
  scenario. One chosen 1.20-1.25 multiplier applies to both
  aggregate/average-menu-price arrival sensitivity and segment-specific
  per-drink order-choice price sensitivity, with a separate one-factor proof
  for each. Segment appeal, order-choice weather, and every other non-price
  influence stay at today's baseline.

  The typed registry is exhaustive against arrival influences—aggregate/
  average menu price, reputation, street-sign/improvements, dial-in quality,
  bean, weather, venue, scenario, scheduled team/traits/equipment effects,
  queue/wait pressure, availability/stock, and the distinct rush-event
  multiplier—and order-choice influences—segment-specific per-drink price
  sensitivity, segment appeal, and weather. Every entry declares a
  bidirectional, positive-only, or negative-only domain. Hard measures
  1.60-1.75 times today's baseline, never Standard, for every registered
  domain-supported deviation from neutral. Bidirectional fixtures prove neutral,
  both signed directions, clamps, and boundaries; one-sided fixtures prove
  neutral, every supported direction, clamps/boundaries, and that no unsupported
  direction is invented. Any new Phase-8 demand source fails validation until
  its neutral baseline, domain, directions, clamps, boundaries, and matching
  proof are registered. Difficulty records remain separate; shared unlocks are
  economically neutral.

- **Progression/workforce/equipment targets:** VenueId is exhaustive across four
  values; the campaign has exactly 40 days; victory on Day 40 requires the
  department store plus configured cash/reputation; bankruptcy remains a
  day-close boundary. All existing equipment categories support validated
  three-tier progression. Department scheduling accepts ten and rejects eleven;
  Manager/Runner wages, traits, effects, persistence, and reports reconcile.
- **Parallel-service engine targets:** espressoBar, brewBar, and coldBar
  assignments are
  authoritative. Express selection accepts zero to three unique eligible
  active-menu drinks and rejects invalid/fourth entries. Equal-seed concurrent
  service produces stable normal/express queues, service jobs, stock contention,
  activity, cash, satisfaction, reports, and abandonment at all speeds and
  across reload. Every customer/order/job/inventory unit/revenue amount settles
  exactly once; cart/kiosk/cafe retain coherent generalized behavior.
- **Snapshot/report targets:** Canonical activity is bounded and includes
  station/lane identity before multi-customer snapshots are derived. Frozen
  snapshots contain stable bounded customer/staff entities and cannot mutate
  engine state. Hall visuals and accessible text agree with canonical jobs.
  Phase-8 report history persists difficulty, venue, station, lane, staffing,
  stock, and financial causes without recomputation.
- **Balance/content targets:** Multi-seed Day 1-40 simulations demonstrate
  multiple viable Standard and Hard strategies, reachable department promotion,
  fair configured victory, bankruptcy under plausible mismanagement, all new
  events/choices, physical upgrades, cosmetics/shared unlocks, and no economic
  advantage from meta progression. The drink/ingredient inventory remains
  exactly the established set.
- **PWA/release targets:** Production assets and lazy WebGL chunks work at
  /tycoon/ after an online first load, complete offline reload, and a consent-
  based update with an active v4 service. Every Workbox-precache file is under
  1 MB. Lighthouse reaches the profile targets where exposed. After local PASS
  and human approval, the public commit/build is verified on desktop and touch-
  mobile for WebGL2, offline, update, save/reload, and a complete service day.

### Phase Acceptance Criteria

- [ ] The v3 -> v4 boundary is the only breaking boundary. Every supported
      v1/v2/v3 primary, backup, recovery, and imported fixture uses one reset
      path, retains only sound/ambience/reduced-motion, discards all progress,
      records, achievements, cosmetics, scenarios, report history, and
      onboarding completion, then replays onboarding.
- [ ] No legacy recovery path resurrects discarded state, and a verified v4
      marker prevents both a repeated reset and repeated notice across startup,
      backup fallback, recovery, and import.
- [ ] Standard is visibly preselected by default with an accessible description;
      Standard/Hard and scenario are orthogonal controls. Difficulty persists
      immutably in GameState/reports/records, separates records, and shares only
      non-power unlocks.
- [ ] A typed registry maps every current arrival and order-choice demand
      influence named in the Phase-8 Validation Targets to a baseline, neutral,
      bidirectional/positive-only/negative-only domain, supported direction(s),
      signed application, clamp, and engine source; executable exhaustiveness
      checks reject an unregistered current or new Phase-8 source.
- [ ] Separate one-factor tests prove the same chosen Standard multiplier is
      1.20-1.25 times today's baseline for aggregate/average-menu-price arrival
      sensitivity and segment-specific per-drink order-choice price sensitivity.
      Segment appeal, order-choice weather, and every other non-price influence
      remain at today's baseline.
- [ ] Hard is 1.60-1.75 times today's baseline domain-supported neutral
      deviation for every registry entry without compounding on Standard.
- [ ] Bidirectional entries pass neutral, both signed directions, clamp, and
      boundary tests. Positive-only and negative-only entries pass neutral,
      every supported direction, clamp, and boundary tests plus explicit proof
      that no unsupported direction is invented.
- [ ] VenueId supports cart, kiosk, cafe, and department store exhaustively;
      every equipment category supports three validated tiers and a meaningful
      commercial tier-three purchase.
- [ ] A full 40-day campaign requires the department-store hall plus configured
      cash/reputation on Day 40 for victory and retains day-close bankruptcy and
      post-victory endless behavior.
- [ ] Department planning schedules exactly ten staff, rejects an eleventh, and
      makes Manager/Runner hireable with bounded, visible, deterministic wages
      and operational effects.
- [ ] Three station assignments, normal/express queues, and multiple service
      jobs are engine-authoritative; the player can select at most three unique
      eligible existing drinks for express service.
- [ ] Concurrent seeded service consumes inventory and settles customers,
      revenue, wages, satisfaction, activity, and reports exactly once across
      pause/speed/reload; legacy venues remain coherent.
- [ ] Canonical bounded activity carries station/lane identities before
      immutable multi-customer snapshots are created, and the renderer performs
      no simulation, routing, demand, inventory, or accounting.
- [ ] The complete instanced heritage hall renders larger crowds, ten staff,
      three stations, both lanes, tier-three equipment, cosmetics, and physical
      upgrades in the warm, original low-poly classic-tycoon direction, with
      Melbourne heritage tiles, timber, brass, escalators, and three distinct
      service bays, while retaining text/reduced-motion parity and the profiled
      frame budgets.
- [ ] At 360×780, the scene and complete dashboard fit without document scroll,
      and the full department planning/service/report/history flow is keyboard-
      and touch-accessible with 44px controls.
- [ ] Seeded simulations prove complete Standard/Hard Day 1-40 balance, events,
      cosmetics/shared unlocks, physical upgrades, victory, and bankruptcy
      without food, new drinks, or new ingredients.
- [ ] The full runtime installs and reloads offline, defers updates during active
      play, honors /tycoon/, keeps every Workbox-precache file below 1 MB, and
      meets Lighthouse and WebGL performance targets.
- [ ] Component 8.9 records the unchanged cumulative Tier 3 local PASS, human
      publication approval, exact hosted commit/build identity, and passing
      desktop/touch-mobile/WebGL2/offline/update release evidence before the
      final release is declared complete.

### Phase Risks and Mitigations

| Risk                                                                                                                          | Impact                                                          | Mitigation                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy backup/recovery/import resurrects discarded state or repeats the reset                                                 | Trust loss, hidden cross-version advantage, or onboarding loop  | One allowlisted v1/v2/v3 normalization path, exact three-preference copy, verified v4 marker, quarantine of legacy recovery candidates, and primary/backup/recovery/import fixtures                                                          |
| Registry misses an influence/domain, Standard changes only one price path, or difficulty compounds/clamps/couples to scenario | Standard or Hard becomes unfair and balance evidence is invalid | Engine-registry exhaustiveness, separate Standard arrival/order-choice price proofs, typed factor domains, bidirectional supported-sign tests, one-sided no-invented-direction tests, clamps/boundaries, visible rules, and seeded campaigns |
| Four venues/three equipment tiers leave stale exhaustive assumptions                                                          | Runtime crash or inaccessible progression                       | Compiler-exhaustive VenueId handling, data-driven tier validation, migration fixtures, exhaustive UI/engine/renderer tests                                                                                                                   |
| Ten staff and parallel jobs introduce nondeterministic races or double settlement                                             | Inventory/cash/report corruption                                | Pure stable ordering, station-scoped job IDs, explicit reservations, exact-once invariants, speed/reload equality, and frozen snapshots                                                                                                      |
| Express routing starves normal customers or bypasses eligibility                                                              | One dominant strategy and confusing service                     | Bounded fair queue policy, typed eligibility, zero-to-three validation, abandonment/satisfaction simulations, and causal report explanations                                                                                                 |
| Dense hall exceeds mobile/WebGL/offline budgets                                                                               | Final tier becomes unplayable                                   | Bounded crowds, instancing, LOD, capped DPR, orthographic camera, lazy chunks, 1 MB assertions, automated exact-touch/Lighthouse evidence, and owner-led FPS follow-up against the exact hosted candidate                                    |
| Forty-day economy is unwinnable or trivial on either difficulty                                                               | Core campaign goal fails                                        | Typed tunables, multi-seed multiple-strategy scripts, promotion/Day-40 boundary fixtures, sensitivity checks, and no hidden meta bonuses                                                                                                     |
| PWA update or Pages publication strands v4 saves                                                                              | Hosted release loses progress or fails offline                  | Consent-based update, last-known-good persistence, offline/subpath automation, explicit release identity, hosted smoke, and superseding-build rollback procedure                                                                             |

---

## Requirements-to-Component Traceability

| Requirement area                                                                                                                                                                  | Delivering component(s)                | Validation evidence                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approved-plan implementation entry contract                                                                                                                                       | Pre-7.1 coordinator gate               | Both phase breakdowns exist, preserve file ownership/acceptance/dependencies/Technical Validation/lane/tier, and mark every component `Spec-Validated` before Implement begins                                                                                                                                                                                        |
| Single-player browser game; no accounts/backend/runtime services                                                                                                                  | 1.2, 3.4                               | Phase 1 real-stack flow; Phase 3 network/dependency review                                                                                                                                                                                                                                                                                                            |
| Plan -> rush -> report -> reinvest daily loop                                                                                                                                     | 1.2                                    | Phase 1 desktop/mobile complete-day flows                                                                                                                                                                                                                                                                                                                             |
| Seeded campaign and pure deterministic commands/state                                                                                                                             | 1.2, 2.2, 2.4                          | Seed equality, speed independence, full-campaign simulations                                                                                                                                                                                                                                                                                                          |
| 60-90 second rush, pause, 1x/2x/4x, automatic service, 0-2 choices                                                                                                                | 1.2, 2.2                               | Rush controls and seeded event Playwright/engine tests                                                                                                                                                                                                                                                                                                                |
| Ten drinks, recipes, sizes, dairy/oat/soy, ingredients, beans, dial-in; no Phase-8 menu expansion                                                                                 | 2.2, 8.7                               | Exhaustive recipe/material tests, operations flows, and final content-inventory assertion                                                                                                                                                                                                                                                                             |
| Demand factors and four readable customer segments                                                                                                                                | 2.2, 8.2, 8.7                          | One-factor direction/multiplier tests, causal UI/report assertions, and campaign balance                                                                                                                                                                                                                                                                              |
| Staff roles, stats, traits, rotating hire pool, daily scheduling                                                                                                                  | 2.3, 8.4                               | Hiring/scheduling/payroll/effect tests including Manager/Runner and ten-person bounds                                                                                                                                                                                                                                                                                 |
| Required equipment and economic/operational effects                                                                                                                               | 2.3, 8.3                               | Per-equipment day simulations, three-tier category validation, and upgrade UI/scene tests                                                                                                                                                                                                                                                                             |
| Cart -> kiosk -> cafe capacity, demand, equipment, and visuals; department-store extension                                                                                        | 2.3, 3.2, 8.3, 8.6                     | Promotion flows, four-value state tests, and scene assertions                                                                                                                                                                                                                                                                                                         |
| Configured Day 30 victory and day-close overdraft bankruptcy; v4 Day-40 replacement                                                                                               | 2.4, 8.3, 8.7                          | Boundary tests, near-ending UI flows, and full Day 1-30/Day 1-40 campaigns                                                                                                                                                                                                                                                                                            |
| Endless unlock; achievements/cosmetics/records/scenarios; no power bonus                                                                                                          | 2.4, 8.2, 8.7                          | Meta-persistence, difficulty partition/shared unlocks, and fresh-run economy tests                                                                                                                                                                                                                                                                                    |
| Responsive desktop/mobile management; Canvas through Phase 6 and fixed-isometric WebGL from Phase 7                                                                               | 1.2, 1.3, 3.2, 3.3, 7.2, 7.3, 7.4      | 360px touch and desktop flows; three-venue scene/layout and immutable-snapshot tests                                                                                                                                                                                                                                                                                  |
| Original cohesive visual/audio direction, including warm low-poly classic-tycoon worlds, unchanged laneway title asset, and heritage-hall motifs                                  | 3.2, 7.2, 7.3, 8.6                     | Asset hash/provenance, unchanged `public/assets/art/laneway-title.webp`, three/four-venue scene assertions, tiles/timber/brass/escalator/service-bay inspection, ambience and consent tests                                                                                                                                                                           |
| Keyboard, 44px touch, reduced motion, colour-safe/text summaries                                                                                                                  | 3.3, 7.4, 8.6                          | RTL semantics/focus tests, reduced-motion snapshot parity, and desktop/touch Playwright flows                                                                                                                                                                                                                                                                         |
| Autosave active run/preferences/records/unlocks safely during service                                                                                                             | 1.2, 1.3, 2.4, 7.5, 8.2, 8.5           | Phase reloads, exact-once close, report history, v4 and parallel-job state round trips                                                                                                                                                                                                                                                                                |
| Version/migrate saves; export/import; corrupt/incompatible recovery                                                                                                               | 2.4, 7.5, 8.2                          | Legacy/additive/breaking migration fixtures and transfer/recovery/reset Playwright flows                                                                                                                                                                                                                                                                              |
| Installable complete offline runtime and consent-based safe updates                                                                                                               | 3.4, 8.8, 8.9                          | Offline/relaunch/update Playwright flow for final lazy WebGL runtime and hosted Pages build                                                                                                                                                                                                                                                                           |
| Public types and campaign/day/endless engine boundaries                                                                                                                           | 1.2, 2.2, 2.3, 2.4, 8.2, 8.3, 8.4, 8.5 | Tests consume public exports; v4 difficulty/venue/staff/station/queue/job contracts are exhaustive                                                                                                                                                                                                                                                                    |
| Typed configurable tuning and balanced viable strategies                                                                                                                          | 2.2, 2.4, 8.2, 8.7                     | Validated content, one-factor difficulty proofs, and multi-seed Day 1-40 simulations                                                                                                                                                                                                                                                                                  |
| Security/privacy: bounded input, no secrets/telemetry/personal data                                                                                                               | 2.4, 3.4, 8.2, 8.8                     | Adversarial import/reset tests and final release network/config/dependency review                                                                                                                                                                                                                                                                                     |
| GitHub Pages `/tycoon/`, README/contribution, MIT, public repository                                                                                                              | 3.1, 3.4, 3.5, 8.8, 8.9                | Local subpath plus final hosted desktop/touch/WebGL/offline release checks                                                                                                                                                                                                                                                                                            |
| Desktop/mobile, accessibility, performance, offline, and cumulative QA                                                                                                            | 1.4, 2.5, 3.5, 7.6, 8.9                | PASS automated phase reports, exact tier sequences, exact hosted release identity, and separately recorded owner-led device inspection                                                                                                                                                                                                                                |
| Exact non-editable planner price/supply steppers and persistence                                                                                                                  | 4.2                                    | Relative-command unit/RTL tests and desktop/360px Playwright bounds/reload flows                                                                                                                                                                                                                                                                                      |
| Amended base price, modifier charges, revenue, and cash reconciliation                                                                                                            | 4.3                                    | Per-sale engine invariants and single-drink production Playwright report flow                                                                                                                                                                                                                                                                                         |
| Dated inventory, LIFO, expiry, refrigeration, and schema-v3 migration                                                                                                             | 5.2                                    | Multi-age conservation/migration tests and multi-day reload/import flows                                                                                                                                                                                                                                                                                              |
| Weighted serves estimate, live stock, and expiry reporting                                                                                                                        | 5.3, 5.4                               | One-factor estimate tests and desktop/mobile planner-rush-report flows                                                                                                                                                                                                                                                                                                |
| Deterministic rush activity and expressive reduced-motion parity                                                                                                                  | 6.2, 6.3                               | Stream equality/reload tests and desktop/mobile Canvas/text journeys                                                                                                                                                                                                                                                                                                  |
| Campaign-wide non-repeating displayed staff names                                                                                                                                 | 6.4                                    | Pool exhaustion, long/endless, reload/import, and fresh-run tests                                                                                                                                                                                                                                                                                                     |
| Snapshot-only Three.js/React Three Fiber architecture, official-source verification, and lazy chunks under Workbox's 1 MB/file ceiling                                            | 7.2, 7.6, 8.8, 8.9                     | Dependency record; mutation/equality tests; bundle/precache manifest assertions; cumulative release gate                                                                                                                                                                                                                                                              |
| Complete cart, kiosk, and cafe fixed-isometric service worlds with no final Canvas path                                                                                           | 7.2, 7.3                               | The 7.2 kiosk/cafe Canvas bridge is phase-branch-only and non-releasable; 7.3 removes it and VenueId-exhaustive tests prove final WebGL-only service                                                                                                                                                                                                                  |
| WebGL2 requirement, accessible unsupported handling, orthographic/instanced/capped-DPR rendering, and reduced-motion/text parity                                                  | 7.2, 7.3, 7.6                          | Capability/context fixtures, reduced-motion equality, desktop/exact-touch renderer inspection, and a pending owner-led hosted-device check                                                                                                                                                                                                                            |
| Service-only immersion; full-width morning planning with no preview scene; scene -> dashboard -> activity -> stock; 360×780 no-scroll scene/dashboard                             | 7.4                                    | Desktop/touch geometry, absence-of-preview, focus, keyboard, touch, and exact 360×780 Playwright assertions                                                                                                                                                                                                                                                           |
| Compact completion, exact-once `Settle & reinvest`, and truthful reopened reports from existing history                                                                           | 7.5, 8.7                               | Reports in Game menu; bounded `GameState.history`; selected `DayReport` sole input; post-7.5 charge parity; Phase-6/v3 stored-field rendering plus accessible older-report charge-unavailable state; no reconstruction/current-rush read; reload/export/import proof                                                                                                  |
| v3 -> v4 preferences-only reset boundary with complete supported-legacy coverage and onboarding replay                                                                            | 8.2                                    | v1/v2/v3 primary, backup, recovery, and imported fixtures share one three-preference allowlist; resurrection/repeat-reset tests prove verified-v4 idempotence                                                                                                                                                                                                         |
| Immutable Standard/Hard selection, Standard preselected/accessibly described, scenario orthogonality, separate records, shared non-power unlocks                                  | 8.2, 8.7                               | Campaign-creation/round-trip UI, independent scenario/difficulty changes, immutable command rejection, record partition, and unlock-neutrality tests                                                                                                                                                                                                                  |
| Exhaustive typed baseline/domain registry for every current and new Phase-8 arrival/order-choice demand influence                                                                 | 8.2                                    | Technical Validation separately registers aggregate/average-menu-price arrival and segment-specific per-drink order-choice price, plus reputation, improvements, dial-in, bean, weather, venue, scenario, team/traits/equipment, queue/wait, stock, rush-event multiplier, segment appeal, and order-choice weather; new sources fail until domain/proof registration |
| Standard applies one +20-25% multiplier to both registered price paths with all non-price influences baseline; Hard covers every registry domain at +60-75% over today's baseline | 8.2, 8.7                               | Separate Standard price-path proofs; bidirectional neutral/both-sign/clamp/boundary tests; one-sided neutral/every-supported-direction/clamp/boundary/no-invented-direction tests; no Standard compounding/scenario coupling; multi-seed balance                                                                                                                      |
| Forty-day cart -> kiosk -> cafe -> department-store progression and Day-40 victory                                                                                                | 8.3, 8.7                               | Four-VenueId exhaustiveness, promotion/boundary fixtures, complete seeded campaigns, victory/bankruptcy/endless flows                                                                                                                                                                                                                                                 |
| Equipment generalized from two to three tiers with commercial final equipment                                                                                                     | 8.3                                    | Category-exhaustive content validation, purchase/effect/persistence tests, and planner/scene assertions                                                                                                                                                                                                                                                               |
| Department roster/schedule limits, ten scheduled staff, Manager and Runner                                                                                                        | 8.4                                    | Ten/eleven boundary, hiring/payroll/effect/name/persistence/report tests                                                                                                                                                                                                                                                                                              |
| Three authoritative station assignments, normal/express queues, multiple service jobs, and up to three eligible express drinks                                                    | 8.5                                    | Assignment/eligibility bounds, seeded concurrency, stock contention, fairness, reload, and exact-once settlement tests                                                                                                                                                                                                                                                |
| Station/lane identities in bounded canonical activity and immutable multi-customer snapshots                                                                                      | 8.5, 8.6                               | Activity schema bounds, frozen snapshot/mutation tests, equal-seed WebGL/text parity, and dense hall inspection                                                                                                                                                                                                                                                       |
| Complete Melbourne-heritage hall, larger crowds, events, cosmetics, physical upgrades, and station-aware report history                                                           | 8.6, 8.7                               | Warm low-poly hall inspection proves heritage tiles, timber, brass, escalators, distinct service bays, content/visible effects, event choices, unlock neutrality, report round trips, and full campaigns                                                                                                                                                              |
| Final PWA/offline/update, performance, Lighthouse, and hosted release                                                                                                             | 8.8, 8.9                               | Offline/update/subpath automation, per-file cache ceiling, FPS/Lighthouse evidence, and public build verification                                                                                                                                                                                                                                                     |
| Explicit non-goals retained through the expansion                                                                                                                                 | 1.2, 2.3, 2.4, 3.4, 7.2, 8.3, 8.5, 8.7 | Scope self-review confirms no food/new drinks/new ingredients, manual making, weekly rosters, multiple locations, accounts, multiplayer, localization, paid content, analytics, or runtime live services                                                                                                                                                              |

## Cross-Cutting Concerns

### Testing Strategy

- **Validation tiers:** A Next-Level runtime component uses Tier 2 once for its
  final scoped fingerprint: `pnpm build`, `pnpm lint`, `pnpm test`, then
  the two retained profiled Playwright smoke journeys or approved exact narrower
  real-browser specs. Components 7.1 and 8.1 use targeted documentary proof.
  Components 7.6 and 8.9 alone run Tier 3 once for the final global fingerprint,
  exactly: frozen install, build, lint, unit suite, and complete E2E suite.
  Passing unchanged evidence is reused; a later phase gate remains cumulative.
- **E2E:** Playwright uses desktop Chromium and representative touch-mobile
  projects. The enduring scenarios are complete day, responsive touch day,
  autosave/reload, strategic progression, victory/endless, bankruptcy,
  transfer/recovery, accessible/reduced-motion play, offline/update, and Pages
  subpath, followed by exact planning, stock-lifecycle, and living-rush/name
  journeys. Phase 7 adds three-venue WebGL2/capability/context, exact 360×780
  service composition, full-width no-preview planning, and Game-menu report
  history/settlement journeys. Phase 8 adds v1/v2/v3 primary/backup/recovery/
  import reset paths, accessible default/orthogonal difficulty, four-tier/
  40-day progression, ten-person planning, station/express/parallel service,
  dense hall, final offline/update, and hosted release journeys. Scenarios are
  introduced with behavior and never removed.
- **Unit/component:** Vitest proves pure-engine calculations, deterministic
  behavior, balance, persistence, migrations, and edge conditions. React
  Testing Library proves controls, explanations, reports, dialogs, recovery,
  accessibility, WebGL capability messaging, difficulty selection, station/
  express planning, and history. Report tests make selected `DayReport` the
  sole input, prove post-7.5 charge parity, require the accessible older-report
  charge-unavailable state for Phase-6/v3 history, and forbid reconstruction,
  inference, or current-rush reads for historical views. Demand tests
  compare an exhaustive typed registry to every arrival/order-choice engine
  influence, require an explicit factor domain, and reject new unregistered
  Phase-8 sources. Domain-aware fixtures exercise all and only supported
  directions plus clamps/boundaries. Frozen snapshot tests prove rendering
  cannot mutate the engine. Tests use public exports; no coverage percentage
  gate is added.
- **Balance:** Existing deterministic Day 1-30 scripts remain regression proof.
  Phase 8 adds scripted Day 1-40 Standard/Hard campaigns over multiple seeds,
  separate Standard aggregate-arrival and per-drink order-choice price proofs,
  registry-exhaustive domain-aware direction/clamp/boundary measurements,
  parallel-service invariants, victory, bankruptcy, and distinct viable
  strategies. Standard applies the same approved multiplier to both price paths
  and keeps segment appeal, order-choice weather, and every other non-price
  influence at today's baseline. Hard applies its approved range to every
  registered domain-supported neutral deviation versus today's baseline. All
  tuning resides in typed configuration rather than tests, renderers, or hidden
  UI constants.
- **Performance:** Simulation ticks and canonical activity remain independent
  of animation frames. WebGL gates inspect immutable bounded snapshots,
  instancing, orthographic framing, capped DPR, context handling, lazy chunks,
  the 1 MB/file Workbox ceiling, exact 360×780 layout, at least responsive
  30-FPS dense mobile play, target 60-FPS desktop play, and the profiled
  Lighthouse targets without weakening reduced-motion/text parity.
- **Security/privacy:** Imported JSON is schema-validated and bounded; unknown
  versions fail safely. Every supported v1/v2/v3 primary, backup, recovery, and
  import source crosses the same v4 allowlist for sound, ambience, and reduced
  motion only. A verified v4 marker blocks legacy recovery resurrection and
  repeated reset/notice; no imported content is executable. Final release
  evidence confirms no backend, secret, analytics, ad, personal-data, remote
  asset, or runtime external request.

### Documentation Requirements

- After plan approval and before Component 7.1, the coordinator creates
  `docs/phase-7-component-breakdown.md` and
  `docs/phase-8-component-breakdown.md` as faithful materializations of this
  plan. They include component file ownership, acceptance mapping, dependencies,
  Technical Validation, approved assurance lane/tier, and `Spec-Validated`
  status. They require no second planning approval and may not introduce,
  remove, or authorize runtime scope.
- The sole Implement engagement maintains one component overview manifest per
  component, phase implementation context, `docs/phase-X-test-report.md`, and
  the agent runbook. Evidence records exact commands, environment/project,
  duration, result, scoped or global fingerprint, fixtures, and any genuine
  blocker without unverifiable claims.
- Component 7.6 plans reconciliation of stale Canvas guidance. Component 8.9
  completes reconciliation of stale 30-day, Canvas, single-difficulty,
  three-venue, two-tier/two-role/single-service guidance in
  `docs/brief.md`, `docs/requirements.md`, `docs/solution-design.md`,
  README, and the runbook before public release; this plan does not pre-edit
  those owner documents.
- Public TypeScript functions, classes, and modules use TSDoc; strict typing
  avoids `any`; configuration is centralized and typed; ESLint/Prettier and the
  applicable TypeScript standards govern source.
- Phase 3 owns player/developer README content, contribution steps, MIT license,
  architecture/validation summary, save/offline privacy notes, and public
  release instructions. No public API document is required because the game
  exposes no service API.

### Quality Gates

- Next-Level implementation entry is closed until the coordinator has
  materialized both approved breakdown documents with every component
  `Spec-Validated`; this administrative proof is reused and does not authorize
  source work or require another human approval.
- A component is complete only when its full runtime outcome, production wiring,
  essential tests, and self-review are complete; documentation or lint work may
  not replace required behavior or correctness.
- A phase is complete only when its final component exercises every named user
  flow and critical engine/persistence target, the cumulative exact validation
  sequence passes, and its phase test report records PASS.
- The same sequential Implement engagement diagnoses, fixes, self-reviews,
  validates, documents, and commits before reporting; the lean override assigns
  no separate task-agent engagement.
- Every Next-Level runtime component is `fast (lean override)` with Tier 2
  despite its recorded standard trigger classifications. Phase-final
  components are `phase-gate (lean override)` with Tier 3. A lane may not be
  silently downgraded and the final component may not omit a named target.
- No high/critical dependency or input-handling vulnerability, save corruption,
  deterministic mismatch, or regression against profile performance budgets may
  pass a phase gate.

### Delivery & Environments

- The approved Next-Level plan does not hand source work directly to Implement.
  The coordinator first materializes both required `Spec-Validated` breakdown
  documents without another approval cycle; only then may the sequential
  Implement engagement enter Component 7.1. Materialization changes planning
  artifacts only and grants no gameplay-change authority beyond the approved
  component specifications.
- Use one branch per phase, `phase-1` through `phase-8`. Component commits follow
  `feat(phase-X): Component X.Y — <name>`. Never commit directly to protected
  `main`; a human approves each merge after its PASS report.
- Each later phase may branch from its predecessor's validated PASS head before
  the earlier human merge, as allowed by the profile. No environment or secret
  file is required.
- Phases 1-2 validate through local dev/production preview. Phase 3 promotes the
  same static build through GitHub Actions to GitHub Pages after the Component
  3.1 public gate. The service worker/update prompt and versioned save migration
  are the release-safety and rollback protections; a bad publication is stopped
  or superseded through the Pages workflow without discarding local saves.
- Phases 4–5 validate locally on their phase branches. Phase 6 repeats hosted
  verification after its human-approved merge. Phase 7 first records automated
  local PASS, then leaves merge, publication, and owner-led physical validation
  of the exact hosted candidate as a separate approved handoff. Phase 8 first
  records cumulative local PASS, then awaits explicit merge/publication
  approval, deploys the exact approved build, and records hosted desktop/touch-
  mobile/WebGL2/offline/update evidence separately.
- Release safety is save-version aware: Phase 7 preserves v3; Phase 8 performs
  its one-time allowlisted v4 reset for every supported v1/v2/v3 primary,
  backup, recovery, and imported envelope before new play, keeps last-known-good
  writes, defers service-worker activation during active play, and can
  supersede a bad Pages publication without discarding a valid v4 local save.

## Dependencies & External Factors

### External Dependencies

| Dependency                                                               | Needed                                                 | Risk if delayed                                                              | Mitigation/owner                                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 22.12+, pnpm 10, compatible pinned frontend/test packages           | Phase 1 onward                                         | Build or browser incompatibility                                             | Implement agent pins the lockfile and validates Vite modern-browser/Safari 16.4+ baseline                                                                         |
| Three.js, React Three Fiber, WebGL2, and Workbox-compatible lazy bundles | Phase 7 onward                                         | Service world cannot ship reliably or offline                                | Implement re-verifies official compatibility/licensing/bundling sources before each dependency/config lock, pins versions, and retains capability/bundle fixtures |
| Representative mid-tier WebGL2 touch device                              | Post-gate hosted checks after Components 7.6 and 8.9   | Dense mobile GPU behavior cannot be claimed until a real hosted check occurs | Human validates only the exact approved candidate at the existing public URL and records device/browser/FPS evidence; agents do not access the device             |
| GitHub Actions and Pages                                                 | Phase 3, Phase 6, and final Component 8.9 hosted gates | Public URL cannot be verified                                                | Keep local production proof cumulative; human approves release before hosted claims                                                                               |
| Human phase merge and final publication approval                         | Components 7.1 and 8.1; each additive phase after PASS | Merge/public release remains blocked                                         | Isolate every human task in X.1, report local PASS separately, and never infer merge/publication or hosted PASS                                                   |

### Technical Risks

| Risk                                                                                                                        | Impact | Likelihood | Mitigation Strategy                                                                                                                                                                                                                               | Owner                                 |
| --------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Economy cannot produce fair victory and bankruptcy paths                                                                    | High   | Medium     | Typed tuning, one-factor tests, multi-seed complete campaigns, explicit boundary cases                                                                                                                                                            | Implement agent                       |
| Engine outcome couples to Canvas frame timing or speed                                                                      | High   | Medium     | Pure tick commands, immutable snapshots, seeded PRNG state, speed-independence tests from Phase 1                                                                                                                                                 | Implement agent                       |
| Mobile planner becomes dense or blocks actions                                                                              | High   | Medium     | 360px baseline, progressive tab disclosure, touch E2E in every phase                                                                                                                                                                              | Implement agent                       |
| Save/update incompatibility loses a campaign                                                                                | High   | Medium     | Versioned envelope, last-known-good writes, idempotent settlement, migrations, deferred updates, adversarial tests                                                                                                                                | Implement agent                       |
| PWA serves stale or broken `/tycoon/` assets                                                                                | High   | Medium     | Local subpath preview, explicit update prompt, cache-completeness tests, hosted refresh/offline checks                                                                                                                                            | Implement agent                       |
| Pixel/audio assets breach size, consistency, or provenance goals                                                            | Medium | Medium     | Constrained palette/logical resolution, optimized sprite sheets/audio, provenance inventory, Lighthouse/bundle checks                                                                                                                             | Implement agent                       |
| Planner activations display one value but persist or charge another                                                         | High   | Medium     | Integer relative commands, immediate autosave, bounded steppers, observable actual charges, full-path reconciliation tests                                                                                                                        | Implement agent                       |
| Batch aging/migration creates, loses, or double-consumes stock                                                              | High   | Medium     | Bounded schema-v3 migration, LIFO/expiry invariants, multi-day conservation and recovery fixtures                                                                                                                                                 | Implement agent                       |
| Rush animation diverges from deterministic outcomes or staff names repeat                                                   | High   | Medium     | Canonical bounded activity/name state, renderer-only consumption, equal-seed/reload/exhaustion tests                                                                                                                                              | Implement agent                       |
| WebGL renderer changes simulation or exceeds mobile/cache limits                                                            | High   | Medium     | Frozen bounded snapshots, dependency rules, instancing, orthographic camera, capped DPR, lazy chunks, 1 MB/file assertions, exact-viewport browser proof, and owner-led hosted-device follow-up                                                   | Implement agent plus repository owner |
| Legacy save/recovery path repeats the v4 reset or resurrects discarded progress/meta/history                                | High   | Low        | One v1/v2/v3 primary/backup/recovery/import normalizer, sound/ambience/reduced-motion allowlist, verified v4 marker, legacy recovery quarantine, and resurrection fixtures                                                                        | Implement agent                       |
| Demand registry omits an influence/domain, Standard misses a price path, or difficulty compounds/couples/clamps incorrectly | High   | Medium     | Engine-registry exhaustiveness, Standard default/orthogonality, separate aggregate-arrival and per-drink order-choice price proofs, domain-aware supported-direction/no-invention tests, clamps/boundaries, visible rules, and multi-seed balance | Implement agent                       |
| Four-tier progression leaves two-tier/three-venue assumptions                                                               | High   | Medium     | Exhaustive VenueId compilation, data-driven tier validators, full category fixtures, and cumulative campaign/renderer tests                                                                                                                       | Implement agent                       |
| Parallel stations double-consume stock or settle revenue twice                                                              | High   | Medium     | Stable seeded ordering, station/job identities, explicit reservations, exact-once invariants, and pause/speed/reload equality                                                                                                                     | Implement agent                       |
| Department campaign is unbalanced or dense hall is unplayable                                                               | High   | Medium     | Day 1-40 multi-strategy simulations, bounded crowds, instancing/LOD/capped DPR, 30/60-FPS evidence, and full 360×780 flow                                                                                                                         | Implement agent                       |
| Hosted PWA update loses v4 state or serves a partial WebGL graph                                                            | High   | Medium     | Consent-based activation, last-known-good state, complete offline manifest tests, exact build identity, hosted offline/update smoke, and superseding-build rollback                                                                               | Implement agent                       |

## Change Management

1. Record any requested change and its authority.
2. Assess affected component outcomes, dependencies, validation targets, and
   traceability rows before implementation changes.
3. Preserve the approved eight-phase structure unless the user explicitly
   replaces it; do not silently defer required behavior.
4. Add approved changes to the amendment log and notify the sole Implement
   agent before the affected component begins or resumes.

### Amendment Log

| Date       | Phase/Component                            | Change                              | Reason                                                                                                                                                            | Impact                                                                                                                                                                                 |
| ---------- | ------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-18 | All                                        | Initial three-phase lean plan       | User-approved delivery structure and sole-Implement override                                                                                                      | Establishes 14 components and cumulative gates                                                                                                                                         |
| 2026-07-18 | Phases 4–6                                 | Additive feedback plan              | User approved exact planning, stock lifecycle/intelligence, living rush, and unique names under the same lean override                                            | Adds 14 components and extends cumulative gates to six phases                                                                                                                          |
| 2026-08-08 | Phases 7–8                                 | Next-Level Evolution additive plan  | User directed an approval-ready WebGL service-world bridge followed by one breaking 40-day department-store campaign contract under the lean two-role restriction | Adds 15 components, one v3-to-v4 preferences-only reset, cumulative WebGL/engine/PWA gates, and final hosted release evidence                                                          |
| 2026-08-08 | Entry gate; 7.2–7.5; 8.2; 8.6; phase gates | Approval-gate precision revision    | Approval review required materialized specs, exhaustive difficulty/reset proof, canonical report history, and fixed presentation decisions                        | Preserves 8 phases/43 components while making implementation entry, legacy reset, demand registry, Canvas bridge removal, report settlement/history, and visual acceptance executable  |
| 2026-08-08 | 7.5; 8.2; phase gates and traceability     | Final price-domain/report precision | Approval review separated Standard's two price paths, made factor proof domain-aware, and bounded legacy charge-report expectations                               | Preserves 8 phases/43 components while adding separate Standard price proofs, no-invented-direction rules, post-7.5 charge parity, and explicit Phase-6/v3 charge-unavailable handling |

## Approval

- [x] Human accepted and released the original Phases 1–3 plan.
- [x] Human accepted additive Phases 4–6 and authorized the sole Implement
      agent to begin Component 4.1 on `phase-4`.
- [x] Human approved additive Phases 7–8 on 2026-08-08 and authorized immediate
      implementation. The coordinator must materialize both required
      `Spec-Validated` component breakdowns without further approval; only after
      that administrative gate may the sole sequential Implement engagement
      begin Component 7.1 on `phase-7`.
