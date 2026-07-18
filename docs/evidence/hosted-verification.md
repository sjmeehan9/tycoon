# Hosted Verification Evidence — PASS

Verified on 18 July 2026 against
`https://sjmeehan9.github.io/tycoon/` with Chromium 149.

## Release identity

- Repository: `https://github.com/sjmeehan9/tycoon` — **PUBLIC**
- Release PR: `https://github.com/sjmeehan9/tycoon/pull/1`
- Merge commit: `2e011eb63b75530a610adb177e352a1bd52f2538`
- PR check: `https://github.com/sjmeehan9/tycoon/actions/runs/29631622961/job/88046235157`
- Pages workflow: `https://github.com/sjmeehan9/tycoon/actions/runs/29631697939`
- Deploy job: `https://github.com/sjmeehan9/tycoon/actions/runs/29631697939/job/88046810765`
- GitHub deployment: `5499050417`, environment `github-pages`
- Pages configuration: workflow build, public, HTTPS enforced

PR #1 merged normally after its drift check passed. No force push, direct-main
commit, admin bypass, or protected-history rewrite was used. GitHub's protection
API reports that `main` has no configured branch-protection rule; the PR/check
workflow supplied the release gate rather than an inaccurately claimed rule.

## Workflow result

Run `29631697939` completed **SUCCESS** for the release merge commit:

- frozen dependency installation, build, lint, and 70 unit/component tests pass;
- 29 applicable production-preview Playwright journeys pass, with five explicit
  non-matching-project skips;
- the Pages artifact uploaded successfully; and
- deployment completed successfully at the public URL.

GitHub emitted two non-blocking action warnings: selected actions still declare
a Node 20 runtime that GitHub promoted to Node 24, and
`upload-pages-artifact@v4` ignored the unsupported `include-hidden-files` input.
There are no hidden runtime files in `dist`, and both upload and deployment
completed successfully.

## Hosted browser matrix

| Check | Result |
|---|---|
| Direct load and refresh | `200` / `200` at `/tycoon/` |
| Manifest | `200`, scope `/tycoon/`, start URL `/tycoon/` |
| Chromium diagnostics | Zero manifest errors; zero installability errors |
| Icons | 192px, 512px, and maskable PNGs all `200` |
| Original media | Title WebP and all three WAV files `200` |
| Title art | Complete at the original 1600px width |
| Desktop campaign | Planning, settings, service event, and Day 1 report PASS |
| Autosave | Identical Day 1 report restored after an online reload |
| Offline | Identical report restored offline under active worker control |
| 360px touch | Planning/settings tabs and service controls work by touch |
| Mobile layout | `clientWidth = scrollWidth = 360`; no undersized controls |
| Rainy forecast badge | Bounds `27.78125px`–`332.21875px` within viewport |
| Hover independence | Touch media query reports no hover capability |
| Runtime health | Zero console errors, page errors, or unexpected request failures |

The test runner captured and visually inspected desktop report and full mobile
planning screenshots; both were readable, complete, and unclipped. Chromium
cancelled one ambience preload only when the passing desktop context closed;
the same ambience file independently returned `200`, so this is classified as
expected test teardown rather than a hosted failure.

The in-app browser runtime exposed no available browser instance. The hosted
interactions therefore used the repository-standard Playwright Chromium
harness. The coordinator independently corroborated title/art/manifest,
offline-ready, campaign start, autosave reload, zero console errors, and exact
360px document/forecast bounds.

## Verdict

**HOSTED PASS.** The public release is playable, responsive, installable,
offline-safe, and persistent at `https://sjmeehan9.github.io/tycoon/`.
