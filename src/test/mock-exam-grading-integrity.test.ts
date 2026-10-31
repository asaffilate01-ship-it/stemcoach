import { describe, expect, it } from "vitest";
import { requireCompleteMockExamGrades, type MockExamGradeResult } from "@/lib/mockExamGrading";

const result = (id: string, answer: string | null): MockExamGradeResult => ({
  question_id: id,
  correct_answer: answer,
  explanation: "Server-graded explanation",
  worked_solution: null,
});

describe("mock exam grading integrity", () => {
  it("matches complete graded results by question ID, not array order", () => {
    const actual = requireCompleteMockExamGrades(["q1", "q2"], [
      result("q2", "B"),
      result("q1", "A"),
    ]);
    expect(actual.get("q1")?.correct_answer).toBe("A");
    expect(actual.get("q2")?.correct_answer).toBe("B");
  });

  it("rejects missing, duplicate or unrecognised grade records", () => {
    expect(() => requireCompleteMockExamGrades(["q1", "q2"], [result("q1", "A")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1", "q2"], [result("q1", "A"), result("q1", "B")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1", "q2"], [result("q1", "A"), result("q3", "B")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1", "q1"], [result("q1", "A"), result("q1", "A")])).toThrow();
  });

  it("rejects an unknown or empty answer key before showing a score", () => {
    expect(() => requireCompleteMockExamGrades(["q1"], [result("q1", null)])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1"], [result("q1", "")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1"], undefined)).toThrow();
    expect(() => requireCompleteMockExamGrades([], [])).toThrow();
  });
});
