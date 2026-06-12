import { useState, useEffect, useRef, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Trash2, Play, Share2, Zap, Workflow, Cpu, Layers, Globe, Users, 
  Laptop, Network, Gamepad2, SlidersHorizontal, Sparkles, CheckCircle2, 
  Languages, Download, PlusCircle, ArrowRight, Settings, Terminal, Link, AlertCircle
} from "lucide-react";
import { SupportedLanguage, translations, TranslationDictionary } from "../lib/translations";

interface GraphNode {
  id: string;
  name: string;
  type: "agent" | "llm" | "memory" | "game_connector" | "integration" | "evaluator";
  x: number;
  y: number;
  status: "active" | "standby" | "syncing" | "error";
  config: {
    modelUsed?: string;
    targetAddress?: string;
    engineType?: string;
    temperature?: number;
    maxTokens?: number;
    syncPort?: number;
  };
}

interface NodeConnection {
  from: string;
  to: string;
}

interface GraphPlusViewProps {
  currentLang?: SupportedLanguage;
  onLangChange?: (lang: SupportedLanguage) => void;
  customLanguageDict?: TranslationDictionary | null;
  setCustomLanguageDict?: (dict: TranslationDictionary | null) => void;
}

export default function GraphPlusView({
  currentLang: parentLang,
  onLangChange,
  customLanguageDict,
  setCustomLanguageDict
}: GraphPlusViewProps = {}) {
  // --- Localization ---
  const [localLang, setLocalLang] = useState<SupportedLanguage>("fa");
  const currentLang = parentLang || localLang;
  const setCurrentLang = onLangChange || setLocalLang;
  
  const [customLanguageName, setCustomLanguageName] = useState("");
  // fallback if parent dict is not provided
  const [localCustomDict, setLocalCustomDict] = useState<TranslationDictionary | null>(null);
  const activeCustomDict = customLanguageDict !== undefined ? customLanguageDict : localCustomDict;
  const setCustomDict = setCustomLanguageDict || setLocalCustomDict;

  const t = activeCustomDict || translations[currentLang];

  // --- Graph Node Configuration ---
  const [nodes, setNodes] = useState<GraphNode[]>([
    {
      id: "node_1",
      name: "Gemini 3.5 Flash (Free Default)",
      type: "llm",
      x: 80,
      y: 120,
      status: "active",
      config: { modelUsed: "models/gemini-3.5-flash", temperature: 0.2, maxTokens: 8192 }
    },
    {
      id: "node_2",
      name: "Main Orchestration Agent",
      type: "agent",
      x: 360,
      y: 80,
      status: "active",
      config: { modelUsed: "models/gemini-3.1-pro-preview", temperature: 0.7 }
    },
    {
      id: "node_3",
      name: "Unreal Engine 5.4 Live Connector",
      type: "game_connector",
      x: 640,
      y: 160,
      status: "syncing",
      config: { engineType: "Unreal Engine", syncPort: 9042, targetAddress: "localhost:7777" }
    },
    {
      id: "node_4",
      name: "Memory Buffer Cache",
      type: "memory",
      x: 220,
      y: 300,
      status: "standby",
      config: { maxTokens: 4096 }
    }
  ]);

  const [connections, setConnections] = useState<NodeConnection[]>([
    { from: "node_1", to: "node_2" },
    { from: "node_2", to: "node_3" },
    { from: "node_4", to: "node_2" }
  ]);

  // --- Drag and Selection ---
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node_1");
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragTargetId = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // --- Dynamic Live Canvas Controls (Zooming, Resizing, Panning) ---
  const [zoom, setZoom] = useState(0.95);
  const [offsetX, setOffsetX] = useState(40);
  const [offsetY, setOffsetY] = useState(20);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasHeight, setCanvasHeight] = useState(650); // Generous expanded workspace viewport


  // --- Dynamic Node Forms ---
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeType, setNewNodeType] = useState<GraphNode["type"]>("agent");

  // --- Team Collaboration State ---
  const [syncMode, setSyncMode] = useState<"local" | "cloud">("local");
  const [isCollaborationActive, setIsCollaborationActive] = useState(true);
  const [teammates, setTeammates] = useState([
    { name: "Alireza (You)", role: "Architect", status: "online", activeNode: "node_1" },
    { name: "Sarah (Mesa, AZ)", role: "AI Dev", status: "online", activeNode: "node_3" },
    { name: "Sora (Tokyo)", role: "Game dev", status: "idle", activeNode: "node_2" }
  ]);
  const [newTeammateName, setNewTeammateName] = useState("");

  // --- Game/IDE External Connections state ---
  const [ideLink, setIdeLink] = useState({
    vscodeConnected: true,
    cursorConnected: false,
    unityConnected: false,
    unrealConnected: true,
    godotConnected: false,
    lastSyncTimestamp: new Date().toLocaleTimeString()
  });

  // --- Interactive AI Nodes and integration states ---
  const [nodePrompts, setNodePrompts] = useState<Record<string, string>>({
    node_1: "یک اسکریپت حرکت کاراکتر دوبعدی بنویس",
    node_2: "کد تولید شده توسط نود ۱ را تلفیق کن و یک دابل جامپ به آن اضافه کن",
    node_3: "یک تابع تحلیل برخورد برای انجین آنریل شبیه‌سازی کن",
    node_4: "متغیرهای موقت امتیاز و جون بازیکن را بساز"
  });
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, string>>({
    node_1: `// Code for Player 2D Movement
using UnityEngine;

public class Mover2D : MonoBehaviour {
    public float speed = 5f;
    void Update() {
        float x = Input.GetAxisRaw("Horizontal");
        transform.Translate(Vector3.right * x * speed * Time.deltaTime);
    }
}`
  });
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [mergeWithAncestors, setMergeWithAncestors] = useState<Record<string, boolean>>({
    node_2: true,
    node_3: true,
    node_4: false
  });
  const [viewingOutputNodeId, setViewingOutputNodeId] = useState<string | null>(null);

  const executePrompt = async (nodeId: string) => {
    const promptText = nodePrompts[nodeId] || "";
    if (!promptText.trim()) return;

    setIsGenerating(prev => ({ ...prev, [nodeId]: true }));
    addLog(`در حال ارسال درخواست تولید به مدل برای نود [${nodeId}]...`);

    // Figure out ancestor nodes (connections pointing to nodeId)
    const ancestors = connections.filter(c => c.to === nodeId).map(c => c.from);
    const shouldMerge = mergeWithAncestors[nodeId] !== false;
    
    const parentContexts = ancestors
      .map(ancId => {
        const parentNode = nodes.find(n => n.id === ancId);
        const parentName = parentNode ? parentNode.name : ancId;
        const parentOutput = nodeOutputs[ancId];
        if (parentOutput) {
          return `--- [خروجی از نود مرجع بالادست: ${parentName}] ---\n${parentOutput}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n\n");

    let finalPrompt = promptText;
    if (shouldMerge && parentContexts) {
      finalPrompt = `دستور کاربر:\n"${promptText}"\n\nخروجی‌های متصل شده قبلی برای ادغام، تلفیق و مرج کردن:\n${parentContexts}\n\nلطفاً دستور کاربر را روی کدهای قبلی اعمال کرده و خروجی تلفیق‌شده یکدستی ارائه کنی.`;
    }

    const matchedNode = nodes.find(n => n.id === nodeId);
    const modelUsed = matchedNode?.config?.modelUsed || "models/gemini-3.5-flash";
    const tempUsed = matchedNode?.config?.temperature ?? 0.5;

    try {
      const response = await fetch("/api/graph/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: modelUsed,
          temperature: tempUsed
        })
      });

      if (!response.ok) {
        throw new Error(`خطای شبکه: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setNodeOutputs(prev => ({ ...prev, [nodeId]: data.text }));
        // Update node status to active if it was standby
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: "active" as const } : n));
        addLog(`پاسخ مدل هوشمند نود [${nodeId}] با موفقیت ادغام و صادر شد.`);
      } else {
        throw new Error(data.detail || "خطا در پردازش هوش مصنوعی");
      }
    } catch (error) {
      console.error(error);
      addLog(`خطا در گره [${nodeId}]: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [nodeId]: false }));
    }
  };

  // --- Simulation log output ---
  const [graphLogs, setGraphLogs] = useState<string[]>([
    "Graph Workspace initialized on system port 3000.",
    "Localized translation dictionary assigned to Persian (Farsi).",
    "P2P Local loopback active. Listening for Unreal Engine connection on port 9042."
  ]);

  // Handle custom dynamic language translate request
  const handleTranslateToAnyLanguage = () => {
    if (!customLanguageName.trim()) return;
    
    // Create custom Persian-tinted or English based custom translation dynamically
    const dynamicDict: TranslationDictionary = {
      studioController: `${customLanguageName} - Controller`,
      orchestratorRun: `${customLanguageName} - Run`,
      selfHealing: `${customLanguageName} - Self-Heal`,
      envManager: `${customLanguageName} - Environment`,
      agentFramework: `${customLanguageName} - Agents`,
      aiProviders: `${customLanguageName} - Providers`,
      capabilities: `${customLanguageName} - Capabilities`,
      dataContracts: `${customLanguageName} - Contracts`,
      memoryExplorer: `${customLanguageName} - Memory`,
      analyticsBus: `${customLanguageName} - Analytics`,
      graphPlusWorkspace: `Workspace (${customLanguageName})`,
      switchWorkspaceMode: `Switch mode (${customLanguageName})`,
      selectLanguage: `Language / ${customLanguageName}`,
      teamCollaboration: "Collaboration Team Setup",
      localSyncBridge: "Intranet P2P Socket Sync",
      cloudSyncRealtime: "Cloud Postgres Sync",
      externalBridge: "Bridge SDK Integrator",
      gameEngineConnectors: "Engines & Code IDE Links",
      addNode: "Add Visual Node Block",
      connectToIDE: "Active Link Engine Socket",
      activeCollaborators: "Teammates Session",
      runtimeActive: "Active Standby Node",
      nodeName: "Label Name",
      nodeType: "Block Class",
      coordinate: "Coordinates X/Y",
      connectionStatus: "Comms Link Status",
      connected: "Active Node Synchronized",
      disconnected: "Inactive Gateway",
      unrealEngine: "Unreal Engine Connection",
      unityEngine: "Unity Engine Setup",
      godotEngine: "Godot Engine Setup",
      vscode: "VS Code Port 6011",
      cursor: "Cursor Host Sync",
      jetbrains: "JetBrains Gateway Sync",
      exportBlueprint: "Get Flow Blueprint",
      syncSuccess: "Local communication established!",
      localIntranetIP: "Intranet IP Target",
      graphDesc: `Visual workspace for ${customLanguageName}`,
      tipText: `Drag nodes. Link using Binder`,
      addNodeHeader: "Add Visual Node Block",
      nodeNameLabel: "Name attribute",
      nodeNamePlaceholder: "e.g. Node Title",
      nodeTypeLabel: "Class",
      nodeBtnAdd: "Add node to blueprint canvas",
      agentOption: `🤖 Custom agent`,
      llmOption: `🧠 Custom language model`,
      gameOption: `🎮 Game engine connection`,
      memoryOption: `💾 Memory cache buffer`,
      evalOption: `🎯 Multi auditing`,
      integrationOption: `🔧 Multi sync port`,
      sidebarWorkspaceMode: "Workspace Setup",
      sidebarSyncMode: "Protocol Setup",
      ideConnections: "IDE setup link",
      visualLogs: "Stream metrics log",
      clearLogs: "Truncate log registry",
      collaboratorBtn: "Add Designer Name",
      collaboratorPlaceholder: "Associate Name",
      collaboratorLabel: "Add team associate"
    };

    setCustomDict(dynamicDict);
    setCurrentLang("custom");
    addLog(`System language translated dynamically into '${customLanguageName}'.`);
  };

  const addLog = (msg: string) => {
    setGraphLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (isDragging) return;
    const target = e.target as HTMLElement;
    
    // Check if the user is clicking on empty canvas to start panning
    const isBackground = target.id === "graph_plus_visual_canvas" || 
                         target.classList.contains("tile-pattern") || 
                         target.tagName === "svg" || 
                         target.id === "canvas_transform_wrapper";
    
    if (isBackground) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    }
  };

  const handleNodeMouseDown = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    dragTargetId.current = id;
    setIsDragging(true);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (isDragging && dragTargetId.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Solve for coordinate mapping inside zoom/pan spaces
      const x = Math.round((e.clientX - rect.left - offsetX) / zoom - 110);
      const y = Math.round((e.clientY - rect.top - offsetY) / zoom - 25);
      setNodes(prev => prev.map(n => n.id === dragTargetId.current ? { ...n, x: Math.max(10, x), y: Math.max(10, y) } : n));
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setOffsetX(dx);
      setOffsetY(dy);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (dragTargetId.current) {
        addLog(`Moved Node [${dragTargetId.current}] inside visual workspace.`);
      }
      dragTargetId.current = null;
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };


  // Add connections
  const startConnecting = (id: string) => {
    setIsAddingConnection(true);
    setConnectionSource(id);
    addLog(`Click target node to complete blueprint link from [${id}].`);
  };

  const completeConnection = (targetId: string) => {
    if (!connectionSource || connectionSource === targetId) {
      setIsAddingConnection(false);
      setConnectionSource(null);
      return;
    }
    // Avoid duplicates
    const alreadyConnected = connections.some(c => c.from === connectionSource && c.to === targetId);
    if (!alreadyConnected) {
      setConnections(prev => [...prev, { from: connectionSource, to: targetId }]);
      addLog(`Created communication pathway: ${connectionSource} -> ${targetId}`);
    }
    setIsAddingConnection(false);
    setConnectionSource(null);
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addLog(`Sunset Node block: ${id}`);
  };

  const addNewNode = () => {
    if (!newNodeName.trim()) return;
    const modelUsed = newNodeType === "llm" ? "models/gemini-3.5-flash" : undefined;
    const targetId = `node_${Date.now()}`;
    const newNode: GraphNode = {
      id: targetId,
      name: newNodeName,
      type: newNodeType,
      x: 150 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      status: "active",
      config: {
        modelUsed,
        temperature: 0.5,
        syncPort: newNodeType === "game_connector" ? 9042 : undefined
      }
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(targetId);
    setNewNodeName("");
    addLog(`Provisioned visual micro-block: ${newNodeName} [${newNodeType}]`);
  };

  const currentSelectedNode = nodes.find(n => n.id === selectedNodeId);

  // Exporter
  const getJSONBlueprintStr = () => {
    return JSON.stringify({ nodes, connections, syncMode, ideLink, timestamp: new Date().toUTCString() }, null, 2);
  };

  return (
    <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md text-slate-200">
      
      {/* Top action and language bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-slate-800/80 pb-4 mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
              GRAPH.PLUS WORKSPACE EMULATION
            </span>
          </div>
          <h2 className="text-lg font-mono font-bold text-slate-100 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-cyan-400" />
            {t.graphPlusWorkspace}
          </h2>
          <p className="text-xs text-teal-400/80 mt-1">
            {t.graphDesc}
          </p>
        </div>

        {/* Global Select Language Control */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/40 p-2 border border-slate-800/50 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Languages className="h-4 w-4 text-cyan-400" />
            <span>{t.selectLanguage}:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setCurrentLang("fa"); setCustomDict(null); }}
              className={`px-2 py-1 text-[10.5px] font-mono rounded ${currentLang === "fa" && !activeCustomDict ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold" : "text-slate-400 hover:text-slate-300 pointer-events-auto cursor-pointer"}`}
            >
              فارسی
            </button>
            <button
              onClick={() => { setCurrentLang("en"); setCustomDict(null); }}
              className={`px-2 py-1 text-[10.5px] font-mono rounded ${currentLang === "en" && !activeCustomDict ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold" : "text-slate-400 hover:text-slate-300 pointer-events-auto cursor-pointer"}`}
            >
              EN
            </button>
            <button
              onClick={() => { setCurrentLang("es"); setCustomDict(null); }}
              className={`px-2 py-1 text-[10.5px] font-mono rounded ${currentLang === "es" && !activeCustomDict ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold" : "text-slate-400 hover:text-slate-300 pointer-events-auto cursor-pointer"}`}
            >
              ES
            </button>
            <button
              onClick={() => { setCurrentLang("de"); setCustomDict(null); }}
              className={`px-2 py-1 text-[10.5px] font-mono rounded ${currentLang === "de" && !activeCustomDict ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold" : "text-slate-400 hover:text-slate-300 pointer-events-auto cursor-pointer"}`}
            >
              DE
            </button>
            <button
              onClick={() => { setCurrentLang("ja"); setCustomDict(null); }}
              className={`px-2 py-1 text-[10.5px] font-mono rounded ${currentLang === "ja" && !activeCustomDict ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold" : "text-slate-400 hover:text-slate-300 pointer-events-auto cursor-pointer"}`}
            >
              JA
            </button>
          </div>

          <div className="border-l border-slate-800 h-5" />

          {/* Any other world language input */}
          <div className="flex items-center gap-1.5 pl-1.5">
            <input
              type="text"
              placeholder="سایر زبان‌ها (مثلا عربی)"
              value={customLanguageName}
              onChange={(e) => setCustomLanguageName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10.5px] text-slate-300 focus:outline-none focus:border-cyan-500 max-w-[110px]"
            />
            <button
              onClick={handleTranslateToAnyLanguage}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-[10.5px] rounded px-2 py-0.5 transition-colors"
            >
              اعمال
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Visual Graph Area (Takes 3 columns) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Main SVG/HTML Interactive Drag Canvas */}
          <div 
            ref={canvasRef}
            id="graph_plus_visual_canvas"
            style={{ height: `${canvasHeight}px` }}
            className="w-full bg-[radial-gradient(ellipse_at_top_right,#02191f_0%,#030910_90%)] border-2 border-teal-500/40 rounded-2xl relative overflow-hidden flex items-stretch select-none shadow-[0_0_50px_-12px_rgba(20,184,166,0.25)] firoozeh-glow transition-all duration-300"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Ambient grid background pattern with Persian drafting grid sizing */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#0f766e_1px,transparent_1px),linear-gradient(to_bottom,#0f766e_1px,transparent_1px)] bg-[size:28px_28px] tile-pattern"></div>
            
            {/* Transformed wrapper for visual objects (moves with panning/zooming) */}
            <div 
              id="canvas_transform_wrapper" 
              className="absolute inset-0 select-none origin-top-left" 
              style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`, width: "100%", height: "100%" }}
            >

            
            {/* Connection SVG Line Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
                </marker>
              </defs>
              
              {connections.map((conn, idx) => {
                const fromNode = nodes.find(n => n.id === conn.from);
                const toNode = nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                // Simple calculated center anchors
                const fX = fromNode.x + 90;
                const fY = fromNode.y + 40;
                const tX = toNode.x + 90;
                const tY = toNode.y + 40;

                // Bezier curved connector points
                const controlX = (fX + tX) / 2;

                return (
                  <g key={`${conn.from}-${conn.to}-${idx}`}>
                    <path
                      d={`M ${fX} ${fY} C ${controlX} ${fY}, ${controlX} ${tY}, ${tX} ${tY}`}
                      stroke="#0e7490"
                      strokeWidth="2.5"
                      fill="none"
                      markerEnd="url(#arrow)"
                      className="opacity-70 animate-[pulse_2s_infinite]"
                    />
                    <circle cx={(fX+tX)/2} cy={(fY+tY)/2} r="4" fill="#22d3ee" className="animate-[ping_3s_infinite]" />
                  </g>
                );
              })}
            </svg>

            {/* Draggable HTML Nodes */}
            <AnimatePresence>
              {nodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isConnectingSource = connectionSource === node.id;
                
                // Get node-specific theme colors
                let colorClass = "from-sky-500/20 to-sky-950/40 border-sky-500/30 text-sky-400";
                if (node.type === "agent") colorClass = "from-purple-500/20 to-purple-950/40 border-purple-500/30 text-purple-400";
                if (node.type === "game_connector") colorClass = "from-amber-500/20 to-amber-950/40 border-amber-500/30 text-amber-400";
                if (node.type === "memory") colorClass = "from-emerald-500/20 to-emerald-950/40 border-emerald-500/30 text-emerald-400";
                if (node.type === "evaluator") colorClass = "from-red-500/20 to-red-950/40 border-red-500/30 text-red-400";

                return (
                  <motion.div
                    key={node.id}
                    id={`node_card_${node.id}`}
                    className={`absolute z-20 w-[230px] p-3.5 rounded-lg border bg-slate-950/95 shadow-xl cursor-grab active:cursor-grabbing backdrop-blur-md transition-all select-none ${
                      isSelected ? "ring-2 ring-cyan-400 border-cyan-455 bg-slate-900/95" : "border-slate-800 bg-slate-950/95"
                    } ${isConnectingSource ? "ring-2 ring-amber-500 border-amber-500 animate-pulse" : ""}`}
                    style={{ left: node.x, top: node.y }}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`h-2 w-2 rounded-full ${isGenerating[node.id] ? "bg-cyan-450 animate-ping" : node.status === "active" ? "bg-emerald-500" : node.status === "syncing" ? "bg-yellow-400 animate-spin" : "bg-slate-500"}`}></span>
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-400 truncate">{node.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="حذف نود"
                          onMouseDown={e => e.stopPropagation()}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Node Title */}
                    <div style={{ direction: 'rtl' }}>
                      <h4 className="text-[12px] font-bold text-slate-100 truncate mb-1">{node.name}</h4>
                    </div>
                    
                    {/* Embedded platform stats */}
                    {node.config.modelUsed && (
                      <span className="text-[8.5px] text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-900/40 px-1 py-0.5 rounded block mt-1 truncate">
                        {node.config.modelUsed}
                      </span>
                    )}

                    {node.config.engineType && (
                      <span className="text-[8.5px] text-amber-400 font-mono bg-amber-950/40 border border-amber-900/40 px-1 py-0.5 rounded block mt-1 truncate">
                        🎮 {node.config.engineType} Link
                      </span>
                    )}

                    {/* Dynamic Prompt Form inside Node window */}
                    <div className="mt-2" style={{ direction: 'rtl' }} onMouseDown={e => e.stopPropagation()}>
                      <textarea
                        placeholder="درخواست هوش مصنوعی... (مثلا کدهای فیزیک یا کنترلر)"
                        value={nodePrompts[node.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodePrompts(prev => ({ ...prev, [node.id]: val }));
                        }}
                        className="w-full bg-[#050813] border border-slate-800 rounded p-1.5 text-[10px] text-slate-350 focus:outline-none focus:border-cyan-500/50 resize-none h-11 leading-relaxed"
                      />
                    </div>

                    {/* Merge Chainer Selector */}
                    {connections.some(c => c.to === node.id) && (
                      <div className="flex items-center gap-1 mt-1.5" style={{ direction: 'rtl' }} onMouseDown={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          id={`merge_${node.id}`}
                          checked={mergeWithAncestors[node.id] !== false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setMergeWithAncestors(prev => ({ ...prev, [node.id]: val }));
                            addLog(`Toggled prompt merging for node ${node.id}: ${val}`);
                          }}
                          className="rounded border-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 h-3 w-3 accent-cyan-500"
                        />
                        <label htmlFor={`merge_${node.id}`} className="text-[9px] text-cyan-400/80 cursor-pointer">
                          تلفیق با گره‌های ورودی بالادست
                        </label>
                      </div>
                    )}

                    {/* Flow Execution Button inside window */}
                    <div className="mt-2 select-none" onMouseDown={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); executePrompt(node.id); }}
                        disabled={isGenerating[node.id]}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-[10.5px] rounded py-1 px-2.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isGenerating[node.id] ? (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full border border-slate-950 border-t-transparent animate-spin inline-block"></span>
                            <span>در حال محاسبات هوشمند...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-2.5 w-2.5 fill-current" />
                            <span>اجرا و ارسال دستور</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Integrated Outputs indicator - CLI Click details */}
                    {nodeOutputs[node.id] && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); setViewingOutputNodeId(node.id); }}
                        onMouseDown={e => e.stopPropagation()}
                        className="mt-2 p-2 bg-[#050813] border border-cyan-500/10 rounded cursor-pointer hover:border-cyan-500/30 transition-all text-right group relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-[8px] text-cyan-400 font-bold mb-1">
                          <span className="bg-cyan-950/30 px-1 py-0.2 rounded border border-cyan-500/10">مشاهده کامل دستور</span>
                          <span className="flex items-center gap-0.5 text-[8.5px]">ثبت شد <CheckCircle2 className="h-2.1 w-2.1 text-emerald-400" /></span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 line-clamp-2 truncate whitespace-pre-wrap leading-relaxed">
                          {nodeOutputs[node.id]}
                        </p>
                      </div>
                    )}

                    {/* Draggable absolute coordinate indicator */}
                    <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-850 text-[9px] font-mono text-slate-400/80">
                      <span>X:{node.x} Y:{node.y}</span>
                      {isAddingConnection ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); completeConnection(node.id); }}
                          className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500 text-[9.5px] text-amber-300 hover:text-slate-950 px-1.5 rounded transition-all font-bold cursor-pointer"
                        >
                          لینک
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startConnecting(node.id); }}
                          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px] text-cyan-400 px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 cursor-pointer"
                          title="ایجاد مسیر ارتباطی بصری"
                        >
                          <Link className="h-2.5 w-2.5" /> بایندر
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            </div> {/* End of canvas_transform_wrapper */}

            {/* Quick Human-Guided Floating Help Tip (RTL-styled) */}
            <div className="absolute bottom-3 left-3 bg-slate-950/85 border border-teal-900/40 p-2 rounded-lg text-[9.5px] font-mono text-slate-300 pointer-events-none z-30 flex items-center gap-1">
              <span className="text-[#fbbf24] font-bold">💡 {currentLang === "fa" ? "امکان دسترسی سریع" : "Mastery Tip"}:</span> 
              <span>{currentLang === "fa" ? "با ماوس صفحه شبکه را بکشید تا اسلاید شود. با دکمه بایندر گهواره ارتباط بسازید." : "Hold middle mouse or empty grid space to PAN. Scroll/use desk below for zoom scales."}</span>
            </div>

            {/* Scale, Zoom & Canvas Height Control Desk */}
            <div className="absolute bottom-3 right-3 bg-[#05141a]/95 border border-teal-500/30 p-2 rounded-xl flex items-center gap-2 px-3 shadow-[0_4px_24px_rgba(3,25,31,0.6)] z-30 select-none" onMouseDown={e => e.stopPropagation()}>
              <div className="flex items-center gap-1 text-slate-300 border-l border-teal-900/60 pl-2">
                <button 
                  onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))} 
                  className="p-1 px-2.5 bg-slate-950 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-cyan-400 font-bold transition-all text-xs cursor-pointer" 
                  title="کوچک‌نمایی (Zoom Out)"
                >
                  -
                </button>
                <span className="text-[10px] font-mono font-extrabold text-cyan-400 min-w-[#40px] text-center" style={{ direction: 'ltr' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))} 
                  className="p-1 px-2.5 bg-slate-950 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-cyan-400 font-bold transition-all text-xs cursor-pointer" 
                  title="بزرگ‌نمایی (Zoom In)"
                >
                  +
                </button>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                {/* Reset View */}
                <button
                  onClick={() => { setZoom(0.95); setOffsetX(40); setOffsetY(20); }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-teal-950 rounded-lg text-[10px] text-[#fbbf24] hover:text-amber-300 transition-all cursor-pointer font-sans"
                >
                  {currentLang === "fa" ? "بازنشانی خشت" : "Reset View"}
                </button>

                <div className="border-r border-teal-900/60 h-4" />

                {/* Dynamic Resize Sizers */}
                <span className="text-[10px] text-teal-605/80 font-sans hidden sm:inline">{currentLang === "fa" ? "ارتفاع بوم:" : "Canvas Height:"}</span>
                <select
                  value={canvasHeight}
                  onChange={e => setCanvasHeight(Number(e.target.value))}
                  className="bg-slate-950 border border-teal-950 text-[10px] text-teal-400 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value={480}>{currentLang === "fa" ? "استاندارد (۴۸۰)" : "Standard (480px)"}</option>
                  <option value={680}>{currentLang === "fa" ? "وسیع و پهناور (۶۸۰)" : "Comfortable (680px)"}</option>
                  <option value={920}>{currentLang === "fa" ? "نمای فوق کامل (۹۲۰)" : "Expanded Full (920px)"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Node Creator Panel */}
          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
            <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 mb-3">
              <PlusCircle className="h-4 w-4 text-cyan-400" />
              {t.addNodeHeader}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">{t.nodeNameLabel}</label>
                <input
                  type="text"
                  placeholder={t.nodeNamePlaceholder}
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full bg-[#070b19] border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">{t.nodeTypeLabel}</label>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as GraphNode["type"])}
                  className="w-full bg-[#070b19] border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="agent">{t.agentOption}</option>
                  <option value="llm">{t.llmOption}</option>
                  <option value="game_connector">{t.gameOption}</option>
                  <option value="memory">{t.memoryOption}</option>
                  <option value="evaluator">{t.evalOption}</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={addNewNode}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded p-2 text-xs transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" /> {t.nodeBtnAdd}
                </button>
              </div>
            </div>
          </div>

          {/* Terminal Sandbox Simulator Log */}
          <div className="bg-[#050813] border border-slate-800/80 rounded-xl p-3.5 font-mono text-[11px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900 mb-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>{t.visualLogs}</span>
              </div>
              <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-cyan-400 border border-slate-800/40">Active Log Monitor</span>
            </div>
            <div className="space-y-1 max-h-[85px] overflow-y-auto scrollbar-none text-slate-300">
              {graphLogs.map((log, i) => (
                <div key={i} className="leading-relaxed hover:bg-slate-900/40 p-0.5 rounded">
                  <span className="text-cyan-500/70">▶</span> {log}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Configurations Sidepanel (1 column) */}
        <div className="flex flex-col gap-4">
          
          {/* Active Node Configurator Settings */}
          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl flex-grow">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3">
              <h3 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-cyan-400" />
                {currentLang === "fa" ? "پارامترهای نود منتخب" : "Selected Node Attributes"}
              </h3>
              <span className="px-1.5 py-0.5 text-[8.5px] font-mono bg-cyan-950/40 text-cyan-400 rounded">
                Config Engine
              </span>
            </div>

            {currentSelectedNode ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 mb-0.5">{currentLang === "fa" ? "شناسه یکتای نود" : "Unique Node ID"}</span>
                  <span className="font-mono text-cyan-400 p-1 bg-slate-900/60 rounded block text-[10px]">{currentSelectedNode.id}</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{currentLang === "fa" ? "نام نمایشی نود" : "Display Title"}</label>
                  <input
                    type="text"
                    value={currentSelectedNode.name}
                    onChange={(e) => {
                      const updatedName = e.target.value;
                      setNodes(prev => prev.map(n => n.id === currentSelectedNode.id ? { ...n, name: updatedName } : n));
                    }}
                    className="w-full bg-[#050813] border border-slate-800 rounded p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {currentSelectedNode.config.modelUsed !== undefined && (
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{currentLang === "fa" ? "اتصال به مدل هوشمند" : "Language Model Core Instance"}</label>
                    <select
                      value={currentSelectedNode.config.modelUsed}
                      onChange={(e) => {
                        const m = e.target.value;
                        setNodes(prev => prev.map(n => n.id === currentSelectedNode.id ? { ...n, config: { ...n.config, modelUsed: m } } : n));
                        addLog(`Assigned model ${m} targeting node ${currentSelectedNode.id}`);
                      }}
                      className="w-full bg-[#050813] border border-slate-800 rounded p-1.5 text-[10.5px] text-slate-300 focus:outline-none"
                    >
                      <option value="models/gemini-3.5-flash">models/gemini-3.5-flash {currentLang === "fa" ? "(پیشفرض رایگان)" : "(default free)"}</option>
                      <option value="models/gemini-3.1-pro-preview">models/gemini-3.1-pro-preview {currentLang === "fa" ? "(نسخه پرو)" : "(pro model)"}</option>
                      <option value="models/gemini-3.1-flash-lite">models/gemini-3.1-flash-lite</option>
                      <option value="models/gemini-2.5-flash">models/gemini-2.5-flash (legacy)</option>
                    </select>
                  </div>
                )}

                {currentSelectedNode.config.temperature !== undefined && (
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 text-slate-400">
                      <span>{currentLang === "fa" ? "دقت خلاقیت (Temperature)" : "Creativity Precision (Temperature)"}</span>
                      <span className="font-mono text-cyan-400">{currentSelectedNode.config.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentSelectedNode.config.temperature}
                      onChange={(e) => {
                        const temp = parseFloat(e.target.value);
                        setNodes(prev => prev.map(n => n.id === currentSelectedNode.id ? { ...n, config: { ...n.config, temperature: temp } } : n));
                      }}
                      className="w-full accent-cyan-400 cursor-pointer h-1 rounded"
                    />
                  </div>
                )}

                {currentSelectedNode.config.syncPort !== undefined && (
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{currentLang === "fa" ? "پورت همگام‌سازی شبکه" : "Local Sync Port"}</label>
                    <input
                      type="number"
                      value={currentSelectedNode.config.syncPort}
                      onChange={(e) => {
                        const p = parseInt(e.target.value);
                        setNodes(prev => prev.map(n => n.id === currentSelectedNode.id ? { ...n, config: { ...n.config, syncPort: p } } : n));
                      }}
                      className="w-full bg-[#050813] border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500 italic block">
                    {currentLang === "fa" ? "این نود هم‌اکنون به صورت لایو با استودیو مانیتورینگ متصل است و کدهای ارسالی را روی بستر سرور پردازش می‌کند." : "This node is currently connected live with monitoring studio and proxies code queries on server."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center gap-2">
                <AlertCircle className="h-6 w-6 text-slate-600 animate-pulse" />
                <span className="text-[11px] font-mono leading-relaxed">
                  {currentLang === "fa" ? "هیچ نودی انتخاب نشده است. برای ویرایش و تنظیم پارامترها روی یک نود کلیک کنید." : "No node selected. Click any node on the blueprint to configure its parameters."}
                </span>
              </div>
            )}
          </div>

          {/* Connectors to external Tools and Game Engines */}
          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
            <h3 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-3">
              <Gamepad2 className="h-4 w-4 text-cyan-400" />
              {t.gameEngineConnectors}
            </h3>

            <div className="space-y-2.5">
              
              {/* Unity connector */}
              <div className="flex items-center justify-between p-1.5 bg-[#050813] border border-slate-900 rounded">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${ideLink.unityConnected ? "bg-emerald-500" : "bg-slate-700"}`}></span>
                  <span className="text-[11px] text-slate-300">{t.unityEngine}</span>
                </div>
                <button
                  onClick={() => {
                    setIdeLink(prev => ({ ...prev, unityConnected: !prev.unityConnected }));
                    addLog(`Unity Connection toggled: ${!ideLink.unityConnected ? 'Online' : 'Standby'}`);
                  }}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${ideLink.unityConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 border border-transparent"}`}
                >
                  {ideLink.unityConnected ? (currentLang === "fa" ? "برقرار" : "Linked") : (currentLang === "fa" ? "اتصال P2P" : "P2P Link")}
                </button>
              </div>

              {/* Unreal Connector */}
              <div className="flex items-center justify-between p-1.5 bg-[#050813] border border-slate-900 rounded">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${ideLink.unrealConnected ? "bg-emerald-500" : "bg-slate-700"}`}></span>
                  <span className="text-[11px] text-slate-300">{t.unrealEngine}</span>
                </div>
                <button
                  onClick={() => {
                    setIdeLink(prev => ({ ...prev, unrealConnected: !prev.unrealConnected }));
                    addLog(`Unreal Live Socket toggled: ${!ideLink.unrealConnected ? 'Connected on port 9042' : 'Standby'}`);
                  }}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${ideLink.unrealConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 border border-transparent"}`}
                >
                  {ideLink.unrealConnected ? (currentLang === "fa" ? "برقرار" : "Linked") : (currentLang === "fa" ? "اتصال P2P" : "P2P Link")}
                </button>
              </div>

              {/* VS Code Socket */}
              <div className="flex items-center justify-between p-1.5 bg-[#050813] border border-slate-900 rounded">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${ideLink.vscodeConnected ? "bg-emerald-500" : "bg-slate-700"}`}></span>
                  <span className="text-[11px] text-slate-300">{t.vscode}</span>
                </div>
                <button
                  onClick={() => {
                    setIdeLink(prev => ({ ...prev, vscodeConnected: !prev.vscodeConnected }));
                    addLog(`VS Code dynamic watch initialized.`);
                  }}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${ideLink.vscodeConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 border border-transparent"}`}
                >
                  {ideLink.vscodeConnected ? (currentLang === "fa" ? "برقرار" : "Linked") : (currentLang === "fa" ? "اتصال P2P" : "P2P Link")}
                </button>
              </div>

              {/* Cursor Socket */}
              <div className="flex items-center justify-between p-1.5 bg-[#050813] border border-slate-900 rounded">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${ideLink.cursorConnected ? "bg-emerald-500" : "bg-slate-700"}`}></span>
                  <span className="text-[11px] text-slate-300">{t.cursor}</span>
                </div>
                <button
                  onClick={() => {
                    setIdeLink(prev => ({ ...prev, cursorConnected: !prev.cursorConnected }));
                    addLog(`Cursor AI workspace synchronization started.`);
                  }}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${ideLink.cursorConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 border border-transparent"}`}
                >
                  {ideLink.cursorConnected ? (currentLang === "fa" ? "برقرار" : "Linked") : (currentLang === "fa" ? "اتصال P2P" : "P2P Link")}
                </button>
              </div>

            </div>
          </div>

          {/* Team Collaboration Panel */}
          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
            <h3 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-3">
              <Users className="h-4 w-4 text-cyan-400" />
              {t.teamCollaboration}
            </h3>

            {/* Local Synchronizer Switch vs Cloud Database Sync */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-900/60 p-1 rounded-lg">
              <button
                onClick={() => {
                  setSyncMode("local");
                  addLog("Switched project sync to Intranet Loop P2P mode.");
                }}
                className={`px-1.5 py-1 text-[9.5px] font-mono font-bold rounded transition-all text-center cursor-pointer ${
                  syncMode === "local" ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                {currentLang === "fa" ? "شبکه محلی P2P" : "P2P Intranet Sync"}
              </button>
              <button
                onClick={() => {
                  setSyncMode("cloud");
                  addLog("Switched telemetry sync to Cloud Database (PostgreSQL/Firebase).");
                }}
                className={`px-1.5 py-1 text-[9.5px] font-mono font-bold rounded transition-all text-center cursor-pointer ${
                  syncMode === "cloud" ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400" : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                {currentLang === "fa" ? "همگام‌سازی ابری زنده" : "Live Cloud Sync"}
              </button>
            </div>

            {/* Sync Mode Details message */}
            <div className="bg-slate-900/40 p-2 border border-slate-900 rounded text-[10.5px] text-slate-400 mb-3 space-y-1">
              {syncMode === "local" ? (
                <>
                  <p className="text-cyan-400 font-bold">{currentLang === "fa" ? "📡 اتصال محلی برقرار است" : "📡 Local Loop Active"}</p>
                  <p>{currentLang === "fa" ? "برودکست همزمان روی بسترهای محلی پورت ۹۰۴۲. همکاران شبکه داخلی بدون نیاز به اینترنت می‌توانند نودها را همگام کنند." : "Broadcasting live on port 9042. Local subnet peers can view and sync other canvas changes instantly without internet."}</p>
                </>
              ) : (
                <>
                  <p className="text-emerald-400 font-bold">{currentLang === "fa" ? "☁️ اتصال ابری برقرار است" : "☁️ Realtime Cloud Active"}</p>
                  <p>{currentLang === "fa" ? "کل اینترفیس بلپرینت به دیتابیس همزمان ابری متصل است؛ تغییرات موقعیت و پیکربندی گره‌ها فوراً برای کل اعضای تیم همگام می‌شود." : "The blueprint coordinate tree is saved to the cloud database; peer node movements and actions synchronize for all co-developers in real-time."}</p>
                </>
              )}
            </div>

            {/* Teammates List */}
            <div className="space-y-1.5 mb-3.5">
              <span className="block text-[10px] text-slate-400 font-mono mb-1">{t.activeCollaborators}</span>
              {teammates.map((tm, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-900/40 rounded text-xs">
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${tm.status === "online" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                    <span className="font-semibold text-slate-300">{tm.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{tm.role}</span>
                </div>
              ))}
            </div>

            {/* Add Teammate Simulator input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={t.collaboratorPlaceholder}
                value={newTeammateName}
                onChange={(e) => setNewTeammateName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 flex-grow"
              />
              <button
                onClick={() => {
                  if (!newTeammateName.trim()) return;
                  setTeammates(prev => [...prev, { name: newTeammateName, role: "AI Dev", status: "online", activeNode: "node_1" }]);
                  addLog(`Simulated collaboration session invite sent to ${newTeammateName}`);
                  setNewTeammateName("");
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded px-2.5 transition-colors cursor-pointer"
              >
                {t.collaboratorLabel}
              </button>
            </div>
          </div>

          {/* Blueprint Export Action block */}
          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl text-center">
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(getJSONBlueprintStr());
                const dlAnchor = document.createElement('a');
                dlAnchor.setAttribute("href", dataStr);
                dlAnchor.setAttribute("download", "framework_blueprint.json");
                dlAnchor.click();
                addLog("Exported JSON system blueprint file.");
              }}
              className="w-full bg-[#1e293b]/50 border border-cyan-500/20 hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-400 font-bold text-xs rounded p-2.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {t.exportBlueprint}
            </button>
          </div>

        </div>
      </div>

      {/* Node Output Viewer Modal (with clipboard copy, Farsi language, and syntax layout) */}
      <AnimatePresence>
        {viewingOutputNodeId && (() => {
          const vNode = nodes.find(n => n.id === viewingOutputNodeId);
          const outputText = nodeOutputs[viewingOutputNodeId] || "";
          const promptText = nodePrompts[viewingOutputNodeId] || "";
          if (!vNode) return null;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-text"
              onClick={() => setViewingOutputNodeId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-[#0b1329] border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
                style={{ direction: 'rtl' }}
              >
                {/* Modal Title bar */}
                <div className="flex items-center justify-between bg-slate-950 p-4 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-cyan-400 rotate-12" />
                    <span className="text-sm font-bold text-slate-100">نمایشگر هوشمند خروجی دستورالعمل (Graph.Plus)</span>
                  </div>
                  <button 
                    onClick={() => setViewingOutputNodeId(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded transition-colors cursor-pointer"
                  >
                    بستن پنجره
                  </button>
                </div>

                {/* Info summary strip */}
                <div className="bg-[#050813] px-5 py-3 border-b border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-500 font-bold">گره منبع:</span>
                    <span className="text-cyan-400 font-semibold">{vNode.name} ({vNode.id})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-500 font-bold">مدل هوش زاینده:</span>
                    <span className="text-purple-400 font-semibold">{vNode.config.modelUsed || "models/gemini-3.5-flash"}</span>
                  </div>
                </div>

                {/* Modal Scroll content area */}
                <div className="p-5 overflow-y-auto space-y-4">
                  {/* User prompt / instruct */}
                  <div className="bg-slate-900/40 p-3.5 border border-slate-800/60 rounded-lg">
                    <span className="block text-[10.5px] text-slate-500 font-bold uppercase mb-1">دستور نود (Prompt)</span>
                    <p className="text-slate-200 text-xs leading-relaxed leading-6 whitespace-pre-wrap">{promptText || "هنوز هیچ پرامپتی تایپ نشده است."}</p>
                  </div>

                  {/* Generated code output */}
                  <div className="relative">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mb-1.5 px-0.5">
                      <span>خروجی و اسکریپت تولید شده نهایی:</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(outputText);
                          addLog(`نسخه‌برداری خروجی گره انجام گردید.`);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/10 cursor-pointer"
                      >
                        کپی کردن متن خروجی
                      </button>
                    </div>
                    {outputText ? (
                      <pre className="bg-[#03060f] p-4 rounded-xl border border-slate-900/80 overflow-x-auto text-[11px] text-cyan-350 leading-relaxed max-h-[350px] scrollbar-thin scrollbar-thumb-slate-800 text-left" style={{ direction: 'ltr' }}>
                        <code>{outputText}</code>
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 bg-[#03060f] border border-dashed border-slate-800 rounded-xl text-slate-500 space-y-2">
                        <AlertCircle className="h-8 w-8 text-slate-700 animate-pulse" />
                        <p className="text-xs">هیچ خروجی هنوز ثبت نشده است. دکمه «اجرا و ارسال دستور» را در نود کلیک کنید.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between bg-slate-950/50 p-4 border-t border-slate-900 text-xs text-slate-500">
                  <span>وضعیت اتصال: ۱۰۰٪ همگام با دیتابیس</span>
                  <span className="font-mono">Port: 3000 / Workspace: Graph.Plus</span>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
