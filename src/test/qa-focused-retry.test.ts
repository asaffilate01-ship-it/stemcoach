import { describe, expect, it } from "vitest";
import { selectSprintRetryIds, summariseSprint } from "@/lib/qaSprintResults";

describe("focused sprint retry scopes", () => {
  it("keeps mistakes and unattempted questions separate, ordered and deduplicated", () => {
    const ids = ["correct", "missed", "skipped", "corrected", "missed", "later"] as const;
    const attempts = { correct: true, missed: false, corrected: false, elsewhere: false };
    expect(selectSprintRetryIds(ids, attempts, "missed")).toEqual(["missed", "corrected"]);
    expect(selectSprintRetryIds(ids, attempts, "unattempted")).toEqual(["skipped", "later"]);
    expect(summariseSprint(ids, attempts).retryIds).toEqual(["missed", "skipped", "corrected", "later"]);
    expect(attempts).toEqual({ correct: true, missed: false, corrected: false, elsewhere: false });
  });

  it("does not count inherited, missing, or empty question references as mistakes", () => {
    const inherited = Object.assign(Object.create({ a: false }), { b: false });
    expect(selectSprintRetryIds(["a", "", "b", "c"], inherited, "missed")).toEqual(["b"]);
    expect(selectSprintRetryIds(["a", "", "b", "c"], inherited, "unattempted")).toEqual(["a", "c"]);
    expect(selectSprintRetryIds(["a"], { a: true }, "missed")).toEqual([]);
    expect(selectSprintRetryIds([], {}, "unattempted")).toEqual([]);
  });
});
