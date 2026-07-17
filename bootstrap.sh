#!/usr/bin/env bash
# Bootstrap a project repo created from project-template.
# Usage: ./bootstrap.sh  (interactive)
#        ./bootstrap.sh --name MyApp --platform ios --bundle-id com.example.myapp [--simulator "iPhone 17"]
set -euo pipefail

cd "$(dirname "$0")"

NAME="" PLATFORM="" BUNDLE_ID="" SIMULATOR="iPhone 17"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)      NAME="$2"; shift 2 ;;
    --platform)  PLATFORM="$2"; shift 2 ;;
    --bundle-id) BUNDLE_ID="$2"; shift 2 ;;
    --simulator) SIMULATOR="$2"; SIMULATOR_FLAGGED=true; shift 2 ;;
    *) echo "unknown flag: $1" >&2; exit 1 ;;
  esac
done

default_name=$(basename "$(pwd)" | sed 's/[^A-Za-z0-9]//g')
if [[ -z "$NAME" ]]; then
  read -r -p "Project name (PascalCase, no spaces) [${default_name}]: " NAME
  NAME=${NAME:-$default_name}
fi
if [[ ! "$NAME" =~ ^[A-Za-z][A-Za-z0-9]*$ ]]; then
  echo "Project name must be alphanumeric, starting with a letter." >&2; exit 1
fi
SLUG=$(echo "$NAME" | tr '[:upper:]' '[:lower:]')

if [[ -z "$PLATFORM" ]]; then
  read -r -p "Platform (ios / python / typescript): " PLATFORM
fi
case "$PLATFORM" in ios|python|typescript) ;; *) echo "platform must be ios, python, or typescript" >&2; exit 1 ;; esac

SIMULATOR_FLAGGED=${SIMULATOR_FLAGGED:-false}
if [[ "$PLATFORM" == "ios" ]]; then
  if [[ -z "$BUNDLE_ID" ]]; then
    read -r -p "Bundle identifier [au.com.seanmeehan.${SLUG}]: " BUNDLE_ID
    BUNDLE_ID=${BUNDLE_ID:-au.com.seanmeehan.${SLUG}}
  fi
  if [[ "$SIMULATOR_FLAGGED" != "true" ]]; then
    read -r -p "Simulator device for validation [${SIMULATOR}]: " sim_in || sim_in=""
    SIMULATOR=${sim_in:-$SIMULATOR}
  fi
fi

# Portable placeholder substitution (BSD/GNU sed differences avoided).
fill() { # fill <src> <dest>
  python3 - "$1" "$2" "$NAME" "$SLUG" "${BUNDLE_ID:-}" "$SIMULATOR" <<'PY'
import sys
src, dest, name, slug, bundle, sim = sys.argv[1:7]
text = open(src).read()
for k, v in {"__PROJECT_NAME__": name, "__PROJECT_SLUG__": slug,
             "__BUNDLE_ID__": bundle, "__IOS_SIMULATOR__": sim}.items():
    text = text.replace(k, v)
open(dest, "w").write(text)
PY
}

mkdir -p docs

echo "→ writing docs/project-profile.md (${PLATFORM})"
fill "templates/project-profile.${PLATFORM}.md" "docs/project-profile.md"

echo "→ writing CLAUDE.md + AGENTS.md"
fill "templates/CLAUDE.md.template" "CLAUDE.md"
fill "templates/AGENTS.md.template" "AGENTS.md"

echo "→ writing .codex/config.toml"
mkdir -p .codex
cp templates/codex/config.base.toml .codex/config.toml
if [[ "$PLATFORM" == "ios" ]]; then
  cat templates/codex/config.ios-mcp.toml >> .codex/config.toml
fi

case "$PLATFORM" in
  ios)
    echo "→ scaffolding XcodeGen project + app stubs"
    mkdir -p Sources Tests UITests
    fill templates/ios/project.yml project.yml
    for f in App.swift Bootstrap.swift ContentView.swift; do fill "templates/ios/Sources/$f" "Sources/$f"; done
    fill templates/ios/Tests/BootstrapTests.swift Tests/BootstrapTests.swift
    fill templates/ios/UITests/LaunchUITests.swift UITests/LaunchUITests.swift
    echo "→ scaffolding fastlane pipeline + MCP config"
    mkdir -p fastlane
    fill templates/ios/fastlane/Appfile fastlane/Appfile
    fill templates/ios/fastlane/Fastfile fastlane/Fastfile
    fill templates/ios/fastlane/.env.example fastlane/.env.example
    fill templates/ios/mcp.json .mcp.json
    if command -v xcodegen >/dev/null 2>&1; then
      xcodegen generate
    else
      echo "  ! xcodegen not installed — run 'brew install xcodegen && xcodegen generate' before building."
    fi
    command -v fastlane >/dev/null 2>&1 || echo "  ! fastlane not installed — 'brew install fastlane' (see supporting-files/ios-setup-runbook.md)."
    command -v npx >/dev/null 2>&1 || echo "  ! node/npx not installed — 'brew install node' (required by the MCP servers in .mcp.json)."
    ;;
  python)
    if [[ ! -f pyproject.toml ]]; then
      echo "→ seeding pyproject.toml + src layout"
      mkdir -p src tests
      printf '[project]\nname = "%s"\nversion = "0.1.0"\nrequires-python = ">=3.12"\n\n[project.optional-dependencies]\ndev = ["pytest", "black", "isort"]\n' "$SLUG" > pyproject.toml
    fi
    ;;
  typescript)
    if [[ ! -f package.json ]]; then
      echo "→ seeding package.json + src layout"
      mkdir -p src tests
      printf '{\n  "name": "%s",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "build": "echo \\"define build\\" && exit 1",\n    "lint": "echo \\"define lint\\" && exit 1",\n    "test": "echo \\"define test\\" && exit 1"\n  }\n}\n' "$SLUG" > package.json
    fi
    ;;
esac

echo
echo "Bootstrap complete."
echo
echo "Remaining human steps:"
echo "  1. Review and complete docs/project-profile.md (external services, budgets, versions)."
echo "  -  Codex users: run 'codex' once in the repo root and TRUST the project, or"
echo "     .codex/config.toml (sandbox, MCP servers) and .codex/agents/ will not load."
if [[ "$PLATFORM" == "ios" ]]; then
  echo "  2. Set DEVELOPMENT_TEAM in project.yml; add your Apple ID in Xcode (automatic signing)."
  echo "  3. Create an App Store Connect API key (role: App Manager), place the .p8 in"
  echo "     ~/.appstoreconnect/private_keys/, then cp fastlane/.env.example fastlane/.env and fill it."
  echo "     Full machine/account walkthrough: supporting-files/ios-setup-runbook.md"
  echo "  4. Deferred to your first TestFlight window: create the App Store Connect app record"
  echo "     for ${BUNDLE_ID} and add yourself as an internal tester."
fi
echo "  - Add the TEMPLATE_SYNC_PAT repo secret (fine-grained PAT with read access to the"
echo "    template repo and contents+pull-requests+workflows write here) to receive template updates."
echo "  - Protect the main branch (the git workflow contract assumes it)."
echo "  - Commit: git add -A && git commit -m 'chore: bootstrap ${NAME}'"
