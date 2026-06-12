import asyncio
import logging
from typing import Dict, List, Set, Optional
from uuid import UUID
from datetime import datetime
from schemas import TaskNode, NodeStatus, TaskStatus, SystemEvent, EventSeverity, AgentResult

logger = logging.getLogger("studio.engine.task_graph")

class TaskGraphEngine:
    """
    State tracking engine mapping node execution transitions across the dependency DAG.
    Validates structural integrity and yields nodes ready for immediate concurrent dispatch.
    """
    def __init__(self, dag_id: UUID, nodes: List[TaskNode]):
        self.dag_id = dag_id
        self._nodes_map: Dict[UUID, TaskNode] = {node.node_id: node for node in nodes}
        self._lock = asyncio.Lock()
        
        # Validate that the constructed graph is indeed acyclic
        self._validate_dag()

    def _validate_dag(self) -> None:
        """
        Verify there are no structural cycles within the graph node configuration.
        Utilizes Kahn's topological sort algorithm to detect loop states.
        """
        # Build adjacency maps
        in_degree: Dict[UUID, int] = {node_id: 0 for node_id in self._nodes_map}
        adj_list: Dict[UUID, List[UUID]] = {node_id: [] for node_id in self._nodes_map}

        for node_id, node in self._nodes_map.items():
            for dep_id in node.dependencies:
                if dep_id not in self._nodes_map:
                    raise ValueError(f"DAG Integrity Violation: Node {node_id} references non-existent parent dependency {dep_id}.")
                adj_list[dep_id].append(node_id)
                in_degree[node_id] += 1

        # Locate lead entrypoints
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        visited_count = 0

        while queue:
            curr = queue.pop(0)
            visited_count += 1
            for neighbor in adj_list[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if visited_count != len(self._nodes_map):
            raise ValueError("DAG Structural Exception: Circular dependency pathway detected within the execution graph.")

    async def get_node(self, node_id: UUID) -> Optional[TaskNode]:
        """
        Safely retrieves standard node metadata configurations from internal state.
        """
        async with self._lock:
            return self._nodes_map.get(node_id)

    async def get_all_nodes(self) -> List[TaskNode]:
        """
        Generates lists copy representation representing active node structures.
        """
        async with self._lock:
            return list(self._nodes_map.values())

    async def get_runnable_nodes(self) -> List[TaskNode]:
        """
        Locates idle nodes whose prerequisite execution constraints have been successfully completed.
        """
        async with self._lock:
            runnable: List[TaskNode] = []
            for node in self._nodes_map.values():
                if node.status != NodeStatus.IDLE:
                    continue

                # Check if all targeted parents have resolved successfully
                dependencies_resolved = True
                for dep_id in node.dependencies:
                    parent_node = self._nodes_map.get(dep_id)
                    if not parent_node or parent_node.status != NodeStatus.COMPLETED:
                        dependencies_resolved = False
                        break

                if dependencies_resolved:
                    runnable.append(node)
            return runnable

    async def update_node_status(self, node_id: UUID, status: NodeStatus) -> Optional[TaskNode]:
        """
        Performs precise state state modifications along with tracking timers.
        """
        async with self._lock:
            node = self._nodes_map.get(node_id)
            if not node:
                return None

            prev_status = node.status
            node.status = status
            
            # Update associated timestamps
            if status == NodeStatus.RUNNING and prev_status != NodeStatus.RUNNING:
                node.started_at = datetime.utcnow()
                node.task.status = TaskStatus.RUNNING
                node.task.updated_at = datetime.utcnow()
            elif status in [NodeStatus.COMPLETED, NodeStatus.FAILED, NodeStatus.SKIPPED]:
                node.ended_at = datetime.utcnow()
                node.task.updated_at = datetime.utcnow()
                if status == NodeStatus.COMPLETED:
                    node.task.status = TaskStatus.COMPLETED
                elif status == NodeStatus.FAILED:
                    node.task.status = TaskStatus.FAILED
                elif status == NodeStatus.SKIPPED:
                    node.task.status = TaskStatus.CANCELLED

            logger.debug(f"Node '{node_id}' state updated: {prev_status} -> {status}")
            
            # If a node model has failed, perform a ripple cascade across downstream nodes failing them
            if status == NodeStatus.FAILED:
                await self._cascade_unresolvable_skips(node_id)

            return node

    async def _cascade_unresolvable_skips(self, failed_node_id: UUID) -> None:
        """
        Locates subsequent nodes depending directly or transitively on the failed branch,
        marking them as SKIPPED to release scheduling queues.
        """
        # Find immediate child processes
        to_check = [node_id for node_id, node in self._nodes_map.items() 
                    if failed_node_id in node.dependencies and node.status == NodeStatus.IDLE]
        
        while to_check:
            curr_id = to_check.pop(0)
            node = self._nodes_map.get(curr_id)
            if node and node.status == NodeStatus.IDLE:
                node.status = NodeStatus.SKIPPED
                node.ended_at = datetime.utcnow()
                node.task.status = TaskStatus.CANCELLED
                node.task.updated_at = datetime.utcnow()
                logger.warning(f"DAG Cascade: Node '{curr_id}' marked SKIPPED due to parent failure node '{failed_node_id}'")
                
                # Propagate downstream
                for child_id, child_node in self._nodes_map.items():
                    if curr_id in child_node.dependencies and child_node.status == NodeStatus.IDLE:
                        to_check.append(child_id)

    async def is_fully_completed(self) -> bool:
        """
        Returns true if every single graph element reached a terminal execution status.
        """
        async with self._lock:
            terminal_states = {NodeStatus.COMPLETED, NodeStatus.FAILED, NodeStatus.SKIPPED}
            return all(node.status in terminal_states for node in self._nodes_map.values())

    async def get_graph_success_ratio(self) -> float:
        """
        Computes accurate statistics scoring completed tasks against overall node configurations.
        """
        async with self._lock:
            total = len(self._nodes_map)
            if total == 0:
                return 100.0
            completed = sum(1 for node in self._nodes_map.values() if node.status == NodeStatus.COMPLETED)
            return (completed / total) * 100.0
