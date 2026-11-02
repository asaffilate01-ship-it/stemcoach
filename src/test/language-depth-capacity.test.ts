import { describe, expect, it } from "vitest";
import { additionalLanguageDepth } from "@/data/tutorialDepthLanguages";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";
import {
  emptyResponse, getQuestionFormat, inspectQuestion, isCorrectResponse,
  normaliseWrittenAnswer,
} from "@/lib/qaEngine";
import {
  DEFAULT_REVIEW_SCENARIO, estimateReviewCapacity,
} from "@/lib/reviewCapacity";

const checks = (lesson: (typeof tutorials)[number]) => [lesson.checkpoint, ...(lesson.practice || [])];

describe("second language learning phase: 60 checked formative questions", () => {
  it("provides six new lessons with twenty checks in each of Italian, Spanish and Arabic", () => {
    expect(additionalLanguageDepth).toHaveLength(6);
    for (const subject of ["italian", "spanish", "arabic"]) {
      expect(additionalLanguageDepth.filter((lesson) => lesson.subject === subject)).toHaveLength(2);
    }
    expect(additionalLanguageDepth.reduce((total, lesson) => total + checks(lesson).length, 0)).toBe(60);
    expect(tutorials).toHaveLength(156);
    expect(qaEntries).toHaveLength(814);
    expect(new Set(tutorials.map((lesson) => lesson.id)).size).toBe(156);
    expect(new Set(qaEntries.map((entry) => entry.id)).size).toBe(814);
    expect(TUTORIAL_CONTEXTS.map(({id,subject,title})=>({id,subject,title})))
      .toEqual(tutorials.map(({id,subject,title})=>({id,subject,title})));
  });

  it("checks all new canonical answers and rejects alternatives deterministically", () => {
    const seen = new Set<string>();
    for (const lesson of additionalLanguageDepth) {
      expect(lesson.objectives).toHaveLength(3);
      expect(lesson.lesson).toHaveLength(3);
      expect(lesson.workedExample.length).toBeGreaterThan(70);
      expect(lesson.examTip?.length).toBeGreaterThan(30);
      expect(lesson.commonMistake?.length).toBeGreaterThan(30);
      expect(checks(lesson)).toHaveLength(10);
      for (const question of checks(lesson)) {
        expect(inspectQuestion(question), lesson.id + ":" + question.question).toEqual([]);
        expect(question.explanation.length).toBeGreaterThan(24);
        const correct = emptyResponse(question);
        const incorrect = emptyResponse(question);
        const format = getQuestionFormat(question);
        if (format === "short-text") {
          correct.freeText = question.answer;
          incorrect.freeText = "nope";
        } else if (format === "single" || format === "true-false") {
          correct.choice = question.answer;
          incorrect.choice = question.options.find((option) => option !== question.answer) || "";
        } else throw new Error("Unexpected format: " + format);
        expect(isCorrectResponse(question, correct)).toBe(true);
        expect(isCorrectResponse(question, incorrect)).toBe(false);
        const key = lesson.subject + ":" + normaliseWrittenAnswer(question.question);
        expect(seen.has(key), key).toBe(false);
        seen.add(key);
      }
    }
    expect(seen.size).toBe(60);
  });

  it("ignores optional Arabic vowel marks but keeps meaningful letters and Latin accents distinct", () => {
    expect(normaliseWrittenAnswer("  ثَلَاثَة  ")).toBe(normaliseWrittenAnswer("ثلاثة"));
    expect(normaliseWrittenAnswer("أَيْنَ")).toBe("أين");
    expect(normaliseWrittenAnswer("كِتَاب")).toBe("كتاب");
    expect(normaliseWrittenAnswer("كـتاب")).toBe("كتاب");
    expect(normaliseWrittenAnswer("كِتَاب")).not.toBe(normaliseWrittenAnswer("كتب"));
    expect(normaliseWrittenAnswer("hablé")).not.toBe(normaliseWrittenAnswer("hable"));
    expect(normaliseWrittenAnswer("où")).not.toBe(normaliseWrittenAnswer("ou"));
    const arabic = additionalLanguageDepth.find((lesson) => lesson.id === "arabic-numbers-one-to-ten")!;
    const short = checks(arabic).find((question) => getQuestionFormat(question) === "short-text")!;
    const attempt = emptyResponse(short);
    attempt.freeText = "ثَلَاثَة";
    expect(isCorrectResponse(short, attempt)).toBe(true);
  });
});

describe("two-million reviewed question capacity scenario", () => {
  it("shows the human review bottleneck without claiming these are published questions", () => {
    const estimate = estimateReviewCapacity(0, 2_000_000, DEFAULT_REVIEW_SCENARIO)!;
    expect(estimate.remaining).toBe(2_000_000);
    expect(estimate.reviewsPerMonth).toBe(28_800);
    expect(estimate.approvedPerMonth).toBe(23_040);
    expect(estimate.monthsToGoal).toBe(87);
    expect(estimate.monthlyApprovalTarget).toBe(83_334);
    expect(estimate.reviewersForTarget).toBe(87);
  });
  it("handles completed goals and invalid or impossible review input", () => {
    const complete = estimateReviewCapacity(2_000_000, 2_000_000, DEFAULT_REVIEW_SCENARIO)!;
    expect(complete.monthsToGoal).toBe(0);
    expect(complete.reviewersForTarget).toBe(0);
    expect(estimateReviewCapacity(-1, 2_000_000, DEFAULT_REVIEW_SCENARIO)).toBeNull();
    expect(estimateReviewCapacity(0, 2_000_000, {...DEFAULT_REVIEW_SCENARIO, approvalRatePercent: 0})).toBeNull();
    expect(estimateReviewCapacity(0, 2_000_000, {...DEFAULT_REVIEW_SCENARIO, reviewers: 0})).toBeNull();
    expect(estimateReviewCapacity(0, 2_000_000, {...DEFAULT_REVIEW_SCENARIO, workingDaysPerMonth: 35})).toBeNull();
  });
});
