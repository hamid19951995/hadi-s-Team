"""UAG Production Cycle — idea to publish (11 steps)."""
from __future__ import annotations

import json, re, uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .engine import AgentGraph, MergeResult
from .llm import LLMClient
from .db import get_store
from .templates import intent_template


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class IntentSpec:
    goal: str
    project_type: List[str] = field(default_factory=lambda: ["api"])
    stack: List[str] = field(default_factory=lambda: ["python"])
    integrations: List[str] = field(default_factory=list)
    media: bool = False
    constraints: List[str] = field(default_factory=list)
    raw_idea: str = ""

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class PipelineStep:
    name: str
    status: str = "pending"
    detail: str = ""
    artifacts: Dict[str, Any] = field(default_factory=dict)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None


@dataclass
class ProjectState:
    id: str
    intent: IntentSpec
    steps: List[PipelineStep] = field(default_factory=list)
    node_ids: List[str] = field(default_factory=list)
    merge_id: Optional[str] = None
    source_files: Dict[str, str] = field(default_factory=dict)
    preview: Dict[str, Any] = field(default_factory=dict)
    debug_report: Dict[str, Any] = field(default_factory=dict)
    publish: Dict[str, Any] = field(default_factory=dict)
    status: str = "created"
    created_at: str = field(default_factory=_now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "intent": self.intent.to_dict(),
            "steps": [asdict(s) for s in self.steps],
            "node_ids": self.node_ids,
            "merge_id": self.merge_id,
            "source_files": {k: (v[:500] + "..." if len(v) > 500 else v) for k, v in self.source_files.items()},
            "preview": self.preview,
            "debug_report": self.debug_report,
            "publish": self.publish,
            "status": self.status,
            "created_at": self.created_at,
        }


PIPELINE_STEPS = [
    "idea_intake", "decompose", "distribute_models", "generate_source",
    "intelligent_merge", "write_artifacts", "preview", "debug",
    "plugin_upgrade", "media_hooks", "publish",
]


class ProductionCycle:
    def __init__(self, llm=None, graph=None, output_dir=None):
        self.llm = llm or LLMClient()
        self.graph = graph or AgentGraph(self.llm)
        self.store = get_store()
        self.output_dir = Path(output_dir or Path.cwd() / "uag_pipeline_out")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.state: Optional[ProjectState] = None

    def _step(self, name: str) -> PipelineStep:
        for s in self.state.steps:
            if s.name == name:
                return s
        raise KeyError(name)

    def _begin(self, name: str):
        s = self._step(name)
        s.status, s.started_at = "running", _now()

    def _end(self, name: str, detail: str = "", artifacts=None, error: bool = False):
        s = self._step(name)
        s.status = "error" if error else "done"
        s.detail, s.finished_at = detail, _now()
        if artifacts:
            s.artifacts.update(artifacts)

    def _extract_code(self, text: str) -> str:
        if "```python" in text:
            return text.split("```python", 1)[1].split("```", 1)[0].strip()
        if "```" in text:
            parts = text.split("```")
            if len(parts) >= 2:
                b = parts[1]
                if b.lstrip().startswith("python"):
                    b = b.lstrip()[6:]
                return b.strip()
        return text.strip()

    def _intent_template(self, intent: IntentSpec) -> str:
        return intent_template(intent)

    def idea_intake(self, idea: str) -> IntentSpec:
        self._begin("idea_intake")
        intent = IntentSpec(goal=idea[:200], raw_idea=idea)
        low = idea.lower()
        if "api" in low or "fastapi" in low:
            intent.project_type = ["api"]
        if "cli" in low:
            intent.project_type = list(set(intent.project_type + ["cli"]))
        if "figma" in low:
            intent.integrations.append("figma")
        if "github" in low:
            intent.integrations.append("github")
        if any(w in low for w in ("تصویر", "ویدئو", "موسیقی", "image", "video", "music")):
            intent.media = True
        resp = self.llm.call("grok-4", f"Intent JSON for: {idea}\nkeys: goal,project_type,stack,integrations,media,constraints — JSON only", temperature=0.2)
        try:
            m = re.search(r"\{[\s\S]*\}", resp.content or "")
            if m:
                data = json.loads(m.group())
                intent.goal = data.get("goal", intent.goal)
                intent.project_type = data.get("project_type") or intent.project_type
                intent.stack = data.get("stack") or intent.stack
                intent.integrations = data.get("integrations") or intent.integrations
                intent.media = bool(data.get("media", intent.media))
                intent.constraints = data.get("constraints") or []
        except Exception:
            pass
        self.state.intent = intent
        self._end("idea_intake", f"goal={intent.goal[:80]}", {"intent": intent.to_dict()})
        return intent

    def decompose(self) -> List[str]:
        self._begin("decompose")
        intent = self.state.intent
        tasks = [f"معماری: {intent.goal}", f"هسته stack={intent.stack}", "تست و health/cli"]
        if "api" in intent.project_type:
            tasks.append("REST endpoints")
        if intent.integrations:
            tasks.append(f"integrations: {intent.integrations}")
        if intent.media:
            tasks.append("media hooks")
        self._end("decompose", f"{len(tasks)} tasks", {"tasks": tasks})
        return tasks

    def distribute_models(self, tasks: List[str]) -> List[str]:
        self._begin("distribute_models")
        n1 = self.graph.add_node("architecture", ["grok-4", "claude-4"])
        n2 = self.graph.add_node("implementation", ["gpt-4o", "grok-4"])
        self.store.save_node(n1.id, n1.title, n1.models)
        self.store.save_node(n2.id, n2.title, n2.models)
        self.state.node_ids = [n1.id, n2.id]
        self._end("distribute_models", f"nodes={self.state.node_ids}")
        return self.state.node_ids

    def generate_source(self, tasks: List[str]) -> None:
        self._begin("generate_source")
        goal = self.state.intent.goal
        prompts = {
            self.state.node_ids[0]: f"Architecture for: {goal}\nTasks: {tasks}",
            self.state.node_ids[1]: f"Runnable Python for: {goal}\nPrefer FastAPI with /health if API. One python block.",
        }
        for nid, prompt in prompts.items():
            self.graph.run_node(nid, prompt)
            node = self.graph.nodes[nid]
            self.store.save_node(nid, node.title, node.models, node.status, node.prompt)
            for o in node.outputs:
                self.store.save_output(nid, o.model_id, o.content, o.provider, o.score, o.error)
        self._end("generate_source", f"ran {len(prompts)} nodes")

    def intelligent_merge(self) -> MergeResult:
        self._begin("intelligent_merge")
        result = self.graph.merge(
            self.state.node_ids, mode="synthesis",
            instructions="یک ماژول Python/FastAPI منسجم و قابل اجرا با /health در صورت API.",
        )
        self.state.merge_id = result.id
        self.store.save_merge(
            result.id, result.source_node_ids, result.mode, result.final_content,
            steps=[{"name": s.name, "status": s.status, "detail": s.detail} for s in result.steps],
        )
        self._end("intelligent_merge", f"merge_id={result.id}")
        return result

    def write_artifacts(self, merge: MergeResult) -> Dict[str, Path]:
        self._begin("write_artifacts")
        code = self._extract_code(merge.final_content)
        if "UAG Demo API" in code or "MergeRequest" in code or len(code) < 80:
            code = self._intent_template(self.state.intent)
        paths = {}
        main_path = self.output_dir / "app_generated.py"
        main_path.write_text(code, encoding="utf-8")
        paths["app"] = main_path
        self.state.source_files["app_generated.py"] = code
        (self.output_dir / "intent.json").write_text(
            json.dumps(self.state.intent.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
        paths["intent"] = self.output_dir / "intent.json"
        self._end("write_artifacts", f"files={list(paths)}")
        return paths

    def preview(self, paths: Dict[str, Path]) -> Dict[str, Any]:
        self._begin("preview")
        code = self.state.source_files.get("app_generated.py", "")
        preview = {"output_dir": str(self.output_dir), "files": {k: str(v) for k, v in paths.items()}}
        if "FastAPI" in code or "fastapi" in code:
            preview["type"] = "fastapi"
            preview["suggested_commands"] = [
                f"cd {self.output_dir}", "uvicorn app_generated:app --port 8701",
                "curl http://127.0.0.1:8701/health",
            ]
        else:
            preview["type"] = "script"
            preview["suggested_commands"] = [f"python {paths.get('app')}"]
        try:
            compile(code, "app_generated.py", "exec")
            preview["syntax_ok"] = True
        except SyntaxError as e:
            preview["syntax_ok"] = False
            preview["syntax_error"] = str(e)
        self.state.preview = preview
        self._end("preview", f"type={preview.get('type')} syntax_ok={preview.get('syntax_ok')}")
        return preview

    def debug(self) -> Dict[str, Any]:
        self._begin("debug")
        code = self.state.source_files.get("app_generated.py", "")
        report = {"syntax_ok": False, "hints": []}
        try:
            compile(code, "app_generated.py", "exec")
            report["syntax_ok"] = True
        except SyntaxError as e:
            report["syntax_error"] = str(e)
            report["hints"].append("SyntaxError")
        self.state.debug_report = report
        self._end("debug", f"syntax_ok={report['syntax_ok']}")
        return report

    def plugin_upgrade(self) -> Dict[str, Any]:
        self._begin("plugin_upgrade")
        plan = {
            "enabled_now": ["graph_core", "llm_providers", "sandbox", "github", "figma"],
            "suggested_for_intent": ["graph_core", "llm_providers", "sandbox", "github"],
            "needs_auth": ["vercel", "netlify", "notion"],
        }
        self._end("plugin_upgrade", "plugins mapped", plan)
        return plan

    def media_hooks(self) -> Dict[str, Any]:
        self._begin("media_hooks")
        if not self.state.intent.media:
            self._step("media_hooks").status = "skipped"
            self._end("media_hooks", "skipped — media=false", {"skipped": True})
            return {"skipped": True}
        assets = self.output_dir / "assets"
        assets.mkdir(exist_ok=True)
        self._end("media_hooks", "hooks registered")
        return {"image": "assets/", "video": "assets/video/", "music": "assets/audio/"}

    def publish(self, push_github: bool = False) -> Dict[str, Any]:
        self._begin("publish")
        info = {"local_path": str(self.output_dir.resolve()), "files": list(self.state.source_files.keys())}
        (self.output_dir / "PUBLISH.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
        self.state.publish = info
        self._end("publish", f"local={self.output_dir}")
        return info

    def run(self, idea: str, push_github: bool = False) -> ProjectState:
        pid = str(uuid.uuid4())[:8]
        self.state = ProjectState(
            id=pid, intent=IntentSpec(goal="", raw_idea=idea),
            steps=[PipelineStep(name=n) for n in PIPELINE_STEPS], status="running",
        )
        self.store.log_run("pipeline_start", pid, {"idea": idea[:200]})
        self.idea_intake(idea)
        tasks = self.decompose()
        self.distribute_models(tasks)
        self.generate_source(tasks)
        merge = self.intelligent_merge()
        paths = self.write_artifacts(merge)
        self.preview(paths)
        self.debug()
        self.plugin_upgrade()
        self.media_hooks()
        self.publish(push_github=push_github)
        self.state.status = "done"
        (self.output_dir / "pipeline_state.json").write_text(
            json.dumps(self.state.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
        self.store.log_run("pipeline_done", pid, {"status": "done"})
        return self.state


def run_pipeline(idea: str, output_dir: Optional[str] = None) -> ProjectState:
    return ProductionCycle(output_dir=Path(output_dir) if output_dir else None).run(idea)
