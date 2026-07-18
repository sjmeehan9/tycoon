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
storage. Use the visible **Clear local campaign** action to reset it safely.

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

## Save recovery

The Phase 1 browser adapter uses `laneway-tycoon.save.v1` and a last-known-good
backup key. A malformed primary automatically offers the valid backup through
the normal Continue action. Do not hand-edit production local-storage payloads.

