# Component 3.3 — Onboarding, Accessibility, and Mobile Polish

## What was delivered

A first-time or returning user can now learn the real four-step trading loop,
reach and understand every primary action with keyboard or touch, and play at
desktop or 360px mobile sizes with semantic, motion-safe, non-colour-only
feedback.

## Public interfaces / contracts exposed

- `handleTabListKeyDown` applies automatic WAI-ARIA tab activation for Left,
  Right, Home, and End keys to both planner and game-tool tablists.
- `useModalFocus` places initial focus, traps Tab/Shift+Tab, handles Escape when
  supplied, and restores focus for application dialogs.
- `GameAnnouncer` emits concise phase/report/outcome announcements and never
  announces individual simulation ticks.
- `OnboardingGuide` follows real game phases from planning through reinvestment;
  it is skippable, replayable from Help, and uses the versioned
  `Preferences.onboardingComplete` field for durable completion.
- Game status remains available as text and icons as well as colour. Reduced
  motion, audio, onboarding, and active planner/tool tabs remain persisted
  preferences.

## Files owned

- `src/accessibility/keyboard.ts`, `src/accessibility/useModalFocus.ts`,
  `src/accessibility/GameAnnouncer.tsx`
- `src/components/OnboardingGuide.tsx`, `src/components/EventDialog.tsx`,
  `src/components/GameTools.tsx`, `src/components/Planner.tsx`
- `src/components/ReinvestPanel.tsx`, `src/components/RushPanel.tsx`,
  `src/App.tsx`, `src/styles.css`
- `tests/components/accessibility.test.tsx`,
  `tests/components/game-loop.test.tsx`
- `tests/e2e/accessibility.spec.ts`, retained journey specifications under
  `tests/e2e/`, and `tests/fixtures/campaignFixtures.ts`
- `package.json`, `pnpm-lock.yaml`

## How to run / verify

Follow the project profile validation sequence. Component 3.3 passes 67 Vitest
tests and 26 cumulative Playwright tests, with two intentional project-specific
skips so the desktop keyboard and touch-mobile journeys each run only on their
matching browser profile. The browser flow also runs axe serious/critical rules,
focus assertions, 44px target checks, and horizontal-overflow checks.

## Integration notes & gotchas

- The welcome dialog is shown again after reloading an unfinished first-day
  guide; only an explicit Skip/Finish marks onboarding complete. The user can
  always replay it from the Help tab.
- Planner and game-tool tabs use automatic activation: moving focus with arrow,
  Home, or End also selects the destination tab.
- Rush feedback deliberately avoids `aria-live` tick updates. Text summaries,
  event dialogs, phase changes, and reports carry the accessible result.
- The minimum 44px interactive-target rule applies at coarse-pointer sizes,
  while the fixed game scene sits above progressively disclosed controls.
- `@axe-core/playwright` is a test-only dependency; the production application
  still has no runtime network, telemetry, or external-service dependency.
