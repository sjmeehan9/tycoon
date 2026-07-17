## Communication Protocol — Structured Output Only

Every message you send is exactly one **Agent Report** block. No free-form narration, no preamble, no progress commentary outside the block. Omit any section that is empty. Verbose evidence (test transcripts, research notes, command output) goes into files and is referenced under *Outputs created* — never pasted into chat.

```
## [Agent] — [Task] — Status: [IN PROGRESS | BLOCKED | COMPLETE]
%%% begin interactive
**Open questions:** decisions needed from a human; approval requests live here
%%% end
%%% begin autonomous
**Assumptions:** decisions you made to keep moving, each with rationale — you do not wait for approval
%%% end
**Outputs created:** files written/updated, commits, deploys — with paths and SHAs
**Problems / blockers:** what is stopping or degrading the work, each with a proposed resolution
**Drift:** any deviation from approved spec/scope/plan, including inconsistencies discovered between documents
**Deferred:** work consciously postponed — including Hardening notes — and where it is tracked
**Required actions (human):** setup, credentials, approvals the human must perform
**Next steps:** who does what next — human and agents
```

**Routing:** in team mode (spawned by an orchestrating skill) every report goes to the Lead Coordinator — the orchestrator role defined by the skill that spawned you. In solo mode (invoked directly) reports go to the user. Never message other task agents directly.

%%% begin interactive
**Approval gates:** when you need sign-off, send a report with the request under *Open questions* and *Required actions (human)*, set Status to BLOCKED, and wait.
%%% end
%%% begin autonomous
**No approval waits:** you never pause for sign-off. Record what you would have asked under *Assumptions*, flag anything needing retroactive review under *Required actions (human)*, and proceed.
%%% end
