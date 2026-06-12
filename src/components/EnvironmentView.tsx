import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Server, Cpu, Play, Ban, ShieldAlert, CheckCircle2, AlertTriangle, 
  Terminal, RefreshCw, Layers, FileCode, Check, Copy, Settings,
  Database, HardDrive, Package, Plus, Trash2, ArrowUpRight, MonitorPlay, Sparkles
} from "lucide-react";

// Types
type PlatformEnv = "development" | "staging" | "production";

interface EnvVariable {
  key: string;
  development: string;
  staging: string;
  production: string;
  description: string;
}

interface SimulatedDependency {
  name: string;
  version: string;
  status: "installed" | "warning" | "missing";
  size: string;
  peerDep: string;
}

export default function EnvironmentView() {
  // Current active profile
  const [activeEnv, setActiveEnv] = useState<PlatformEnv>("development");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Editable variables matrix
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([
    { key: "NODE_ENV", development: "development", staging: "staging", production: "production", description: "Node execution path" },
    { key: "PORT", development: "3000", staging: "3000", production: "3000", description: "VFS ingress routing port" },
    { key: "VITE_API_ENDPOINT", development: "http://localhost:3000/api/v1", staging: "https://staging.api.autonomous.platform", production: "https://api.autonomous.platform", description: "API services endpoint root" },
    { key: "APP_URL", development: "http://localhost:3000", staging: "https://staging.autonomous.platform", production: "https://autonomous.platform", description: "Primary frontend domain" },
    { key: "GEMINI_API_KEY", development: "AI_DEV_KEY_652", staging: "AI_STAGE_KEY_918", production: "AI_PROD_KEY_001", description: "Gemini cognitive secret key" },
    { key: "DB_USER", development: "dev_user", staging: "stage_user_replica", production: "prod_master", description: "DB administrator username" },
    { key: "DB_PASSWORD", development: "dev_password_102", staging: "stage_secure_password_k8s", production: "prod_password_ultra_secure_9019", description: "DB access pass token" },
    { key: "DB_NAME", development: "dev_autonomous_db", staging: "stage_autonomous_db", production: "prod_autonomous_db", description: "Target database registry name" },
    { key: "VITE_ENABLE_TELESCOPE_LOGS", development: "true", staging: "true", production: "false", description: "Enable full tracing on the virtual bus" },
    { key: "VITE_DEFER_DECAY_RATE", development: "60", staging: "300", production: "1200", description: "Interval for decaying dynamic weights" },
  ]);

  // Variables modal input states
  const [newKey, setNewKey] = useState("");
  const [newDevValue, setNewDevValue] = useState("");
  const [newStageValue, setNewStageValue] = useState("");
  const [newProdValue, setNewProdValue] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Dependencies states
  const [dependencies, setDependencies] = useState<SimulatedDependency[]>([
    { name: "react", version: "^18.2.0", status: "installed", size: "3.2 MB", peerDep: "react-dom" },
    { name: "motion", version: "^11.1.2", status: "installed", size: "1.4 MB", peerDep: "react" },
    { name: "framer-motion", version: "^10.15.0", status: "installed", size: "1.8 MB", peerDep: "react" },
    { name: "lucide-react", version: "^0.344.0", status: "installed", size: "840 KB", peerDep: "None" },
    { name: "@google/genai", version: "^0.1.1", status: "installed", size: "2.1 MB", peerDep: "None" },
    { name: "d3", version: "^7.8.5", status: "warning", size: "1.2 MB", peerDep: "Requires canvas node in some runtimes" },
    { name: "recharts", version: "^2.12.0", status: "installed", size: "4.5 MB", peerDep: "react-resize-detector" },
    { name: "tailwindcss", version: "^4.0.0", status: "installed", size: "9.1 MB", peerDep: "None" },
  ]);

  const [installPackName, setInstallPackName] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);

  // Runtime telemetry outputs
  const [detectedRuntime, setDetectedRuntime] = useState({
    engine: "NodeJS (V8 Engine compiler)",
    version: "v20.11.0",
    packageManager: "npm v10.2.4",
    platform: "linux-x64-alpine (Cloud Run Sandbox)",
    port3000: "LISTENING (Active Ingress Proxy)",
    gcpBound: "Firebase & Cloud SQL Ready",
  });

  // Docker Builder Template State
  const [dockerBaseImage, setDockerBaseImage] = useState("node:20-alpine");
  const [dockerWorkdir, setDockerWorkdir] = useState("/app");
  const [dockerPort, setDockerPort] = useState("3000");
  const [dockerStageType, setDockerStageType] = useState<"single" | "multi">("multi");

  // Docker Compose Config Toggles
  const [composeWebEnabled, setComposeWebEnabled] = useState(true);
  const [composeDbEnabled, setComposeDbEnabled] = useState(true);
  const [composeRedisEnabled, setComposeRedisEnabled] = useState(true);

  // Hypervisor Simulator state
  const [hypervisorLogs, setHypervisorLogs] = useState<string[]>([
    "System Hypervisor standby. Awaiting network initiation...",
  ]);
  const [containersStatus, setContainersStatus] = useState<Array<{ name: string; image: string; status: "running" | "stopped"; port: string }>>([
    { name: "autonomous-studio-app", image: "local-client-built:latest", status: "stopped", port: "3000:3000" },
    { name: "autonomous-studio-db", image: "postgres:15-alpine", status: "stopped", port: "5432:5432" },
    { name: "autonomous-studio-cache", image: "redis:7-alpine", status: "stopped", port: "6379:6379" },
  ]);
  const [isHypervisorStarting, setIsHypervisorStarting] = useState(false);

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------

  // Copy handler
  const triggerCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Add environment variable
  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    
    // Capitalize key
    const cleanedKey = newKey.trim().toUpperCase();
    if (envVariables.some(v => v.key === cleanedKey)) {
      alert("Variable already exists.");
      return;
    }

    setEnvVariables(prev => [
      ...prev,
      {
        key: cleanedKey,
        development: newDevValue || "undefined",
        staging: newStageValue || "undefined",
        production: newProdValue || "undefined",
        description: newDesc || "Custom environment flag"
      }
    ]);

    // Reset controls
    setNewKey("");
    setNewDevValue("");
    setNewStageValue("");
    setNewProdValue("");
    setNewDesc("");
  };

  const handleDeleteVariable = (keyToDelete: string) => {
    setEnvVariables(prev => prev.filter(v => v.key !== keyToDelete));
  };

  // Switch Active Environment and emulate terminal response
  const handleEnvSwitch = (env: PlatformEnv) => {
    setActiveEnv(env);
    setHypervisorLogs(prev => [
      ...prev,
      `[CONFIG] Hot-swapped environment target file link to: .env.${env}`,
      `[CONFIG] Reloaded variable context (NODE_ENV set to: "${env}")`,
    ]);
  };

  // Emulate install package
  const handleInstallPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installPackName.trim()) return;

    const pkg = installPackName.trim().toLowerCase();
    setIsInstalling(true);
    setInstallLogs([`$ npm install ${pkg} --silent`]);

    setTimeout(() => {
      setInstallLogs(prev => [...prev, `Resolving peer packages dependencies...`]);
    }, 400);

    setTimeout(() => {
      setInstallLogs(prev => [...prev, `Retrieving package metadata from standard registry channels...`]);
    }, 800);

    setTimeout(() => {
      setInstallLogs(prev => [
        ...prev,
        `+ ${pkg}@v${(Math.random() * 5 + 1).toFixed(1)}.0`,
        `added 4 packages and audited 188 packages in 1.48s`,
        `SUCCESS: Fully synchronized package and workspace modules lock!`
      ]);
      setDependencies(prev => {
        if (prev.some(d => d.name === pkg)) return prev;
        return [
          ...prev,
          {
            name: pkg,
            version: `^${(Math.random() * 5 + 1).toFixed(1)}.0`,
            status: "installed",
            size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
            peerDep: "None"
          }
        ];
      });
      setIsInstalling(false);
      setInstallPackName("");
    }, 1500);
  };

  // Uninstall dependency
  const handleUninstallDependency = (pkgName: string) => {
    setDependencies(prev => prev.filter(d => d.name !== pkgName));
    setHypervisorLogs(prev => [
      ...prev,
      `[UNINSTALL] De-allocated package source: ${pkgName} from project node modules directory.`
    ]);
  };

  // Live dockerfile visual generation
  const generatedDockerfile = dockerStageType === "multi" 
    ? `# Multi-Stage production build setup\nFROM ${dockerBaseImage} AS builder\nWORKDIR ${dockerWorkdir}\nCOPY package*.json ./\nRUN npm ci --silent\nCOPY . .\nRUN npm run build\n\nFROM nginx:1.25-alpine\nCOPY --from=builder ${dockerWorkdir}/dist /usr/share/nginx/html\nEXPOSE ${dockerPort}\nCMD ["nginx", "-g", "daemon off;"]`
    : `# Single-Stage application runtime setup\nFROM ${dockerBaseImage}\nWORKDIR ${dockerWorkdir}\nCOPY package*.json ./\nRUN npm install --silent\nCOPY . .\nEXPOSE ${dockerPort}\nCMD ["npm", "run", "dev"]`;

  // Live docker compose visual generation
  const generatedDockerCompose = `version: "3.8"\n\nservices:${composeWebEnabled ? `\n  web:\n    build: .\n    container_name: autonomous-studio-app\n    ports:\n      - "${dockerPort}:${dockerPort}"\n    env_file:\n      - .env.\${NODE_ENV:-development}\n    restart: unless-stopped${composeDbEnabled ? "\n    depends_on:\n      db:\n        condition: service_healthy" : ""}` : ""}${composeDbEnabled ? `\n\n  db:\n    image: postgres:15-alpine\n    container_name: autonomous-studio-db\n    ports:\n      - "5432:5432"\n    environment:\n      POSTGRES_USER: \${DB_USER:-db_admin}\n      POSTGRES_PASSWORD: \${DB_PASSWORD:-db_secure_pass_99}\n      POSTGRES_DB: \${DB_NAME:-autonomous_studio}\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n    healthcheck:\n      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-db_admin}"]\n      interval: 5s\n      timeout: 5s\n      retries: 5\n    restart: unless-stopped` : ""}${composeRedisEnabled ? `\n\n  cache:\n    image: redis:7-alpine\n    container_name: autonomous-studio-cache\n    ports:\n      - "6379:6379"\n    restart: unless-stopped` : ""}\n\nvolumes:${composeDbEnabled ? "\n  pgdata:\n    driver: local" : ""}`;

  // Hypervisor container state switch
  const handleComposeUp = () => {
    setIsHypervisorStarting(true);
    setHypervisorLogs(prev => [
      ...prev,
      `$ docker-compose --env-file .env.${activeEnv} up -d`,
      `Creating network "workspace_default" with standard server driver`,
      `Creating volume "workspace_pgdata" locally...`,
    ]);

    setTimeout(() => {
      setHypervisorLogs(prev => [
        ...prev,
        `Pulling service: web... complete`,
        `Pulling service: db... complete`,
        `Pulling service: cache... complete`,
        `Launching container cluster tier...`
      ]);
    }, 600);

    setTimeout(() => {
      setContainersStatus(prev => prev.map(c => {
        if (c.name === "autonomous-studio-app" && !composeWebEnabled) return { ...c, status: "stopped" };
        if (c.name === "autonomous-studio-db" && !composeDbEnabled) return { ...c, status: "stopped" };
        if (c.name === "autonomous-studio-cache" && !composeRedisEnabled) return { ...c, status: "stopped" };
        return { ...c, status: "running" };
      }));
      setHypervisorLogs(prev => [
        ...prev,
        composeDbEnabled ? `autonomous-studio-db | [POSTGRES] Database is healthy. Listening on port 5432.` : "",
        composeRedisEnabled ? `autonomous-studio-cache | [REDIS] Server initialized. Port 6379 ready.` : "",
        composeWebEnabled ? `autonomous-studio-app | [WEB] Ingress proxy configured on port 3000.` : "",
        `[STATUS] Container group active. Sandbox is functional. (ENVIRONMENT: ${activeEnv.toUpperCase()})`
      ].filter(Boolean));
      setIsHypervisorStarting(false);
    }, 1500);
  };

  const handleComposeDown = () => {
    setHypervisorLogs(prev => [
      ...prev,
      `$ docker-compose down`,
      `Stopping autonomous-studio-app... stopped`,
      `Stopping autonomous-studio-db... stopped`,
      `Stopping autonomous-studio-cache... stopped`,
      `Removing container instances... complete`,
      `Removing network virtual bridges... done`,
      `[STATUS] Hypervisor scaled down. All sandboxes deactivated.`
    ]);
    setContainersStatus(prev => prev.map(c => ({ ...c, status: "stopped" })));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="environment_manager_view">
      {/* LEFT COLUMN: Controls, Profiles & Active Config variables */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Environment Profile Selector & Live Env Table */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[9.5px] font-mono tracking-wider text-emerald-400 uppercase font-semibold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-950">
                Environment Overrides Profile
              </span>
              <h3 className="text-sm font-sans font-medium text-slate-100 tracking-tight mt-1">
                Unified Configuration Matrix
              </h3>
            </div>
            
            {/* Active profile switch */}
            <div className="flex bg-[#070b19] p-1 border border-slate-800 rounded-lg shrink-0">
              {(["development", "staging", "production"] as PlatformEnv[]).map(env => (
                <button
                  key={env}
                  onClick={() => handleEnvSwitch(env)}
                  id={`btn_active_env_selector_${env}`}
                  className={`px-3 py-1 text-[10.5px] font-mono rounded cursor-pointer capitalize transition-all ${
                    activeEnv === env
                      ? "bg-emerald-500 text-slate-950 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            Our app includes direct workspace files <code className="text-sky-400 font-mono text-[11px]">.env.development</code>, <code className="text-sky-400 font-mono text-[11px]">.env.staging</code>, and <code className="text-sky-400 font-mono text-[11px]">.env.production</code>. Select a profile to load its values into the simulated runtime container sandbox below.
          </p>

          {/* Configuration Matrix Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg bg-[#090d16]">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 select-none">
                  <th className="p-3 font-semibold text-[10px] uppercase">Variable Name</th>
                  <th className={`p-3 font-semibold text-[10px] uppercase ${activeEnv === "development" ? "text-emerald-400 font-bold bg-slate-900/40" : ""}`}>Development</th>
                  <th className={`p-3 font-semibold text-[10px] uppercase ${activeEnv === "staging" ? "text-emerald-400 font-bold bg-slate-900/40" : ""}`}>Staging</th>
                  <th className={`p-3 font-semibold text-[10px] uppercase ${activeEnv === "production" ? "text-emerald-400 font-bold bg-slate-900/40" : ""}`}>Production</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {envVariables.map((variable) => (
                  <tr key={variable.key} className="hover:bg-slate-900/45 transition-colors">
                    <td className="p-3 text-sky-400 font-semibold">
                      <span className="block">{variable.key}</span>
                      <span className="text-[9.5px] text-slate-500 font-sans block leading-tight font-normal mt-0.5">{variable.description}</span>
                    </td>
                    <td className={`p-3 text-slate-300 break-all select-all ${activeEnv === "development" ? "bg-[#10b981]/5 text-emerald-300 font-medium" : ""}`}>
                      {variable.key.includes("PASS") || variable.key.includes("KEY") ? "••••••••" : variable.development}
                    </td>
                    <td className={`p-3 text-slate-300 break-all select-all ${activeEnv === "staging" ? "bg-[#10b981]/5 text-emerald-300 font-medium" : ""}`}>
                      {variable.key.includes("PASS") || variable.key.includes("KEY") ? "••••••••" : variable.staging}
                    </td>
                    <td className={`p-3 text-slate-300 break-all select-all ${activeEnv === "production" ? "bg-[#10b981]/5 text-emerald-300 font-medium" : ""}`}>
                      {variable.key.includes("PASS") || variable.key.includes("KEY") ? "••••••••" : variable.production}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteVariable(variable.key)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form to inject a new env variable */}
          <form onSubmit={handleAddVariable} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#070b19] p-3 rounded-lg border border-slate-800">
            <div className="sm:col-span-1 space-y-1">
              <label className="text-[9px] font-mono text-slate-400 block uppercase">New Key Name</label>
              <input
                type="text"
                required
                className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-sky-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="VITE_API_TIMEOUT"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-slate-400 block uppercase">Dev Value</label>
              <input
                type="text"
                className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="5000"
                value={newDevValue}
                onChange={(e) => setNewDevValue(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-slate-400 block uppercase">Stage Value</label>
              <input
                type="text"
                className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="10000"
                value={newStageValue}
                onChange={(e) => setNewStageValue(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-slate-400 block uppercase">Prod Value</label>
              <input
                type="text"
                className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="30000"
                value={newProdValue}
                onChange={(e) => setNewProdValue(e.target.value)}
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                id="btn_add_env_variable"
                className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-semibold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variable
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Dockerfile & Docker Compose Multi-Stage Generation Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Dockerfile Visual Generator */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-widest">
                  Dockerfile Generator
                </h4>
              </div>
              <button
                onClick={() => triggerCopy("Dockerfile", generatedDockerfile)}
                className="p-1 px-2.5 rounded bg-[#090d16] hover:bg-[#121c32] text-slate-400 hover:text-slate-200 text-[10.5px] font-mono transition-all flex items-center gap-1 border border-slate-850 cursor-pointer"
              >
                {copiedFile === "Dockerfile" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedFile === "Dockerfile" ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Docker parameters selectors */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[9.5px] font-mono text-slate-400 block mb-1">BASE IMAGE</label>
                <select
                  value={dockerBaseImage}
                  onChange={(e) => setDockerBaseImage(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded p-1.5 font-mono text-[10.5px] text-slate-350"
                >
                  <option value="node:20-alpine">node:20-alpine</option>
                  <option value="node:18-alpine">node:18-alpine</option>
                  <option value="node:22-alpine">node:22-alpine</option>
                  <option value="python:3.10-slim">python:3.10-slim</option>
                </select>
              </div>
              <div>
                <label className="text-[9.5px] font-mono text-slate-400 block mb-1">WORKING DIRECTORY</label>
                <input
                  type="text"
                  value={dockerWorkdir}
                  onChange={(e) => setDockerWorkdir(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded p-1.5 font-mono text-[10.5px] text-sky-400"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-mono text-slate-400 block mb-1">EXPOSE PORT</label>
                <input
                  type="number"
                  value={dockerPort}
                  onChange={(e) => setDockerPort(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded p-1.5 font-mono text-[10.5px] text-sky-400"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-mono text-slate-400 block mb-1">COMPILATION SCHEME</label>
                <div className="flex gap-1.5 font-sans">
                  <button
                    onClick={() => setDockerStageType("multi")}
                    className={`flex-1 py-1 text-[10.5px] rounded border ${dockerStageType === "multi" ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400 font-semibold" : "bg-transparent border-slate-800 text-slate-500"}`}
                  >
                    Multi-stage
                  </button>
                  <button
                    onClick={() => setDockerStageType("single")}
                    className={`flex-1 py-1 text-[10.5px] rounded border ${dockerStageType === "single" ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400 font-semibold" : "bg-transparent border-slate-800 text-slate-500"}`}
                  >
                    Single-stage
                  </button>
                </div>
              </div>
            </div>

            {/* Dockerfile code preview */}
            <div className="bg-[#090d16] p-3 rounded-lg border border-slate-850 h-[190px] overflow-y-auto select-all">
              <pre className="font-mono text-[10px] text-slate-350 leading-relaxed whitespace-pre font-normal text-left">
                {generatedDockerfile}
              </pre>
            </div>
          </div>

          {/* Docker-Compose configuration generator */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-widest">
                  Docker Compose Generator
                </h4>
              </div>
              <button
                onClick={() => triggerCopy("docker-compose.yml", generatedDockerCompose)}
                className="p-1 px-2.5 rounded bg-[#090d16] hover:bg-[#121c32] text-slate-400 hover:text-slate-200 text-[10.5px] font-mono transition-all flex items-center gap-1 border border-slate-850 cursor-pointer"
              >
                {copiedFile === "docker-compose.yml" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedFile === "docker-compose.yml" ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Docker Compose checkboxes */}
            <div className="space-y-2 bg-[#070b19] p-2.5 border border-slate-800 rounded-lg text-xs">
              <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Toggle Micro-Services</span>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded bg-[#090d16] border-slate-705 accent-emerald-500"
                    checked={composeWebEnabled}
                    onChange={(e) => setComposeWebEnabled(e.target.checked)}
                  />
                  <span className="text-slate-300">React web</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded bg-[#090d16] border-slate-705 accent-emerald-500"
                    checked={composeDbEnabled}
                    onChange={(e) => setComposeDbEnabled(e.target.checked)}
                  />
                  <span className="text-slate-300">PostgreSQL</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded bg-[#090d16] border-slate-705 accent-emerald-500"
                    checked={composeRedisEnabled}
                    onChange={(e) => setComposeRedisEnabled(e.target.checked)}
                  />
                  <span className="text-slate-300">Redis cache</span>
                </label>
              </div>
            </div>

            {/* Docker Compose YAML body Preview */}
            <div className="bg-[#090d16] p-3 rounded-lg border border-slate-850 h-[190px] overflow-y-auto select-all">
              <pre className="font-mono text-[10px] text-slate-350 leading-relaxed whitespace-pre font-normal text-left">
                {generatedDockerCompose}
              </pre>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Runtime state engine, dynamic package installs, simulated stack CLI */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Runtime Detection Panel */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/85 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h4 className="text-[10.5px] font-mono font-semibold text-slate-300 uppercase tracking-widest">
              Detected Runtime Info
            </h4>
          </div>

          <div className="space-y-2.5 bg-[#090d16] p-3.5 rounded-lg border border-slate-850 font-mono text-xs">
            <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 text-[10px]">OS CONTAINER PLATFORM:</span>
              <span className="text-slate-300 font-bold truncate max-w-[150px]">{detectedRuntime.platform}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 text-[10px]">COMPILER MOTOR:</span>
              <span className="text-slate-300">{detectedRuntime.engine}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 text-[10px]">PROCESSOR VERSION:</span>
              <span className="text-slate-300">{detectedRuntime.version}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 text-[10px]">PACKAGE MANAGER:</span>
              <span className="text-slate-300">{detectedRuntime.packageManager}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-800/40 pb-1.5">
              <span className="text-slate-500 text-[10px]">LOCAL INGRESS BOUND:</span>
              <span className="text-emerald-400 font-semibold">{detectedRuntime.port3000}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 text-[10px]">EXTERNAL RESOURCES:</span>
              <span className="text-slate-300">{detectedRuntime.gcpBound}</span>
            </div>
          </div>
        </div>

        {/* Live Dependency Locker Panel */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/85 space-y-3.5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-400 animate-pulse" />
            <h4 className="text-[10.5px] font-mono font-semibold text-slate-300 uppercase tracking-widest">
              Dependency Installation Manager
            </h4>
          </div>

          {/* Core Installation Trigger Form */}
          <form onSubmit={handleInstallPackage} className="flex gap-2">
            <input
              type="text"
              required
              disabled={isInstalling}
              className="flex-grow bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              placeholder="e.g. lodash, zod, cors"
              value={installPackName}
              onChange={(e) => setInstallPackName(e.target.value)}
            />
            <button
              type="submit"
              disabled={isInstalling}
              id="btn_trigger_install_pkg"
              className="px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              {isInstalling ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Install
            </button>
          </form>

          {/* Installation output streaming terminal */}
          {isInstalling || installLogs.length > 0 ? (
            <div className="bg-slate-950 p-2.5 rounded border border-slate-850 font-mono text-[9px] text-slate-400 space-y-1 h-[78px] overflow-y-auto">
              {installLogs.map((log, iL) => (
                <div key={iL} className={log.startsWith("SUCCESS") ? "text-emerald-400 font-semibold" : ""}>{log}</div>
              ))}
            </div>
          ) : null}

          {/* Dependencies list */}
          <div className="space-y-1.5 h-[166px] overflow-y-auto pr-1">
            {dependencies.map((dep) => (
              <div key={dep.name} id={`dep_row_${dep.name}`} className="flex items-center justify-between text-xs p-2 rounded bg-[#090d16] border border-slate-850 font-mono">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-205 font-bold">{dep.name}</span>
                    <span className="text-[10px] text-slate-500">{dep.version}</span>
                  </div>
                  <span className="text-[9.5px] text-slate-550 block">Size: {dep.size} • Peer: {dep.peerDep}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase leading-none ${
                    dep.status === "installed" ? "bg-emerald-950/20 text-emerald-450 border border-emerald-950" :
                    dep.status === "warning" ? "bg-amber-950/20 text-amber-500 border border-amber-950" :
                    "bg-rose-950/20 text-rose-500 border border-rose-950"
                  }`}>
                    {dep.status}
                  </span>
                  <button
                    onClick={() => handleUninstallDependency(dep.name)}
                    className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Uninstall library"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hypervisor sandbox controller controls */}
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/85 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-emerald-400" />
              <h4 className="text-[10.5px] font-mono font-semibold text-slate-300 uppercase tracking-widest">
                Sandbox Execution Hypervisor
              </h4>
            </div>
            
            {/* Run Docker triggers */}
            <div className="flex gap-1.5">
              <button
                onClick={handleComposeUp}
                disabled={isHypervisorStarting}
                id="btn_composer_up"
                className="p-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-sans font-semibold text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow"
              >
                <Play className="h-3 w-3 fill-slate-950" /> Up
              </button>
              <button
                onClick={handleComposeDown}
                id="btn_composer_down"
                className="p-1 px-2.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-850 font-sans font-semibold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Ban className="h-3 w-3" /> Down
              </button>
            </div>
          </div>

          {/* Active Container states */}
          <div className="grid grid-cols-1 gap-2 font-mono text-[10.5px]">
            {containersStatus.map((c) => {
              const isCompActive = 
                (c.name === "autonomous-studio-app" && composeWebEnabled) ||
                (c.name === "autonomous-studio-db" && composeDbEnabled) ||
                (c.name === "autonomous-studio-cache" && composeRedisEnabled);

              return (
                <div key={c.name} className="flex justify-between items-center p-2 rounded bg-[#090d16] border border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-slate-300 font-bold block">{c.name}</span>
                    <span className="text-[9.5px] text-slate-500 block leading-none">{c.image} • {c.port}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.status === "running" && isCompActive ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`}></span>
                    <span className={`text-[10px] ${c.status === "running" && isCompActive ? "text-emerald-400 font-bold" : "text-slate-505"}`}>
                      {c.status === "running" && isCompActive ? "UP" : "DOWN"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Logs terminal box */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-[104px] overflow-y-auto text-left flex flex-col font-mono text-[9px] text-slate-450 space-y-1 select-all">
            {hypervisorLogs.map((log, lIdx) => (
              <div key={lIdx} className={log.includes("[STATUS]") ? "text-emerald-450 font-semibold" : log.includes("db |") ? "text-indigo-400" : ""}>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
