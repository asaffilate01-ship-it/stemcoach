import { describe, expect, it } from "vitest";
import { largeQAExpansion } from "@/data/tutorialExpansionLarge";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { subjects } from "@/data/questions";
import { emptyResponse, inspectQuestion, isCorrectResponse, getQuestionFormat } from "@/lib/qaEngine";
import { effectiveSprintDurationSeconds } from "@/lib/qaSprints";
import { getReviewSummary, recordReviewAttempt } from "@/lib/qaPractice";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";

const questionsOf = (lesson: (typeof tutorials)[number]) => [lesson.checkpoint, ...(lesson.practice || [])];

describe("November expanded original formative bank", () => {
  it("includes 140 new questions and 14 lessons with full subject parity", () => {
    expect(largeQAExpansion).toHaveLength(14);
    expect(new Set(largeQAExpansion.map(lesson => lesson.subject))).toEqual(new Set(subjects.filter(subject => !["italian", "spanish", "arabic"].includes(subject.id)).map(subject => subject.id)));
    expect(largeQAExpansion.every(lesson => questionsOf(lesson).length === 10)).toBe(true);
    expect(largeQAExpansion.reduce((sum, lesson) => sum + questionsOf(lesson).length, 0)).toBe(140);
    expect(tutorials).toHaveLength(150);
    expect(qaEntries).toHaveLength(754);
    expect(new Set(tutorials.map(x => x.id)).size).toBe(150);
    expect(new Set(qaEntries.map(x => x.id)).size).toBe(754);
    expect(new Set(tutorials.map(x => x.subject + ":" + x.title.toLowerCase())).size).toBe(150);
    expect(TUTORIAL_CONTEXTS.map(({ id, subject, title }) => ({ id, subject, title })))
      .toEqual(tutorials.map(({ id, subject, title }) => ({ id, subject, title })));
  });

  it("requires useful lesson context, no duplicate question prompts, and valid authoring keys", () => {
    const seen = new Set<string>();
    for (const lesson of largeQAExpansion) {
      expect(lesson.objectives).toHaveLength(3);
      expect(lesson.lesson).toHaveLength(3);
      expect(lesson.workedExample.length).toBeGreaterThan(75);
      expect(lesson.examTip?.length).toBeGreaterThan(30);
      expect(lesson.commonMistake?.length).toBeGreaterThan(40);
      for (const question of questionsOf(lesson)) {
        expect(inspectQuestion(question), lesson.id + ": " + question.question).toEqual([]);
        expect(question.explanation.length).toBeGreaterThan(35);
        expect(question.hint?.length).toBeGreaterThan(18);
        const id = lesson.subject + ":" + question.question.normalize("NFKC").toLowerCase().trim();
        expect(seen.has(id), "Duplicate prompt: " + id).toBe(false);
        seen.add(id);
      }
    }
    expect(seen.size).toBe(140);
  });

  it("marks all 140 canonical answers correct and explicit wrong attempts incorrect", () => {
    const forms = new Set<string>();
    for (const lesson of largeQAExpansion) {
      for (const q of questionsOf(lesson)) {
        const correct = emptyResponse(q);
        const wrong = emptyResponse(q);
        const format = getQuestionFormat(q);
        forms.add(format);
        if (format === "short-text") {
          correct.freeText = q.answer;
          wrong.freeText = "__wrong_answer__";
        } else if (format === "single" || format === "true-false") {
          correct.choice = q.answer;
          wrong.choice = q.options.find(choice => choice !== q.answer) || "";
        } else {
          throw new Error("Unexpected format: " + format);
        }
        expect(isCorrectResponse(q, correct), lesson.id + ": " + q.question).toBe(true);
        expect(isCorrectResponse(q, wrong), lesson.id + ": " + q.question).toBe(false);
      }
    }
    expect(forms).toEqual(new Set(["single", "true-false", "short-text"]));
  });

  it("prevents a long sprint time allowance for a short filtered bank", () => {
    expect(effectiveSprintDurationSeconds(0, 20)).toBe(0);
    expect(effectiveSprintDurationSeconds(1, 20)).toBe(180);
    expect(effectiveSprintDurationSeconds(5, 20)).toBe(180);
    expect(effectiveSprintDurationSeconds(6, 20)).toBe(300);
    expect(effectiveSprintDurationSeconds(10, 20)).toBe(300);
    expect(effectiveSprintDurationSeconds(11, 20)).toBe(600);
    expect(effectiveSprintDurationSeconds(100, 5)).toBe(180);
  });

  it("calculates first-try accuracy from device metadata, not eventual retry success", () => {
    const now = Date.UTC(2026, 10, 2);
    const id = qaEntries[0].id;
    const wrong = recordReviewAttempt({}, id, false, true, now);
    const corrected = recordReviewAttempt(wrong, id, true, false, now + 1_000);
    const next = recordReviewAttempt(corrected, id, true, true, now + 2_000);
    const stats = getReviewSummary([qaEntries[0]], next, now + 2_000);
    expect(stats.firstTryAttempts).toBe(2);
    expect(stats.firstTryCorrect).toBe(1);
    expect(stats.firstTryAccuracy).toBe(50);
    expect(getReviewSummary([qaEntries[0]], {}, now).firstTryAccuracy).toBeNull();
  });
});
