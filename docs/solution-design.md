# Solution Design — Laneway Tycoon (Lean Skeleton)

## Authority

This is the minimum architecture contract required by the Technical Business
Analyst and Implement agent. The detailed approved plan in the root conversation
and `docs/requirements.md` are authoritative. The Implement agent may refine
internal module boundaries but may not change behavior or scope without reporting
drift to the coordinator.

## Architecture overview

A static Vite PWA runs entirely in the browser. React owns accessible management
UI and application composition. Canvas 2D owns the fixed-resolution animated
cafe scene. A pure deterministic TypeScript engine accepts commands and advances
seeded simulation state without reading the DOM, clock, storage, or network.

```text
React commands -> application controller -> pure simulation engine -> GameState
      ^                                                        |
      |                                                        v
accessible panels <- selectors/reports <- immutable snapshots -> Canvas scene
                                      |
                                      v
                         versioned browser save adapter
```

## Technology stack

- React 19.2, strict TypeScript, Vite 8.1, pnpm 10, Node 22.
- Canvas 2D with nearest-neighbour sprite rendering; React DOM for controls.
- Vitest and React Testing Library; Playwright for desktop/touch-mobile E2E.
- `vite-plugin-pwa` for manifest, update prompting, and offline asset caching.
- ESLint and formatting checks compatible with the repository standards.
- GitHub Actions builds, validates, and deploys `dist` to GitHub Pages using the
  `/tycoon/` base path.

## System components

- **Content configuration:** drinks, recipes, ingredients, customers, staff,
  traits, equipment, venues, events, progression, and economy tuning.
- **Simulation engine:** seeded PRNG, demand generation, arrivals, ordering,
  queues, preparation, fulfillment, satisfaction, inventory, cash, reputation,
  and day settlement.
- **Campaign controller:** phase transitions, win/loss, unlocks, endless mode,
  history, and event-choice orchestration.
- **Persistence:** versioned save envelope, autosave, migration, import/export,
  corruption recovery, and settings/meta separation.
- **Presentation:** responsive app shell, morning planner, rush HUD/scene, event
  dialog, day report, hiring/upgrades, records/help/settings, and onboarding.
- **PWA/release:** icons/manifest, offline cache, safe update prompt, CI, Pages,
  README, license, and public release configuration.

## Public data and command contracts

At minimum expose typed `GameState`, `DayPlan`, `Customer`, `StaffMember`,
`SimulationEvent`, `DayReport`, `MetaProgress`, and `SaveEnvelope` contracts.
Provide pure command boundaries equivalent to `createCampaign`, `prepareDay`,
`startRush`, `advanceTick`, `resolveEvent`, `closeDay`, and `continueEndless`.
The exact module names may vary, but tests and consumers must use public exports
rather than private implementation details.

## Data flow and persistence

Player commands validate against the current game phase, return immutable state,
and produce serializable domain events. Rendering consumes snapshots only.
Browser persistence stores a small JSON-compatible save locally; export/import
uses the same validated envelope. Save migrations are keyed by `schemaVersion`.

## Security, resilience, and privacy

No input is trusted: imported JSON is schema-validated, numeric values are
bounded, unknown versions are rejected safely, and filenames/content never
become executable code. No network input, identity, secrets, or telemetry exists.
Autosaves use recoverable last-known-good behavior and never interrupt gameplay.

## Performance and accessibility

Simulation ticks are deterministic and decoupled from animation frames. Canvas
work uses sprite sheets and a small logical resolution; panels use semantic DOM.
Mobile controls, keyboard navigation, reduced motion, non-colour status cues,
and textual summaries are first-class acceptance requirements.

## Development, testing, and deployment

The exact commands and budgets are in `docs/project-profile.md`. Each of the
three phases must remain runnable, add vertical user value, run the cumulative
suite, and produce a PASS phase report. The sole Implement agent performs its
own tests, fixes, review, and documentation under the user's lean-team override.

## Cost and external services

No runtime cost or external service exists. GitHub repository hosting, Actions,
and Pages are the only release infrastructure.

## Key decisions and non-goals

All product decisions, assumptions, and exclusions from `docs/requirements.md`
are approved. Internal simplification is welcome only when it preserves the full
observable feature set and quality bar.
