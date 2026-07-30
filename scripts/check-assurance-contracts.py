#!/usr/bin/env python3
"""Check risk-tiered implementation contracts across every rendered agent surface."""

from __future__ import annotations

import os
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
UPSTREAM_GITHUB_REPOSITORY = "sjmeehan9/project-template"
LIGHT_AGENT_ALLOWLIST = frozenset(
    {
        "project-manager",
        "solutions-architect",
        "technical-research",
        "technical-business-analyst",
        "implement",
        "review",
        "phase-docs",
    }
)


def should_check_template_readme(
    github_actions: str | None,
    github_repository: str | None,
) -> bool:
    """Keep project-owned READMEs out of downstream GitHub Actions checks."""
    if (github_actions or "").casefold() != "true":
        return True
    return (github_repository or "").casefold() == UPSTREAM_GITHUB_REPOSITORY


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def require(relative: str, *needles: str) -> list[str]:
    content = read(relative)
    return [
        f"{relative}: missing {needle!r}"
        for needle in needles
        if needle not in content
    ]


def prohibit(relative: str, *needles: str) -> list[str]:
    content = read(relative)
    return [
        f"{relative}: contains obsolete contract {needle!r}"
        for needle in needles
        if needle in content
    ]


def prohibit_patterns(relative: str, *patterns: str) -> list[str]:
    content = read(relative)
    return [
        f"{relative}: matches unsafe/obsolete pattern {pattern!r}"
        for pattern in patterns
        if re.search(pattern, content)
    ]


def check_light_agent_registry(relative: str) -> list[str]:
    """Require the exact seven-agent registry and reject explicit out-of-set delegation."""

    content = read(relative)
    start_marker = "The only task agents this skill may delegate to are:"
    end_marker = "Do not delegate to Competitor Analysis"
    if start_marker not in content or end_marker not in content:
        return [f"{relative}: missing parseable light-agent registry boundaries"]

    registry = content.split(start_marker, 1)[1].split(end_marker, 1)[0]
    found = frozenset(
        re.findall(
            r"(?m)^\|[^|]+\|\s*`([a-z][a-z0-9]*(?:-[a-z0-9]+)*)`\s*\|",
            registry,
        )
    )
    failures = []
    if found != LIGHT_AGENT_ALLOWLIST:
        failures.append(
            f"{relative}: light-agent registry must be exactly "
            f"{sorted(LIGHT_AGENT_ALLOWLIST)!r}; found {sorted(found)!r}"
        )

    explicit_delegations: set[str] = set()
    for pattern in (
        r"(?im)^\s*(?:\d+\.\s*)?(?:delegate|spawn)\s+`([a-z][a-z0-9-]*)`",
        r"(?im)^\s*(?:\d+\.\s*)?delegate\b[^\n]{0,100}\bto\s+`([a-z][a-z0-9-]*)`",
    ):
        explicit_delegations.update(re.findall(pattern, content))
    unexpected = explicit_delegations - LIGHT_AGENT_ALLOWLIST
    if unexpected:
        failures.append(
            f"{relative}: delegates outside the seven-agent allowlist: "
            + ", ".join(sorted(unexpected))
        )
    return failures


def main() -> int:
    failures: list[str] = []
    template_readme_contracts = (
        ("README.md",)
        if should_check_template_readme(
            os.environ.get("GITHUB_ACTIONS"),
            os.environ.get("GITHUB_REPOSITORY"),
        )
        else ()
    )

    build_skills = (
        ".agents/skills/build-with-agent-team/SKILL.md",
        ".claude/skills/build-with-agent-team/SKILL.md",
    )
    light_build_skills = (
        ".agents/skills/build-with-agent-team-light/SKILL.md",
        ".claude/skills/build-with-agent-team-light/SKILL.md",
    )
    implement_agents = (
        ".claude/agents/implement.md",
        ".claude/agents/implement-autonomous.md",
        ".codex/agents/implement.toml",
        ".codex/agents/implement-autonomous.toml",
        ".github/agents/Implementation.agent.md",
        ".github/agents/ImplementationAutonomous.agent.md",
    )
    test_agents = (
        ".claude/agents/test.md",
        ".codex/agents/test.toml",
        ".github/agents/Test.agent.md",
    )
    review_agents = (
        ".claude/agents/review.md",
        ".codex/agents/review.toml",
        ".github/agents/Review.agent.md",
    )
    debug_agents = (
        ".claude/agents/debug.md",
        ".codex/agents/debug.toml",
        ".github/agents/Debug.agent.md",
    )
    tech_lead_agents = (
        ".claude/agents/tech-lead.md",
        ".codex/agents/tech-lead.toml",
        ".github/agents/TechLead.agent.md",
    )
    business_analyst_agents = (
        ".claude/agents/technical-business-analyst.md",
        ".claude/agents/technical-business-analyst-autonomous.md",
        ".codex/agents/technical-business-analyst.toml",
        ".codex/agents/technical-business-analyst-autonomous.toml",
        ".github/agents/TechnicalBusinessAnalyst.agent.md",
        ".github/agents/TechnicalBusinessAnalystAutonomous.agent.md",
    )
    phase_docs_agents = (
        ".claude/agents/phase-docs.md",
        ".codex/agents/phase-docs.toml",
        ".github/agents/PhaseDocs.agent.md",
    )
    profiles = (
        "templates/project-profile.ios.md",
        "templates/project-profile.python.md",
        "templates/project-profile.typescript.md",
    )

    for relative in build_skills:
        failures += require(
            relative,
            "ASSURANCE_CONTRACT_V1",
            "Implement-led and risk-tiered",
            "ceiling, not a target",
            "implementation: 3",
            "Test Phase X",
            "Do NOT spawn child task agents",
            "scripts/worktree-fingerprint.py",
            "Validation resources and Git writes are always leased exclusively",
            "Three-cycle ceiling",
            "coordinator-run Steward",
            "never a separate teammate",
            "serialized by default",
            "one active component-delivery engagement at a time",
            "phase-base SHA",
            "Gate 4b: Review resumes commit-only",
            "Reviewing (commit-only)",
            "phase-progress entry proposal",
            "sole team-mode writer",
        )
        failures += prohibit(
            relative,
            "Invoke the Steward",
            "Dismiss the Steward",
            "including the event-driven Steward",
            "parallel implementation begins",
        )

    for relative in light_build_skills:
        failures += require(
            relative,
            "LIGHT_ASSURANCE_CONTRACT_V1",
            "one consolidated planning approval",
            "coordinator-authored component breakdown",
            "`project-manager`",
            "`solutions-architect`",
            "`technical-research`",
            "`technical-business-analyst`",
            "`implement`",
            "`review`",
            "`phase-docs`",
            "docs/phase-X-component-breakdown.md",
            "docs/agent-team-state.md",
            "docs/phase-progress.json",
            "`spec-validated`",
            "any standard route that would have been `test` or `full` maps to `review`",
            "`light-phase-gate`",
            "Review-owned phase validation",
            "docs/phase-X-test-report.md",
            "one shared repair cycle",
            "no second repair cycle is allowed",
            "Light-mode prerequisite override",
            "scripts/worktree-fingerprint.py",
            "one active component-delivery engagement at a time",
            "never writes product code or tests",
            'python3 scripts/worktree-fingerprint.py --rev "$COMPONENT_SHA" -- [the same explicit component-owned paths]',
            "create exactly one replacement of the same recorded agent role",
            "`authorRepairUsed`",
            "`phaseGateRepairUsed`",
            "`phaseValidationAttempts`",
            "Normalize imported expansive state before delegation",
            "No Git mutation occurs while merely planning a lease.",
            "Do not start X.2 until both the human gate is cleared and X.1 is Committed.",
            "names Review `light-phase-gate` as the final Validation Targets consumer",
            "any later aggregate verdict other than APPROVED or phase result other than PASS",
            "including BLOCKED attempts with zero executions",
            "recompute the post-finalization identities",
            "planning-package commit",
            "globally owned candidate",
            "do not alter or stash them",
            "concurrent authors are allowed only when",
            "record the human gate as BLOCKED",
            "repeat aggregate Review, automated phase validation",
            "docs/*-product-solution-doc-*.md",
        )
        failures += check_light_agent_registry(relative)
        failures += prohibit_patterns(
            relative,
            r"(?im)^\s*(?:\d+\.\s*)?(?:delegate|spawn|resume)\s+`?(?:tech-lead|test|debug|competitor-analysis)\b",
            r"(?im)^\s*(?:\d+\.\s*)?delegate\s+(?:the\s+)?(?:Tech Lead|Test|Debug|Competitor Analysis)\b",
        )

    for relative in implement_agents:
        failures += require(
            relative,
            "ASSURANCE_CONTRACT_V1",
            "sole component delivery manifest",
            "scripts/worktree-fingerprint.py",
            "component validation",
            "phase-gate",
            "Commit-Owner Protocol",
            "Solo/direct mode",
            "--rev HEAD",
            "serialized by default",
            "Release the team lease/self-held guard on every exit",
            "python3 scripts/worktree-fingerprint.py --rev HEAD -- [the same explicit component-owned paths]",
            "Review in `light-phase-gate` owns the narrow exception",
        )

    for relative in test_agents:
        failures += require(
            relative,
            "ASSURANCE_CONTRACT_V1",
            "Test Phase X",
            "scripts/worktree-fingerprint.py",
            "Never stage, commit, push, or merge",
        )

    for relative in review_agents:
        failures += require(
            relative,
            "ASSURANCE_CONTRACT_V1",
            "Spec gap / new risk",
            "scripts/worktree-fingerprint.py",
            "docs/phase-X-test-report.md",
            "review`, `full`, and `phase-gate",
            "Review is read-only until staging",
            "PHASE_BASE_SHA",
            '--rev "$COMPONENT_SHA"',
            "Solo/direct mode",
            "phase-final uncommitted candidate diff",
            "Post-Commit Fingerprint And Push",
            "--rev HEAD",
            "Every exit after commit",
            "`light-phase-gate`",
            "Review-owned phase validation",
            "standard mode remains unchanged",
            "Release the validation lease in guaranteed cleanup",
            "Once the repair allowance is consumed",
            "any later aggregate verdict other than APPROVED or phase result other than PASS",
            "once per unchanged fingerprint",
            "### Verdict: [PASS / FAIL — requires fixes / BLOCKED]",
            "**Gate invocation:** [coordinator-supplied phaseValidationAttempts value]",
            "`phaseGateRepairUsed` and `phaseValidationAttempts`",
            "aggregate static/spec pass produces BLOCKED instead of APPROVED",
            "zero executions, a BLOCKED verdict",
            "Light mode: Review-owned phase validation PASS in docs/phase-X-test-report.md satisfies the phase-report prerequisite.",
            "separate `Test Phase X`",
            "absent during the initial aggregate review and required only for the commit-only resume",
            'python3 scripts/worktree-fingerprint.py --rev "$COMPONENT_SHA" -- [the same explicit component-owned paths]',
            "python3 scripts/worktree-fingerprint.py --rev HEAD -- [the same explicit component-owned paths]",
        )
        failures += prohibit_patterns(
            relative,
            r"Required pre-existing Test-owned PASS evidence for standard `phase-gate`",
        )

    for relative in debug_agents:
        failures += require(
            relative,
            "ASSURANCE_CONTRACT_V1",
            "targeted validation",
            "Never commit or push",
            "recorded assurance lane",
        )

    for relative in tech_lead_agents:
        failures += require(
            relative,
            "ASSURANCE_CONTRACT_V1",
            "targeted/component/phase validation tiers",
            "assurance lane",
            "validation tier",
            "sole delivery manifest",
            "phase-gate",
            "phase-progress entry proposal",
            "do not edit `docs/phase-progress.json`",
            "sole shared-tracker writer",
        )

    for relative in tech_lead_agents[:2]:
        failures += require(
            relative,
            '"assuranceReasons"',
            '"validationOwner"',
            '"commitOwner"',
            '"fingerprintScope"',
            '"evidenceFingerprint"',
            '"remediationCycles"',
        )

    for relative in business_analyst_agents:
        failures += require(
            relative,
            "ASSURANCE_CONTRACT_V1",
            "preliminary assurance lane",
            "phase-gate",
        )

    for relative in phase_docs_agents:
        failures += require(
            relative,
            "phase-X-test-report.md",
            "Aggregate review approved",
            "assurance disposition",
            "component overview",
            "Profiled human validation passed",
            "team-state attestation is authoritative",
            "phase report need only name the required human action",
        )

    for relative in profiles:
        failures += require(
            relative,
            "Tier 1 — Targeted",
            "Tier 2 — Component",
            "Tier 3 — Phase",
            "scripts/worktree-fingerprint.py",
            "phase-gate",
            "fast` (Implement gate + Implement commit)",
            "full` (Test gate + Review commit)",
            "regression-prone observable behaviour",
            "incomplete/contradictory evidence",
            "serialized by default",
            "one active component-delivery engagement at a time",
            "scoped fingerprint command",
        )
        failures += prohibit_patterns(
            relative,
            r"<TestClass>",
            r"<changed[-_][^>]*>",
            r"<focused[-_][^>]*>",
            r"<component[-_][^>]*>",
        )

    failures += require(
        ".github/instructions/copilot.instructions.md",
        "Sole component delivery manifest",
        "scripts/worktree-fingerprint.py",
        "Test Phase X",
        "phase-gate",
        "| `fast` | Implement | No | Implement |",
        "| `full` | Test | Yes | Review |",
        "regression-prone observable behaviour",
        "incomplete/contradictory evidence",
        "serialized by default",
        "one active component-delivery engagement at a time",
        "Commit ownership is executable",
        "--rev HEAD",
        "phase-base SHA",
    )
    failures += require(
        "agents-src/shared/validation-tiers.md",
        "In the standard expansive workflow",
        "build-with-agent-team-light",
        "This exception grants no phase-validation authority when that exact mode is absent.",
        "docs/*-product-solution-doc-*.md",
    )
    failures += require(
        "agents-src/shared/implementation-assurance.md",
        "This table is the default expansive-workflow contract.",
        "every trigger that would select `test` or `full` maps to `review`",
        "otherwise the standard Test-owned phase gate remains unchanged.",
    )
    failures += require(
        "supporting-files/AGENT_FLOWS.md",
        "risk-tiered",
        "Test Phase X",
        "scripts/worktree-fingerprint.py",
        "regression-prone observable behaviour",
        "incomplete/contradictory evidence",
        "serialized by default",
        "one active component-delivery engagement at a time",
        "phase-base SHA",
        "phase-progress entry proposal",
        "never a separate teammate",
        "Git-leased planning-package commit",
        "globally owned candidate",
        "Light `implementation` accepts the phase as its lone trailing value",
    )
    for relative in template_readme_contracts:
        failures += require(
            relative,
            "risk-tiered",
            "Test Phase X",
            "serialized by default",
            "Missing executable proof",
        )
    for relative in ("templates/AGENTS.md.template", "templates/CLAUDE.md.template"):
        failures += require(
            relative,
            "targeted/component/phase validation tiers",
            "shared-resource locks",
        )

    live_contracts = (
        *build_skills,
        *light_build_skills,
        *implement_agents,
        *test_agents,
        *review_agents,
        *debug_agents,
        *tech_lead_agents,
        *business_analyst_agents,
        *phase_docs_agents,
        *profiles,
        ".github/instructions/copilot.instructions.md",
        "supporting-files/AGENT_FLOWS.md",
        *template_readme_contracts,
    )
    obsolete_contracts = (
        "docs/implementation-context-phase-X.md",
        "after each implementation",
        "spawned after the Test agent reports PASS",
        "committed by Review agents",
        "phase-final component's component-mode tests passed",
        "explicit sample",
        "Parallel code authors require isolated worktrees/branches",
        "code authors run concurrently only when file ownership permits",
    )
    for relative in live_contracts:
        failures += prohibit(relative, *obsolete_contracts)

    if failures:
        print("Implementation assurance contract check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        "OK: risk-tiered implementation contracts are coherent across "
        "Claude, Codex, GitHub Copilot, project profiles, and build documentation."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
