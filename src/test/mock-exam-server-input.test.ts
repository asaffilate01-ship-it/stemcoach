import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { requirePublishedMockExamQuestions, validateMockExamSubmissions } from "../../supabase/functions/_shared/mockExamSubmission";

const id1 = "00000000-0000-4000-8000-000000000001";
const id2 = "00000000-0000-4000-8000-000000000002";
const entries = [{ question_id: id1, answer: "  A  " }, { question_id: id2, answer: null }];

describe("server mock-exam input integrity", () => {
  it("allows valid, bounded unique submissions and normalises blank answers", () => {
    expect(validateMockExamSubmissions(entries)).toEqual([
      { question_id: id1, answer: "A" }, { question_id: id2, answer: null },
    ]);
    expect(validateMockExamSubmissions([{question_id: id1, answer: "  "}])[0].answer).toBeNull();
  });

  it("rejects missing, repeated, malformed and oversized submissions", () => {
    expect(() => validateMockExamSubmissions([])).toThrow();
    expect(() => validateMockExamSubmissions(Array.from({ length: 101 }, () => entries[0]))).toThrow();
    expect(() => validateMockExamSubmissions([entries[0], entries[0]])).toThrow();
    expect(() => validateMockExamSubmissions([{ question_id: "user-supplied", answer: "A" }])).toThrow();
    expect(() => validateMockExamSubmissions([{ question_id: id1, answer: 42 }])).toThrow();
    expect(() => validateMockExamSubmissions([{ question_id: id1, answer: "x".repeat(2001) }])).toThrow();
    expect(() => validateMockExamSubmissions([{ question_id: id1 }])).toThrow();
  });

  it("requires all and only matching published questions with non-empty answer keys", () => {
    const submissions = validateMockExamSubmissions(entries);
    const published = [
      { id: id2, correct_answer: "B" },
      { id: id1, correct_answer: "A" },
    ];
    const actual = requirePublishedMockExamQuestions(submissions, published);
    expect(actual.get(id1)?.correct_answer).toBe("A");
    expect(() => requirePublishedMockExamQuestions(submissions, published.slice(0,1))).toThrow();
    expect(() => requirePublishedMockExamQuestions(submissions, [{ id: id1, correct_answer: "A" }, { id: id1, correct_answer: "A" }])).toThrow();
    expect(() => requirePublishedMockExamQuestions(submissions, [{ id: id1, correct_answer: "A" }, { id: "00000000-0000-4000-8000-000000000003", correct_answer: "B" }])).toThrow();
    expect(() => requirePublishedMockExamQuestions(submissions, [{ id: id1, correct_answer: "" }, { id: id2, correct_answer: "B" }])).toThrow();
  });

  it("validates a complete published key set before persisting or charging", () => {
    const source = readFileSync(resolve(process.cwd(), "supabase/functions/grade-mock-exam/index.ts"), "utf8");
    expect(source).toContain("validateMockExamSubmissions");
    const guard = source.indexOf("requirePublishedMockExamQuestions(");
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(source.indexOf('from("attempts").insert'));
    expect(guard).toBeLessThan(source.indexOf('rpc("increment_mock_exams_used"'));
    expect(source).not.toContain("body.submissions.slice(0, 100)");
  });
});
