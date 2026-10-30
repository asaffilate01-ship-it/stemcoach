import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deepQAExpansion } from "@/data/tutorialDeepExpansion";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { emptyResponse, hasResponse, inspectQuestion, isCorrectResponse } from "@/lib/qaEngine";
import { parseBookmarks, serialiseBookmarks, recordReviewAttempt } from "@/lib/qaPractice";
const src = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("deeper tutorial and Q&A bank", () => {
  it("contains 28 new lessons and 112 new questions with all 14 subjects represented twice", () => {
    expect(deepQAExpansion).toHaveLength(28);
    expect(tutorials).toHaveLength(99);
    expect(qaEntries).toHaveLength(331);
    expect(new Set(tutorials.map((t) => t.id)).size).toBe(99);
    expect(new Set(qaEntries.map((q) => q.id)).size).toBe(331);
    expect(new Set(deepQAExpansion.map((t) => t.subject)).size).toBe(14);
    for (const subject of new Set(deepQAExpansion.map((t) => t.subject)))
      expect(deepQAExpansion.filter((t) => t.subject === subject)).toHaveLength(2);
    expect(deepQAExpansion.reduce((total, t) => total + 1 + (t.practice?.length || 0), 0)).toBe(112);
  });

  it("validates each new question key, hint and explanation", () => {
    const seen = new Set<string>();
    for (const tutorial of deepQAExpansion) {
      expect(tutorial.objectives.length).toBeGreaterThanOrEqual(3);
      expect(tutorial.lesson.length).toBeGreaterThanOrEqual(3);
      expect(tutorial.workedExample.length).toBeGreaterThan(70);
      expect(tutorial.examTip?.length).toBeGreaterThan(18);
      expect(tutorial.commonMistake?.length).toBeGreaterThan(18);
      const checks = [tutorial.checkpoint, ...(tutorial.practice || [])];
      expect(checks).toHaveLength(4);
      for (const question of checks) {
        expect(inspectQuestion(question), tutorial.id + ": " + question.question).toEqual([]);
        expect(question.hint?.length).toBeGreaterThan(16);
        const key = tutorial.subject + ":" + question.question.normalize("NFKC").toLowerCase().trim();
        expect(seen.has(key), "Duplicate authored question " + key).toBe(false);
        seen.add(key);
      }
    }
    expect(seen.size).toBe(112);
  });

  it("requires actual ordering interaction to avoid awarding a score for the initial reverse sequence", () => {
    const q = deepQAExpansion.flatMap((t) => t.practice || []).find((x) => x.format === "ordering")!;
    const state = emptyResponse(q);
    expect(state.orderTouched).toBe(false);
    expect(hasResponse(q, state)).toBe(false);
    expect(isCorrectResponse(q, state)).toBe(false);
    state.orderTouched = true;
    state.order = [...(q.answers || [])];
    expect(isCorrectResponse(q, state)).toBe(true);
    state.order = [...(q.answers || [])].reverse();
    expect(isCorrectResponse(q, state)).toBe(false);
    expect(src("src/components/qa/QuestionInteraction.tsx")).toContain("orderTouched: true");
  });

  it("does not record a first-try attempt after revealing the solution", () => {
    const now = Date.UTC(2026, 9, 16, 12);
    expect(recordReviewAttempt({}, "q1", true, false, now)).toEqual({});
    const wrong = recordReviewAttempt({}, "q1", false, true, now);
    const corrected = recordReviewAttempt(wrong, "q1", true, false, now + 3000);
    expect(corrected.q1.attempts).toBe(1);
    expect(corrected.q1.incorrectFirst).toBe(1);
    expect(corrected.q1.correctFirst).toBe(0);
  });

  it("stores only validated bookmark IDs and exposes due, missed and saved filters", () => {
    const ids = new Set(qaEntries.map((q) => q.id));
    const saved = serialiseBookmarks([qaEntries[0].id, qaEntries[1].id, qaEntries[0].id]);
    expect(saved).not.toContain(qaEntries[0].question);
    expect(parseBookmarks(saved, ids)).toEqual([qaEntries[0].id, qaEntries[1].id]);
    expect(parseBookmarks(JSON.stringify(["fake-id", qaEntries[2].id]), ids)).toEqual([qaEntries[2].id]);
    expect(parseBookmarks("{garbled", ids)).toEqual([]);
    const page = src("src/pages/QAClinic.tsx");
    for (const filter of ["saved", "missed", "due"]) expect(page).toContain('reviewFilter === "' + filter + '"');
    expect(page).toContain("QA_BOOKMARKS_KEY");
  });

  it("aligns the trusted server-side AI tutor lesson allowlist with all 99 lessons", () => {
    const catalog = src("supabase/functions/_shared/tutorialCatalog.ts");
    const found = [...catalog.matchAll(/\{ id: "([a-z0-9-]+)", subject: "([^"]+)", title: "([^"]+)" \}/g)];
    expect(found).toHaveLength(99);
    expect(found.map((x) => x[1])).toEqual(tutorials.map((t) => t.id));
    expect(found.map((x) => x[2])).toEqual(tutorials.map((t) => t.subject));
    expect(found.map((x) => x[3])).toEqual(tutorials.map((t) => t.title));
  });
});
