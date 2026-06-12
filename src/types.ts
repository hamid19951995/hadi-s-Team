export enum NodeStatus {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export enum TaskStatus {
  PENDING = "pending",
  QUEUED = "queued",
  RUNNING = "running",
  BLOCKED = "blocked",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum MemoryType {
  EPISODIC = "episodic",
  SEMANTIC = "semantic",
  PROCEDURAL = "procedural",
  WORKING = "working",
}

export interface TaskNode {
  node_id: string;
  title: string;
  description: string;
  assigned_agent: string;
  status: NodeStatus;
  dependencies: string[];
  started_at?: string;
  ended_at?: string;
}

export interface SystemEvent {
  event_id: string;
  source: string;
  topic: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  payload: Record<string, any>;
  timestamp: string;
}

export interface MemoryEntry {
  memory_id: string;
  type: MemoryType;
  content: string;
  decay_factor: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ModelMetric {
  prompt_tokens: number;
  completion_tokens: number;
  latencies: number[];
  health: boolean;
}

export interface CapabilityItem {
  id: string;
  name: string;
  subsystem: string;
  agent: string;
  tool: string;
  data_flow: string;
  responsibilities: string[];
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  dependencies: string[];
  failure_modes: string[];
}

export interface SchemaItem {
  name: string;
  description: string;
  fields: { name: string; type: string; desc: string; validation?: string }[];
  relationships: string[];
  states?: string[];
  code: string;
}

export interface AgentTool {
  name: string;
  purpose: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface AgentStructuredOutputField {
  name: string;
  type: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  iconName: string;
  capabilities: string[];
  toolRegistry: AgentTool[];
  reasoningStrategy: {
    name: string;
    description: string;
    steps: string[];
  };
  structuredOutput: {
    schemaTitle: string;
    fields: AgentStructuredOutputField[];
    mockOutputExample: Record<string, any>;
  };
}

