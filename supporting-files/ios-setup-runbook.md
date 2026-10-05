# iOS Setup Runbook — machine & Apple account

One-time setup of the Mac and Apple account for iOS projects created from this template. Per-repo pieces (project scaffold, `fastlane/`, `.mcp.json`, profile) are created by `bootstrap.sh` — this runbook covers everything that lives *outside* the repo, plus the facts about the host and the simulators that the repo's `docs/project-profile.md` must record. Once complete, an agent session can build, run, test, UI-drive the simulator, and upload to TestFlight without an interactive Apple login.

Items marked **[iCloud]** apply only to apps that use iCloud or CloudKit; skip them otherwise.

**Toolchain at a glance:**

| Concern | Tool |
|---|---|
| Build → TestFlight pipeline | fastlane, driven by an App Store Connect API key that authenticates both the export and the upload — no Xcode account sign-in |
| Agent-driven build/run/interact on simulator | XcodeBuildMCP with its `simulator`, `simulator-management` and `ui-automation` workflows enabled — shipped per repo via `.mcp.json` and `.codex/config.toml` |
| Reading the simulator screen | The Claude app's simulator panel (human viewer) and XcodeBuildMCP `screenshot` / `snapshot_ui`; iOS Simulator MCP (`idb`) is a read-only accessibility-tree verifier on Xcode 27 — its input is broken there |
| Repeatable regression UI tests | XCUITest (native, run headlessly via `xcodebuild test` / XcodeBuildMCP) |
| Project generation | XcodeGen (`project.yml` → `.xcodeproj`, gitignored) |
| Remote control from iPhone (optional) | Happy Coder (wraps Claude Code; E2E-encrypted relay, permission prompts on the phone) |

---

## Stage 0 — Passive installs and host facts (~15 min active; downloads run unattended)

Kick these off the night before a build weekend — the downloads are large.

1. **Xcode** — full install from the Mac App Store (simulators and `xcodebuild` need full Xcode, not just Command Line Tools). On Xcode 27 `open -a Simulator` fails — no `Simulator.app` is registered — so nothing in this runbook opens one; simulators are driven headlessly. After install:
   ```bash
   sudo xcodebuild -license accept
   xcodebuild -downloadPlatform iOS   # pulls the iOS simulator runtime (~8 GB)
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
5. **iOS Simulator MCP dependency (optional)** — idb companion:
   ```bash
   brew tap facebook/fb && brew install idb-companion
   ```
   On Xcode 27 this server still reads the accessibility tree, but its input fails (SimulatorKit moved to `Contents/SharedFrameworks`). Treat it as a verifier, never as the input channel.
6. **Happy Coder (optional, for phone-remote sessions):**
   ```bash
   npm install -g happy-coder
   ```
   Install the **Happy — Claude Code** app on your iPhone now so session day is just a QR scan.
7. **Keep the Mac awake** for long unattended sessions: System Settings → Displays → Advanced → *Prevent automatic sleeping on power adapter when the display is off*, plus belt-and-braces in a spare terminal:
   ```bash
   caffeinate -dis
   ```
8. **Host capacity — record it, then write it into the profile.** RAM decides how many simulators can be booted at once; free disk decides whether tests pass at all (a real-OCR canary once failed on *accuracy*, not on time, at about 16 GB free, on an untouched baseline).
   ```bash
   sysctl -n hw.memsize | awk '{printf "RAM: %.0f GB\n", $1/1024/1024/1024}'
   df -h /
   xcrun simctl list runtimes
   ```
   - Derive the **maximum number of simulators booted at once**. On an 8 GB host it is **one**: booting a second took the 1-minute load average from 2 to 263 and swap to 6 of 7 GB within 90 seconds, and a third stopped answering `simctl launch`. On 16 GB, two. More only with evidence.
   - Derive a **free-disk floor** (10–15 GB) below which gates stop and the owner reclaims space.
   - Each simulator runtime is about **8 GB**, and an Xcode update can add another one.
   - Reclaimable by the owner: the npm cache (`npm cache clean --force`), `~/Library/Developer/Xcode/DerivedData`, simulator devices that are not the project's (`xcrun simctl delete <UDID>`), and physical-device debug symbols under `~/Library/Developer/Xcode/iOS DeviceSupport`.
   - Never deleted: the project's simulators and the runtime they run on.
   - Write RAM, free disk, the booted limit, the disk floor and a load-average threshold into `docs/project-profile.md` § Host capacity as hard rules.
9. **Pre-warm the project's simulator headlessly** so first boot isn't on the build clock. Boot by UDID (recorded in Stage 1c) and define "ready" as `simctl launch` returning a PID, not as a window appearing:
   ```bash
   xcrun simctl boot <UDID>
   until xcrun simctl launch <UDID> com.apple.Preferences >/dev/null 2>&1; do sleep 5; done   # ~60 s cold; give up and investigate after ~3 min
   ```
   The viewers that actually exist are the Claude app's simulator panel and XcodeBuildMCP screenshots. The panel re-attaches itself to whichever simulator boots and keeps a video encoder running, so the rule is **boot first, then detach the panel, then verify the detach held** before any gate.

### MCP servers — nothing to register per machine

Repos from this template ship the servers project-scoped for both assistants: `.mcp.json` for Claude Code (trust prompt once per repo) and `[mcp_servers.*]` tables in `.codex/config.toml` for OpenAI Codex (loads once you trust the project on first `codex` run). Both set `XCODEBUILDMCP_ENABLED_WORKFLOWS=simulator,simulator-management,ui-automation`. XcodeBuildMCP 2.x loads **only** its default simulator workflow unless this variable names more, so without it there are no `tap`, `swipe`, `type_text` or `snapshot_ui` tools at all. Valid ids for 2.7.0 are `coverage`, `debugging`, `device`, `doctor`, `macos`, `project-discovery`, `project-scaffolding`, `session-management`, `simulator`, `simulator-management`, `swift-package`, `ui-automation`, `utilities`, `workflow-discovery` and `xcode-ide`; there is no `logging` workflow (log capture lives in `simulator`). Add `debugging` when a project needs LLDB, and re-check the list whenever `@latest` moves.

If you prefer the servers available in *every* directory instead, register them at user scope (Claude Code shown; Codex equivalent is `codex mcp add`; servers registered mid-session don't appear until restart):

```bash
claude mcp add XcodeBuildMCP -s user -e XCODEBUILDMCP_SENTRY_DISABLED=true -e XCODEBUILDMCP_ENABLED_WORKFLOWS=simulator,simulator-management,ui-automation -- npx -y xcodebuildmcp@latest mcp
claude mcp add ios-simulator -s user -- npx -y ios-simulator-mcp
claude mcp list   # both should report Connected
```

XcodeBuildMCP requires macOS 14.5+ and Xcode 16+. **Simulator channel matrix:** at Stage 2, and again after every Xcode upgrade, fill the table in `docs/project-profile.md` § Agent tooling that records which tool *reads* the screen, which tool *sends input*, and the side effects of each (the Claude panel's `attach` boots a shut-down device; `idb` input fails on Xcode 27). Agents verify every UI step from the accessibility tree within a time bound, never from a screenshot.

---

## Stage 1 — The human window (target ≤ 10 minutes)

Everything here genuinely requires a human (browser logins, 2FA, QR scan).

| # | Task | Where |
|---|---|---|
| 1 | `gh auth login` → authenticate GitHub via browser | Terminal + browser |
| 2 | Create an **App Store Connect API key**: appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API → Team Keys → Generate. Role: **Admin** — with a lesser role the export fails on `No signing certificate "iOS Distribution"`, because Xcode cannot create the cloud-managed distribution certificate through the key. Record the **Issuer ID** and **Key ID**; download the `.p8` **once** (it cannot be re-downloaded) | Browser |
| 3 | Place the key where fastlane auto-discovers it: `mkdir -p ~/.appstoreconnect/private_keys && mv ~/Downloads/AuthKey_*.p8 ~/.appstoreconnect/private_keys/` | Terminal |
| 4 | In the repo: `cp fastlane/.env.example fastlane/.env` and fill in `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH` (the file is gitignored) | Terminal |
| 5 | Optional, development only: Xcode → Settings → Accounts → add your Apple ID so Xcode can run on a plugged-in device with automatic signing. **Uploads do not need it** — the `beta` lane passes the API key to `xcodebuild` as well as to the upload, and an Xcode sign-in does not reliably persist on a Mac anyway | Xcode |
| 6 | Optional phone-remote: `cd <repo> && happy` → scan the QR with the Happy app, then drive the session from your phone | Mac + iPhone |

**Deliberately deferred to your first TestFlight window** (they need the final app name, and you'll be in App Store Connect anyway): creating the app record (~2 min: name, bundle ID, SKU, primary language) and adding yourself as an internal TestFlight tester (~1 min, one-time). fastlane's `produce` relies on an interactive Apple ID session with 2FA rather than the API key, so doing these two clicks by hand is faster and more reliable. Internal-tester builds do **not** require Beta App Review — they're installable minutes after processing.

**The `.p8` key must never enter the repo** — it lives only in `~/.appstoreconnect/private_keys/`. The repo's `.gitignore` blocks `*.p8` and `fastlane/.env` as a backstop.

### Stage 1b — If the app uses iCloud: test accounts [iCloud]

An owner checklist, completed before the first gate. Record the results in `docs/project-profile.md` § Shared test accounts, by **alias only** — never commit an account address.

- **Dedicated throwaway Apple Accounts only:** one for the simulators and a second for the hardware-only account-switch legs. **Never the personal account** — not on a simulator, not in a token, not in a destructive leg.
- **Fully provision each account before first use.** An Apple Account created on the web stays web-only until it signs into an Apple device or accepts the iCloud terms at icloud.com; until then simulator sign-in fails with "username or password is incorrect" even with the right credentials. This has cost a full day.
- **Prove it works:** keep the 2FA trusted device at hand and complete one verified sign-in end to end.
- **`cktool` tokens:** save the management token with the interactive `xcrun cktool save-token` so it lands in the keychain, and verify it with a read-only `xcrun cktool export-schema`. Agents may only export. **Never mint a user token from the owner's CloudKit Console session** — it would act as the owner's personal iCloud user.
- **Rules for agents on a shared test account** (carry them into every spawn contract):
  - Select only what this run created, matched by this run's authored ids or record names with a per-run suffix — never by display name, index or library-wide counts. The shared zone accumulates every earlier run's records, and a DEBUG reset clears only local data.
  - No agent runs a destructive account action: Settings → Delete Data, Manage Account Storage, sign-out / switch / purge legs, or `reset-schema`. Those go on the hardware checklist, destructive items last, because one purge hits every simulator on the account.
  - Label proxies as proxies. A DEBUG seam may stand in for an account event only if it runs solely when given its argument and never overrides the real account read, and its evidence row states what it cannot show.
  - Diff a read-only schema export after every signed-in run, while the owner can still be reached. The CloudKit development schema is permanent from its first write.

### Stage 1c — The project simulators

Name the simulators, pin them by **UDID and runtime**, and record them in `docs/project-profile.md` § Simulators.

- **A canonical test device that is never signed in.** Every unit test, UI test and gate runs here.
- **[iCloud]** two sync devices (`Sync-A`, `Sync-B`) signed into the same test account, used for evidence legs only.
- **Tests never run on a signed-in simulator.** A test `ModelConfiguration` without `cloudKitDatabase: .none` attaches CloudKit mirroring on an entitled test host; signed in, it writes `CD_` types into the development schema permanently.
- **Pin every destination with `OS=`** (`-destination 'platform=iOS Simulator,name=<name>,OS=<runtime>'`) so a new runtime's device with the same name can't quietly become the gate device. Stage 2 adds the pin to the profile's tier commands.
- **Sign-in is a named human task, scripted as a hand-off:** (1) the agent boots the device alone; (2) the agent navigates to the password field; (3) **the owner types** — agents never enter credentials, and `simctl` has no sign-in command; (4) the agent verifies inside the app; (5) the agent shuts the device down and polls `xcrun simctl list devices` until it reports `(Shutdown)`.
- **Credentials lapse silently every ~9–12 h.** Settings still showed the account while CloudKit already reported `temporarilyUnavailable`, so proof of sign-in comes from the app's own account-status API, never from a Settings screenshot.
- **Settings automation facts:** the per-app iCloud switch sits at Apple Account → iCloud → Saved to iCloud → See All → *App*; it flips with a **drag, not a tap**, and needs no password.

---

## Stage 2 — Verification smoke test

Run it on a freshly bootstrapped repo, **after every macOS or Xcode upgrade, and before every TestFlight gate**. A broken rung discovered mid-phase costs far more than at hour zero, and after one upgrade nothing re-verified itself until a tracker field still read "NOT YET VALIDATED" a week later.

> Verify the toolchain end-to-end. 1) Confirm the XcodeBuildMCP tools are available *including* `tap`, `type_text` and `snapshot_ui`, and that ios-simulator MCP connects; fill the simulator channel matrix in docs/project-profile.md § Agent tooling. 2) Build this repo's walking-skeleton app for the canonical simulator in docs/project-profile.md § Simulators via XcodeBuildMCP, boot/install/launch it headlessly, and screenshot the greeting. 3) Run the unit + UI test suites and report the number of tests executed against the number requested — a run that executed zero tests is a failure whatever its exit code or result bundle says. 4) [iCloud] Prove sign-in on Sync-A through the app's own account-status API, not a Settings screenshot. 5) Confirm `gh auth status`, `fastlane --version`, that fastlane/.env values are set and the `.p8` exists at the configured path. 6) Record the toolchain triple (Xcode build, iOS SDK, simulator runtime) and the simulators' UDIDs in the profile, and add `OS=<runtime>` to every destination in its tier commands. Report pass/fail per item. Do not touch App Store Connect.

All green → start the pipeline (`/build-with-agent-team`). Any red → fix now.

---

## OS / Xcode upgrades

An upgrade mid-phase once wiped a session's evidence (the reboot cleared the scratchpad), added an 8 GB runtime, broke a test file on an SDK name clash (`SwiftUI.Document` against the app's own `Document`), and made one platform finding impossible to separate from the toolchain change afterwards. Treat every upgrade as a gate.

**Before the update**

1. Defer it to a phase boundary if at all possible; otherwise the owner announces it before it starts.
2. Move in-progress evidence into the repo's gitignored `.evidence/` — never `/tmp` or a session scratchpad.
3. Re-run, with controls, any platform-behaviour finding you will want to compare later.
4. Record `sw_vers`, `xcodebuild -version`, `xcrun simctl list runtimes` and `df -h /`.

**After the update**

1. Compare against the profile's **toolchain triple** (Xcode build, SDK, simulator runtime). A changed triple voids all recorded execution evidence.
2. Run a real re-verification gate, not a single app-target build: `xcodebuild build-for-testing` for every target; unit tests, smoke tests and lint with executed test counts; exit codes captured in a way that works in both bash and zsh (`set -o pipefail`, not `${PIPESTATUS[0]}`).
3. Decide the runtimes explicitly: keep the project simulators on their runtime and keep `OS=` pinned; check whether the new ~8 GB runtime is actually needed before keeping it; **never run `simctl delete unavailable` or `erase all` around a runtime change** — it destroys the signed-in simulators, and only the owner can sign them back in.
4. Re-run Stage 2 and refresh the channel matrix and the toolchain triple in the profile.

---

## Troubleshooting quick hits

- **MCP tools missing in session:** the server config was added mid-session — exit and relaunch the session. **Tap/type tools missing:** `XCODEBUILDMCP_ENABLED_WORKFLOWS` is unset or names an id the installed version doesn't know; check `.mcp.json` against the list above.
- **First `xcodebuild` is glacial:** first-build package resolution and simulator warm-up are one-off; the Stage 0 pre-boot avoids most of it.
- **TestFlight export fails with `exportArchive No Accounts` or `No signing certificate "iOS Distribution"`:** the lane is authenticating through an Xcode sign-in instead of the key, or the key's role is below **Admin**. Check `fastlane/.env`, the `.p8` path and permissions, and the key role; regenerate the key if the Issuer/Key ID were transposed. A failed export uploads nothing and consumes no build number.
- **Provisioning error on `fastlane beta` for the first build with new capabilities** (iCloud, push): the App ID and the App Store profile need updating, which automatic provisioning does only when it can authenticate — through the API key, not an Xcode account.
- **Simulator "unable to boot" or unresponsive:** on a small host this is usually memory pressure — check `xcrun simctl list devices booted` and `uptime` before acting. Then work from least to most destructive, on the one device, by UDID: `xcrun simctl shutdown <UDID>`, `xcrun simctl boot <UDID>`, wait until `simctl launch` returns a PID. **Never `xcrun simctl erase all`.** Erase only a device that has never been signed in; erasing any signed-in device needs the owner's approval.
- **`xcodebuild test` hangs about 10 minutes after a failing test** on Xcode 27: it is running `simctl diagnose`. Pass `-collect-test-diagnostics never` on gate and probe runs.
- **`ps | grep xcodebuild` also matches idle XcodeBuildMCP servers.** Match the `xcodebuild` binary path (`/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild`) instead.
- **Never `attach` the Claude simulator control to a device that isn't booted** — attaching boots it, which on a one-simulator host means a two-simulator overlap.
- **Happy QR won't pair:** both devices need internet (relay-based, not LAN); restart `happy` to mint a fresh QR.

*Sources for tool specifics: code.claude.com/docs (installer, MCP config), xcodebuildmcp.com/docs (requirements, workflows, client setup), github.com/getsentry/XcodeBuildMCP. The host, simulator, account and upgrade lessons come from an iPhone app delivered with this template in 2026. Verify version-sensitive commands if this doc is reused much later.*
