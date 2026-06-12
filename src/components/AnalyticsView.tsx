import React from "react";
import { Cpu, Zap, Activity, ShieldCheck, AlertTriangle, Terminal, Code, Settings } from "lucide-react";

export default function AnalyticsView() {
  // Statics reflecting accumulative studio runs
  const totalTokens = 428400;
  const promptTokens = 312000;
  const completionTokens = 116400;
  const avgLatency = 345.5; // ms
  
  const tools = [
    { name: "view_file", count: 86, success: 86, fail: 0, avg_ms: "45ms", timeout_cap: "300s" },
    { name: "create_file", count: 42, success: 41, fail: 1, avg_ms: "140ms", timeout_cap: "300s" },
    { name: "compile_applet", count: 18, success: 16, fail: 2, avg_ms: "1850ms", timeout_cap: "600s" },
    { name: "execute_tests", count: 12, success: 12, fail: 0, avg_ms: "2400ms", timeout_cap: "600s" }
  ];

  const providers = [
    { name: "google-vertex", model: "gemini-3.1-pro-preview (Primary)", active: true, latency: "285ms", prompt_tokens: 284000, completion_tokens: 104000 },
    { name: "google-vertex", model: "gemini-3.5-flash (Fallback)", active: true, latency: "115ms", prompt_tokens: 28000, completion_tokens: 12400 },
    { name: "anthropic", model: "claude-3-5-sonnet (Hot-standby)", active: true, latency: "650ms", prompt_tokens: 0, completion_tokens: 0 },
    { name: "openai", model: "gpt-4o (Standby)", active: false, latency: "--", prompt_tokens: 0, completion_tokens: 0 }
  ];

  return (
    <div className="space-y-6" id="analytics_dashboard_panel">
      {/* Visual Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Token stats */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85">
          <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" /> Token Volume Trackers
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-400">Total Tokens</span>
                <span className="font-mono text-base font-bold text-slate-100">{totalTokens.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-mono text-slate-500 block">Prompt Inputs</span>
                <span className="font-mono text-xs font-semibold text-slate-300">
                  {promptTokens.toLocaleString()} <code className="text-[10px] text-slate-500">({Math.round((promptTokens/totalTokens)*100)}%)</code>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block">Completion Outputs</span>
                <span className="font-mono text-xs font-semibold text-slate-300">
                  {completionTokens.toLocaleString()} <code className="text-[10px] text-slate-500">({Math.round((completionTokens/totalTokens)*100)}%)</code>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Latency tracks */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85">
          <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Latency & Speed Index
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-400">Average LLM Turn Time</span>
                <span className="font-mono text-base font-bold text-amber-400">{avgLatency}ms</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 leading-normal bg-amber-500/5 px-3 py-2 border border-amber-500/10 rounded-lg">
              Primary Google Vertex connections optimized for fast micro-actions. Fast token response latency monitored below 150ms.
            </div>
          </div>
        </div>

        {/* Sandbox compliance */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85">
          <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Sandbox Health Audit
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-mono font-medium text-slate-200 block">Execution Success 率</span>
                <span className="text-sm font-mono font-bold text-emerald-400">97.8% Compliance Rate</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 leading-normal bg-[#090d16] p-2.5 rounded border border-slate-800/50">
              Only 3 compilation/edit errors reported during past 150 tool call dispatches, caught cleanly by sandboxed timeout supervisors.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Provider Routing Table (Left) */}
        <div className="lg:col-span-6 bg-[#0f172a] rounded-xl border border-slate-800/85 overflow-hidden">
          <div className="p-4 border-b border-slate-800/60 bg-slate-900/10 flex justify-between items-center">
            <span className="text-xs font-mono font-medium text-slate-200">Routed LLM Suppliers</span>
            <span className="text-[10px] font-mono text-slate-500">Provider Health Mapping</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {providers.map((p) => (
              <div key={p.model} className="p-4 flex items-center justify-between text-xs bg-[#0a0f1d]/20 hover:bg-[#0f172a]/50 transition-colors">
                <div className="space-y-1">
                  <span className="text-slate-200 font-medium block">{p.model}</span>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wide">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-right font-mono">
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-slate-500 block">Accumulative volume</span>
                    <span className="text-[10.5px] text-slate-300">
                      {p.prompt_tokens > 0 ? `${Math.round((p.prompt_tokens + p.completion_tokens) / 1000)}k tokens` : "0"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Latency</span>
                    <span className="text-[10.5px] text-slate-300">{p.latency}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-medium border ${
                    p.active
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-slate-800/10 border-slate-800/40 text-slate-500"
                  }`}>
                    {p.active ? "Online" : "Standby"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sandbox Tool executions (Right) */}
        <div className="lg:col-span-6 bg-[#0f172a] rounded-xl border border-slate-800/85 overflow-hidden">
          <div className="p-4 border-b border-slate-800/60 bg-slate-900/10 flex justify-between items-center">
            <span className="text-xs font-mono font-medium text-slate-200">Capabilities Sandbox Execution Logs</span>
            <span className="text-[10px] font-mono text-slate-500">Automation Tool Registry</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {tools.map((t) => (
              <div key={t.name} className="p-4 flex items-center justify-between text-xs bg-[#0a0f1d]/20 hover:bg-[#0f172a]/50 transition-colors">
                <div className="space-y-0.5 flex items-center gap-3">
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <Code className="h-3.5 w-3.5 text-sky-400" />
                  </div>
                  <div>
                    <code className="text-amber-500 font-mono text-[11px] block">{t.name}</code>
                    <span className="text-[10px] text-slate-500 font-mono">Bound: {t.timeout_cap}</span>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-right font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Invoked</span>
                    <span className="text-[11px] text-slate-300 font-semibold">{t.count} times</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Avg. Speed</span>
                    <span className="text-[11px] text-slate-300 font-semibold">{t.avg_ms}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fails</span>
                    <span className={`text-[11px] ${t.fail > 0 ? "text-rose-450 font-bold" : "text-slate-500"}`}>
                      {t.fail}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
