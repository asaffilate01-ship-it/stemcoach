import { describe, expect, it } from "vitest";
import { summariseSprint } from "@/lib/qaSprints";

describe("exact sprint outcomes and retry scopes", () => {
  it("separates independent first attempts, mistakes, and unattempted questions", () => {
    const result = summariseSprint(
      ["correct", "missed", "skip", "corrected", "revealed"],
      { correct: true, missed: false, corrected: false, unrelated: true },
      { correct: true, corrected: true, revealed: true, unrelated: true },
    );
    expect(result).toEqual({
      total: 5,
      attempted: 3,
      firstTryCorrect: 1,
      solvedCount: 3,
      missedIds: ["missed", "corrected"],
      unansweredIds: ["skip", "revealed"],
    });
    expect(result.firstTryCorrect + result.missedIds.length + result.unansweredIds.length).toBe(result.total);
  });

  it("keeps original order, removes duplicate IDs and ignores unrelated history", () => {
    const ids = ["z", "x", "z", "y"] as const;
    const attempts = { z: false, other: true };
    const solved = { z: true, other: true };
    expect(summariseSprint(ids, attempts, solved)).toEqual({
      total: 3, attempted: 1, firstTryCorrect: 0, solvedCount: 1,
      missedIds: ["z"], unansweredIds: ["x", "y"],
    });
    expect(ids).toEqual(["z", "x", "z", "y"]);
    expect(attempts).toEqual({ z: false, other: true });
  });

  it("handles empty and all-correct rounds and disregards inherited entries", () => {
    expect(summariseSprint([], { x: true }, { x: true })).toEqual({
      total: 0, attempted: 0, firstTryCorrect: 0, solvedCount: 0, missedIds: [], unansweredIds: [],
    });
    expect(summariseSprint(["x"], { x: true }, { x: true }).unansweredIds).toEqual([]);
    const inherited = Object.create({ x: false });
    expect(summariseSprint(["x"], inherited, inherited).unansweredIds).toEqual(["x"]);
  });
});
