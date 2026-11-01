import { describe, expect, it } from "vitest";
import { buildQAWeeklyPlan } from "@/lib/qaWeeklyPlan";
import { qaEntries } from "@/data/qaClinic";
import { recordReviewAttempt } from "@/lib/qaPractice";

const now = new Date(2026, 10, 1, 12, 0).getTime();
const sample = qaEntries.slice(0, 60);

describe("private seven-day Q&A revision plan", () => {
  it("builds seven five-question sets without duplicates, even on empty device history", () => {
    const days = buildQAWeeklyPlan(sample, {}, now);
    expect(days).toHaveLength(7);
    expect(days.slice(0, 6).every(day => day.questionIds.length === 5)).toBe(true);
    expect(days.map(day => day.newCount)).toEqual([5, 5, 5, 5, 5, 5, 5]);
    const ids = days.flatMap(day => day.questionIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => sample.some(entry => entry.id === id))).toBe(true);
    expect(new Set(days[0].questionIds.map(id => sample.find(entry => entry.id === id)!.subject)).size).toBeGreaterThan(1);
  });

  it("places due and missed questions first, without scoring answers or writing data", () => {
    const overdue = recordReviewAttempt({}, sample[0].id, false, true, now - 10_000);
    const history = recordReviewAttempt(overdue, sample[1].id, true, true, now - 2 * 86_400_000);
    const days = buildQAWeeklyPlan(sample, history, now);
    expect(days[0].questionIds[0]).toBe(sample[0].id);
    expect(days[0].dueCount).toBe(2);
    expect(days[0].missedCount).toBe(1);
    expect(days[0].newCount).toBe(3);
    expect(days.flatMap(day => day.questionIds).filter(id => id === sample[0].id)).toHaveLength(1);
    expect(history[sample[0].id].incorrectFirst).toBe(1);
  });

  it("only schedules future review once due and does not force already-mastered questions", () => {
    const history = recordReviewAttempt({}, sample[0].id, true, true, now);
    const days = buildQAWeeklyPlan([sample[0]], history, now);
    expect(days[0].questionIds).toHaveLength(0);
    expect(days[1].questionIds).toEqual([sample[0].id]);
    expect(days.slice(2).every(day => day.questionIds.length === 0)).toBe(true);
  });

  it("respects filtered input, a small bank and safe invalid-date or capacity bounds", () => {
    const filtered = sample.slice(0, 3);
    const days = buildQAWeeklyPlan(filtered, {}, now, 20);
    expect(days[0].questionIds).toHaveLength(3);
    expect(days.slice(1).every(day => day.questionIds.length === 0)).toBe(true);
    expect(buildQAWeeklyPlan([], {}, now)).toHaveLength(7);
    expect(buildQAWeeklyPlan(filtered, {}, Number.NaN)).toEqual([]);
    expect(buildQAWeeklyPlan(filtered, {}, now, 999)[0].questionIds).toHaveLength(3);
    expect(buildQAWeeklyPlan(filtered, {}, now, 0)[0].questionIds).toHaveLength(1);
  });

  it("uses local calendar dates rather than 24-hour jumps across DST", () => {
    const days = buildQAWeeklyPlan([], {}, new Date(2026, 9, 24, 12).getTime());
    expect(days.map(day => new Date(day.startAt).getDate())).toEqual([24, 25, 26, 27, 28, 29, 30]);
    expect(days.every(day => new Date(day.startAt).getHours() === 0)).toBe(true);
  });
});
