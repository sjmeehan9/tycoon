# Project Profile — __PROJECT_NAME__

The single source of truth for everything stack- and repo-specific. Every agent reads this before running build, test, or validation commands. Keep it current — agents trust it over their own assumptions.

## Platform & languages

- Python 3.12+ application
- Dependency management: `pyproject.toml` + `.venv`

## Validation sequence

Run in order; all must pass ("all checks pass" means exactly this list):

```bash
source .venv/bin/activate
black --check src/ tests/
isort --check-only src/ tests/
pytest -q
```

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
- One branch per phase: `phase-<X>`. Components are committed to the phase branch, one commit per component (`feat(phase-X): Component X.Y — <name>`).
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
