# Asset Provenance

All release media is original to Laneway Tycoon and contains no third-party
brands, licensed recordings, or runtime network dependencies.

## `art/laneway-title.webp`

- Generated 2026-07-18 with the built-in OpenAI image-generation tool, then
  locally resized and encoded as a 1600×901 WebP at quality 82.
- Generation ID: `exec-918ca65c-277d-483f-9a82-994e46627a4f`.
- Final prompt: original 16-bit pixel-art Melbourne laneway with a foreground
  coffee cart, neighbourhood cafe, varied patrons, red brick, eucalyptus,
  early-morning post-rain light, and a limited espresso/terracotta/cream/green
  palette; no text, logos, trademarks, watermark, or photorealism.

## `audio/*.wav`

- Deterministically synthesized from original waveforms and seeded noise by
  `scripts/generate-audio.ts`; no sampled or recorded source material.
- `laneway-ambience.wav` is a quiet six-second loop of room tone, filtered noise,
  and synthetic cup clinks. `confirm.wav` and `event.wav` are short interface
  cues.
- Regenerate with `pnpm assets:audio`.
