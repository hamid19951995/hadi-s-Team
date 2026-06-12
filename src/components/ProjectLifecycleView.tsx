import React, { useState, useEffect } from "react";
import { 
  Sparkles, CheckCircle2, ChevronRight, ChevronLeft, HelpCircle, FileText, BarChart3, 
  Workflow, Database, Play, Code, ShieldCheck, Terminal, Layers, RefreshCw, AlertTriangle, 
  Settings, Users, Send, Download, CheckCircle, Clock, Zap, Cpu, Flame, Check, X, Bug, 
  Activity, ArrowUpRight, Plus, Eye, Monitor, FileCode, Server, Lock
} from "lucide-react";

// Types for our Lifecycle Step
interface StepInfo {
  number: number;
  titleFa: string;
  titleEn: string;
  category: "planning" | "design" | "development" | "qa" | "launch";
  descFa: string;
  descEn: string;
  actionLabelFa: string;
  actionLabelEn: string;
}

// 24 Steps of Project Lifecycle definition
const stepsData: StepInfo[] = [
  {
    number: 1,
    titleFa: "بیان ایده و معرفی اولیه پروژه",
    titleEn: "Idea Declaration & Concept Introduction",
    category: "planning",
    descFa: "در این مرحله ایده خود را مطرح کرده و اهداف، مخاطبان و مشکلاتی را که این محصول قرار است حل کند تعریف می‌کنید.",
    descEn: "Outline your core concept, target audience, and identify the specific challenges this workspace aims to address.",
    actionLabelFa: "ثبت و پردازش ایده",
    actionLabelEn: "Register & Process Idea"
  },
  {
    number: 2,
    titleFa: "جلسه شناخت نیازمندی‌ها",
    titleEn: "Requirements Gathering Session",
    category: "planning",
    descFa: "بررسی سوالات کلیدی پیرامون رفتار کاربر، ویژگی‌های ضروری (MVP)، و اولویت‌بندی قابلیت‌های فرانت‌اند و بک‌اند سیستم.",
    descEn: "Discuss core scope questions, identify MVP features, and distinguish essential capabilities from secondary wishlist options.",
    actionLabelFa: "شبیه‌سازی جلسه شناخت",
    actionLabelEn: "Simulate Discovery Workshop"
  },
  {
    number: 3,
    titleFa: "تحلیل مسئله و تبدیل ایده به نیازمندی فنی",
    titleEn: "Technical Requirements Formulation",
    category: "planning",
    descFa: "شکستن ایده اصلی به ماژول‌های مجزا، تعریف وابستگی‌های سیستمی و تشخیص فرآیندهای پیچیده پردازشی.",
    descEn: "Break down the mental concept into functional modules, declare dependencies, and target algorithm bottlenecks.",
    actionLabelFa: "تولید مدل درختی ماژول‌ها",
    actionLabelEn: "Generate Module Hierarchy Map"
  },
  {
    number: 4,
    titleFa: "امکان‌سنجی فنی (Feasibility Study)",
    titleEn: "Technical Feasibility Assessment",
    category: "planning",
    descFa: "ارزیابی مقیاس‌پذیری زیرساخت، تخمین فشار پردازش بر تراشه‌های شتاب‌دهنده گرافیکی (GPU) سیستم بومی و آنالیز امنیت سیستم.",
    descEn: "Assess local GPU/CPU limits, estimate processing load, and audit real-world performance parameters and security profiles.",
    actionLabelFa: "آزمون فشار و تخمین منابع",
    actionLabelEn: "Run Source Limits Diagnostic"
  },
  {
    number: 5,
    titleFa: "تعیین محدوده پروژه (Project Scope)",
    titleEn: "Project Scope Boundaries",
    category: "planning",
    descFa: "تعیین دقیق مرزهای پروژه (In-Scope vs Out-of-Scope) برای جلوگیری از تغییر ناگهانی اهداف در اواسط کدنویسی.",
    descEn: "Strictly declare what stays inside the release target boundaries, and what is excluded to prevent project bloom.",
    actionLabelFa: "مشاهده محدوده کار",
    actionLabelEn: "Review Boundaries Map"
  },
  {
    number: 6,
    titleFa: "اولویت‌بندی امکانات (MVP Roadmap)",
    titleEn: "Feature Prioritalization (MoSCoW Matrix)",
    category: "planning",
    descFa: "دسته‌بندی ویژگی‌ها به گروه‌های ضروری، مهم، قابل تعویق و آینده بر اساس ارزش برای کاربر نهایی.",
    descEn: "Categorize workspace features into Must-have, Should-have, Could-have, and Future release milestones.",
    actionLabelFa: "بارگذاری اولویت کدهای MVP",
    actionLabelEn: "Manage MVP Backlog"
  },
  {
    number: 7,
    titleFa: "طراحی راه‌حل فنی (Technical Architecture)",
    titleEn: "Technical Architecture Design",
    category: "design",
    descFa: "انتخاب فناوری‌های پایه‌، تعامل بین کتابخانه‌ها و تنظیم جهت‌گیری توسعه بهینه بر حسب سخت‌افزار.",
    descEn: "Formulate concrete tech stacks, establish data flows, and align modular components to run on specialized GPU pipelines.",
    actionLabelFa: "مشاهده شاسی انتخابی فناوری",
    actionLabelEn: "Inspect Core Tech Stack"
  },
  {
    number: 8,
    titleFa: "طراحی معماری سیستم",
    titleEn: "System Components Architecture",
    category: "design",
    descFa: "ترسیم لایه‌‌های API، مدیریت حافظه موقت (Cache)، چگونگی پایش خطاها و ارتباط ماژولار بین بات‌ها و کاربر.",
    descEn: "Draft micro-routing, cache layers, robust error recovery systems, and dynamic interaction pipelines.",
    actionLabelFa: "رسم گراف جریان داده",
    actionLabelEn: "Visualize Architecture DAG"
  },
  {
    number: 9,
    titleFa: "طراحی دیتابیس و مدل داده (Database Schema)",
    titleEn: "Database Design & Schemas",
    category: "design",
    descFa: "تعریف جداول بانک اطلاعاتی رابطه ای یا مجموعه‌های Firestore به همراه الگوهای شاخص‌گذاری و مهاجرت داده.",
    descEn: "Establish entity-relationship diagrams, write index configurations, and structure modern persistence adapters.",
    actionLabelFa: "تولید کدهای مهاجرت دیتابیس",
    actionLabelEn: "Compile SQL/Drizzle Migrations"
  },
  {
    number: 10,
    titleFa: "طراحی API و قرارداد بین اجزا",
    titleEn: "API Endpoint & Contracts Designing",
    category: "design",
    descFa: "تعریف قالب رد و بدل شدن پیام‌ها، پیش‌شرط‌ها و اعتبارسنجی‌ها برای برقراری ارتباط پایدار بین بک‌اند و فرانت‌اند.",
    descEn: "Formalize contract payloads, validation rules, HTTP response standards, and integration handshakes.",
    actionLabelFa: "اجرای ابزار آزمایش API",
    actionLabelEn: "Run Endpoint Mock Simulator"
  },
  {
    number: 11,
    titleFa: "طراحی تجربه کاربری (UI/UX Concept)",
    titleEn: "User Experience Wireframing",
    category: "design",
    descFa: "مدل‌سازی وایرفریم‌ها یا مسیرهای ناوبری کاربر در راستای به دست آوردن روان‌ترین تعامل کاربری در صفحه.",
    descEn: "Construct screen flow maps, wireframes, and responsive controls to maintain pristine visual rhythms.",
    actionLabelFa: "رندر قاب‌های سیمی UX",
    actionLabelEn: "Inspect Layout Wireframes"
  },
  {
    number: 12,
    titleFa: "برنامه‌ریزی اجرایی پروژه (Sprint Planner)",
    titleEn: "Sprint Planning & Milestones Gantt",
    category: "planning",
    descFa: "تقسیم کارها به دوره‌های چابک دو هفته‌ای (Spints) و برآورد زمان‌بندی دقیق اجرای گام‌ها برای ارتقا بازدهی.",
    descEn: "Divide requirements into two-week agile development sprints, assign story points, and establish dates.",
    actionLabelFa: "صادر کردن چارت گانت",
    actionLabelEn: "Open Project Gantt Schedule"
  },
  {
    number: 13,
    titleFa: "آماده‌سازی محیط توسعه (Workspace Booting)",
    titleEn: "Development Environment Setup",
    category: "development",
    descFa: "راه‌اندازی گیت، استراتژی شاخه‌های کدنویسی، پیکربندی Linters، کامپایلر TypeScript و اسکریپت‌های آغازین.",
    descEn: "Initialize repositories, declare git branching methodologies, configure build compilation, and install base CLI assets.",
    actionLabelFa: "اجرای لایو ترمینال راه‌اندازی",
    actionLabelEn: "Run Boot Terminal Simulator"
  },
  {
    number: 14,
    titleFa: "پیاده‌سازی مرحله‌ای پروژه (Incremental Dev)",
    titleEn: "Incremental Feature Coding",
    category: "development",
    descFa: "نوشتن و تحکیم گام به گام ماژول‌ها، اتصال سیستم با کدهای بهینه‌سازی بومی چند رشته‌ای سخت‌افزار.",
    descEn: "Iteratively build solid components and stitch modules together with native low-overhead logic buffers.",
    actionLabelFa: "نمایش کدهای هسته سیستم",
    actionLabelEn: "Review Dynamic Feature Code"
  },
  {
    number: 15,
    titleFa: "بازبینی فنی و Code Review",
    titleEn: "Technical Code Review Pipeline",
    category: "development",
    descFa: "بررسی الگوهای بهینگی، خوانایی کدها، نام‌گذاری درست متغیرها و مسدود کردن نشت حافظه بالقوه در پردازش‌ها.",
    descEn: "Analyze coding styling patterns, readability parameters, performance benchmarks, and remove memory leaks.",
    actionLabelFa: "اجرای بازبین خودکار کدها",
    actionLabelEn: "Initiate Interactive Code Review"
  },
  {
    number: 16,
    titleFa: "تست داخلی توسعه‌دهنده (Local Unit Testing)",
    titleEn: "Developer Local Integration Checks",
    category: "qa",
    descFa: "اجرای سناریوهای مرزی و تست رفتارهای کلی برنامه برای رفع باگ‌های مقدماتی پیش از مرحله کنترل کیفیت رسمی.",
    descEn: "Assert code boundaries locally, run regression suites, and guarantee baseline sanity indicators.",
    actionLabelFa: "اجرای لایو تست‌های محلی",
    actionLabelEn: "Trigger Local Unit Assertions"
  },
  {
    number: 17,
    titleFa: "تست رسمی و کنترل کیفیت (QA Workflow)",
    titleEn: "QA & Comprehensive Test Harness",
    category: "qa",
    descFa: "اجرای تست‌های خودکار یکپارچه‌سازی، تست بار پردازشی روی کارت گرافیک بومی و مانیتور کرش‌های احتمالی موتور بازی.",
    descEn: "Simulate maximum virtual concurrent user traffic, monitor real system crash indices, and ensure robustness.",
    actionLabelFa: "اسکن کیفیت و پایداری سیستم",
    actionLabelEn: "Launch System Quality Scanner"
  },
  {
    number: 18,
    titleFa: "رفع باگ و اصلاحات (Hotfixes Sequence)",
    titleEn: "Debugging & Hotfix Resolution",
    category: "qa",
    descFa: "شناسایی علت وقوع باگ‌ها و اعمال وصله‌های بهبود‌دهنده در هسته اصلی رندرر و کامپایلر.",
    descEn: "Isolate root-causes of issues report, write clean patches, and optimize the memory model.",
    actionLabelFa: "بررسی باگ و پچ اصلاحی",
    actionLabelEn: "Perform Automatic Bug Repair"
  },
  {
    number: 19,
    titleFa: "تحویل نسخه آزمایشی (Staging Release)",
    titleEn: "Beta Staging Area Deployment",
    category: "launch",
    descFa: "تولید نسخه نمایشی زنده (Live Sandbox) به همراه دریافت مستقیم بازخورد کاربر.",
    descEn: "Deploy compiled binary elements into an isolated live staging environment for early stakeholders review.",
    actionLabelFa: "ورود به محیط استیجینگ",
    actionLabelEn: "Access Sandbox Staging Environment"
  },
  {
    number: 20,
    titleFa: "اعمال بازخوردهای نهایی (Refinement)",
    titleEn: "Stakeholder Feedback Refinement",
    category: "launch",
    descFa: "اصلاح بخش‌های گزارش شده بر اساس ترجیحات نهایی کاربر نهایی بازی یا سایت و تایید پایداری نهایی.",
    descEn: "Directly apply usability findings, calibrate user interfaces, and adjust core variables dynamically.",
    actionLabelFa: "اعمال بازخوردها روی محصول",
    actionLabelEn: "Submit Calibration Updates"
  },
  {
    number: 21,
    titleFa: "آماده‌سازی برای انتشار (Production Target)",
    titleEn: "Production Hardening Checklist",
    category: "launch",
    descFa: "بهینه‌سازی نهایی فایل، ایمن‌سازی دیتابیس، تنظیم گواهی امنیتی SSL و فعال‌سازی مانیتور مداوم.",
    descEn: "Inject environment tokens securely, minimize static file footprints, configure secure SSL, and boot up monitors.",
    actionLabelFa: "اجرای چک‌لیست نهایی رهاسازی",
    actionLabelEn: "Run Production Hardening Checklist"
  },
  {
    number: 22,
    titleFa: "استقرار نهایی (Global Deployment)",
    titleEn: "Final Production Deployment",
    category: "launch",
    descFa: "انتقال کدهای نهایی به سرورهای با کارایی بالا یا Cloud Run موازی به همراه اتصال دامنه‌های امن کاربری.",
    descEn: "Push production docker assets to highly available cloud nodes and map standard customized domains.",
    actionLabelFa: "شبیه‌سازی لانچ در پروادکشن",
    actionLabelEn: "Simulate Core Production Launch"
  },
  {
    number: 23,
    titleFa: "تست پس از استقرار (Smoke Monitoring)",
    titleEn: "Post-Deployment Health Audits",
    category: "launch",
    descFa: "انجام تست‌های دود (Smoke Tests)، تایید پایداری تمام روترها و پایش زمان پاسخ‌دهی سرور.",
    descEn: "Automate light sanity tests, audit dynamic SSL configurations, and assert live database response latencies.",
    actionLabelFa: "پایش سلامت سرور بعد از لانچ",
    actionLabelEn: "Launch Smoke Monitor Controls"
  },
  {
    number: 24,
    titleFa: "مستندسازی نهایی و انتقال دانش",
    titleEn: "Complete Technical Documentation & KT",
    category: "launch",
    descFa: "ایجاد فایل‌های راهنمای نصب، مستندات APIها و نقشه گام‌های توسعه آتی پروژه به شکل فایل‌های README مجزا.",
    descEn: "Compile final API reference codebooks, assembly instructions, and future roadmap steps in clear markdown.",
    actionLabelFa: "تولید مستند فنی جامع",
    actionLabelEn: "Compile Final Technical Readme"
  }
];

export default function ProjectLifecycleView({ currentLang }: { currentLang: "fa" | "en" | string }) {
  const isRtl = currentLang === "fa";

  // System State
  const [userIdea, setUserIdea] = useState(
    isRtl 
      ? "ساخت بازی دو بعدی شبیه‌ساز پرواز فضایی با رندر زنده کارت گرافیک و هوش مصنوعی"
      : "High performance 2D Space Flight Simulator incorporating local GPU shaders & custom AI agents"
  );
  
  const [activeTab, setActiveTab] = useState<"ideation" | "roadmap" | "activeStep">("roadmap");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  
  // Custom Dynamic State for each of the 24 Steps Action simulators
  const [stepSimulationLog, setStepSimulationLog] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [step1Concept, setStep1Concept] = useState<any>(null);
  const [step2Requirements, setStep2Requirements] = useState({
    userCount: "10,000+",
    renderingMode: "Hybrid CPU/GPU Accelerated",
    mvpFocus: "Core Physics & Spacecraft lasers",
    hasDatabase: true,
    budgetTier: "Premium (Dynamic Allocation)"
  });

  const [step3Tree, setStep3Tree] = useState<any>(null);
  const [step4Feasibility, setStep4Feasibility] = useState({
    gpuload: 45,
    cpuThreadsAllocated: 8,
    memorySafetyIndex: "98.5%",
    overallRating: "Fully Feasible (Green)"
  });

  const [step5Scope, setStep5Scope] = useState({
    inScope: ["Advanced WebGL interactive playground", "Dynamic laser particle systems", "Fully real-time performance meters", "Persisting state"],
    outScope: ["Multiplayer peer-to-peer latency sync in v1.0", "Cloud database cluster replicas", "Custom native VR graphics"]
  });

  const [step6Roadmap, setStep6Roadmap] = useState({
    must: ["Stable Canvas Renderer loop", "Input handlers bound to CPU threads", "Memory leak monitors"],
    should: ["Stunning micro-explosion space sprites", "Interactive Assembly decompiler screen"],
    could: ["Dynamic custom theme changer color", "Wider localized audio synthesizer patterns"]
  });

  const [dbTables, setDbTables] = useState([
    { name: "projects", cols: "id (UUID PK), user_email (VARCHAR), idea_text (TEXT), created_at (TIMESTAMP)" },
    { name: "lifecycle_states", cols: "id (INT PK), project_id (UUID FK), active_step_number (INT), updated_at (TIMESTAMP)" },
    { name: "compiled_binaries", cols: "hash_id (VARCHAR PK), bytes_size (INT), build_log (TEXT), wasm_buffer (BYTEA)" }
  ]);

  const [apiTests, setApiTests] = useState([
    { method: "POST", path: "/api/v1/projects/ideate", desc: "Subeits initial idea proposal to AI Studio Processor", status: 200, res: '{"state": "analyzed", "modules": 8}' },
    { method: "GET", path: "/api/v1/hardware/diagnostic", desc: "Queries live WebGL CPU/GPU temperature & active threads", status: 200, res: '{"gpuTemp": 48, "cudaActive": 1024}' },
    { method: "POST", path: "/api/v1/compiler/reverse", desc: "Processes disassembly bytecode array to ASM formats", status: 200, res: '{"status": "decompiled", "instructions": 128}' }
  ]);

  const [step13TerminalLogs, setStep13TerminalLogs] = useState<string[]>([
    "Initializing git sub-repositories...",
    "Configuring husky pre-commit syntax hooks...",
    "Installing @google/genai TypeScript optimizer...",
    "Probing system host graphic cards... GeForce CUDA compatibility discovered.",
    "Development server initialized: Listening on http://localhost:3000 ✔"
  ]);

  const [step15CodeReviewResults, setStep15CodeReviewResults] = useState({
    criticalVulnerabilities: 0,
    memoryLeaksDetected: 0,
    deadlocksAverted: 2,
    score: 96
  });

  const [step16TestSuites, setStep16TestSuites] = useState([
    { name: "Verify physics engine acceleration constants", status: "passed" },
    { name: "Ensure GPU rendering loops do not leak memory in long frames", status: "passed" },
    { name: "Check authentication key decryption on API routers", status: "passed" },
    { name: "Validate disassembler decompiler x86 instructions parser", status: "passed" }
  ]);

  const [stagingDeployedUrl, setStagingDeployedUrl] = useState("https://ais-pre-xv6nmed2v3fdvwizeownqh-919878569500-staging.run.app");
  const [productionStats, setProductionStats] = useState({
    responseTimeMs: 24,
    systemUptime: "99.998%",
    activeSslCertificate: "Active (Let's Encrypt Wildcard)",
    replicaCount: 3,
    status: "Healthy (Green)"
  });

  const [customTickName, setCustomTickName] = useState("");
  const [customTickets, setCustomTickets] = useState([
    { title: "Optimize matrix physics loop on weak laptops", priority: "High", status: "Shipped v1.0.1" },
    { title: "Support drag-and-drop .bin files directly into the editor", priority: "Medium", status: "Completed" }
  ]);

  // Persian & English dictionary
  const dictionary = {
    fa: {
      stepHeader: "مسیر ۲۴ مرحله‌ای تبدیل فرضیات ذهنی به نرم‌افزار حرفه‌ای واقعی",
      stepSubtitle: "پلتفرم چابک شبیه‌سازی مراحل توسعه، ساخت شاسی کدها، پایش تست کیفیت، امنیت، و استقرار بهینه در کدهای شما.",
      ideationLabel: "طراحی و مفهوم اولیه ایده",
      roadmapLabel: "مشاهده نقشه راه پروژه",
      activeStepLabel: "تعامل لایو با مراحل فنی",
      backBtn: "گام قبلی",
      nextBtn: "گام بعدی",
      currentIdea: "ایده فعلی پروژه شما:",
      ideaPlaceholder: "ایده مورد نظر خود را بنویسید (مثلاً: ساخت یک بازی شیک یا فروشگاهی پیشرفته...)",
      submitIdea: "به‌روزرسانی و پردازش هوشمند ایده کلی",
      stepCategory: "دسته بندی:",
      simulatingProgress: "در حال پردازش گام فنی...",
      actionCompleted: "وظیفه گام بازسازی شد. مستندات گام آماده ارزیابی است.",
      planning: "برنامه‌ریزی و آنالیز",
      design: "طراحی کانسپت و معماری",
      development: "توسعه و کدنویسی",
      qa: "تضمین کیفیت و تست",
      launch: "راه‌اندازی، تولید و پشتیبانی"
    },
    en: {
      stepHeader: "24-Step Workspace Journey: From Mental Concept to Premium App",
      stepSubtitle: "Simulate exact engineering procedures, compile schemas, run regression QA, inspect security flags, and deploy container nodes.",
      ideationLabel: "Initial Concept & Ideation",
      roadmapLabel: "Interactive Project Roadmap",
      activeStepLabel: "Active Engineering Panel",
      backBtn: "Previous Milestone",
      nextBtn: "Next Milestone",
      currentIdea: "Active Project Concept:",
      ideaPlaceholder: "Type your product vision here...",
      submitIdea: "Calibrate & Reroute System Concept",
      stepCategory: "Engineering Phase:",
      simulatingProgress: "Synthesizing step specifications...",
      actionCompleted: "Milestone compiled successfully. Live artifacts have been populated.",
      planning: "Planning & Requirements",
      design: "Framework & Architecture Design",
      development: "System & GPU Feature Dev",
      qa: "Quality Assurance & Debugging",
      launch: "Staging, Production & Support"
    }
  };

  const currentDict = dictionary[currentLang === "fa" ? "fa" : "en"];

  // Helper colors mapping for steps categories
  const getCatColor = (cat: StepInfo["category"]) => {
    switch (cat) {
      case "planning": return "border-cyan-500/30 text-cyan-400 bg-cyan-550/10";
      case "design": return "border-indigo-500/30 text-indigo-400 bg-indigo-550/10";
      case "development": return "border-emerald-500/30 text-emerald-400 bg-emerald-550/10";
      case "qa": return "border-rose-500/30 text-rose-400 bg-rose-550/10";
      case "launch": return "border-purple-500/30 text-purple-400 bg-purple-550/10";
    }
  };

  const getCatLabel = (cat: StepInfo["category"]) => {
    const labels = {
      fa: {
        planning: "برنامه‌ریزی و آنالیز",
        design: "معماری و زیرساخت",
        development: "توسعه الگوریتم‌ها",
        qa: "طراحی سناریوهای تست و کیفیت",
        launch: "لانچ، زیرساخت و نگهداری"
      },
      en: {
        planning: "Planning & Analysis",
        design: "Architecture & Blueprinting",
        development: "Algorithmic Development",
        qa: "Quality Assurance Testing",
        launch: "Deploy, Operations & Operations"
      }
    };
    return labels[isRtl ? "fa" : "en"][cat];
  };

  // Run dynamic emulation when clicking the main step action buttons
  const triggerStepAction = (stepNum: number) => {
    setIsSimulating(true);
    setStepSimulationLog("");
    const stepsLogs: Record<number, string[]> = {
      1: ["Analyzing text syntax...", `Target output: ${userIdea}.`, "Mapping components topology... Complete!"],
      2: ["Analyzing target scale requirements...", "MVP features demarcated: Canvas graphics acceleration system + memory optimization.", "Database necessity: True."],
      3: ["Extracting technical objects...", "Synthesized sub-modules: Core Physics Engine, Game loop tick controllers, Assembly Instruction decoder, Dynamic log pipeline."],
      4: ["Probing hardware constraints...", "Estimated local shader requirements: 1024-2048 CUDA Cores.", "Memory leak vulnerability rating: Low. Safe memory constraints passed."],
      5: ["Drawing strict scope boundaries...", "In-Scope & Out-of-Scope lists stabilized dynamically based on user resources."],
      6: ["Ranking MVP backlog indices...", "Essential nodes mapped first.", "Deferred items moved to version 2.0 release targets."],
      7: ["Evaluating hardware-accelerated micro-libraries...", "Core stack locked: webgl2 context + local CPU pool workers."],
      8: ["Arranging modular block system graph dependencies...", "Designing direct message bus between GUI state and system compiler thread."],
      9: ["Configuring persistence blueprints...", "Indices optimized for fast UUID key search. Tables registered."],
      10: ["Generating HTTP/WebSocket schema payloads...", "Wrote mock API definitions for runtime testing sandbox."],
      11: ["Defining absolute viewport pixels and bounding box nodes...", "Wireframes updated with standard 44px margins and responsive touch targets."],
      12: ["Formulating Gantt timeline grids...", "Two active 10-day sprints formulated.", "Critical path delay probability: 0%."],
      13: ["Spinning up CLI environment logs...", "Checking package linting configurations... All green.", "Wrote compiler script instructions."],
      14: ["Compiling active source code modules...", "Integrating high-performance WebGL modules. Execution verified in 24ms."],
      15: ["Evaluating code lines layout...", "No memory leaks detected.", "No deadlocks found in asynchronous intervals. Quality score: 96%."],
      16: ["Running standard check assertions...", "Physics formulas validated.", "Decompiler disassembly translation assertion: Passed."],
      17: ["Initiating load scanners...", "10,000 requests processed.", "Zero memory leaks registered. System performance optimal."],
      18: ["Searching crash reports history...", "Zero crashes found.", "Optimized rendering buffers and scaled GPU clock cycles dynamically."],
      19: ["Spinning up isolated staging container nodes...", "Linking static routes to internal proxy.", "Staging sandbox URL created successfully."],
      20: ["Applying stakeholder guidelines...", "Updated responsive viewport elements.", "Aligned typography tracking parameter."],
      21: ["Hardening environment keys...", "Compiling asset minification...", "Configuring cloud nodes.", "SSL verified."],
      22: ["Spreading Docker containers inside high-performance nodes...", "Active cluster linked to Host.", "Production environment online!"],
      23: ["Pinging live routes...", "Staging/Production routing check: Passed (14ms response rate)."],
      24: ["Converting blueprints to human-readable markdown documentation...", "KT files compiled.", "Knowledge Base completely populated."]
    };

    let logIdx = 0;
    const logs = stepsLogs[stepNum] || ["Processing system variables...", "Storing state parameters..."];
    
    // Simulate active processing intervals
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        setStepSimulationLog(prev => prev + (prev ? "\n" : "") + "▸ " + logs[logIdx]);
        logIdx++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        // Mark as completed
        if (!completedSteps.includes(stepNum)) {
          setCompletedSteps(prev => [...prev, stepNum]);
        }
        
        // Populate customized side-effects
        if (stepNum === 1) {
          setStep1Concept({
            id: "PRJ-" + Math.floor(Math.random() * 8999 + 1000),
            name: isRtl ? "شبیه‌ساز پیشرفته فضایی" : "Advanced Space Odyssey",
            targetGoal: isRtl ? "ایجاد موتور بازی‌سازی بومی فیروزه‌ای قوی" : "Establish high-performance localized 2D gaming engine",
            problemResolved: isRtl ? "خلا عدم دسترسی به پردازش بومی مستقیم در وب" : "Solves direct hardware access constraints in reactive SPAs"
          });
        }
      }
    }, 400);
  };

  // Run automatically when step tab loads to make it look responsive and automatic
  const handleStepLoad = (idx: number) => {
    setCurrentStepIndex(idx);
    const activeStep = stepsData[idx];
    if (activeStep) {
      triggerStepAction(activeStep.number);
    }
  };

  // Re-process all steps based on newly updated customized ideas
  const handleReloadIdea = () => {
    setIsSimulating(true);
    setCompletedSteps([1]);
    setCurrentStepIndex(0);
    setTimeout(() => {
      setIsSimulating(false);
      triggerStepAction(1);
    }, 600);
  };

  return (
    <div id="project_lifecycle_system_interactive_root" className="flex flex-col gap-6">
      
      {/* Top Banner introducing the 24 Steps Workspace */}
      <div className="bg-[#042028] border border-cyan-550/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-cyan-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Workflow className="h-6 w-6 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-teal-100 flex items-center gap-2">
                <span>{currentDict.stepHeader}</span>
                <span className="bg-cyan-500/20 text-cyan-400 text-[9px] font-mono px-2 py-0.5 rounded-full font-black uppercase">
                  Workspace Roadmap
                </span>
              </h2>
              <p className="text-xs text-slate-450 mt-1 max-w-3xl leading-relaxed">
                {currentDict.stepSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-teal-950">
            <button
              onClick={() => setActiveTab("roadmap")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "roadmap" ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
            >
              🇮🇷 {isRtl ? "نقشه چارت کلی" : "Unified Gantt Map"}
            </button>
            <button
              onClick={() => setActiveTab("activeStep")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "activeStep" ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
            >
              ⚡ {isRtl ? "پنل فرآیند زنده" : "Live Step Workspace"}
            </button>
          </div>
        </div>
      </div>

      {/* Idea Inputs / Customization dashboard box */}
      <div className="bg-slate-950/80 border border-teal-980/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        <label className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          {currentDict.currentIdea}
        </label>
        
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <input
            type="text"
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder={currentDict.ideaPlaceholder}
            className="flex-grow bg-[#01080b] border border-teal-500/20 rounded-xl px-4 py-3 text-sm text-cyan-100 outline-none focus:border-cyan-400/50 focus:ring-0 transition-all font-sans"
          />
          <button
            onClick={handleReloadIdea}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-sans font-bold text-xs shrink-0 px-5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(20,184,166,0.15)]"
          >
            <RefreshCw className={`h-4 w-4 ${isSimulating ? "animate-spin" : ""}`} />
            {currentDict.submitIdea}
          </button>
        </div>
      </div>

      {/* RENDER VIEW 1: ROADMAP TIMELINE GRID (All 24 Steps visually laid out as blocks) */}
      {activeTab === "roadmap" && (
        <div className="bg-slate-950 border border-teal-980/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
          <div className="border-b border-teal-950 pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-black text-teal-100 uppercase tracking-wider block">
                {isRtl ? "لیست کامل سرفصل‌های اجرایی پروژه" : "Master Project Lifecycle Sprints"}
              </span>
              <span className="text-[10.5px] text-zinc-550 mt-1 block">
                {isRtl ? "روند پیشرفت ایده از بیان اولیه تا کدنویسی، رفع خطا، استقرار نهایی و مستندسازی" : "Unified view mapping 24 distinct milestones synchronized based on actual resources."}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[10.5px] font-mono">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-400 font-bold">{isRtl ? "پایان یافته" : "Compiled"}</span>
              </span>
              <span className="text-zinc-650">|</span>
              <span className="text-zinc-500">
                {completedSteps.length} / 24 {isRtl ? "گام‌ها تمام شد" : "Steps completed"}
              </span>
            </div>
          </div>

          {/* 24-Step Visual Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stepsData.map((step, idx) => {
              const isCompleted = completedSteps.includes(step.number);
              return (
                <div
                  key={step.number}
                  onClick={() => {
                    setActiveTab("activeStep");
                    handleStepLoad(idx);
                  }}
                  className={`border rounded-xl p-4 flex flex-col gap-3 transition-all cursor-pointer relative group ${
                    isCompleted 
                      ? "bg-emerald-950/5 border-emerald-900/35 hover:border-emerald-500/40 shadow-[0_2px_12px_rgba(16,185,129,0.03)]" 
                      : "bg-[#01080c] border-[#041d25] hover:border-cyan-550/40 hover:bg-[#03151c]/40"
                  }`}
                >
                  {/* Step status and Category flags */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-black text-slate-500 shrink-0 select-none">
                      #{String(step.number).padStart(2, "0")}
                    </span>

                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${getCatColor(step.category)}`}>
                      {getCatLabel(step.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h4 className="text-xs font-bold text-teal-100 group-hover:text-cyan-300 transition-colors leading-snug">
                      {isRtl ? step.titleFa : step.titleEn}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed line-clamp-2">
                      {isRtl ? step.descFa : step.descEn}
                    </p>
                  </div>

                  {/* Complete Check overlay tag */}
                  <div className="mt-auto pt-3 border-t border-[#041d25] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 group-hover:underline flex items-center gap-1">
                      {isRtl ? "ورود به فرآیند فنی" : "Open Step Works"}
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 fill-emerald-500/10 shrink-0" />
                    ) : (
                      <span className="h-4.5 w-4.5 rounded-full border border-teal-900 flex items-center justify-center shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-900"></span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: ACTIVE LIVE ENGINEERING WORKSPACE PANEL (Detailed single-step compiler interactive) */}
      {activeTab === "activeStep" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Vertical quick milestones guide list (4 cols) */}
          <div className="lg:col-span-4 bg-slate-950 border border-teal-980/30 rounded-2xl p-4 flex flex-col gap-3 max-h-[680px] overflow-y-auto">
            <span className="text-[10.5px] font-mono font-black text-slate-500 uppercase tracking-widest block pb-2 border-b border-teal-950">
              {isRtl ? "پیمایش سریع ۲۴ مرحله پروژه" : "Milestones Quick-Jump"}
            </span>

            <div className="flex flex-col gap-1 text-xs">
              {stepsData.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isCompleted = completedSteps.includes(step.number);
                return (
                  <button
                    key={step.number}
                    onClick={() => handleStepLoad(idx)}
                    className={`p-2.5 rounded-lg flex items-center justify-between text-left transition-all font-sans cursor-pointer ${
                      isActive 
                        ? "bg-cyan-550/15 border border-cyan-500/25 text-cyan-300 font-bold" 
                        : "text-slate-400 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 font-black">
                        {String(step.number).padStart(2, "0")}
                      </span>
                      <span className="truncate max-w-[180px]">
                        {isRtl ? step.titleFa : step.titleEn}
                      </span>
                    </div>

                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-450 shrink-0" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-teal-950 shrink-0"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Active Step Details, Artifacts generated and Interactive Simulators (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Step summary block */}
            <div className="bg-slate-950 border border-teal-980/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-baseline justify-between gap-2 border-b border-teal-950 pb-4">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/40 text-teal-400 font-mono font-black text-sm flex items-center justify-center shrink-0">
                    {stepsData[currentStepIndex].number}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-teal-100 font-sans">
                      {isRtl ? stepsData[currentStepIndex].titleFa : stepsData[currentStepIndex].titleEn}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-cyan-950/40 border-cyan-500/20 text-cyan-300 uppercase mt-0.5 inline-block">
                      {getCatLabel(stepsData[currentStepIndex].category)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentStepIndex === 0}
                    onClick={() => handleStepLoad(currentStepIndex - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={currentStepIndex === stepsData.length - 1}
                    onClick={() => handleStepLoad(currentStepIndex + 1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed bg-[#021014]/60 border border-teal-500/10 p-4 rounded-xl">
                {isRtl ? stepsData[currentStepIndex].descFa : stepsData[currentStepIndex].descEn}
              </p>

              {/* Main execution action trigger */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  disabled={isSimulating}
                  onClick={() => triggerStepAction(stepsData[currentStepIndex].number)}
                  className="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-sans font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  <Play className={`h-4 w-4 fill-current ${isSimulating ? "animate-spin" : ""}`} />
                  <span>{isRtl ? stepsData[currentStepIndex].actionLabelFa : stepsData[currentStepIndex].actionLabelEn}</span>
                </button>

                <div className="font-mono text-[10.5px]">
                  {isSimulating ? (
                    <span className="text-rose-400 animate-pulse font-bold">{currentDict.simulatingProgress}</span>
                  ) : completedSteps.includes(stepsData[currentStepIndex].number) ? (
                    <span className="text-emerald-450 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{currentDict.actionCompleted}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Pre-compile ready.</span>
                  )}
                </div>
              </div>

              {/* Step Simulator Log view console */}
              {stepSimulationLog && (
                <div className="bg-[#010609] border border-teal-980/20 p-3.5 rounded-xl block font-mono text-[11px] leading-relaxed text-cyan-300/95 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                  {stepSimulationLog}
                </div>
              )}
            </div>

            {/* ARTIFCT ARTIFACT VIEWER WINDOWS FOR INDIVIDUAL STEPS (Dynamic UI blocks) */}
            <div className="bg-slate-950 border border-teal-980/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
              <span className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-teal-950">
                <Layers className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span>{isRtl ? "مستندات و آرتفیکت‌های شبیه‌سازی شده این فاز فنی" : "Active Stage Artifacts & Technical Handbacks"}</span>
              </span>

              {/* Step 1 artifact: User Concept generated profile */}
              {stepsData[currentStepIndex].number === 1 && (
                <div className="flex flex-col gap-3 font-sans">
                  {step1Concept ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-teal-950">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-mono text-slate-550">Proposal Token</span>
                        <span className="text-xs text-cyan-400 font-mono font-black">{step1Concept.id}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-mono text-slate-550">Processed Name</span>
                        <span className="text-xs font-bold text-teal-100">{step1Concept.name}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2 border-t border-teal-950/80 pt-2.5">
                        <span className="text-[10px] uppercase font-mono text-slate-550">Target Scope</span>
                        <span className="text-xs text-slate-300 leading-relaxed">{step1Concept.targetGoal}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs italic text-center py-4">Click Register tool to analyze concept nodes.</div>
                  )}
                </div>
              )}

              {/* Step 2 artifact: discovery requirements map */}
              {stepsData[currentStepIndex].number === 2 && (
                <div className="bg-slate-900/40 border border-teal-950 p-4 rounded-xl flex flex-col gap-3 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Target Traffic</span>
                      <span className="text-cyan-400 font-mono font-bold">{step2Requirements.userCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Rendering Architecture</span>
                      <span className="text-emerald-400 font-mono font-bold">{step2Requirements.renderingMode}</span>
                    </div>
                    <div className="col-span-2 border-t border-teal-950 pt-2">
                      <span className="text-slate-500 block text-[10px] uppercase">MVP Focus core</span>
                      <span className="text-slate-200 mt-1 block">{step2Requirements.mvpFocus}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 artifact: Tree components list */}
              {stepsData[currentStepIndex].number === 3 && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-teal-950 flex flex-col gap-2 font-mono text-xs text-cyan-300 leading-relaxed">
                  <div>┌─ project_root</div>
                  <div>├── 🚀 physics_matrix_kernel.ts</div>
                  <div>├── 🎮 visual_game_renderer.tsx</div>
                  <div>├── 🔧 hardware_prober_interface.cpp</div>
                  <div>├── 🧠 assembly_disassembler_core.asm</div>
                  <div>└── 🗄️ local_indexed_db_migrator.sql</div>
                </div>
              )}

              {/* Step 4 artifact: feasibility matrix */}
              {stepsData[currentStepIndex].number === 4 && (
                <div className="bg-slate-900/50 p-4 border border-teal-950 rounded-xl grid grid-cols-2 gap-3.5 text-xs font-sans">
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Emulated GPU Overhead</span>
                    <span className="text-cyan-400 font-bold font-mono">{step4Feasibility.gpuload}% Load</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Dedicated CPU Threads</span>
                    <span className="text-teal-400 font-bold font-mono">{step4Feasibility.cpuThreadsAllocated} Cores</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Security Standard</span>
                    <span className="text-emerald-450 font-bold font-mono">{step4Feasibility.memorySafetyIndex} Clear</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Final Feasiblity Assessment</span>
                    <span className="text-emerald-400 font-bold">{step4Feasibility.overallRating}</span>
                  </div>
                </div>
              )}

              {/* Step 5 artifact: Scope boundary lists */}
              {stepsData[currentStepIndex].number === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-xl flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">In-Scope (F1)</span>
                    <ul className="space-y-1.5 text-slate-300">
                      {step5Scope.inScope.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-955/10 border border-rose-900/30 p-3 rounded-xl flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-rose-400">Out-Of-Scope</span>
                    <ul className="space-y-1.5 text-slate-350">
                      {step5Scope.outScope.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <X className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 6 artifact: Feature backlog prioratization */}
              {stepsData[currentStepIndex].number === 6 && (
                <div className="bg-slate-900/40 p-4 border border-teal-950 rounded-xl flex flex-col gap-3 text-xs font-sans">
                  <div>
                    <span className="text-emerald-400 font-bold block mb-1">Must Have:</span>
                    <p className="text-slate-300 font-light">{step6Roadmap.must.join(", ")}</p>
                  </div>
                  <div className="border-t border-teal-950/80 pt-2">
                    <span className="text-cyan-400 font-bold block mb-1">Should Have:</span>
                    <p className="text-slate-300 font-light">{step6Roadmap.should.join(", ")}</p>
                  </div>
                  <div className="border-t border-teal-950/80 pt-2">
                    <span className="text-purple-400 font-bold block mb-1">Could Have:</span>
                    <p className="text-slate-350 font-light">{step6Roadmap.could.join(" • ")}</p>
                  </div>
                </div>
              )}

              {/* Step 7 & 8: System architecture drawing */}
              {["planning", "design"].includes(stepsData[currentStepIndex].category) && stepsData[currentStepIndex].number >= 7 && (
                <div className="bg-[#020d11] p-4 rounded-xl border border-teal-950 flex flex-col gap-3 font-mono text-[11px] text-cyan-300">
                  <div className="flex justify-between items-center bg-[#051a22] p-2 rounded">
                    <span>HOST CONTROLLER SERVICE (Port 3000)</span>
                    <span className="text-emerald-400">WAIT MS ... OK</span>
                  </div>
                  <div className="text-center">⇣ (Dynamic WebGL / REST Payloads)</div>
                  <div className="text-center bg-[#07242e] p-2 rounded border border-teal-950 mx-8">
                    LOCAL CUDA SYNAPSE MATRIX INTERACTION ACCELERATOR
                  </div>
                  <div className="text-center">⇣</div>
                  <div className="flex justify-between items-center bg-[#03151c] p-2 rounded">
                    <span>DATABASE PERSISTENCE: FIRESTORE API</span>
                    <span className="text-cyan-400">SYNC SUCCESS</span>
                  </div>
                </div>
              )}

              {/* Step 9 artifact: Database schemas */}
              {stepsData[currentStepIndex].number === 9 && (
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-900 p-3 rounded-lg border border-teal-950 text-xs font-sans space-y-2">
                    {dbTables.map((table, i) => (
                      <div key={i} className="flex flex-col gap-1 pb-2 border-b border-teal-950/55 last:border-0 last:pb-0">
                        <span className="font-bold text-teal-100 font-mono">📁 table: {table.name}</span>
                        <span className="text-slate-400 font-mono text-[10.5px]">{table.cols}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 10 artifact: API Endpoint testing simulation */}
              {stepsData[currentStepIndex].number === 10 && (
                <div className="flex flex-col gap-2.5">
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {apiTests.map((api, i) => (
                      <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-teal-950 flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <code className="font-mono text-[11px] text-cyan-400">
                            <span className="text-[#ec4899] font-black px-1.5 py-0.2 bg-rose-500/10 rounded mr-1.5">{api.method}</span> 
                            {api.path}
                          </code>
                          <span className="text-emerald-400 font-mono font-bold text-[10px]">HTTP {api.status}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">{api.desc}</span>
                        <pre className="text-[10px] bg-[#020b0e] p-2 rounded text-emerald-400 mt-1 max-w-full overflow-x-auto">{api.res}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 11 artifact: wireframes UI */}
              {stepsData[currentStepIndex].number === 11 && (
                <div className="border border-dashed border-cyan-500/20 rounded-xl p-4 bg-slate-900/40 text-center flex flex-col gap-3 items-center">
                  <div className="h-28 w-full max-w-sm bg-slate-950 rounded-lg border border-slate-800 p-2 relative flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 font-mono text-[9px] text-slate-500">
                      <span>PROJECT PREVIEW WIREFRAME</span>
                      <span>480 x 300 viewport</span>
                    </div>
                    <div className="border border-dashed border-teal-500/20 rounded flex items-center justify-center p-3 text-[10.5px] text-teal-400 italic font-mono">
                      [Interactive Canvas Stage Stage]
                    </div>
                    <div className="h-4 bg-slate-900 rounded w-1/2 mx-auto"></div>
                  </div>
                  <span className="text-xs text-slate-400">Clean minimalist bounding layouts mapped successfully.</span>
                </div>
              )}

              {/* Step 12: sprint plans */}
              {stepsData[currentStepIndex].number === 12 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-teal-950 flex flex-col gap-3 font-mono text-[10.5px]">
                  <div className="flex items-center justify-between border-b border-teal-950/60 pb-2 text-slate-500 uppercase">
                    <span>Agile Workspace Sprint</span>
                    <span>Story Points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sprint 1: Renderer Context setup & Host initialization</span>
                    <span className="text-cyan-400">8 SP (Complete)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sprint 2: Algorithmic physics loops & decompiler screens</span>
                    <span className="text-cyan-400">13 SP (In Progress)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sprint 3: Heavy regression testing and cluster deployments</span>
                    <span className="text-slate-500">5 SP (Future)</span>
                  </div>
                </div>
              )}

              {/* Step 13: Boot Env terminal logs */}
              {stepsData[currentStepIndex].number === 13 && (
                <div className="bg-black p-4 rounded-xl border border-zinc-800 font-mono text-[11px] text-slate-300 space-y-1.5">
                  {step13TerminalLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 leading-relaxed">
                      <span className="text-teal-500">$</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 14: Dynamic File features */}
              {stepsData[currentStepIndex].number === 14 && (
                <div className="space-y-2">
                  <div className="bg-slate-900 p-3 rounded-lg border border-teal-505/30 font-mono text-xs">
                    <span className="text-[#a855f7] font-bold block mb-1">class SpaceGameEngine {}</span>
                    <span className="text-slate-450 text-[10.5px]">Includes WebGL graphic threads mapping, particle synopses acceleration, and memory leak guards under CPU.</span>
                  </div>
                </div>
              )}

              {/* Step 15: Code Review findings */}
              {stepsData[currentStepIndex].number === 15 && (
                <div className="grid grid-cols-2 gap-3.5 bg-slate-900/50 p-4 rounded-xl border border-teal-950 text-xs font-sans">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Review Safety rating</span>
                    <span className="text-emerald-450 font-bold font-mono">{step15CodeReviewResults.score}% (Pass)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Critical Security Faults</span>
                    <span className="text-emerald-400 font-mono">{step15CodeReviewResults.criticalVulnerabilities} Detected</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Deadlocks prevented</span>
                    <span className="text-cyan-400 font-bold font-mono">{step15CodeReviewResults.deadlocksAverted}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Allocated structure styling</span>
                    <span className="text-emerald-400 font-bold">Standard TS Conformity</span>
                  </div>
                </div>
              )}

              {/* Step 16 & 17: test suites results */}
              {["qa"].includes(stepsData[currentStepIndex].category) && (
                <div className="bg-slate-900/60 p-4 border border-teal-950 rounded-xl flex flex-col gap-2.5 text-xs font-sans">
                  <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest block mb-1">Regression Assertions Suite</span>
                  <div className="space-y-2">
                    {step16TestSuites.map((test, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-teal-950/40">
                        <span className="text-slate-300 font-light truncate max-w-[280px]">{test.name}</span>
                        <span className="text-emerald-400 font-mono font-bold text-[10.5px] uppercase">PASSED ✔</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 18: bug hotfix fixers */}
              {stepsData[currentStepIndex].number === 18 && (
                <div className="bg-slate-900/40 border border-teal-950 p-4 rounded-xl text-xs flex flex-col gap-3 font-sans">
                  <div className="flex items-center gap-2.5 text-rose-400">
                    <Bug className="h-4 w-4" />
                    <span className="font-bold">Memory leak buffer index error - Solved</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-rose-550/5 border border-rose-950 rounded-xl text-slate-400">
                      <span className="text-[10px] uppercase text-rose-400 font-bold block mb-1">Previous bad loop:</span>
                      <code className="font-mono text-[10px]">while(true) {`{`} tick(); {`}`}</code>
                    </div>
                    <div className="p-3 bg-emerald-555/5 border border-emerald-950 rounded-xl text-slate-200">
                      <span className="text-[10px] uppercase text-emerald-400 font-bold block mb-1">Clean stable fix:</span>
                      <code className="font-mono text-[10px]">requestAnimationFrame(tick)</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 19 & 20: staging area beta URLs */}
              {stepsData[currentStepIndex].number === 19 && (
                <div className="bg-slate-900/60 p-4 border border-teal-950 rounded-xl flex flex-col gap-3.5 text-xs font-sans">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Active Staging Address</span>
                    <a href={stagingDeployedUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline font-mono font-bold block mt-1">
                      {stagingDeployedUrl}
                    </a>
                  </div>
                  <div className="border-t border-teal-950/80 pt-2.5 flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Secure Proxy Status: Online</span>
                    <span className="text-emerald-450 font-bold">100% SSL MATCH</span>
                  </div>
                </div>
              )}

              {/* Step 21 & 22: High-Performance Production Launch Metrics */}
              {["launch"].includes(stepsData[currentStepIndex].category) && stepsData[currentStepIndex].number >= 21 && (
                <div className="grid grid-cols-2 gap-3.5 bg-slate-900/50 p-4 border border-teal-950 rounded-xl text-xs font-sans">
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Global Response Rate</span>
                    <span className="text-cyan-400 font-bold font-mono">{productionStats.responseTimeMs}ms Fast</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Dynamic Cluster Nodes</span>
                    <span className="text-teal-400 font-bold font-mono">{productionStats.replicaCount} Nodes</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Security Certification</span>
                    <span className="text-emerald-450 font-bold font-mono truncate max-w-[150px] inline-block">{productionStats.activeSslCertificate}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block text-[10px] uppercase">Cluster Diagnostics status</span>
                    <span className="text-emerald-450 font-bold">{productionStats.status}</span>
                  </div>
                </div>
              )}

              {/* Default fallbacks if no particular artifact exists yet */}
              {!completedSteps.includes(stepsData[currentStepIndex].number) && (
                <div className="text-slate-600 text-xs text-center py-4 italic border border-dashed border-teal-980/20 rounded-xl">
                  {isRtl ? "هیچ خروجی یا مستندی برای این گام پردازش نشده است." : "Artifact indices clear. Trigger Action to populate results."}
                </div>
              )}

            </div>

            {/* Step 25 & 26: Custom feedback support tickets block */}
            <div className="bg-slate-950 border border-teal-980/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
              <span className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-teal-950">
                <Users className="h-4.5 w-4.5 text-cyan-400" />
                <span>{isRtl ? "پشتیبانی پس از تحویل و فاز دوم توسعه" : "Step 26: Post-Delivery Active Tickets & Refinement"}</span>
              </span>

              <div className="flex flex-col gap-3 font-sans text-xs">
                {customTickets.map((ticket, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#020b0e] border border-teal-950">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-200">{ticket.title}</span>
                      <span className="text-[9.5px] font-mono text-slate-550 uppercase">Priority: {ticket.priority}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/20 text-cyan-400">
                      {ticket.status}
                    </span>
                  </div>
                ))}

                {/* Submit new improvement request */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customTickName}
                    onChange={(e) => setCustomTickName(e.target.value)}
                    placeholder={isRtl ? "افزودن قابلیت جدید برای فاز بعدی..." : "Suggest a feature calibration for next sprint..."}
                    className="flex-grow bg-[#01080b] border border-teal-500/20 rounded-xl px-3 py-2 text-xs text-cyan-100 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!customTickName.trim()) return;
                      setCustomTickets(prev => [...prev, { title: customTickName, priority: "Medium", status: "In Backlog" }]);
                      setCustomTickName("");
                    }}
                    className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/20 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {isRtl ? "ثبت درخواست" : "File Ticket"}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
