import { describe, expect, it } from "vitest";
import { qaEntries } from "@/data/qaClinic";
import { subjects } from "@/data/questions";
import { stemExpansion } from "@/data/stemExpansion";
import { tutorials } from "@/data/tutorials";
import { displayAnswer, emptyResponse, getQuestionFormat, inspectQuestion, isCorrectResponse } from "@/lib/qaEngine";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("expanded STEMCoach Question & Answer clinic", () => {
  it("adds genuine author-drafted tutorials and practice across all fourteen subjects", () => {
    const expected = tutorials.reduce((total, lesson) => total + 1 + (lesson.practice?.length || 0), 0);
    expect(tutorials).toHaveLength(57);
    expect(stemExpansion).toHaveLength(28);
    expect(stemExpansion.every((lesson) => lesson.practice?.length === 3)).toBe(true);
    expect(qaEntries).toHaveLength(expected);
    expect(qaEntries).toHaveLength(160);
    expect(new Set(qaEntries.map((entry) => entry.id)).size).toBe(qaEntries.length);
    expect(new Set(tutorials.map((entry) => entry.id)).size).toBe(tutorials.length);
    expect(new Set(qaEntries.map((entry) => entry.subject))).toEqual(new Set(subjects.map((subject) => subject.id)));
    for (const subject of subjects) {
      expect(stemExpansion.filter((entry) => entry.subject === subject.id)).toHaveLength(2);
    }
  });

  it("validates structured answer keys and rich explanations for every new lesson", () => {
    const formats = new Set<string>();
    for (const lesson of stemExpansion) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.length).toBeGreaterThanOrEqual(3);
      expect(lesson.workedExample.length).toBeGreaterThan(70);
      expect(lesson.examTip?.length).toBeGreaterThan(20);
      expect(lesson.commonMistake?.length).toBeGreaterThan(20);
      const checks = [lesson.checkpoint, ...(lesson.practice || [])];
      for (const checkpoint of checks) {
        expect(inspectQuestion(checkpoint), lesson.id + ": " + checkpoint.question).toEqual([]);
        expect(checkpoint.hint?.length).toBeGreaterThan(16);
        formats.add(getQuestionFormat(checkpoint));
      }
    }
    expect([...formats].sort()).toEqual(["matching", "multiple", "numeric", "ordering", "short-text", "single", "true-false"].sort());
  });

  it("grades each interaction type deterministically without a model call", () => {
    const byType = Object.fromEntries(qaEntries.map((entry) => [entry.format, entry.checkpoint]));
    for (const kind of ["single", "multiple", "true-false", "numeric", "short-text", "ordering", "matching"]) {
      const question = byType[kind];
      expect(question).toBeDefined();
      const state = emptyResponse(question);
      expect(isCorrectResponse(question, state)).toBe(false);
      if (kind === "single" || kind === "true-false") {
        state.choice = question.answer;
      } else if (kind === "multiple") {
        state.choices = [...(question.answers || [])].reverse();
      } else if (kind === "numeric") {
        state.freeText = question.answer;
      } else if (kind === "short-text") {
        state.freeText = question.answer.toUpperCase() + ".";
      } else if (kind === "ordering") {
        state.order = [...(question.answers || [])];
      } else if (kind === "matching") {
        state.matches = Object.fromEntries((question.pairs || []).map((pair) => [pair.left, pair.right]));
      }
      expect(isCorrectResponse(question, state), kind).toBe(true);
      expect(displayAnswer(question).trim().length).toBeGreaterThan(1);
    }
  });

  it("rejects partial, duplicate, incorrect and out-of-order responses", () => {
    const multiple = qaEntries.find((entry) => entry.format === "multiple")!.checkpoint;
    const incorrectMultiple = emptyResponse(multiple);
    incorrectMultiple.choices = (multiple.answers || []).slice(0, 1);
    expect(isCorrectResponse(multiple, incorrectMultiple)).toBe(false);
    incorrectMultiple.choices = Array(2).fill(multiple.answers![0]);
    expect(isCorrectResponse(multiple, incorrectMultiple)).toBe(false);

    const number = qaEntries.find((entry) => entry.format === "numeric")!.checkpoint;
    const invalidNumber = emptyResponse(number);
    invalidNumber.freeText = "1e500";
    expect(isCorrectResponse(number, invalidNumber)).toBe(false);

    const ordered = qaEntries.find((entry) => entry.format === "ordering")!.checkpoint;
    const incorrectOrder = emptyResponse(ordered);
    expect(isCorrectResponse(ordered, incorrectOrder)).toBe(false);
    const matched = qaEntries.find((entry) => entry.format === "matching")!.checkpoint;
    const incorrectMatches = emptyResponse(matched);
    incorrectMatches.matches = Object.fromEntries((matched.pairs || []).map((pair) => [pair.left, matched.options[0]]));
    expect(isCorrectResponse(matched, incorrectMatches)).toBe(false);
  });

  it("does not award answers or fake formal examination credit without the learner's input", () => {
    const interaction = src("src/components/qa/QuestionInteraction.tsx");
    const clinic = src("src/pages/QAClinic.tsx");
    const page = src("src/pages/Tutorials.tsx");
    expect(interaction).toContain("hasResponse(question, response)");
    expect(interaction).toContain("onAttempt?.(correct, attemptCount === 0)");
    expect(clinic).toContain("qaDraft: prompt");
    expect(clinic).toContain('const CHALLENGE_LENGTH = 10');
    expect(clinic).toContain("PAGE_SIZE = 16");
    expect(clinic).toContain("recordAttempt(entry.id, correct, firstAttempt)");
    expect(page).toContain("correctChecks.current.add");
    expect(page).toContain("currentlySaving.current.has");
    expect(clinic).not.toContain('functions.invoke("ai-chat"');
  });

  it("validates the server lesson catalogue separately from unreviewed exam question inventory", () => {
    const catalog = src("supabase/functions/_shared/tutorialCatalog.ts");
    const serverIds = [...catalog.matchAll(/\{ id: "([a-z0-9-]+)", subject: "([^"]+)", title: "([^"]+)" \}/g)];
    expect(serverIds).toHaveLength(tutorials.length);
    expect(new Set(serverIds.map((match) => match[1]))).toEqual(new Set(tutorials.map((lesson) => lesson.id)));
    for (const lesson of tutorials) {
      const serverEntry = serverIds.find((match) => match[1] === lesson.id);
      expect(serverEntry?.[2]).toBe(lesson.subject);
      expect(serverEntry?.[3]).toBe(lesson.title);
    }
  });

  it("requires a recorded attempt for the separate paid question bank's AI explanation", () => {
    const tutor = src("supabase/functions/ai-tutor/index.ts");
    const explain = tutor.slice(tutor.indexOf("async function explainQuestion("));
    expect(tutor).toContain("explainQuestion(params, LOVABLE_API_KEY, user.id)");
    expect(explain).toContain('.eq("review_status", "published")');
    expect(explain).toContain('.eq("user_id", userId)');
    expect(explain).toContain('.eq("question_id", question_id)');
    expect(explain).toContain("Complete the question before requesting its answer");
    expect(explain).not.toContain("params.correct_answer");
    expect(explain).not.toContain('getCache("explain"');
  });
});
