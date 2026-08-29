import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260829223000_persistent_coach_and_quiz_formats.sql"), "utf8");
const batchGenerator = readFileSync(resolve(process.cwd(), "supabase/functions/batch-generate/index.ts"), "utf8");
const answerChecker = readFileSync(resolve(process.cwd(), "supabase/functions/check-answer/index.ts"), "utf8");

describe("governed 200k content pipeline", () => {
  it("supports a 200,000-question target without auto-publishing generated drafts", () => {
    expect(batchGenerator).toContain("200_000");
    expect(batchGenerator).toContain('review_status: "needs_review"');
    expect(batchGenerator).not.toContain('review_status: "published"');
    expect(migration).toContain("target_questions BETWEEN 1000 AND 250000");
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
  });

  it("deduplicates question content and exposes all deterministic interaction formats", () => {
    expect(migration).toContain("questions_content_identity_key");
    expect(batchGenerator).toContain("options: Array.isArray(q.options) ? q.options : null");
    expect(batchGenerator).not.toContain("options: q.options ? JSON.stringify(q.options)");
    expect(batchGenerator).toContain("boards: [board]");
    expect(batchGenerator).toContain("satsuite.collegeboard.org/sat/whats-on-the-test");
    expect(batchGenerator).toContain("apstudents.collegeboard.org/courses");
    expect(batchGenerator).toContain("nta.ac.in/Engineeringexam");
    for (const format of ["true-false", "ordering", "short-answer", "multi-select", "data-interpretation", "assertion-reason", "multi-step", "code"]) {
      expect(migration).toContain(`'${format}'`);
      expect(batchGenerator).toContain(format);
    }
  });

  it("keeps correct answers server-side and accepts reviewed answer variants", () => {
    expect(answerChecker).toContain("acceptedAnswers.some");
    expect(answerChecker).toContain('.eq("review_status", "published")');
    expect(answerChecker).not.toContain("service_role_key:");
  });

  it("ships twenty additional reviewed seed questions across the five core STEM subjects", () => {
    expect(migration.match(/'editorial-launch-seed'/g)?.length).toBe(1);
    const seedSection = migration.slice(migration.indexOf("-- Twenty additional"));
    for (const subject of ["mathematics", "physics", "chemistry", "biology", "computer-science"]) {
      expect((seedSection.match(new RegExp(`\\('${subject}'`, "g")) || []).length).toBeGreaterThanOrEqual(4);
    }
  });
});
