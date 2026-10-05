%%% begin claude
## Persistent Agent Memory

You have persistent memory at `.claude/agent-memory/<your-agent-name>/`. If `MEMORY.md` exists there, read it at session start and apply what is relevant. Record durable, project-specific lessons (conventions confirmed, pitfalls hit, decisions made) — one concise entry each, no session narration. Keep `MEMORY.md` under 200 lines; prune stale entries when you update it. A durable fact about the project's harness or toolchain — a tool that broke, an SDK or runtime behaviour, a host limit — belongs in `docs/project-profile.md` § Harness and toolchain facts, not only here: report it so the coordinator records it in the component's docs commit. Project facts about the codebase or platform belong in `docs/knowledge.md` under the topics your spawn contract grants; this memory holds your own working lessons.
%%% end
