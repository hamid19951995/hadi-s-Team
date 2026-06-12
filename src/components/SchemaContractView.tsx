import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SCHEMAS_DATA } from "../data/schemas";
import { Brackets, CheckCircle, FileCode, GitBranch, Terminal, ArrowRight, Shield, Copy } from "lucide-react";

export default function SchemaContractView() {
  const [activeSchemaIdx, setActiveSchemaIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeSchema = SCHEMAS_DATA[activeSchemaIdx];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeSchema.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy schema code: ", err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="schemas_contract_panel">
      {/* Sidebar Selector */}
      <div className="xl:col-span-3 space-y-2">
        <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest px-1 mb-3">
          Contracts Registry
        </h3>
        {SCHEMAS_DATA.map((schema, idx) => (
          <button
            key={schema.name}
            id={`schema_selector_${schema.name.toLowerCase()}`}
            onClick={() => {
              setActiveSchemaIdx(idx);
              setCopied(false);
            }}
            className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
              activeSchemaIdx === idx
                ? "bg-[#1e293b]/40 border-sky-500/40 text-sky-400 font-medium"
                : "bg-[#0f172a] border-slate-800/80 hover:border-slate-800 hover:bg-slate-900/40 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <Brackets className={`h-4 w-4 ${activeSchemaIdx === idx ? "text-sky-400" : "text-slate-500"}`} />
              <span className="text-xs font-mono font-medium">{schema.name}</span>
            </div>
            {activeSchemaIdx === idx && (
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Pane */}
      <div className="xl:col-span-9 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schema Details (Left) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/85">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-sky-400" />
              <h4 className="text-xs font-mono font-semibold text-sky-400 uppercase tracking-wider">
                Specification & Requirements
              </h4>
            </div>
            <h2 className="text-base font-sans font-medium text-slate-100 tracking-tight">
              {activeSchema.name}
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {activeSchema.description}
            </p>
          </div>

          {/* Fields List */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800/85 overflow-hidden">
            <div className="bg-slate-900/10 p-4 border-b border-slate-800/50 flex justify-between items-center">
              <span className="text-xs font-mono font-medium text-slate-300">Fields & Typed Constraints</span>
              <span className="text-[10px] font-mono text-slate-500">Pydantic Model Fields</span>
            </div>
            <div className="divide-y divide-slate-800/50 max-h-[300px] overflow-y-auto scrollbar-thin">
              {activeSchema.fields.map((field) => (
                <div key={field.name} className="p-3 bg-[#0a0f1d]/30 hover:bg-[#0f172a]/60 transition-colors">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-xs font-mono font-semibold text-slate-200">{field.name}</span>
                    <span className="text-[10.5px] font-mono text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded">
                      {field.type}
                    </span>
                    {field.validation && (
                      <span className="text-[9.5px] font-mono text-sky-400 uppercase bg-sky-950/20 border border-sky-950 px-1 rounded ml-auto">
                        {field.validation}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">{field.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Relationships & Lifecycles */}
          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/85 space-y-3">
            <div>
              <h5 className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <GitBranch className="h-3.5 w-3.5 text-slate-500" /> System Linkage & Dependencies
              </h5>
              <div className="space-y-1">
                {activeSchema.relationships.map((rel, rIdx) => (
                  <div key={rIdx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-sky-500 select-none">•</span>
                    <span>{rel}</span>
                  </div>
                ))}
              </div>
            </div>

            {activeSchema.states && (
              <div className="pt-2 border-t border-slate-800/40">
                <h5 className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <Terminal className="h-3.5 w-3.5 text-amber-500" /> Lifecycle State Transitions
                </h5>
                <div className="flex flex-wrap gap-1 items-center mb-3">
                  {activeSchema.states.map((st, stIdx, arr) => (
                    <React.Fragment key={stIdx}>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800/30 text-slate-300 border border-slate-800">
                        {st.split(":")[0]}
                      </span>
                      {stIdx < arr.length - 1 && (
                        <ArrowRight className="h-2.5 w-2.5 text-slate-600" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="bg-[#090d16] p-2.5 rounded text-[10.5px] text-slate-400 leading-normal border border-slate-800/50 max-h-[110px] overflow-y-auto">
                  {activeSchema.states.map((st, idx) => (
                    <div key={idx} className="mb-1 last:mb-0">
                      <span className="font-mono text-[9px] text-sky-400 font-bold block">{st.split(":")[0]}:</span>
                      <span>{st.split(":")[1] || ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Python Source Code (Right) */}
        <div className="lg:col-span-6 bg-[#090d16] rounded-xl border border-slate-800/80 flex flex-col min-h-[450px] overflow-hidden">
          <div className="bg-slate-900/30 px-4 py-3 border-b border-slate-800/80 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <FileCode className="h-3.5 w-3.5 text-sky-500" />
              <span>{activeSchema.name.toLowerCase()}.py</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 font-mono text-[10px] rounded border border-slate-700 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
          
          <div className="p-4 font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 overflow-x-auto flex-1 h-full select-text max-h-[500px]">
            <pre className="whitespace-pre">
              <code>
                {activeSchema.code}
              </code>
            </pre>
          </div>

          <div className="p-3 bg-slate-900/10 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500 px-4">
            <span>Runtime: Python 3.10+</span>
            <span>Decorator: @pydantic.BaseModel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
