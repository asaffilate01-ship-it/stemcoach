import { describe, expect, it } from "vitest";
import { november2026STEMLessons } from "@/data/november2026STEMLessons";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { emptyResponse, getQuestionFormat, hasResponse, inspectQuestion, isCorrectResponse } from "@/lib/qaEngine";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";

const questionsOf = (lesson: (typeof tutorials)[number]) => [lesson.checkpoint, ...(lesson.practice || [])];

describe("20 original STEM lessons and 160 mixed-format self-checks", () => {
  it("adds four complete lesson modules per STEM subject without inflating old content", () => {
    expect(november2026STEMLessons).toHaveLength(20);
    expect(tutorials).toHaveLength(176);
    expect(qaEntries).toHaveLength(974);
    expect(new Set(tutorials.map(lesson => lesson.id)).size).toBe(176);
    expect(new Set(qaEntries.map(item => item.id)).size).toBe(974);
    expect(new Set(tutorials.map(lesson => lesson.subject + ":" + lesson.title.toLowerCase().trim())).size).toBe(176);
    const grouped = new Map<string, number>();
    for (const item of november2026STEMLessons) grouped.set(item.subject, (grouped.get(item.subject) || 0) + 1);
    expect(Object.fromEntries(grouped.entries())).toEqual({
      mathematics: 4, physics: 4, chemistry: 4, biology: 4, "computer-science": 4,
    });
    expect(november2026STEMLessons.every(lesson => questionsOf(lesson).length === 8)).toBe(true);
    expect(november2026STEMLessons.reduce((n, lesson) => n + questionsOf(lesson).length, 0)).toBe(160);
    expect(TUTORIAL_CONTEXTS.map(({ id, subject, title }) => ({ id, subject, title })))
      .toEqual(tutorials.map(({ id, subject, title }) => ({ id, subject, title })));
  });

  it("requires substantive teaching, explanation and hints for every additional question", () => {
    for (const lesson of november2026STEMLessons) {
      expect(lesson.summary.length, lesson.id).toBeGreaterThan(48);
      expect(lesson.objectives.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.every(p => p.length > 65), lesson.id).toBe(true);
      expect(lesson.workedExample.length, lesson.id).toBeGreaterThan(100);
      expect(lesson.examTip?.length, lesson.id).toBeGreaterThan(35);
      expect(lesson.commonMistake?.length, lesson.id).toBeGreaterThan(35);
      const seenQuestions = new Set<string>();
      for (const question of questionsOf(lesson)) {
        expect(inspectQuestion(question), lesson.id + ": " + question.question).toEqual([]);
        expect(question.explanation.length, lesson.id + ": " + question.question).toBeGreaterThan(40);
        expect(question.hint?.length, lesson.id + ": " + question.question).toBeGreaterThan(18);
        const key = question.question.normalize("NFKC").toLocaleLowerCase().trim();
        expect(seenQuestions.has(key), lesson.id + ": duplicate " + key).toBe(false);
        seenQuestions.add(key);
      }
    }
  });

  it("deterministically accepts authored keys for every new format without external AI scoring", () => {
    const encountered = new Set<string>();
    for (const lesson of november2026STEMLessons) {
      for (const question of questionsOf(lesson)) {
        const response = emptyResponse(question);
        expect(hasResponse(question, response)).toBe(false);
        expect(isCorrectResponse(question, response)).toBe(false);
        const format = getQuestionFormat(question);
        encountered.add(format);
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
            throw new Error("Unexpected format " + format);
        }
        expect(hasResponse(question, response), lesson.id + ": " + question.question).toBe(true);
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(true);
      }
    }
    expect(encountered).toEqual(new Set(["single", "numeric", "true-false", "multiple", "ordering", "matching"]));
  });

  it("keeps additional formative QA visible through the existing learner catalogue, not a paid assessment bank", () => {
    const ids = new Set(november2026STEMLessons.map(lesson => lesson.id));
    const fresh = qaEntries.filter(entry => ids.has(entry.tutorialId));
    expect(fresh).toHaveLength(160);
    for (const lesson of november2026STEMLessons) {
      const entries = fresh.filter(entry => entry.tutorialId === lesson.id);
      expect(entries).toHaveLength(8);
      expect(entries.every(entry => entry.subject === lesson.subject && entry.topic === lesson.title)).toBe(true);
    }
  });
});
