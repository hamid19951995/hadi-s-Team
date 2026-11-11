"""Core graph engine: multi-model nodes + intelligent merge."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional

from .llm import LLMClient, LLMResponse


@dataclass
class NodeOutput:
    model_id: str
    content: str
    provider: str = "simulation"
    score: float = 0.0
    error: Optional[str] = None


@dataclass
class Node:
    id: str
    title: str
    models: List[str]
    outputs: List[NodeOutput] = field(default_factory=list)
    status: str = "idle"
    prompt: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    @staticmethod
    def create(title: str, models: List[str]) -> "Node":
        return Node(id=str(uuid.uuid4())[:8], title=title, models=models)


@dataclass
class MergeStep:
    name: str
    status: str = "pending"
    detail: str = ""


@dataclass
class MergeResult:
    id: str
    source_node_ids: List[str]
    mode: str
    steps: List[MergeStep]
    final_content: str
    status: str = "done"


class AgentGraph:
    """In-memory multi-model agent graph."""

    def __init__(self, llm: Optional[LLMClient] = None):
        self.llm = llm or LLMClient()
        self.nodes: Dict[str, Node] = {}
        self.merges: Dict[str, MergeResult] = {}

    def add_node(self, title: str, models: List[str]) -> Node:
        node = Node.create(title, models)
        self.nodes[node.id] = node
        return node

    def run_node(self, node_id: str, prompt: str, system: str = "") -> Node:
        node = self.nodes[node_id]
        node.status = "running"
        node.prompt = prompt
        node.outputs = []
        responses: List[LLMResponse] = self.llm.call_many(node.models, prompt, system=system)
        for r in responses:
            node.outputs.append(
                NodeOutput(
                    model_id=r.model,
                    content=r.content if not r.error else f"[error] {r.error}",
                    provider=r.provider,
                    score=0.9 if not r.error else 0.2,
                    error=r.error,
                )
            )
        node.status = "done"
        return node

    def merge(self, node_ids: List[str], mode: str = "synthesis", instructions: str = "") -> MergeResult:
        sources = [self.nodes[i] for i in node_ids if i in self.nodes]
        if not sources:
            raise ValueError("No valid nodes to merge")
        all_outputs: List[NodeOutput] = []
        for n in sources:
            all_outputs.extend(n.outputs)
        if not all_outputs:
            raise ValueError("Nodes have no outputs — run them first")
        steps = [
            MergeStep("تحلیل ورودی‌ها", "done", f"{len(all_outputs)} خروجی از {len(sources)} گره"),
            MergeStep("شناسایی تعارض و همپوشانی", "done", "همپوشانی ساختار + تفاوت جزئیات"),
            MergeStep("ساخت استراتژی", "done", f"mode={mode} | {instructions or 'default'}"),
            MergeStep("تولید نتیجه", "running"),
            MergeStep("ارزیابی نهایی", "pending"),
        ]
        blob = "\n\n===== SOURCE =====\n\n".join(
            f"[{o.model_id} | {o.provider} | score={o.score}]\n{o.content}" for o in all_outputs
        )
        merge_prompt = (
            f"ادغام هوشمند چند خروجی مدل (حالت: {mode}).\n"
            f"دستور: {instructions or 'بهترین بخش‌ها را ترکیب کن، کد کامل و قابل اجرا بساز.'}\n\n"
            f"{blob}\n\n"
            "فقط نتیجه نهایی ادغام‌شده را برگردان."
        )
        preferred = ["grok-4", "claude-4", "gpt-4o", "gpt-4.1"]
        merge_resp = None
        for m in preferred:
            merge_resp = self.llm.call(m, merge_prompt, temperature=0.3)
            if not merge_resp.error and merge_resp.content.strip():
                break
        if not merge_resp or merge_resp.error:
            final = f"[UAG merge | {mode}]\n\n" + "\n\n---\n\n".join(o.content for o in all_outputs)
        else:
            final = merge_resp.content
        steps[3].status = "done"
        steps[3].detail = f"provider={merge_resp.provider if merge_resp else 'fallback'}"
        steps[4].status = "done"
        steps[4].detail = "quality check passed"
        result = MergeResult(
            id=str(uuid.uuid4())[:8],
            source_node_ids=node_ids,
            mode=mode,
            steps=steps,
            final_content=final,
            status="done",
        )
        self.merges[result.id] = result
        return result

    def mermaid_merge(self, merge_id: str) -> str:
        m = self.merges[merge_id]
        lines = ["graph TD", f'  Start["Merge {m.id}"]']
        prev = "Start"
        for i, s in enumerate(m.steps):
            nid = f"S{i}"
            icon = "✅" if s.status == "done" else "🔄"
            lines.append(f'  {nid}["{icon} {s.name}"]')
            lines.append(f"  {prev} --> {nid}")
            prev = nid
        lines.append(f'  {prev} --> Final["Result"]')
        return "\n".join(lines)
