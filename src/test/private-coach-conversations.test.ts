import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CoachRequestScope, normaliseCoachThread } from "@/lib/coachThread";

describe("private coach conversations", () => {
  it("keeps only bounded valid user and assistant messages without extra metadata", () => {
    const raw = [
      { role: "system", content: "Untrusted role" },
      null, { role: "assistant", content: 123 }, { role: "user", content: "   " },
      { role: "user", content: "Question", privateId: "omit-me" },
      { role: "assistant", content: "Answer" },
    ];
    expect(normaliseCoachThread(raw)).toEqual([
      { role: "user", content: "Question" }, { role: "assistant", content: "Answer" },
    ]);
    expect(normaliseCoachThread(null)).toEqual([]);
    const history = Array.from({ length: 70 }, (_, i) => ({ role: "user", content: String(i) }));
    expect(normaliseCoachThread(history)).toHaveLength(60);
    expect(normaliseCoachThread(history)[0].content).toBe("10");
    expect(normaliseCoachThread([{ role: "assistant", content: "x".repeat(13000) }])[0].content).toHaveLength(12000);
  });
  it("aborts an old request and never lets its completion reset the newer request", () => {
    const scope = new CoachRequestScope();
    const first = scope.begin();
    expect(scope.inFlight).toBe(true);
    const second = scope.begin();
    expect(first.signal.aborted).toBe(true);
    expect(scope.isCurrent(first)).toBe(false);
    scope.finish(first);
    expect(scope.isCurrent(second)).toBe(true);
    scope.cancel();
    expect(second.signal.aborted).toBe(true);
    expect(scope.inFlight).toBe(false);
  });
  it("cleans up a completed request without leaving the UI permanently busy", () => {
    const scope = new CoachRequestScope();
    const request = scope.begin();
    scope.finish(request);
    expect(scope.isCurrent(request)).toBe(false);
    expect(scope.inFlight).toBe(false);
  });
  it("requires verified coaching access and does not store transcripts in localStorage", () => {
    const page = readFileSync("src/pages/AITutor.tsx", "utf8");
    expect(page).toContain('key={JSON.stringify([user?.id ?? null, search])}');
    expect(page).toContain("session.user.id !== accountId");
    expect(page).toContain("signal: request.signal");
    expect(page).toContain("requestScope.current.inFlight");
    expect(page).not.toContain("localStorage");
    expect(page).toContain("if (accountId && canUseCoaching)");
  });
});
