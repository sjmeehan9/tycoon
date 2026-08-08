# Phase 8 Release Evidence — Forty-Day Department-Store Campaign

## Evidence model

This file is part of the executable candidate fingerprint. It defines the
stable release contents, evidence authorities, and remaining human gates; it
does not duplicate mutable post-freeze command or deployment results.

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

## Deployment identity — pending separate approval

Phase 8 has no deployment identity in this candidate file. After local PASS,
the repository owner must first approve the exact merge and then separately
approve Pages publication. Only then may the coordinator push/open a pull
request, merge through the normal checks, observe the existing
`.github/workflows/deploy-pages.yml` workflow, and record:

- validated candidate commit and merged `main` commit;
- pull request and merge method;
- workflow run ID, URL, event, conclusion, and exact head SHA;
- Pages artifact/build identity;
- deployment ID, status ID, environment, timestamp, and reported URL; and
- proof that the published commit descends from the locally validated candidate.

Current [official GitHub Pages custom-workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
rechecked on 2026-08-09, continues to use `actions/configure-pages@v5`,
`actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`, with
`pages: write`, `id-token: write`, an explicit `github-pages` environment, and
a build dependency. The repository workflow already matches that contract, so
Component 8.9 changes no workflow.

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
