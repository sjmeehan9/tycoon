# Phase 8 Implementation Context — Forty-Day Department-Store Campaign

## Entry status

Phase 8 started on 2026-08-08 from the final repaired and published Phase 7
main head. Component 8.1 is documentary setup only. It changes no application
runtime, package, dependency, deployment configuration, repository visibility,
or public release, and it stops before Component 8.2.

One sequential Implement engagement owns Components 8.1–8.9 under the approved
lean TBA + Implement contract. Each component must complete its assigned gate
before the next begins.

## Exact ancestry and Phase 7 dependency

The verified commit chain is:

1. Phase 7 original validated component head:
   `dc34856e76c44c1ec78550d249848f757e2b724c`
2. Human-approved Phase 7 PR #7 merge:
   `4e489198394cb716724652978b116f1e12810972`
3. First CI-remediation PR #8 merge:
   `cae94763ff173cd5e20741226994fea59b580a3c`
4. Final stabilization component head:
   `4b54d3f0ba34d10ce06ca6286af5716e58d4e8e2`
5. Final stabilization PR #9 merge and current `main`:
   `d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752`
6. `phase-8` base/current entry head:
   `d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752`

Read-only `git merge-base --is-ancestor` checks passed for every adjacent link.
No Component 8.1 commit was made to `main`; all Phase 8 work remains on
`phase-8`.

The final Phase 7 executable fingerprint is
`5d2da8326f5973e72c90c5e14f0796da9da08c32802ab8c6bfae891d99b55096`.
This is the sole executable dependency identity for Phase 8. Earlier Phase 7
fingerprints and the two failed merge-triggered attempts remain historical
evidence, not the Phase 8 base.

## Clean Phase 7 automated deployment identity

Read-only GitHub CLI/API inspection confirms:

- repository: `sjmeehan9/tycoon`, public, default branch `main`;
- workflow: **Deploy Laneway Tycoon to Pages**;
- run: `31246227689`, push event, completed **success**;
- run head: `d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752` on `main`;
- frozen install, build, lint, and 148 unit/component tests: PASS;
- Playwright: 67 PASS, 7 intentional project-routing skips, 0 failures;
- Pages artifact upload and deployment: PASS;
- deployment: `5806728203`;
- success status: `16540798993`;
- deployment SHA: `d3ef6d9e93be4bcded51e65a0de3e2fd9f2b7752`;
- environment: `github-pages`;
- environment URL: `https://sjmeehan9.github.io/tycoon/`.

This is completed automated workflow/deployment evidence. Component 8.1 does
not perform or claim a hosted browser, public-game, Safari, mobile-GPU,
orientation, DPR, FPS, or physical-device result.

## External setup inventory

Phase 8 reuses the existing repository, GitHub Actions workflow, GitHub Pages
environment, and local-first browser architecture. It requires no new:

- account or organisation;
- credential, token, environment variable, or secret;
- paid asset, licensed hosted content, or subscription;
- backend, database, API, analytics, telemetry, or runtime service; or
- deployment workflow, domain, repository visibility, or Pages channel.

No secret value is recorded in project documentation.

## Physical and hosted validation boundary

The user superseded every earlier representative-device reservation or agent
device-check statement:

- no agent may probe, launch, unlock, inspect, identify, reserve, or interact
  with a physical device now or later;
- no CoreDevice, `xcdevice`, `xctrace`, or equivalent device tooling is used;
- automated Chromium/touch emulation, Lighthouse, WebGL, and deployment
  evidence is never described as physical-device proof;
- any physical Safari/mobile-GPU/orientation/DPR/FPS check is optional and may
  be performed only by the repository owner against the exact final published
  Phase 8 candidate after separate merge and publication approval; and
- every physical field remains **PENDING / UNCLAIMED** until the owner supplies
  evidence. No private device identifier is stored.

The repository owner will validate the public game only when the final Phase 8
candidate is complete. Component 8.1 performs no hosted browser check.

## Reserved post-8.9 human decisions

Component 8.9 local Tier 3 PASS grants no release authority. Two separate human
decisions remain reserved and cannot be inferred from Phase 7 approval or Phase
8 implementation approval:

1. approve or reject merging the exact validated Phase 8 head; then
2. after that decision, separately approve or reject final Pages publication
   and owner-hosted verification.

If either decision is absent or rejected, no merge/publication action occurs.
If both are approved, automated GitHub workflow/API identity and owner-supplied
public-game findings are recorded separately. Optional physical findings remain
a third, distinct owner-only record.

## Downstream implementation boundaries

- Component 8.2 owns the one-time v4 reset and immutable Standard/Hard campaign
  choice. Component 8.1 starts none of that runtime behavior.
- Phase 8 remains additive to the final Phase 7 WebGL/report baseline until the
  explicit v4 boundary is implemented and validated.
- Intermediate component heads remain internally playable and must not infer a
  final release decision.
- Agents may use profiled desktop Chromium and exact touch-mobile automation,
  but never physical-device access.
- Component 8.8 owns automated local PWA, Lighthouse, bundle, and browser
  responsiveness evidence; any physical result stays owner-only.
- Component 8.9 owns the cumulative local gate and release-candidate evidence,
  then stops at the reserved human decisions.

## Component 8.1 Tier 1 evidence

The documentary gate consists only of:

- clean worktree/branch/head inspection;
- adjacent ancestry checks through the three Phase 7 merges;
- read-only repository, workflow, Pages, deployment, and status inspection;
- scoped documentary fingerprinting of the five owned files;
- `jq empty docs/phase-progress.json`;
- exact owned-file diff inspection; and
- `git diff --check`.

No application build, unit/component test, Playwright run, preview server,
workflow rerun, deployment, hosted browser session, or device operation belongs
to Component 8.1.

## Component 8.2 v4 reset and difficulty boundary

Component 8.2 is the sole breaking persistence boundary for this initiative.
Current browser saves use schema/key version 4. Any readable version 1, 2, or 3
primary, last-known-good backup, recovery candidate, or imported file passes
through one immutable allowlist converter. The converter retains exactly sound,
ambience, and reduced-motion preferences, then creates a fresh v4 envelope with
no active run, default shared meta, empty records/history, incomplete onboarding,
the planning tab selected, and a pending one-time evolution notice.

The browser adapter consumes that marker only after a validated v4 write. It
then removes every v1/v2/v3 primary and backup key. A verified v4 primary or
backup always wins over stale legacy data, so repeated startup, autosave,
recovery, export, and import cannot replay the reset or resurrect discarded
progress. Corrupt, oversized, unsupported, and structurally inconsistent input
continues to fail through the bounded save-validation contract.

The import controller also fails closed when browser storage is unavailable or
the verified write throws. It does not flip the notice marker, replace the
loaded-run/preferences/meta refs, or mutate React state until one concrete
`BrowserSaveStore.save` call succeeds. The UI reports the actionable storage
error and keeps the existing run/progress unchanged.

Every new campaign now records immutable `standard` or `hard` difficulty in the
game state, campaign identity, reports, and outcome records. Standard is the
accessible first and preselected creation option. Scenario and difficulty are
independent controls, and no post-creation command can alter difficulty.
Completed records are shown in separate Standard and Hard groups; achievements,
scenarios, cosmetics, and endless unlocks remain shared and economically neutral.

The bounded compatibility reconciliation updates the two cumulative browser
specs that previously encoded superseded v3 behavior. Current v4 report history
still settles once, exports/imports, reloads, and remains accessible. A v3 save
containing duplicate staff identities now resets at the same preferences-only
boundary; the subsequent fresh campaign still proves unique candidates, hiring,
autosave, and exact reload identity.

`src/game/demandInfluences.ts` is the single difficulty-policy authority for the
complete registered arrival and order-choice factor set. Standard applies a
1.225 multiplier to both current price-response slopes and preserves every
non-price baseline. Hard applies a 1.675 multiplier directly to every supported
baseline deviation from its declared neutral, including both price paths, with
domain-aware clamps and no Standard compounding. The engine exposes its consumed
factor identities so tests fail if the engine and registry diverge.

Because later Phase 8 venue/equipment, workforce, and parallel-service slices
change the registered venue, scheduled-team/equipment, queue/wait, and
availability ranges, Components 8.3–8.5 explicitly co-own
`demandInfluences.ts` and `tests/unit/demand.test.ts`. Their gates must update
registry metadata/bounds and preserve exhaustive Standard/Hard proofs rather
than bypassing the Component 8.2 authority.

`README.md` and `docs/agent-runbook.md` now describe the current intermediate
runtime accurately: schema v4 and immutable Standard/Hard are live, while three
venues and the 30-day target remain until later components. They also document
the preferences-only legacy reset, v4 save keys, current unique-name validation,
and honest read-only v4 reports without charge groups.

This component intentionally does not introduce the fourth venue, third
equipment tiers, expanded workforce, multi-station service, dense department-
store world, or forty-day content. Those remain sequential Components 8.3–8.7.
Automated desktop Chromium and touch-mobile checks are browser evidence only;
no physical device was accessed or claimed.
