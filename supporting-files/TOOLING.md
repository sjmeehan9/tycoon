# Tooling inventory

Every script, workflow, lane and tool configuration the template ships: where it runs, what it does and what it needs. The point is stack neutrality. A generated repository can see exactly which template assets it carries, which of them execute there, and the one interpreter they all share.

**Rule.** Any new script, workflow, lane or MCP configuration adds a row here in the same commit. In `project-template`, CI fails when a tracked script, workflow or tool configuration has no row (template-only step in [`agents-drift-check.yml`](../.github/workflows/agents-drift-check.yml)).

**Runs where.** *Template* = only in `project-template`. *Target* = in repositories generated from it. *Both* = both, with template-only steps guarded by repository name.

## Prerequisites, stated once

| Scope | Needed | Why |
|---|---|---|
| Every stack | `git`, `bash` (macOS `/bin/bash` 3.2 is enough), `python3` 3.10 or newer | `bootstrap.sh` fills placeholders with python3; `scripts/worktree-fingerprint.py` runs at every gate; the CI checks and their tests are python3 |
| Every stack, humans | GitHub CLI `gh` | `gh repo create --template`, `scripts/template-cleanup.sh --pr`, pull requests |
| iOS only | Xcode (full install), XcodeGen, fastlane, Node 18+ (`npx` launches the MCP servers), an App Store Connect API key in `fastlane/.env` | Scaffold, build, test, simulator automation and TestFlight; see [`ios-setup-runbook.md`](ios-setup-runbook.md) |
| Python only | The Python version and tools named in `pyproject.toml` and `docs/project-profile.md` | The project's own choice; nothing in the template depends on it |
| TypeScript only | Node and the package manager named in `package.json` and `docs/project-profile.md` | The project's own choice; nothing in the template depends on it |

python3 is the only interpreter the template itself requires on a generated repository, whatever the stack. The build, test and lint commands agents run come from `docs/project-profile.md`, never from the template's scripts.

## Scripts

| Asset | Runs where | What it does | Requires |
|---|---|---|---|
| `bootstrap.sh` | Target, once after creation | Prompts (or takes flags) for name, platform and bundle id; writes `docs/project-profile.md`, `CLAUDE.md`, `AGENTS.md`, `.codex/config.toml` and a project `README.md`; scaffolds the platform (iOS: `project.yml`, Swift stubs, `fastlane/`, `.mcp.json`; Python: `pyproject.toml`, `src/`, `tests/`; TypeScript: `package.json`, `src/`, `tests/`); removes the paths in `templates/template-only.txt`; seeds `.templatesyncignore` from `templates/templatesyncignore` | bash, git, python3. iOS: runs `xcodegen generate` when installed and warns when xcodegen, fastlane or npx are missing |
| `scripts/worktree-fingerprint.py` | Target, at every component and phase gate (Implement, Test, Review and the Steward run it); its tests run in both CIs | Prints a commit-stable SHA-256 of effective tree content: scoped to the explicit component paths after `--`, or unscoped for the phase; `--rev <sha>` hashes a committed tree; everything under `docs/` is excluded, so documents never move a candidate identity | python3, git |
| `scripts/build-agents.py` | Template; present on targets but only meaningful when editing sources upstream | Renders `agents-src/*.src.md` and `skills-src/*.src.md` into `.claude/agents/`, `.github/agents/`, `.codex/agents/`, `.claude/skills/` and `.agents/skills/`; `--check` fails on drift or orphaned rendered files | python3 |
| `scripts/check-assurance-contracts.py` | Both CIs; its README check applies to the template only | Asserts the risk-tiered contract phrases across every rendered agent surface, the skills, the profile templates, the standards file and AGENT_FLOWS, and prohibits obsolete contracts | python3 |
| `scripts/test-assurance-contracts.py` | Both CIs | Unit tests proving the checker scopes the README check to the template repository | python3 (unittest); reads the checker |
| `scripts/test-worktree-fingerprint.py` | Both CIs | Behavioural tests of fingerprint identity in temporary git repositories: commit stability, scoping, `--rev`, evidence exclusion | python3, git |
| `scripts/template-cleanup.sh` | Target, once per repository that existed before the hygiene step; run from the template with `--target`, or in the repository after it received the file by sync | Deletes the paths in `templates/template-only.txt`, merges `templates/templatesyncignore` into the root `.templatesyncignore`, adds `.evidence/` to `.gitignore`; dry run by default, `--apply` commits on a branch, `--pr` pushes and opens the pull request | bash, git; `gh` for `--pr` |
| `corporate-copilot-agent-team/scripts/validate.py` | Template only (the kit is template-only and is copied by hand into an enterprise repository) | Structural validator for the corporate Copilot bundle: topology, frontmatter, handoffs, tool boundaries, approval and repair invariants; `--self-test` | python3 |

## GitHub Actions workflows

| Asset | Runs where | What it does | Requires |
|---|---|---|---|
| `.github/workflows/agents-drift-check.yml` | Both, on pushes to `main` and pull requests that touch agent, skill, script, template, workflow or doctrine paths | Runs `build-agents.py --check`, the assurance checker and its tests, and the fingerprint tests. Template-only steps verify that the `.templatesyncignore` seed matches its synced copy and that this inventory covers every tracked script, workflow and tool configuration | GitHub Actions (`ubuntu-latest` provides python3 and git) |
| `.github/workflows/template-sync.yml` | Target only (`github.repository != 'sjmeehan9/project-template'`), Mondays 05:00 UTC and on manual dispatch | Opens a pull request bringing the template's `main` into the repository through `actions-template-sync` (squash pull; the template wins conflicts). It never deletes a file the template removed and never updates `.templatesyncignore`; files listed there are restored before the commit | `TEMPLATE_SYNC_PAT` secret: read on the template, contents + pull-requests + workflows write on the target |

## Lanes and tool configuration

| Asset | Runs where | What it does | Requires |
|---|---|---|---|
| `fastlane/Fastfile` lanes `beta` and `test` (from `templates/ios/fastlane/Fastfile`) | iOS targets | `beta`: `xcodegen generate`, archive and export for the App Store with the App Store Connect API key (role Admin) passed to `xcodebuild` as well as to the upload — no Xcode sign-in — with Xcode's build-number management disabled and the shipped `CFBundleVersion` read back from the ipa; upload to TestFlight; agent-run only after the phase-gate approval, one run per approval. `test`: unit and UI tests on the profile's simulator | fastlane, xcodegen, Xcode; `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH` in `fastlane/.env` |
| `project.yml` (from `templates/ios/project.yml`) | iOS targets | XcodeGen spec that generates the gitignored `.xcodeproj`: app, unit-test and UI-test targets and one scheme | xcodegen |
| `.mcp.json` (from `templates/ios/mcp.json`) | iOS targets, Claude Code | Project-scoped MCP servers: XcodeBuildMCP with `XCODEBUILDMCP_ENABLED_WORKFLOWS=simulator,simulator-management,ui-automation` (build, run, test, tap/type/snapshot) and ios-simulator MCP (read-only tree verifier on Xcode 27), both launched with `npx` | Node 18+/npx; macOS 14.5+ and Xcode 16+ |
| `.codex/config.toml` (from `templates/codex/config.base.toml`, plus `templates/codex/config.ios-mcp.toml` on iOS) | All targets, Codex users | Sandbox and approval defaults and `[agents] max_threads`; on iOS, the same two MCP servers as Codex-native `[mcp_servers.*]` tables | Codex CLI; the repository must be trusted on its first run |

## Stack coupling at a glance

- iOS assets (`fastlane/`, `project.yml`, `.mcp.json`, the Codex MCP tables, the Swift stubs) land only through `bootstrap.sh --platform ios`. A Python or TypeScript repository carries them only as templates under `templates/ios/`, which nothing executes.
- The template's own scripts need python3 and git on every stack, and nothing else.
- Build, test, lint and distribution commands belong to the project. They are recorded in `docs/project-profile.md` and run from there.
