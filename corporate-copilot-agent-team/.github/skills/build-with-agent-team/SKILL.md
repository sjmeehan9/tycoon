---
name: build-with-agent-team
description: Plan, implement, and review a tightly scoped corporate software change from a Jira epic, story, bug, or task by coordinating namespaced GitHub Copilot agents. Use for an enterprise workflow that needs one committed solution plan, an explicit approval gate, purposeful implementation with task-essential tests, and read-only review.
---

# Build With Agent Team

Coordinate a short Jira-scoped delivery chain. Keep the Jira item and user-directed references as the scope contract, preserve repository policy, and delegate each stage to the exact corporate agent named below.

## Runtime identifiers

Treat these identifiers as part of the public workflow contract:

- `MODE_PLANNING: planning`
- `MODE_IMPLEMENTATION: implementation <plan-path>`
- `MODE_REVIEW: review <plan-path>`
- `MODE_FULL: full`
- `MAX_IMPLEMENT_REPAIR_PASSES: 1`

Reject unknown modes. Require an exact plan path for `implementation` and `review`.

## Agent registry

Use only these task agents:

| Responsibility | Exact agent |
|---|---|
| Jira intake, repository analysis, focused research, and solution planning | `corporate-solution-planner` |
| Approved-scope implementation, diagnosis, and essential tests | `corporate-implement` |
| Read-only plan, diff, and evidence review | `corporate-review` |

When a custom-agent or `agent` tool is available, invoke the exact agent name. Do not substitute a generic planning, implementation, test, debug, or review agent. When exact delegation is unavailable, give the user a manual handoff containing the exact agent name, mode, Jira/reference inputs, plan path if applicable, and the stage contract below. Do not silently perform another role's work.

VS Code handoff buttons are convenience only. They do not auto-submit and GitHub.com may ignore them; this skill remains the orchestration source of truth.

## Shared rules

1. Read repository instructions, contribution guidance, architecture decisions, CI configuration, and Git policy before delegating work.
2. Treat the Jira item and references explicitly directed by the user as authoritative scope. A reference may clarify scope but may not expand it silently.
3. Use only retrieval/read operations from an already-configured Jira connector in the orchestrating surface, and pass the retrieved content to the planner. Never comment on, edit, assign, transition, or otherwise mutate Jira; never install or configure a connector. The bundled agents intentionally have no server-wide Jira/Atlassian wildcard because it could expose write operations. If the item cannot be retrieved, ask for pasted or exported content and stop planning until the scope contract is available.
4. Follow the target repository's branch, commit, push, and pull-request policy. If no policy exists, require explicit user approval before pushing or creating a pull request.
5. Never merge or force-push. Never authorize an agent to do either.
6. Keep the approved plan at `docs/solution-plans/<jira-key-or-task-slug>-solution-plan.md` and include it in version control. Do not create competing briefs, phase plans, or component breakdowns.
7. Stop for a material change to scope, architecture, public interfaces, data shape, security posture, or named acceptance criteria. Route it back to planning and approval.
8. Preserve unrelated user changes and do not repair unrelated failures.

## Approval and contract identity

The only initial implementation approval signal is an explicit user invocation of `implementation <plan-path>` or an explicit user approval while `full` is paused. A standalone `planning` run leaves the plan Pending; its continuation is the user's exact `implementation <plan-path>` invocation. Invoking `review <plan-path>` is read-only and does not authorize implementation or repair.

Approval is bound to content, not merely a path. Before hashing, require the plan's level-two headings to occur exactly once, with no extras, in the order defined by `references/solution-plan-template.md`; this proves there is one correctly positioned `## Approval` sentinel. Define the **approved contract digest** as `sha256:<64-lowercase-hex>` over canonical UTF-8 contract text: decode the plan as UTF-8, normalize CRLF and CR line endings to LF, take everything before that verified `## Approval` heading, and encode the prefix as UTF-8. The mutable Approval and Implementation Evidence sections are outside that digest. Use a repository-available SHA-256 command, record the exact command and `CONTRACT_DIGEST_V1` algorithm identifier in Approval, and never estimate the digest.

Before product-code edits:

- Compute the digest of the exact plan content the user approved.
- Ensure the plan's Approval section records non-placeholder `Status: Approved`, approving user or role, approval date or session reference, approved plan revision, exact `Approved contract digest`, `CONTRACT_DIGEST_V1`, and exact digest command.
- If it still says Pending, have `corporate-solution-planner` record the explicit approval, digest metadata, and new active-cycle state; do not infer approval from agent output or a prefilled handoff button.
- Recompute the canonical digest after the approval update. It must equal the recorded digest because Approval and Implementation Evidence are excluded. A mismatch resets the plan to Pending and requires fresh approval.
- Ensure the plan is included in version control. Commit the approved plan before product work when repository policy assigns commits at that point; otherwise it must be included in the implementation commit.
- Pass `PLAN_PATH`, `APPROVAL_SIGNAL: explicit-user`, `APPROVED_CONTRACT_DIGEST: <recorded digest>`, `IMPLEMENTATION_ID: initial:<recorded digest>`, and the repair fields required below to `corporate-implement`.

Implementation and Review independently recompute the digest before acting. Approval covers only the matching recorded contract. Any edit before `## Approval`, including a material scope or design revision, invalidates the digest, resets Approval to Pending, and requires a new explicit approval.

## Durable implementation and repair state

The plan's Implementation Evidence contains exactly one active-cycle digest, initial implementation state, and repair cycle state:

- `Approval cycle digest: <approved digest>`
- `Initial implementation state: Not started | In progress — <IMPLEMENTATION_ID> | Completed — <IMPLEMENTATION_ID>`
- `Repair cycle state: Unused | In progress — <REPAIR_ID> | Completed — <REPAIR_ID>`

On a newly approved contract digest, the planner sets the active-cycle digest, resets the two active states, and preserves every prior Run and repair-authorization record. Initial implementation uses `IMPLEMENTATION_ID: initial:<approved digest>`. Implement changes `Not started` to `In progress` before its first product edit and to `Completed` after its evidence entry. Only the same in-progress ID may resume. A fresh pass 0 against a Completed state is forbidden; another implementation cycle requires a revised protected contract and a newly approved digest.

Before Review or repair, identify the complete candidate with this exact record:

```text
CANDIDATE_MANIFEST_V1
approved-contract-digest: sha256:<64-lowercase-hex>
base: <full immutable Git object ID>
head: <full Git HEAD object ID>
entry: <lowercase-hex UTF-8 repo-relative path> | <base-mode>:<base-content-sha256> | <index-mode>:<index-content-sha256> | <worktree-mode>:<worktree-content-sha256>
```

The manifest digest line must equal the verified approved contract digest; base and HEAD are full lowercase Git object IDs. Enumerate every tracked path plus every non-ignored untracked path except the exact `PLAN_PATH`; that file's protected content is represented by the digest line, while its mutable Approval and Implementation Evidence must not create a self-referential identity. Emit an entry only when its base, index, and worktree tuples are not all identical, sorted bytewise by decoded path. A present state is `<mode>:sha256:<64-lowercase-hex>` using normalized Git mode `100644`, `100755`, `120000`, or `160000`; an absent state is exactly `-:-`. Content SHA-256 covers raw file bytes, symlink-target bytes, or the ASCII full lowercase gitlink object ID. Any invalid UTF-8 path, unmerged index entry, dirty submodule worktree, ambiguous base, or unavailable content is BLOCKED. Use LF and one final LF. `CANDIDATE_ID_V1:sha256:<64-lowercase-hex>` is SHA-256 over those exact record bytes. Record the exact read-only command and raw manifest evidence outside repository candidate paths so Review and Implement can reproduce it. This identity includes committed, staged, unstaged, deleted, mode-changed, and non-ignored untracked content without being invalidated by its own evidence.

For `CHANGES REQUIRED`, Review emits this exact `REPAIR_AUTH_V1` record, with findings sorted bytewise by finding ID:

```text
REPAIR_AUTH_V1
approved-contract-digest: sha256:<64-lowercase-hex>
reviewed-candidate: CANDIDATE_ID_V1:sha256:<64-lowercase-hex>
finding: <ID> | <severity> | <file:start-end> | <required correction>
```

Every value is one line and must not contain `|`, CR, or LF; add one LF after every line, including the final finding. `REPAIR_ID` is `sha256:<64-lowercase-hex>` over those exact UTF-8 bytes. Before first repair delegation, the coordinator verifies that the current candidate still matches `reviewed-candidate` and passes the verbatim record, not only its ID.

Implement recomputes the ID and candidate identity before changing `Unused` to `In progress — <REPAIR_ID>`, then appends the exact authorization record to Implementation Evidence before its first product edit. The same engagement, or a resumed engagement with the same ID and durable record, may finish only those findings; it verifies all partial changes remain within their authorized paths and corrections. After appending repair evidence, Implement changes the state to `Completed — <REPAIR_ID>`. A different ID, a second `REPAIR_PASS: 1`, or any repair request after `Completed` is forbidden and escalates to the user.

The coordinator and Implement inspect all three durable fields and prior Runs before delegation or editing. Never reset them on resume; reset is allowed only when recording explicit approval of a different protected contract digest.

## Modes

### `planning`

1. Resolve the Jira epic, story, bug, or task and all user-directed references.
2. Invoke `corporate-solution-planner` with the ticket content/reference, permitted reference paths or URLs, and relevant repository instructions.
3. Require one solution plan based on `references/solution-plan-template.md`.
4. Verify the plan contains the ticket contract, current behavior, goal and non-goals, acceptance criteria, design and data flow, affected files/interfaces/data, ordered steps, test intent, rollout/rollback, risks, assumptions, Approval, and Implementation Evidence.
5. Present the plan path and a concise decision summary. Leave Approval at Pending and tell the user that the exact continuation and approval signal is `implementation <plan-path>`.
6. Stop. Do not record approval or begin implementation during standalone planning.

Planning never changes product code, tests, dependencies, CI, or repository configuration.

### `implementation <plan-path>`

1. Treat the user's explicit mode invocation and exact path as the approval signal. Complete the Approval checks above. Verify the active-cycle digest matches and the initial state is `Not started` or the same ID is already `In progress`; a Completed initial state requires a revised plan and new digest instead of another pass 0.
2. Invoke `corporate-implement` with:
   - `PLAN_PATH: <plan-path>`
   - `APPROVAL_SIGNAL: explicit-user`
   - `APPROVED_CONTRACT_DIGEST: <sha256 digest recorded in the plan>`
   - `IMPLEMENTATION_ID: initial:<approved contract digest>`
   - `REPAIR_PASS: 0`
   - the relevant Jira/reference contract and repository instructions
3. Require implementation to remain within the plan's named files, interfaces, behavior, and test intent.
4. Require task-essential integration tests for changed boundaries and only the minimum unit tests needed for important logic that integration tests cannot adequately prove.
5. Require the agent to run relevant existing and new tests plus applicable build and lint commands, then append exact evidence to the plan.
6. Stop on `BLOCKED` or `PLAN DRIFT`; do not convert either into an implicit scope change.

Do not delegate to a Test agent. `corporate-implement` owns test authoring and execution for this intentionally compact workflow.

### `review <plan-path>`

1. Verify the exact plan path, complete non-placeholder Approval metadata, approved/current/active-cycle digest equality, and Completed initial implementation state with its matching completed pass-0 Run. Require repair state `Unused` for the initial review, or `Completed — <REPAIR_ID>` with its matching authorization and completed pass-1 Run for re-review. `In progress` or inconsistent state is always BLOCKED.
2. Invoke `corporate-review` with the Jira contract, approved plan and digest, repository/PR base, complete branch or PR diff, and Implementation Evidence.
3. Accept only `APPROVED`, `CHANGES REQUIRED`, or `BLOCKED`.
4. On `APPROVED`, first confirm the review-state contract above, then report the outcome and any non-blocking Minor findings.
5. On `BLOCKED`, escalate the missing authority or evidence to the user.
6. On the first `CHANGES REQUIRED`, require the canonical repair authorization and stable `REPAIR_ID`; verify the current candidate still equals its reviewed candidate, and inspect `Repair cycle state`. If it is not `Unused`, escalate instead of delegating another repair.
7. In standalone `review` mode, stop and request explicit user repair authorization. The review invocation itself and the prefilled handoff are not edit authority. Only after the user authorizes the named findings may the coordinator route them to the same `corporate-implement` engagement when possible, with:
   - `PLAN_PATH: <plan-path>`
   - `APPROVAL_SIGNAL: explicit-user`
   - `APPROVED_CONTRACT_DIGEST: <unchanged recorded digest>`
   - `IMPLEMENTATION_ID: initial:<unchanged recorded digest>`
   - `REPAIR_PASS: 1`
   - `REPAIR_AUTHORIZATION: explicit-user`
   - `REPAIR_ID: <review verdict's stable ID>`
   - `REPAIR_AUTH_RECORD: <verbatim REPAIR_AUTH_V1 block>`
8. After that repair completes and the durable state is `Completed — <REPAIR_ID>`, invoke `corporate-review` once more against the new full diff and evidence.
9. If the second review is not `APPROVED`, stop and escalate. Never authorize `REPAIR_PASS: 2`.

Enforce `MAX_IMPLEMENT_REPAIR_PASSES: 1` across resumed sessions with the durable state and prior Run entries, not an in-memory counter.

### `full`

1. Run `planning`.
2. Stop after the solution plan and request explicit user approval. State that approval authorizes the initial approved implementation and at most one in-plan repair/re-review cycle, but never plan drift. Do not begin implementation in the same uninterrupted action.
3. After approval, record it and continue as `implementation <plan-path>`.
4. Continue as `review <plan-path>`.
5. Apply the single repair and re-review rule from review mode. The recorded `full` approval supplies repair authorization for that one in-plan cycle; the durable state still prohibits another.

## Test and review boundaries

- Implementation may add integration tests that directly prove changed boundaries.
- Implementation may add minimal unit tests only for important logic not adequately proven by those integration tests.
- Do not create tests to satisfy coverage percentages, unrelated gaps, stylistic hardening, or failures that do not expose another approved requirement.
- Do not introduce a dedicated Test agent.
- Review remains read-only. It may rerun one targeted command only when recorded evidence is stale or contradictory; it never creates or edits a test.
- Review may request another test only when an approved acceptance criterion remains materially unproven.

## Completion

Complete only when:

- The approved Jira-scoped behavior is implemented without material drift.
- The current canonical contract digest matches the plan's recorded approved digest.
- The solution plan is included in version control and its Implementation Evidence is current.
- Relevant build, lint, existing tests, and task-essential new tests have recorded outcomes.
- `corporate-review` returns `APPROVED`.
- Any push or pull request follows repository policy or explicit user approval.

Report unrelated failures, deferred non-scope work, and residual risks without hiding or repairing them.
