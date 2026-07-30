#!/usr/bin/env python3
"""Validate the repository's controlled Markdown documentation."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
LINK_RE = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")
IGNORED_DIRS = {
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "build",
    "dist",
    "node_modules",
}
REQUIRED_FILES = (
    "README.md",
    "CHANGELOG.md",
    "docs/00-governance/DEVELOPMENT_MEMO.md",
    "docs/02-architecture/TARGET_ARCHITECTURE.md",
    "docs/04-testing/TEST_STRATEGY.md",
    "docs/05-release/RELEASE_MANAGEMENT.md",
    "docs/06-acceptance/ACCEPTANCE_MANUAL.md",
    "records/README.md",
    "templates/README.md",
)
CONTROLLED_METADATA = ("| 文档编号 |", "| 版本 |", "| 状态 |")


def markdown_files() -> list[Path]:
    return sorted(
        path for path in ROOT.rglob("*.md") if not IGNORED_DIRS.intersection(path.parts)
    )


def validate_required(errors: list[str]) -> None:
    for relative in REQUIRED_FILES:
        if not (ROOT / relative).is_file():
            errors.append(f"missing required file: {relative}")


def validate_links(path: Path, text: str, errors: list[str]) -> None:
    for match in LINK_RE.finditer(text):
        raw = match.group(1).strip().strip("<>")
        destination = raw.split(maxsplit=1)[0]
        parsed = urlsplit(destination)
        if parsed.scheme or destination.startswith(("#", "mailto:")):
            continue
        relative_target = unquote(parsed.path)
        if not relative_target:
            continue
        target = (path.parent / relative_target).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"{path.relative_to(ROOT)}: link escapes repository: {raw}")
            continue
        if not target.exists():
            line = text.count("\n", 0, match.start()) + 1
            errors.append(
                f"{path.relative_to(ROOT)}:{line}: missing link target: {raw}"
            )


def validate_metadata(path: Path, text: str, errors: list[str]) -> None:
    relative = path.relative_to(ROOT)
    if not relative.parts or relative.parts[0] != "docs":
        return
    if path.name == "README.md" or "adr" in relative.parts:
        return
    for marker in CONTROLLED_METADATA:
        if marker not in text:
            errors.append(f"{relative}: missing controlled metadata: {marker}")


def main() -> int:
    errors: list[str] = []
    validate_required(errors)
    files = markdown_files()
    for path in files:
        text = path.read_text(encoding="utf-8")
        validate_links(path, text, errors)
        validate_metadata(path, text, errors)

    if errors:
        print(f"documentation validation failed with {len(errors)} error(s):")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"documentation validation passed: {len(files)} Markdown files checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
