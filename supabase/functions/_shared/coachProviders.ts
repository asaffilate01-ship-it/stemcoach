/** Server-only provider routing. No credentials, provider selection or URLs
 * are accepted from the browser. Direct routes require operator opt-in. */
export type CoachProvider = "gateway" | "openai" | "claude" | "gemini" | "qwen";
export type CoachTurn = { role: "user" | "assistant"; content: string };
type Env = (name: string) => string | undefined;
type ProviderConfig = { provider: CoachProvider; endpoint: string; key: string; model: string };

const choices: readonly CoachProvider[] = ["gateway", "openai", "claude", "gemini", "qwen"];
const endpoints = {
  gateway: "https://ai.gateway.lovable.dev/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  claude: "https://api.anthropic.com/v1/messages",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
};
const keyNames = {
  gateway: "LOVABLE_API_KEY", openai: "OPENAI_API_KEY", claude: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY", qwen: "DASHSCOPE_API_KEY",
};

function qwenEndpoint(raw: string | undefined): string {
  if (!raw) throw new Error("Qwen region is not configured");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Invalid Qwen endpoint"); }
  const legacy = /^(dashscope|dashscope-intl|dashscope-us|cn-hongkong\.dashscope)\.aliyuncs\.com$/;
  const dedicated = /^[a-z0-9-]+\.(ap-southeast-1|us-east-1|cn-beijing|cn-hongkong|ap-northeast-1)\.maas\.aliyuncs\.com$/;
  if (url.protocol !== "https:" || url.port || url.username || url.password ||
      url.search || url.hash || (!legacy.test(url.hostname) && !dedicated.test(url.hostname)) ||
      !["/compatible-mode/v1", "/compatible-mode/v1/"].includes(url.pathname)) {
    throw new Error("Invalid Qwen endpoint");
  }
  return url.origin + "/compatible-mode/v1/chat/completions";
}

export function resolveCoachProvider(env: Env): ProviderConfig {
  const raw = env("STEMCOACH_AI_PROVIDER") || "gateway";
  const provider = choices.find(value => value === raw);
  if (!provider) throw new Error("Unknown coach provider");
  if (provider !== "gateway" && env("STEMCOACH_DIRECT_AI_ENABLED") !== "true") {
    throw new Error("Direct coach provider is not approved");
  }
  const key = env(keyNames[provider])?.trim();
  if (!key) throw new Error("Coach provider credential is not configured");
  const model = env("STEMCOACH_AI_MODEL")?.trim() ||
    (provider === "gateway" ? "google/gemini-3-flash-preview" : "");
  if (!model || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,159}$/.test(model)) {
    throw new Error("Coach model is not configured");
  }
  const endpoint = provider === "qwen" ? qwenEndpoint(env("STEMCOACH_QWEN_BASE_URL")) : endpoints[provider];
  return { provider, endpoint, key, model };
}

function clientEvent(value: unknown): Uint8Array {
  return new TextEncoder().encode("data: " + (value === "[DONE]" ? value : JSON.stringify(value)) + "\n\n");
}

/** Convert Claude Messages SSE into the same text-only completion stream as
 * the existing gateway. Thinking, tool events and private metadata never
 * become learner-visible content. An incomplete stream never emits DONE. */
export function normaliseClaudeStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  let buffer = "", terminal = false, stopReason: string | undefined;
  let closed = false;
  async function release(cancel: boolean) {
    if (closed) return;
    closed = true;
    try { if (cancel) await reader.cancel(); } finally { reader.releaseLock(); }
  }
  function handle(raw: string, output: ReadableStreamDefaultController<Uint8Array>) {
    const line = raw.replace(/\r$/, "");
    if (!line.startsWith("data:")) return;
    const body = line.slice(5).trim();
    if (!body) return;
    const event = JSON.parse(body);
    if (!event || typeof event !== "object" || event.type === "error") throw new Error("Provider stream error");
    if (event.type === "content_block_start" && event.content_block?.type === "text" && typeof event.content_block.text === "string" && event.content_block.text) {
      output.enqueue(clientEvent({ choices: [{ delta: { content: event.content_block.text } }] }));
    }
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && typeof event.delta.text === "string") {
      output.enqueue(clientEvent({ choices: [{ delta: { content: event.delta.text } }] }));
    }
    if (event.type === "message_delta" && typeof event.delta?.stop_reason === "string") stopReason = event.delta.stop_reason;
    if (event.type === "message_stop") {
      if (stopReason !== "end_turn" && stopReason !== "stop_sequence") throw new Error("Provider reply incomplete");
      terminal = true;
      output.enqueue(clientEvent("[DONE]"));
    }
  }
  return new ReadableStream<Uint8Array>({
    async pull(output) {
      try {
        // Keep reading until an output event is queued, or the source closes.
        do {
          const { done, value } = await reader.read();
          if (closed) return;
          buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
          let index: number;
          while (!terminal && (index = buffer.indexOf("\n")) !== -1) {
            const raw = buffer.slice(0, index);
            if (raw.length > 262144) throw new Error("Oversized provider event");
            buffer = buffer.slice(index + 1);
            handle(raw, output);
          }
          if (buffer.length > 262144) throw new Error("Oversized provider event");
          if (done && !terminal && buffer.trim()) handle(buffer, output);
          if (terminal) { output.close(); await release(true); return; }
          if (done) throw new Error("Provider reply interrupted");
        } while ((output.desiredSize ?? 0) > 0);
      } catch {
        if (!closed) { output.error(new Error("Coaching response interrupted")); await release(true).catch(() => undefined); }
      }
    },
    async cancel() { await release(true); },
  });
}

/** Exactly one configured provider call; never retry with another processor.
 * Authentication, entitlement and rate limits remain in ai-chat. */
export async function requestCoachCompletion(
  env: Env, systemPrompt: string, turns: readonly CoachTurn[], signal?: AbortSignal,
  transport: typeof fetch = fetch,
): Promise<Response> {
  const config = resolveCoachProvider(env);
  const claude = config.provider === "claude";
  const headers: Record<string, string> = claude
    ? { "x-api-key": config.key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }
    : { Authorization: "Bearer " + config.key, "Content-Type": "application/json" };
  const body = claude
    ? { model: config.model, system: systemPrompt, messages: turns, max_tokens: 2048, stream: true }
    : { model: config.model, messages: [{ role: "system", content: systemPrompt }, ...turns], stream: true,
        ...(config.provider === "openai" ? { store: false } : {}) };
  const result = await transport(config.endpoint, { method: "POST", headers, body: JSON.stringify(body), signal, redirect: "error" });
  if (!result.ok || !result.body) return result;
  if (!claude) return result;
  return new Response(normaliseClaudeStream(result.body), { status: result.status, headers: { "Content-Type": "text/event-stream" } });
}
