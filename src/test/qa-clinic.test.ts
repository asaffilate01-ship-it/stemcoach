import { describe, expect, it } from "vitest";
import { qaEntries } from "@/data/qaClinic";
import { subjects } from "@/data/questions";
import { tutorials } from "@/data/tutorials";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("STEMCoach Question & Answer clinic", () => {
  it("reuses authored tutorial checkpoints and practice questions across all subjects", () => {
    const expected = tutorials.reduce((total, lesson) => total + 1 + (lesson.practice?.length || 0), 0);
    expect(qaEntries).toHaveLength(expected);
    expect(qaEntries.length).toBeGreaterThanOrEqual(29);
    expect(new Set(qaEntries.map((entry) => entry.id)).size).toBe(qaEntries.length);
    expect(new Set(qaEntries.map((entry) => entry.subject))).toEqual(new Set(subjects.map((subject) => subject.id)));
  });

  it("provides canonical answers and explanations before any optional AI call", () => {
    for (const entry of qaEntries) {
      expect(entry.question.trim().length).toBeGreaterThan(8);
      expect(entry.options.length).toBeGreaterThanOrEqual(2);
      expect(entry.options).toContain(entry.answer);
      expect(entry.explanation.trim()).not.toBe("");
      expect(entry.workedExample.trim()).not.toBe("");
    }
    const clinic = src("src/pages/QAClinic.tsx");
    expect(clinic).toContain("aria-expanded={expanded}");
    expect(clinic).toContain("expanded && (");
    expect(clinic).toContain("qaDraft: prompt");
    expect(clinic).not.toContain('functions.invoke("ai-chat"');
  });

  it("never reveals an answer-bank key from an unattempted question", () => {
    const tutor = src("supabase/functions/ai-tutor/index.ts");
    const explain = tutor.slice(tutor.indexOf("async function explainQuestion("));
    expect(tutor).toContain("explainQuestion(params, LOVABLE_API_KEY, user.id)");
    expect(explain).toContain('.eq("review_status", "published")');
    expect(explain).toContain('.eq("user_id", userId)');
    expect(explain).toContain('.eq("question_id", question_id)');
    expect(explain).toContain("Complete the question before requesting its answer");
    expect(explain).not.toContain("params.correct_answer");
    expect(explain).not.toContain('getCache("explain"');
    expect(explain).not.toContain('setCache(explanation, "explain"');
  });
});
