#!/usr/bin/env python3
"""Print a commit-stable SHA-256 identity for effective Git tree content."""

from __future__ import annotations

import argparse
import hashlib
import os
import stat
import subprocess
from fnmatch import fnmatch
from pathlib import Path
from typing import Sequence


EVIDENCE_PATHS = (
    "docs/agent-team-state.md",
    "docs/phase-progress.json",
    "docs/components/*-overview.md",
    "docs/test-reports/**",
    "docs/phase-*-test-report.md",
    "docs/phase-summary.md",
)


def git(repo: Path, *args: str) -> bytes:
    """Return raw Git output or fail with the original command error."""

    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        stdout=subprocess.PIPE,
    ).stdout


def git_with_input(repo: Path, data: bytes, *args: str) -> bytes:
    """Return raw Git output for a command that consumes stdin."""

    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        input=data,
        stdout=subprocess.PIPE,
    ).stdout


def repository_root() -> Path:
    """Resolve the repository containing the current working directory."""

    root = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    ).stdout.strip()
    return Path(root)


def scope_pathspecs(scopes: Sequence[str]) -> list[str]:
    """Return inclusive Git pathspecs; evidence paths are filtered in Python."""

    return list(scopes) or ["."]


def is_evidence(relative: str) -> bool:
    return any(fnmatch(relative, pattern) for pattern in EVIDENCE_PATHS)


def hash_entries(entries: Sequence[tuple[bytes, bytes, bytes]]) -> str:
    """Hash sorted path/mode/object identities with an explicit format marker."""

    digest = hashlib.sha256(b"WORKTREE_CONTENT_V2\0")
    for raw_path, mode, object_id in sorted(entries):
        digest.update(raw_path)
        digest.update(b"\0")
        digest.update(mode)
        digest.update(b"\0")
        digest.update(object_id)
        digest.update(b"\0")
    return digest.hexdigest()


def effective_blob_id(repo: Path, relative: str, content: bytes) -> bytes:
    """Return the blob Git would commit, including configured clean filters."""

    return git_with_input(
        repo,
        content,
        "hash-object",
        "--path",
        relative,
        "--stdin",
    ).strip()


def effective_blob_ids(repo: Path, relatives: Sequence[str]) -> list[bytes]:
    """Batch-hash regular files with the clean filters Git would apply."""

    if not relatives:
        return []
    if any("\n" in relative for relative in relatives):
        return [
            effective_blob_id(repo, relative, (repo / relative).read_bytes())
            for relative in relatives
        ]
    output = git_with_input(
        repo,
        ("\n".join(relatives) + "\n").encode(
            "utf-8", errors="surrogateescape"
        ),
        "hash-object",
        "--stdin-paths",
        "--filters",
    )
    object_ids = output.splitlines()
    if len(object_ids) != len(relatives):
        raise SystemExit("git hash-object returned an unexpected candidate count")
    return object_ids


def worktree_entries(repo: Path, scopes: Sequence[str]) -> list[tuple[bytes, bytes, bytes]]:
    """Describe the effective tracked/untracked tree without depending on HEAD."""

    conflicts = git(repo, "diff", "--name-only", "--diff-filter=U", "-z")
    if conflicts:
        names = conflicts.replace(b"\0", b", ").decode(
            "utf-8", errors="surrogateescape"
        )
        raise SystemExit(f"cannot fingerprint an unmerged worktree: {names}")

    raw_paths = git(
        repo,
        "ls-files",
        "--cached",
        "--others",
        "--exclude-standard",
        "-z",
        "--",
        *scope_pathspecs(scopes),
    )
    entries: list[tuple[bytes, bytes, bytes]] = []
    regulars: list[tuple[bytes, bytes, str]] = []
    for raw_path in sorted(set(raw_paths.split(b"\0")) - {b""}):
        relative = raw_path.decode("utf-8", errors="surrogateescape")
        if is_evidence(relative):
            continue
        absolute = repo / relative
        try:
            metadata = os.lstat(absolute)
        except FileNotFoundError:
            # A tracked deletion contributes no entry, matching the post-commit tree.
            continue

        if stat.S_ISLNK(metadata.st_mode):
            mode = b"120000"
            content = os.readlink(absolute).encode("utf-8", errors="surrogateescape")
            object_id = git_with_input(repo, content, "hash-object", "--stdin").strip()
        elif stat.S_ISREG(metadata.st_mode):
            mode = b"100755" if metadata.st_mode & 0o111 else b"100644"
            regulars.append((raw_path, mode, relative))
            continue
        elif stat.S_ISDIR(metadata.st_mode):
            # Git only tracks a directory here when it is a submodule/gitlink.
            mode = b"160000"
            object_id = git(absolute, "rev-parse", "HEAD").strip()
        else:
            raise SystemExit(f"unsupported candidate file type: {relative}")
        entries.append((raw_path, mode, object_id))
    object_ids = effective_blob_ids(repo, [relative for _, _, relative in regulars])
    entries.extend(
        (raw_path, mode, object_id)
        for (raw_path, mode, _relative), object_id in zip(
            regulars, object_ids, strict=True
        )
    )
    return entries


def revision_entries(
    repo: Path, revision: str, scopes: Sequence[str]
) -> list[tuple[bytes, bytes, bytes]]:
    """Describe the same scoped tree at a committed revision."""

    raw_entries = git(
        repo,
        "ls-tree",
        "-r",
        "-z",
        "--full-tree",
        revision,
        "--",
        *scope_pathspecs(scopes),
    )
    entries: list[tuple[bytes, bytes, bytes]] = []
    for raw_entry in raw_entries.split(b"\0"):
        if not raw_entry:
            continue
        metadata, raw_path = raw_entry.split(b"\t", 1)
        relative = raw_path.decode("utf-8", errors="surrogateescape")
        if is_evidence(relative):
            continue
        mode, _object_type, object_id = metadata.split(b" ", 2)
        entries.append((raw_path, mode, object_id))
    return entries


def fingerprint(repo: Path, scopes: Sequence[str], revision: str | None = None) -> str:
    """Hash effective content globally or for explicit component-owned paths."""

    entries = (
        revision_entries(repo, revision, scopes)
        if revision
        else worktree_entries(repo, scopes)
    )
    return hash_entries(entries)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Hash effective Git tree content. With paths, hash component scope; "
            "without paths, hash the whole non-evidence tree."
        )
    )
    parser.add_argument(
        "--rev",
        help="hash the scoped tree at a commit instead of the current worktree",
    )
    parser.add_argument(
        "paths",
        nargs="*",
        metavar="PATH",
        help="repo-relative component-owned path(s); omit for the phase/global tree",
    )
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    print(fingerprint(repository_root(), arguments.paths, arguments.rev))
