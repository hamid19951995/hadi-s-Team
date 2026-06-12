// Autonomous Self-Healing Loop Core State Engine and Schema
export type HealingStep =
  | "IDLE"
  | "DETECTING"
  | "CLASSIFYING"
  | "ANALYZING_LOGS"
  | "GENERATING_PATCH"
  | "APPLYING_PATCH"
  | "RE_RUNNING"
  | "VALIDATING"
  | "ESCALATING"
  | "ROLLING_BACK"
  | "RESOLVED"
  | "FAILED";

export type ErrorClassification =
  | "TYPE_COLLISION"
  | "SYNTAX_ERROR"
  | "IMPORT_EXCEPTION"
  | "MISSING_DEPENDENCY"
  | "SECURITY_INVARIANT_VIOLATION";

export interface InjectableError {
  id: string;
  name: string;
  classification: ErrorClassification;
  description: string;
  targetFile: string;
  unhealedLog: string;
  healingLog: string;
  offendingLineNum: number;
  offendingCode: string;
  remediedCode: string;
  patchDescription: string;
  agentsInvolved: {
    detect: string;
    analyze: string;
    patch: string;
    validate: string;
  };
}

export interface HealingAttemptLog {
  timestamp: string;
  step: HealingStep;
  message: string;
  level: "info" | "warning" | "success" | "danger";
  details?: Record<string, any>;
}

export interface HealingSessionState {
  sessionId: string;
  activeStep: HealingStep;
  activeError: InjectableError | null;
  logs: HealingAttemptLog[];
  retryCount: number;
  maxRetries: number;
  retryStrategy: "exponential_backoff" | "prompt_refining" | "expanded_scope" | "linter_strict";
  patchApplied: { file: string; before: string; after: string; success: boolean } | null;
  rollbackTriggered: boolean;
  rollbackDetails: string | null;
  escalationTriggered: boolean;
  repeatFailuresCount: number;
  recoveryStatus: "idle" | "running" | "success" | "rolled_back" | "escalated";
}

// ---------------------------------------------------------
// Predefined Injectable Error Catalog (Real-world scenarios)
// ---------------------------------------------------------
export const INJECTABLE_ERRORS_CATALOG: InjectableError[] = [
  {
    id: "err_type_collision",
    name: "TypeScript Null-Safety Collision",
    classification: "TYPE_COLLISION",
    description: "Property 'decay_factor' in the memory collection can receive null value during indexing, which conflicts with strict typescript number mapping.",
    targetFile: "/src/types.ts",
    offendingLineNum: 50,
    offendingCode: "decay_factor: number;",
    remediedCode: "decay_factor: number | null;",
    patchDescription: "Modify type signature in types.ts to support null-union decay_factor mapping.",
    unhealedLog: `
> tsc --noEmit
src/lib/tool-system.ts(142,12): error TS2322: Type 'null' is not assignable to type 'number'.
  The offending node triggers decay_factor = null inside memory decay calculations.
  Stack trace:
    at evaluateWeights (/src/lib/tool-system.ts:145:18)
    at MemoryManagerView.tsx:54:122
    `,
    healingLog: `
> tsc --noEmit
Compilation completed successfully!
Found 0 typescript errors. Static code path is clean.
    `,
    agentsInvolved: {
      detect: "DebuggerAgent",
      analyze: "DebuggerAgent",
      patch: "CoderAgent",
      validate: "ProjectManagerAgent"
    }
  },
  {
    id: "err_syntax_brackets",
    name: "React Layout Token Syntax Error",
    classification: "SYNTAX_ERROR",
    description: "A dangling bracket or missing structural brace blocks compilation in the main entrypoint layout wrapper.",
    targetFile: "/src/App.tsx",
    offendingLineNum: 168,
    offendingCode: "  return <div>Active telemetry: {status;",
    remediedCode: "  return <div>Active telemetry: {status}</div>;",
    patchDescription: "Close React JSX interpolation curly braces and validate template closing elements.",
    unhealedLog: `
> vite build
vite v5.1.4 compiling bundle...
src/App.tsx(168,40): error TS1005: '}' expected.
src/App.tsx(169,1): error TS1109: Expression expected.
Failed to compile bundle: JSX template tokenizer failed.
    `,
    healingLog: `
> vite build
✓ 45 modules compiled in 1.1s.
Bundle output generated at /dist/index.html cleanly.
    `,
    agentsInvolved: {
      detect: "DebuggerAgent",
      analyze: "DebuggerAgent",
      patch: "CoderAgent",
      validate: "ProjectManagerAgent"
    }
  },
  {
    id: "err_lucide_tabs",
    name: "Duplicate/Missing Icon Import Exception",
    classification: "IMPORT_EXCEPTION",
    description: "Lucide icon 'Tabs' does not exist in standard lucide-react package versions, breaking the main component file.",
    targetFile: "/src/components/AgentFrameworkView.tsx",
    offendingLineNum: 18,
    offendingCode: "import { Tabs, Brain, Clock } from 'lucide-react';",
    remediedCode: "import { Brain, Clock } from 'lucide-react';",
    patchDescription: "Remove 'Tabs' mock reference and replace usage with custom styled tab nodes using standard dividers.",
    unhealedLog: `
> tsc --noEmit
src/components/AgentFrameworkView.tsx(18,10): error TS2305: Module '"lucide-react"' has no exported member 'Tabs'.
Failed inside static bundle preparation.
    `,
    healingLog: `
> tsc --noEmit
Verification succeeded. All visual imports are correctly resolved.
    `,
    agentsInvolved: {
      detect: "DebuggerAgent",
      analyze: "DocumentationAgent",
      patch: "CoderAgent",
      validate: "ProjectManagerAgent"
    }
  },
  {
    id: "err_missing_dep",
    name: "Missing Framework Dependency Lock",
    classification: "MISSING_DEPENDENCY",
    description: "Compiler breaks due to missing peer dependency 'framer-motion' required by custom animations loops.",
    targetFile: "/package.json",
    offendingLineNum: 6,
    offendingCode: `"dependencies": { "react": "^18.2.0" }`,
    remediedCode: `"dependencies": { "react": "^18.2.0", "framer-motion": "^10.15.0" }`,
    patchDescription: "Add missing dependencies into project package.json and trigger background package synchronization.",
    unhealedLog: `
> npm run build
Error: Cannot find module 'framer-motion'
Module resolution failed recursively from /src/main.tsx
Exit code: 1
    `,
    healingLog: `
> npm run build
Successfully installed 'framer-motion' peer dependency.
Vite compiled successfully in 1.6s.
    `,
    agentsInvolved: {
      detect: "DevOpsAgent",
      analyze: "DevOpsAgent",
      patch: "CoderAgent",
      validate: "ProjectManagerAgent"
    }
  },
  {
    id: "err_security_invariant",
    name: "Broad Insecure Database Access rule",
    classification: "SECURITY_INVARIANT_VIOLATION",
    description: "The Firestore ruleset has wide-open permission definitions, allowing unauthenticated remote read-write access to private keys databases.",
    targetFile: "/firestore.rules",
    offendingLineNum: 3,
    offendingCode: "allow read, write: if true;",
    remediedCode: "allow read, write: if request.auth != null;",
    patchDescription: "Restrict Firestore security access, forcing validated identity check guidelines on all collections.",
    unhealedLog: `
> secops-audit --rules /firestore.rules
[CRITICAL] Security rule leak: Plaintext database allowing global remote writes.
OWASP Top-10 Invariant breached: Broken Object Level Authorization (BOLA).
Status: FAILING AUDIT
    `,
    healingLog: `
> secops-audit --rules /firestore.rules
Zero high-risk security flaws found. Access boundaries fully enforced.
Status: SECURE PASSED
    `,
    agentsInvolved: {
      detect: "SecurityAgent",
      analyze: "SecurityAgent",
      patch: "CoderAgent",
      validate: "ProjectManagerAgent"
    }
  }
];

// Helper to determine strategy metrics (retry delays, explanation prompts)
export const getStrategyDescription = (
  strategy: HealingSessionState["retryStrategy"]
): { title: string; delay: number; detail: string } => {
  switch (strategy) {
    case "exponential_backoff":
      return {
        title: "Exponential Backoff & Thread Desynchronization",
        delay: 2000,
        detail: "Applies a state throttle to avoid write-race conditions across dual-core virtual machines."
      };
    case "prompt_refining":
      return {
        title: "Prompt Reflexive Self-Correction",
        delay: 1500,
        detail: "Refines instruction context matching precise compiler traces to create strict code guidelines."
      };
    case "expanded_scope":
      return {
        title: "Expanded Architecture Scope Reasoning",
        delay: 2500,
        detail: "Instructs DebuggerAgent to search parent workspace files to avoid regression breaks."
      };
    case "linter_strict":
      return {
        title: "Strict Linter Verification Gateways",
        delay: 3000,
        detail: "Enforces non-emitting tsc verification after each intermediate code chunk."
      };
  }
};
