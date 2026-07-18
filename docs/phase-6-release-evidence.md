# Phase 6 Release Evidence — HOSTED PASS

Generated on 19 July 2026 after the approved Phase 6 merge and direct public
verification.

## Release identity

| Field                  | Verified value                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Approved pull request  | [#3 — feat: deliver Tycoon feedback phases 4–6](https://github.com/sjmeehan9/tycoon/pull/3)                         |
| Reviewed feature head  | `c14bd24b3a79c144cdd77aa1f35ec57b5538ff9e`                                                                          |
| Merge method/result    | Normal PR merge; no force/admin bypass                                                                              |
| Merge commit on `main` | `2ddf8994866660caf37aa89a39618edcb15e67dd`                                                                          |
| Merged at              | `2026-07-18T20:42:35Z`                                                                                              |
| Public release         | `https://sjmeehan9.github.io/tycoon/`                                                                               |
| Pages workflow         | [run 29660220814](https://github.com/sjmeehan9/tycoon/actions/runs/29660220814) — `success` for the exact merge SHA |
| Build/validation job   | [88121495602](https://github.com/sjmeehan9/tycoon/actions/runs/29660220814/job/88121495602) — `success`             |
| Deploy job             | [88121873557](https://github.com/sjmeehan9/tycoon/actions/runs/29660220814/job/88121873557) — `success`             |
| Pages deployment       | ID `5505254011`, final status ID `15653894767`, `success` at `2026-07-18T20:47:22Z`                                 |
| Main drift check       | [run 29660220778](https://github.com/sjmeehan9/tycoon/actions/runs/29660220778) / job `88121495277` — `success`     |

GitHub reports Pages as public, HTTPS-enforced, workflow-built from `main` at
the repository root. Deployment `5505254011` identifies both the environment
URL above and merge SHA `2ddf8994866660caf37aa89a39618edcb15e67dd`.

## Cumulative gate

| Evidence                     | Result                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| Frozen local install         | PASS — pnpm 10.15.0, lockfile unchanged                                 |
| Strict local build           | PASS — TypeScript and Vite production bundle                            |
| Local lint/format            | PASS — zero ESLint warnings, Prettier clean                             |
| Local unit/component         | PASS — 119/119                                                          |
| Local production browser     | PASS — 47 applicable; 7 intentional routing skips                       |
| Hosted existing journeys     | PASS — 44; 4 intentional project-routing skips; 0 flaky/failures        |
| Focused hosted release audit | PASS — 3 applicable; 1 intentional cross-project skip; 0 flaky/failures |
| Hosted projects              | PASS — 1280×800 desktop and 360×780 touch-mobile Chromium               |
| Final verdict                | **HOSTED PASS**                                                         |

The hosted runs used the public URL directly and had no local web server. The
focused audit used a temporary production-only Playwright runner, removed before
this evidence commit. The 44 existing journeys excluded only `pwa.spec.ts`
because two of its update cases deliberately rewrite the local `dist/sw.js`;
the hosted-safe worker, update-check, checkpoint, and offline paths were covered
by the focused audit instead.

## Public shell and asset evidence

Direct network requests returned non-empty HTTP 200 bodies for the document,
manifest, current hashed JavaScript/CSS, service worker, all manifest icons,
title art, and every bundled audio file. A cache-disabled hard refresh also
returned 200 at the exact `/tycoon/` subpath.

| Public artifact                                                        |   Bytes | SHA-256                                                            |
| ---------------------------------------------------------------------- | ------: | ------------------------------------------------------------------ |
| `https://sjmeehan9.github.io/tycoon/`                                  |     777 | `6f32083deb954269b9a2f9ad18f4c69670b4a64295ca1d4f450c2e67f1e4d490` |
| `https://sjmeehan9.github.io/tycoon/manifest.webmanifest`              |     588 | `de33b57971d6bf6c206c6f690a557d23fb8a2fa6c33a370d65d62adc2017b4d9` |
| `https://sjmeehan9.github.io/tycoon/sw.js`                             |   1,961 | `e5358a6c7d21c77adfb633c5ba6f4e9e12f542217e0d48d8bd2e9e2f4355b108` |
| `https://sjmeehan9.github.io/tycoon/assets/index-CFde9aAe.js`          | 321,192 | `cee458749268240128d84cbd10f4cf5f57dd84cd7d57c4146662551530a0e6c3` |
| `https://sjmeehan9.github.io/tycoon/assets/index-DWa43T0c.css`         |  23,345 | `b75a5bfc7270b54b9ad463ffdda97843460ffe62ad15568d9fa864afd63c1ff0` |
| `https://sjmeehan9.github.io/tycoon/icon.svg`                          |     787 | `6dac2ffeebe69eb19d4f0f4fbe416217308b95dbfc95ba5b70146ce000f7f6e8` |
| `https://sjmeehan9.github.io/tycoon/pwa-192x192.png`                   |   3,748 | `1475c6dd520779b81ef1194a6834f5ce2243a461d6a68b0afed4359678574e53` |
| `https://sjmeehan9.github.io/tycoon/pwa-512x512.png`                   |  10,041 | `28621746f78be169b30abfe337db852b54313c443b7d3993cdd064a67f1d2b85` |
| `https://sjmeehan9.github.io/tycoon/pwa-maskable-512x512.png`          |  10,041 | `28621746f78be169b30abfe337db852b54313c443b7d3993cdd064a67f1d2b85` |
| `https://sjmeehan9.github.io/tycoon/assets/art/laneway-title.webp`     | 167,760 | `5669f4b6245942b396fb73983905cb4cc033deee0b24c6fd3c5e44f262cc2c37` |
| `https://sjmeehan9.github.io/tycoon/assets/audio/confirm.wav`          |   9,746 | `0b845743db6da0fe6c428513c7a776d3aa0e26b90e11a8c498f287f3e36ebe6f` |
| `https://sjmeehan9.github.io/tycoon/assets/audio/event.wav`            |  18,566 | `33ea1a26bef4a44d04f8b7070fab82bce6b94570884dea0a93efd869579f4332` |
| `https://sjmeehan9.github.io/tycoon/assets/audio/laneway-ambience.wav` | 264,644 | `2c9282ece6d2c2ee8695ad7f756c2f5b3a1c81899e9c8de609fff867d989dde4` |

Chromium returned no app-manifest or installability errors. The manifest scope
and start URL are both `/tycoon/`.

## Hosted gameplay matrix

| Public behavior             | Result                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| Queue deeper than eight     | PASS — exact queue 12, eight rendered sprites, readable `+4`                               |
| Counter service/cup         | PASS — active enthusiast, drink service, and cup handoff visible/readable                  |
| Actual sale/walkaway        | PASS — `$7.25` sale and out-of-stock evidence persist across reload                        |
| Rush controls/report        | PASS — 4×, pause freeze, autosave reload, rush close, stopped report RAF                   |
| Live stock/actual charges   | PASS — all nine rows, depletion/reload, LIFO expiry, conservation, report reconciliation   |
| Desktop containment/runtime | PASS — fixed Canvas bounds, no document overflow, no console/page errors                   |
| 360px touch parity          | PASS — same queue/service/sale/walkaway truth, coarse pointer, no hover dependency         |
| Touch targets/layout        | PASS — visible controls at least 44×44 CSS pixels; no document overflow                    |
| Compatible duplicate staff  | PASS — schema-v3 repair, hire, autosave, reload, all visible names unique                  |
| Endless boundary            | PASS — Day 9,999 advances to Day 10,000 with four unique candidate names and reload parity |
| Version compatibility       | PASS — v1 production import retained; focused v2→v3 migration retained dense rush truth    |
| Save bounds                 | PASS — activity ≤80 and each ingredient ≤8 dated batches after migration/reload            |

The focused desktop and touch screenshots were visually inspected. Each showed
the eight queue sprites, separate active counter customer, cup handoff, `+4`,
`SALE +$7.25`, and `OUT OF STOCK` within the fixed scene frame.

## Persistence, worker, offline, and runtime evidence

- A compatible version-2 flat-inventory rush migrated through the production
  upload control to schema/state version 3. Its seven ordered activity records,
  nine dated inventory fields, exact queue/counter/sale/walkaway state, speed,
  pause state, and bounded arrays survived autosave and reload.
- The deployed worker is both the active worker and page controller at
  `https://sjmeehan9.github.io/tycoon/sw.js`, state `activated`, scope
  `/tycoon/`. No stale installing or waiting worker remained.
- A real `registration.update()` check against the deployed worker completed
  without interrupting play. A new planning run was checkpointed before the
  check, reloaded, and restored with byte-equivalent active game state. The
  hosted test did not fabricate a newer production worker; waiting-worker
  deferral/acceptance remains separately proven by the local production PWA
  tests.
- After an online controlled visit, Chromium was taken offline. The public
  subpath and title art reloaded from the release cache, and the same autosave
  continued. Connectivity was restored after the assertion.
- Every HTTP(S) runtime request was confined to
  `https://sjmeehan9.github.io`. No backend, analytics, external asset, secret,
  or third-party runtime path exists. Console and page-error collections were
  empty. The only request cancellation observed was the expected same-origin
  ambience preload abort during an intentional navigation; the audio file's
  independent direct request returned 200 with the digest above.

## Workflow annotations

The successful Pages run has three known non-blocking annotations:

- build warning: `actions/configure-pages@v5` and the pinned
  `actions/upload-artifact` revision target Node.js 20 and were forced by the
  runner onto Node.js 24;
- build warning: the pinned upload-artifact revision does not recognise the
  `include-hidden-files` input; the generated site artifact, validation job,
  deploy job, and direct public asset audit all passed;
- deploy warning: `actions/deploy-pages@v4` targets Node.js 20 and was forced
  onto Node.js 24.

The build job also published its Playwright notice: 47 passed and 7 skipped.
These warnings did not change the deployed artifact or verdict; action/input
cleanup is release-workflow hardening, not a hosted product defect.

## Verdict

**HOSTED PASS.** Human approval, normal PR merge, main checks, exact deployment
identity, public shell/assets, desktop/touch flows, staff uniqueness, schema
compatibility, autosave, service-worker control/update check, offline
continuation, and runtime health are all verified against merge
`2ddf8994866660caf37aa89a39618edcb15e67dd`.
