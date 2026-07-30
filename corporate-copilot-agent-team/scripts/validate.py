#!/usr/bin/env python3
"""Validate the standalone corporate Copilot agent-team source bundle."""

from __future__ import annotations

import ast
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SKILL_NAME = "build-with-agent-team"
SKILL_PATH = PACKAGE_ROOT / ".github" / "skills" / SKILL_NAME / "SKILL.md"
TEMPLATE_PATH = (
    PACKAGE_ROOT
    / ".github"
    / "skills"
    / SKILL_NAME
    / "references"
    / "solution-plan-template.md"
)
AGENTS_DIR = PACKAGE_ROOT / ".github" / "agents"

EXPECTED_AGENTS = {
    "corporate-solution-planner": "corporate-solution-planner.agent.md",
    "corporate-implement": "corporate-implement.agent.md",
    "corporate-review": "corporate-review.agent.md",
}

EXPECTED_HANDOFFS = {
    "corporate-solution-planner": {"corporate-implement"},
    "corporate-implement": {"corporate-review"},
    "corporate-review": {"corporate-implement"},
}

EXPECTED_TOOLS = {
    "corporate-solution-planner": {
        "read",
        "search",
        "edit",
        "web",
        "todo",
    },
    "corporate-implement": {
        "read",
        "search",
        "edit",
        "execute",
        "web",
        "todo",
    },
    "corporate-review": {
        "read",
        "search",
        "execute",
        "web",
        "todo",
    },
}

EXPECTED_HANDOFF_PROMPT_TOKENS = {
    "corporate-solution-planner": (
        "PLAN_PATH: <replace-with-approved-plan-path>",
        "APPROVAL_SIGNAL: <replace-only-after-explicit-user-approval>",
        "APPROVED_CONTRACT_DIGEST: <replace-with-recorded-sha256>",
        "IMPLEMENTATION_ID: initial:<replace-with-recorded-sha256>",
        "REPAIR_PASS: 0",
        "Do not submit until",
    ),
    "corporate-implement": (
        "PLAN_PATH: <replace-with-approved-plan-path>",
        "APPROVED_CONTRACT_DIGEST: <replace-with-recorded-sha256>",
        "complete diff",
        "Implementation Evidence",
    ),
    "corporate-review": (
        "PLAN_PATH: <replace-with-approved-plan-path>",
        "APPROVAL_SIGNAL: <replace-only-after-explicit-user-repair-authorization>",
        "APPROVED_CONTRACT_DIGEST: <replace-with-recorded-sha256>",
        "IMPLEMENTATION_ID: <copy-completed-initial-id>",
        "REPAIR_PASS: 1",
        "REPAIR_AUTHORIZATION: <replace-only-after-explicit-user-authorization>",
        "REPAIR_ID: <replace-with-review-id>",
        "REPAIR_AUTH_RECORD: <paste-verbatim-REPAIR_AUTH_V1-block>",
        "Do not submit without explicit repair authorization",
    ),
}

REQUIRED_FILES = {
    "README.md",
    ".github/skills/build-with-agent-team/SKILL.md",
    ".github/skills/build-with-agent-team/references/solution-plan-template.md",
    ".github/agents/corporate-solution-planner.agent.md",
    ".github/agents/corporate-implement.agent.md",
    ".github/agents/corporate-review.agent.md",
    "scripts/validate.py",
}

EXPECTED_DIRECTORIES = {
    ".github",
    ".github/agents",
    ".github/skills",
    ".github/skills/build-with-agent-team",
    ".github/skills/build-with-agent-team/references",
    "scripts",
}

MODE_IDENTIFIERS = {
    "MODE_PLANNING: planning",
    "MODE_IMPLEMENTATION: implementation <plan-path>",
    "MODE_REVIEW: review <plan-path>",
    "MODE_FULL: full",
}

TEMPLATE_HEADING_ORDER = (
    "## Work Item",
    "## Source References",
    "## Current Behavior",
    "## Goal",
    "## Non-Goals",
    "## Acceptance Criteria",
    "## Proposed Design and Data Flow",
    "## Affected Files, Interfaces, and Data",
    "## Ordered Implementation Steps",
    "## Test Intent",
    "## Rollout and Rollback",
    "## Risks",
    "## Assumptions",
    "## Approval",
    "## Implementation Evidence",
)

MAX_AGENT_PROMPT_CHARS = 30_000
MAX_SKILL_LINES = 500
MAX_SKILL_NAME_CHARS = 64
MAX_SKILL_DESCRIPTION_CHARS = 1_024


@dataclass(frozen=True)
class MarkdownProfile:
    path: Path
    text: str
    frontmatter: dict[str, str]
    frontmatter_text: str
    body: str


def relative(path: Path) -> str:
    """Return a stable package-relative display path."""

    try:
        return path.relative_to(PACKAGE_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def load_profile(path: Path, errors: list[str]) -> MarkdownProfile | None:
    """Load a Markdown file with simple top-level YAML frontmatter."""

    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"{relative(path)}: cannot read file: {exc}")
        return None

    lines = text.splitlines()
    if not lines or lines[0] != "---":
        errors.append(f"{relative(path)}: missing opening YAML frontmatter delimiter")
        return None

    try:
        closing_index = lines.index("---", 1)
    except ValueError:
        errors.append(f"{relative(path)}: missing closing YAML frontmatter delimiter")
        return None

    frontmatter_lines = lines[1:closing_index]
    frontmatter: dict[str, str] = {}
    for line in frontmatter_lines:
        if not line or line[0].isspace():
            continue
        match = re.fullmatch(r"([a-z][a-z0-9-]*):(?:[ \t]*(.*))?", line)
        if not match:
            errors.append(
                f"{relative(path)}: invalid top-level frontmatter line: {line!r}"
            )
            continue
        key, value = match.group(1), (match.group(2) or "").strip()
        if key in frontmatter:
            errors.append(f"{relative(path)}: duplicate frontmatter key {key!r}")
        frontmatter[key] = value

    return MarkdownProfile(
        path=path,
        text=text,
        frontmatter=frontmatter,
        frontmatter_text="\n".join(frontmatter_lines),
        body="\n".join(lines[closing_index + 1 :]).lstrip("\n"),
    )


def parse_tools(profile: MarkdownProfile, errors: list[str]) -> set[str]:
    """Parse the inline YAML tools list without a YAML dependency."""

    raw_tools = profile.frontmatter.get("tools")
    if not raw_tools:
        errors.append(f"{relative(profile.path)}: missing explicit tools boundary")
        return set()

    try:
        parsed = ast.literal_eval(raw_tools)
    except (SyntaxError, ValueError) as exc:
        errors.append(f"{relative(profile.path)}: invalid inline tools list: {exc}")
        return set()

    if not isinstance(parsed, list) or not all(
        isinstance(item, str) and item for item in parsed
    ):
        errors.append(f"{relative(profile.path)}: tools must be a list of strings")
        return set()
    if len(parsed) != len(set(parsed)):
        errors.append(f"{relative(profile.path)}: duplicate tool entries")
    return set(parsed)


def parse_handoffs(
    profile: MarkdownProfile, errors: list[str]
) -> list[tuple[str, str, str, str]]:
    """Return (label, agent, prompt, send) tuples from the constrained format."""

    pattern = re.compile(
        r"(?m)^  - label: (?P<label>.+)\n"
        r"    agent: (?P<agent>[a-z0-9-]+)\n"
        r"    prompt: (?P<prompt>.+)\n"
        r"    send: (?P<send>true|false)$"
    )
    handoffs = [
        (
            match.group("label"),
            match.group("agent"),
            match.group("prompt"),
            match.group("send"),
        )
        for match in pattern.finditer(profile.frontmatter_text)
    ]
    handoff_items = re.findall(r"(?m)^  -\s+", profile.frontmatter_text)
    if "handoffs" not in profile.frontmatter:
        errors.append(f"{relative(profile.path)}: missing VS Code handoffs")
    if not handoffs:
        errors.append(f"{relative(profile.path)}: no parseable VS Code handoff")
    if len(handoff_items) != len(handoffs):
        errors.append(
            f"{relative(profile.path)}: unparsed or reordered handoff entry; "
            "every handoff must use the constrained label/agent/prompt/send order"
        )
    if re.search(r"(?m)^\s+send:\s*true\s*$", profile.frontmatter_text):
        errors.append(
            f"{relative(profile.path)}: every VS Code handoff must set send: false"
        )
    return handoffs


def validate_topology(errors: list[str]) -> None:
    """Validate the copy-only file layout and exclude scaffold/install artifacts."""

    actual_files = {
        relative(path) for path in PACKAGE_ROOT.rglob("*") if path.is_file()
    }
    for required in sorted(REQUIRED_FILES):
        if required not in actual_files:
            errors.append(f"{required}: required file is missing")
    unexpected_files = actual_files - REQUIRED_FILES
    if unexpected_files:
        errors.append(
            "package: unexpected files: " + ", ".join(sorted(unexpected_files))
        )

    actual_directories = {
        relative(path) for path in PACKAGE_ROOT.rglob("*") if path.is_dir()
    }
    if actual_directories != EXPECTED_DIRECTORIES:
        missing = sorted(EXPECTED_DIRECTORIES - actual_directories)
        unexpected = sorted(actual_directories - EXPECTED_DIRECTORIES)
        if missing:
            errors.append("package: missing directories: " + ", ".join(missing))
        if unexpected:
            errors.append(
                "package: unexpected directories: " + ", ".join(unexpected)
            )

    actual_agent_files = {
        path.name for path in AGENTS_DIR.glob("*.agent.md") if path.is_file()
    }
    expected_agent_files = set(EXPECTED_AGENTS.values())
    if actual_agent_files != expected_agent_files:
        missing = sorted(expected_agent_files - actual_agent_files)
        unexpected = sorted(actual_agent_files - expected_agent_files)
        if missing:
            errors.append(f".github/agents: missing agents: {', '.join(missing)}")
        if unexpected:
            errors.append(
                f".github/agents: unexpected agents: {', '.join(unexpected)}"
            )

    skill_root = PACKAGE_ROOT / ".github" / "skills"
    actual_skills = {
        path.name for path in skill_root.iterdir() if path.is_dir()
    } if skill_root.is_dir() else set()
    if actual_skills != {SKILL_NAME}:
        errors.append(
            ".github/skills: expected only build-with-agent-team; found "
            + ", ".join(sorted(actual_skills))
        )

    forbidden_names = {
        "openai.yaml",
        "plugin.json",
        "install.py",
        "install.sh",
        "installer.py",
    }
    for path in PACKAGE_ROOT.rglob("*"):
        if path.is_file() and path.name in forbidden_names:
            errors.append(f"{relative(path)}: forbidden scaffold/installer artifact")

    scaffold_agents_dir = (
        PACKAGE_ROOT / ".github" / "skills" / SKILL_NAME / "agents"
    )
    if scaffold_agents_dir.exists():
        errors.append(
            f"{relative(scaffold_agents_dir)}: scaffold-only directory must be removed"
        )


def validate_skill(errors: list[str]) -> set[str]:
    """Validate skill metadata, public modes, and exact agent references."""

    profile = load_profile(SKILL_PATH, errors)
    if profile is None:
        return set()

    if set(profile.frontmatter) != {"name", "description"}:
        errors.append(
            f"{relative(SKILL_PATH)}: frontmatter must contain only name and description"
        )

    raw_name = profile.frontmatter.get("name", "")
    if raw_name != SKILL_NAME:
        errors.append(
            f"{relative(SKILL_PATH)}: name must exactly match {SKILL_NAME!r}"
        )
    if len(raw_name) > MAX_SKILL_NAME_CHARS or not re.fullmatch(
        r"[a-z0-9]+(?:-[a-z0-9]+)*", raw_name
    ):
        errors.append(f"{relative(SKILL_PATH)}: invalid skill name")

    description = profile.frontmatter.get("description", "")
    if not description or len(description) > MAX_SKILL_DESCRIPTION_CHARS:
        errors.append(
            f"{relative(SKILL_PATH)}: description must be 1-"
            f"{MAX_SKILL_DESCRIPTION_CHARS} characters"
        )

    for identifier in sorted(MODE_IDENTIFIERS):
        if identifier not in profile.body:
            errors.append(
                f"{relative(SKILL_PATH)}: missing mode identifier {identifier!r}"
            )
    if "MAX_IMPLEMENT_REPAIR_PASSES: 1" not in profile.body:
        errors.append(
            f"{relative(SKILL_PATH)}: missing one-repair ceiling identifier"
        )
    if "REPAIR_PASS: 2" not in profile.body:
        errors.append(
            f"{relative(SKILL_PATH)}: missing explicit second-repair prohibition"
        )
    if len(profile.text.splitlines()) > MAX_SKILL_LINES:
        errors.append(
            f"{relative(SKILL_PATH)}: exceeds {MAX_SKILL_LINES} line skill limit"
        )

    for token in (
        "Approval is bound to content, not merely a path.",
        "level-two headings to occur exactly once, with no extras",
        "normalize CRLF and CR line endings to LF",
        "CONTRACT_DIGEST_V1",
        "Implementation and Review independently recompute the digest",
        "A standalone `planning` run leaves the plan Pending",
        "Invoking `review <plan-path>` is read-only and does not authorize implementation or repair.",
        "stop and request explicit user repair authorization",
        "The review invocation itself and the prefilled handoff are not edit authority.",
        "A different ID, a second `REPAIR_PASS: 1`, or any repair request after `Completed` is forbidden",
        "A fresh pass 0 against a Completed state is forbidden",
        "CANDIDATE_MANIFEST_V1",
        "`CANDIDATE_ID_V1:sha256:<64-lowercase-hex>` is SHA-256 over those exact record bytes.",
        "except the exact `PLAN_PATH`",
        "without being invalidated by its own evidence",
        "committed, staged, unstaged, deleted, mode-changed, and non-ignored untracked content",
        "REPAIR_AUTH_V1",
        "including the final finding",
        "Never reset them on resume",
        "Never comment on, edit, assign, transition, or otherwise mutate Jira",
    ):
        if token not in profile.body:
            errors.append(
                f"{relative(SKILL_PATH)}: missing approval/repair contract {token!r}"
            )
    for forbidden in (
        "On the first `CHANGES REQUIRED`, route only the actionable findings",
        "After approval, have the planner record it",
    ):
        if forbidden in profile.body:
            errors.append(
                f"{relative(SKILL_PATH)}: contains obsolete unsafe flow {forbidden!r}"
            )
    unsafe_jira = re.search(
        r"(?im)\b(?:may|can|allowed to)\s+"
        r"(?:comment(?:\s+on)?|edit|assign|transition|mutate)\s+Jira\b",
        profile.body,
    )
    if unsafe_jira:
        errors.append(
            f"{relative(SKILL_PATH)}: unsafe Jira mutation exception "
            f"{unsafe_jira.group(0)!r}"
        )

    references = set(re.findall(r"\b(corporate-[a-z0-9-]+)\b", profile.body))
    if references != set(EXPECTED_AGENTS):
        errors.append(
            f"{relative(SKILL_PATH)}: agent references must be exactly "
            + ", ".join(sorted(EXPECTED_AGENTS))
            + f"; found {', '.join(sorted(references))}"
        )
    return references


def validate_agents(errors: list[str]) -> None:
    """Validate cross-surface frontmatter, handoffs, tools, and prompt size."""

    found_names: set[str] = set()
    all_handoff_targets: set[str] = set()

    for expected_name, filename in EXPECTED_AGENTS.items():
        path = AGENTS_DIR / filename
        profile = load_profile(path, errors)
        if profile is None:
            continue

        allowed_keys = {
            "name",
            "description",
            "argument-hint",
            "tools",
            "handoffs",
        }
        unknown_keys = set(profile.frontmatter) - allowed_keys
        if unknown_keys:
            errors.append(
                f"{relative(path)}: unsupported frontmatter keys: "
                + ", ".join(sorted(unknown_keys))
            )

        name = profile.frontmatter.get("name", "")
        found_names.add(name)
        if name != expected_name:
            errors.append(
                f"{relative(path)}: name must exactly match {expected_name!r}"
            )
        if path.name != f"{name}.agent.md":
            errors.append(
                f"{relative(path)}: filename must match frontmatter agent name"
            )
        if not profile.frontmatter.get("description"):
            errors.append(f"{relative(path)}: description is required")
        if "target" in profile.frontmatter:
            errors.append(
                f"{relative(path)}: omit target so the agent is cross-surface"
            )
        if len(profile.body) > MAX_AGENT_PROMPT_CHARS:
            errors.append(
                f"{relative(path)}: prompt is {len(profile.body)} characters; "
                f"maximum is {MAX_AGENT_PROMPT_CHARS}"
            )

        tools = parse_tools(profile, errors)
        if tools != EXPECTED_TOOLS[expected_name]:
            errors.append(
                f"{relative(path)}: tools differ from role boundary; expected "
                f"{sorted(EXPECTED_TOOLS[expected_name])}, found {sorted(tools)}"
            )
        if expected_name in {"corporate-solution-planner", "corporate-review"}:
            server_wildcards = sorted(tool for tool in tools if tool.endswith("/*"))
            if server_wildcards:
                errors.append(
                    f"{relative(path)}: read-oriented role must not receive "
                    "server-wide MCP wildcards: " + ", ".join(server_wildcards)
                )
            if "APPROVAL_SIGNAL: explicit-user" in profile.frontmatter_text:
                errors.append(
                    f"{relative(path)}: handoff frontmatter must not pre-populate "
                    "implementation approval"
                )
            unsafe_role_expansion = re.search(
                r"(?im)\b(?:may|can|should)\s+"
                r"(?:edit|modify|change|write|transition|comment on)\s+"
                r"(?:product code|tests?|Jira|pull requests?)\b",
                profile.body,
            )
            if unsafe_role_expansion:
                errors.append(
                    f"{relative(path)}: unsafe role expansion: "
                    f"{unsafe_role_expansion.group(0)!r}"
                )
        if (
            expected_name == "corporate-review"
            and "REPAIR_AUTHORIZATION: explicit-user" in profile.frontmatter_text
        ):
            errors.append(
                f"{relative(path)}: Review handoff must not pre-populate "
                "repair authorization"
            )

        handoffs = parse_handoffs(profile, errors)
        if len(handoffs) != 1:
            errors.append(
                f"{relative(path)}: must contain exactly one VS Code handoff; "
                f"found {len(handoffs)}"
            )
        targets = {target for _, target, _, _ in handoffs}
        all_handoff_targets.update(targets)
        if targets != EXPECTED_HANDOFFS[expected_name]:
            errors.append(
                f"{relative(path)}: handoff targets must be "
                f"{sorted(EXPECTED_HANDOFFS[expected_name])}, found {sorted(targets)}"
            )
        expected_prompt_tokens = EXPECTED_HANDOFF_PROMPT_TOKENS[expected_name]
        for _, target, prompt, send in handoffs:
            if send != "false":
                errors.append(
                    f"{relative(path)}: handoff to {target} must set send: false"
                )
            missing_prompt_tokens = [
                token for token in expected_prompt_tokens if token not in prompt
            ]
            if missing_prompt_tokens:
                errors.append(
                    f"{relative(path)}: handoff to {target} is missing safe prompt "
                    "tokens: " + ", ".join(repr(token) for token in missing_prompt_tokens)
                )
            unsafe_prompt = re.search(
                r"(?i)(?:placeholders?\s+(?:count|serve)\s+as\s+"
                r"(?:approval|authorization)|start\s+(?:now|immediately))",
                prompt,
            )
            if unsafe_prompt:
                errors.append(
                    f"{relative(path)}: unsafe handoff prompt "
                    f"{unsafe_prompt.group(0)!r}"
                )
            if expected_name in {
                "corporate-solution-planner",
                "corporate-review",
            } and "APPROVAL_SIGNAL: explicit-user" in prompt:
                errors.append(
                    f"{relative(path)}: handoff to {target} must not pre-populate "
                    "implementation approval"
                )

        body_agent_references = set(
            re.findall(r"\b(corporate-[a-z0-9-]+)\b", profile.body)
        )
        unknown_body_references = body_agent_references - set(EXPECTED_AGENTS)
        if unknown_body_references:
            errors.append(
                f"{relative(path)}: references missing agents: "
                + ", ".join(sorted(unknown_body_references))
            )

        if "[TODO" in profile.text or "TODO:" in profile.text:
            errors.append(f"{relative(path)}: unresolved scaffold TODO")

    if found_names != set(EXPECTED_AGENTS):
        errors.append(
            ".github/agents: frontmatter names do not match the exact agent registry"
        )
    unknown_targets = all_handoff_targets - found_names
    if unknown_targets:
        errors.append(
            ".github/agents: handoffs reference missing agents: "
            + ", ".join(sorted(unknown_targets))
        )

    implement_path = AGENTS_DIR / EXPECTED_AGENTS["corporate-implement"]
    implement = load_profile(implement_path, errors)
    if implement is not None:
        implement_tools = parse_tools(implement, errors)
        if "agent" in implement_tools or "custom-agent" in implement_tools:
            errors.append(
                f"{relative(implement_path)}: Implement must not have an agent tool"
            )
        required_test_boundary = (
            "Do not invoke, spawn, hand off to, or request a dedicated Test agent."
        )
        if required_test_boundary not in implement.body:
            errors.append(
                f"{relative(implement_path)}: missing dedicated Test-agent prohibition"
            )
        for token in (
            "APPROVED_CONTRACT_DIGEST: sha256:<64-lowercase-hex>",
            "IMPLEMENTATION_ID: initial:<same approved contract digest>",
            "Never estimate or copy a digest without recomputing it.",
            "completed repair Run already exists",
            "prior completed pass-0 Run",
            "initial implementation state to be `Completed — <IMPLEMENTATION_ID>`",
            "REPAIR_AUTH_V1",
            "REPAIR_AUTH_RECORD: <verbatim REPAIR_AUTH_V1 block>",
            "build `CANDIDATE_MANIFEST_V1` and `CANDIDATE_ID_V1` exactly as defined by the skill",
            "require it to equal `REPAIR_ID`",
            "never treat a repeated pass-0 or pass-1 assignment as a fresh allowance",
            "non-placeholder approver, approval date/session, approved plan revision",
            "level-two headings occur exactly once",
            "mutable evidence never authorizes a contract deviation",
        ):
            if token not in implement.body:
                errors.append(
                    f"{relative(implement_path)}: missing approval/repair guard "
                    f"{token!r}"
                )
        if re.search(r"(?m)^\s*agent:\s+.*test", implement.frontmatter_text, re.I):
            errors.append(
                f"{relative(implement_path)}: must not hand off to a Test agent"
            )
        unsafe_repair_expansion = re.search(
            r"(?im)\b(?:may|can)\s+(?:also\s+)?"
            r"(?:address|fix|include)\s+(?:new|additional|unrecorded)\s+findings\b",
            implement.body,
        )
        if unsafe_repair_expansion:
            errors.append(
                f"{relative(implement_path)}: unsafe repair-scope expansion "
                f"{unsafe_repair_expansion.group(0)!r}"
            )

    review_path = AGENTS_DIR / EXPECTED_AGENTS["corporate-review"]
    review = load_profile(review_path, errors)
    if review is not None:
        review_tools = parse_tools(review, errors)
        if "edit" in review_tools:
            errors.append(
                f"{relative(review_path)}: read-only Review must not have edit tool"
            )
        if "agent" in review_tools or "custom-agent" in review_tools:
            errors.append(
                f"{relative(review_path)}: Review must not invoke agents"
            )
        for token in (
            "recorded `APPROVED_CONTRACT_DIGEST`",
            "the review request itself does not authorize edits",
            "REPAIR_AUTH_V1",
            "SHA-256 of those exact UTF-8 bytes is `REPAIR_ID`",
            "Compute `CANDIDATE_ID_V1` exactly as defined by the skill",
            "An `In progress` repair",
            "matching durable `REPAIR_AUTH_V1` record and completed pass-1 Run",
            "non-placeholder approver, approval date/session, approved plan revision",
            "level-two headings occur exactly once",
            "Completed initial implementation state with its matching completed pass-0 Run",
            "evidence-only \"approved deviation.\"",
            "The bundled Review profile has no server-wide Jira/Atlassian wildcard",
        ):
            if token not in review.body:
                errors.append(
                    f"{relative(review_path)}: missing read-only approval guard "
                    f"{token!r}"
                )
        unsafe_in_progress_approval = re.search(
            r"(?im)\b(?:may|can)\s+approve\b[^\n]{0,60}\bin[- ]progress\b",
            review.body,
        )
        if unsafe_in_progress_approval:
            errors.append(
                f"{relative(review_path)}: unsafe in-progress approval exception "
                f"{unsafe_in_progress_approval.group(0)!r}"
            )

    planner_path = AGENTS_DIR / EXPECTED_AGENTS["corporate-solution-planner"]
    planner = load_profile(planner_path, errors)
    if planner is not None:
        for token in (
            "bundled profile intentionally has no server-wide Jira/Atlassian wildcard",
            "explicit user approval and a computed canonical contract digest",
            "Initial implementation state: Not started",
            "Repair cycle state: Unused",
            "CONTRACT_DIGEST_V1",
            "with no additional level-two headings",
            "preserving all prior Run and repair-authorization records",
        ):
            if token not in planner.body:
                errors.append(
                    f"{relative(planner_path)}: missing planning boundary {token!r}"
                )


def validate_template_and_readme(errors: list[str]) -> None:
    """Validate the plan contract and copy-only installation guidance."""

    try:
        template = TEMPLATE_PATH.read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"{relative(TEMPLATE_PATH)}: cannot read file: {exc}")
        template = ""

    headings = [
        line.strip() for line in template.splitlines() if line.startswith("## ")
    ]
    expected_headings = list(TEMPLATE_HEADING_ORDER)
    missing_headings = sorted(set(expected_headings) - set(headings))
    if missing_headings:
        errors.append(
            f"{relative(TEMPLATE_PATH)}: missing headings: "
            + ", ".join(missing_headings)
        )
    duplicate_headings = sorted(
        heading for heading in set(headings) if headings.count(heading) > 1
    )
    if duplicate_headings:
        errors.append(
            f"{relative(TEMPLATE_PATH)}: duplicate headings: "
            + ", ".join(duplicate_headings)
        )
    if headings != expected_headings:
        errors.append(
            f"{relative(TEMPLATE_PATH)}: section headings must appear exactly once "
            "in the required contract order"
        )
    for token in (
        "**Ticket description/contract:**",
        "**Dependencies:**",
        "**Linked items and attachments:**",
        "**Delivery constraints:**",
        "**Status:** Pending",
        "**Approved by:** Not approved",
        "**Approval date/session:** Not approved",
        "**Approved plan revision:** Not approved",
        "**Approved contract digest:** Pending",
        "**Digest algorithm:** CONTRACT_DIGEST_V1",
        "**Digest command:** Not run",
        "implementation <plan-path>",
        "Implementation Evidence",
        "**Approval cycle digest:** Pending",
        "**Initial implementation state:** Not started",
        "**Repair cycle state:** Unused",
        "REPAIR_AUTH_V1",
        "**Repair ID:**",
        "**Candidate ID:** <CANDIDATE_ID_V1:sha256:...>",
        "CANDIDATE_MANIFEST_V1",
        "**Execution variances:**",
        "**Contract revision:**",
        "evidence alone never authorizes deviation",
        "normalize CRLF and CR line endings to LF",
    ):
        if token not in template:
            errors.append(
                f"{relative(TEMPLATE_PATH)}: missing contract token {token!r}"
            )
    for unique_token in (
        "**Status:** Pending",
        "**Approved by:** Not approved",
        "**Approval date/session:** Not approved",
        "**Approved plan revision:** Not approved",
        "**Approved contract digest:** Pending",
        "**Digest algorithm:** CONTRACT_DIGEST_V1",
        "**Digest command:** Not run",
        "**Approval cycle digest:** Pending",
        "**Initial implementation state:** Not started",
        "**Repair cycle state:** Unused",
    ):
        if template.count(unique_token) != 1:
            errors.append(
                f"{relative(TEMPLATE_PATH)}: {unique_token!r} must occur exactly once"
            )
    if "## Approval\n" in template and "## Implementation Evidence\n" in template:
        approval_section = template.split("## Approval\n", 1)[1].split(
            "## Implementation Evidence\n", 1
        )[0]
        for field in (
            "Status",
            "Approved by",
            "Approval date/session",
            "Approved plan revision",
            "Approved contract digest",
            "Digest algorithm",
            "Digest command",
        ):
            occurrences = len(
                re.findall(
                    rf"(?m)^-\s+\*\*{re.escape(field)}:\*\*\s+",
                    approval_section,
                )
            )
            if occurrences != 1:
                errors.append(
                    f"{relative(TEMPLATE_PATH)}: Approval field {field!r} "
                    f"must occur exactly once; found {occurrences}"
                )
    if "## Implementation Evidence\n" in template:
        evidence_preamble = template.split("## Implementation Evidence\n", 1)[1]
        evidence_preamble = evidence_preamble.split("### Run ", 1)[0]
        for field in (
            "Approval cycle digest",
            "Initial implementation state",
            "Repair cycle state",
        ):
            occurrences = len(
                re.findall(
                    rf"(?m)^-\s+\*\*{re.escape(field)}:\*\*\s+",
                    evidence_preamble,
                )
            )
            if occurrences != 1:
                errors.append(
                    f"{relative(TEMPLATE_PATH)}: active-state field {field!r} "
                    f"must occur exactly once; found {occurrences}"
                )

    readme_path = PACKAGE_ROOT / "README.md"
    try:
        readme = readme_path.read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"{relative(readme_path)}: cannot read file: {exc}")
        readme = ""

    for phrase in (
        "copy-only",
        "hidden `.github`",
        "do not overwrite",
        "send: false",
        "Never merges or force-pushes",
        "~/.copilot/agents",
        "~/.claude/skills",
        ".claude/agents",
        "chat.agentFilesLocations",
        "chat.agentSkillsLocations",
        "installed-plugin",
        "/skills list",
        "Do not rely on precedence",
        "If any logical-name collision exists, stop and compare or rename it; do not overwrite it.",
        "server-wide MCP wildcard",
        "canonical SHA-256 digest",
        "Standalone `review` never authorizes edits",
    ):
        if phrase.casefold() not in readme.casefold():
            errors.append(
                f"{relative(readme_path)}: missing installation/safety phrase {phrase!r}"
            )
    unsafe_overwrite = re.search(
        r"(?im)\b(?:may|can|safe to|should)\s+overwrite\b",
        readme,
    )
    if unsafe_overwrite:
        errors.append(
            f"{relative(readme_path)}: unsafe collision guidance "
            f"{unsafe_overwrite.group(0)!r}"
        )


def require_scenario_tokens(
    path: Path,
    scenarios: dict[str, tuple[str, ...]],
    errors: list[str],
) -> None:
    """Verify that each forward-test scenario has an explicit prompt contract."""

    profile = load_profile(path, errors)
    if profile is None:
        return
    for scenario, tokens in scenarios.items():
        missing = [token for token in tokens if token not in profile.body]
        if missing:
            errors.append(
                f"{relative(path)}: scenario {scenario!r} is missing "
                + ", ".join(repr(token) for token in missing)
            )


def validate_behavior_scenarios(errors: list[str]) -> None:
    """Forward-check feature, bug, gate, testing, repair, and Git behavior."""

    require_scenario_tokens(
        SKILL_PATH,
        {
            "inaccessible Jira content": (
                "ask for pasted or exported content",
                "stop planning until the scope contract is available",
            ),
            "read-only Jira connector": (
                "Use only retrieval/read operations",
                "Never comment on, edit, assign, transition, or otherwise mutate Jira",
            ),
            "unapproved full workflow": (
                "Stop after the solution plan and request explicit user approval.",
                "Do not begin implementation in the same uninterrupted action.",
            ),
            "repository-controlled Git": (
                "If no policy exists, require explicit user approval before pushing or creating a pull request.",
                "Never merge or force-push.",
            ),
            "single repair cycle": (
                "MAX_IMPLEMENT_REPAIR_PASSES: 1",
                "Never authorize `REPAIR_PASS: 2`.",
                "Repair cycle state",
                "A fresh pass 0 against a Completed state is forbidden",
                "Never reset them on resume",
                "REPAIR_AUTH_V1",
            ),
            "revision-bound approval": (
                "approved contract digest",
                "level-two headings to occur exactly once",
                "normalize CRLF and CR line endings to LF",
                "CONTRACT_DIGEST_V1",
                "Implementation and Review independently recompute the digest",
            ),
            "complete candidate identity": (
                "CANDIDATE_MANIFEST_V1",
                "CANDIDATE_ID_V1:sha256:<64-lowercase-hex>",
                "base, index, and worktree tuples",
                "non-ignored untracked content",
            ),
            "standalone planning approval": (
                "A standalone `planning` run leaves the plan Pending",
                "exact continuation and approval signal is `implementation <plan-path>`",
            ),
            "read-only standalone review": (
                "Invoking `review <plan-path>` is read-only",
                "stop and request explicit user repair authorization",
                "prefilled handoff are not edit authority",
            ),
            "test scope": (
                "task-essential integration tests",
                "minimum unit tests",
                "Do not create tests to satisfy coverage percentages",
                "Do not introduce a dedicated Test agent.",
            ),
        },
        errors,
    )

    planner_path = AGENTS_DIR / EXPECTED_AGENTS["corporate-solution-planner"]
    require_scenario_tokens(
        planner_path,
        {
            "feature or epic slice": (
                "For an epic, identify the specific approved slice being planned.",
                "Do not plan the entire epic",
            ),
            "bug Jira item": (
                "For a bug, record reproduction steps and available failure evidence.",
                "Trace the current end-to-end behavior",
            ),
            "inaccessible Jira content": (
                "request pasted or exported content and return `BLOCKED`",
                "do not reconstruct ticket details from a title",
            ),
            "least-privilege Jira intake": (
                "no server-wide Jira/Atlassian wildcard",
                "specifically named, read-only Jira retrieval tool",
            ),
            "focused official research": (
                "Use focused research only when",
                "Prefer current official documentation",
                "Reconcile official guidance with versions pinned in the repository.",
            ),
            "planning-only ownership": (
                "Do not edit product code, tests, dependency files, CI, repository configuration, or other documents.",
                "Approval status and digest as `Pending`",
                "computed canonical contract digest",
            ),
            "safe plan structure": (
                "with no additional level-two headings",
                "especially `## Approval`",
                "Algorithm identifier `CONTRACT_DIGEST_V1`",
            ),
        },
        errors,
    )

    implement_path = AGENTS_DIR / EXPECTED_AGENTS["corporate-implement"]
    require_scenario_tokens(
        implement_path,
        {
            "unapproved plan": (
                "APPROVAL_SIGNAL: explicit-user",
                "APPROVED_CONTRACT_DIGEST: sha256:<64-lowercase-hex>",
                "return `BLOCKED` without changing product code",
            ),
            "scope drift": (
                "is `PLAN DRIFT`",
                "wait for revised approval",
            ),
            "bug discipline": (
                "Reproduce the reported behavior",
                "State a falsifiable cause before editing.",
                "Rerun the reproduction",
            ),
            "essential tests": (
                "Add integration tests that directly prove changed boundaries",
                "minimum unit tests required",
                "Do not add tests to increase a coverage percentage",
            ),
            "unrelated test failure": (
                "Report unrelated failures accurately and leave them untouched",
                "does not expose another approved requirement",
            ),
            "single repair": (
                "On `REPAIR_PASS: 1`",
                "completed repair Run already exists",
                "REPAIR_AUTH_RECORD: <verbatim REPAIR_AUTH_V1 block>",
                "prior completed pass-0 Run",
                "Never perform or recommend `REPAIR_PASS: 2`",
            ),
            "durable initial state": (
                "IMPLEMENTATION_ID: initial:<same approved contract digest>",
                "Change `Not started` to `In progress",
                "Reject a Completed initial state",
            ),
            "repair scope identity": (
                "initial implementation state to be `Completed — <IMPLEMENTATION_ID>`",
                "build `CANDIDATE_MANIFEST_V1` and `CANDIDATE_ID_V1`",
                "exact header/field order",
                "require it to equal `REPAIR_ID`",
                "record's `reviewed-candidate`",
            ),
            "plan revision drift": (
                "Never estimate or copy a digest without recomputing it.",
                "set Approval status and digest to Pending",
                "level-two headings occur exactly once",
            ),
            "repository-controlled Git": (
                "If none exists, do not push or create a pull request without explicit user approval.",
                "Never merge or force-push.",
            ),
        },
        errors,
    )

    review_path = AGENTS_DIR / EXPECTED_AGENTS["corporate-review"]
    require_scenario_tokens(
        review_path,
        {
            "read-only review": (
                "Never implement a fix or test.",
                "You have no edit tool.",
                "no server-wide Jira/Atlassian wildcard",
            ),
            "targeted rerun only": (
                "Only for stale or contradictory evidence",
                "rerun the smallest exact targeted command",
            ),
            "additional test threshold": (
                "Request an additional test only when an approved acceptance criterion remains materially unproven.",
                "Do not demand broader coverage",
            ),
            "finding taxonomy": (
                "**Blocker:**",
                "**Major:**",
                "**Minor:**",
            ),
            "terminal verdicts": (
                "`APPROVED`",
                "`CHANGES REQUIRED`",
                "`BLOCKED`",
            ),
            "one repair and escalation": (
                "REPAIR_PASS: 1",
                "REPAIR_AUTH_V1",
                "SHA-256 of those exact UTF-8 bytes is `REPAIR_ID`",
                "review request itself does not authorize edits",
                "any other second verdict requires human escalation",
            ),
            "review state gate": (
                "Repair cycle state: Unused",
                "Completed — <REPAIR_ID>",
                "An `In progress` repair",
                "never approve while Implement still owes repair evidence",
            ),
            "complete candidate identity": (
                "Compute `CANDIDATE_ID_V1` exactly as defined by the skill",
                "committed, index, working-tree",
                "non-ignored untracked states",
            ),
            "plan revision drift": (
                "level-two headings occur exactly once",
                "Recompute SHA-256 over canonical UTF-8 contract text",
                "require Approval to be reset to Pending",
            ),
        },
        errors,
    )


def main() -> int:
    """Run every bundle check and print a concise deterministic result."""

    errors: list[str] = []
    validate_topology(errors)
    validate_skill(errors)
    validate_agents(errors)
    validate_template_and_readme(errors)
    validate_behavior_scenarios(errors)

    if errors:
        print(f"Corporate Copilot kit validation FAILED ({len(errors)} issue(s)):")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Corporate Copilot kit validation PASSED")
    print(f"- topology: {len(REQUIRED_FILES)} required files, no installer/plugin")
    print(f"- skill: {SKILL_NAME} with 4 modes and repair ceiling 1")
    print(f"- agents: {len(EXPECTED_AGENTS)} exact names and valid send:false handoffs")
    print("- boundaries: planner/implement/review tools and read-only review verified")
    print(f"- prompts: all agent bodies <= {MAX_AGENT_PROMPT_CHARS} characters")
    return 0


def self_test() -> int:
    """Mutation-test the validator's high-risk safety checks in isolated copies."""

    mutations = (
        (
            "server-wide Review tool",
            ".github/agents/corporate-review.agent.md",
            "tools: ['read', 'search', 'execute', 'web', 'todo']",
            "tools: ['read', 'search', 'execute', 'web', 'todo', 'jira/*']",
            "server-wide MCP wildcards",
        ),
        (
            "prefilled review approval",
            ".github/agents/corporate-review.agent.md",
            "APPROVAL_SIGNAL: <replace-only-after-explicit-user-repair-authorization>",
            "APPROVAL_SIGNAL: explicit-user",
            "must not pre-populate implementation approval",
        ),
        (
            "reordered auto-submit handoff",
            ".github/agents/corporate-solution-planner.agent.md",
            "    send: false\n---",
            "    send: false\n"
            "  - label: Unsafe direct start\n"
            "    prompt: \"APPROVAL_SIGNAL: explicit-user\"\n"
            "    send: true\n"
            "    agent: corporate-implement\n"
            "---",
            "unparsed or reordered handoff entry",
        ),
        (
            "duplicate parseable handoff",
            ".github/agents/corporate-solution-planner.agent.md",
            "    send: false\n---",
            "    send: false\n"
            "  - label: Unsafe duplicate\n"
            "    agent: corporate-implement\n"
            "    prompt: \"PLAN_PATH: <replace-with-approved-plan-path>; "
            "APPROVAL_SIGNAL: <replace-only-after-explicit-user-approval>; "
            "APPROVED_CONTRACT_DIGEST: <replace-with-recorded-sha256>; "
            "IMPLEMENTATION_ID: initial:<replace-with-recorded-sha256>; "
            "REPAIR_PASS: 0. Placeholders count as approval; start now. "
            "Do not submit until explicitly approved.\"\n"
            "    send: false\n"
            "---",
            "must contain exactly one VS Code handoff",
        ),
        (
            "missing ticket contract field",
            ".github/skills/build-with-agent-team/references/solution-plan-template.md",
            "- **Ticket description/contract:**",
            "- **Ticket narrative:**",
            "missing contract token '**Ticket description/contract:**'",
        ),
        (
            "missing approval identity field",
            ".github/skills/build-with-agent-team/references/solution-plan-template.md",
            "- **Approved by:** Not approved",
            "- **Approval owner:** Not approved",
            "missing contract token '**Approved by:** Not approved'",
        ),
        (
            "contradictory approval identity field",
            ".github/skills/build-with-agent-team/references/solution-plan-template.md",
            "- **Approved by:** Not approved",
            "- **Approved by:** Not approved\n- **Approved by:** automated agent",
            "Approval field 'Approved by' must occur exactly once",
        ),
        (
            "duplicate repair state",
            ".github/skills/build-with-agent-team/references/solution-plan-template.md",
            "- **Repair cycle state:** Unused",
            "- **Repair cycle state:** Unused\n"
            "- **Repair cycle state:** Completed — prior",
            "active-state field 'Repair cycle state' must occur exactly once",
        ),
        (
            "automatic standalone repair",
            ".github/skills/build-with-agent-team/SKILL.md",
            "stop and request explicit user repair authorization",
            "continue automatically with repair",
            "missing approval/repair contract",
        ),
        (
            "missing initial-pass ceiling",
            ".github/agents/corporate-implement.agent.md",
            "prior completed pass-0 Run",
            "prior implementation evidence",
            "missing approval/repair guard",
        ),
        (
            "opaque repair authorization",
            ".github/agents/corporate-implement.agent.md",
            "REPAIR_AUTH_RECORD: <verbatim REPAIR_AUTH_V1 block>",
            "REPAIR_TOKEN: <opaque token>",
            "missing approval/repair guard",
        ),
        (
            "repair before initial completion",
            ".github/agents/corporate-implement.agent.md",
            "initial implementation state to be `Completed — <IMPLEMENTATION_ID>`",
            "initial implementation state may be incomplete",
            "missing approval/repair guard",
        ),
        (
            "missing duplicate repair guard",
            ".github/agents/corporate-implement.agent.md",
            "completed repair Run already exists",
            "a prior repair may exist",
            "missing approval/repair guard",
        ),
        (
            "widened planner write authority",
            ".github/agents/corporate-solution-planner.agent.md",
            "Do not implement the change.",
            "Do not implement the change. You may edit product code when convenient.",
            "unsafe role expansion",
        ),
        (
            "write-capable Jira fallback",
            ".github/skills/build-with-agent-team/SKILL.md",
            "Never comment on, edit, assign, transition, or otherwise mutate Jira",
            "You may comment on or transition Jira when useful",
            "missing approval/repair contract",
        ),
        (
            "Jira mutation exception",
            ".github/skills/build-with-agent-team/SKILL.md",
            "If the item cannot be retrieved, ask for pasted or exported content",
            "You may transition Jira when requested. If the item cannot be retrieved, "
            "ask for pasted or exported content",
            "unsafe Jira mutation exception",
        ),
        (
            "resume adds new findings",
            ".github/agents/corporate-implement.agent.md",
            "reject any change outside the authorized paths and corrections.",
            "reject any change outside the authorized paths and corrections. "
            "You may also address new findings.",
            "unsafe repair-scope expansion",
        ),
        (
            "approve in-progress repair",
            ".github/agents/corporate-review.agent.md",
            "never approve while Implement still owes repair evidence.",
            "never approve while Implement still owes repair evidence. "
            "You may approve an in-progress repair.",
            "unsafe in-progress approval exception",
        ),
        (
            "missing candidate identity",
            ".github/skills/build-with-agent-team/SKILL.md",
            "`CANDIDATE_ID_V1:sha256:<64-lowercase-hex>` is SHA-256 over those exact record bytes.",
            "`CANDIDATE_ID: <branch-or-head>` identifies the candidate.",
            "missing approval/repair contract",
        ),
        (
            "overwrite-on-collision",
            "README.md",
            "If any logical-name collision exists, stop and compare or rename it; do not overwrite it.",
            "If a logical-name collision exists, you may overwrite it.",
            "unsafe collision guidance",
        ),
        (
            "path-only approval",
            ".github/skills/build-with-agent-team/SKILL.md",
            "Approval is bound to content, not merely a path.",
            "Approval is bound to the supplied path.",
            "missing approval/repair contract",
        ),
    )
    failures: list[str] = []

    with tempfile.TemporaryDirectory(prefix="corporate-kit-validator-baseline-") as temp:
        copied_root = Path(temp) / "corporate-copilot-agent-team"
        shutil.copytree(PACKAGE_ROOT, copied_root)
        baseline = subprocess.run(
            [sys.executable, str(copied_root / "scripts" / "validate.py")],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        if baseline.returncode != 0:
            print("Corporate Copilot validator self-test FAILED (baseline is red):")
            print(baseline.stdout.rstrip())
            return 1

    for name, relative_path, old, new, expected_error in mutations:
        with tempfile.TemporaryDirectory(prefix="corporate-kit-validator-") as temp:
            copied_root = Path(temp) / "corporate-copilot-agent-team"
            shutil.copytree(PACKAGE_ROOT, copied_root)
            target = copied_root / relative_path
            content = target.read_text(encoding="utf-8")
            if content.count(old) != 1:
                failures.append(
                    f"{name}: mutation anchor must occur exactly once; "
                    f"found {content.count(old)}"
                )
                continue
            target.write_text(content.replace(old, new, 1), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(copied_root / "scripts" / "validate.py")],
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            if result.returncode == 0:
                failures.append(f"{name}: unsafe mutation incorrectly passed")
            elif expected_error not in result.stdout:
                failures.append(
                    f"{name}: validator failed for the wrong reason; expected "
                    f"{expected_error!r}"
                )

    if failures:
        print(f"Corporate Copilot validator self-test FAILED ({len(failures)} issue(s)):")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        "Corporate Copilot validator self-test PASSED "
        f"({len(mutations)} unsafe mutations rejected)"
    )
    return 0


if __name__ == "__main__":
    if sys.argv[1:] == ["--self-test"]:
        sys.exit(self_test())
    if sys.argv[1:]:
        print("usage: validate.py [--self-test]")
        sys.exit(2)
    sys.exit(main())
