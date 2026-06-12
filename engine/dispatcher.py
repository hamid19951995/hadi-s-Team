import logging
import asyncio
from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from schemas import (
    AgentTask, AgentResult, TaskStatus, ToolRequest, ToolStatus, 
    ProviderRequest, ProviderResponse, MemoryType, SystemEvent, EventSeverity, ExecutionLog
)
from engine.event_bus import EventBus
from engine.memory import MemoryManager
from engine.provider_router import ProviderRouter
from engine.tool_executor import ToolExecutor

logger = logging.getLogger("studio.engine.dispatcher")

class BaseExecutionAgent:
    """
    Standard class outlining interface patterns for deep reasoning loop execution.
    """
    def __init__(self, name: str, router: ProviderRouter, executor: ToolExecutor):
        self.name = name
        self.router = router
        self.executor = executor

    async def execute_task(self, task: AgentTask, context_memories: List[str]) -> AgentResult:
        raise NotImplementedError("Execution agents must declare concrete task handlers.")


class CoderAgent(BaseExecutionAgent):
    """
    Specialized agent equipped to parse directories, generate visual modules,
    and trigger compiler runs.
    """
    async def execute_task(self, task: AgentTask, context_memories: List[str]) -> AgentResult:
        logger.info(f"Agent '{self.name}' executing task '{task.task_id}': {task.title}")
        
        # Prepare context and prompt injection templates
        instructions = f"Act as an autonomous software engineer. Resolve objective: {task.description}"
        if context_memories:
            instructions += "\n\nRetrieved Context Memories:\n- " + "\n- ".join(context_memories)

        # Assemble Provider request
        provider_req = ProviderRequest(
            provider="google-vertex",
            model="gemini-2.5-pro",
            prompt=f"Direct parameters: {task.inputs}\nAction objective: {task.description}",
            temperature=0.2,
            system_instruction=instructions
        )

        try:
            # Dispatch to LLM router
            provider_resp = await self.router.route(provider_req)
            
            # Reasoning and tool resolution loop
            max_iterations = 5
            iteration = 0
            
            last_text = provider_resp.text
            current_tool_calls = provider_resp.tool_calls
            
            while current_tool_calls and iteration < max_iterations:
                iteration += 1
                logger.info(f"Iteration {iteration}: Processing {len(current_tool_calls)} model tool requests.")
                
                tool_results = []
                for call in current_tool_calls:
                    f_meta = call.get("function", {})
                    t_name = f_meta.get("name")
                    t_args = f_meta.get("arguments", {})
                    
                    # Convert to strict ToolRequest schema
                    tool_req = ToolRequest(
                        task_id=task.task_id,
                        tool_name=t_name,
                        arguments=t_args,
                        timeout_seconds=120
                    )
                    
                    # Target executor runs
                    res_val = await self.executor.execute(tool_req)
                    tool_results.append(res_val)

                # Feed results back to the LLM to get next action boundary
                followup_prompt = f"Previous iteration results: {[r.model_dump(mode='json') for r in tool_results]}"
                followup_req = ProviderRequest(
                    provider="google-vertex",
                    model="gemini-2.5-pro",
                    prompt=followup_prompt,
                    temperature=0.1,
                    system_instruction=instructions
                )
                
                provider_resp = await self.router.route(followup_req)
                last_text = provider_resp.text
                current_tool_calls = provider_resp.tool_calls

            # Build final task completion outcomes
            task_success = True
            error_msg = None
            
            # Double check if there was an obvious compilation error
            if "error" in (last_text or "").lower():
                task_success = False
                error_msg = f"Model execution analysis indicates potential issue: {last_text}"

            return AgentResult(
                task_id=task.task_id,
                success=task_success,
                output={
                    "resolution_summary": last_text or "Task resolved successfully with terminal edits.",
                    "iterations_spent": iteration,
                    "completed_successfully": task_success
                },
                error=error_msg,
                resolved_at=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"Agent execution error pattern: {e}", exc_info=True)
            return AgentResult(
                task_id=task.task_id,
                success=False,
                output={},
                error=f"Dispatcher thread crashed on run loop: {str(e)}",
                resolved_at=datetime.utcnow()
            )


class AgentDispatcher:
    """
    Central hub routing task nodes to their appropriate designated LLM-driven agents.
    Handles embedding-memory lookup context injection, and logging traces of intermediate work.
    """
    def __init__(self, event_bus: EventBus, memory: MemoryManager, router: ProviderRouter, executor: ToolExecutor):
        self._event_bus = event_bus
        self._memory = memory
        self._router = router
        self._executor = executor
        self._agents: Dict[str, BaseExecutionAgent] = {}
        
        # Load standard agents
        self._register_default_agents()

    def register_agent(self, agent_class_name: str, agent: BaseExecutionAgent) -> None:
        """
        Dynamically registers execution agents matching string class definitions.
        """
        self._agents[agent_class_name] = agent
        logger.info(f"Registered agent executor: '{agent_class_name}'")

    async def dispatch(self, task: AgentTask) -> AgentResult:
        """
        Processes an assigned AgentTask by preparing context, running the agent loop,
        and recording step histories as clean system events.
        """
        logger.info(f"Dispatching task {task.task_id} assigned to '{task.assigned_agent}'")
        
        # 1. Query memory manager for relevant contextual insights
        related_memories = await self._memory.search_similar(
            query=f"{task.title} {task.description}",
            memory_type=MemoryType.SEMANTIC,
            max_results=3
        )
        context_blocks = [m.content for m in related_memories]

        # 2. Select targeted agent executor
        agent = self._agents.get(task.assigned_agent)
        if not agent:
            # Fallback to general Coder Agent
            agent = self._agents.get("coder_agent")
            logger.warning(f"Target agent class '{task.assigned_agent}' absent. Falling back to default coder_agent.")

        # Notify event bus we are running a job segment
        await self._event_bus.publish(
            SystemEvent(
                source="engine.dispatcher",
                topic="task.started",
                severity=EventSeverity.INFO,
                payload={"task_id": str(task.task_id), "agent": task.assigned_agent}
            )
        )

        log_step = 1
        # Store initial execution log entry
        await self._memory.store_quick(
            MemoryType.EPISODIC,
            content=f"Starting task execution: {task.title}",
            metadata={"task_id": str(task.task_id), "phase": "initialization", "step": log_step}
        )

        # 3. Trigger execution run
        result = await agent.execute_task(task, context_blocks)
        
        # 4. Store outcome result to episodic memory store
        log_step += 1
        await self._memory.store_quick(
            MemoryType.EPISODIC,
            content=f"Task terminated. Outcome Success: {result.success}. Error trace: {result.error}",
            metadata={"task_id": str(task.task_id), "phase": "finalization", "step": log_step}
        )

        # Notify global network that the task has finalized
        await self._event_bus.publish(
            SystemEvent(
                source="engine.dispatcher",
                topic="task.completed" if result.success else "task.failed",
                severity=EventSeverity.INFO if result.success else EventSeverity.ERROR,
                payload={"task_id": str(task.task_id), "success": result.success, "error": result.error}
            )
        )

        return result

    def _register_default_agents(self) -> None:
        """
        Populates default systems.
        """
        c_agent = CoderAgent("Core Coder Agent", self._router, self._executor)
        self.register_agent("coder_agent", c_agent)
        self.register_agent("planner", c_agent) # Reuse core routing for layout setups
        self.register_agent("tester", c_agent)
