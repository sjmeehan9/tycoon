# Component 8.1 — Human Setup and Final Release Gates

## What was delivered

A user can now rely on Phase 8 beginning from one exact, repaired, cumulatively
validated, and automatically deployed Phase 7 identity. The phase has a clean
`phase-8` branch, explicit no-new-setup inventory, a strict no-agent-device
boundary, and two separately reserved post-8.9 human decisions for merge and
final Pages publication/owner-hosted verification.

Component 8.1 is documentary only. It starts no v4 reset, difficulty, campaign,
department-store, staffing, station, content, visual, PWA, or release runtime
behavior and stops before Component 8.2.

## Public interfaces / contracts exposed

Downstream Phase 8 components may rely on:

- branch/base: `phase-8` at
  `d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752`;
- Phase 7 original validated head:
  `dc34856e76c44c1ec78550d249848f757e2b724c`;
- Phase 7 merges: PR #7 `4e489198394cb716724652978b116f1e12810972`,
  PR #8 `cae94763ff173cd5e20741226994fea59b580a3c`, and final
  PR #9/current main `d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752`;
- Phase 7 executable fingerprint:
  `5d2da8326f5973e72c90c5e14f0796da9da08c32802ab8c6bfae891d99b55096`;
- clean automated Pages run `31246227689`, deployment `5806728203`, success
  status `16540798993`, exact SHA `d3ef6d9e…`, and environment URL
  `https://sjmeehan9.github.io/tycoon/`;
- no new account, credential, secret, paid asset, backend, database, API,
  analytics, telemetry, or runtime service is required;
- no agent has physical-device authority. Any Safari/mobile-GPU/orientation/
  DPR/FPS result is optional, owner-only, exact-hosted, and **PENDING /
  UNCLAIMED** until owner evidence is supplied; and
- Component 8.9 local PASS reserves rather than grants two decisions: first the
  exact Phase 8 merge, then final Pages publication and owner-hosted
  verification.

Automated workflow/deployment identity, owner-hosted browser findings, and
optional physical findings are separate evidence classes and cannot be inferred
from one another.

## Files owned

Created:

- `docs/implementation-context-phase-8.md`
- `docs/components/phase-8-component-8-1-overview.md`

Modified:

- `docs/phase-8-component-breakdown.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

No runtime source, test, package, lockfile, build configuration, workflow,
public asset, deployment, branch visibility, or Component 8.2 file changed.

## How to run / verify

Documentary checks only:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor dc34856e76c44c1ec78550d249848f757e2b724c 4e489198394cb716724652978b116f1e12810972
git merge-base --is-ancestor 4e489198394cb716724652978b116f1e12810972 cae94763ff173cd5e20741226994fea59b580a3c
git merge-base --is-ancestor cae94763ff173cd5e20741226994fea59b580a3c d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752
gh run view 31246227689 --repo sjmeehan9/tycoon --json databaseId,workflowName,event,status,conclusion,headBranch,headSha,url
gh api repos/sjmeehan9/tycoon/deployments/5806728203
gh api repos/sjmeehan9/tycoon/deployments/5806728203/statuses
python3 scripts/worktree-fingerprint.py -- docs/phase-8-component-breakdown.md docs/implementation-context-phase-8.md docs/components/phase-8-component-8-1-overview.md docs/phase-progress.json docs/agent-team-state.md
jq empty docs/phase-progress.json
git diff --check
```

Do not run an application build, test suite, preview, hosted browser, or device
tool for this component.

## Integration notes & gotchas

- The deployed Phase 7 page is the dependency baseline, not approval to publish
  any Phase 8 candidate.
- Current runtime remains schema v3, one balanced 30-day mode, and
  cart/kiosk/cafe until later components deliberately replace those contracts.
- Component 8.2 owns the sole v4 breaking boundary and must not reuse this
  documentary component as migration implementation.
- The project profile's general representative-device target is superseded for
  agent execution by the explicit user rule recorded here. Automated
  touch-mobile/WebGL/Lighthouse evidence must remain labelled automated.
- Never record a private device identifier or infer device availability.
- Phase 8 merge approval and final publication/owner-hosted approval are
  separate, ordered decisions after local 8.9 PASS. Earlier approvals grant
  neither.
- Implement performed no Git mutation. The Lead Coordinator independently
  audited, staged, and committed the exact five-path candidate; no push, merge,
  publication, visibility change, workflow rerun, hosted browser session, or
  device access occurred.

## Spec-to-delivery map

| Acceptance criterion          | Delivered behavior / evidence                                                           | Proof                                       |
| ----------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| Exact Phase 8 base            | Branch and complete Phase 7 merge ancestry recorded                                     | Read-only Git ancestry checks               |
| Final Phase 7 PASS identity   | Executable fingerprint and PR #9 main head recorded                                     | Phase 7 report/overview plus Git identity   |
| Existing release channel      | Successful run, deployment, status, SHA, and Pages URL recorded                         | Read-only GitHub CLI/API responses          |
| No new setup                  | Full account/credential/service inventory is closed                                     | Context, progress, and team state           |
| No agent device access        | Earlier reservation wording removed; optional owner-only path remains pending/unclaimed | Breakdown/context/state reconciliation      |
| Separate final gates          | Merge and publication/owner-hosted decisions are ordered and non-inferred               | Context and progress release-gate contracts |
| Phase 8 lifecycle initialized | Phase 8 is started; 8.1 is committed; 8.2 remains untouched                            | Progress JSON and team state                |
| Documentary-only scope        | Only five owned documentation/state paths differ                                        | Exact owned-file diff                       |

## Assurance lane

`fast (lean override)`, `validationTier: targeted`.

No standard Test trigger applies because this component changes no runtime,
browser behavior, persistence, security boundary, migration, external system,
or executable configuration. No standard Review trigger applies to product
code or public runtime contracts. The Lead Coordinator retains an independent
documentary audit and commit handoff for the five-path candidate.

## Deviations and decisions

- The user superseded the original representative-device confirmation and all
  later agent/device-check language. The breakdown now assigns agents only
  automated browser evidence and reserves optional physical findings for the
  repository owner after exact final publication.
- The clean Phase 7 workflow/deployment is recorded as automated hosted evidence
  only. No public browser or physical result was inferred or collected.
- Although the profiled lean `fast` lane normally names Implement as commit
  owner, the coordinator's bounded team handoff owns audit/staging/commit for
  this component. Implement performed no Git mutation.

## Validation evidence

- Ancestry: every adjacent `merge-base --is-ancestor` check exited 0; current
  branch/head were `phase-8` / `d3ef6d9e…`.
- Repository/channel: authenticated read-only access confirmed public
  `sjmeehan9/tycoon`, default `main`, workflow-backed Pages URL.
- Automated deployment: run `31246227689` completed success for exact
  `d3ef6d9e…`; deployment `5806728203` status `16540798993` is success at the
  named Pages URL.
- No application validation ran; the inherited Phase 7 executable identity is
  `5d2da832…9b55096`.
- Documentary scope fingerprint:
  `python3 scripts/worktree-fingerprint.py -- docs/phase-8-component-breakdown.md docs/implementation-context-phase-8.md docs/components/phase-8-component-8-1-overview.md docs/phase-progress.json docs/agent-team-state.md`
  exited 0 in 0.20s with
  `5d08d5c722f7a5992dc97bfa950825d26c7e5714c3402ac86ffadecea7e53f2f`.
- Final compound Tier 1 check exited 0 in 0.04s: JSON parsed, all three
  ancestry checks passed, the scoped fingerprint remained identical,
  `git diff --check` passed, and status contained exactly the five owned paths.

## Manual tests automated

All Component 8.1 checks are read-only documentary commands. No manual browser
or device check is required or permitted for this component.

## Human tasks

No immediate account, credential, secret, provider, or device action is
required. After Component 8.9 local PASS, the human separately decides Phase 8
merge and final Pages publication/owner-hosted verification. Optional physical
evidence remains repository-owner work only if elected.
