# Component 8.4 — Department Workforce and Operational Roles

## What was delivered

A user can now keep a twelve-person department roster, rotate zero through ten
people onto the daily schedule, and hire visible Manager and Runner roles with
deterministic names, exact role-premium wages, bounded operational value,
reload-safe identities, and causal report explanations. Smaller venues retain
their existing schedule limits and eight-person roster.

## Public interfaces / contracts exposed

- `StaffRole` is exhaustive across `barista`, `frontOfHouse`, `manager`, and
  `runner`. `STAFF_ROLES`, `STAFF_ROLE_DETAILS`, and `STAFF_ROLE_LABELS` are the
  canonical generation/configuration/presentation contracts.
- `WorkforceCapacity`, `VENUE_WORKFORCE_CAPACITY`, and
  `workforceCapacityFor(venueId)` independently define roster and schedule
  limits. `VenueConfig.staffCapacity` and `VENUE_STAFF_CAPACITY` are derived
  compatibility schedule projections only.
- `staffRoleAvailableAtVenue(role, venueId)` owns role eligibility. Manager and
  Runner require `departmentStore`; Barista and Front of house remain available
  from cart onward.
- `candidateStaffId(seed, day, index)` and
  `candidateStaffSlotFromId(id, seed)` bind canonical identity to campaign seed,
  day, and pool slot. Four collision-free candidates are generated per day in
  role order, including through Day 40 and supported endless play.
- `StaffRoleOperationalEffect` and `staffRoleOperationalEffect(member)` expose
  one bounded pure reduction for each operational role. `operationalEffects`
  additionally exposes equipment reliability, Manager/Runner reductions, and
  remaining coordination and handoff delays.
- `staffRoleValue(member)` and `workforceAppliedEffectLabels(state)` provide
  exact accessible planner copy for configured and applied effects.
- `DEMAND_INFLUENCES.arrivalTeamEquipment` admits ten people-person traits plus
  commercial POS: Standard preserves `1.05^10 × 1.07`; Hard applies the sole
  direct `1.675` deviation inside the `2.3` clamp.
- Save schema remains v4. Current imports require canonical candidate/hire time
  identity, complete current-day pool accounting, per-venue role/roster/schedule
  validity, scheduled IDs that identify hired people, and exact rush/report
  payroll.

## Files owned

Created:

- `tests/e2e/department-workforce.spec.ts`
- `docs/components/phase-8-component-8-4-overview.md`

Modified:

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/selectors.ts`
- `src/game/demandInfluences.ts`, `src/game/staffNames.ts`, `src/game/index.ts`
- `src/content/gameContent.ts`, `src/persistence/saveStore.ts`
- `src/components/TeamPlanner.tsx`, `src/components/Planner.tsx`
- `src/components/OnboardingGuide.tsx`
- `src/scene/three/entities/People.tsx`, `src/styles.css`
- `tests/unit/operations.test.ts`, `tests/unit/staff-names.test.ts`
- `tests/unit/demand.test.ts`, `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/fixtures/campaignFixtures.ts`
- `tests/e2e/operations.spec.ts`, `tests/e2e/webgl-service.spec.ts`
- `docs/phase-8-component-breakdown.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

Owned and deliberately unchanged because their generic contracts already carry
the expanded typed data:

- `src/components/ReportPanel.tsx`
- `src/scene/three/renderSnapshot.ts`
- `tests/unit/campaign.test.ts`

## How to run / verify

Focused deterministic and UI proof:

```bash
pnpm exec vitest run tests/unit/operations.test.ts tests/unit/staff-names.test.ts tests/unit/demand.test.ts tests/unit/persistence.test.ts tests/unit/campaign.test.ts tests/components/game-loop.test.tsx
```

Focused desktop/touch workforce proof:

```bash
pnpm exec playwright test tests/e2e/department-workforce.spec.ts
```

Retained current-v4 staff/name/report/WebGL audit:

```bash
pnpm exec playwright test tests/e2e/operations.spec.ts tests/e2e/staff-names.spec.ts tests/e2e/report-history.spec.ts tests/e2e/webgl-service.spec.ts
```

The final Tier 2 component gate is:

```bash
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts
```

## Integration notes & gotchas

- Use `VENUE_WORKFORCE_CAPACITY`; never reintroduce a global roster maximum or
  treat `VenueConfig.staffCapacity` as an independent authority.
- Manager/Runner workload reductions are proposed per person, then clamped to
  the actual reducible work. At least one coordination tick and one handoff tick
  remain. UI/report consumers should display `operationalEffects` applied
  values, not sum candidate-card values themselves.
- Manager reduces fixed coordination plus installed-equipment reliability delay
  but never changes equipment level, requirement, inventory, or service count.
  Runner changes only order preparation workload; it never touches inventory.
- The order workload is added only in `makeOrder`. Presentation snapshots and
  animation do not apply gameplay effects.
- Candidate IDs are domain evidence, not arbitrary strings. v4 import requires
  the seed/day/slot-derived role, name, attributes, wage, trait, and hire day.
- The department still has one queue and one active service. Component 8.5 owns
  stations, express priority, and parallel service/settlement.
- Automated Chromium and touch-mobile evidence is not physical-device proof.
  No physical device was accessed or claimed.
- Title art remains SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Spec-to-delivery map

| Acceptance criterion | Runtime behavior and source | Proof |
| --- | --- | --- |
| Department roster supports rotation and schedules 0–10; eleven is rejected; smaller venues stay unchanged | Typed workforce authority consumed by hire, plan, persistence, planner, and help | Unit matrix for cart/kiosk/cafe and department 0/10/11/12; desktop/touch disabled-overflow journey |
| Manager and Runner are hireable only at department, uniquely named, persisted, and paid once | Exhaustive role config/generation, canonical ID/day validation, role premiums, exact scheduled payroll | Exact generation/wage assertions; eligibility tests; zero/one/duplicate/ten report-import reconciliation; reload browser flow |
| Manager improves coordination/reliability without bypass; Runner reduces handoff workload without stock creation | Pure bounded per-member reductions; department work clamps at one tick; one `makeOrder` application | Exact operational fields, stacked clamp, preparation equation, inventory non-mutation, causal report assertions |
| Role value, wages, traits, and effects are visible and accessible | Planner cards/summary/status/help, applied-effect selectors, report explanations, exhaustive scene colours | Component UI and desktop/touch team/report journey |
| Demand authority covers ten staff and POS with Standard baseline and one Hard deviation | Updated registry metadata/clamp; unchanged sole difficulty application | Direct Standard `1.05^10 × 1.07`, Hard `1.675`, source, and clamp unit proof |
| Same seed/team/plan is invariant at 1×/2×/4× and reload | Rush speed remains presentation policy; canonical mid-rush save restores exact engine state | Equal report test at all three speeds and mid-rush import-to-report equality |
| Campaign names remain deterministic through Day 40/endless | Four-slot direct namespace and canonical ID parser retain 40,000 unique supported names | Full namespace test plus Day 40/41/1,000/10,000 role/ID and existing endless browser journey |

## Assurance lane

`fast (lean override)`, Tier 2. Recorded standard Test triggers: expanded UI and
touch behavior, current-v4 persistence/reload/import, payroll round trips,
observable operations, WebGL snapshot roles, and deterministic speed behavior.
Recorded standard Review triggers: shared engine/content/persistence files, new
public role/capacity/identity contracts, expanded union and validation schema,
and broad runtime/test scope. The approved lean override assigns targeted
checks, self-review, corrections, and Tier 2 to Implement; the Lead Coordinator
owns the serialized commit.

## Deviations and decisions

- No behavior was descoped; Component 8.4 was delivered as one vertical slice.
- The Lead Coordinator approved `tests/e2e/operations.spec.ts` only for a
  title correction from “both roles” to “both cart-eligible roles.” Its runtime
  assertions are unchanged.
- Strict canonical time binding exposed a test fixture that placed future-pool
  candidates in a Day-1 roster. The owned fixture now sources eligible staff
  from their real pool days. The Lead Coordinator approved
  `tests/e2e/webgl-service.spec.ts` only to derive import-day and day-bound
  customer identity expectations; every WebGL, world, segment, walkaway,
  save/reload, and Canvas-removal assertion remains.
- Existing `staff-names.spec.ts` and `report-history.spec.ts` required no change
  and passed in the retained current-v4 audit.
- Existing library/platform assumptions remained current and no dependency or
  external capability changed. Technical validation used strict compilation,
  deterministic tests, import round trips, and local Chromium rather than a new
  capability spike.
- The first sandboxed Playwright launch failed before test execution because
  macOS denied Chromium's IPC endpoint. The profile fallback outside the
  sandbox passed both projects; this was not an application failure.
- Implement performed no Git mutation, device access, merge, deployment, or
  publication. The Lead Coordinator independently reproduced the candidate
  fingerprint and 59-test workforce/persistence audit, then audited, staged,
  and committed the exact candidate.

## Validation evidence

Targeted evidence before final candidate freeze:

- `pnpm exec vitest run tests/unit/scene.test.ts tests/components/presentation.test.tsx tests/components/accessibility.test.tsx tests/components/game-loop.test.tsx tests/unit/operations.test.ts tests/unit/staff-names.test.ts tests/unit/demand.test.ts tests/unit/persistence.test.ts tests/unit/campaign.test.ts`
  exited 0 in 5.63s: 9 files / 139 tests passed.
- `pnpm exec playwright test tests/e2e/department-workforce.spec.ts` exited 0
  through the profiled sandbox fallback in 32.1s: 2/2 desktop/touch cases
  passed.
- `pnpm exec playwright test tests/e2e/operations.spec.ts tests/e2e/staff-names.spec.ts tests/e2e/report-history.spec.ts tests/e2e/webgl-service.spec.ts`
  exited 0 in 33.2s: 22/22 retained current-v4 cases passed.
- Final focused post-review proof passed 45/45 operations/persistence tests.

Final scoped candidate and Tier 2 evidence are recorded below after the one
completion gate.

Final scoped candidate identity:

```bash
python3 scripts/worktree-fingerprint.py -- src/game/types.ts src/game/engine.ts src/game/selectors.ts src/game/demandInfluences.ts src/game/staffNames.ts src/game/index.ts src/content/gameContent.ts src/persistence/saveStore.ts src/components/TeamPlanner.tsx src/components/Planner.tsx src/components/ReportPanel.tsx src/components/OnboardingGuide.tsx src/scene/three/renderSnapshot.ts src/scene/three/entities/People.tsx src/styles.css tests/unit/operations.test.ts tests/unit/staff-names.test.ts tests/unit/demand.test.ts tests/unit/persistence.test.ts tests/unit/campaign.test.ts tests/components/game-loop.test.tsx tests/e2e/department-workforce.spec.ts tests/e2e/operations.spec.ts tests/e2e/webgl-service.spec.ts tests/fixtures/campaignFixtures.ts docs/phase-8-component-breakdown.md docs/components/phase-8-component-8-4-overview.md docs/implementation-context-phase-8.md docs/phase-progress.json
```

The command exited 0 before the gate and again afterward with the identical
fingerprint
`64dd0298c9cdcf6973b55fe1882106252e893f065adc5a727c07a5fc8cb4c3e5`.
The explicit scope includes every declared source/test/configuration path,
unchanged generic consumer, fixture, component evidence path, and both approved
current-v4 clarifications. The fingerprint tool intentionally excludes the
overview and phase-progress evidence payloads.

The one final Tier 2 gate for that unchanged candidate passed:

- `pnpm build` exited 0 in 3.96s. Strict TypeScript and the production Vite/PWA
  build passed; 19 entries / 1,753.23 KiB were precached and the largest emitted
  file remained the isolated 724.51 kB Three.js chunk below the one-megabyte
  Workbox limit.
- `pnpm lint` exited 0 in 7.92s. ESLint reported zero warnings and Prettier
  reported that all checked files matched.
- `pnpm test` exited 0 in 6.81s. All 16 Vitest files and 180 unit/component
  tests passed.
- `pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts`
  exited 0 in the reported 35.0s. Four applicable desktop/touch cases passed;
  the two opposite-input project cases were intentionally skipped by their
  existing project guards.

Post-gate `git diff --check` passed and the title-art SHA-256 remained exactly
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.
No raw failure log is required because every final command exited successfully.
