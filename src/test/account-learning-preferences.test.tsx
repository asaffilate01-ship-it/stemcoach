import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLearnerCurriculum } from "@/hooks/useLearnerCurriculum";
import { usePreferredCoach } from "@/hooks/usePreferredCoach";

const fake = vi.hoisted(() => ({
  user: { id: "a" } as { id: string } | null,
  read: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: fake.user, loading: false }) }));
vi.mock("@/data/questions", () => ({ curricula: [{ id: "pk-test", label: "Pakistan" }, { id: "gb-test", label: "UK" }] }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({
    select: (column: string) => ({ eq: (_key: string, id: string) => ({ maybeSingle: () => fake.read(column, id) }) }),
    upsert: (...args: unknown[]) => fake.save(...args),
  }) },
}));
type Reply = { data: unknown; error: unknown };
function deferred() {
  let resolve!: (r: Reply) => void;
  const promise = new Promise<Reply>(r => { resolve = r; });
  return { promise, resolve };
}
beforeEach(() => {
  fake.user = { id: "a" };
  fake.read.mockReset();
  fake.save.mockReset();
  localStorage.clear();
});
afterEach(cleanup);

describe("account-scoped learner preferences", () => {
  it("never reuses a prior curriculum on account switch or sign-out", async () => {
    const pending = deferred();
    fake.read.mockResolvedValueOnce({ data: { curriculum: "pk-test" }, error: null })
      .mockReturnValueOnce(pending.promise);
    localStorage.setItem("stemcoach:learner-curriculum", "gb-test");
    const { result, rerender } = renderHook(() => useLearnerCurriculum());
    await waitFor(() => expect(result.current.curriculumId).toBe("pk-test"));
    fake.user = { id: "b" }; rerender();
    expect(result.current.curriculumId).toBe(null);
    expect(result.current.loading).toBe(true);
    await act(async () => pending.resolve({ data: null, error: null }));
    expect(result.current.loading).toBe(false);
    expect(result.current.curriculumId).toBe(null);
    fake.user = null; rerender();
    expect(result.current.curriculumId).toBe(null);
  });
  it("distinguishes network failure, unknown curriculum and a successful empty preference", async () => {
    fake.read.mockResolvedValueOnce({ data: null, error: { message: "denied" } })
      .mockResolvedValueOnce({ data: { curriculum: "unknown" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const { result } = renderHook(() => useLearnerCurriculum());
    await waitFor(() => expect(result.current.error).toBe(true));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBe(true));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.curriculumId).toBe(null);
  });
  it("ignores late curriculum replies from previous accounts", async () => {
    const pending = deferred();
    fake.read.mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ data: { curriculum: "gb-test" }, error: null });
    const { result, rerender } = renderHook(() => useLearnerCurriculum());
    fake.user = { id: "b" }; rerender();
    await waitFor(() => expect(result.current.curriculumId).toBe("gb-test"));
    await act(async () => pending.resolve({ data: { curriculum: "pk-test" }, error: null }));
    expect(result.current.curriculumId).toBe("gb-test");
  });
  it("only changes the saved coach after a confirmed server write and reload", async () => {
    fake.read.mockResolvedValue({ data: { preferred_mascot: "mathematics" }, error: null });
    localStorage.setItem("stemcoach:preferred-coach", "physics");
    const { result } = renderHook(() => usePreferredCoach());
    await waitFor(() => expect(result.current.preferredCoachId).toBe("mathematics"));
    fake.save.mockResolvedValueOnce({ error: { message: "denied" } });
    await act(async () => { expect((await result.current.setPreferredCoachId("physics")).error).toBeTruthy(); });
    expect(result.current.preferredCoachId).toBe("mathematics");
    fake.save.mockResolvedValueOnce({ error: null });
    fake.read.mockResolvedValue({ data: { preferred_mascot: "physics" }, error: null });
    await act(async () => { expect((await result.current.setPreferredCoachId("physics")).error).toBeNull(); });
    await waitFor(() => expect(result.current.preferredCoachId).toBe("physics"));
    expect(fake.save.mock.calls[1][0]).toMatchObject({ user_id: "a", preferred_mascot: "physics" });
  });
  it("does not expose a previous account's coach preference while a new account loads", async () => {
    const pending = deferred();
    fake.read.mockResolvedValueOnce({ data: { preferred_mascot: "physics" }, error: null }).mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(() => usePreferredCoach());
    await waitFor(() => expect(result.current.preferredCoachId).toBe("physics"));
    fake.user = { id: "b" }; rerender();
    expect(result.current.preferredCoachId).toBe("stemcoach");
    expect(result.current.loading).toBe(true);
    await act(async () => pending.resolve({ data: null, error: null }));
    expect(result.current.preferredCoachId).toBe("stemcoach");
  });
});
