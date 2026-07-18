# Project Profile — Laneway Tycoon

The single source of truth for stack- and repository-specific execution. The
approved product and implementation plan in the root Codex conversation remains
the product source of truth.

## Platform & languages

- Browser-only responsive Progressive Web App
- TypeScript in strict mode
- React 19.2 and Vite 8.1
- Node.js 22.12 or newer; pnpm 10
- No backend, account system, secrets, analytics, or runtime external services

## Validation sequence

Run in order; all must pass ("all checks pass" means exactly this list):

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

## Test frameworks

- **Unit/component:** Vitest and React Testing Library
- **UI/E2E harness:** Playwright with desktop Chromium and representative touch-mobile projects
- **Game balance:** deterministic seeded simulation tests exercising full campaign outcomes

## Human validation channel

Run `pnpm dev` or `pnpm preview`, then play the named phase flows in a desktop
browser and a mobile browser or Playwright-emulated touch device. GitHub Pages
is the production channel and is enabled only at the final release gate.

## Test & coverage policy

Essential tests must prove primary gameplay, persistence, responsive UI, and
offline paths. Coverage is not measured; do not add a percentage gate.

## Project layout

```text
package.json       project metadata, scripts, and dependencies
pnpm-lock.yaml     reproducible dependency resolution
src/               application, simulation engine, UI, and content
public/            PWA metadata and bundled visual/audio assets
tests/             Vitest and Playwright tests
docs/              planning, implementation context, and validation reports
```

The obsolete bootstrap-only `pyproject.toml` is removed when the TypeScript
application scaffold is created.

## Run instructions

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

No `.env.local` is required for the game. Never add secrets to the repository.

## Git workflow contract

- `main` is protected; never commit to it directly.
- Use one branch per phase: `phase-1` through `phase-6`.
- Components are committed to their phase branch with messages in the form
  `feat(phase-X): Component X.Y — <name>`.
- A phase may merge only after its validation targets pass, a
  `docs/phase-X-test-report.md` records PASS, and the human approves the merge.
- Each later phase may branch from the preceding phase's validated PASS head so
  implementation can continue before the preceding human-approved merge.
- Production publication and repository visibility changes require the final
  release gate, already identified as an intended outcome by the user.

## External services & human-task inventory

- Phases 1–2: none.
- Phase 3 release: make `sjmeehan9/tycoon` public, enable GitHub Pages with
  GitHub Actions, and confirm the published game URL.
- Phases 4–5: no account, credential, secret, external service, or publication
  setup. After each phase records PASS, the human approves or rejects its merge.
- Phase 6: no new account, credential, or secret. After local PASS, the human
  approves or rejects the final merge and confirms the updated GitHub Pages
  release before hosted cumulative PASS is recorded.

## Performance budgets

- Responsive at 360 CSS pixels wide through large desktop screens.
- Maintain a responsive service-rush animation on a mid-tier mobile device,
  respecting reduced-motion preferences.
- Lighthouse mobile scores of at least 90 for performance, accessibility, best
  practices, and PWA-installability checks where Lighthouse exposes them.
- Initial compressed application assets should remain practical for first load
  over mobile broadband; large raster assets must be optimized.

## Framework versions

- React 19.2.x
- Vite 8.1.x
- TypeScript, Vitest, Playwright, ESLint, and `vite-plugin-pwa`: pin mutually
  compatible current stable releases in `pnpm-lock.yaml` during implementation.
- Target Vite's modern-browser baseline, including Safari 16.4 or newer.

## Standards file

`.github/instructions/copilot.instructions.md` (TypeScript section applies).

## Lean team override

At the user's direction, only the `technical-business-analyst` and `implement`
agent roles may be spawned. The coordinator supplies skeleton contracts,
performs stewardship, and verifies outputs. The Implement agent owns coding,
self-testing, defect correction, self-review, validation reports, and phase
documentation; no other agent role may be used.
