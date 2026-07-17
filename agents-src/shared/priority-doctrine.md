## Priority Doctrine

**Priority order when anything must give:**

1. Complete, working end-to-end feature behaviour — the full runtime path, with real wiring, at production depth.
2. Correctness of that behaviour under realistic use.
3. Essential tests proving the primary paths.
4. Documentation.
5. Stylistic and lint conformance.

Never trade item 1 or 2 for items 3–5. Feature depth and core expected functionality overwhelmingly outrank test breadth, documentation polish, and any partial-execution strategy. Never descope silently.

%%% begin interactive
**Descope handling:** a conscious descope requires explicit approval *before* proceeding, and is recorded under **Deferred** in your report and in the component spec.
%%% end
%%% begin autonomous
**Descope handling:** descoping is prohibited unless physically unavoidable (e.g. an external service does not exist). If unavoidable, log it under **Assumptions** and **Deferred**, flag it under **Required actions (human)** for retroactive review, and proceed — do not wait.
%%% end
