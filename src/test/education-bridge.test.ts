import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { revisionPriorities, safeLearnerProgressDigest, type MasteryEvidence } from "@/lib/educationBridge";

const row = (subject: string, topic: string, score: number, date: string): MasteryEvidence => ({
  curriculum: "gcse",
  subject, topic, mastery_score: score, confidence_score: 40,
  attempts: 5, correct_attempts: 3, next_review_at: date,
});
const now = new Date("2026-10-17T12:00:00.000Z");

describe("STEMCoach education bridge", () => {
  it("prioritises due subjects then weak topics without invented achievements", () => {
    const plan = revisionPriorities([
      row("physics", "Motion", 35, "2026-11-01T12:00:00Z"),
      row("maths", "Integration", 60, "2026-10-16T12:00:00Z"),
      row("biology", "Cells", 90, "2026-10-17T11:00:00Z"),
    ], now);
    expect(plan.map((p) => p.subject)).toEqual(["maths", "biology", "physics"]);
    expect(plan[0].practicePath).toBe("/practice/maths?mode=focus");
    expect(plan[0].due).toBe(true);
  });

  it("exports aggregate-only information, no personal identifiers or topics", () => {
    const result = safeLearnerProgressDigest([
      row("maths", "PRIVATE TOPIC NAME", 70, "2026-10-17T01:00:00Z"),
      row("maths", "Another topic", 90, "2026-10-20T01:00:00Z"),
    ], now);
    expect(result.version).toBe("stemcoach.learning-summary.v1");
    expect(result.topicsReviewed).toBe(2);
    expect(result.subjects[0]).toMatchObject({ subject: "maths", averageMastery: 80, dueTopics: 1, attempts: 10 });
    expect(JSON.stringify(result)).not.toContain("PRIVATE TOPIC NAME");
    for (const forbidden of ["user_id", "tenant_id", "email", "grade", "correct_answer"]) {
      expect(JSON.stringify(result)).not.toContain(forbidden);
    }
  });

  it("ignores malformed rows and clamps large inputs and return limits", () => {
    const invalid = row("javascript:alert(1)", "bad", 200, "invalid");
    const inputs = [invalid, ...Array.from({ length: 800 }, (_, i) =>
      row("maths", "Topic " + i, 50, "2026-10-18T12:00:00Z"))];
    const safe = safeLearnerProgressDigest(inputs, now);
    expect(safe.topicsReviewed).toBe(500);
    expect(revisionPriorities(inputs, now, 100)).toHaveLength(10);
    expect(revisionPriorities([invalid], now)).toEqual([]);
  });

  it("maintains a protected authenticated route and does not transfer data automatically", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const dashboard = readFileSync("src/pages/Dashboard.tsx", "utf8");
    const page = readFileSync("src/pages/EducationConnections.tsx", "utf8");
    expect(app).toContain('path="/education-connections" element={<ProtectedRoute>');
    expect(dashboard).toContain('to: "/education-connections"');
    expect(page).toContain('user_id", user.id');
    expect(page).not.toContain("fetch(");
    expect(page).not.toContain("service_role");
  });
});
