"""Unified multi-provider LLM client with simulation fallback."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Dict, List, Optional

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    from anthropic import Anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str
    error: Optional[str] = None
    usage: Optional[Dict] = None


MODEL_MAP = {
    "grok-4": ("xai", "grok-4"),
    "grok-3": ("xai", "grok-3"),
    "claude-4": ("anthropic", "claude-sonnet-4-20250514"),
    "claude-3.5": ("anthropic", "claude-3-5-sonnet-20241022"),
    "gpt-4.1": ("openai", "gpt-4.1"),
    "gpt-4o": ("openai", "gpt-4o"),
    "gpt-4o-mini": ("openai", "gpt-4o-mini"),
}


class LLMClient:
    def __init__(
        self,
        openai_key: Optional[str] = None,
        anthropic_key: Optional[str] = None,
        xai_key: Optional[str] = None,
    ):
        self.openai_key = openai_key or os.getenv("OPENAI_API_KEY", "")
        self.anthropic_key = anthropic_key or os.getenv("ANTHROPIC_API_KEY", "")
        self.xai_key = xai_key or os.getenv("XAI_API_KEY", "") or os.getenv("GROK_API_KEY", "")
        self._openai = None
        self._anthropic = None
        self._xai = None

    def available(self) -> Dict[str, bool]:
        return {
            "openai": bool(self.openai_key and HAS_OPENAI),
            "anthropic": bool(self.anthropic_key and HAS_ANTHROPIC),
            "xai": bool(self.xai_key and HAS_OPENAI),
            "simulation": True,
        }

    def call(
        self,
        model_id: str,
        prompt: str,
        system: str = "You are a precise senior engineer. Prefer complete, runnable code. Reply in the same language as the user unless asked otherwise.",
        temperature: float = 0.5,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        provider, api_model = MODEL_MAP.get(model_id, ("simulation", model_id))

        try:
            if provider == "xai" and self.xai_key and HAS_OPENAI:
                if not self._xai:
                    self._xai = OpenAI(api_key=self.xai_key, base_url="https://api.x.ai/v1")
                r = self._xai.chat.completions.create(
                    model=api_model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return LLMResponse(
                    content=r.choices[0].message.content or "",
                    model=api_model,
                    provider="xai",
                    usage=r.usage.model_dump() if r.usage else None,
                )

            if provider == "openai" and self.openai_key and HAS_OPENAI:
                if not self._openai:
                    self._openai = OpenAI(api_key=self.openai_key)
                r = self._openai.chat.completions.create(
                    model=api_model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return LLMResponse(
                    content=r.choices[0].message.content or "",
                    model=api_model,
                    provider="openai",
                    usage=r.usage.model_dump() if r.usage else None,
                )

            if provider == "anthropic" and self.anthropic_key and HAS_ANTHROPIC:
                if not self._anthropic:
                    self._anthropic = Anthropic(api_key=self.anthropic_key)
                r = self._anthropic.messages.create(
                    model=api_model,
                    max_tokens=max_tokens,
                    system=system,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = r.content[0].text if r.content else ""
                return LLMResponse(content=text, model=api_model, provider="anthropic")

        except Exception as e:
            return LLMResponse(content="", model=model_id, provider=provider, error=str(e))

        return self._simulate(model_id, prompt)

    def call_many(self, model_ids: List[str], prompt: str, system: str = "") -> List[LLMResponse]:
        return [self.call(m, prompt, system=system or "You are a precise senior engineer.") for m in model_ids]

    def _simulate(self, model_id: str, prompt: str) -> LLMResponse:
        lower = prompt.lower()
        if "fastapi" in lower or "api" in lower:
            code = '''from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI(title="UAG Demo API")\n\nclass MergeRequest(BaseModel):\n    texts: list[str]\n    mode: str = "synthesis"\n\n@app.post("/merge")\ndef merge(req: MergeRequest):\n    combined = "\\n---\\n".join(req.texts)\n    return {"mode": req.mode, "result": f"[merged {len(req.texts)} sources]\\n{combined[:500]}"}\n\n@app.get("/health")\ndef health():\n    return {"status": "ok", "service": "uag"}\n'''
        elif "cli" in lower or "typer" in lower:
            code = '''import typer\nfrom rich import print\n\napp = typer.Typer(help="UAG-style CLI")\n\n@app.command()\ndef run(prompt: str, models: str = "grok-4,claude-4"):\n    """Run multi-model node."""\n    print(f"[bold green]Running[/] models={models}")\n    print(f"Prompt: {prompt[:80]}...")\n\n@app.command()\ndef merge(mode: str = "synthesis"):\n    """Intelligent merge."""\n    print(f"[bold cyan]Merge mode:[/] {mode}")\n\nif __name__ == "__main__":\n    app()\n'''
        else:
            code = f'''# Generated by UAG simulation ({model_id})\n# Prompt: {prompt[:100]}\n\ndef main():\n    print("UAG node output — replace with real API for production")\n    return {{"model": "{model_id}", "status": "simulated"}}\n\nif __name__ == "__main__":\n    main()\n'''
        return LLMResponse(content=code, model=model_id, provider="simulation")
