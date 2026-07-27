## Validation Tiers And Evidence Reuse

`docs/project-profile.md` defines three validation tiers. Use the smallest tier that owns the current gate:

- **Targeted validation** — fast inner-loop checks for the changed component. Implement and Debug own this tier. When refinement explicitly marks a human-setup or isolated documentation-only `fast` component with `validationTier: targeted`, one recorded targeted proof is also that component's completion gate; runtime source/config changes never use this exception.
- **Component validation** — one clean verification of the complete runtime component candidate, including its required tests and real-runtime smoke path. Run it exactly once for an unchanged candidate: Implement owns it in the `fast` and `review` lanes; Test owns it in the `test` and `full` lanes.
- **Phase validation** — the full cumulative suite, all phase UI/E2E flows, and critical backend paths. Only the Test agent in `Test Phase X` mode owns this tier.

Every completion-gate result records:

1. The output of a scoped command formed by appending the explicit component-owned source/test/config paths after `python3 scripts/worktree-fingerprint.py --` before a component gate, or the unscoped command before the phase gate. The content hash is stable across a commit. It excludes state, overview, test-report, and phase-summary evidence files so writing evidence does not invalidate its candidate identity.
2. Exact commands, exit status, duration, and a concise result summary.
3. Paths to raw logs when failure evidence is too large for the report.

Component evidence is reusable while its recorded **fingerprint scope** is unchanged. Before commit, Review compares the current scoped fingerprint; after commit, aggregate Review verifies the historical component SHA by adding `--rev "$COMPONENT_SHA"` to that same explicit scoped command and audits later integration diffs instead of comparing old evidence to the current global tree. The phase gate uses the global fingerprint. Any change inside the applicable scope invalidates that evidence and requires its owning validation tier to run once again; an unrelated later component does not.

Use the profile's named fallback immediately when a preferred tool cannot complete within its client timeout. If a previous recorded duration already exceeds that timeout, do not launch a predictably doomed attempt first.

Treat simulators, device sessions, local servers bound to fixed ports, mutable test databases, and the Git index as exclusive resources. In team mode, acquire the coordinator's lease before using one and release it immediately after. In solo/direct mode, first verify that no concurrent agent or process owns the resource/index, self-hold it for the operation, and stop if exclusivity cannot be established.

Implementation authoring is serialized by default on the profile's phase branch, with **one active component-delivery engagement at a time**. Finish the component's assigned gate and commit before starting the next component; inactive role engagements may be retained for later resume but do no concurrent work. Parallel component authors are allowed only when `docs/project-profile.md` explicitly supplies a complete branch/worktree integration protocol covering creation, dependency bases, integration order, conflict ownership, post-integration validation, and cleanup; isolated worktrees or file disjointness alone are not sufficient.
