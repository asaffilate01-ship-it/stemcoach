export type CoachMessage = { role: "user" | "assistant"; content: string };

/** The same bounded history is used for server storage and recovery. */
export function normaliseCoachThread(value: unknown): CoachMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((message): message is CoachMessage =>
    typeof message === "object" && message !== null &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" && message.content.trim().length > 0,
  ).slice(-60).map(({ role, content }) => ({ role, content: content.slice(0, 12000) }));
}

/** Superseded requests cannot write into a different tutor's conversation. */
export class CoachRequestScope {
  private active: AbortController | null = null;
  begin(): AbortController {
    this.cancel();
    const request = new AbortController();
    this.active = request;
    return request;
  }
  isCurrent(request: AbortController): boolean {
    return this.active === request && !request.signal.aborted;
  }
  cancel(): void {
    this.active?.abort();
    this.active = null;
  }
  finish(request: AbortController): void {
    if (this.active === request) this.active = null;
  }
}
