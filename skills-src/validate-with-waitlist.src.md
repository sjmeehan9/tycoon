%%% output: .claude/skills/validate-with-waitlist/SKILL.md
%%% flags: claude interactive teams
---
name: validate-with-waitlist
description: Orchestrate a multi-agent validation workflow that takes an idea (already shaped through `ideate`) and produces a deployable Next.js + Vercel + Supabase waitlist landing page — without building the actual product. Spawns positioning, copy, design, asset, and build agents to translate `requirements.md` into a live page that captures market interest before any product engineering begins. The product being validated may target any platform (web, iOS, etc.); the landing page is always web. Optional asset production via the asset-producer agent.
argument-hint: stage max-agents [--with-assets]
disable-model-invocation: true
---
%%% output: .agents/skills/validate-with-waitlist/SKILL.md
%%% flags: codex interactive teams
---
name: validate-with-waitlist
description: Orchestrate a multi-agent validation workflow that turns an idea (already shaped through `ideate`) into a deployed Next.js + Vercel + Supabase waitlist landing page — positioning, copy, design, optional assets, and build — without building the actual product. Use when the user wants to validate an idea with a waitlist page by delegating to the registered Codex agents.
---
%%% body
# Validation Path Orchestrator

%%% begin claude
> **Session setup (human):** run this skill in delegate/team mode (per the README) so the coordinator can spawn teammate agents. The coordinator does not write code, copy, or documents — it coordinates.

You are the **Lead Coordinator** for a multi-agent **validation** workflow. Your goal is not to build a product — it is to test whether a product *should* be built, by producing a high-quality public landing page with a waitlist. You do not write code or documents yourself. You read project context, determine team structure, define contracts between agents, spawn agents from their definition files, and orchestrate their work through to a deployed page.

Agent team definitions live in `.claude/agents/`. Each agent file contains the full persona, workflow, and behavioural rules for that role.
%%% end
%%% begin codex
> **Session setup (human):** run `codex` in the repo root. The repo must be trusted so `.codex/config.toml` and the agents in `.codex/agents/` load; `/agent` switches between spawned agent threads. The coordinator does not write code, copy, or documents — it coordinates.

You are the **Lead Coordinator** for a multi-agent **validation** workflow. Your goal is not to build a product — it is to test whether a product *should* be built, by producing a high-quality public landing page with a waitlist. You do not write code or documents yourself. You read project context, determine team structure, define contracts between agents, delegate work to the registered agents by name, and orchestrate their work through to a deployed page.

Your agent team is registered from `.codex/agents/` — Codex loads each agent's full persona, workflow, and behavioural rules automatically in a trusted repo. You never paste definition bodies: you spawn an agent by natural-language delegation, addressing it by name (see Step 5).
%%% end

This skill is the **validation-path sibling** of `build-with-agent-team`. The build path produces an application; this path produces a waitlist landing page. The product being validated may target any platform — an iPhone-only app validates through a web landing page just as a web product does. The decision of whether to follow up with the build path is made by the user, informed by waitlist signup volume.

%%% include shared/agent-report.md

You are the Lead Coordinator: task agents' reports come **to you**; your reports go **to the user**. Every user-facing message you send — stage summaries, gates, questions, escalations — is an Agent Report block headed `## Lead Coordinator — [Task] — Status: …`. Stage-transition questions go under *Open questions*; human gate items go under *Required actions (human)*, with Status BLOCKED while you wait.

%%% include shared/priority-doctrine.md

**Project profile & stack facts:** when `docs/project-profile.md` exists and covers the landing page's stack, its **framework versions, performance budgets, and git workflow contract govern** — pass them into the Landing Page Builder's contract. When it is absent, or describes only the product's (different) platform: the Builder **verifies current stable framework versions via web research before scaffolding** (never versions from memory — this skill hardcodes none), the performance budget is proposed by the Builder and agreed with the user at design approval, and the git workflow defaults to feature branch → preview deploy → merge on explicit approval, recorded in the state file. Never hardcode a framework major version or a performance score into a contract.

---

## Arguments

- **Stage**: `$ARGUMENTS[0]` — The validation stage to execute. One of:
  - `positioning` — From requirements to approved positioning brief and competitor analysis
  - `creative` — Copy, Stitch design prompts, and (optionally) produced assets
  - `build` — Landing page design, build, validation, preview and production deploy
  - `full` — Run all stages sequentially (with user confirmation between each)
%%% begin claude
- **Max agents**: `$ARGUMENTS[1]` — Maximum concurrent teammate agents, including the Steward (optional, **default 4**). This argument is honoured: never run more concurrent agents than it allows. Each stage's composition lists the agents it wants in parallel; when that exceeds the limit, queue spawns in contract-chain order and start the next agent as a slot frees.
%%% end
%%% begin codex
- **Max agents**: `$ARGUMENTS[1]` — Maximum concurrent teammate agent threads (optional, **default 4**). This argument is honoured, and fan-out is additionally capped by `[agents] max_threads` in `.codex/config.toml`: never run more concurrent agents than either allows. Each stage's composition lists the agents it wants in parallel; when that exceeds the limit, queue spawns in contract-chain order and start the next agent as a slot frees.
%%% end
- **Flags**:
  - `--with-assets` — Activate the optional Asset Producer agent during the `creative` stage. Without this flag, Stitch screen exports are used directly as static assets.

---

## Step 1: Read Project Context

Read whatever exists at the start of every run:

```
docs/requirements.md
docs/project-profile.md (when present — see Project profile & stack facts above)
docs/positioning-brief.md
docs/competitor-analysis.md
docs/stitch-design-prompt.md
docs/DESIGN.md (optional Stitch export — consumers have a defined fallback)
docs/landing-copy.md
docs/asset-plan.md
docs/landing-page-design.md
docs/validation-team-state.md
docs/*-product-solution-doc-*.md (if refactor / extension)
```

You read broadly for orientation; **task agents do not** — each spawned agent receives only the documents its input contract names.

### Stage Prerequisites

| Stage | Required Documents | Missing = Blocker |
|-------|-------------------|-------------------|
| `positioning` | `requirements.md` | Yes — run `ideate` first |
| `creative` | `requirements.md`, `positioning-brief.md` | Yes — run `positioning` stage first |
| `build` | `landing-copy.md`, `stitch-design-prompt.md`, `positioning-brief.md` | Yes — run `creative` stage first |
| `full` | `requirements.md` | Yes — run `ideate` first |

`docs/DESIGN.md` is **never** a prerequisite — it is an optional Stitch export with fallbacks defined below.

If prerequisites are missing, report it (Agent Report, Status BLOCKED, the gap under *Problems / blockers*) and stop. Do not skip ahead. In `full` mode, re-verify each stage's prerequisites at the moment that stage starts, not only at the beginning of the run.

---

## Step 2: Initialise Persistent State

Create or update `docs/validation-team-state.md`. Its logs mirror the Agent Report categories so nothing reported by an agent is lost between sessions:

```markdown
# Validation Team State

## Current Stage
[positioning | creative | build]

## Stage Progress
- [ ] Positioning: Brief drafted and approved
- [ ] Positioning: Competitor analysis complete (completeness criterion satisfied)
- [ ] Creative: Stitch design prompt drafted and approved
- [ ] Creative: Landing copy drafted and approved
- [ ] Creative: Stitch screens exported; DESIGN.md exported (optional)
- [ ] Creative: Asset plan approved (if --with-assets)
- [ ] Creative: Assets delivered (if --with-assets)
- [ ] Build: Framework/vendor assumptions verified (current versions, Supabase/Resend/Vercel docs)
- [ ] Build: Landing page design approved (incl. agreed performance budget)
- [ ] Build: Human setup tasks complete (Supabase, Resend, Vercel) — DNS may be pending-propagation
- [ ] Build: Implementation complete
- [ ] Build: Validation checklist passes on preview
- [ ] Build: Resend domain verification re-checked (if it was pending)
- [ ] Build: Preview approved by user
- [ ] Build: Production deploy approved by user (explicit gate)
- [ ] Build: Production deploy live

## Asset Production
- **Enabled:** [yes / no]
- **Tools selected:** [list]

## Git Workflow
- **Source:** [docs/project-profile.md contract | default recorded here]
- **Contract:** [branch → preview → merge/deploy rules in force]

## Active Agents
| Agent | Role | Status | Owns | Started |
|-------|------|--------|------|---------|
| [name] | [role] | active/blocked/done | [files] | [time] |

## Contracts
[Active contracts between agents — copied here for reference]

## Human Task Gate
- **Status**: [pending | cleared (DNS pending-propagation) | cleared | not-applicable]
- **Required actions (human)**: [Supabase project, Resend account + DNS, Vercel project, domain]
- **Pending re-checks**: [e.g. Resend domain verification — re-check before email E2E test]

## Open Questions
| Raised by | Question | Status |
|-----------|----------|--------|

## Drift Log
| Time | Reported by | Deviation / inconsistency | Resolution |
|------|-------------|---------------------------|------------|

## Deferred Log
| Time | Reported by | Item (incl. DESIGN.md fallbacks, Hardening notes) | Tracked where |
|------|-------------|---------------------------------------------------|---------------|

## Decisions Log
| Time | Decision | Rationale | Affects |
|------|----------|-----------|---------|
```

Update this file after every agent status change. All agents read it for situational awareness. When agents report **Drift** or **Deferred** items, copy them into the corresponding log before acting on them.

---

%%% begin claude
## Step 3: Spawn the Steward

The Steward runs alongside task agents for the duration of the stage. Spawn it FIRST, using the shared prompt below. Fill in the assignment block: team state file `docs/validation-team-state.md`; workflow document set = positioning brief, competitor analysis, Stitch design prompt (+ optional DESIGN.md and screen exports), landing copy, asset plan (if enabled), landing page design, and the landing page source.
%%% end
%%% begin codex
## Step 3: Steward Duties (Coordinator-Run)

The **Steward** is the team's quality and progress monitor. On this platform agent threads are flat (`max_depth = 1`) and task-scoped, so there is no persistent parallel Steward agent — **you execute the Steward duties yourself**, using the canonical checklist below. Its scope for this workflow: team state file `docs/validation-team-state.md`; workflow document set = positioning brief, competitor analysis, Stitch design prompt (+ optional DESIGN.md and screen exports), landing copy, asset plan (if enabled), landing page design, and the landing page source. Run the checklist after initialising the state file, at every agent status transition, and at every stage gate before declaring it passed. Wherever this skill says "the Steward confirms/verifies X", that is you running these checks; "Dismiss the Steward" at stage completion means: run the checklist one final time against the full stage output and record the result in the state file.
%%% end

````
%%% include shared/steward-prompt.md
````

The Steward's coherence duty here centres on **voice and story**: copy, positioning, design, assets, and the built page must all tell the same story.

---

## Step 4: Stage Execution

### Stage: Positioning

**Goal:** Produce an approved positioning brief and competitor analysis.

**Team Composition:**

%%% begin claude
| Agent | Definition File | Parallel Group | Owns |
|-------|----------------|----------------|------|
| Positioning Brief | `.claude/agents/positioning-brief.md` | Group 1 (sequential — needs user interaction) | `docs/positioning-brief.md` |
| Competitor Analysis | `.claude/agents/competitor-analysis.md` | Group 2 (after positioning brief) | `docs/competitor-analysis.md` |

Concurrency: within the max-agents limit (default 4); this stage naturally runs one task agent at a time plus the Steward.
%%% end
%%% begin codex
| Agent | Delegate by Name | Parallel Group | Owns |
|-------|-----------------|----------------|------|
| Positioning Brief | `positioning-brief` | Group 1 (sequential — needs user interaction) | `docs/positioning-brief.md` |
| Competitor Analysis | `competitor-analysis` | Group 2 (after positioning brief) | `docs/competitor-analysis.md` |

Concurrency: within the max-agents limit (default 4); this stage naturally runs one task agent at a time.
%%% end

**Execution Order:**

```
Phase A: Positioning Brief (sequential — needs user interaction)
  ↓ positioning-brief.md approved
Phase B: Competitor Analysis (runs after positioning brief to use the audience definition)
  ↓ competitor-analysis.md produced
Phase C: Positioning Brief reviews competitor findings; updates differentiation section if needed
  ↓ positioning-brief.md finalised
```

**Contract Chain:**
```
requirements.md → [Positioning Brief] → positioning-brief.md
positioning-brief.md → [Competitor Analysis] → competitor-analysis.md
competitor-analysis.md → [Positioning Brief] → positioning-brief.md (revised differentiation, if needed)
```

**Spawn Protocol:**
1. Spawn Positioning Brief (per Step 5) with ownership of `docs/positioning-brief.md` and `requirements.md` as input contract. Relay its approval request (it arrives as an Agent Report, Status BLOCKED) to the user; return the approval.
2. After approval, spawn Competitor Analysis with ownership of `docs/competitor-analysis.md` and the approved positioning brief as input. Its contract carries the **completeness criterion**: cover all materially competing products in the defined market — direct competitors and the alternatives users actually choose between — and state in the analysis why the set is complete. Never a fixed competitor count.
3. When Competitor Analysis completes, allow Positioning Brief to review and revise differentiation if warranted.

**Stage Gate (single definition of done for this stage):**
- [ ] `docs/positioning-brief.md` exists and is user-approved
- [ ] `docs/competitor-analysis.md` exists and satisfies the completeness criterion (all materially competing products, stated completeness rationale)
- [ ] Positioning brief differentiation reflects competitor findings
- [ ] Steward confirms documentation consistency
- [ ] State file updated; agents' Drift/Deferred items copied to the logs

**Stage Completion:**
Update `validation-team-state.md`. Dismiss the Steward. Report:

```
## Lead Coordinator — Positioning — Status: BLOCKED
**Open questions:** Positioning is complete. Proceed to the Creative stage?
**Outputs created:**
- docs/positioning-brief.md — [audience + value prop in one sentence]
- docs/competitor-analysis.md — [market coverage + differentiation recommendation]
**Drift / Deferred / Problems:** [as applicable, else omit]
**Required actions (human):** review both documents; confirm the stage transition
**Next steps:** on approval — run the Creative stage (Design + Copywriter in parallel)
```

---

### Stage: Creative

**Goal:** Produce an approved Stitch design prompt, approved landing copy, and (optionally) delivered assets.

**Team Composition:**

%%% begin claude
| Agent | Definition File | Parallel Group | Owns |
|-------|----------------|----------------|------|
| Design | `.claude/agents/design.md` | Group 1 (parallel) | `docs/stitch-design-prompt.md` |
| Copywriter | `.claude/agents/copywriter.md` | Group 1 (parallel) | `docs/landing-copy.md` |
| Asset Producer | `.claude/agents/asset-producer.md` | Group 2 (after Group 1, only if `--with-assets`) | `docs/asset-plan.md`, `assets/`, `public/assets/optimised/` |

Concurrency: within the max-agents limit (default 4) — Design + Copywriter + Steward fits; if the limit is lower, run Design then Copywriter sequentially.
%%% end
%%% begin codex
| Agent | Delegate by Name | Parallel Group | Owns |
|-------|-----------------|----------------|------|
| Design | `design` | Group 1 (parallel) | `docs/stitch-design-prompt.md` |
| Copywriter | `copywriter` | Group 1 (parallel) | `docs/landing-copy.md` |
| Asset Producer | `asset-producer` | Group 2 (after Group 1, only if `--with-assets`) | `docs/asset-plan.md`, `assets/`, `public/assets/optimised/` |

Concurrency: within the max-agents limit (default 4) — Design + Copywriter in parallel fits; if the limit is lower, run Design then Copywriter sequentially.
%%% end

**Execution Order:**

```
Phase A: Design + Copywriter (parallel — both consume positioning-brief)
  ↓ stitch-design-prompt.md and landing-copy.md approved
Phase B: Human step — user generates screens in Stitch, saves exports to docs/stitch-exports/,
         and optionally exports docs/DESIGN.md
Phase C (optional): Asset Producer (only if --with-assets flag set)
  ↓ asset-plan.md approved, assets delivered
```

**Contract Chain:**
```
positioning-brief.md → [Design]      → stitch-design-prompt.md
positioning-brief.md → [Copywriter]  → landing-copy.md
landing-copy.md + stitch-design-prompt.md (+ DESIGN.md if exported) → [Asset Producer (optional)] → asset-plan.md + delivered assets
```

**DESIGN.md contract (applies here and in Build):** exporting `docs/DESIGN.md` from Stitch is **optional**. Every consumer has an explicit fallback: **when DESIGN.md is absent, derive design tokens (colours, typography, spacing) from `docs/stitch-design-prompt.md`'s stated design system and the screen exports in `docs/stitch-exports/`, and record the fallback under Deferred** (in the report and the state file's Deferred Log). No agent may treat a missing DESIGN.md as a blocker.

**Spawn Protocol:**
1. Spawn Design and Copywriter in parallel with their respective ownership boundaries and the approved positioning brief as input contract.
2. After both are approved, present the Stitch export step:

   ```
   ## Lead Coordinator — Stitch Export — Status: BLOCKED
   **Outputs created:** docs/stitch-design-prompt.md (approved) · docs/landing-copy.md (approved)
   **Required actions (human):**
   - [ ] Generate the screens in Stitch using docs/stitch-design-prompt.md
   - [ ] Save the screen exports to docs/stitch-exports/
   - [ ] (Optional) Export DESIGN.md from Stitch and save it to docs/DESIGN.md
   **Next steps:** confirm when the exports are saved — the stage then completes
     (or the Asset Producer runs, if --with-assets)
   ```

3. If `--with-assets` was set: spawn the Asset Producer with all approved inputs and the DESIGN.md fallback rule above. Wait for asset-plan approval, then asset delivery. If an external generation tool leaves the agent waiting on a human action, it reports Status BLOCKED with the action under *Required actions (human)* — no silent waiting.
4. If `--with-assets` was NOT set: skip the Asset Producer and record in the state file that the Landing Page Builder must use Stitch screen exports as fallback static images. Do not leave the Builder guessing.

**Stage Gate (single definition of done for this stage):**
- [ ] `docs/stitch-design-prompt.md` exists and is user-approved
- [ ] `docs/landing-copy.md` exists and is user-approved
- [ ] Stitch screen exports saved to `docs/stitch-exports/` (DESIGN.md optional; absence recorded under Deferred)
- [ ] If `--with-assets`: `docs/asset-plan.md` exists, all assets delivered, statuses marked "Delivered"
- [ ] Steward confirms documentation coherence (copy, design, and assets tell the same story)
- [ ] State file updated; Drift/Deferred logs current

**Stage Completion:**
Update `validation-team-state.md`. Dismiss the Steward. Report:

```
## Lead Coordinator — Creative — Status: BLOCKED
**Open questions:** Creative is complete. Proceed to the Build stage?
**Outputs created:** docs/stitch-design-prompt.md · docs/landing-copy.md · docs/stitch-exports/
  [· docs/DESIGN.md | DESIGN.md not exported — token-derivation fallback recorded under Deferred]
  [· docs/asset-plan.md + delivered assets (if --with-assets)]
**Deferred:** [DESIGN.md fallback if applicable; asset items postponed]
**Required actions (human):** confirm the stage transition
**Next steps:** on approval — run the Build stage (design doc → human infra gate → implement → preview → production)
```

---

### Stage: Build

**Goal:** Design, implement, validate, and deploy the Next.js + Vercel + Supabase waitlist landing page — preview first, production only through an explicit approval gate.

**Team Composition:**

%%% begin claude
| Agent | Definition File | Parallel Group | Owns |
|-------|----------------|----------------|------|
| Landing Page Builder | `.claude/agents/landing-page-builder.md` | Sequential | `docs/landing-page-design.md`, all source code, `supabase/migrations/`, `.env/.env.example` |

Concurrency: 1 task agent + Steward (well within the limit).
%%% end
%%% begin codex
| Agent | Delegate by Name | Parallel Group | Owns |
|-------|-----------------|----------------|------|
| Landing Page Builder | `landing-page-builder` | Sequential | `docs/landing-page-design.md`, all source code, `supabase/migrations/`, `.env/.env.example` |

Concurrency: 1 task agent (well within the limit).
%%% end

**Execution Order:**

```
Phase A: Landing Page Builder verifies stack assumptions, then produces docs/landing-page-design.md
  ↓ design approved by user (incl. agreed performance budget)
Phase B: HUMAN TASK GATE — Supabase, Resend, Vercel provisioning
  ↓ user confirms infrastructure ready (Resend DNS may be pending-propagation)
Phase C: Landing Page Builder implements
  ↓ build, lint, typecheck, test pass; performance budget met
Phase D: Preview deploy → validation checklist on the preview URL (incl. DNS re-check + email E2E)
  ↓ user approves preview
Phase E: PRODUCTION APPROVAL GATE → production deploy per the git workflow contract
```

**Pre-design technical verification (Phase A, first step of the Builder's contract):** before scaffolding or writing the design doc, the Builder verifies against **current vendor documentation**: the framework versions to use (from `docs/project-profile.md` when present, otherwise current stable verified via web), Supabase auth/RLS semantics, Resend domain-verification requirements, and Vercel deployment constraints. Findings are recorded in `docs/landing-page-design.md`; anything contradicting the creative-stage assumptions is reported under *Drift*. The design doc also proposes the **performance budget** (from the profile when defined, otherwise proposed for user agreement at design approval).

**Human Task Gate Protocol (between Phase A and Phase C):**

After the user approves the design doc, present:

```
## Lead Coordinator — Build Stage Human Task Gate — Status: BLOCKED
**Outputs created:** docs/landing-page-design.md (approved, performance budget agreed)
**Required actions (human):**
- [ ] Create Supabase project at supabase.com
- [ ] Capture SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- [ ] Create Resend account and capture RESEND_API_KEY
- [ ] Add the Resend sending-domain DNS records (verification may still be propagating — say so when confirming)
- [ ] Create Vercel project linked to this repository
- [ ] (Optional) Provision custom domain via Vercel
- [ ] Add all secrets to Vercel project AND the local env file named in docs/landing-page-design.md
**Next steps:** confirm when complete — implementation then begins.
  DNS-dependent items may be confirmed as "pending propagation"; they are re-checked
  before the email end-to-end test and again before production deploy.
```

1. Update the state file's Human Task Gate to `pending`.
2. Do NOT spawn implementation work until the user confirms.
3. On confirmation, set the gate to `cleared` — or `cleared (DNS pending-propagation)` if the Resend domain is still verifying, recording the re-check under **Pending re-checks**. Pending DNS does **not** hold implementation; it holds only the email end-to-end test and production deploy.
4. **Re-check step:** before the email E2E test (Phase D), verify the Resend domain status. If still propagating, run every other validation item, record the email test as pending under *Deferred*, and re-check before the production gate. Production does not ship until the domain verifies and the email E2E test passes.

**Spawn Protocol:**
%%% begin claude
1. Spawn the Landing Page Builder (per Step 5) with its full definition + ownership boundaries + all approved input contracts (positioning brief, landing copy, stitch design prompt, screen exports, asset plan if produced) + the DESIGN.md fallback rule + the stack-facts rule (profile-or-web-verified versions; agreed performance budget) + the git workflow contract in force (from the profile, or the recorded default).
%%% end
%%% begin codex
1. Spawn the Landing Page Builder (per Step 5) with ownership boundaries + all approved input contracts (positioning brief, landing copy, stitch design prompt, screen exports, asset plan if produced) + the DESIGN.md fallback rule + the stack-facts rule (profile-or-web-verified versions; agreed performance budget) + the git workflow contract in force (from the profile, or the recorded default).
%%% end
2. Wait for design approval (relay its Agent Report to the user). Run the human task gate. After the gate clears, implementation proceeds.
3. After implementation, the Builder runs its validation checklist and triggers a preview deploy on a feature branch per the git workflow contract.
4. Walk the user through the preview. Capture fixes; loop with the Builder until the user approves.
5. **Production approval gate** — production is never a side effect of preview approval:

   ```
   ## Lead Coordinator — Production Deploy Approval — Status: BLOCKED
   **Outputs created:** preview URL [link] — validation checklist PASS ([summary])
   **Open questions:** Approve production deploy?
   **Required actions (human):** confirm production go-live (and custom-domain cutover, if any)
   **Next steps:** on approval, the Builder merges and deploys per the git workflow contract;
     rollback = revert the merge / redeploy the previous Vercel deployment
   ```

6. On approval, the Builder merges/deploys **per the git workflow contract** (PR/merge rules as it defines them — never a direct push to a protected `main`), then verifies the production URL end-to-end.

**Stage Gate (single definition of done for this stage):**
- [ ] `docs/landing-page-design.md` exists, is user-approved, and records the verified stack facts and agreed performance budget
- [ ] Human task gate cleared (DNS re-check completed if it was pending)
- [ ] Build passes with zero warnings; lint and typecheck pass; tests pass
- [ ] Performance budget met on the preview URL (budget from `docs/project-profile.md`, or as agreed at design approval)
- [ ] Real waitlist signup verified end-to-end on preview — including the confirmation email once the Resend domain verifies
- [ ] All page copy comes from `landing-copy.md` verbatim
- [ ] Design tokens match `docs/DESIGN.md` — or, when absent, the tokens derived from `docs/stitch-design-prompt.md` and the screen exports (fallback recorded under Deferred)
- [ ] RLS policies verified by attempting unauthorised reads
- [ ] Rate limiting and honeypot tested
- [ ] Preview approved by the user
- [ ] Production deploy explicitly approved (the gate above), executed per the git workflow contract, and live
- [ ] Steward confirms the page, copy, and positioning tell the same story
- [ ] State file updated; Drift/Deferred logs current

**Stage Completion:**
Update `validation-team-state.md`. Dismiss the Steward. Report:

```
## Lead Coordinator — Validation Path Complete — Status: COMPLETE
**Outputs created:**
- docs/positioning-brief.md · docs/competitor-analysis.md
- docs/stitch-design-prompt.md · docs/landing-copy.md
  [· docs/asset-plan.md + assets (if --with-assets)] [· docs/DESIGN.md (if exported)]
- docs/landing-page-design.md · landing page source ([branch/commit])
- Live URL: [production URL] · Preview URL: [preview URL]
- Waitlist storage: Supabase project [ref] · Email: Resend, sending domain [domain]
**Deferred:** [DESIGN.md fallback, pending items, hardening notes — with where each is tracked]
**Required actions (human):** monitor signup volume (7/14/30 days), email confirmation rate,
  traffic sources (Vercel Analytics), hero bounce/scroll depth
**Next steps:** decision point — when signup volume crosses [user-defined threshold], hand the
  project to `build-with-agent-team` with `requirements.md` already in place, noting the
  product's target platform (e.g. iOS, web) so the build path profiles the right stack
```

---

## Step 5: Agent Spawning Protocol

%%% begin claude
When spawning any task agent, follow this structure:
%%% end
%%% begin codex
You spawn task agents by natural-language delegation, addressing each registered agent by name. Codex loads the agent's definition, creates the thread, routes your follow-up messages, and returns its results — you supply only the assignment. Every delegation follows this structure:
%%% end

```
%%% begin claude
You are the [ROLE] agent for this project, working as part of an agent team.

## Your Agent Definition
[Paste the FULL body of the agent's definition file from .claude/agents/[name].md —
everything after the frontmatter (the closing `---`) and the generated-file marker
comment. Do not omit sections.]
%%% end
%%% begin codex
Spawn the [agent-name] agent with the following assignment:

You are the [ROLE] agent for this project, working as part of an agent team. Your
full agent definition is already loaded — follow it; this assignment adds the
team context.
%%% end

## Team Context

### Your Assignment
[Specific task]

### Your Ownership
- You own: [exact files/directories]
- You may read: [files named in your input contract]
- Do NOT touch: [files owned by other agents]

### Contracts

#### Input Contract (what you consume)
[Exact documents and sections — only what the stage contract for this role names]

#### Output Contract (what you produce)
[Exact deliverables with format requirements — including the DESIGN.md fallback rule
and stack-facts rule where the stage contract assigns them]

### Coordination Rules
- Every message you send is an Agent Report (your definition carries the protocol); all reports come to the Lead Coordinator.
- Report out-of-ownership needs, discoveries affecting other agents, and blockers before acting on them.
- Do NOT communicate directly with other task agents — all coordination flows through the Lead Coordinator.
- Read `docs/validation-team-state.md` for awareness of overall state.

### Before Reporting Done
1. Run the stage-specific validations your contract names.
2. Verify your output contract deliverables exist at the expected paths.
3. Verify your deliverables are consistent with the documents in your input contract.
Do NOT report done until these pass. Your completion report is an Agent Report (Status: COMPLETE).
```

%%% begin claude
### Loading Agent Definitions

1. Read `.claude/agents/[agent-name].md`.
2. Include the **entire body — everything after the closing `---` of the frontmatter and the `<!-- GENERATED … -->` marker line**. Do not include the frontmatter itself (name, description, model, memory fields).
3. Do not filter sections by heading — the definitions are written to be spawned whole, and their headings may change.
%%% end
%%% begin codex
### Delegation Mechanics

- Address agents by their registered names, exactly as the stage tables list them: `positioning-brief`, `competitor-analysis`, `design`, `copywriter`, `asset-producer`, `landing-page-builder`. They are registered from `.codex/agents/<name>.toml` in a trusted repo; **never paste an agent definition body into an assignment** — the definition loads with the agent.
- Codex handles spawning, routing follow-up messages to the right thread, waiting, and closing threads. Direct any mid-task correction or contract update to the agent by name; its consolidated results come back to you.
- Agent threads are flat (`max_depth = 1`): spawned agents cannot spawn further agents, so every fan-out decision is yours.
%%% end

Spawned agents report back in the **Agent Report format** — their definitions carry the protocol.

---

## Step 6: Collaboration Protocols

### Message Relay
All inter-agent communication flows through you. When an agent's report flags something: assess impact on contracts, ownership, or other agents; if affected, update the contract, notify the affected agents, and update `validation-team-state.md` (including the Drift/Deferred logs); otherwise acknowledge and let the agent continue.

### Contract Deviation
An agent proposing to deviate from a contract reports the change and rationale (under *Drift* / *Open questions*). You assess the impact, then approve (updating the contract in the state file and notifying affected agents) or reject with direction. **Never let an agent deviate from a contract without explicit approval and notification to all affected agents.**

### Agent Retirement and Re-Onboarding
%%% begin claude
When the Steward reports context exhaustion: ask the agent for a final Agent Report (done / remaining / in-progress decisions), retire it, and spawn a fresh agent with the same role definition and assignment, the completed-work summary, the remaining task list, and all active contracts. Record the swap in the state file.
%%% end
%%% begin codex
When your Steward-duty checks detect context exhaustion in an agent: ask it for a final Agent Report (done / remaining / in-progress decisions), retire it, and spawn a fresh agent with the same role and assignment, the completed-work summary, the remaining task list, and all active contracts. Record the swap in the state file.
%%% end

### Blocker Escalation
An agent reporting Status BLOCKED is never left unacknowledged. Resolve by providing information, spawning a dependency, or adjusting the contract — or escalate to the user via an Agent Report with the blocker under *Problems / blockers* and the decision under *Open questions*.

---

## Step 7: Cross-Review Protocol

Before finalising any stage:

### Positioning
- Competitor Analysis reviews the positioning brief's differentiation section for evidence-based grounding.

### Creative
- Copywriter reviews the Stitch design prompts to verify visuals support the copy's promises (and vice versa); mismatches are reported to you under *Drift*.
- If `--with-assets`: Asset Producer verifies that delivered assets match both the design system and the copy's tone.

### Build
- Steward verifies that every section of the built page maps 1:1 to a section in `landing-copy.md`, and that the design tokens used in code match `docs/DESIGN.md` — **or, when DESIGN.md is absent, the tokens derived from `docs/stitch-design-prompt.md` and the screen exports** (with the fallback recorded under Deferred).

---

## Common Pitfalls to Prevent

1. **Skipping positioning to "save time".** Every downstream agent depends on a clear audience and value prop. Do not let the user start the Creative stage without an approved positioning brief.
2. **Overpromising on the page.** This is a waitlist for a product that does not yet exist. Reject any copy or asset that implies a functioning product.
3. **Asset overinvestment.** The hero video can take longer than the entire rest of the pipeline. Default to skipping the Asset Producer unless the user has explicitly opted in.
4. **Silent skipping of the Asset Producer.** If `--with-assets` is not set, the Landing Page Builder *must* be told to use Stitch screen exports as fallback static images. Do not leave it guessing.
5. **Treating DESIGN.md as required.** It is optional; consumers derive tokens from the design prompt and screen exports when it is absent, recording the fallback under Deferred.
6. **Skipping the human task gate.** Implementation will fail without Supabase, Resend, and Vercel provisioned. Wait for explicit confirmation — but let DNS-dependent items ride as pending-propagation with their re-check step rather than stalling everything.
7. **Shipping production as a side effect.** Preview approval is not production approval. The production gate is its own Agent Report under *Required actions (human)*, and the deploy follows the git workflow contract.
8. **Hardcoding stack facts.** Framework versions and performance budgets come from `docs/project-profile.md` when present, otherwise from web-verified current stable versions and a user-agreed budget — never from memory.
9. **Coordinator writing code or copy.** You coordinate; that is the whole job.
10. **Inconsistent voice across copy / assets / page.** The single most common quality issue. The Steward checks this at every stage.
11. **Free-form chat.** Every message — yours and the agents' — is one Agent Report block; stage-transition questions live under *Open questions* with Status BLOCKED until answered.

---

## Definition of Done

A stage is done when its **Stage Gate checklist** (in Step 4) passes in full — those checklists are the single source of truth; do not maintain a second list. Two overarching rules apply to every stage:

1. **Outcome over metrics.** Success is the validated outcome — an approved brief, coherent creative, a live page with a working signup — reported with evidence, not activity counts.
2. **Structured close.** The state file is current, agents' Drift/Deferred items are logged, the Steward is dismissed, and the stage completion Agent Report has been sent.

---

## Execute

1. Read all available project documentation (Step 1).
2. Verify prerequisites for the requested stage. If missing, report and stop.
3. Initialise or update `docs/validation-team-state.md` (Step 2).
%%% begin claude
4. Spawn the Steward (Step 3).
%%% end
%%% begin codex
4. Take up the Steward duties (Step 3) — you run the checklist at every status transition and stage gate from here on.
%%% end
5. Execute the stage-specific workflow (Step 4), honouring the max-agents limit throughout:
   - `positioning`: Positioning Brief → Competitor Analysis → cross-review → user approval
   - `creative`: Design + Copywriter parallel → Stitch export (human) → (Asset Producer if `--with-assets`) → cross-review → user approval
   - `build`: stack verification + design doc → human task gate (DNS may pend) → implement → preview + validation (DNS re-check, email E2E) → preview approval → production approval gate → deploy per git workflow contract
   - `full`: run `positioning`, confirm, `creative`, confirm, `build` — re-verifying each stage's prerequisites as it starts
6. Facilitate collaboration throughout (Step 6).
7. Run cross-review at stage end (Step 7).
8. Verify the Stage Gate checklist.
9. Dismiss the Steward.
10. Send the stage completion Agent Report, with the next-stage question under *Open questions*.
