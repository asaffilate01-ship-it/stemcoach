import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserRole } from "@/hooks/useUserRole";

const fake = vi.hoisted(() => ({
  user: { id: "a" } as { id: string } | null,
  query: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: fake.user }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ eq: (_column: string, id: string) => fake.query(id) }) }) },
}));
type Result = { data: { role: string }[] | null; error: unknown };
function deferred() {
  let resolve!: (value: Result) => void;
  const promise = new Promise<Result>(r => { resolve = r; });
  return { promise, resolve };
}
beforeEach(() => { fake.user = { id: "a" }; fake.query.mockReset(); });
afterEach(cleanup);

describe("account-scoped role verification", () => {
  it("never exposes previous administrator privileges while the new account loads", async () => {
    const second = deferred();
    fake.query.mockResolvedValueOnce({ data: [{ role: "admin" }], error: null })
      .mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(() => useUserRole());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    fake.user = { id: "b" };
    rerender();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.roles).toEqual([]);
    expect(result.current.loading).toBe(true);
    await act(async () => second.resolve({ data: [{ role: "student" }], error: null }));
    expect(result.current.isStudent).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });
  it("ignores a previous user's late response", async () => {
    const first = deferred();
    fake.query.mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ data: [{ role: "parent" }], error: null });
    const { result, rerender } = renderHook(() => useUserRole());
    fake.user = { id: "b" };
    rerender();
    await waitFor(() => expect(result.current.isParent).toBe(true));
    await act(async () => first.resolve({ data: [{ role: "admin" }], error: null }));
    expect(result.current.roles).toEqual(["parent"]);
    fake.user = null;
    rerender();
    expect(result.current.roles).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
  it("fails closed on server errors and offers a clean retry", async () => {
    fake.query.mockResolvedValueOnce({ data: null, error: { message: "denied" } })
      .mockResolvedValueOnce({ data: [{ role: "teacher" }], error: null });
    const { result } = renderHook(() => useUserRole());
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.isStudent).toBe(false);
    expect(result.current.roles).toEqual([]);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.isTeacher).toBe(true));
    expect(result.current.error).toBe(false);
  });
  it("does not invent a student role when a verified account has no roles", async () => {
    fake.query.mockResolvedValueOnce({ data: [], error: null });
    const { result } = renderHook(() => useUserRole());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roles).toEqual([]);
    expect(result.current.isStudent).toBe(false);
  });
});
