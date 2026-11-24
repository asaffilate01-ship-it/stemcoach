import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuotaGate } from "@/hooks/useQuotaGate";

const fake = vi.hoisted(() => ({
  user: { id: "a" } as { id: string } | null,
  quota: vi.fn(),
  freeUsage: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: fake.user, loading: false }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: (_column: string, id: string) => ({ maybeSingle: () => fake.quota(id) }) }) }),
    rpc: (_name: string, args: { _user_id: string }) => fake.freeUsage(args._user_id),
  },
}));
const paid = { total_questions: 10, used_questions: 3, mock_exams_total: 2, mock_exams_used: 1, subjects: ["mathematics"], levels: ["gcse"] };
type Result = { data: unknown; error: unknown };
function deferred() {
  let resolve!: (value: Result) => void;
  const promise = new Promise<Result>(r => { resolve = r; });
  return { promise, resolve };
}
beforeEach(() => {
  fake.user = { id: "a" };
  fake.quota.mockReset();
  fake.freeUsage.mockReset().mockResolvedValue({ data: [], error: null });
});
afterEach(cleanup);

describe("account-scoped practice entitlement UI", () => {
  it("never displays another user's paid credits during a switch", async () => {
    const second = deferred();
    fake.quota.mockResolvedValueOnce({ data: paid, error: null }).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(() => useQuotaGate());
    await waitFor(() => expect(result.current.remainingQuestions).toBe(7));
    fake.user = { id: "b" };
    rerender();
    expect(result.current.remainingQuestions).toBe(0);
    expect(result.current.canUseCoaching).toBe(false);
    expect(result.current.canPracticeSubjectFree("mathematics")).toBe(false);
    await act(async () => second.resolve({ data: null, error: null }));
    await waitFor(() => expect(result.current.canPracticeSubjectFree("mathematics")).toBe(true));
    expect(result.current.hasPurchased).toBe(false);
  });
  it("ignores a delayed response from an earlier account", async () => {
    const first = deferred();
    fake.quota.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ data: null, error: null });
    const { result, rerender } = renderHook(() => useQuotaGate());
    fake.user = { id: "b" };
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => first.resolve({ data: paid, error: null }));
    expect(result.current.hasPurchased).toBe(false);
    fake.user = null;
    rerender();
    expect(result.current.getFreeRemainingForSubject("mathematics")).toBe(0);
    expect(result.current.canPracticeSubjectFree("mathematics")).toBe(false);
  });
  it("does not downgrade failed quota requests into a free grant", async () => {
    fake.quota.mockResolvedValueOnce({ data: null, error: { message: "denied" } })
      .mockResolvedValueOnce({ data: null, error: null });
    fake.freeUsage.mockResolvedValueOnce({ data: null, error: { message: "denied" } })
      .mockResolvedValueOnce({ data: [], error: null });
    const { result } = renderHook(() => useQuotaGate());
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(fake.freeUsage).not.toHaveBeenCalled();
    expect(result.current.canPracticeSubjectFree("mathematics")).toBe(false);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.error).toBe(true);
    expect(result.current.canPracticeSubjectFree("mathematics")).toBe(false);
    fake.quota.mockResolvedValueOnce({ data: null, error: null });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.error).toBe(false);
    expect(result.current.canPracticeSubjectFree("mathematics")).toBe(true);
  });
  it("denies further question submissions after a paid balance is exhausted", async () => {
    fake.quota.mockResolvedValue({ data: { ...paid, used_questions: 10 }, error: null });
    const { result } = renderHook(() => useQuotaGate());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasPurchased).toBe(true);
    expect(result.current.canPractice).toBe(false);
    expect(result.current.canPracticeSubjectFree("mathematics")).toBe(false);
  });
  it("checks free usage even if a zero-credit account record exists", async () => {
    fake.quota.mockResolvedValue({ data: { ...paid, total_questions: 0, used_questions: 0 }, error: null });
    fake.freeUsage.mockResolvedValue({ data: [{ subject: "mathematics", attempt_count: 999 }], error: null });
    const { result } = renderHook(() => useQuotaGate());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.canPracticeSubjectFree("mathematics")).toBe(false);
  });
});
