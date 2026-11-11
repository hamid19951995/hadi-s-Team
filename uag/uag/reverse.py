"""Reverse engineering helpers for UAG — GitHub repo structure & design context."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class RepoMap:
    owner: str
    repo: str
    paths: List[str] = field(default_factory=list)
    languages: Dict[str, int] = field(default_factory=dict)
    notes: str = ""


@dataclass
class ReverseReport:
    source: str
    summary: str
    structure: List[str] = field(default_factory=list)
    entrypoints: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)
    rebuild_plan: List[str] = field(default_factory=list)


def analyze_tree(paths: List[str], owner: str = "", repo: str = "") -> ReverseReport:
    """Build a reverse-engineering report from a file tree (e.g. GitHub get_repository_tree)."""
    entrypoints = []
    for p in paths:
        name = p.rsplit("/", 1)[-1].lower()
        if name in ("main.py", "app.py", "index.js", "index.ts", "manage.py", "cli.py"):
            entrypoints.append(p)
        if name in ("package.json", "pyproject.toml", "requirements.txt", "dockerfile"):
            entrypoints.append(p)

    langs: Dict[str, int] = {}
    for p in paths:
        if "." in p:
            ext = p.rsplit(".", 1)[-1].lower()
            if ext in ("py", "ts", "js", "go", "rs", "java", "tsx", "jsx"):
                langs[ext] = langs.get(ext, 0) + 1

    rebuild = [
        "شناسایی entrypointها و قراردادهای API",
        "استخراج مدل داده و dependencyها",
        "بازتولید اسکلت پروژه با UAG pipeline",
        "مقایسه رفتار با تست‌های golden",
    ]
    risks = []
    if any("secret" in p.lower() or ".env" in p.lower() for p in paths):
        risks.append("احتمال وجود secrets در درخت فایل")
    if not entrypoints:
        risks.append("entrypoint واضح یافت نشد")

    return ReverseReport(
        source=f"{owner}/{repo}" if owner else "tree",
        summary=f"{len(paths)} paths, langs={langs}",
        structure=sorted(paths)[:50],
        entrypoints=entrypoints,
        risks=risks,
        rebuild_plan=rebuild,
    )


def plan_from_idea_and_repo(idea: str, report: ReverseReport) -> Dict[str, Any]:
    """Combine user idea with reverse report into a rebuild intent."""
    return {
        "idea": idea,
        "repo": report.source,
        "entrypoints": report.entrypoints,
        "rebuild_plan": report.rebuild_plan,
        "suggested_pipeline_idea": (
            f"بازسازی بر اساس {report.source}: {idea}. "
            f"Entry: {', '.join(report.entrypoints[:5]) or 'N/A'}"
        ),
    }
