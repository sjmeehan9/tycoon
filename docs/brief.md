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
- Preserve the complete 30-day campaign, bankruptcy, victory, and endless play
  through the Phase 7 presentation upgrade; the approved Phase 8 expansion
  replaces this with a 40-day campaign.
- Pass every automated and human-readable criterion in `requirements.md` and
  the project profile on desktop and touch-mobile layouts.
- Publish a free MIT-licensed game and source repository on GitHub Pages.

## Target user

The repository owner, playing casually on desktop or mobile and valuing charm,
readable strategic depth, replayability, and Australian cafe authenticity.

## Feature inventory and functional requirements

The binding inventory is `docs/requirements.md`: daily planning, deterministic
service simulation, ten-drink menu, ingredients, quality, four customer
segments, staff roles/traits, equipment, weather/events, cart-to-cafe
progression, compact and reopenable day reports, victory/bankruptcy, endless
unlocks, local saves, export/import, a responsive fixed-isometric WebGL service
world, PWA/offline support, and public GitHub Pages distribution.

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
Phase 7 candidate retains the existing single balanced mode, 30-day campaign,
schema-v3 saves, and three venues. The approved but not-yet-implemented Phase 8
boundary introduces Standard/Hard modes, a one-time v4 progress reset, a
40-day campaign, and a department-store coffee operation. No Phase 8 behavior
may be represented as current before that phase passes its own gate.

## Approval

Approved by the user through the root conversation on 2026-07-18, including the
lean-team execution condition supplied immediately before implementation.
