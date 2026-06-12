export type ToolId =
  | "FilesystemTool"
  | "GitTool"
  | "DockerTool"
  | "TerminalTool"
  | "TestRunnerTool"
  | "PackageManagerTool"
  | "CodeSearchTool";

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "select" | "array";
  description: string;
  required: boolean;
  options?: string[]; // for select dropdowns
  defaultValue?: any;
}

export interface ToolSafetyPolicy {
  level: "low" | "medium" | "high" | "danger";
  description: string;
  requiresUserConfirmation: boolean;
  restrictedCommands?: string[];
  sandboxIsolationScope: string;
}

export interface ToolLogEntry {
  id: string;
  timestamp: string;
  toolId: ToolId;
  actionName: string;
  parameters: Record<string, any>;
  safetyCheckPassed: boolean;
  executionStatus: "success" | "failed" | "aborted" | "pending_confirmation";
  durationMs: number;
  stdout?: string;
  stderr?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  output: Record<string, any>;
  logs: ToolLogEntry[];
  error?: string;
}

export interface ModularTool {
  id: ToolId;
  name: string;
  description: string;
  inputSchema: Record<string, ToolParameter>;
  outputSchema: Record<string, { type: string; description: string }>;
  safetyPolicy: ToolSafetyPolicy;
  execute: (params: Record<string, any>, confirmCallback?: () => boolean) => Promise<ToolExecutionResult>;
}

// ---------------------------------------------------------
// Global Simulated Filesystem and Environment Data (V8 client state)
// ---------------------------------------------------------
export const SIMULATED_FILESYSTEM: Record<string, string> = {
  "/src/App.tsx": "import React from 'react';\nexport default function App() {\n  return <div>Modular Tool App</div>;\n}",
  "/src/types.ts": "export enum NodeStatus { IDLE = 'idle', RUNNING = 'running' }",
  "/package.json": '{\n  "name": "modular-tool-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0"\n  }\n}',
  "/firestore.rules": "service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if false; } } }",
  "/Dockerfile": "FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nEXPOSE 3000\nCMD [\"npm\", \"start\"]",
};

export const SIMULATED_COMMITS = [
  { hash: "8f3b2e1", message: "Initial commit with schema structure", author: "Dev-Lead", date: "2026-06-10" },
  { hash: "c92d5c7", message: "Implement multi-provider AI adapters to routes", author: "Senior Architect", date: "2026-06-11" },
];

export const SIMULATED_DOCKER_CONTAINERS = [
  { id: "e1a90c23bc89", name: "v8-compiler-sandbox", image: "node:20-alpine", status: "running", ports: "3000:3000" },
  { id: "f7be81c002bc", name: "redis-cache-tier", image: "redis:7-alpine", status: "stopped", ports: "6379:6379" },
];

// Helper to filter dangerous keywords in commands
const checkCommandSecurity = (cmd: string): { safe: boolean; reason?: string } => {
  const dangerousPatterns = [
    "rm -rf /", ":(){ :|:& };:", "dd if=", "mkfs", "chmod 777 /",
    "sudo", "> /dev/sda", "shutdown", "reboot", "wget http", "curl http"
  ];
  for (const pattern of dangerousPatterns) {
    if (cmd.includes(pattern)) {
      return { safe: false, reason: `Command rejected. Matches high-risk pattern: '${pattern}' (Strict Security Sandboxing policy)` };
    }
  }
  return { safe: true };
};

// ---------------------------------------------------------
// Tools Implementations
// ---------------------------------------------------------
export const MODULAR_TOOLS_REGISTRY: Record<ToolId, ModularTool> = {
  FilesystemTool: {
    id: "FilesystemTool",
    name: "Filesystem Operator Tool",
    description: "Read, write, edit, delete, or list files in the sandboxed local repository structure.",
    inputSchema: {
      action: {
        type: "select",
        description: "Standard disk target action operation to execute.",
        required: true,
        options: ["read", "write", "list", "delete"],
        defaultValue: "read",
      },
      filePath: {
        type: "string",
        description: "Absolute relative file path target.",
        required: true,
        defaultValue: "/src/App.tsx",
      },
      content: {
        type: "string",
        description: "New code content string parameter to record (required for write mode).",
        required: false,
        defaultValue: "",
      },
    },
    outputSchema: {
      success: { type: "boolean", description: "Whether the file write or delete operation succeeded." },
      content: { type: "string", description: "The returned file body string (under read action mode)." },
      filePaths: { type: "array", description: "All active matched workspace paths (under list action mode)." },
    },
    safetyPolicy: {
      level: "medium",
      description: "Restricted workspace scope. Absolute system root routes blocked. Modifying package.json or firestore.rules requires manual confirmation.",
      requiresUserConfirmation: true,
      sandboxIsolationScope: "Project root workspace context path: /.*",
    },
    execute: async (params, confirmCallback) => {
      const startTime = Date.now();
      const action = params.action as string;
      const path = params.filePath as string;
      const cnt = params.content as string;

      // Create initial pending log
      const initialLog: ToolLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        toolId: "FilesystemTool",
        actionName: action,
        parameters: { action, path, hasContent: !!cnt },
        safetyCheckPassed: true,
        executionStatus: "success",
        durationMs: 0
      };

      if ((action === "write" || action === "delete") && confirmCallback) {
        const approved = confirmCallback();
        if (!approved) {
          initialLog.executionStatus = "aborted";
          initialLog.durationMs = Date.now() - startTime;
          return {
            success: false,
            output: {},
            logs: [initialLog],
            error: "Operation cancelled: Human safety gate denied write/delete authorization.",
          };
        }
      }

      let returnedOutput: Record<string, any> = {};
      try {
        if (action === "read") {
          const body = SIMULATED_FILESYSTEM[path];
          if (body === undefined) {
            throw new Error(`Path '${path}' does not exist inside our client-side storage mock.`);
          }
          returnedOutput = { success: true, content: body };
        } else if (action === "write") {
          if (!cnt) {
            throw new Error(`Writing file requires providing parameter: 'content'.`);
          }
          SIMULATED_FILESYSTEM[path] = cnt;
          returnedOutput = { success: true, message: `Successfully updated simulated file: '${path}'` };
        } else if (action === "list") {
          returnedOutput = { success: true, filePaths: Object.keys(SIMULATED_FILESYSTEM) };
        } else if (action === "delete") {
          if (SIMULATED_FILESYSTEM[path] === undefined) {
            throw new Error(`Path '${path}' not found to delete.`);
          }
          delete SIMULATED_FILESYSTEM[path];
          returnedOutput = { success: true, message: `Successfully deleted file path '${path}'` };
        } else {
          throw new Error(`Unsupported filesystem action directive: '${action}'`);
        }

        initialLog.stdout = `FSOperator successfully resolved action ${action} on path: ${path}`;
        initialLog.durationMs = Date.now() - startTime;
        return { success: true, output: returnedOutput, logs: [initialLog] };
      } catch (fErr: any) {
        initialLog.executionStatus = "failed";
        initialLog.stderr = fErr.message;
        initialLog.durationMs = Date.now() - startTime;
        return { success: false, output: {}, logs: [initialLog], error: fErr.message };
      }
    },
  },

  GitTool: {
    id: "GitTool",
    name: "Git VCS Engine",
    description: "Manage simulated repositories, execute branches, logs, stage files, or submit commits.",
    inputSchema: {
      command: {
        type: "select",
        description: "The sub-VCS git flow to handle.",
        required: true,
        options: ["status", "commit", "branch", "log", "push"],
        defaultValue: "status",
      },
      message: {
        type: "string",
        description: "Commit message description.",
        required: false,
        defaultValue: "refactor: optimize routing fallback tolerances",
      },
      targetBranch: {
        type: "string",
        description: "Target branch identifier name.",
        required: false,
        defaultValue: "main",
      },
    },
    outputSchema: {
      success: { type: "boolean", description: "VCS update commit loop status" },
      stdout: { type: "string", description: "Formatted command terminal stream feedback results" },
    },
    safetyPolicy: {
      level: "medium",
      description: "Push triggers remote pipeline. Restricted branches ('origin/release') require authenticated token variables on system keys.",
      requiresUserConfirmation: false,
      sandboxIsolationScope: "Git virtual local folder index mapping.",
    },
    execute: async (params) => {
      const startTime = Date.now();
      const command = params.command as string;
      const msg = params.message as string;
      const branchName = params.targetBranch as string;

      const runLog: ToolLogEntry = {
        id: `git_${Date.now()}`,
        timestamp: new Date().toISOString(),
        toolId: "GitTool",
        actionName: `git ${command}`,
        parameters: { command, msg, branchName },
        safetyCheckPassed: true,
        executionStatus: "success",
        durationMs: 0
      };

      let stdout = "";
      let outputObj: Record<string, any> = {};

      if (command === "status") {
        stdout = `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\tmodified:   /src/App.tsx\n\nno changes added to commit (use "git add" and/or "git commit -a")`;
        outputObj = { success: true, clean: false, activeBranch: "main" };
      } else if (command === "commit") {
        const hash = Math.random().toString(16).substring(2, 9);
        const newC = { hash, message: msg || "refactor update", author: "Interactive Core UI", date: new Date().toISOString().split("T")[0] };
        SIMULATED_COMMITS.unshift(newC);
        stdout = `[main ${hash}] ${msg}\n 1 file changed, 10 insertions(+), 2 deletions(-)\n create mode 100644 /src/lib/tool-system.ts`;
        outputObj = { success: true, createdHash: hash, commitsCount: SIMULATED_COMMITS.length };
      } else if (command === "branch") {
        stdout = `* main\n  development\n  feature/modular-tool-system\n  feature/rate-limiting-ai`;
        outputObj = { success: true, branches: ["main", "development", "feature/modular-tool-system"] };
      } else if (command === "log") {
        stdout = SIMULATED_COMMITS.map(c => `commit ${c.hash}\nAuthor: ${c.author} <developer@ai-build-sandbox.internal>\nDate:   ${c.date}\n\n    ${c.message}\n`).join("\n");
        outputObj = { success: true, count: SIMULATED_COMMITS.length };
      } else if (command === "push") {
        stdout = `Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nDelta compression using up to 10 threads\nCompressing objects: 100% (3/3), done.\nWriting objects: 100% (3/3), 422 bytes | 422.00 KiB/s, done.\nTo https://github.com/ai-studio/modular-agents.git\n   c06fe1..8f3b2e1  main -> main`;
        outputObj = { success: true, destination: "https://github.com/ai-studio/modular-agents.git" };
      }

      runLog.stdout = stdout;
      runLog.durationMs = Date.now() - startTime;
      return { success: true, output: outputObj, logs: [runLog] };
    },
  },

  DockerTool: {
    id: "DockerTool",
    name: "Docker Container Manager",
    description: "Launch container builds, compile images, list status processes, or terminate containers.",
    inputSchema: {
      action: {
        type: "select",
        description: "Operation action to perform with the hypervisor daemon.",
        required: true,
        options: ["ps", "run", "build", "stop"],
        defaultValue: "ps",
      },
      imageName: {
        type: "string",
        description: "Image target name context (such as node:20-alpine).",
        required: false,
        defaultValue: "node:20-alpine",
      },
      portsMapping: {
        type: "string",
        description: "Host mapping of listening container ports.",
        required: false,
        defaultValue: "3000:3000",
      },
    },
    outputSchema: {
      success: { type: "boolean", description: "Hypervisor resolve confirmation state." },
      containers: { type: "array", description: "Detailed structural list maps of simulated containers." },
    },
    safetyPolicy: {
      level: "high",
      description: "Docker socket mapping is isolated down. Users are strictly disallowed from binding privileged host namespaces or root filesystems.",
      requiresUserConfirmation: true,
      sandboxIsolationScope: "Docker client simulated socket layers: unix:///var/run/docker.sock",
    },
    execute: async (params, confirmCallback) => {
      const startTime = Date.now();
      const action = params.action as string;
      const img = params.imageName as string;
      const port = params.portsMapping as string;

      const runLog: ToolLogEntry = {
        id: `docker_${Date.now()}`,
        timestamp: new Date().toISOString(),
        toolId: "DockerTool",
        actionName: `docker ${action}`,
        parameters: { action, img, port },
        safetyCheckPassed: true,
        executionStatus: "success",
        durationMs: 0
      };

      if (confirmCallback) {
        const approved = confirmCallback();
        if (!approved) {
          runLog.executionStatus = "aborted";
          runLog.durationMs = Date.now() - startTime;
          return {
            success: false,
            output: {},
            logs: [runLog],
            error: "Docker execution denied by manual gate check. Container initialization cancelled."
          };
        }
      }

      let stdout = "";
      let outputObj: Record<string, any> = {};

      if (action === "ps") {
        stdout = `CONTAINER ID   IMAGE             COMMAND                  CREATED         STATUS         PORTS                    NAMES\n`;
        stdout += SIMULATED_DOCKER_CONTAINERS.map(c => `${c.id.substring(0, 12)}   ${c.image.padEnd(15)}   "docker-entrypoint…"   2 hours ago     Up 2 hours     ${c.ports.padEnd(22)}   ${c.name}`).join("\n");
        outputObj = { success: true, containers: SIMULATED_DOCKER_CONTAINERS };
      } else if (action === "run") {
        const randId = Math.random().toString(16).substring(2, 14);
        const newC = { id: randId, name: `agent-run-${randId.substring(0,6)}`, image: img, status: "running", ports: port || "3000:3000" };
        SIMULATED_DOCKER_CONTAINERS.push(newC);
        stdout = `Unable to find image '${img}' locally\n${img}: Pulling from library\nDigest: sha256:4a38cb617cf9c2b9a7c36b\nStatus: Downloaded newer image for ${img}\n${randId}`;
        outputObj = { success: true, spawnedContainerId: randId, details: newC };
      } else if (action === "build") {
        stdout = `Sending build context to Docker daemon  24.9kB\nStep 1/5 : FROM node:20-alpine\n ---> c0f3bb7899\nStep 2/5 : WORKDIR /app\n ---> Running in 8b9f0d1ea1\nStep 3/5 : COPY . .\n ---> 0fbe19bc7e\nStep 4/5 : RUN npm install\n ---> Running in f72b0c19a0\nadded 184 packages double pruned in 1.42s\nStep 5/5 : EXPOSE 3000\n ---> Running in e38d17ba01\nSuccessfully built e38d17ba01\nSuccessfully tagged local-compiled-agent:latest`;
        outputObj = { success: true, taggedImage: "local-compiled-agent:latest" };
      } else if (action === "stop") {
        const hasContainer = SIMULATED_DOCKER_CONTAINERS.length > 0;
        if (hasContainer) {
          const popped = SIMULATED_DOCKER_CONTAINERS.pop();
          stdout = popped ? `${popped.id}` : "";
          outputObj = { success: true, stoppedContainerId: popped?.id };
        } else {
          stdout = "No runtime active containers found to shut down.";
          outputObj = { success: false };
        }
      }

      runLog.stdout = stdout;
      runLog.durationMs = Date.now() - startTime;
      return { success: true, output: outputObj, logs: [runLog] };
    },
  },

  TerminalTool: {
    id: "TerminalTool",
    name: "Terminal Shell Execution Service",
    description: "Launch low-level non-blocking shell subprocesses directly inside the runtime VM context.",
    inputSchema: {
      command: {
        type: "string",
        description: "Base inline shell command string to execute.",
        required: true,
        defaultValue: "npx vitest run /src/tests/TopologicalSort.spec.ts --run",
      },
      runInBackground: {
        type: "boolean",
        description: "Allows the execution block to spawn detached async process logs.",
        required: false,
        defaultValue: false,
      }
    },
    outputSchema: {
      stdout: { type: "string", description: "Compiled standard out terminal stream results." },
      stderr: { type: "string", description: "Terminal failure logs standard error stream." },
      exitCode: { type: "number", description: "Operating system termination return state." }
    },
    safetyPolicy: {
      level: "danger",
      description: "Direct terminal access capability. All commands pass through an internal AST filter checking for folder deletions or high-risk credential scrapes.",
      requiresUserConfirmation: true,
      sandboxIsolationScope: "Isolated sub-process fork container bash context. Port boundaries: ONLY 3000.",
    },
    execute: async (params, confirmCallback) => {
      const startTime = Date.now();
      const cmd = params.command as string;
      const isBg = !!params.runInBackground;

      const runLog: ToolLogEntry = {
        id: `term_${Date.now()}`,
        timestamp: new Date().toISOString(),
        toolId: "TerminalTool",
        actionName: "shell_execute",
        parameters: { command: cmd, runInBackground: isBg },
        safetyCheckPassed: true,
        executionStatus: "success",
        durationMs: 0
      };

      // 1. Guard check for unsafe pattern keywords
      const securityCheck = checkCommandSecurity(cmd);
      if (!securityCheck.safe) {
        runLog.safetyCheckPassed = false;
        runLog.executionStatus = "aborted";
        runLog.stderr = securityCheck.reason;
        runLog.durationMs = Date.now() - startTime;
        return { success: false, output: { exitCode: 127 }, logs: [runLog], error: securityCheck.reason };
      }

      // 2. Human validation gate
      if (confirmCallback) {
        const approved = confirmCallback();
        if (!approved) {
          runLog.executionStatus = "aborted";
          runLog.durationMs = Date.now() - startTime;
          return {
            success: false,
            output: {},
            logs: [runLog],
            error: "Action aborted. Shell directive denied credentials token authentication."
          };
        }
      }

      let stdout = "";
      let stderr = "";
      let exitCode = 0;

      if (cmd.startsWith("ls")) {
        stdout = "dist/\nnode_modules/\nsrc/\npackage.json\ntsconfig.json\nvite.config.ts\nfirestore.rules";
      } else if (cmd.includes("cat")) {
        stdout = `// Simulated reading file output via custom terminal tool:\n${SIMULATED_FILESYSTEM["/src/types.ts"]}`;
      } else if (cmd.includes("vitest") || cmd.includes("npm test")) {
        stdout = `✔ src/tests/TopologicalSort.spec.ts (12 tests) 830ms\nTest Lines: 100% components parsed.\nAll tests passed successfully!`;
      } else if (cmd.includes("npm run build")) {
        stdout = `> vite build\nvite v5.1.4 compiling bundle...\nchecking ESM type modules...\nbuilding applet...\n✓ 45 modules compiled in 1.2s under /dist/index.html`;
      } else {
        stdout = `[SANDBOX TERMINAL STDOUT] Command resolved with default return loop code.\n$ ${cmd}\nExit trace successful. Process exited natively.`;
      }

      runLog.stdout = stdout;
      runLog.stderr = stderr;
      runLog.durationMs = Date.now() - startTime;

      return {
        success: true,
        output: { stdout, stderr, exitCode },
        logs: [runLog],
      };
    },
  },

  TestRunnerTool: {
    id: "TestRunnerTool",
    name: "Autonomic Test Suite Runner",
    description: "Parse topological test specifications. Runs unit, system integration, or compiler tests.",
    inputSchema: {
      suitePath: {
        type: "string",
        description: "Target location index of the test suites structure.",
        required: true,
        defaultValue: "/src/tests/TopologicalSort.spec.ts",
      },
      watchMode: {
        type: "boolean",
        description: "Allow the test runner to index file modifications concurrently.",
        required: false,
        defaultValue: false,
      },
    },
    outputSchema: {
      passedCount: { type: "number", description: "Count of successful tests assertions solved." },
      failedCount: { type: "number", description: "Count of failed validation checkpoints caught." },
      testResults: { type: "array", description: "Array of items mapping each test description and outcome status." },
    },
    safetyPolicy: {
      level: "low",
      description: "Fast evaluation pipeline. Maximum runtime timeout restricted to 4500ms to avoid locking stateful queues.",
      requiresUserConfirmation: false,
      sandboxIsolationScope: "Isolated child process with vitest-reporter logs.",
    },
    execute: async (params) => {
      const startTime = Date.now();
      const path = params.suitePath as string;
      const watch = !!params.watchMode;

      const runLog: ToolLogEntry = {
        id: `test_${Date.now()}`,
        timestamp: new Date().toISOString(),
        toolId: "TestRunnerTool",
        actionName: `test_execute`,
        parameters: { suitePath: path, watch },
        safetyCheckPassed: true,
        executionStatus: "success",
        durationMs: 0
      };

      const testResults = [
        { name: "Topological Sort DAG - Linear execution checks", status: "passed", durationMs: 40 },
        { name: "Rate Limit Adapters - Throttle 429 exceptions handled", status: "passed", durationMs: 120 },
        { name: "Fallback Sequences - Automatically cascade on 500 status", status: "passed", durationMs: 95 },
        { name: "Filesystem Block - Absolute path block rules match", status: "passed", durationMs: 15 },
      ];

      const durationMs = Math.floor(Math.random() * 400) + 180;
      runLog.stdout = `🏁 Testing process triggered for: ${path}\n` +
        testResults.map(r => `  ✔ ${r.name} (${r.durationMs}ms)`).join("\n") +
        `\n\nTotal duration: ${durationMs}ms. Passed: 4 / Failed: 0`;

      runLog.durationMs = Date.now() - startTime;
      return {
        success: true,
        output: { passedCount: 4, failedCount: 0, durationMs, testResults },
        logs: [runLog],
      };
    },
  },

  PackageManagerTool: {
    id: "PackageManagerTool",
    name: "Standard Package Manager",
    description: "Install, trace, list, clean, or resolve yarn/npm dependency registries.",
    inputSchema: {
      action: {
        type: "select",
        description: "Operation action parameter to perform on manifest profiles.",
        required: true,
        options: ["install", "remove", "update", "list"],
        defaultValue: "install",
      },
      packageNames: {
        type: "string",
        description: "Comma-separated list string of target dependency imports.",
        required: true,
        defaultValue: "lucide-react, motion, @google/genai",
      },
      devDependency: {
        type: "boolean",
        description: "Marks imports targeting devDependencies profile lists.",
        required: false,
        defaultValue: false,
      },
    },
    outputSchema: {
      success: { type: "boolean", description: "Vite and node manifest update status." },
      installedPackages: { type: "array", description: "Successfully linked packages array list." },
    },
    safetyPolicy: {
      level: "medium",
      description: "Registry locks restrict imports only to validated, high-profile NPM registry paths. Prevents typosquatting downloads.",
      requiresUserConfirmation: false,
      sandboxIsolationScope: "Manifest context files updates locks: /package.json",
    },
    execute: async (params) => {
      const startTime = Date.now();
      const action = params.action as string;
      const rawPkgNames = params.packageNames as string;
      const isDev = !!params.devDependency;

      const pkgs = rawPkgNames.split(",").map(p => p.trim()).filter(Boolean);

      const runLog: ToolLogEntry = {
        id: `pkg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        toolId: "PackageManagerTool",
        actionName: `npm_${action}`,
        parameters: { action, pkgs, isDev },
        safetyCheckPassed: true,
        executionStatus: "success",
        durationMs: 0
      };

      let stdout = "";
      let outputObj: Record<string, any> = {};

      if (action === "install") {
        stdout = `npm WARN deprecated source-map-url@0.4.1: See https://github.com/lydell/source-map-url#deprecated\n\nadded ${pkgs.length} packages, changed 3 packages, and audited 184 packages in 2.34s\n\n11 packages are looking for funding. Run 'npm fund' for details.`;
        outputObj = { success: true, installedPackages: pkgs, manifestState: "synchronized" };
      } else if (action === "list") {
        stdout = `modular-test-framework@1.0.0\n├── motion@11.1.2\n├── lucide-react@0.344.0\n└── typings-node@20.11.24`;
        outputObj = { success: true, installedPackages: ["motion", "lucide-react", "typings-node"] };
      } else {
        stdout = `Successfully executed package command: [${action}] on modules [${pkgs.join(", ")}]`;
        outputObj = { success: true, packages: pkgs };
      }

      runLog.stdout = stdout;
      runLog.durationMs = Date.now() - startTime;
      return { success: true, output: outputObj, logs: [runLog] };
    },
  },

  CodeSearchTool: {
    id: "CodeSearchTool",
    name: "Context Index Searcher",
    description: "Scan code strings using regular expression patterns, compiling matched lines, filenames, or coordinates.",
    inputSchema: {
      searchQuery: {
        type: "string",
        description: "Text search syntax pattern or Regex string compilation.",
        required: true,
        defaultValue: "activeTab",
      },
      filePattern: {
        type: "string",
        description: "Allows filters to narrow target files search lists.",
        required: false,
        defaultValue: "*.tsx",
      },
      caseSensitive: {
        type: "boolean",
        description: "Indicate if text case matching is enforced.",
        required: false,
        defaultValue: true,
      },
    },
    outputSchema: {
      matchesCount: { type: "number", description: "Count of all lines found containing a match." },
      results: { type: "array", description: "Array list objects detailing matching filePath, line coordinate and target text." },
    },
    safetyPolicy: {
      level: "low",
      description: "Completely safe search operation. System variables like .env files or SSH paths are automatically stripped from target indexing lists.",
      requiresUserConfirmation: false,
      sandboxIsolationScope: "Read-only file pattern indexing context.",
    },
    execute: async (params) => {
      const startTime = Date.now();
      const query = params.searchQuery as string;
      const pattern = params.filePattern as string;
      const caseSen = !!params.caseSensitive;

      const runLog: ToolLogEntry = {
        id: `search_${Date.now()}`,
        timestamp: new Date().toISOString(),
        toolId: "CodeSearchTool",
        actionName: `grep_search`,
        parameters: { query, pattern, caseSen },
        safetyCheckPassed: true,
        executionStatus: "success",
        durationMs: 0
      };

      const searchResults: Array<{ filePath: string; line: number; text: string }> = [];

      // Scan our actual simulated filesystem to find matches!
      Object.entries(SIMULATED_FILESYSTEM).forEach(([fPath, fBody]) => {
        // Simple file pattern check (e.g. *.tsx matches /src/App.tsx)
        const isMatchedPattern = pattern === "*" || pattern === "*.*" || 
          (pattern.startsWith("*.") && fPath.endsWith(pattern.substring(1))) ||
          fPath.includes(pattern);

        if (isMatchedPattern) {
          const lines = fBody.split("\n");
          lines.forEach((lineText, lIdx) => {
            const isMatch = caseSen 
              ? lineText.includes(query) 
              : lineText.toLowerCase().includes(query.toLowerCase());
            
            if (isMatch) {
              searchResults.push({
                filePath: fPath,
                line: lIdx + 1,
                text: lineText.trim(),
              });
            }
          });
        }
      });

      // Add a fall-back mock result if none was found to ensure the UI demonstrates a nice feedback flow
      if (searchResults.length === 0) {
        searchResults.push({
          filePath: "/src/App.tsx",
          line: 12,
          text: `type ActiveTab = "orchestrator" | "agents" | "${query}"`,
        });
      }

      runLog.stdout = `Compiled grep search for "${query}" inside pattern [${pattern}]. Matches found: ${searchResults.length}\n` +
        searchResults.map(r => `  ${r.filePath}:${r.line} -> ${r.text}`).join("\n");

      runLog.durationMs = Date.now() - startTime;
      return {
        success: true,
        output: { matchesCount: searchResults.length, results: searchResults },
        logs: [runLog],
      };
    },
  },
};
