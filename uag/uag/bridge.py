"""
Bridge: UAG <-> hadi-s-Team engine + reverse-to-pipeline
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from .reverse import analyze_tree, plan_from_idea_and_repo, ReverseReport
from .pipeline import ProductionCycle, run_pipeline, ProjectState


ENGINE_MAP = {
    "orchestrator": "engine/orchestrator.py",
    "task_graph": "engine/task_graph.py",
    "dispatcher": "engine/dispatcher.py",
    "tool_executor": "engine/tool_executor.py",
    "provider_router": "engine/provider_router.py",
    "event_bus": "engine/event_bus.py",
    "memory": "engine/memory.py",
}

UAG_MAP = {
    "pipeline": "uag/uag/pipeline.py",
    "engine": "uag/uag/engine.py",
    "llm": "uag/uag/llm.py",
    "cli": "uag/uag/cli.py",
    "api": "uag/uag/api/app.py",
    "store": "uag/uag/db/store.py",
    "reverse": "uag/uag/reverse.py",
}


def capability_bridge() -> Dict[str, Any]:
    """Map hadi-s-Team engine concepts to UAG modules."""
    return {
        "task_graph": {"hadi": ENGINE_MAP["task_graph"], "uag": UAG_MAP["engine"], "note": "AgentGraph nodes/edges"},
        "orchestrator": {"hadi": ENGINE_MAP["orchestrator"], "uag": UAG_MAP["pipeline"], "note": "ProductionCycle.run"},
        "provider_router": {"hadi": ENGINE_MAP["provider_router"], "uag": UAG_MAP["llm"], "note": "LLMClient multi-provider"},
        "tool_executor": {"hadi": ENGINE_MAP["tool_executor"], "uag": "sandbox + connectors", "note": "GitHub/Figma/sandbox"},
        "memory": {"hadi": ENGINE_MAP["memory"], "uag": UAG_MAP["store"], "note": "SQLite Store nodes/merges/runs"},
        "dispatcher": {"hadi": ENGINE_MAP["dispatcher"], "uag": UAG_MAP["api"], "note": "FastAPI routes"},
    }


def rebuild_from_tree(
    paths: List[str],
    idea: str,
    owner: str = "",
    repo: str = "",
    output_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """Reverse tree → rebuild plan → run pipeline."""
    report = analyze_tree(paths, owner=owner, repo=repo)
    plan = plan_from_idea_and_repo(idea, report)
    pipeline_idea = plan["suggested_pipeline_idea"]
    state: ProjectState = run_pipeline(pipeline_idea, output_dir=output_dir)
    return {
        "reverse": {
            "summary": report.summary,
            "entrypoints": report.entrypoints,
            "risks": report.risks,
            "rebuild_plan": report.rebuild_plan,
        },
        "plan": plan,
        "pipeline": {
            "id": state.id,
            "status": state.status,
            "steps": [{"name": s.name, "status": s.status, "detail": s.detail} for s in state.steps],
            "preview": state.preview,
            "output_files": list(state.source_files.keys()),
        },
        "bridge": capability_bridge(),
    }


def rebuild_from_hadi_defaults(idea: str = "ادغام automation با UAG", output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Default hadi-s-Team tree for integrated test."""
    paths = [
        "main.py", "schemas.py", "package.json", "requirements.txt", "Dockerfile",
        "engine/orchestrator.py", "engine/task_graph.py", "engine/dispatcher.py",
        "engine/tool_executor.py", "engine/provider_router.py", "engine/memory.py",
        "src/App.tsx", "src/main.tsx",
        "uag/uag/pipeline.py", "uag/uag/engine.py", "uag/uag/cli.py",
    ]
    return rebuild_from_tree(paths, idea=idea, owner="hamid19951995", repo="hadi-s-Team", output_dir=output_dir)
