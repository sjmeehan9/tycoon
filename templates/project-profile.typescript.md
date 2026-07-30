# Project Profile — __PROJECT_NAME__

The single source of truth for everything stack- and repo-specific. Every agent reads this before running build, test, or validation commands. Keep it current — agents trust it over their own assumptions.

## Platform & languages

- TypeScript (strict mode)
- Package manager: pnpm

## Validation tiers

Use the smallest tier that proves the current change. A role change is not a reason to repeat a passing command. Every component gate records exact commands, result, duration, and a scoped fingerprint command formed by appending its explicit source/test/config paths after `python3 scripts/worktree-fingerprint.py --`; the phase gate uses the unscoped command. Evidence is reusable only while its scope is unchanged.

Existing projects must migrate any legacy single `Validation sequence` in `docs/project-profile.md` to these three tiers. Template sync deliberately does not overwrite that project-owned file.

### Tier 1 — Targeted inner loop

Owned by Implement while coding. Run focused checks for the changed files/tests through the available runner; these are rapid feedback, not a completion gate except for an explicitly `fast`, non-runtime setup/documentation component. The executable repository fallback has no unresolved placeholders:

```bash
pnpm lint
pnpm build
```

### Tier 2 — Component gate

Run exactly once for the component's final fingerprint. Implement owns this gate in the `fast` and `review` assurance lanes. Independent Test owns it in the `test` and `full` lanes; Implement does not run it first. Review consumes unchanged-tree evidence without rerunning it. The phase-final validation component uses the `phase-gate` lane instead of Tier 2.

```bash
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test --grep @smoke  # when the project has a web UI
```

The component spec may name a narrower concrete test command before implementation. Maintain a stable `@smoke` Playwright set for the primary runtime flow; omit the Playwright command only when the profile explicitly records that the project has no web UI. Never leave shell metasyntax placeholders in the profile.

### Tier 3 — Phase gate

Mandatory and owned by independent Test after all non-final components are committed and the `phase-gate` component has passed aggregate static Review. Run the full cumulative suite plus the phase plan's named UI and critical-backend Validation Targets:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test  # when the project has a web UI
```

### Risk routing and shared resources

- Assign exactly one assurance lane during handoff: `fast` (Implement gate + Implement commit), `test` (Test gate + Implement commit), `review` (Implement gate + Review commit), `full` (Test gate + Review commit), or `phase-gate` (aggregate Review + mandatory Test Phase X; Review commits).
- Test is triggered by UI/browser/external behaviour not fully proven by deterministic component tests, cross-component or persistence round trips, primary-path mocks/fakes, permissions/privacy/security, migrations or destructive state, concurrency/background execution, first use of a runtime/integration pattern, or regression-prone observable behaviour. Review is triggered by shared/core/app-entry/build/config/signing files when applicable, new or changed public API/schema/protocol/cross-component contracts, security/privacy authorization, a spec deviation or ADR, an open Technical Validation risk, an ownership exception, broad scope, or incomplete/contradictory evidence. Use `full` when both sets trigger or any critical signal appears; otherwise use `test`, `review`, or `fast`. The phase-final validation component always uses `phase-gate`.
- Code authoring is serialized by default on the phase branch, with one active component-delivery engagement at a time through its gate and commit. Parallel component authors are forbidden unless this profile is deliberately extended with a complete component-branch/worktree integration protocol. The Lead Coordinator serializes validation that shares mutable browsers, databases, ports, services, or fixtures and serializes Git-index mutation, commits, and pushes. In solo/direct mode, the acting agent verifies exclusive resource/index ownership and self-holds the guard.
- Once the phase/component spec is approved, agents do not pause for per-component plan approval. Pause only for a material spec change, conscious descope, new external authority, or a project-profile human gate.

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
- One branch per phase: `phase-[X]`. Components are serialized and committed to the phase branch, one commit per component (`feat(phase-X): Component X.Y — [name]`).
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
