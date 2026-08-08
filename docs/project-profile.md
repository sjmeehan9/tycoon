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

## Validation tiers

The user-approved lean-team override applies to every tier: the sole `implement`
agent owns targeted checks, component gates, defect correction, the cumulative
phase gate, and its reports. The coordinator verifies scope, fingerprints,
evidence, and Git serialization; no Test, Review, Debug, or Phase Docs agent is
introduced.

Use the smallest tier that proves the current state. A role handoff is not a
reason to repeat passing evidence. Every component gate records its exact
commands, duration, result, and a scoped fingerprint formed by appending its
explicit source, test, and configuration paths after
`python3 scripts/worktree-fingerprint.py --`. The phase gate records the
unscoped fingerprint. Evidence is reusable only while that scope is unchanged.

### Tier 1 — Targeted inner loop

The Implement agent runs the focused unit, component, or Playwright files named
by the approved component specification while coding. When there is no narrower
safe command, use this executable fallback:

```bash
pnpm build
pnpm lint
```

Targeted evidence is rapid feedback, not a runtime component's completion gate.
An isolated setup or documentation component may use it as its completion gate
only when its approved specification says so explicitly.

### Tier 2 — Component gate

The Implement agent runs this tier exactly once for the component's final
fingerprint. The component specification may replace the two retained smoke
journeys with exact, narrower Playwright files that exercise the changed runtime
path, but it may not omit a real-browser path for UI, persistence, PWA, WebGL,
or responsive-layout work.

```bash
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test tests/e2e/cart-day.spec.ts tests/e2e/accessibility.spec.ts
```

### Tier 3 — Phase gate

The final component of every phase runs the complete cumulative sequence and all
named phase-plan Validation Targets. "Phase PASS" means exactly this tier plus
those targets passed for the recorded global fingerprint:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

Implementation authoring, browser/preview use, port `4173`, the Git index,
commits, and pushes are serialized. One Implement engagement delivers one
component through its gate and commit before the next component begins. A clear
failure returns once to the same engagement for correction; repeated,
ambiguous, flaky, cross-component, data-corruption, or architecture/spec
failures are escalated to the coordinator and user rather than routed to a
forbidden agent role.

For lifecycle tracking, every non-final component uses `fast (lean override)`:
the plan still records every standard Test/Review trigger it matches, but the
user's explicit team restriction routes its Tier 2 gate, self-review, fixes, and
commit to Implement. The final component uses `phase-gate (lean override)`:
Implement owns Tier 3, the phase report, self-review, and commit while the
coordinator independently audits the evidence. The unavailable `test`,
`review`, and `full` routes must not be assigned in this repository unless the
user later changes the team restriction.

## Test frameworks

- **Unit/component:** Vitest and React Testing Library
- **UI/E2E harness:** Playwright with desktop Chromium and representative touch-mobile projects
- **Game balance:** deterministic seeded simulation tests exercising full campaign outcomes

## Human validation channel

Run `pnpm dev` or `pnpm preview`, then play the named phase flows in a 1280×800
desktop browser and a 360×780 touch-mobile browser or Playwright project. Dense
3D service must also be checked on a representative mid-tier WebGL-capable
mobile device. GitHub Pages is the production channel; publishing an approved
phase requires the explicit release gate in the Git workflow contract.

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

- Treat `main` as protected and never commit to it directly. Hosted evidence
  records that GitHub did not have an enforced protection rule at the last
  audit, so the PR/check workflow is mandatory even while server-side
  protection remains absent.
- Use one branch per additive phase: `phase-X` (Phase 7 onward for this
  initiative).
- Components are committed to their phase branch with messages in the form
  `feat(phase-X): Component X.Y — <name>`.
- A phase may merge only after its validation targets pass, a
  `docs/phase-X-test-report.md` records PASS, and the human approves the merge.
- Each later phase may branch from the preceding phase's validated PASS head so
  implementation can continue before the preceding human-approved merge.
- Production publication and repository visibility changes require the final
  release gate, already identified as an intended outcome by the user.

## External services & human-task inventory

- Completed Phases 1–6 require no further setup.
- The next-level evolution introduces no account, credential, secret, backend,
  paid asset, or runtime external service.
- After each additive phase records PASS, the human approves or rejects its
  merge.
- The final additive phase requires explicit approval to publish the updated
  GitHub Pages release and a hosted desktop/touch-mobile/WebGL/offline check.

## Performance budgets

- Responsive at 360 CSS pixels wide through large desktop screens.
- At 360×780 during service, the compact 3D scene and complete rush dashboard
  must be simultaneously visible without document scrolling; live activity and
  stock follow below.
- Maintain at least a responsive 30 frames per second during a dense
  department-store rush on a representative mid-tier mobile device and target
  60 frames per second on desktop. Use bounded crowds, instancing, level of
  detail, and reduced-motion behavior where required without changing simulation
  truth.
- WebGL is required for gameplay. An unsupported browser receives an accessible
  explanatory message rather than a 2D gameplay fallback. Reduced-motion users
  retain the 3D scene and complete textual outcome parity with motion stopped or
  minimized.
- Lighthouse mobile scores of at least 90 for performance, accessibility, best
  practices, and PWA-installability checks where Lighthouse exposes them.
- Initial compressed application assets should remain practical for first load
  over mobile broadband; individual precached assets remain below the configured
  one-megabyte Workbox limit, and textures/models must be optimized.

## Framework versions

- React 19.2.x
- Vite 8.1.x
- TypeScript, Vitest, Playwright, ESLint, and `vite-plugin-pwa`: pin mutually
  compatible current stable releases in `pnpm-lock.yaml` during implementation.
- Three.js `0.185.1`, React Three Fiber `9.7.0`, and `@types/three` `0.185.4`
  are the exact MIT-licensed 3D pins verified against React 19.2 and Vite 8.1
  during Component 7.2 Technical Validation.
- Target Vite's modern-browser baseline, including Safari 16.4 or newer.

## Standards file

`.github/instructions/copilot.instructions.md` (TypeScript section applies).

## Lean team override

Reconfirmed by the user for the next-level evolution on 8 August 2026: only the
`technical-business-analyst` and `implement` agent roles may be spawned. The
coordinator supplies skeleton contracts, performs stewardship, verifies
outputs, and keeps the sequential delivery on scope. The Technical Business
Analyst owns the comprehensive additive phase plan. One Implement engagement
owns all production code, tests, defect correction, self-review, component
overviews, the three validation tiers, phase reports, and phase documentation;
no other agent role may be used.
