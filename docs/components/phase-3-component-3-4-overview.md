# Component 3.4 — Offline-Safe PWA and Release Artifacts

## What was delivered

After one successful production load, a user can now install and relaunch the
complete game offline, defer a waiting version without interrupting play, or
verify a local checkpoint before accepting an update; the `/tycoon/` Pages
build, public documentation, license, and gated deploy workflow are release
ready without publishing anything.

## Public interfaces / contracts exposed

- `PwaUpdatePrompt` is the production prompt-mode registration UI. It reports
  offline readiness/registration failure and exposes **Keep playing** and
  **Save and update** for a real waiting worker.
- `useGame().checkpointSave(): boolean` synchronously verifies the current
  versioned envelope in browser storage. A false result blocks worker
  activation; no automatic active-run refresh path exists.
- Production mode uses Vite base, PWA `id`, `scope`, and `start_url`
  `/tycoon/`. Development stays at `/`; Playwright rebuilds and tests the exact
  production preview at `/tycoon/`.
- `manifest.webmanifest`, 192px/512px/maskable PNG icons, all hashed app chunks,
  art, audio, and navigation HTML are precached as same-origin release assets.
- `.github/workflows/deploy-pages.yml` runs frozen install, build, lint, Vitest,
  production Playwright, artifact upload, and a protected-main-only Pages
  deploy using standard `pages:write` and `id-token:write` permissions.

## Files owned

- `src/pwa/PwaUpdatePrompt.tsx`, `src/app/GameContext.tsx`, `src/App.tsx`,
  `src/styles.css`
- `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`,
  `index.html`, `package.json`, `pnpm-lock.yaml`
- `public/icon.svg`, `public/pwa-*.png`, `public/.nojekyll`
- `tests/components/pwa-update.test.tsx`, `tests/e2e/pwa.spec.ts`, and retained
  E2E journeys updated for base-relative navigation
- `.github/workflows/deploy-pages.yml`, `README.md`, `CONTRIBUTING.md`, `LICENSE`,
  `docs/public-release-checklist.md`

## How to run / verify

Run `pnpm build && pnpm preview`, then open
`http://localhost:4173/tycoon/`. `pnpm test:e2e` always rebuilds that production
artifact before running. Component 3.4 passes 70 Vitest tests and 29 cumulative
Playwright tests, with five intentional cross-profile skips. The PWA cases use
a real generated worker for offline reload plus real waiting-worker defer and
activation cycles.

## Integration notes & gotchas

- Production preview must load Vite in `production` mode; this is what mounts
  the built assets at `/tycoon/`. Changing the repository name requires matching
  Vite base and manifest `id`/`scope`/`start_url` changes.
- `vite-plugin-pwa@1.3.0` supports Vite 8. `workbox-window@7.4.1` is its direct
  prompt-client peer; both are build/test dependencies and add no runtime
  service or request.
- Prompt mode deliberately keeps `skipWaiting` and `clientsClaim` false until
  the user accepts. Acceptance is refused when storage cannot verify the save.
- The PWA E2E spec changes only the generated `dist/sw.js` bytes to create a
  real waiting worker and restores the original bytes after every test.
- Static source and bundle inspection found no telemetry, ads, secrets,
  external runtime fetch, or personal-data route. The generated precache is 17
  entries / about 780 KiB; the application JavaScript is about 90 KiB gzip.
- Publication and repository visibility remain the human gate documented in
  `docs/public-release-checklist.md`; this component performs neither action.
