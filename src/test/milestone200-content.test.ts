import { describe, expect, it } from "vitest";
import { milestone200Lessons } from "@/data/milestone200Lessons";
import { tutorials } from "@/data/tutorials";
import { qaEntries } from "@/data/qaClinic";
import { TUTORIAL_CONTEXTS } from "../../supabase/functions/_shared/tutorialCatalog";
import { emptyResponse, getQuestionFormat, hasResponse, inspectQuestion, isCorrectResponse } from "@/lib/qaEngine";

const checksOf = (lesson: typeof tutorials[number]) => [lesson.checkpoint, ...(lesson.practice || [])];

describe("200 substantive guided lessons and additional formative Q&A", () => {
  it("adds 24 original lessons across seven subjects with 192 different self-check IDs", () => {
    expect(milestone200Lessons).toHaveLength(24);
    expect(tutorials).toHaveLength(200);
    expect(qaEntries).toHaveLength(1166);
    const bySubject = Object.fromEntries(
      [...new Set(milestone200Lessons.map(lesson => lesson.subject))]
        .map(subject => [subject, milestone200Lessons.filter(lesson => lesson.subject === subject).length]),
    );
    expect(bySubject).toEqual({
      mathematics: 4, physics: 4, chemistry: 4, biology: 4,
      "computer-science": 4, economics: 2, geography: 2,
    });
    expect(new Set(tutorials.map(lesson => lesson.id)).size).toBe(200);
    expect(new Set(tutorials.map(lesson => lesson.subject + "::" + lesson.title.toLocaleLowerCase().trim())).size).toBe(200);
    expect(new Set(qaEntries.map(item => item.id)).size).toBe(1166);
    expect(milestone200Lessons.every(lesson => checksOf(lesson).length === 8)).toBe(true);
    expect(milestone200Lessons.reduce((sum, lesson) => sum + checksOf(lesson).length, 0)).toBe(192);
    expect(TUTORIAL_CONTEXTS.map(({ id, subject, title }) => ({ id, subject, title })))
      .toEqual(tutorials.map(({ id, subject, title }) => ({ id, subject, title })));
  });

  it("requires explanations, worked examples, hints and unique question text in each new lesson", () => {
    for (const lesson of milestone200Lessons) {
      expect(lesson.summary.length, lesson.id).toBeGreaterThan(45);
      expect(lesson.objectives.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.every(text => text.length > 65), lesson.id).toBe(true);
      expect(lesson.workedExample.length, lesson.id).toBeGreaterThan(110);
      expect(lesson.examTip?.length, lesson.id).toBeGreaterThan(35);
      expect(lesson.commonMistake?.length, lesson.id).toBeGreaterThan(35);
      const seen = new Set<string>();
      for (const question of checksOf(lesson)) {
        expect(inspectQuestion(question), lesson.id + ": " + question.question).toEqual([]);
        expect(question.explanation.length, lesson.id + ": " + question.question).toBeGreaterThan(40);
        expect(question.hint?.length, lesson.id + ": " + question.question).toBeGreaterThan(18);
        const stem = question.question.normalize("NFKC").trim().toLocaleLowerCase();
        expect(seen.has(stem), lesson.id + ": repeated stem").toBe(false);
        seen.add(stem);
      }
    }
  });

  it("accepts every correct authored response without making an AI grading call", () => {
    const formats = new Set<string>();
    for (const lesson of milestone200Lessons) {
      for (const question of checksOf(lesson)) {
        const response = emptyResponse(question);
        const format = getQuestionFormat(question);
        formats.add(format);
        expect(hasResponse(question, response), lesson.id).toBe(false);
        expect(isCorrectResponse(question, response), lesson.id).toBe(false);
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
            throw new Error("Unexpected format in new pack: " + format);
        }
        expect(hasResponse(question, response), lesson.id + ": " + question.question).toBe(true);
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(true);
      }
    }
    expect(formats).toEqual(new Set(["single", "numeric", "short-text", "true-false", "multiple", "ordering"]));
  });

  it("rejects intentionally incorrect responses rather than granting unearned mastery", () => {
    for (const lesson of milestone200Lessons) {
      for (const question of checksOf(lesson)) {
        const response = emptyResponse(question);
        switch (getQuestionFormat(question)) {
          case "single":
          case "true-false":
            response.choice = question.options.find(option => option !== question.answer) || "incorrect";
            break;
          case "multiple":
            response.choices = [...(question.answers || [])].slice(0, 1);
            break;
          case "numeric":
          case "short-text":
            response.freeText = "not a correct answer";
            break;
          case "ordering":
            response.order = [...(question.answers || [])].reverse();
            response.orderTouched = true;
            break;
          default:
            throw new Error("Unexpected format when testing incorrect response");
        }
        expect(isCorrectResponse(question, response), lesson.id + ": " + question.question).toBe(false);
      }
    }
  });

  it("keeps the 192 new questions in the public self-check catalogue, not a paid question bank", () => {
    const ids = new Set(milestone200Lessons.map(lesson => lesson.id));
    const newEntries = qaEntries.filter(entry => ids.has(entry.tutorialId));
    expect(newEntries).toHaveLength(192);
    for (const lesson of milestone200Lessons) {
      const entries = newEntries.filter(entry => entry.tutorialId === lesson.id);
      expect(entries).toHaveLength(8);
      expect(entries.every(entry => entry.subject === lesson.subject && entry.topic === lesson.title)).toBe(true);
    }
  });
});
