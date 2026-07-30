# Corporate Copilot Agent Team

This directory is a standalone, copy-only GitHub Copilot workflow for delivering a tightly scoped change from a Jira epic, story, bug, or task. It is intentionally independent of the surrounding project template: it is not generated, bootstrapped, installed as a plugin, or synchronized into downstream repositories.

The bundle provides:

- `.github/skills/build-with-agent-team/SKILL.md` — the exact `build-with-agent-team` orchestration skill.
- `.github/agents/corporate-solution-planner.agent.md` — Jira-scoped planning, focused technical research, and solution design.
- `.github/agents/corporate-implement.agent.md` — approved-plan implementation, debugging discipline, and task-essential tests.
- `.github/agents/corporate-review.agent.md` — read-only diff, plan, and evidence review.
- `scripts/validate.py` — a standard-library structural validator for the source bundle.

The `.github` directory is hidden on Unix-like systems. Copy the directory contents explicitly; dragging only visible files will omit the entire workflow.

## Validate the bundle

From this directory, run:

```sh
python3 scripts/validate.py
python3 scripts/validate.py --self-test
```

The first command checks package topology, skill and agent frontmatter, exact agent references, VS Code handoff prompts, role tool boundaries, prompt limits, workflow identifiers, approval/repair invariants, and the solution-plan template contract. The self-test creates isolated temporary copies and verifies that unsafe tool, approval, repair, and template mutations are rejected.

## Check the target repository

Do not overwrite or merge into an existing same-named skill or agent without reviewing it. Before copying, inspect the target repository for:

```text
.github/skills/build-with-agent-team/
.claude/skills/build-with-agent-team/
.agents/skills/build-with-agent-team/
~/.copilot/skills/build-with-agent-team/
~/.agents/skills/build-with-agent-team/
~/.claude/skills/build-with-agent-team/
.github/agents/corporate-solution-planner.agent.md
.github/agents/corporate-solution-planner.md
.github/agents/corporate-implement.agent.md
.github/agents/corporate-implement.md
.github/agents/corporate-review.agent.md
.github/agents/corporate-review.md
.claude/agents/corporate-solution-planner.md
.claude/agents/corporate-implement.md
.claude/agents/corporate-review.md
~/.copilot/agents/corporate-solution-planner.agent.md
~/.copilot/agents/corporate-implement.agent.md
~/.copilot/agents/corporate-review.agent.md
```

For every agent directory, check both `<logical-name>.md` and `<logical-name>.agent.md`; the list above shows the common variants without exhaustively repeating each permutation. Also check organization, enterprise, user-profile, parent-workspace, installed-plugin, and configured custom locations for the same logical skill or agent names. VS Code can load extra locations through `chat.agentFilesLocations` and `chat.agentSkillsLocations`, detects `.claude/agents`, and treats any `.md` file under `.github/agents` as an agent. Copilot surfaces and versions do not expose one universal precedence rule across every scope; a collision can silently select a different definition. Do not rely on precedence. In VS Code, use the Chat customization diagnostics to inspect loaded agents, skills, and errors. In Copilot CLI, inspect `/agent`, `/skills list`, and `/skills info build-with-agent-team`. If any logical-name collision exists, stop and compare or rename it; do not overwrite it.

The orchestrating skill uses only retrieval/read operations from an already-available Jira connector and passes retrieved content to the planner; it never comments, edits, assigns, or transitions Jira. The bundled agent profiles intentionally grant no `atlassian/*`, `jira/*`, or other server-wide MCP wildcard: `<server>/*` can include mutation tools as well as reads. If the target enterprise wants direct planner access, add only specifically named, read-only retrieval tools after security review. Do not add Jira tools to Corporate Review; give it the approved ticket contract instead. The workflow does not install or configure a connector.

## Copy without overwriting

Copy the hidden `.github` contents into the root of the target repository using a file browser that shows hidden files, or copy each path individually:

```text
corporate-copilot-agent-team/.github/skills/build-with-agent-team/
    → <target-repository>/.github/skills/build-with-agent-team/

corporate-copilot-agent-team/.github/agents/corporate-*.agent.md
    → <target-repository>/.github/agents/
```

Create missing parent directories, but do not use a command or file-browser option that replaces existing files. The validator is a source-bundle check; it does not install files and does not need to be copied into the target repository.

Commit the copied skill and agent profiles in the target repository so Copilot cloud agent, Copilot CLI, and VS Code can discover the repository customizations. Keep the solution-plan template inside the skill directory.

## Use the workflow

Invoke `build-with-agent-team` with one of:

- `planning` and a Jira item or pasted/exported ticket content.
- `implementation <plan-path>` after explicitly approving the plan.
- `review <plan-path>` for a read-only review.
- `full` to plan, pause for approval, implement, and review.

`full` never crosses the planning approval gate automatically. Approval is bound to a canonical SHA-256 digest of the plan contract, and Implement and Review recompute it before acting. Review candidates use `CANDIDATE_ID_V1` to cover committed, staged, unstaged, mode, deletion, and non-ignored untracked state. Standalone `review` never authorizes edits: after `CHANGES REQUIRED`, it pauses for explicit repair authorization. One durable, candidate-and-findings-bound Implement repair pass is permitted; a second unsuccessful review or a second repair request escalates to a human.

The workflow follows the target repository's branch, commit, push, and pull-request policy. When no policy exists, push and pull-request creation require explicit approval. It never merges or force-pushes.

## Compatibility

Repository skills under `.github/skills` and custom agents under `.github/agents` are supported by GitHub Copilot. The agent profiles omit a `target` field so they remain available to both Copilot cloud and VS Code. Their VS Code handoffs use `send: false`; GitHub.com currently ignores IDE-only handoff fields, so the skill's explicit agent orchestration remains authoritative.

- [Adding agent skills for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
- [Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
