# Solution Design — Laneway Tycoon (Lean Skeleton)

## Authority

This is the minimum architecture contract required by the Technical Business
Analyst and Implement agent. The detailed approved plan in the root conversation
and `docs/requirements.md` are authoritative. The Implement agent may refine
internal module boundaries but may not change behavior or scope without reporting
drift to the coordinator.

## Architecture overview

A static Vite PWA runs entirely in the browser. React owns accessible management
UI and application composition. A lazy Three.js/React Three Fiber renderer owns
the fixed-isometric WebGL2 service presentation. A pure deterministic TypeScript
engine accepts commands and advances seeded simulation state without reading the
DOM, render clock, storage, or network.

```text
React commands -> application controller -> pure simulation engine -> GameState
      ^                                                        |
      |                                                        v
accessible panels <- selectors/reports <- immutable snapshots -> WebGL2 scene
                                      |
                                      v
                         versioned browser save adapter
```

## Technology stack

- React 19.2, strict TypeScript, Vite 8.1, pnpm 10, Node 22.
- Three.js 0.185.1 and React Three Fiber 9.7.0 for lazy WebGL2 service
  rendering; React DOM for all controls and authoritative text.
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
- **Presentation:** responsive app shell, scene-free morning planner,
  fixed-isometric service world, complete rush dashboard, event dialog, compact
  day result and disclose-on-request report, reopenable report history,
  hiring/upgrades, records/help/settings, and onboarding.
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

Simulation ticks are deterministic and decoupled from animation frames. The
service renderer receives one detached, deeply frozen, bounded snapshot; its
frame callbacks may change local mesh transforms only. Worlds use an
orthographic camera, capped DPR, bounded lights/shadows/crowds, and instanced
repeated geometry. Panels use semantic DOM. At 360×780, scene and complete
dashboard fit together above the fold. Mobile controls, keyboard navigation,
reduced motion, non-colour status cues, and textual summaries are first-class
acceptance requirements. Unsupported WebGL2 receives semantic save-safe
guidance and never a 2D gameplay fallback.

## Development, testing, and deployment

The exact commands and budgets are in `docs/project-profile.md`. Each additive
phase must remain runnable, add vertical user value, run the cumulative suite,
and produce a PASS phase report. The sole Implement agent performs its own
tests, fixes, review, and documentation under the user's lean-team override.

## Cost and external services

No runtime cost or external service exists. GitHub repository hosting, Actions,
and Pages are the only release infrastructure.

## Key decisions and non-goals

All product decisions, assumptions, and exclusions from `docs/requirements.md`
are approved. Phase 7 deliberately retains schema v3, the 30-day campaign, one
balanced mode, and cart/kiosk/cafe. Phase 8 alone owns the v4 reset,
Standard/Hard demand contracts, 40-day campaign, and department-store venue.
Internal simplification is welcome only when it preserves the full observable
feature set and quality bar.
