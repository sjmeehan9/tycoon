#!/usr/bin/env python3
"""Render agent/skill sources (*.src.md) into their platform outputs.

Sources live in agents-src/ and skills-src/. See agents-src/FORMAT.md for the
source format. Run with --check to verify rendered files match source (CI).
"""

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC_DIRS = [REPO / "agents-src", REPO / "skills-src"]
INCLUDE_ROOT = REPO / "agents-src"
ALLOWED_FLAGS = {"claude", "copilot", "codex", "teams", "interactive", "autonomous", "full", "lite"}
PLATFORM_FLAGS = {"claude", "copilot", "codex"}
MODE_FLAGS = {"interactive", "autonomous"}


class SourceError(Exception):
    pass


def parse_source(path: Path):
    """Parse a .src.md file into ([(out_path, flags, frontmatter_text)], body_text)."""
    lines = path.read_text().splitlines()
    outputs = []
    body_start = None
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("%%% body"):
            body_start = i + 1
            break
        if line.startswith("%%% output:"):
            out_path = line.split(":", 1)[1].strip()
            i += 1
            if i >= len(lines) or not lines[i].startswith("%%% flags:"):
                raise SourceError(f"{path}: output '{out_path}' missing '%%% flags:' line")
            flags = set(lines[i].split(":", 1)[1].split())
            bad = flags - ALLOWED_FLAGS
            if bad:
                raise SourceError(f"{path}: unknown flags {sorted(bad)} for '{out_path}'")
            if len(flags & PLATFORM_FLAGS) != 1:
                raise SourceError(f"{path}: '{out_path}' needs exactly one platform flag")
            if len(flags & MODE_FLAGS) != 1:
                raise SourceError(f"{path}: '{out_path}' needs exactly one mode flag")
            i += 1
            fm = []
            while i < len(lines) and not lines[i].startswith("%%%"):
                fm.append(lines[i])
                i += 1
            while fm and fm[-1].strip() == "":
                fm.pop()
            if out_path.endswith(".toml"):
                # Codex agent: header block is verbatim TOML key/value lines.
                if not fm:
                    raise SourceError(f"{path}: TOML header for '{out_path}' is empty")
            elif not fm or fm[0].strip() != "---" or fm[-1].strip() != "---":
                raise SourceError(f"{path}: frontmatter for '{out_path}' must start and end with ---")
            outputs.append((out_path, flags, "\n".join(fm)))
            continue
        if line.strip() and not line.startswith("%%%"):
            raise SourceError(f"{path}: unexpected content before '%%% body' at line {i + 1}: {line!r}")
        i += 1
    if body_start is None:
        raise SourceError(f"{path}: missing '%%% body' directive")
    if not outputs:
        raise SourceError(f"{path}: no '%%% output:' blocks")
    return outputs, lines[body_start:]


def render_body(lines, flags, src_label, depth=0):
    """Resolve %%% begin/end conditionals and %%% include directives."""
    if depth > 8:
        raise SourceError(f"{src_label}: include nesting too deep (cycle?)")
    out = []
    stack = []  # each entry: bool (block active?)
    for n, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("%%% begin"):
            tokens = set(stripped.split()[2:])
            bad = tokens - ALLOWED_FLAGS
            if bad or not tokens:
                raise SourceError(f"{src_label}:{n}: bad begin tokens {sorted(tokens)}")
            active = tokens.issubset(flags) and all(stack)
            stack.append(active)
            continue
        if stripped == "%%% end":
            if not stack:
                raise SourceError(f"{src_label}:{n}: '%%% end' without matching begin")
            stack.pop()
            continue
        if not all(stack):
            continue
        if stripped.startswith("%%% include"):
            inc_rel = stripped.split(None, 2)[2]
            inc_path = INCLUDE_ROOT / inc_rel
            if not inc_path.is_file():
                raise SourceError(f"{src_label}:{n}: include not found: {inc_rel}")
            out.extend(render_body(inc_path.read_text().splitlines(), flags, str(inc_path), depth + 1))
            continue
        if stripped.startswith("%%%"):
            raise SourceError(f"{src_label}:{n}: unknown directive: {stripped}")
        out.append(line)
    if stack:
        raise SourceError(f"{src_label}: unterminated '%%% begin' block")
    return out


def collapse_blank_runs(lines):
    out, blank = [], 0
    for line in lines:
        if line.strip() == "":
            blank += 1
            if blank > 1:
                continue
        else:
            blank = 0
        out.append(line)
    while out and out[0].strip() == "":
        out.pop(0)
    while out and out[-1].strip() == "":
        out.pop()
    return out


def render_all():
    """Return {output_path: content} for every source file."""
    rendered = {}
    sources = sorted(p for d in SRC_DIRS if d.is_dir() for p in d.glob("*.src.md"))
    if not sources:
        raise SourceError("no *.src.md sources found")
    for src in sources:
        outputs, body = parse_source(src)
        for out_path, flags, fm in outputs:
            if out_path in rendered:
                raise SourceError(f"duplicate output path: {out_path}")
            body_lines = collapse_blank_runs(render_body(body, flags, str(src)))
            rel_src = src.relative_to(REPO)
            if out_path.endswith(".toml"):
                body_text = "\n".join(body_lines)
                if "'''" in body_text:
                    raise SourceError(f"{src}: body for '{out_path}' contains ''' — cannot embed in a TOML literal string")
                marker = f"# GENERATED from {rel_src} — edit the source, then run scripts/build-agents.py"
                content = marker + "\n" + fm + "\n\n" + "developer_instructions = '''\n" + body_text + "\n'''\n"
                # Parse-validate: a hand-escaping mistake in the source's TOML header must
                # fail the build, not ship a file Codex silently refuses to load.
                try:
                    import tomllib
                    try:
                        tomllib.loads(content)
                    except tomllib.TOMLDecodeError as e:
                        raise SourceError(f"{src}: '{out_path}' is not valid TOML: {e}")
                except ImportError:
                    print(f"WARNING: tomllib unavailable — skipped TOML validation of {out_path}", file=sys.stderr)
                rendered[out_path] = content
            else:
                marker = f"<!-- GENERATED from {rel_src} — edit the source, then run scripts/build-agents.py -->"
                rendered[out_path] = fm + "\n\n" + marker + "\n\n" + "\n".join(body_lines) + "\n"
    return rendered


def main():
    check = "--check" in sys.argv
    try:
        rendered = render_all()
    except SourceError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    stale = []
    for out_path, content in sorted(rendered.items()):
        target = REPO / out_path
        current = target.read_text() if target.is_file() else None
        if current == content:
            continue
        if check:
            stale.append(out_path)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)
            print(f"wrote {out_path}")

    # Orphan detection: rendered-dir files not produced by any source (e.g. a
    # renamed `%%% output:` path leaving a stale live agent behind).
    orphans = []
    for pattern in (".claude/agents/*.md", ".github/agents/*.md", ".claude/skills/*/SKILL.md",
                    ".codex/agents/*.toml", ".agents/skills/*/SKILL.md"):
        for f in sorted(REPO.glob(pattern)):
            rel = str(f.relative_to(REPO))
            if rel not in rendered:
                orphans.append(rel)
    for o in orphans:
        print(f"ORPHAN (not produced by any source — delete it or add an output): {o}", file=sys.stderr)

    if check:
        if stale:
            print("STALE (source and rendered files differ — run scripts/build-agents.py):", file=sys.stderr)
            for s in stale:
                print(f"  {s}", file=sys.stderr)
            return 1
        if orphans:
            return 1
        print(f"OK: {len(rendered)} rendered files match source")
        return 0
    print(f"done: {len(rendered)} outputs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
