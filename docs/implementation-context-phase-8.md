# Phase 8 Implementation Context — Forty-Day Department-Store Campaign

## Entry status

Phase 8 started on 2026-08-08 from the final repaired and published Phase 7
main head. Components 8.1–8.8 are committed in dependency order: the runtime is
now the complete schema-v4, Standard/Hard, 40-day, four-venue department-store
campaign and its release-ready PWA. Component 8.9 owns cumulative validation,
documentation reconciliation, candidate evidence, and the handoff to the
separate merge/publication/owner-hosted gates. It introduces no planned feature
scope; bounded source or test repairs are permitted only when the cumulative
gate exposes a reproduced release defect.

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
6. `phase-8` base/entry head:
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

- Component 8.2 established the one-time v4 reset and immutable Standard/Hard
  campaign choice before later slices extended its public contracts.
- Components 8.3–8.8 preserve the final Phase 7 WebGL/report baseline while
  completing progression, workforce, parallel service, dense presentation,
  content/history, and release readiness in dependency order.
- Every intermediate component head remains evidence only and must not infer a
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
non-price baseline. Hard applies a 1.70 multiplier directly to every supported
baseline deviation from its declared neutral, including both price paths, with
domain-aware clamps and no Standard compounding. The engine exposes its consumed
factor identities so tests fail if the engine and registry diverge.

Because the completed venue/equipment, workforce, and parallel-service slices
change the registered venue, scheduled-team/equipment, queue/wait, and
availability ranges, Components 8.3–8.5 explicitly co-own
`demandInfluences.ts` and `tests/unit/demand.test.ts`. Their gates must update
registry metadata/bounds and preserve exhaustive Standard/Hard proofs rather
than bypassing the Component 8.2 authority.

At this boundary the public documentation first adopted schema v4, immutable
difficulty, the preferences-only reset, current unique-name validation, and
honest read-only v4 reports without charge groups. Component 8.9 reconciles
those documents again against the completed Phase 8 runtime rather than leaving
an intermediate product description in release-facing files.

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

An exhaustive current-v4 E2E source audit found no other hard-coded legacy
campaign length, cafe-final, or pre-expansion venue-cardinality contract. The
deliberately scoped kiosk/cafe recovery case remains a kiosk/cafe case, and
legacy schema fixtures/docs remain historical evidence. No Canvas route,
runtime behavior, fixture migration, dependency, or Component 8.4 behavior was
added at that boundary.

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
At the 8.4 boundary, the scene snapshot still used its inherited service
projection. Component 8.5 subsequently replaced runtime service authority with
canonical station, lane, queue, and job contracts.

The registered team/equipment demand boundary now covers ten scheduled
people-person traits plus commercial POS: Standard preserves the exact
`1.05^10 × 1.07` baseline, while Hard applies the one direct configured `1.70`
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
physical-device access, Git mutation, merge, deployment, or publication belonged
to this component boundary. The approved title art remains byte-identical at SHA-256
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Component 8.5 three-station and exact parallel-service boundary

Department-store service now has three stable single-server stations in fixed
order: espresso, brew, and cold. The morning plan assigns each scheduled person
to exactly one compatible station and may route zero through three eligible
existing drinks to an express lane. Eligibility is recipe-, equipment-,
station-, and venue-derived. Every other order remains normal demand; selecting
express never creates, removes, or changes demand.

Rush state now owns bounded normal and express queues, one nullable canonical
job per station, per-station express fairness, and a monotonic job sequence.
Stations complete and start in fixed order. At most two express starts may pass
compatible normal work already waiting at the same station. Cart, kiosk, and
cafe use the same structures with one espresso station and one normal lane, so
their seeded serial outcomes remain intact.

Shared ingredients are consumed atomically and irrevocably when a job starts.
Completion does not consume again. Reload therefore resumes the exact remaining
ticks without duplicating stock, cost, activity, revenue, satisfaction, or
settlement. An unfinished job at rush end keeps its incurred ingredient cost,
records a job-linked rush-end walkaway, and creates no sale. Each completed job
appears once in one of six ordered station/lane aggregate buckets with the
rush-start staff and installed-equipment context.

Current v4 saves predating this component are canonicalized idempotently before
strict load, recovery, import, export, or write. Singular queue/service fields
are removed, live customer/activity routes are reconstructed from canonical
content, and historical report totals with no route evidence are represented
honestly as espresso/normal history with empty coverage metadata. The v1–v3
preferences-only reset policy is unchanged.

Strict active rush/event import also reconciles every current inventory total
to opening stock plus purchases minus canonical consumed totals. This check
runs before post-rush expiry and fails closed if either stock or consumption was
altered independently. Retained queued and active-job orders must still belong
to the validated morning menu, so a coherent stock forgery cannot smuggle an
off-menu order through canonical consumption evidence. Current-day customer
identities start at `c1`; service job identities deliberately start at `j0`.

Rush-start coverage metadata is populated only for station/lane pairs active at
the venue. Legacy one-station venues therefore retain staff and equipment on
espresso/normal only; their inactive station and express buckets remain empty.

The semantic service hierarchy is scene, dashboard, activity, then stock. The
dashboard reports combined and per-lane waits, all active jobs, and a
three-station strip. The representative 360×780 touch layout keeps the scaled
scene and complete compact dashboard within the initial viewport. Existing 3D
adapters intentionally project combined waiting and only the first fixed-order
active job until Component 8.6 delivers the dense multi-customer heritage hall.

Queue/wait demand reads the two canonical waiting queues exactly once; active
jobs are not counted again. Availability reads the one shared post-consumption
inventory. Standard/Hard registry authority, presentation speed independence,
the one-time v4 boundary, and the title art hash remain unchanged. No new
dependency, physical-device access, hosted release, deployment, or publication
belongs to this component.

## Component 8.6 dense multi-customer heritage hall boundary

The department-store service world now reconciles one immutable presentation
snapshot to up to three active jobs, a fair twelve-customer sample of every
non-empty station/lane queue, the newest three terminal customers, and all ten
scheduled staff. Stable `customer:<id>` and `staff:<id>` identities carry
canonical route, job, activity, status, pose, destination, and progress data.
Exact normal, express, omitted, and per-station/lane counts remain independent
of the visual cap and are exposed through accessible text and the semantic
dashboard.

Lifecycle is simulation-tick-derived. Arrivals approach only on their canonical
arrival tick; sales move through handoff, payment, then exit; stockouts and
other abandonments remain explicit before exit. Frame time adds only bounded
pose movement, never advances status, applies speed, mutates queues, consumes
stock, settles accounts, or persists state. Pause and reduced motion freeze
local movement while preserving the full hall and textual parity.

The new warm low-poly hall visibly implements patterned heritage tiles, timber
panelling and counters, brass rails and details, escalators, and three distinct
service bays. It renders every installed commercial equipment category and
four physical-upgrade anchor plaques. People, repeated furnishings, and effects
are instanced. Full and compact detail tiers retain the same entity/equipment
truth under explicit call, triangle, DPR, shadow, light, and furnishing caps.
Actual settled renderer call and triangle counts are browser-inspectable without
per-frame React state writes.

At the exact 360×780 touch target, the scaled scene and all dashboard fields
fit in the initial viewport; activity and stock follow in the approved semantic
order. Existing cart, kiosk, and cafe worlds retain their established camera and
compatibility projections. Context retry and reload preserve snapshot identity,
customer/staff identities, and the accessible scene description.

No engine, demand, routing, inventory, accounting, persistence schema,
dependency, external asset, physical-device, hosted release, deployment, or
publication change belongs to this component. Automated Chromium/touch-mobile
results remain browser evidence only. The title art remains byte-identical at
SHA-256
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Component 8.7 complete content, balance, and history boundary

The campaign is now a complete 40-day Standard or Hard experience. Standard
keeps every non-price influence at baseline and applies 1.225 to the separate
arrival and order-choice price paths. Hard applies 1.70 once to every registered
domain-supported deviation from neutral, including both price paths. Typed
bounds cover every final economy value and the engine-to-registry
exhaustiveness contract remains executable.

The department tier adds six uniquely identified service events, four visible
operational hall improvements, three presentation-only cosmetics, and two
shared non-power milestones while retaining exactly the established ten drinks
and nine ingredients. Event selection remains deterministic, bounded to zero
through two non-repeating choices per rush, and persists resolved copy and
effects so later content cannot silently rewrite history.

Every settled report may carry an immutable causal snapshot of its difficulty,
venue, menu prices, dial-in, beans, express selection, staff roles/stations and
wages, equipment, improvements, event result, queue/wait evidence, and operating
cost. Historical UI consumes only that selected report and never recomputes it
from the current plan or catalogue. Earlier current-v4 reports without captured
causes retain an honest `null` value and accessible unavailable explanation.

The deterministic balance harness uses public commands over twenty fixed seeds
for each difficulty and each of two materially different strategies. Across 80
managed campaigns, every run reached the department hall and retained all 40
causal reports; each cohort produced at least 17 victories, while both
20-campaign mismanagement cohorts reached bankruptcy. Day-40 equality,
department ownership, bankruptcy ordering, and Day-41 endless continuation are
separately proved.

No new dependency, backend, API, remote asset, food, drink, ingredient,
physical-device action, merge, deployment, or publication belongs to this
component. The title artwork remains byte-identical at SHA-256
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Component 8.8 offline, update, performance, and release boundary

The production PWA now precaches one canonical copy of the complete generated
runtime graph after a successful online load. The Workbox runtime is inlined,
the separately copied manifest/icon duplicates are ignored in favor of their
generated URLs, and the one-megabyte per-file ceiling remains enforced. Browser
evidence owns installability, `/tycoon/` routing, every-precache-entry offline
fetch, warm and cold offline reload, and an entirely offline dense department
service through exact settlement and next-day continuation.

The title screen, PWA registration, Planner, onboarding, and active rush controls
remain on the immediate application path. Other non-title gameplay panels,
audio/announcement directors, and game tools load in bounded lazy chunks with
accessible status fallbacks. This reduces the initial entry cost that gates the
title heading while retaining complete offline play: every lazy chunk is part of
the canonical precache and browser-tested offline.

A waiting worker cannot activate or reload while the game is in a rush or
service event. The prompt explains the active-service boundary and disables its
primary action. Dismissal remains dismissal only; it does not queue activation.
When service ends, the player must make a new explicit **Save and update** choice.
The current schema-v4 payload is then written, read back, structurally verified,
and given a monotonically refreshed top-level `savedAt` before `SKIP_WAITING`;
control transition and reload restore all persisted gameplay, preferences, and
meta content exactly without duplicate settlement.

The dense department renderer retains canonical simulation and snapshot truth
while reducing redundant GPU work. Full desktop detail uses a 0.9 internal
render scale and no multisample antialiasing over the existing capped DPR;
compact detail retains scale 1. Static instance colors upload only when the
immutable snapshot/layout changes. Shadows render on creation and snapshot
change instead of every display frame. Transform animation still uses the one
React Three Fiber render loop, and pause/reduced motion remain intact.

Renderer cadence is measured after thirty warm-up callbacks over 120 rendered
frame deltas. Automated desktop Chromium at 1280×800 must sustain at least 55
FPS with p95 at most 34 ms; emulated DPR-2 touch Chromium at 360×780 must sustain
at least 30 FPS with p95 at most 50 ms. The evidence records browser/version,
viewport, browser or emulated DPR, actual canvas DPR, WebGL renderer, LOD, scene
state, and method. It is explicitly not physical-device evidence. The optional
physical 30 FPS check remains owner-only, hosted, pending, and unclaimed.

The production dependency graph remains unchanged. Its current audit reports no
known vulnerability and its runtime licenses are MIT or BSD-3-Clause. Source,
built-output, and browser-request audits own proof that there is no runtime
external API, remote asset, analytics, telemetry, advertising, secret, or
personal-data path. Lighthouse 13.4.1 owns mobile Performance, Accessibility,
and Best Practices; the installed version exposes no PWA category, so the
manifest/installability/service-worker/offline browser suite owns that proof.

Release instructions now cover the forty-day, four-venue Standard/Hard
candidate; separate human merge and publication decisions; consent-safe hosted
updates; and schema-v4-compatible superseding-build recovery. Component 8.8 does
not merge, publish, deploy, alter repository settings, or claim hosted or
physical-device evidence. The title artwork remains byte-identical at SHA-256
`5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Component 8.9 cumulative candidate and evidence boundary

Component 8.9 first audits every committed 8.1–8.8 manifest and historical
scoped fingerprint, then reconciles release-facing documentation to the final
runtime. Existing deterministic, component, browser, simulation, PWA, bundle,
performance, accessibility, migration, security, and release checks already
cover every named Phase 8 target; no new runtime or test path is introduced
unless the cumulative gate exposes a real defect.

The cumulative gate exposed stale synchronous browser assertions around
post-import planner/service rendering and one genuine title-load performance
defect. Browser evidence now uses Playwright auto-retrying locators and the
existing 620px responsive contract instead of reading lazy sections or hidden
mobile tabs synchronously. `AudioDirector` now creates its local
`BrowserAudioManager` only after the first pointer or keyboard interaction, so
the title route requests no WAV resource before interaction while retaining the
same saved sound/ambience preferences, venue levels, transition cues, cleanup,
local-only assets, and complete offline cache.

After every fingerprint-included source, test, configuration, workflow, and
contract-document path is stable, the Implement engagement records one
unscoped global fingerprint and runs the exact Tier 3 sequence once under the
profile-compatible Node runtime. Lighthouse, production dependency/license,
title-hash, and network/static-output checks are supplemental named-target
proof on the same immutable candidate. The mutable command outcomes and target
map belong in the fingerprint-excluded `docs/phase-8-test-report.md`; this
context file is not edited after candidate freeze.

Lighthouse variability is governed before sampling: five sequential isolated
Lighthouse 13.4.1 reports are retained, median Performance must be at least 90,
every Accessibility and Best Practices score must be at least 90, and every
sample must be free of runtime and console-error audit failures. A selected
best run cannot satisfy the target.

Local automated PASS, deployment identity, owner-hosted gameplay verification,
and optional owner-only physical evidence are four distinct dispositions. A
local PASS authorizes neither merge nor publication. The coordinator may act
only after the reserved human decisions; the repository owner performs the
hosted gameplay checks, and physical evidence remains pending/unclaimed unless
the owner elects to supply it.
