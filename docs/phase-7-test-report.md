# Phase 7 Test Report — AUTOMATED PASS

## Verdict

**AUTOMATED PASS.** The complete profiled Tier 3 sequence and every automatable
Phase 7 validation target passed against global fingerprint
`88dbdaf32cbbe6c59a91bdc5c3853efdf85514fc053b627e1f0962dfa1a2247f`.
The fingerprint was identical before and after the final gate.

Physical Safari/mobile-GPU/FPS validation is **PENDING / UNCLAIMED**. By the
user's superseding direction, agents do not access a physical device. If that
check is requested, the repository owner performs it only against this exact
candidate after separate merge/publication approval and deployment to the
existing public game URL. This report does not infer physical evidence from
Chromium emulation, screenshots, or desktop WebGL.

## Candidate and environment

- Remediation branch: `phase-7-ci-remediation`
- Phase 7 validated component head: `dc34856e76c44c1ec78550d249848f757e2b724c`
- Human-approved PR #7 merge: `4e489198394cb716724652978b116f1e12810972`
- Completed dependency head before Component 7.6: `385bfe2`
- Original merged candidate fingerprint:
  `10555250b730a5dbde62f51801d70ae96254b10b2359083666be2e157b881186`
- Current remediated candidate fingerprint:
  `88dbdaf32cbbe6c59a91bdc5c3853efdf85514fc053b627e1f0962dfa1a2247f`
- Fingerprint command: `python3 scripts/worktree-fingerprint.py`
- Runtime: Node.js `v24.18.0` (satisfies the Node 22.12+ profile), pnpm
  `10.15.0`
- Application/test stack: React `19.2.7`, Vite `8.1.5`, React Three Fiber
  `9.7.0`, Three.js `0.185.1`, `@types/three` `0.185.4`, Playwright `1.61.1`
- Browser projects: desktop Chromium at 1280×800 and touch-mobile Chromium at
  exactly 360×780 with touch, mobile mode, and device scale factor 2
- Public URL: `https://sjmeehan9.github.io/tycoon/` remains the prior validated
  release. The PR #7 merge-triggered run failed before artifact upload and
  deployment, so neither that run nor this local remediation replaced it.

## Post-merge CI failure and remediation

GitHub Pages run
[`31244688241`](https://github.com/sjmeehan9/tycoon/actions/runs/31244688241)
targeted merge commit `4e489198394cb716724652978b116f1e12810972`. Checkout,
setup, frozen install, build, and lint passed. The **Run unit and component
tests** step then failed in `tests/components/game-loop.test.tsx` at
**reloads a paused dense rush at current truth without presenting old evidence
as motion**. The test synchronously queried the accessible WebGL scene while
Linux still rendered the lazy `scene-loading` fallback. E2E, Pages artifact
upload, and deployment were consequently skipped.

No product failure or device issue was established. The smallest correction
awaits the scene's accessible `img` on both initial mount and reload, then keeps
the exact `12 customers waiting`, `d1-e6` current-event, `still` animation,
`SALE +$7.25`, and `OUT OF STOCK` assertions. It adds no sleep and changes no
runtime source. Focused proof:

| Command                                                    | Exit | Duration | Result                   |
| ---------------------------------------------------------- | ---: | -------: | ------------------------ |
| `pnpm exec vitest run tests/components/game-loop.test.tsx` |    0 |    5.05s | PASS — 1 file / 18 tests |

A clean GitHub rerun and deployment of the remediated commit are **PENDING**.
This report claims only the local gate below.

## Exact Tier 3 evidence

The final unchanged candidate ran the profile sequence in order:

| Command                          | Exit | Duration | Result                                                                      |
| -------------------------------- | ---: | -------: | --------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` |    0 |    0.20s | PASS — lockfile current; already up to date                                 |
| `pnpm build`                     |    0 |    4.81s | PASS — strict TypeScript and production Vite/PWA build                      |
| `pnpm lint`                      |    0 |    8.40s | PASS — zero ESLint warnings; source/test/config formatting clean            |
| `pnpm test`                      |    0 |    6.33s | PASS — 16 files, 148 tests                                                  |
| `pnpm test:e2e`                  |    0 |     2.5m | PASS — 67 applicable cases, 7 intentional project-routing skips, 0 failures |

The 74 Playwright project cases use explicit routing rather than hidden
coverage: the desktop keyboard and touch-primary accessibility journeys each
run in their intended project; the desktop keyboard and touch planner-control
journeys do the same; and three mutable service-worker lifecycle cases run once
in desktop Chromium. Both projects execute the Phase 7 service layout, report
history, WebGL worlds, context handling, deterministic persistence, economic
reconciliation, and venue/campaign journeys.

The macOS sandbox denied the first browser launch before application cases
could execute. The profiled outside-sandbox Chromium fallback was used for the
real browser runs. That environment-only launch denial is not represented as a
product failure or a passing test.

## Remediation and cumulative-contract reconciliation

The first executable cumulative run exposed Phase 6 E2E assertions that no
longer described the approved Phase 7 experience. The repairs retained their
enduring outcomes:

- report cash, staffing, charge, inventory, causal, victory, bankruptcy, and
  settlement checks now open the collapsed full report deliberately and use
  the canonical **Settle & reinvest** action;
- keyboard tab-order coverage now includes the inserted Reports tab between
  Settings and Records;
- management Canvas assertions now prove planning/reinvestment is scene-free,
  then inspect the WebGL world only during service;
- fixed 320×180 Canvas/transient attributes now map to responsive WebGL bounds,
  immutable snapshot/HUD truth, reduced-motion pause behavior, bounded crowds,
  and complete renderer teardown at the report transition;
- the autosave journey keeps its `progress >= 20` checkpoint while allowing the
  four-context local runner sufficient wait time; and
- the frame-loop check proves ordered browser callbacks and the renderer's
  active-to-paused transition without making an unprofiled wall-time or FPS
  claim.

Focused remediation finished with the original 25 failures green, both
persistence projects green, and all six living-rush project cases green before
the final fingerprint was frozen. Two invalidated candidates were discarded;
only the original pre-merge fingerprint's complete gate was used for the PR #7
candidate. The later Linux lazy-import race changed the test file and therefore
invalidated that executable identity. The current remediated fingerprint owns
its own focused proof and one complete Tier 3 PASS recorded above.

## Phase 7 validation-target map

### Desktop user-facing flows

PASS at 1280×800:

- cart, kiosk, and cafe service worlds render through the production
  fixed-isometric WebGL route;
- morning planning and reinvestment contain no scene, thumbnail, placeholder,
  or reserved preview column;
- service controls retain pause, resume, 1×/2×/4×, event resolution, and
  complete dashboard/activity/stock truth;
- current reports begin compact, full detail is opt-in, and settlement is
  exact-once;
- Game menu → Reports reopens canonical and older schema-v3 history without
  reading current rush state or inventing missing charges;
- reload, export/import, victory, bankruptcy, endless continuation, equipment,
  venue growth, and current save values remain coherent.

### Exact touch-mobile flows

PASS at 360×780 using the touch project:

- service direct-child order is scene → complete dashboard/controls → live
  activity → stock;
- scene and every dashboard field are simultaneously above the initial
  viewport fold with no document scroll, while activity and stock remain
  reachable below;
- visible controls retain the 44px coarse-pointer contract and no hover or
  landscape assumption blocks play;
- compact/full report disclosure, report history, focus/dialog behavior,
  planner controls, stock, save transfer, and complete day flows remain within
  the viewport without horizontal document overflow.

### WebGL, accessibility, and renderer authority

- Actual browser contexts report a `WebGL 2.0` version prefix, a non-empty
  renderer identity, and drawing-buffer/CSS ratio at or below the configured
  1.5 DPR ceiling in both projects.
- Cart, kiosk, and cafe expose distinct immutable layouts, one orthographic
  fixed-isometric camera, bounded lights/shadows, instanced people/repeated
  geometry, venue-specific furnishings/equipment, queue/stock/activity cues,
  and bounded customer/staff counts.
- Unsupported WebGL2 and synthetic context-loss fixtures show semantic,
  focusable, save-safe recovery. Neither path selects Canvas or DOM gameplay.
- Reduced motion keeps the 3D world present, switches the renderer to demand
  frames, and leaves deterministic/textual outcomes unchanged.
- Recursive static inspection of `src/scene/three` rejects gameplay commands,
  persistence/component imports, browser storage, network calls, randomness,
  and wall-clock authority. The renderer reads only game/meta/preferences to
  produce detached immutable snapshots.
- No service `VenueId` selects Canvas, no Canvas chunk appears in the production
  manifest, and no renderer bridge is present in production browser journeys.

### Engine, persistence, reports, and retained Phases 1–6

- Equal seeded outcomes remain identical with WebGL mounted/unmounted,
  context-lost/restored, reduced motion, pause, reload, and all speed choices.
- Schema-v3 autosave, backup/recovery, v1/v2 migration, export/import, bounded
  activity, dated inventory, campaign history, and settlement round trips pass
  without reset or duplicate accounting.
- A current post-7.5 report's canonical charge quantity/revenue exactly matches
  served/revenue totals even after mixed activity truncation. An older report
  renders all stored fields and the explicit unavailable-charge state.
- Pricing/modifier charges, cash reconciliation, dated LIFO stock/expiry,
  weighted capacity, staff/equipment/venue growth, unique names, complete
  campaigns, outcomes, PWA update behavior, offline continuation, and all
  cumulative production journeys remain green.

## Dependency, asset, build, and cache evidence

- Installed R3F `9.7.0`, Three `0.185.1`, and `@types/three` `0.185.4` package
  manifests and license files are MIT. R3F's installed peers accept React and
  React DOM `>=19 <19.3` and Three `>=0.156`; the application pins compatible
  React `19.2.7` and Three `0.185.1`.
- The production manifest contains a lazy `ServiceWorld` entry and a separate
  `three-webgl` vendor chunk. The application entry dynamically imports the
  service route and Workbox client.
- Production output precaches 19 entries totalling 1724.22 KiB. The largest
  generated file is `assets/three-webgl-BTwt9G0v.js` at 724,513 bytes; every
  emitted/precache file is below the configured 1,000,000-byte ceiling.
- Other principal raw sizes: `ServiceWorld` 206,148 bytes, application entry
  313,379 bytes, CSS 29,210 bytes, Workbox client 5,653 bytes, and bundled
  ambience 264,644 bytes.
- Vite's advisory 500 kB chunk warning remains for `three-webgl`; it is below
  the stricter project cache ceiling and is already isolated behind the lazy
  service route.
- `public/assets/art/laneway-title.webp` remains byte-identical at SHA-256
  `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37`.

## Automated visual inspection

Fresh successful-run captures were inspected at 1048×594 desktop pixels and
700×358 touch-project pixels (the 360×780 project's 2× device scale factor):

- `test-results/webgl-service-snapshot-onl-74a8d-world-on-desktop-and-mobile-*/webgl-cart-service.png`
- `test-results/webgl-service-snapshot-onl-610fd--cafe-worlds-without-Canvas-*/webgl-kiosk-service.png`
- `test-results/webgl-service-snapshot-onl-610fd--cafe-worlds-without-Canvas-*/webgl-cafe-service.png`
- `test-results/webgl-service-snapshot-onl-6b974-nt-motion-and-speed-changes-*/webgl-dense-rush.png`

The cart reads as a compact red-brick laneway operation; the kiosk adds a
permanent counter/awning and queue space; the cafe adds an L-shaped service bar,
display/equipment, seating, plants, and a denser interior. Queue people,
counter activity, sale/walkaway/stock HUD cues, and the warm low-poly palette
remain readable at both widths. Fixed-isometric framing contains every venue
without horizontal clipping, and dense queue formations remain legible.

These are automated Chromium visual artifacts, not physical-device evidence.

## Owner-led hosted physical checklist — PENDING / UNCLAIMED

Precondition: the coordinator has independently audited this report, committed
the exact fingerprint, obtained explicit merge and publication approval, and
confirmed the resulting deployment at the existing public URL corresponds to
that exact candidate. Never publish an intermediate or unvalidated build for
this check.

Only the repository owner performs the following on the device:

- [ ] Record device model, OS version, browser version, and WebGL2 identity.
- [ ] Record CSS viewport and effective DPR in portrait and landscape.
- [ ] Direct-load and hard-refresh the exact hosted URL; confirm no broken or
      cross-origin asset and no 2D fallback.
- [ ] Inspect cart, kiosk, and cafe service; confirm distinct worlds, readable
      HUD/text, touch controls, orientation resize, and scene/dashboard fit.
- [ ] Inspect a dense cafe rush and record the sampling method, observed frame
      range/responsiveness, visual defects, and explicit 30fps disposition.
- [ ] Enable reduced motion and confirm the 3D scene remains present with
      minimized/stopped motion and complete textual parity.
- [ ] Record PASS/FAIL plus screenshots/findings against the exact hosted build.

Current values for every item are **PENDING / UNCLAIMED — repository owner**.
No physical model, OS, Safari/WebGL identity, viewport, DPR, FPS, orientation,
or visual result is asserted by Component 7.6.

## Documentation, scope, and self-review

- README, brief, requirements, solution design, implementation context, plan,
  component breakdown, agent runbook, and release runbook now describe the
  WebGL-only service presentation, scene-free morning planning, service
  information order, and compact/reopenable report flow consistently.
- Those documents distinguish current Phase 7 runtime—schema v3, one balanced
  mode, 30 days, cart/kiosk/cafe—from planned Phase 8 behavior: one v4 reset,
  Standard/Hard demand, 40 days, and a department-store venue.
- Static inspection found no placeholder, TODO, FIXME, unimplemented branch,
  test-only runtime authority, external runtime request, Canvas production
  bridge, or new gameplay/persistence authority in the renderer graph.
- Component 7.6 changes validation tests and documentation only; no Phase 8
  runtime behavior was started.

## Residual risks and handoff

- Real Safari/mobile-GPU behavior and the physical 30fps disposition remain
  unknown until the owner performs the exact-hosted-candidate checklist above.
- The lazy Three.js vendor chunk triggers Vite's advisory 500 kB warning but is
  275,487 bytes below the enforced 1 MB/file Workbox ceiling.
- The public URL still serves the prior approved release. The remediation PR,
  clean GitHub CI, artifact deployment, hosted identity capture, and owner-led
  physical validation remain pending.

The Phase 7 post-merge remediation is independently audited and committed on
its narrow branch, ready for the normal PR/check workflow. This report grants
no push, merge, publication, hosted PASS, physical PASS, or Phase 8
authorization.
