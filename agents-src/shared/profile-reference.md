## Project Profile

`docs/project-profile.md` is the single source of truth for everything stack- and repo-specific: platform and languages, the validation sequence, test frameworks and the UI/E2E harness, coverage policy, project layout, run instructions, the git workflow contract, external services and human tasks, and performance budgets. Read it before running any build, test, or validation command.

**Validation rule:** "all checks pass" means the validation sequence defined in `docs/project-profile.md` passes — run those commands exactly. Never substitute commands from memory or assume a stack (no `.venv`, `pytest`, or `pnpm` unless the profile says so). If `docs/project-profile.md` is missing, stop and raise it under **Problems / blockers** — do not guess.

**Git rule:** commits, branches, merges, and deploys follow the profile's *Git workflow contract* section. Never commit to or merge `main` unless that contract says so.
