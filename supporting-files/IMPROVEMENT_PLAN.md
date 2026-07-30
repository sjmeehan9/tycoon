# .template Improvement Plan

**Date:** 2026-07-03
**Inputs:** Full review of all 23 `.claude/agents/`, 25 `.github/agents/`, 2 skills, 2 instruction files, `AGENT_FLOWS.md`; owner feedback (11 items); external research verified against current Claude Code, GitHub Copilot, and GitHub template-repo documentation; adversarial verification pass (completeness / consistency / fact-check) with all confirmed findings folded in.
**Confirmed decisions:** Strict structured-output protocol for every agent message · error-handling/coverage findings are separate and non-blocking · single-source agent generation · per-repo project profile file for stack config.

---

## Part A — Repository & tooling

### A1. Convert the workspace into a GitHub template repository (feedback 1)

**Mechanism (verified against current GitHub docs):**

1. **Template repo, not a first-run Action.** Push this workspace to GitHub (suggested name: `project-template` — leading-dot repo names are legal but confusing) and enable *Template repository* in settings. Dotfolders (`.claude/`, `.github/`) copy verbatim; new repos start with a single initial commit; workflow files arrive active because template creation copies files server-side (the OAuth `workflow`-scope push restriction never applies — though `gh auth login` grants that scope by default anyway). First-run self-customising Actions (the stefanbuck/cookiecutter pattern) work but require a PAT secret and orphan-branch force-pushes — not worth it for a mostly-Markdown template.
2. **Bootstrap script, checked in.** `bootstrap.sh` (run right after `gh repo create <name> --template <owner>/project-template --private --clone`):
   - Prompts for project name, platform (`ios` / `python` / `typescript` / mixed), bundle ID (iOS).
   - Writes `docs/project-profile.md` (see A3) and a minimal `CLAUDE.md` pointing at the profile and the standards file — so the Claude-side "standards file always present" orientation assumption holds in bootstrapped repos, not just Copilot-side.
   - iOS: writes an XcodeGen `project.yml` from a stub **plus minimal Swift app source/asset stubs** (project.yml alone generates nothing buildable), runs `xcodegen generate`; `.xcodeproj` is gitignored. XcodeGen is the chosen default; noted alternative: Xcode 16+ buildable folders have removed most pbxproj merge pain, so a committed `.xcodeproj` is viable if generation ever feels heavy. Tuist is the upgrade path for modularisation/caching.
   - Python/TS: seeds `pyproject.toml` / `package.json` stubs as applicable.
   - Fills the platform placeholders in `.github/instructions/` (removing the current leaked prior-project values: scheme `Topics`, `iPhone 16` simulator).
   - **Does NOT modify agent files.** Agent definitions stay byte-identical to the template; all per-project variability lives in `docs/project-profile.md`, which agents read at runtime. This is what makes template-sync and the CI drift check (A2) work without conflict.
3. **Downstream updates.** Ship `AndreasAugustin/actions-template-sync` (actively maintained) as a workflow in the template so every generated repo gets periodic PRs when the template's agents/skills evolve. `.templatesyncignore`: `docs/project-profile.md`, `CLAUDE.md`, `project.yml`, `README.md`, app source. Because agent files are never customised downstream (see 2), sync PRs never clobber project content.
   **Token strategy (decide up front):** make the template repo **public** and sync with the default `GITHUB_TOKEN` (accepting that sync PRs won't trigger downstream CI — a documented Actions limitation), **or** keep it private and store a fine-grained PAT/GitHub App credential in each generated repo. If neither trade-off is acceptable, drop the sync workflow and pull updates manually with `git diff` against a fresh template clone.

### A2. Single source of truth for agent definitions (drift elimination)

The Claude and Copilot copies of each agent are ~80% duplicated and have already drifted materially: `docs/phase-plan.md` (Claude TBA) vs `docs/phase_plan.md` (Copilot TBA) breaks the Tech Lead handoff; coverage policy says "Minimum 30%" in Copilot Review but "Maximum 30%" in Copilot TechLead; the four implement variants carry three different design-uncertainty rules; team-collaboration protocol exists only on the Claude side while the richer templates exist only on the Copilot side.

**Design:**

- New `agents-src/` directory: one canonical definition per role. Shared body + a small variant matrix:
  - **Platform:** `claude` (renders `.claude/agents/<role>.md`) / `copilot` (renders `.github/agents/<Role>.agent.md`).
  - **Mode:** `interactive` / `autonomous` (autonomous variants generated for **both** platforms — today `implement-autonomous` is the only Claude-side port).
- Platform-conditional blocks for the genuinely platform-specific parts: Claude gets `memory: project` and the Team Collaboration Protocol (used by the skills); Copilot gets `tools:` and `argument-hint:`.
- A small build script (`scripts/build-agents.*`, Python or Node) renders all outputs; a CI check fails any PR where rendered files don't match source. (Works downstream too, because rendered files are never project-customised — see A1.2.)
- **Skills included:** the generator also renders both `SKILL.md` files from source, so shared blocks (Steward prompt, Agent Report format, coordination rules) exist once. Alternative if that's too much machinery: put the Steward prompt in a standalone `.claude/skills/shared/steward-prompt.md` that both skills instruct the Lead Coordinator to read at spawn time. Either way, the current "use the Steward prompt from build-with-agent-team's Step 4 verbatim" heading-coupling goes away.
- **Reconciliation rules for the merge:** where the two platforms differ, take the *stricter/richer* text as canonical (Copilot's full templates, checklists, severity definitions — where they exist; Claude's ownership and handoff rules), then apply the Part B/C rewrites once, in one place.
- **Frontmatter hygiene fixed at the generator level (verified against current platform docs):**
  - **Claude side: emit `model: inherit` explicitly** on every agent (documented, supported). Omission *currently* defaults to inherit, but the explicit token declares intent and survives any platform default change. **Copilot side: omit `model:` entirely** — no inherit token exists; unset inherits the session/model-picker default. Pinning would be unreliable anyway: `model` is documented for IDE clients only; the cloud agent ignores it, and the CLI's partial support silently downgrades pinned models and fails to load agents using VS Code's array syntax. **This resolves feedback 3 across all ~50 files.**
  - `argument-hint:` is VS Code-oriented (ignored by the cloud agent, may warn in the CLI) — keep it deliberately for the VS Code experience, with a generator comment noting its portability profile.
  - Deduplicate the `'agent'` entry that appears twice in every Copilot tools list; quote consistently.
  - Correct wrong `argument-hint`s (TBA currently carries the Solutions Architect's).
  - Per-agent least-privilege tools lists (see A4) instead of the current identical Python-pinned list on every agent including copywriters.
  - Descriptions written as delegation triggers (both platforms use `description` for auto-routing).
  - Bodies emitted without session-state text (several Claude agents currently end with a baked-in "Your MEMORY.md is currently empty." that becomes false after first use — replace with "check MEMORY.md if present").

### A3. `docs/project-profile.md` — per-repo stack contract (feedback 2)

Written by `bootstrap.sh`; the single place agents look for anything stack- or repo-specific. Required sections:

- **Platform & language(s)** (e.g. "iOS 26+, Swift 6, SwiftUI, iPhone-only").
- **Validation tiers** — ordered, copy-pasteable targeted, component, and phase commands. Targeted checks are Implement's inner loop; exactly one component gate runs for a final source-tree fingerprint; independent Test always owns the cumulative phase gate. This replaces both hardcoded stack commands and the legacy rule that every role reruns the same full sequence.
- **Test frameworks** — unit (XCTest / pytest / Jest) and **UI/E2E harness** (XCUITest on simulator / Playwright / Cypress) — consumed by the phase-validation mode (C2).
- **Test & coverage policy** — whether coverage is measured at all, and any target. No default floor (see C5).
- **Project layout** — where source, tests, and scripts live (replaces hardcoded `app/src/`, `scripts/evals.py`).
- **Run instructions** — how to launch the app locally (simulator scheme / dev server).
- **Git workflow contract** — branch naming, where component commits land, who merges, protection of `main`, release/deploy gate. Both skills currently assume a git workflow that is never defined: Review "commits and pushes" with no branch-creation step anywhere, and the waitlist Builder merges to main / deploys to production on chat-level approval with no rollback guidance. Review's commit step and the Builder's deploy step become conditional on this contract.
- **External services & human-task inventory** — feeds Component X.1 planning (for iOS: signing, provisioning, App Store Connect, TestFlight).
- **Performance/quality budgets** — page-weight/LCP targets for web projects, app-launch budgets for iOS (moves landing-page-builder's hardcoded and currently unachievable "LCP < 1.8s on Fast 3G" here, set to something attainable).
- **Framework versions** — e.g. the Next.js major for the validation path (currently hardcoded "Next.js 15 App Router" in agent text, which will rot).
- **Standards file pointer** — path to the coding-standards instructions (referenced by both `CLAUDE.md` and the Copilot agents, so Claude agents stop hard-depending on the Copilot-branded filename).

**Agent-side change (all delivery-chain agents):** replace embedded command blocks with *"Run the smallest tier assigned by `docs/project-profile.md`; reuse passing evidence while its source-tree fingerprint is unchanged. If the profile is missing or still defines only the legacy single sequence, stop and raise profile migration as a blocker — do not guess commands."*

**Instructions files:**
- `copilot.instructions.md` already has good Swift/iOS standards — keep them, parameterise the leaked `Topics` scheme and `iPhone 16` simulator via bootstrap, and **un-comment the `applyTo: '**'` line** (currently commented out, so the file that defines all standards is never auto-loaded in Copilot).
- `troubleshooting.instructions.md` (~610 lines, `applyTo: '**'`) is injected into every Copilot request. Trim to genuinely cross-project pitfalls, move stack-specific sections behind per-stack headings, and delete sections tied to the prior orchestration product. Also fix §6.7 ("absorb future unknown event types silently"), which contradicts the fail-loudly standard.

### A4. Tools hygiene (Copilot `.agent.md`)

- Research/writing agents (positioning-brief, copywriter, competitor-analysis, ideate, PM, TBA, phase-docs): `read`, `search`, `edit`, `web`, `todo` — no `execute`, no Python env tools, no containers, no `stitch/*` except the design agent. (All six tool names verified as documented Copilot aliases.)
- **tech-lead: `read`, `search`, `edit`, `web`, `todo`** — web access is required by its Technical Validation duty (C1).
- Delivery agents (implement, test, review, debug): stack-appropriate execution **plus `web` for implement** (needed for C1's re-verification of external assumptions; in team mode this may instead be delegated to a web-enabled `technical-research` spawn — whichever is chosen, C1 and this list must name the same mechanism). Drop `pylance`/`ms-python.*` pins (the profile file tells them what to run — VS Code Python tools are useless on iOS).
- `target:` field only if an agent is genuinely IDE-only; avoid VS Code-only fields (`handoffs`, `hooks`) in shared files.

---

## Part B — Planning & refinement quality (the core problem)

### B1. Remove all stated ranges; size by feature completeness (feedback 5, 7)

**Delete (TBA, all variants):** "Define 5-20 high-level phases" · "Prefer 3-8 components per phase" · "No more than 8 components to a phase" · "The next 1-3 phases … MVP" · "The final 2-3 phases …" · **"Aim to defer human manual testing and validation to the final phases" and "The bulk of human manual testing should occur in these final phases"** (this deferral doctrine directly contradicts feedback 6 — deleting only the numeric ranges would leave the planning layer pushing UI validation to project end while the delivery layer tests per phase).
**Delete (build skill):** "components sized 2-8 hours" (appears in Stage Validation *and* Definition of Done) · the 2-3/4-6/7-10-component agent-budget framing and "Typical: 1 TBA + 2-3 TLs". Replacement concurrency text: *"Treat max-agents as a ceiling. Serialize component authoring on the phase branch by default; opt into parallel authors only when the project profile defines a complete branch/worktree integration protocol. Queue components in dependency order."*
**Delete (tech-lead):** "[2-3 sentences describing…]" · "max 2 paragraphs per file" — descriptiveness caps applied to the spec itself.
**Delete (both TBA/Review/instructions):** every "30% coverage" figure (currently self-contradictory: minimum in two files, maximum in a third).
**Delete (both skills):** "≥5 competitor profiles" floors → replace with a completeness criterion: *"all materially competing products in the defined market, and the analysis states why the set is complete"*. Align `validate-with-waitlist`'s "Agent budget: 2-3 task agents" ranges with the concurrency-only guidance above.
**Delete (validation-path agents):** design's "the 3-5 most important user journeys" cap (it already contradicts the agent's own completion requirement to cover *all* primary journeys) · repo-analysis's "5-10 recommendations" → as many as warranted · Solutions Architect's "Max 3 scenarios" on E2E testing scenarios → as many as the critical journeys require.

**Replace with a single sizing doctrine (canonical text, used by TBA, Tech Lead, and the skill's stage-validation):**

> Create as many phases and components as the initiative needs — there is no target count in either direction. A phase is correctly scoped when it delivers one or more complete, demonstrable end-to-end features. A component is correctly scoped when its feature slice works end-to-end at the component's boundary and an agent can deliver it fully — with no required behaviour deferred — in a single focused engagement. If a component cannot meet that bar, split it into further components or sequential subcomponents; never shrink the feature to fit a count, a time budget, or a document length.

**Stage-validation replacement (skill):** swap "components sized 2-8 hours" for feature-completeness checks: every requirement in scope maps to a named component; every component names its full runtime path; no component is a horizontal layer (see B2); no required behaviour appears only as a future hook.

### B2. Phases and components as rounded end-to-end features (feedback 10)

- **Phase organising principle (TBA):** each phase is built around one or more individual, rounded, end-to-end features of the larger initiative — stated as *"a user can now …"*. Resolve the current internal contradiction ("Foundation First: infrastructure before features" vs feature-slicing) explicitly: Phase 1 is a **walking skeleton** — the thinnest complete path through the real architecture (for iOS: app boots on simulator, one real screen, one real data round-trip) — and every subsequent phase adds vertical feature slices onto it. Infrastructure appears only inside the feature slice that first needs it.
- **Component organising principle (Tech Lead, Implement, Review):** components are vertical slices — UI + logic + persistence + wiring for one facet of the phase feature — never horizontal layers ("models", "services", "screens"). This rule must also bind the *split* mechanisms: when Implement decomposes an oversized component or Review writes a split proposal (`X.Ya/X.Yb`), each part must be a runnable vertical slice, not a layer.
- **Keep the structural bookends:** Component X.1 (human setup — for iOS: signing, provisioning, App Store Connect) and the phase-final validation component (now upgraded, see C2). Everything between them is feature-vertical.
- **TBA phase-plan requirement (feeds C2):** every phase in `docs/phase-plan.md` names the user-facing flows and critical backend features its phase-final validation component must exercise.
- Fix `copilot.instructions.md` line 9's "break down delivery even smaller if it's too much at once" → "take more components/phases, never thinner features."

### B3. More descriptive, completeness-scoped breakdowns (feedback 7)

Component spec template (Tech Lead) becomes content-mandated instead of length-capped. Required sections per component:

1. **Purpose & user-visible outcome** — the "a user can now…" statement; as long as needed.
2. **End-to-end runtime path** — entry point → UI → logic → persistence/services → observable result, named concretely.
3. **Files & interfaces** — files to create/modify with per-file implementation requirements (no paragraph cap; err long), public interfaces/contracts exposed to dependent components.
4. **Dependencies** — upstream component IDs (consumed by the targeted-reading protocol, C4) and external services.
5. **Technical Validation** — new, see C1.
6. **Acceptance criteria** — observable behaviours, each phrased so a tester can execute it.
7. **Explicit non-goals** — what is deliberately out of scope and where it is covered instead.
8. **Test requirements** — essential tests only, subordinate to feature depth (C5). For components whose feature has a user-facing flow: name the UI/E2E test(s) that the phase-final validation component will run (authorship rule in C2).

Port the Copilot-only phase-level template (Phase Overview / Goals / Phase Acceptance Criteria) into the canonical source so both platforms get a phase narrative. Standardise the output filename to `docs/phase-plan.md` everywhere.

### B4. Priority doctrine (feedback 5 — depth over tests/docs)

One canonical statement injected into **TBA, Tech Lead, Implement, Test, Review, Debug, project-manager, ideate, solutions-architect, and both skills**:

> **Priority order when anything must give:** (1) complete, working end-to-end feature behaviour — the full runtime path, with real wiring, at production depth; (2) correctness of that behaviour under realistic use; (3) essential tests proving the primary paths; (4) documentation; (5) stylistic/lint conformance. Never trade item 1 or 2 for items 3-5. Never descope silently.
> **Descope handling — interactive mode:** a conscious descope requires explicit approval before proceeding, and is recorded under **Deferred** and in the component spec.
> **Descope handling — autonomous mode:** descoping is prohibited unless physically unavoidable (e.g. an external service does not exist); if unavoidable, log it under **Assumptions + Deferred** and flag it as a **Required action (human)** for retroactive review — do not wait.

(The mode split prevents the doctrine from reinstating the approval deadlock that C3 removes from autonomous variants.)

Supporting deletions: PM's "Balance thoroughness with project timeline pressures" (licenses shallow work). The build skill's Definition of Done and success-report templates gain a feature-completeness line ("every acceptance criterion in the phase's component specs is demonstrably met") — today success is reported purely as "[N] tests, [X]% coverage" with no feature dimension.

This keeps the existing anti-laziness machinery (scope-integrity gates, "no hollow infrastructure", "no test-only completion" — the strongest text in the pipeline; keep verbatim) and gives it the tiebreaker it currently lacks. Review's verdict logic is updated to match: a missing/shallow feature is always a blocker; a test-breadth or documentation shortfall is not (C5).

---

## Part C — Delivery-chain behaviour

### C1. Per-component Technical Validation (feedback 9)

New mandatory step, owned by **Tech Lead** at spec time and re-checked by **Implement** at build time:

- **Tech Lead (refinement stage):** after drafting each component spec, validate it against (a) the project docs (solution design, requirements, prior phase summaries) and (b) **current external documentation** for every product/platform/service the component touches — SDK/API references, version constraints, platform rules (for iOS: HIG patterns, App Store review guidelines, entitlement requirements). Record a `Technical Validation` section in the spec: sources checked (with URLs/versions), assumptions confirmed, discrepancies found, open risks. Reuse the `technical-research` agent's method (inventory → check against official docs → graded findings); in team mode the orchestrator may spawn `technical-research` scoped to the phase breakdown. Completing this section is what transitions the component to **Spec-Validated**.
- **Implement (implementation stage):** at orientation, re-verify the spec's external assumptions are still current (APIs exist as described, versions available). A failed re-verification **demotes the component to Queued**, reported as **Drift / Open questions** before coding — never silently worked around. Uncertain serialization or framework composition requires an executable capability probe, not signature checking alone.
- **Component lifecycle (build skill):** all components start `Queued → Spec-Validated → Implementing`; only states required by the assigned assurance lane follow: `fast` goes directly to Committed after Implement's gate; `test` adds Testing; `review` adds Reviewing; `full` adds both; `phase-gate` uses aggregate Reviewing, mandatory Test Phase X, then a commit-only Review resume. Review is not a mandatory per-component state.
  - **Spec-Validated** is set during refinement; no Implement agent is spawned before it. The handoff assigns exactly one lane and the component overview becomes the sole delivery manifest.
  - On a clear component-gate or Review failure, the original Implement receives one bounded remediation. Debug is reserved for ambiguous, repeated, flaky, or systemic component failures and is immediate for cumulative phase-test failures. The component re-enters at its earliest invalidated gate; maximum three cycles before human escalation.
- Review's orientation table gains the Technical Validation section and trusts unchanged-tree validation evidence instead of rerunning it.

### C2. Phase-end UI + critical-backend testing (feedback 6)

- **Test agent has two modes, but component mode is conditional.** It owns the single component gate only in `test` and `full`. `Test Phase X` is mandatory, executes every phase E2E scenario, runs the **UI harness from the project profile** over the phase's user-facing flows, exercises critical backend paths end-to-end, and runs the full cumulative suite.
- **Suite authorship (currently unassigned — the gate would be vacuous):** the **phase-final validation component's Implement engagement builds/extends the UI + critical-backend E2E suites** for the flows named in that component's spec (which the Tech Lead populates from the phase plan's named flows, B2). Feature components contribute flow-level tests where practical (B3 §8); the phase-final component owns the cumulative harness.
- **Phase-mode reading contract (exemption from C4's component scoping):** the phase section of `docs/phase-plan.md`, the phase-final component spec, every component's overview doc (not full specs), the phase E2E scenarios, and `docs/project-profile.md`.
- **Durable artifact:** phase mode writes `docs/phase-X-test-report.md`, with failures enumerated per owning component. Conditional component mode writes `docs/test-reports/phase-X-component-X-Y-test-report.md`. Both record a source-tree fingerprint; detailed transcripts live in files, while Agent Reports stay concise.
- **Gating (build skill + Review):** the phase-final validation component's Review, aggregate phase Review, and `phase-docs` require a PASS phase report. Review consumes valid evidence and performs static/spec/diff analysis; it does not create another validation run.
- **Phase-failure remediation (previously undefined — the gate would deadlock on the first cross-component failure):** new lifecycle transition **Committed → Reopened**. The Lead Coordinator assigns each cumulative failure to its owning component and routes it immediately to scoped Debug. Any changed candidate refreshes the aggregate audit before `Test Phase X` reruns. Cycle cap remains max-3-then-escalate.
- Tech Lead's phase-final component spec must name the UI flows and critical backend features to be validated — "UI" appears explicitly, not implied by "E2E scenarios".

### C3. Strict structured communication protocol (feedback 8) — all agents

One canonical **Agent Report** format, defined once in the shared source and injected into every agent and both skills:

```
## [Agent] — [Task] — [Status: IN PROGRESS / BLOCKED / COMPLETE]
**Open questions:** …            (anything needing a human decision; approval requests live here)
**Outputs created:** …           (files written/updated, commits, deploys — with paths/SHAs)
**Problems / blockers:** …       (what is stopping or degrading the work, with proposed resolution)
**Drift:** …                     (any deviation from approved spec/scope/plan, incl. discovered inconsistencies)
**Deferred:** …                  (work consciously postponed — incl. Hardening notes — and where it is tracked)
**Required actions (human):** …  (setup, credentials, approvals — the human task gate renders here)
**Next steps:** …                (for human and for agents — who does what next)
```

Rules: **every** user-facing message is this block; omit empty sections; approval gates stay but are phrased as Open questions + Required actions; verbose evidence (test transcripts, research notes) goes to files, referenced under Outputs created. Existing bespoke formats (Debug's intake/completion report, Test's report, Review's verdict) keep their internal content but are **wrapped** in this block — e.g. Review's APPROVED/BLOCKED verdict appears in the Status line and Problems/blockers. Delete per-agent chat filler ("provide a one-sentence overview of each document"). Magic-string handoffs ("Phase plan approved. Tech Lead agents may proceed…") are replaced by the block's machine-scannable Status line + Next steps.

**Routing rule (canonical, replaces per-agent contradictions):** in **team mode** all reports go to the Lead Coordinator (defined by pointer to the orchestrating skill's coordinator role); in **solo mode** they go directly to the user. This is defined once alongside the report format and applied to every agent — the reviews found undefined or contradictory "Lead Coordinator" references in project-manager, tech-lead, competitor-analysis, technical-research, design, and repo-analysis, including "present to the user" vs "present via Lead Coordinator" conflicts for the same step.

**Skill-side edit inventory (the Lead Coordinator is itself bound by the protocol):** rewrite `build-with-agent-team`'s Stage Completion summaries ("## Planning & Solution Design Complete…"), the Human Task Gate block, and the "Ask the user: proceed to Refinement?" prompts — and `validate-with-waitlist`'s "Validation Path Complete" summary — as Agent Report blocks (gate items → Required actions (human); stage-transition question → Open questions; produced docs → Outputs created).

Autonomous variants: same block, but Open questions become **Assumptions** (logged and proceeded on, per the B4 mode split) — this also fixes the current deadlock where "autonomous" agents still "present this plan to the user and wait for approval."

### C4. Dependency-driven reading (feedback 11)

- **Component Overview docs get a defined contract** (today they have only a 100-line cap and *no consumer anywhere in the pipeline*): What was delivered (feature outcome) · Public interfaces/contracts exposed · Files owned · How to run/verify it · Integration notes & gotchas. **They remain summary artifacts:** soft target "concise — a consumer should absorb it in one read", with the same completeness-wins override as phase summaries. (Uncapping them entirely would erode the context economy this section exists to create.)
- **Implement orientation rewritten** (currently: "thoroughly read" ~9 documents every session): read (1) your component's spec section — including Dependencies, Technical Validation, and assigned assurance lane; (2) the **overview manifests of declared dependencies**; and (3) `docs/project-profile.md`. Consult brief/solution-design/phase-plan only when a specific decision requires them. The current component overview is the sole delivery manifest; no duplicate phase-level implementation log is maintained.
- Same targeted principle applied to **Test, Review, Debug** (Review currently marks the component overview — the one doc that matters most — as "read only if needed" while mandating everything else; Debug's "read the codebase" is unbounded → point it at the failing component's spec + overview first). Test's phase mode uses the C2 reading contract instead.
- The build skill's Implement input contract adds: "the overview docs of the component's declared dependencies." The skill's Steward line-limit checklist and Step-5 output contract are updated to the new cap policy and overview content contract (they currently enforce the old caps and would silently reinstate them).

### C5. Bugs vs polish (feedback 4) — Debug, Review, Test

Canonical exclusion rule, injected into all three:

> Unclear or non-graceful error handling and incomplete unit-test coverage are **not defects**. When an explicit bug or spec deviation is in scope, never present them as findings, root causes, fixes, or blockers, and never route them to Debug. If you notice them, list them under **Deferred → Hardening notes** for awareness; take no action on them.

Concrete edits:
- **Review:** remove "Test coverage meets the project minimum (30%)" as a blocker; coverage is checked only if the project profile defines a policy, and a shortfall is a Hardening note, not a verdict input. Missing/shallow **features** remain hard blockers. The Issues table gains a category column — **Defect / Spec deviation / Hardening note** — with written definitions and one example each (the current Blocker/Major/Minor taxonomy is undefined on both platforms). **Silent-fix authority bounded to formatting-only**, and every silent fix is reported under Outputs created.
- **Test:** remove "missing error handling" from the Major severity definition; error-condition tests still run where the spec demands them, but generic gracefulness observations are Hardening notes. Drop `--cov-report=term-missing` from baseline commands (it surfaces coverage gaps into every run, inviting exactly the behaviour feedback 4 prohibits). **Collapse the two conflicting fix-authority thresholds** ("trivially correct — typos, missing imports" vs "small and unambiguous") into the stricter one; everything else is routed via the C3 report.
- **Debug:** bound the "defensive where appropriate" clause — add a guard only when the missing guard *is* the root cause of the reported bug. Reconcile the scope conflict: systemic duplicates of the same root cause within the assigned scope are fixed; anything beyond is reported under Deferred/Next steps, not fixed.

### C6. Remaining consistency fixes (from the review)

**Skills:**
- Remove human-only instructions from agent prompts ("Enter Delegate Mode (Shift+Tab)" → README).
- Fix the dead `max-agents` argument in `validate-with-waitlist`; give `build-with-agent-team` concrete per-stage max-agents defaults (or remove the argument) — "default varies by stage" currently resolves to nothing.
- Define the state file's report fields to match the C3 block.
- `validate-with-waitlist`: make `DESIGN.md` either a required Design-stage output or give the Build cross-review and Asset Producer an explicit no-DESIGN.md fallback (today it's optional to produce but assumed present by two consumers).

**Doc caps:** keep caps only on *state/summary* artifacts (state file and phase summary — raise phase summary from a hard 150 to a soft target with a "completeness wins" override; overview manifests per C4); remove caps from specs where they fight descriptiveness (B3).

**Paths & names:** `docs/phase-plan.md`; all doc references get explicit `docs/` paths; `.env` location decided once (root-level `.env.local` is the ecosystem default) and encoded in the profile; date/name format for the repo-analysis output pinned down.

**Claude agents referencing `copilot.instructions.md`:** replace with the profile's *standards file pointer* (backed by the bootstrap-written `CLAUDE.md`, A1).

**Autonomous variants:** generated for both platforms from source (A2); clarification steps replaced by assumption logging (C3/B4); PM-autonomous's impossible "get explicit confirmation" instruction removed.

**Solutions Architect:** fix the ownership conflict (Claude forbids touching `brief.md`; Copilot lists it as an output); make cost-estimation and API/scaling handover criteria conditional on project shape (an iPhone-only app without a backend has no "API design" to complete).

**technical-research:** reconcile its five contradictory edit/approval formulations to one rule — it never edits `docs/solution-design.md` directly; corrections are relayed via the C3 report to the document owner — and add a triage rule (validate blocking/breaking-risk items first, then the rest).

**competitor-analysis:** treat `docs/solution-design.md` as optional-at-start ("when available") with an explicit re-read once the SA hands off — its current "always present, read at session start" orientation deadlocks against the team protocol that runs it in parallel with the SA.

**Validation-path agents:**
- **design:** journeys cap removed (B1); keep the Stitch focus but add a stated fallback if Stitch is unavailable (export prompts as generic design-prompt markdown usable with any tool).
- **copywriter:** fix the CTA contradiction (template allows a "variant" secondary button label while rule 4 and the completion criterion require identical CTAs — make the template match the rule).
- **landing-page-builder:** framework version and performance budgets read from the profile (A3); no direct merge-to-main — deploys follow the profile's git workflow contract.
- **asset-producer:** human-gated waits get the C3 treatment — blocked states reported as Required actions (human) with the block visible in the state file, no undefined-duration silent waiting.
- **Ideate/PM/positioning/copywriter question quotas** ("2-4 questions per turn, up to 8 turns"): keep per-turn pacing, drop hard turn caps in favour of a completeness exit ("stop when the document passes its checklist, not at a turn count").

**repo-analysis:** recommendations cap removed (B1); solo/team routing per C3.

**AGENT_FLOWS.md:** update after implementation — add Spec-Validated/Blocked/Reopened lifecycle states, the phase-test gate, `project-profile.md` and test reports to the ownership map, `agents-src/` + generator to a new "repo architecture" section, and the bootstrap flow.

---

## Part D — Post-implementation review correction (2026-07-21)

A component-session review found that the mandatory `Implement → Test → Review` chain produced useful independent findings but multiplied full-suite runs, forced serial cold starts, discarded valid evidence at role boundaries, and allowed shared simulator/tool contention. The correction is an **Implement-led assurance model**, not an Implement-only quality model.

### D1. Assurance lanes

The coordinator assigns one lane from explicit risk triggers before spawning Implement:

| Lane | Component/phase gate owner | Review | Commit owner |
|------|----------------------------|--------|--------------|
| `fast` | Implement, component tier; targeted proof only for explicitly non-runtime setup/docs | — | Implement |
| `test` | Test, component tier | — | Implement |
| `review` | Implement, component tier | Independent component Review | Review |
| `full` | Test, component tier | Independent component Review | Review |
| `phase-gate` | Test Phase X, phase tier | Mandatory aggregate phase Review | Review |

Test triggers: UI/OS/external behaviour not fully proven by deterministic component tests, cross-component or persistence round trips, primary-path mocks/fakes, permissions/privacy/security, migrations or destructive state, concurrency/background execution, first use of a runtime/integration pattern, or regression-prone observable behaviour. Review triggers: shared/core/app-entry/build/config/signing files, new or changed public API/schema/protocol/cross-component contracts, security/privacy authorization, a spec deviation or ADR, an open Technical Validation risk, an ownership exception, broad scope, or incomplete/contradictory evidence. Both sets or any critical signal trigger `full`; neither triggers `fast`; the phase-final validation component is always `phase-gate`.

### D2. Validation and evidence invariants

1. **Targeted tier:** Implement may repeat focused checks during its inner loop.
2. **Component tier:** exactly one owner runs exactly one final component gate for a source-tree fingerprint — Implement in runtime `fast`/`review`, Test in `test`/`full`. An explicitly non-runtime setup/documentation `fast` component may use one targeted proof as its completion gate; runtime source/config never uses that exception.
3. **Phase tier:** independent Test always runs `Test Phase X`, regardless of component lanes. It is the only cumulative full-suite gate required by the agent pipeline before phase close.
4. Every durable result records commands, result, duration, and the output of `python3 scripts/worktree-fingerprint.py`. A role handoff does not invalidate it; a source change does.
5. Review is primarily a static/spec/diff audit and never reruns valid evidence. The aggregate phase audit covers components that skipped per-component Review and precedes Test Phase X; after PASS, Review resumes for a commit-only pass while the candidate is unchanged.
6. If an MCP client timeout is shorter than the last recorded suite duration, use the profile-approved runner with a sufficient timeout instead of making a predictably doomed first attempt.

### D3. Coordination invariants

- The approved component spec is already the plan. There are no per-component plan-approval waits unless new information requires a material spec change, descope, external authority, or explicit human gate.
- Component reports are concise. Detailed transcripts stay in test artifacts; chat carries decisions, blockers, paths, fingerprints, and next ownership.
- `docs/components/phase-X-component-X-Y-overview.md` is the sole delivery manifest. It includes delivered files, interfaces, integration notes, assurance lane, and evidence. Parallel running logs are removed.
- Component authoring is serialized by default on the phase branch. Parallel authors require a project-profile-defined complete branch/worktree integration protocol; worktree isolation or file disjointness alone is insufficient. Shared simulator/browser/database/service/port operations require a coordinator lease. Git index writes, commits, pushes, and branch integration use a separate serialized lane.
- The team topology stays flat: only the coordinator spawns task agents, and existing role engagements are resumed for remediation or commit-only passes instead of paying avoidable cold starts.
- The original Implement owns the first bounded remediation for a clear component-gate or Review failure. Debug is invoked for ambiguous, repeated, flaky, or systemic component failures and immediately for any `Test Phase X` failure.
- Technical Validation uses executable capability probes for uncertain binary serialization, framework composition, and runtime round trips. A failed foundational assumption demotes the component for re-specification rather than opening unbounded remediation.

### D4. Migration

Generated agent and skill definitions update through `agents-src/`, `skills-src/`, and `scripts/build-agents.py`, but downstream `docs/project-profile.md` files are intentionally protected from template sync. Existing projects must manually adopt the targeted/component/phase sections from the matching profile template before invoking the updated implementation pipeline.

---

## Suggested implementation order

1. **Quick wins (no restructuring):** `model: inherit` on Claude agents; fix tools lists, argument-hints, `phase_plan.md`, commented-out `applyTo`, leaked `Topics`/`iPhone 16` values.
2. **Canonical source + generator (A2):** reconcile divergences once; CI drift check; skills rendered from source (or shared Steward file). Everything after this is edited once.
3. **Behaviour rewrites (B1-B4, C1-C5):** sizing doctrine, feature-vertical framing, spec template, priority doctrine (with the interactive/autonomous descope split), Technical Validation + lifecycle, phase-test mode + Reopened protocol, Agent Report protocol + routing rule + skill template rewrites, bugs-vs-polish scoping, targeted reading.
4. **Stack profile + iOS (A3, A4):** project-profile contract (incl. git workflow section), profile-driven validation everywhere, instructions cleanup, iOS human-task/App Store content in TBA/Tech Lead guidance.
5. **Template repo + bootstrap + sync (A1):** rename, `bootstrap.sh` (profile + CLAUDE.md + XcodeGen stub with app source stubs), template-sync workflow with an explicit token/visibility decision.
6. **AGENT_FLOWS.md refresh + end-to-end dry run** of both skills on a toy project (one web, one iOS).
