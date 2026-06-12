import { Agent } from "../types";

export const AGENTS_REGISTRY_DATA: Agent[] = [
  {
    id: "analyst_agent",
    name: "AnalystAgent",
    role: "Business & System Analyst",
    description: "Responsible for decomposing high-level development goals into explicit product requirements, translating user statements into developer-ready feature scopes, and auditing feasibility matrices.",
    iconName: "Search",
    capabilities: [
      "Requirement Elucidation & Decomposition",
      "Dynamic User Story Mapping",
      "Project Feature Boundary Scoping",
      "Risk Mitigation Auditing"
    ],
    toolRegistry: [
      {
        name: "read_spec_artifacts",
        purpose: "Reads specs, blueprints, or other textual inputs from workspace to parse user goals.",
        parameters: {
          spec_path: { type: "string", description: "Absolute or relative path to the spec file.", required: true }
        }
      },
      {
        name: "search_semantic_memories",
        purpose: "Searches semantic memory to cross-reference organizational standards for requirements.",
        parameters: {
          query: { type: "string", description: "Search query string.", required: true },
          threshold: { type: "number", description: "Cosine similarity cut-off filter.", required: false }
        }
      },
      {
        name: "generate_user_story_dag",
        purpose: "Transforms requirements into functional stories mapped as structured nodes.",
        parameters: {
          features: { type: "array", description: "List of feature outlines.", required: true }
        }
      }
    ],
    reasoningStrategy: {
      name: "Decoupled Analytical Story-Mapping (ReAct)",
      description: "Applies ReAct (Reason + Act) loop to isolate core assumptions, evaluate requirements from first principles, and produce dependency-free logic loops.",
      steps: [
        "Read input product blueprint or prompt.",
        "Observe ambiguities, check existing context guidelines, and retrieve historic matching stories.",
        "Query the semantic memory to establish organizational standards.",
        "Deconstruct features into topological components with explicit scope boundaries.",
        "Incorporate a failure-mode analysis as self-reflection safety guardrails."
      ]
    },
    structuredOutput: {
      schemaTitle: "AnalystOutputSpec",
      fields: [
        { name: "features_scope", type: "list[string]", description: "Formal features selected for current execution scope." },
        { name: "user_stories", type: "list[object]", description: "Formatted User Stories with acceptance criteria." },
        { name: "risk_mitigations", type: "list[object]", description: "Potential bottlenecks mapped direct to engineering safeguards." }
      ],
      mockOutputExample: {
        features_scope: [
          "Secure Express Reverse Proxy Core",
          "Decaying In-Memory Vector Storage Cache",
          "Strict Route Authorization Token Handler"
        ],
        user_stories: [
          {
            id: "US-101",
            story: "As a client developer, I want to proxy heavy HTTP traffic so that secret API tokens remain entirely hidden.",
            acceptance: [
              "Vite server on port 3000 routes dynamic handlers.",
              "Requests lack authorization key headers on client devtools."
            ]
          }
        ],
        risk_mitigations: [
          {
            risk: "Token leak through browser network trace logs.",
            mitigation: "Establish absolute port isolation on Express 0.0.0.0 route and use encrypted system env proxy."
          }
        ]
      }
    }
  },
  {
    id: "architect_agent",
    name: "ArchitectAgent",
    role: "Lead Systems Architect",
    description: "Synthesizes raw features into robust systems topologies, constructs relational database models, and translates requirements into DAG logical structures.",
    iconName: "Layers",
    capabilities: [
      "Topological DAG Plan Synthesis",
      "Database Schema & Entity Modeling",
      "Network/Interface Design",
      "Component Isolation Blueprinting"
    ],
    toolRegistry: [
      {
        name: "generate_topological_dag",
        purpose: "Accepts features and structures them into highly stable directional graphs.",
        parameters: {
          features_list: { type: "array", description: "Input features from AnalystAgent output.", required: true }
        }
      },
      {
        name: "simulate_entity_relation_model",
        purpose: "Fills in database tables, types, and constraints for ORM schemas.",
        parameters: {
          entities: { type: "array", description: "Entities list.", required: true }
        }
      }
    ],
    reasoningStrategy: {
      name: "Topological Decoupling & Kahn DAG Scheduling",
      description: "Applies topological ordering checks to prevent circular dependencies in logical steps, ensuring code remains modular, unit-testable, and isolated.",
      steps: [
        "Acknowledge target scoping deliverables.",
        "Map required dependencies for each node using directed graph linkages.",
        "Perform Kahn Algorithmic Check to identify in-degree anomalies or circular locks.",
        "Translate schema blocks into standardized relational tables or TypeScript/Python interfaces.",
        "Validate interface cohesion prior to implementation hand-off."
      ]
    },
    structuredOutput: {
      schemaTitle: "ArchitectOutputSpec",
      fields: [
        { name: "architecture_type", type: "string", description: "Design pattern selection (e.g. Serverless, Full-stack Express, Microservices)." },
        { name: "topology_nodes", type: "list[object]", description: "Generated task nodes mapping complete dependency trees." },
        { name: "data_dictionary", type: "list[object]", description: "Relational/ORM Schema variables, types, and primary-key indexes." }
      ],
      mockOutputExample: {
        architecture_type: "Full-Stack Express + Vite SPA Ingress Router",
        topology_nodes: [
          { id: "node_1", task: "Planning spec setup", dep: [] },
          { id: "node_2", task: "Database init & migrations", dep: ["node_1"] },
          { id: "node_3", task: "Core service logic router", dep: ["node_2"] }
        ],
        data_dictionary: [
          { table: "UserSessions", field: "session_id", type: "uuid", constraints: "PRIMARY KEY" },
          { table: "UserSessions", field: "cache_payload", type: "jsonb", constraints: "NOT NULL" }
        ]
      }
    }
  },
  {
    id: "coder_agent",
    name: "CoderAgent",
    role: "Senior Code Implementation Specialist",
    description: "Translates technical architectures into elegant, compile-ready code bases. Operates with surgery-like precision to patch files without full-rewrite overhead.",
    iconName: "Code",
    capabilities: [
      "State-Action Code Synthesis",
      "Incremental Precision Patches",
      "Dependency Management & Resolution",
      "Module-boundary Encapsulation"
    ],
    toolRegistry: [
      {
        name: "create_workspace_file",
        purpose: "Generates clean, modular TypeScript or Python code files inside sandbox structure.",
        parameters: {
          file_path: { type: "string", description: "Relative path from workspace root.", required: true },
          content: { type: "string", description: "Full complete file content.", required: true }
        }
      },
      {
        name: "patch_file_content",
        purpose: "Performs contiguous replacement on target string block.",
        parameters: {
          file_path: { type: "string", description: "Path to file.", required: true },
          target_code: { type: "string", description: "Precise old target code sequence.", required: true },
          replacement_code: { type: "string", description: "New replacement code.", required: true }
        }
      },
      {
        name: "install_dependency_pckg",
        purpose: "Installs packages as dependencies inside package.json.",
        parameters: {
          packages: { type: "array", description: "List of NPM/Pip package names.", required: true }
        }
      }
    ],
    reasoningStrategy: {
      name: "Surgical Pathing & Pure Function Structuring",
      description: "Employs modular encapsulation to write highly isolated blocks of logic, preventing system coupling and guaranteeing zero state pollution.",
      steps: [
        "Inspect target files using read-modify-write safety loops.",
        "Map required external imports and construct isolated helper states.",
        "Isolate business logic out of UI hooks to avoid re-rendering anomalies.",
        "Surgically write code blocks, avoiding total file replacement schemas.",
        "Validate correct module exports and imports on related paths."
      ]
    },
    structuredOutput: {
      schemaTitle: "CoderOutputSpec",
      fields: [
        { name: "status", type: "string", description: "Write operations summary (SUCCESS/FAILURE)." },
        { name: "files_created", type: "list[string]", description: "New relative file paths compiled into the tree." },
        { name: "diff_lines_touched", type: "number", description: "Total count of modified, added, or patched line numbers." },
        { name: "re_exports_registered", type: "list[string]", description: "Index exports mounted in public APIs." }
      ],
      mockOutputExample: {
        status: "SUCCESS",
        files_created: ["/src/lib/proxy_router.ts", "/src/utils/crypt_helper.ts"],
        diff_lines_touched: 242,
        re_exports_registered: ["proxy_router"]
      }
    }
  },
  {
    id: "debugger_agent",
    name: "DebuggerAgent",
    role: "Core diagnostics & Exception Specialist",
    description: "Analyzes diagnostic execution loops, traces type collisions, resolves stack-track breaks, and repairs runtime runtime traps.",
    iconName: "ShieldAlert",
    capabilities: [
      "Logical Loop Tracing",
      "StackTrace Component Parsing",
      "Linter-compliant Type Resolution",
      "Constraint Logic Repairs"
    ],
    toolRegistry: [
      {
        name: "parse_runtime_logs",
        purpose: "Scans stderr error buffers to locate exact code file path and line coordinates.",
        parameters: {
          log_data: { type: "string", description: "Raw terminal stacktrace output.", required: true }
        }
      },
      {
        name: "check_typescript_types",
        purpose: "Invokes compilation checker in non-emitting mode to capture static errors.",
        parameters: {
          file_scope: { type: "string", description: "Limit linter check to specific files.", required: false }
        }
      }
    ],
    reasoningStrategy: {
      name: "Hypothesis-driven Diagnostic Elimination",
      description: "Generates causal graphs for errors, ranks variables by probability of structural fault, and tests hypotheses sequentially through surgical patches.",
      steps: [
        "Inquire stacktrace to capture breaking line references.",
        "Formulate potential logical bug hypotheses based on input boundaries.",
        "Trace type interfaces for strict consistency and identify any silent type casting flaws.",
        "Check that parameters in runtime tools are non-null and matches requirements.",
        "Draft localized regression patches and invoke linter checking steps."
      ]
    },
    structuredOutput: {
      schemaTitle: "DebuggerOutputSpec",
      fields: [
        { name: "root_cause_found", type: "string", description: "Comprehensive statement detailing the error context." },
        { name: "offending_coordinates", type: "object", description: "Filename, line, and character index causing compile breaks." },
        { name: "suggested_type_fix", type: "string", description: "Code block suggested for patch application." },
        { name: "verification_checks_passed", type: "boolean", description: "Whether the linter compiled successfully post-fix." }
      ],
      mockOutputExample: {
        root_cause_found: "TypeScript type 'null' was not union-handled inside the decay_factor state property.",
        offending_coordinates: { file: "/src/types.ts", line_num: 50, char_index: 18 },
        suggested_type_fix: "decay_factor: number | null;",
        verification_checks_passed: true
      }
    }
  },
  {
    id: "security_agent",
    name: "SecurityAgent",
    role: "SecOps Threat Auditor",
    description: "Monitors workspace compliance against secure coding guidelines, audits API scopes, inspects for plaintext keys, and hardens Firestore database rules.",
    iconName: "ShieldCheck",
    capabilities: [
      "OWASP Vulnerability Audit",
      "Plaintext Credentials Scanner",
      "Authorization Scopes Integrity Validation",
      "Custom Sandbox Access Safeguards"
    ],
    toolRegistry: [
      {
        name: "scan_plaintext_secrets",
        purpose: "Searches directories for accidentally committed raw API keys, secrets, or certificates.",
        parameters: {
          search_scope: { type: "string", description: "Relative directory path (defaults to root).", required: false }
        }
      },
      {
        name: "verify_firestore_rules",
        purpose: "Audits security bounds on firestore.rules file to detect open read/write exploits.",
        parameters: {
          rules_content: { type: "string", description: "Text contents of security rule file.", required: true }
        }
      }
    ],
    reasoningStrategy: {
      name: "Threat Modeling & Zero-Trust Verification",
      description: "Assumes zero-trust boundaries on all client/server ingress points, validating that operations are scoped, authenticated, and logged securely.",
      steps: [
        "Map active data endpoints inside the application router.",
        "Scan variable references for naming prefixes indicating critical environmental tokens.",
        "Formulate trust limits, ensuring client components never load unmasked API tokens.",
        "Audit file ownership and access rules inside storage schemas.",
        "Compile SecOps diagnostic matrix with remediation directives."
      ]
    },
    structuredOutput: {
      schemaTitle: "SecurityOutputSpec",
      fields: [
        { name: "vulnerability_index", type: "number", description: "Composite score from 0.0 (Perfect) to 10.0 (Critical Threat)." },
        { name: "secrets_leaks", type: "list[object]", description: "List of raw strings matching credentials pattern markers." },
        { name: "remediations", type: "list[string]", description: "Direct engineering steps required to secure target directories." }
      ],
      mockOutputExample: {
        vulnerability_index: 0.0,
        secrets_leaks: [],
        remediations: [
          "Mask OAuth state keys under server proxy routes.",
          "Restrict write access in firestore.rules only based on request.auth.uid context."
        ]
      }
    }
  },
  {
    id: "devops_agent",
    name: "DevOpsAgent",
    role: "Cloud Infrastructure Specialist",
    description: "Configures stand-alone container setups, checks port routing guidelines, structures automated staging pipelines, and tests development proxy ingress layers.",
    iconName: "Server",
    capabilities: [
      "Container Ingress Layout Setup",
      "Port Compliance Verification (Strict 3000)",
      "CI/CD Pipeline Composition",
      "Environment Var Declarations"
    ],
    toolRegistry: [
      {
        name: "generate_container_manifests",
        purpose: "Outputs Dockerfile and Nginx setup scripts tailored to isolated reverse proxy.",
        parameters: {
          target_port: { type: "number", description: "Port designation. Must conform strictly to port 3000.", required: true }
        }
      },
      {
        name: "validate_host_binds",
        purpose: "Checks package and dev settings to confirm the host binds to 0.0.0.0 and port 3000.",
        parameters: {
          config_path: { type: "string", description: "Path to configuration file to scan.", required: true }
        }
      }
    ],
    reasoningStrategy: {
      name: "Isolated-Port Compliance Scheduling",
      description: "Strict enforcement of local and container routing constraints, ensuring port interfaces never diverge from standard nginx proxy mapping models.",
      steps: [
        "Acknowledge the immutable ingress binding standard (port 3000 / 0.0.0.0).",
        "Inspect project config files to resolve conflicts on secondary ports.",
        "Bootstrap lightweight node environment vars into .env.example templates.",
        "Simulate system cold-starts and identify sluggish volume mounts.",
        "Synthesize health-check endpoints for telemetry tracking."
      ]
    },
    structuredOutput: {
      schemaTitle: "DevOpsOutputSpec",
      fields: [
        { name: "docker_base_image", type: "string", description: "NPM/Node base version container reference." },
        { name: "ingress_routing_ok", type: "boolean", description: "Whether the dev server is bound exclusively to port 3000." },
        { name: "defined_env_samples", type: "list[string]", description: "Environment variables loaded into the example template." }
      ],
      mockOutputExample: {
        docker_base_image: "node:22-alpine",
        ingress_routing_ok: true,
        defined_env_samples: [
          "GEMINI_API_KEY",
          "PORT"
        ]
      }
    }
  },
  {
    id: "documentation_agent",
    name: "DocumentationAgent",
    role: "Technical Documentation Engineer",
    description: "Extracts system dependencies directly from active directories, catalogs API routes, and synthesizes intuitive manuals, guides, and README files.",
    iconName: "Terminal",
    capabilities: [
      "Markdown Artifact Generation",
      "JSON Schema Schema Documenting",
      "Changelog Registry Tracking",
      "UX Feature Walkthrough Mapping"
    ],
    toolRegistry: [
      {
        name: "create_markdown_docs",
        purpose: "Generates high-contrast styled documentation files in workspace.",
        parameters: {
          doc_path: { type: "string", description: "Relative file path.", required: true },
          markdown_content: { type: "string", description: "Document body.", required: true }
        }
      },
      {
        name: "catalog_source_headers",
        purpose: "Reads documentation headers and docstrings directly from files.",
        parameters: {
          directory_scope: { type: "string", description: "Sub-directory path to catalog.", required: true }
        }
      }
    ],
    reasoningStrategy: {
      name: "Self-documenting System Extraction",
      description: "Extracts architectural footprints directly from code bases so that docs never diverge from live production states.",
      steps: [
        "Parse file listings and identify primary export declarations.",
        "Gather interface constraints from shared type libraries.",
        "Summarize operational goals of each component in plain, humble, human-friendly narratives.",
        "Organize code signatures as clean Markdown tables with comprehensive descriptive fields.",
        "Review vocabulary against the system naming guide (avoiding over-dramatic marketing hype)."
      ]
    },
    structuredOutput: {
      schemaTitle: "DocumentationOutputSpec",
      fields: [
        { name: "files_analyzed", type: "list[string]", description: "Files read to synthesize information." },
        { name: "sections_compiled", type: "list[string]", description: "Headers generated in the resulting markdown file." },
        { name: "readability_grade", type: "string", description: "Grade of clear, jargon-free readability output." }
      ],
      mockOutputExample: {
        files_analyzed: [
          "/src/types.ts",
          "/src/data/capabilities.ts"
        ],
        sections_compiled: [
          "System Architecture Overview",
          "Types and Payload Contracts",
          "Standard Operating Routines"
        ],
        readability_grade: "Clear, Conversational, Developer-focused"
      }
    }
  },
  {
    id: "project_manager_agent",
    name: "ProjectManagerAgent",
    role: "Supervisor & Sprint Delivery Manager",
    description: "Evaluates definition-of-done metrics, calculates sprint velocity, schedules parallel sub-graphs of work, and prepares sprint-ending logs and signoffs.",
    iconName: "Clock",
    capabilities: [
      "Critical-Path Scheduling Optimization",
      "Acceptance Criteria Verification",
      "Velocity & BurnDown Calculations",
      "Sprint Milestones Signoff Mapping"
    ],
    toolRegistry: [
      {
        name: "calculate_sprint_metrics",
        purpose: "Tallies completed task points versus remaining backlogs to calculate burndown values.",
        parameters: {
          completed_tasks_count: { type: "number", description: "Total finished stories.", required: true },
          total_tasks_count: { type: "number", description: "Dataset sizing.", required: true }
        }
      },
      {
        name: "verify_acceptance_safeguards",
        purpose: "Cross-checks compiled features scope against linter results to complete definition of done.",
        parameters: {
          passed_lint_audit: { type: "boolean", description: "Linter status.", required: true },
          passed_build_audit: { type: "boolean", description: "Build compiler status.", required: true }
        }
      }
    ],
    reasoningStrategy: {
      name: "Milestone-driven Critical Path Synthesis",
      description: "Structures parallel task nodes to maximize developer output while verifying strict quality bounds prior to sprint closure.",
      steps: [
        "Tally story backlogs inside execution graph scopes.",
        "Track concurrent tracks of execution to locate critical constraints.",
        "Triage blockers by rerouting secondary dependency schedules dynamically.",
        "Verify compiled outputs pass system linting and integration audits.",
        "Produce detailed sprint summary reports matching team delivery targets."
      ]
    },
    structuredOutput: {
      schemaTitle: "ProjectManagerOutputSpec",
      fields: [
        { name: "total_sprint_stories", type: "number", description: "Number of stories in sprint backlog." },
        { name: "definition_of_done_achieved", type: "boolean", description: "Whether all strict quality checks compiled correctly." },
        { name: "critical_path_integrity", type: "string", description: "Statement detailing graph performance and concurrency gains." },
        { name: "signoff_ready", type: "boolean", description: "Indicates readiness for production environment release." }
      ],
      mockOutputExample: {
        total_sprint_stories: 8,
        definition_of_done_achieved: true,
        critical_path_integrity: "Excellent. Parallel scheduling of Coder and Tester nodes saved 35% execution overhead.",
        signoff_ready: true
      }
    }
  }
];
