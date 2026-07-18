# Phase Plan: Laneway Tycoon

## Overview

Delivery is divided into exactly three cumulative, demonstrable phases. Phase 1
is the walking skeleton: one real cart-day loop through the production React,
Canvas, deterministic-engine, and browser-persistence boundaries. Phase 2
completes the strategy game and campaign. Phase 3 replaces functional
presentation with release-quality presentation, makes the complete runtime an
offline-safe PWA, and prepares and validates public GitHub Pages delivery.

Every implementation component is a vertical slice with a user-visible runtime
outcome, production wiring, persistence where its outcome changes durable state,
and essential tests. Infrastructure is introduced only by the first slice that
uses it. Phase validation is cumulative: a later phase must retain all earlier
behavior and pass the complete validation sequence.

### Lean execution contract

- One `implement` agent delivers every component in sequence. That same agent
  owns source, tests, fixes, self-review, the exact validation sequence, phase
  test reports, implementation context, and runbook updates. No Tech Lead,
  Test, Debug, Review, Phase Docs, or other task-agent role participates.
- The Implement agent must not silently reduce observable scope to fit an
  engagement. If a component proves too large, it remains the same component
  and is completed in sequential internal passes; required behavior is not
  moved to an unnamed future task.
- Each component is committed to its phase branch only after its primary paths
  pass. A phase ends only when its final validation component records PASS and
  the human approves the merge under the repository workflow contract.

## Summary

- **Number of phases:** 3
- **Number of components:** 14
- **Delivery sequence:** Playable Cart -> Complete Campaign -> Production Finish
- **Critical path:** 1.2 -> 1.3 -> 1.4 -> 2.2 -> 2.3 -> 2.4 -> 2.5 ->
  3.2/3.3/3.4 -> 3.5

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

## Requirements-to-Component Traceability

| Requirement area | Delivering component(s) | Validation evidence |
|---|---|---|
| Single-player browser game; no accounts/backend/runtime services | 1.2, 3.4 | Phase 1 real-stack flow; Phase 3 network/dependency review |
| Plan -> rush -> report -> reinvest daily loop | 1.2 | Phase 1 desktop/mobile complete-day flows |
| Seeded campaign and pure deterministic commands/state | 1.2, 2.2, 2.4 | Seed equality, speed independence, full-campaign simulations |
| 60-90 second rush, pause, 1x/2x/4x, automatic service, 0-2 choices | 1.2, 2.2 | Rush controls and seeded event Playwright/engine tests |
| Ten drinks, recipes, sizes, dairy/oat/soy, ingredients, beans, dial-in | 2.2 | Exhaustive recipe/material tests and operations flows |
| Demand factors and four readable customer segments | 2.2 | One-factor direction tests and causal UI/report assertions |
| Staff roles, stats, traits, rotating hire pool, daily scheduling | 2.3 | Hiring/scheduling/payroll/effect tests |
| Required equipment and economic/operational effects | 2.3 | Per-equipment day simulations and upgrade UI tests |
| Cart -> kiosk -> cafe capacity, demand, equipment, and visuals | 2.3, 3.2 | Promotion flows, state tests, scene assertions |
| Configured Day 30 victory and day-close overdraft bankruptcy | 2.4 | Boundary tests, near-ending UI flows, full campaigns |
| Endless unlock; achievements/cosmetics/records/scenarios; no power bonus | 2.4 | Meta-persistence and fresh-run economy tests |
| Responsive desktop/mobile management and Canvas presentation | 1.2, 1.3, 3.2, 3.3 | 360px touch and desktop flows; scene/layout tests |
| Original cohesive pixel art and optional local audio | 3.2 | Asset inventory/provenance, scene and consent tests |
| Keyboard, 44px touch, reduced motion, colour-safe/text summaries | 3.3 | RTL semantics/focus tests and dedicated Playwright flow |
| Autosave active run/preferences/records/unlocks safely during service | 1.2, 1.3, 2.4 | Phase reloads, exact-once close, expanded state round trips |
| Version/migrate saves; export/import; corrupt/incompatible recovery | 2.4 | Migration fixtures and transfer/recovery Playwright flows |
| Installable complete offline runtime and consent-based safe updates | 3.4 | Offline/relaunch/update Playwright flow |
| Public types and campaign/day/endless engine boundaries | 1.2, 2.2, 2.3, 2.4 | Tests consume public exports only |
| Typed configurable tuning and balanced viable strategies | 2.2, 2.4 | Validated content and multi-seed full-campaign simulations |
| Security/privacy: bounded input, no secrets/telemetry/personal data | 2.4, 3.4 | Adversarial import tests and release network/config review |
| GitHub Pages `/tycoon/`, README/contribution, MIT, public repository | 3.1, 3.4, 3.5 | Local subpath plus confirmed hosted release checks |
| Desktop/mobile, accessibility, performance, offline, and cumulative QA | 1.4, 2.5, 3.5 | PASS phase reports and exact validation sequence |
| Explicit v1 non-goals | 1.2, 2.3, 2.4, 3.4 | Scope self-review confirms no food, manual making, weekly rosters, multiple locations, accounts, multiplayer, localization, paid content, analytics, or live services |

## Cross-Cutting Concerns

### Testing Strategy

- **Validation sequence:** For every component and phase gate, run exactly and
  in order: `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`,
  `pnpm test`, `pnpm test:e2e`. A later phase runs the cumulative suite.
- **E2E:** Playwright uses desktop Chromium and representative touch-mobile
  projects. The enduring scenarios are complete day, responsive touch day,
  autosave/reload, strategic progression, victory/endless, bankruptcy,
  transfer/recovery, accessible/reduced-motion play, offline/update, and Pages
  subpath. They are introduced in the phase that first delivers the behavior
  and never removed later.
- **Unit/component:** Vitest proves pure-engine calculations, deterministic
  behavior, balance, persistence, migrations, and edge conditions. React
  Testing Library proves controls, explanations, reports, dialogs, recovery,
  and accessibility. Tests use public exports; no coverage percentage gate is
  added.
- **Balance:** Deterministic scripted Day 1-30 campaigns across multiple seeds
  cover victory, bankruptcy, and distinct viable strategies. All tuning resides
  in typed configuration rather than hidden test or UI constants.
- **Performance:** Simulation ticks remain independent of animation frames.
  Phase 3 validates responsive mobile rush behavior, asset size, reduced motion,
  360px layout, and Lighthouse thresholds from the project profile.
- **Security/privacy:** Imported JSON is schema-validated and bounded; unknown
  versions fail safely; no imported content is executable. Release review
  confirms no backend, secret, analytics, ad, personal-data, or runtime external
  request.

### Documentation Requirements

- The sole Implement agent maintains `docs/implementation-context-phase-X.md`,
  `docs/phase-X-test-report.md`, and the agent runbook in each final validation
  component; reports name commands, environments, fixtures, results, and any
  genuine blocker without pasting unverifiable claims.
- Public TypeScript functions, classes, and modules use TSDoc; strict typing
  avoids `any`; configuration is centralized and typed; ESLint/Prettier and the
  applicable TypeScript standards govern source.
- Phase 3 owns player/developer README content, contribution steps, MIT license,
  architecture/validation summary, save/offline privacy notes, and public
  release instructions. No public API document is required because the game
  exposes no service API.

### Quality Gates

- A component is complete only when its full runtime outcome, production wiring,
  essential tests, and self-review are complete; documentation or lint work may
  not replace required behavior or correctness.
- A phase is complete only when its final component exercises every named user
  flow and critical engine/persistence target, the cumulative exact validation
  sequence passes, and its phase test report records PASS.
- The same Implement agent diagnoses and fixes failures before reporting; no
  separate Test, Debug, Review, or Phase Docs agent will run under the lean
  override.
- No high/critical dependency or input-handling vulnerability, save corruption,
  deterministic mismatch, or regression against profile performance budgets may
  pass a phase gate.

### Delivery & Environments

- Use `phase-1`, `phase-2`, and `phase-3` branches. Component commits follow
  `feat(phase-X): Component X.Y — <name>`. Never commit directly to protected
  `main`; a human approves each merge after its PASS report.
- Phase 2 may branch from validated Phase 1 and Phase 3 from validated Phase 2
  before earlier human merges, as allowed by the profile. No environment or
  secret file is required.
- Phases 1-2 validate through local dev/production preview. Phase 3 promotes the
  same static build through GitHub Actions to GitHub Pages after the Component
  3.1 public gate. The service worker/update prompt and versioned save migration
  are the release-safety and rollback protections; a bad publication is stopped
  or superseded through the Pages workflow without discarding local saves.

## Dependencies & External Factors

### External Dependencies

| Dependency | Needed | Risk if delayed | Mitigation/owner |
|---|---|---|---|
| Node 22.12+, pnpm 10, compatible pinned frontend/test packages | Phase 1 onward | Build or browser incompatibility | Implement agent pins the lockfile and validates Vite modern-browser/Safari 16.4+ baseline |
| GitHub Actions and Pages | Phase 3 hosted gate | Public URL cannot be verified | Prepare and locally test workflow/base first; human enables only after local PASS |
| Human repository visibility/Pages approval | Component 3.1 | Hosted release remains blocked | Keep private release candidate complete; report local PASS separately and never claim hosted PASS |

### Technical Risks

| Risk | Impact | Likelihood | Mitigation Strategy | Owner |
|---|---|---|---|---|
| Economy cannot produce fair victory and bankruptcy paths | High | Medium | Typed tuning, one-factor tests, multi-seed complete campaigns, explicit boundary cases | Implement agent |
| Engine outcome couples to Canvas frame timing or speed | High | Medium | Pure tick commands, immutable snapshots, seeded PRNG state, speed-independence tests from Phase 1 | Implement agent |
| Mobile planner becomes dense or blocks actions | High | Medium | 360px baseline, progressive tab disclosure, touch E2E in every phase | Implement agent |
| Save/update incompatibility loses a campaign | High | Medium | Versioned envelope, last-known-good writes, idempotent settlement, migrations, deferred updates, adversarial tests | Implement agent |
| PWA serves stale or broken `/tycoon/` assets | High | Medium | Local subpath preview, explicit update prompt, cache-completeness tests, hosted refresh/offline checks | Implement agent |
| Pixel/audio assets breach size, consistency, or provenance goals | Medium | Medium | Constrained palette/logical resolution, optimized sprite sheets/audio, provenance inventory, Lighthouse/bundle checks | Implement agent |

## Change Management

1. Record any requested change and its authority.
2. Assess affected component outcomes, dependencies, validation targets, and
   traceability rows before implementation changes.
3. Preserve exactly three phases unless the user explicitly replaces the
   approved structure; do not silently defer required version 1 behavior.
4. Add approved changes to the amendment log and notify the sole Implement
   agent before the affected component begins or resumes.

### Amendment Log

| Date | Phase/Component | Change | Reason | Impact |
|---|---|---|---|---|
| 2026-07-18 | All | Initial three-phase lean plan | User-approved delivery structure and sole-Implement override | Establishes 14 components and cumulative gates |

## Approval

- [ ] Human accepts the phase plan and authorizes the sole Implement agent to
      begin Component 1.2 on `phase-1`.
