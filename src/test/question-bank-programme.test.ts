import { describe, expect, it } from "vitest";
import {
  PUBLISHED_BANK_TARGET, MONTHLY_RELEASE_FREQUENCY,
  publiclyReportableRelease, summariseBankMetrics, validReleaseMonth,
} from "@/lib/questionBankProgramme";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("two-million question inventory and monthly release honesty", () => {
  it("keeps draft counts separate from verified published progress", () => {
    expect(PUBLISHED_BANK_TARGET).toBe(2_000_000);
    const metrics = summariseBankMetrics({
      total_questions: 200_000,
      awaiting_review: 150_000,
      published_total: 3_000,
      rejected_total: 1_000,
      archived_total: 0,
    });
    expect(metrics).toMatchObject({
      target: 2_000_000, total: 200_000, published: 3_000,
      awaitingReview: 150_000, remaining: 1_997_000,
      progressPct: 0.15, complete: false,
    });
    expect(summariseBankMetrics(null)).toBeNull();
    expect(summariseBankMetrics({ published_total: -100, total_questions: Number.NaN })?.published).toBe(0);
  });
  it("reports a monthly release only after published review and an effective date", () => {
    expect(MONTHLY_RELEASE_FREQUENCY).toBe("monthly");
    expect(validReleaseMonth("2026-11")).toBe(true);
    expect(validReleaseMonth("2026-00")).toBe(false);
    expect(validReleaseMonth("2026-13")).toBe(false);
    expect(validReleaseMonth("not-a-date")).toBe(false);
    const published = {
      month:"2026-11", status:"published" as const,
      reviewedQuestionCount:120, publishedQuestionCount:100,
      publishedAt:"2026-11-01T09:00:00.000Z",
    };
    expect(publiclyReportableRelease(published,Date.parse("2026-11-02T09:00:00Z"))).toBe(true);
    expect(publiclyReportableRelease(published,Date.parse("2026-10-31T09:00:00Z"))).toBe(false);
    expect(publiclyReportableRelease({...published,status:"draft"})).toBe(false);
    expect(publiclyReportableRelease({...published,publishedQuestionCount:121})).toBe(false);
    expect(publiclyReportableRelease({...published,publishedQuestionCount:0})).toBe(false);
  });
  it("does not grant paid or partner access from a browser-side calculation", () => {
    const admin = readFileSync(resolve(process.cwd(),"src/pages/AdminGenerate.tsx"),"utf8");
    const source = readFileSync(resolve(process.cwd(),"src/lib/questionBankProgramme.ts"),"utf8");
    expect(admin).toContain('get_question_bank_metrics');
    expect(admin).toContain('reviewed and published');
    expect(source).toContain("NEVER a subscription/content authorization decision");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("user_metadata");
  });
});
