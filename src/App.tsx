import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, ShieldCheck, Cpu, Brackets, Brain, BarChart3, 
  Server, Layers, Clock, Globe, GitCommit, HeartPulse, Sliders, Wrench, MonitorPlay, Workflow, Sparkles, Languages
} from "lucide-react";

import StudioControllerView from "./components/StudioControllerView";
import GraphPlusView from "./components/GraphPlusView";
import TaskGraphView from "./components/TaskGraphView";
import AgentFrameworkView from "./components/AgentFrameworkView";
import AIProviderConfigView from "./components/AIProviderConfigView";
import CapabilityMatrixView from "./components/CapabilityMatrixView";
import SchemaContractView from "./components/SchemaContractView";
import MemoryManagerView from "./components/MemoryManagerView";
import AnalyticsView from "./components/AnalyticsView";
import SelfHealingView from "./components/SelfHealingView";
import EnvironmentView from "./components/EnvironmentView";
import VisualStudioIdeView from "./components/VisualStudioIdeView";
import ProjectLifecycleView from "./components/ProjectLifecycleView";
import CosmoOSDesktop from "./components/CosmoOSDesktop";
import { SupportedLanguage, translations, TranslationDictionary } from "./lib/translations";

// Core view tabs mapping
type ActiveTab = "visualstudio" | "lifecycle" | "studio" | "graphplus" | "orchestrator" | "agents" | "providers" | "capabilities" | "contracts" | "memory" | "analytics" | "selfhealing" | "environment";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("visualstudio"); // Default to Visual Studio Complete V1.7.0
  const [utcTime, setUtcTime] = useState("");
  const [isDesktopMode, setIsDesktopMode] = useState(true);
  
  // Lift and synchronize dynamic language state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem("graph_plus_lang") as SupportedLanguage) || "fa";
  });
  const [customLanguageDict, setCustomLanguageDict] = useState<TranslationDictionary | null>(null);

  const t = customLanguageDict || translations[currentLang];

  // Keep live UTC ticking clock for architectural authenticity
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageSwitch = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    setCustomLanguageDict(null);
    localStorage.setItem("graph_plus_lang", lang);
  };

  return (
    <div className={`min-h-screen bg-[#020d11] text-slate-100 flex flex-col font-sans select-none antialiased ${currentLang === "fa" ? "rtl" : "ltr"}`} style={{ direction: currentLang === "fa" ? "rtl" : "ltr" }}>
      {/* Platform Header / Top Utility Rail */}
      <header className="border-b border-teal-900/40 bg-[#03151b] px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sticky top-0 z-50 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Animated Cognitive Core Icon */}
          <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
            <Cpu className="h-5 w-5 text-teal-400" />
            <span className="absolute inset-0 bg-teal-400/5 animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-bold tracking-normal text-teal-100 uppercase font-sans">
                {currentLang === "fa" ? "پلتفرم مدیریت خودکار پردازش ابر استودیو" : "Autonomous Studio Platform"}
              </h1>
              <span className="text-[9px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shrink-0">
                <HeartPulse className="h-2.5 w-2.5 animate-pulse text-emerald-400" /> {t.runtimeActive}
              </span>
            </div>
            <p className="text-[10.5px] text-teal-500/80 tracking-tight mt-0.5 font-normal">
              {currentLang === "fa" 
                ? "مدیریت ارتباط لایو با موتورهای بازی‌سازی یونیتی و آنریل • طراحی فیروزه‌ای اختصاصی" 
                : "Modular task-graph DAG orchestrations & decaying typed memories • Python 3.10+"}
            </p>
          </div>
        </div>

        {/* Dynamic Global Languages Option Dropdown/Selector Bar & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Advanced Layout Orchestrator Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 border border-teal-900/40 rounded-xl text-xs">
            <button
              onClick={() => setIsDesktopMode(true)}
              className={`px-3 py-1.5 rounded-lg text-[11px] transition-all border flex items-center gap-1.5 ${isDesktopMode ? "bg-cyan-500/15 border-cyan-500/45 text-cyan-300 font-extrabold shadow-sm" : "bg-transparent text-slate-500 border-transparent hover:text-slate-300 cursor-pointer"}`}
            >
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              {currentLang === "fa" ? "🖥️ دسکتاپ چند پنجره‌ای" : "Workspace OS"}
            </button>
            <button
              onClick={() => setIsDesktopMode(false)}
              className={`px-3 py-1.5 rounded-lg text-[11px] transition-all border flex items-center gap-1.5 ${!isDesktopMode ? "bg-cyan-500/15 border-cyan-500/45 text-cyan-300 font-extrabold shadow-sm" : "bg-transparent text-slate-550 border-transparent hover:text-slate-300 cursor-pointer"}`}
            >
              <Layers className="h-3.5 w-3.5 text-teal-400" />
              {currentLang === "fa" ? "📂 تب‌های سنتی" : "Classic Tab Deck"}
            </button>
          </div>

          {/* Quick Language bar */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 border border-teal-950 rounded-lg text-xs">
            <Languages className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-slate-400 font-medium text-[11px] font-sans">{t.selectLanguage}:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleLanguageSwitch("fa")}
                className={`px-1.5 py-0.5 rounded text-[10.5px] transition-all font-semibold ${currentLang === "fa" ? "bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30" : "text-slate-400 hover:text-slate-250 cursor-pointer"}`}
              >
                🇮🇷 فارسی
              </button>
              <button
                onClick={() => handleLanguageSwitch("en")}
                className={`px-1.5 py-0.5 rounded text-[10.5px] transition-all font-semibold ${currentLang === "en" ? "bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30" : "text-slate-400 hover:text-slate-250 cursor-pointer"}`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => handleLanguageSwitch("es")}
                className={`px-1.5 py-0.5 rounded text-[10.5px] transition-all font-semibold ${currentLang === "es" ? "bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30" : "text-slate-400 hover:text-slate-250 cursor-pointer"}`}
              >
                🇪🇸 ES
              </button>
              <button
                onClick={() => handleLanguageSwitch("de")}
                className={`px-1.5 py-0.5 rounded text-[10.5px] transition-all font-semibold ${currentLang === "de" ? "bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30" : "text-slate-400 hover:text-slate-250 cursor-pointer"}`}
              >
                🇩🇪 DE
              </button>
              <button
                onClick={() => handleLanguageSwitch("ja")}
                className={`px-1.5 py-0.5 rounded text-[10.5px] transition-all font-semibold ${currentLang === "ja" ? "bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30" : "text-slate-400 hover:text-slate-250 cursor-pointer"}`}
              >
                🇯🇵 JA
              </button>
            </div>
          </div>

          {/* Global chronometers and system status metadata */}
          <div className="flex items-center gap-x-3.5 font-mono text-[10.5px] text-slate-400 bg-slate-950/40 p-2 border border-teal-980/20 rounded-lg max-w-full overflow-hidden shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-teal-400" />
              <span>{utcTime}</span>
            </div>
            <span className="text-teal-900 hidden xs:inline">|</span>
            <div className="hidden xs:flex items-center gap-1.5 bg-teal-950/20 px-1.5 py-0.5 rounded-md text-[10px] text-teal-400 font-semibold border border-teal-950">
              <Globe className="h-3 w-3 text-teal-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>PORT: 3000 (INGRESS)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conditionally render either Full-Bleed CosmoOS Desktop OR Classic Tab view */}
      {isDesktopMode ? (
        <div className="flex-grow select-none relative">
          <CosmoOSDesktop currentLang={currentLang} onLanguageSwitch={handleLanguageSwitch} />
        </div>
      ) : (
        <>
          {/* Primary Section Tab selectors */}
          <div className="bg-[#03151b]/40 border-b border-teal-950/60 px-6 py-2 sticky top-[73px] z-40 backdrop-blur">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {/* Visual Studio IDE Tab */}
          <button
            id="tab_selector_visualstudio"
            onClick={() => setActiveTab("visualstudio")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none shrink-0 ${
              activeTab === "visualstudio"
                ? "bg-teal-550/15 border-teal-500/45 text-teal-300 font-bold shadow-[0_0_15px_rgba(20,184,166,0.15)] bg-[#041d24]"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brackets className="h-4 w-4 text-cyan-400 animate-pulse" />
            {currentLang === "fa" ? "ویژوال استادیو کامل & شتاب‌دهنده" : "Visual Studio Complete & Accelerator"}
          </button>

          {/* Project 24-Step Lifecycle Journey Tab */}
          <button
            id="tab_selector_lifecycle"
            onClick={() => setActiveTab("lifecycle")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none shrink-0 ${
              activeTab === "lifecycle"
                ? "bg-teal-100/10 border-cyan-500/45 text-cyan-305 font-bold shadow-[0_0_15px_rgba(20,184,166,0.15)] bg-[#041d24]"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Workflow className="h-4 w-4 text-cyan-400 animate-spin animate-none" style={{ animationDuration: '10s' }} />
            {currentLang === "fa" ? "نقشه راه ۲۴ مرحله‌ای ساخت ایده" : "Interactive 24-Step Lifecycle Journey"}
          </button>

          {/* Studio Controller Tab */}
          <button
            id="tab_selector_studio"
            onClick={() => setActiveTab("studio")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "studio"
                ? "bg-teal-950/40 border-teal-500/40 text-teal-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            <MonitorPlay className="h-4 w-4 text-teal-400 animate-pulse" />
            {t.studioController}
          </button>

          {/* Graph.Plus Node Workspace Tab */}
          <button
            id="tab_selector_graphplus"
            onClick={() => setActiveTab("graphplus")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border shrink-0 leading-none ${
              activeTab === "graphplus"
                ? "bg-teal-500/10 border-teal-500/45 text-teal-300 font-bold shadow-[0_0_15px_rgba(20,184,166,0.15)] bg-[#041d24]"
                : "bg-transparent border-transparent text-teal-500/75 hover:text-teal-400"
            }`}
          >
            <Workflow className="h-4 w-4 text-teal-400 animate-bounce" />
            {t.graphPlusWorkspace}
          </button>

          {/* Orchestrator Tab */}
          <button
            id="tab_selector_orchestrator"
            onClick={() => setActiveTab("orchestrator")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "orchestrator"
                ? "bg-teal-950/40 border-teal-500/40 text-teal-400 font-bold"
                : "bg-transparent border-transparent text-slate-200 hover:text-slate-100"
            }`}
          >
            <Terminal className="h-4 w-4 text-teal-500" />
            {t.orchestratorRun}
          </button>

          {/* Self-Healing Tab */}
          <button
            id="tab_selector_selfhealing"
            onClick={() => setActiveTab("selfhealing")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "selfhealing"
                ? "bg-teal-950/40 border-emerald-500/40 text-emerald-400 font-bold"
                : "bg-transparent border-transparent text-slate-300 hover:text-slate-100"
            }`}
          >
            <Wrench className="h-4 w-4 text-emerald-405" />
            {t.selfHealing}
          </button>

          {/* Environment Manager Tab */}
          <button
            id="tab_selector_environment"
            onClick={() => setActiveTab("environment")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "environment"
                ? "bg-teal-950/40 border-emerald-500/40 text-emerald-400 font-bold"
                : "bg-transparent border-transparent text-slate-300 hover:text-slate-100"
            }`}
          >
            <Server className="h-4 w-4 text-emerald-405" />
            {t.envManager}
          </button>

          {/* Agent Registry Tab */}
          <button
            id="tab_selector_agents"
            onClick={() => setActiveTab("agents")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "agents"
                ? "bg-[#1e293b]/40 border-sky-500/45 text-sky-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="h-4 w-4 text-sky-400" />
            {t.agentFramework}
          </button>

          {/* AI Providers Tab */}
          <button
            id="tab_selector_providers"
            onClick={() => setActiveTab("providers")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "providers"
                ? "bg-[#1e293b]/40 border-sky-500/40 text-sky-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-4 w-4 text-sky-400" />
            {t.aiProviders}
          </button>

          {/* Capabilities Tab */}
          <button
            id="tab_selector_capabilities"
            onClick={() => setActiveTab("capabilities")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "capabilities"
                ? "bg-[#1e293b]/40 border-sky-500/40 text-sky-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-4 w-4 text-slate-400" />
            {t.capabilities}
          </button>

          {/* Contracts Tab */}
          <button
            id="tab_selector_contracts"
            onClick={() => setActiveTab("contracts")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "contracts"
                ? "bg-[#1e293b]/40 border-sky-500/40 text-sky-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brackets className="h-4 w-4 text-slate-400" />
            {t.dataContracts}
          </button>

          {/* Memory Tab */}
          <button
            id="tab_selector_memory"
            onClick={() => setActiveTab("memory")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "memory"
                ? "bg-[#1e293b]/40 border-sky-500/40 text-sky-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="h-4 w-4 text-slate-400" />
            {t.memoryExplorer}
          </button>

          {/* Analytics Tab */}
          <button
            id="tab_selector_analytics"
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-[11.5px] cursor-pointer transition-all rounded-lg flex items-center gap-2 border leading-none ${
              activeTab === "analytics"
                ? "bg-[#1e293b]/40 border-sky-500/40 text-sky-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-250"
            }`}
          >
            <BarChart3 className="h-4 w-4 text-slate-400" />
            {t.analyticsBus}
          </button>
        </div>
      </div>

      {/* Main Workspace Frame container */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto select-none mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "visualstudio" && <VisualStudioIdeView currentLang={currentLang} />}
            {activeTab === "lifecycle" && <ProjectLifecycleView currentLang={currentLang} />}
            {activeTab === "studio" && <StudioControllerView />}
            {activeTab === "graphplus" && (
              <GraphPlusView 
                currentLang={currentLang}
                onLangChange={handleLanguageSwitch}
                customLanguageDict={customLanguageDict}
                setCustomLanguageDict={setCustomLanguageDict}
              />
            )}
            {activeTab === "orchestrator" && <TaskGraphView />}
            {activeTab === "selfhealing" && <SelfHealingView />}
            {activeTab === "environment" && <EnvironmentView />}
            {activeTab === "agents" && <AgentFrameworkView />}
            {activeTab === "providers" && <AIProviderConfigView />}
            {activeTab === "capabilities" && <CapabilityMatrixView />}
            {activeTab === "contracts" && <SchemaContractView />}
            {activeTab === "memory" && <MemoryManagerView />}
            {activeTab === "analytics" && <AnalyticsView />}
          </motion.div>
        </AnimatePresence>
      </main>
        </>
      )}

      {/* Compact footer */}
      <footer className="bg-slate-950 px-6 py-4 mt-12 border-t border-teal-950/40 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>AI Studio Build Campaign © 2026. All Rights Reserved.</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Server className="h-3 w-3 shrink-0" /> Cloud Run Sandbox</span>
          <span className="flex items-center gap-1"><GitCommit className="h-3 w-3 shrink-0 text-teal-400" /> Commit Hash Tag: 9198785cf</span>
        </div>
      </footer>
    </div>
  );
}

