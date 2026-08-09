# Phase 8 Release Evidence — Forty-Day Department-Store Campaign

## Evidence model

This file is part of the executable candidate fingerprint. It defines the
stable release contents, evidence authorities, and current execution boundary;
it does not duplicate mutable post-freeze command results.

- The exact global candidate fingerprint, local commands, durations, counts,
  target map, and local verdict are authoritative only in
  `docs/phase-8-test-report.md`.
- The committed candidate SHA and component handoff are authoritative only in
  `docs/components/phase-8-component-8-9-overview.md` and
  `docs/phase-progress.json`.
- A successful GitHub Actions run, artifact, and Pages deployment prove the
  exact automated deployment identity only. They do not prove hosted gameplay.
- The repository owner's public desktop/touch/WebGL/offline/update findings are
  a separate hosted verdict.
- Optional physical Safari/mobile-GPU/orientation/DPR/FPS evidence is a fourth,
  owner-only class and remains pending/unclaimed unless supplied by the owner.

No local, deployment, hosted, or physical verdict may be inferred from another.
The user's merge and Pages-publication authorities are **APPROVED / RECEIVED**;
authority is not evidence that Git, workflow, deployment, or hosted validation
executed successfully.

## Release notes

Phase 8 completes the next-level Laneway Tycoon campaign:

- one preferences-only reset from every supported v1/v2/v3 primary, backup,
  recovery, or imported save into stable schema v4;
- immutable Standard and Hard campaigns, separate difficulty records, shared
  non-power unlocks, stronger Standard price response, and an exhaustive typed
  difficulty registry;
- a 40-day progression through cart, kiosk, cafe, and the Merriweather
  Department Store Coffee Hall;
- three validated equipment tiers in every existing category;
- a twelve-person department roster, daily scheduling for up to ten, and
  hireable Manager and Runner roles with bounded deterministic effects;
- espresso, brew, and cold station assignments; zero to three eligible express
  drinks; normal/express queues; and exact-once parallel service jobs;
- a dense snapshot-only 3D heritage hall with larger crowds, all ten scheduled
  staff, commercial equipment, physical improvements, patterned tiles, timber,
  brass, escalators, and three distinct service bays;
- six department events, four operational improvements, three cosmetics, two
  milestones, multi-seed Standard/Hard balance, and immutable causal history;
- scene-free morning planning, scene → dashboard → activity → stock service
  order, a compact day result with optional detail, and exact 360×780 service
  composition; and
- complete `/tycoon/` PWA precaching, offline continuation, consent-safe
  updates, automated renderer budgets, and release recovery instructions.
- locally bundled audio that remains available offline but creates no media
  handles or title-load audio requests until the first pointer or keyboard
  interaction.

The release adds no food, drink, ingredient, backend, account, analytics,
telemetry, advertising, remote runtime asset, or external gameplay service.

## Committed component identity audit

Each historical scoped fingerprint was independently reproduced against its
committed SHA with `python3 scripts/worktree-fingerprint.py --rev SHA -- SCOPE`.
Later changes inside earlier component scopes are the declared downstream
dependency integrations; Component 8.8's complete release-readiness scope is
unchanged at the pre-8.9 head.

| Component | Commit                                     | Reproduced scoped fingerprint                                      |
| --------- | ------------------------------------------ | ------------------------------------------------------------------ |
| 8.1       | `b804bce8b7600573e621a218c85897629d720f61` | `5d08d5c722f7a5992dc97bfa950825d26c7e5714c3402ac86ffadecea7e53f2f` |
| 8.2       | `99823c02423d611d52f8edf217adfa4ee4936510` | `9434536ff79e7807134246cb4beb5073d61d61b9048cb97824294848fbb2b2b8` |
| 8.3       | `fcae3f4083481ea1ee76140b12d3238a56d6519e` | `3f9f94858ea0aef70bb5e83243a854ea1837efaded2d5aecda9e91e408253067` |
| 8.4       | `f030f5683fe14edaa9c81d571187e0d683875388` | `64dd0298c9cdcf6973b55fe1882106252e893f065adc5a727c07a5fc8cb4c3e5` |
| 8.5       | `65415c492b20fe2f9777a459bf3e4e4485a38abb` | `af1212722978e7c4991e0f65d28bcc7eca7ea831f842a6b9740163df4acb1c6f` |
| 8.6       | `01daa1c7094a363148e712fa7ca0277b023321ba` | `ea3595b9dbc5c3f9527286085e280a62e42b2458684175cf6162b82f32c766d9` |
| 8.7       | `3e893395cec89a9e6c97ebe4e0d161233e633c08` | `26993a25d79469bcbcadf93f711e42e83c6f989b184452640f0c652e60394cdb` |
| 8.8       | `86b99e93c52d9102e5af7d013d3b67674b1273e5` | `292d06c8b4260cc1500474c90ca13b27f10a40bd21ae07ca047d0a1b19619e3b` |

## Local automated candidate

The release candidate is eligible for merge consideration only if the exact
unscoped fingerprint in `docs/phase-8-test-report.md` records PASS for:

1. `pnpm install --frozen-lockfile`;
2. `pnpm build`;
3. `pnpm lint`;
4. `pnpm test`;
5. `pnpm test:e2e`; and
6. the separately mapped Lighthouse, dependency/security/license, title-hash,
   and static/runtime-network checks.

Because Lighthouse is intentionally variable, the performance disposition uses
five sequential isolated Lighthouse 13.4.1 samples on the unchanged production
preview. The median Performance score must be at least 90, every Accessibility
and Best Practices score must be at least 90, and no sample may contain a
runtime or console-error audit failure. Every raw report is retained; no best
sample may substitute for the complete set.

The target map must cover the complete reset matrix, difficulty registry and
both price paths, four-venue/three-tier progression, department workforce,
three-station parallel settlement, dense hall and 360×780 layout, complete
40-day content/balance/history, PWA/offline/update behavior, and all enduring
Phase 1–7 journeys. A sampled browser subset cannot satisfy this gate.

## Merge and deployment identity — authorized; second stabilization pending

The original Component 8.9 candidate commit `b3b5320` was merged to exact main
`c28ad429` under the received merge authority. Merge-triggered GitHub Pages run
`31273149320` passed frozen install, production build, and lint. Vitest completed
219 other cases, but the deterministic 120-campaign balance proof exceeded its
explicit 15-second outer timeout at 19.632 seconds on Linux. Browser testing,
artifact upload, and deployment were skipped. Therefore Phase 8 still has no
successful Pages deployment identity or hosted verdict.

The stabilization candidate raises only that proof's outer hang-protection
budget to 45 seconds while retaining every seed, strategy, difficulty,
mismanagement simulation, and assertion. Three focused repetitions completed
the 120-campaign proof in 5.64, 5.52, and 5.45 seconds.

Its first uninterrupted Tier 3 browser matrix exposed one additional genuine
release-margin defect: 87 applicable cases passed, eight project-routing cases
skipped intentionally, and the dense desktop hall alone measured 52.72 FPS
against the unchanged 55 FPS contract. Every functional assertion and the
22.8 ms p95 contract passed. Five untouched diagnostic samples reproduced a
51.85 FPS median, so the candidate was not rerun or accepted selectively.

The production repair replaces per-fragment PBR materials only on repeated
low-poly hall decorations, people, and bounded activity cues with Lambert
lighting. Geometry, transforms, colours, opacity, shadows, entity/count truth,
animation, full LOD, 0.9 render scale, the 55 FPS threshold, and p95 threshold
remain unchanged. Five sequential repaired samples all passed at 58.80, 59.91,
57.05, 58.32, and 58.52 FPS (median 58.52; p95 19.2–21.0 ms).

That repaired candidate was required to pass a fresh complete Tier 3 gate and
all candidate-bound supplements. For each accepted stabilization merged under
the already received authorities, `.github/workflows/deploy-pages.yml` records:

- validated candidate commit and merged `main` commit;
- pull request and merge method;
- workflow run ID, URL, event, conclusion, and exact head SHA;
- Pages artifact/build identity;
- deployment ID, status ID, environment, timestamp, and reported URL; and
- proof that the published commit descends from the locally validated candidate.

The first stabilization subsequently passed exact Tier 3 and all supplements
as global fingerprint
`280caa0bd772d94b893718b6300952263cb01bd16b717b7b6f71faf6079e32e1`.
It was committed as `b7aba4df943a190943a9fb627bbb6c0fb679558f` and merged to
exact main `864c1703c0ed08a259bdae13074450bac7ce12d0`. Merge-triggered
Pages run `31289567300` passed frozen install, production build, lint, and all
unit/component tests. Its browser job then completed with 85 applicable cases
passed, eight intentional project-routing skips, and three failures; artifact
upload and deployment were skipped, so Phase 8 still has no successful Pages
deployment identity or hosted verdict.

The dense desktop hall ran all three attempts on Chromium 149's
`SwiftShader Device (Subzero)` CPU-only software WebGL renderer. They measured
17.28, 17.50, and 17.57 FPS, 55.5–56.9 ms median frame time, and 65.4–66.7 ms
p95 against the unchanged 55 FPS/34 ms release contract. This backend is a
different capability class from the accepted local SwiftShader LLVM renderer;
Chromium flags cannot select LLVM on the hosted runner. Desktop and touch stock
journeys also failed their initial 8,500 ml assertion after one coherent 220 ml
service-start consumption had already produced 8,280 ml. Every retry reproduced
the respective environment/timing condition.

The workflow therefore marks only exact GitHub Actions Subzero desktop cadence
as a non-authoritative software observation. Selection fails closed unless
`GITHUB_ACTIONS` is exactly `true` and the actual renderer contains the exact
Subzero signature. The journey still executes and retains all 30 warm-up and
120 measured callbacks, raw FPS/median/p95/duration, exact 55/34 constants,
full LOD, 0.9 render scale, canonical entity/registry evidence, settled
draw-call/triangle budgets, and the page's measured budget state. Default
desktop mode and all touch runs remain calibrated authorities and enforce their
unchanged 55/34 and 30/50 thresholds plus page PASS. Unknown modes, local
observation attempts, and renderer mismatches fail; no threshold, retry, skip,
timeout, LOD, content, or gameplay assertion is reduced.

The stock journey now creates a causal time-zero barrier with Playwright's
clock and the real Pause/Resume controls. Before browser time resumes, it proves
the engine is paused at tick zero with no service activity. Lazy rendering then
proceeds while service remains paused, the exact 8,500 ml live and 500 ml expiry
state is asserted, and normal 4× service resumes before every existing exact
depletion, reload, expiry, charge, and reconciliation check. Three consecutive
desktop/touch repetitions passed with retries disabled and no force, sleep, or
timeout change.

A predeclared five-run default calibrated set then passed once at 57.74 FPS and
failed at 48.12, 45.77, 47.98, and 49.86 FPS, while every p95 remained within
21.8–31.2 ms. The final bounded renderer optimization changes only the
department hall: remaining Standard materials become Lambert on opaque
masonry, timber, trim, and general surfaces, or Phong on brass/equipment
surfaces where highlights matter. Colours, emissive/opacity/transparent cues,
geometry, transforms, counts/entity truth, shadows, lights, LOD, 0.9 scale,
animation, visual story, gameplay, and the 55/34 contract are unchanged; no
other scene is touched.

Five fresh consecutive default calibrated samples all passed individually at
59.02, 55.70, 60.13, 59.98, and 60.22 FPS, with p95 values of 20.1, 24.5,
18.4, 19.6, and 18.9 ms. Each retains full LOD, 0.9 scale, 30 warm-up callbacks,
120 measured callbacks, and the exact 55 FPS/34 ms authority. That candidate
froze as global fingerprint
`841466d8b79404b409ef4d90445e4d74edc3f1d6b431e6a554ae4c37962032b1`.

Its exact Tier 3 install, build, lint, and all 220 unit/component cases passed.
The first calibrated dense-hall case then measured 54.59 FPS against 55, with a
passing 16.6 ms median and 25.1 ms p95. The matrix was terminated immediately:
seven earlier cases passed, two project-routing cases skipped, the following
case was interrupted only by termination, and 85 cases did not run. No blind
rerun, threshold relaxation, or selective acceptance followed.

The final bounded optimization changes the department hall's nine remaining
Phong materials to Lambert. Per-fragment specular is not required for the
low-poly tycoon aesthetic; exact base colours retain normal/bright-brass and
equipment distinctions, and the canopy retains its colour, emissive
colour/intensity, opacity, and transparency. Geometry, transforms, counts and
entity truth, shadows, lights, LOD, 0.9 scale, animation, visual story,
gameplay, workflow, tests, and 55/34 thresholds remain unchanged, and no other
scene is touched.

Five fresh consecutive default calibrated samples all passed individually at
57.70, 60.12, 60.17, 60.08, and 60.10 FPS, with p95 values of 18.6, 18.6,
18.6, 18.4, and 18.5 ms. Every sample retained SwiftShader LLVM, full LOD,
0.9 scale, 30 warm-up callbacks, 120 measured callbacks, and the exact 55
FPS/34 ms authority. The minimum FPS margin is 2.70 and the maximum p95 is
18.6 ms. This new candidate must pass one fresh exact Tier 3 gate and every
candidate-bound supplement before the coordinator may commit, merge, or resume
release execution.

Current [official GitHub Pages custom-workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
rechecked on 2026-08-09, continues to use `actions/configure-pages@v5`,
`actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`, with
`pages: write`, `id-token: write`, an explicit `github-pages` environment, and
a build dependency. The repository workflow already matches that contract, so
the current stabilization changes only the E2E renderer-observation environment
described above and does not alter the Pages deployment contract.

## Owner-hosted verdict — pending

The repository owner will validate the exact published candidate at
`https://sjmeehan9.github.io/tycoon/`. Until the owner supplies results, hosted
desktop/touch/WebGL2/offline/update gameplay is **PENDING** and no hosted PASS is
claimed. The owner checklist covers:

- direct load, hard refresh, `/tycoon/` assets, manifest, controller, and
  runtime health;
- desktop 1280×800 and touch 360×780 planning/service/report/history flows;
- schema-v4 save/reload and a complete Standard or Hard campaign continuation;
- scene → dashboard → activity → stock order and initial-viewport geometry;
- one-load warm/cold offline continuation and exact-once service settlement;
  and
- a real waiting-worker deferral and explicit safe-phase update.

The owner records the hosted verdict against the workflow, deployment, commit,
and URL above. A workflow success alone is not a hosted-browser PASS.

## Optional physical evidence — pending and unclaimed

Agents do not access, reserve, identify, or claim a physical device. If the
owner elects to test one after publication, owner-supplied evidence records
device model, OS/browser, orientation, viewport/DPR, GPU/renderer, dense scene,
sampling method, FPS/p95, touch usability, and the 30 FPS disposition. Until
then every physical field is **PENDING / UNCLAIMED**.

## Failure and recovery

A local failure stops the candidate before merge. A workflow/deployment or
owner-hosted failure stops the release against the exact published identity.
Use the schema-v4-compatible superseding-build process in
`docs/release-runbook.md`; do not force-push, rewrite protected history, clear
player storage as a remedy, manually replace cached assets, or infer a rollback
is compatible. An emergency last-known-good deployment requires explicit owner
approval and proven schema-v4 compatibility.
