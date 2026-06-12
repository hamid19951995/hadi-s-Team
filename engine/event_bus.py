import asyncio
import logging
import re
from typing import Awaitable, Callable, Dict, List, Set, Pattern
from uuid import UUID
from datetime import datetime
from schemas import SystemEvent, EventSeverity

logger = logging.getLogger("studio.engine.event_bus")

# Type alias for event listeners
EventListener = Callable[[SystemEvent], Awaitable[None]]

class EventBus:
    """
    Asynchronous event bus facilitating clean decoupling of core components.
    Supports wildcard subscription mapping (e.g., 'task.*', 'agent.error.*', '*').
    """
    def __init__(self):
        self._listeners: Dict[str, Set[EventListener]] = {}
        self._wildcard_listeners: List[tuple[Pattern, EventListener]] = []
        self._lock = asyncio.Lock()
        self._execution_history: List[SystemEvent] = []
        self._max_history_size = 1000

    async def subscribe(self, topic_pattern: str, listener: EventListener) -> None:
        """
        Registers an async callback to trigger on matches to 'topic_pattern'.
        Supported: Exact strings (e.g., 'task.created') or common patterns (e.g., 'task.*').
        """
        async with self._lock:
            if "*" in topic_pattern:
                # Convert glob-like task.* into matching regular expression pattern
                regex_str = "^" + topic_pattern.replace(".", r"\.").replace("*", r".*") + "$"
                pattern = re.compile(regex_str)
                self._wildcard_listeners.append((pattern, listener))
                logger.debug(f"Registered wildcard subscriber for pattern: {topic_pattern}")
            else:
                if topic_pattern not in self._listeners:
                    self._listeners[topic_pattern] = set()
                self._listeners[topic_pattern].add(listener)
                logger.debug(f"Registered exact subscriber for topic: {topic_pattern}")

    async def unsubscribe(self, topic_pattern: str, listener: EventListener) -> None:
        """
        Removes a subscribed listener from the registry maps.
        """
        async with self._lock:
            if "*" in topic_pattern:
                regex_str = "^" + topic_pattern.replace(".", r"\.").replace("*", r".*") + "$"
                self._wildcard_listeners = [
                    (pat, lst) for pat, lst in self._wildcard_listeners
                    if not (pat.pattern == regex_str and lst == listener)
                ]
            else:
                if topic_pattern in self._listeners:
                    self._listeners[topic_pattern].discard(listener)
                    if not self._listeners[topic_pattern]:
                        del self._listeners[topic_pattern]

    async def publish(self, event: SystemEvent) -> None:
        """
        Dispatched SystemEvents are broadcast asynchronously to all matching listeners.
        Execution is parallelized across listeners without blocking the publisher thread.
        """
        async with self._lock:
            # Store event in trace metrics history
            self._execution_history.append(event)
            if len(self._execution_history) > self._max_history_size:
                self._execution_history.pop(0)

        # Build candidate callback collection
        targets: Set[EventListener] = set()

        # Match exact subscribers
        if event.topic in self._listeners:
            targets.update(self._listeners[event.topic])

        # Match wildcard subscribers
        for pattern, listener in self._wildcard_listeners:
            if pattern.match(event.topic):
                targets.add(listener)

        if not targets:
            return

        # Fire callbacks concurrently inside independent asyncio tasks under safe error bounds
        tasks = [self._safely_dispatch(listener, event) for listener in targets]
        await asyncio.gather(*tasks)

    async def _safely_dispatch(self, listener: EventListener, event: SystemEvent) -> None:
        """
        Wrapper protecting the event bus loop from rogue listener exceptions.
        """
        try:
            await listener(event)
        except Exception as e:
            logger.error(f"Event handler execution failure on topic '{event.topic}': {e}", exc_info=True)
            # Create special audit failback loop warning
            backup_err_event = SystemEvent(
                source="engine.event_bus",
                topic="system.internal_error",
                severity=EventSeverity.ERROR,
                payload={"error": str(e), "failed_topic": event.topic, "failed_event_id": str(event.event_id)}
            )
            # We run this detached to prevent cascading execution cycles
            asyncio.create_task(self.publish_detached(backup_err_event))

    async def publish_detached(self, event: SystemEvent) -> None:
        """
        Safely dispatches an event on the loop background without returning completion waits.
        """
        try:
            await self.publish(event)
        except Exception as e:
            logger.critical(f"Detached event dispatch crashed core loop: {e}")

    def get_history(self, filter_topic: str = None, min_severity: EventSeverity = None) -> List[SystemEvent]:
        """
        Retrieves matching recorded system events from the ring buffer.
        """
        results = self._execution_history
        if filter_topic:
            results = [e for e in results if e.topic == filter_topic]
        if min_severity:
            # Simple grading mapping
            severity_weights = {
                EventSeverity.DEBUG: 0,
                EventSeverity.INFO: 1,
                EventSeverity.WARNING: 2,
                EventSeverity.ERROR: 3,
                EventSeverity.CRITICAL: 4
            }
            target_weight = severity_weights.get(min_severity, 0)
            results = [e for e in results if severity_weights.get(e.severity, 0) >= target_weight]
        return results
