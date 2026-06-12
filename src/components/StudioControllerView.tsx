import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Server, Cpu, Play, Ban, ShieldAlert, CheckCircle2, AlertTriangle,
  Terminal, RefreshCw, Layers, FileCode, Check, Copy, Settings,
  Database, HardDrive, Package, Plus, Trash2, ArrowUpRight, MonitorPlay, Sparkles,
  CheckSquare, XSquare, Clock, DollarSign, Coins, TrendingUp, Workflow, Network,
  Lock, Unlock, Send, AlertCircle, Eye, EyeOff, Activity, ChevronRight
} from "lucide-react";

// Enum states matching runtime contracts
enum NodeStatus {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

interface GraphNode {
  id: string;
  title: string;
  agent: string;
  description: string;
  status: NodeStatus;
  dependsOn: string[];
}

interface TimelineItem {
  id: string;
  agentName: string;
  timestamp: string;
  action: string;
  status: "success" | "warning" | "error" | "info";
  durationMs: number;
}

interface ApprovalItem {
  id: string;
  taskTitle: string;
  agentName: string;
  requestedAt: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: string;
  durationMs: number;
  status: "success" | "error";
  tags: Record<string, string>;
}

export default function StudioControllerView() {
  // --- WebSockets & State Configuration ---
  const [socketStatus, setSocketStatus] = useState<"connected" | "connecting" | "offline">("connecting");
  const [useSimulation, setUseSimulation] = useState(true);
  const [isLogsPaused, setIsLogsPaused] = useState(false);

  // --- Core Model State Machines ---
  const [campaignGoal, setCampaignGoal] = useState("Configure rate-limiting middleware and Redis caching pipeline");
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [activeTabSubView, setActiveTabSubView] = useState<"live" | "structured" | "tracing" | "audit">("live");

  // Cost stats
  const [totalSpend, setTotalSpend] = useState(1.428); // USD
  const [accumulatedPromptTokens, setAccumulatedPromptTokens] = useState(312000);
  const [accumulatedCompTokens, setAccumulatedCompTokens] = useState(116400);

  // System map ping trigger
  const [pingPulseSource, setPingPulseSource] = useState<string | null>(null);

  // --- 1. Task Graph Core ---
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([
    { id: "node_prep", title: "Ingress Spec Synthesis", agent: "PlannerAgent", description: "Parse parameters, inspect files", status: NodeStatus.IDLE, dependsOn: [] },
    { id: "node_code", title: "Middlewares Core Coding", agent: "CoderAgent", description: "Setup routes and Redis interfaces", status: NodeStatus.IDLE, dependsOn: ["node_prep"] },
    { id: "node_test", title: "Invariant Integration Test", agent: "TesterAgent", description: "Verify response limits and timeouts", status: NodeStatus.IDLE, dependsOn: ["node_prep"] },
    { id: "node_audit", title: "Bundle Compression Audit", agent: "SupervisorAgent", description: "Audit dependencies and compile distribution CJS", status: NodeStatus.IDLE, dependsOn: ["node_code", "node_test"] }
  ]);

  // --- 2. Live Logs Stream ---
  const [liveLogs, setLiveLogs] = useState<Array<{ id: string; timestamp: string; source: string; topic: string; level: string; message: string }>>([
    { id: "log_0", timestamp: new Date().toLocaleTimeString(), source: "api.server", topic: "websocket.handshake", level: "info", message: "Websocket routing endpoint standby." },
    { id: "log_1", timestamp: new Date().toLocaleTimeString(), source: "engine.memory", topic: "working_buffer.initialized", level: "debug", message: "Working memory buffer assigned. Partition weights healthy." },
    { id: "log_2", timestamp: new Date().toLocaleTimeString(), source: "engine.provider_router", topic: "provider.health_probe", level: "info", message: "Primary model: gemini-3.5-flash reported 65ms response time." }
  ]);

  // --- 3. Agent Timeline Historical Log ---
  const [agentTimeline, setAgentTimeline] = useState<TimelineItem[]>([
    { id: "t_1", agentName: "PlannerAgent", timestamp: "15:21:05", action: "Parsed campaign parameters and resolved file dependencies", status: "success", durationMs: 450 },
    { id: "t_2", agentName: "CoderAgent", timestamp: "15:22:12", action: "Interfaced Redis client wrapper in /src/cache.ts", status: "success", durationMs: 1480 },
    { id: "t_3", agentName: "TesterAgent", timestamp: "15:24:30", action: "Encountered timeout on Redis mock cluster port 6379", status: "warning", durationMs: 820 }
  ]);

  // --- 4. Human-In-The-Loop Approval Queue ---
  const [approvalQueue, setApprovalQueue] = useState<ApprovalItem[]>([
    { id: "ap_1", taskTitle: "Write database schema with unique indexes on developer UUIDs", agentName: "CoderAgent", requestedAt: "15:26:10", reason: "Writing schema requires human consensus to prevent breaking DB contracts", status: "pending" },
    { id: "ap_2", taskTitle: "Purge local Vite compilation directory cache", agentName: "SupervisorAgent", requestedAt: "15:28:40", reason: "De-allocating non-empty folders requires validation constraints match", status: "pending" }
  ]);

  // --- 5. Tracing Spans System ---
  const [traceSpans, setTraceSpans] = useState<TraceSpan[]>([
    { spanId: "span_root", operationName: "orchestration_run", startTime: "15:20:00", durationMs: 3450, status: "success", tags: { "env": "production", "goal": "middleware_config" } },
    { spanId: "span_plan", parentSpanId: "span_root", operationName: "planner_synthesis", startTime: "15:20:02", durationMs: 850, status: "success", tags: { "agent": "PlannerAgent" } },
    { spanId: "span_codegen", parentSpanId: "span_root", operationName: "execute_codegen", startTime: "15:21:00", durationMs: 1800, status: "success", tags: { "agent": "CoderAgent", "file_written": "cache.ts" } },
    { spanId: "span_redis", parentSpanId: "span_codegen", operationName: "redis_liveness_probe", startTime: "15:21:10", durationMs: 320, status: "success", tags: { "port": "6379", "service": "redis" } }
  ]);

  // --- 6. Active Providers Status Grid ---
  const [providersStatus, setProvidersStatus] = useState([
    { key: "gemini-pro", name: "Gemini 3.1 Pro Preview", model: "models/gemini-3.1-pro-preview", status: "Online", latency: "115ms", costPer1K: 0.0012, totalUsed: 215 },
    { key: "gemini-flash", name: "Gemini 3.5 Flash", model: "models/gemini-3.5-flash", status: "Online", latency: "45ms", costPer1K: 0.0000, totalUsed: 98 },
    { key: "claude-sonnet", name: "Claude 3.5 Sonnet", model: "claude-3-5-sonnet", status: "Active Standby", latency: "420ms", costPer1K: 0.003, totalUsed: 0 },
    { key: "gpt-4o", name: "OpenAI GPT-4o", model: "gpt-4o", status: "Standby", latency: "380ms", costPer1K: 0.0025, totalUsed: 0 }
  ]);

  // --- 7. Security / Ingress Audit Logs ---
  const [auditLogs, setAuditLogs] = useState([
    { id: "au_12", timestamp: "15:21:00", user: "onos1396@gmail.com", action: "Synchronized workspace file structures", resource: "POST /project", status: "ALLOWED" },
    { id: "au_13", timestamp: "15:21:05", user: "onos1396@gmail.com", action: "Triggered task orchestrator pipeline run", resource: "POST /task", status: "ALLOWED" },
    { id: "au_14", timestamp: "15:21:40", user: "SYSTEM_DAEMON", action: "Fetched cognitive providers health metrics", resource: "GET /system-map", status: "ALLOWED" },
    { id: "au_15", timestamp: "15:24:12", user: "ANONYMOUS", action: "Inbound payload bypass attempt rejected", resource: "POST /project", status: "DENIED (UNAUTHORIZED)" }
  ]);

  // --- Terminal Command Console State ---
  const [cliInput, setCliInput] = useState("");
  const [cliLogs, setCliLogs] = useState<string[]>([
    "Autonomous Studio OS Terminal v1.0.0",
    "Type 'help' to see active diagnostic commands list.",
    "Ready $ "
  ]);

  const [activeMetrics, setActiveMetrics] = useState({
    throughput: 12.4, // Requests / min
    uptimePercent: 99.98,
    averageLatency: "154 ms",
    cachedRatio: "42%"
  });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef = useRef<HTMLDivElement>(null);

  // Scroll logs to end
  useEffect(() => {
    if (!isLogsPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveLogs, isLogsPaused]);

  useEffect(() => {
    cliEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cliLogs]);

  // --- WebSocket Connection Implementation ---
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      setSocketStatus("connecting");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/events`;

      console.log(`Connecting to WebSocket: ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setSocketStatus("connected");
        setUseSimulation(false);
        setLiveLogs(prev => [
          ...prev,
          { id: `ws_open_${Date.now()}`, timestamp: new Date().toLocaleTimeString(), source: "api.websocket", topic: "connection.established", level: "info", message: `Connected to real-time events pipeline at ${wsUrl}` }
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Inject event directly into live log views
          if (data && !isLogsPaused) {
            setLiveLogs(prev => [
              ...prev,
              {
                id: data.event_id || `ws_msg_${Date.now()}`,
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
                source: data.source || "remote.bus",
                topic: data.topic || "broadcast",
                level: data.severity || "info",
                message: typeof data.payload === "object" ? JSON.stringify(data.payload) : data.payload || "Received websocket message."
              }
            ]);
            
            // If websocket returns structured logs, update latency or cost spend
            if (data.topic === "provider.tokens_consumed") {
              const prompt = data.payload?.prompt || 0;
              const completion = data.payload?.completion || 0;
              setAccumulatedPromptTokens(p => p + prompt);
              setAccumulatedCompTokens(c => c + completion);
              // Calculate rough pricing ($2 / 1M pro token, $0.3 / 1M flash token)
              setTotalSpend(s => s + (prompt * 0.0000015) + (completion * 0.0000025));
            }
          }
        } catch (err) {
          console.error("Failed to parse ws event:", err);
        }
      };

      ws.onerror = (error) => {
        console.warn("WebSocket proxy error, switching gracefully to simulated container sandbox mode.", error);
        setSocketStatus("offline");
        setUseSimulation(true);
      };

      ws.onclose = () => {
        setSocketStatus("offline");
        setUseSimulation(true);
        // Retry connection in 10 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 10000);
      };
    };

    // Attempt real connection
    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isLogsPaused]);

  // --- Real-time Local Simulation Engines (Ensures full live interaction even when offline) ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (useSimulation) {
      interval = setInterval(() => {
        if (isLogsPaused) return;

        // Generate synthetic logs representing modular core dispatcher operations
        const sources = ["engine.orchestrator", "engine.dispatcher", "engine.memory", "engine.provider_router", "engine.tool_executor"];
        const topics = ["task.transition", "prompt.dispatch", "tool.evaluation", "memory.decay", "cache.synchronize", "api.status"];
        const levels = ["info", "debug", "warning", "info", "info"];
        const msgTemplates = [
          "Allocating workspace resources for task scheduler pipeline.",
          "Invoking Gemini models api to parse custom parameters context.",
          "Static trace compiled successful on build path target.",
          "Applied passive decay rate. working memory weights normalized to 0.72.",
          "Flushed local Cache registries containing old task IDs keys.",
          "Synchronized metadata nodes to master system graph diagram."
        ];

        const rndIndex = Math.floor(Math.random() * sources.length);
        const newLog = {
          id: `sim_log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          source: sources[rndIndex],
          topic: topics[Math.floor(Math.random() * topics.length)],
          level: Math.random() > 0.85 ? "warning" : levels[rndIndex],
          message: msgTemplates[Math.floor(Math.random() * msgTemplates.length)]
        };

        setLiveLogs(prev => [...prev.slice(-90), newLog]); // Keep memory footprint small
        
        // Randomly simulate cost tracking trickle
        if (Math.random() > 0.4) {
          const addedPrompt = Math.floor(Math.random() * 800) + 100;
          const addedComp = Math.floor(Math.random() * 300) + 50;
          setAccumulatedPromptTokens(p => p + addedPrompt);
          setAccumulatedCompTokens(c => c + addedComp);
          setTotalSpend(spend => spend + (addedPrompt * 0.0000015) + (addedComp * 0.0000025));
        }

        // Randomly generate minor tracing spans
        if (Math.random() > 0.88) {
          const id = `span_sim_${Date.now().toString().slice(-4)}`;
          const dur = Math.floor(Math.random() * 900) + 100;
          const ops = ["execute_regex", "check_linter", "query_semantic", "db_write_transaction"];
          setTraceSpans(prev => [
            ...prev,
            { spanId: id, parentSpanId: "span_root", operationName: ops[Math.floor(Math.random() * ops.length)], startTime: new Date().toLocaleTimeString().slice(-8), durationMs: dur, status: "success", tags: { "simulated": "true" } }
          ].slice(-12));
        }
      }, 3500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useSimulation, isLogsPaused]);

  // --- Campaign Trigger Simulation ---
  const handleTriggerCampaignSimulation = () => {
    if (campaignRunning) return;
    setCampaignRunning(true);
    
    // Clear and reset state
    setGraphNodes(prev => prev.map(n => ({ ...n, status: NodeStatus.IDLE })));
    setLiveLogs(prev => [
      ...prev,
      { id: `c_trig_${Date.now()}`, timestamp: new Date().toLocaleTimeString(), source: "engine.orchestrator", topic: "campaign.started", level: "info", message: `Executing Campaign DAG: "${campaignGoal}"` }
    ]);

    // Stage 1: Preparation Node running
    setTimeout(() => {
      setGraphNodes(prev => prev.map(n => n.id === "node_prep" ? { ...n, status: NodeStatus.RUNNING } : n));
      setAgentTimeline(prev => [
        { id: `at_sim_${Date.now()}`, agentName: "PlannerAgent", timestamp: new Date().toLocaleTimeString(), action: "Analyzing ingress code blocks matching current node parameters...", status: "info", durationMs: 0 },
        ...prev
      ]);
    }, 1000);

    // Stage 1: Done
    setTimeout(() => {
      setGraphNodes(prev => prev.map(n => n.id === "node_prep" ? { ...n, status: NodeStatus.COMPLETED } : n));
      setAgentTimeline(prev => [
        { id: `at_sim_${Date.now()}`, agentName: "PlannerAgent", timestamp: new Date().toLocaleTimeString(), action: "Parsed specifications and built static topological maps.", status: "success", durationMs: 650 },
        ...prev
      ]);
    }, 3000);

    // Stage 2 & 3: Coding and Testing Running parallel
    setTimeout(() => {
      setGraphNodes(prev => prev.map(n => n.id === "node_code" || n.id === "node_test" ? { ...n, status: NodeStatus.RUNNING } : n));
      setAgentTimeline(prev => [
        { id: `at_sim_code_${Date.now()}`, agentName: "CoderAgent", timestamp: new Date().toLocaleTimeString(), action: "Injecting code wrappers inside workspace directories...", status: "info", durationMs: 0 },
        { id: `at_sim_test_${Date.now()}`, agentName: "TesterAgent", timestamp: new Date().toLocaleTimeString(), action: "Verifying middleware limits & TCP port connections...", status: "info", durationMs: 0 },
        ...prev
      ]);
    }, 4500);

    // Stage 2 & 3 Complete
    setTimeout(() => {
      setGraphNodes(prev => prev.map(n => n.id === "node_code" || n.id === "node_test" ? { ...n, status: NodeStatus.COMPLETED } : n));
      setAgentTimeline(prev => [
        { id: `at_sim_code_ok_${Date.now()}`, agentName: "CoderAgent", timestamp: new Date().toLocaleTimeString(), action: "Successfully structured middleware wrapper configuration endpoints.", status: "success", durationMs: 1420 },
        { id: `at_sim_test_ok_${Date.now()}`, agentName: "TesterAgent", timestamp: new Date().toLocaleTimeString(), action: "Tests verified OK. Response benchmarks cleared.", status: "success", durationMs: 950 },
        ...prev
      ]);
    }, 7500);

    // Stage 4: Bundle Audit running
    setTimeout(() => {
      setGraphNodes(prev => prev.map(n => n.id === "node_audit" ? { ...n, status: NodeStatus.RUNNING } : n));
    }, 9000);

    // Stage 4 Complete and ending campaign campaign
    setTimeout(() => {
      setGraphNodes(prev => prev.map(n => n.id === "node_audit" ? { ...n, status: NodeStatus.COMPLETED } : n));
      setCampaignRunning(false);
      setLiveLogs(prev => [
        ...prev,
        { id: `c_end_${Date.now()}`, timestamp: new Date().toLocaleTimeString(), source: "engine.orchestrator", topic: "campaign.complete", level: "info", message: "Campaign campaign executed cleanly. Success ratio: 100%." }
      ]);
    }, 11000);
  };

  // --- Human interaction handlers (Approval Queue) ---
  const handleApproveProjectTask = (id: string) => {
    setApprovalQueue(prev => prev.map(item => item.id === id ? { ...item, status: "approved" } : item));
    const approvedItem = approvalQueue.find(i => i.id === id);
    setLiveLogs(prev => [
      ...prev,
      {
        id: `app_allow_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        source: "engine.orchestrator",
        topic: "workflow.approved",
        level: "info",
        message: `APPROVED: User authorized "${approvedItem?.taskTitle}" by ${approvedItem?.agentName}`
      }
    ]);
  };

  const handleRejectProjectTask = (id: string) => {
    setApprovalQueue(prev => prev.map(item => item.id === id ? { ...item, status: "rejected" } : item));
    const rejectedItem = approvalQueue.find(i => i.id === id);
    setLiveLogs(prev => [
      ...prev,
      {
        id: `app_reject_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        source: "engine.orchestrator",
        topic: "workflow.rejected",
        level: "warning",
        message: `REJECTED: User denied task trigger: "${rejectedItem?.taskTitle}"`
      }
    ]);
  };

  // --- Interactive topology map ping trigger ---
  const handlePingTopologySubsystem = (subName: string) => {
    setPingPulseSource(subName);
    setCliLogs(prev => [...prev, `PING: Triggering visual signal route path standard tracing -> [${subName}]`]);
    setTimeout(() => setPingPulseSource(null), 1000);
  };

  // --- Terminal Command Handler ---
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const command = cliInput.trim().toLowerCase();
    const args = command.split(" ");
    const primaryCmd = args[0];

    let outputLines = [`$ ${cliInput}`];

    switch (primaryCmd) {
      case "help":
        outputLines.push(
          "Available diagnostic controls:",
          "  help           Display active diagnostic command parameters",
          "  agents         Query active orchestrator agents details and roles",
          "  metrics        List current performance telemetry registers",
          "  clear          De-allocate console logs from view window",
          "  sys-map        Output topological system linkages blueprint",
          "  audit-log      Dump latest security and ingress logs",
          "  trigger-task   Asynchronously execute an isolated test sandbox task"
        );
        break;
      case "clear":
        setCliLogs(["Console buffers cleared ready.", "Ready $ "]);
        setCliInput("");
        return;
      case "agents":
        outputLines.push(
          "Registered core agent dispatcher processors:",
          "  PlannerAgent     - Campaign orchestrator synthesising logical sub-tasks",
          "  CoderAgent       - Writes high-fidelity code components inside targets",
          "  TesterAgent      - Diagnoses invariants, compiles test frameworks",
          "  SupervisorAgent  - High performance linter & bundle auditor"
        );
        break;
      case "metrics":
        outputLines.push(
          `Current Telemetry Metrics Dump:`,
          `  - Process Throughput : ${activeMetrics.throughput} req/min`,
          `  - Node Uptime Rate   : ${activeMetrics.uptimePercent}%`,
          `  - Session Api Cost   : $${totalSpend.toFixed(4)} USD`,
          `  - Input Prompt Vol   : ${accumulatedPromptTokens.toLocaleString()} tokens`,
          `  - Output Response Vol: ${accumulatedCompTokens.toLocaleString()} tokens`
        );
        break;
      case "sys-map":
        outputLines.push(
          "Topological system-map connections list:",
          "  Orchestrator   ==[ scheduling ]==> AgentDispatcher",
          "  Dispatcher     ==[ completion ]==> ProviderRouter",
          "  Dispatcher     ==[ sandbox    ]==> ToolExecutor",
          "  ToolExecutor   ==[ events     ]==> EventBus",
          "  MemoryManager  ==[ transient  ]==> Orchestrator"
        );
        break;
      case "audit-log":
        outputLines.push("Listing last security audit entries:");
        auditLogs.forEach(entry => {
          outputLines.push(`  [${entry.timestamp}] ${entry.user} - ${entry.action} -> ${entry.status}`);
        });
        break;
      case "trigger-task":
        outputLines.push(
          "Task dispatched asynchronously to Dispatcher pool.",
          "Check the Live Dynamic timelines for logs or traces."
        );
        setAgentTimeline(prev => [
          { id: `cli_t_${Date.now()}`, agentName: "CoderAgent", timestamp: new Date().toLocaleTimeString().slice(-8), action: "Dispatched manual CLI regex compilation validation task", status: "success", durationMs: 310 },
          ...prev
        ]);
        break;
      default:
        outputLines.push(`Command not recognized: '${primaryCmd}'. Type 'help' for active diagnostics.`);
    }

    setCliLogs(prev => [...prev, ...outputLines, "Ready $ "]);
    setCliInput("");
  };

  return (
    <div className="space-y-6" id="studio-visual-control-deck">

      {/* TOP HEADER STATUS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0a0f1d] border border-slate-800/80 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
            <Activity className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Throughput Rate</span>
            <span className="text-sm font-mono font-bold text-slate-200">{activeMetrics.throughput} API calls/m</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 animate-pulse">
            <Server className={`h-5 w-5 ${socketStatus === "connected" ? "text-emerald-400" : "text-amber-500"}`} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Live WebSockets</span>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${socketStatus === "connected" ? "bg-emerald-400 animate-ping" : "bg-amber-400 animate-pulse"}`}></span>
              <span className={`text-xs font-mono font-bold capitalize ${socketStatus === "connected" ? "text-emerald-400" : "text-amber-400"}`}>
                {socketStatus === "connected" ? "Connected" : socketStatus === "connecting" ? "Establishing proxy..." : "Offline (Simulator Active)"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1e293b] rounded-lg border border-slate-850">
            <Coins className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Session Spend Tracking</span>
            <span className="text-sm font-mono font-bold text-amber-300">${totalSpend.toFixed(4)} <span className="text-[9.5px] text-slate-500 font-normal">USD</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block">System Health Uptime</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{activeMetrics.uptimePercent}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Launch Campaign, Interactive Topology, Provider health, Approval Queue */}
        <div className="lg:col-span-8 space-y-6">

          {/* Launch Campaign Task Selector & Interactive Visualization */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/40 pb-3">
              <div className="flex items-center gap-2.5">
                <Workflow className="h-4.5 w-4.5 text-sky-400" />
                <h3 className="text-sm font-sans font-medium text-slate-100 tracking-tight">
                  Dynamic Task Graph Campaign Orchestrator
                </h3>
              </div>
              <button
                onClick={handleTriggerCampaignSimulation}
                disabled={campaignRunning}
                id="btn_trigger_simulation"
                className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-450 hover:to-sky-550 text-slate-950 font-sans font-semibold text-xs rounded-lg shrink-0 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-500/10"
              >
                {campaignRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-slate-950" />}
                {campaignRunning ? "Executing Campaign..." : "Execute Campaign"}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10.5px] font-mono text-slate-400 block uppercase">Modify Campaign Instruction Target</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-grow bg-[#090d16] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500/35 rounded-lg text-xs text-slate-200 px-3 py-1.5"
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  disabled={campaignRunning}
                />
              </div>
            </div>

            {/* Task Graph Visualizer Nodes with connecting arrows */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-2 relative">
              {graphNodes.map((node, index) => (
                <div key={node.id} className="relative flex flex-col items-stretch">
                  
                  {/* Visual bounding card */}
                  <div className={`p-3.5 rounded-lg border transition-all ${
                    node.status === NodeStatus.RUNNING ? "bg-sky-950/20 border-sky-400 shadow-lg shadow-sky-500/5 animate-pulse" :
                    node.status === NodeStatus.COMPLETED ? "bg-emerald-950/10 border-emerald-500/40" :
                    "bg-[#070b19] border-slate-800/80"
                  }`}>
                    <div className="flex justify-between items-start gap-1 pb-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase truncate max-w-[80px]">
                        {node.agent}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        node.status === NodeStatus.RUNNING ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                        node.status === NodeStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-slate-950 text-slate-500 border border-slate-800"
                      }`}>
                        {node.status}
                      </span>
                    </div>

                    <h4 className="text-[11.5px] font-mono font-bold text-slate-200 truncate mt-1">
                      {node.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans tracking-tight leading-snug mt-1 h-[32px] overflow-hidden">
                      {node.description}
                    </p>
                  </div>

                  {/* Horizontal routing arrow on Desktop */}
                  {index < 3 && (
                    <div className="hidden sm:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-700">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Topology / Architectural Flow Diagram */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/80 space-y-4">
            <div className="border-b border-slate-800/40 pb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Network className="h-4.5 w-4.5 text-emerald-400" />
                <h3 className="text-sm font-sans font-medium text-slate-100 tracking-tight">
                  Core Runtime System Architecture Topology
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-450 bg-emerald-950/20 border border-emerald-900/60 px-2 py-0.5 rounded">
                Click cells to route signal pulses
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              This visual map matches our active full-stack system layout. Click a component back-end cell block to inject a tracing signal diagnostic check and see structural route responses inside the log timeline.
            </p>

            {/* Topology graphical node diagram */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 py-1 font-mono text-xs select-none">
              
              {/* Orchestrator node */}
              <button
                onClick={() => handlePingTopologySubsystem("Orchestrator")}
                className={`p-3 rounded-lg border text-center relative transition-all cursor-pointer ${
                  pingPulseSource === "Orchestrator" ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-500/20" : "bg-[#070b19] border-slate-800/80 hover:border-slate-750"
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute top-2 right-2 animate-pulse"></div>
                <Workflow className="h-4 w-4 text-sky-400 mx-auto mb-1.5" />
                <span className="font-bold text-[10.5px] text-slate-200 block">Orchestrator</span>
                <span className="text-[8.5px] text-slate-500 block mt-1 leading-none">DAG Compiler</span>
              </button>

              {/* AgentDispatcher node */}
              <button
                onClick={() => handlePingTopologySubsystem("AgentDispatcher")}
                className={`p-3 rounded-lg border text-center relative transition-all cursor-pointer ${
                  pingPulseSource === "AgentDispatcher" ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-500/20" : "bg-[#070b19] border-slate-800/80 hover:border-slate-750"
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute top-2 right-2"></div>
                <Cpu className="h-4 w-4 text-emerald-400 mx-auto mb-1.5" />
                <span className="font-bold text-[10.5px] text-slate-200 block">Dispatcher</span>
                <span className="text-[8.5px] text-slate-500 block mt-1 leading-none">Job Allocator</span>
              </button>

              {/* ProviderRouter node */}
              <button
                onClick={() => handlePingTopologySubsystem("ProviderRouter")}
                className={`p-3 rounded-lg border text-center relative transition-all cursor-pointer ${
                  pingPulseSource === "ProviderRouter" ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-500/20" : "bg-[#070b19] border-slate-800/80 hover:border-slate-750"
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute top-2 right-2"></div>
                <Activity className="h-4 w-4 text-amber-400 mx-auto mb-1.5" />
                <span className="font-bold text-[10.5px] text-slate-200 block">AI Router</span>
                <span className="text-[8.5px] text-slate-500 block mt-1 leading-none">Models Gateway</span>
              </button>

              {/* ToolExecutor node */}
              <button
                onClick={() => handlePingTopologySubsystem("ToolExecutor")}
                className={`p-3 rounded-lg border text-center relative transition-all cursor-pointer ${
                  pingPulseSource === "ToolExecutor" ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-500/20" : "bg-[#070b19] border-[#1e293b] hover:border-slate-750"
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute top-2 right-2"></div>
                <Terminal className="h-4 w-4 text-rose-400 mx-auto mb-1.5" />
                <span className="font-bold text-[10.5px] text-slate-200 block">ToolExecutor</span>
                <span className="text-[8.5px] text-slate-500 block mt-1 leading-none">VFS Sandbox</span>
              </button>

              {/* MemoryManager node */}
              <button
                onClick={() => handlePingTopologySubsystem("MemoryManager")}
                className={`p-3 rounded-lg border text-center relative transition-all cursor-pointer ${
                  pingPulseSource === "MemoryManager" ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-500/20" : "bg-[#070b19] border-[#1e293b] hover:border-slate-750"
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute top-2 right-2 animate-pulse"></div>
                <Database className="h-4 w-4 text-purple-400 mx-auto mb-1.5" />
                <span className="font-bold text-[10.5px] text-slate-200 block">Memory</span>
                <span className="text-[8.5px] text-slate-500 block mt-1 leading-none">Context Store</span>
              </button>

              {/* EventBus Node */}
              <button
                onClick={() => handlePingTopologySubsystem("EventBus")}
                className={`p-3 rounded-lg border text-center relative transition-all cursor-pointer ${
                  pingPulseSource === "EventBus" ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-500/20" : "bg-[#070b19] border-[#1e293b] hover:border-slate-750"
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute top-2 right-2 animate-pulse"></div>
                <Layers className="h-4 w-4 text-sky-450 mx-auto mb-1.5" />
                <span className="font-bold text-[10.5px] text-slate-200 block">EventBus</span>
                <span className="text-[8.5px] text-slate-500 block mt-1 leading-none">Pub/Sub Core</span>
              </button>

            </div>
          </div>

          {/* Model Provider Health Status */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/80 space-y-4">
            <div className="border-b border-slate-800/40 pb-2.5 flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-slate-200 uppercase tracking-wider">Modular Cognitive Providers Status</span>
              <span className="text-[10px] font-mono text-slate-500">FastAPI Router Linkages</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs select-none">
              {providersStatus.map((p) => (
                <div key={p.key} className="p-3 bg-[#070b19] border border-slate-850 rounded-lg space-y-2">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-850/60">
                    <span className="font-bold text-slate-200 truncate pr-1">{p.name}</span>
                    <span className="text-[9.5px] text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded leading-none">
                      {p.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Latency:</span>
                      <span className="text-slate-300 font-semibold">{p.latency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Price/1k:</span>
                      <span className="text-amber-400 font-semibold">${p.costPer1K}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Human approval queues */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/40 pb-3">
              <CheckSquare className="h-4.5 w-4.5 text-sky-400" />
              <h3 className="text-sm font-sans font-medium text-slate-100 tracking-tight">
                Sandbox Campaign Human Approval Queue
              </h3>
            </div>

            <div className="space-y-3">
              {approvalQueue.filter(item => item.status === "pending").length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-center text-xs text-slate-500 select-none">
                  All campaign actions approved cleanly. Ready for task allocation.
                </div>
              ) : (
                approvalQueue.map((item) => (
                  <div key={item.id} className="p-4 bg-[#070b19] border border-slate-800/85 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-950">
                          {item.agentName}
                        </span>
                        <span className="text-slate-505 text-[10px]">{item.requestedAt}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 font-sans leading-relaxed">{item.taskTitle}</h4>
                      <p className="text-[10px] font-sans text-slate-400 leading-normal">{item.reason}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRejectProjectTask(item.id)}
                        className="p-1.5 px-3 bg-slate-850 hover:bg-slate-850 text-rose-400 border border-slate-850 hover:border-rose-950/50 rounded-lg cursor-pointer transition-colors font-sans text-[11px] font-semibold"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => handleApproveProjectTask(item.id)}
                        className="p-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans text-[11px] font-semibold rounded-lg cursor-pointer transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Real-time Live Log Console & Interactive Diagnostic CLI */}
        <div className="lg:col-span-4 space-y-6">

          {/* Logs viewer Tab Container */}
          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <div className="flex gap-2 font-mono text-[10px] uppercase font-bold tracking-wider">
                <button
                  onClick={() => setActiveTabSubView("live")}
                  className={`pb-1 border-b-2 transition-all ${activeTabSubView === "live" ? "text-sky-400 border-sky-400" : "text-slate-500 border-transparent hover:text-slate-400"}`}
                >
                  Live Logs
                </button>
                <button
                  onClick={() => setActiveTabSubView("tracing")}
                  className={`pb-1 border-b-2 transition-all ${activeTabSubView === "tracing" ? "text-sky-400 border-sky-400" : "text-slate-500 border-transparent hover:text-slate-400"}`}
                >
                  Distributed Traces
                </button>
                <button
                  onClick={() => setActiveTabSubView("audit")}
                  className={`pb-1 border-b-2 transition-all ${activeTabSubView === "audit" ? "text-sky-400 border-sky-400" : "text-slate-500 border-transparent hover:text-slate-400"}`}
                >
                  Security Audit
                </button>
              </div>

              {activeTabSubView === "live" && (
                <button
                  onClick={() => setIsLogsPaused(!isLogsPaused)}
                  className={`p-1 px-2.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                    isLogsPaused
                      ? "bg-amber-950/10 border-amber-500/20 text-amber-400 font-semibold"
                      : "bg-[#090d16] border-slate-850 text-slate-400 hover:text-slate-350"
                  }`}
                >
                  {isLogsPaused ? "Resume Pipeline" : "Pause Stream"}
                </button>
              )}
            </div>

            {/* Sub View 1: Real-time Live log stream */}
            {activeTabSubView === "live" && (
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-[380px] overflow-y-auto font-mono text-[9.5px] space-y-2 select-all relative">
                  {liveLogs.map((log) => {
                    // Match severity markers
                    const isError = log.level.toLowerCase().includes("err") || log.level.toLowerCase().includes("crit");
                    const isWarn = log.level.toLowerCase().includes("warn");
                    return (
                      <div key={log.id} className="border-b border-slate-900 pb-1.5 last:border-0 leading-normal text-left">
                        <div className="flex justify-between items-baseline text-[8.5px] text-slate-500">
                          <span className="font-semibold text-sky-410">[{log.source}] &lt;{log.topic}&gt;</span>
                          <span>{log.timestamp}</span>
                        </div>
                        <p className={`mt-0.5 font-normal ${isError ? "text-rose-450 font-bold" : isWarn ? "text-amber-500" : "text-slate-300"}`}>
                          <span className={`inline-block mr-1 text-[8px] font-bold px-1 rounded uppercase ${isError ? "bg-rose-950/20 text-rose-500 border border-rose-950" : isWarn ? "bg-amber-950/20 text-amber-500 border border-amber-959" : "text-slate-500"}`}>
                            {log.level}
                          </span>
                          {log.message}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={logsEndRef}></div>
                </div>
              </div>
            )}

            {/* Sub View 2: Distributed traces hierarchy */}
            {activeTabSubView === "tracing" && (
              <div className="space-y-3 font-mono text-xs">
                <p className="text-[10px] text-slate-400 leading-normal">
                  Distributed trace spans tracking process latencies. Highlights nested execution frames:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-[380px] overflow-y-auto select-all text-left space-y-2.5">
                  {traceSpans.map((span) => {
                    const indent = span.parentSpanId ? "pl-4 border-l border-sky-500/20" : "";
                    return (
                      <div key={span.spanId} className={`${indent} py-1`}>
                        <div className="flex justify-between items-baseline text-[10px]">
                          <span className="font-bold text-slate-200 flex items-center gap-1">
                            {!span.parentSpanId ? <Workflow className="h-3 w-3 text-sky-400" /> : <ChevronRight className="h-2.5 w-2.5 text-slate-500" />}
                            {span.operationName}
                          </span>
                          <span className="text-amber-400 font-semibold">{span.durationMs}ms</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-550 mt-1">
                          <span>Id: {span.spanId}</span>
                          <span className="text-right truncate">At: {span.startTime}</span>
                        </div>
                        {/* Render Tags */}
                        {Object.keys(span.tags).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(span.tags).map(([k, v]) => (
                              <span key={k} className="text-[8px] bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-slate-400">
                                {k}={v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub View 3: Ingress / Security Audit Logs */}
            {activeTabSubView === "audit" && (
              <div className="space-y-3 font-mono text-xs">
                <p className="text-[10px] text-slate-400 leading-normal">
                  Chronological security audits containing client routing endpoints access telemetry and API checks:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-[380px] overflow-y-auto select-all text-left space-y-2.5">
                  {auditLogs.map((entry) => {
                    const isDenied = entry.status.includes("DENIED");
                    return (
                      <div key={entry.id} className="pb-1.5 border-b border-slate-900 last:border-0">
                        <div className="flex justify-between items-baseline text-[9.5px]">
                          <span className="text-slate-400 font-bold">{entry.resource}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isDenied ? "bg-rose-950/20 text-rose-500 border border-rose-950" : "bg-emerald-950/10 text-emerald-400 border border-emerald-950"}`}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-350 bg-slate-900/35 px-2 py-1 rounded border border-slate-850 mt-1">
                          {entry.action}
                        </p>
                        <div className="flex justify-between text-[8px] text-slate-500 mt-1 leading-none">
                          <span>Caller: {entry.user}</span>
                          <span>Timestamp: {entry.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Shell Diagnostic CLI terminal */}
          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/85 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800/40 pb-2">
              <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
              <h4 className="text-[10.5px] font-mono font-semibold text-slate-300 uppercase tracking-widest">
                Interactive Diagnostics Console
              </h4>
            </div>

            {/* Terminal display */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-[190px] overflow-y-auto font-mono text-[9.5px] text-emerald-410 leading-relaxed text-left select-all">
              {cliLogs.map((log, iC) => (
                <div key={iC} className={log.startsWith("$ ") ? "text-sky-350" : log.includes("Command not recognized") ? "text-amber-400" : ""}>
                  {log}
                </div>
              ))}
              <div ref={cliEndRef}></div>
            </div>

            {/* Command Input prompt */}
            <form onSubmit={handleCliSubmit} className="flex gap-2">
              <input
                type="text"
                className="flex-grow bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="type help to see active debug targets"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
              />
              <button
                type="submit"
                id="btn_cli_submit"
                className="px-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-sans font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
