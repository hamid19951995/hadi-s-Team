"""UAG CLI — professional multi-model agent graph tool."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.syntax import Syntax
from rich.markdown import Markdown

from .engine import AgentGraph
from .llm import LLMClient

app = typer.Typer(
    name="uag",
    help="Universal Agent Graph — multi-model orchestration with intelligent merge",
    add_completion=False,
)
console = Console()

_graph: Optional[AgentGraph] = None
_state_file = Path.home() / ".uag_session.json"


def get_graph() -> AgentGraph:
    global _graph
    if _graph is None:
        _graph = AgentGraph(LLMClient())
    return _graph


@app.command()
def status():
    """Show provider availability and session nodes."""
    g = get_graph()
    avail = g.llm.available()
    table = Table(title="UAG Providers")
    table.add_column("Provider")
    table.add_column("Available")
    for k, v in avail.items():
        table.add_row(k, "✅" if v else "❌")
    console.print(table)
    console.print(f"Nodes in session: {len(g.nodes)} | Merges: {len(g.merges)}")


@app.command("node")
def node_create(
    title: str = typer.Argument(..., help="Node title"),
    models: str = typer.Option("grok-4,claude-4", "--models", "-m", help="Comma-separated model ids"),
):
    """Create a multi-model node."""
    g = get_graph()
    mids = [x.strip() for x in models.split(",") if x.strip()]
    n = g.add_node(title, mids)
    console.print(Panel(f"[bold green]Node created[/]\nid={n.id}\nmodels={mids}", title=title))


@app.command()
def run(
    node_id: str = typer.Argument(..., help="Node id"),
    prompt: str = typer.Option(..., "--prompt", "-p", help="Task / prompt"),
):
    """Run all models on a node."""
    g = get_graph()
    if node_id not in g.nodes:
        console.print(f"[red]Node not found:[/] {node_id}")
        raise typer.Exit(1)
    with console.status("Running models..."):
        n = g.run_node(node_id, prompt)
    console.print(f"[green]Done[/] — {len(n.outputs)} outputs")
    for o in n.outputs:
        console.print(Panel(
            Syntax(o.content[:2000], "python" if "def " in o.content or "import " in o.content else "text", theme="monokai", line_numbers=False),
            title=f"{o.model_id} ({o.provider}) score={o.score}",
        ))


@app.command()
def merge(
    node_ids: str = typer.Argument(..., help="Comma-separated node ids"),
    mode: str = typer.Option("synthesis", "--mode"),
    instructions: str = typer.Option("", "--instructions", "-i"),
    out: Optional[Path] = typer.Option(None, "--out", "-o", help="Write final result to file"),
):
    """Intelligent merge of node outputs."""
    g = get_graph()
    ids = [x.strip() for x in node_ids.split(",") if x.strip()]
    with console.status("Intelligent merge..."):
        result = g.merge(ids, mode=mode, instructions=instructions)
    console.print(Panel(f"merge_id={result.id} | status={result.status}", title="Merge complete"))
    for s in result.steps:
        console.print(f"  [{'green' if s.status=='done' else 'yellow'}]{s.status}[/] {s.name} — {s.detail}")
    console.print(Panel(
        Syntax(result.final_content[:3000], "python" if "def " in result.final_content else "markdown", theme="monokai"),
        title="Final result",
    ))
    console.print(Markdown("```mermaid\n" + g.mermaid_merge(result.id) + "\n```"))
    if out:
        out.write_text(result.final_content, encoding="utf-8")
        console.print(f"[green]Written:[/] {out}")


@app.command("list")
def list_nodes():
    """List session nodes."""
    g = get_graph()
    if not g.nodes:
        console.print("[dim]No nodes yet. Use: uag node \"title\" -m grok-4,claude-4[/]")
        return
    table = Table(title="Nodes")
    table.add_column("id")
    table.add_column("title")
    table.add_column("models")
    table.add_column("status")
    table.add_column("outputs")
    for n in g.nodes.values():
        table.add_row(n.id, n.title, ",".join(n.models), n.status, str(len(n.outputs)))
    console.print(table)


@app.command()
def demo():
    """End-to-end demo: two nodes → run → intelligent merge → save source."""
    g = get_graph()
    console.print("[bold]UAG Demo[/] — building a FastAPI merge service from multi-model nodes\n")

    n1 = g.add_node("API design", ["grok-4", "claude-4"])
    n2 = g.add_node("Implementation details", ["gpt-4o", "grok-4"])
    console.print(f"Nodes: {n1.id}, {n2.id}")

    prompt1 = (
        "Design a minimal FastAPI service with POST /merge that accepts a list of texts "
        "and a mode (synthesis|best_of) and returns a merged result. Include /health."
    )
    prompt2 = (
        "Implement production-ready FastAPI code for a multi-source text merge API: "
        "Pydantic models, error handling, and a clear response schema."
    )

    with console.status("Running node 1..."):
        g.run_node(n1.id, prompt1)
    with console.status("Running node 2..."):
        g.run_node(n2.id, prompt2)

    with console.status("Merging..."):
        result = g.merge(
            [n1.id, n2.id],
            mode="synthesis",
            instructions="یک فایل FastAPI کامل و قابل اجرا تولید کن",
        )

    out_dir = Path("uag_output")
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / "merge_api.py"
    content = result.final_content
    if "```python" in content:
        content = content.split("```python", 1)[1].split("```", 1)[0].strip()
    elif "```" in content:
        parts = content.split("```")
        if len(parts) >= 2:
            content = parts[1]
            if content.startswith("python"):
                content = content[6:]
            content = content.strip()
    out_file.write_text(content, encoding="utf-8")

    console.print(Panel(f"[green]Source written:[/] {out_file.resolve()}", title="Demo complete"))
    console.print(f"Merge id: {result.id}")
    console.print("Run with:  uvicorn uag_output.merge_api:app --reload")


if __name__ == "__main__":
    app()
