# Laneway Tycoon Release Runbook

The current public baseline is the validated Phase 6 release. Phase 7 produces
a local merge candidate only; publication is a separate human-authorized action
and neither local PASS nor merge approval grants it.

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
`docs/public-release-checklist.md` and the candidate's current phase report.
For Phase 7 that report is `docs/phase-7-test-report.md`; it records automated
Tier 3 independently and labels the owner-led hosted-device check pending and
unclaimed until it is performed against the exact published candidate.

## 2. Human approval and protected merge

The repository owner must explicitly approve the validated phase merge and any
publication. Push the phase branch, open a pull request into protected `main`,
confirm required checks, and merge through the repository's normal
protected-branch controls. Do not bypass protection or force-push. Do not
publish an intermediate or unvalidated build. If publication is approved,
deploy the exact automated-PASS candidate at the existing public game URL; only
the owner performs the subsequent physical-device check, and no agent accesses
the device.

## 3. Enable the public repository and Pages

Skip Sections 3–5 while Component 7.6 is producing the Phase 7 merge candidate.
Use them only after the owner separately authorizes publication of the exact
validated candidate.

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

1. Load `/tycoon/` directly and after refresh; verify manifest, icons, unchanged
   title art, lazy WebGL service chunks, and all audio return successfully from
   the subpath.
2. On desktop, start a campaign, complete onboarding/planning, change settings,
   run through all three current venue worlds, an event, compact report,
   settlement, reopened report history, reload, and continue the same save.
3. At exactly 360×780 or on the nominated real mobile browser, use touch to
   confirm planning has no preview and service orders scene → complete dashboard
   → activity → stock. The scene and dashboard must fit without document scroll,
   with no clipped action, overflow, or hover dependency.
4. After the online visit, go offline, reload, continue the autosave, and return
   online.
5. Confirm the browser reports an active service worker and valid installable
   manifest, with no console registration errors.
6. Mark the hosted checklist items and append the URL, workflow run, date,
   browser/device, and results to the current release evidence. Never reuse a
   prior phase's hosted verdict by ancestry.

## 5. Recovery

If hosted verification fails, stop the release and leave the report as hosted
FAIL/PENDING. Fix forward on a branch and rerun the full gate. For an urgent
static regression, redeploy the last known-good `main` commit through the same
workflow; do not rewrite protected history. Existing players remain on the
active cached worker until they consent to a verified update.
