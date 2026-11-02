import { describe, expect, it } from "vitest";
import { novemberQAExpansion } from "@/data/tutorialExpansionNovember";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { subjects } from "@/data/questions";
import { inspectQuestion, isCorrectResponse, emptyResponse, hasResponse, getQuestionFormat } from "@/lib/qaEngine";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";

const checksOf = (tutorial: typeof tutorials[number]) => [tutorial.checkpoint, ...(tutorial.practice || [])];

describe("November 2026 authored multi-subject expansion", () => {
  it("adds 14 complete guided lessons, one for each available subject", () => {
    expect(novemberQAExpansion).toHaveLength(14);
    expect(new Set(novemberQAExpansion.map(lesson => lesson.subject))).toEqual(
      new Set(subjects.map(subject => subject.id)),
    );
    expect(novemberQAExpansion.every(lesson => checksOf(lesson).length === 8)).toBe(true);
    expect(novemberQAExpansion.reduce((n, lesson) => n + checksOf(lesson).length, 0)).toBe(112);
    expect(tutorials).toHaveLength(141);
    expect(qaEntries).toHaveLength(664);
    expect(new Set(tutorials.map(lesson => lesson.id)).size).toBe(141);
    expect(new Set(qaEntries.map(entry => entry.id)).size).toBe(664);
    expect(TUTORIAL_CONTEXTS.map(({ id, subject, title }) => ({ id, subject, title })))
      .toEqual(tutorials.map(({ id, subject, title }) => ({ id, subject, title })));
  });

  it("requires genuine guidance, hints and coherent explanations without duplicate questions", () => {
    const known = new Set<string>();
    for (const lesson of tutorials) {
      const uniqueTitle = lesson.subject + ":" + lesson.title.toLowerCase().trim();
      expect(known.has(uniqueTitle), uniqueTitle).toBe(false);
      known.add(uniqueTitle);
    }

    for (const lesson of novemberQAExpansion) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.length).toBeGreaterThanOrEqual(3);
      expect(lesson.workedExample.length).toBeGreaterThan(70);
      expect(lesson.examTip?.length).toBeGreaterThan(25);
      expect(lesson.commonMistake?.length).toBeGreaterThan(25);
      const seen = new Set<string>();
      for (const question of checksOf(lesson)) {
        expect(inspectQuestion(question), lesson.id + ": " + question.question).toEqual([]);
        expect(question.explanation.length).toBeGreaterThan(40);
        expect(question.hint?.length).toBeGreaterThan(18);
        const normalized = question.question.normalize("NFKC").trim().toLowerCase();
        expect(seen.has(normalized), "Duplicate question in " + lesson.id).toBe(false);
        seen.add(normalized);
      }
    }
  });

  it("deterministically accepts correct keys for every added format without model calls", () => {
    const formats = new Set<string>();
    for (const lesson of novemberQAExpansion) {
      for (const question of checksOf(lesson)) {
        const format = getQuestionFormat(question);
        formats.add(format);
        const response = emptyResponse(question);
        switch (format) {
          case "single":
          case "true-false":
            response.choice = question.answer;
            break;
          case "multiple":
            response.choices = [...(question.answers || [])];
            break;
          case "numeric":
          case "short-text":
            response.freeText = question.answer;
            break;
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
          default:
            throw new Error("Unexpected question format " + format);
        }
        expect(hasResponse(question, response)).toBe(true);
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(true);
      }
    }
    expect(formats).toEqual(new Set([
      "single", "numeric", "true-false", "multiple", "ordering", "fill-blanks", "short-text", "matching",
    ]));
  });

  it("rejects wrong first attempts rather than rewarding a solution reveal or incomplete submission", () => {
    for (const lesson of novemberQAExpansion) {
      for (const question of checksOf(lesson)) {
        const blank = emptyResponse(question);
        expect(hasResponse(question, blank), lesson.id).toBe(false);
        expect(isCorrectResponse(question, blank), lesson.id).toBe(false);
        const response = emptyResponse(question);
        switch (getQuestionFormat(question)) {
          case "single":
          case "true-false":
            response.choice = question.options.find(value => value !== question.answer) || "bad";
            break;
          case "multiple":
            response.choices = (question.answers || []).slice(0, 1);
            break;
          case "numeric":
          case "short-text":
            response.freeText = "an incorrect answer";
            break;
          case "ordering":
            response.order = [...(question.answers || [])].reverse();
            response.orderTouched = true;
            break;
          case "matching":
            response.matches = Object.fromEntries((question.pairs || []).map(pair => [pair.left, "not a matching value"]));
            break;
          case "fill-blanks":
            response.matches = Object.fromEntries((question.blanks || []).map(blank => [blank.id, "not a correct response"]));
            break;
        }
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(false);
      }
    }
  });

  it("keeps the additional questions in lesson-specific, no-charge self-checks", () => {
    const addedIds = new Set(novemberQAExpansion.map(lesson => lesson.id));
    for (const lesson of novemberQAExpansion) {
      const questions = qaEntries.filter(entry => entry.tutorialId === lesson.id);
      expect(questions).toHaveLength(8);
      expect(questions.every(entry => addedIds.has(entry.tutorialId))).toBe(true);
      expect(questions.every(entry => entry.topic === lesson.title)).toBe(true);
    }
  });
});
