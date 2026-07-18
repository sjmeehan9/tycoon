# Laneway Tycoon Public Release Checklist

This checklist is deliberately split at the human gate. Preparing and locally
validating the release does not authorize publication or a visibility change.

## Automated release candidate

- [ ] The exact validation sequence passes from a frozen lockfile.
- [ ] Production preview loads at `/tycoon/` on desktop and 360px touch-mobile.
- [ ] One online load supports an offline relaunch and saved-run continuation.
- [ ] Update deferral preserves active play; accepted update verifies a save
      before activation and restores it after reload.
- [ ] Manifest, 192px/512px/maskable icons, scene, and all audio load from the
      repository subpath.
- [ ] Lighthouse mobile meets the project-profile thresholds where exposed.
- [ ] Bundle inspection confirms there is no runtime external request, secret,
      telemetry, advertising, or personal-data path.
- [ ] `docs/phase-3-test-report.md` records local PASS.

## Required human gate

- [ ] Approve Phase 3 and the public free/open-source release.
- [ ] Merge the validated phase branch through the protected-main workflow.
- [ ] Change `sjmeehan9/tycoon` visibility to **Public**.
- [ ] In Settings → Pages, choose **GitHub Actions** as the publishing source.
- [ ] Run or observe the `Deploy Laneway Tycoon to Pages` workflow on `main`.
- [ ] Confirm the deployment environment reports
      `https://sjmeehan9.github.io/tycoon/`.

## Hosted verification

- [ ] Load the public URL directly and confirm all `/tycoon/` assets return 200.
- [ ] Start a campaign, change settings, reload, and continue the same autosave.
- [ ] Complete the compact desktop and 360px touch flows without clipping.
- [ ] Reload offline after one online visit and continue the saved campaign.
- [ ] Confirm no console/service-worker registration errors and record hosted
      PASS in `docs/phase-3-test-report.md`.
