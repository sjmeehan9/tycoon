# project-template improvement plan — 2026-09

**Date:** 2026-09-27; updated 2026-09-28 with the O1–O8 rulings and the removal of `project-ideas`.
**Inputs:** full read of the template at `28a22b4`; the generated repositories (`scan-basic`, `basicapps-site`, `tycoon`; `project-ideas` was deleted from GitHub on 2026-09-28 and its `TEMPLATE_SYNC_PAT` revoked) and their sync history; `scan-basic/docs` measured as the worked example of state growth; `supporting-files/template-recommendations-phase-7.md` (untracked, this plan's WP2 source); the `actions-template-sync` source and README; Anthropic's context-engineering and multi-agent research write-ups plus current handoff guidance.
**Template-only document.** Listed in `templates/template-only.txt` (WP1) so it never persists on a generated repository.

## Decisions taken 2026-09-27

| # | Decision | Consequence |
|---|---|---|
| D1 | **Sources stay on targets.** `agents-src/`, `skills-src/`, `templates/`, `scripts/`, `bootstrap.sh` and `agents-drift-check.yml` remain on generated repos. Only the obvious leaves: `corporate-copilot-agent-team/`, `supporting-files/IMPROVEMENT_PLAN*.md`, and conversation-only files such as the Phase 7 recommendations. | The downstream drift check keeps running; WP1 is a small, data-driven cleanup rather than a restructure. |
| D2 | **One-off cleanup PR per existing repo.** Template Sync is not changed to delete files. | A shipped, idempotent script does the deletion and the `.templatesyncignore` update; bootstrap does the same for new repos. |
| D3 | **Restructure the knowledge suite into tiers.** | WP3 introduces a bounded state snapshot, per-phase journals, retrievable decisions, deferred and knowledge files, per-role read contracts, Steward-enforced budgets, and archive at phase close. |
| D4 | **python3 stays the single cross-stack tooling prerequisite.** | Documented, checked by bootstrap, no shell port. |
| D5 | **O1–O8 ruled 2026-09-28: every recommendation adopted** (see the closing table). The work-package text below states the decided option, not the question. | No bootstrap `OS=` placeholder; no lease helper script; the TestFlight lane manages the build number and reads it back from the ipa; per-phase summaries with an index; fingerprints exclude all of `docs/`; `paths:` filter on the drift check; default budgets 250/300 lines; [iCloud] items under a conditional heading. |

Standing constraints from earlier sessions still apply: strict Agent Report chat, depth over tests, no count ranges for sizing work, per-phase validation, TestFlight on device for iOS, single-source generation (edit `agents-src/`, `skills-src/`, `agents-src/shared/`; never rendered files), `check-assurance-contracts.py` asserts exact phrases across every surface so every doctrine change updates the checker in the same commit.

## Findings the plan rests on

**Creation and sync.** GitHub template creation copies every tracked file of `main`; nothing can be excluded at creation. `actions-template-sync` pulls with `--allow-unrelated-histories --squash -X theirs`, which records additions and modifications and never deletions. Proof: the template deleted `agents-src/shared/steward-prompt.md` and `build-steward-prompt.md` on 2026-09-05 (`78875fc`); scan-basic's sync PR #18 later that day brought in `steward-core.md`, and both deleted files are still present in scan-basic. `is_force_deletion` requires a true merge (`--allow-unrelated-histories --strategy=recursive --no-edit`) and would import the template's history into each target; rejected under D2. `.templatesyncignore` is itself never synced (the action restores it), so each existing repo's copy is stale (scan-basic's lacks `AGENTS.md`, `.codex/config.toml`, `corporate-copilot-agent-team/`). Any path deleted on a target must also be listed in its `.templatesyncignore`, or the next sync re-adds it. The action's `handle_templatesyncignore` runs `git reset -- <patterns>`, `git clean -df`, `git checkout -- .` after `git add .`, which is exactly what makes a listed-and-deleted path stay deleted.

**Downstream CI.** `agents-drift-check.yml` has no repository guard: it runs in every target on every push to `main` and every PR, and needs `agents-src/`, `skills-src/`, `templates/project-profile.*.md`, `supporting-files/AGENT_FLOWS.md` and `.github/instructions/copilot.instructions.md` present there. Kept under D1.

**Runtime dependencies on targets.** `scripts/worktree-fingerprint.py` is executed by Implement, Test, Review and the Steward at every gate (python3 + git). `bootstrap.sh` uses python3 for placeholder substitution. The iOS MCP servers need node/npx. Nothing else on a target requires an interpreter.

**State growth (scan-basic, 2026-09-25).** `agent-team-state.md` 801 KB (~200K tokens; `## Current Stage` alone 459 KB across 78 appended narrative blocks; Decisions Log 205 KB). `steward-ledger.md` 710 KB (~177K tokens, 63 events). `phase-7-component-breakdown.md` 406 KB. `phase-progress.json` 87 KB. The skills tell every spawned task agent to read the state file "for awareness" and the resume path reads it whole. The template defines no size, archive or rotation rule for any state document; the only budget anywhere is the 200-line cap on agent memory. scan-basic invented `session-bootstrap.md`, `implementation-context-phase-N.md`, `docs/decisions/`, `docs/evidence/` and `.evidence/` to compensate; none is template-defined and the checker prohibits the implementation-context phrase.

**Recommendations mapping.** Section A and the distribution section of the Phase 7 document target real template files. Section B names `AGENT_FLOWS.md`, but that file is a descriptive map; the rules agents obey live in `agents-src/shared/validation-tiers.md`, the skill sources, the profile templates and the Implement/Review/Test sources. WP2 changes those and then updates AGENT_FLOWS to describe them.

---

## WP1 — Target hygiene (Requirement 1)

**Goal.** New repos never carry the obvious template-only files; existing repos lose them through one PR each; sync can never re-add them.

### Changes

1. **`templates/template-only.txt`** (new). One path per line, comments allowed. Initial content:
   ```
   corporate-copilot-agent-team/
   supporting-files/IMPROVEMENT_PLAN.md
   supporting-files/IMPROVEMENT_PLAN_2026-09.md
   ```
   This is the single list bootstrap and the cleanup script consume. Growing it later (for example to `agents-src/` if D1 is revisited) needs no code change.
2. **`templates/templatesyncignore`** (new) — the canonical, synced copy of the ignore list, because the root `.templatesyncignore` cannot be synced. Content = current root file + the template-only paths above. Root `.templatesyncignore` in the template is kept identical (it is the seed a new repo receives at creation). Add a template-only CI step to `agents-drift-check.yml` (`if: github.repository == 'sjmeehan9/project-template'`) that fails when the two differ.
3. **`bootstrap.sh`**: new final step `template_hygiene`:
   - prerequisite check at the top: `git`, `python3` present, else exit with the install hint;
   - for each path in `templates/template-only.txt`: `git rm -r -q --ignore-unmatch -- "$path"`;
   - `cp templates/templatesyncignore .templatesyncignore`;
   - write `README.md` from a new `templates/README.md.template` (project name, one-line purpose placeholder, pointers to `docs/project-profile.md`, `docs/`, the delivery skills, and `supporting-files/TOOLING.md`) so a target never ships the template's README;
   - print what was removed. Idempotent: re-running bootstrap on a cleaned repo changes nothing.
4. **`scripts/template-cleanup.sh`** (new; synced to targets through `scripts/`). Usage: `scripts/template-cleanup.sh [--target <path>] [--apply] [--pr]`. Default is a dry run listing the deletions and the `.templatesyncignore` lines it would add. `--apply` performs them on a new branch `chore/template-cleanup` and commits; `--pr` opens the PR with `gh`. Reads `templates/template-only.txt` and `templates/templatesyncignore` from its own repo when run from the template with `--target`, so all three repos can be cleaned before they receive a sync. Also appends `.evidence/` to the target's `.gitignore` when missing (WP2 B2; root `.gitignore` is ignored by sync). Requires bash, git; `gh` only for `--pr`.
5. **`templates/CLAUDE.md.template` and `templates/AGENTS.md.template`**: reword the generated-files house rule to "generated from `agents-src/`/`skills-src/` and kept current by template sync; change them in `project-template` and let the sync PR bring them here, because local edits are overwritten by the next sync". Note `.templatesyncignore` protects `CLAUDE.md`/`AGENTS.md`, so this reaches only new repos; existing repos edit by hand (listed in WP5).
6. **`README.md`** (template): document the template-only list, the cleanup script, the `templatesyncignore` seed, and that the drift check runs downstream (with its new `paths:` filter, WP4).

### Acceptance

- `bash -n bootstrap.sh scripts/template-cleanup.sh`.
- In a temp copy of the template (`git clone --local`), run `./bootstrap.sh --name Demo --platform python`: the three paths are absent, `.templatesyncignore` contains them, `README.md` is the project stub, `git status` is clean apart from the expected changes. Repeat for `ios` and `typescript`.
- Run `scripts/template-cleanup.sh --target <local clone of scan-basic>` (dry run): output lists exactly the two present paths (`corporate-copilot-agent-team/`, `supporting-files/IMPROVEMENT_PLAN.md`) and the missing ignore lines; `--apply` in that clone produces one commit whose diff is only those deletions plus the ignore and gitignore lines; no push.
- `python3 scripts/build-agents.py --check`, `python3 scripts/check-assurance-contracts.py`, and the new ignore-file equality step pass.

---

## WP2 — Phase 7 recommendations (Requirement 2)

**Source:** `supporting-files/template-recommendations-phase-7.md` (untracked; keep in the working tree until this WP is merged, then delete; the mapping below is complete enough to implement without it). Tags: **[generic]** applies to any iPhone app; **[iCloud]** items are included (O8) under an "If the app uses iCloud" heading so non-sync apps skip it. **Excluded as project-specific:** evidence citations, Steward and term numbers, ScanBasic paths and scripts (`sync-oracle.sh` etc.), CloudKit specifics beyond the tagged guidance, Phase 7 component names.

The document has two sections labelled "C". Here they are **C-process** (coordinator liveness, usage limits) and **C-distribution** (App Store Connect key).

### Mapping

| Item | Target file(s) | Change |
|---|---|---|
| **A1** [generic] | `supporting-files/ios-setup-runbook.md` Stage 0 step 8 | Replace `open -a Simulator` with headless `xcrun simctl boot <UDID>`; define "ready" as `xcrun simctl launch <UDID> <bundle-id>` returning a PID within a bounded wait; name the viewers that exist (Claude app simulator panel, XcodeBuildMCP screenshots); panel rule: boot first, then detach, then verify the detach held. |
| **A2** [generic] | runbook "MCP servers" section; `templates/ios/mcp.json`; `templates/codex/config.ios-mcp.toml`; `templates/project-profile.ios.md` § Agent tooling (new "Simulator channel matrix" table) | Correct the UI-automation claim. Add `XCODEBUILDMCP_ENABLED_WORKFLOWS` to both MCP configs. Verified against the installed XcodeBuildMCP 2.7.0 (`~/.npm/_npx/.../xcodebuildmcp/build/mcp/tools/`): the valid ids are `coverage`, `debugging`, `device`, `doctor`, `macos`, `project-discovery`, `project-scaffolding`, `session-management`, `simulator`, `simulator-management`, `swift-package`, `ui-automation`, `utilities`, `workflow-discovery`, `xcode-ide`. The recommendation's `logging` is **not** a workflow id (log capture lives inside `simulator`). Ship `simulator,simulator-management,ui-automation` as the template default (Sean's user-scope config uses `simulator,ui-automation,debugging`; add `debugging` when a project needs LLDB), and have the runbook's Stage 2 smoke test confirm the tap/type/snapshot tools are listed. Re-check the id list whenever the pinned `@latest` moves. Describe `idb` as a read-only verifier on Xcode 27, not the input fallback. Channel matrix: which tool reads the screen, which sends input, side effects; filled at Stage 2 and after every Xcode upgrade. Rule: verify agent UI steps from the accessibility tree within a time bound, not screenshots. |
| **A3** [generic] | runbook new Stage 0 step "Host capacity"; iOS profile new `## Host capacity` | Record RAM and free disk; derive max simultaneously booted simulators and a free-disk floor as hard rules; note ~8 GB per runtime and that an Xcode update can add one; list what the owner may reclaim (npm cache, DerivedData, unused devices, device symbols) and what is never deleted (project simulators and their runtime). |
| **A4** [iCloud] | runbook new "Stage 1b — iCloud test accounts" under "If the app uses iCloud"; iOS profile optional `## Shared test accounts` | Dedicated throwaway Apple Accounts only, one for simulators and one for hardware account-switch legs; never the personal account; fully provision before first use (web-only accounts fail simulator sign-in); prove one sign-in end to end; `cktool` management token via interactive `save-token`, verified with read-only `export-schema`; never mint a user token from the owner's Console session; committed docs name accounts by alias only. Agent rules for a shared account: select only what this run created (per-run suffix, never display name or index); no destructive account action by an agent; label proxies as proxies; diff a read-only schema export after every signed-in run. |
| **A5** [generic + iCloud] | runbook new "Stage 1c — project simulators"; iOS profile new `## Simulators` table (name, UDID, runtime, role) | A canonical never-signed-in test device for every unit test, UI test and gate; for iCloud apps `<App>-Sync-A/B` signed into the same test account, evidence legs only; tests never run on a signed-in simulator (a test `ModelConfiguration` without `cloudKitDatabase: .none` writes to the development schema); pin every destination with `OS=`; scripted sign-in hand-off as a named human task (agent boots alone, navigates to the password field, owner types, agent verifies in-app, agent shuts down and polls to `(Shutdown)`); credentials lapse every ~9–12 h so proof comes from the app; Settings automation facts (per-app iCloud switch path; drag not tap). **O1 (ruled):** no bootstrap placeholder. The template's tier commands keep `name=`; the profile's Simulators table is the source of truth, and the runbook's Stage 2 completion step requires the owner to record the pinned runtime there and add `OS=` to every destination before the first gate. |
| **A6** [generic] | runbook Stage 2; `agents-src/shared/validation-tiers.md` (generic rule) | Re-run Stage 2 after every macOS/Xcode upgrade and before every TestFlight gate; add the channel-matrix check; iCloud: prove sign-in via the app's account-status API. Generic evidence rule in `validation-tiers.md`: every recorded test run states executed vs requested counts and a run with zero executions is never a pass. |
| **A7** [generic] | runbook new section "OS / Xcode upgrades"; iOS profile new "Toolchain triple" field (Xcode build, SDK, simulator runtime) | Before: defer to a phase boundary or announce; move in-progress evidence into `.evidence/`; re-run comparable platform findings with controls; record `sw_vers`, `xcodebuild -version`, `simctl list runtimes`, `df`. After: compare the toolchain triple; a real re-verification gate (`build-for-testing` for every target, unit + smoke + lint with executed counts, exit codes captured portably in bash and zsh); keep project simulators on their runtime and pinned; never `simctl delete unavailable` or `erase all` around a runtime change; re-run Stage 2 and refresh the channel matrix. |
| **A8** [generic] | runbook Troubleshooting | Replace `shutdown all && erase all` with least-to-most destructive steps on one device by UDID; erase only never-signed-in devices, owner approval otherwise; unresponsive simulator on a small host is usually memory pressure (check `simctl list` and load average first); pass `-collect-test-diagnostics never` on gate and probe runs (Xcode 27 hang); match the `xcodebuild` binary path, not `ps | grep xcodebuild`; never `attach` the Claude simulator control to a device that is not booted. |
| **B1** [generic] | `templates/project-profile.ios.md` § Risk routing and shared resources; `agents-src/shared/validation-tiers.md` exclusive-resources paragraph; `supporting-files/AGENT_FLOWS.md` "Serialized shared state" bullet | The simulator lease is **per boot**, including every `xcodebuild test` (which boots its destination) and any viewer attach; before any boot list booted devices and poll the others to `(Shutdown)`; the profile's max-booted limit is a hard rule. A gate also needs a **quiet host**: detach viewers after the boot, let daemons settle, record a host snapshot (load, swap, disk) with the evidence, start only below the profile's load threshold. Generic wording in `validation-tiers.md`: exclusive resources are leased per use, and a gate records the host snapshot when the profile names thresholds. **O2 (ruled):** doctrine only; no lease helper script ships. Revisit only if the next iOS project breaks the per-boot rule again. |
| **B2** [generic] | `agents-src/shared/validation-tiers.md`; `.gitignore` (add `.evidence/`); iOS profile § Validation tiers; AGENT_FLOWS "Evidence reuse" bullet; `.github/instructions/copilot.instructions.md` lanes paragraph | (1) Record the toolchain triple beside every fingerprint; a toolchain change voids execution evidence. (2) Raw evidence lives in the repo's gitignored `.evidence/phase-N/gate-X-Y/`, never `/tmp` or a session scratchpad. (3) Exact-reproduction exception for expensive legs: a later edit to non-production entries the leg never executed does not force a re-run if the leg's recorded fingerprint reproduces exactly from the final tree with only those entries swapped back, hashed with the fingerprint tool's functions and `git hash-object --stdin` (never `-w`); swapping any production entry means a re-run; Review verifies and records the proof. |
| **B3** [generic] | `skills-src/build-with-agent-team.src.md` Stage 3; `skills-src/build-with-agent-team-light.src.md` Component Delivery; AGENT_FLOWS Stage 3; `agents-src/shared/steward-core.md` checkpoints | Authoring stays serialized. When a component's expensive evidence legs start, the next author may spawn in **read-only PREP** (plan, file homes, line counts, ownership questions the Steward rules on before GO) and Review may run a read-only first stage on the frozen candidate; at COMPLETE, Review's delta stage and the Steward's pre-commit verdict run in parallel. PREP is defined as non-authoring so "one active component-delivery engagement at a time" holds; the checker's prohibited phrase "parallel implementation begins" stays prohibited. |
| **B4** [generic] | both build skills (component docs commit step); all three `templates/project-profile.*.md` (new `## Harness and toolchain facts`); AGENT_FLOWS "Stack contract" bullet; `agents-src/shared/memory-section.md` | The coordinator writes any harness or toolchain discovery into the profile, and into `CLAUDE.md` if it changes a default, in the component's docs commit. Agent memory keeps personal lessons; anything that changes how a command runs belongs in the profile. |
| **B5** [generic] | `agents-src/implement.src.md` § 2.4; `agents-src/review.src.md` § 2.5; `agents-src/test.src.md` § 5 | "A green result is only evidence if you can say what would have made it red": a control that is false before each action; framework-owned counters recorded, never asserted; wait limits overridable and logged; a dump timestamp that changes between samples; executed test counts compared with requested. Stack-neutral wording with device-harness examples. |
| **C-process 1** | both build skills and the waitlist skill, coordinator rules (`%%% begin claude` block) | Keep the coordinator alive without cron: a `Monitor`-based progress watch reporting a new commit, a change in booted simulators (or the profile's equivalent resource), and a stall; arms of at most 30 min, re-armed on expiry. `CronCreate` self-prompts are denied by the auto-mode classifier and a foreground `sleep` is blocked; use `Monitor` or a background `until` loop. Codex: note that the coordinator polls thread results instead. |
| **C-process 2** | same skills, cross-cutting rules; also feeds WP3 | Usage-limit resilience: one-line check-ins; evidence in files, never chat; re-onboard from state, contract and last report instead of history; stop retired agents' background watches; after any stop spawn fresh compact engagements rather than resuming very large contexts. |
| **C-distribution 1** [generic] | `templates/ios/fastlane/Fastfile`; runbook Stage 1 steps 2–3; `templates/ios/fastlane/.env.example`; iOS profile § Distribution and § External services; AGENT_FLOWS pre-distribution checklist; both build skills Gate 5 text | Pass the ASC API key to `xcodebuild` as well as to the upload: `xcargs: "-allowProvisioningUpdates -authenticationKeyPath \"#{File.expand_path(ENV["ASC_KEY_PATH"])}\" -authenticationKeyID #{ENV["ASC_KEY_ID"]} -authenticationKeyIssuerID #{ENV["ASC_ISSUER_ID"]} CURRENT_PROJECT_VERSION=#{build_number}"`. The key role must be **Admin** (a lesser role fails on `No signing certificate "iOS Distribution"`); no Xcode account sign-in is needed for uploads, so the Xcode Accounts step becomes development-only. Pre-distribution preflight: the export step is the authoritative test (`security find-identity` is not); a failed export uploads nothing and consumes no build number, and the re-run needs fresh approval; one run per approval. |
| **Build number (adjacent finding, in scope by O3)** | Fastfile; iOS profile § Distribution; runbook TestFlight stage | The lane stamps the build number from the commit count, but an App Store export with default `manageAppVersionAndBuildNumber` can reassign it; scan-basic recorded seven wrong numbers this way. Set `export_options: { manageAppVersionAndBuildNumber: false }` in `build_app`, read the shipped number back from the exported `.ipa` (`CFBundleVersion`) after export, print it in the lane output, and make the profile's Distribution section state that the recorded build number is the read-back value, never the commit count. |

### Sequencing inside WP2

1. Runbook and profile-template edits (A1–A8, B1, B2, B4 sections, C-distribution) — documentation and templates, no contract phrases.
2. Doctrine edits (`validation-tiers.md`, `memory-section.md`, Implement/Review/Test sources, skills) with the matching `check-assurance-contracts.py` additions in the same commit; render; run the four checks.
3. AGENT_FLOWS descriptive updates and the two `%%% begin claude` coordinator blocks.
4. Delete the untracked recommendations file.

### Acceptance

- `python3 scripts/build-agents.py` then `--check`; `check-assurance-contracts.py`, `test-assurance-contracts.py`, `test-worktree-fingerprint.py` pass.
- `ruby -c templates/ios/fastlane/Fastfile`; `python3 -c 'import json,sys;json.load(open("templates/ios/mcp.json"))'`; `python3 -c 'import tomllib;tomllib.load(open("templates/codex/config.ios-mcp.toml","rb"))'`.
- iOS bootstrap smoke into a temp copy: `.mcp.json` carries the workflows variable; the profile carries the new sections with no unresolved placeholders (the checker already prohibits `<changed-…>`-style placeholders; extend it to the new sections).
- Runbook read-through: every command block runs on Xcode 27 without `Simulator.app`.

---

## WP3 — Context and knowledge architecture (Requirement 3)

**Goal.** Every engagement spawns with all the information its role needs and nothing else; the project's full history stays available on demand; storage stays in the target's `docs/`; both build skills and the validation skill share one structure.

### Design principles

1. Separate **how-to-work** (agent definitions, profile, standards) from **what-to-do-now** (a small state snapshot) from **what happened** (journals, ledgers) from **what we learned** (decisions, knowledge, deferred).
2. **Hot files are rewritten, never appended.** Anything resolved leaves the snapshot the moment it resolves.
3. **Retrieval over pre-loading.** Agents get identifiers (paths, sections, ids) and open exactly what a decision needs.
4. **Typed over prose** for handoffs: rows, ids, SHAs, fingerprints, paths.
5. **Budgets are ceilings with a remedy** (compact, move to journal, archive), tunable per repo through the profile, never a sizing target for work.

### Target document set on a generated repo

| Tier | Path | Owner | Written | Read at spawn by | Budget / rotation |
|---|---|---|---|---|---|
| Hot | `docs/agent-team-state.md` (build) / `docs/validation-team-state.md` (waitlist) | Lead Coordinator | Rewritten in place after every lifecycle change | Coordinator on resume (whole); every task agent: § Current Stage + its own lifecycle row only; Steward: whole | Default ceiling 250 lines (O7; profile `## Context budgets` may override). Sections: Current Stage (where we are, current component, open human gate, active leases, phase-base SHA, next action, "resume here" pointers), Component Lifecycle (current phase only), Active Engagements (current only), Human Task Gate, Steward (ledger path, posture, pace source, **open** Holds only), Open Questions (open only), Contracts (active, by reference to the spawn contract text kept in the journal) |
| Hot | `docs/project-profile.md` | Repo owner; coordinator for harness facts | As today, plus WP2 sections | Everyone | Existing |
| Hot | `docs/phase-progress.json` | Lead Coordinator | As today | Coordinator, Steward, Tech Lead | Fields hold codes, SHAs, fingerprints, paths and short strings only; rationale goes to decisions or the journal |
| Warm | `docs/journal/phase-N.md` (build) / `docs/journal/<stage>.md` (waitlist) | Lead Coordinator | Append-only; one dated block per event, the content that today lands in Current Stage | Nobody at spawn; read for a named unresolved decision | Per phase; never budgeted |
| Warm | `docs/decisions/README.md` + `docs/decisions/NNNN-slug.md` | Lead Coordinator (agents propose in reports) | Index line + one-paragraph ADR per decision; standing rulings tagged `standing` | Agents read the index and open only entries their spec or contract cites; Tech Lead reads `standing` entries | Replaces the Decisions Log table |
| Warm | `docs/deferred.md` | Lead Coordinator | Living backlog: id, raised by, item, Hardening flag, status, phase closed | Tech Lead (next phase), Phase Docs, Review (to avoid re-raising) | Replaces the Deferred Log table; closed items move to the archive at phase close |
| Warm | `docs/knowledge.md` | Implement, Debug, Test append at their docs step; coordinator curates at phase close | Durable codebase and platform facts organised by topic, not chronology; each entry one to three lines with a source path | Implement and Debug read the topics their component touches (headings listed in the spawn contract) | Default ceiling 300 lines (O7); superseded entries move to `docs/archive/knowledge-<date>.md`. Harness or toolchain facts that change how a command runs go to the profile instead (WP2 B4). Replaces scan-basic's `implementation-context-phase-N.md` |
| Warm | `docs/steward-ledger.md` | Steward | Head section `## Open` (checkpoints in flight, open Challenges, open Holds, terms in force, carried items) rewritten in place; `## Events` appended | Replacement Steward: `## Open` + the last few events only | Rotated at stage close to `docs/archive/steward-ledger-<stage>.md`; the close audit's carried items seed the new head. Path unchanged, so no contract phrase changes |
| Warm | `docs/phase-summaries/README.md` + `docs/phase-summaries/phase-N.md` | Phase Docs | Index line per phase (outcome, commits, report verdict) + full per-phase file | Tech Lead and Phase Docs: index + the latest phase; earlier files on demand | Replaces the single growing `docs/phase-summary.md` (O4: split per phase with an index; `docs/phase-summary.md` is retired and every consumer repointed) |
| Cold | `docs/archive/` | Coordinator at phase close | Rotated ledgers, retired knowledge entries, closed deferred items, migrated legacy files | Nobody at spawn; named investigations only | Unbounded |
| Unchanged | `docs/components/*-overview.md`, `docs/test-reports/`, `docs/phase-X-test-report.md`, specs and plans | As today | As today | As today | Spec reads stay scoped to the component's section; the spawn contract names the heading and line range |

Drift items: recorded in the journal block that reports them and, when they change a contract, as a decision. The state snapshot keeps only unresolved drift under Open Questions.

### Changes by file

1. **`agents-src/shared/reading-contract.md`** (new include, all delivery agents and all three skills). One table: role → reads at spawn (file and section) → reads on trigger → never reads at spawn (journals, archive, ledger events, other components' specs, the full document set). Replaces the sentence "Read `docs/agent-team-state.md` for awareness of what other agents are building" in `implement.src.md` § Component Work Protocol and in the skills' spawn-template Coordination Rules with "read § Current Stage and your lifecycle row only".
2. **Skills (`build-with-agent-team`, `build-with-agent-team-light`, `validate-with-waitlist`)**: Step 2 state template rewritten as the snapshot; new "Journal, decisions, deferred, knowledge" subsection with the write rules; Document Ownership Map extended; resume fast path reads the snapshot, `phase-progress.json`, the component's spec section and its dependency overviews; spawn template names sections and headings (component spec heading, knowledge topics, decision ids) rather than whole files; Gate 6 / stage close gains "rotate the ledger, close deferred items, curate knowledge, write the phase summary file and index entry, confirm the snapshot is within budget"; C-process 2 rules from WP2 land in the same cross-cutting section.
3. **`agents-src/shared/steward-core.md`**: ledger template gains the `## Open` head and `## Events` body; new waste class **state bloat** (snapshot over budget, resolved rows lingering, narrative in the snapshot, a spawn contract that names whole files where the reading contract names sections); the Steward checks the snapshot line count at every gate event; replacement onboarding reads `## Open` plus recent events only; rotation at stage close.
4. **`agents-src/phase-docs.src.md`**: writes `docs/phase-summaries/phase-N.md` and the index line; closes deferred items; curates `docs/knowledge.md`; reads the index and the latest summary only.
5. **`agents-src/tech-lead.src.md`**: orientation reads the phase-summaries index, the latest summary, `standing` decisions and open deferred items instead of "prior phase summaries".
6. **`agents-src/implement.src.md`, `debug.src.md`, `test.src.md`, `review.src.md`**: orientation tables gain the knowledge topics and decision ids named in the spawn contract; Implement and Debug append knowledge entries at the docs step; the manifest rule "no phase-wide append-only handoff log" stays (knowledge is topic-organised, not a log).
7. **`agents-src/shared/memory-section.md`**: agent memory is personal; durable project facts go to `docs/knowledge.md` or the profile.
8. **`templates/project-profile.*.md`**: optional `## Context budgets` section (snapshot lines, knowledge lines) with the defaults stated; `## Harness and toolchain facts` from WP2.
9. **`scripts/worktree-fingerprint.py`**: by O5, `EVIDENCE_PATHS` becomes a single `docs/**` exclusion (documents are never executable; spec changes are governed by the Drift protocol). This also fixes scan-basic's finding that editing the profile or a resume file moved the unscoped hash. `test-worktree-fingerprint.py` gains a case proving that writing under `docs/` leaves both scoped and unscoped hashes unchanged. `validation-tiers.md`, the profiles' fingerprint sentences, the standards file and the `check-assurance-contracts.py` phrases are updated to say `docs/` is excluded instead of listing individual evidence files; the Tech Lead's `fingerprintScope` guidance already excludes documents.
10. **`scripts/check-assurance-contracts.py`**: require the reading-contract phrases and the new paths in every surface that carries the state template; prohibit the old awareness sentence; keep `docs/implementation-context-phase-X.md` prohibited.
11. **`supporting-files/AGENT_FLOWS.md`**: file ownership map and cross-cutting rules updated; new short "Context tiers" subsection. **`.github/instructions/copilot.instructions.md`** Context Documents table updated. **`templates/CLAUDE.md.template` / `AGENTS.md.template`**: one line pointing at the reading contract.

### Migration for live repos (coordinator-run at a phase boundary, Steward-audited)

1. Create `docs/journal/phase-N.md` for each phase by **moving** the Current Stage narrative blocks (cut, do not rewrite; keep git history as the record).
2. Convert the Decisions Log rows into `docs/decisions/` entries with the index; tag the "standing rulings" from any resume document as `standing`.
3. Convert the Deferred Log into `docs/deferred.md`; move the Drift Log into the journals.
4. Rotate `docs/steward-ledger.md` into `docs/archive/steward-ledger-phase-N.md`, seed the new head from the last close audit.
5. Rebuild the snapshot from the lifecycle table (current phase only), active engagements and open items; confirm it is within budget.
6. Split `phase-summary.md` into `docs/phase-summaries/` with the index (O4); leave `implementation-context-phase-N.md` files in place as history and start `docs/knowledge.md` from their still-true entries; retire `session-bootstrap.md` once § Current Stage carries its resume pointers.
7. Record the migration as a decision.

### Acceptance

- Rendered outputs and all four checks pass; the checker fails when the old awareness sentence is reintroduced.
- A dry rehearsal on a local clone of scan-basic (no push): the migrated snapshot is under the default ceiling; a simulated Implement spawn reading list (snapshot § Current Stage + one lifecycle row + component spec section + dependency overviews + profile) totals well under a tenth of today's ~230K-token spawn cost; the unscoped fingerprint is unchanged after writing a journal entry, a decision and a knowledge entry.
- AGENT_FLOWS, the standards file, the skills and the agents agree on every path (grep for each new path across `agents-src`, `skills-src`, `supporting-files`, `.github/instructions`, `templates`).

---

## WP4 — Tooling inventory and stack neutrality (Requirement 4)

1. **`supporting-files/TOOLING.md`** (new, synced): the itemised table of every script and action — asset, runs where (template / target / both), what it does, what it requires — plus a one-line rule that any new script or workflow adds a row. Initial rows: `bootstrap.sh`; `scripts/worktree-fingerprint.py`; `scripts/build-agents.py`; `scripts/check-assurance-contracts.py`; `scripts/test-assurance-contracts.py`; `scripts/test-worktree-fingerprint.py`; `scripts/template-cleanup.sh` (WP1); `agents-drift-check.yml`; `template-sync.yml`; Fastfile lanes `beta` and `test`; `.mcp.json` and the Codex MCP tables; `corporate-copilot-agent-team/scripts/validate.py` (template only).
2. **Prerequisites stated once**: README "Prerequisites" (git, bash, python3 for every stack; `gh` for creation and cleanup PRs; iOS extras per the runbook), the CLAUDE/AGENTS templates (one line), and the bootstrap prerequisite check (WP1).
3. **`agents-drift-check.yml`**: add a header comment stating it runs downstream by design, and a `paths:` filter on `push` and `pull_request` (`agents-src/**`, `skills-src/**`, `.claude/**`, `.agents/**`, `.codex/**`, `.github/agents/**`, `.github/instructions/**`, `scripts/**`, `templates/**`, `supporting-files/AGENT_FLOWS.md`, `README.md`, `.templatesyncignore`) so product commits in targets do not spend Actions minutes (O6: adopted).
4. **iOS-only assets are already iOS-only** (Fastfile, MCP configs, XcodeGen spec) and only land through `bootstrap.sh --platform ios`; TOOLING.md states this so a Python or TypeScript repo can see it carries no Apple tooling.

### Acceptance

- Every script and workflow in `git ls-files` has a TOOLING.md row (a grep-based check in the template-only CI step from WP1).
- A TypeScript bootstrap in a temp copy leaves no iOS asset behind.

---

## WP5 — Rollout

**Order.** WP1 → WP4 → WP2 → WP3, one PR each on `project-template`, each passing the four checks. WP2 before WP3 because both touch `validation-tiers.md` and the skills, and WP2 is the smaller, concrete change.

**After each merge.** Trigger `template-sync` by `workflow_dispatch` in each target (or wait for the Monday run), merge the sync PR.

**Per existing repo (once, after WP1 merges).**

| Repo | On disk | Steps |
|---|---|---|
| `scan-basic` | `~/Projects/scan-basic-project/scan-basic` | `scripts/template-cleanup.sh --target … --apply --pr`; hand-edit `CLAUDE.md`/`AGENTS.md` house rule (WP1 §5); adopt WP3 at the Phase 8 boundary |
| `basicapps-site` | `~/Projects/basicapps-site-project/basicapps-site` | same |
| `tycoon` | `~/Projects/tycoon-project/tycoon` | same |

`project-ideas` was deleted from GitHub on 2026-09-28 and its `TEMPLATE_SYNC_PAT` revoked; it is out of scope.

**Not done by this plan.** Force-deletion or hooks in the sync action; moving sources off targets; porting python3 tooling to shell; rewriting live state files outside a phase boundary.

## Rulings O1–O8 (Sean, 2026-09-28: every recommendation adopted)

| Id | Question | Ruling |
|---|---|---|
| O1 | `OS=` runtime pin in the tier commands | Stage 2 human step recorded in the profile; no bootstrap placeholder |
| O2 | Simulator lease helper script | Doctrine only; no script |
| O3 | Fastfile build number | Disable `manageAppVersionAndBuildNumber` and read the shipped number back from the ipa |
| O4 | Phase summaries | Split per phase under `docs/phase-summaries/` with an index |
| O5 | Fingerprint exclusions | Exclude all of `docs/**` |
| O6 | Downstream drift check | Add the `paths:` filter |
| O7 | Default context budgets | Snapshot 250 lines, knowledge 300 lines, profile-overridable |
| O8 | [iCloud] recommendations | Included under an "If the app uses iCloud" heading |
