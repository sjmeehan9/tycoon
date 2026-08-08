# Component 7.5 — Compact Completion and Reopenable Reports

## What was delivered

A user can now finish a day from a compact result surface whose complete cash,
charge, stock, customer, and explanation report is closed by default and opens
only on request. One primary **Settle & reinvest** action applies the existing
day-close transition exactly once.

Every settled report retained by the current campaign is now reopenable from
Game menu → Reports. Historical views are read-only, render from their selected
`DayReport` value alone, and never inspect or recompute from the current rush,
scene, activity feed, plan, or inventory.

New reports retain complete canonical charge groups even when the mixed live
activity feed has discarded older events. Existing schema-v3 reports remain
unchanged and truthfully disclose: “Charge breakdown unavailable for this older
report.”

## Public interfaces / contracts exposed

- `ReportChargeGroup` stores `drinkId`, `size`, `milk`, actual `priceCents`,
  `quantity`, and `revenueCents`.
- `RushState.chargeGroups?` is the cumulative engine-owned source. It is
  initialized for new rushes, updated at the canonical sale transition, bounded
  by the configured drink/size/milk variant count, and independent of
  `recentActivity`.
- `DayReport.chargeGroups?` is finalized once at rush completion only when its
  quantity and revenue reconcile exactly with `served` and `revenueCents`.
- `MAX_REPORT_CHARGE_GROUPS`, `MIN_REPORT_CHARGE_PRICE_CENTS`, and
  `MAX_REPORT_CHARGE_PRICE_CENTS` expose the configuration-derived persistence
  bounds.
- `ReportViewProps` is a discriminated value/mode contract:
  `mode: 'current'` requires `onSettle`; `mode: 'historical'` forbids it. The
  renderer has no Game Context dependency.
- `ReportPanel` is the current-report adapter and remains the sole UI caller of
  the canonical `closeDay` command.
- Game menu → Reports selects only from the bounded current
  `GameState.history`; its selected report is passed directly to `ReportView`.
- Repeating `closeDay` on an already settled state returns the identical state
  object. Game Context now also skips persistence/meta work for any identity
  no-op transition.

## Files owned

Created:

- `tests/e2e/report-history.spec.ts`
- `docs/components/phase-7-component-7-5-overview.md`

Modified:

- `src/game/types.ts`
- `src/game/engine.ts`
- `src/game/selectors.ts`
- `src/game/index.ts`
- `src/persistence/saveStore.ts`
- `src/app/GameContext.tsx`
- `src/components/ReportPanel.tsx`
- `src/components/GameTools.tsx`
- `src/components/ReinvestPanel.tsx`
- `src/styles.css`
- `tests/unit/engine.test.ts`
- `tests/unit/persistence.test.ts`
- `tests/components/game-loop.test.tsx`
- `tests/components/accessibility.test.tsx`
- `tests/e2e/persistence.spec.ts`
- `tests/e2e/save-transfer.spec.ts`
- `tests/fixtures/campaignFixtures.ts`
- `docs/implementation-context-phase-7.md`
- `docs/phase-progress.json`

Declared ownership path `src/accessibility/useModalFocus.ts` was inspected and
retained unchanged. Its existing trap, Escape close, and trigger-focus restore
contract is exercised by the new report journeys.

## How to run / verify

```bash
pnpm build
pnpm lint
pnpm test
pnpm preview --host 127.0.0.1 --port 4173
pnpm exec playwright test tests/e2e/report-history.spec.ts tests/e2e/persistence.spec.ts tests/e2e/save-transfer.spec.ts
python3 scripts/worktree-fingerprint.py -- src/game/types.ts src/game/engine.ts src/game/selectors.ts src/game/index.ts src/persistence/saveStore.ts src/app/GameContext.tsx src/components/ReportPanel.tsx src/components/GameTools.tsx src/components/ReinvestPanel.tsx src/accessibility/useModalFocus.ts src/styles.css tests/unit/engine.test.ts tests/unit/persistence.test.ts tests/components/game-loop.test.tsx tests/components/accessibility.test.tsx tests/e2e/report-history.spec.ts tests/e2e/persistence.spec.ts tests/e2e/save-transfer.spec.ts tests/fixtures/campaignFixtures.ts
```

The browser gate used the already-built preview. Chromium requires the project
profile's outside-sandbox fallback in this macOS environment.

## Integration notes & gotchas

- Save schema and state version remain exactly 3. No migration, history rewrite,
  reset, or synthesized field was added.
- An older active v3 rush with no `chargeGroups` and prior served sales keeps
  the field absent through completion, so no partial aggregate is represented
  as complete. An older rush with zero prior sales may begin complete capture
  at its first canonical sale.
- The bounded `recentActivity` stream remains presentation evidence only. A
  45-sale regression drives more than 80 mixed observations, proves the feed is
  truncated, and still reconciles all 45 report charges and every revenue cent.
- Persistence accepts an absent group array but strictly validates a present
  one: configured drink/size/milk, bounded actual price, positive integer
  quantity, `quantity × price = group revenue`, unique order variant, finite
  configured group count, and exact report/rush quantity and revenue parity.
- Report disclosure uses native `<details>/<summary>`, has no forced open state,
  and remounts closed when another historical day is selected.
- The mobile Reports layout requires zero-minimum grid tracks. Removing those
  constraints restores intrinsic-width horizontal overflow around the report
  history navigation.
- Victory, bankruptcy, endless continuation, current autosave, JSON transfer,
  reduced motion, and bounded campaign history retain their prior authorities.

## Spec-to-delivery map

| Acceptance criterion                                                  | Runtime behavior and files                                                                                                        | Proof                                                                                              |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Compact current result; full report closed by default                 | `ReportView` exposes six result metrics, bottleneck, one action, and native closed disclosure                                     | Component visibility assertions and desktop/touch browser checks                                   |
| Exactly one idempotent settlement                                     | Current-mode contract requires one `onSettle`; `closeDay` identity guard and Game Context no-op short circuit prevent repeat work | Two synchronous activations, engine identity assertion, one history row before/after reload        |
| Reopen bounded current-campaign history                               | Reports tab maps only `game.history`, defaults to its latest value, and selects a stored `DayReport`                              | Component and real-browser day selection, export/import, and reload                                |
| Historical reports cannot settle or read live state                   | Historical mode forbids `onSettle`; context-free renderer receives only selected report                                           | No historical action in DOM; poisoned current `$99.99` activity never appears in historical report |
| New reports preserve complete canonical charges beyond feed retention | Cumulative `RushState.chargeGroups` updates at `progressService`, then reconciles into `DayReport`                                | High-volume 80-event truncation regression plus report quantity/revenue parity                     |
| Old v3 history remains unchanged and unsynthesized                    | Optional field validation accepts absence; normalization/migrations do not add it; exact disclosure message renders               | Unit byte-shape round trip and browser export/import/reload of mixed old/new history               |
| Persistence stays schema v3 and rejects malformed aggregates          | Configuration-derived limits and exact validation in `saveStore.ts`                                                               | Oversize, impossible-variant, and aggregate/report-total rejection tests                           |
| Mobile, keyboard, touch, focus, and reduced motion remain usable      | Responsive zero-min grid, 44px controls, native disclosure, existing modal focus hook                                             | 360×780 touch tap, desktop keyboard, focus restore, no dialog overflow, reduced-motion reload      |
| Outcome and transfer paths remain intact                              | Existing report/outcome adapters use the new compact surface without changing engine endings                                      | Victory, bankruptcy, endless component tests and persistence/save-transfer browser journeys        |

## Assurance lane

- **Lane:** `fast (lean override)`
- **Validation tier / owner / commit owner:** Tier 2 component gate / Implement /
  Implement under the coordinator's serialized staging handoff.
- **Standard Test triggers recorded:** persistence/export round trips, report
  disclosure/navigation, exact-once settlement, responsive touch/keyboard
  behavior, and regression-prone observable history behavior.
- **Standard Review triggers recorded:** additive `DayReport`/`RushState` public
  contracts, strict save validation, cross-component report navigation, and
  shared responsive styles.
- **Lean disposition:** the approved two-role restriction assigns Tier 2,
  self-review, correction, and commit coordination to Implement.

## Deviations and decisions

- No required behavior was split, deferred, or descoped. No dependency,
  external service, schema version, campaign reset, or asset changed.
- The initial proposal to derive charges from retained activity was rejected
  before implementation because that mixed feed is capped at 80. Complete
  evidence instead accumulates at the canonical sale transition.
- A focused browser geometry assertion found real touch-modal overflow from an
  intrinsic `1fr` minimum. The production grid and assertion were corrected
  before candidate freeze.
- The first sandboxed Chromium launch was rejected by macOS Mach rendezvous
  permissions. The project profile's outside-sandbox fallback ran the same
  installed browser successfully.
- Existing internal React, DOM disclosure, save, and focus contracts were
  rechecked by executable tests; no new external technical assumption required
  web research or a dependency capability spike.
- The approved title art remains byte-identical at SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Validation evidence

- **Candidate fingerprint:**
  `ea64d40f3f724941cfa9abdea3e24e4f47a619a144c46ab00f2445eb9c835f71`
- **Fingerprint command and scope:** the exact command in **How to run /
  verify** returned the same hash immediately before and after Tier 2.
  Overview, context, and progress evidence are excluded from the executable
  candidate scope.
- **Targeted proof:** focused production build PASS; lint/format PASS; focused
  unit/component/accessibility suite 57/57 PASS; named report-history browser
  suite 4/4 PASS; modified persistence/save-transfer browser suite 10/10 PASS.
- **Tier 2 build:** `pnpm build`; exit 0 in 3.294412 seconds. Production emitted
  main 313.37 kB, `ServiceWorld` 206.14 kB, isolated `three-webgl` 724.51 kB,
  and 19 PWA entries / 1,724.22 KiB.
- **Tier 2 lint:** `pnpm lint`; exit 0 in 7.063231 seconds.
- **Tier 2 tests:** `pnpm test`; exit 0 in 5.926605 seconds, 16 files and
  146/146 tests.
- **Tier 2 browser:** against one already-built preview,
  `pnpm exec playwright test tests/e2e/report-history.spec.ts tests/e2e/persistence.spec.ts tests/e2e/save-transfer.spec.ts`;
  exit 0 in 25.791309 seconds, 14/14 PASS across desktop Chromium and exact
  360×780 touch mobile.
- **Raw logs:** none required; final output is concise and reproducible.

## Manual tests automated

- Repeated settlement activation, rerender, autosave checkpoint, reload,
  bounded history, historical read-only isolation, live-data poisoning,
  disclosure default/open state, old/new report selection, schema-v3 JSON
  export/import/reload, focus restoration, desktop keyboard, mobile touch,
  44px targets, dialog overflow, reduced motion, victory, bankruptcy, endless
  continuation, and high-volume feed truncation are all executable tests.

## Human tasks

- No Component 7.5 account, credential, secret, asset, backend, publication, or
  manual setup task exists.
- Representative physical touch-device evidence remains reserved for Component
  7.6 and is not claimed by Playwright.
- Phase 7 merge still requires explicit human approval after Component 7.6.
