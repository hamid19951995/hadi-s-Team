import { CapabilityItem } from "../types";

export const CAPABILITY_MATRIX_DATA: CapabilityItem[] = [
  {
    id: "cap_plan",
    name: "Architectural Goal Decomposer",
    subsystem: "Task Graph Engine",
    agent: "PlannerAgent",
    tool: "view_file / list_dir",
    data_flow: "User Goal -> Planner LLM -> Topological Scheduler -> Dependency DAG Map",
    responsibilities: [
      "Decompose high-level project specs into explicit, bite-sized engineering target packages",
      "Identify topological orderings and strict child-parent dependencies",
      "Bootstrap custom workspaces, configuration settings, and initial environment scripts"
    ],
    inputs: {
      "goal": "String containing user's high-level product blueprint",
      "project_state": "ProjectState schema outlining the current file tree and configuration overrides"
    },
    outputs: {
      "dag_id": "UUID identifying the initialized execution campaign",
      "task_nodes": "Array of TaskNode configurations aligned by dependency indices"
    },
    dependencies: ["Memory Manager (Retrieve procedural templates)", "Provider Router (LLM parsing)"],
    failure_modes: [
      "Infinite planner iteration cycles if goals are contradictory (Mitigated by structural iteration caps)",
      "Circular dependency chains (Resolved during DAG generation via Kahn's Topological validator)"
    ]
  },
  {
    id: "cap_code",
    name: "Autonomous Implementation Pipeline",
    subsystem: "Agent Dispatcher",
    agent: "CoderAgent",
    tool: "create_file / edit_file",
    data_flow: "Assigned Task -> Code Generator LLM -> Filesystem Tool Executor -> File Tree Updates",
    responsibilities: [
      "Translate task specifications into strict syntax-compliant TypeScript or Python modular files",
      "Apply surgical precision patches on existing files avoiding total rewrites",
      "Configure standard package modules, index exports, and environment variables"
    ],
    inputs: {
      "task": "AgentTask specification with titles, descriptions, and file guidelines",
      "context_memories": "List of retrieved semantic facts, workspace conventions, and design records"
    },
    outputs: {
      "result": "AgentResult with resolution summaries, write operations counts, and error reports"
    },
    dependencies: ["Tool Executor (FS access)", "Provider Router (Code generation LLM)"],
    failure_modes: [
      "Stale context edit conflicts (Resolved by read-modify-write protocols)",
      "Hallucinated helper references (Mitigated by parsing codebase index references)"
    ]
  },
  {
    id: "cap_test",
    name: "Harness Framework Synthesizer",
    subsystem: "Agent Dispatcher",
    agent: "TesterAgent",
    tool: "create_file / execute_tests",
    data_flow: "Product Modules -> Test Synthesizer LLM -> Safe Sandbox Execution -> Test Metrics",
    responsibilities: [
      "Generate unit, integration, and end-to-end regression testing assets",
      "Bootstrap mock networks, isolated databases, and stub configurations for safe verification",
      "Quantify assertion logs and report syntax blocks or state breakdowns"
    ],
    inputs: {
      "target_code_files": "Map or absolute paths pointing to active functional modules",
      "requirements": "Target behaviors, expected invariants, and failure boundaries"
    },
    outputs: {
      "test_suite_status": "Summary reporting testing coverage rates, failing cases, and logs output"
    },
    dependencies: ["Tool Executor", "Provider Router"],
    failure_modes: [
      "Infinite recursive mock loops (Mitigated by enforcing rigid mock timeouts)",
      "Flaky testing boundaries on async logic (Resolved via wait-for-duration threshold standards)"
    ]
  },
  {
    id: "cap_audit",
    name: "Sandbox Integration & Compilation Auditor",
    subsystem: "Tool Executor",
    agent: "Orchestrator Control",
    tool: "compile_applet",
    data_flow: "Modified Source Tree -> Sandbox Compiler -> Error Trace Parsers -> Diagnostic Reports",
    responsibilities: [
      "Invoke system compilation chains in isolated execution sandboxes",
      "Intercept compiler stderr buffers, syntax warnings, and package import resolution faults",
      "Trace compilation breaks back to offending files and line coordinates"
    ],
    inputs: {
      "source_files": "Active dictionary of workspace files and package.json dependency listings",
      "compiler_flags": "String collection customizing strict checks or target output versions"
    },
    outputs: {
      "audit_payload": "Detailing build status (SUCCESS/FAILURE), bundle ratios, and rich diagnostic traces"
    },
    dependencies: ["Tool Sandbox Runner"],
    failure_modes: [
      "Dependency resolution failures (Mitigated by pre-analyzing node import declarations)",
      "Unresponsive build commands (Aborted cleanly via strict execution timeout bounds)"
    ]
  },
  {
    id: "cap_memory",
    name: "Multi-Zone Cognitive Memory Store",
    subsystem: "Memory Manager",
    agent: "Orchestrator & Agents",
    tool: "None (Internal API)",
    data_flow: "Execution Log / Workspace Event -> Memory Embedder -> Decaying Multi-Zone Storage Cache",
    responsibilities: [
      "Partition mental assets across Working, Episodic, Semantic, and Procedural caches",
      "Execute decay formulas based on retrieval counters and chronological age to clear cache clutter",
      "Synthesize short-term Working logs into robust long-term Semantic facts on cycle completions"
    ],
    inputs: {
      "memory_content": "Text representation summarizing facts, execution trace, or system behaviors",
      "zone_type": "MemoryType classifying the target storage duration and access route"
    },
    outputs: {
      "stored_entry": "MemoryEntry containing unique lookup UUID, decay settings, and timestamp trackers"
    },
    dependencies: ["None (Pure Core In-Memory Class)"],
    failure_modes: [
      "Topic clutter saturation (Resolved by applying dynamic decay coefficients)",
      "Stale or incorrect facts consolidation (Mitigated by strict LLM-based audit verification filters)"
    ]
  }
];
