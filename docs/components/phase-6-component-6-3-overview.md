# Component 6.3 — Expressive Queue, Sale, Exit, and Walkaway Scene

## What was delivered

A user can now see customers walk in, ease forward through an exact queue,
approach the counter, receive a cup, pay the actual charge, leave carrying
coffee, or depart along a reason-specific path. The same truth remains visible
and readable while paused, after reload, at 1×/2×/4×, and with reduced motion.

## Public interfaces / contracts exposed

- `scenePlayback.ts` exports immutable `ScenePlaybackState`,
  `SceneTransient`, and `SceneQueueMotion` plus `createScenePlayback`,
  `syncScenePlayback`, and `advanceScenePlayback`.
- Playback consumes canonical event sequences once, coalesces by customer, and
  retains at most `MAX_SCENE_TRANSIENTS` (3) plus
  `MAX_SCENE_QUEUE_SPRITES` (8). Existing retained history initializes as
  current truth and is never replayed as new motion.
- `interpolatedQueueIndex` and `sceneTransientProgress` expose the cubic easing
  used by Canvas. `walkawayVisualLabel` maps the four reasons to `WAITED TOO
  LONG`, `QUEUE FULL`, `OUT OF STOCK`, and `RUSH CLOSED`.
- `SceneSnapshot` now includes `rushTick`, `rushSpeed`, and `isPaused` alongside
  exact queue, active customer/order, and event evidence.
- Canvas exposes diagnostic attributes for production proof:
  `data-queue-count`, `data-queue-overflow`, `data-active-customer`,
  `data-last-event`, `data-speed`, `data-transient-count`, and
  `data-animation`.

## Files owned

- `src/scene/sceneModel.ts`, `src/scene/scenePlayback.ts`,
  `src/scene/CanvasScene.tsx`
- `src/components/RushPanel.tsx`, `src/styles.css`
- `tests/unit/scene.test.ts`, `tests/components/presentation.test.tsx`,
  `tests/components/accessibility.test.tsx`,
  `tests/components/game-loop.test.tsx`
- `tests/e2e/living-rush.spec.ts`, `tests/fixtures/campaignFixtures.ts`
- `docs/components/phase-6-component-6-3-overview.md`,
  `docs/implementation-context-phase-6.md`, `docs/phase-progress.json`

## How to run / verify

Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm test`,
then `pnpm test:e2e`. Focus the production journey with
`pnpm exec playwright test tests/e2e/living-rush.spec.ts`.

The component boundary passed the exact profile sequence with 107 Vitest/RTL
tests and 43 Playwright browser passes; seven configured project cases were
intentionally skipped.

The stable paused/reduced-motion Canvas capture is written during Playwright to
`test-results/living-rush-*/living-rush-static.png`. It is a runtime artifact,
not a platform-sensitive committed golden image.

## Integration notes & gotchas

- Playback refs are presentation-only. Never persist their ages, motions, or
  transient list, and never use them to change simulation state.
- Queue truth comes from `queueCount`; the first eight identities are visual
  detail only. Canvas and the visible HUD show `+N` for the remainder.
- 4× speeds presentation ages but never alters canonical events. A 250 ms frame
  delta cap prevents tab-resume jumps; retained-event coalescing catches up to
  current truth without an unbounded backlog.
- Pause freezes all ages. Reduced motion consumes new IDs but immediately
  settles queue positions and renders static sale/walkaway/queue evidence.
- On live rush completion, only already-synced bounded `rushEnded` transients
  finish during report; the RAF stops when they clear. Reloading a report starts
  with no transient replay and no idle RAF.
- The HUD is `aria-hidden` because the Canvas accessible name, figcaption, Rush
  panel sale/walkaway notes, and ordered activity list carry exact textual
  parity without duplicate announcements.
