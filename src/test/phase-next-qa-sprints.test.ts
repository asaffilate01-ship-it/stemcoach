import { describe, expect, it } from "vitest";
import { phaseNextQAExpansion } from "@/data/tutorialExpansionPhaseNext";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { subjects } from "@/data/questions";
import { displayAnswer, emptyResponse, getQuestionFormat, hasResponse, inspectQuestion, isCorrectResponse } from "@/lib/qaEngine";
import { buildReviewQueue } from "@/lib/qaPractice";
import { SPRINT_SIZES, parseSprintSize, sprintDurationSeconds, sprintQuestionCount } from "@/lib/qaSprints";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";

const checksOf = (lesson: (typeof tutorials)[number]) => [lesson.checkpoint, ...(lesson.practice || [])];

describe("phase-next original formative study bank", () => {
  it("adds exactly 14 lessons and 84 questions without repeating IDs, titles or subjects", () => {
    expect(phaseNextQAExpansion).toHaveLength(14);
    expect(new Set(phaseNextQAExpansion.map(lesson => lesson.subject))).toEqual(
      new Set(subjects.filter(subject => !["italian", "spanish", "arabic"].includes(subject.id)).map(subject => subject.id)),
    );
    expect(phaseNextQAExpansion.every(lesson => checksOf(lesson).length === 6)).toBe(true);
    expect(phaseNextQAExpansion.reduce((sum, lesson) => sum + checksOf(lesson).length, 0)).toBe(84);
    expect(tutorials).toHaveLength(150);
    expect(qaEntries).toHaveLength(754);
    expect(new Set(tutorials.map(item => item.id)).size).toBe(150);
    expect(new Set(qaEntries.map(item => item.id)).size).toBe(754);
    expect(new Set(tutorials.map(item => item.subject + ":" + item.title.toLowerCase())).size).toBe(150);
    expect(TUTORIAL_CONTEXTS.map(({ id, subject, title }) => ({ id, subject, title })))
      .toEqual(tutorials.map(({ id, subject, title }) => ({ id, subject, title })));
  });

  it("requires detailed lesson context, coherent worked solutions and uniquely phrased new checks", () => {
    const seen = new Set<string>();
    for (const lesson of phaseNextQAExpansion) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.length).toBeGreaterThanOrEqual(3);
      expect(lesson.workedExample.length).toBeGreaterThan(70);
      expect(lesson.examTip?.length).toBeGreaterThan(24);
      expect(lesson.commonMistake?.length).toBeGreaterThan(24);
      for (const question of checksOf(lesson)) {
        expect(inspectQuestion(question), lesson.id + ": " + question.question).toEqual([]);
        expect(question.explanation.length).toBeGreaterThan(39);
        expect(question.hint?.length).toBeGreaterThan(18);
        const stem = lesson.subject + ":" + question.question.normalize("NFKC").toLocaleLowerCase().trim();
        expect(seen.has(stem), stem).toBe(false);
        seen.add(stem);
      }
    }
    expect(seen.size).toBe(84);
  });

  it("grades all new canonical answers deterministically, without relying on AI", () => {
    const covered = new Set<string>();
    for (const lesson of phaseNextQAExpansion) {
      for (const question of checksOf(lesson)) {
        const format = getQuestionFormat(question);
        covered.add(format);
        const response = emptyResponse(question);
        expect(hasResponse(question, response), lesson.id).toBe(false);
        expect(isCorrectResponse(question, response), lesson.id).toBe(false);

        switch (format) {
          case "single":
          case "true-false": response.choice = question.answer; break;
          case "numeric":
          case "short-text": response.freeText = question.answer; break;
          case "multiple": response.choices = [...(question.answers || [])]; break;
          case "ordering":
            response.order = [...(question.answers || [])];
            response.orderTouched = true;
            break;
          case "matching":
            response.matches = Object.fromEntries((question.pairs || []).map(pair => [pair.left, pair.right]));
            break;
          case "fill-blanks":
            response.matches = Object.fromEntries((question.blanks || []).map(blank => [blank.id, blank.answer]));
            break;
          default: throw new Error("Unimplemented question format in phase-next " + format);
        }

        expect(hasResponse(question, response), lesson.id).toBe(true);
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(true);
        expect(displayAnswer(question).trim().length).toBeGreaterThan(0);
      }
    }
    expect(covered).toEqual(new Set(["single", "true-false", "multiple", "numeric", "matching", "ordering", "fill-blanks", "short-text"]));
  });

  it("does not score incorrect or partial answers as correct", () => {
    for (const lesson of phaseNextQAExpansion) {
      for (const question of checksOf(lesson)) {
        const response = emptyResponse(question);
        switch (getQuestionFormat(question)) {
          case "single":
          case "true-false":
            response.choice = question.options.find(option => option !== question.answer) || "wrong";
            break;
          case "numeric":
          case "short-text":
            response.freeText = "not a correct answer";
            break;
          case "multiple":
            response.choices = (question.answers || []).slice(0, 1);
            break;
          case "matching":
            response.matches = Object.fromEntries((question.pairs || []).map(pair => [pair.left, "wrong pairing"]));
            break;
          case "ordering":
            response.order = [...(question.answers || [])].reverse();
            response.orderTouched = true;
            break;
          case "fill-blanks":
            response.matches = Object.fromEntries((question.blanks || []).map(blank => [blank.id, "wrong value"]));
            break;
        }
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(false);
      }
    }
  });
});

describe("learner-controlled revision sprints", () => {
  it("provides 5-, 10- and 20-question presets with predictable time limits", () => {
    expect(SPRINT_SIZES).toEqual([5, 10, 20]);
    expect(SPRINT_SIZES.map(sprintDurationSeconds)).toEqual([180, 300, 600]);
    expect(parseSprintSize("5")).toBe(5);
    expect(parseSprintSize("10")).toBe(10);
    expect(parseSprintSize("20")).toBe(20);
    expect(parseSprintSize("<script>")).toBe(10);
    expect(parseSprintSize("999")).toBe(10);
    expect(sprintQuestionCount(6, 20)).toBe(6);
    expect(sprintQuestionCount(40, 20)).toBe(20);
    expect(sprintQuestionCount(0, 10)).toBe(0);
  });

  it("selects no duplicates and respects the available filtered topic bank", () => {
    const entries = qaEntries.filter(q => q.tutorialId === phaseNextQAExpansion[0].id);
    expect(entries).toHaveLength(6);
    const all = buildReviewQueue(entries, {}, 20, "adaptive", Date.UTC(2026, 10, 1), () => 0.37);
    expect(all).toHaveLength(6);
    expect(new Set(all.map(q => q.id)).size).toBe(6);
    const wider = buildReviewQueue(qaEntries, {}, 20, "mixed", Date.UTC(2026, 10, 1), () => 0.31);
    expect(wider).toHaveLength(20);
    expect(new Set(wider.map(q => q.id)).size).toBe(20);
  });
});
