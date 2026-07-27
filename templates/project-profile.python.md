# Project Profile — __PROJECT_NAME__

The single source of truth for everything stack- and repo-specific. Every agent reads this before running build, test, or validation commands. Keep it current — agents trust it over their own assumptions.

## Platform & languages

- Python 3.12+ application
- Dependency management: `pyproject.toml` + `.venv`

## Validation tiers

Use the smallest tier that proves the current change. A role change is not a reason to repeat a passing command. Every component gate records exact commands, result, duration, and a scoped fingerprint command formed by appending its explicit source/test/config paths after `python3 scripts/worktree-fingerprint.py --`; the phase gate uses the unscoped command. Evidence is reusable only while its scope is unchanged.

Existing projects must migrate any legacy single `Validation sequence` in `docs/project-profile.md` to these three tiers. Template sync deliberately does not overwrite that project-owned file.

### Tier 1 — Targeted inner loop

Owned by Implement while coding. Run focused checks for the changed files/tests through the available runner; these are rapid feedback, not a completion gate except for an explicitly `fast`, non-runtime setup/documentation component. The executable repository-wide fallback has no unresolved placeholders:

```bash
source .venv/bin/activate
black --check src/ tests/
isort --check-only src/ tests/
python -m compileall -q src
```

### Tier 2 — Component gate

Run exactly once for the component's final fingerprint. Implement owns this gate in the `fast` and `review` assurance lanes. Independent Test owns it in the `test` and `full` lanes; Implement does not run it first. Review consumes unchanged-tree evidence without rerunning it. The phase-final validation component uses the `phase-gate` lane instead of Tier 2.

```bash
source .venv/bin/activate
black --check src/ tests/
isort --check-only src/ tests/
pytest -q tests/
```

The component spec may replace `tests/` with narrower concrete paths when it records them before implementation. Include a real-entry-point smoke/integration test whenever the component changes runtime behaviour; never leave shell metasyntax placeholders in the profile.

### Tier 3 — Phase gate

Mandatory and owned by independent Test after all non-final components are committed and the `phase-gate` component has passed aggregate static Review. Run the full cumulative suite plus the phase plan's named UI/entry-point and critical-backend Validation Targets:

```bash
source .venv/bin/activate
black --check src/ tests/
isort --check-only src/ tests/
pytest -q
```

### Risk routing and shared resources

- Assign exactly one assurance lane during handoff: `fast` (Implement gate + Implement commit), `test` (Test gate + Implement commit), `review` (Implement gate + Review commit), `full` (Test gate + Review commit), or `phase-gate` (aggregate Review + mandatory Test Phase X; Review commits).
- Test is triggered by UI/external behaviour not fully proven by deterministic component tests, cross-component or persistence round trips, primary-path mocks/fakes, permissions/privacy/security, migrations or destructive state, concurrency/background execution, first use of a runtime/integration pattern, or regression-prone observable behaviour. Review is triggered by shared/core/app-entry/build/config/signing files when applicable, new or changed public API/schema/protocol/cross-component contracts, security/privacy authorization, a spec deviation or ADR, an open Technical Validation risk, an ownership exception, broad scope, or incomplete/contradictory evidence. Use `full` when both sets trigger or any critical signal appears; otherwise use `test`, `review`, or `fast`. The phase-final validation component always uses `phase-gate`.
- Code authoring is serialized by default on the phase branch, with one active component-delivery engagement at a time through its gate and commit. Parallel component authors are forbidden unless this profile is deliberately extended with a complete component-branch/worktree integration protocol. The Lead Coordinator serializes validation that shares mutable databases, browsers, ports, services, or fixtures and serializes Git-index mutation, commits, and pushes. In solo/direct mode, the acting agent verifies exclusive resource/index ownership and self-holds the guard.
- Once the phase/component spec is approved, agents do not pause for per-component plan approval. Pause only for a material spec change, conscious descope, new external authority, or a project-profile human gate.

## Test frameworks

- **Unit:** pytest (`tests/`)
- **UI / E2E harness:** Playwright (only if the project has a web UI — otherwise end-to-end tests are pytest integration tests against the real entry points)

## Human validation channel

Local run of the application per Run instructions; phase validation lists the flows to exercise under **Required actions (human)** when manual verification is needed.

## Test & coverage policy

Essential tests proving the primary paths. Coverage is **not measured** — do not add coverage flags or report coverage gaps as findings.

## Project layout

```
pyproject.toml   project metadata & dependencies
src/             application code
tests/           pytest tests
docs/            project documents (plans, breakdowns, reports)
```

## Run instructions

```bash
python -m venv .venv && source .venv/bin/activate && pip install -e '.[dev]'
python -m __PROJECT_SLUG__    # adjust to the real entry point once it exists
```

Secrets and configuration live in root-level `.env.local` (copied from `.env.example`; gitignored) — never commit real secrets.

## Git workflow contract

- `main` is protected — never commit to or merge `main` directly.
- One branch per phase: `phase-[X]`. Components are serialized and committed to the phase branch, one commit per component (`feat(phase-X): Component X.Y — [name]`).
- The phase branch merges to `main` only after `docs/phase-X-test-report.md` is PASS **and** the human has approved (merge request goes under Required actions).
- Standalone fixes outside a phase: short-lived branch + PR.

## External services & human-task inventory

Feeds Component X.1 (human setup) of each phase. List accounts, API keys, and infrastructure the project needs (fill in during planning):

- (none yet)

## Performance budgets

- (define per project — e.g. p95 request latency, batch runtime)

## Framework versions

- Verify current library versions against official documentation during Technical Validation; record pins in `pyproject.toml`.

## Standards file

`.github/instructions/copilot.instructions.md` (Python section applies).
