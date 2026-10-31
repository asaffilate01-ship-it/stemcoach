import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { nextQAExpansion } from "@/data/tutorialExpansionNext";
import { qaEntries } from "@/data/qaClinic";
import { tutorials } from "@/data/tutorials";
import { emptyResponse, inspectQuestion, isCorrectResponse, displayAnswer } from "@/lib/qaEngine";
import { buildReviewQueue, getReviewSummary, parseReviewHistory, recordReviewAttempt, reviewPriority, serialiseReviewHistory } from "@/lib/qaPractice";

const src = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Q&A next phase: diagrams, cloze and adaptive review", () => {
  it("adds 14 lessons, 56 new questions and nine answer formats without duplicates", () => {
    expect(nextQAExpansion).toHaveLength(14);
    expect(new Set(nextQAExpansion.map((lesson) => lesson.subject)).size).toBe(14);
    expect(tutorials).toHaveLength(99);
    expect(qaEntries).toHaveLength(331);
    expect(new Set(qaEntries.map((entry) => entry.id)).size).toBe(331);
    const formats = new Set(qaEntries.map((entry) => entry.format));
    expect([...formats].sort()).toEqual([
      "single", "multiple", "true-false", "numeric", "short-text",
      "ordering", "matching", "fill-blanks", "diagram-label", "expression", "graph-point", "multi-step",
    ].sort());
    for (const lesson of nextQAExpansion) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.lesson.length).toBeGreaterThanOrEqual(3);
      expect(lesson.workedExample.length).toBeGreaterThan(60);
      expect(lesson.examTip?.length).toBeGreaterThan(12);
      expect(lesson.commonMistake?.length).toBeGreaterThan(12);
      const checks = [lesson.checkpoint, ...(lesson.practice || [])];
      expect(checks.length).toBe(4);
      for (const q of checks) {
        expect(inspectQuestion(q), lesson.id + ": " + q.question).toEqual([]);
        expect(q.hint?.length).toBeGreaterThan(15);
      }
    }
  });

  it("requires all blanks and grades written answers case-insensitively", () => {
    const q = nextQAExpansion.find((lesson) => lesson.id === "reaction-energetics")!.checkpoint;
    expect(q.format).toBe("fill-blanks");
    const empty = emptyResponse(q);
    expect(isCorrectResponse(q, empty)).toBe(false);
    empty.matches = { exo: "Negative" };
    expect(isCorrectResponse(q, empty)).toBe(false);
    empty.matches = { exo: "negative.", endo: " POSITIVE " };
    expect(isCorrectResponse(q, empty)).toBe(true);
    expect(displayAnswer(q)).toContain("exothermic");
  });

  it("grades diagram labels using every marked position; never trusts a partial mapping", () => {
    const diagrams = nextQAExpansion.flatMap((lesson) => [lesson.checkpoint, ...(lesson.practice || [])])
      .filter((question) => question.format === "diagram-label");
    expect(diagrams).toHaveLength(4);
    for (const q of diagrams) {
      const state = emptyResponse(q);
      expect(isCorrectResponse(q, state)).toBe(false);
      state.matches = Object.fromEntries(q.diagram!.markers.map((marker) => [marker.id, marker.answer]));
      expect(isCorrectResponse(q, state)).toBe(true);
      const first = q.diagram!.markers[0];
      state.matches[first.id] = q.options.find((option) => option !== first.answer)!;
      expect(isCorrectResponse(q, state)).toBe(false);
    }
  });

  it("rejects invalid cloze and forged diagram label schemas", () => {
    const cloze = nextQAExpansion.find((lesson) => lesson.id === "reaction-energetics")!.checkpoint;
    expect(inspectQuestion({ ...cloze, blanks: [cloze.blanks![0], cloze.blanks![0]] })).toContain("fill-in answer key invalid");
    const diagram = nextQAExpansion.find((lesson) => lesson.id === "animal-cell-diagram")!.checkpoint;
    expect(inspectQuestion({ ...diagram, diagram: {
      ...diagram.diagram!, markers: diagram.diagram!.markers.map((marker) => ({ ...marker, x: 999 })),
    } })).toContain("diagram label key invalid");
  });

  it("records first attempts only once and schedules honest weak-topic review", () => {
    const now = Date.UTC(2026, 9, 16, 11);
    const original = recordReviewAttempt({}, "q1", false, true, now);
    expect(original.q1.attempts).toBe(1);
    expect(original.q1.incorrectFirst).toBe(1);
    expect(original.q1.dueAt).toBe(now);
    const correction = recordReviewAttempt(original, "q1", true, false, now + 3000);
    expect(correction.q1.incorrectFirst).toBe(1);
    expect(correction.q1.correctFirst).toBe(0);
    expect(correction.q1.attempts).toBe(1);
    const mastered = recordReviewAttempt({}, "q2", true, true, now);
    expect(mastered.q2.correctFirst).toBe(1);
    expect(mastered.q2.dueAt).toBe(mastered.q2.memory!.due);
    expect(mastered.q2.dueAt).toBeGreaterThan(now);
    expect(reviewPriority("q1", correction, now + 4000)).toBeGreaterThan(reviewPriority("q2", mastered, now + 4000));
    const second = recordReviewAttempt(mastered, "q2", true, true, now + 86_400_001);
    expect(second.q2.dueAt).toBe(second.q2.memory!.due);
    expect(second.q2.memory!.reps).toBe(2);
  });

  it("selects unique adaptive questions, varies subjects and preserves optional filters", () => {
    const now = Date.UTC(2026, 9, 16);
    const entries = qaEntries.filter((entry) => entry.subject === "biology" || entry.subject === "physics");
    const failed = entries[0].id;
    const history = recordReviewAttempt({}, failed, false, true, now);
    const queue = buildReviewQueue(entries, history, 10, "adaptive", now, () => 0.35);
    expect(queue).toHaveLength(10);
    expect(new Set(queue.map((entry) => entry.id)).size).toBe(10);
    expect(queue.every((entry) => entries.some((candidate) => candidate.id === entry.id))).toBe(true);
    expect(reviewPriority(failed, history, now)).toBeGreaterThan(reviewPriority("unknown", history, now));
    const stats = getReviewSummary(entries, history, now);
    expect(stats.practiced).toBe(1);
    expect(stats.due).toBe(1);
    expect(stats.weakTopics[0].misses).toBe(1);
  });

  it("persists only bounded local performance metadata, and rejects unsafe history", () => {
    const now = Date.UTC(2026, 9, 16);
    const id = qaEntries[0].id;
    const ids = new Set(qaEntries.map((entry) => entry.id));
    const recorded = recordReviewAttempt({}, id, true, true, now);
    const encoded = serialiseReviewHistory(recorded);
    expect(encoded).not.toContain(qaEntries[0].question);
    expect(parseReviewHistory(encoded, ids)).toEqual(recorded);
    expect(parseReviewHistory("{not-json", ids)).toEqual({});
    expect(parseReviewHistory(serialiseReviewHistory({ unknown: recorded[id] }), ids)).toEqual({});
    expect(parseReviewHistory(JSON.stringify({ version: 2, entries: recorded }), ids)).toEqual({});
  });

  it("does not use AI or expose model keys to score interactive lessons", () => {
    const engine = src("src/lib/qaEngine.ts");
    const page = src("src/pages/QAClinic.tsx");
    const component = src("src/components/qa/QuestionInteraction.tsx");
    expect(engine).toContain('case "fill-blanks"');
    expect(engine).toContain('case "diagram-label"');
    expect(component).toContain("DiagramCanvas");
    expect(component).toContain("attemptCount === 0 && !solutionViewed");
    expect(component).toContain("SpeechSynthesisUtterance");
    expect(page).toContain('startChallenge("adaptive")');
    expect(page).toContain('startChallenge("timed")');
    expect(page).toContain("recordReviewAttempt");
    expect(page).toContain("QA_HISTORY_KEY");
    expect(page).not.toContain('functions.invoke("ai-chat"');
  });
});
