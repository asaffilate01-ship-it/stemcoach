import { describe, expect, it } from "vitest";
import { requireCompleteMockExamGrades, requireConfirmedMockExamResult, type MockExamGradeResult } from "@/lib/mockExamGrading";

const result = (id: string, answer: string | null): MockExamGradeResult => ({
  question_id: id,
  correct_answer: answer,
  explanation: "Server-graded explanation",
  worked_solution: null,
});

describe("mock exam grading integrity", () => {
  it("matches complete graded results by question ID, not array order", () => {
    const actual = requireCompleteMockExamGrades(["q1", "q2"], [
      result("q2", "B"),
      result("q1", "A"),
    ]);
    expect(actual.get("q1")?.correct_answer).toBe("A");
    expect(actual.get("q2")?.correct_answer).toBe("B");
  });

  it("rejects missing, duplicate or unrecognised grade records", () => {
    expect(() => requireCompleteMockExamGrades(["q1", "q2"], [result("q1", "A")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1", "q2"], [result("q1", "A"), result("q1", "B")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1", "q2"], [result("q1", "A"), result("q3", "B")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1", "q1"], [result("q1", "A"), result("q1", "A")])).toThrow();
  });

  it("rejects an unknown or empty answer key before showing a score", () => {
    expect(() => requireCompleteMockExamGrades(["q1"], [result("q1", null)])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1"], [result("q1", "")])).toThrow();
    expect(() => requireCompleteMockExamGrades(["q1"], undefined)).toThrow();
    expect(() => requireCompleteMockExamGrades([], [])).toThrow();
  });
});

describe("authoritative mock-exam response", () => {
  const submitted = [{question_id:"q1",answer:"  alpha  "},{question_id:"q2",answer:null}];
  const rows = [
    {...result("q2","Beta"),answer:null,correct:false},
    {...result("q1","Alpha"),answer:"  alpha  ",correct:true},
  ];
  const response = {score:1,total:2,percent:50,certificate_issued:false,results:rows};

  it("preserves the server's correctness for normalised answers and ignores response order", () => {
    const confirmed=requireConfirmedMockExamResult(submitted,response);
    expect(confirmed.score).toBe(1);
    expect(confirmed.percent).toBe(50);
    expect(confirmed.byId.get("q1")?.correct).toBe(true);
    expect(confirmed.byId.get("q2")?.correct).toBe(false);
    expect(confirmed.certificateIssued).toBe(false);
  });

  it("rejects fabricated totals, invalid flags, partial results and mismatched submissions", () => {
    for (const candidate of [
      {...response,score:2,percent:100},
      {...response,total:3},
      {...response,percent:75},
      {...response,score:"1"},
      {...response,certificate_issued:true},
      {...response,certificate_issued:"false"},
      {...response,results:[rows[0]]},
      {...response,results:[rows[0],rows[0]]},
      {...response,results:[rows[0],{...rows[1],answer:"Different"}]},
      {...response,results:[rows[0],{...rows[1],correct:"true"}]},
      {...response,results:[{...rows[0],correct:true},rows[1]],score:2,percent:100},
      {...response,results:[rows[0],{...rows[1],explanation:{unexpected:"value"}}]},
      null,
    ]) expect(()=>requireConfirmedMockExamResult(submitted,candidate)).toThrow();
    expect(()=>requireConfirmedMockExamResult([submitted[0],submitted[0]],response)).toThrow();
  });

  it("accepts a successful score with no certificate yet and does not infer issuance", () => {
    const answers=[submitted[0]];
    const successful={score:1,total:1,percent:100,results:[rows[1]],certificate_issued:false};
    expect(requireConfirmedMockExamResult(answers,successful).certificateIssued).toBe(false);
    expect(requireConfirmedMockExamResult(answers,{...successful,certificate_issued:true}).certificateIssued).toBe(true);
  });
});
