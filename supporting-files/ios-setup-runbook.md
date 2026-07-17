# iOS Setup Runbook — machine & Apple account

One-time setup of the Mac and Apple account for iOS projects created from this template. Per-repo pieces (project scaffold, `fastlane/`, `.mcp.json`, profile) are created by `bootstrap.sh` — this runbook covers everything that lives *outside* the repo. Once complete, an agent session can build, run, test, UI-drive the simulator, and upload to TestFlight without an interactive Apple login.

**Toolchain at a glance:**

| Concern | Tool |
|---|---|
| Build → TestFlight pipeline | fastlane (local, driven via App Store Connect API key) |
| Agent-driven build/run/interact on simulator | XcodeBuildMCP (primary) + iOS Simulator MCP (fallback) — shipped per-repo via `.mcp.json` |
| Repeatable regression UI tests | XCUITest (native, run headlessly via `xcodebuild test` / XcodeBuildMCP) |
| Project generation | XcodeGen (`project.yml` → `.xcodeproj`, gitignored) |
| Remote control from iPhone (optional) | Happy Coder (wraps Claude Code; E2E-encrypted relay, permission prompts on the phone) |

---

## Stage 0 — Passive installs (~10 min active; downloads run unattended)

Kick these off the night before a build weekend — the downloads are large.

1. **Xcode** — full install from the Mac App Store (simulators and `xcodebuild` need full Xcode, not just Command Line Tools). After install:
   ```bash
   sudo xcodebuild -license accept
   xcodebuild -downloadPlatform iOS   # pulls the iOS simulator runtime
   ```
2. **Homebrew** (if not present):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. **Core CLI tools:**
   ```bash
   brew install node gh fastlane xcodegen
   ```
   Node 18+ is required by the npx-launched MCP servers (and Happy). Homebrew fastlane avoids Ruby version pain.
4. **Claude Code** — native installer:
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   claude          # first launch → browser auth
   claude doctor   # confirm healthy install
   ```
5. **iOS Simulator MCP dependency** — idb companion (needed for its UI-interaction tools):
   ```bash
   brew tap facebook/fb && brew install idb-companion
   ```
6. **Happy Coder (optional, for phone-remote sessions):**
   ```bash
   npm install -g happy-coder
   ```
   Install the **Happy — Claude Code** app on your iPhone now so session day is just a QR scan.
7. **Keep the Mac awake** for long unattended sessions: System Settings → Displays → Advanced → *Prevent automatic sleeping on power adapter when the display is off*, plus belt-and-braces in a spare terminal:
   ```bash
   caffeinate -dis
   ```
8. **Pre-warm the simulator** named in `docs/project-profile.md` so first boot isn't on the build clock:
   ```bash
   xcrun simctl boot "iPhone 17" 2>/dev/null; open -a Simulator
   ```

### MCP servers — nothing to register per machine

Repos from this template ship the servers project-scoped for both assistants: `.mcp.json` for Claude Code (trust prompt once per repo) and `[mcp_servers.*]` tables in `.codex/config.toml` for OpenAI Codex (loads once you trust the project on first `codex` run). If you prefer the servers available in *every* directory instead, register them at user scope (Claude Code shown; Codex equivalent is `codex mcp add`; note: servers registered mid-session don't appear until restart):

```bash
claude mcp add XcodeBuildMCP -s user -e XCODEBUILDMCP_SENTRY_DISABLED=true -- npx -y xcodebuildmcp@latest mcp
claude mcp add ios-simulator -s user -- npx -y ios-simulator-mcp
claude mcp list   # both should report Connected
```

XcodeBuildMCP requires macOS 14.5+ and Xcode 16+. It covers discovery, build, run, log capture, and simulator UI automation (tap/swipe/type/screenshot); iOS Simulator MCP is the idb-based fallback if an XcodeBuildMCP UI tool misbehaves.

---

## Stage 1 — The human window (target ≤ 10 minutes)

Everything here genuinely requires a human (browser logins, 2FA, QR scan).

| # | Task | Where |
|---|---|---|
| 1 | `gh auth login` → authenticate GitHub via browser | Terminal + browser |
| 2 | Xcode → Settings → Accounts → add your Apple ID (enables automatic signing; Xcode manages the distribution certificate) | Xcode |
| 3 | Create an **App Store Connect API key**: appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API → Team Keys → Generate. Role: **App Manager**. Record the **Issuer ID** and **Key ID**; download the `.p8` **once** (it cannot be re-downloaded) | Browser |
| 4 | Place the key where fastlane auto-discovers it: `mkdir -p ~/.appstoreconnect/private_keys && mv ~/Downloads/AuthKey_*.p8 ~/.appstoreconnect/private_keys/` | Terminal |
| 5 | In the repo: `cp fastlane/.env.example fastlane/.env` and fill in `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH` (the file is gitignored) | Terminal |
| 6 | Optional phone-remote: `cd <repo> && happy` → scan the QR with the Happy app, then drive the session from your phone | Mac + iPhone |

**Deliberately deferred to your first TestFlight window** (they need the final app name, and you'll be in App Store Connect anyway): creating the app record (~2 min: name, bundle ID, SKU, primary language) and adding yourself as an internal TestFlight tester (~1 min, one-time). fastlane's `produce` relies on an interactive Apple ID session with 2FA rather than the API key, so doing these two clicks by hand is faster and more reliable. Internal-tester builds do **not** require Beta App Review — they're installable minutes after processing.

**The `.p8` key must never enter the repo** — it lives only in `~/.appstoreconnect/private_keys/`. The repo's `.gitignore` blocks `*.p8` and `fastlane/.env` as a backstop.

---

## Stage 2 — Verification smoke test

First prompt of a working session on a freshly bootstrapped repo:

> Verify the toolchain end-to-end. 1) Confirm the XcodeBuildMCP and ios-simulator MCP tools are available. 2) Build this repo's walking-skeleton app for the simulator named in docs/project-profile.md via XcodeBuildMCP, boot/install/launch it, and screenshot the greeting. 3) Run the unit + UI test suites. 4) Confirm `gh auth status`, `fastlane --version`, and that fastlane/.env values are set and the `.p8` exists at the configured path. Report pass/fail per item. Do not touch App Store Connect.

All green → start the pipeline (`/build-with-agent-team`). Any red → fix now; a broken rung discovered mid-phase costs far more than at hour zero.

---

## Troubleshooting quick hits

- **MCP tools missing in session:** the server config was added mid-session — exit and relaunch the session.
- **First `xcodebuild` is glacial:** first-build package resolution and simulator warm-up are one-off; the Stage 0 pre-boot avoids most of it.
- **TestFlight upload fails with auth error:** check the `.p8` path/permissions and that the key role is App Manager; regenerate the key if the Issuer/Key ID were transposed.
- **Provisioning error on `fastlane beta`:** open the generated `.xcodeproj` once in Xcode, confirm Team is set and Automatic signing is ticked on the app target — then never touch signing again (`DEVELOPMENT_TEAM` in `project.yml` keeps it across regenerations).
- **Simulator "unable to boot":** `xcrun simctl shutdown all && xcrun simctl erase all` (destructive to simulator state only) and re-boot.
- **Happy QR won't pair:** both devices need internet (relay-based, not LAN); restart `happy` to mint a fresh QR.

*Sources for tool specifics: code.claude.com/docs (installer, MCP config), xcodebuildmcp.com/docs (requirements, client setup), github.com/getsentry/XcodeBuildMCP. Verify version-sensitive commands if this doc is reused much later.*
