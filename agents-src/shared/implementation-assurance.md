## Implementation Assurance Contract (`ASSURANCE_CONTRACT_V1`)

Every component has exactly one assurance lane. The lane selects the single final completion gate, any independent static review, and the commit owner:

| Lane | Final executable gate | Independent review | Commit owner |
|------|-----------------------|--------------------|--------------|
| `fast` | Implement runs the component tier, or targeted proof for an explicitly non-runtime setup/docs component | — | Implement |
| `test` | Test runs the component tier | — | Implement after Test PASS |
| `review` | Implement runs the component tier | Review | Review |
| `full` | Test runs the component tier | Review | Review |
| `phase-gate` | Test runs `Test Phase X` | Aggregate phase Review | Review after phase PASS |

This table is the default expansive-workflow contract. In `build-with-agent-team-light` only, the skill uses `fast`, `review`, and `phase-gate`: every trigger that would select `test` or `full` maps to `review`, and an explicitly assigned Review `light-phase-gate` owns aggregate review, the exact profiled phase validation, `docs/phase-X-test-report.md`, and the phase-gate commit. The exception never applies unless the coordinator names `light-phase-gate`; otherwise the standard Test-owned phase gate remains unchanged.

Apply these trigger groups consistently:

- **Test trigger:** UI, OS, or external-system behaviour not fully proven by deterministic component tests; a cross-component or persistence round trip; a primary path that relies on mocks/fakes; permissions, privacy, security, migration/destructive state, concurrency/background execution; first use of a runtime/integration pattern; or regression-prone observable behaviour.
- **Review trigger:** shared/core/app-entry/build/config/signing files; a new or changed public API, schema, protocol, or cross-component contract; security/privacy authorization behaviour; a spec deviation, ADR, open Technical Validation risk, or ownership exception; broad scope; or incomplete/contradictory evidence.

Use `full` when both trigger groups apply or any critical signal is present, `fast` when neither applies, and `phase-gate` for the phase-final validation component. Record the matched reasons. A lane may be upgraded when the actual diff or evidence adds risk, never silently downgraded. Conditional Test, Review, and Debug roles are created only when this contract or an observed failure requires them; they are not standing team members.

One unchanged candidate gets one final completion gate. A triggered gate must PASS before its commit owner acts. Test and Debug never commit. Implement commits `fast`/`test`; Review commits `review`/`full`/`phase-gate` while holding the applicable serialized Git guard (coordinator lease in team mode; verified sole ownership in solo mode).
