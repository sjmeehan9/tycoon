# project-template

A GitHub template repository that bootstraps AI-agent-driven project delivery — for **iOS (Swift/SwiftUI)**, **Python**, and **TypeScript** projects — with a matched agent suite for **Claude Code**, **GitHub Copilot**, and **OpenAI Codex**.

## What you get

- **Two delivery pipelines** (see [supporting-files/AGENT_FLOWS.md](supporting-files/AGENT_FLOWS.md)):
  - `validate-with-waitlist` — test market interest with a deployed waitlist page before building.
  - `build-with-agent-team` — full delivery: brief → solution design → phase plan → component breakdowns → implement → test → review, phase by phase, with per-phase UI + backend validation.
- **Generated agent definitions.** `.claude/agents/` (Claude Code), `.github/agents/` (Copilot), and `.codex/agents/` (Codex TOML) are rendered from single-source definitions in [`agents-src/`](agents-src/FORMAT.md); skills render from `skills-src/` to both `.claude/skills/` and `.agents/skills/` (the open Agent Skills standard Codex reads). Edit the source, run `python3 scripts/build-agents.py`; CI fails on drift.
- **A per-repo stack contract.** Agents read `docs/project-profile.md` (created by bootstrap) for the validation sequence, test frameworks, git workflow, and human tasks — nothing stack-specific is hardcoded in agent prompts.

## Quickstart

```bash
gh repo create my-app --template sjmeehan9/project-template --private --clone
cd my-app
./bootstrap.sh    # prompts: project name, platform (ios/python/typescript), bundle id
git add -A && git commit -m "chore: bootstrap"
git push
```

iOS projects get an XcodeGen `project.yml`, a walking-skeleton SwiftUI app with unit and XCUITest stubs (`.xcodeproj` is generated, gitignored), a **fastlane** pipeline (`beta` → TestFlight via App Store Connect API key; agent-run behind a per-phase approval gate), and a project-scoped **`.mcp.json`** wiring XcodeBuildMCP + iOS-Simulator MCP for agent-driven build/run/UI interaction. One-time machine and Apple-account setup (Xcode, brew tools, ASC API key, optional Happy Coder phone remote): [supporting-files/ios-setup-runbook.md](supporting-files/ios-setup-runbook.md).

Mixed stacks (e.g. iOS app + Python backend): run `bootstrap.sh` for the primary platform, then manually extend `docs/project-profile.md` with the second stack's sections (validation sequence, layout, run instructions).

### After bootstrap (human setup)

1. Complete `docs/project-profile.md` (external services, budgets, versions).
2. **Codex users:** run `codex` once in the repo root and **trust the project** — `.codex/config.toml` (sandbox/approval defaults, MCP servers) and `.codex/agents/` only load in trusted repos. Pipelines are invoked via the skills in `.agents/skills/`.
2. Protect `main` — the git workflow contract assumes it.
3. Add the **`TEMPLATE_SYNC_PAT`** secret so the weekly [template-sync](.github/workflows/template-sync.yml) workflow can PR template updates into your repo: a fine-grained PAT with **read** access to this (private) template repo and **contents + pull-requests + workflows write** on the generated repo (workflows write is required because `.github/workflows/` files are themselves synced). Without it the sync job fails (everything else works).
4. iOS: set `DEVELOPMENT_TEAM` in `project.yml`, register the bundle ID in App Store Connect, create a TestFlight internal-testing group — TestFlight-on-device is the per-phase human validation channel.

## Working on the template itself

- Agent behaviour: edit `agents-src/*.src.md` (shared doctrine in `agents-src/shared/`), then `python3 scripts/build-agents.py`. Never edit rendered files.
- Skills: edit `skills-src/*.src.md`, same command.
- `python3 scripts/build-agents.py --check` is the CI gate ([agents-drift-check](.github/workflows/agents-drift-check.yml)).
- Design docs: [supporting-files/IMPROVEMENT_PLAN.md](supporting-files/IMPROVEMENT_PLAN.md) records the rationale behind the current design.

## Design rules the suite follows

- **All agents inherit the session model** (`model: inherit` on Claude; no `model:` key on Copilot or Codex).
- **Structured communication only** — every agent message is an Agent Report (Open questions / Outputs created / Problems / Drift / Deferred / Required actions / Next steps).
- **Feature depth over test breadth** — as many phases/components as needed, each a rounded end-to-end feature; no count or time-budget sizing.
- **Per-component Technical Validation** against current external documentation before implementation.
- **Per-phase validation** — UI + critical-backend E2E at the end of every phase (simulator/XCUITest or Playwright), plus TestFlight-on-device human validation for iOS.
- **Error-handling style and coverage gaps are not bugs** — they surface as Hardening notes, never as blockers or Debug work.
