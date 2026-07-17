---
description: AI agent troubleshooting guide — known pitfalls and proven fixes to prevent repeated mistakes during development.
applyTo: '**'
---

# AI Agent Troubleshooting Guide

Proven, cross-project pitfalls and fixes. Consult the Cross-Stack sections plus the section for your project's stack (per `docs/project-profile.md`) before implementing changes in the relevant areas. Append new entries under the appropriate stack heading as they are discovered.

---

## Cross-Stack

### 1. Git Operations in Automated Pipelines

#### 1.1 Always check `git status` before committing
**Problem:** Running `git commit` on a clean working tree produces an opaque error (`nothing to commit, working tree clean`) that gets reported as a generic failure without useful context.
**Fix:** Run `git status --porcelain` first. If output is empty, raise a specific error with structured context instead of letting `git commit` fail opaquely.

#### 1.2 AI agents can switch branches during execution
**Problem:** Agents executing in a repository may create or switch to branches other than the expected feature branch. Commits end up on the wrong branch, and post-processing finds zero commits where it expected them.
**Fix:** Pin the agent to the expected branch in its prompt and instruct it not to switch or create branches. After execution, detect the current branch; if it differs, reconcile by merging the stray commits back into the expected branch.

#### 1.3 Agents may leave uncommitted changes
**Problem:** An agent may complete its session (write files, run tests) without committing. Pipelines relying on `git log` then find zero commits and crash creating a PR from an empty branch.
**Fix:** Before collecting changes, run `git status --porcelain` and auto-commit any pending work. Guard change collection so zero commits raises a specific error before any PR-creation attempt.

#### 1.4 `gh pr create` fails on branches with no commits
**Problem:** `gh pr create` on a branch with no commits relative to base fails with an opaque GraphQL error (`No commits between main and feature/...`).
**Fix:** Verify the commit count before attempting PR creation; raise a meaningful error when it is zero.

#### 1.5 GitHub rejects self-approval on PRs
**Problem:** Submitting a PR review with the `APPROVE` (or `REQUEST_CHANGES`) event where the authenticated user is the PR author returns HTTP 422, and the review content is lost.
**Fix:** Catch the 422 and retry with the `COMMENT` event, which GitHub always accepts, so the review content is still posted.

#### 1.6 Never rely on implicit CLI authentication in headless environments
**Problem:** Tooling that depends on an interactive `gh auth login` state stalls or times out silently in CI and other headless environments.
**Fix:** Always pass explicit token authentication via environment variables (`GH_TOKEN`, `GITHUB_TOKEN`, or a PAT). Never depend on pre-existing interactive login state.

### 2. GitHub Actions Workflows

#### 2.1 GitHub reserves the `GITHUB_` prefix for secrets
**Problem:** Repository secrets named `GITHUB_*` (e.g., `GITHUB_PAT`) are rejected or silently shadowed by GitHub's built-in `GITHUB_*` variables.
**Fix:** Name secrets without the `GITHUB_` prefix (e.g., `PAT`) and reference them as `secrets.PAT`.

#### 2.2 All workflow `inputs` are stringified
**Problem:** GitHub Actions converts all `workflow_dispatch` inputs to strings — integers become `"42"`, booleans become `"true"`, and lists arrive double-encoded if passed as JSON.
**Fix:** Consolidate typed optional fields into a single JSON-serialized `config` input; the receiver calls `json.loads` once to recover native types. Cast numerics before serialization.

#### 2.3 Workflow dispatch has a 10-input limit
**Problem:** `workflow_dispatch` allows at most 10 inputs, and optional fields consume the budget quickly.
**Fix:** Pack optional/config fields into the single JSON `config` input (see 2.2); reserve top-level inputs for required identifiers only.

#### 2.4 Never inline `${{ inputs.* }}` in `run:` blocks
**Problem:** Actions expressions are expanded *before* the shell runs. User-provided content containing `$(...)`, backticks, or shell metacharacters executes arbitrary commands — a **shell injection vulnerability**.
**Fix:** Pass inputs via environment variables and reference them quoted:

```yaml
- name: Parse config
  env:
    CONFIG: ${{ inputs.config }}
  run: |
    python3 -c "
    import json, os
    config = json.loads(os.environ.get('CONFIG', '{}'))
    "
```

#### 2.5 `actions/checkout` requires paths under `$GITHUB_WORKSPACE`
**Problem:** The `path` parameter of `actions/checkout` must resolve under `$GITHUB_WORKSPACE`; absolute paths outside it fail.
**Fix:** Check out to a relative path, then `mv` to the desired absolute location in a subsequent step.

#### 2.6 `GITHUB_ENV` variables are single-line
**Problem:** Multi-line content (markdown, code fences) written to `GITHUB_ENV` is truncated at the first newline.
**Fix:** Write multi-line content to a temporary file and pass a file reference (e.g., `@/tmp/instructions.txt`) that the consumer resolves.

#### 2.7 JSON list arguments arrive shell-normalized
**Problem:** JSON array inputs like `["a.md", "b.md"]` passed through shell steps can arrive with quotes stripped (`[a.md, b.md]`), breaking strict JSON parsing.
**Fix:** Parse defensively, in order: strict `json.loads`; strip outer brackets and split on commas; plain comma-separated split.

#### 2.8 Failure handlers must use only stdlib
**Problem:** `if: failure()` handlers run even when dependency installation failed earlier; importing application code there crashes with `ModuleNotFoundError` and swallows the real failure.
**Fix:** Write failure-path code using only the standard library (`urllib.request`, `json`, `hmac`, `hashlib`). Never import application modules in failure handlers.

#### 2.9 Python 3.12+ runners do not bundle `setuptools` or `wheel`
**Problem:** `pip install -e .` fails with `ModuleNotFoundError: No module named 'setuptools'` on Python 3.12+ runners.
**Fix:** Run `pip install setuptools wheel` before any editable installs.

### 3. Containers & Deployment

#### 3.1 Cross-platform image architecture
**Problem:** Docker builds on Apple Silicon produce `arm64` images by default, while many cloud container services only run `x86_64/amd64`. The container fails silently with zero application logs and failing health checks.
**Fix:** Specify `--platform=linux/amd64` in **both** `FROM` directives of multi-stage builds and in the `docker build` command:

```dockerfile
FROM --platform=linux/amd64 python:3.13-slim AS builder
FROM --platform=linux/amd64 python:3.13-slim AS runner
```

#### 3.2 `request.base_url` behind load balancers returns internal addresses
**Problem:** In containerized deployments behind a load balancer or reverse proxy, `request.base_url` resolves to the internal address (e.g., `http://0.0.0.0:8000`), so callbacks and links built from it fail.
**Fix:** Configure the public service URL explicitly (environment variable or config file) and use it instead of `request.base_url` when constructing externally visible URLs.

#### 3.3 Environment variable names must match the application's config conventions
**Problem:** Deployments that set environment variables under names the application's config loader does not recognise cause silent fallback to defaults — the app runs but is misconfigured.
**Fix:** Verify variable names against the config-loading logic (including any required prefixes) before deploying.

#### 3.4 Dev servers default to localhost — no LAN access
**Problem:** Most dev servers bind `127.0.0.1` by default, so the app is unreachable from other devices (e.g., a phone on the same network) during cross-device testing.
**Fix:** For local development tools intended for cross-device use, bind to all interfaces (`0.0.0.0`). Keep the default localhost binding for production and put a reverse proxy in front instead.

### 4. Agent Execution Environments

#### 4.1 `cwd` is not a filesystem sandbox
**Problem:** Setting a working directory for an automated agent does not confine it — the agent can traverse to parent directories via `../` and read orchestration code or sensitive files.
**Fix:** Apply defense in depth: check out the target repository to an isolated path rather than a subdirectory of the orchestration code; add explicit workspace-boundary instructions to the agent prompt; log the effective working directory at session start.

### 5. Error Handling & Data Hygiene

#### 5.1 Handle unknown variants explicitly
**Problem:** Code that switches over externally defined variant sets (SDK event types, enum-like API fields, message kinds) will eventually receive values it does not know. Logging every high-frequency known event at INFO floods logs; silently absorbing unknown values hides real integration drift.
**Fix:** Add explicit handlers for all known variants and log high-frequency ones (e.g., streaming deltas) at DEBUG. Handle unknown variants explicitly: log at WARNING including the unexpected value, and fail loudly in debug builds. Never absorb unknown variants silently.

#### 5.2 URLs in error messages can leak embedded credentials
**Problem:** Exception messages from failed HTTP requests often contain the full URL — including query-string tokens (`?token=...`, `?key=...`) or Basic Auth userinfo (`user:pass@host`). Surfacing these in UI or logs exposes secrets.
**Fix:** Sanitise URLs before rendering them anywhere user-facing: redact the userinfo portion of the authority (`***@host`) and the values of sensitive query parameters (`token`, `key`, `secret`, `password`, `api_key`, `apikey`, `access_token`, `client_secret`).

#### 5.3 Idempotency guards on terminal state transitions
**Problem:** Duplicate callbacks or retried updates for the same record (from races or retries) can corrupt stored state that has already reached a terminal status.
**Fix:** Use conditional writes that reject updates to records already in a terminal state; return `409 Conflict` for duplicate terminal submissions.

### 6. Dependency Management

#### 6.1 Pin dependency version ranges
**Problem:** Unpinned dependencies (`>=X`) pull in breaking changes, and some libraries must match the version of a companion CLI tool.
**Fix:** Use upper-bound pins on major tools (e.g., `>=2.170.0,<2.180.0`) and document any CLI/library version coupling.

#### 6.2 Audit transitive dependencies
**Problem:** Unnecessary or vulnerable transitive dependencies increase attack surface and build times.
**Fix:** Periodically review the dependency tree; prefer stdlib alternatives for simple needs (e.g., `urllib.request` over `requests` in scripts).

---

## Swift / iOS

No entries recorded yet. Append Swift/iOS pitfalls (Xcode, simulators, SwiftData, signing) here as they are discovered in real projects.

---

## Python

### 7. Serialization & Type Coercion

#### 7.1 Pydantic URL objects break serialization boundaries
**Problem:** Pydantic's `AnyUrl`/`AnyHttpUrl` fields produce URL *objects*, not strings. Passing them to JSON serializers or storage layers that expect primitives raises `TypeError`.
**Fix:** Cast URL fields to `str()` at serialization and storage boundaries, guarded with `is not None` to preserve nullable semantics. Apply the cast at both the API layer and the storage layer (defense in depth).

#### 7.2 Nested validation errors require `dict[str, Any]`
**Problem:** FastAPI's `RequestValidationError.errors()` returns nested structures; typing error-detail fields as flat primitive unions rejects them at serialization time.
**Fix:** Use `dict[str, Any] | None` for error-detail fields that may carry framework-generated validation errors.

#### 7.3 Adding required Pydantic fields breaks loading of pre-existing JSON
**Problem:** Adding a required field to a model makes `model_validate()` fail on every previously saved JSON file that lacks it.
**Fix:** Declare new fields with sensible defaults where possible; for complex fields, inject defaults into the payload before validation; use defensive `getattr(obj, "field", default)` at consumption sites for in-memory objects loaded from old data.

#### 7.4 Corrupted JSON files need distinct error handling
**Problem:** Catching only `OSError` around file loads lets `json.JSONDecodeError` and Pydantic `ValidationError` propagate as raw, contextless exceptions.
**Fix:** Handle each failure mode with a contextual error message (which file, which record, what was wrong). In listing operations where one bad file must not block the rest, log a warning and skip that file.

### 8. Async & Event Loops

#### 8.1 Event loop lifecycle in mixed sync/async code
**Problem:** Multiple `asyncio.run()` call sites, or `httpx.AsyncClient` instances outliving their event loop, raise `RuntimeError: Event loop is closed`.
**Fix:** Consolidate async operations into tightly scoped `asyncio.run()` blocks; close async clients within the event loop that created them; never share async clients across loop boundaries.

### 9. Testing

#### 9.1 Clear singleton caches in tests
**Problem:** Singletons built on `lru_cache` or module-level instances persist state between test cases, so environment overrides leak from one test into the next.
**Fix:** Clear caches (e.g., `get_settings.cache_clear()`) in fixtures or setup when testing configuration behavior.

#### 9.2 Use `raise_server_exceptions=False` for error-handler tests
**Problem:** FastAPI's `TestClient` re-raises server exceptions by default, making generic `Exception` handlers untestable.
**Fix:** Use `TestClient(app, raise_server_exceptions=False)` when testing exception-handler middleware.

#### 9.3 Gate external-system tests behind CLI flags
**Problem:** Integration tests requiring live external systems fail in CI or when the system is unavailable, producing flaky suites.
**Fix:** Gate behind custom pytest CLI flags (e.g., `--e2e-confirm`), auto-skip via `pytest_collection_modifyitems` when the flag is absent, and use session-scoped confirmation fixtures.

#### 9.4 PyYAML parses the workflow key `on` as `True`
**Problem:** Loading GitHub Actions YAML with PyYAML parses the `on` trigger key as boolean `True`, not the string `"on"`.
**Fix:** In tooling that parses workflow files, use `workflow.get("on") or workflow.get(True)`.

### 10. Quality Tooling

#### 10.1 AST-based placeholder checks false-positive on `__init__.py`
**Problem:** Quality tools that flag placeholder function bodies (`pass`, `...`, docstring-only) incorrectly flag `__init__.py` files, which legitimately use these patterns for package initialisation and re-export.
**Fix:** Skip `__init__.py` in placeholder-body detection, and skip entirely empty `__init__.py` files in docstring checks.

---

## TypeScript

No entries recorded yet. Append TypeScript pitfalls here as they are discovered in real projects.
