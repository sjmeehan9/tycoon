#!/usr/bin/env python3
"""Behavioral tests for commit-stable, scoped worktree fingerprints."""

from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("worktree-fingerprint.py")
SPEC = importlib.util.spec_from_file_location("worktree_fingerprint", SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"cannot load {SCRIPT}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def git(repo: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(repo), *args], check=True, stdout=subprocess.PIPE)


class WorktreeFingerprintTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.repo = Path(self.temporary_directory.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.name", "Fingerprint Test")
        git(self.repo, "config", "user.email", "fingerprint@example.invalid")
        (self.repo / "src").mkdir()
        (self.repo / "docs" / "components").mkdir(parents=True)
        (self.repo / "src" / "alpha.txt").write_text("alpha v1\n", encoding="utf-8")
        (self.repo / "src" / "beta.txt").write_text("beta v1\n", encoding="utf-8")
        git(self.repo, "add", "src")
        git(self.repo, "commit", "-q", "-m", "initial")

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def fingerprint(self, *scopes: str, revision: str | None = None) -> str:
        return MODULE.fingerprint(self.repo, scopes, revision)

    def commit_all(self, message: str) -> None:
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", message)

    def cli(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            cwd=self.repo,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

    def test_candidate_identity_survives_commit(self) -> None:
        (self.repo / "src" / "alpha.txt").write_text("alpha v2\n", encoding="utf-8")
        (self.repo / "src" / "new.txt").write_text("new\n", encoding="utf-8")
        before = self.fingerprint("src/alpha.txt", "src/new.txt")

        self.commit_all("component candidate")

        self.assertEqual(before, self.fingerprint("src/alpha.txt", "src/new.txt"))
        self.assertEqual(
            before,
            self.fingerprint("src/alpha.txt", "src/new.txt", revision="HEAD"),
        )

    def test_evidence_files_do_not_change_candidate_identity(self) -> None:
        before = self.fingerprint()
        (self.repo / "docs" / "agent-team-state.md").write_text(
            "state\n", encoding="utf-8"
        )
        (self.repo / "docs" / "components" / "phase-1-component-1-1-overview.md").write_text(
            "evidence\n", encoding="utf-8"
        )
        (self.repo / "docs" / "example-product-solution-doc-2026-07-30.md").write_text(
            "phase-close evidence\n", encoding="utf-8"
        )
        self.assertEqual(before, self.fingerprint())

    def test_unrelated_later_change_preserves_scoped_component_identity(self) -> None:
        component = self.fingerprint("src/alpha.txt")
        global_before = self.fingerprint()
        (self.repo / "src" / "beta.txt").write_text("beta v2\n", encoding="utf-8")

        self.assertEqual(component, self.fingerprint("src/alpha.txt"))
        self.assertNotEqual(global_before, self.fingerprint())

    def test_deletion_identity_survives_commit(self) -> None:
        (self.repo / "src" / "alpha.txt").unlink()
        before = self.fingerprint("src/alpha.txt")
        self.commit_all("delete alpha")
        self.assertEqual(before, self.fingerprint("src/alpha.txt"))
        self.assertEqual(before, self.fingerprint("src/alpha.txt", revision="HEAD"))

    def test_revision_option_must_precede_path_delimiter(self) -> None:
        (self.repo / "src" / "alpha.txt").write_text("alpha v2\n", encoding="utf-8")

        current = self.cli("--", "src/alpha.txt")
        historical = self.cli("--rev", "HEAD", "--", "src/alpha.txt")
        misplaced = self.cli("--", "src/alpha.txt", "--rev", "HEAD")

        self.assertEqual(0, current.returncode, current.stderr)
        self.assertEqual(0, historical.returncode, historical.stderr)
        self.assertNotEqual(current.stdout, historical.stdout)
        self.assertNotEqual(0, misplaced.returncode)
        self.assertIn("--rev must appear before", misplaced.stderr)


if __name__ == "__main__":
    unittest.main()
