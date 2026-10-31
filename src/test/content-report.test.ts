import { describe, expect, it } from "vitest";
import { attachContentReportReference, contentReportHref, parseContentReportParams } from "@/lib/contentReport";
import { qaEntries } from "@/data/qaClinic";

describe("safe academic content issue reporting", () => {
  it("links authored practice and tutorial checkpoints without sharing a learner answer", () => {
    const url = contentReportHref("quadratic-equations-0", "quadratic-equations");
    expect(url).toBe("/support?report=content&question=quadratic-equations-0&tutorial=quadratic-equations");
    expect(parseContentReportParams(new URLSearchParams(url.split("?")[1]))).toEqual({
      questionId: "quadratic-equations-0",
      tutorialId: "quadratic-equations",
    });
    const other = contentReportHref("quadratic-equations:3", "quadratic-equations");
    expect(parseContentReportParams(new URLSearchParams(other.split("?")[1]))?.questionId).toBe("quadratic-equations:3");
  });
  it("ignores unknown or forged references without importing query text into support tickets", () => {
    expect(parseContentReportParams(new URLSearchParams("report=content&question=foreign-0&tutorial=math"))).toBeNull();
    expect(parseContentReportParams(new URLSearchParams("report=content&question=%3Cscript%3E&tutorial=a"))).toBeNull();
    expect(parseContentReportParams(new URLSearchParams("report=content&question=math-0&tutorial=math&message=secret"))).toEqual({
      questionId: "math-0", tutorialId: "math",
    });
    expect(() => contentReportHref("math-0?answer=private", "math")).toThrow();
    expect(attachContentReportReference("The answer appears incorrect.", null)).toBe("The answer appears incorrect.");
  });
  it("can link every published authored Q&A checkpoint without crashing the catalogue", () => {
    for (const entry of qaEntries) {
      expect(() => contentReportHref(entry.id, entry.tutorialId)).not.toThrow();
    }
  });

  it("appends only approved identifiers to the submitted support message", () => {
    expect(attachContentReportReference("  The distractor is ambiguous.  ", {
      questionId: "fractions-2", tutorialId: "fractions",
    })).toBe("The distractor is ambiguous.\n\nContent reference: fractions-2 (lesson fractions)");
  });
});
