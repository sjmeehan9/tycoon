# Solution Plan: <JIRA-KEY or task title>

## Work Item

- **Jira key:** <key or Not available>
- **Issue type:** <epic | story | bug | task>
- **Summary:** <ticket summary>
- **Ticket description/contract:** <faithful description or bounded epic slice>
- **Dependencies:** <linked or prerequisite work items, systems, and sequencing constraints, or None>
- **Linked items and attachments:** <Jira links, attachments, incidents, pull requests, or None>
- **Delivery constraints:** <dates, compatibility, compliance, security, rollout, or repository constraints, or None>
- **Owner/requester:** <name or role>
- **Source state:** <connector retrieval | pasted content | exported content>
- **Retrieved/provided:** <ISO-8601 date>

## Source References

List the Jira item, user-directed repository documents, ADRs, diagrams, logs, pull requests, and official technical sources used. Include a version and retrieval date for version-sensitive sources. State any inaccessible reference explicitly.

| Reference | Relevance | Authority/version | Accessed |
|---|---|---|---|
| <path or URL> | <what it establishes> | <authoritative/advisory and version> | <date> |

## Current Behavior

Describe the observed runtime behavior, affected user or system path, and relevant existing implementation. For a bug, include reproducible steps, expected behavior, actual behavior, and available failure evidence. Distinguish observed facts from assumptions.

## Goal

State the tightly scoped outcome in observable terms.

## Non-Goals

List adjacent behavior, refactors, migrations, hardening, and coverage work that this plan does not authorize.

## Acceptance Criteria

Copy or faithfully normalize every applicable ticket acceptance criterion. Add only criteria required to make an ambiguous criterion verifiable, and identify any addition as an assumption requiring approval.

- [ ] AC-1: <observable criterion>

## Proposed Design and Data Flow

Describe the smallest complete solution and its runtime path:

```text
<entry point> -> <validation/logic> -> <persistence or integration> -> <observable result>
```

Cover error behavior, permissions/security, compatibility, and migration only where the approved change affects them. Cite focused official research where version or compatibility affects the design.

## Affected Files, Interfaces, and Data

Name the intended files or tightly bounded paths. Define every public interface, schema, event, configuration, dependency, or persisted-data change. Write `None` for categories that are not affected.

| Area | Create/modify | Required change |
|---|---|---|
| <path/interface/data> | <create or modify> | <bounded requirement> |

## Ordered Implementation Steps

1. <complete, dependency-ordered implementation action>

Each step must map to acceptance criteria and the affected files above. Avoid optional hooks or speculative follow-up work.

## Test Intent

Define evidence proportionate to the change:

- **Existing checks to run:** <repository-native targeted tests/build/lint commands or discovery source>
- **Task-essential integration tests:** <changed boundary and acceptance criteria proved, or None with reason>
- **Minimal unit tests:** <important logic not adequately proved by integration tests, or None with reason>
- **Explicit exclusions:** no coverage-driven expansion, unrelated test repair, or dedicated Test agent

## Rollout and Rollback

Describe release, feature flag, migration, observability, and rollback actions only where applicable. Otherwise state why the repository's normal delivery path is sufficient.

## Risks

| Risk | Likelihood/impact | Mitigation or detection |
|---|---|---|
| <risk> | <assessment> | <bounded response> |

## Assumptions

List assumptions and how each was verified. Mark unverified, material assumptions as approval blockers.

## Approval

- **Status:** Pending
- **Approved by:** Not approved
- **Approval date/session:** Not approved
- **Approved plan revision:** Not approved
- **Approved contract digest:** Pending
- **Digest algorithm:** CONTRACT_DIGEST_V1
- **Digest command:** Not run

Only an explicit user invocation of `implementation <plan-path>` or explicit approval at the `full` planning gate may change this section to Approved. Before hashing, verify that every level-two heading in this template occurs exactly once, in this order, with no additional level-two headings. The approved contract digest is `sha256:<64-lowercase-hex>` over canonical UTF-8 contract text: normalize CRLF and CR line endings to LF, then hash everything before the verified `## Approval` heading. Material revisions anywhere in that protected prefix invalidate the digest and reset Approval to Pending.

## Implementation Evidence

Corporate Implement appends entries; it does not rewrite the approved design. Record approval metadata before the first product-code edit.

- **Approval cycle digest:** Pending
- **Initial implementation state:** Not started
- **Repair cycle state:** Unused

Before the first repair edit, append a `### Repair Authorization — <REPAIR_ID>` entry containing the verbatim `REPAIR_AUTH_V1` block from Review. It has the exact header, approved-digest line, reviewed-candidate line, and finding lines defined by the skill, with bytewise finding-ID order and a final LF. Preserve that record on resume and after completion.

### Run <N> — <initial implementation or repair pass 1>

- **Approved contract digest:** <digest for this run>
- **Implementation ID:** <initial:digest>
- **Repair pass:** <0 or 1>
- **Repair ID:** <stable Review-provided ID for pass 1, or None>
- **Candidate ID:** <CANDIDATE_ID_V1:sha256:...>
- **Candidate manifest:** <immutable base/HEAD, exact read-only command, and raw CANDIDATE_MANIFEST_V1 evidence path>
- **Changed files:** <paths>
- **Acceptance criteria mapping:** <criterion -> implementation/evidence>
- **Tests added or changed:** <path and why each is task-essential>
- **Commands:** <exact command, exit status, duration, concise result>
- **Unrelated failures:** <failure and why it is outside scope, or None>
- **Execution variances:** <non-contractual sequencing/tooling difference within approved scope, or None>
- **Contract revision:** <new explicitly approved digest/revision, or None; evidence alone never authorizes deviation>
- **Residual risks:** <risk, owner, and disposition, or None>
