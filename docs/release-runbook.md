# Laneway Tycoon Release Runbook

This runbook starts from the validated `phase-3` release candidate. Publication
is a human-authorized action; the local PASS does not grant that authority.

## 1. Reproduce local PASS

Use Node.js 22.12+ and pnpm 10:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

For performance evidence, serve the production build in one terminal:

```bash
pnpm preview
```

Then run `pnpm audit:lighthouse` in another. Confirm Performance,
Accessibility, and Best Practices are each at least 90. Review
`docs/public-release-checklist.md` and `docs/phase-3-test-report.md`.

## 2. Human approval and protected merge

The repository owner must explicitly approve Phase 3 and public release. Push
`phase-3`, open a pull request into protected `main`, confirm required checks,
and merge through the repository's normal protected-branch controls. Do not
bypass protection or force-push.

## 3. Enable the public repository and Pages

In `sjmeehan9/tycoon` on GitHub:

1. Settings → General → Change repository visibility → **Public**; confirm the
   consequences and repository name.
2. Settings → Pages → Build and deployment → Source → **GitHub Actions**.
3. Actions → **Deploy Laneway Tycoon to Pages** → run the workflow on `main` if
   the merge-triggered run is not already active.
4. Confirm the `github-pages` environment reports
   `https://sjmeehan9.github.io/tycoon/`.

The workflow needs no custom secret. It reads source, validates the complete
release, uploads `dist/`, and uses only standard Pages OIDC permissions.

## 4. Hosted verification

Using the confirmed public URL:

1. Load `/tycoon/` directly and after refresh; verify manifest, icons, title
   art, Canvas scene, and all audio return successfully from the subpath.
2. On desktop, start a campaign, complete onboarding/planning, change settings,
   run through an event/report, reload, and continue the same save.
3. At 360px or a real mobile browser, use touch to repeat the compact planning
   and settings flow; confirm no clipped action, overflow, or hover dependency.
4. After the online visit, go offline, reload, continue the autosave, and return
   online.
5. Confirm the browser reports an active service worker and valid installable
   manifest, with no console registration errors.
6. Mark the hosted checklist items and append the URL, workflow run, date,
   browser/device, and results to `docs/phase-3-test-report.md`.

## 5. Recovery

If hosted verification fails, stop the release and leave the report as hosted
FAIL/PENDING. Fix forward on a branch and rerun the full gate. For an urgent
static regression, redeploy the last known-good `main` commit through the same
workflow; do not rewrite protected history. Existing players remain on the
active cached worker until they consent to a verified update.
