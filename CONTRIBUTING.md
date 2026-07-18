# Contributing to Laneway Tycoon

Thanks for helping the laneway. Small, complete, accessible changes are welcome.

## Development setup

Use Node.js 22.12 or newer and pnpm 10:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Do not add secrets or runtime services. The game intentionally has no backend,
accounts, analytics, ads, or cloud saves.

## Change contract

- Branch from the current protected `main`; do not commit directly to it.
- Keep the simulation deterministic. Presentation and animation must consume
  immutable snapshots and must never advance game time.
- Preserve versioned save compatibility. Add migration and malformed-data tests
  for any schema change.
- Retain keyboard and touch access, visible focus, semantic names, textual
  outcome parity, reduced-motion behavior, and 360px layout support.
- Bundle and document any original media in `public/assets/ASSET_PROVENANCE.md`.
  Do not add licensed or streamed third-party media.
- Keep all runtime requests same-origin and cacheable. Never add telemetry or
  personal-data collection.
- Agent definitions and skills are generated. Edit `agents-src/` or
  `skills-src/` and run `python3 scripts/build-agents.py`; never hand-edit their
  rendered outputs.

## Before opening a pull request

Run the exact validation sequence:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

Then play the changed path in the production preview at `/tycoon/` with a
desktop viewport and a 360px touch viewport. For PWA changes, load once online,
reload offline, verify the current autosave, and exercise both update choices.

Describe the user-visible result, save/PWA impact, test evidence, and any asset
provenance in the pull request. Required behavior must not be deferred behind a
placeholder, test-only seam, or manual workaround.
