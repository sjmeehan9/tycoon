# Component 8.7 — Complete Forty-Day Content, Balance, and History

## What was delivered

A user can now play a complete 40-day Standard or Hard campaign, promote the
same business into the department-store coffee hall, make six new
department-scale service decisions, purchase four visible operational hall
improvements, and reopen every settled day as immutable causal history.
Standard now responds more strongly to price without changing its other demand
factors; Hard amplifies every supported price and non-price deviation. Two
materially different public-command strategies remain viable, while repeated
plausible mismanagement reliably reaches bankruptcy.

Winning the Day-40 department campaign unlocks shared presentation-only
milestones and cosmetics. The established ten drinks and nine ingredients are
unchanged.

## Public interfaces / contracts exposed

- `Difficulty` remains immutable per campaign. `CAMPAIGN_RULES` now freezes a
  40-day duration, $350.00 cash target, 65 reputation target, and 95 positive
  reputation soft ceiling. `ARRIVAL_BASE_RATE` is the typed 0.075 base arrival
  probability.
- `DIFFICULTY_DEVIATION_MULTIPLIERS` is frozen at Standard
  `{ price: 1.225, nonPrice: 1 }` and Hard `{ price: 1.7, nonPrice: 1.7 }`.
  `DEMAND_INFLUENCES` remains the exhaustive arrival/order-choice registry and
  clamps every amplified value.
- `EVENT_TEMPLATES` contains the two unchanged base events and six uniquely
  identified department events. Weighted deterministic selection allows zero,
  one, or two non-repeating choices in a rush and captures the resolved title,
  choice copy, and exact effect object.
- `IMPROVEMENTS` and `IMPROVEMENT_IDS` expose the retained street sign plus
  `heritage-welcome-marquee`, `espresso-order-pass`, `brew-gallery`, and
  `cold-collection-rail`. `buyImprovement` enforces venue/equipment/cash
  requirements and returns idempotently for an owned improvement.
- `DayReport.causeSnapshot` stores the exact venue, selected menu prices,
  dial-in, beans, express drinks, scheduled staff attributes/roles/stations and
  wages, equipment, improvements, resolved events/effects, queue capacity/peak,
  wait ticks, and operating costs. `null` is the honest canonical value when an
  earlier current-v4 report has no captured cause data.
- `ResolvedEvent` now carries the immutable event/choice copy and exact
  `EventChoiceEffect`. Save import accepts only bounded canonical event data and
  rejects forged copy/effects.
- `ACHIEVEMENT_DETAILS` adds `departmentInstitution` and
  `threeBayConductor`. `reportServedEveryStationAndLane` requires positive
  Day-40 service at each of the three stations and in each of the two lanes; it
  does not require every station/lane intersection.
- `COSMETIC_DETAILS` adds `mosaicFloor`, `brassBayPlaques`, and
  `afterHoursGlow`. Each changes the department renderer only and never changes
  economics.

## Files owned

Created:

- `tests/fixtures/balanceStrategies.ts`
- `tests/e2e/forty-day-campaign.spec.ts`
- `docs/components/phase-8-component-8-7-overview.md`

Modified:

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/demandInfluences.ts`
- `src/game/meta.ts`, `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`
- `src/components/ReinvestPanel.tsx`, `src/components/ReportPanel.tsx`
- `src/components/GameTools.tsx`, `src/components/EndingPanel.tsx`
- `src/components/OnboardingGuide.tsx`
- `src/scene/three/renderSnapshot.ts`
- `src/scene/three/venues/DepartmentStoreWorld.tsx`
- `src/styles.css`
- `tests/unit/campaign.test.ts`, `tests/unit/demand.test.ts`
- `tests/unit/operations.test.ts`, `tests/unit/persistence.test.ts`
- `tests/unit/coffee-content.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/e2e/department-store.spec.ts`, `tests/e2e/report-history.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

## How to run / verify

Focused content, economy, persistence, report, and full-campaign proof:

```bash
pnpm exec vitest run tests/unit/persistence.test.ts tests/components/game-loop.test.tsx tests/unit/campaign.test.ts tests/unit/demand.test.ts tests/unit/coffee-content.test.ts tests/unit/operations.test.ts
```

Focused desktop/touch browser proof:

```bash
pnpm exec playwright test tests/e2e/forty-day-campaign.spec.ts tests/e2e/department-store.spec.ts tests/e2e/report-history.spec.ts tests/e2e/persistence.spec.ts tests/e2e/accessibility.spec.ts
```

The final Tier 2 gate uses the profile build, lint, and complete Vitest commands
plus that exact five-file browser matrix.

## Integration notes & gotchas

- Cause snapshots are settlement evidence. Historical report rendering consumes
  only the selected `DayReport`; it must never consult the active plan, rush,
  staffing, equipment, or venue.
- Do not synthesize causes for an older current-v4 report. Missing cause data is
  canonicalized to `null`, survives repeat export/import, and is explained as
  unavailable in the UI.
- Resolved report events are validated against canonical configured copy and
  effects. Adding or changing an event requires a deliberate save-compatibility
  decision rather than silently rewriting settled history.
- Positive settlement reputation stops at 95. Losses still apply, and an
  imported reputation already above 95 is not reduced by a positive result.
- Standard applies its 1.225 multiplier to price slopes only. Hard applies 1.7
  once to every supported deviation; it must not compound Standard's price
  multiplier or add hidden starting resources.
- The four department improvements cost exactly $75, $90, $80, and $85. Their
  renderer anchors are `hallEntry`, `espressoBay`, `brewBay`, and `coldBay`.
  Cosmetics are separately snapshot-driven and presentation-only.
- Final candidate wages use
  `roundTo50(1600 + speed*8 + skill*10) + rolePremium`, where barista is zero
  and front-of-house, manager, and runner are each $8.00.
- The final Batch Brewer tiers are $55/$80/$115 purchase and $3/$4/$4.60 daily;
  Refrigeration tiers are $25/$80/$115 and $1.10/$4/$4.60; Service Counter
  tiers are $40/$70/$115 and $2.50/$3.50/$4.60.
- The deterministic balance harness uses public engine commands only. The
  premium policy uses higher prices, a quality dial-in, Barista leadership, and
  a Manager only for the inaugural department rush. The value policy uses
  lower prices, batch/long-black/cold service, express routing,
  front-of-house/runners, and throughput equipment.
- Automated Chromium/touch-mobile results are browser evidence, not physical
  device proof. No physical device, hosted release, merge, deployment, or
  publication was accessed or claimed.
- Title art remains SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion | Runtime behavior and source | Proof |
| --- | --- | --- |
| Six original department events, four physical upgrades, three cosmetics, and two milestones are complete and bounded | Typed catalogues and validators in `gameContent.ts`; deterministic selection/purchase in `engine.ts`; renderer geometry/cosmetic changes in `DepartmentStoreWorld.tsx`; milestone derivation in `meta.ts` | Exhaustive content rejection tests, operational effect tests, renderer snapshot tests, and desktop/touch purchase/service journey |
| Two distinct strategies remain viable on Standard and Hard while mismanagement can bankrupt | Frozen typed difficulty/economy rules and public-command policies in `balanceStrategies.ts` | 20 fixed seeds per difficulty/strategy, 80 managed campaigns plus 40 mismanaged campaigns, target/bankruptcy/promotion/history assertions |
| Difficulty records and shared non-power unlocks persist accurately | Immutable campaign difficulty, partitioned records, idempotent outcome recording, presentation-only milestone metadata | Campaign/meta unit tests and completed Standard/Hard browser fixtures |
| Station/lane-aware history reopens truthfully without recomputation | Settlement-time `DayReportCauseSnapshot`, canonical v4 import validation, report-only historical renderer with exact menu/effect values | Adversarial malformed-save tests, changed-next-plan persistence/component tests, reload/export/import browser history journey |
| Menu and ingredient inventory remains exactly established | Canonical `ALL_DRINK_IDS`, `INGREDIENT_IDS`, recipes, purchasing, and schema keys unchanged | Validator rejection of an eleventh drink/new ingredient and exact ten/nine catalogue assertions |

## Assurance lane

`fast (lean override)`, Tier 2. Recorded standard Test triggers: deterministic
40-day cross-component campaigns, persistence/history round trips, first
immutable causal-report contract, responsive UI, and browser-visible WebGL
upgrades. Recorded standard Review triggers: expanded public game/save/content
contracts, shared balance/progression rules, schema semantics, and broad
runtime/test scope. The approved lean override assigns targeted checks,
self-review, correction, and Tier 2 to Implement; the Lead Coordinator owns Git
serialization and commit.

## Deviations and decisions

- No required behavior was descoped and no new drink, ingredient, dependency,
  backend, API, or asset was introduced.
- The approved symmetric reputation soft ceiling is 95: positive settlement is
  clipped, negative settlement is never clipped upward, and above-ceiling
  imported values are preserved.
- Hard's approved direct department venue factor is 2.054 and its policy clamp
  is 2.06. The approved combined high-team/equipment value remains 2.2630.
- The achievement interpretation is deliberately feasible: every station and
  each lane must serve someone on the winning report, rather than every one of
  the six station/lane intersections.
- Save schema remains v4. Earlier v4 causes are not reconstructed; this avoids
  presenting current configuration as historical fact.
- No external technical assumption or human/manual prerequisite applied. All
  capability checks exercised installed production code through deterministic
  simulation, serialization, React, and real local Chromium.
- The first scoped browser matrix was blocked by the workspace sandbox before
  application execution. The immediate profiled unsandboxed fallback exposed
  two assertion-only mismatches: the purchased marquee correctly raises queue
  capacity to 34, and two separate accessible regions contain the text
  “Campaign complete.” The bounded correction changed only those assertions;
  the corrected six desktop/touch cases passed.

## Balance evidence

Twenty fixed seeds per difficulty and strategy produced these frozen results:

| Difficulty / policy | Victories | Department day | Winner cash range / median | Winner reputation | Reports |
| --- | ---: | --- | --- | ---: | ---: |
| Standard premium quality | 20/20 | 24–27 | $368.90–$593.30 / $501.15 | 95 | 40 |
| Standard value throughput | 17/20 | 17–21 | $381.45–$751.25 / $533.15 | 95 | 40 |
| Hard premium quality | 19/20 | 23–25 | $366.95–$576.05 / $517.25 | 95 | 40 |
| Hard value throughput | 19/20 | 17–22 | $408.55–$1,144.95 / $848.55 | 95 | 40 |

Across both managed policies, at least nineteen of twenty seeds won in each
difficulty; all 80 managed campaigns reached the department store, retained 40
settled causal reports, and had zero bankruptcies. Both Standard and Hard
mismanagement cohorts reached 20/20 bankruptcies on Days 2–4 and zero
victories.

## Validation evidence

Targeted evidence before candidate freeze:

- Profile-compatible Node 24.18 strict TypeScript exited 0 in 2.7s.
- Focused Vitest exited 0 in 7.38s: six files / 116 tests passed, including the
  120 complete managed/mismanaged campaign simulations.
- The first unsandboxed five-file browser matrix produced eight passes, two
  intentional project-filter skips, and the six duplicated assertion failures
  described above in 50.0s. Unchanged persistence, accessibility, and
  report-history journeys passed.
- The corrected department/40-day subset exited 0 in 9.5s: six desktop/touch
  cases passed with no skips or failures. Combined current targeted browser
  evidence is fourteen passed, two intentional project-filter skips, and zero
  remaining failures.

Final scoped candidate identity:

```bash
python3 scripts/worktree-fingerprint.py -- src/game/types.ts src/game/engine.ts src/game/demandInfluences.ts src/game/capacity.ts src/game/meta.ts src/game/selectors.ts src/content/gameContent.ts src/persistence/saveStore.ts src/components/Planner.tsx src/components/ReinvestPanel.tsx src/components/ReportPanel.tsx src/components/GameTools.tsx src/components/EndingPanel.tsx src/components/OnboardingGuide.tsx src/scene/three/renderSnapshot.ts src/scene/three/venues/DepartmentStoreWorld.tsx src/styles.css tests/unit/campaign.test.ts tests/unit/demand.test.ts tests/unit/operations.test.ts tests/unit/persistence.test.ts tests/unit/coffee-content.test.ts tests/components/game-loop.test.tsx tests/e2e/forty-day-campaign.spec.ts tests/e2e/department-store.spec.ts tests/e2e/report-history.spec.ts tests/fixtures/campaignFixtures.ts tests/fixtures/balanceStrategies.ts docs/components/phase-8-component-8-7-overview.md docs/implementation-context-phase-8.md docs/phase-progress.json docs/phase-8-component-breakdown.md
```

The command exited 0 before the final gate with fingerprint
`26993a25d79469bcbcadf93f711e42e83c6f989b184452640f0c652e60394cdb`.
It includes every explicitly owned Component 8.7 path—including unchanged
`capacity.ts`, `selectors.ts`, and `Planner.tsx`—plus the component spec. The
fingerprint tool intentionally excludes the overview and phase state evidence
payloads while preserving executable/specification candidate identity.

Final Tier 2 evidence for that unchanged fingerprint under Node 24.18:

- `pnpm build` exited 0 in 3.97s. Strict TypeScript and the production Vite/PWA
  build passed; 19 entries / 1,825.20 KiB were precached and the largest file
  remained the isolated 724.51 kB Three.js chunk.
- `pnpm lint` exited 0 in 8.14s. ESLint reported zero warnings and the complete
  configured Prettier surface matched.
- `pnpm test` exited 0 in 8.31s after the approved environment fallback: all 16
  Vitest files and 218 unit/component tests passed. The first invocation on the
  same source fingerprint produced 217 passes and one `ENOENT` because the
  sealed worktree had only Vite cache data under its ignored `node_modules`.
  A temporary ignored symlink to the shared installed dependencies allowed the
  exact command to run; it was removed afterward and the previous ignored cache
  directory was restored. No source or fingerprint changed.
- `pnpm exec playwright test tests/e2e/forty-day-campaign.spec.ts tests/e2e/department-store.spec.ts tests/e2e/report-history.spec.ts tests/e2e/persistence.spec.ts tests/e2e/accessibility.spec.ts`
  exited 0 through the profiled macOS Chromium fallback in 45.3s. Fourteen
  applicable desktop/touch cases passed, two opposite-input accessibility
  cases were intentionally skipped by project guards, and none failed or timed
  out.

The earlier `fa49bb…` and `b86990…` candidates are invalidated evidence only:
their gates stopped at new-code ESLint assertions and Prettier misses before
full runtime/browser validation. Those bounded static corrections produced the
final `26993a…` candidate above.

Post-gate `git diff --check` passed, port 4173 had no listener, the temporary
dependency link was removed, and the title-art SHA-256 remained exactly
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.
No raw final-gate failure log is required because every final command exited
successfully.

## Human tasks

None.
