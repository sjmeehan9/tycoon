# Requirements — Laneway Tycoon

## Authority and lean-team condition

This document is a durable skeleton for the approved plan in the root Codex
conversation. That plan and the user's subsequent lean-team instruction are
authoritative. Only the Technical Business Analyst may author the approved
original or additive phase plan; only the Implement agent may build, test,
debug, review, document, and validate the game.

## Product goal

Create a fully playable, free, open-source, browser-based old-school tycoon game
inspired by the approachable plan-and-resolve rhythm of classic lemonade-stand
games. The player grows a coffee cart into a specialty cafe in a fictional,
unmistakably Melbourne setting.

## Audience and distribution

- Single hobby player; no accounts or social systems.
- Playable in current desktop and mobile browsers at a public GitHub Pages URL.
- Installable and playable offline after the first successful load.
- MIT-licensed public repository with clear local run and contribution steps.

## Required game loop

1. Start or continue a seeded 30-day campaign. The approved Phase 8 expansion
   will replace this boundary with a new 40-day campaign after its explicit v4
   reset; it is not part of the current Phase 7 runtime.
2. In morning planning, choose the active menu, prices, ingredient purchases,
   daily espresso dial-in, scheduled staff, and affordable upgrades.
3. Run a 60–90 second animated service rush with pause and 1x/2x/4x speeds.
4. Staff automatically serve customers while the player inspects queues and
   answers zero to two meaningful event choices.
5. Read a compact day-complete summary. Open the full profit-and-loss,
   customer-satisfaction, inventory/waste, bottleneck, and reputation report
   only when wanted; settled reports remain reopenable from the Game menu.
6. Reinvest and continue until victory on Day 30 or bankruptcy.

## Coffee and cafe simulation

- Ten drinks: espresso, long black, flat white, latte, cappuccino, piccolo,
  mocha, batch brew, iced latte, and cold brew.
- Authentic fixed base recipes; regular/large sizes where appropriate and
  dairy, oat, or soy choices as recipe/order modifiers.
- Meaningful but clear strategy through bean selection, milk and ingredient
  inventory, prices, equipment, staff skill, and a speed/balanced/quality
  daily dial-in choice.
- Customer demand responds to price, availability, quality, wait time,
  reputation, venue, weather, local events, and customer-segment preferences.
- At least four readable segments: commuters, students, coffee enthusiasts,
  and local regulars.
- Seeded randomness makes identical states and decisions reproducible.
- The current Phase 7 economy retains its existing single balanced mode. Phase
  8 will add a preselected Standard mode with moderately stronger price
  sensitivity and a Hard mode that symmetrically amplifies every existing
  demand factor; neither mode is implemented early in Phase 7.

## Progression and economy

- One business progresses from cart to kiosk to cafe.
- Venue tiers unlock menu capacity, staff capacity, equipment, demand, and
  distinct visuals.
- Staff use barista or front-of-house roles and have speed, skill, wage, and
  one readable trait; the player hires from a rotating pool and schedules a
  daily team without full weekly rostering.
- Equipment includes grinders, espresso machines, batch brewers,
  refrigeration, POS, and service-counter upgrades affecting quality,
  throughput, reliability, or waste.
- Day 30 victory requires the cafe tier plus configured cash and reputation
  targets. Crossing the configured overdraft floor at day close causes
  bankruptcy. Numeric tuning lives in typed content configuration and is
  validated with seeded campaign simulations.
- First victory unlocks endless mode. Achievements unlock cosmetics, records,
  and alternate scenarios only; no permanent economic bonuses carry over.
- Phase 8 will extend the same business to a fourth, massive department-store
  coffee operation with higher staff capacity and additional unlocks, and will
  extend the campaign to 40 days. Existing progress may be invalidated only at
  that planned schema-v4 boundary.

## Presentation and interaction

- Working title: **Laneway Tycoon**.
- Warm, cosy, lightly humorous classic-tycoon direction expressed as original
  procedural low-poly 3D with pixel-compatible materials.
- Service uses a fixed-isometric WebGL2 scene paired with crisp semantic React
  management panels. Morning planning is full-width and has no scene preview.
- Original worlds for cart, kiosk, cafe, staff, customers, weather, equipment,
  and interface accents; the existing title art remains unchanged.
- Optional locally bundled ambience and interface cues; sound starts disabled
  until enabled by user interaction.
- Service information is ordered scene → complete rush dashboard → live
  activity → stock. At exactly 360×780, the scene and complete dashboard are
  simultaneously visible without document scrolling; activity and stock stay
  reachable below. No interaction depends on hover.
- Keyboard support, 44px minimum touch targets, reduced motion, colour-safe
  status communication, and textual summaries of animated outcomes.

## Persistence and offline behavior

- Auto-save the active run, preferences, records, and unlocks locally at phase
  transitions and safely during service.
- Version the save schema and migrate supported older saves.
- Export and import validated JSON save files.
- Corrupt or incompatible saves produce recovery choices instead of crashes.
- PWA manifest and service worker cache the complete runtime for offline play.
- Updates prompt the player and never refresh an active run without consent.

## Technical contracts

- Strict TypeScript, React 19.2, Vite 8.1, Three.js 0.185.1 and React Three
  Fiber 9.7.0 for the lazy WebGL2 service scene, and React DOM panels.
- Pure deterministic simulation engine separated from rendering and browser
  persistence.
- Rendering consumes detached, deeply frozen, bounded snapshots. It has no
  tick, demand, inventory, cash, report, persistence, or random-number
  authority. WebGL2 failure produces accessible save-safe guidance, never 2D
  gameplay fallback; reduced motion retains the same 3D world and text truth.
- Public domain types include `GameState`, `DayPlan`, `Customer`,
  `StaffMember`, `SimulationEvent`, `DayReport`, `MetaProgress`, and
  `SaveEnvelope`.
- Engine boundaries cover campaign creation, day preparation, rush start,
  tick advancement, event resolution, day close, and endless continuation.
- No backend, credentials, runtime external API, analytics, advertisements, or
  personal-data collection.

## Validation and acceptance

- Vitest proves deterministic simulation, demand/economy effects, recipes,
  inventory, staffing, equipment, events, progression, win/loss, and save
  migration behavior.
- React Testing Library proves key controls, reports, event choices,
  accessibility, and import recovery behavior.
- Playwright proves complete desktop and touch-mobile journeys through a day,
  progression, save/reload, export/import, campaign win, bankruptcy, endless
  unlock, all three fixed-isometric worlds, capability/context-loss behavior,
  exact 360×780 service geometry, report history, offline reload, and GitHub
  Pages subpath behavior.
- Phase 7 automated acceptance proves desktop and exact 360×780 touch-browser
  behavior. Real Safari/mobile GPU capability, orientation, dense-world
  responsiveness, reduced motion, and the 30fps disposition remain a separate
  owner-led check against the exact approved build at the public game URL after
  automated PASS and merge/publication approval; no physical result is claimed
  before the owner performs it.
- A user can finish or lose a complete 30-day campaign on desktop and mobile,
  continue in endless mode after winning, transfer a save, and play offline.

## Explicit non-goals

Food, manual drink-making, detailed weekly rosters, multiple simultaneous
locations, cloud accounts, multiplayer, localization, paid content, analytics,
and external live-service dependencies are not part of version 1. The approved
Phase 8 department-store tier, 40-day campaign, and Standard/Hard modes are
planned expansion rather than current Phase 7 behavior and are not non-goals.
