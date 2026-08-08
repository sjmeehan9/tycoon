# Component 8.2 — One-Time Reset and Immutable Difficulty

## What was delivered

A user can now cross one safe preferences-only boundary from any supported v1,
v2, or v3 save into a clean schema-v4 game, see the evolution notice once, and
start an immutable Standard or Hard campaign. Standard is visibly preselected,
scenario remains independent, reports and records retain difficulty identity,
and every current arrival/order-choice demand factor is governed by one typed,
auditable difficulty registry.

The implementation stops at the Component 8.2 boundary. It does not add the
department-store venue, third equipment tiers, expanded staffing, parallel
stations, dense service world, or forty-day campaign content owned by later
components.

## Public interfaces / contracts exposed

- `Difficulty = 'standard' | 'hard'` is exported from `src/game/types.ts`.
- `GameState.stateVersion` and `SaveEnvelope.schemaVersion` are now exactly 4.
  `GameState`, `DayReport`, and `CampaignRecord` require `difficulty`.
- `CampaignOptions.difficulty` is optional only to preserve Standard as the
  default. `createCampaign` validates it, includes it in the campaign identity,
  and exposes no command that can change it later.
- `DEMAND_INFLUENCES`, `DEMAND_INFLUENCE_IDS`,
  `DIFFICULTY_DEVIATION_MULTIPLIERS`, and `applyDemandInfluence` form the sole
  difficulty-policy API. Every definition declares scope, label, baseline,
  neutral, domain, application, clamp, boundary, and engine source.
- `ARRIVAL_DEMAND_ENGINE_INFLUENCES` and
  `ORDER_CHOICE_DEMAND_ENGINE_INFLUENCES` expose the engine-consumed identities
  for compile-time and runtime exhaustiveness proof.
- Standard applies `1.225` to both price-response slopes and `1` to non-price
  deviations. Hard applies `1.675` directly to both price and non-price baseline
  deviations; it never compounds on Standard.
- `DIFFICULTY_LABELS`, `DIFFICULTY_DESCRIPTIONS`, and
  `campaignRecordsByDifficulty` provide shared presentation/partition contracts.
- Current storage keys are `laneway-tycoon.save.v4` and
  `laneway-tycoon.save.backup.v4`. The exported v1/v2/v3 key constants remain
  only for bounded discovery and quarantine.
- `EVOLUTION_NOTICE` is the canonical one-time reset explanation.
  `Preferences.evolutionNoticeSeen` is persisted as `true` only after the v4
  write is verified.
- `GameContext.startCampaign(seed, scenarioId?, difficulty?)` creates Standard
  by default and accepts an explicit immutable Hard choice.
- `GameContext.importSave(serialized)` now requires a concrete browser store and
  one successful verified save before it consumes the notice marker or changes
  loaded-run, preference, meta, or React state. `SaveStoreError` remains
  actionable at the UI boundary.

## Files owned

Created:

- `src/game/demandInfluences.ts`
- `tests/e2e/difficulty-reset.spec.ts`
- `docs/components/phase-8-component-8-2-overview.md`

Modified:

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/demandModel.ts`
- `src/game/selectors.ts`, `src/game/index.ts`, `src/game/meta.ts`
- `src/persistence/saveStore.ts`, `src/app/GameContext.tsx`
- `src/components/TitleScreen.tsx`, `src/components/OnboardingGuide.tsx`
- `src/components/GameTools.tsx`, `src/components/ReportPanel.tsx`
- `src/styles.css`
- `tests/unit/demand.test.ts`, `tests/unit/engine.test.ts`
- `tests/unit/persistence.test.ts`, `tests/unit/campaign.test.ts`
- `tests/components/game-loop.test.tsx`,
  `tests/components/accessibility.test.tsx`
- `tests/e2e/persistence.spec.ts`, `tests/e2e/save-transfer.spec.ts`
- `tests/e2e/report-history.spec.ts`, `tests/e2e/staff-names.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `README.md`, `docs/agent-runbook.md`
- `docs/phase-8-component-breakdown.md`
- `docs/implementation-context-phase-8.md`, `docs/phase-progress.json`

Owned and deliberately unchanged because the new contracts already flow
through their existing calls/configuration:

- `src/game/capacity.ts`
- `src/content/gameContent.ts`

## How to run / verify

Focused logic, migration, UI, and accessibility proof:

```bash
pnpm exec vitest run tests/unit/demand.test.ts tests/unit/persistence.test.ts tests/unit/campaign.test.ts tests/unit/engine.test.ts tests/components/game-loop.test.tsx tests/components/accessibility.test.tsx
```

Focused real-browser reset, creation, continuation, recovery, and transfer proof:

```bash
pnpm exec playwright test tests/e2e/difficulty-reset.spec.ts tests/e2e/persistence.spec.ts tests/e2e/save-transfer.spec.ts tests/e2e/report-history.spec.ts tests/e2e/staff-names.spec.ts
```

The exact Tier 2 gate for the final scoped fingerprint is:

```bash
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts
```

## Integration notes & gotchas

- v1/v2/v3 progress, meta, records, history, onboarding state, and selected tab
  are intentionally void. Only sound, ambience, and reduced-motion survive.
- The legacy converter uses one deterministic timestamp and never mutates its
  input. Browser activation writes and validates v4 before removing legacy keys.
- A valid v4 primary or backup always outranks legacy candidates. v4
  autosave/recovery/export/import is idempotent and never repeats the reset.
- Import fails closed when browser storage is unavailable or the verified write
  fails. Parsing alone never activates data; controller refs/state change only
  after `BrowserSaveStore.save` returns successfully.
- Every future arrival or order-choice factor must be added to both the relevant
  engine identity tuple and `DEMAND_INFLUENCES`; the exhaustiveness test fails if
  they diverge. Difficulty math must not be reimplemented elsewhere.
- Domain declarations are behavioral: bidirectional factors permit both signs;
  positive/negative-only factors clamp an unsupported opposite sign to neutral.
- Difficulty partitions outcome records only. Achievements, cosmetics,
  scenarios, and endless unlocks stay shared and provide no starting cash,
  reputation, capacity, or other economic bonus.
- The bounded coordinator-approved compatibility update changes only superseded
  assertions in the cumulative report-history and staff-name browser specs.
  Current v4 report settlement/history/export/reload behavior remains intact;
  duplicate-name v3 progress now resets before a fresh unique-name hire/reload
  flow.
- Components 8.3–8.5 now explicitly co-own the registry and exhaustiveness test
  because their venue/equipment, workforce, queue, and availability changes
  alter registered factor ranges. They must update bounds/engine sources and
  retain direct Standard/Hard proofs.
- Browser evidence used Playwright desktop Chromium and touch-mobile emulation.
  No physical device was accessed or claimed.

## Spec-to-delivery map

| Acceptance criterion                                                                 | Runtime behavior and source                                                                                                                          | Proof                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Every v1/v2/v3 primary, backup, recovery, and import keeps exactly three preferences | One `normalizeLegacyVersion` → `resetLegacyEnvelope` allowlist; BrowserSaveStore scans all six legacy keys and import uses the same function         | Unit matrix for versions 1–3 and six storage keys; component/UI import test; desktop/touch reset E2E             |
| All old progress is void and onboarding/notice replay once                           | Converter creates `activeRun: null`, default meta, empty records, incomplete onboarding, planning tab, pending notice; verified save consumes marker | Pure conversion assertions, reload/anti-resurrection unit tests, browser reload notice-once proof                |
| Verified v4 is idempotent and cannot resurrect legacy state                          | v4 primary/backup precede legacy; only verified v4 is backed up/restored; legacy keys are quarantined after verified write                           | Standard/Hard double round trip, interrupted-write recovery, stale legacy primary/backup tests, continuation E2E |
| Standard is accessible/default and scenario is orthogonal                            | Standard-first radio fieldset with visible selected state; independent scenario select; context creates both values together                         | Accessibility/component tests and desktop/touch creation/reload E2E                                              |
| Difficulty is immutable and persisted everywhere required                            | No mutation command; `difficulty` required on state/report/record; validation rejects unknown or cross-campaign report values                        | Campaign transition tests, forged/mismatched persistence tests, report/record UI assertions                      |
| Records are partitioned while unlocks stay common and neutral                        | `campaignRecordsByDifficulty` and grouped Game menu sections; unchanged shared meta and equal campaign starting economy                              | Campaign/meta unit test and Game menu component test                                                             |
| Registry exactly covers engine demand factors                                        | Typed arrival/order identity tuples plus `Record<DemandInfluenceId, ...>` registry and equality test                                                 | Registry exhaustiveness unit test                                                                                |
| Standard strengthens both price paths by 1.20–1.25 only                              | Registry applies configured `1.225` price deviation and `1` non-price deviation                                                                      | Independent actual-engine arrival and segment-order slope tests                                                  |
| Hard amplifies every registered supported deviation by 1.60–1.75 from baseline       | Registry applies `1.675` directly to each domain-constrained baseline deviation                                                                      | Per-entry neutral/sign/clamp/boundary test, non-compounding price-path tests, seeded speed-independence test     |
| Difficulty is explained in creation, onboarding, and help                            | Shared labels/descriptions rendered by Title, onboarding guide, and Game menu help                                                                   | Accessibility and component tests                                                                                |
| Existing report-history and unique-name outcomes survive the breaking boundary       | Cumulative specs now expect v4 report persistence and preferences-only reset before fresh unique-name hiring                                         | Eight desktop/touch report-history and staff-name browser cases                                                  |
| Unavailable storage cannot consume a reset or replace state                          | Import requires a concrete store and successful verified save before marker/ref/state mutation; SaveStoreError is surfaced                           | Forced-unavailable-storage component regression proves no save, run, preferences, meta, or success/reset notice  |
| Current operator documentation matches the intermediate runtime                      | README/runbook describe v4 keys/reset/difficulty while retaining three venues/30 days, current name validation, and honest charge-less reports       | Scoped documentation review and lint/format gate                                                                 |
| Later demand-changing slices preserve the sole registry authority                    | Components 8.3–8.5 own `demandInfluences.ts` and `demand.test.ts` with factor-specific bound/source/exhaustiveness obligations                       | Spec-validated downstream contracts in the Phase 8 breakdown                                                     |

## Assurance lane

`fast (lean override)`, Tier 2, with Implement owning focused checks,
self-review, repair, and the component gate.

Recorded standard Test triggers: destructive schema migration, browser
persistence/recovery/import round trips, cross-component state/report/meta
contracts, accessible UI behavior, and real-browser desktop/touch behavior.
Recorded standard Review triggers: shared engine/persistence files, new public
schema and registry APIs, broad runtime scope, and a deliberate breaking data
boundary. The approved TBA + Implement lean override keeps these triggers in
the manifest while routing all gates to the one Implement engagement.

## Deviations and decisions

- No approved product behavior was descoped. Component 8.2 was delivered as one
  complete vertical slice.
- The Lead Coordinator approved a bounded ownership clarification for
  `tests/e2e/report-history.spec.ts`, `tests/e2e/staff-names.spec.ts`, and the
  component breakdown after their v3 expectations were found to contradict the
  approved reset. Only those superseded assertions changed; all prior report,
  naming, reload, and accessibility outcomes remain exercised.
- The Lead Coordinator's post-gate audit added one fail-closed import repair,
  current-runtime README/runbook reconciliation, and downstream registry
  ownership obligations. Those bounded changes invalidate the earlier
  `d1f630…` candidate and require the fresh fingerprint/Tier 2 evidence below;
  no Component 8.3 runtime behavior was started.
- The pure reset uses `1970-01-01T00:00:00.000Z` so identical legacy input has
  deterministic output. A normal browser checkpoint supplies the current save
  time after the boundary.
- Registry neutral values preserve each pre-Phase-8 formula's intercept rather
  than applying Standard then Hard. This is what makes price slope proofs exact
  and prevents compounding.
- Segment appeal is positive-only because every configured non-neutral appeal
  in the current catalogue is a lift; the registry does not invent an aversion.
- There were no new dependencies, external APIs, services, credentials, or
  platform assumptions to revalidate. Executable capability proof therefore
  used the production engine, storage adapter, React UI, and Playwright browser.
- Implement performed no Git mutation. The Lead Coordinator independently
  audited, staged, and committed the exact repaired candidate.

## Validation evidence

The post-audit repair invalidated the earlier `d1f630…` candidate and its gate;
that evidence was not reused. Targeted proof for the repaired candidate:

- `pnpm exec vitest run tests/components/game-loop.test.tsx` exited 0 in 5.83s:
  1 file and 21 tests passed, including forced unavailable storage and a legacy
  import that left save/run/preferences/meta unchanged and claimed neither
  success nor reset.
- `pnpm exec vitest run tests/unit/demand.test.ts tests/unit/persistence.test.ts tests/unit/campaign.test.ts tests/unit/engine.test.ts tests/components/game-loop.test.tsx tests/components/accessibility.test.tsx`
  exited 0 in 5.43s: 6 files and 81 tests passed.
- `pnpm exec playwright test tests/e2e/difficulty-reset.spec.ts tests/e2e/persistence.spec.ts tests/e2e/save-transfer.spec.ts tests/e2e/report-history.spec.ts tests/e2e/staff-names.spec.ts`
  exited 0 in 34.1s: 22 tests passed across desktop Chromium and touch-mobile.

Final candidate identity:

```bash
python3 scripts/worktree-fingerprint.py -- src/game/types.ts src/game/engine.ts src/game/demandModel.ts src/game/demandInfluences.ts src/game/selectors.ts src/game/index.ts src/game/meta.ts src/game/capacity.ts src/content/gameContent.ts src/persistence/saveStore.ts src/app/GameContext.tsx src/components/TitleScreen.tsx src/components/OnboardingGuide.tsx src/components/GameTools.tsx src/components/ReportPanel.tsx src/styles.css tests/unit/demand.test.ts tests/unit/engine.test.ts tests/unit/persistence.test.ts tests/unit/campaign.test.ts tests/components/game-loop.test.tsx tests/components/accessibility.test.tsx tests/e2e/difficulty-reset.spec.ts tests/e2e/persistence.spec.ts tests/e2e/save-transfer.spec.ts tests/e2e/report-history.spec.ts tests/e2e/staff-names.spec.ts tests/fixtures/campaignFixtures.ts README.md docs/agent-runbook.md docs/phase-8-component-breakdown.md docs/components/phase-8-component-8-2-overview.md docs/implementation-context-phase-8.md docs/phase-progress.json
```

The command exited 0 in 0.20s before the gate and 0 in 0.20s after it with the
same fingerprint:
`9434536ff79e7807134246cb4beb5073d61d61b9048cb97824294848fbb2b2b8`.
The explicit scope is every Component 8.2-owned source, test, fixture, and
documentation path, including unchanged `capacity.ts`/`gameContent.ts`, current
README/runbook, and the bounded breakdown/report-history/staff-name/audit
clarifications. The fingerprint tool intentionally excludes the overview and
phase-progress evidence payloads.

Final Tier 2 gate, run once for that unchanged fingerprint:

- `pnpm build` exited 0 in 3.62s. Strict TypeScript and the production Vite/PWA
  build passed; the existing large Three.js chunk warning remains non-blocking.
- `pnpm lint` exited 0 in 7.38s. ESLint reported zero warnings and Prettier check
  passed.
- `pnpm test` exited 0 in 6.27s: 16 files and 159 tests passed.
- `pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts`
  exited 0 in 35.5s: 4 applicable cases passed and 2 intentional
  project-routing cases skipped across desktop Chromium and touch-mobile.

Component gate: **PASS**.

## Manual tests automated

- Legacy recovery startup, notice-once reload, complete key quarantine, and
  retained reduced-motion preference run through the production browser adapter.
- Standard-first selection, scenario/difficulty orthogonality, Hard creation,
  persistence, continuation, and immutable onboarding copy run in both browser
  projects.
- Current v4 export/import, malformed/future rejection, interrupted write,
  last-known-good recovery, and exact-once settlement remain automated.
- Forced storage unavailability proves a readable legacy import retains the
  default run/preferences/meta, writes nothing, consumes no marker, and claims
  neither successful import nor reset.
- Registry exhaustiveness and per-domain sign/clamp/boundary behavior are pure
  deterministic tests over the production engine API.

## Human tasks

None. Component 8.2 requires no account, credential, secret, service, provider,
physical device, merge, deployment, or publication action.
