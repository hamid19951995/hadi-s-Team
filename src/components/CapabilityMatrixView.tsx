import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CAPABILITY_MATRIX_DATA } from "../data/capabilities";
import { Search, ShieldAlert, Cpu, ArrowRight, Settings, Layers } from "lucide-react";

export default function CapabilityMatrixView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("All");

  const subsystems = ["All", ...Array.from(new Set(CAPABILITY_MATRIX_DATA.map(item => item.subsystem)))];

  const filteredCapabilities = CAPABILITY_MATRIX_DATA.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subsystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responsibilities.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesSubsystem = selectedSubsystem === "All" || item.subsystem === selectedSubsystem;
    
    return matchesSearch && matchesSubsystem;
  });

  return (
    <div className="space-y-6" id="capability_matrix_panel">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#1e293b]/40 p-4 rounded-xl border border-slate-800/85">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="capabilities_search"
            type="text"
            placeholder="Search capabilities, responsibilities, agents..."
            className="w-full pl-9 pr-4 py-2 bg-[#0f172a] border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all font-sans"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center w-full md:w-auto">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mr-1 bg-slate-800/10 px-2.5 py-1 rounded">
            <Layers className="h-3 w-3" /> Filters:
          </span>
          {subsystems.map((sub) => (
            <button
              key={sub}
              id={`filter_tab_${sub.toLowerCase().replace(/\s+/g, "_")}`}
              onClick={() => setSelectedSubsystem(sub)}
              className={`px-3 py-1 text-xs font-mono rounded-md border transition-all cursor-pointer ${
                selectedSubsystem === sub
                  ? "bg-sky-500/10 border-sky-500/40 text-sky-400 font-medium"
                  : "bg-[#0f172a] border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCapabilities.map((item, idx) => (
            <motion.div
              key={item.id}
              id={`capability_card_${item.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-[#0f172a]/95 border border-slate-800/90 rounded-xl overflow-hidden hover:border-slate-700/80 transition-all flex flex-col shadow-lg shadow-black/10"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-800/50 bg-[#1e293b]/25">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-wider font-semibold uppercase bg-sky-500/5 border border-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full">
                      {item.subsystem}
                    </span>
                    <h3 className="text-base font-sans font-medium text-slate-100 mt-2.5 tracking-tight">
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end text-right font-mono text-[10px] text-slate-500 bg-[#0f172a] px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="flex items-center gap-1"><Cpu className="h-2.5 w-2.5 text-sky-400" /> {item.agent}</span>
                  </div>
                </div>

                {/* Flow Diagram Line */}
                <div className="mt-4 bg-[#090d16] p-2 rounded border border-slate-800/40 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-sky-500 uppercase px-1 rounded bg-sky-950/40">Flow:</span>
                  {item.data_flow.split(" -> ").map((step, sIdx, arr) => (
                    <React.Fragment key={sIdx}>
                      <span className={`${sIdx === arr.length - 1 ? "text-emerald-400 font-medium" : "text-slate-300"}`}>
                        {step}
                      </span>
                      {sIdx < arr.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1">
                {/* Responsibilities */}
                <div>
                  <h4 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Core Responsibilities
                  </h4>
                  <ul className="space-y-1.5">
                    {item.responsibilities.map((resp, rIdx) => (
                      <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-sky-500 shrink-0 mt-1">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Inputs & Outputs Grid */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="bg-[#090d16]/60 p-3 rounded-lg border border-slate-800/50">
                    <h5 className="text-[10px] font-mono font-medium text-sky-400 uppercase tracking-wide mb-1.5">
                      Inputs
                    </h5>
                    <div className="space-y-1">
                      {Object.entries(item.inputs).map(([k, v]) => (
                        <div key={k} className="text-[11px] leading-relaxed">
                          <code className="text-amber-400 font-mono text-[10px]">{k}</code>
                          <span className="text-slate-400 font-sans block text-[10px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#090d16]/60 p-3 rounded-lg border border-slate-800/50">
                    <h5 className="text-[10px] font-mono font-medium text-emerald-400 uppercase tracking-wide mb-1.5">
                      Outputs
                    </h5>
                    <div className="space-y-1">
                      {Object.entries(item.outputs).map(([k, v]) => (
                        <div key={k} className="text-[11px] leading-relaxed">
                          <code className="text-emerald-400 font-mono text-[10px]">{k}</code>
                          <span className="text-slate-400 font-sans block text-[10px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subsystem Dependencies */}
                {item.dependencies.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <span className="text-slate-400">Depends on:</span>
                    <span className="bg-[#0f172a] border border-slate-800/60 px-2 py-0.5 rounded">
                      {item.dependencies.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer - Failure Modes */}
              <div className="p-4 bg-red-950/5 border-t border-slate-800/40 mt-auto">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-mono font-semibold text-rose-400 uppercase tracking-wider">
                      Failure Modes & Safeguards
                    </h5>
                    <ul className="space-y-1 mt-1">
                      {item.failure_modes.map((fm, fmIdx) => (
                        <li key={fmIdx} className="text-[10.5px] text-slate-400 leading-normal">
                          {fm}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredCapabilities.length === 0 && (
          <div className="col-span-1 lg:col-span-2 text-center py-20 bg-[#0f172a]/30 border border-slate-800/50 rounded-xl">
            <Cpu className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">No system capabilities match search criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filter tags or editing queries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
