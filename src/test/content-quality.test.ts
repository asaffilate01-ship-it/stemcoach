import { describe, expect, it } from "vitest";
import { curricula, sampleQuestions } from "@/data/questions";
import { mockExamTemplates, examBoardGroups } from "@/data/mockExamTemplates";
import { curriculumAuthorities } from "@/data/curriculumAuthorities";
import { DEFAULT_COACH_ID, getCoachChoices, getSquadMembers, isCoachId } from "@/lib/mascots";
import { tutorials } from "@/data/tutorials";

const unique = (values: string[]) => new Set(values).size === values.length;

describe("content integrity", () => {
  it("uses unique curriculum and question identifiers", () => {
    expect(unique(curricula.map((item) => item.id))).toBe(true);
    expect(unique(sampleQuestions.map((item) => item.id))).toBe(true);
  });

  it("keeps sample answers structurally valid", () => {
    const curriculaIds = new Set(curricula.map((item) => item.id));
    for (const question of sampleQuestions) {
      expect(question.text.trim().length).toBeGreaterThan(10);
      expect(question.explanation.trim().length).toBeGreaterThan(15);
      expect(question.workedSolution.trim().length).toBeGreaterThan(10);
      expect(question.tuitionTips.length).toBeGreaterThan(0);
      expect(question.difficulty).toBeGreaterThanOrEqual(1);
      expect(question.difficulty).toBeLessThanOrEqual(5);
      expect(curriculaIds.has(question.curriculum)).toBe(true);
      if (question.options?.length) expect(question.options).toContain(question.correctAnswer);
    }
  });

  it("only exposes structurally sound mock-exam templates", () => {
    expect(unique(mockExamTemplates.map((item) => item.id))).toBe(true);
    const curriculaIds = new Set(curricula.map((item) => item.id));
    for (const template of mockExamTemplates) {
      expect(curriculaIds.has(template.curriculum)).toBe(true);
      expect(template.questionCount).toBeGreaterThan(0);
      expect(template.durationMinutes).toBeGreaterThan(0);
      expect(template.totalMarks).toBeGreaterThan(0);
    }
    for (const group of examBoardGroups) {
      expect(group.label).toBeTruthy();
      expect(Array.isArray(group.boards)).toBe(true);
      expect(group.boards.length).toBeGreaterThan(0);
      expect(curriculaIds.has(group.curriculum)).toBe(true);
    }
  });

  it("records official curriculum provenance", () => {
    expect(curriculumAuthorities.length).toBeGreaterThanOrEqual(13);
    for (const source of curriculumAuthorities) {
      expect(source.sourceUrl).toMatch(/^https:\/\//);
      expect(source.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.scopeNote.length).toBeGreaterThan(20);
    }
  });

  it("uses consistent mascot names and image paths", () => {
    const byName = new Map<string, string>();
    for (const mascot of getSquadMembers()) {
      if (byName.has(mascot.name)) expect(mascot.image).toBe(byName.get(mascot.name));
      byName.set(mascot.name, mascot.image);
    }
    expect(byName.has("Psyche")).toBe(true);
    expect(byName.has(["Py", "sche"].join(""))).toBe(false);
    const choices = getCoachChoices();
    expect(unique(choices.map((choice) => choice.id))).toBe(true);
    expect(choices.every((choice) => choice.image.startsWith("/assets/"))).toBe(true);
    expect(isCoachId(DEFAULT_COACH_ID)).toBe(true);
  });

  it("ships tutorials with checked answers", () => {
    expect(tutorials.length).toBeGreaterThanOrEqual(20);
    for (const tutorial of tutorials) {
      expect(tutorial.objectives.length).toBeGreaterThanOrEqual(3);
      expect(tutorial.lesson.length).toBeGreaterThanOrEqual(3);
      expect(tutorial.checkpoint.options).toContain(tutorial.checkpoint.answer);
      for (const checkpoint of tutorial.practice || []) {
        expect(checkpoint.options).toContain(checkpoint.answer);
        expect(checkpoint.explanation.length).toBeGreaterThan(15);
      }
    }
  });
});
