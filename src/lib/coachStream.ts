/** Parse OpenAI-compatible server-sent events without storing incomplete replies. */
export async function readCoachStream(
  stream: ReadableStream<Uint8Array>,
  onText: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "", reply = "";
  let finished = false;
  const abort = () => { void reader.cancel().catch(() => undefined); };
  const ensureActive = () => {
    if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
  };
  function line(raw: string) {
    const value = raw.replace(/\r$/, "");
    if (!value.startsWith("data:")) return;
    const data = value.slice(5).trim();
    if (!data) return;
    if (data === "[DONE]") { finished = true; return; }
    let parsed: unknown;
    try { parsed = JSON.parse(data); }
    catch { throw new Error("The tutor returned an invalid response."); }
    if (!parsed || typeof parsed !== "object" || "error" in parsed) throw new Error("The tutor response was interrupted.");
    const choice = (parsed as { choices?: { delta?: { content?: unknown }; finish_reason?: unknown }[] }).choices?.[0];
    const chunk = choice?.delta?.content;
    if (typeof chunk === "string" && chunk) {
      if (reply.length + chunk.length > 12000) throw new Error("The tutor response exceeded the supported length.");
      reply += chunk;
      onText(chunk);
    }
    const reason = choice?.finish_reason;
    if (reason === "stop") finished = true;
    else if (reason != null) throw new Error("The tutor response ended before completion.");
  }
  signal?.addEventListener("abort", abort, { once: true });
  try {
    ensureActive();
    while (!finished) {
      const { done, value } = await reader.read();
      ensureActive();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let newline: number;
      while (!finished && (newline = buffer.indexOf("\n")) !== -1) {
        const raw = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        line(raw);
      }
      if (buffer.length > 262144) throw new Error("The tutor returned an oversized event.");
      if (done) {
        if (!finished && buffer.trim()) line(buffer);
        break;
      }
    }
    if (!finished || !reply.trim()) throw new Error("The tutor response was interrupted. Please try again.");
    return reply;
  } finally {
    signal?.removeEventListener("abort", abort);
    try { await reader.cancel(); } catch { /* The stream may have already closed. */ }
    reader.releaseLock();
  }
}
