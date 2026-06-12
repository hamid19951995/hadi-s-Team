import logging
import asyncio
import random
import time
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime
from schemas import ProviderRequest, ProviderResponse

logger = logging.getLogger("studio.engine.provider_router")

class ProviderRouter:
    """
    Intelligent routing system wrapping model provider API dispatches.
    Monitors latency, implements exponential jitter retries, and falls back
    to robust alternative providers if primary servers fail.
    """
    def __init__(self, fallback_model: str = "gemini-3.5-flash"):
        self.fallback_model = fallback_model
        self._provider_health: Dict[str, bool] = {}
        self._model_latencies: Dict[str, List[float]] = {}
        self._total_tokens_consumed = {"prompt": 0, "completion": 0}
        self._lock = asyncio.Lock()

    async def route(self, request: ProviderRequest) -> ProviderResponse:
        """
        Routes the ProviderRequest to the designated LLM platform endpoint.
        Uses recursive attempts backed by exponential retries.
        """
        provider_name = request.provider
        model_name = request.model
        
        logger.info(f"Routing request '{request.request_id}' to provider '{provider_name}' ({model_name})")
        
        # Max retries policy
        max_attempts = 3
        backoff_base = 2.0
        
        last_error = None
        for attempt in range(1, max_attempts + 1):
            try:
                start_time = time.time()
                
                # In a real environment, we would import provider SDKs (e.g. google.genai or openai).
                # We emulate the physical API transactions here with high accuracy, implementing realistic
                # downstream delay generation and authentic JSON payload translation.
                response_payload = await self._execute_api_call(request, attempt)
                
                duration = time.time() - start_time
                await self._record_metrics(model_name, duration, response_payload.prompt_tokens, response_payload.completion_tokens)
                
                # Mark provider as healthy
                self._provider_health[provider_name] = True
                return response_payload
                
            except Exception as e:
                last_error = e
                logger.warning(f"Attempt {attempt}/{max_attempts} failed for model '{model_name}': {e}")
                
                # Exponential backoff with random jitter to prevent thundering herd runs
                if attempt < max_attempts:
                    jitter = random.uniform(0.1, 0.5)
                    sleep_duration = (backoff_base ** attempt) + jitter
                    logger.debug(f"Sleeping for {sleep_duration:.2f}s before retrying request...")
                    await asyncio.sleep(sleep_duration)

        # Main provider completely failed. Attempt secondary hot swap fallback
        logger.error(f"All {max_attempts} attempts failed for primary model '{model_name}'. Triggering fallback protocols.")
        self._provider_health[provider_name] = False
        
        if model_name != self.fallback_model:
            fallback_request = ProviderRequest(
                request_id=request.request_id,
                provider="google-vertex",
                model=self.fallback_model,
                prompt=request.prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                system_instruction=request.system_instruction,
                tools=request.tools,
                sent_at=datetime.utcnow()
            )
            logger.info(f"Rerouting query to fallback model '{self.fallback_model}'")
            return await self._execute_api_call(fallback_request, attempt=1)
            
        raise last_error or RuntimeError("Fallback execution reached end of loop without successfully resolving.")

    async def _execute_api_call(self, request: ProviderRequest, attempt: int) -> ProviderResponse:
        """
        Handles actual network connection simulation and structural parsing outputs.
        Produces highly realistic, structured responses for downstream agent parsers.
        """
        # Emulate network flight time
        await asyncio.sleep(0.35 + (random.uniform(0.1, 0.3)))
        
        # Simulate a transient API error on attempt 1 to test retry policies
        if attempt == 1 and random.random() < 0.15:
            raise ConnectionError("Transient remote service timeout encountered (HTTP 503 Service Unavailable).")

        # Compile token parameters
        prompt_str = str(request.prompt)
        prompt_tokens = len(prompt_str.split()) * 2 + 10 # heuristic parsing calculation
        
        # Create standard text payload response based on prompt matching
        generated_text = f"Parsed objective context. Under temperature configuration {request.temperature}, executing design steps."
        tool_calls = None

        if "create file" in prompt_str.lower() or "edit file" in prompt_str.lower() or "write" in prompt_str.lower():
            generated_text = "Analysis complete. Triggering tool file generation sequence."
            tool_calls = [
                {
                    "id": f"call_{str(uuid4())[:8]}",
                    "type": "function",
                    "function": {
                        "name": "edit_file",
                        "arguments": {
                            "TargetFile": "/src/main.tsx",
                            "TargetContent": "export default function App() { return <div></div>; }",
                            "ReplacementContent": "export default function App() { return <div className='bg-slate-900'>App Live</div>; }",
                            "Instruction": "Add dark canvas styled visual context marker"
                        }
                    }
                }
            ]
        elif "analyze" in prompt_str.lower() or "diagnose" in prompt_str.lower():
            generated_text = "System trace analysis shows: Project code successfully structures. No immediate syntax constraints detected."

        completion_tokens = len(generated_text.split()) * 2 + 15
        
        return ProviderResponse(
            response_id=uuid4(),
            request_id=request.request_id,
            text=generated_text,
            tool_calls=tool_calls,
            finish_reason="tool_calls" if tool_calls else "stop",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            received_at=datetime.utcnow()
        )

    async def _record_metrics(self, model: str, duration: float, prompt_tok: int, comp_tok: int) -> None:
        """
        Captures resource metrics for active system monitoring.
        """
        async with self._lock:
            if model not in self._model_latencies:
                self._model_latencies[model] = []
            self._model_latencies[model].append(duration)
            
            # Cap list length
            if len(self._model_latencies[model]) > 200:
                self._model_latencies[model].pop(0)

            self._total_tokens_consumed["prompt"] += prompt_tok
            self._total_tokens_consumed["completion"] += comp_tok

    def get_provider_health(self) -> Dict[str, bool]:
        """
        Returns active dictionary tracking known health mappings.
        """
        return self._provider_health

    def get_token_metrics(self) -> Dict[str, int]:
        """
        Returns aggregated counters.
        """
        return self._total_tokens_consumed

    def get_average_latency(self, model: str) -> float:
        """
        Computes accurate averages tracking connection responsiveness.
        """
        latencies = self._model_latencies.get(model, [])
        if not latencies:
            return 0.0
        return sum(latencies) / len(latencies)
