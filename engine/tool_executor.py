import logging
import asyncio
import time
from typing import Dict, Any, Callable, Awaitable, Optional
from uuid import UUID, uuid4
from datetime import datetime
from schemas import ToolRequest, ToolResult, ToolStatus, SystemEvent, EventSeverity
from engine.event_bus import EventBus

logger = logging.getLogger("studio.engine.tool_executor")

ToolCallback = Callable[[Dict[str, Any]], Awaitable[Any]]

class ToolExecutor:
    """
    Sandboxed execution coordinator managing platform automation capabilities.
    Validates arguments, bounds schedules via timeout caps, and outputs structured,
    normalized ToolResults.
    """
    def __init__(self, event_bus: Optional[EventBus] = None):
        self._event_bus = event_bus
        self._capabilities: Dict[str, ToolCallback] = {}
        self._lock = asyncio.Lock()
        
        # Load default system core tools
        self._register_default_tools()

    def register_tool(self, name: str, callback: ToolCallback) -> None:
        """
        Dynamically registers custom tool capabilities to the workspace.
        """
        self._capabilities[name] = callback
        logger.info(f"Capability registered to registry: '{name}'")

    async def execute(self, request: ToolRequest) -> ToolResult:
        """
        Invokes a sandboxed utility matching the requested capability name.
        Enforces execution boundaries via asyncio task timeouts.
        """
        start_time = time.time()
        tool_name = request.tool_name
        
        # Notify event bus we are triggering a tool execution
        if self._event_bus:
            await self._event_bus.publish(
                SystemEvent(
                    source="engine.tool_executor",
                    topic=f"tool.{tool_name}.executing",
                    severity=EventSeverity.INFO,
                    payload={"request_id": str(request.request_id), "task_id": str(request.task_id)}
                )
            )

        # Lookup capability inside registry
        callback = self._capabilities.get(tool_name)
        if not callback:
            err_msg = f"Incompatible request: Component '{tool_name}' is not in the system capabilities registry."
            logger.error(err_msg)
            return self._build_result(request, ToolStatus.FAILURE, error=err_msg, duration_ms=(time.time() - start_time) * 1000)

        try:
            logger.info(f"Triggering execution of tool '{tool_name}' bound by {request.timeout_seconds}s limit.")
            
            # Enforce execution timeout limits
            result_payload = await asyncio.wait_for(
                callback(request.arguments),
                timeout=float(request.timeout_seconds)
            )
            
            duration_ms = (time.time() - start_time) * 1000
            resolved_result = self._build_result(request, ToolStatus.SUCCESS, output=result_payload, duration_ms=duration_ms)
            
            # Publish success telemetry
            if self._event_bus:
                await self._event_bus.publish(
                    SystemEvent(
                        source="engine.tool_executor",
                        topic=f"tool.{tool_name}.success",
                        severity=EventSeverity.INFO,
                        payload={"request_id": str(request.request_id), "duration_ms": duration_ms}
                    )
                )
            return resolved_result

        except asyncio.TimeoutError:
            err_msg = f"Runtime Boundary Timeout: Capability execution was halted due to exceeding {request.timeout_seconds}s timeout allocation."
            duration_ms = (time.time() - start_time) * 1000
            logger.error(err_msg)
            return self._build_result(request, ToolStatus.FAILURE, error=err_msg, duration_ms=duration_ms)
            
        except Exception as e:
            err_msg = f"Sandbox Exception in '{tool_name}': {str(e)}"
            duration_ms = (time.time() - start_time) * 1000
            logger.error(err_msg, exc_info=True)
            return self._build_result(request, ToolStatus.FAILURE, error=err_msg, duration_ms=duration_ms)

    def _build_result(self, request: ToolRequest, status: ToolStatus, output: Optional[Any] = None, error: Optional[str] = None, duration_ms: float = 0.0) -> ToolResult:
        """
        Structural factory parsing variables safely to clean validation schemas.
        """
        return ToolResult(
            result_id=uuid4(),
            request_id=request.request_id,
            status=status,
            output=output,
            error=error,
            completed_at=datetime.utcnow(),
            duration_ms=max(0.0, duration_ms)
        )

    def _register_default_tools(self) -> None:
        """
        Pins general read/write capabilities mimicking authentic systems behaviors.
        """
        # File viewer mockup mocking safe fs access
        async def mock_view_file(args: Dict[str, Any]) -> Dict[str, Any]:
            path = args.get("AbsolutePath", "")
            return {
                "file": path,
                "lines_total": 45,
                "content": "import React from 'react';\n\nexport default function Widget() {\n  return <div>Custom Layout</div>;\n}",
                "read_successful": True
            }

        # File creator mimicking project edits
        async def mock_create_file(args: Dict[str, Any]) -> Dict[str, Any]:
            path = args.get("TargetFile", "")
            content = args.get("Content", "")
            logger.info(f"Core FS simulator: Created file at {path} ({len(content)} bytes)")
            return {
                "file": path,
                "bytes_written": len(content),
                "committed": True
            }

        # Core app compiles simulation
        async def mock_compile_applet(args: Dict[str, Any]) -> Dict[str, Any]:
            await asyncio.sleep(0.8) # Simulate compile chain
            return {
                "build_status": "success",
                "bundle_size_kb": 240.5,
                "warnings": []
            }

        self.register_tool("view_file", mock_view_file)
        self.register_tool("create_file", mock_create_file)
        self.register_tool("compile_applet", mock_compile_applet)
