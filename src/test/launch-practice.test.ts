import { describe, expect, it } from "vitest";
import { buildPracticePath, choosePracticeCurriculum, narrowPracticeSample, readPracticeFilters, safePracticeReturn } from "@/lib/launchPractice";

describe("launch practice filters", () => {
  it("preserves exact launch qualification, board and difficulty selections", () => {
    const href = buildPracticePath("physics", ["uk-gcse", "uk-alevel"], ["AQA"], 3);
    const filters = readPracticeFilters(new URL(href, "https://stemcoach.invalid").searchParams)!;
    expect(filters).toEqual({ curricula: ["uk-gcse", "uk-alevel"], qualification: null, boards: ["AQA"], difficulty: 3 });
    expect(choosePracticeCurriculum(filters, "uk-alevel")).toBe("uk-alevel");
    expect(choosePracticeCurriculum(filters, "pakistan-matric")).toBeNull();
    expect(safePracticeReturn(href)).toBe(href);
  });
  it("never defaults a missing or legacy preference to an unfiltered worldwide bank", () => {
    const filters = readPracticeFilters(new URLSearchParams())!;
    expect(choosePracticeCurriculum(filters)).toBeNull();
    expect(choosePracticeCurriculum(filters, "us-sat")).toBeNull();
    expect(choosePracticeCurriculum(readPracticeFilters(new URLSearchParams("curriculum=pakistan-matric"))!)).toBe("pakistan-matric");
  });
  it("rejects invalid filter values and cross-market qualification overrides", () => {
    for (const query of ["curriculum=us-sat", "curriculum=uk-gcse&qualification=de-abitur", "curriculum=uk-gcse&board=CBSE", "difficulty=0", "difficulty=2&difficulty=3", "qualification="]) {
      expect(readPracticeFilters(new URLSearchParams(query)), query).toBeNull();
    }
    expect(() => buildPracticePath("french", [], [], null)).toThrow();
  });
  it("only returns matching rows from the bounded server sample", () => {
    const filters = readPracticeFilters(new URLSearchParams("curriculum=uk-gcse&board=AQA&difficulty=2"))!;
    const a = { curriculum: "uk-gcse", subject: "physics", boards: ["AQA"], difficulty: 2 };
    expect(narrowPracticeSample([a, {...a, curriculum: "us-sat"}, {...a, subject: "chemistry"}, {...a, boards: ["OCR"]}, {...a, difficulty: 3}], "physics", "uk-gcse", filters)).toEqual([a]);
  });
  it("accepts only canonical internal practice return paths", () => {
    for (const path of ["https://evil.example/practice/physics", "//evil.example", "/practice/french", "/practice/physics?curriculum=us-sat", "/practice/physics?next=https://evil.example", "/practice/physics#x", "/practice/physics?mode=invalid", "/practice/../admin/generate"]) expect(safePracticeReturn(path), path).toBeNull();
    expect(safePracticeReturn("/practice/physics?mode=focus")).toBe("/practice/physics?mode=focus");
  });
});
