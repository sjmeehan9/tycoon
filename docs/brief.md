# Project Brief — Laneway Tycoon

## Status and authority

Approved as a lean skeleton based on the root conversation's product plan.
`docs/requirements.md` contains the complete durable requirement set. Only the
Technical Business Analyst and Implement agent roles may be used.

## Overview and problem statement

Laneway Tycoon is a complete single-player coffee-business strategy game for
desktop and mobile browsers. It fills a hobby-project goal: the immediately
understandable daily decisions of a classic lemonade tycoon game, expressed
through authentic Australian specialty-coffee culture and a polished modern
offline-capable web experience.

## Goals and success metrics

- Deliver a satisfying planning, rush, results, and reinvestment loop.
- Make coffee, staffing, inventory, pricing, upgrades, and demand interact in
  understandable ways with multiple viable strategies.
- Deliver a complete 40-day campaign through the department-store coffee hall,
  including bankruptcy, Day-40 victory, and endless continuation.
- Pass every automated and human-readable criterion in `requirements.md` and
  the project profile on desktop and touch-mobile layouts.
- Publish a free MIT-licensed game and source repository on GitHub Pages.

## Target user

The repository owner, playing casually on desktop or mobile and valuing charm,
readable strategic depth, replayability, and Australian cafe authenticity.

## Feature inventory and functional requirements

The binding inventory is `docs/requirements.md`: daily planning, immutable
Standard/Hard campaigns, deterministic parallel service, ten-drink menu,
ingredients, quality, four customer segments, four staff roles, three-tier
equipment, weather/events, cart-to-department-store progression, station and
express-lane operations, compact and reopenable day reports,
victory/bankruptcy, endless unlocks, local saves, export/import, responsive
fixed-isometric WebGL service worlds, PWA/offline support, and public GitHub
Pages distribution.

## Application logic and user flows

New/continue campaign → full-width morning plan with no scene preview → service
rush and event choices → compact day result with optional full report →
reinvestment → next day → victory or bankruptcy. During service, information
is ordered 3D scene → complete rush dashboard → live activity → stock. Settled
reports can be reopened from the Game menu. Victory unlocks endless mode and
non-power progression. Settings, save import/export, records, and help remain
reachable without disrupting an active run.

## Platform, constraints, and non-functional requirements

The architecture, browser targets, validation sequence, performance budgets,
accessibility expectations, and git workflow are defined in
`docs/project-profile.md`. There is no backend or recurring infrastructure
cost. Full required behavior outranks documentation breadth and cosmetic polish.

## Risks and mitigations

- **Economy balance:** keep all numbers configurable and run deterministic
  scripted campaigns over multiple seeds.
- **Mobile density:** use progressive disclosure and large tabbed controls.
- **Simulation/render coupling:** keep a pure engine independent of React,
  Three.js, and render-frame timing; WebGL consumes detached immutable
  snapshots only.
- **3D consistency and performance:** use a constrained warm low-poly palette,
  procedural geometry, instancing, fixed orthographic framing, capped DPR, and
  automated desktop/exact-touch visual verification. Any physical validation is
  owner-led later against the exact approved candidate at the public game URL
  and remains unclaimed until performed.
- **PWA stale state:** prompt for updates and version/migrate saves.

## Assumptions and out of scope

The choices and exclusions in `docs/requirements.md` are approved. The current
Phase 8 candidate uses schema-v4 saves after one preferences-only legacy reset,
locks Standard or Hard for each campaign, runs for 40 days, and culminates in a
department-store coffee operation. Publication and hosted validation remain
separate release gates; local candidate evidence must never be represented as a
hosted or physical-device result.

## Approval

Approved by the user through the root conversation on 2026-07-18, including the
lean-team execution condition, and expanded through the approved Phase 7–8 plan
on 2026-08-08.
