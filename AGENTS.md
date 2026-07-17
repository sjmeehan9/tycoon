# Tycoon

Bootstrapped from `project-template`. Read these before doing anything stack-specific:

- **`docs/project-profile.md`** — the stack contract: platform, validation sequence, test frameworks, UI/E2E harness, project layout, run instructions, git workflow, human tasks, budgets. Agents trust this file over their own assumptions.
- **`.github/instructions/copilot.instructions.md`** — coding standards (per-stack sections; the profile says which applies).
- **`supporting-files/AGENT_FLOWS.md`** — how the agent pipeline fits together.

House rules:

- Agent definitions (`.codex/agents/*.toml`, `.claude/agents/`, `.github/agents/`) and skills (`.agents/skills/`, `.claude/skills/`) are **generated** — edit `agents-src/` / `skills-src/` and run `python3 scripts/build-agents.py`. CI fails on drift.
- No agent pins a model — everything inherits the session model.
- All agents communicate via the structured Agent Report format defined in their definitions.
- `main` is protected; follow the git workflow contract in the project profile.

Codex specifics:

- Trust this repo on your first `codex` run — `.codex/config.toml` (sandbox, approvals, MCP servers) and `.codex/agents/` only load in trusted projects.
- The delivery pipelines are the skills in `.agents/skills/` (`build-with-agent-team`, `validate-with-waitlist`) — invoke via `/skills` or by asking for them.
- Subagent fan-out is capped by `[agents] max_threads` in `.codex/config.toml`; `/agent` switches between spawned agent threads.
