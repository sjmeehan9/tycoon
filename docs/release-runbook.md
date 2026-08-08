# Laneway Tycoon Phase 8 Release Runbook

Phase 8 produces a local release candidate for the forty-day department-store
campaign. A local PASS does not authorize a merge or publication. The repository
owner makes those two decisions separately and in that order.

## Candidate contents

The candidate includes:

- Standard and Hard campaigns that run for forty days;
- the cart, kiosk, cafe, and department-store venues;
- department-store staffing, commercial equipment, three service stations, an
  express lane, and the dense low-poly 3D heritage hall;
- current schema-v4 saves, optional end-of-day detail, and a planner without a
  scene preview;
- a production-scoped `/tycoon/` installable PWA whose complete runtime graph is
  available after one successful online load; and
- consent-based service-worker updates that cannot activate while service is in
  progress.

No backend, account, credential, secret, analytics, telemetry, advertising, or
runtime external service is part of the release.

## 1. Reproduce the local candidate

Use Node.js 22.12 or newer and pnpm 10. The Component 8.8 evidence was produced
with Node.js 24.18.0 and the frozen lockfile.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm exec playwright test tests/e2e/pwa.spec.ts tests/e2e/persistence.spec.ts tests/e2e/service-layout.spec.ts tests/e2e/department-store-scene.spec.ts --workers=1
```

The production build must use the `/tycoon/` base. Inspect the generated service
worker and the Playwright evidence to confirm that its canonical precache list
contains every generated JavaScript, CSS, HTML, image, audio, and manifest file
needed by the game, contains no duplicate URL, and contains no individual file
of 1,000,000 bytes or more. The PWA journey must prove:

- a valid `/tycoon/` manifest, scope, start URL, controller, and installability
  result;
- 200 responses for every precached resource while offline;
- both warm and cold offline reload after one online load;
- an offline dense department service can resume, finish, settle exactly once,
  and continue to the next planning day; and
- a waiting worker remains deferred throughout active service. After service,
  activation requires a fresh explicit click, verifies a new schema-v4
  checkpoint first, and reloads to the same persisted gameplay, preferences,
  and meta content. The checkpoint intentionally refreshes only top-level
  `savedAt`, monotonically.

The browser performance evidence is automated emulation, not physical-device
evidence. It records browser/version, viewport, browser or emulated DPR, actual
canvas DPR, renderer, scene state, warm-up, sample count, and frame deltas. The
dense department scene must meet both candidate budgets:

- desktop Chromium at 1280×800: at least 55 rendered frames per second and p95
  frame time no more than 34 ms (a practical release gate for the 60 FPS target);
- emulated touch Chromium at 360×780 and DPR 2: at least 30 rendered frames per
  second and p95 frame time no more than 50 ms.

The optional physical-mobile 30 FPS check remains owner-only, hosted, pending,
and unclaimed. No automated result may be presented as a physical Safari, GPU,
orientation, or device result.

## 2. Run Lighthouse and dependency checks

Serve the built candidate at the fixed validation port:

```bash
pnpm preview --host 127.0.0.1 --port 4173
```

In another terminal, run:

```bash
pnpm audit:lighthouse
pnpm audit --prod --audit-level high
pnpm audit --prod --json
pnpm licenses list --prod --json
pnpm list --prod --depth Infinity --json
```

Performance, Accessibility, and Best Practices must each score at least 90 in
the Lighthouse mobile profile. Lighthouse 13 does not expose a PWA category, so
the production-manifest, installability, service-worker, cache, offline, and
update Playwright assertions own that proof. The runtime dependency audit must
remain free of high or critical advisories, all production licenses must remain
approved, and source plus built-output inspection must find no remote runtime
asset, API, telemetry, or analytics request.

## 3. Human merge gate

After Component 8.9 records a cumulative Phase 8 PASS for one frozen global
fingerprint, the repository owner may approve or reject the merge. On approval:

1. push the validated `phase-8` branch;
2. open a pull request into `main`;
3. confirm the required checks passed for the exact candidate; and
4. merge through the normal pull-request/check workflow.

Do not commit directly to `main`, bypass checks, force-push, or merge an
intermediate candidate. Merge approval still does not authorize publication.

## 4. Separate publication gate

Only after the merge may the repository owner separately approve or reject
publication. On approval, use the existing GitHub Pages workflow:

1. confirm Pages uses **GitHub Actions** as its source;
2. run or observe **Deploy Laneway Tycoon to Pages** on the approved `main`
   commit;
3. record the workflow run, deployed commit, deployment ID, timestamp, and URL;
4. verify direct load and refresh at `https://sjmeehan9.github.io/tycoon/`;
5. run the hosted desktop/touch/WebGL/offline checks in
   `docs/public-release-checklist.md`; and
6. if the owner elects to use a physical mobile device, record its supplied
   browser/OS/model/orientation/DPR/GPU/FPS evidence without agent device access.

Until this gate is expressly approved, do not deploy or alter repository
visibility, Pages settings, environments, releases, or hosted evidence.

## 5. Update behavior in production

A newly downloaded worker waits. During a rush or service event, the update
action is disabled and the active worker remains in control; dismissing the
prompt never queues later activation. After service reaches a safe phase, the
player must explicitly select **Save and update**. The game writes and verifies
a fresh schema-v4 checkpoint before sending `SKIP_WAITING`. It reloads only
after the new controller takes control, then restores all persisted gameplay,
preferences, and meta content exactly; only the verified checkpoint's top-level
`savedAt` is intentionally refreshed monotonically.

If checkpoint verification, worker activation, controller transition, or reload
fails, keep the existing worker/save and stop the release investigation before
retrying. Never clear browser storage as an update remedy.

## 6. Failure, rollback, and superseding builds

Before publication, a failed check stops the candidate: fix it on the phase
branch and rerun the applicable gate. Do not merge or publish a known failure.

After publication, prefer a superseding fix build:

1. branch from the published commit and make the smallest complete fix;
2. keep schema-v4 persistence compatibility and the consent-update contract;
3. rerun the full local Phase 8 gate, obtain the human merge decision, merge by
   pull request, then obtain a new and separate publication decision;
4. publish through the same Pages workflow and record the superseding commit;
5. verify hosted routing, cache contents, offline continuation, and a real
   waiting-worker update from the affected release.

Do not rewrite protected history, force-push, manually replace cached assets, or
reuse a service-worker cache identifier for incompatible content. Existing
sessions can remain on the last active worker until the player safely consents
to the verified superseding build.

An emergency redeploy of a last-known-good commit is permitted only by explicit
owner approval and only if that build is schema-v4 compatible. Run it through
the same workflow, record the exact commit, and repeat hosted verification. If
compatibility is uncertain, do not roll back; ship a validated superseding build
instead.
