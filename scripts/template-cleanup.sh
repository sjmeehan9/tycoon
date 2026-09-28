#!/usr/bin/env bash
# Remove template-only files from a repository generated from project-template and bring its
# .templatesyncignore up to date.
#
# Why: GitHub template creation copies every tracked file; actions-template-sync never propagates
# deletions and never updates .templatesyncignore itself. Each generated repository therefore needs
# this one-off step (new repositories get it from bootstrap.sh).
#
# Usage:
#   scripts/template-cleanup.sh                      dry run on the current repository
#   scripts/template-cleanup.sh --target ../my-app   dry run on another checkout
#   scripts/template-cleanup.sh --apply              delete, update ignore files, commit on a new branch
#   scripts/template-cleanup.sh --apply --pr         ...then push the branch and open the PR (needs gh)
#   scripts/template-cleanup.sh --apply --branch chore/template-cleanup-2
#
# Lists come from templates/template-only.txt and templates/templatesyncignore in the repository
# this script lives in (project-template itself, or a generated repository that already received
# them by sync). Requires bash and git; gh only for --pr. Also adds .evidence/ to .gitignore.
set -euo pipefail

usage() { sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

SELF_REPO=$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)
TARGET="" APPLY=false PR=false BRANCH="chore/template-cleanup"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --apply)  APPLY=true; shift ;;
    --pr)     PR=true; shift ;;
    --branch) BRANCH="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown flag: $1" >&2; usage >&2; exit 1 ;;
  esac
done
if $PR && ! $APPLY; then echo "--pr requires --apply" >&2; exit 1; fi

TARGET=$(git -C "${TARGET:-$SELF_REPO}" rev-parse --show-toplevel)
ONLY_LIST="$SELF_REPO/templates/template-only.txt"
IGNORE_SEED="$SELF_REPO/templates/templatesyncignore"
for f in "$ONLY_LIST" "$IGNORE_SEED"; do
  [[ -f "$f" ]] || { echo "missing $f (run from project-template, or a repository that has received it by sync)" >&2; exit 1; }
done

# One entry per line: comments and surrounding whitespace stripped, blank lines dropped.
entries() { tr -d '\r' < "$1" | sed 's/#.*//;s/^[[:space:]]*//;s/[[:space:]]*$//' | awk NF; }
# Print each line of $2 prefixed with $1.
list() { printf '%s' "$2" | while IFS= read -r x; do echo "  $1 $x"; done; }

cd "$TARGET"
echo "Target repository: $TARGET"
echo "Lists from:        $SELF_REPO/templates/"

deletions=""
while IFS= read -r p; do
  case "$p" in "/"|"."|".."|/*|*..*) echo "refusing unsafe path in template-only.txt: $p" >&2; exit 1 ;; esac
  [[ -e "$p" ]] && deletions+="$p"$'\n'
done < <(entries "$ONLY_LIST")

existing=""
[[ -f .templatesyncignore ]] && existing=$(entries .templatesyncignore)
ignore_adds=""
while IFS= read -r l; do
  grep -qxF -- "$l" <<<"$existing" || ignore_adds+="$l"$'\n'
done < <(entries "$IGNORE_SEED")

gitignore_add=true
[[ -f .gitignore ]] && grep -qxE -- '\.evidence/?' .gitignore && gitignore_add=false

echo
echo "Planned changes:"
if [[ -n "$deletions" ]]; then list "delete   " "$deletions"; else echo "  delete    (no template-only paths present)"; fi
if [[ -n "$ignore_adds" ]]; then list "ignore  +" "$ignore_adds"; else echo "  ignore    (.templatesyncignore already complete)"; fi
if $gitignore_add; then echo "  gitignore +.evidence/"; else echo "  gitignore (.evidence/ already ignored)"; fi

if ! $APPLY; then
  echo
  echo "Dry run. Re-run with --apply to make these changes on branch '$BRANCH'."
  exit 0
fi
if [[ -z "$deletions$ignore_adds" ]] && ! $gitignore_add; then
  echo
  echo "Nothing to do."
  exit 0
fi

[[ -z "$(git status --porcelain)" ]] || { echo "worktree is not clean; commit or stash first" >&2; exit 1; }
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "branch '$BRANCH' already exists; pass --branch <name>" >&2; exit 1
fi
git switch -q -c "$BRANCH"

printf '%s' "$deletions" | while IFS= read -r p; do
  git rm -r -q --cached --ignore-unmatch -- "$p"
  rm -rf -- "$p"
done

append_block() { # append_block <file> <comment> <lines>
  { [[ -f "$1" && -n "$(tail -c1 "$1")" ]] && echo; echo "# $2"; printf '%s' "$3"; } >> "$1"
  git add -- "$1"
}
if [[ -n "$ignore_adds" ]]; then
  append_block .templatesyncignore "Added by scripts/template-cleanup.sh $(date +%F): template-only paths and project-owned files the sync must never touch" "$ignore_adds"
fi
if $gitignore_add; then
  append_block .gitignore "Raw validation evidence stays out of the repository" ".evidence/"$'\n'
fi

git commit -q -m "chore(template): remove template-only files and refresh .templatesyncignore" \
  -m "Template sync never propagates deletions and cannot update .templatesyncignore. This one-off commit removes the paths listed in project-template's templates/template-only.txt and brings the ignore list up to the template's current seed so they are never re-added."
echo
echo "Committed on '$BRANCH':"
git --no-pager show --stat --format='  %h %s' HEAD

if $PR; then
  command -v gh >/dev/null 2>&1 || { echo "gh is not installed; push '$BRANCH' and open the PR by hand" >&2; exit 1; }
  git push -q -u origin "$BRANCH"
  gh pr create --title "chore(template): remove template-only files and refresh .templatesyncignore" \
    --body "One-off cleanup from project-template (WP1): deletes the template-only paths that template creation copied and template sync can never remove, and brings .templatesyncignore (which sync cannot update) to the current seed so they are never re-added."
fi
