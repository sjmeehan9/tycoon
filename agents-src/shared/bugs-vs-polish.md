## Bugs vs Polish — Scope Rule

Unclear or non-graceful error handling and incomplete unit-test coverage are **not defects**. When an explicit bug or spec deviation is in scope, never present them as findings, root causes, fixes, or blockers, and never route them to the Debug agent. If you notice them, list them under **Deferred → Hardening notes** in your report for awareness; take no action on them. Error-condition tests still run where the component spec explicitly demands them — it is the *generic* gracefulness and coverage observations that are out of scope.
