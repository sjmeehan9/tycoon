# Phase 6 Release Evidence — LOCAL PASS — HOSTED PENDING

Generated on 18 July 2026 for the unmerged `phase-6` release candidate.

## Local release identity

- Feature branch: `phase-6`
- Validated feature head: `cea3cc0d54a5cd55458e206959dc115ce776e84b`
- Pushed remote-tracking feature ref: `origin/phase-6` at the same commit
- Observed `origin/main`: `81e74dd5ff393229ba2f883747d07c5baa4c4986`
- Relationship before the evidence commit: `origin/main` is the candidate's
  ancestor; Phase 6 is 13 commits ahead and is not merged into `origin/main`
- Existing public URL: `https://sjmeehan9.github.io/tycoon/`
- Candidate publication status: **NOT DEPLOYED — HUMAN APPROVAL REQUIRED**

No repository setting, `main` ref, workflow, deployment, or public site was
changed while producing this local evidence.

## Local gate

| Evidence           | Result                                                   |
| ------------------ | -------------------------------------------------------- |
| Frozen install     | PASS — pnpm 10.15.0, lockfile unchanged                  |
| Strict build       | PASS — TypeScript and Vite production bundle             |
| Lint/format        | PASS — zero ESLint warnings, Prettier clean              |
| Unit/component     | PASS — 119/119                                           |
| Production browser | PASS — 47 applicable; 7 intentional routing skips        |
| Desktop project    | PASS — 1280×800 Chromium                                 |
| Touch project      | PASS — 360×780, touch, mobile Chromium                   |
| PWA/offline/update | PASS locally against the production preview              |
| Phase 4 pricing    | PASS — exact charge/revenue/cash reconciliation retained |
| Phase 5 inventory  | PASS — dated LIFO/expiry/report conservation retained    |

The exact command transcript and criterion mapping are recorded in
`docs/phase-6-test-report.md`.

## Phase 6 production-browser matrix

| Check                                                | Local result          |
| ---------------------------------------------------- | --------------------- |
| Ordered arrival/service/sale/walkaway evidence       | PASS                  |
| All four walkaway reasons and exact readable labels  | PASS                  |
| Exact queue 12, eight sprites, `+4`, counter segment | PASS                  |
| Actual sale `$7.25` and stockout parity              | PASS                  |
| 4× frame budget and pause freeze                     | PASS in both projects |
| Reduced-motion static truth and reload               | PASS in both projects |
| Bounded rush-end departures and stopped report RAF   | PASS in both projects |
| Duplicate-name import repair and hire/reload         | PASS in both projects |
| Final endless Day 10,000 candidate pool              | PASS in both projects |
| 360px document containment                           | PASS                  |

Fresh captures were emitted by the final browser run:

- `test-results/living-rush-living-rush-sc-e8f68-n-truth-within-fixed-bounds-desktop-chromium/living-rush-static.png`
- `test-results/living-rush-living-rush-sc-e8f68-n-truth-within-fixed-bounds-touch-mobile/living-rush-static.png`

Both were visually inspected. The responsive HUD, queue plaque, counter,
segment-distinct people, overflow, sale, and walkaway evidence are readable and
remain inside the Canvas in desktop and mobile captures. They are local runtime
artifacts rather than platform-sensitive committed golden files.

## Determinism and bounds audit

- Rush activity retains at most 80 ordered events with one monotonic sequence
  authority. Renderer time does not create, reorder, or persist observations.
- Canvas playback retains at most three transients and eight queue motions,
  consumes sequence IDs once, and caps frame catch-up. It never dispatches an
  engine command or writes cash, revenue, inventory, queue, or PRNG state.
- Name allocation directly addresses 40,000 candidate ordinals inside a tested
  65,536-name bijective namespace. It stores no seen-name history and performs
  no rejection sampling.
- Migration repair is stable, changes later duplicate names only, and draws from
  a 25,536-name candidate-disjoint range. Its loop is finite; live people remain
  bounded to eight hires plus four candidates.
- Save schema remains version 3. Current and compatible version-1/version-2
  migration, byte limits, backup recovery, export/import, activity validation,
  dated inventory validation, and duplicate ID validation all pass.

## Pending human-approved release fields

These fields must remain pending until the repository owner explicitly approves
the final release and the merged commit is deployed:

| Hosted field                               | Status / value     |
| ------------------------------------------ | ------------------ |
| Human merge/publication approval           | **PENDING**        |
| Phase 6 pull request URL                   | **PENDING**        |
| Reviewed merge commit on `main`            | **PENDING**        |
| Required checks result                     | **PENDING**        |
| GitHub Pages workflow run URL              | **PENDING**        |
| Pages deployment ID/result                 | **PENDING**        |
| Deployed commit matches approved merge     | **PENDING**        |
| Public direct load `/tycoon/`              | **PENDING**        |
| Public hard refresh and asset 200s         | **PENDING**        |
| Hosted desktop living activity/scene       | **PENDING**        |
| Hosted 360px activity/scene containment    | **PENDING**        |
| Hosted unique staff import/hire/Day 10,000 | **PENDING**        |
| Hosted autosave refresh/reload             | **PENDING**        |
| Hosted service-worker control/update       | **PENDING**        |
| Hosted offline reload/continuation         | **PENDING**        |
| Hosted console/page/request health         | **PENDING**        |
| Final hosted verdict                       | **HOSTED PENDING** |

## Required hosted verification after approval

1. Merge the validated `phase-6` commit through the repository's normal review
   and check workflow; do not force-push or bypass history.
2. Observe the main-only Pages workflow and record its run, job, deployment, and
   exact deployed commit.
3. Load and hard-refresh the public `/tycoon/` subpath; verify the document,
   manifest, icons, scene art, audio, JavaScript, CSS, and service worker return
   successfully.
4. On desktop, exercise the living rush through arrival/service/sale/walkaway,
   pause/4×/reload/report, then import/hire/reload repaired staff names.
5. At 360px touch, repeat queue overflow, sale/walkaway text parity, staff-name
   flow, and containment without hover or clipping.
6. After an online controlled visit, reload offline and continue the identical
   autosave; return online and confirm update behavior and zero unexpected
   console, page, or request errors.
7. Replace every pending field with evidence and only then record **HOSTED
   PASS**.

## Local verdict

**LOCAL PASS — HOSTED PENDING.** The branch is ready for the final human
approve/reject gate. This document does not authorize or claim a merge,
publication, workflow run, deployment, or hosted result.
