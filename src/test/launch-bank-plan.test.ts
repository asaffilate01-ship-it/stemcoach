import { describe, expect, it } from "vitest";
import { inspectLaunchPlan, launchJobWindow, LAUNCH_PLAN_SCOPE } from "@/lib/launchBankPlan";

function row(market = "PK", n = 0, targetQuestions = 41) {
  return { market, jurisdiction: market === "PK" ? "Punjab" : market === "GB" ? "England" : "Bayern",
    authority: "Synthetic fixture authority", qualification: "Synthetic qualification", stage: "Synthetic stage",
    track: "mathematics", language: "en", specificationVersion: "fixture-2026",
    outcomeCode: "fixture-" + market + "-" + n, sourceUrl: "https://example.org/test-only",
    reviewReference: "fixture-review", targetQuestions };
}
const manifest = (outcomes: unknown[]) => ({ schemaVersion: 1, scope: LAUNCH_PLAN_SCOPE, outcomes });

describe("versioned three-market draft planning", () => {
  it("keeps exact market allocations and plans all one million draft slots without claiming approval", () => {
    const all = [...Array.from({ length: 800 }, (_, i) => row("PK", i, 500)),
      ...Array.from({ length: 700 }, (_, i) => row("GB", i, 500)),
      ...Array.from({ length: 500 }, (_, i) => row("DE", i, 500))];
    const { report } = inspectLaunchPlan(manifest(all));
    expect(report.valid).toBe(true);
    expect(report.complete).toBe(true);
    expect(report.totalPlanned).toBe(1_000_000);
    expect(report.totalJobs).toBe(50_000);
    expect(report.markets.map(m => m.allocated)).toEqual([400000, 350000, 250000]);
    expect(report.approvedCount).toBe(0);
    expect(report.publishedCount).toBe(0);
    const last = launchJobWindow(manifest(all), 49_999);
    expect(last.jobs).toHaveLength(1);
    expect(last.nextCursor).toBeNull();
    expect(last.jobs[0].countsTowardApprovedTarget).toBe(false);
  });
  it("creates deterministic nonoverlapping resumable windows independent of import order", () => {
    const rows = [row("PK", 1, 41), row("GB", 2, 22)];
    const first = launchJobWindow(manifest(rows), 0, 2);
    const second = launchJobWindow(manifest(rows.slice().reverse()), first.nextCursor!, 3);
    const combined = [...first.jobs, ...second.jobs];
    expect(combined).toEqual(launchJobWindow(manifest(rows)).jobs);
    expect(new Set(combined.map(j => j.jobKey)).size).toBe(5);
    expect(combined.reduce((sum, j) => sum + j.count, 0)).toBe(63);
    expect(combined.every(j => j.count > 0 && j.count <= 20 && j.status === "draft-planned")).toBe(true);
    expect(second.nextCursor).toBeNull();
    expect(first.report.complete).toBe(false);
  });
  it("rejects duplicate outcome metadata across markets, including fragment aliases", () => {
    const original = row("PK");
    const copy = { ...original, market: "GB", jurisdiction: "England", sourceUrl: original.sourceUrl + "#alias" };
    const result = launchJobWindow(manifest([original, copy]));
    expect(result.report.valid).toBe(false);
    expect(result.report.errors.join(" ")).toContain("duplicate versioned outcome");
    expect(result.jobs).toEqual([]);
  });
  it("rejects hidden market, language, mismatched track, malformed URL or jurisdiction", () => {
    for (const change of [
      { market: "US" }, { track: "french", language: "fr" }, { language: "tr" }, { track: "urdu", language: "en" },
      { market: "DE", jurisdiction: "Bayern", track: "welsh", language: "cy" },
      { sourceUrl: "http://example.org" }, { sourceUrl: "https://user:secret@example.org" },
      { jurisdiction: "California" }, { specificationVersion: "" }, { reviewReference: "" }, { targetQuestions: 501 },
    ]) {
      const result = launchJobWindow(manifest([{ ...row(), ...change }]));
      expect(result.report.valid).toBe(false);
      expect(result.jobs).toEqual([]);
    }
  });
  it("does not export overallocated markets or invalid job windows", () => {
    const rows = Array.from({ length: 801 }, (_, i) => row("PK", i, 500));
    expect(launchJobWindow(manifest(rows)).jobs).toEqual([]);
    expect(inspectLaunchPlan(manifest(rows)).report.errors).toContain("PK: allocation exceeds market target.");
    expect(() => launchJobWindow(manifest([]), -1)).toThrow();
    expect(() => launchJobWindow(manifest([]), 0, 1001)).toThrow();
  });
});
