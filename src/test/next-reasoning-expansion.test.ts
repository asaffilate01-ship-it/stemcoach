import { describe, expect, it } from "vitest";
import { nextReasoningExpansion } from "@/data/nextReasoningExpansion";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";
import { emptyResponse, getQuestionFormat, hasResponse, inspectQuestion, isCorrectResponse } from "@/lib/qaEngine";

const checks = (lesson: (typeof tutorials)[number]) => [lesson.checkpoint, ...(lesson.practice || [])];

describe("STEMCoach next phase: worked reasoning, study skills and answer integrity", () => {
  it("adds 12 truly authored lessons and 96 self-checks, not merely numeric variants", () => {
    expect(nextReasoningExpansion).toHaveLength(12);
    expect(nextReasoningExpansion.every(lesson => checks(lesson).length === 8)).toBe(true);
    expect(tutorials).toHaveLength(212);
    expect(qaEntries).toHaveLength(1262);
    expect(new Set(tutorials.map(lesson => lesson.id)).size).toBe(212);
    expect(new Set(qaEntries.map(entry => entry.id)).size).toBe(1262);
    expect(new Set(tutorials.map(lesson => lesson.subject + ":" + lesson.title.toLocaleLowerCase().trim())).size).toBe(212);
    expect(TUTORIAL_CONTEXTS.map(({ id, subject, title }) => ({ id, subject, title })))
      .toEqual(tutorials.map(({ id, subject, title }) => ({ id, subject, title })));
    expect(nextReasoningExpansion.reduce((n, lesson) => n + checks(lesson).length, 0)).toBe(96);
    expect(Object.fromEntries([...new Set(nextReasoningExpansion.map(lesson => lesson.subject))]
      .map(subject => [subject, nextReasoningExpansion.filter(lesson => lesson.subject === subject).length])))
      .toEqual({ mathematics: 3, physics: 3, chemistry: 2, biology: 2, "computer-science": 2 });
  });

  it("preserves nontrivial teaching, worked answers, explanations and hint length", () => {
    const stems = new Set<string>();
    for (const lesson of nextReasoningExpansion) {
      expect(lesson.summary.length, lesson.id).toBeGreaterThan(45);
      expect(lesson.objectives.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.every(text => text.length > 65), lesson.id).toBe(true);
      expect(lesson.workedExample.length, lesson.id).toBeGreaterThan(110);
      expect(lesson.examTip?.length, lesson.id).toBeGreaterThan(35);
      expect(lesson.commonMistake?.length, lesson.id).toBeGreaterThan(35);
      for (const question of checks(lesson)) {
        expect(inspectQuestion(question), lesson.id + ": " + question.question).toEqual([]);
        expect(question.explanation.length, question.question).toBeGreaterThan(40);
        expect(question.hint?.length, question.question).toBeGreaterThan(18);
        const stem = question.question.normalize("NFKC").trim().toLocaleLowerCase();
        expect(stems.has(stem), "Duplicate question text: " + stem).toBe(false);
        stems.add(stem);
      }
    }
    expect(stems.size).toBe(96);
  });

  it("grades all keys deterministically and rejects blank, fabricated or incorrect submissions", () => {
    const formats = new Set<string>();
    for (const lesson of nextReasoningExpansion) {
      for (const question of checks(lesson)) {
        const response = emptyResponse(question);
        expect(hasResponse(question, response)).toBe(false);
        expect(isCorrectResponse(question, response)).toBe(false);
        const format = getQuestionFormat(question);
        formats.add(format);
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
          default:
            throw new Error("Unexpected format " + format);
        }
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(true);
        switch (format) {
          case "single":
          case "true-false":
            response.choice = question.options.find(option => option !== question.answer) || "incorrect";
            break;
          case "multiple":
            response.choices = (question.answers || []).slice(0, 1);
            break;
          case "numeric":
          case "short-text":
            response.freeText = "not a correct answer";
            break;
          case "ordering":
            response.order = [...(question.answers || [])].reverse();
            response.orderTouched = true;
            break;
        }
        expect(isCorrectResponse(question, response), "Wrong answer incorrectly scored: " + question.question).toBe(false);
      }
    }
    expect(formats).toEqual(new Set(["single", "true-false", "multiple", "numeric", "ordering", "short-text"]));
  });

  it("keeps these self-checks out of the bank's reviewed/paid inventory", () => {
    const ids = new Set(nextReasoningExpansion.map(lesson => lesson.id));
    const entries = qaEntries.filter(item => ids.has(item.tutorialId));
    expect(entries).toHaveLength(96);
    for (const lesson of nextReasoningExpansion) {
      const items = entries.filter(item => item.tutorialId === lesson.id);
      expect(items).toHaveLength(8);
      expect(items.every(item => item.subject === lesson.subject && item.topic === lesson.title)).toBe(true);
    }
  });
});
