# Agent Flows

A visual map of every intended path through the agent suite. Every agent in `.claude/agents/`, `.github/agents/`, and `.codex/agents/` is **rendered from a single source in `agents-src/`** and belongs to one of the flows below, or is a standalone utility agent.

---

## Repo architecture

This repository is a **GitHub template repo**. Agent and skill definitions are written once — `agents-src/<role>.src.md` per agent, `skills-src/<skill>.src.md` per skill — and rendered by `scripts/build-agents.py` into `.claude/agents/*.md`, `.github/agents/*.agent.md`, `.codex/agents/*.toml`, `.claude/skills/*/SKILL.md`, and `.agents/skills/*/SKILL.md`. Shared doctrine (Agent Report format, priority/sizing doctrines, feature-vertical slicing, bugs-vs-polish rule, profile reference, Steward prompt) lives in `agents-src/shared/*.md` and is spliced in with `%%% include`, so it stays byte-identical across every agent on all three platforms. **Never edit rendered files** — the `agents-drift-check` CI workflow runs `build-agents.py --check` and fails any PR where rendered files don't match source. See [`agents-src/FORMAT.md`](../agents-src/FORMAT.md).

```mermaid
flowchart LR
    subgraph SRC["Single source"]
        A["agents-src/role.src.md<br/>(one per agent role)"]
        S["skills-src/skill.src.md<br/>(one per skill)"]
        SH["agents-src/shared/*.md<br/>(doctrine includes)"]
    end
    SH -.->|include| A
    SH -.->|include| S
    A --> B["scripts/build-agents.py"]
    S --> B
    B --> C[".claude/agents/*.md"]
    B --> D[".github/agents/*.agent.md"]
    B --> D2[".codex/agents/*.toml"]
    B --> E[".claude/skills/*/SKILL.md"]
    B --> E2[".agents/skills/*/SKILL.md"]
    CI["agents-drift-check CI<br/>build-agents.py --check"] -.->|fails PR on drift| B
```

### Bootstrap flow (creating a project from the template)

```mermaid
flowchart TD
    T([project-template on GitHub]) -->|"gh repo create my-app --template sjmeehan9/project-template --private --clone"| R([new project repo])
    R --> BS["./bootstrap.sh<br/>prompts: project name · platform (ios / python / typescript) · bundle id"]
    BS --> P[/"docs/project-profile.md<br/>(per-repo stack contract)"/]
    BS --> C[/"CLAUDE.md + AGENTS.md<br/>(point at profile + standards file)"/]
    BS --> X[/".codex/config.toml<br/>(sandbox/approvals/MCP — trusted repos)"/]
    BS --> S["Platform scaffold<br/>iOS: project.yml + walking-skeleton SwiftUI app + test stubs<br/>Python/TS: pyproject.toml / package.json stubs"]
    T -.->|"template-sync workflow — weekly PRs when the template evolves<br/>(.templatesyncignore protects per-project files)"| R
```

Agent files are **never customised downstream** — all per-project variability lives in `docs/project-profile.md`, which agents read at runtime. That is what lets the weekly `template-sync` workflow (requires the `TEMPLATE_SYNC_PAT` secret) PR agent/skill updates into generated repos without ever clobbering project content, and lets the drift check keep working there too.

---

## Cross-cutting rules (all agents)

- **Model:** every agent inherits the session model — Claude agents declare `model: inherit`; Copilot and Codex agents omit `model:` entirely. No agent pins a model.
- **Communication:** every message from every agent — including the Lead Coordinator itself — is exactly one structured **Agent Report** block (`Status` line + Open questions / Outputs created / Problems / Drift / Deferred / Required actions (human) / Next steps). Verbose evidence (test transcripts, research notes) goes to files, referenced under *Outputs created* — never chat. Approval gates are Open questions + Required actions with Status BLOCKED.
- **Routing:** in **team mode** (spawned by a skill) all reports go to the Lead Coordinator; in **solo mode** (invoked directly) they go to the user. Task agents never message each other directly.
- **Stack contract:** `docs/project-profile.md` (written by `bootstrap.sh`) is the single source of truth for platform, validation sequence, test frameworks and UI/E2E harness, coverage policy, project layout, run instructions, git workflow contract, external services / human tasks, and performance budgets. "All checks pass" means the profile's validation sequence passes — an agent that finds the profile missing stops and raises a blocker; it never guesses commands.

---

## Two Paths

This template supports two primary paths from "I have an idea" to "the market told me whether to build it":

| Path | Skill (orchestrator) | What it produces | When to use |
|------|---------------------|------------------|-------------|
| **Validation Path** | `validate-with-waitlist` | A live Next.js + Vercel + Supabase waitlist landing page (no real product) | When you want to test market interest before committing to a build |
| **Build Path** | `build-with-agent-team` | A working application, phase by phase, with per-phase UI + critical-backend validation | When the idea is validated (or you're confident enough to skip validation) |

```mermaid
flowchart LR
    Idea([Raw idea]) --> Ideate[ideate]
    Ideate --> Reqs[/requirements.md/]
    Reqs --> Decision{{Validate first?}}
    Decision -->|Yes| ValidatePath["VALIDATION PATH<br/>validate-with-waitlist"]
    Decision -->|No| BuildPath["BUILD PATH<br/>build-with-agent-team"]
    ValidatePath --> Waitlist([Live waitlist page])
    Waitlist --> Signal{{Enough signups?}}
    Signal -->|Yes| BuildPath
    Signal -->|No| Park([Park the idea])
    BuildPath --> Product([Working product])

    style ValidatePath fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
    style BuildPath fill:#dcfce7,stroke:#166534,color:#14532d
    style Waitlist fill:#fef3c7,stroke:#a16207,color:#713f12
    style Product fill:#fef3c7,stroke:#a16207,color:#713f12
```

Both skills spawn a persistent **Steward** alongside the task agents (quality/coherence monitor, no approval authority) and both require `docs/project-profile.md` where it applies (always, for the build path; when present, its stack facts govern the validation path's Builder).

---

## Path 1 — Validation (`validate-with-waitlist`)

**Goal:** Produce a deployed waitlist landing page that visualises the product without building it. Three stages, each gated on user approval.

```mermaid
flowchart TD
    subgraph Start["START"]
        Reqs[/"requirements.md<br/>(produced by ideate)"/]
    end

    subgraph Positioning["STAGE 1 · positioning"]
        PB[positioning-brief]
        CA1[competitor-analysis]
        PB -->|approved| CA1
        CA1 -.->|findings| PB
        PB --> PBOut[/"docs/positioning-brief.md"/]
        CA1 --> CAOut[/"docs/competitor-analysis.md"/]
    end

    subgraph Creative["STAGE 2 · creative"]
        direction TB
        Design[design]
        Copy[copywriter]
        StitchGate{{"Human step: generate screens in Stitch<br/>save to docs/stitch-exports/ (+ optional DESIGN.md)"}}
        Asset["asset-producer<br/>(OPTIONAL — flag --with-assets)"]
        Design --> StitchOut[/"docs/stitch-design-prompt.md"/]
        Copy --> CopyOut[/"docs/landing-copy.md"/]
        StitchOut --> StitchGate
        StitchGate -.-> Asset
        CopyOut -.-> Asset
        Asset --> AssetOut[/"docs/asset-plan.md<br/>+ delivered assets"/]
    end

    subgraph Build["STAGE 3 · build"]
        LPB[landing-page-builder]
        Verify["Verifies stack assumptions<br/>(profile versions, or current vendor docs)"]
        Gate{{"Human task gate:<br/>Supabase + Resend + Vercel<br/>(DNS may pend propagation)"}}
        LPB --> Verify
        Verify --> Design2[/"docs/landing-page-design.md<br/>(verified stack facts + agreed performance budget)"/]
        Design2 --> Gate
        Gate -->|cleared| Impl["Implement Next.js + Supabase site"]
        Impl --> Preview([Preview deploy + validation checklist<br/>incl. DNS re-check + email E2E])
        Preview --> ProdGate{{"PRODUCTION APPROVAL GATE<br/>(never a side effect of preview approval)"}}
        ProdGate -->|approved| Prod([Production deploy<br/>per git workflow contract])
    end

    Reqs --> PB
    PBOut --> Design
    PBOut --> Copy
    CAOut -.-> Copy
    CopyOut --> LPB
    StitchGate --> LPB
    AssetOut -.-> LPB

    style Asset stroke-dasharray: 5 5
    style AssetOut stroke-dasharray: 5 5
    style StitchGate fill:#fef9c3,stroke:#a16207
    style Gate fill:#fef9c3,stroke:#a16207
    style ProdGate fill:#fef9c3,stroke:#a16207
    style Prod fill:#dcfce7,stroke:#166534
```

`docs/DESIGN.md` is **optional** everywhere: when absent, consumers derive design tokens from `docs/stitch-design-prompt.md` and the screen exports, recording the fallback under *Deferred* — never a blocker.

### Validation path agents — at a glance

| Stage | Agent | Owns |
|-------|-------|------|
| (input) | `ideate` | `docs/requirements.md` |
| Positioning | `positioning-brief` | `docs/positioning-brief.md` |
| Positioning | `competitor-analysis` | `docs/competitor-analysis.md` |
| Creative | `design` | `docs/stitch-design-prompt.md` |
| Creative | `copywriter` | `docs/landing-copy.md` |
| Creative (optional) | `asset-producer` | `docs/asset-plan.md`, `assets/`, `public/assets/optimised/` |
| Build | `landing-page-builder` | `docs/landing-page-design.md`, all source code, `supabase/migrations/`, `.env`/`.env.example` |

### Validation path stage gates

```
ideate          → requirements.md approved
positioning     → positioning-brief.md approved
                → competitor-analysis.md complete (completeness criterion:
                  all materially competing products, stated rationale — no fixed count)
creative        → stitch-design-prompt.md + landing-copy.md approved
                → Stitch screens exported to docs/stitch-exports/ (DESIGN.md optional)
                → asset-plan.md approved + assets delivered (if --with-assets)
build           → stack facts verified (profile, or current vendor docs — never memory)
                → landing-page-design.md approved (incl. agreed performance budget)
                → human task gate cleared (Supabase / Resend / Vercel; DNS may pend)
                → validation checklist passes on preview (incl. email E2E once DNS verifies)
                → preview approved by user
                → PRODUCTION APPROVAL GATE cleared → production live
                  (deploy per the git workflow contract)
```

---

## Path 2 — Build (`build-with-agent-team`)

**Goal:** Take an approved `requirements.md` through a full software delivery: brief → solution design → phase plan → spec-validated component breakdowns → implementation → per-phase validation → docs. Three stages, each gated on user approval.

### Stages 1–2 · Planning & Refinement

```mermaid
flowchart TD
    subgraph StartB["START"]
        ReqsB[/"requirements.md<br/>(produced by ideate)"/]
    end

    subgraph Planning["STAGE 1 · planning"]
        PM[project-manager]
        CA2[competitor-analysis]
        SA[solutions-architect]
        PM --> Brief[/"docs/brief.md"/]
        Brief --> CA2
        Brief --> SA
        CA2 --> CAOut2[/"docs/competitor-analysis.md"/]
        SA --> SDOut[/"docs/solution-design.md"/]
        CAOut2 -.->|positioning input| SA
        SDOut -.-> TRD["technical-research<br/>(design scope, optional)"]
        TRD -.-> TRDoc[/"docs/technical-research.md"/]
    end

    subgraph Refinement["STAGE 2 · refinement"]
        TBA[technical-business-analyst]
        TL["tech-lead × N<br/>(one per phase, parallel)"]
        TRC["technical-research<br/>(component scope — optionally<br/>spawned per phase)"]
        TBA --> PP[/"docs/phase-plan.md<br/>feature statements + Validation Targets per phase"/]
        PP --> TL
        TL --> Breakdowns[/"docs/phase-X-component-breakdown.md<br/>(Technical Validation section per component)"/]
        TL --> Progress[/"docs/phase-progress.json<br/>(every component → spec-validated)"/]
        TL -.->|external-doc checks| TRC
        TRC -.-> TRPhase[/"docs/technical-research-phase-X.md"/]
        TRPhase -.->|graded findings| TL
    end

    ReqsB --> PM
    Brief --> TBA
    SDOut --> TBA
    TRDoc -.-> TBA

    style TRD stroke-dasharray: 5 5
    style TRC stroke-dasharray: 5 5
```

**Technical Validation (refinement):** after drafting each component spec, the Tech Lead validates it against the project docs **and current external documentation** (SDK/API references, versions, platform rules — for iOS: HIG, App Store review guidelines, entitlements), recording sources, confirmed assumptions, discrepancies, and open risks in the spec's *Technical Validation* section. The Lead Coordinator may spawn `technical-research` in **component scope** per phase to execute those checks (output: `docs/technical-research-phase-X.md`; the Tech Lead remains owner of recording findings). Completing the section is what sets the component to **Spec-Validated** in `docs/phase-progress.json` — and *no Implement agent is ever spawned for a component that is not Spec-Validated*.

### Stage 3 · Implementation (per phase)

```mermaid
flowchart TD
    Inputs[/"phase-X-component-breakdown.md<br/>+ phase-progress.json"/] --> G0["Gate 0 · Dependency analysis<br/>graph built; every component verified Spec-Validated"]
    G0 --> X1["Gate 1 · Component X.1 — human setup<br/>(single Implement agent, sequential)"]
    X1 --> HTG{{"HUMAN TASK GATE<br/>credentials, services, iOS signing"}}
    HTG -->|cleared| Batch["Gates 2-3 · Parallel component batches<br/>per component: Implement → Test →<br/>(Debug → Re-test)* → Review → Committed or Blocked"]
    Batch --> AllC["All components Committed<br/>(phase-final component held at Reviewing)"]
    AllC --> PVG["Gate 4 · PHASE VALIDATION GATE<br/>Test agent in phase mode: Test Phase X<br/>UI harness + critical-backend E2E + cumulative suite"]
    PVG --> Report[/"docs/phase-X-test-report.md<br/>(failures enumerated per owning component)"/]
    Report -->|FAIL| Reopen["Owning components: Committed → Reopened"]
    Reopen --> DebugP["debug — scoped to each owning<br/>component's file list"]
    DebugP -->|"re-run Test Phase X (max 3 cycles)"| PVG
    Report -->|PASS| FinalCommit["Phase-final component's Review commits<br/>(commit gated on the PASS)"]
    FinalCommit --> OnDevice{{"Gate 5 · Human on-device validation<br/>(TestFlight for iOS, if the profile names it)"}}
    OnDevice -->|confirmed| PD["Gate 6 · phase-docs"]
    PD --> Summary[/"docs/phase-summary.md"/]
    Summary --> Merge([Phase branch merged<br/>per git workflow contract])

    style HTG fill:#fef9c3,stroke:#a16207
    style OnDevice fill:#fef9c3,stroke:#a16207
    style PVG fill:#fee2e2,stroke:#b91c1c
    style Merge fill:#dcfce7,stroke:#166534
```

**Phase validation gate:** the Test agent's phase mode (`Test Phase X`) executes the phase plan's named **Validation Targets** — user-facing flows through the UI harness named in the profile (XCUITest / Playwright), critical backend paths end-to-end, plus the full cumulative suite — and writes `docs/phase-X-test-report.md`. `phase-docs` may not run, and the phase-final component may not be committed, until that report records PASS. **On iOS, the automated PASS does not substitute for the human TestFlight-on-device gate.**

### Component lifecycle state machine

```
Queued → Spec-Validated → Implementing → Testing → [Debugging → Re-testing]* → Reviewing → {Committed | Blocked}
```

```mermaid
flowchart LR
    Q[Queued] --> SV[Spec-Validated]
    SV --> I[Implementing]
    I --> T[Testing]
    T -->|fail| D[Debugging]
    D --> RT[Re-testing]
    RT -->|"fail (max 3 cycles)"| D
    RT -->|pass| R[Reviewing]
    T -->|pass| R
    R -->|approved| C([Committed])
    R -->|"blocked (max 3 cycles)"| B[Blocked]
    B -->|"spec deviation / missing feature → Implement"| I
    B -->|"defect → Debug"| D
    I -.->|"Technical Validation re-check fails: demote"| Q
    C -.->|"phase-gate failure"| RO[Reopened]
    RO -.->|"scoped Debug fix, then Test Phase X re-runs"| D

    style C fill:#dcfce7,stroke:#166534
    style B fill:#fee2e2,stroke:#b91c1c
    style RO fill:#fee2e2,stroke:#b91c1c,stroke-dasharray: 5 5
```

- **Queued → Spec-Validated** happens during *refinement* (Tech Lead completes the Technical Validation section). At build time the Implement agent re-verifies the spec's external assumptions; a failed re-check **demotes the component to Queued** for re-specification — never silently worked around.
- **Reviewing → Blocked:** Review records BLOCKED with findings by category; the Lead Coordinator routes spec deviations / missing features to **Implement** and defects to **Debug**, then Test re-runs and Review re-reviews. Max 3 cycles, then escalate to the user.
- **Committed → Reopened** exists only for phase-gate remediation: each component owning a phase-test failure is Reopened, Debug fixes within that component's file list, and `Test Phase X` re-runs (max 3 cycles).
- Statuses are tracked twice, in step: the `agent-team-state.md` lifecycle table and the machine-readable `docs/phase-progress.json`.

### Build path agents — at a glance

| Stage | Agent | Owns |
|-------|-------|------|
| (input) | `ideate` | `docs/requirements.md` |
| Planning | `project-manager` | `docs/brief.md` |
| Planning | `competitor-analysis` | `docs/competitor-analysis.md` |
| Planning | `solutions-architect` | `docs/solution-design.md` |
| Planning → Refinement (optional) | `technical-research` (design scope) | `docs/technical-research.md` |
| Refinement | `technical-business-analyst` | `docs/phase-plan.md` |
| Refinement | `tech-lead` (×N, one per phase) | `docs/phase-X-component-breakdown.md` + that phase's entry in `docs/phase-progress.json` |
| Refinement (optional, per phase) | `technical-research` (component scope) | `docs/technical-research-phase-X.md` |
| Implementation | `implement` | Source files per component spec · `docs/components/phase-X-component-X-Y-overview.md` · append to `docs/implementation-context-phase-X.md` |
| Implementation | `test` | Component mode: `docs/test-reports/phase-X-component-X-Y-test-report.md` · Phase mode (`Test Phase X`): `docs/phase-X-test-report.md` |
| Implementation | `debug` | Fixes within the owning component's file list (test failures + Reopened remediation) |
| Implementation | `review` | Commit scope per component, per the git workflow contract; phase-final commit gated on the phase report PASS |
| Implementation | `phase-docs` | `docs/phase-summary.md` |

### Build path stage gates

```
ideate          → requirements.md approved
planning        → brief.md approved
                → competitor-analysis.md complete (completeness criterion, no fixed count)
                → solution-design.md approved, consistent with brief + competitive findings
                → (optional) technical-research.md — design-scope validation of the stack
refinement      → phase-plan.md approved — every phase states its "a user can now …"
                  feature statement(s) and names its Validation Targets
                → phase-X-component-breakdown.md complete per phase (vertical slices only;
                  Component X.1 = human setup, final component = phase validation)
                → every component's Technical Validation section complete
                → phase-progress.json shows every component spec-validated
implementation  → Gate 0: dependency graph built, all components Spec-Validated
                → Component X.1 done → HUMAN TASK GATE cleared
                → each component: Queued → Spec-Validated → Implementing → Testing →
                  [Debugging → Re-testing]* → Reviewing → {Committed | Blocked}
                → PHASE VALIDATION GATE: Test Phase X → docs/phase-X-test-report.md PASS
                  (failures → owning components Reopened → Debug → re-test, max 3 cycles;
                   PASS gates phase-docs AND the phase-final component's commit)
                → human on-device validation (e.g. TestFlight) if the profile names it
                → phase-docs → phase-summary.md; phase branch merged per git workflow contract
```

---

## Standalone & utility agents

These agents are not part of either skill's fixed orchestration. They are invoked directly by the user (solo mode — reports go straight to the user) or spawned on demand.

| Agent | Purpose | Typical trigger |
|-------|---------|----------------|
| `repo-analysis` | Deep technical analysis of an existing repository — architecture, execution flow, code quality, refactor/reuse classification | "Analyse this repo before we plan a refactor" |
| `debug` | Systematic diagnosis of a bug, error, or test failure | A bug surfaces outside the normal `implement → test → debug` loop |
| `technical-research` | Validates technical assumptions against current external docs — design scope (whole solution design) or component scope (one phase's specs) | "Check the solution design's SDK/version assumptions" |
| `phase-docs` | Phase summary writer (verifies the phase gate itself before writing) | Manually invoked at end of phase if not running through the orchestrator |

```mermaid
flowchart LR
    User([User]) --> RA[repo-analysis]
    User --> Debug[debug]
    User --> TR[technical-research]
    User --> PhaseDoc[phase-docs]
    RA --> Analysis[/"docs/repository-analysis.md<br/>(input to ideate or solutions-architect)"/]
    Debug --> Fix([Bug fix + regression test])
    TR --> TROut[/"docs/technical-research.md or<br/>docs/technical-research-phase-X.md"/]
    PhaseDoc --> Summ([docs/phase-summary.md])
```

---

## Cross-path reuse

Two agents are **shared** between paths and run in both. Their behaviour is identical in either context — only the consumer of their output differs.

| Agent | In validation path | In build path |
|-------|-------------------|--------------|
| `ideate` | First step → produces `requirements.md` | First step → produces `requirements.md` |
| `competitor-analysis` | Validates positioning brief differentiation | Informs `solution-design.md` differentiation |

---

## Platform variants (Claude ↔ Copilot ↔ Codex)

Every agent is rendered for **three** platforms from the same `agents-src/` source — `.claude/agents/<role>.md` (Claude Code), `.github/agents/<Role>.agent.md` (GitHub Copilot), and `.codex/agents/<role>.toml` (OpenAI Codex custom agents) — so the platforms **cannot drift**. Differences are limited to declared platform-conditional blocks:

- **Claude:** `model: inherit`, `memory: project`, Persistent Agent Memory section
- **Copilot:** `tools:`, `argument-hint:` (no team protocol — Copilot has no subagent orchestration)
- **Codex:** TOML format (`name`, `description`, body in `developer_instructions`); no `model` key (inherits the session model)
- **`teams` flag (Claude + Codex):** the Team Collaboration Protocol renders only on platforms that orchestrate subagents

Skills render to both `.claude/skills/<name>/SKILL.md` (Claude Code) and `.agents/skills/<name>/SKILL.md` (the open Agent Skills standard, read by Codex). On Codex the Lead Coordinator spawns agents by name (they auto-register from `.codex/agents/` in trusted repos, flat fan-out capped by `[agents] max_threads`) and runs the Steward checklist itself between transitions instead of holding a parallel Steward thread.

**Autonomous variants** (single-pass: clarification steps and approval waits are replaced by logged *Assumptions*) exist on Claude, Copilot, and Codex for three roles. Only the Solutions Architect *Lite* variants remain Copilot-only:

| Variant of | Mode | Claude | Copilot | Codex |
|------------|------|--------|---------|-------|
| `implement` | autonomous | `implement-autonomous.md` | `ImplementationAutonomous.agent.md` | `implement-autonomous.toml` |
| `project-manager` | autonomous | `project-manager-autonomous.md` | `ProjectManagerAutonomous.agent.md` | `project-manager-autonomous.toml` |
| `technical-business-analyst` | autonomous | `technical-business-analyst-autonomous.md` | `TechnicalBusinessAnalystAutonomous.agent.md` | `technical-business-analyst-autonomous.toml` |
| `solutions-architect` | lite (reduced scope) | — | `SolutionsArchitectLite.agent.md` | — |
| `solutions-architect` | lite + autonomous | — | `SolutionsArchitectLiteAutonomous.agent.md` | — |

Porting a variant to another platform is a small edit to its source file (add a `%%% output:` block with the platform's flags and header, then re-render) — never a file copy.

---

## Decision tree — which agent / path do I invoke?

```mermaid
flowchart TD
    Start([I have...]) --> Q1{What do I have?}
    Q1 -->|A raw idea| A1[ideate]
    Q1 -->|A fresh repo from the template| A0[Run ./bootstrap.sh first]
    Q1 -->|An approved requirements.md| Q2{Build it or validate it first?}
    Q1 -->|An existing repo to refactor| A2[repo-analysis<br/>then ideate]
    Q1 -->|An approved positioning brief| A3[validate-with-waitlist creative ...]
    Q1 -->|An approved brief.md| A4[build-with-agent-team planning ...]
    Q1 -->|An approved phase-plan.md| A5[build-with-agent-team refinement ...]
    Q1 -->|"A breakdown with all components Spec-Validated"| A6[build-with-agent-team implementation ...]
    Q1 -->|A failing test or bug| A7[debug]
    Q1 -->|Doubts about stack/API assumptions| A8[technical-research]

    Q2 -->|Validate market first| V[validate-with-waitlist full]
    Q2 -->|Build straight away| B[build-with-agent-team full]
```

---

## Skill argument cheat sheet

```bash
# Validation path — shape: <stage> [max-agents] [--with-assets]
/validate-with-waitlist positioning           # stage 1 only
/validate-with-waitlist creative              # stage 2 (no AI assets — uses Stitch exports)
/validate-with-waitlist creative 4 --with-assets   # stage 2 with asset-producer
/validate-with-waitlist build                 # stage 3 only
/validate-with-waitlist full                  # all three, gated on user approval
/validate-with-waitlist full 4 --with-assets  # all three with asset production

# Build path — shape: <stage> [max-agents] [phase-number]
/build-with-agent-team planning               # stage 1 only
/build-with-agent-team refinement             # stage 2 only
/build-with-agent-team implementation 6 1     # stage 3 — phase 1, up to 6 agents
/build-with-agent-team full                   # all three, gated on user approval
```

- **`max-agents`** counts concurrent teammate agents *including the Steward*. Defaults: validation 4; build planning 4, refinement 4, implementation 6. Concurrency is otherwise bounded only by file-/document-ownership independence per the dependency graph — there is no fixed team-size table.
- **Validation:** `--with-assets` toggles the optional asset-producer.
- **Build:** the phase number is required (third argument) when stage is `implementation`.

---

## File ownership map (who writes what)

```
CLAUDE.md                                 ← bootstrap.sh
AGENTS.md                                 ← bootstrap.sh (Codex/agents.md entry point)
.codex/config.toml                        ← bootstrap.sh (sandbox/approvals/MCP; trusted repos)
docs/
├── project-profile.md                    ← bootstrap.sh (stack contract) [BOTH]
├── requirements.md                       ← ideate
├── repository-analysis.md                ← repo-analysis
│
├── positioning-brief.md                  ← positioning-brief        [VALIDATE]
├── competitor-analysis.md                ← competitor-analysis      [BOTH]
├── stitch-design-prompt.md               ← design                   [VALIDATE]
├── stitch-exports/                       ← human (Stitch screen exports) [VALIDATE]
├── DESIGN.md                             ← exported from Stitch (OPTIONAL — consumers
│                                            have a token-derivation fallback) [VALIDATE]
├── landing-copy.md                       ← copywriter               [VALIDATE]
├── asset-plan.md                         ← asset-producer (opt)     [VALIDATE]
├── landing-page-design.md                ← landing-page-builder     [VALIDATE]
│
├── brief.md                              ← project-manager          [BUILD]
├── solution-design.md                    ← solutions-architect      [BUILD]
├── technical-research.md                 ← technical-research (design scope) [BUILD]
├── technical-research-phase-X.md         ← technical-research (component scope) [BUILD]
├── phase-plan.md                         ← technical-business-analyst [BUILD]
├── phase-X-component-breakdown.md        ← tech-lead (×N)           [BUILD]
├── phase-progress.json                   ← tech-lead (per phase entry;
│                                            coordinator advances statuses) [BUILD]
├── implementation-context-phase-X.md     ← implement (append-only)  [BUILD]
├── components/
│   └── phase-X-component-X-Y-overview.md ← implement                [BUILD]
├── test-reports/
│   └── phase-X-component-X-Y-test-report.md ← test (component mode) [BUILD]
├── phase-X-test-report.md                ← test (phase mode)        [BUILD]
├── phase-summary.md                      ← phase-docs               [BUILD]
│
├── agent-team-state.md                   ← Lead Coordinator + Steward [BUILD skill]
└── validation-team-state.md              ← Lead Coordinator + Steward [VALIDATE skill]

(application source code)                 ← landing-page-builder     [VALIDATE]
                                          ← implement                [BUILD]
```

The phase plan is `docs/phase-plan.md` **everywhere** — both platforms, both the TBA and its autonomous variant, and every consumer.

---

## Updating this document

When you add, remove, or rename agents:

1. **Make the change in `agents-src/` (or `skills-src/`), never in rendered files** — edit the `*.src.md` source, run `python3 scripts/build-agents.py`, and let the drift check verify the rendered outputs.
2. Update the relevant Mermaid diagram in the corresponding path section.
3. Update the agent inventory table for that path (and the platform-variants table if a variant was added or ported).
4. Update the file ownership map.
5. If you add a new top-level path (a third skill alongside `build-with-agent-team` and `validate-with-waitlist`), add a new "Path N" section mirroring the structure of paths 1 and 2.
