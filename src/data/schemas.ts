import { SchemaItem } from "../types";

export const SCHEMAS_DATA: SchemaItem[] = [
  {
    name: "AgentTask",
    description: "The atomic command/directive assigned to an Orchestrator or Sub-Agent for goal execution.",
    fields: [
      { name: "task_id", type: "UUID", desc: "Global unique tracking ID." },
      { name: "parent_id", type: "UUID (Optional)", desc: "Upstream super-task referential link if part of a sub-delegation sequence." },
      { name: "title", type: "str", desc: "Short human-scannable label.", validation: "Min: 2 chars, Max: 256 chars" },
      { name: "description", type: "str", desc: "Detailed, concrete directive outlining requirements and evaluation criteria." },
      { name: "status", type: "TaskStatus (Enum)", desc: "Current location inside the task lifecycle.", validation: "One of TaskStatus values" },
      { name: "priority", type: "int", desc: "Heuristic scheduling weight.", validation: "Integer from 0 (lowest) to 10 (emergency hotfix)" },
      { name: "assigned_agent", type: "str", desc: "Target agent class designator (e.g., 'planner', 'coder_agent')." },
      { name: "inputs", type: "Dict[str, Any]", desc: "Structured parameters representing context, target files, or parameters." },
      { name: "created_at", type: "datetime", desc: "UTC creation timestamp." },
      { name: "updated_at", type: "datetime", desc: "Timestamp monitoring transition state updates." }
    ],
    relationships: [
      "Referenced as a child dependency in TaskNode.",
      "Mapped as parent relationship to child tasks via parent_id.",
      "Triggers the creation of an AgentResult in successful terminal phases."
    ],
    states: [
      "PENDING: Task registered, waiting on scheduling queues.",
      "QUEUED: Dependencies resolved, ready for immediate thread allocation.",
      "RUNNING: Active sub-agents running reasoning and tool execution loops.",
      "BLOCKED: Waiting on system resource checks or developer authorization.",
      "COMPLETED: Terminal success. Resolves successfully to AgentResult.",
      "FAILED: Terminal failure. Error traces logged and downstream branches skipped.",
      "CANCELLED: Explicitly halted by user controls before completing."
    ],
    code: `class AgentTask(BaseModel):
    task_id: UUID = Field(default_factory=uuid4)
    parent_id: Optional[UUID] = Field(None)
    title: str = Field(..., min_length=2, max_length=256)
    description: str = Field(...)
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    priority: int = Field(default=1, ge=0, le=10)
    assigned_agent: str = Field(...)
    inputs: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)`
  },
  {
    name: "AgentResult",
    description: "The terminal output synthesis generated upon completion of an assigned AgentTask.",
    fields: [
      { name: "result_id", type: "UUID", desc: "General transaction identifier key." },
      { name: "task_id", type: "UUID", desc: "Target matching key referencing the originating AgentTask." },
      { name: "success", type: "bool", desc: "Declares whether execution criteria successfully met the definition of done." },
      { name: "output", type: "Dict[str, Any]", desc: "Aggregated results, modified file lists, or written content summaries." },
      { name: "error", type: "str (Optional)", desc: "Verbose descriptive error details or diagnostic logs if execution fails." },
      { name: "resolved_at", type: "datetime", desc: "UTC timestamp marking termination." }
    ],
    relationships: [
      "Always binds 1-to-1 against an originating AgentTask ID.",
      "Captured as logs trace inside the Episodic Memory zone."
    ],
    states: [
      "SUCCESS: Mapped to True when the agent solves inputs and passes verification checks.",
      "FAILURE: Mapped to False when exceptions inside tools or structural checks break loops."
    ],
    code: `class AgentResult(BaseModel):
    result_id: UUID = Field(default_factory=uuid4)
    task_id: UUID = Field(...)
    success: bool = Field(...)
    output: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = Field(None)
    resolved_at: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode="after")
    def validate_outcome_consistency(self) -> "AgentResult":
        if not self.success and not self.error:
            raise ValueError("Failure requires an associated error message.")
        if self.success and self.error:
            raise ValueError("Successful outcomes must not host error fields.")
        return self`
  },
  {
    name: "ProviderResponse",
    description: "Standardized translation wrapper parsing provider outputs, token consumption tracks, and errors.",
    fields: [
      { name: "response_id", type: "UUID", desc: "Internal telemetry tracing identification key for this provider action." },
      { name: "request_id", type: "UUID", desc: "Reference trace matching the initiating ProviderRequest ID." },
      { name: "text", type: "str (Optional)", desc: "Raw textual response synthesized by LLM patterns." },
      { name: "tool_calls", type: "List[Dict[str, Any]] (Optional)", desc: "Extracted arrays detailing downstream tool invocations generated by the LLM." },
      { name: "finish_reason", type: "str", desc: "Token terminal state indicator (e.g., 'stop', 'length', 'tool_calls')." },
      { name: "prompt_tokens", type: "int", desc: "Input tokens consumed.", validation: "Must be >= 0" },
      { name: "completion_tokens", type: "int", desc: "Output tokens compiled by LLM.", validation: "Must be >= 0" },
      { name: "received_at", type: "datetime", desc: "Timestamp indicating response receipt and completion." }
    ],
    relationships: [
      "Synthesized by model connectors dispatched via ProviderRouter.",
      "Triggers cascading ToolRequest schemas if tool_calls array is populated."
    ],
    code: `class ProviderResponse(BaseModel):
    response_id: UUID = Field(default_factory=uuid4)
    request_id: UUID = Field(...)
    text: Optional[str] = Field(None)
    tool_calls: Optional[List[Dict[str, Any]]] = Field(None)
    finish_reason: str = Field(...)
    prompt_tokens: int = Field(..., ge=0)
    completion_tokens: int = Field(..., ge=0)
    received_at: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode="after")
    def validate_payload_presence(self) -> "ProviderResponse":
        if not self.text and not self.tool_calls:
            raise ValueError("Must supply either text contents or tool_calls.")
        return self`
  },
  {
    name: "MemoryEntry",
    description: "Unit cell stored in context memory structures mapping cognitive representations, weights, and embeddings.",
    fields: [
      { name: "memory_id", type: "UUID", desc: "Lookup vector storage address UUID." },
      { name: "type", type: "MemoryType (Enum)", desc: "Partition assignment detailing caching behaviors (WORKING / EPISODIC / SEMANTIC / PROCEDURAL)." },
      { name: "content", type: "str", desc: "Serialized text fact, schema, context, or execution trace." },
      { name: "vector_embedding", type: "List[float] (Optional)", desc: "Dense coordinate vector representation." },
      { name: "metadata", type: "Dict[str, Any]", desc: "Utility hashtags, decay guidelines, and origin tags." },
      { name: "created_at", type: "datetime", desc: "Chronological generation timestamp." },
      { name: "decay_factor", type: "float", desc: "Salience coefficient weight that counts down unless matched.", validation: "Numeric float from 0.0 to 1.0" }
    ],
    relationships: [
      "Queried by AgentDispatcher during task setups.",
      "Consolidated from WORKING to SEMANTIC schemas during Orchestrator terminal phases."
    ],
    code: `class MemoryEntry(BaseModel):
    memory_id: UUID = Field(default_factory=uuid4)
    type: MemoryType = Field(...)
    content: str = Field(...)
    vector_embedding: Optional[List[float]] = Field(None)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    decay_factor: float = Field(default=1.0, ge=0.0, le=1.0)`
  }
];
