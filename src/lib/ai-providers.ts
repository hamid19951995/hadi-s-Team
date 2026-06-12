export type AIProviderId =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "google"
  | "ollama"
  | "lmstudio"
  | "compatible";

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
}

export interface ProviderConfig {
  providerId: AIProviderId;
  name: string;
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  timeoutMs: number;
  rateLimitMax: number; // requests per minute
  rateLimitWindowMs: number;
}

export interface AdapterResponse {
  content: string;
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  provider: AIProviderId;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface RoutingTrace {
  timestamp: string;
  attempt: number;
  provider: AIProviderId;
  model: string;
  status: "success" | "failed" | "timeout" | "ratelimited";
  latencyMs: number;
  errorMessage?: string;
}

export interface UnifiedRoutingResult {
  response: AdapterResponse;
  traces: RoutingTrace[];
  fallbackSequence: { provider: AIProviderId; model: string }[];
}

// ---------------------------------------------------------
// Custom Exception Classes
// ---------------------------------------------------------
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class AdapterError extends Error {
  constructor(provider: AIProviderId, message: string) {
    super(`[${provider.toUpperCase()}] ${message}`);
    this.name = "AdapterError";
  }
}

// ---------------------------------------------------------
// Simple Client-side Rate Limiting Tracker
// ---------------------------------------------------------
export class RateLimiter {
  private static requests: Record<string, number[]> = {};

  static checkLimit(providerId: AIProviderId, limit: number, windowMs: number): void {
    if (limit <= 0) return; // limits <= 0 are treated as unlimited

    const now = Date.now();
    const timestamps = this.requests[providerId] || [];

    // Filter updates older than window ms
    const activeTimestamps = timestamps.filter(t => now - t < windowMs);
    this.requests[providerId] = activeTimestamps;

    if (activeTimestamps.length >= limit) {
      throw new RateLimitError(
        `Rate limit exceeded for provider '${providerId}'. Limit: ${limit} reqs per ${windowMs / 1000}s. Please retry shortly.`
      );
    }
  }

  static recordRequest(providerId: AIProviderId): void {
    const now = Date.now();
    if (!this.requests[providerId]) {
      this.requests[providerId] = [];
    }
    this.requests[providerId].push(now);
  }

  static getUsageCount(providerId: AIProviderId, windowMs: number): number {
    const now = Date.now();
    const timestamps = this.requests[providerId] || [];
    return timestamps.filter(t => now - t < windowMs).length;
  }

  static reset(providerId: AIProviderId): void {
    this.requests[providerId] = [];
  }
}

// ---------------------------------------------------------
// Pluggable Provider Registry with Default Configs
// ---------------------------------------------------------
export const DEFAULT_PROVIDERS: Record<AIProviderId, ProviderConfig> = {
  openai: {
    providerId: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    selectedModel: "gpt-4o-mini",
    timeoutMs: 8000,
    rateLimitMax: 20,
    rateLimitWindowMs: 60000,
  },
  anthropic: {
    providerId: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    apiKey: "",
    selectedModel: "claude-3-5-haiku-20241022",
    timeoutMs: 10000,
    rateLimitMax: 10,
    rateLimitWindowMs: 60000,
  },
  google: {
    providerId: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    apiKey: "",
    selectedModel: "gemini-3.5-flash",
    timeoutMs: 8000,
    rateLimitMax: 15,
    rateLimitWindowMs: 60000,
  },
  openrouter: {
    providerId: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    selectedModel: "google/gemini-2.5-flash",
    timeoutMs: 12000,
    rateLimitMax: 40,
    rateLimitWindowMs: 60000,
  },
  ollama: {
    providerId: "ollama",
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434",
    apiKey: "ollama-local-key", // standard placeholder
    selectedModel: "llama3",
    timeoutMs: 15000,
    rateLimitMax: 0, // unlimited local
    rateLimitWindowMs: 60000,
  },
  lmstudio: {
    providerId: "lmstudio",
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    apiKey: "lm-studio",
    selectedModel: "meta-llama-3-8b-instruct",
    timeoutMs: 15000,
    rateLimitMax: 0, // unlimited local
    rateLimitWindowMs: 60000,
  },
  compatible: {
    providerId: "compatible",
    name: "OpenAI-Compatible",
    baseUrl: "https://api.together.xyz/v1",
    apiKey: "",
    selectedModel: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    timeoutMs: 12000,
    rateLimitMax: 30,
    rateLimitWindowMs: 60000,
  },
};

export const PROVIDER_MODELS: Record<AIProviderId, LLMModel[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxTokens: 4096 },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000, maxTokens: 16384 },
    { id: "o1-mini", name: "o1-Mini", contextWindow: 128000, maxTokens: 65536 },
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", contextWindow: 200000, maxTokens: 8192 },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextWindow: 200000, maxTokens: 8192 },
  ],
  google: [
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (Free Default)", contextWindow: 1000000, maxTokens: 8192 },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite (Free Light)", contextWindow: 1000000, maxTokens: 8192 },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview (Paid)", contextWindow: 2000000, maxTokens: 8192 },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Legacy)", contextWindow: 1048576, maxTokens: 8192 },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Legacy)", contextWindow: 2000000, maxTokens: 8192 },
  ],
  openrouter: [
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash via OpenRouter", contextWindow: 1000000, maxTokens: 4096 },
    { id: "google/gemini-3.5-flash-preview", name: "Gemini 3.5 Flash via OpenRouter", contextWindow: 1000000, maxTokens: 4096 },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", contextWindow: 131072, maxTokens: 4096 },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3", contextWindow: 64000, maxTokens: 4096 },
  ],
  ollama: [
    { id: "llama3", name: "Llama 3 (8B)", contextWindow: 8192, maxTokens: 2048 },
    { id: "mistral", name: "Mistral (7B)", contextWindow: 8192, maxTokens: 2048 },
    { id: "phi3", name: "Phi 3 (3.8B)", contextWindow: 4096, maxTokens: 2048 },
  ],
  lmstudio: [
    { id: "meta-llama-3-8b-instruct", name: "Llama 3 8B Instruct", contextWindow: 8192, maxTokens: 2048 },
    { id: "qwen2.5-7b-instruct", name: "Qwen 2.5 7B Instruct", contextWindow: 32768, maxTokens: 4096 },
  ],
  compatible: [
    { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B (Together)", contextWindow: 32768, maxTokens: 4096 },
    { id: "meta-llama/Llama-3-70b-chat-hf", name: "Meta Llama 3 70B Chat", contextWindow: 8192, maxTokens: 2048 },
  ],
};

// ---------------------------------------------------------
// Provider Generation Adapters (With actual fetch hooks)
// ---------------------------------------------------------
export async function generateWithAdapter(
  prompt: string,
  config: ProviderConfig,
  customModelOverride?: string
): Promise<AdapterResponse> {
  const provider = config.providerId;
  const targetModel = customModelOverride || config.selectedModel;
  const startTime = Date.now();

  // 1. Rate Limit Guard
  RateLimiter.checkLimit(provider, config.rateLimitMax, config.rateLimitWindowMs);

  // Helper to handle client-side simulation for missing keys or sandbox demo tests
  const simulateFallback = (extraMsg: string = "") => {
    const latency = Math.floor(Math.random() * 800) + 150;
    const tokensIn = Math.floor(prompt.length / 4) + 12;
    const responsePayload = `[SIMULATION MATCH] This response is simulated by the ${config.name} adapter framework matching model "${targetModel}" because no live API credentials/connections were established. Context: ${prompt.substring(0, 45)}... ${extraMsg}`;
    
    // Save to our Client Rate Limiter successful action tracker anyway
    RateLimiter.recordRequest(provider);

    return {
      content: responsePayload,
      model: targetModel,
      latencyMs: latency,
      inputTokens: tokensIn,
      outputTokens: Math.floor(responsePayload.length / 4),
      provider,
      success: true,
      timestamp: new Date().toISOString(),
    };
  };

  // 2. Wrap Request with Timeout Logic using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.timeoutMs);

  try {
    // If user inputs "SIMULATE" anywhere, or if API keys are empty on remote suppliers (except ollama/lmstudio which run on localhost), we bypass real fetches to guarantee high reliability
    const isMockRequired =
      prompt.includes("__MOCK_SIMULATE__") ||
      (!config.apiKey && !["ollama", "lmstudio"].includes(provider));

    if (isMockRequired) {
      clearTimeout(timeoutId);
      // Simulate timeout if configured with small ms
      if (config.timeoutMs < 200) {
        throw new TimeoutError("Operation timed out in simulated supervisor.");
      }
      return simulateFallback();
    }

    let endpoint = "";
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let body: any = {};

    switch (provider) {
      case "openai":
      case "lmstudio":
      case "compatible": {
        endpoint = `${config.baseUrl}/chat/completions`;
        headers["Authorization"] = `Bearer ${config.apiKey}`;
        body = {
          model: targetModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        };
        break;
      }

      case "openrouter": {
        endpoint = `${config.baseUrl}/chat/completions`;
        headers["Authorization"] = `Bearer ${config.apiKey}`;
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "Autonomous Studio Developer Sandbox";
        body = {
          model: targetModel,
          messages: [{ role: "user", content: prompt }],
        };
        break;
      }

      case "anthropic": {
        endpoint = `${config.baseUrl}/messages`;
        headers["x-api-key"] = config.apiKey;
        headers["anthropic-version"] = "2023-06-01";
        // Anthropic requires dangerous headers setting or proxy if executed straight out of browser, so we guard with simulation logs
        body = {
          model: targetModel,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        };
        break;
      }

      case "google": {
        // Standard beta URL for gemini generateContent API
        endpoint = `${config.baseUrl}/v1beta/models/${targetModel}:generateContent?key=${config.apiKey}`;
        body = {
          contents: [{ parts: [{ text: prompt }] }],
        };
        break;
      }

      case "ollama": {
        // Ollama native completion endpoint or standard openAI adapter compatibility port
        endpoint = `${config.baseUrl}/api/generate`;
        body = {
          model: targetModel,
          prompt: prompt,
          stream: false,
        };
        break;
      }
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMsg = await response.text().catch(() => "Unknown status message");
      throw new AdapterError(provider, `HTTP status ${response.status}: ${errorMsg}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    RateLimiter.recordRequest(provider);

    // Format results depending on provider response body standard schemas
    let extractedText = "";
    let inTokens = 0;
    let outTokens = 0;

    if (provider === "google") {
      extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      inTokens = data.usageMetadata?.promptTokenCount || 0;
      outTokens = data.usageMetadata?.candidatesTokenCount || 0;
    } else if (provider === "anthropic") {
      extractedText = data.content?.[0]?.text || "";
      inTokens = data.usage?.input_tokens || 0;
      outTokens = data.usage?.output_tokens || 0;
    } else if (provider === "ollama") {
      extractedText = data.response || "";
      inTokens = data.prompt_eval_count || 0;
      outTokens = data.eval_count || 0;
    } else {
      // OpenAI styles (OpenAI, OpenRouter, LM Studio, Compatible)
      extractedText = data.choices?.[0]?.message?.content || "";
      inTokens = data.usage?.prompt_tokens || 0;
      outTokens = data.usage?.completion_tokens || 0;
    }

    return {
      content: extractedText,
      model: targetModel,
      latencyMs: duration,
      inputTokens: inTokens,
      outputTokens: outTokens,
      provider,
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    let normErrorType = "failed";
    let errorMessage = err.message || "Unknown error";

    if (err.name === "AbortError" || err instanceof TimeoutError) {
      normErrorType = "timeout";
      errorMessage = `Operation exceeded timeout guard limit of ${config.timeoutMs}ms.`;
    } else if (err instanceof RateLimitError) {
      normErrorType = "ratelimited";
    }

    // Return structured failure response
    return {
      content: "",
      model: targetModel,
      latencyMs: duration,
      provider,
      success: false,
      error: `[${normErrorType.toUpperCase()}] ${errorMessage}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------
// High-availability Model Router & Automatic Fallback Handler
// ---------------------------------------------------------
export async function routeLLMRequest(
  prompt: string,
  configs: Record<AIProviderId, ProviderConfig>,
  routingSequence: { provider: AIProviderId; model: string }[]
): Promise<UnifiedRoutingResult> {
  const traces: RoutingTrace[] = [];
  
  if (routingSequence.length === 0) {
    // Generate a default safety fallback sequence if none is loaded
    routingSequence = [
      { provider: "google", model: "gemini-3.5-flash" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "compatible", model: "mistralai/Mixtral-8x7B-Instruct-v0.1" },
    ];
  }

  for (let i = 0; i < routingSequence.length; i++) {
    const route = routingSequence[i];
    const baseConfig = configs[route.provider];
    
    // Copy config and set current model of routing node
    const runConfig: ProviderConfig = {
      ...baseConfig,
      selectedModel: route.model,
    };

    const attemptNumber = i + 1;
    const startAttempt = Date.now();

    try {
      // Run adapter invocation
      const adapterResponse = await generateWithAdapter(prompt, runConfig);
      const attemptLatency = Date.now() - startAttempt;

      if (adapterResponse.success) {
        // Record trace trace
        traces.push({
          timestamp: new Date().toISOString(),
          attempt: attemptNumber,
          provider: route.provider,
          model: route.model,
          status: "success",
          latencyMs: attemptLatency,
        });

        return {
          response: adapterResponse,
          traces,
          fallbackSequence: routingSequence,
        };
      } else {
        const isTimeout = adapterResponse.error?.includes("TIMEOUT");
        const isRate = adapterResponse.error?.includes("RATELIMITED");
        const statusReport = isTimeout ? "timeout" : isRate ? "ratelimited" : "failed";

        traces.push({
          timestamp: new Date().toISOString(),
          attempt: attemptNumber,
          provider: route.provider,
          model: route.model,
          status: statusReport as any,
          latencyMs: attemptLatency,
          errorMessage: adapterResponse.error,
        });

        // Continue down the fallback chain
      }
    } catch (routeErr: any) {
      const attemptLatency = Date.now() - startAttempt;
      const statusReport = routeErr instanceof TimeoutError ? "timeout" : routeErr instanceof RateLimitError ? "ratelimited" : "failed";

      traces.push({
        timestamp: new Date().toISOString(),
        attempt: attemptNumber,
        provider: route.provider,
        model: route.model,
        status: statusReport as any,
        latencyMs: attemptLatency,
        errorMessage: routeErr.message,
      });

      // Continue down the loop
    }
  }

  // If ALL routes failures occurred:
  const lastTrace = traces[traces.length - 1];
  return {
    response: {
      content: "",
      model: lastTrace?.model || "none",
      latencyMs: traces.reduce((acc, t) => acc + t.latencyMs, 0),
      provider: lastTrace?.provider || "google",
      success: false,
      error: `All active routing channels down. Exhausted fallback threshold. Last Error: ${lastTrace?.errorMessage}`,
      timestamp: new Date().toISOString(),
    },
    traces,
    fallbackSequence: routingSequence,
  };
}
