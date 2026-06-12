import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DEFAULT_PROVIDERS,
  PROVIDER_MODELS,
  ProviderConfig,
  AIProviderId,
  routeLLMRequest,
  RateLimiter,
  AdapterResponse,
  RoutingTrace
} from "../lib/ai-providers";
import {
  Cpu, Settings2, Sliders, Play, AlertCircle, CheckCircle2,
  ListOrdered, Zap, ShieldAlert, KeyRound, ArrowRightLeft,
  RefreshCw, Terminal, Eye, EyeOff, RotateCcw, Plus, Trash2,
  Activity, Sparkles, HelpCircle, Server
} from "lucide-react";

export default function AIProviderConfigView() {
  // Config States
  const [configs, setConfigs] = useState<Record<AIProviderId, ProviderConfig>>(DEFAULT_PROVIDERS);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  // Routing Fallback Chain States
  const [fallbackSequence, setFallbackSequence] = useState<{ id: string; provider: AIProviderId; model: string }[]>([
    { id: "s1", provider: "google", model: "gemini-3.5-flash" },
    { id: "s2", provider: "openai", model: "gpt-4o-mini" },
    { id: "s3", provider: "compatible", model: "mistralai/Mixtral-8x7B-Instruct-v0.1" },
  ]);

  // Test Runner States
  const [testPrompt, setTestPrompt] = useState("Explain topological sort algorithms simply in bullet points.");
  const [isRouting, setIsRouting] = useState(false);
  const [routeResult, setRouteResult] = useState<{ response: AdapterResponse; traces: RoutingTrace[] } | null>(null);
  
  // Custom Fallback Config Controls
  const [newProv, setNewProv] = useState<AIProviderId>("openai");
  const [newMod, setNewMod] = useState("");

  // Sync newMod dropdown when selection changes
  useEffect(() => {
    const models = PROVIDER_MODELS[newProv];
    if (models && models.length > 0) {
      setNewMod(models[0].id);
    }
  }, [newProv]);

  const handleUpdateConfigValue = (providerId: AIProviderId, key: keyof ProviderConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [key]: value
      }
    }));
  };

  const toggleKeyVisibility = (provId: string) => {
    setShowKeys(prev => ({ ...prev, [provId]: !prev[provId] }));
  };

  // Add a layer to fallback loop
  const handleAddFallbackLevel = () => {
    const id = `f_${Date.now()}`;
    setFallbackSequence(prev => [...prev, { id, provider: newProv, model: newMod }]);
  };

  const handleRemoveFallbackLevel = (idx: number) => {
    setFallbackSequence(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setFallbackSequence(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const handleMoveDown = (idx: number) => {
    if (idx === fallbackSequence.length - 1) return;
    setFallbackSequence(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  // Test Runner
  const handleExecuteRoutingTest = async (forceType?: "normal" | "timeout" | "limit") => {
    setIsRouting(true);
    setRouteResult(null);

    // Prepare configs with artificial overrides if simulation triggers are checked
    const testConfigs = { ...configs };

    if (forceType === "timeout") {
      // Set very small timeouts on all configured options to trigger a timeout fall-through
      Object.keys(testConfigs).forEach(pk => {
        testConfigs[pk as AIProviderId] = {
          ...testConfigs[pk as AIProviderId],
          timeoutMs: 50, // 50ms will guarantee complete timeout abort cascades
        };
      });
    } else if (forceType === "limit") {
      // Seed past requests in local RateLimiter to force immediate 429 locks
      Object.keys(testConfigs).forEach(pk => {
        const prov = pk as AIProviderId;
        const configNode = testConfigs[prov];
        RateLimiter.reset(prov);
        for (let i = 0; i < configNode.rateLimitMax + 2; i++) {
          RateLimiter.recordRequest(prov);
        }
      });
    } else {
      // Clear all limits for a clean operation run
      Object.keys(testConfigs).forEach(pk => {
        RateLimiter.reset(pk as AIProviderId);
      });
    }

    // Add mock simulation hook to bypass live requests if no key is supplied
    const routingChain = fallbackSequence.map(s => ({ provider: s.provider, model: s.model }));
    const result = await routeLLMRequest(
      forceType ? `${testPrompt} __MOCK_SIMULATE__` : testPrompt,
      testConfigs,
      routingChain
    );

    setRouteResult(result);
    setIsRouting(false);
  };

  const handleResetSimulationRateLimits = () => {
    Object.keys(configs).forEach(pk => {
      RateLimiter.reset(pk as AIProviderId);
    });
    alert("Rate limits successfully cleared across all 7 AI Provider adapters!");
  };

  return (
    <div className="space-y-6" id="ai_provider_panel">
      {/* Intro Header Banner Block */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-sky-500/5 rounded-full blur-2xl"></div>
        <div className="space-y-1 relative z-10 w-full md:max-w-2xl">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4.5 w-4.5 text-sky-400" />
            <h2 className="text-sm font-mono font-bold tracking-tight text-slate-100 uppercase">
              Universal Multi-Provider AI Routing Integration
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Pluggable interface for standard AI providers. Synchronizes endpoints with customized rate limits, 
            adjustable latency bounds, and autonomous fallbacks. If any API call fails due to rate limits or network issues, 
            the pipeline instantly reroutes down the fallback hierarchy.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={handleResetSimulationRateLimits}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10.5px] font-mono text-slate-400 rounded border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer leading-none"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear Simulator Limits
          </button>
          <div className="px-3.5 py-2 rounded bg-slate-950 border border-slate-850 text-[10px] font-mono text-slate-500 flex items-center justify-center">
            7 Targets Registered
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Pluggable Providers Configurations Panel */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-[#0f172a] rounded-xl border border-slate-800/85 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/40 bg-slate-900/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-sky-400" />
                <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Provider Configurations &amp; Secret Scopes
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Active Settings
              </span>
            </div>

            <div className="p-5 divide-y divide-slate-850 space-y-4">
              {(Object.values(configs) as ProviderConfig[]).map((prov, pIdx) => {
                const modelsList = PROVIDER_MODELS[prov.providerId] || [];
                const isShowingKey = showKeys[prov.providerId] || false;
                
                return (
                  <div
                    key={prov.providerId}
                    id={`prov_card_${prov.providerId}`}
                    className={`pt-4 first:pt-0 pb-2 flex flex-col md:flex-row gap-4 justify-between items-start ${
                      pIdx > 0 ? "border-t border-slate-800/30" : ""
                    }`}
                  >
                    {/* Provider Identification Info */}
                    <div className="w-full md:w-1/4 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-center text-sky-400 font-mono text-xs font-bold">
                          {pIdx + 1}
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-200 block">
                            {prov.name}
                          </span>
                          <code className="text-[9.5px] font-mono text-slate-500 uppercase">
                            ID: {prov.providerId}
                          </code>
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-400 pl-9 pr-2">
                        {modelsList.length} default model profiles supported.
                      </p>
                    </div>

                    {/* Inputs parameters */}
                    <div className="w-full md:w-3/4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Base URL */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-mono text-slate-500 block">Base API Route URL</label>
                        <input
                          type="text"
                          className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                          value={prov.baseUrl}
                          onChange={(e) => handleUpdateConfigValue(prov.providerId, "baseUrl", e.target.value)}
                        />
                      </div>

                      {/* Selected Model */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 block">Default Run Model</label>
                        <select
                          className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-sky-400 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/40 cursor-pointer"
                          value={prov.selectedModel}
                          onChange={(e) => handleUpdateConfigValue(prov.providerId, "selectedModel", e.target.value)}
                        >
                          {modelsList.map(mod => (
                            <option key={mod.id} value={mod.id}>{mod.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Limit / metrics settings */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 block">Timeout limit (ms)</label>
                        <input
                          type="number"
                          step="500"
                          min="100"
                          className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-amber-500 font-mono focus:outline-none"
                          value={prov.timeoutMs}
                          onChange={(e) => handleUpdateConfigValue(prov.providerId, "timeoutMs", parseInt(e.target.value) || 1000)}
                        />
                      </div>

                      {/* API Credentials */}
                      <div className="space-y-1 sm:col-span-2 relative">
                        <label className="text-[10px] font-mono text-slate-500 block flex justify-between">
                          <span>API Secret Token Key</span>
                          <span className="text-[9px] text-slate-500 italic">Leaves empty for Simulation</span>
                        </label>
                        <div className="relative">
                          <input
                            type={isShowingKey ? "text" : "password"}
                            placeholder={["ollama", "lmstudio"].includes(prov.providerId) ? "No auth token required (Internal Host)" : "Enter API key string..."}
                            disabled={["ollama", "lmstudio"].includes(prov.providerId)}
                            className="w-full bg-[#090d16] border border-slate-800 rounded pl-8 pr-12 py-1.5 text-xs text-slate-200 font-mono focus:outline-none disabled:opacity-40"
                            value={prov.apiKey}
                            onChange={(e) => handleUpdateConfigValue(prov.providerId, "apiKey", e.target.value)}
                          />
                          <KeyRound className="h-3.5 w-3.5 text-slate-600 absolute left-2.5 top-2.5" />
                          <button
                            onClick={() => toggleKeyVisibility(prov.providerId)}
                            disabled={["ollama", "lmstudio"].includes(prov.providerId)}
                            className="absolute right-2 top-1.5 p-1 hover:bg-slate-800 text-slate-400 rounded cursor-pointer disabled:opacity-0"
                          >
                            {isShowingKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Rate Limit Max */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 block">Rate Limit (RPM)</label>
                        <input
                          type="number"
                          className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none"
                          value={prov.rateLimitMax}
                          onChange={(e) => handleUpdateConfigValue(prov.providerId, "rateLimitMax", parseInt(e.target.value) || 0)}
                        />
                      </div>

                      {/* Window duration */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 block">Limit Window (ms)</label>
                        <input
                          type="number"
                          step="10000"
                          className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400 font-mono focus:outline-none"
                          value={prov.rateLimitWindowMs}
                          onChange={(e) => handleUpdateConfigValue(prov.providerId, "rateLimitWindowMs", parseInt(e.target.value) || 60000)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: plubgale Model Router Pipeline Configurator */}
        <div className="xl:col-span-4 space-y-6">
          {/* Dynamic Fallback Chain Editor */}
          <div className="bg-[#0f172a] border border-slate-800/85 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800/40 pb-3">
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ListOrdered className="h-4.5 w-4.5 text-sky-400" /> Fallback Scheduling Pipeline
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-1">
                Establish the custom hierarchical routing chain. If an LLM request fails, the router traverses sequential fallback adapters instantly.
              </p>
            </div>

            {/* Pipeline Step List UI */}
            <div className="space-y-2">
              {fallbackSequence.map((step, sIdx) => (
                <div
                  key={step.id}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Index Bullet Number */}
                    <span className="h-5 w-5 bg-[#0f172a] border border-slate-800 rounded flex items-center justify-center font-bold text-[9.5px] text-sky-450">
                      {sIdx + 1}
                    </span>
                    <div>
                      <span className="text-slate-200 capitalize font-medium text-[11px] block">
                        {configs[step.provider]?.name}
                      </span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block truncate max-w-[170px]">
                        {step.model}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleMoveUp(sIdx)}
                      disabled={sIdx === 0}
                      className="p-1 bg-[#12192c] hover:bg-slate-800 rounded text-slate-400 hover:text-sky-400 text-[10px] cursor-pointer disabled:opacity-20"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveDown(sIdx)}
                      disabled={sIdx === fallbackSequence.length - 1}
                      className="p-1 bg-[#12192c] hover:bg-slate-800 rounded text-slate-400 hover:text-sky-400 text-[10px] cursor-pointer disabled:opacity-20"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => handleRemoveFallbackLevel(sIdx)}
                      className="p-1 bg-[#1a0f1d] hover:bg-rose-950 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {fallbackSequence.length === 0 && (
                <div className="text-center py-8 bg-slate-950/40 border border-dashed border-slate-850 rounded-lg text-slate-600 text-[11px]">
                  No model layers added to sequence loop. Standard routing default backup will be injected on test dispatch.
                </div>
              )}
            </div>

            {/* Quick Add Level Form block */}
            <div className="bg-[#090d16] p-3 rounded-lg border border-slate-850 space-y-2.5">
              <span className="text-[9.5px] font-mono uppercase text-sky-500 font-semibold block">Add Routing Layer Step</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">Provider Source</label>
                  <select
                    className="w-full bg-[#0f172a] border border-slate-800 rounded py-1 px-1.5 text-xs text-slate-300"
                    value={newProv}
                    onChange={(e) => setNewProv(e.target.value as AIProviderId)}
                  >
                    {(Object.values(configs) as ProviderConfig[]).map(p => (
                      <option key={p.providerId} value={p.providerId}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">Target Model</label>
                  <select
                    className="w-full bg-[#0f172a] border border-slate-800 rounded py-1 px-1.5 text-xs text-sky-400"
                    value={newMod}
                    onChange={(e) => setNewMod(e.target.value)}
                  >
                    {(PROVIDER_MODELS[newProv] || []).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddFallbackLevel}
                className="w-full py-1.5 bg-[#1e293b]/50 border border-sky-500/25 text-sky-400 hover:bg-[#1e293b] text-xs font-mono rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Append Fallback Stage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pluggable Test debug console and Execution Timeline */}
      <div className="bg-[#0f172a] border border-slate-800/85 rounded-xl p-5 space-y-5">
        <div className="border-b border-slate-800/40 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-widest">
              Live Router Test Debugger Console
            </h3>
          </div>
          <span className="bg-[#090d16] border border-slate-850 px-2 py-0.5 rounded text-[9.5px] font-mono text-emerald-400 uppercase">
            Pluggable Console
          </span>
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <div className="flex gap-2.5">
            <input
              type="text"
              className="flex-1 bg-[#090d16] border border-slate-800/80 rounded-lg px-3.5 py-3 text-xs font-sans text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
              placeholder="Inject a prompt query to evaluate system adapter fallbacks..."
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              disabled={isRouting}
            />
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3">
            <span className="text-[10px] text-slate-400 italic">
              * Note: If API secret tokens are empty, the adapters dynamically run in simulated local mock modes to trace routing.
            </span>
            
            {/* Simulation controls buttons cluster */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExecuteRoutingTest("timeout")}
                disabled={isRouting || fallbackSequence.length === 0}
                className="px-3 py-1.5 bg-[#1c0f0f] border border-red-500/20 text-red-400 hover:bg-[#2c0f0f] text-xs font-mono rounded-lg transition-colors cursor-pointer"
                title="Inject artificial 50ms timeout limits to verify safety fallback"
              >
                Simulate Timeout Cascade
              </button>
              <button
                onClick={() => handleExecuteRoutingTest("limit")}
                disabled={isRouting || fallbackSequence.length === 0}
                className="px-3 py-1.5 bg-[#191509] border border-amber-500/20 text-amber-400 hover:bg-[#251f0c] text-xs font-mono rounded-lg transition-colors cursor-pointer"
                title="Seed the limiter past maximum requests thresholds to force 429 redirects"
              >
                Simulate Rate Limit Fallback
              </button>
              <button
                onClick={() => handleExecuteRoutingTest("normal")}
                disabled={isRouting || fallbackSequence.length === 0}
                className="px-5 py-2.5 bg-sky-500 text-slate-950 font-sans font-medium text-xs rounded-lg transition-all hover:bg-sky-400 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {isRouting ? "Evaluating Routes..." : "Run Dispatcher Pipeline"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Router Path Timeline Visualizer */}
        {routeResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left side: Timeline tracks */}
            <div className="lg:col-span-7 bg-[#090d16] p-4.5 rounded-lg border border-slate-850 space-y-4">
              <h4 className="text-[10px] font-mono font-bold tracking-wider text-sky-400 uppercase flex items-center gap-1.5 mb-2">
                <Activity className="h-3.5 w-3.5" /> Pipeline Path Chronology Trace
              </h4>

              <div className="relative border-l border-slate-800 space-y-5 pl-4 ml-2">
                {routeResult.traces.map((trace, tIdx) => {
                  const statusColors = {
                    success: "bg-emerald-500 border-emerald-500 text-emerald-400",
                    failed: "bg-rose-500 border-rose-500 text-rose-450",
                    timeout: "bg-amber-500 border-amber-500 text-amber-400",
                    ratelimited: "bg-purple-500 border-purple-500 text-purple-450"
                  };

                  const isSuccess = trace.status === "success";

                  return (
                    <div key={tIdx} className="relative flex items-start gap-3">
                      {/* Anchor trace dot */}
                      <span className={`absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border bg-[#090d16] flex items-center justify-center ${
                        isSuccess ? "border-emerald-500" : "border-rose-500/80"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}></span>
                      </span>

                      {/* Trace card log data */}
                      <div className="flex-1 bg-[#0f172a]/70 p-3 rounded-lg border border-slate-800/60 font-mono text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="text-slate-100 font-bold block capitalize text-[11px]">
                              Attempt #{trace.attempt}: {configs[trace.provider]?.name || trace.provider}
                            </span>
                            <span className="text-[9.5px] text-slate-500 block truncate max-w-[280px]">
                              Model: {trace.model}
                            </span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border uppercase ${
                            trace.status === "success" 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/5 border-rose-500/20 text-rose-450"
                          }`}>
                            {trace.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[9.5px] text-slate-500">
                          <span>Latency Cost: <code className="text-emerald-400 font-bold">{trace.latencyMs}ms</code></span>
                          <span>Timestamp: {new Date(trace.timestamp).toLocaleTimeString()}</span>
                        </div>

                        {trace.errorMessage && (
                          <div className="bg-[#120a0a] border border-red-950 p-2 rounded text-[10px] text-rose-400 mt-2 flex items-start gap-1 leading-normal">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>Intercepted: {trace.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Returned Outcome details */}
            <div className="lg:col-span-5 bg-[#090d16] p-4.5 rounded-lg border border-slate-850 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b border-slate-800/60 pb-2">
                  <h4 className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                    Unified Output Buffer
                  </h4>
                  <span className={`text-[9.5px] font-mono border px-2 py-0.5 rounded font-bold ${
                    routeResult.response.success
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-[#1c0f0f] border-red-500/20 text-red-400"
                  }`}>
                    {routeResult.response.success ? "PIPELINE SUCCESS" : "FAILED CASCADE"}
                  </span>
                </div>

                {/* Statistics block */}
                <div className="grid grid-cols-2 gap-3 font-mono text-[10px] text-slate-400">
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40">
                    <span className="text-slate-500 block">Resolved Provider</span>
                    <span className="text-slate-200 capitalize font-bold">{routeResult.response.provider}</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40">
                    <span className="text-slate-500 block">Resolved Model</span>
                    <span className="text-sky-400 font-semibold truncate block" title={routeResult.response.model}>
                      {routeResult.response.model}
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40">
                    <span className="text-slate-500 block">Accumulative Latency</span>
                    <span className="text-amber-500 font-bold">{routeResult.response.latencyMs}ms</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40">
                    <span className="text-slate-500 block">Tokens In / Out</span>
                    <span className="text-slate-200">
                      {routeResult.response.inputTokens !== undefined ? `${routeResult.response.inputTokens} / ${routeResult.response.outputTokens}` : "--"}
                    </span>
                  </div>
                </div>

                {/* Text body */}
                <div className="bg-slate-950 p-3 rounded border border-slate-850 h-[100px] overflow-auto text-xs font-mono text-slate-300 leading-normal scrollbar-thin">
                  {routeResult.response.content || routeResult.response.error}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850 text-[9px] font-mono text-slate-500 text-center flex items-center justify-center gap-1.5">
                <Server className="h-3.5 w-3.5" />
                Conforms to pluggable AdapterSpecification. Unified Output Stream
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
