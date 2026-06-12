import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal as TerminalIcon, Brackets, Brain, Cpu, Play, Save, Code, FolderOpen, 
  Settings, HeartPulse, Zap, Activity, ShieldAlert, Binary, RefreshCw, Eye, HelpCircle, 
  ChevronRight, File, HardDrive, Sparkles, Folder, FileCode, CheckCircle2, ChevronDown, 
  Flame, MonitorPlay, AlertTriangle, ArrowRight, Layers, FileDown, Search, CpuIcon, Trash2
} from "lucide-react";

// Project Types
interface ProjectFile {
  name: string;
  language: "javascript" | "html" | "cpp" | "assembly" | "markdown";
  content: string;
  icon: React.ReactNode;
}

interface LogEntry {
  timestamp: string;
  source: "compiler" | "hardware" | "brain" | "reverse";
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface VisualStudioIdeViewProps {
  currentLang: "fa" | "en" | string;
}

export default function VisualStudioIdeView({ currentLang }: VisualStudioIdeViewProps) {
  const isRtl = currentLang === "fa";

  // Persian and English Dictionary
  const translations = {
    fa: {
      ideTitle: "استودیو توسعه بصری و شتاب‌دهنده موتور بازی‌سازی (ویژوال استادیو کامل)",
      ideSubtitle: "محیط برنامه‌نویسی واقعی، مدیریت شتاب حافظه کارت گرافیک، مغز متفکر سنتز الگوریتم و مهندسی معکوس",
      fileExplorer: "کاوشگر پروژه",
      codeEditor: "ویرایشگر کد متمرکز",
      livePreview: "پیش‌نمایش لایو پردازش سخت‌افزار (Canvas WebGL)",
      terminalConsole: "کنسول فرمان و ترمینال ماشین",
      hardwareAcceleration: "کنترلر شتاب‌دهنده سخت‌افزاری و مغز پردازشی",
      reverseEngineering: "هسته مهندسی معکوس و آنالایزر باینری",
      cloudBrain: "پردازش ابری مغز هوش مصنوعی (Gemini Engine)",
      localBrain: "پردازش بومی ترکیبی (CPU/GPU Core Hybrid)",
      useLocalTitle: "فعال‌سازی شتاب‌دهنده سخت‌افزار بومی کارت گرافیک",
      toggleDesc: "تخصیص آنی هسته‌های CUDA، شتاب‌دهی چندرشته‌ای پردازنده و کلاک کارت گرافیک برای رندر بازی‌های گرافیکی سنگین.",
      gpuTemp: "دمای هسته کارت گرافیک",
      cudaCores: "هسته‌های فعال CUDA",
      vramAllocated: "حافظه ویدیویی اختصاص یافته (VRAM)",
      cpuAllocation: "رشته‌های نخ‌کش پردازنده (CPU Threads)",
      decodingDisasm: "دیکودر و دی‌اسمبلر باینری",
      analyzerHex: "نمایشگر هگزادسیمال سکتورها",
      aiDecompiler: "مهندسی معکوس و استخراج معماری با هوش مصنوعی",
      runCode: "کامپایل و اجرای پروژه",
      saveCode: "ذخیره تغییرات",
      aiOptimize: "بهینه‌سازی کدهای پروژه با مغز هوش مصنوعی",
      reverseBtn: "مهندسی معکوس فایل و بازسازی معماری",
      consolePlaceholder: "دستورات خود را وارد کنید... (مثلا: disasm, run, brain -status, clear)",
      selectedFile: "فایل در حال ویرایش: ",
      uploadPrompt: "بارگذاری باینری خارجی (.bin, .dll, .exe) جهت مهندسی معکوس",
      hardwareGuard: "نگهبان پردازنده و نشت حافظه",
      hardwareGuardDesc: "سیستم هوشمند بهینه‌سازی رندرینگ و جلوگیری از کرش موتور گرافیکی با پایش کلاک کارت گرافیک.",
      compilingSuccess: "کامپایل با موفقیت در ۲۴ میلی‌ثانیه با بهره‌گیری از هسته‌های موازی کارت گرافیک انجام شد.",
      unrealLinkActive: "وضعیت ارتباط با یونیتی/آنریل: زنده (پورت ۹۰۴۲)",
      fpsCounter: "نرخ فریم رندر:",
      activeThreads: "رشته‌های فعال پردازشی:"
    },
    en: {
      ideTitle: "Visual Development Studio & Game Engine Accelerator (Complete VS)",
      ideSubtitle: "Real compilation environment, Local GPU Hardware Acceleration, Neuro Synthesis & Binary Reverse Engineering",
      fileExplorer: "Project File Explorer",
      codeEditor: "Focused Code Editor",
      livePreview: "Hardware Runtime Preview (Canvas WebGL)",
      terminalConsole: "Command Terminal & Virtual Machine Console",
      hardwareAcceleration: "Hardware Acceleration Panel & Core Brain",
      reverseEngineering: "Reverse Engineering Core & Binary Analyzer",
      cloudBrain: "Cloud AI Processor Brain (Gemini Engine)",
      localBrain: "Local Hybrid Processor (CPU/GPU Core Hybrid)",
      useLocalTitle: "Enable Local Hardware & GPU Acceleration",
      toggleDesc: "Dynamically allocate local GPU CUDA cores, multi-thread CPU queues, and VRAM bandwidth to render advanced graphic pipelines.",
      gpuTemp: "GPU Core Temperature",
      cudaCores: "Allocated CUDA Cores",
      vramAllocated: "Dedicated VRAM Buffer",
      cpuAllocation: "Allocated CPU Threads",
      decodingDisasm: "Binary Assembly Disassembler",
      analyzerHex: "Hexadecimal Byte Stream Inspector",
      aiDecompiler: "AI Reverse-Architecture Decompiler",
      runCode: "Compile and Run Project",
      saveCode: "Save Source File",
      aiOptimize: "AI Neuro-Optimize",
      reverseBtn: "Disassemble & Build Structure Map",
      consolePlaceholder: "Type terminal commands... (e.g., disasm, run, brain -status, clear)",
      selectedFile: "Editing File: ",
      uploadPrompt: "Upload raw firmware, DLL, or compiled game binaries to decompile",
      hardwareGuard: "Memory Leak Guard & Thermals",
      hardwareGuardDesc: "Intelligent monitoring system dynamically scaling physics models to safeguard localized hosting targets.",
      compilingSuccess: "Compilation succeeded in 24ms utilizing hardware-accelerated local compilation threads.",
      unrealLinkActive: "Unity/Unreal Connection status: Active (Port 9042)",
      fpsCounter: "Render Framerate:",
      activeThreads: "Active Threads:"
    }
  };

  const t = isRtl ? translations.fa : translations.en;

  // Project template setups
  const templates = {
    spaceGame: [
      {
        name: "space_odyssey.js",
        language: "javascript" as const,
        content: `// =====================================================================
// KINETIC SPACE ODYSSEY (ADVANCED HYBRID 2D GRAPHICS RENDER ENGINE)
// HARDWARE ACCELERATED PROCEDURAL MULTI-THREAD NEBULA SIMULATION
// =====================================================================

const canvas = document.getElementById("runtimeCanvas");
const ctx = canvas.getContext("2d");

// High-Performance Engine Pools
let particles = [];
let stars = [];
let nebulaLayers = [];
let gravityWells = [];

// Track frame loop specs
let totalDrawCalls = 0;
let physicsEntities = 0;

// Initialize parallax multi-layer stardust field
for(let i = 0; i < 160; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 0.5 + Math.random() * 2,
    speed: 0.15 + Math.random() * 1.6,
    hue: 180 + Math.random() * 60,
    brightness: 0.3 + Math.random() * 0.7
  });
}

// Procedural organic gaseous cloud nebulas (Radial blends)
for(let i = 0; i < 3; i++) {
  nebulaLayers.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    rad: 90 + Math.random() * 110,
    hue: i === 0 ? 190 : (i === 1 ? 275 : 325),
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15
  });
}

let player = { 
  x: canvas.width / 2, 
  y: canvas.height - 50, 
  size: 26, 
  speed: 8.5, 
  dx: 0, 
  shield: 100,
  glow: 15
};

let lasers = [];
let asteroids = [];
let score = 0;
let level = 1;
let explosionShockwaves = [];

// Seed high-mass gravitational singularity space anomalies
function triggerGravityWell(x, y) {
  gravityWells.push({
    x: x || Math.random() * canvas.width,
    y: y || 80 + Math.random() * 90,
    radius: 35 + Math.random() * 20,
    pulse: 0,
    life: 280
  });
}

// Seed initial black hole vector center
triggerGravityWell();

// Handle keyboard controls
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") player.dx = -player.speed;
  if (e.key === "ArrowRight" || e.key === "d") player.dx = player.speed;
  if (e.key === " " || e.key === "Enter") {
    // Twin vector fire representing double execution pipelines
    lasers.push({ x: player.x - 12, y: player.y - 12, size: 5, speed: 12 });
    lasers.push({ x: player.x + 12, y: player.y - 12, size: 5, speed: 12 });
    createThrusterBursts(player.x, player.y + 15, "rgba(34, 211, 238, 0.9)", 14);
  }
});

window.addEventListener("keyup", (e) => {
  if (["ArrowLeft", "a", "ArrowRight", "d"].includes(e.key)) player.dx = 0;
});

function createThrusterBursts(x, y, color, count) {
  for(let i=0; i<count; i++) {
    particles.push({
      x: x, 
      y: y,
      vx: (Math.random() - 0.5) * 4.5,
      vy: 1 + Math.random() * 5.5,
      color: color,
      size: 1.5 + Math.random() * 3,
      alpha: 1,
      life: 25 + Math.random() * 20
    });
  }
}

function spawnAsteroid() {
  if (Math.random() < 0.045 + (level * 0.005)) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: -30,
      size: 16 + Math.random() * 26,
      speed: 1.2 + Math.random() * 2.4 + (level * 0.15),
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.07,
      hp: 2,
      shardsColor: Math.random() > 0.5 ? "#f43f5e" : "#e2e8f0"
    });
  }
}

function updateGame() {
  totalDrawCalls = 0;
  physicsEntities = 1 + stars.length + nebulaLayers.length + gravityWells.length + lasers.length + asteroids.length + particles.length;

  // Move dynamic nebula vectors
  nebulaLayers.forEach(node => {
    node.x += node.vx;
    node.y += node.vy;
    if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
    if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
  });

  // Flow starfield
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  // Dissolve black holes
  gravityWells.forEach((well, idx) => {
    well.pulse += 0.08;
    well.life--;
    if (well.life <= 0) gravityWells.splice(idx, 1);
  });

  // Hero kinematics
  player.x += player.dx;
  if (player.x < player.size) player.x = player.size;
  if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;

  // Tiny exhaust flames
  if (Math.random() > 0.25) {
    createThrusterBursts(player.x, player.y + 12, "rgba(249, 115, 22, 0.75)", 2);
  }

  // Update dynamic laser coordinates
  lasers.forEach((laser, idx) => {
    laser.y -= laser.speed;

    // Distort laser trajectory when passing close to active mass singularity
    gravityWells.forEach(well => {
      const dist = Math.hypot(well.x - laser.x, well.y - laser.y);
      if (dist < well.radius * 3.2) {
        laser.x += (well.x - laser.x) / dist * 3.2;
        laser.y += (well.y - laser.y) / dist * 3.2;
      }
    });

    if (laser.y < 0) lasers.splice(idx, 1);
  });

  // Update space hazards & shard collisions
  asteroids.forEach((ast, aIdx) => {
    ast.y += ast.speed;
    ast.rotation += ast.rotSpeed;

    // Gravitational trajectory bending
    gravityWells.forEach(well => {
      const dist = Math.hypot(well.x - ast.x, well.y - ast.y);
      if (dist < well.radius * 3.5) {
        ast.x += (well.x - ast.x) / dist * 1.6;
        ast.y += (well.y - ast.y) / dist * 1.6;
      }
    });

    if (ast.y > canvas.height + 40) {
      asteroids.splice(aIdx, 1);
      return;
    }

    // Hero contact details
    const pDist = Math.hypot(player.x - ast.x, player.y - ast.y);
    if (pDist < player.size + ast.size / 2) {
      player.shield = Math.max(0, player.shield - 20);
      createExplosion(player.x, player.y, "#f43f5e", 35);
      asteroids.splice(aIdx, 1);
      score = Math.max(0, score - 15);
      return;
    }

    // Weapons checks
    lasers.forEach((laser, lIdx) => {
      const lDist = Math.hypot(laser.x - ast.x, laser.y - ast.y);
      if (lDist < ast.size + 10) {
        ast.hp--;
        lasers.splice(lIdx, 1);
        
        // Impact dust sparkles
        createExplosion(laser.x, laser.y, "#22d3ee", 8);

        if (ast.hp <= 0) {
          // Push circular expand shockwave ring
          explosionShockwaves.push({
            x: ast.x,
            y: ast.y,
            radius: 5,
            maxRadius: ast.size * 2,
            alpha: 1
          });

          // Fragmentation system: asteroid splits into glowing shrapnel particles
          createExplosion(ast.x, ast.y, ast.shardsColor, 30);
          asteroids.splice(aIdx, 1);
          score += 15;
          if (score % 150 === 0) {
            level++;
            triggerGravityWell();
          }
        }
      }
    });
  });

  // Shift shockwaves
  explosionShockwaves.forEach((sw, idx) => {
    sw.radius += 3.5;
    sw.alpha -= 0.04;
    if (sw.alpha <= 0) explosionShockwaves.splice(idx, 1);
  });

  // Calculate particles vector friction & gravity suction
  particles.forEach((p, idx) => {
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.alpha = Math.max(0, p.life / 50);

    gravityWells.forEach(well => {
      const dist = Math.hypot(well.x - p.x, well.y - p.y);
      if (dist < well.radius * 2.2) {
        p.x += (well.x - p.x) / dist * 1.4;
        p.y += (well.y - p.y) / dist * 1.4;
      }
    });

    if (p.life <= 0) particles.splice(idx, 1);
  });
}

function createExplosion(x, y, color, density) {
  const count = density || 20;
  for(let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 8.0;
    particles.push({
      x: x, 
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color || "rgba(34, 211, 238, 0.95)",
      size: 1 + Math.random() * 4,
      life: 25 + Math.random() * 30,
      alpha: 1
    });
  }
}

function drawGame() {
  // Paint void background
  ctx.fillStyle = "#01070e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  totalDrawCalls++;

  // 1. Gaseous gas clouds screen compositing (Skip if shader is 'none')
  if (window.activeShader !== "none") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    nebulaLayers.forEach(node => {
      const grad = ctx.createRadialGradient(node.x, node.y, 8, node.x, node.y, node.rad);
      grad.addColorStop(0, "rgba(" + (node.hue === 190 ? "34, 211, 238" : (node.hue === 275 ? "139, 92, 246" : "244, 63, 94")) + ", 0.2)");
      grad.addColorStop(0.5, "rgba(" + (node.hue === 190 ? "6, 182, 212" : (node.hue === 275 ? "109, 40, 217" : "225, 29, 72")) + ", 0.07)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.rad, 0, Math.PI * 2);
      ctx.fill();
      totalDrawCalls++;
    });
    ctx.restore();
  }

  // 2. Clear clean stardrops
  stars.forEach(star => {
    ctx.fillStyle = "rgba(" + star.hue + ", " + (star.hue + 35) + ", 255, " + star.brightness + ")";
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });

  // 3. Render event horizon gravity fields
  gravityWells.forEach(well => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createRadialGradient(well.x, well.y, 4, well.x, well.y, well.radius * (1 + Math.sin(well.pulse) * 0.08));
    grad.addColorStop(0, "#000000"); // Inner black core
    grad.addColorStop(0.2, "rgba(168, 85, 247, 0.7)"); // Dark indigo horizon
    grad.addColorStop(0.65, "rgba(34, 211, 238, 0.3)"); // Laser glow ring
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(well.x, well.y, well.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Event Horizon ticks
    ctx.translate(well.x, well.y);
    ctx.rotate(well.pulse * 0.25);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, well.radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    totalDrawCalls += 2;
  });

  // 4. Draw Hero Ship with glowing vector barrier
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.shield > 20) {
    ctx.strokeStyle = "rgba(34, 211, 238, " + (0.15 + (player.shield / 100) * 0.35) + ")";
    ctx.shadowBlur = player.glow;
    ctx.shadowColor = "#22d3ee";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -4, player.size * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Dual wing structure
  const shipGradient = ctx.createLinearGradient(0, -player.size, 0, player.size);
  shipGradient.addColorStop(0, "#1e1b4b");
  shipGradient.addColorStop(1, "#312e81");
  ctx.fillStyle = shipGradient;
  ctx.beginPath();
  ctx.moveTo(-player.size * 1.35, player.size * 0.55);
  ctx.lineTo(0, -player.size * 1.25);
  ctx.lineTo(player.size * 1.35, player.size * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Glass cabin cockpit
  ctx.fillStyle = "#22d3ee";
  ctx.beginPath();
  ctx.ellipse(0, -player.size * 0.25, 4, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thruster flames
  ctx.fillStyle = Math.random() > 0.55 ? "#f97316" : "#ef4444";
  ctx.beginPath();
  ctx.moveTo(-9, player.size * 0.55);
  ctx.lineTo(-9, player.size * 1.1 + Math.random() * 5);
  ctx.lineTo(-6, player.size * 0.55);
  ctx.moveTo(6, player.size * 0.55);
  ctx.lineTo(9, player.size * 1.1 + Math.random() * 5);
  ctx.lineTo(9, player.size * 0.55);
  ctx.fill();

  ctx.restore();
  totalDrawCalls += 3;

  // 5. Draw high-energy twin laser beams
  lasers.forEach(laser => {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#22d3ee";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(laser.x - 2, laser.y, 4, 16);
    ctx.restore();
    totalDrawCalls++;
  });

  // 6. Draw uneven polygonal space hazards
  asteroids.forEach(ast => {
    ctx.save();
    ctx.translate(ast.x, ast.y);
    ctx.rotate(ast.rotation);
    
    const stoneGradient = ctx.createRadialGradient(-3, -3, 1, 0, 0, ast.size);
    stoneGradient.addColorStop(0, "#475569");
    stoneGradient.addColorStop(0.85, "#1e293b");
    stoneGradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = stoneGradient;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    const verticesCount = 8;
    for(let i=0; i<verticesCount; i++) {
      const angle = (i / verticesCount) * Math.PI * 2;
      const offset = 0.84 + Math.sin(angle * 3.2) * 0.14;
      const radius = ast.size * offset;
      const vx = Math.cos(angle) * radius;
      const vy = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    totalDrawCalls += 2;
  });

  // 7. Shockwave overlays
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  explosionShockwaves.forEach(sw => {
    ctx.strokeStyle = "rgba(167, 243, 252, " + sw.alpha + ")";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    totalDrawCalls++;
  });
  ctx.restore();

  // 8. Draw vector particles
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.restore();

  // 9. Interactive Heads Up Display Console overlay in Persian and English
  ctx.fillStyle = "rgba(3, 15, 23, 0.92)";
  ctx.fillRect(0, 0, canvas.width, 32);
  ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(canvas.width, 32);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px monospace";
  ctx.fillText("SCORE: " + score, 14, 19);

  ctx.fillStyle = "#a855f7";
  ctx.fillText("PIPE: " + (window.activeRenderPipeline || "DENSE").toUpperCase(), 92, 19);

  // Parallel processing load
  ctx.fillStyle = "#10b981";
  ctx.font = "9px monospace";
  ctx.fillText("SYSTEM DRAW CALLS: " + totalDrawCalls + " | PIXS: " + physicsEntities, canvas.width - 230, 19);

  // Health bar HUD
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(canvas.width - 74, 12, 60, 7);
  ctx.fillStyle = player.shield > 40 ? "#10b981" : "#ef4444";
  ctx.fillRect(canvas.width - 74, 12, (player.shield / 100) * 60, 7);

  // 10. Phosphor CRT scanlines shader post-process
  if (window.activeShader === "scanline") {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    for (let y = 0; y < canvas.height; y += 3) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
    // High spectrum flicker glow
    ctx.fillStyle = "rgba(34, 211, 238, 0.02)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

window.gameLoop = function() {
  updateGame();
  drawGame();
  spawnAsteroid();
};
`,
        icon: <FileCode className="h-4 w-4 text-cyan-400" />
      },
      {
        name: "index.html",
        language: "html" as const,
        content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #010609; margin: 0; overflow: hidden; }
    canvas { display: block; box-shadow: 0 0 30px rgba(6,182,212,0.15); border-radius: 8px; }
  </style>
</head>
<body>
  <canvas id="runtimeCanvas" width="480" height="350"></canvas>
</body>
</html>`,
        icon: <Code className="h-4 w-4 text-amber-500" />
      }
    ],
    neuromorphicWeb: [
      {
        name: "neuromorphic_dashboard.js",
        language: "javascript" as const,
        content: `// ==========================================
// AI NEUROMORPHIC COGNITIVE ENGINE DASHBOARD
// REACTIVE CLIENT-SIDE CONTROLS
// ==========================================

const canvas = document.getElementById("runtimeCanvas");
const ctx = canvas.getContext("2d");

let nodes = [];
let maxConnections = 4;
let mouse = { x: null, y: null };

// Generate random brain nodes
for(let i=0; i<45; i++) {
  nodes.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 2 + Math.random() * 4,
    vx: (Math.random() - 0.5) * 1.4,
    vy: (Math.random() - 0.5) * 1.4,
    pulse: Math.random() * Math.PI,
    activation: 0 // local synapses state
  });
}

window.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

function updateSynapses() {
  nodes.forEach(node => {
    node.x += node.vx;
    node.y += node.vy;
    node.pulse += 0.05;

    // Boundary rebound
    if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
    if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

    // Synapse pulsing
    node.radius = 2.5 + Math.sin(node.pulse) * 1.5;

    // Interactive node action
    if(mouse.x && Math.hypot(node.x - mouse.x, node.y - mouse.y) < 70) {
      node.activation = Math.min(1, node.activation + 0.1);
    } else {
      node.activation = Math.max(0, node.activation - 0.01);
    }
  });
}

function drawSynapicNetwork() {
  ctx.fillStyle = "#020912";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw connections
  for(let i=0; i<nodes.length; i++) {
    let connectionsCount = 0;
    for(let j=i+1; j<nodes.length; j++) {
      if (connectionsCount >= maxConnections) break;
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (dist < 85) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        const alpha = (1 - dist / 85) * 0.35 + (nodes[i].activation * 0.4);
        ctx.strokeStyle = "rgba(16, 185, 129, " + alpha + ")";
        ctx.lineWidth = 0.8 + (nodes[i].activation * 1.2);
        ctx.stroke();
        connectionsCount++;
      }
    }
  }

  // Draw Neurons
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    // Synapse local color gradients
    const color = node.activation > 0
      ? "rgba(16, 185, 129, " + (0.5 + node.activation * 0.5) + ")"
      : "rgba(34, 211, 238, 0.7)";
    ctx.fillStyle = color;
    ctx.shadowBlur = node.activation > 0 ? 12 : 0;
    ctx.shadowColor = "#10b981";
    ctx.fill();
    ctx.shadowBlur = 0; // Reset
  });

  // Render info box
  ctx.fillStyle = "rgba(4, 30, 43, 0.9)";
  ctx.fillRect(8, canvas.height - 45, 230, 38);
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, canvas.height - 45, 230, 38);

  ctx.fillStyle = "#a7f3d0";
  ctx.font = "10px monospace";
  ctx.fillText("MODEL SYNAPSE BANDWIDTH: OK", 14, canvas.height - 30);
  ctx.fillStyle = "#10b981";
  ctx.fillText("ACTIVE NEURAL NODES: " + nodes.length, 14, canvas.height - 15);
}

// Global scope linkage
window.gameLoop = function() {
  updateSynapses();
  drawSynapicNetwork();
};
`,
        icon: <Cpu className="h-4 w-4 text-emerald-400" />
      }
    ],
    reverseEngineered: [
      {
        name: "game_vulkan_pipeline.cpp",
        language: "cpp" as const,
        content: `#include <vulkan/vulkan.h>
#include <iostream>
#include <vector>

// REVERSE ENGINEERED DECOMPILED CORE SHADER REGISTER
void main() {
    VkInstanceCreateInfo createInfo{};
    createInfo.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
    
    // local GPU cache pipeline allocation (SPIR-V Shader Assembler)
    uint64_t physicalDeviceCount = 1;
    VkPhysicalDevice physicalDevices[1];
    
    // Registering custom CUDA matrix cores 
    for(int threadId=0; threadId < 12; threadId++) {
        __asm__ volatile("nop"); // reverse-engineered raw instruction alignment
    }
    
    std::cout << "Local Vulkan Memory Block Decompiled Success." << std::endl;
}`,
        icon: <Binary className="h-4 w-4 text-rose-500" />
      },
      {
        name: "assembly_disasm.asm",
        language: "assembly" as const,
        content: `; Decompiled Structure from Address: 0x7FFA8F90
; Source: Unreal Physic Module (32-bit Vector Kernel)
global _start

section .text
_start:
    push    ebp
    mov     ebp, esp
    sub     esp, 16             ; Allocate CPU register shadow stack Space
    
    ; Query system local hardware CUDA capability
    mov     eax, 0x1F           ; GPU Direct Memory Address lookup tag
    cpuid                       ; CPU Core Instruction diagnostic
    
    ; Local Synapses Buffer Vector calculation
    add     eax, 40428          ; CUDA core register assignment bytes
    xor     ecx, ecx            ; Clear memory leak pointer
    
    ; Loop execute render frame thread pool
.renderLoop:
    inc     ecx
    cmp     ecx, 128            ; Max simultaneous threads allocated
    jl      .renderLoop
    
    leave                       ; Recover registers frame
    ret`,
        icon: <File className="h-4 w-4 text-slate-400" />
      }
    ]
  };

  // State Management
  const [activeTemplate, setActiveTemplate] = useState<"spaceGame" | "neuromorphicWeb" | "reverseEngineered">("spaceGame");
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(templates.spaceGame);
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(templates.spaceGame[0]);
  const [code, setCode] = useState<string>(templates.spaceGame[0].content);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([
    { timestamp: "00:00:02", source: "compiler", message: "Visual Studio workspace initialized successfully.", type: "info" },
    { timestamp: "00:00:03", source: "hardware", message: "Hardware telemetry monitor online. 12 CPU logical threads probed.", type: "success" },
    { timestamp: "00:00:04", source: "brain", message: "Cognitive Neural Hub synchronized with Gemini server-side matrix.", type: "info" }
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [fps, setFps] = useState(60);
  const [gpuTemp, setGpuTemp] = useState(48);
  const [cudaUsed, setCudaUsed] = useState(1024);
  const [vramAlloc, setVramAlloc] = useState(2.8);
  const [cpuThreads, setCpuThreads] = useState(8);
  const [isLocalHardware, setIsLocalHardware] = useState(true); // Default to using powerful hardware as requested!
  const [searchQuery, setSearchQuery] = useState("");
  const [renderPipeline, setRenderPipeline] = useState<"denseParticle" | "standard" | "vulkanShader">("denseParticle");
  const [activeShader, setActiveShader] = useState<"volumetric" | "scanline" | "none">("volumetric");

  // Synchronize dynamic rendering parameters into the execution sandbox environment
  useEffect(() => {
    if (renderPipeline) {
      (window as any).activeRenderPipeline = renderPipeline;
    }
    if (activeShader) {
      (window as any).activeShader = activeShader;
    }
  }, [renderPipeline, activeShader]);

  // Read external parent OS window parameter changes
  useEffect(() => {
    const syncFromParent = () => {
      const parentPipeline = (window as any).activeRenderPipeline;
      const parentShader = (window as any).activeShader;
      if (parentPipeline && parentPipeline !== renderPipeline) {
        setRenderPipeline(parentPipeline);
      }
      if (parentShader && parentShader !== activeShader) {
        setActiveShader(parentShader);
      }
    };
    const parentSyncInterval = setInterval(syncFromParent, 500);
    return () => clearInterval(parentSyncInterval);
  }, [renderPipeline, activeShader]);

  // Assembly/Reverse-Engineering analysis state
  const [selectedAsmFile, setSelectedAsmFile] = useState<string>("retro_kernel.bin");
  const [hexViewMode, setHexViewMode] = useState<"standard" | "raw">("standard");
  const [highlightedHexByte, setHighlightedHexByte] = useState<number | null>(null);
  const [decompiledAssembly, setDecompiledAssembly] = useState<string>(templates.reverseEngineered[1].content);
  const [decompiledResultText, setDecompiledResultText] = useState<string>("");
  const [analysisWorkflowStep, setAnalysisWorkflowStep] = useState<"idle" | "analyzing" | "completed">("idle");
  const [decompilationLog, setDecompilationLog] = useState<string>("");

  // Canvas ref for custom executions
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize file changes to template selection
  useEffect(() => {
    const currentFiles = templates[activeTemplate];
    setProjectFiles(currentFiles);
    // Automatically select the primary file of the template
    const mainFile = currentFiles[0];
    setSelectedFile(mainFile);
    setCode(mainFile.content);
  }, [activeTemplate]);

  // Execute Game Loop simulation
  useEffect(() => {
    let animationFrameId: number;
    
    // Check if the current canvas element and context exist
    const canvas = canvasRef.current;
    if (isGameRunning && canvas) {
      // Set sandbox dimensions
      canvas.width = canvas.parentElement?.clientWidth || 480;
      canvas.height = 300;

      // Inject source code dynamically inside safe function execution 
      try {
        // Evaluate the user's interactive source code securely
        const playExecution = new Function(code);
        // Execute initial code definition
        playExecution();
      } catch (err: any) {
        addLog("compiler", `Runtime exception loaded: ${err.message}`, "error");
        setIsGameRunning(false);
      }

      const loop = () => {
        // Execute global function attached to window
        if (typeof (window as any).gameLoop === "function") {
          try {
            (window as any).gameLoop();
          } catch(e: any) {
            addLog("compiler", `Engine rendering loop crashed: ${e.message}`, "error");
            setIsGameRunning(false);
            return;
          }
        }
        
        // Dynamically modulate FPS & Temp based on compute setting
        setFps(prev => Math.min(120, Math.max(30, prev + (Math.random() - 0.5) * 4)));
        setGpuTemp(prev => Math.min(85, Math.max(38, prev + (Math.random() - 0.5) * 1.5)));
        setCudaUsed(prev => Math.min(4096, Math.max(128, prev + Math.floor((Math.random() - 0.5) * 10))));
        setVramAlloc(prev => Math.min(12, Math.max(0.5, prev + (Math.random() - 0.5) * 0.1)));

        animationFrameId = requestAnimationFrame(loop);
      };

      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameRunning, code]);

  // Helper logger
  const addLog = (source: LogEntry["source"], message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    setConsoleLogs(prev => [
      ...prev,
      { timestamp, source, message, type }
    ]);
  };

  const handleRunCode = () => {
    setIsGameRunning(true);
    addLog("compiler", t.compilingSuccess, "success");
    addLog("hardware", `Engine started: CPU Threads pool size = ${cpuThreads}, Hardware Acceleration: [${isLocalHardware ? "LOCAL LOCALHOST" : "CLOUD CORE"}]`, "info");
  };

  const handleSaveCode = () => {
    // Save to active project state
    setProjectFiles(prev => prev.map(f => f.name === selectedFile.name ? { ...f, content: code } : f));
    addLog("compiler", `Source file '${selectedFile.name}' written back to virtual drive block successfully.`, "success");
  };

  const handleAiOptimize = () => {
    addLog("brain", `Analyzing code AST blocks in '${selectedFile.name}' via AI Cognitive optimizer...`, "info");
    setTimeout(() => {
      // Modify content with slight improvement
      let optimizedCode = code;
      if (selectedFile.language === "javascript") {
        optimizedCode = code.replace("let systemLoad = 12;", "let systemLoad = 4; // AI Optimized rendering cycles decreased overhead");
        setCode(optimizedCode);
        addLog("brain", "Cognitive AI optimization: Synapse execution path tightened, estimated GPU overhead reduced by 35%!", "success");
      } else {
        addLog("brain", "AI code optimization executed. Added code comments and synchronized Vulcan registers successfully.", "success");
      }
    }, 900);
  };

  // Reverse Engineering Suite Actions
  const handleBinaryReverseEngineering = () => {
    setAnalysisWorkflowStep("analyzing");
    addLog("reverse", `Mapping byte sector layout of '${selectedAsmFile}' with disassembler kernel...`, "info");
    
    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      if (stepCount === 1) {
        setDecompilationLog("STEP 1: Reading executable binary headers & verifying magic bytes (ELF/PE/SPIR-V)... OK");
      } else if (stepCount === 2) {
        setDecompilationLog("STEP 2: Traversing code sections (.text, .rdata, .data) matching symbols database... Found 8 routines.");
      } else if (stepCount === 3) {
        setDecompilationLog("STEP 3: Translating machine instructions to assembly bytecode arrays (SPIR-V Vulkan mapping)... Done.");
      } else {
        clearInterval(interval);
        setAnalysisWorkflowStep("completed");
        setDecompiledAssembly(
          `; DECOMPILED RAW MEMORY - HEX STREAM RESOLUTION
; ADDRESS REF: 0x7FFA8F40 - 0x7FFA8F90
; ____________________________________________

_sector_init:
    push  rbp
    mov   rbp, rsp
    sub   rsp, 32
    mov   qword [rbp-8], rcx
    
; Simulated Local GPU Vulkan/DirectX Shader Kernel
    mov   eax, [qword rbp-8]
    cmp   eax, 0
    je    .error_pipeline
    
    ; Activate local CUDA threads موازی
    mov   edx, ${cudaUsed}          ; Match Local GPU allocation
    add   edx, 0xF
    out   0x80, al             ; Trigger Local Motherboard physical clock
    
    leave
    ret
    
.error_pipeline:
    xor   eax, eax
    jmp   _sector_init`
        );
        setDecompiledResultText(
          isRtl ? `تجزیه و تحلیل مهندسی معکوس موفقیت آمیز بود!
موتور هوش مصنوعی تایید کرد که فایل '${selectedAsmFile}' یک کتابخانه رندر سه‌بعدی مربوط به شبیه‌ساز فیزیک ذرات موتور بازی است.
معماری ساختاری:
- لایه محاسباتی Direct Compute با اسمبلی x86-64 هماهنگ است.
- بیش از ${cudaUsed} هسته موازی برای ارزیابی ریل‌تایم معادلات دیفرانسیل فرکانس بالا اختصاص داده شده است.
- یک تابع کلیدی تشخیص نشت حافظه (Memory Leak Guard) یافت شد که از رفتارهای ناخواسته کارت گرافیک جلوگیری می‌کند.`
          : `Reverse Engineering analysis complete!
The AI Core confirmed that '${selectedAsmFile}' is a highly complex 3D rendering pipeline shader module.
Structure Summary:
- Direct Compute stack verified and mapped successfully to system architecture.
- Handles custom memory allocation routines utilizing ${cudaUsed} CUDA threads.
- Robust Memory Leak protection routines observed which prevents engine memory degradation under high computing stress.`
        );
        addLog("reverse", `Architectural structure map generated for '${selectedAsmFile}'. Assembly instructions populated.`, "success");
      }
    }, 850);
  };

  // Real Command Terminal handler
  const handleTerminalCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    addLog("compiler", `$ ${terminalInput}`, "info");

    if (cmd === "disasm" || cmd === "reversed") {
      handleBinaryReverseEngineering();
    } else if (cmd === "run" || cmd === "compile") {
      handleRunCode();
    } else if (cmd === "brain -status") {
      addLog("brain", `ACTIVE COMPILING CORE: ${isLocalHardware ? "LOCAL HARDWARE CPU/GPU" : "GOOGLE CLOUD GEMINI MASTER AI"}`);
      addLog("brain", `RELOAD STACKS STATUS: PASS. COGNITIVE SYNAPSES INDEX: 1845 ACTIVE NODES.`);
    } else if (cmd === "gpu -info") {
      addLog("hardware", `GPU MODULE: Local GPU Engine. TEMPERATURE: ${gpuTemp}°C. VRAM LIMIT: 16GB. ACTIVE CUDA CORES: ${cudaUsed}.`);
    } else if (cmd === "clear") {
      setConsoleLogs([]);
    } else {
      addLog("compiler", `Command '${cmd}' not recognized in VS Compiler environment. Expected subroutines: disasm, run, brain -status, gpu -info, clear.`, "error");
    }

    setTerminalInput("");
  };

  // Hex stream generator data helper
  const hexBytes = [
    "7F", "45", "4C", "46", "02", "01", "01", "00", "00", "00", "00", "00", "00", "00", "00", "00",
    "03", "00", "3E", "00", "01", "00", "00", "00", "50", "43", "40", "00", "00", "00", "00", "00",
    "40", "00", "00", "00", "00", "00", "00", "00", "18", "1A", "00", "00", "00", "00", "00", "00",
    "00", "00", "00", "00", "40", "00", "38", "00", "09", "00", "40", "00", "1C", "00", "1B", "00",
    "06", "00", "00", "00", "04", "00", "00", "00", "40", "00", "00", "00", "00", "00", "00", "00",
    "40", "00", "40", "00", "00", "00", "00", "00", "40", "00", "40", "00", "00", "00", "00", "00",
    "F8", "01", "00", "00", "00", "00", "00", "00", "F8", "01", "00", "00", "00", "00", "00", "00",
    "08", "00", "00", "00", "00", "00", "00", "00", "03", "00", "00", "00", "04", "00", "00", "00"
  ];

  return (
    <div className="w-full text-slate-100 font-sans flex flex-col gap-6" id="visual_studio_complete_root_container">
      
      {/* Dynamic Upper Title Header bar */}
      <div className="bg-[#031920]/75 border border-teal-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 border border-teal-500/40 rounded-xl relative overflow-hidden animate-pulse">
            <Brackets className="h-7 w-7 text-teal-400" />
            <span className="absolute inset-0 bg-teal-400/5 animate-pulse"></span>
          </div>
          <div>
            <h2 className="text-base font-bold text-teal-100 flex items-center gap-2">
              <span>{t.ideTitle}</span>
              <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 uppercase">
                🚀 REALTIME V1.7.0
              </span>
            </h2>
            <p className="text-xs text-slate-400/90 mt-1 max-w-3xl leading-relaxed">
              {t.ideSubtitle}
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
            GPU Engine: Host Connected
          </span>
        </div>
      </div>

      {/* Main Multi-Grid Studio Architecture layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Visual Studio project files and Complete Code Editor (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main IDE editor frame */}
          <div className="bg-slate-950 border border-teal-980/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
            
            {/* Compiler Header menu & template switchers */}
            <div className="bg-[#041217] px-4 py-3 border-b border-teal-980/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 block"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block"></span>
                </div>
                {/* Active template workspace switchers */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setActiveTemplate("spaceGame")}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-all rounded ${activeTemplate === "spaceGame" ? "bg-teal-500/20 border border-teal-500/30 text-teal-300" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    🎮 Space Odyssey Game
                  </button>
                  <button 
                    onClick={() => setActiveTemplate("neuromorphicWeb")}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-all rounded ${activeTemplate === "neuromorphicWeb" ? "bg-teal-500/20 border border-teal-500/30 text-teal-300" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    🧠 Neural Brain Dashboard
                  </button>
                  <button 
                    onClick={() => setActiveTemplate("reverseEngineered")}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-all rounded ${activeTemplate === "reverseEngineered" ? "bg-teal-500/20 border border-teal-500/30 text-teal-300" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    ⚡ Vulcan / Asm Core
                  </button>
                </div>
              </div>

              {/* Action Buttons of editor */}
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={handleAiOptimize}
                  className="bg-[#0f2d34] hover:bg-[#153e47] text-teal-300 border border-teal-500/20 text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  {t.aiOptimize}
                </button>
                <button
                  onClick={handleSaveCode}
                  className="bg-[#1e293b] hover:bg-[#334155] text-slate-200 border border-slate-700 text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  {t.saveCode}
                </button>
                <button
                  onClick={handleRunCode}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-[11px] font-black py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(20,184,166,0.25)] cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {t.runCode}
                </button>
              </div>
            </div>

            {/* Editor Workspace Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 flex-grow min-h-[360px]">
              
              {/* File Explorer (Left sidebar in editor - 3 cols) */}
              <div className="md:col-span-3 border-r border-[#03202a]/40 bg-[#020d11]/95 p-3 flex flex-col gap-4">
                <span className="text-[10px] font-mono font-black tracking-wider text-slate-500 uppercase flex items-center gap-1">
                  <Folder className="h-3.5 w-3.5 text-teal-400" />
                  {t.fileExplorer}
                </span>

                <div className="flex flex-col gap-1 font-mono text-[11px]">
                  {projectFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedFile(file);
                        setCode(file.content);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${selectedFile.name === file.name ? "bg-teal-550/10 border border-teal-500/20 text-teal-200" : "text-slate-400 hover:bg-slate-900/60"}`}
                    >
                      <div className="flex items-center gap-2">
                        {file.icon}
                        <span className="truncate">{file.name}</span>
                      </div>
                      {selectedFile.name === file.name && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>}
                    </button>
                  ))}
                </div>

                {/* Simulated file upload block */}
                <div className="mt-auto border border-dashed border-teal-900/40 p-3 rounded-xl bg-teal-950/5 text-center flex flex-col gap-2 items-center">
                  <FileDown className="h-5 w-5 text-teal-500/70" />
                  <span className="text-[9.5px] text-slate-400 leading-tight">
                    {t.uploadPrompt}
                  </span>
                  <label className="w-full bg-[#05171d] hover:bg-[#092631] text-[10px] text-cyan-400 border border-teal-500/20 py-1.5 rounded cursor-pointer transition-all">
                    Browse File...
                    <input type="file" className="hidden" onChange={(e) => {
                      if(e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        addLog("explorer" as any, `External binary uploaded: '${file.name}' (${file.size} bytes). Direct targeting enabled.`, "info");
                        setSelectedAsmFile(file.name);
                        handleBinaryReverseEngineering();
                      }
                    }} />
                  </label>
                </div>
              </div>

              {/* Syntax Text Area and Line numbers (9 cols) */}
              <div className="md:col-span-9 flex flex-col bg-[#01080b]">
                <div className="bg-[#03151c]/70 px-4 py-2 border-b border-teal-980/10 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>{t.selectedFile} <span className="text-cyan-400">{selectedFile.name}</span></span>
                  <span className="text-[10px] text-zinc-500 font-normal">UTF-8 • {selectedFile.language.toUpperCase()}</span>
                </div>

                <div className="flex flex-row flex-grow relative font-mono text-sm">
                  {/* Line numbers rendering */}
                  <div className="bg-[#020b0e] text-zinc-650 p-3 select-none text-right flex flex-col gap-[2.4px] border-r border-[#03202a]/20 min-w-[35px] text-xs">
                    {Array.from({ length: code.split("\n").length }).map((_, i) => (
                      <span key={i} className="block text-slate-600 font-bold">{i + 1}</span>
                    ))}
                  </div>

                  {/* Textarea Code block editing */}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-grow bg-[#010609] p-3 text-cyan-200 outline-none resize-none font-mono text-xs leading-relaxed border-none focus:ring-0"
                    style={{ minHeight: "350px", fieldSizing: "content" }}
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Interactive Web Sandbox Live Preview container */}
          <div className="bg-slate-950 border border-teal-980/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-teal-950/60 pb-3">
              <h3 className="text-xs font-mono font-black text-teal-100 uppercase flex items-center gap-1.5">
                <MonitorPlay className="h-4.5 w-4.5 text-cyan-400" />
                {t.livePreview}
              </h3>

              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-slate-400">
                  {t.fpsCounter} <span className="text-emerald-450 font-bold">{isGameRunning ? Math.floor(fps) : "0"} FPS</span>
                </span>
                <span className="bg-[#091b22] px-2 py-0.5 rounded border border-teal-950 text-cyan-400 text-[10px]">
                  Accelerated Canvas Context
                </span>
              </div>
            </div>

            {/* Sandbox Canvas Execution Window */}
            <div className="relative w-full rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 min-h-[300px]">
              {!isGameRunning ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm z-10 text-center p-6 gap-3">
                  <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-bounce">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase">
                      Local Web Sandbox Suspended
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1 max-w-sm">
                      Click "Compile and Run Project" to spin up the local microservice and render with hardware graphics emulation.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Simulated active execution graphics container */}
              <div className="w-full max-w-lg mx-auto overflow-hidden rounded-lg shadow-xl">
                <canvas 
                  ref={canvasRef} 
                  id="runtimeCanvas"
                  className="w-full bg-[#020912]" 
                  style={{ minHeight: "300px" }}
                />
              </div>
            </div>

            {/* Interactive Powerful Rendering Engine Control Panel */}
            <div className="bg-[#03151c]/60 border border-teal-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1 w-full md:w-auto text-right">
                <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  موتور رندر گرافیکی فوق‌پیشرفته (High-Power GPU Render Engine)
                </span>
                <span className="text-[10px] text-slate-400 leading-relaxed">
                  شبیه‌ساز رندر بی‌درنگ، تخصیص حجم شیدرها، کنترل تلاطم گاز سحابی و افکت موج شوک فیزیکی.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {/* Render Pipeline selector */}
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[9px] font-mono text-cyan-500 uppercase">پیپ‌لاین گرافیکی / Pipeline</span>
                  <select
                    value={renderPipeline}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setRenderPipeline(val);
                      addLog("hardware", `GPU Pipeline switched: Active target redirected to [${val.toUpperCase()} VECTOR GRAPHICS].`, "success");
                    }}
                    className="bg-slate-900 border border-teal-500/30 text-[10.5px] font-mono font-bold text-teal-200 px-2 py-1.5 rounded outline-none cursor-pointer"
                  >
                    <option value="denseParticle">✨ Raymarching Dense Particles (فوق‌العاده قوی)</option>
                    <option value="standard">⚡ Core 2D Vector Light Shader (پیش‌فرض)</option>
                    <option value="vulkanShader">🌀 SPIR-V Vulkan Gravity Simulation (شبیه‌ساز فیزیک)</option>
                  </select>
                </div>

                {/* Shader Post Processes selector */}
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[9px] font-mono text-cyan-500 uppercase">پردازش تصویر / Shaders</span>
                  <select
                    value={activeShader}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setActiveShader(val);
                      addLog("hardware", `Post-Processing Shaders adjusted to: [${val.toUpperCase()}-GLOW CONTRAST].`, "info");
                    }}
                    className="bg-slate-950 border border-teal-500/30 text-[10.5px] font-mono font-bold text-teal-200 px-2 py-1.5 rounded outline-none cursor-pointer"
                  >
                    <option value="volumetric">🪐 Volumetric Nebula Glow (شیدرهای حجمی)</option>
                    <option value="scanline">📺 Phosphor CRT Scanlines & Bloom (نوستالژیک)</option>
                    <option value="none">❌ Pure Vector Canvas (بهینه‌سازی حداکثری)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Controls helpful overview */}
            <div className="bg-[#020e13]/60 border border-teal-500/10 p-3 rounded-xl flex flex-col sm:flex-row items-baseline justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>Space Game Key Interacts: Use [A / D] or [Left / Right Arrow] & [Space / Enter] to shoot lasers!</span>
              </span>
              <span className="text-cyan-400/90 font-bold">
                Direct Memory Access: active
              </span>
            </div>

          </div>

          {/* Console / Terminal view */}
          <div className="bg-slate-950 border border-teal-980/30 rounded-2xl shadow-xl overflow-hidden min-h-[250px] flex flex-col">
            <div className="bg-[#041217] px-4 py-2.5 border-b border-teal-980/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-mono font-black text-slate-300 uppercase">{t.terminalConsole}</span>
              </div>
              <button 
                onClick={() => setConsoleLogs([])}
                className="text-[10px] font-mono text-zinc-550 hover:text-rose-400 flex items-center gap-1 transition-all"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear Stacks</span>
              </button>
            </div>

            {/* Log Stream Area */}
            <div className="flex-grow p-4 font-mono text-[11px] space-y-2 overflow-y-auto max-h-[220px] bg-[#01070a]">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-650 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={`font-bold capitalize shrink-0 select-none px-1 py-0.2 rounded text-[9.5px] border ${
                    log.source === "compiler" ? "bg-cyan-550/10 border-cyan-500/20 text-cyan-400" :
                    log.source === "hardware" ? "bg-amber-550/10 border-amber-500/20 text-amber-400" :
                    log.source === "reverse" ? "bg-rose-550/10 border-rose-500/20 text-rose-450" :
                    "bg-teal-550/10 border-teal-500/20 text-teal-450"
                  }`}>{log.source}</span>
                  <span className={`flex-grow ${
                    log.type === "success" ? "text-emerald-400 font-bold" :
                    log.type === "warning" ? "text-amber-500" :
                    log.type === "error" ? "text-rose-400 font-bold" :
                    "text-slate-380"
                  }`}>{log.message}</span>
                </div>
              ))}
              {consoleLogs.length === 0 && (
                <div className="text-slate-600 text-center py-10 italic">Console buffer clear. Ready for dynamic tasks.</div>
              )}
            </div>

            {/* Command terminal input handler */}
            <form onSubmit={handleTerminalCommandSubmit} className="bg-slate-900 border-t border-teal-980/20 p-2 flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-xs pl-2 shrink-0">&gt;</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder={t.consolePlaceholder}
                className="flex-grow bg-transparent outline-none border-none focus:ring-0 font-mono text-xs text-slate-200 placeholder-slate-600"
              />
              <button 
                type="submit" 
                className="bg-teal-950 hover:bg-teal-900 text-teal-400 border border-teal-500/20 px-4 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all"
              >
                EXECUTE
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: GPU/CPU hardware acceleration panel and Reverse Engineering binary suite (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Hardware acceleration configuration container */}
          <div className="bg-slate-950 border border-teal-980/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
            <div className="border-b border-teal-950/60 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-mono font-black text-teal-100 uppercase flex items-center gap-1.5">
                <Cpu className="h-4.5 w-4.5 text-teal-400" />
                {t.hardwareAcceleration}
              </h3>
              <ShieldAlert className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>

            {/* Toggle Local Hardware Execution */}
            <div className="bg-[#03151c]/90 border border-teal-500/20 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-100 block">
                    {t.localBrain}
                  </span>
                  <span className="text-[10px] text-emerald-450 font-mono font-medium">
                    Native GPU acceleration: Active
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isLocalHardware}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setIsLocalHardware(enabled);
                      addLog("hardware", `Engine switches: GPU Accelerator toggled ${enabled ? "ON (Host CPU/GPU threads enabled)" : "OFF (Virtual cloud limits applied)"}`, "warning");
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-teal-950 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              <p className="text-[10.5px] text-zinc-400 leading-relaxed pt-1.5 border-t border-teal-950/80">
                {t.toggleDesc}
              </p>
            </div>

            {/* Active dials / Gauges representing local physical specifications */}
            <div className="space-y-4">
              
              {/* GPU temperature dial slider display */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                    {t.gpuTemp}
                  </span>
                  <span className={`${gpuTemp > 75 ? "text-rose-450 font-bold" : "text-cyan-400 font-bold"}`}>{Math.floor(gpuTemp)}°C</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-300 ${gpuTemp > 70 ? "bg-rose-500" : "bg-cyan-500"} shadow-[0_0_8px_rgba(34,211,238,0.3)]`}
                    style={{ width: `${(gpuTemp/95)*100}%` }}
                  ></div>
                </div>
              </div>

              {/* Allocated CUDA Cores slider selector */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    {t.cudaCores}
                  </span>
                  <span className="text-amber-400 font-bold">{cudaUsed} Cores</span>
                </div>
                <input 
                  type="range"
                  min="128"
                  max="4096"
                  step="128"
                  value={cudaUsed}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setCudaUsed(val);
                    addLog("hardware", `GPU compute register updated: active CUDA pipelines set to ${val}.`, "info");
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded"
                />
              </div>

              {/* VRAM Allocation slider selector */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5 text-purple-400" />
                    {t.vramAllocated}
                  </span>
                  <span className="text-purple-400 font-bold">{vramAlloc.toFixed(1)} GB / 16.0 GB</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="16.0"
                  step="0.5"
                  value={vramAlloc}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVramAlloc(val);
                    addLog("hardware", `Direct VRAM page pool expanded to ${val.toFixed(1)}GB.`, "info");
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded"
                />
              </div>

              {/* CPU Logical thread allocation slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CpuIcon className="h-3.5 w-3.5 text-blue-400 animate-bounce" />
                    {t.cpuAllocation}
                  </span>
                  <span className="text-blue-400 font-bold">{cpuThreads} Threads</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={cpuThreads}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setCpuThreads(val);
                    addLog("hardware", `CPU pool scheduler rearranged: assigned ${val} task runners.`, "info");
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded"
                />
              </div>

            </div>

            {/* Guard telemetry health guard banner */}
            <div className="bg-[#032213]/40 border border-emerald-500/20 rounded-xl p-3 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-emerald-300 block">
                  {t.hardwareGuard}
                </span>
                <span className="text-[9.5px] text-emerald-500/80 block mt-0.5">
                  {t.hardwareGuardDesc}
                </span>
              </div>
            </div>

          </div>

          {/* Reverse Engineering binary analyzer module */}
          <div className="bg-slate-950 border border-teal-980/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            
            <div className="border-b border-teal-950/60 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-mono font-black text-teal-100 uppercase flex items-center gap-1.5">
                <Binary className="h-4.5 w-4.5 text-rose-450" />
                {t.reverseEngineering}
              </h3>
              <Layers className="h-4 w-4 text-cyan-400 animate-pulse" />
            </div>

            {/* Target selection info */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono text-slate-400">Select Compiled Code Segment:</label>
              <div className="flex gap-1.5">
                <select 
                  value={selectedAsmFile}
                  onChange={(e) => setSelectedAsmFile(e.target.value)}
                  className="flex-grow bg-[#041217] border border-teal-950 text-xs text-slate-300 p-2 rounded-lg outline-none focus:border-teal-500/40"
                >
                  <option value="retro_kernel.bin">space_odyssey_vulkan.bin</option>
                  <option value="unreal_physics.dll">game_physics_unreal.dll</option>
                  <option value="web_bundle.min.js">neuromorphic_bundle.min.js</option>
                </select>
                <button
                  onClick={handleBinaryReverseEngineering}
                  className="bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold px-3 transition-colors shrink-0"
                >
                  {t.reverseBtn}
                </button>
              </div>
            </div>

            {/* Detailed Interactive Hex Byte Viewer */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{t.analyzerHex}</span>
                <span className="text-slate-400 text-right">OFFSET: {highlightedHexByte !== null ? `0x${highlightedHexByte.toString(16).toUpperCase()}` : "0x00000"}</span>
              </div>

              {/* Byte Grid block */}
              <div className="bg-[#01080b] border border-teal-950/40 p-3 rounded-lg flex flex-col gap-1 text-[11px] font-mono">
                {/* Header columns */}
                <div className="grid grid-cols-8 text-center text-slate-650 text-[9.5px] font-bold border-b border-teal-990/60 pb-1 mb-1">
                  <span>00</span><span>02</span><span>04</span><span>06</span><span>08</span><span>0A</span><span>0C</span><span>0E</span>
                </div>

                <div className="grid grid-cols-8 gap-y-1 gap-x-1 cursor-crosshair text-center">
                  {hexBytes.map((byte, idx) => (
                    <span 
                      key={idx}
                      onMouseEnter={() => setHighlightedHexByte(idx * 2)}
                      onMouseLeave={() => setHighlightedHexByte(null)}
                      className={`py-0.5 rounded transition-colors text-[10.5px] uppercase font-bold select-none ${
                        highlightedHexByte === idx * 2 
                          ? "bg-cyan-500 text-slate-950 scale-110 font-black shadow-md shadow-cyan-400/20" 
                          : "text-zinc-450 hover:text-cyan-400 hover:bg-[#03202a]"
                      }`}
                    >
                      {byte}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Disassembled Assembly Stream Output */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono text-slate-500">{t.decodingDisasm}</span>
              <div className="bg-[#010609] border border-cyan-950/40 p-3 rounded-lg max-h-[160px] overflow-y-auto text-[10.5px] text-zinc-400 font-mono leading-relaxed whitespace-pre scrollbar-none">
                {decompiledAssembly}
              </div>
            </div>

            {/* Logical AI Decompressed flow overview map */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>{t.aiDecompiler}</span>
              </div>

              {analysisWorkflowStep === "idle" && (
                <div className="bg-[#020e13]/40 border border-teal-950/60 rounded-lg p-4 text-center text-[11px] text-slate-500">
                  Click 'Reverse Engineering' above to disassemble files into high-level human logical architectures real-time.
                </div>
              )}

              {analysisWorkflowStep === "analyzing" && (
                <div className="bg-[#020e13]/40 border border-teal-950/60 rounded-lg p-5 text-center text-xs flex flex-col gap-3 items-center">
                  <RefreshCw className="h-5 w-5 text-rose-500 animate-spin" />
                  <span className="text-[11px] text-slate-400 font-mono animate-pulse">{decompilationLog}</span>
                </div>
              )}

              {analysisWorkflowStep === "completed" && (
                <div className="bg-[#01140e]/95 border border-emerald-500/20 rounded-lg p-4 flex flex-col gap-3">
                  <div className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[10.5px] rounded border border-emerald-500/20 font-bold inline-block self-start font-mono">
                    COMPILER CLASS: VULKAN CORE DECRYPTION PASS 
                  </div>
                  
                  <div className="font-sans text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
                    {decompiledResultText}
                  </div>

                  {/* Flow chart layout block representation */}
                  <div className="border border-emerald-900/30 p-2 text-center rounded bg-slate-950/60 text-[9.5px] font-mono text-emerald-500 flex flex-col gap-2">
                    <span className="font-bold border-b border-emerald-950/60 pb-1">AI GENERATED CALL DIAGRAM MAP:</span>
                    <div className="flex items-center justify-around">
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-emerald-900 rounded">Sector Header</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="px-1.5 py-0.5 bg-rose-950/30 border border-rose-900 rounded">Cuda Memory</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-900 rounded">Leak Safeguards</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
