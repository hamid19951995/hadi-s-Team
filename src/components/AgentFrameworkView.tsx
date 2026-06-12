import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AGENTS_REGISTRY_DATA } from "../data/agents";
import { Agent, AgentTool } from "../types";
import {
  MODULAR_TOOLS_REGISTRY,
  ToolId,
  ModularTool,
  ToolParameter,
  ToolLogEntry,
  SIMULATED_FILESYSTEM,
  SIMULATED_COMMITS,
  SIMULATED_DOCKER_CONTAINERS
} from "../lib/tool-system";
import {
  Search, Layers, Code, ShieldAlert, ShieldCheck, Server, Terminal, Clock,
  Play, Brackets, Copy, Brain, Send, CheckCircle2, ChevronRight, Info,
  RotateCcw, AlertTriangle, Sparkles, Cpu, BookOpen, Fingerprint,
  ChevronDown, Lock, Shield, UserCheck, HelpCircle, Package, GitBranch,
  Box, CheckSquare, FileText, Activity, ArrowRight, Trash2, Globe
} from "lucide-react";

// Map string keys to Lucide icon components for safe rendering
const IconMap: Record<string, React.ComponentType<any>> = {
  Search: Search,
  Layers: Layers,
  Code: Code,
  ShieldAlert: ShieldAlert,
  ShieldCheck: ShieldCheck,
  Server: Server,
  Terminal: Terminal,
  Clock: Clock
};

// Tool icons mapping
const ToolIconMap: Record<ToolId, React.ComponentType<any>> = {
  FilesystemTool: FileText,
  GitTool: GitBranch,
  DockerTool: Box,
  TerminalTool: Terminal,
  TestRunnerTool: CheckSquare,
  PackageManagerTool: Package,
  CodeSearchTool: Search
};

type RightTabType = "blueprint" | "tools" | "sandbox";

export default function AgentFrameworkView() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("analyst_agent");
  const [activeRightTab, setActiveRightTab] = useState<RightTabType>("blueprint");

  // Agent Sandbox States
  const [promptInput, setPromptInput] = useState("");
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState<{ id: string; text: string; type: "thought" | "tool" | "output" | "system"; time: string }[]>([]);
  const [sandboxOutput, setSandboxOutput] = useState<Record<string, any> | null>(null);
  const [sandboxStepIdx, setSandboxStepIdx] = useState<number>(-1);
  const sandboxEndRef = useRef<HTMLDivElement>(null);

  // Modular Tool States
  const [selectedToolId, setSelectedToolId] = useState<ToolId>("FilesystemTool");
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [toolLogs, setToolLogs] = useState<ToolLogEntry[]>([]);
  const [toolOutput, setToolOutput] = useState<Record<string, any> | null>(null);
  const [isToolRunning, setIsToolRunning] = useState(false);
  const [safetyConfirmationPending, setSafetyConfirmationPending] = useState(false);
  const [activeVirtualFiles, setActiveVirtualFiles] = useState<string[]>(Object.keys(SIMULATED_FILESYSTEM));

  // Sync virtual files when FS changes are run in simulation
  const refreshVirtualFS = () => {
    setActiveVirtualFiles(Object.keys(SIMULATED_FILESYSTEM));
  };

  const activeAgent = AGENTS_REGISTRY_DATA.find(a => a.id === selectedAgentId) || AGENTS_REGISTRY_DATA[0];
  const ActiveIcon = IconMap[activeAgent.iconName] || Cpu;

  // Initialize tool parameter form states based on schema defaults
  useEffect(() => {
    const currentTool = MODULAR_TOOLS_REGISTRY[selectedToolId];
    if (currentTool) {
      const defaultState: Record<string, any> = {};
      Object.entries(currentTool.inputSchema).forEach(([paramName, paramVal]) => {
        const paramConfig = paramVal as ToolParameter;
        defaultState[paramName] = paramConfig.defaultValue !== undefined ? paramConfig.defaultValue : "";
      });
      setToolParams(defaultState);
      setToolOutput(null);
    }
  }, [selectedToolId]);

  // Sync scroll on logs addition
  useEffect(() => {
    sandboxEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sandboxLogs]);

  // Suggested prompt templates per agent for cool UX
  const promptTemplates: Record<string, string> = {
    analyst_agent: "Audit the OAuth login specs and map acceptance criteria for persistent storage keys.",
    architect_agent: "Design a high-throughput topological task-graph DAG routing pattern on Express.",
    coder_agent: "Implement a decay caching adapter inside the client state-management hook.",
    debugger_agent: "Trace type mismatch exception where 'null' value spreads through decay_factor.",
    security_agent: "Scan project directories for plaintext credentials and audit firestore.rules rules.",
    devops_agent: "Compose Alpine multi-stage Dockerfile and confirm reverse-proxy port 3000 boundaries.",
    documentation_agent: "Generate robust markdown instructions and API specifications for shared schemas.",
    project_manager_agent: "Calculate team delivery margins, check DOD checkboxes, and sign-off Release-C."
  };

  const handleApplyTemplate = () => {
    setPromptInput(promptTemplates[selectedAgentId] || "Optimize core routing engine workflows.");
  };

  // Run selected agent simulation step-by-step
  const handleDispatchDirective = () => {
    if (isSandboxRunning) return;
    
    // Switch to Sandbox panel automatically when user initiates thread
    setActiveRightTab("sandbox");

    const queryText = promptInput.trim() || promptTemplates[selectedAgentId] || "Invoke cognitive processing graph";
    setIsSandboxRunning(true);
    setSandboxOutput(null);
    setSandboxStepIdx(0);
    setSandboxLogs([
      {
        id: `sys_start_${Date.now()}`,
        text: `Initializing Cognitive Thread: Routing directive to [${activeAgent.name}]...`,
        type: "system",
        time: new Date().toLocaleTimeString()
      },
      {
        id: `sys_prompt_${Date.now()}`,
        text: `User Prompt Context: "${queryText}"`,
        type: "system",
        time: new Date().toLocaleTimeString()
      }
    ]);

    let step = 0;
    const reasoningSteps = activeAgent.reasoningStrategy.steps;
    const totalSteps = reasoningSteps.length;
    
    const intervalToken = setInterval(() => {
      const nowString = new Date().toLocaleTimeString();
      
      if (step < totalSteps) {
        // Log a reasoning thought step
        setSandboxLogs(prev => [
          ...prev,
          {
            id: `thought_${step}_${Date.now()}`,
            text: `[Reasoning Step ${step + 1}/${totalSteps}]: ${reasoningSteps[step]}`,
            type: "thought",
            time: nowString
          }
        ]);
        
        // Trigger intermediate tool call simulation at step 2
        if (step === 1 && activeAgent.toolRegistry.length > 0) {
          const matchedTool = activeAgent.toolRegistry[0];
          // Mock argument values based on parameters
          const mockArgs: Record<string, any> = {};
          Object.keys(matchedTool.parameters).forEach(k => {
            mockArgs[k] = k === "file_path" || k === "spec_path" || k === "config_path" 
              ? "/src/types.ts" 
              : k === "target_port" 
              ? 3000 
              : `Context-arg-value-of-${k}`;
          });
          
          setSandboxLogs(prev => [
            ...prev,
            {
              id: `tool_call_${Date.now()}`,
              text: `[Tool Invoke] Calling "${matchedTool.name}" with parameters: ${JSON.stringify(mockArgs)}`,
              type: "tool",
              time: nowString
            },
            {
              id: `tool_resp_${Date.now()}`,
              text: `[Tool Output] Response SUCCESS. Returned structural buffer status.`,
              type: "tool",
              time: nowString
            }
          ]);
        }
        
        step++;
        setSandboxStepIdx(step);
      } else {
        // Complete thread and output structured contract object matching prompt
        clearInterval(intervalToken);
        
        // Synthesizes specialized outputs tailored to mock the real response
        const liveStructuredOutput = { ...activeAgent.structuredOutput.mockOutputExample };
        
        setSandboxLogs(prev => [
          ...prev,
          {
            id: `sys_done_${Date.now()}`,
            text: `Agent [${activeAgent.name}] completed execution loop. Formulating contract schemas...`,
            type: "system",
            time: nowString
          },
          {
            id: `structured_done_${Date.now()}`,
            text: `SUCCESS! Structured JSON payload conforms strictly to "${activeAgent.structuredOutput.schemaTitle}" validator interface.`,
            type: "output",
            time: nowString
          }
        ]);

        setSandboxOutput(liveStructuredOutput);
        setIsSandboxRunning(false);
        setSandboxStepIdx(-1);
      }
    }, 1000);
  };

  // Modular Tool Handler Execution Call
  const handleExecuteTool = async (forceBypassConfirmation: boolean = false) => {
    const currentTool = MODULAR_TOOLS_REGISTRY[selectedToolId];
    if (!currentTool) return;

    // Check Safety Gate Requirement
    if (currentTool.safetyPolicy.requiresUserConfirmation && !forceBypassConfirmation) {
      setSafetyConfirmationPending(true);
      return;
    }

    setSafetyConfirmationPending(false);
    setIsToolRunning(true);
    setToolOutput(null);

    // Run execution with safe validation resolver callback
    const result = await currentTool.execute(toolParams, () => true);

    // Save outputs
    setToolOutput(result.output);
    if (result.logs && result.logs.length > 0) {
      setToolLogs(prev => [result.logs[0], ...prev]);
    }

    setIsToolRunning(false);
    refreshVirtualFS();
  };

  const handleDeclineSafetyAuthorization = () => {
    setSafetyConfirmationPending(false);
    
    // Create aborted log tracing record
    const abortedLog: ToolLogEntry = {
      id: `log_abort_${Date.now()}`,
      timestamp: new Date().toISOString(),
      toolId: selectedToolId,
      actionName: toolParams.action || "execute_op",
      parameters: { ...toolParams },
      safetyCheckPassed: false,
      executionStatus: "aborted",
      durationMs: 4,
      stderr: "User human gate check declined explicit authorization token permission block."
    };

    setToolLogs(prev => [abortedLog, ...prev]);
    setIsToolRunning(false);
  };

  const handleCopyJSON = () => {
    if (!sandboxOutput) return;
    navigator.clipboard.writeText(JSON.stringify(sandboxOutput, null, 2));
  };

  const handleCopyToolJSON = () => {
    if (!toolOutput) return;
    navigator.clipboard.writeText(JSON.stringify(toolOutput, null, 2));
  };

  const handleClearToolLogs = () => {
    setToolLogs([]);
  };

  return (
    <div className="space-y-6" id="agent_framework_view">
      {/* Intro Header Banner Card */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-sky-500/5 rounded-full blur-2xl"></div>
        <div className="space-y-1 relative z-10 w-full md:max-w-2xl">
          <div className="flex items-center gap-2">
            <Brain className="h-4.5 w-4.5 text-sky-400" />
            <h2 className="text-sm font-mono font-bold tracking-tight text-slate-100 uppercase">
              Autonomous Systems Agent &amp; Tool Framework
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Standardized multi-agent cognitive architecture with pluggable tools. Each agent utilizes a tailored profile
            to resolve complex tasks by sequencing Filesystem, Git, Terminal, and Docker tools inside our simulated safe sandbox environment.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 select-none font-mono text-[10px] text-slate-500 bg-slate-950 p-2.5 rounded border border-slate-850">
          <span>8 Agents</span>
          <span>•</span>
          <span className="text-emerald-400">7 Pluggable Ruleset Tools</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Interactive Agent Registry Selector */}
        <div className="xl:col-span-3 space-y-3">
          <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-850">
            <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-slate-500 block px-2 mb-2">
              Autonomous Registry
            </span>
            <div className="space-y-1">
              {AGENTS_REGISTRY_DATA.map((agent) => {
                const SelectedIcon = IconMap[agent.iconName] || Cpu;
                const isSelected = agent.id === selectedAgentId;
                
                return (
                  <button
                    key={agent.id}
                    id={`agent_card_select_${agent.id}`}
                    onClick={() => {
                      if (!isSandboxRunning) {
                        setSelectedAgentId(agent.id);
                        setSandboxOutput(null);
                        setSandboxLogs([]);
                        setPromptInput("");
                      }
                    }}
                    disabled={isSandboxRunning}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-[#1e293b]/40 border-sky-505/45 text-sky-400 font-medium scale-[1.01]"
                        : "bg-transparent border-transparent hover:bg-slate-905/30 text-slate-450 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded border transition-colors ${
                        isSelected ? "bg-[#090d16] border-sky-500/30 text-sky-400" : "bg-slate-950/40 border-slate-850 text-slate-500"
                      }`}>
                        <SelectedIcon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-mono block leading-tight">{agent.name}</span>
                        <span className="text-[9px] text-slate-500 block truncate max-w-[150px]">{agent.role}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats panel */}
          <div className="bg-[#0f172a] p-4.5 rounded-xl border border-slate-850 space-y-3 font-mono text-[10px]">
            <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[9.5px]">Tool Framework Context</span>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Workspace files</span>
                <span className="text-slate-200 font-bold block mt-0.5">{activeVirtualFiles.length} nodes</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Git commits</span>
                <span className="text-slate-200 font-bold block mt-0.5">{SIMULATED_COMMITS.length} logs</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Running docker</span>
                <span className="text-amber-400 font-bold block mt-0.5">{SIMULATED_DOCKER_CONTAINERS.length} active</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-850">
                <span className="text-slate-500 block">Security Level</span>
                <span className="text-emerald-400 font-bold block mt-0.5">Strict Sandbox</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Workspace Content */}
        <div className="xl:col-span-9 space-y-6">
          {/* Main workspace navigation tabs bar */}
          <div className="flex border-b border-slate-800/80 gap-1 select-none">
            <button
              onClick={() => setActiveRightTab("blueprint")}
              className={`px-4.5 py-2.5 text-xs font-mono font-medium transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeRightTab === "blueprint"
                  ? "border-sky-500 text-sky-400 bg-slate-900/10"
                  : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-950/20"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Specs Blueprint
            </button>
            <button
              onClick={() => setActiveRightTab("tools")}
              className={`px-4.5 py-2.5 text-xs font-mono font-medium transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeRightTab === "tools"
                  ? "border-sky-500 text-sky-400 bg-slate-900/10"
                  : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-950/20"
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-emerald-400" /> Pluggable Tool Executor
            </button>
            <button
              onClick={() => setActiveRightTab("sandbox")}
              className={`px-4.5 py-2.5 text-xs font-mono font-medium transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeRightTab === "sandbox"
                  ? "border-sky-500 text-sky-400 bg-slate-900/10"
                  : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-950/20"
              }`}
            >
              <Brain className="h-3.5 w-3.5 text-purple-400" /> Cognitive Sandbox Dispatch
            </button>
          </div>

          {/* Active Tab Panel Renderer */}
          <div className="space-y-6">
            
            {/* TAB 1: BLUEPRINT VIEW */}
            {activeRightTab === "blueprint" && (
              <div className="bg-[#0f172a] border border-slate-850 rounded-xl overflow-hidden shadow-lg animate-fade-in">
                {/* Spec Sub-Header */}
                <div className="p-5 border-b border-slate-800/40 bg-slate-900/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-sky-950/30 border border-sky-500/30 rounded-lg flex items-center justify-center text-sky-400">
                      <ActiveIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                        {activeAgent.name} Specs Profile
                        <Fingerprint className="h-3.5 w-3.5 text-slate-500" />
                      </h3>
                      <span className="text-xs font-sans text-slate-400 block mt-0.5">
                        {activeAgent.role}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-850 text-[10px] font-mono text-slate-405 self-start sm:self-center">
                    Scope: <code className="text-sky-400">BaseAgent Framework Subclass</code>
                  </div>
                </div>

                {/* Profile Spec Content */}
                <div className="p-6 space-y-6">
                  <div className="p-4 bg-[#0a0f1d]/40 rounded-lg border border-slate-800/50">
                    <h4 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Info className="h-3 w-3 text-sky-450" /> Identity Mission Statement
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal">
                      {activeAgent.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Capabilities */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> Capabilities Envelope
                      </h4>
                      <div className="space-y-2">
                        {activeAgent.capabilities.map((c, idx) => (
                          <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-[#090d16]/30 px-3 py-2 rounded-lg border border-slate-850">
                            <span className="text-sky-500 shrink-0 select-none mt-0.5">•</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integrated Tool Registry */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5" /> Registered Automation Tools
                      </h4>
                      <div className="space-y-3">
                        {activeAgent.toolRegistry.map((tool, idx) => (
                          <div key={idx} className="bg-[#090d16]/50 p-3 rounded-lg border border-slate-800/60 text-xs text-slate-300">
                            <div className="flex justify-between items-baseline mb-1">
                              <code className="text-amber-400 font-mono font-semibold">{tool.name}</code>
                              <span className="text-[9px] font-mono text-slate-500">Params: {Object.keys(tool.parameters).length}</span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 mb-2 leading-relaxed">{tool.purpose}</p>
                            
                            <div className="bg-[#0f172a] p-2 rounded border border-slate-850 mt-1 font-mono text-[9px] text-slate-500 space-y-1">
                              {Object.entries(tool.parameters).map(([pName, pMeta]) => (
                                <div key={pName} className="flex justify-between">
                                  <span className="text-slate-400">{pName} ({pMeta.type}) {pMeta.required && <code className="text-rose-500/80 text-[8px] font-bold">REQ</code>}</span>
                                  <span className="text-slate-500 font-sans">{pMeta.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Staggered Reasoning steps */}
                  <div className="border-t border-slate-800/45 pt-5 space-y-3">
                    <h4 className="text-[10px] font-mono font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <Brain className="h-4 w-4" /> Logical Reasoning Strategy: {activeAgent.reasoningStrategy.name}
                    </h4>
                    <p className="text-xs text-slate-400 italic font-sans">
                      {activeAgent.reasoningStrategy.description}
                    </p>
                    
                    <div className="relative mt-4 pl-4 border-l border-slate-800 space-y-4">
                      {activeAgent.reasoningStrategy.steps.map((stepStr, sIdx) => (
                        <div key={sIdx} className="relative flex items-start gap-4">
                          <span className="absolute -left-[23px] top-0 h-4.5 w-4.5 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-mono text-[9px] text-slate-500">
                            {sIdx + 1}
                          </span>
                          <div className="text-xs text-slate-300 leading-normal">
                            {stepStr}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Structured Output Pydantic schema */}
                  <div className="border-t border-slate-800/40 pt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-5 space-y-3">
                      <h4 className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Brackets className="h-3.5 w-3.5" /> Structured Output Schema Fields
                      </h4>
                      <div className="bg-[#090d16]/30 rounded-lg border border-slate-800/60 divide-y divide-slate-850 text-xs text-slate-300">
                        <div className="p-3 bg-slate-900/10 font-mono font-semibold text-emerald-400 border-b border-slate-850 flex justify-between select-none">
                          <span>{activeAgent.structuredOutput.schemaTitle}</span>
                          <span className="text-[9px] text-slate-500">JSON validator</span>
                        </div>
                        {activeAgent.structuredOutput.fields.map((field) => (
                          <div key={field.name} className="p-3 bg-[#0a0f1d]/20">
                            <div className="flex justify-between items-baseline">
                              <code className="text-slate-105 font-mono font-semibold">{field.name}</code>
                              <span className="text-[9.5px] font-mono text-emerald-500 bg-emerald-500/5 px-1.5 rounded">{field.type}</span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 mt-1">{field.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-7 bg-[#090d16] border border-slate-800/80 rounded-lg flex flex-col min-h-[220px] overflow-hidden">
                      <div className="bg-slate-900/40 px-3.5 py-2.5 border-b border-slate-850 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Code className="h-3.5 w-3.5 text-sky-500" /> contract_schema_example.json
                        </span>
                      </div>
                      <pre className="p-4 text-[10.5px] font-mono text-slate-300 bg-slate-950/60 overflow-x-auto flex-1 select-text scrollbar-thin">
                        <code>
                          {JSON.stringify(activeAgent.structuredOutput.mockOutputExample, null, 2)}
                        </code>
                      </pre>
                      <div className="p-2.5 bg-slate-900/10 border-t border-slate-850 text-[9px] font-mono text-slate-500 flex justify-between px-4">
                        <span>Validates against: {activeAgent.structuredOutput.schemaTitle}</span>
                        <span>JSON Schema draft-07</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PLUGGABLE TOOL EXECUTOR */}
            {activeRightTab === "tools" && (
              <div className="space-y-6 animate-fade-in" id="modular_tools_workspace">
                {/* Tools Selector Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {(Object.keys(MODULAR_TOOLS_REGISTRY) as ToolId[]).map((toolIdKey) => {
                    const toolObj = MODULAR_TOOLS_REGISTRY[toolIdKey];
                    const SelectedToolIcon = ToolIconMap[toolIdKey] || FileText;
                    const isSelectedTool = toolIdKey === selectedToolId;

                    return (
                      <button
                        key={toolIdKey}
                        onClick={() => setSelectedToolId(toolIdKey)}
                        className={`p-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-[1.02] ${
                          isSelectedTool
                            ? "bg-[#101b2a] border-emerald-500/40 text-emerald-400 font-semibold"
                            : "bg-slate-950 border-slate-850 text-slate-450 hover:text-slate-300 hover:bg-slate-900/30"
                        }`}
                      >
                        <SelectedToolIcon className="h-4 w-4" />
                        <span className="text-[9.5px] font-mono truncate w-full">{toolIdKey.replace("Tool", "")}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Executor Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Parameter Panel Forms (Col 7) */}
                  <div className="lg:col-span-7 bg-[#0f172a] border border-slate-850 rounded-xl p-5 space-y-4">
                    
                    {/* Tool header */}
                    <div className="border-b border-slate-800/40 pb-3 flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                          {MODULAR_TOOLS_REGISTRY[selectedToolId]?.name}
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-normal">Active</span>
                        </h4>
                        <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                          {MODULAR_TOOLS_REGISTRY[selectedToolId]?.description}
                        </p>
                      </div>
                    </div>

                    {/* Safety policy warning shield */}
                    {(() => {
                      const policy = MODULAR_TOOLS_REGISTRY[selectedToolId]?.safetyPolicy;
                      const badgeColors = {
                        low: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
                        medium: "bg-sky-500/10 border-sky-500/25 text-sky-400",
                        high: "bg-amber-500/10 border-amber-500/25 text-amber-400",
                        danger: "bg-[#1c0f0f] border-red-500/25 text-red-400"
                      };

                      return (
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start gap-3">
                          <div className="p-1 px-1.5 rounded bg-slate-900 border border-slate-800 text-slate-500 shrink-0 mt-0.5">
                            <Shield className="h-4 w-4 text-emerald-400 animate-pulse" />
                          </div>
                          <div className="text-[9.5px] font-mono space-y-1">
                            <div className="flex gap-2 items-center">
                              <span className="text-slate-400 uppercase font-semibold">Security Policy Block</span>
                              <span className={`px-1.5 py-0.2 rounded text-[8.5px] uppercase font-bold border ${badgeColors[policy.level]}`}>
                                Level {policy.level}
                              </span>
                              {policy.requiresUserConfirmation && (
                                <span className="bg-[#1c0f0f] border border-red-500/20 px-1 rounded text-[#ff6b6b] text-[8px] font-bold uppercase animate-pulse">Confirm Required</span>
                              )}
                            </div>
                            <p className="text-slate-500 leading-normal">{policy.description}</p>
                            <p className="text-[9px] text-slate-600 block pt-1 border-t border-slate-900">
                              Sandbox Boundary: <code className="text-slate-400">{policy.sandboxIsolationScope}</code>
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Form Controls inputs dynamically cooked */}
                    <div className="space-y-3 pt-2 font-mono">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Execution Inputs schema</span>
                      
                      <div className="space-y-3.5 bg-[#090d16] p-3.5 rounded-lg border border-slate-850">
                        {Object.entries(MODULAR_TOOLS_REGISTRY[selectedToolId]?.inputSchema || {}).map(([paramName, paramVal]) => {
                          const param = paramVal as ToolParameter;
                          return (
                            <div key={paramName} className="space-y-1.5">
                              <div className="flex justify-between items-baseline">
                                <label className="text-[10px] text-slate-300 font-bold">
                                  {paramName}
                                  {param.required && <span className="text-rose-500 ml-1 font-sans">*</span>}
                                </label>
                                <span className="text-[8.5px] text-slate-500 uppercase">{param.type === "select" ? "Enumerated Selection" : param.type}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 block leading-tight">{param.description}</span>

                              {param.type === "select" ? (
                                <select
                                  className="w-full bg-[#0f172a] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                                  value={toolParams[paramName] || ""}
                                  onChange={(e) => setToolParams(prev => ({ ...prev, [paramName]: e.target.value }))}
                                >
                                  {param.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : param.type === "boolean" ? (
                                <label className="flex items-center gap-2 px-2 py-1 relative cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-800 bg-[#0f172a] text-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                                    checked={!!toolParams[paramName]}
                                    onChange={(e) => setToolParams(prev => ({ ...prev, [paramName]: e.target.checked }))}
                                  />
                                  <span className="text-xs text-slate-300">Boolean Flag Enabled</span>
                                </label>
                              ) : (
                                <input
                                  type={param.type === "number" ? "number" : "text"}
                                  className="w-full bg-[#0f172a] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-sky-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                  placeholder={param.description}
                                  value={toolParams[paramName] || ""}
                                  onChange={(e) => setToolParams(prev => ({ ...prev, [paramName]: param.type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Execution Action Bar wrapper */}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[9px] text-slate-500">Conforms to ToolParameter specifications</span>
                        
                        <button
                          onClick={() => handleExecuteTool(false)}
                          disabled={isToolRunning}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                        >
                          <Play className="h-3.5 w-3.5" />
                          {isToolRunning ? "Processing Tool..." : "Run Tool Subsystem"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Output Inspector & Session logging history timeline (Col 5) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* JSON Outcome Inspector */}
                    <div className="bg-[#0f172a] border border-slate-850 rounded-xl overflow-hidden flex flex-col min-h-[220px]">
                      <div className="bg-slate-900/40 px-3.5 py-2.5 border-b border-slate-850 flex justify-between items-center text-[10.5px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Brackets className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> Tool Output Schema Result
                        </span>
                        {toolOutput && (
                          <button
                            onClick={handleCopyToolJSON}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 font-mono text-[9px] rounded border border-slate-700 text-slate-300 cursor-pointer"
                          >
                            Copy Payload
                          </button>
                        )}
                      </div>

                      <div className="p-3.5 overflow-auto flex-1 font-mono text-[10.5px] text-slate-300 bg-slate-950/40 max-h-[220px] scrollbar-thin">
                        {toolOutput ? (
                          <pre className="whitespace-pre">
                            <code>{JSON.stringify(toolOutput, null, 2)}</code>
                          </pre>
                        ) : (
                          <div className="text-center py-12 text-slate-650 flex flex-col items-center justify-center h-full">
                            <Brackets className="h-7 w-7 text-slate-700 mb-1.5" />
                            <p className="font-sans text-[11px]">No active output payload. Submit directive inputs to execute modular code blocks.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Integrated Tool Output Logs Timeline */}
                    <div className="bg-[#0f172a] border border-slate-850 rounded-xl flex flex-col h-[280px] overflow-hidden">
                      <div className="bg-slate-900/40 px-3.5 py-2 border-b border-slate-850 flex justify-between items-center text-[10.5px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-sky-400" /> Active Session Logs Trace
                        </span>
                        {toolLogs.length > 0 && (
                          <button
                            onClick={handleClearToolLogs}
                            className="text-[9px] text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Clear Logs
                          </button>
                        )}
                      </div>

                      <div className="p-3 overflow-y-auto flex-1 font-mono text-[10px] space-y-3.5 text-slate-300 bg-[#090d16]/30">
                        {toolLogs.map((log) => {
                          const statusColors = {
                            success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                            failed: "bg-[#1c0f0f] border-red-500/20 text-red-400",
                            aborted: "bg-rose-500/10 border-rose-500/20 text-rose-450",
                            pending_confirmation: "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          };

                          return (
                            <div key={log.id} className="p-2.5 rounded border border-slate-850 bg-[#0d1323] space-y-1.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-slate-200 block font-semibold text-[10.5px]">#{log.toolId.replace("Tool", "")}</span>
                                  <span className="text-slate-500 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold uppercase ${statusColors[log.executionStatus]}`}>
                                  {log.executionStatus}
                                </span>
                              </div>

                              <div className="text-slate-450 bg-slate-950/60 p-1 rounded border border-slate-900/40 font-mono text-[9px] truncate" title={JSON.stringify(log.parameters)}>
                                Args: <code>{JSON.stringify(log.parameters)}</code>
                              </div>

                              {log.stdout && (
                                <div className="text-[9.5px] text-slate-300 whitespace-pre-wrap leading-normal font-sans pt-1 border-t border-slate-850 bg-slate-950 p-1.5 rounded pr-1 scrollbar-thin">
                                  {log.stdout}
                                </div>
                              )}

                              {log.stderr && (
                                <div className="text-[9.5px] text-rose-400 whitespace-pre-wrap leading-normal font-sans pt-1 border-t border-[#1a1111] bg-rose-500/5 p-1.5 rounded pr-1 mt-1">
                                  {log.stderr}
                                </div>
                              )}

                              <div className="flex justify-between text-[8px] text-slate-500">
                                <span>Checked Safety Policies</span>
                                <span>Duration: <code className="text-emerald-400 font-bold">{log.durationMs}ms</code></span>
                              </div>
                            </div>
                          );
                        })}

                        {toolLogs.length === 0 && (
                          <div className="text-center py-16 text-slate-650 flex flex-col items-center justify-center h-full">
                            <Terminal className="h-6 w-6 text-slate-700 mb-1.5" />
                            <p className="font-sans text-[10px]">No active session logs trace recorded yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated File Explorer and details block for transparent visualization */}
                {selectedToolId === "FilesystemTool" && (
                  <div className="bg-[#0f172a] border border-slate-850 p-4.5 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold block flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Simulated Sandboxed Filesystem Directory
                    </span>
                    <p className="text-[10.5px] text-slate-400">
                      This represents the active, secure virtual workspace directory managed by the <code className="text-slate-350">FilesystemTool</code>.
                      Any write operations performed in parameters input above dynamically modify this client-side state.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                      {activeVirtualFiles.map((vPath) => (
                        <div key={vPath} className="bg-slate-950 p-2.5 rounded border border-slate-850 flex flex-col justify-between text-[10.5px]">
                          <div className="flex items-center gap-2 text-slate-300 font-mono">
                            <span className="text-emerald-400 animate-pulse font-normal">📁</span>
                            <span className="truncate">{vPath}</span>
                          </div>
                          <div className="text-[9px] text-slate-550 mt-1 flex justify-between font-mono">
                            <span>Code lines: {SIMULATED_FILESYSTEM[vPath]?.split("\n").length || 0}</span>
                            <button
                              onClick={() => {
                                setToolParams({ action: "read", filePath: vPath, content: "" });
                                alert(`Selected ${vPath} path to read!`);
                              }}
                              className="text-sky-400 hover:underline cursor-pointer"
                            >
                              Load Path
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COGNITIVE SANDBOX DISPATCH */}
            {activeRightTab === "sandbox" && (
              <div className="space-y-6 animate-fade-in" id="cognitive_dispatch_panel">
                <div className="bg-[#0f172a] border border-slate-850 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4.5 w-4.5 text-sky-400" />
                      <h3 className="text-xs font-mono font-bold text-slate-100 uppercase">
                        Autonomous Agent Sandbox Dispatcher
                      </h3>
                    </div>
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-[9px] font-mono text-slate-500 border border-slate-850">
                      Sandbox Thread
                    </span>
                  </div>

                  {/* Input prompt area */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        id="sandbox_prompt_input"
                        type="text"
                        placeholder={`Dispatch an objective directive to ${activeAgent.name}...`}
                        className="flex-1 bg-[#090d16] border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500/50 text-xs text-slate-200 p-3 leading-relaxed placeholder-slate-600 font-sans"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        disabled={isSandboxRunning}
                        onKeyDown={(e) => e.key === 'Enter' && handleDispatchDirective()}
                      />
                      
                      <button
                        id="apply_template_btn"
                        onClick={handleApplyTemplate}
                        disabled={isSandboxRunning}
                        className="px-3 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 rounded-lg text-xs leading-none cursor-pointer flex items-center justify-center gap-1.5"
                        title="Apply template task objective tailored for this agent"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Apply Template
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-slate-500">
                        Directives are routed inside our simulated V8 cognitive loop framework.
                      </p>
                      
                      <button
                        id="btn_sandbox_dispatch"
                        onClick={handleDispatchDirective}
                        disabled={isSandboxRunning}
                        className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-sans font-medium text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {isSandboxRunning ? "Decomposing..." : "Dispatch Directive"}
                      </button>
                    </div>
                  </div>

                  {/* Simulated Live Stack Thought Logs */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Output log (left / col 7) */}
                    <div className="lg:col-span-7 bg-[#090d16] rounded-lg border border-slate-800/90 h-[260px] flex flex-col overflow-hidden">
                      <div className="bg-slate-900/40 px-3 py-2 border-b border-slate-850 flex items-center justify-between text-[11px] font-mono select-none">
                        <span className="text-slate-405 flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-sky-400" /> Cognitive Process Log Trace
                        </span>
                        {isSandboxRunning && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-ping"></span>
                        )}
                      </div>
                      
                      <div className="p-3.5 overflow-y-auto flex-1 font-mono text-[10.5px] leading-relaxed space-y-2 text-slate-300 scrollbar-thin">
                        {sandboxLogs.map((log) => {
                          const lineColors = {
                            thought: "text-purple-300/90",
                            tool: "text-amber-400",
                            output: "text-emerald-400 font-semibold",
                            system: "text-slate-500 italic"
                          };

                          return (
                            <div key={log.id} className="flex gap-2 py-0.5 select-text hover:bg-slate-950/30 px-1 rounded">
                              <span className="text-slate-650 shrink-0 select-none">{log.time}</span>
                              <span className={lineColors[log.type] || "text-slate-300"}>
                                {log.text}
                              </span>
                            </div>
                          );
                        })}
                        
                        {sandboxLogs.length === 0 && (
                          <div className="text-center py-16 text-slate-600 flex flex-col items-center justify-center h-full animate-fade-in">
                            <Cpu className="h-7 w-7 text-slate-700 mb-2 animate-bounce" />
                            <p className="font-sans text-[11px]">Playground idle. Click 'Dispatch' to trigger runtime execution sequence...</p>
                          </div>
                        )}
                        
                        <div ref={sandboxEndRef}></div>
                      </div>
                    </div>

                    {/* Output Object (right / col 5) */}
                    <div className="lg:col-span-5 bg-[#090d16] border border-slate-800/90 rounded-lg flex flex-col h-[260px] overflow-hidden">
                      <div className="bg-slate-900/40 px-3.5 py-2.5 border-b border-slate-850 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Brackets className="h-3.5 w-3.5 text-emerald-400" /> Structured Outcome JSON
                        </span>
                        {sandboxOutput && (
                          <button
                            onClick={handleCopyJSON}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 font-mono text-[9px] rounded border border-slate-700 text-slate-350 cursor-pointer animate-fade-in"
                          >
                            Copy Payload
                          </button>
                        )}
                      </div>
                      
                      <div className="p-3.5 overflow-auto flex-1 font-mono text-[10.5px] text-slate-300 scrollbar-thin select-text">
                        {sandboxOutput ? (
                          <pre className="whitespace-pre animate-fade-in">
                            <code>{JSON.stringify(sandboxOutput, null, 2)}</code>
                          </pre>
                        ) : (
                          <div className="text-center py-16 text-slate-650 flex flex-col items-center justify-center h-full">
                            <Brackets className="h-7 w-7 text-slate-700 mb-2" />
                            <p className="font-sans text-[11px]">No active output payload. Submit directive to view returned JSON structures.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* HUMAN SAFETY GATE INTERACTIVE CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {safetyConfirmationPending && (
          <div className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-red-500/30 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex gap-3">
                <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg self-start">
                  <ShieldAlert className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-mono font-bold tracking-tight text-slate-100 uppercase">
                    Human Authorization Gate Requested
                  </h4>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    This operation falls under highly protected access parameters. You must review the parameters and explicitly grant permission to proceed.
                  </p>
                </div>
              </div>

              {/* Param mapping summary */}
              <div className="bg-[#090d16] p-3.5 rounded-lg border border-slate-850 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between pb-1.5 border-b border-slate-900 mb-1.5">
                  <span className="text-slate-500 uppercase text-[9.5px]">Requesting Tool</span>
                  <span className="text-amber-500 font-bold font-mono">{selectedToolId}</span>
                </div>
                {Object.entries(toolParams).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-baseline">
                    <span className="text-slate-500">{k}:</span>
                    <span className="text-slate-200 text-right truncate max-w-[280px]">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>

              {/* Safety warning disclaimer */}
              <div className="bg-[#1c1212]/30 p-3 rounded border border-red-500/15 leading-relaxed text-[10px] text-rose-450 flex items-start gap-2 font-sans">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>
                  Warning: Bypassing credentials verification or granting file system write writes to system boundaries executes actions raw inside simulation registers. Confirm credentials before signing.
                </span>
              </div>

              {/* Choices button block */}
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={handleDeclineSafetyAuthorization}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-mono font-medium rounded-lg cursor-pointer"
                >
                  Deny Authorization
                </button>
                <button
                  onClick={() => handleExecuteTool(true)}
                  className="px-4.5 py-2 bg-red-650 hover:bg-red-600 text-[#fff] text-xs font-mono font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-md shadow-red-500/10"
                >
                  <UserCheck className="h-3.5 w-3.5" /> Sign &amp; Authorize System Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
