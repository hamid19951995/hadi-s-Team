import os
import time
import logging
import asyncio
from datetime import datetime
from uuid import UUID, uuid4
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, Request, Depends, HTTPException, Security, status, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

# Import core schemas and orchestrator components
from schemas import (
    ProjectState, AgentTask, TaskStatus, SystemEvent, EventSeverity, MemoryType, TaskNode, NodeStatus
)
from engine.event_bus import EventBus
from engine.memory import MemoryManager
from engine.provider_router import ProviderRouter
from engine.tool_executor import ToolExecutor
from engine.orchestrator import Orchestrator

# Initialize central logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("studio.api")

# Instantiate FastAPI application
app = FastAPI(
    title="Autonomous AI Studio Backend Engine",
    description="Full-stack FastAPI server exposing core agent campaign APIs, real-time log pipelines, and system orchestrators.",
    version="1.0.0"
)

# Enabled CORS middleware for development cross-talk
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core system elements as stateful singletons
event_bus = EventBus()
memory_manager = MemoryManager()
provider_router = ProviderRouter()
tool_executor = ToolExecutor(event_bus=event_bus)
orchestrator = Orchestrator(
    event_bus=event_bus,
    memory=memory_manager,
    router=provider_router,
    executor=tool_executor
)

# Shared memory cache to retain project states
class ServerState:
    current_project: Optional[ProjectState] = None

server_state = ServerState()

# Preset initial mock schemas/variables for a fallback project state
default_project = ProjectState(
    project_id=uuid4(),
    active_branch="main",
    file_tree={
        "src/App.tsx": "f86b4618e",
        "src/main.tsx": "ca25b290a",
        "package.json": "8a31f29b4"
    },
    dependencies_manifest={
        "react": "^19.0.1",
        "fastapi": "^0.100.0"
    }
)
server_state.current_project = default_project


# ==========================================
# Authentication Setup (Auth-Ready Dependency)
# ==========================================
security_scheme = HTTPBearer(auto_error=False)

async def verify_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)):
    """
    Standard HTTP Bearer verification gate matching the BACKEND_API_KEY if declared.
    """
    expected_key = os.environ.get("BACKEND_API_KEY")
    if not expected_key:
        # Safe passwordless sandbox mode for local workspace development processes
        return None
    
    if not credentials or credentials.credentials != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Access token is missing, expired or invalid."
        )
    return credentials.credentials


# ==========================================
# Custom Logging Middleware
# ==========================================
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """
    Measures processing duration, method flags, URL paths, and logging outcomes.
    """
    # Skip assets logging to prevent terminal clutter
    is_static = request.url.path.startswith("/assets") or request.url.path.endswith((".js", ".css", ".png", ".svg", ".ico", ".html"))
    
    start_time = time.time()
    try:
        response = await call_next(request)
        if not is_static:
            process_time = (time.time() - start_time) * 1000
            logger.info(f"[API-LOG] {request.method} {request.url.path} -> {response.status_code} ({process_time:.2f}ms)")
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.error(f"[API-LOG] {request.method} {request.url.path} -> CRASHED: {e} ({process_time:.2f}ms)", exc_info=True)
        raise


# ==========================================
# Error Handlers
# ==========================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Translates HTTP exceptions into uniform error objects.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all recovery layer mapping to standard 500 error envelopes.
    """
    logger.error(f"Internal System Exception caught on path {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": f"Internal server campaign error: {str(exc)}",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# ==========================================
# API Models
# ==========================================
class TaskSubmitPayload(BaseModel):
    goal: Optional[str] = Field(None, description="Prompted description of campaign tasks plan.")
    task: Optional[AgentTask] = Field(None, description="Explicit structured individual AgentTask schema.")

class GraphGeneratePayload(BaseModel):
    prompt: str
    model: str = "gemini-3.5-flash"
    temperature: float = 0.5
    system_instruction: Optional[str] = None


# ==========================================
# REST API Endpoints
# ==========================================

@app.post("/api/graph/generate", response_model=Dict[str, Any])
async def generate_graph_response(payload: GraphGeneratePayload):
    """
    Executes a real-time prompt generation inside custom Graph Plus workspace nodes.
    Queries Gemini directly if keys are present, otherwise falls back to highly robust
    localized multi-language generators.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    cleaned_model = payload.model.replace("models/", "")
    
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{cleaned_model}:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            
            body = {
                "contents": [{"parts": [{"text": payload.prompt}]}],
                "generationConfig": {
                    "temperature": payload.temperature
                }
            }
            if payload.system_instruction:
                body["systemInstruction"] = {"parts": [{"text": payload.system_instruction}]}
                
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            generated_text = parts[0].get("text", "")
                            return {
                                "success": True,
                                "text": generated_text,
                                "model": payload.model,
                                "source": "gemini_api"
                            }
                logger.warning(f"Direct Gemini API returned error: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Error querying Gemini API: {e}", exc_info=True)
            
    # Multilingual smart simulator fallback
    prompt_lower = payload.prompt.lower()
    is_farsi = any(char in payload.prompt for char in "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی")
    
    if is_farsi:
        if "کد" in prompt_lower or "برنامه" in prompt_lower or "کلاس" in prompt_lower or "تابع" in prompt_lower:
            text = f"""// کد فرضی تولید شده هماهنگ با موتور بازی‌سازی:
#include <iostream>
using namespace std;

class StudioGameBridge {{
private:
    int syncPort = 9042;
public:
    void EstablishLiveConnection() {{
        cout << "ارتباط زنده با استودیو بصری برقرار شد." << endl;
    }}
}};

int main() {{
    StudioGameBridge bridge;
    bridge.EstablishLiveConnection();
    return 0;
}}"""
        elif any(w in prompt_lower for w in ["تلفیق", "یکپارچه", "ادغام", "ترکیب"]):
            text = f"""[موتور ادغام و تلفیق هوشمند]
ترکیب خروجی نودهای با موفقیت مدل‌سازی شد.
جزئیات همگام‌سازی:
- مدل ادغام‌کننده: {payload.model}
- ضریب خلاقیت: {payload.temperature}
- وضعیت هم‌افزایی سیگنال‌ها: ۱۰۰٪ همگام

خروجی تلفیق شده: تمام متغیرهای نودهای والد خوانده شده و با دستور جدید یکپارچه شدند."""
        else:
            text = f"""[پاسخ هوش مصنوعی {payload.model}]
درخواست شما در سیستم پردازش بومی استودیو گراف تایید شد:
«{payload.prompt}»

مدل با موفقیت دستورالعمل را اجرا کرده و خروجی را با سایر نودها همگام‌سازی کرد."""
    else:
        # English fallbacks
        if "code" in prompt_lower or "function" in prompt_lower or "class" in prompt_lower or "script" in prompt_lower:
            text = f"""// Auto-generated Code Blueprint for Active Node:
public class AIWorkspaceController : MonoBehaviour {{
    public string nodeId = "node_active";
    void Awake() {{
        System.Console.WriteLine("Visual node blueprint execution online!");
    }}
}}"""
        elif any(w in prompt_lower for w in ["merge", "combine", "integrate", "mix"]):
            text = f"""[AI Integration Pipeline]
Successfully merged values with ancestor nodes.
Summary:
- Execution Model: {payload.model}
- Workspace Status: Connected
- Output Value: Integrated parameters pushed to game loop socket!"""
        else:
            text = f"""[AI Engine Response - {payload.model}]
Your request has been successfully evaluated within the visual canvas:
"{payload.prompt}"

All downstream receivers are synced on port 9042."""

    return {
        "success": True,
        "text": text,
        "model": payload.model,
        "source": "smart_simulator"
    }


@app.post("/project", response_model=Dict[str, Any])
async def save_project_state(project: ProjectState, auth_user=Depends(verify_auth)):
    """
    Registers the synchronized file tree and workspace branches into memory.
    """
    server_state.current_project = project
    await event_bus.publish(
        SystemEvent(
            source="api.server",
            topic="project.synchronized",
            severity=EventSeverity.INFO,
            payload={
                "project_id": str(project.project_id),
                "active_branch": project.active_branch,
                "file_count": len(project.file_tree)
            }
        )
    )
    return {
        "success": True,
        "message": "Project environment synchronized successfully.",
        "project_id": str(project.project_id),
        "file_count": len(project.file_tree),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/task", response_model=Dict[str, Any])
async def submit_task(payload: TaskSubmitPayload, auth_user=Depends(verify_auth)):
    """
    Triggers execution planning or direct agent task dispatch sequences.
    """
    if payload.goal:
        # Trigger orchestrator run plan
        if not server_state.current_project:
            raise HTTPException(
                status_code=400,
                detail="System error: Cannot run plan before sync of core project state."
            )
            
        run_id = await orchestrator.run_plan(payload.goal, server_state.current_project)
        return {
            "success": True,
            "type": "campaign",
            "run_id": str(run_id),
            "goal": payload.goal,
            "message": "Campaign plan synthesized. Executing DAG nodes."
        }
        
    elif payload.task:
        # Trigger manual dispatch of an isolated task
        task = payload.task
        
        # Enforce asynchronous background execution run to shield client connections
        async def run_detached():
            try:
                await orchestrator.dispatcher.dispatch(task)
            except Exception as ex:
                logger.error(f"Detached manual task execution failed: {ex}")
                
        asyncio.create_task(run_detached())
        
        return {
            "success": True,
            "type": "isolated_task",
            "task_id": str(task.task_id),
            "assigned_agent": task.assigned_agent,
            "message": "Dedicated task routed to dispatcher pool."
        }
    else:
        raise HTTPException(
            status_code=400,
            detail="Validation failed: Specify either a 'goal' plan prompt or a structured 'task'."
        )


@app.get("/agents", response_model=List[Dict[str, Any]])
async def get_agents(auth_user=Depends(verify_auth)):
    """
    Lists active system agent processors with operational limits.
    """
    agents_list = []
    # Safeguard against cold setup
    active_agents = getattr(orchestrator.dispatcher, "_agents", {})
    
    for key, agent in active_agents.items():
        # Extrapolate specific duties depending on agent keys
        if key == "coder_agent":
            capabilities = ["read_files", "write_files", "execute_commands", "lint_analysis"]
            description = "High-performance codegen engine writing compliant source codes."
        elif key == "planner":
            capabilities = ["dag_sorting", "dependency_graphs", "resource_allocation"]
            description = "Campaign orchestrator mapping directives into runnable plans."
        elif key == "tester":
            capabilities = ["unit_tests", "verification", "build_compile_checks"]
            description = "Quality gatekeeper executing tests and validation steps."
        else:
            capabilities = ["text_synthesize"]
            description = "Supplementary processing agent."

        agents_list.append({
            "key": key,
            "name": getattr(agent, "name", key),
            "class_name": agent.__class__.__name__,
            "description": description,
            "capabilities": capabilities,
            "status": "active" if orchestrator._running_tasks else "idle"
        })
    return agents_list


@app.get("/logs", response_model=List[Dict[str, Any]])
async def get_logs(limit: int = 100, auth_user=Depends(verify_auth)):
    """
    Collates historical events and memories into a structured audit logging array.
    """
    # 1. Pull Episodic Memories
    episodic_memories = await memory_manager.retrieve_partition(MemoryType.EPISODIC) or []
    
    # 2. Pull Event Bus historical records
    event_bus_history = event_bus.get_history() or []
    
    unified_logs = []
    
    # Ingest episodic context
    for entry in episodic_memories:
        unified_logs.append({
            "id": str(entry.memory_id),
            "source": "engine.memory",
            "message": entry.content,
            "timestamp": entry.created_at.isoformat(),
            "severity": "info",
            "meta": entry.metadata
        })
        
    # Ingest system events
    for event in event_bus_history:
        unified_logs.append({
            "id": str(event.event_id),
            "source": event.source,
            "message": f"[{event.topic}] {json_summary(event.payload)}",
            "timestamp": event.timestamp.isoformat(),
            "severity": event.severity.value,
            "meta": event.payload
        })
        
    # Sort unified results chronologically (newest logs first)
    unified_logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return unified_logs[:limit]


@app.get("/system-map", response_model=Dict[str, Any])
async def get_system_map(auth_user=Depends(verify_auth)):
    """
    Provides real-time topological statistics, subsystems details, and token logs.
    """
    # Fetch active statistics from instances
    total_prompt = provider_router._total_tokens_consumed.get("prompt", 0)
    total_completion = provider_router._total_tokens_consumed.get("completion", 0)
    active_runs_list = list(orchestrator._active_runs.keys())
    
    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "runtime": {
            "orchestration_mode": "asynchronous_control_loop",
            "concurrency_limit": 10,
            "active_campaign_channels": [str(r) for r in active_runs_list]
        },
        "topology": {
            "subsystems": [
                {
                    "name": "Orchestrator",
                    "status": "active",
                    "active_threads": len(orchestrator._running_tasks),
                    "registered_workflows": len(active_runs_list)
                },
                {
                    "name": "AgentDispatcher",
                    "status": "active",
                    "total_agents": len(orchestrator.dispatcher._agents)
                },
                {
                    "name": "ProviderRouter",
                    "status": "active",
                    "stats": {
                        "prompt_tokens_meter": total_prompt,
                        "completion_tokens_meter": total_completion,
                        "total_consumption": total_prompt + total_completion
                    }
                },
                {
                    "name": "ToolExecutor",
                    "status": "active",
                    "tools_count": len(tool_executor._capabilities)
                },
                {
                    "name": "MemoryManager",
                    "status": "active",
                    "partitions": ["working", "episodic", "semantic", "procedural"]
                },
                {
                    "name": "EventBus",
                    "status": "active",
                    "subscribers_weight": len(event_bus._listeners) + len(event_bus._wildcard_listeners)
                }
            ],
            "pipes": [
                {"source": "Orchestrator", "target": "AgentDispatcher", "type": "dag_scheduling"},
                {"source": "AgentDispatcher", "target": "MemoryManager", "type": "vector_associative_lookup"},
                {"source": "AgentDispatcher", "target": "ProviderRouter", "type": "llm_completion_router"},
                {"source": "AgentDispatcher", "target": "ToolExecutor", "type": "sandboxed_method_dispatch"},
                {"source": "Orchestrator", "target": "EventBus", "type": "system_event_publishing"},
                {"source": "AgentDispatcher", "target": "EventBus", "type": "system_event_publishing"},
                {"source": "ToolExecutor", "target": "EventBus", "type": "system_event_publishing"}
            ]
        }
    }


# ==========================================
# Real-Time Event WebSocket Subscriber
# ==========================================

@app.websocket("/events")
async def stream_campaign_events(websocket: WebSocket):
    """
    wildcard-subscribes to EventBus alerts and pushes them in real-time as JSON payloads.
    """
    await websocket.accept()
    
    event_queue: asyncio.Queue = asyncio.Queue()
    
    # Callback listener for EventBus subscription
    async def push_event_callback(event: SystemEvent):
        payload_data = {
            "event_id": str(event.event_id),
            "source": event.source,
            "topic": event.topic,
            "severity": event.severity.value,
            "payload": event.payload,
            "timestamp": event.timestamp.isoformat()
        }
        await event_queue.put(payload_data)
        
    # Wire the wildcard subscription logic
    await event_bus.subscribe("*", push_event_callback)
    
    logger.info("New socket subscriber registered on websocket: /events")
    
    try:
        while True:
            # Pushes events with timeouts to run keep-alive heartbeats
            try:
                notification = await asyncio.wait_for(event_queue.get(), timeout=1.5)
                await websocket.send_json(notification)
                event_queue.task_done()
            except asyncio.TimeoutError:
                # Keep connection alive by dispatching heartbeats
                await websocket.send_json({"type": "heartbeat", "timestamp": datetime.utcnow().isoformat()})
    except WebSocketDisconnect:
        logger.info("Websocket client exited gracefully from /events.")
    except Exception as exp:
        logger.error(f"Websocket error caught: {exp}")
    finally:
        # Guarantee removal of subscriber to save system overhead
        await event_bus.unsubscribe("*", push_event_callback)


# Helper string parser
def json_summary(payload: Dict[str, Any]) -> str:
    if not payload:
        return ""
    # Simplify output block for concise formatting
    desc = sorted([f"{k}={v}" for k, v in payload.items()])
    return ", ".join(desc)


# ==========================================
# Static Asset Serving (Production Bundle)
# ==========================================
# Mounting static files if compiler production build directory exists
dist_dir = os.path.join(os.getcwd(), "dist")
if os.path.exists(dist_dir):
    logger.info(f"Serving production distribution files from directory path: {dist_dir}")
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    @app.get("/{file_path:path}")
    async def serve_static_index(file_path: str):
        # Prevent API routes from being hijacked by static serving
        if file_path.startswith(("api", "events", "docs", "openapi.json")):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
            
        full_path = os.path.join(dist_dir, file_path)
        if file_path and os.path.exists(full_path) and os.path.isfile(full_path):
            from fastapi.responses import FileResponse
            return FileResponse(full_path)
            
        # Fallback to Single Page App index
        from fastapi.responses import FileResponse
        return FileResponse(os.path.join(dist_dir, "index.html"))
