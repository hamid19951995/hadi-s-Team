"""
UAG FastAPI — real production-style API
Endpoints: health, nodes, run, merge, history
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ..engine import AgentGraph
from ..llm import LLMClient
from ..db import get_store


class NodeCreate(BaseModel):
    title: str
    models: List[str] = Field(default_factory=lambda: ["grok-4", "claude-4"])


class RunRequest(BaseModel):
    prompt: str
    system: str = ""


class MergeRequest(BaseModel):
    node_ids: List[str]
    mode: str = "synthesis"
    instructions: str = ""


class TextMergeRequest(BaseModel):
    """Direct multi-text merge without graph nodes."""
    texts: List[str]
    mode: str = "synthesis"


def create_app() -> FastAPI:
    app = FastAPI(
        title="UAG API",
        description="Universal Agent Graph — multi-model orchestration + intelligent merge",
        version="0.1.0",
    )
    graph = AgentGraph(LLMClient())
    store = get_store()

    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "service": "uag",
            "providers": graph.llm.available(),
            "db": store.stats(),
        }

    @app.get("/providers")
    def providers():
        return graph.llm.available()

    @app.post("/nodes")
    def create_node(body: NodeCreate):
        node = graph.add_node(body.title, body.models)
        store.save_node(node.id, node.title, node.models, node.status)
        store.log_run("node_create", node.id, {"title": body.title})
        return {"id": node.id, "title": node.title, "models": node.models, "status": node.status}

    @app.get("/nodes")
    def list_nodes():
        live = [
            {
                "id": n.id,
                "title": n.title,
                "models": n.models,
                "status": n.status,
                "outputs": len(n.outputs),
            }
            for n in graph.nodes.values()
        ]
        return {"live": live, "persisted": store.list_nodes()}

    @app.post("/nodes/{node_id}/run")
    def run_node(node_id: str, body: RunRequest):
        if node_id not in graph.nodes:
            raise HTTPException(404, f"Node {node_id} not found")
        node = graph.run_node(node_id, body.prompt, system=body.system)
        store.save_node(node.id, node.title, node.models, node.status, node.prompt)
        for o in node.outputs:
            store.save_output(node.id, o.model_id, o.content, o.provider, o.score, o.error)
        store.log_run("node_run", node_id)
        return {
            "id": node.id,
            "status": node.status,
            "outputs": [
                {"model": o.model_id, "provider": o.provider, "score": o.score, "content": o.content[:2000], "error": o.error}
                for o in node.outputs
            ],
        }

    @app.post("/merge")
    def merge_nodes(body: MergeRequest):
        try:
            result = graph.merge(body.node_ids, mode=body.mode, instructions=body.instructions)
        except ValueError as e:
            raise HTTPException(400, str(e))
        store.save_merge(
            result.id,
            result.source_node_ids,
            result.mode,
            result.final_content,
            steps=[{"name": s.name, "status": s.status, "detail": s.detail} for s in result.steps],
        )
        store.log_run("merge", result.id, {"mode": body.mode})
        return {
            "id": result.id,
            "status": result.status,
            "mode": result.mode,
            "steps": [{"name": s.name, "status": s.status, "detail": s.detail} for s in result.steps],
            "final_content": result.final_content,
            "mermaid": graph.mermaid_merge(result.id),
        }

    @app.post("/merge/texts")
    def merge_texts(body: TextMergeRequest):
        ids = []
        for i, t in enumerate(body.texts):
            n = graph.add_node(f"text-{i}", ["simulation"])
            from ..engine import NodeOutput
            n.outputs = [NodeOutput(model_id="raw", content=t, provider="user", score=1.0)]
            n.status = "done"
            ids.append(n.id)
        result = graph.merge(ids, mode=body.mode)
        store.save_merge(result.id, ids, body.mode, result.final_content)
        return {"id": result.id, "mode": body.mode, "result": result.final_content}

    @app.get("/merges")
    def list_merges():
        return store.list_merges()

    @app.get("/merges/{merge_id}")
    def get_merge(merge_id: str):
        row = store.get_merge(merge_id)
        if not row:
            raise HTTPException(404, "Merge not found")
        return row

    @app.get("/stats")
    def stats():
        return {"db": store.stats(), "live_nodes": len(graph.nodes), "live_merges": len(graph.merges)}

    return app


app = create_app()
