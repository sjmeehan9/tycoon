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

## Component 8.3 fourth venue and commercial equipment boundary

The active v4 runtime now has one canonical progression order: cart, kiosk,
cafe, then the Merriweather Department Store Coffee Hall. The new venue keeps
the existing ten-drink catalogue, declares ten scheduled-team slots, supports a
24-person base queue, carries higher demand and operating cost, and requires a
funded, reputable cafe promotion. The campaign closes on Day 40; victory now
requires this fourth venue, configured cash, and configured reputation.
Bankruptcy still resolves first at day close, target equality is safe, and a
victory can continue into Day 41 endless play.

Every one of the six existing equipment categories now has three validated
tiers. Tier data owns purchase price, daily maintenance, reliability, venue
requirement, readable effect, and bounded numeric service effects. Engine and
inventory consumers look up the installed tier rather than branching on a
fixed level. The commercial grinder, espresso line, brewer, chilled store, POS,
and collection island therefore change real quality, throughput, chilled-stock
life, demand, or queue capacity. Refrigeration level three extends only live
chilled batches by the configured delta and preserves exact inventory
conservation through expiry.

The demand registry remains the sole Standard/Hard authority. Its venue clamp
now admits the department-store factor and exact Hard deviation; its
team/equipment clamp and source metadata admit the current eight-person roster
plus commercial POS. Component 8.4 still owns the expanded ten-person roster,
Manager/Runner roles, and the next team-bound update.

The department service scene is a bounded snapshot-only WebGL heritage hall.
It exposes the exact engine queue count and 24-plus-equipment capacity, one
service counter, current staff/equipment/stock/activity truth, overflow, and
reduced-motion behavior. It deliberately contains no station or express-lane
authority; those remain Component 8.5. Automated desktop Chromium and exact
360×780 touch evidence verifies promotion, reload, ten-item planning, all six
commercial tiers, the department hall, and the Day-40 outcome path. No physical
device, hosted release, deployment, merge, new dependency, account, credential,
secret, or external service was used or claimed.

### Component 8.3 coordinator-audit reconciliation

The coordinator's first Component 8.3 audit found three retained current-v4
browser contracts that had not advanced with the runtime. The repaired
operations journey now proves the complete cart → kiosk → cafe → department
promotion chain and recognizes only the department hall as the completed
flagship. Save transfer restores the exact Day-40 department fixture while
retaining its older-report detail assertions. Service-layout coverage now
iterates canonical `VENUE_IDS`, so scene-free planning and desktop/touch service
composition automatically cover all four venues.

An exhaustive current-v4 E2E source audit found no other genuine `/30`, Day
30/31, cafe-final, or hard-coded all-three-venue contract. The deliberately
scoped kiosk/cafe recovery case remains a kiosk/cafe case, and legacy schema
fixtures/docs remain historical evidence. No Canvas route, runtime behavior,
fixture migration, dependency, or later Component 8.4 behavior was added.

## Component 8.4 department workforce and operational roles boundary

Workforce capacity now has one typed authority with independent roster and
daily schedule limits. Cart, kiosk, and cafe retain their eight-person roster
and respective two-, three-, and five-person schedules. The department hall
supports a twelve-person roster for rotation and accepts zero through ten
scheduled people; engine and import validation reject eleven. The older
`VenueConfig.staffCapacity` and `VENUE_STAFF_CAPACITY` names remain derived
schedule projections only, so they cannot compete with the new authority.

Every deterministic daily pool now contains one Barista, Front of house,
Manager, and Runner with collision-free names and role-specific wage premiums.
Managers and Runners can be hired and scheduled only at the department hall.
Their role contracts are exhaustive across generation, UI labels/value,
persistence, public exports, and scene colours. Canonical staff IDs bind seed,
day, and pool slot; v4 imports verify the corresponding name, role, attributes,
wage, trait, hire day, current-day pool completeness, per-venue eligibility,
schedule membership, and exact rush/report payroll.

The two new effects are pure, bounded, and applied exactly once when an order's
preparation ticks are created. Department coordination starts with fixed work
plus an installed-equipment reliability deficit; scheduled Managers reduce
that combined delay. Department replenishment/handoff work has a fixed delay;
scheduled Runners reduce it without reading, reserving, consuming, or creating
inventory. Both paths clamp at one remaining tick, so duplicate roles cannot
erase work or bypass equipment/staff requirements. Non-department calculations
retain zero added workload and their seeded outcomes.

Planner cards expose each role, trait, exact per-day wage, and role value. The
department team panel reports the twelve-person roster, ten-person schedule,
exact payroll, and applied Manager/Runner reductions; an eleventh checkbox is
disabled with a visible live capacity explanation. Day reports preserve exact
payroll and add the applied role counts, reductions, remaining delays, and
equipment-reliability contribution to the optional causal explanation list.
The scene snapshot still carries one bounded list of ten scheduled roles into
one queue and one active service. Stations, express priority, and parallel
settlement remain exclusively Component 8.5.

The registered team/equipment demand boundary now covers ten scheduled
people-person traits plus commercial POS: Standard preserves the exact
`1.05^10 × 1.07` baseline, while Hard applies the one direct configured `1.675`
deviation inside the updated `2.3` clamp. No role code applies difficulty a
second time.

Two coordinator-approved current-v4 clarifications remain deliberately narrow.
The retained operations journey now says it hires both cart-eligible roles,
without weakening its payroll or equipment assertions. Strict canonical
time-binding corrected the shared dense-rush fixture so multi-day workforces
use their real active day; the WebGL journey derives only its import-day and
day-bound customer identity assertions while retaining every world, save,
reload, segment, walkaway, Canvas-removal, and WebGL check. Existing staff-name
and report-history browser files required no mutation and passed unchanged.

No schema/key bump, dependency, station, express lane, parallel service,
physical-device access, Git mutation, merge, deployment, or publication belongs
to this component. The approved title art remains byte-identical at SHA-256
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.
