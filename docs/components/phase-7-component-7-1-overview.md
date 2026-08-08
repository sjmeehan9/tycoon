# Component 7.1 — Human Setup and Phase-7 Gate Reservation

## What was delivered

A user can now rely on an approved, isolated Phase 7 delivery boundary: the
exact branch/base, lean ownership, official-source compatibility assumptions,
representative WebGL2 touch-device reservation, downstream evidence duties,
and post-PASS merge gate are recorded before any package or gameplay work.

The component also establishes complete machine-readable Phase 7 lifecycle
metadata for Components 7.1–7.6. It makes no runtime, dependency, test, build,
deployment, merge, publication, or repository-visibility change.

## Public interfaces / contracts exposed

- `phase-7` starts from exact approved base
  `1f54d612f0e34b779dc83c76ba5ce50d3f720fa4`.
- `docs/phase-7-component-breakdown.md` is the binding component authority for
  the six Phase 7 components; `docs/phase-8-component-breakdown.md` is already
  Spec-Validated for the later nine-component phase.
- One Implement engagement works sequentially. Components 7.2–7.5 own Tier 2
  gates under `fast (lean override)`; Component 7.6 owns the cumulative Tier 3
  gate under `phase-gate (lean override)`.
- The representative mid-tier WebGL2 touch device is confirmed/reserved. The
  reservation does not satisfy Component 7.6 physical evidence.
- Component 7.6 must stop after local Tier 3 PASS for explicit human merge
  approval. Phase 7 performs no Pages publication.
- Component 7.2 must re-check and select exact package versions; Component 7.1
  pins or installs nothing.

## Files owned

- `docs/phase-7-component-breakdown.md`
- `docs/phase-8-component-breakdown.md`
- `docs/implementation-context-phase-7.md`
- `docs/components/phase-7-component-7-1-overview.md`
- `docs/phase-progress.json`
- `docs/agent-team-state.md`

The component's baseline commit also carries the coordinator/TBA's previously
approved `docs/phase-plan.md` and `docs/project-profile.md` changes. Component
7.1 did not rewrite their approved product or validation scope.

## How to run / verify

From the repository root:

```bash
git branch --show-current
git rev-parse HEAD
git rev-parse main
git merge-base HEAD main
git rev-list --count main..HEAD
git rev-list --count HEAD..main
git diff --cached --name-only
python3 -m json.tool docs/phase-progress.json
git diff --check
python3 scripts/worktree-fingerprint.py -- docs/project-profile.md docs/phase-plan.md docs/phase-7-component-breakdown.md docs/phase-8-component-breakdown.md docs/implementation-context-phase-7.md
```

The two breakdowns can be inspected with `rg -c` against component headings,
`Spec-Validated` status lines, and each required `### File ownership`,
`### Dependencies`, `### Technical Validation`, `### Acceptance mapping`, and
`### Validation gate` heading.

## Integration notes & gotchas

- The stable R3F v9 release visible during this re-check advanced from the
  planning record's v9.6.1 to v9.7.0. That is evidence of currency, not an
  automatic dependency selection. Component 7.2 must repeat the check and
  build-test exact pins with React 19.2/Vite 8.1.
- Three.js's current renderer contract is WebGL2-only. Capability failure must
  produce semantic React recovery guidance and must never select Canvas.
- R3F/Three presentation consumes immutable bounded snapshots only. Renderer
  frames cannot dispatch engine commands or affect demand, queues, inventory,
  cash, reputation, reports, or settlement.
- The temporary kiosk/cafe Canvas bridge permitted only at the Component 7.2
  development head makes that head non-mergeable. Component 7.3 removes every
  production service path to Canvas.
- The physical-device reservation is complete; device identity, WebGL/browser,
  frame responsiveness, DPR, dense-state, layout, and visual evidence are not.
- Completed Phases 1–6 retain their legacy progress-record shape. The new Phase
  7 entry adds the full assurance/lifecycle metadata while retaining `phase`
  and `id` compatibility keys used by the established tracker.

## Spec-to-delivery map

| Acceptance criterion | Runtime/document behavior | Proof |
|---|---|---|
| Both additive breakdowns completely specify all 15 components | Six Phase 7 and nine Phase 8 component blocks each carry file ownership, dependencies, Technical Validation, acceptance mapping, lane, tier, and `Spec-Validated` state. | Heading/status/section counts in the Tier 1 evidence below; both breakdown documents. |
| Compatibility checklist and device gate are explicit without claiming unfinished proof | The phase context cites current official R3F, Three.js, Vite, Workbox, and license sources; it separates documentary viability, Component 7.2 exact-pin/runtime proof, and Component 7.6 physical proof. | `docs/implementation-context-phase-7.md`; user approval/device response recorded in team state. |
| Exact approved branch and base are recorded | `phase-7`, `main`, and merge base are all the full `1f54d61…` identity at entry, with zero ahead/behind commits and no staged paths. | Exact Git inspections below. |
| No package, runtime, deployment, merge, or publication change occurs | Every worktree path in the candidate is under `docs/`; no product command, dependency install, deployment, merge, push, or publication was executed. | `git status --short`, scoped diff self-review, and commit staging audit. |
| Later human merge gate is preserved | Team state, phase context, and progress all require Component 7.6 local Tier 3 PASS before explicit human approval; no Phase 7 publication is planned. | The three lifecycle documents and Phase 7 breakdown. |

## Assurance lane

- **Lane:** `fast (lean override)`
- **Validation tier:** Tier 1 targeted documentary proof
- **Validation owner / commit owner:** Implement / Implement
- **Triggers considered:** no runtime, UI, persistence, migration, security,
  public schema, build configuration, dependency, or gameplay contract is
  changed by this component. No standard Test or Review trigger applies.
- **Lane re-evaluation:** unchanged after self-review; the diff remains
  documentary only.

## Deviations and decisions

- No approved product or component scope was changed.
- The user's `Approved, proceed immediately with implementation` response is
  applied to the immediately preceding combined plan-approval/device-
  confirmation request, so device access is recorded as confirmed/reserved.
  Physical evidence is explicitly not inferred.
- Official R3F releases now show stable v9.7.0 rather than the v9.6.1 observed
  during planning. Exact selection remains Component 7.2 work, as required by
  the approved specification.
- The pre-existing Phase 1–6 tracker entries remain byte-preserved in their
  legacy shape. Phase 7 adds complete assurance fields plus compatibility keys;
  no historical evidence was reconstructed.

## Validation evidence

- **Candidate fingerprint:**
  `192d25bc1a421e9f9fcd09f05800bb96be936f6052b95fd4b33606617345abcd`
- **Fingerprint command:**
  `python3 scripts/worktree-fingerprint.py -- docs/project-profile.md docs/phase-plan.md docs/phase-7-component-breakdown.md docs/phase-8-component-breakdown.md docs/implementation-context-phase-7.md`
- **Fingerprint duration/result:** 1.094089 seconds, exit 0.
- **Fingerprint scope:** the approved profile/plan, both additive breakdowns,
  and Phase 7 implementation context. Evidence-only state, progress, and
  overview paths are excluded by the repository fingerprint contract.
- **Git identity inspection:** branch `phase-7`; HEAD, `main`, and merge base
  all `1f54d612f0e34b779dc83c76ba5ce50d3f720fa4`; ahead/behind `0/0`;
  cached path list empty. Each command exited 0 in less than 0.001 seconds.
- **Breakdown structure inspection:** Phase 7 returned six component headings,
  seven `Spec-Validated` statuses (phase contract plus six components), and six
  of each required section. Phase 8 returned nine component headings, ten
  statuses (phase contract plus nine components), and nine of each required
  section. Every `rg -c` command exited 0 in less than 0.001 seconds.
- **Approval inspection:** `rg` found the checked 2026-08-08 Phases 7–8
  approval in `docs/phase-plan.md`; exit 0 in less than 0.001 seconds.
- **Progress parse:** `python3 -m json.tool docs/phase-progress.json`; exit 0 in
  less than 0.001 seconds.
- **Focused consistency inspection:** a read-only Node check confirmed all 15
  component blocks carry every required section and all six Phase 7 progress
  IDs/names match their specifications; exit 0 in less than 0.001 seconds. An
  earlier exploratory invocation over-escaped its heading regex, found zero
  blocks, and exited 1 without changing a file; the corrected command is the
  recorded proof and the candidate itself required no repair.
- **Whitespace/error inspection:** `git diff --check`; exit 0 in less than
  0.001 seconds before final self-review and again after the overview was added.
- **Raw logs:** none required; every result is short and reproduced by the
  commands above.
- **Product validation:** intentionally not run. Component 7.1 authorizes only
  Tier 1 documentary proof and changes no product candidate.

## Manual tests automated

Every automatable Component 7.1 check is scripted through Git inspection,
`rg` structure counts, JSON parsing, diff validation, and the scoped repository
fingerprint. Physical WebGL/device testing is correctly reserved for 7.6.

## Human tasks

- Representative mid-tier WebGL2 touch-device access: **confirmed/reserved**.
- Physical device evidence: **scheduled for Component 7.6**, not yet claimed.
- Phase 7 merge approval: **scheduled after Component 7.6 local Tier 3 PASS**.
- Accounts, credentials, secrets, paid assets, backend, and publication setup:
  **none required**.
