#!/usr/bin/env python3
"""Behavioral tests for repository-scoped assurance contract checks."""

from __future__ import annotations

from collections.abc import Callable
from contextlib import redirect_stdout
import importlib.util
import io
import os
from pathlib import Path
import unittest
from unittest import mock


SCRIPT = Path(__file__).with_name("check-assurance-contracts.py")
SPEC = importlib.util.spec_from_file_location("check_assurance_contracts", SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"cannot load {SCRIPT}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ORIGINAL_READ = MODULE.read

INVALID_PROJECT_README = """\
# Example project

Legacy delivery happens after each implementation.
"""


class AssuranceContractScopeTests(unittest.TestCase):
    def run_check(
        self,
        *,
        github_actions: str | None,
        github_repository: str | None,
    ) -> tuple[int, str]:
        environment = {}
        if github_actions is not None:
            environment["GITHUB_ACTIONS"] = github_actions
        if github_repository is not None:
            environment["GITHUB_REPOSITORY"] = github_repository

        def read_with_project_readme(relative: str) -> str:
            if relative == "README.md":
                return INVALID_PROJECT_README
            return ORIGINAL_READ(relative)

        output = io.StringIO()
        with (
            mock.patch.dict(os.environ, environment, clear=True),
            mock.patch.object(MODULE, "read", side_effect=read_with_project_readme),
            redirect_stdout(output),
        ):
            result = MODULE.main()
        return result, output.getvalue()

    def test_downstream_actions_ignore_project_owned_readme(self) -> None:
        result, output = self.run_check(
            github_actions="true",
            github_repository="example/my-app",
        )

        self.assertEqual(0, result)
        self.assertNotIn("README.md:", output)
        self.assertIn("OK: risk-tiered implementation contracts are coherent", output)

    def test_upstream_actions_enforce_template_readme_contract(self) -> None:
        result, output = self.run_check(
            github_actions="true",
            github_repository="sjmeehan9/project-template",
        )

        self.assertEqual(1, result)
        self.assertIn("README.md: missing 'risk-tiered'", output)
        self.assertIn("README.md: missing 'Test Phase X'", output)
        self.assertIn("README.md: missing 'serialized by default'", output)
        self.assertIn(
            "README.md: contains obsolete contract 'after each implementation'",
            output,
        )

    def test_local_runs_remain_strict(self) -> None:
        result, output = self.run_check(
            github_actions=None,
            github_repository=None,
        )

        self.assertEqual(1, result)
        self.assertIn("README.md: missing 'risk-tiered'", output)

    def test_actions_without_repository_identity_skip_readme(self) -> None:
        result, output = self.run_check(
            github_actions="true",
            github_repository=None,
        )

        self.assertEqual(0, result)
        self.assertNotIn("README.md:", output)


class LightAssuranceContractMutationTests(unittest.TestCase):
    def run_mutated_check(
        self,
        relative: str,
        mutate: Callable[[str], str],
    ) -> tuple[int, str]:
        original = ORIGINAL_READ(relative)

        def read_with_mutation(candidate: str) -> str:
            if candidate == relative:
                return mutate(original)
            return ORIGINAL_READ(candidate)

        output = io.StringIO()
        with (
            mock.patch.dict(
                os.environ,
                {
                    "GITHUB_ACTIONS": "true",
                    "GITHUB_REPOSITORY": "sjmeehan9/project-template",
                },
                clear=True,
            ),
            mock.patch.object(MODULE, "read", side_effect=read_with_mutation),
            redirect_stdout(output),
        ):
            result = MODULE.main()
        return result, output.getvalue()

    def test_light_skill_rejects_test_agent_delegation(self) -> None:
        relative = ".agents/skills/build-with-agent-team-light/SKILL.md"
        result, output = self.run_mutated_check(
            relative,
            lambda content: content + "\nDelegate `test` to validate this component.\n",
        )

        self.assertEqual(1, result)
        self.assertIn(f"{relative}: matches unsafe/obsolete pattern", output)

    def test_light_skill_rejects_an_eighth_agent(self) -> None:
        relative = ".agents/skills/build-with-agent-team-light/SKILL.md"
        result, output = self.run_mutated_check(
            relative,
            lambda content: content.replace(
                "Do not delegate to Competitor Analysis",
                "| Planning | `repo-analysis` | Extra repository analysis |"
                "\n\nDelegate `repo-analysis` when context is broad."
                "\n\nDo not delegate to Competitor Analysis",
            ),
        )

        self.assertEqual(1, result)
        self.assertIn(
            f"{relative}: light-agent registry must be exactly",
            output,
        )
        self.assertIn(
            f"{relative}: delegates outside the seven-agent allowlist: repo-analysis",
            output,
        )

    def test_light_skill_requires_test_and_full_mapping_to_review(self) -> None:
        relative = ".claude/skills/build-with-agent-team-light/SKILL.md"
        result, output = self.run_mutated_check(
            relative,
            lambda content: content.replace(
                "any standard route that would have been `test` or `full` maps to `review`",
                "risk routes are selected case by case",
            ),
        )

        self.assertEqual(1, result)
        self.assertIn(
            f"{relative}: missing "
            "'any standard route that would have been `test` or `full` maps to `review`'",
            output,
        )

    def test_review_requires_standard_mode_preservation(self) -> None:
        relative = ".codex/agents/review.toml"
        result, output = self.run_mutated_check(
            relative,
            lambda content: content.replace(
                "standard mode remains unchanged",
                "all phase gates use the light behavior",
            ),
        )

        self.assertEqual(1, result)
        self.assertIn(
            f"{relative}: missing 'standard mode remains unchanged'",
            output,
        )


if __name__ == "__main__":
    unittest.main()
