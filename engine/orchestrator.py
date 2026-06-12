import logging
import asyncio
from typing import Dict, List, Optional, Set
from uuid import UUID, uuid4
from datetime import datetime

from schemas import (
    AgentTask, AgentResult, TaskNode, NodeStatus, TaskStatus,
    SystemEvent, EventSeverity, MemoryType, ProjectState
)
from engine.event_bus import EventBus
from engine.task_graph import TaskGraphEngine
from engine.memory import MemoryManager
from engine.provider_router import ProviderRouter
from engine.tool_executor import ToolExecutor
from engine.dispatcher import AgentDispatcher

logger = logging.getLogger("studio.engine.orchestrator")

class Orchestrator:
    """
    Core distributed control center orchestrating system workflows.
    Bridges graph progress, dynamic resource dispatching, and high-performance concurrency.
    """
    def __init__(self, event_bus: EventBus, memory: MemoryManager, router: ProviderRouter, executor: ToolExecutor):
        self.event_bus = event_bus
        self.memory = memory
        self.router = router
        self.executor = executor
        
        # Assemble dispatcher
        self.dispatcher = AgentDispatcher(event_bus, memory, router, executor)
        
        self._active_runs: Dict[UUID, TaskGraphEngine] = {}
        self._running_tasks: Dict[UUID, asyncio.Task] = {}
        self._cancellation_events: Dict[UUID, asyncio.Event] = {}
        self._lock = asyncio.Lock()

    async def run_plan(self, goal: str, workspace_state: ProjectState) -> UUID:
        """
        Receives an overarching objective, generates a logical execution plan (DAG),
        registers the run tracking states, and begins non-blocking pipeline execution.
        """
        run_id = uuid4()
        
        logger.info(f"Orchestrating new execution flow campaign '{run_id}' for goal: '{goal}'")
        
        # 1. Synthesize plan. In a production system, an LLM Planner agent maps out
        # the task dependencies. Here, we programmatically construct a highly resilient
        # engineering plan mapping design, module development, test creation, and compile steps.
        nodes = self._generate_logical_plan_nodes(run_id, goal)
        graph_engine = TaskGraphEngine(run_id, nodes)
        
        async with self._lock:
            self._active_runs[run_id] = graph_engine
            self._cancellation_events[run_id] = asyncio.Event()

        # Publish plan ingestion telemetry
        await self.event_bus.publish(
            SystemEvent(
                source="engine.orchestrator",
                topic="run.initiated",
                severity=EventSeverity.INFO,
                payload={"run_id": str(run_id), "node_count": len(nodes), "goal": goal}
            )
        )

        # 2. Boot background worker thread loop handling parallel node execution
        self._running_tasks[run_id] = asyncio.create_task(
            self._execution_loop(run_id, graph_engine)
        )
        
        return run_id

    async def cancel_run(self, run_id: UUID) -> bool:
        """
        Signals active campaign workflows to abort executing threads.
        """
        async with self._lock:
            if run_id not in self._cancellation_events:
                logger.warning(f"Cancel request aborted: Run '{run_id}' is not currently active.")
                return False
            
            # Set target cancellation flag
            self._cancellation_events[run_id].set()
            
            # Cancel the parent execution loop task
            loop_task = self._running_tasks.get(run_id)
            if loop_task and not loop_task.done():
                loop_task.cancel()
                
            logger.warning(f"Dispatched absolute cancellation signal to campaign '{run_id}'")
            return True

    async def get_run_status(self, run_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Gathers running progress metadata, completion counts, and health logs.
        """
        async with self._lock:
            graph = self._active_runs.get(run_id)
            if not graph:
                return None
            
            nodes = await graph.get_all_nodes()
            completed = await graph.is_fully_completed()
            ratio = await graph.get_graph_success_ratio()
            
            return {
                "run_id": str(run_id),
                "is_completed": completed,
                "success_ratio": ratio,
                "nodes": [
                    {
                        "node_id": str(n.node_id),
                        "title": n.task.title,
                        "status": n.status.value,
                        "agent": n.task.assigned_agent,
                        "started_at": n.started_at.isoformat() if n.started_at else None,
                        "ended_at": n.ended_at.isoformat() if n.ended_at else None,
                    } for n in nodes
                ]
            }

    async def _execution_loop(self, run_id: UUID, graph: TaskGraphEngine) -> None:
        """
        Core high-speed scheduling loop. Locates parallel eligible nodes, dispatches
        autonomous agents, logs state progress, and handles terminal consolidation.
        """
        cancel_event = self._cancellation_events[run_id]
        active_futures: Dict[UUID, asyncio.Task] = {}

        try:
            while not await graph.is_fully_completed():
                # Check for cancellation interruptions
                if cancel_event.is_set():
                    logger.warning(f"Campaign execution loop '{run_id}' halting due to cancellation trigger.")
                    break

                # 1. Fetch eligible runnable targets
                runnable_nodes = await graph.get_runnable_nodes()
                
                # 2. Dispatch fresh parallel threads
                for node in runnable_nodes:
                    node_id = node.node_id
                    if node_id not in active_futures:
                        # Update status to RUNNING
                        await graph.update_node_status(node_id, NodeStatus.RUNNING)
                        
                        # Ingest subtask worker thread
                        future = asyncio.create_task(
                            self._execute_node_worker(run_id, graph, node)
                        )
                        active_futures[node_id] = future
                        logger.info(f"Scheduled worker thread task for Node: {node.task.title} ({node_id})")

                if not active_futures:
                    # No nodes are active or runnable. The system is either completed or waiting
                    # for running tasks to resolve. Sleep briefly before checking again.
                    await asyncio.sleep(0.1)
                    continue

                # 3. Wait on any of the active executing tasks to complete
                done, pending = await asyncio.wait(
                    active_futures.values(),
                    return_when=asyncio.FIRST_COMPLETED,
                    timeout=1.0 # Tick frequency checking for cancellations
                )

                # 4. Filter out finished tasks and sync graph engine states
                for completed_task in done:
                    # Locate corresponding node ID
                    found_id = None
                    for n_id, fut in list(active_futures.items()):
                        if fut == completed_task:
                            found_id = n_id
                            break
                    
                    if found_id:
                        del active_futures[found_id]
                        logger.debug(f"Node execution future finalized: {found_id}")

            # Terminal execution checks
            success_ratio = await graph.get_graph_success_ratio()
            logger.info(f"Campaign run loop concluded. Overall project success score: {success_ratio:.2f}%")
            
            # Post-campaign cleanup and long-term memory synthesis runs
            await self._finalize_run_campaign(run_id, success_ratio)

        except asyncio.CancelledError:
            logger.warning(f"Campaign run loop '{run_id}' thread cancelled cleanly.")
            # Forcibly abort all pending active futures
            for fut in active_futures.values():
                fut.cancel()
            await self._finalize_run_campaign(run_id, success_ratio=0.0)
            
        except Exception as e:
            logger.critical(f"Orchestrator campaign system failure on campaign loop '{run_id}': {e}", exc_info=True)
            await self.event_bus.publish(
                SystemEvent(
                    source="engine.orchestrator",
                    topic="run.crashed",
                    severity=EventSeverity.CRITICAL,
                    payload={"run_id": str(run_id), "error": str(e)}
                )
            )

    async def _execute_node_worker(self, run_id: UUID, graph: TaskGraphEngine, node: TaskNode) -> None:
        """
        Isolated task runner handling node dispatcher delegation and updating the dependency graph.
        """
        node_id = node.node_id
        try:
            # Dispatch task execution payload to agent dispatcher
            res: AgentResult = await self.dispatcher.dispatch(node.task)
            
            if res.success:
                await graph.update_node_status(node_id, NodeStatus.COMPLETED)
                logger.info(f"Node '{node.task.title}' completed successfully.")
            else:
                await graph.update_node_status(node_id, NodeStatus.FAILED)
                logger.error(f"Node '{node.task.title}' failed: {res.error}")

        except Exception as e:
            logger.error(f"Critical exception occurred inside Node Worker execution thread: {e}", exc_info=True)
            await graph.update_node_status(node_id, NodeStatus.FAILED)

    async def _finalize_run_campaign(self, run_id: UUID, success_ratio: float) -> None:
        """
        Compresses logs, triggers memory consolidations, and logs finalize states.
        """
        # Publish final metrics
        await self.event_bus.publish(
            SystemEvent(
                source="engine.orchestrator",
                topic="run.finalized",
                severity=EventSeverity.INFO if success_ratio > 70 else EventSeverity.WARNING,
                payload={"run_id": str(run_id), "success_ratio": success_ratio}
            )
        )
        
        # Consolidate agent session memories
        await self.memory.consolidate_working_to_semantic()
        
        async with self._lock:
            # Archive tracking entries
            if run_id in self._cancellation_events:
                del self._cancellation_events[run_id]
            if run_id in self._running_tasks:
                del self._running_tasks[run_id]

    def _generate_logical_plan_nodes(self, run_id: UUID, goal: str) -> List[TaskNode]:
        """
        Helper detailing static template plans mapping target goal actions.
        Produces sequential design dependencies required for high-quality software projects.
        """
        # Node 1: Architecture Planning Phase
        t1_id = uuid4()
        t1 = AgentTask(
            task_id=t1_id,
            title="Module Layout Design & Planning",
            description=f"Draft module boundaries, state signatures, and structural paths to address goal: {goal}",
            assigned_agent="planner",
            inputs={"objective": goal}
        )
        node_design = TaskNode(node_id=t1_id, dag_id=run_id, task=t1, dependencies=[])

        # Node 2: Core Engineering Code Generation Phase
        t2_id = uuid4()
        t2 = AgentTask(
            task_id=t2_id,
            title="Core Code Implementation",
            description="Write clean code modules, setup structures, and configure standard entrypoints.",
            assigned_agent="coder_agent",
            inputs={"objective": goal}
        )
        # Node 2 depends on Node 1 (Planning Phase) completing successfully
        node_code = TaskNode(node_id=t2_id, dag_id=run_id, task=t2, dependencies=[t1_id])

        # Node 3: Automated Quality Auditing and Test Synthesis
        t3_id = uuid4()
        t3 = AgentTask(
            task_id=t3_id,
            title="Test Harness Framework Implementation",
            description="Verify correctness, draft test coverages, compile sanity checks, and review edge cases.",
            assigned_agent="tester",
            inputs={"target_files": ["/src/main.tsx"]}
        )
        # Node 3 also depends on Node 1 planning completes
        node_test = TaskNode(node_id=t3_id, dag_id=run_id, task=t3, dependencies=[t1_id])

        # Node 4: Sandbox Compilation Verification Phase
        t4_id = uuid4()
        t4 = AgentTask(
            task_id=t4_id,
            title="System Integration and Compilation Audit",
            description="Invoke core build scripts, parse warning messages, and secure structural project readiness.",
            assigned_agent="coder_agent",
            inputs={"compiler_flags": "--strict"}
        )
        # Node 4 requires both functional code writing (Node 2) and target testing (Node 3) to successfully complete
        node_compile = TaskNode(node_id=t4_id, dag_id=run_id, task=t4, dependencies=[t2_id, t3_id])

        return [node_design, node_code, node_test, node_compile]
