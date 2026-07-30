## Project Profile

`docs/project-profile.md` is the single source of truth for everything stack- and repo-specific: platform and languages, targeted/component/phase validation tiers, test frameworks and the UI/E2E harness, coverage policy, shared-resource locks, project layout, run instructions, the git workflow contract, external services and human tasks, and performance budgets. Read it before running any build, test, or validation command.

**Validation rule:** run only the validation tier or stage-specific checks your role contract assigns, using the profile's exact commands. A role handoff is not permission to repeat a broader tier. Never substitute commands from memory or assume a stack (no `.venv`, `pytest`, or `pnpm` unless the profile says so). If `docs/project-profile.md` is missing or still defines only a legacy single validation sequence, stop and raise profile migration under **Problems / blockers** — do not guess.

**Git rule:** commits, branches, merges, and deploys follow the profile's *Git workflow contract* section. Never commit to or merge `main` unless that contract says so.
