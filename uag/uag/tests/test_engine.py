"""Unit tests for UAG engine + store."""

import pytest
from uag.engine import AgentGraph
from uag.llm import LLMClient
from uag.db import Store
from pathlib import Path
import tempfile


def test_add_and_run_node():
    g = AgentGraph(LLMClient())
    n = g.add_node("t1", ["grok-4"])
    assert n.id in g.nodes
    g.run_node(n.id, "print hello world in python")
    assert n.status == "done"
    assert len(n.outputs) >= 1
    assert n.outputs[0].content


def test_merge_requires_outputs():
    g = AgentGraph(LLMClient())
    n = g.add_node("empty", ["grok-4"])
    with pytest.raises(ValueError):
        g.merge([n.id])


def test_merge_success():
    g = AgentGraph(LLMClient())
    n1 = g.add_node("a", ["grok-4"])
    n2 = g.add_node("b", ["claude-4"])
    g.run_node(n1.id, "fastapi health endpoint")
    g.run_node(n2.id, "fastapi merge endpoint")
    r = g.merge([n1.id, n2.id], mode="synthesis")
    assert r.status == "done"
    assert r.final_content
    assert len(r.steps) == 5


def test_store_persist():
    with tempfile.TemporaryDirectory() as d:
        store = Store(Path(d) / "t.db")
        store.save_node("n1", "title", ["grok-4"], "done", "p")
        store.save_output("n1", "grok-4", "hello", "simulation", 0.9)
        store.save_merge("m1", ["n1"], "synthesis", "merged text")
        assert store.stats()["nodes"] == 1
        assert store.stats()["outputs"] == 1
        assert store.stats()["merges"] == 1
        assert store.get_merge("m1")["final_content"] == "merged text"


def test_llm_simulation_always_works():
    c = LLMClient()
    r = c.call("grok-4", "build a typer cli")
    assert r.content
    assert r.provider in ("simulation", "xai", "openai", "anthropic")
