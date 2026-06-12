import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TaskNode, NodeStatus } from "../types";
import { AGENTS_REGISTRY_DATA } from "../data/agents";
import { Server, Play, AlertCircle, Ban, Terminal, ChevronRight, CheckCircle2, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";

// Dynamic trace compiler representing our exact engine operations step-by-step
const buildDynamicTraces = (nodesList: TaskNode[], goalText: string, hasError: boolean) => {
  const agent1 = nodesList.find(n => n.node_id === "node_1")?.assigned_agent || "AnalystAgent";
  const agent2 = nodesList.find(n => n.node_id === "node_2")?.assigned_agent || "CoderAgent";
  const agent3 = nodesList.find(n => n.node_id === "node_3")?.assigned_agent || "DebuggerAgent";
  const agent4 = nodesList.find(n => n.node_id === "node_4")?.assigned_agent || "ProjectManagerAgent";

  const cleanGoal = goalText.trim() || "Build Express core with secure route authorization";

  if (!hasError) {
    return [
      { text: `Initializing Autonomous AI Studio orchestrator campaign: "${cleanGoal}"`, source: "engine.orchestrator", level: "info" },
      { text: "Created subscriber bridges. Mapping internal event loops to active event-bus.", source: "engine.event_bus", level: "debug" },
      { text: "Executing topological DAG validation algorithm on generated nodes...", source: "engine.task_graph", level: "info" },
      { text: "Topological graph verification SUCCESS. Detected 4 nodes, 0 dependencies cycles. Kahn order valid.", source: "engine.task_graph", level: "info" },
      { text: "Querying semantic cognitive context memories matching goal keywords...", source: "engine.memory", level: "debug" },
      { text: "Fetched salience semantic matches. Injecting instructions to dispatcher context.", source: "engine.memory", level: "info" },
      { text: `Dispatching planning phase to Agent [${agent1}]...`, source: "engine.dispatcher", level: "info" },
      { text: `[${agent1}] Reasoning strategy initiated. Executing tool calls to view requirements context...`, source: "engine.provider_router", level: "info" },
      { text: `Invoked 'read_spec_artifacts' on spec directory. Mapped feature scopes.`, source: "engine.tool_executor", level: "debug" },
      { text: `[${agent1}] analysis pass finalized. Logical mapping of specifications complete. Output: SUCCESS.`, source: "engine.dispatcher", level: "info" },
      { text: `Dispatching parallel task [Core Code Implementation] to [${agent2}]... (Thread 1)`, source: "engine.dispatcher", level: "info" },
      { text: `Dispatching parallel task [Test Harness Verification] to [${agent3}]... (Thread 2)`, source: "engine.dispatcher", level: "info" },
      { text: `[${agent2}] invoking tool 'create_workspace_file' to implement codebase modules...`, source: "engine.tool_executor", level: "debug" },
      { text: `Committed file patches inside workspace sandbox. Static tests compiled cleanly.`, source: "engine.tool_executor", level: "info" },
      { text: `[${agent3}] invoking diagnostic tools to verify invariants...`, source: "engine.tool_executor", level: "debug" },
      { text: `[${agent3}] diagnostics verify completed cleanly. Internal constraints OK. Output: SUCCESS.`, source: "engine.dispatcher", level: "info" },
      { text: `[${agent2}] code optimization checked. Thread 1 & 2 resolved cleanly. Output: SUCCESS.`, source: "engine.dispatcher", level: "info" },
      { text: `Gathered parallel completed threads. Dispatching final verification review to [${agent4}]...`, source: "engine.orchestrator", level: "info" },
      { text: `Invoking compile tools to verify project bundle build validity...`, source: "engine.tool_executor", level: "info" },
      { text: "Compilation successful. Bundle output: dist/server.cjs generated. Total size: 240.5kb.", source: "engine.tool_executor", level: "info" },
      { text: `Orchestrator campaign complete under guidelines of [${agent4}]. Success ratio: 100%.`, source: "engine.orchestrator", level: "info" },
      { text: "Consolidating active working buffers into persistent Semantic knowledge entries.", source: "engine.memory", level: "info" },
      { text: "Campaign shutdown cleanly. Returning results to user workspace dashboard.", source: "engine.orchestrator", level: "info" }
    ];
  } else {
    return [
      { text: `Initializing Autonomous AI Studio orchestrator campaign: "${cleanGoal}"`, source: "engine.orchestrator", level: "info" },
      { text: "Executing topological DAG validation algorithm on generated nodes...", source: "engine.task_graph", level: "info" },
      { text: "Graph order valid. Kahn topological order check complete.", source: "engine.task_graph", level: "info" },
      { text: `Dispatching initial task to Agent [${agent1}]...`, source: "engine.dispatcher", level: "info" },
      { text: `[${agent1}] assessment complete. Output SUCCESS.`, source: "engine.dispatcher", level: "info" },
      { text: `Dispatching parallel task [Core Code Implementation] to [${agent2}]... (Thread 1)`, source: "engine.dispatcher", level: "info" },
      { text: `Dispatching parallel task [Test Harness Verification] to [${agent3}]... (Thread 2)`, source: "engine.dispatcher", level: "info" },
      { text: `[${agent2}] compilation simulation fault: Unexpected character token at /src/main.tsx:14.`, source: "engine.tool_executor", level: "error" },
      { text: `[${agent2}] execution failed on static invariants. Halting reasoning loop.`, source: "engine.dispatcher", level: "error" },
      { text: `Task [Core Code Implementation] reported FAILURE. Syncing state machine graph updates.`, source: "engine.task_graph", level: "error" },
      { text: `DAG Cascade Warning: Mark dependent Node [${nodesList.find(n => n.node_id === "node_4")?.title}] as SKIPPED due to parent [${agent2}] compilation build failure.`, source: "engine.task_graph", level: "warning" },
      { text: `Campaign finished with error cascade state. Supervisor Agent [${agent4}] triggering recovery procedures.`, source: "engine.orchestrator", level: "warning" }
    ];
  }
};

export default function TaskGraphView() {
  const [goal, setGoal] = useState("Build a secure multi-tenant express proxy middleware with memory caching");
  const [isRunning, setIsRunning] = useState(false);
  const [injectError, setInjectError] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [nodes, setNodes] = useState<TaskNode[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<{ id: string; text: string; source: string; level: string; time: string }[]>([]);
  const termEndRef = useRef<HTMLDivElement>(null);
  const executionTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll console logs
  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (executionTimer.current) clearInterval(executionTimer.current);
    };
  }, []);

  const initializeDefaultNodes = () => {
    const defaultNodes: TaskNode[] = [
      {
        node_id: "node_1",
        title: "Module Layout Design & Planning",
        description: "Draft module boundaries, state signatures, and structural paths",
        assigned_agent: "AnalystAgent",
        status: NodeStatus.IDLE,
        dependencies: []
      },
      {
        node_id: "node_2",
        title: "Core Code Implementation",
        description: "Write clean code modules, setup structures, and configure standard entrypoints",
        assigned_agent: "CoderAgent",
        status: NodeStatus.IDLE,
        dependencies: ["node_1"]
      },
      {
        node_id: "node_3",
        title: "Test Harness Framework Implementation",
        description: "Verify correctness, draft test coverages, compile sanity checks",
        assigned_agent: "DebuggerAgent",
        status: NodeStatus.IDLE,
        dependencies: ["node_1"]
      },
      {
        node_id: "node_4",
        title: "System Integration and Compilation Audit",
        description: "Invoke core build scripts, parse warning messages, and secure structural project readiness",
        assigned_agent: "ProjectManagerAgent",
        status: NodeStatus.IDLE,
        dependencies: ["node_2", "node_3"]
      }
    ];
    setNodes(defaultNodes);
  };

  useEffect(() => {
    initializeDefaultNodes();
  }, []);

  const handleStartCampaign = () => {
    if (isRunning) return;
    setIsRunning(true);
    setTerminalLogs([]);
    
    // Select suitable trace log lines dynamically based on currently assigned agents
    const traceTimeline = buildDynamicTraces(nodes, goal, injectError);
    let traceIdx = 0;
    
    // Reset nodes to idle
    setNodes(prev => prev.map(n => ({ ...n, status: NodeStatus.IDLE, started_at: undefined, ended_at: undefined })));

    // Step by step time simulation representing graph progress asynchronously
    executionTimer.current = setInterval(() => {
      if (traceIdx >= traceTimeline.length) {
        if (executionTimer.current) clearInterval(executionTimer.current);
        setIsRunning(false);
        return;
      }

      // Add a trace log
      const log = traceTimeline[traceIdx];
      const nowString = new Date().toLocaleTimeString();
      setTerminalLogs(prev => [
        ...prev,
        { id: `log_${Date.now()}_${traceIdx}`, ...log, time: nowString }
      ]);

      // State transition triggers corresponding to the logs timeline:
      // Planner Started
      if (traceIdx === 6) {
        setNodes(prev => prev.map(n => n.node_id === "node_1" ? { ...n, status: NodeStatus.RUNNING, started_at: new Date().toISOString() } : n));
      }
      // Planner Completed
      if (traceIdx === 9) {
        setNodes(prev => prev.map(n => n.node_id === "node_1" ? { ...n, status: NodeStatus.COMPLETED, ended_at: new Date().toISOString() } : n));
      }
      // Code and Test Started (Parallel!)
      if (traceIdx === 10) {
        setNodes(prev => prev.map(n => n.node_id === "node_2" || n.node_id === "node_3" ? { ...n, status: NodeStatus.RUNNING, started_at: new Date().toISOString() } : n));
      }
      
      if (!injectError) {
        // Standard code and test SUCCESS
        if (traceIdx === 15) {
          setNodes(prev => prev.map(n => n.node_id === "node_3" ? { ...n, status: NodeStatus.COMPLETED, ended_at: new Date().toISOString() } : n));
        }
        if (traceIdx === 16) {
          setNodes(prev => prev.map(n => n.node_id === "node_2" ? { ...n, status: NodeStatus.COMPLETED, ended_at: new Date().toISOString() } : n));
        }
        // Compiler Started
        if (traceIdx === 17) {
          setNodes(prev => prev.map(n => n.node_id === "node_4" ? { ...n, status: NodeStatus.RUNNING, started_at: new Date().toISOString() } : n));
        }
        // Compiler Success
        if (traceIdx === 19) {
          setNodes(prev => prev.map(n => n.node_id === "node_4" ? { ...n, status: NodeStatus.COMPLETED, ended_at: new Date().toISOString() } : n));
        }
      } else {
        // Error inject pathways: Coder fails, compiler cascades to skipped!
        if (traceIdx === 8) {
          // Failure on node_2
          setNodes(prev => prev.map(n => n.node_id === "node_2" ? { ...n, status: NodeStatus.FAILED, ended_at: new Date().toISOString() } : n));
        }
        if (traceIdx === 10) {
          // node_4 cascades to SKIPPED because dependency node_2 failed!
          setNodes(prev => prev.map(n => n.node_id === "node_4" ? { ...n, status: NodeStatus.SKIPPED, ended_at: new Date().toISOString() } : n));
          // node_3 completed nicely (it was parallel)
          setNodes(prev => prev.map(n => n.node_id === "node_3" ? { ...n, status: NodeStatus.COMPLETED, ended_at: new Date().toISOString() } : n));
        }
      }

      traceIdx++;
    }, 1100);
  };

  const handleCancelCampaign = () => {
    if (executionTimer.current) {
      clearInterval(executionTimer.current);
    }
    setIsRunning(false);
    
    // Mark actively running items as cancelled
    setNodes(prev =>
      prev.map(n => (n.status === NodeStatus.RUNNING ? { ...n, status: NodeStatus.IDLE } : n))
    );
    
    setTerminalLogs(prev => [
      ...prev,
      {
        id: `log_abort_${Date.now()}`,
        text: "ABSOLUTE HALT Dispatched by user dashboard context. Aborting parallel threads.",
        source: "engine.orchestrator",
        level: "critical",
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="orchestrator_panel">
      {/* Parameters Input Sidebar (Left) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              Launch Campaign Parameters
            </h3>
          </div>

          <div>
            <label className="text-[10.5px] font-mono text-slate-400 block mb-1.5 uppercase">
              Campaign Goal Objective
            </label>
            <textarea
              id="goal_input_area"
              className="w-full h-24 bg-[#090d16] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500/50 rounded-lg text-xs text-slate-200 p-3 leading-relaxed placeholder-slate-600 resize-none font-sans"
              placeholder="e.g., Build an offline-first task scheduler component with local indexed data stores"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase">
                Model Router
              </label>
              <select
                id="model_router_select"
                className="w-full bg-[#0a0f1d] border border-slate-800 rounded font-mono text-[10.5px] text-slate-300 p-1.5 focus:outline-none"
                disabled={isRunning}
              >
                <option>gemini-3.1-pro-preview</option>
                <option>gemini-3.5-flash</option>
                <option>anthropic-sonnet</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase">
                Temperature
              </label>
              <input
                id="temp_slider"
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                className="w-full accent-sky-500 mt-2 bg-slate-800 rounded"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={isRunning}
              />
              <span className="text-[10px] font-mono text-slate-400 text-right block mt-0.5">{temperature}</span>
            </div>
          </div>

          {/* Test Inject Failure Selector */}
          <div className="bg-red-950/5 border border-red-950/20 p-3 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10.5px] font-mono text-rose-400 font-semibold block uppercase">
                Inject Build Failure
              </span>
              <span className="text-[9.5px] text-slate-500 block">
                Force error to inspect cascade skipping
              </span>
            </div>
            <input
              id="inject_error_checkbox"
              type="checkbox"
              className="h-4 w-4 bg-[#090d16] border-slate-700/80 rounded accent-sky-500"
              checked={injectError}
              onChange={(e) => setInjectError(e.target.checked)}
              disabled={isRunning}
            />
          </div>

          {/* Quick Start Buttons */}
          <div className="flex gap-2 pt-2">
            {!isRunning ? (
              <button
                id="btn_start_campaign"
                onClick={handleStartCampaign}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-450 text-slate-950 font-sans font-medium text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                Initialize Run
              </button>
            ) : (
              <button
                id="btn_cancel_campaign"
                onClick={handleCancelCampaign}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-slate-100 font-sans font-medium text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Ban className="h-4 w-4" />
                Cancel Run
              </button>
            )}
          </div>
        </div>

        {/* Engine status display card */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/85">
          <h4 className="text-[10.5px] font-mono font-semibold text-slate-400 uppercase tracking-wide mb-2">
            State Machine Metrics
          </h4>
          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-800/40">
              <span className="text-slate-500 text-[10px]">CURRENT PATHWAY:</span>
              <span className="text-slate-300 text-[10.5px]">
                {isRunning ? "db4230d3 (RUNNING)" : "IDLE"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-800/40">
              <span className="text-slate-500 text-[10px]">DECISION FLOW TYPE:</span>
              <span className="text-sky-400 text-[10.5px]">Topological Kahn</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[10px]">EVENT BUS STREAM:</span>
              <span className="text-emerald-400 text-[10.5px]">OK (Listening)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive DAG and Live Terminal Output (Right) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Dynamic DAG Canvas layout style */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 relative overflow-hidden">
          <div className="flex justify-between items-center mb-5 border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[9.5px] font-mono tracking-wider text-sky-400 uppercase font-semibold bg-sky-950/20 px-2 py-0.5 rounded border border-sky-950">
                DAG Visualizer
              </span>
              <h3 className="text-sm font-sans font-medium text-slate-100 tracking-tight mt-1">
                Logical Engineering Plan Topology
              </h3>
            </div>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-[10.5px] text-sky-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping"></span>
                Active Execution
              </span>
            )}
          </div>

          {/* Graphical Nodes Grid showing parent dependencies */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative py-3">
            {nodes.map((node, nIdx) => {
              // Status Styling mapping
              const colors = {
                [NodeStatus.IDLE]: "border-slate-800 bg-slate-900/10 text-slate-500",
                [NodeStatus.RUNNING]: "border-sky-500/65 bg-sky-950/25 text-sky-200 shadow-md shadow-sky-500/5 ring-1 ring-sky-500/20",
                [NodeStatus.COMPLETED]: "border-emerald-500/40 bg-emerald-950/10 text-emerald-100",
                [NodeStatus.FAILED]: "border-rose-550/40 bg-rose-950/15 text-rose-100",
                [NodeStatus.SKIPPED]: "border-slate-800/40 bg-slate-900/5 text-slate-600 opacity-60 line-through"
              };

              const iconColors = {
                [NodeStatus.IDLE]: "text-slate-600",
                [NodeStatus.RUNNING]: "text-sky-400 animate-pulse",
                [NodeStatus.COMPLETED]: "text-emerald-400",
                [NodeStatus.FAILED]: "text-rose-550",
                [NodeStatus.SKIPPED]: "text-slate-700"
              };

              return (
                <div
                  key={node.node_id}
                  id={`dag_visual_node_${node.node_id}`}
                  className={`p-3.5 border rounded-xl flex flex-col justify-between transition-all relative min-h-[140px] ${colors[node.status]}`}
                >
                  <div>
                    {/* Index identifier */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9.5px] font-mono tracking-wide opacity-80 block uppercase">
                        Node {nIdx + 1}
                      </span>
                      {!isRunning ? (
                        <select
                          id={`node_agent_select_${node.node_id}`}
                          value={node.assigned_agent}
                          onChange={(e) => {
                            setNodes(prev => prev.map(n => n.node_id === node.node_id ? { ...n, assigned_agent: e.target.value } : n));
                          }}
                          className="bg-slate-950 border border-slate-800 text-[9px] font-mono text-sky-400 py-0.5 px-1.5 rounded focus:outline-none focus:ring-1 focus:ring-sky-500/40 cursor-pointer max-w-[120px]"
                        >
                          {AGENTS_REGISTRY_DATA.map(registeredOpt => (
                            <option key={registeredOpt.id} value={registeredOpt.name}>
                              {registeredOpt.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[8.5px] font-mono bg-slate-900/50 text-slate-350 px-1.5 py-0.5 rounded uppercase border border-slate-800/40">
                          {node.assigned_agent}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-sans font-medium leading-snug tracking-tight">
                      {node.title}
                    </h4>
                    <p className="text-[10px] opacity-75 mt-1.5 font-sans leading-normal line-clamp-2">
                      {node.description}
                    </p>
                  </div>

                  {/* Status Indicator at card bottom */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/15 text-[10.5px] font-mono">
                    <span className="capitalize">{node.status}</span>
                    {node.status === NodeStatus.COMPLETED && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    )}
                    {node.status === NodeStatus.FAILED && (
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    )}
                    {node.status === NodeStatus.SKIPPED && (
                      <AlertTriangle className="h-3.5 w-3.5 text-slate-600 shrink-0 select-none" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Downstream Connector Hints at DAG bottom */}
          <div className="mt-4 bg-[#090d16] p-2.5 rounded border border-slate-800/50 text-[10.5px] font-mono text-slate-500 text-center flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            <span>Dependencies Line Map:</span>
            <span>Node 1</span>
            <ChevronRight className="h-3 w-3 inline text-slate-700" />
            <span className="text-slate-400">Node 2 &amp; Node 3 (Parallel)</span>
            <ChevronRight className="h-3 w-3 inline text-slate-700" />
            <span className="text-slate-400">Node 4</span>
          </div>
        </div>

        {/* Live Debug Console Log buffers streaming */}
        <div className="bg-[#090d16] rounded-xl border border-slate-800/90 flex flex-col h-[280px]">
          <div className="bg-[#0f172a] px-4 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="h-4 w-4 text-sky-500" />
              <span>Core Runtime Live Console Logs</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Bus connected</span>
            </div>
          </div>

          {/* Sequential scroll box matching standard trace elements */}
          <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed space-y-2 text-slate-300">
            {terminalLogs.map((log) => {
              const lineColors = {
                info: "text-slate-300",
                debug: "text-slate-500",
                warning: "text-amber-400/90",
                error: "text-rose-400 font-semibold",
                critical: "text-rose-500 font-extrabold"
              };
              
              const badgeColors = {
                "engine.orchestrator": "text-sky-400",
                "engine.event_bus": "text-purple-400",
                "engine.task_graph": "text-emerald-400",
                "engine.memory": "text-pink-400",
                "engine.dispatcher": "text-amber-400",
                "engine.provider_router": "text-indigo-400",
                "engine.tool_executor": "text-teal-400"
              };

              return (
                <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/20 py-0.5 select-text">
                  <span className="text-slate-600 select-none">{log.time}</span>
                  <span className={`shrink-0 font-bold ${badgeColors[log.source as keyof typeof badgeColors] || "text-slate-400"}`}>
                    [{log.source}]
                  </span>
                  <span className={lineColors[log.level as keyof typeof lineColors] || "text-slate-300"}>
                    {log.text}
                  </span>
                </div>
              );
            })}
            
            {terminalLogs.length === 0 && (
              <div className="text-center py-10 text-slate-600 flex flex-col items-center justify-center h-full">
                <Terminal className="h-6 w-6 text-slate-700 mb-2" />
                <p>Telemetry console ready. Start run campaign to streams log buffers...</p>
              </div>
            )}
            
            {/* Scroll Anchor */}
            <div ref={termEndRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
