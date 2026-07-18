# Laneway Tycoon Public Release Checklist

This checklist records the local candidate, explicitly approved publication,
and hosted verification completed on 18 July 2026.

## Automated release candidate

- [x] The exact validation sequence passes from a frozen lockfile.
- [x] Production preview loads at `/tycoon/` on desktop and 360px touch-mobile.
- [x] One online load supports an offline relaunch and saved-run continuation.
- [x] Update deferral preserves active play; accepted update verifies a save
      before activation and restores it after reload.
- [x] Manifest, 192px/512px/maskable icons, scene, and all audio load from the
      repository subpath.
- [x] Lighthouse mobile meets the project-profile thresholds where exposed.
- [x] Bundle inspection confirms there is no runtime external request, secret,
      telemetry, advertising, or personal-data path.
- [x] `docs/phase-3-test-report.md` records local PASS.

## Required human gate

- [x] Approve Phase 3 and the public free/open-source release.
- [x] Merge the validated phase branch through the normal PR/check workflow.
- [x] Change `sjmeehan9/tycoon` visibility to **Public**.
- [x] Configure GitHub Pages with the **GitHub Actions** workflow source.
- [x] Run and observe the `Deploy Laneway Tycoon to Pages` workflow on `main`.
- [x] Confirm the deployment environment reports
      `https://sjmeehan9.github.io/tycoon/`.

## Hosted verification

- [x] Load the public URL directly and confirm all `/tycoon/` assets return 200.
- [x] Start a campaign, change settings, reload, and continue the same autosave.
- [x] Complete the compact desktop and 360px touch flows without clipping.
- [x] Reload offline after one online visit and continue the saved campaign.
- [x] Confirm no console/service-worker registration errors and record hosted
      PASS in `docs/phase-3-test-report.md`.
