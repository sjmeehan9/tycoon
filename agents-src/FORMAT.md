# Agent source format

Every agent (and skill) is defined **once** in a `*.src.md` file. `scripts/build-agents.py` renders each source into its platform outputs (`.claude/agents/*.md`, `.github/agents/*.agent.md`, `.codex/agents/*.toml`, `.claude/skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`). **Never edit rendered files directly** — CI fails if rendered files don't match source.

## File layout

```
agents-src/           agent sources + shared includes
  FORMAT.md           this file
  shared/*.md         canonical shared blocks (doctrine, report format, …)
  <role>.src.md       one source per agent role
skills-src/
  <skill>.src.md      one source per skill
scripts/build-agents.py
```

## Source file structure

A source file is a sequence of `%%%` directives:

```
%%% output: .claude/agents/debug.md
%%% flags: claude interactive
---
name: debug
description: "…"
model: inherit
memory: project
---
%%% output: .github/agents/Debug.agent.md
%%% flags: copilot interactive
---
name: Debug
description: …
argument-hint: …
tools: ['read', 'search', 'edit', 'execute', 'web', 'todo']
---
%%% body
…shared body text…
```

Rules:

- **`%%% output: <path>`** — repo-relative path of one rendered file. One or more per source.
- **`%%% flags: <tokens>`** — the flag set for that output. Allowed tokens: `claude`, `copilot`, `codex`, `teams`, `interactive`, `autonomous`, `full`, `lite`. Every output must include exactly one platform token and one of `interactive`/`autonomous`. `teams` marks outputs for platforms that orchestrate subagents (Claude and Codex) — the Team Collaboration Protocol blocks are `%%% begin teams`.
- The block between `%%% flags:` and the next `%%%` directive is the output's **header, copied verbatim**:
  - `.md` outputs: YAML frontmatter (must start and end with `---`). Claude agents always declare `model: inherit` explicitly; Copilot agents never declare `model:`.
  - `.toml` outputs (Codex agents in `.codex/agents/`): bare TOML key/value lines — at minimum `name = "..."` and `description = "..."`; never a `model` key (omission inherits the session model). The generator appends `developer_instructions = '''…'''` containing the rendered body (which therefore must never contain `'''`).
- **`%%% body`** — everything after this line is the shared body.

## Body directives

- **`%%% include shared/<name>.md`** — splice in a shared block (path relative to `agents-src/`). Includes are processed recursively and respect the current output's flags.
- **`%%% begin <flag> [<flag>…]`** / **`%%% end`** — conditional block, kept only if **all** listed flags are in the output's flag set (AND). Blocks nest. For OR semantics, write two blocks.

## Conventions

- The generator marks every rendered file as generated: an HTML comment after the frontmatter for `.md` outputs, a leading `#` comment line for `.toml` outputs.
- Shared doctrine lives in `shared/` and is included, never paraphrased, so it stays identical across agents:
  - `shared/agent-report.md` — the structured communication protocol (all agents)
  - `shared/priority-doctrine.md` — feature depth > tests/docs priority order (planning + delivery agents)
  - `shared/sizing-doctrine.md` — as-many-phases/components-as-needed sizing (TBA, tech-lead, skills)
  - `shared/feature-vertical.md` — end-to-end feature slicing rules (TBA, tech-lead, implement, review)
  - `shared/bugs-vs-polish.md` — error-handling/coverage exclusion rule (debug, review, test)
  - `shared/profile-reference.md` — `docs/project-profile.md` contract (all delivery agents)
  - `shared/implementation-assurance.md` — versioned assurance lanes, risk triggers, gate ownership, and commit ownership (build coordinator + delivery agents)
  - `shared/validation-tiers.md` — targeted/component/phase validation ownership, evidence fingerprints, fallback, and exclusive-resource rules (build skill + delivery agents)
  - `shared/memory-section.md` — persistent memory section (Claude outputs only; conditional inside the include)
  - `shared/steward-prompt.md` — persistent validation-path Steward prompt
  - `shared/build-steward-prompt.md` — event-driven, coordinator-run build-path Steward checklist (not a separate task agent)
- Autonomous variants: put mode differences in `%%% begin interactive` / `%%% begin autonomous` blocks. The canonical difference set: clarification steps and approval waits are interactive-only; autonomous variants log **Assumptions** and proceed (see `shared/agent-report.md` and `shared/priority-doctrine.md`, which already carry the conditionals).

## Commands

```
python3 scripts/build-agents.py            # render everything
python3 scripts/build-agents.py --check    # verify rendered files match source (CI)
```
