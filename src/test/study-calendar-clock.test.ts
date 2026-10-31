import { describe, expect, it } from "vitest";
import { calculateStudyStreak, getMonthDays, localDateKey, studyGoalPercent, validStudyTargets } from "@/lib/studyCalendar";
import { examDeadline, secondsToExamDeadline } from "@/lib/examClock";

describe("local study calendar", () => {
  it("produces chronological full weeks with unique local dates across a DST month", () => {
    const days = getMonthDays(2026, 2); // March, UK spring time change
    expect(days.length % 7).toBe(0);
    expect(days[0].date).toBe("2026-02-23");
    expect(days.filter(day => day.inMonth)).toHaveLength(31);
    expect(days.find(day => day.date === "2026-03-29")?.inMonth).toBe(true);
    expect(new Set(days.map(day => day.date)).size).toBe(days.length);
  });

  it("uses the date fields of local midnight and handles year rollover", () => {
    expect(localDateKey(new Date(2026, 11, 31, 23, 30))).toBe("2026-12-31");
    expect(localDateKey(new Date(2027, 0, 1, 0, 30))).toBe("2027-01-01");
    const february = getMonthDays(2027, 1);
    expect(february.filter(day => day.inMonth)).toHaveLength(28);
    expect(february.map(day => day.date)).toContain("2027-03-01");
  });

  it("keeps streaks across month boundaries and tolerates unfinished today", () => {
    const history = {
      "2026-11-01": { completed_questions: 0 },
      "2026-10-31": { completed_questions: 3 },
      "2026-10-30": { completed_questions: 2 },
      "2026-10-29": { completed_questions: 0 },
    };
    expect(calculateStudyStreak(history, new Date(2026, 10, 1, 20, 0))).toBe(2);
    expect(calculateStudyStreak(history, new Date(2026, 9, 31, 20, 0))).toBe(2);
    expect(calculateStudyStreak(history, new Date(2026, 10, 3, 12, 0))).toBe(0);
  });

  it("clamps impossible percentages and rejects invalid goals", () => {
    expect(studyGoalPercent(12, 10)).toBe(100);
    expect(studyGoalPercent(-3, 10)).toBe(0);
    expect(studyGoalPercent(10, 0)).toBe(0);
    expect(studyGoalPercent(Number.NaN, 10)).toBe(0);
    expect(validStudyTargets(1, 5)).toBe(true);
    expect(validStudyTargets(100, 300)).toBe(true);
    expect(validStudyTargets(0, 5)).toBe(false);
    expect(validStudyTargets(10.5, 30)).toBe(false);
    expect(validStudyTargets(100, 301)).toBe(false);
  });
});

describe("mock-exam elapsed-time clock", () => {
  it("recovers after a suspended tab and reaches zero once the deadline passes", () => {
    const startedAt = Date.UTC(2026, 9, 31, 8, 0, 0);
    const deadline = examDeadline(30, startedAt);
    expect(secondsToExamDeadline(deadline, startedAt)).toBe(1800);
    expect(secondsToExamDeadline(deadline, startedAt + 17 * 60_000)).toBe(780);
    expect(secondsToExamDeadline(deadline, deadline - 1)).toBe(1);
    expect(secondsToExamDeadline(deadline, deadline)).toBe(0);
    expect(secondsToExamDeadline(deadline, deadline + 120_000)).toBe(0);
  });

  it("rejects invalid durations and never shows a bogus time", () => {
    expect(() => examDeadline(0)).toThrow(RangeError);
    expect(() => examDeadline(Number.NaN)).toThrow(RangeError);
    expect(secondsToExamDeadline(Infinity)).toBe(0);
    expect(secondsToExamDeadline(1000, Number.NaN)).toBe(0);
  });
});
