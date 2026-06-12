import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wrench, Bug, Terminal, RefreshCw, Archive, CheckCircle2, 
  AlertTriangle, RotateCcw, ShieldAlert, Cpu, Play, Ban, 
  HelpCircle, ChevronRight, FileCode, Users, GitBranch, ArrowUpRight, Check, Sparkles
} from "lucide-react";
import { 
  HealingStep, 
  ErrorClassification, 
  InjectableError, 
  INJECTABLE_ERRORS_CATALOG, 
  HealingAttemptLog, 
  HealingSessionState, 
  getStrategyDescription 
} from "../lib/self-healing";

export default function SelfHealingView() {
  const [selectedErrorId, setSelectedErrorId] = useState<string>("err_type_collision");
  const [retryStrategy, setRetryStrategy] = useState<HealingSessionState["retryStrategy"]>("prompt_refining");
  const [simulatePoisonousPatch, setSimulatePoisonousPatch] = useState<boolean>(false);
  
  // Simulated State Machine 
  const [state, setState] = useState<HealingSessionState>({
    sessionId: "",
    activeStep: "IDLE",
    activeError: null,
    logs: [],
    retryCount: 0,
    maxRetries: 3,
    retryStrategy: "prompt_refining",
    patchApplied: null,
    rollbackTriggered: false,
    rollbackDetails: null,
    escalationTriggered: false,
    repeatFailuresCount: 0,
    recoveryStatus: "idle",
  });

  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const runningTimer = useRef<NodeJS.Timeout | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log box
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.logs]);

  // Clean-up
  useEffect(() => {
    return () => {
      if (runningTimer.current) clearInterval(runningTimer.current);
    };
  }, []);

  const addLog = (step: HealingStep, message: string, level: "info" | "warning" | "success" | "danger" = "info", details?: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          timestamp: new Date().toLocaleTimeString(),
          step,
          message,
          level,
          details
        }
      ]
    }));
  };

  const handleStartSelfHealing = () => {
    if (state.activeStep !== "IDLE") return;
    
    const targetError = INJECTABLE_ERRORS_CATALOG.find(e => e.id === selectedErrorId) || INJECTABLE_ERRORS_CATALOG[0];
    
    // Initialize healing session
    setState({
      sessionId: `heal_usr_${Math.floor(Math.random() * 90000 + 10000)}`,
      activeStep: "DETECTING",
      activeError: targetError,
      logs: [],
      retryCount: 0,
      maxRetries: 3,
      retryStrategy: retryStrategy,
      patchApplied: null,
      rollbackTriggered: false,
      rollbackDetails: null,
      escalationTriggered: false,
      repeatFailuresCount: 0,
      recoveryStatus: "running"
    });

    const strategyInfo = getStrategyDescription(retryStrategy);
    let stepCount = 0;
    
    // Cancel any old timer
    if (runningTimer.current) clearInterval(runningTimer.current);

    // Initial Logs
    setTimeout(() => {
      addLog("DETECTING", `Initializing live runtime scanner. Listening to virtual filesystem and stdout channels on PORT 3000...`, "info");
      addLog("DETECTING", `CRITICAL EVENT DECOY: Process standard error output buffer intercepted. Evaluating exit logs.`, "warning");
    }, 100);

    // Run the step-by-step state machine with customized intervals
    const runWorkflow = () => {
      if (runningTimer.current) clearInterval(runningTimer.current);
      
      const intervalDelay = strategyInfo.delay;
      let workflowSteps: { step: HealingStep; action: () => void }[] = [];

      // Build out the dynamic steps array based on whether it passes or fails (simulated poison patch)
      if (!simulatePoisonousPatch) {
        // Standard Success Pathway
        workflowSteps = [
          {
            step: "CLASSIFYING",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "CLASSIFYING" }));
              addLog(
                "CLASSIFYING",
                `Analyzing stacktrace boundaries. Extracted trace indicates a ${targetError.classification} pattern in ${targetError.targetFile}.`,
                "warning",
                { errorCode: "TSC_COMPILE_EXCEPTION", severity: "high" }
              );
            }
          },
          {
            step: "ANALYZING_LOGS",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "ANALYZING_LOGS" }));
              addLog(
                "ANALYZING_LOGS",
                `Parsing error logs from DebuggerAgent on file ${targetError.targetFile}:${targetError.offendingLineNum}. Offending instruction: "${targetError.offendingCode}"`,
                "warning"
              );
            }
          },
          {
            step: "GENERATING_PATCH",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "GENERATING_PATCH" }));
              addLog(
                "GENERATING_PATCH",
                `Cognitive agents [${targetError.agentsInvolved.analyze}] synchronized with active workspace memory to map patch proposal.`,
                "info"
              );
              addLog(
                "GENERATING_PATCH",
                `Synthesized unified Git-diff repair patch: Replace "${targetError.offendingCode}" with safe declaration "${targetError.remediedCode}".`,
                "success"
              );
            }
          },
          {
            step: "APPLYING_PATCH",
            action: () => {
              setState(prev => ({ 
                ...prev, 
                activeStep: "APPLYING_PATCH",
                patchApplied: {
                  file: targetError.targetFile,
                  before: targetError.offendingCode,
                  after: targetError.remediedCode,
                  success: true
                }
              }));
              addLog(
                "APPLYING_PATCH",
                `Surgically writing patch buffer to simulated filesystem storage path: ${targetError.targetFile}. Code written successfully.`,
                "success"
              );
            }
          },
          {
            step: "RE_RUNNING",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "RE_RUNNING" }));
              addLog(
                "RE_RUNNING",
                `Triggering non-emitting compiler process (tsc --noEmit) to inspect updated AST rules.`,
                "info"
              );
            }
          },
          {
            step: "VALIDATING",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "VALIDATING" }));
              addLog(
                "VALIDATING",
                `Verification engine reports 0 static check exceptions. Active tests verified: 100% OK.`,
                "success"
              );
            }
          },
          {
            step: "RESOLVED",
            action: () => {
              setState(prev => ({ 
                ...prev, 
                activeStep: "RESOLVED",
                recoveryStatus: "success"
              }));
              addLog(
                "RESOLVED",
                `Autonomous Self-Healing Loop completed matches on target: Session Resolved cleanly (Time: ${intervalDelay * 6}ms).`,
                "success"
              );
            }
          }
        ];
      } else {
        // Toxic/Poisonous Patch Loop (Demonstrates multiple attempts, retry strategies, rollbacks, and escalations)
        workflowSteps = [
          {
            step: "CLASSIFYING",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "CLASSIFYING" }));
              addLog(
                "CLASSIFYING",
                `Analyzing stacktrace. Extracted error of type ${targetError.classification}. Initializing self-correction tracking logs.`,
                "warning"
              );
            }
          },
          {
            step: "ANALYZING_LOGS",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "ANALYZING_LOGS" }));
              addLog("ANALYZING_LOGS", `Traced breaking code in segment ${targetError.targetFile}:${targetError.offendingLineNum}.`, "info");
            }
          },
          {
            step: "GENERATING_PATCH",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "GENERATING_PATCH" }));
              addLog("GENERATING_PATCH", `Attempt 1: Generating standard regression patch context.`, "info");
            }
          },
          {
            step: "APPLYING_PATCH",
            action: () => {
              setState(prev => ({ 
                ...prev, 
                activeStep: "APPLYING_PATCH",
                patchApplied: {
                  file: targetError.targetFile,
                  before: targetError.offendingCode,
                  after: `/* INSUFFICIENT POISON FIX Try 1 */ ${targetError.offendingCode}`,
                  success: true
                }
              }));
              addLog("APPLYING_PATCH", `Patch applied, but contains an implicit logical hazard (Simulating Regression Poison).`, "warning");
            }
          },
          {
            step: "RE_RUNNING",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "RE_RUNNING" }));
              addLog("RE_RUNNING", `Re-running compiler build. Expecting static failure...`, "info");
            }
          },
          {
            step: "VALIDATING",
            action: () => {
              setState(prev => ({ ...prev, activeStep: "VALIDATING" }));
              addLog("VALIDATING", `[FATAL EXCEPTION] Compiler checks failed: Type check failed on intermediate variable assignments reference.`, "danger");
              addLog("VALIDATING", `Detected repeat failure of patched code block. Raising retry loop triggers.`, "warning");
            }
          },
          {
            step: "GENERATING_PATCH", // Attempt 2 with Retry Strategy!
            action: () => {
              setState(prev => ({ 
                ...prev, 
                activeStep: "GENERATING_PATCH",
                retryCount: 1
              }));
              addLog("GENERATING_PATCH", `[RETRY LEVEL 1] Applying strategy [${strategyInfo.title}]. Staggering execution...`, "warning");
              addLog("GENERATING_PATCH", `Strategy Detail: ${strategyInfo.detail}`, "info");
              addLog("GENERATING_PATCH", `Attempt 2: Synthesized expanded patch with auxiliary variable unions.`, "success");
            }
          },
          {
            step: "APPLYING_PATCH",
            action: () => {
              setState(prev => ({ 
                ...prev, 
                patchApplied: {
                  file: targetError.targetFile,
                  before: targetError.offendingCode,
                  after: `/* WRONG_REF_TRIAL2 */ const temp_factor = null; ${targetError.offendingCode}`,
                  success: true
                }
              }));
              addLog("APPLYING_PATCH", `Applied Try 2 correction proposal to target AST.`, "info");
            }
          },
          {
            step: "RE_RUNNING",
            action: () => {
              addLog("RE_RUNNING", `Re-evaluating bundle build in strict validation mode...`, "info");
            }
          },
          {
            step: "VALIDATING",
            action: () => {
              setState(prev => ({ 
                ...prev, 
                retryCount: 2
              }));
              addLog("VALIDATING", `[FATAL REGRESSION EXCEPTION] Test verified: Primary issue resolved but secondary import loops broken.`, "danger");
              addLog("VALIDATING", `Critical fail thresholds tripped (Retry attempt 2/3 exhausted). Rolling back.`, "danger");
            }
          },
          {
            step: "ROLLING_BACK",
            action: () => {
              setState(prev => ({ 
                ...prev, 
                activeStep: "ROLLING_BACK",
                rollbackTriggered: true,
                rollbackDetails: "Git Workspace reset to checkout commit 8f3b2e1. Filesystem restored to original state."
              }));
              addLog("ROLLING_BACK", `Invoking emergency rollback procedures via GitTool. Reverting local filesystem files.`, "danger");
              addLog("ROLLING_BACK", `Git Checkpoint (8f3b2e1) RESTORED successfully. All files reconstructed.`, "success");
            }
          },
          {
            step: "ESCALATING",
            action: () => {
              setState(prev => ({ 
                ...prev, 
                activeStep: "ESCALATING",
                escalationTriggered: true,
                recoveryStatus: "escalated"
              }));
              addLog("ESCALATING", `Repeated self-healing failure thresholds exceeded. Halting dynamic autonomous loops.`, "danger");
              addLog(
                "ESCALATING",
                `[ESCALATION DISPATCHED] Formulated diagnostic logs payload. Transmitting ticket to lead Supervisor [${targetError.agentsInvolved.validate}] and opening developers pager channel.`,
                "warning"
              );
            }
          }
        ];
      }

      let idx = 0;
      runningTimer.current = setInterval(() => {
        if (idx >= workflowSteps.length) {
          if (runningTimer.current) clearInterval(runningTimer.current);
          return;
        }
        workflowSteps[idx].action();
        idx++;
      }, intervalDelay);
    };

    runWorkflow();
  };

  const handleResetSimulator = () => {
    if (runningTimer.current) clearInterval(runningTimer.current);
    setState({
      sessionId: "",
      activeStep: "IDLE",
      activeError: null,
      logs: [],
      retryCount: 0,
      maxRetries: 3,
      retryStrategy: "prompt_refining",
      patchApplied: null,
      rollbackTriggered: false,
      rollbackDetails: null,
      escalationTriggered: false,
      repeatFailuresCount: 0,
      recoveryStatus: "idle"
    });
    setActiveStepIndex(-1);
  };

  // Steps indicator config
  const stepsList: { step: HealingStep; label: string; desc: string }[] = [
    { step: "DETECTING", label: "Detect Failure", desc: "Intercept error log buffers" },
    { step: "CLASSIFYING", label: "Classify Error", desc: "Identify error categories" },
    { step: "ANALYZING_LOGS", label: "Analyze Logs", desc: "Map stacktrace coordinates" },
    { step: "GENERATING_PATCH", label: "Generate Patch", desc: "Synthesize target fix" },
    { step: "APPLYING_PATCH", label: "Apply Patch", desc: "Surgically write to file" },
    { step: "RE_RUNNING", label: "Re-run Compiler", desc: "Build workspace checks" },
    { step: "VALIDATING", label: "Validate checks", desc: "Trigger full verification" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="self_healing_panel">
      {/* Parameter Control Panel (Left Pane) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              Self‑Healing Configuration
            </h3>
          </div>

          {/* Injectable Failures Listing */}
          <div>
            <label className="text-[10.5px] font-mono text-slate-400 block mb-1.5 uppercase">
              Select Target Failure to Inject
            </label>
            <div className="space-y-2">
              {INJECTABLE_ERRORS_CATALOG.map(item => (
                <button
                  key={item.id}
                  id={`btn_select_error_${item.id}`}
                  onClick={() => setState(prev => prev.activeStep === "IDLE" ? setSelectedErrorId(item.id) : prev)}
                  disabled={state.activeStep !== "IDLE"}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start gap-2.5 cursor-pointer select-none ${
                    selectedErrorId === item.id
                      ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-100 shadow-md shadow-emerald-500/5"
                      : "bg-[#090d16] border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-[#0c1322]"
                  }`}
                >
                  <Bug className={`h-4 w-4 shrink-0 mt-0.5 ${selectedErrorId === item.id ? "text-emerald-400 animate-bounce" : "text-slate-600"}`} />
                  <div>
                    <span className="font-semibold block">{item.name}</span>
                    <span className="text-[10px] opacity-75 block line-clamp-1 mt-0.5">{item.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Selection */}
          <div>
            <label className="text-[10.5px] font-mono text-slate-400 block mb-1.5 uppercase">
              Error Mitigation Strategy
            </label>
            <select
              id="select_retry_strategy"
              value={retryStrategy}
              onChange={(e) => setRetryStrategy(e.target.value as any)}
              disabled={state.activeStep !== "IDLE"}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg font-mono text-xs text-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="prompt_refining">Refine AI Prompts on Compiler Feedbacks</option>
              <option value="exponential_backoff">Exponential Backoff Delay Threading</option>
              <option value="expanded_scope">Expand Spec Auditing Boundaries</option>
              <option value="linter_strict">Enforce strict non-emitting compiler gates</option>
            </select>
          </div>

          {/* Toggle Poisonous Regression Path */}
          <div className="bg-rose-950/5 border border-rose-950/20 p-3.5 rounded-lg flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10.5px] font-mono text-rose-400 font-semibold block uppercase flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                Simulate Poisonous Patch
              </span>
              <span className="text-[9.5px] text-slate-500 block leading-normal">
                Force applied patches to repeatedly trigger secondary errors, testing rollback engines and escalating tickets.
              </span>
            </div>
            <input
              id="checkbox_poison_simulation"
              type="checkbox"
              className="h-4 w-4 bg-[#090d16] border-slate-700/80 rounded accent-emerald-500 shrink-0 mt-0.5 cursor-pointer"
              checked={simulatePoisonousPatch}
              onChange={(e) => setSimulatePoisonousPatch(e.target.checked)}
              disabled={state.activeStep !== "IDLE"}
            />
          </div>

          {/* Execution triggers */}
          <div className="flex gap-2.5 pt-2">
            {state.activeStep === "IDLE" ? (
              <button
                id="btn_start_self_healing"
                onClick={handleStartSelfHealing}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Play className="h-3.5 w-3.5 fill-slate-950" />
                Run Self‑Healing Engine
              </button>
            ) : (
              <button
                id="btn_reset_self_healing"
                onClick={handleResetSimulator}
                className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-sans font-semibold text-xs rounded-lg border border-slate-850 transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Simulator
              </button>
            )}
          </div>
        </div>

        {/* State Machine Status Panel */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/85 space-y-3">
          <h4 className="text-[10.5px] font-mono font-semibold text-slate-400 uppercase tracking-wide">
            Telemetry Diagnostics
          </h4>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/40">
              <span className="text-slate-500 text-[10px]">RECOVERY STATUS:</span>
              <span className={`text-[10.5px] font-bold uppercase ${
                state.recoveryStatus === "success" ? "text-emerald-400" :
                state.recoveryStatus === "escalated" ? "text-rose-500 animate-pulse" :
                state.recoveryStatus === "running" ? "text-sky-400" : "text-slate-500"
              }`}>
                {state.recoveryStatus === "idle" ? "STANDBY" : state.recoveryStatus}
              </span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/40">
              <span className="text-slate-500 text-[10px]">RETRY SEQUENCE:</span>
              <span className="text-slate-350">{state.retryCount} / {state.maxRetries}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/40">
              <span className="text-slate-500 text-[10px]/snug tracking-tighter">GIT REVERT STATE:</span>
              <span className={`text-[10.5px]/snug ${state.rollbackTriggered ? "text-emerald-400 font-semibold" : "text-slate-600"}`}>
                {state.rollbackTriggered ? "REVERTED_COMMIT_8F3B2E1" : "CLEAN_HEAD"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[10px]">ACTIVE FLOW RATIO:</span>
              <span className="text-slate-400">4-Agent Thread Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Main Status Workflow Track & Diff views */}
      <div className="lg:col-span-8 space-y-6">
        {/* Dynamic Workflow Track Nodes */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85">
          <div className="flex justify-between items-center mb-5 border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[9.5px] font-mono tracking-wider text-emerald-400 uppercase font-semibold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-950">
                Workflow Controller
              </span>
              <h3 className="text-sm font-sans font-medium text-slate-100 tracking-tight mt-1">
                State Machine Action Sequence
              </h3>
            </div>
            {state.activeStep !== "IDLE" && (
              <span className="flex items-center gap-1.5 text-[10px] text-sky-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping"></span>
                STEP: {state.activeStep}
              </span>
            )}
          </div>

          {/* Interactive Steps Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
            {stepsList.map((stepItem, sIdx) => {
              const remainsIdle = state.activeStep === "IDLE";
              const matchesStep = state.activeStep === stepItem.step;
              const hasPassed = !remainsIdle && (
                stepsList.findIndex(n => n.step === state.activeStep) > sIdx || 
                state.activeStep === "RESOLVED" || 
                (state.activeStep === "ESCALATING" && sIdx < 5)
              );
              
              const stepColorClass = 
                matchesStep ? "bg-sky-950/30 border-sky-500 text-sky-205 shadow font-bold" :
                hasPassed ? "bg-emerald-950/10 border-emerald-500/40 text-emerald-100/80" :
                "bg-slate-900/10 border-slate-850 text-slate-500";

              return (
                <div
                  key={stepItem.step}
                  id={`self_healing_step_${stepItem.step}`}
                  className={`p-2 border rounded-lg flex flex-col justify-between transition-all min-h-[76px] relative overflow-hidden ${stepColorClass}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[8.5px] font-mono px-1 py-0.5 rounded bg-slate-950/40 text-slate-400 select-none">
                      0{sIdx + 1}
                    </span>
                    {hasPassed && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    )}
                    {matchesStep && (
                      <RefreshCw className="h-3 w-3 text-sky-450 animate-spin" />
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] font-bold block truncate leading-tight">{stepItem.label}</span>
                    <span className="text-[8px] opacity-60 block leading-tight truncate mt-0.5">{stepItem.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live diff workspace comparison container */}
        {state.activeError && (state.activeStep !== "DETECTING" && state.activeStep !== "CLASSIFYING") && (
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="text-[11.5px] font-mono text-slate-300 font-medium">
                  Workspace Precision Patch: <span className="text-sky-400">{state.activeError.targetFile}</span>
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">LINE #{state.activeError.offendingLineNum}</span>
            </div>

            {/* Simulated side-by-side Git Diff view */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Offending Before view */}
              <div className="bg-red-950/5 border border-red-950/20 rounded-lg overflow-hidden">
                <div className="bg-red-950/20 px-3.5 py-1.5 border-b border-red-950/30 text-[9.5px] font-mono text-rose-400 flex items-center justify-between">
                  <span>- ORIGINAL COMPILATION BREAK</span>
                  <span className="font-sans text-[8.5px] uppercase">failing</span>
                </div>
                <div className="p-3.5 font-mono text-[10.5px] space-y-1 bg-slate-950/40 overflow-x-auto min-h-[50px] flex items-center">
                  <span className="text-red-400 select-all block w-full bg-red-950/10 px-2 py-1 rounded border border-red-900/10">
                    {state.activeError.offendingCode}
                  </span>
                </div>
              </div>

              {/* Remedied After view */}
              <div className="bg-emerald-950/5 border border-emerald-500/10 rounded-lg overflow-hidden">
                <div className="bg-emerald-950/20 px-3.5 py-1.5 border-b border-emerald-500/10 text-[9.5px] font-mono text-emerald-400 flex items-center justify-between">
                  <span>+ RESOLUTION PROPOSAL (PATCH)</span>
                  <span className="font-sans text-[8.5px] uppercase font-bold">safe replacement</span>
                </div>
                <div className="p-3.5 font-mono text-[10.5px] space-y-1 bg-slate-950/40 overflow-x-auto min-h-[50px] flex items-center">
                  <span className="text-emerald-400 select-all block w-full bg-emerald-950/20 px-2 py-1 rounded border border-emerald-500/15">
                    {state.activeStep === "ROLLING_BACK" || state.activeStep === "ESCALATING" ? "/* ROLLBACK TO ORIGINAL */" : state.activeError.remediedCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Involved Cognitive Agents block */}
            <div className="mt-4 bg-[#090d16] p-3 rounded-lg border border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-mono text-[10.5px] flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                Collaborative Repair Network:
              </span>
              <div className="flex flex-wrap gap-2.5 font-mono text-[10px]">
                <span className="bg-sky-950/30 text-sky-400 px-2.5 py-0.5 rounded border border-sky-950">
                  Detect: {state.activeError.agentsInvolved.detect}
                </span>
                <span className="bg-indigo-950/30 text-indigo-400 px-2.5 py-0.5 rounded border border-[#1e1b4b]">
                  Analyze: {state.activeError.agentsInvolved.analyze}
                </span>
                <span className="bg-pink-950/30 text-pink-400 px-2.5 py-0.5 rounded border border-[#50072b]">
                  Patch: {state.activeError.agentsInvolved.patch}
                </span>
                <span className="bg-emerald-950/30 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-950">
                  Validate: {state.activeError.agentsInvolved.validate}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live Terminal Stream logs */}
        <div className="bg-[#090d16] rounded-xl border border-slate-800/90 flex flex-col h-[280px]">
          <div className="bg-[#0f172a] px-4 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-350">
              <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Self-Healing Engine Stream Output</span>
            </div>
            {state.activeStep !== "IDLE" && (
              <span className="text-[10px] text-sky-400 font-mono tracking-tighter uppercase px-2 py-0.5 rounded bg-sky-950/30 border border-sky-950">
                ACTIVE HEALING RUN
              </span>
            )}
          </div>

          <div className="p-4 overflow-y-auto flex-1 font-mono text-[10.5px] leading-relaxed space-y-2 text-slate-350">
            {/* Show compiler's failure logs first when starting */}
            {state.activeError && state.activeStep !== "IDLE" && (
              <div className="border-l-2 border-rose-500/40 pl-3 py-1 mb-3.5 bg-rose-950/5 text-rose-350 rounded-r">
                <span className="text-[9.5px] text-rose-400 font-bold block select-none uppercase">INTERCEPTED EXCEPTION TRACE:</span>
                <pre className="font-mono text-[10.5px] leading-snug whitespace-pre-wrap select-all">
                  {state.activeError.unhealedLog.trim()}
                </pre>
              </div>
            )}

            {/* Stepped Telemetry Logs */}
            {state.logs.map((log, lIdx) => {
              const textColors = {
                info: "text-slate-300",
                warning: "text-amber-400 font-medium",
                success: "text-emerald-450 font-bold",
                danger: "text-rose-500 font-extrabold"
              };

              return (
                <div key={lIdx} className="flex items-start gap-2.5 hover:bg-slate-900/10 py-0.5 select-text">
                  <span className="text-slate-600 select-none shrink-0">{log.timestamp}</span>
                  <span className="text-sky-450 shrink-0 font-bold">
                    [{log.step}]
                  </span>
                  <span className={textColors[log.level]}>
                    {log.message}
                  </span>
                </div>
              );
            })}

            {state.logs.length === 0 && (
              <div className="text-center py-10 text-slate-600 flex flex-col items-center justify-center h-full font-sans">
                <Terminal className="h-6 w-6 text-slate-700 mb-2 shrink-0" />
                <p className="text-xs">Self-healing process pipeline standby. Select an error and trigger run to start streaming...</p>
              </div>
            )}

            <div ref={logEndRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
