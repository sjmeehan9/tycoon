# Component 3.2 — Cohesive Pixel Scene and Local Audio

## What was delivered

A user can now see a warm, original Melbourne laneway presentation evolve from
cart to kiosk to cafe—with weather, equipment, team, customer, and cosmetic
variations—and can independently opt into locally bundled ambience and cues
without changing gameplay.

## Public interfaces / contracts exposed

- `SceneSnapshot` is the immutable presentation contract extracted from game,
  meta, and reduced-motion state by `createSceneSnapshot`.
- `LOGICAL_SCENE_SIZE` fixes rendering at 320×180; `describeScene` provides
  textual parity and `shouldAnimateScene` prevents visual animation outside an
  active rush or when reduced motion is enabled.
- `BrowserAudioManager` owns three base-path-aware local media elements and
  exposes `setAmbienceEnabled`, `playCue`, and `dispose`. Playback failure is a
  safe muted state.
- Existing `Preferences.soundEnabled` and `ambienceEnabled` remain independent,
  versioned, autosaved consent switches. Both default to false.
- Release media lives under `public/assets/`; `pnpm assets:audio` regenerates the
  original deterministic WAV files.

## Files owned

- `src/scene/sceneModel.ts`, `src/scene/CanvasScene.tsx`
- `src/audio/AudioDirector.tsx`, `src/App.tsx`
- `src/components/TitleScreen.tsx`, `src/components/GameTools.tsx`
- `src/styles.css`, `package.json`, `tsconfig.json`
- `public/assets/art/laneway-title.webp`, `public/assets/audio/*.wav`
- `public/assets/ASSET_PROVENANCE.md`, `scripts/generate-audio.ts`
- `tests/unit/audio.test.ts`, `tests/unit/scene.test.ts`
- `tests/components/presentation.test.tsx`, `tests/e2e/presentation.spec.ts`
- `tests/e2e/operations.spec.ts`, `tests/setup.ts`

## How to run / verify

Run `pnpm assets:audio` to reproduce local sound files, then follow the profile
validation sequence. Component 3.2 passes 64 Vitest tests and 24 cumulative
Playwright tests across desktop and 360px touch-mobile Chromium.

## Integration notes & gotchas

- Canvas reads a frozen snapshot only; requestAnimationFrame never dispatches an
  engine command or influences deterministic simulation time.
- Browser and saved reduced-motion preferences keep the scene still while
  retaining every textual and state cue.
- Audio waits for pointer/keyboard interaction and explicit saved consent.
  `play()` rejection, unsupported media, and muted devices never interrupt play.
- Public asset paths use `import.meta.env.BASE_URL`, so Component 3.4 may switch
  to `/tycoon/` without rewriting presentation code.
- The 164 KB title WebP was produced with the built-in image-generation path;
  its final prompt and generation ID are recorded in the provenance file.
- The optional in-app browser had no available runtime during visual QA; the
  configured real Chromium desktop/touch suite completed all rendered checks.
