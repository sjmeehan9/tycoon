# Component 1.3 — Responsive Autosaved Continuation

## What was delivered

A desktop or 360px touch-mobile user can now leave or reload during planning,
service, event choice, reporting, or reinvestment and continue the exact run
without duplicated settlement, lost speed/pause state, or inaccessible controls.

## Public interfaces / contracts exposed

- `BrowserSaveStore.save`, `load`, and `clear` preserve a validated primary and
  last-known-good schema-version-1 envelope.
- The application persists all non-rush commands, phase transitions, pause and
  speed changes, and each five simulated seconds of service.
- The existing `closeDay` contract is explicitly idempotent after settlement.

## Files owned

- `src/app/GameContext.tsx`
- `src/components/Planner.tsx`
- `src/styles.css`
- Persistence, component, and Playwright continuation tests.

## How to run / verify

Run the project-profile validation sequence. `tests/e2e/persistence.spec.ts`
reloads during planning and service, restores 4x speed, reloads the report,
settles, reloads again, and proves the balance was applied once.

## Integration notes & gotchas

- A reload intentionally returns to the title screen so the user explicitly
  chooses the saved run; it never silently replaces an in-memory new campaign.
- Mobile-only CSS exposes Menu, Supplies, and Dial-in as ARIA tabs while desktop
  retains the complete side-by-side planner.
- Save write failures leave the in-memory run playable and surface a message.

