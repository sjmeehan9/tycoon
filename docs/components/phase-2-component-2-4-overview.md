# Component 2.4 — Campaign Outcomes, Meta Progress, and Save Transfer

## What was delivered

A user can now complete the 30-day campaign with a deterministic victory or
bankruptcy outcome, continue a win in endless mode, retain non-economic
achievements and scenario unlocks, and safely export, import, migrate, or
recover a local save from the reachable game menu.

## Public interfaces / contracts exposed

- `CAMPAIGN_RULES` is the typed source for the Day 30 deadline, victory cash and
  reputation targets, overdraft floor, and save-validation bounds.
- `closeDay` resolves bankruptcy before deadline outcomes, while
  `continueEndless` advances an eligible victory to Day 31 without changing the
  campaign economy.
- `MetaProgress`, `CampaignOutcome`, `CampaignRecord`, `Achievement`, and the
  version-2 `SaveEnvelope` are serialisable contracts in `src/game/types.ts`.
- `recordCampaignOutcome` applies each outcome exactly once and unlocks only
  cosmetics, records, scenarios, and endless mode; it never modifies a run.
- `BrowserSaveStore` maintains primary and last-known-good local saves, migrates
  version 1, rejects unsupported/corrupt/unbounded data, and exposes safe JSON
  import/export helpers through `serializeEnvelope` and `importEnvelope`.
- `GameProvider` exposes preferences, meta progress, save transfer, recovery,
  scenario start, reset, and endless continuation through the same active-run
  context used by gameplay.

## Files owned

- `src/game/types.ts`, `src/game/engine.ts`, `src/game/meta.ts`
- `src/game/index.ts`, `src/game/selectors.ts`, `src/content/gameContent.ts`
- `src/persistence/saveStore.ts`, `src/app/GameContext.tsx`
- `src/components/EndingPanel.tsx`, `src/components/GameTools.tsx`
- `src/components/TitleScreen.tsx`, `src/components/GameHeader.tsx`, `src/App.tsx`
- `src/styles.css`
- `tests/fixtures/campaignFixtures.ts`, `tests/unit/campaign.test.ts`
- `tests/unit/persistence.test.ts`, `tests/components/game-loop.test.tsx`
- `tests/e2e/campaign-outcomes.spec.ts`, `tests/e2e/save-transfer.spec.ts`

## How to run / verify

Run the project-profile validation sequence. Component 2.4 passes 57 Vitest
tests and 16 Playwright tests across desktop Chromium and 360px touch-mobile.
For a manual check, use **Game menu** to inspect targets and records, export a
save, import it again, and open a campaign-outcome fixture through the tested
production import path.

## Integration notes & gotchas

- Outcome ordering is deliberate: a settlement below the overdraft floor is a
  bankruptcy even on Day 30; equality with the floor remains solvent.
- A Day 30 run that misses any victory requirement ends as `targetMissed` and
  cannot enter endless mode. Day 29 always continues normally.
- Campaign outcomes carry a stable ID so repeated restores/renders cannot
  duplicate records or unlock processing.
- Import validation treats JSON as untrusted data: it checks size, schema,
  collection limits, enums, identifiers, and every nested gameplay value before
  replacing current state. An unsupported future version is never overwritten.
- The backup is the previously validated primary save, not a second mutable
  reference. Resetting a run preserves preferences and meta progression.
- Alternate scenarios change weather/demand setup only; no meta unlock grants
  cash, reputation, speed, quality, inventory, or pricing advantages.
