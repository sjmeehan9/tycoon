# Laneway Tycoon

Laneway Tycoon is a free, browser-based, old-school business game about growing
a Melbourne coffee cart through a kiosk and specialty cafe into a landmark
department-store coffee hall. Plan an Australian cafe menu, price drinks,
choose beans and recipes, stock the morning, build a department-scale team,
handle the rush, and learn from a causal end-of-day report.

Service plays out in warm, fixed-isometric 3D worlds for the cart, kiosk, cafe,
and Merriweather Department Store Coffee Hall. The WebGL scene is presentation
only: the deterministic engine remains the authority for every customer,
station, lane, sale, stock movement, and outcome.

The game is deterministic, local-first, installable, and designed for desktop
and mobile browsers. There are no accounts, ads, analytics, payments, or runtime
external services.

Each new campaign locks one difficulty for its full run. Standard keeps the
original non-price tuning while making both price-response paths more sensitive;
Hard strengthens every supported demand influence in either direction. Scenario
selection remains independent from difficulty.

## Play

Public releases are served at <https://sjmeehan9.github.io/tycoon/>. A branch
candidate reaches that URL only after its local gate, reviewed merge, separate
publication approval, and successful Pages workflow. To run the current
checkout locally:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. For the exact GitHub Pages build and offline
behavior, use:

```bash
pnpm build
pnpm preview
```

The production preview lives under `/tycoon/`, matching GitHub Pages.

## How a day works

1. Plan the menu, prices, bean profile, recipe emphasis, dial-in, supplies,
   scheduled staff, station assignments, and up to three eligible express
   drinks. Morning planning has no animation preview.
2. Open service. Drinks are made automatically while you pause, change speed,
   and make one-off rush decisions.
3. Read the compact day result. Open the complete arrivals, serves, waits,
   satisfaction, stock, revenue, cost, wages, and bottleneck report only when
   wanted; reopen settled reports later from **Game menu → Reports**.
4. Reinvest through three equipment tiers, promote cart → kiosk → cafe →
   department store, and try to finish the Day-40 campaign target. Victory
   unlocks endless play; bankruptcy and a missed target retain records and a
   clean restart path.

Coffee content follows a recognisable Australian specialty menu: espresso,
long black, flat white, latte, cappuccino, piccolo, mocha, batch brew, iced
latte, and cold brew, including common milk options and modifiers.

The Phase 8 runtime uses schema-v4 saves, immutable Standard/Hard campaigns, a
40-day target, four venues, four staff roles, three-tier equipment, and
department service across three stations and normal/express lanes.

## Controls and accessibility

- Every gameplay action works with keyboard, pointer, or touch.
- Game and planner tabs support Arrow keys, Home, and End.
- Event dialogs trap and restore focus; outcomes are always available as text.
- Coarse-pointer targets are at least 44px and the layout is tested at 360px.
- Morning planning is full-width and scene-free. During service the scene and
  complete dashboard fit together at 360×780, followed by activity and stock.
- Reduced motion, independent local audio controls, and onboarding choices are
  persisted without affecting the deterministic simulation.
- Audio is off initially and all art/audio ships inside the repository.

## Saves, offline play, and updates

The current campaign, settings, unlocks, and records are versioned in browser
`localStorage`. A validated last-known-good copy is retained. The Game menu can
export portable JSON, import a bounded schema-validated file, recover the prior
copy, or clear only the active campaign.

Current saves use `laneway-tycoon.save.v4` and
`laneway-tycoon.save.backup.v4`. A readable v1, v2, or v3 browser save, recovery
copy, or imported file crosses one preferences-only reset: sound, ambience, and
reduced-motion are retained, while campaign progress, records, unlocks, history,
and onboarding progress restart cleanly. After a verified v4 write, legacy keys
are removed and the evolution notice does not repeat.

After one successful production load, the service worker caches the complete
same-origin game so it can relaunch offline. A new release never refreshes an
active game automatically: choose **Keep playing**, or **Save and update** to
verify a local checkpoint before activating it. Clearing site data, private
browsing policies, or browser storage eviction can remove local saves, so export
a JSON copy for runs you care about.

## Privacy and network behavior

Laneway Tycoon does not collect or transmit gameplay, identifiers, personal
data, or usage metrics. It has no backend. During normal play the only network
requests are same-origin static files from the host; after caching, gameplay is
fully offline. Import processing stays in the browser and imported content is
parsed as data, never executed.

GitHub Pages and a user's browser/network provider may independently log normal
web requests under their own policies. This project does not add tracking.

## Architecture

- `src/game/` — pure seeded TypeScript simulation and campaign rules.
- `src/content/` — typed coffee, customer, venue, staff, and equipment content.
- `src/app/` and `src/components/` — React controller and accessible phase UI.
- `src/persistence/` — versioned validation, migration, autosave, and transfer.
- `src/scene/three/` and `src/audio/` — lazy snapshot-only fixed-isometric
  WebGL2 presentation and local opt-in media; neither advances simulation
  state. Unsupported WebGL2 receives accessible save-safe guidance, not a 2D
  gameplay fallback.
- `src/pwa/` — prompt-mode service-worker registration and checkpointed update.
- `tests/` — deterministic unit/component tests plus production-build Playwright
  journeys in desktop Chromium and 360px touch-mobile profiles.

The production Vite base is `/tycoon/`. Public asset URLs use
`import.meta.env.BASE_URL`; update both Vite and manifest scope/start URL if a
fork deploys under another repository path.

## Validate

Use Node.js 22.12+ and pnpm 10, then run the repository's exact sequence:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

Playwright uses the production build and `/tycoon/` preview, including offline,
service-worker update, save-continuation, accessibility, desktop, and touch
flows. The automated gate covers desktop Chromium and the exact 360×780
touch-browser profile. A later physical check, if requested, is performed only
by the repository owner against the exact approved build at the public game URL;
the automated report leaves that result pending and unclaimed. Install the
Chromium binary once if required with `pnpm exec playwright install chromium`.

## Contributing and deployment

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development contract. GitHub Pages
deployment is defined in `.github/workflows/deploy-pages.yml`: it validates the
release, uploads only `dist/`, and deploys from `main` through the normal
pull-request/check workflow with the standard Pages token permissions. No
repository secret is required.

The owner must keep the repository and Pages channel appropriately configured,
approve the phase merge and publication separately, and verify the hosted URL.
The full gate is in
[docs/public-release-checklist.md](docs/public-release-checklist.md).

## License

Copyright © 2026 Sean Meehan. Released under the [MIT License](LICENSE).
