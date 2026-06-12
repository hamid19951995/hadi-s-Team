import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, Settings, Play, Save, Cpu, HardDrive, Zap, Flame, Sparkles, 
  Download, RefreshCw, Volume2, VolumeX, Globe, Monitor, Minimize2, Maximize2, 
  X, RotateCcw, Link2, Eye, ShieldAlert, Check, Plus, Code, HelpCircle, 
  Activity, Star, Layout, List, FolderOpen, AlertCircle, HeartPulse, Hammer
} from "lucide-react";

import VisualStudioIdeView from "./VisualStudioIdeView";
import ProjectLifecycleView from "./ProjectLifecycleView";

// Interface for Desktop Windows
interface OSWindow {
  id: string;
  title: { fa: string; en: string };
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  icon: React.ReactNode;
}

// Preset wallpaper structures
interface WallpaperPreset {
  id: string;
  name: { fa: string; en: string };
  bgClass: string;
  type: "nebula" | "matrix" | "grid" | "charcoal";
}

// Connected App representation
interface ConnectedApp {
  id: string;
  name: string;
  type: string;
  status: "connected" | "syncing" | "standby";
  delay: number;
}

// Automation Rule representation
interface AutomationRule {
  id: string;
  name: { fa: string; en: string };
  trigger: string;
  action: string;
  active: boolean;
  lastExecuted: string | null;
  status: "idle" | "triggered" | "done";
}

// Free Package / Asset item
interface FreePackage {
  id: string;
  name: string;
  size: string;
  description: { fa: string; en: string };
  author: string;
  downloaded: boolean;
  assembling: boolean;
  progress: number;
}

// Global Synthesizer Sound Engine using Web Audio API
const playSynthBeep = (type: "click" | "swoosh" | "success" | "warning" | "download") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "swoosh") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "success") {
      // Arpeggio sound
      [440, 554, 659, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.03, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.15);
      });
    } else if (type === "warning") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "download") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.15); // C6
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // Audio restriction safe fallback
  }
};

interface CosmoOSDesktopProps {
  currentLang: "fa" | "en" | string;
  onLanguageSwitch: (lang: "fa" | "en") => void;
}

export default function CosmoOSDesktop({ currentLang, onLanguageSwitch }: CosmoOSDesktopProps) {
  const isRtl = currentLang === "fa";

  // Wallpapers list
  const wallpapers: WallpaperPreset[] = [
    { id: "carina", name: { fa: "سحابی عمیق رندر کارینا", en: "Glowing Carina Nebula" }, bgClass: "bg-[#010811]", type: "nebula" },
    { id: "grid", name: { fa: "شبکه رندر سایبرپانک فیروزه‌ای", en: "Cyberpunk Digital Grid" }, bgClass: "bg-[#020d14]", type: "grid" },
    { id: "matrix", name: { fa: "باران کدهای ماتریکس فیروزه‌ای", en: "Phosphor Matrix Streams" }, bgClass: "bg-[#000508]", type: "matrix" },
    { id: "slate", name: { fa: "زغالی تیره مینیمال و پاکیزه", en: "Clean Minimal Charcoal" }, bgClass: "bg-[#02070a]", type: "charcoal" }
  ];

  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperPreset>(wallpapers[0]);
  const [useSfx, setUseSfx] = useState(true);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [isClassicMode, setIsClassicMode] = useState(false); // Toggle to go back to standard tab view if they prefer older design!

  // Central Dynamic Rendering Parameters synchronized globally
  const [localCudaUsed, setLocalCudaUsed] = useState(2560);
  const [localVramAlloc, setLocalVramAlloc] = useState(8.5);
  const [localCpuThreads, setLocalCpuThreads] = useState(8);
  const [localPipeline, setLocalPipeline] = useState<"denseParticle" | "standard" | "vulkanShader">("denseParticle");
  const [localShaderMode, setLocalShaderMode] = useState<"volumetric" | "scanline" | "none">("volumetric");
  
  // Game state listeners
  const [spaceScore, setSpaceScore] = useState(0);
  const [spaceLevel, setSpaceLevel] = useState(1);
  const [spaceShield, setSpaceShield] = useState(100);

  // Sync state into global window so the nested space_odyssey app can communicate with settings
  useEffect(() => {
    (window as any).activeRenderPipeline = localPipeline;
    (window as any).activeShader = localShaderMode;
    const interval = setInterval(() => {
      // Pull scores if the game space_odyssey handles score internally
      if (typeof (window as any).score !== "undefined") {
        setSpaceScore((window as any).score);
      }
      if (typeof (window as any).level !== "undefined") {
        setSpaceLevel((window as any).level);
      }
      if (typeof (window as any).player !== "undefined") {
        setSpaceShield((window as any).player.shield || 100);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [localPipeline, localShaderMode]);

  // Window System state
  const [windows, setWindows] = useState<OSWindow[]>([
    {
      id: "ide",
      title: { fa: "💻 ویژوال استادیو کامل و شبیه‌ساز رندر زنده", en: "Coding Platform & GPU Live Game Renderer" },
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 30,
      y: 40,
      width: 790,
      height: 520,
      zIndex: 5,
      icon: <Code className="h-4 w-4 text-cyan-400" />
    },
    {
      id: "settings",
      title: { fa: "⚙️ مرکز تنظیمات فیروزه‌ای متمرکز", en: "Unified Workspace Settings Panel" },
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 840,
      y: 40,
      width: 380,
      height: 480,
      zIndex: 4,
      icon: <Settings className="h-4 w-4 text-amber-400" />
    },
    {
      id: "automation",
      title: { fa: "🤖 سیستم اتوماسیون هوشمند و اجرای خودکار", en: "Intelligent Trigger & Connected App Orchestrator" },
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 200,
      y: 100,
      width: 600,
      height: 440,
      zIndex: 2,
      icon: <Zap className="h-4 w-4 text-emerald-400 font-bold" />
    },
    {
      id: "downloader",
      title: { fa: "📥 پکیج سنتر و دانلودر پکیج‌های رایگان", en: "Open-Source Packages & Assets Marketplace" },
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 350,
      y: 150,
      width: 650,
      height: 430,
      zIndex: 1,
      icon: <Download className="h-4 w-4 text-indigo-400" />
    },
    {
      id: "lifecycle",
      title: { fa: "🗺️ نقشه راه ۲۴ مرحله‌ای ساخت ایده", en: "Interactive 24-Step Idea Generator Roadmap" },
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 100,
      y: 80,
      width: 800,
      height: 540,
      zIndex: 3,
      icon: <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
    }
  ]);

  // Connected apps data
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([
    { id: "unreal", name: "Unreal Engine 5.4 Socket Link", type: "Game Engine", status: "connected", delay: 11 },
    { id: "unity", name: "Unity LTS Core Bridge", type: "Game Engine", status: "syncing", delay: 24 },
    { id: "vscode", name: "VS Code Local Broker", type: "IDE Connection", status: "connected", delay: 4 },
    { id: "compiler", name: "Visual Studio Compiler Engine", type: "Native Core", status: "standby", delay: 0 }
  ]);

  // Auto-Automation rules list
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: "rule_1",
      name: { fa: "کامپایل خودکار به محض ذخیره کد", en: "Auto-compile on Code Save event" },
      trigger: "SAVE_FILE",
      action: "RECOMPILE_IDE",
      active: true,
      lastExecuted: null,
      status: "idle"
    },
    {
      id: "rule_2",
      name: { fa: "تعدیل دمایی خودکار کارت گرافیک (Thermal Guard)", en: "GPU Thermal Guard Auto-throttle" },
      trigger: "GPU_TEMP_GT_75",
      action: "THROTTLE_CUDA_CORES",
      active: true,
      lastExecuted: null,
      status: "idle"
    },
    {
      id: "rule_3",
      name: { fa: "تخصیص کمکی VRAM هنگام تضعیف سپر سفینه", en: "Auto-allocate auxiliary VRAM on Shield critical" },
      trigger: "SHIELD_LT_30",
      action: "TRIGGER_RESERVE_VRAM",
      active: true,
      lastExecuted: null,
      status: "idle"
    },
    {
      id: "rule_4",
      name: { fa: "سنتز خودکار موسیقی پس از بارگیری پکیج صوتی", en: "Synthesize background tones once audio bundle is active" },
      trigger: "AUDIO_PACKAGE_DOWNLOADED",
      action: "TRIGGER_SYNTH_MUSIC",
      active: true,
      lastExecuted: null,
      status: "idle"
    }
  ]);

  // Downloadable free packages list
  const [freePackages, setFreePackages] = useState<FreePackage[]>([
    {
      id: "pkg_sfx",
      name: "retro_audio_sfx_pack.wav",
      size: "1.2 MB",
      description: { fa: "کدهای پیشرفته رمزگشای سیگنال صوتی رترو برای صداگذاری لایو سفینه", en: "Retro laser weapon space frequency buffers for zero-latency gameplay audio." },
      author: "OpenSourceRetroSpace",
      downloaded: false,
      assembling: false,
      progress: 0
    },
    {
      id: "pkg_physics",
      name: "cosmos_vector_physics_2d.wasm",
      size: "2.4 MB",
      description: { fa: "کتابخانه شبیه‌سازی گرانش سیاهچاله‌ها و سرعت متغیر پلاسما هشت جهتی", en: "WASM physics module enabling trajectory bending near active massive black holes." },
      author: "WasmScienceInstitute",
      downloaded: false,
      assembling: false,
      progress: 0
    },
    {
      id: "pkg_skins",
      name: "retro_asteroid_neon_textures.glsl",
      size: "820 KB",
      description: { fa: "مجموعه تکسچر و شیدرهای نئونی برای چندبرابری زیبایی بصری آستروئیدها", en: "Custom glowing vertex shader packs to color-code individual asteroid shrapnel layers." },
      author: "VulkanRenderCore",
      downloaded: false,
      assembling: false,
      progress: 0
    },
    {
      id: "pkg_boost",
      name: "vulkan_accelerator_runtime_patch.dll",
      size: "420 KB",
      description: { fa: "پچ ارگونومیک افزایش سرعت کلاک کارت گرافیک و حذف زمان مرده رندر", en: "Memory layer optimization DLL speeding up drawcalls by caching polygon vertex pools" },
      author: "GPUGroupLab",
      downloaded: false,
      assembling: false,
      progress: 0
    }
  ]);

  // Log outputs for the automation terminal
  const [autoLogs, setAutoLogs] = useState<string[]>([
    "[16:44:10 UTC] [SYSTEM] CosmoOS Automation Supervisor started.",
    "[16:44:12 UTC] [SYSTEM] Listening to real-time events from Game Engine & Compiler threads."
  ]);

  const addAutoLog = (msg: string) => {
    const time = new Date().toUTCString().split(" ")[4];
    setAutoLogs(prev => [`[${time} UTC] ${msg}`, ...prev.slice(0, 40)]);
  };

  // Bring window to front
  const focusWindow = (id: string) => {
    if (useSfx) playSynthBeep("click");
    setMaxZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: maxZIndex + 1 } : w));
  };

  const toggleMinimize = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (useSfx) playSynthBeep("swoosh");
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  };

  const toggleMaximize = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (useSfx) playSynthBeep("click");
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const closeWindow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (useSfx) playSynthBeep("swoosh");
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
  };

  const openApp = (id: string) => {
    if (useSfx) playSynthBeep("click");
    setMaxZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: maxZIndex + 1 } : w));
  };

  // Drag logic
  const handleHeaderMouseDown = (id: string, e: React.MouseEvent) => {
    const win = windows.find(w => w.id === id);
    if (!win || win.isMaximized) return;

    focusWindow(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = win.x;
    const initialY = win.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setWindows(prev => prev.map(w => w.id === id ? { 
        ...w, 
        x: Math.max(-100, Math.min(window.innerWidth - 100, initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 80, initialY + dy))
      } : w));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Resize logic
  const handleResizeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const win = windows.find(w => w.id === id);
    if (!win || win.isMaximized) return;

    focusWindow(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = win.width;
    const initialHeight = win.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      setWindows(prev => prev.map(w => w.id === id ? {
        ...w,
        width: Math.max(320, initialWidth + dx),
        height: Math.max(240, initialHeight + dy)
      } : w));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Tile Window arrangement
  const arrangeWindows = (mode: "tile" | "cascade" | "reset") => {
    if (useSfx) playSynthBeep("success");
    if (mode === "tile") {
      setWindows(prev => prev.map((w, idx) => {
        const isOpen = idx < 3 ? true : w.isOpen; // Open first three
        return {
          ...w,
          isOpen,
          isMinimized: false,
          isMaximized: false,
          x: idx === 0 ? 20 : (idx === 1 ? 520 : 20),
          y: idx === 2 ? 350 : 50,
          width: idx === 0 ? 480 : (idx === 1 ? 400 : 900),
          height: idx === 2 ? 260 : 280,
          zIndex: 10 + idx
        };
      }));
      addAutoLog("[LAYOUT] Windows tiled symmetrically on layout grid.");
    } else if (mode === "cascade") {
      setWindows(prev => prev.map((w, idx) => ({
        ...w,
        isMinimized: false,
        isMaximized: false,
        x: 40 + idx * 45,
        y: 50 + idx * 45,
        width: 700,
        height: 480,
        zIndex: 10 + idx
      })));
      addAutoLog("[LAYOUT] Windows descended across screen in cascade cascade.");
    } else {
      // Default reset
      setWindows([
        { id: "ide", title: { fa: "💻 ویژوال استادیو کامل و شبیه‌ساز رندر زنده", en: "Coding Platform & GPU Live Game Renderer" }, isOpen: true, isMinimized: false, isMaximized: false, x: 20, y: 30, width: 780, height: 530, zIndex: 10, icon: <Code className="h-4 w-4 text-cyan-400" /> },
        { id: "settings", title: { fa: "⚙️ مرکز تنظیمات فیروزه‌ای متمرکز", en: "Unified Workspace Settings Panel" }, isOpen: true, isMinimized: false, isMaximized: false, x: 810, y: 30, width: 400, height: 490, zIndex: 8, icon: <Settings className="h-4 w-4 text-amber-400" /> },
        { id: "automation", title: { fa: "🤖 سیستم اتوماسیون هوشمند و اجرای خودکار", en: "Intelligent Trigger & Connected App Orchestrator" }, isOpen: false, isMinimized: false, isMaximized: false, x: 150, y: 80, width: 620, height: 440, zIndex: 3, icon: <Zap className="h-4 w-4 text-emerald-400 font-bold" /> },
        { id: "downloader", title: { fa: "📥 پکیج سنتر و دانلودر پکیج‌های رایگان", en: "Open-Source Packages & Assets Marketplace" }, isOpen: false, isMinimized: false, isMaximized: false, x: 260, y: 120, width: 640, height: 430, zIndex: 2, icon: <Download className="h-4 w-4 text-indigo-400" /> },
        { id: "lifecycle", title: { fa: "🗺️ نقشه راه ۲۴ مرحله‌ای ساخت ایده", en: "Interactive 24-Step Idea Generator Roadmap" }, isOpen: false, isMinimized: false, isMaximized: false, x: 80, y: 60, width: 800, height: 540, zIndex: 4, icon: <Sparkles className="h-4 w-4 text-pink-400" /> }
      ]);
      addAutoLog("[LAYOUT] Restored window geometries and coordinates.");
    }
  };

  // Simulating live loop for automatic triggers!
  // Checks temp and shield metrics to fire automated actions
  useEffect(() => {
    let lastCheckedShield = 100;
    const interval = setInterval(() => {
      // 1. GPU Temp Alert Automatic Trigger (Thermal Guard)
      // Generates mock temperature flux
      const rTemp = 60 + Math.random() * 20;
      if (rTemp > 75 && automationRules.find(r => r.id === "rule_2")?.active) {
        setAutomationRules(prev => prev.map(r => {
          if (r.id === "rule_2" && r.status === "idle") {
            addAutoLog("[AUTOMATION] CRITICAL TEMP DETECTED: " + rTemp.toFixed(1) + "°C. Running rule [Thermal Guard]...");
            // Auto throttles CUDA cores in Settings in response
            setTimeout(() => {
              setLocalCudaUsed(prev => Math.max(256, prev - 512));
              addAutoLog("[AUTOMATION_SUCCESS] Throttle complete: Cores scaled back by 512. Thermal state lowered.");
            }, 1000);
            return { ...r, status: "triggered", lastExecuted: new Date().toUTCString().split(" ")[4] };
          }
          return r;
        }));
      } else if (rTemp <= 72) {
        // Reset rule state to idle for trigger-refresh
        setAutomationRules(prev => prev.map(r => r.id === "rule_2" && r.status === "triggered" ? { ...r, status: "idle" } : r));
      }

      // 2. Shield Low Alarm Automatic Trigger (Reserve Allocator)
      if (spaceShield < 30 && lastCheckedShield >= 30 && automationRules.find(r => r.id === "rule_3")?.active) {
        setAutomationRules(prev => prev.map(r => {
          if (r.id === "rule_3" && r.status === "idle") {
            addAutoLog("[AUTOMATION] WARN: Spacecraft Shield is vulnerable (" + spaceShield.toFixed(0) + "%). Initiating supplementary buffer!");
            if (useSfx) playSynthBeep("warning");
            setTimeout(() => {
              setLocalVramAlloc(prev => Math.min(16.0, prev + 2.5));
              addAutoLog("[AUTOMATION_SUCCESS] Supplemental VRAM allocation complete (+2.5 GB). Shield emergency generator synchronized.");
            }, 1200);
            return { ...r, status: "triggered", lastExecuted: new Date().toUTCString().split(" ")[4] };
          }
          return r;
        }));
      } else if (spaceShield >= 60) {
        setAutomationRules(prev => prev.map(r => r.id === "rule_3" && r.status === "triggered" ? { ...r, status: "idle" } : r));
      }

      lastCheckedShield = spaceShield;
    }, 2800);
    return () => clearInterval(interval);
  }, [spaceShield, automationRules, useSfx]);

  // Handle Free Asset / Package Downloads
  const downloadPackage = (pkgId: string) => {
    if (useSfx) playSynthBeep("click");
    setFreePackages(prev => prev.map(pkg => {
      if (pkg.id === pkgId) {
        addAutoLog(`[DOWNLOADER] Querying network repositories for "${pkg.name}"...`);
        // Simulate download steps
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setFreePackages(current => current.map(p => {
            if (p.id === pkgId) {
              if (progress >= 100) {
                clearInterval(interval);
                // Launch assembler
                setTimeout(() => {
                  assemblePackage(pkgId);
                }, 500);
                return { ...p, progress: 100, downloading: false };
              }
              return { ...p, progress };
            }
            return p;
          }));
        }, 120);
        return { ...pkg, progress: 0 };
      }
      return pkg;
    }));
  };

  const assemblePackage = (pkgId: string) => {
    setFreePackages(prev => prev.map(pkg => {
      if (pkg.id === pkgId) {
        addAutoLog(`[ASSEMBLER] Received gzip payload for "${pkg.name}". Instantiating linker...`);
        return { ...pkg, assembling: true };
      }
      return pkg;
    }));

    // Compiling & integrating asset elements
    setTimeout(() => {
      setFreePackages(prev => prev.map(pkg => {
        if (pkg.id === pkgId) {
          addAutoLog(`[ASSEMBLER_SUCCESS] Core target integrated! "${pkg.name}" successfully active on live runtime.`);
          if (useSfx) playSynthBeep("success");

          // Directly apply dynamic engine boosters
          if (pkgId === "pkg_boost") {
            setLocalPipeline("vulkanShader");
            setLocalCpuThreads(12);
            addAutoLog("[RUNTIME_UPGRADE] Vulkan multi-thread registers active. 12 task threads allocated.");
          } else if (pkgId === "pkg_physics") {
            addAutoLog("[RUNTIME_UPGRADE] Space Odyssey Trajectory Physics module upgraded. Trajectories are 100% relativistic.");
          } else if (pkgId === "pkg_skins") {
            setLocalShaderMode("volumetric");
            addAutoLog("[RUNTIME_UPGRADE] GLOW-Pack texturing completed: Asteroid shrapnel layers given volumetric shaders.");
          } else if (pkgId === "pkg_sfx") {
            addAutoLog("[RUNTIME_UPGRADE] Audio buffers synthesized. WebAudio master levels fully active.");
          }

          return { ...pkg, downloaded: true, assembling: false };
        }
        return pkg;
      }));
    }, 2000);
  };

  return (
    <div className={`w-full relative min-h-[920px] rounded-3xl overflow-hidden border border-teal-500/20 shadow-2xl flex flex-col ${activeWallpaper.bgClass} select-none`}>
      
      {/* Background Wallpaper layers */}
      
      {/* Type Carina: Ambient Nebula */}
      {activeWallpaper.type === "nebula" && (
        <div className="absolute inset-0 pointer-events-none opacity-45 overflow-hidden transition-all duration-700">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/20 via-purple-950/25 to-transparent blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950/10 to-transparent blur-3xl"></div>
          {/* Parallax stardust background */}
          <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
        </div>
      )}

      {/* Type Grid: Glowing digital web */}
      {activeWallpaper.type === "grid" && (
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden transition-all duration-700">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        </div>
      )}

      {/* Type Matrix: falling waterfall stream of code */}
      {activeWallpaper.type === "matrix" && (
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden transition-all duration-700 font-mono text-[9px] text-cyan-400">
          <div className="absolute inset-0 grid grid-cols-12 gap-1 px-4 select-none opacity-60">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col animate-[pulse_3s_infinite]" style={{ animationDelay: `${i * 200}ms` }}>
                {Array.from({ length: 30 }).map((_, j) => (
                  <span key={j} className="my-0.5 block">{Math.random() > 0.5 ? "1" : "0"}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Charcoal: Soft minimal matte */}
      {activeWallpaper.type === "charcoal" && (
        <div className="absolute inset-0 pointer-events-none opacity-50 transition-all duration-700 bg-gradient-to-br from-indigo-950/5 via-transparent to-slate-950/20"></div>
      )}

      {/* CosmoOS Top Status Header & Shell controls */}
      <div className="bg-slate-950/90 border-b border-teal-500/20 px-5 py-3 flex items-center justify-between backdrop-blur-md z-40 relative">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Layout className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-mono text-teal-100 uppercase tracking-widest flex items-center gap-1.5">
                CosmoOS buildArt
                <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-normal uppercase">SYSTEM CORE V2.0</span>
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 hidden xs:block">
              {isRtl 
                ? "میز کار مهندسی با پنجره‌های خلاقانه و قابل جابجایی دسکتاپ • کلیدها متمرکز و منظم" 
                : "Interactive multi-window workspace containing compilers, connected tools & settings."}
            </p>
          </div>
        </div>

        {/* Global Window Controllers / Arrange managers */}
        <div className="flex items-center gap-2">
          {/* Sound Synthesizer toggle */}
          <button
            onClick={() => {
              playSynthBeep("click");
              setUseSfx(!useSfx);
            }}
            className={`p-1.5 rounded-lg border text-xs gap-1 transition-all flex items-center ${useSfx ? "bg-teal-500/10 border-teal-500/30 text-teal-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}
            title={isRtl ? "جلوه‌های صوتی سنتز لایو" : "Live synth SFX audio feedback"}
          >
            {useSfx ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="text-[10px] uppercase font-mono font-bold hidden sm:inline">{isRtl ? "صدا" : "Audio"}</span>
          </button>

          <span className="text-slate-800 font-mono">|</span>

          {/* Symmetrical Window Managers */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => arrangeWindows("tile")}
              className="p-1 px-1.5 text-[10px] font-mono font-bold hover:text-cyan-400 hover:bg-slate-950 rounded transition-all flex items-center gap-1"
              title="Align tiled grids"
            >
              <Layout className="h-3 w-3" />
              <span className="hidden md:inline">{isRtl ? "مرتب‌سازی کاشی" : "Tile"}</span>
            </button>
            <button
              onClick={() => arrangeWindows("cascade")}
              className="p-1 px-1.5 text-[10px] font-mono font-bold hover:text-cyan-400 hover:bg-slate-950 rounded transition-all flex items-center gap-1"
              title="Align overlapping stack"
            >
              <List className="h-3 w-3" />
              <span className="hidden md:inline">{isRtl ? "مرتب‌سازی پله‌ای" : "Cascade"}</span>
            </button>
            <button
              onClick={() => arrangeWindows("reset")}
              className="p-1 px-1.5 text-[10px] font-mono font-bold hover:text-rose-400 hover:bg-slate-950 rounded transition-all flex items-center gap-1"
              title="Reset window geometry coordinates"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden md:inline">{isRtl ? "ریست چیدمان" : "Default"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Absolute Canvas Workspace containing moveable, resizable Windows */}
      <div className="flex-grow w-full relative min-h-[780px] p-4 overflow-hidden">
        
        {/* Render actual Desktop Icons */}
        <div className="absolute top-5 left-5 flex flex-col gap-5 z-10 w-24">
          {windows.map(win => (
            <button
              key={win.id}
              onClick={() => openApp(win.id)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl group transition-all text-center ${win.isOpen && !win.isMinimized ? "bg-teal-500/10 border border-teal-500/20 shadow-md shadow-cyan-950/40" : "hover:bg-slate-900/60 border border-transparent"}`}
            >
              <div className="h-11 w-11 rounded-2xl bg-slate-950/80 border border-teal-500/20 group-hover:border-cyan-400 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105">
                {React.cloneElement(win.icon as React.ReactElement, { className: "h-5 w-5 text-cyan-400" })}
              </div>
              <span className="text-[10px] font-sans font-bold text-slate-100 uppercase tracking-tight truncate w-full break-words max-w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {isRtl ? win.title.fa.split(" ")[1] || "اپ" : win.id.toUpperCase()}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic Map of Draggable Windows */}
        <AnimatePresence>
          {windows.map((win) => {
            if (!win.isOpen || win.isMinimized) return null;

            return (
              <motion.div
                key={win.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: win.isMaximized ? "absolute" : "absolute",
                  left: win.isMaximized ? 4 : win.x,
                  top: win.isMaximized ? 4 : win.y,
                  width: win.isMaximized ? "calc(100% - 8px)" : win.width,
                  height: win.isMaximized ? "calc(100% - 8px)" : win.height,
                  zIndex: win.zIndex,
                }}
                className="bg-slate-950/95 border border-cyan-500/35 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden leading-none backdrop-blur-md"
                onMouseDown={() => focusWindow(win.id)}
              >
                {/* Title Bar Dragger */}
                <div
                  onMouseDown={(e) => handleHeaderMouseDown(win.id, e)}
                  onDoubleClick={() => toggleMaximize(win.id)}
                  className="bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-teal-500/20 cursor-move select-none shrink-0"
                >
                  <div className="flex items-center gap-2">
                    {win.icon}
                    <span className="text-[11px] font-sans font-bold text-slate-200">
                      {isRtl ? win.title.fa : win.title.en}
                    </span>
                  </div>

                  {/* Window Actions */}
                  <div className="flex items-center gap-2">
                    {/* Minimize */}
                    <button
                      onClick={(e) => toggleMinimize(win.id, e)}
                      className="p-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Dock application"
                    >
                      <Minimize2 className="h-3 w-3" />
                    </button>
                    {/* Maximize */}
                    <button
                      onClick={(e) => toggleMaximize(win.id, e)}
                      className="p-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Fullscreen application"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    {/* Close */}
                    <button
                      onClick={(e) => closeWindow(win.id, e)}
                      className="p-1 rounded bg-red-950/50 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer"
                      title="Safely close application"
                    >
                      <X className="h-3 w-3 animate-pulse" />
                    </button>
                  </div>
                </div>

                {/* Window Main view contents (with specific views) */}
                <div className="flex-grow overflow-y-auto leading-normal bg-[#01080d]/80 relative custom-scrollbar">
                  
                  {/* APP CONTROLLER: IDE SPACE ACTION */}
                  {win.id === "ide" && (
                    <div className="p-4 h-full">
                      <VisualStudioIdeView currentLang={currentLang} />
                    </div>
                  )}

                  {/* APP CONTROLLER: ROADMAP */}
                  {win.id === "lifecycle" && (
                    <div className="p-6 h-full">
                      <ProjectLifecycleView currentLang={currentLang} />
                    </div>
                  )}

                  {/* APP CONTROLLER: AUTOMATION ORCHESTRATION */}
                  {win.id === "automation" && (
                    <div className="p-5 flex flex-col gap-5 h-full">
                      <div className="flex flex-col gap-1 border-b border-teal-950 pb-2">
                        <span className="text-xs font-mono font-black text-emerald-400 uppercase flex items-center gap-1.5">
                          <Activity className="h-4 w-4 animate-pulse text-emerald-400" />
                          {isRtl ? "اتوماسیون پردازش و پیوند برنامه‌ها" : "Automated Connected Pipelines Engine"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isRtl 
                            ? "اجرای خودکار عملیات‌ها بر اساس سنسور‌های داخلی و کدهای متصل موتور‌های بازی‌سازی" 
                            : "Configure triggers, auto-pilots, and dynamic hardware schedulers based on loop metrics."}
                        </span>
                      </div>

                      {/* Connection links list */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
                        {connectedApps.map(app => (
                          <div key={app.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-mono text-cyan-500">{app.type}</span>
                            <span className="text-[10.5px] font-bold text-slate-200 truncate w-full">{app.name}</span>
                            <div className="flex items-center justify-between text-[9px] font-mono mt-1 pt-1.5 border-t border-slate-950">
                              <span className={`flex items-center gap-1 ${app.status === "connected" ? "text-emerald-400 font-bold" : (app.status === "syncing" ? "text-amber-500 animate-pulse" : "text-slate-500")}`}>
                                <Check className="h-2.5 w-2.5" />
                                {app.status.toUpperCase()}
                              </span>
                              <span className="text-slate-500">{app.delay > 0 ? `${app.delay}ms` : "Standby"}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Automation rules switches */}
                      <div className="flex flex-col gap-2.5 mt-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                          {isRtl ? "منشور قوانین خودکارساز فعال استودیو" : "Active Studio Orchestrator Automation Rules"}
                        </span>
                        
                        <div className="space-y-2 max-h-[160px] overflow-y-auto">
                          {automationRules.map(rule => (
                            <div key={rule.id} className="bg-slate-900/60 border border-teal-950/40 rounded-xl p-3 flex items-center justify-between gap-4">
                              <div className="flex items-start gap-2.5">
                                <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${rule.active ? "bg-emerald-500 animate-pulse" : "bg-slate-800"}`} />
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[11px] font-semibold text-slate-100 leading-normal">
                                    {isRtl ? rule.name.fa : rule.name.en}
                                  </span>
                                  <span className="text-[9.5px] font-mono text-cyan-550">
                                    TRIGGER: <span className="text-zinc-400 font-bold">{rule.trigger}</span> &rarr; ACTION: <span className="text-emerald-400 font-bold">{rule.action}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {rule.lastExecuted && (
                                  <span className="text-[9px] font-mono text-slate-500">
                                    Last run: {rule.lastExecuted}
                                  </span>
                                )}
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={rule.active}
                                    onChange={(e) => {
                                      const activated = e.target.checked;
                                      setAutomationRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: activated } : r));
                                      addAutoLog(`Rule [${rule.id.toUpperCase()}] toggled ${activated ? "ON" : "OFF"}.`);
                                      if (useSfx) playSynthBeep("click");
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-teal-950 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Automation interactive log area */}
                      <div className="flex-grow flex flex-col mt-2 min-h-[120px] bg-slate-950/60 border border-teal-950 rounded-xl overflow-hidden">
                        <div className="bg-[#03151f] px-3 py-1.5 border-b border-teal-980/10 flex items-center justify-between text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          <span>Live automator event listeners & log stream</span>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <div className="flex-grow p-3 font-mono text-[10.5px] text-slate-450 space-y-1.5 overflow-y-auto max-h-[140px] bg-[#010609]">
                          {autoLogs.map((log, idx) => (
                            <div key={idx} className="leading-relaxed hover:text-emerald-300 transition-colors">
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* APP CONTROLLER: OPEN-SOURCE PACKAGE DOWNLOADER */}
                  {win.id === "downloader" && (
                    <div className="p-5 flex flex-col gap-4 h-full">
                      <div className="flex flex-col gap-1 border-b border-teal-950 pb-2">
                        <span className="text-xs font-mono font-black text-indigo-400 uppercase flex items-center gap-1.5">
                          <Download className="h-4 w-4 text-indigo-400" />
                          {isRtl ? "مخزن دانلود پکیج‌های اینترنت مستقل و اسمبلر" : "Free Web Asset & Open-Source Downloader"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isRtl 
                            ? "جستجوی پکیج‌های آزاد و گانوس صوتی/گرافیکی، دانلود لایو با اسمبلر خودکار بدون دردسر ساخت" 
                            : "Browse public registries, stream compressed dll/wasm archives, and auto-integrate features directly into game loops."}
                        </span>
                      </div>

                      {/* Package repository list */}
                      <div className="space-y-3 flex-grow">
                        {freePackages.map(pkg => (
                          <div key={pkg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-grow select-none">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold font-mono text-slate-100 bg-[#06151f] px-2.5 py-1 rounded border border-teal-500/20 shadow-sm leading-none shrink-0 truncate max-w-[210px] block">
                                  {pkg.name}
                                </span>
                                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/30 border border-indigo-950 px-1.5 py-0.5 rounded font-black shrink-0 uppercase">{pkg.size}</span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 mt-2 leading-relaxed">
                                {isRtl ? pkg.description.fa : pkg.description.en}
                              </p>
                              <span className="text-[9px] font-mono text-slate-600 block mt-1">Publisher: {pkg.author} | Registry: raw.githubusercontent.com</span>
                            </div>

                            {/* Download execution controls */}
                            <div className="flex flex-col gap-2 items-end shrink-0 w-full md:w-auto">
                              {pkg.progress > 0 && pkg.progress < 100 ? (
                                <div className="w-full md:w-36 flex flex-col gap-1.5">
                                  <div className="flex justify-between text-[9px] font-mono text-cyan-400">
                                    <span>DOWNLOADING...</span>
                                    <span>{pkg.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-950 border border-teal-980 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 transition-all duration-100" style={{ width: `${pkg.progress}%` }} />
                                  </div>
                                </div>
                              ) : pkg.assembling ? (
                                <div className="text-right flex items-center gap-2 text-[10px] font-mono text-amber-400">
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                  <span>ASSEMBLING BUILDS...</span>
                                </div>
                              ) : pkg.downloaded ? (
                                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-lg text-[10px] font-bold font-mono flex items-center gap-1.5 uppercase">
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span>INTEGRATED</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => downloadPackage(pkg.id)}
                                  className="w-full md:w-auto bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white px-4 py-1.5 rounded-lg text-[10.5px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  {isRtl ? "دانلود رایگان و اسمبل" : "FETCH & ASSEMBLE"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Helpful tip */}
                      <div className="bg-[#0c0d16] border border-indigo-950 rounded-xl p-3 text-[10px] font-mono text-indigo-400 flex items-center gap-2">
                        <Star className="h-4 w-4 text-indigo-450 animate-pulse" />
                        <span>All elements downloaded here are fetched securely from zero-cost open repositories in compressed binary blocks.</span>
                      </div>
                    </div>
                  )}

                  {/* APP CONTROLLER: CONSOLIDATED GLOBAL SETTINGS HUB */}
                  {win.id === "settings" && (
                    <div className="p-5 flex flex-col gap-5 h-full">
                      <div className="flex flex-col gap-1 border-b border-teal-950 pb-2">
                        <span className="text-xs font-mono font-black text-amber-400 uppercase flex items-center gap-1.5">
                          <Settings className="h-4 w-4 animate-spin" style={{ animationDuration: "14s" }} />
                          {isRtl ? "گزینه‌ها و تنظیمات متمرکز سیستم" : "Unified Management & Options Suite"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isRtl 
                            ? "اتاق فرمان متمرکز تمام ولوم‌ها، کلوک‌های محاسباتی، تصاویر و زبان کل محیط کار" 
                            : "De-clutter configurations by adjusting renderers, wall backdrop arrays, and layouts."}
                        </span>
                      </div>

                      {/* Wallpaper Backdrop Selector */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400">{isRtl ? "تصویر پس‌زمینه محیط کاری دسکتاپ" : "Workspace Full Backdrop Image Wallpaper"}</span>
                        <div className="grid grid-cols-2 gap-2">
                          {wallpapers.map(wall => (
                            <button
                              key={wall.id}
                              onClick={() => {
                                if (useSfx) playSynthBeep("click");
                                setActiveWallpaper(wall);
                                addAutoLog(`[SETTINGS] Desktop Wallpaper mutated to layout preset [${wall.name.en}].`);
                              }}
                              className={`rounded-xl border p-2.5 text-right flex flex-col justify-between h-20 transition-all ${activeWallpaper.id === wall.id ? "bg-cyan-550/15 border-cyan-400 text-cyan-300 scale-[1.02] shadow-md shadow-cyan-900/30" : "bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850 cursor-pointer"}`}
                            >
                              <span className="text-[11px] font-bold block leading-snug">
                                {isRtl ? wall.name.fa : wall.name.en}
                              </span>
                              <span className="text-[9px] font-mono self-end uppercase text-slate-500">{wall.type} presets</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Languages Selector */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400">{isRtl ? "تغییر زبان جهانی رابط کاربری" : "Unified System Wide Language Interface"}</span>
                        <div className="grid grid-cols-5 gap-1.5 bg-[#03151f] p-1.5 border border-teal-950/60 rounded-xl text-center">
                          {[
                            { code: "fa", label: "🇮🇷 فارسی" },
                            { code: "en", label: "🇬🇧 EN" },
                            { code: "es", label: "🇪🇸 ES" },
                            { code: "de", label: "🇩🇪 DE" },
                            { code: "ja", label: "🇯🇵 JA" }
                          ].map(lang => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                if (useSfx) playSynthBeep("click");
                                onLanguageSwitch(lang.code as any);
                              }}
                              className={`py-1.5 rounded-lg text-[9.5px] font-bold transition-all ${currentLang === lang.code ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"}`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Global Physical Sliders - Integrated here to clean up VisualStudioIdeView clutter! */}
                      <div className="bg-slate-900/80 border border-teal-950 p-4 rounded-2xl flex flex-col gap-4">
                        <span className="text-[9.5px] font-mono uppercase text-teal-400 border-b border-teal-950/80 pb-1.5 block">
                          {isRtl ? "مدیریت ثبات کلاک هسته و رندر گرافیک" : "Core Compute Clock & Render Registers"}
                        </span>

                        {/* Rendering Pipeline selection */}
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[9px] font-mono text-cyan-500 uppercase">{isRtl ? "پیپ‌لاین رندر گرافیک" : "Target Render Pipeline API"}</span>
                          <select
                            value={localPipeline}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setLocalPipeline(val);
                              addAutoLog(`[RENDER] API altered to: [${val.toUpperCase()} TARGETS].`);
                              if (useSfx) playSynthBeep("click");
                            }}
                            className="bg-slate-950 border border-teal-500/20 text-[10.5px] font-mono font-bold text-teal-300 p-2 rounded outline-none cursor-pointer"
                          >
                            <option value="denseParticle">✨ Raymarching Dense Particles (فوق‌العاده قوی)</option>
                            <option value="standard">⚡ Core 2D Vector Light Shader (پیش‌فرض)</option>
                            <option value="vulkanShader">🌀 SPIR-V Vulkan Gravity Simulation (شبیه‌ساز فیزیک)</option>
                          </select>
                        </div>

                        {/* Post process Shaders */}
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[9px] font-mono text-cyan-500 uppercase">{isRtl ? "افکت‌های تصویرگذاری شیدرها" : "Post-processing Shader Overlays"}</span>
                          <select
                            value={localShaderMode}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setLocalShaderMode(val);
                              addAutoLog(`[SHADER] Core shader modified to [${val.toUpperCase()}].`);
                              if (useSfx) playSynthBeep("click");
                            }}
                            className="bg-slate-950 border border-teal-500/20 text-[10.5px] font-mono font-bold text-teal-300 p-2 rounded outline-none cursor-pointer"
                          >
                            <option value="volumetric">🪐 Volumetric Nebula Glow (شیدرهای حجمی)</option>
                            <option value="scanline">📺 Phosphor CRT Scanlines & Bloom (نوستالژیک)</option>
                            <option value="none">❌ Pure Vector Canvas (بهینه‌سازی حداکثری)</option>
                          </select>
                        </div>

                        {/* CUDA Cores allocation range */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="text-slate-400">Allocated CUDA Cores</span>
                            <span className="text-cyan-400 font-bold">{localCudaUsed} Cores</span>
                          </div>
                          <input
                            type="range"
                            min="128"
                            max="4096"
                            step="128"
                            value={localCudaUsed}
                            onChange={(e) => setLocalCudaUsed(parseInt(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-1 rounded"
                          />
                        </div>

                        {/* Dedicated Slot VRAM alloc */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="text-slate-400">VRAM Reserved Slot</span>
                            <span className="text-purple-400 font-bold">{localVramAlloc.toFixed(1)} GB</span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="16.0"
                            step="0.5"
                            value={localVramAlloc}
                            onChange={(e) => setLocalVramAlloc(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-1 rounded"
                          />
                        </div>

                        {/* Logical CPU Thread pools */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="text-slate-400">Logical Task Threads</span>
                            <span className="text-blue-400 font-bold">{localCpuThreads} Threads</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="16"
                            step="1"
                            value={localCpuThreads}
                            onChange={(e) => setLocalCpuThreads(parseInt(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-1 rounded"
                          />
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Resize dragging anchor node */}
                {!win.isMaximized && (
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(win.id, e)}
                    className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-gradient-to-br from-transparent to-cyan-500/60 z-50 rounded-br-2xl"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

      </div>

      {/* CosmoOS Bottom Taskbar / Dock dock */}
      <div className="bg-slate-950 px-5 py-3 border-t border-teal-500/25 flex items-center justify-between backdrop-blur-md z-40 relative gap-4">
        
        {/* Core Menu Launcher Launcher and arranges */}
        <div className="flex items-center gap-2">
          {/* Main system menu and indicator log status */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 select-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase hidden md:inline">SYSTEM STATE: ONLINE</span>
          </div>
        </div>

        {/* Floating taskbar dock containing active applications */}
        <div className="flex items-center gap-2.5 bg-[#03151f]/80 p-1.5 border border-teal-550/20 rounded-2xl shadow-xl max-w-full overflow-x-auto">
          {windows.map((win) => {
            const isActive = win.isOpen && !win.isMinimized;
            return (
              <button
                key={win.id}
                onClick={() => {
                  if (isActive) {
                    toggleMinimize(win.id);
                  } else {
                    openApp(win.id);
                  }
                }}
                className={`h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all outline-none ${isActive ? "bg-teal-500/10 border border-teal-500/35 text-teal-300 scale-102 shadow-md shadow-cyan-950" : "bg-slate-900/60 border border-transparent text-slate-500 hover:text-slate-350 cursor-pointer"}`}
              >
                {React.cloneElement(win.icon as React.ReactElement, { className: `h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}` })}
                <span className="text-[10px] font-mono font-bold hidden sm:inline uppercase">
                  {win.id}
                </span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
              </button>
            );
          })}
        </div>

        {/* Right HUD performance dial counts */}
        <div className="flex items-center gap-3 text-right">
          <div className="text-[10px] font-mono text-slate-450 hidden lg:block leading-tight">
            <div>PHYSICS FPS: <span className="text-cyan-400 font-bold">60.2</span></div>
            <div>DRAWS: <span className="text-teal-400 font-bold">140+</span></div>
          </div>
          <span className="text-slate-800 font-mono hidden lg:inline">|</span>
          <div className="flex flex-col gap-0.5 justify-end">
            <div className="flex items-center gap-1 justify-end">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-[9.5px] font-mono text-amber-400 font-bold">COSMO ENGINE CONSOLE</span>
            </div>
            <div className="text-[10.5px] font-sans text-slate-300 font-bold">
              {spaceScore > 0 ? `SCORE: ${spaceScore}` : "LAUNCH & SHOOT"}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
