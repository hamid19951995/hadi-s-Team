import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MemoryEntry, MemoryType } from "../types";
import { Brain, Search, Info, Trash2, TrendingDown, BookOpen, Clock, Activity, RotateCcw } from "lucide-react";

// Seed default simulated memory entries matching the core python files and schemas
const INITIAL_MEMORIES: MemoryEntry[] = [
  {
    memory_id: "m_1",
    type: MemoryType.EPISODIC,
    content: "Initiated orchestrator pipeline run_id: 'db4230d3-3a17-48f4-a63e-63f69904791e'. Constructed architectural design nodes.",
    decay_factor: 0.95,
    metadata: { task_id: "db4230d3", phase: "initialization", step: "1", tags: ["orchestrator", "runner"] },
    created_at: "2026-06-11T13:30:15Z"
  },
  {
    memory_id: "m_2",
    type: MemoryType.EPISODIC,
    content: "CoderAgent executed tool edit_file on '/src/main.tsx'. Applied replacement block content to mount dark canvas.",
    decay_factor: 0.9,
    metadata: { task_id: "a39103fb", tool: "edit_file", tags: ["coder_agent", "filesystem"] },
    created_at: "2026-06-11T13:32:45Z"
  },
  {
    memory_id: "m_3",
    type: MemoryType.SEMANTIC,
    content: "Architecture rule: All custom react-Vite development servers must bind exclusively to port 3000 to clear proxy routers.",
    decay_factor: 1.0,
    metadata: { topic: "environment", tags: ["ports", "vite", "proxies"] },
    created_at: "2026-06-10T09:12:00Z"
  },
  {
    memory_id: "m_4",
    type: MemoryType.SEMANTIC,
    content: "Standard routing pattern: Sensitive API integrations require dedicated server-side Express proxy handles to hide raw secret headers.",
    decay_factor: 0.85,
    metadata: { topic: "security", tags: ["security", "proxy", "keys"] },
    created_at: "2026-06-11T08:45:00Z"
  },
  {
    memory_id: "m_5",
    type: MemoryType.PROCEDURAL,
    content: "Task Graph solver template: KAHN_TOPOLOGICAL_STABILITY (Verify graph dependency integrity, locate root nodes with in-degree == 0).",
    decay_factor: 1.0,
    metadata: { workflow: "graph_verification", tags: ["algorithms", "topological", "dag"] },
    created_at: "2026-06-11T10:00:00Z"
  },
  {
    memory_id: "m_6",
    type: MemoryType.WORKING,
    content: "Parsing local package.json to identify candidate framework dependencies. Identified react=19.0.1 and express=4.21.2.",
    decay_factor: 0.75,
    metadata: { task_id: "891fa30a", topic: "dependency_check", tags: ["package", "npm"] },
    created_at: "2026-06-11T14:40:00Z"
  },
  {
    memory_id: "m_7",
    type: MemoryType.WORKING,
    content: "Active edit marker: Modifying /src/App.tsx line 45-60. Injecting tab state handlers and sidebar visual triggers.",
    decay_factor: 0.7,
    metadata: { task_id: "891fa30a", topic: "editing", tags: ["app", "ui"] },
    created_at: "2026-06-11T14:41:30Z"
  }
];

export default function MemoryManagerView() {
  const [memories, setMemories] = useState<MemoryEntry[]>(INITIAL_MEMORIES);
  const [activeTab, setActiveTab] = useState<MemoryType>(MemoryType.SEMANTIC);
  const [searchQuery, setSearchQuery] = useState("");
  const [decayActivated, setDecayActivated] = useState(false);

  // Handle similarity querying mimicking Python's MemoryManager keyword lookup
  const handleSearchQueryResult = () => {
    if (!searchQuery.trim()) {
      return memories.filter(m => m.type === activeTab);
    }
    
    const queryTokens = searchQuery.toLowerCase().split(/\s+/);
    
    const scoredMemories = memories.map(entry => {
      let score = 0;
      const contentTokens = entry.content.toLowerCase().split(/\W+/);
      
      // Calculate token intersection overlaps
      queryTokens.forEach(token => {
        if (contentTokens.includes(token)) score += 1.0;
        
        // Metadata tagging matching gains
        const tags = entry.metadata.tags || [];
        if (tags.some((tag: string) => tag.toLowerCase() === token)) score += 0.5;
        
        const topic = entry.metadata.topic || entry.metadata.workflow || "";
        if (topic.toLowerCase().includes(token)) score += 0.4;
      });

      return { entry, score: score * entry.decay_factor };
    });

    return scoredMemories
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.entry);
  };

  const displayedMemories = handleSearchQueryResult().filter(m => searchQuery.trim() ? true : m.type === activeTab);

  // decay simulation cycle which diminishes weights on items
  const handleSimulateDecayCycle = () => {
    setMemories(prev =>
      prev.map(m => {
        let rate = 0.05;
        if (m.type === MemoryType.WORKING) rate = 0.15; // Working memory decays much faster
        return {
          ...m,
          decay_factor: Math.max(0.05, parseFloat((m.decay_factor - rate).toFixed(2)))
        };
      })
    );
    setDecayActivated(true);
    setTimeout(() => setDecayActivated(false), 800);
  };

  // working memory consolidation mimicking Python logic
  const handleTriggerConsolidation = () => {
    const workingItems = memories.filter(m => m.type === MemoryType.WORKING);
    if (workingItems.length === 0) return;

    // Synthesize consolidated semantic fact and insert
    const consolidatedFact = `Consolidated understanding from active working session: ${workingItems.map(w => w.content).join(" & ")}`;
    
    const newSemanticEntry: MemoryEntry = {
      memory_id: `m_c_${Date.now()}`,
      type: MemoryType.SEMANTIC,
      content: consolidatedFact,
      decay_factor: 1.0,
      metadata: { topic: "consolidated_fact", constructed_from: "consolidation_job", sources: workingItems.map(w => w.memory_id) },
      created_at: new Date().toISOString()
    };

    // Remove working items and insert semantic entry
    setMemories(prev => [
      ...prev.filter(m => m.type !== MemoryType.WORKING),
      newSemanticEntry
    ]);
    
    // Switch active tab to semantic to show results
    setActiveTab(MemoryType.SEMANTIC);
  };

  // Reset memories back to seed
  const handleResetMemories = () => {
    setMemories(INITIAL_MEMORIES);
  };

  return (
    <div className="space-y-6" id="memory_explorer_panel">
      {/* Quick stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(MemoryType).map((type) => {
          const count = memories.filter(m => m.type === type).length;
          const colors = {
            [MemoryType.EPISODIC]: "border-sky-500/20 text-sky-400 bg-sky-950/10",
            [MemoryType.SEMANTIC]: "border-emerald-500/20 text-emerald-400 bg-emerald-950/10",
            [MemoryType.PROCEDURAL]: "border-purple-500/20 text-purple-400 bg-purple-950/10",
            [MemoryType.WORKING]: "border-amber-500/20 text-amber-400 bg-amber-950/10"
          };
          return (
            <div key={type} className={`p-4 border rounded-xl flex flex-col justify-between ${colors[type]}`}>
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider block opacity-80">
                {type} Zone
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-mono font-bold leading-none">{count}</span>
                <span className="text-[9.5px] font-mono text-slate-400">Entries</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-[#1e293b]/40 p-4 rounded-xl border border-slate-800/85">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="memory_search_input"
            type="text"
            placeholder="Search matching content, tags or keys (simulated cosine scores)..."
            className="w-full pl-9 pr-4 py-2 bg-[#0f172a] border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all font-sans"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={handleSimulateDecayCycle}
            disabled={decayActivated}
            className={`px-3 py-2 bg-[#0f172a] border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-300 transition-all cursor-pointer flex items-center gap-2 ${decayActivated ? "ring-1 ring-rose-500/40" : ""}`}
          >
            <TrendingDown className="h-4.5 w-4.5 text-rose-400" />
            Decay Cycle
          </button>
          
          <button
            onClick={handleTriggerConsolidation}
            disabled={memories.filter(m => m.type === MemoryType.WORKING).length === 0}
            className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sky-500 text-slate-950 font-sans font-medium text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Brain className="h-4.5 w-4.5" />
            Consolidate Working
          </button>

          <button
            onClick={handleResetMemories}
            className="p-2 bg-[#0f172a] border border-slate-800 hover:border-slate-700 text-slate-400 rounded-lg transition-all cursor-pointer"
            title="Reset storage to defaults"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main split dashboard panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Category Filter Tab Selector (Left) */}
        {!searchQuery.trim() && (
          <div className="xl:col-span-3 space-y-1.5">
            <h4 className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-widest px-1.5 mb-2.5">
              Memory partitions
            </h4>
            {Object.values(MemoryType).map((type) => (
              <button
                key={type}
                id={`memory_tab_${type}`}
                onClick={() => setActiveTab(type)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center gap-3 cursor-pointer ${
                  activeTab === type
                    ? "bg-[#1e293b]/40 border-sky-500/40 text-sky-400 font-medium"
                    : "bg-[#0f172a] border-slate-800/85 hover:bg-slate-900/40 hover:border-slate-800 text-slate-400"
                }`}
              >
                <div className="bg-[#090d16] p-1.5 rounded border border-slate-800">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div>
                  <span className="text-xs font-mono font-medium capitalize block">{type} stores</span>
                  <span className="text-[10px] text-slate-500 font-sans block">
                    {type === MemoryType.WORKING && "Fast-decay buffers"}
                    {type === MemoryType.SEMANTIC && "Long-term rules & facts"}
                    {type === MemoryType.EPISODIC && "Footprints & tool results"}
                    {type === MemoryType.PROCEDURAL && "Workflow planning DAGs"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Entries Display list (Right) */}
        <div className={searchQuery.trim() ? "xl:col-span-12 space-y-4" : "xl:col-span-9 space-y-4"}>
          {searchQuery.trim() && (
            <div className="flex items-center gap-2 bg-[#1e293b]/20 p-2.5 py-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <Info className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>
                Search results ranked by token-overlap similarity and decaying weights (Pydantic <code className="text-amber-400">MemoryEntry.decay_factor</code>).
              </span>
            </div>
          )}

          <AnimatePresence mode="popLayout animate-none">
            {displayedMemories.map((entry, idx) => {
              const capType = entry.type.toUpperCase();
              const badgeColors = {
                [MemoryType.EPISODIC]: "bg-sky-500/5 text-sky-400 border-sky-500/20",
                [MemoryType.SEMANTIC]: "bg-emerald-500/5 text-emerald-400 border-emerald-500/20",
                [MemoryType.PROCEDURAL]: "bg-purple-500/5 text-purple-400 border-purple-500/20",
                [MemoryType.WORKING]: "bg-amber-500/5 text-amber-400 border-amber-500/20"
              };
              
              return (
                <motion.div
                  key={entry.memory_id}
                  id={`memory_row_${entry.memory_id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all space-y-3.5 shadow"
                >
                  {/* Headline */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono tracking-wide px-2.5 py-0.5 rounded border ${badgeColors[entry.type]}`}>
                        {capType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 select-all">
                        ID: {entry.memory_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      {/* Decay Factor tracking */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase">salience weight:</span>
                        <div className="h-2 w-16 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              entry.decay_factor > 0.7
                                ? "bg-emerald-500"
                                : entry.decay_factor > 0.4
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${entry.decay_factor * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10.5px] font-semibold text-slate-300">
                          {Math.round(entry.decay_factor * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core content text segment */}
                  <div className="text-xs text-slate-200 bg-[#090d16]/30 p-3.5 rounded-lg border border-slate-800/40 leading-relaxed font-sans font-normal select-text">
                    {entry.content}
                  </div>

                  {/* Metadata and creation timelines */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10.5px] font-mono mt-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(entry.metadata).map(([k, v]) => (
                        <span key={k} className="bg-slate-800/30 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
                          <code className="text-sky-400/80">{k}=</code>
                          {Array.isArray(v) ? `[${v.length}]` : String(v)}
                        </span>
                      ))}
                    </div>

                    <span className="text-[9.5px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Absorbed: {entry.created_at}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {displayedMemories.length === 0 && (
            <div className="text-center py-16 bg-[#0f172a]/30 border border-slate-800/60 rounded-xl">
              <Brain className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">This memory zone contains no active records.</p>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === MemoryType.WORKING
                  ? "Working memory buffers are currently empty. Run campaigns to stream logs here."
                  : "Insert facts or initiate orchestrations to populate logs here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
