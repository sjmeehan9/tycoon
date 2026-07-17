---
description: Load these instructions into the AI's context at the commencement of any new session.
applyTo: '**' # instructions are automatically added to the request context when the pattern matches an attached file
---
# Instructions for all Agents

## Preliminaries
- **First read:** `docs/project-profile.md` is the per-repo stack contract and the single source of truth for anything stack- or repo-specific: platform and languages, the validation sequence (exact build, lint, and test commands — including the Xcode scheme and simulator destination for iOS projects), test frameworks, coverage policy, project layout, run instructions, and the git workflow. If the file is missing, stop and raise it as a blocker — do not guess commands or configuration.
- **Platform & versions:** Platform, language, and framework versions are defined per repo in the Platform & languages and Framework versions sections of `docs/project-profile.md`. Do not assume versions this file or your training data suggest — the profile is authoritative.
- **Your role:** Provide clean, production-grade, production-ready, high-quality code that adheres to the standards below. Do not partially implement anything — deliver complete working components, never placeholders or production TODOs. Every delivery is a complete, end-to-end feature slice: if the work is too much at once, take more components or phases, never a thinner feature. Never shrink a feature to fit a count, a time budget, or a document length.
- **Communication:** All agents communicate via the structured Agent Report format defined in their agent definitions. Use that format for every user-facing message; do not invent ad-hoc report formats. The format is not duplicated here.
- **Local development:** Follow the run instructions in `docs/project-profile.md`. Typical setup by stack: Swift/iOS — generate the Xcode project with `xcodegen generate` at the repo root; Python — activate the virtual environment with `source .venv/bin/activate` before running any Python code; TypeScript — install dependencies with `pnpm install`.
- **MCP servers:** GitHub MCP enabled.

---

## 0) Quickstart

```bash
# iOS (generate Xcode project — run at the repo root)
xcodegen generate

# iOS (build & test via CLI)
# Use the scheme, simulator destination, and validation sequence defined in docs/project-profile.md.

# VENV (repo root)
source .venv/bin/activate

# ENV (repo root — .env.local is gitignored; copy from .env.example)
set -o allexport; source .env.local; set +o allexport

# TESTS
# Run the validation sequence defined in docs/project-profile.md.
```

## 1) Application Overview

### Base Folder Structure

All projects share this root layout. Application code lives at the repository root per the stack layouts below — the authoritative layout for a given repo is the Project layout section of `docs/project-profile.md`.

```
(root-folder-name)/
├── .claude/
│   ├── agent-memory/
│   ├── agents/
│   ├── settings.local.json
│   └── skills/
├── .github/
│   ├── agents/
│   ├── instructions/
│   │   └── copilot.instructions.md    # this file
│   └── workflows/
├── .env.example                        # committed template for environment variables
├── .env.local                          # local secrets/config — gitignored (copy from .env.example)
├── .venv/                              # Python stack only
├── docs/
│   └── components/
├── scripts/                            # project scripts (if any)
├── .gitignore
├── LICENSE
└── README.md
```

### Python Layout

*Applies when the project profile names Python as a project stack.*

```
pyproject.toml   project metadata, dependencies, tool config
src/             application code (suggested internal organisation: config/, models/, services/, routes/, utils/)
tests/           pytest tests (unit/, integration/; conftest.py at the top level)
docs/            project documents (plans, breakdowns, reports)
```

### TypeScript Layout

*Applies when the project profile names TypeScript as a project stack.*

```
package.json     project metadata & scripts
src/             application code (suggested internal organisation: app/, components/, lib/, services/, types/, config/)
public/          static assets
tests/           unit tests (e2e/ for the profile's E2E harness specs)
docs/            project documents (plans, breakdowns, reports)
```

### iOS Layout

*Applies when the project profile names Swift/iOS as a project stack.*

```
project.yml      XcodeGen project spec — source of truth for the Xcode project (.xcodeproj is generated and gitignored)
.swiftlint.yml   SwiftLint configuration
Sources/         application code (suggested internal organisation: App/, Models/, Services/, ViewModels/, Views/, Resources/, Config/)
Tests/           unit tests
UITests/         UI tests (the profile's UI/E2E harness)
docs/            project documents (plans, breakdowns, reports)
```

### Context Documents

The following documents drive phased implementation and must be kept up to date. Read `docs/project-profile.md` first in every session; consult the others as your task requires.

| Document | Producer | Purpose |
|----------|----------|---------|
| `docs/project-profile.md` | Bootstrap script; maintained by the repo owner | **First read.** Per-repo stack contract: platform & languages, validation sequence, test frameworks, coverage policy, project layout, run instructions, git workflow |
| `docs/*-product-solution-doc-*.md` | Supplied by the user; updated by the phase-docs agent | Application overview, architecture, design decisions |
| `docs/brief.md` | project-manager agent | Synthesized project brief with problem statement, goals, users, requirements, constraints |
| `docs/solution-design.md` | solutions-architect agent | Detailed technical solution design document |
| `docs/phase-plan.md` | technical-business-analyst agent | Phase sequencing, dependencies, delivery strategy |
| `docs/phase-X-component-breakdown.md` | tech-lead agent | Complete requirements for every component in a phase |
| `docs/implementation-context-phase-X.md` | implement agents (appended per component) | Running log of implemented components within a phase |
| `docs/components/phase-X-component-X-Y-overview.md` | implement agent | Summary of the component implementation |
| `docs/phase-summary.md` | phase-docs agent | Post-completion summary of delivered phases |

## 2) Code Style and Conventions

Each stack section below applies only when `docs/project-profile.md` names that stack for the project.

### Swift / iOS

*Applies when the project profile names Swift/iOS as a project stack.*

- **Version & concurrency mode:** Build with `SWIFT_STRICT_CONCURRENCY: complete`. Swift and iOS SDK versions per the Framework versions section of `docs/project-profile.md`.
- **Architecture:** MVVM with `@Observable` macro. Views are declarative and stateless — business logic lives in ViewModels. Navigation logic lives in Views (SwiftUI `NavigationStack`), not ViewModels.
- **Project generation:** XcodeGen (`project.yml`). Never edit the generated `.xcodeproj` manually — regenerate with `xcodegen generate` at the repo root. Commit `project.yml`, not `.xcodeproj`.
- **Data models:** SwiftData `@Model` classes for persistence. Plain structs for transient domain objects. Enums with raw values for fixed-set types.
- **Concurrency:** `async`/`await` and structured concurrency (`TaskGroup`, `withThrowingTaskGroup`). Mark actors and Sendable types explicitly. Never use `@unchecked Sendable` without a documented safety justification. Isolate mutable state to actors or `@MainActor` ViewModels.
- **Error handling:** Typed `Error` enums for domain-specific failures. Catch at ViewModel boundaries and surface user-facing messages. Never `try!` or force-unwrap (`!`) in production code — SwiftLint enforces `force_unwrapping: warning`.
- **Secrets & config:** Inject OAuth credentials and API keys at build time (e.g., a config-generation script producing a `Secrets.plist` from gitignored xcconfig values). Never hardcode secrets in Swift source; generated secret files are gitignored.
- **Dependencies:** Managed via Swift Package Manager in `project.yml` (`packages:` section). Pin to exact versions or tight ranges. Prefer Apple frameworks over third-party when feasible. Any new dependency must include a rationale comment in `project.yml`.
- **Testing:** Unit-test framework and UI/E2E harness per the Test frameworks section of `docs/project-profile.md`. Essential tests proving the primary paths; coverage policy, if any, is defined in `docs/project-profile.md`. Use `@MainActor` isolation for tests that touch UI-bound types.
- **Logging:** Use `os.Logger` (unified logging) with appropriate log levels. Subsystem = bundle identifier, category = module name. Never log tokens, credentials, or full user content.

#### SwiftLint Standards
SwiftLint runs as a build tool plugin on every build. The following thresholds are enforced in `.swiftlint.yml` and must be respected in all new code:

| Rule | Warning | Error | Guidance |
|------|---------|-------|----------|
| `line_length` | 120 | 200 | Break long lines at parameter boundaries, ternary operators, or chain calls. Extract complex predicates into named helpers. |
| `file_length` | 400 | 600 | Split large files by responsibility. One primary type per file. Use extensions in separate files for protocol conformances. |
| `type_body_length` | 300 | 500 | If a class/struct exceeds 300 lines, extract logical groups into extensions or decompose into collaborating types. |
| `function_body_length` | 50 | 80 | Extract sub-operations into private helper methods. A function over 50 lines is doing too much. |
| `large_tuple` | 3 elements | — | Replace tuples with >3 elements with a named struct. Callback signatures must use structs, not `(String, UUID, String, String, String)`. |
| `force_unwrapping` | warning | — | Use `guard let`, `if let`, or `??` with a sensible default. |
| `trailing_newline` | warning | — | Every file must end with exactly one trailing newline. |

**Existing `swiftlint:disable` directives** in legacy files are tolerated but must not be added to new files. When modifying a file with disable directives, make reasonable efforts to reduce violations and eventually remove the directive.

#### SwiftUI View Guidelines
- **Small, composable views.** Extract reusable subviews into their own files when they exceed ~80 lines or are used in more than one place.
- **Previews:** Every View file should include a `#Preview` macro for rapid iteration. Previews must compile and render without live data (use mock/stub data).
- **Accessibility:** Set `.accessibilityLabel` and `.accessibilityHint` on all interactive elements. Use semantic components (`Button`, `Toggle`, `Picker`) rather than gesture-only interactions.
- **Layout:** Prefer `LazyVStack`/`LazyHStack` for long scrollable lists. Avoid `GeometryReader` unless absolutely necessary — prefer `frame()`, `fixedSize()`, and layout priorities.

#### iOS Naming Conventions
- **Files:** One primary type per file, filename matches the type name (`SettingsViewModel.swift`). Extensions use `TypeName+ExtensionPurpose.swift` (e.g., `UserProfile+SwiftData.swift`).
- **Types:** `UpperCamelCase` for types, protocols, enums. Protocols describing capabilities use `-able`/`-ible` suffix (`Syncable`) or `...Protocol` for role protocols (`DataProviderProtocol`).
- **Properties & methods:** `lowerCamelCase`. Boolean properties read as assertions: `isLoading`, `hasUnsavedChanges`, `canSync`.
- **Constants:** `lowerCamelCase` for instance/local constants; `static let` for type-level constants. No `UPPER_SNAKE_CASE` in Swift.
- **Enum cases:** `lowerCamelCase` (Swift standard).

### Python

*Applies when the project profile names Python as a project stack.*

- **Version:** Per the Platform & languages and Framework versions sections of `docs/project-profile.md`. Enable `from __future__ import annotations` where helpful.
- **Style Guide:** Follow PEP 8 for code style and formatting.
- **Formatting:** Use Black for code formatting and isort for import sorting.
- **Typing:** Comprehensive type hints incl. `TypedDict`, `Protocol`, and `Final`; prefer `|` unions; avoid `Any`.
- **Docstrings:** Use Google style docstrings for all public functions, classes, and modules.
- **Data models:** **Pydantic v2** `BaseModel` for request/response; `dataclasses` for internal state where validation is not required.
- **Imports:** Always use **absolute imports** from the installed package name (e.g., `from src.services.auth import AuthService`), never relative imports (`from .services.auth import ...`) and never path-relative scripts-style imports (`from services.auth import ...`). The project must have a `pyproject.toml` (or `setup.py`) at the repo root with the package declared, and the virtual environment must install it in editable mode (`pip install -e .`). This ensures the same import path resolves identically whether code is run via `pytest`, `python -m`, direct script execution, or in production. If a `pyproject.toml` does not yet exist, create one before adding any new modules. Never manipulate `sys.path` at runtime to fix import resolution — that indicates a packaging issue, not an import issue.
- **Error handling:** Use custom exceptions for domain-specific errors; avoid bare `except`.
- **Testing:** Use pytest with fixtures (per the profile's Test frameworks section). Essential tests proving the primary paths; coverage policy, if any, is defined in `docs/project-profile.md`. Integration tests and end-to-end tests using provided credentials.
- **Human-gated external system tests:** When an integration test requires a live external system that cannot be stubbed, gate execution behind a custom pytest CLI flag (registered via `pytest_addoption`) with a `pytest_collection_modifyitems` hook that auto-skips marked tests when the flag is absent, and a session-scoped confirmation fixture that verifies the external system is available before running. Tests must pass deterministically when the system is available and auto-skip cleanly in CI or when the flag is omitted. Always disconnect and clean up in a `finally` block.
- **Logging:** Use Python's built-in `logging` module with structured logging (e.g., JSON format). Log at appropriate levels (DEBUG, INFO, WARNING, ERROR, CRITICAL). Never log sensitive information such as API keys or provider configs.
- **Config:** Centralise configuration in a dedicated config module (YAML files + loaders). Never log provider configs or API keys. Support env overrides.

### TypeScript

*Applies when the project profile names TypeScript as a project stack.*

- **Version:** TypeScript strict mode. Framework and runtime versions (Next.js, Node.js, etc.) per the Framework versions section of `docs/project-profile.md`.
- **Style Guide:** Follow Airbnb TypeScript style guide.
- **Formatting:** Use Prettier for code formatting and ESLint for linting.
- **Typing:** Strict typing with interfaces and types; avoid `any`.
- **Docstrings:** Use TSDoc for all public functions, classes, and modules.
- **Testing:** Unit-test framework and E2E harness per the Test frameworks section of `docs/project-profile.md` (use React Testing Library for component tests where applicable). Essential tests proving the primary paths; coverage policy, if any, is defined in `docs/project-profile.md`.
- **Config:** Centralise configuration in a dedicated config module (YAML or JSON + loaders). Never log provider configs or API keys.

### Completion Standards (All Languages)
- **No placeholders:** Code must never contain `pass`, `...`, `# TODO`, `// TODO`, `FIXME`, `NotImplementedError`, `throw new Error('not implemented')`, or `fatalError("not implemented")` in delivered components.
- **No partial files:** Every file must be syntactically valid and functionally complete for its stated scope.
- **No deferred work:** If a function is declared, it must be implemented. If a dependency is imported, it must be used.
- **Edge cases:** All public functions must handle expected edge cases (nil/null/undefined inputs, empty collections, boundary values) explicitly.
- **Fail loudly:** Errors must be raised or logged with actionable context — never silently swallowed.
- **No force-unwraps or force-casts:** In Swift, never use `!` or `as!` in production code. Use `guard let`, `if let`, `as?`, or `??` with explicit fallback handling.

### Integration Standards
- **Backward compatibility:** New code must not break existing tests or functionality unless a spec explicitly requires a breaking change.
- **Import from, don't duplicate:** Reuse existing modules and utilities. Do not rewrite functionality that already exists in the codebase.
- **Consistent patterns:** Follow the conventions established by previously implemented components (naming, file structure, error handling patterns, config patterns).
- **Dependency hygiene:** Any new dependency must be added to the appropriate manifest (`requirements.txt` / `pyproject.toml` / `package.json` / `project.yml`) with a brief comment explaining why it was added.
- **SwiftData model evolution:** When adding or removing `@Model` properties, ensure existing persisted data can still be loaded. Use default values on new properties. Test migration paths if the schema change is non-additive.
- **Regenerate after project.yml changes:** Any change to `project.yml` requires running `xcodegen generate` before opening Xcode. Verify the project builds and tests pass after regeneration.

---

## 3) CI/CD and Security
- **iOS pipeline:** `xcodebuild build` + `xcodebuild test` via Xcode Cloud or GitHub Actions. SwiftLint runs as a build tool plugin (zero-warning policy on new files).
- **Python pipeline:** Black, isort, pytest per the profile's validation sequence.
- **Web pipeline (pnpm):** build + type check; lint.
- **Security pipeline:** Gitleaks; CodeQL as configured.
- **Blocking policy:** CI must be green for PR merge. SwiftLint errors are build-blocking; warnings must not increase.

### Pre-Commit Validation
All agents and contributors must run the validation sequence defined in `docs/project-profile.md` before considering work complete. For iOS projects, use the scheme, simulator destination, and validation sequence defined in `docs/project-profile.md` — never guess or invent them. The profile's commands are authoritative; the typical shape by stack is:

```bash
# iOS (repo root)
xcodegen generate
# then xcodebuild build / xcodebuild test with the scheme and simulator destination
# defined in docs/project-profile.md

# Python
source .venv/bin/activate
black --check src/ tests/
isort --check-only src/ tests/
pytest -q

# TypeScript
pnpm build
pnpm lint
pnpm test
```

Additional project-specific quality gates apply only if they are named in the profile's validation sequence. CI must be green before merge.

---

## 4) Environment & Config Matrix
- **Local development:** Use root-level `.env.local`, copied from the committed `.env.example` template. `.env.local` is gitignored — never commit real secrets.
- **Testing:** Use root-level `.env.test.local` with test credentials (gitignored via the `.env.*.local` pattern).
- **Production:** Use environment variables or secret management (e.g., AWS Secrets Manager); never commit real secrets.
- **iOS secrets:** Prefer build-time injection via xcconfig/Info.plist (e.g., a config-generation script producing a `Secrets.plist` from gitignored xcconfig values) over reading `.env.local` at runtime. Generated secret files are gitignored.

---

## 5) App Store & Distribution

*Applies when the project profile names Swift/iOS as a project stack.*

### App Store Review Compliance
- **No private APIs:** Only use public Apple SDK interfaces. Private API usage causes automatic rejection.
- **Entitlements:** Only request entitlements the app actually uses. Every entitlement in the app's `.entitlements` file must correspond to a feature exercised during App Review.
- **Privacy manifest:** Include a `PrivacyInfo.xcprivacy` file declaring all API reason categories (required APIs, tracking domains, data collection). Apple requires this for App Store submissions.
- **Minimum functionality:** The app must provide meaningful standalone utility. An empty shell, web wrapper, or "coming soon" screen will be rejected.

### Build & Signing
- **Code signing:** Use automatic signing with the team's Apple Developer Program identity for Debug. For release, use manual signing with a distribution provisioning profile.
- **Version bumping:** `MARKETING_VERSION` (e.g., `1.0.0`) is the user-facing version. `CURRENT_PROJECT_VERSION` (integer) is the build number. Increment the build number for every TestFlight upload and App Store submission. Both are set in `project.yml`.
- **Architecture:** Build for `arm64` only (all supported iOS devices). Do not include `x86_64` slices in release builds — Xcode strips simulator architectures automatically with "Build Active Architecture Only" = NO for Release.
- **Bitcode:** Deprecated; not required since Xcode 14. Do not enable.

### Pre-Submission Checklist
Before submitting to App Store Connect:
1. All SwiftLint **errors** resolved (warnings tolerated but should trend downward).
2. All unit tests pass (`xcodebuild test`).
3. App icon provided in all required sizes via `Assets.xcassets`.
4. Launch screen configured (`UILaunchScreen` in Info.plist).
5. Privacy usage descriptions set for every permission the app requests (the relevant `NS...UsageDescription` keys in Info.plist).
6. No debug/development code paths reachable in Release configuration.
7. No hardcoded localhost URLs, test tokens, or mock data in Release builds.
