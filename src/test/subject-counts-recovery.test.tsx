import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSubjectCounts } from "@/hooks/useSubjectCounts";

const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: fake.rpc } }));
type Result = { data: unknown; error: unknown };
function deferred() {
  let resolve!: (result: Result) => void;
  const promise = new Promise<Result>(r => { resolve = r; });
  return { promise, resolve };
}
beforeEach(() => fake.rpc.mockReset());
afterEach(cleanup);

describe("verified subject availability", () => {
  it("distinguishes a failed request from an empty question catalogue and retries", async () => {
    fake.rpc.mockResolvedValueOnce({ data: null, error: { message: "unavailable" } })
      .mockResolvedValueOnce({ data: [], error: null });
    const { result } = renderHook(() => useSubjectCounts({ curricula: ["uk-gcse"] }));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.isEmpty("physics")).toBe(false);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.isEmpty("physics")).toBe(true);
  });
  it("does not display old curriculum counts while the next filter loads", async () => {
    const pending = deferred();
    fake.rpc.mockResolvedValueOnce({ data: [{ subject: "physics", question_count: "20" }], error: null })
      .mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ id }) => useSubjectCounts({ curricula: [id] }), { initialProps: { id: "uk-gcse" } });
    await waitFor(() => expect(result.current.countFor("physics")).toBe(20));
    rerender({ id: "de-abitur" });
    expect(result.current.loading).toBe(true);
    expect(result.current.countFor("physics")).toBe(0);
    await act(async () => pending.resolve({ data: [{ subject: "physics", question_count: 7 }], error: null }));
    expect(result.current.countFor("physics")).toBe(7);
  });
  it("ignores delayed results from superseded filters", async () => {
    const pending = deferred();
    fake.rpc.mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ data: [{ subject: "mathematics", question_count: 5 }], error: null });
    const { result, rerender } = renderHook(({ id }) => useSubjectCounts({ curricula: [id] }), { initialProps: { id: "uk-gcse" } });
    rerender({ id: "pakistan-matric" });
    await waitFor(() => expect(result.current.countFor("mathematics")).toBe(5));
    await act(async () => pending.resolve({ data: [{ subject: "mathematics", question_count: 100 }], error: null }));
    expect(result.current.countFor("mathematics")).toBe(5);
  });
  it("rejects invalid inventory counts", async () => {
    fake.rpc.mockResolvedValueOnce({ data: [{ subject: "physics", question_count: -1 }], error: null });
    const { result } = renderHook(() => useSubjectCounts());
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.isEmpty("physics")).toBe(false);
  });
});
