# Phase 2 Implementation Context

## Component 2.1 — Human Setup

- Phase 2 introduces no accounts, credentials, secrets, environment variables,
  backends, or live services.
- The `phase-2` branch was created directly from validated Phase 1 head
  `4dedb13` as permitted by the project profile.
- All Phase 1 runtime behavior and tests remain cumulative dependencies.

## Component 2.2 — Full Coffee Trading Day

- Replaced the Phase 1 subset with the complete ten-drink Australian
  specialty-cafe menu and typed ingredient inventory, including valid
  regular/large variants, dairy/oat/soy choices, chocolate, ice, cold-brew
  concentrate, and three bean options.
- Extended the same deterministic fixed-tick engine with commuter, student,
  enthusiast, and regular demand; price, reputation, quality/dial-in, bean,
  weather, venue, wait/queue, availability, and event factors; and zero to two
  seeded, choice-bearing rush events.
- Added weather and customer-mix planning clues and causal report explanations,
  with segment service totals and recipe-level consumption/waste retained in
  serialisable state.
- Preserved the Phase 1 command boundary and autosave path so later staffing,
  equipment, venue, and campaign components extend one real runtime path.
- Added exhaustive content validation, one-factor demand/economy tests,
  component interaction coverage, and a complete desktop/touch-mobile coffee
  day flow. Exact validation passed: build, lint, 26 Vitest tests, and six
  Playwright project tests.
- No deviation from the approved Component 2.2 scope. Staff, equipment, venue
  promotion, and campaign endings remain intentionally assigned to 2.3–2.4.

## Component 2.3 — Staff, Equipment, and Venue Growth

- Added a deterministic rotating pool of four candidates per day, balanced
  across barista and front-of-house roles. Hired staff expose speed, skill,
  daily wage, and one of four readable traits; only scheduled staff cost money
  and affect the day's real service calculations.
- Added venue-capacity scheduling and operational effects for preparation,
  quality, demand, customer patience/satisfaction, queue space, and waste.
- Added two sequential tiers for grinders, espresso machines, batch brewers,
  refrigeration, POS, and service counters, with affordability, venue access,
  daily operating cost, and maximum-level enforcement.
- Added atomic cart→kiosk→cafe promotion gates for cash, reputation, and
  equipment. Each venue changes menu/staff/queue capacity, demand, operating
  cost, planning copy, header/caption, and its functional Canvas scene.
- Extended report reconciliation with exact wage and venue/equipment costs and
  causal staff/equipment explanations. Existing autosave round-trips all new
  state, and old in-progress rushes safely default absent wage snapshots to 0.
- Exact validation passed: frozen install, build, lint, 42 Vitest tests, and
  eight Playwright project tests across desktop and touch-mobile Chromium.
- No scope deviation. Weekly rosters, manual drink making, multiple locations,
  and permanent economic meta bonuses remain explicit non-goals.
