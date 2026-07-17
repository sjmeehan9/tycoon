# Project Profile — __PROJECT_NAME__

The single source of truth for everything stack- and repo-specific. Every agent reads this before running build, test, or validation commands. Keep it current — agents trust it over their own assumptions.

## Platform & languages

- TypeScript (strict mode)
- Package manager: pnpm

## Validation sequence

Run in order; all must pass ("all checks pass" means exactly this list):

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
```

## Test frameworks

- **Unit:** Jest (or Vitest — record the choice here once made)
- **UI / E2E harness:** Playwright — this is the harness the Test agent's phase-validation mode runs over the phase's user-facing flows

## Human validation channel

Preview deployment (or local dev server) per Run instructions; phase validation lists the flows to exercise under **Required actions (human)** when manual verification is needed.

## Test & coverage policy

Essential tests proving the primary paths. Coverage is **not measured** — do not add coverage flags or report coverage gaps as findings.

## Project layout

```
package.json     project metadata & scripts
src/             application code
tests/           unit tests (e2e/ for Playwright specs)
docs/            project documents (plans, breakdowns, reports)
```

## Run instructions

```bash
pnpm install
pnpm dev    # adjust to the real dev script once it exists
```

Secrets and configuration live in root-level `.env.local` (copied from `.env.example`; gitignored) — never commit real secrets.

## Git workflow contract

- `main` is protected — never commit to or merge `main` directly.
- One branch per phase: `phase-<X>`. Components are committed to the phase branch, one commit per component (`feat(phase-X): Component X.Y — <name>`).
- The phase branch merges to `main` only after `docs/phase-X-test-report.md` is PASS **and** the human has approved (merge request goes under Required actions).
- Production deploys additionally require an explicit approval gate (Required actions) — preview deploys are unrestricted.
- Standalone fixes outside a phase: short-lived branch + PR.

## External services & human-task inventory

Feeds Component X.1 (human setup) of each phase. List accounts, API keys, and infrastructure the project needs (fill in during planning):

- (none yet)

## Performance budgets

- Lighthouse mobile ≥ 90 on primary pages (adjust per project)
- LCP < 2.5s on a mid-tier device over 4G

## Framework versions

- Verify current framework versions (Next.js/Node/etc.) against official documentation during Technical Validation; record them here.

## Standards file

`.github/instructions/copilot.instructions.md` (TypeScript section applies).
