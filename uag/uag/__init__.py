"""Universal Agent Graph (uag) — multi-model orchestration with intelligent merge."""

__version__ = "0.1.0"

from .engine import AgentGraph, Node, MergeResult
from .llm import LLMClient, LLMResponse

__all__ = ["AgentGraph", "Node", "MergeResult", "LLMClient", "LLMResponse", "__version__"]
