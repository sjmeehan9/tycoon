# Laneway Tycoon Agent Runbook

## Prerequisites

- Node.js 22.12 or newer
- pnpm 10
- No account, secret, backend, or environment file

Install the pinned dependencies:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

The browser-install command is a one-time local machine setup.

## Run the game

```bash
pnpm dev
```

Open the URL printed by Vite. A campaign is stored entirely in browser local
storage. Use **Game menu → Save transfer** to export/import a campaign, restore
a last-known-good save, or start clean while retaining settings and unlocks.

To exercise the production bundle:

```bash
pnpm build
pnpm preview
```

## Validate

Run these commands exactly and in order:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

Playwright launches desktop Chromium and a 360px touch-mobile Chromium project.
On macOS automation hosts, the browser process may require permission to launch
outside a restricted process sandbox.

## Deterministic engine

- One engine tick is 250ms of simulated time; a rush is 300 ticks.
- A saved game contains the PRNG state, queue, active service, event, and tick.
- Display speed changes how often the controller dispatches a tick, not the
  calculation performed by a tick.
- Tests and other consumers import public contracts from `src/game/index.ts`.
- The campaign closes on Day 30. Victory requires the cafe, $300 cash, and 65
  reputation; bankruptcy is checked after settlement only below −$100.
- Balance maintenance belongs in `tests/unit/campaign.test.ts`: keep at least
  two complete viable strategies and one complete bankruptcy path using public
  commands. Never introduce seed- or test-specific production logic.
- `tests/fixtures/campaignFixtures.ts` contains validated near-outcome and
  growth snapshots for production import UI journeys. If the schema or balance
  changes, update these fixtures and their full-campaign proof together.

## Save recovery

The current browser adapter uses schema/key version 2 and retains the previous
validated primary as a last-known-good backup. Version-1 exported files and
legacy local keys migrate automatically; future versions are rejected.

If the primary payload is corrupt and a valid backup exists, the title screen
shows a recovery warning. Open **Game menu → Save transfer → Restore
last-known-good save** to make that snapshot primary again. Export before a
manual browser-data reset whenever possible. Imported files are limited to
750 KB and validated completely before current data changes; do not hand-edit
local-storage payloads.
