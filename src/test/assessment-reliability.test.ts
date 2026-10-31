import { describe, expect, it } from "vitest";
import { webcrypto } from "node:crypto";
import { assessmentFingerprint, numericEquivalent, validateEssayGrade } from "../../supabase/functions/_shared/assessment";
import { expressionEquivalent } from "@/lib/mathAssessment";
import { emptyResponse, isCorrectResponse, responseCredit } from "@/lib/qaEngine";
import { tutorials } from "@/data/tutorials";
import { readCard, scheduleReview } from "@/lib/reviewScheduler";
import { recordReviewAttempt, parseReviewHistory, serialiseReviewHistory } from "@/lib/qaPractice";
Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
describe("assessment reliability", () => {
  it.each([["100 cm","1 m"],["36 km/h","10 m/s"],["1/2","0.5"],["1e3 mV","1 V"],["16,0","16"],["9.8 m/s²","9.8 m/s2"],["10000 cm²","1 m²"]])("accepts equivalent quantities %s and %s", (a,b)=>expect(numericEquivalent(a,b)).toBe(true));
  it.each([["1 m","1 s"],["1 MW","1 mW"],["Infinity","1"],["0x10","16"],["1/0","1"],["1 m","1"],["100 cm","100 m"]])("rejects invalid quantities %s and %s", (a,b)=>expect(numericEquivalent(a,b)).toBe(false));
  it("enforces an explicit tolerance and significant figures",()=>{
    expect(numericEquivalent("1.23","1.234",{absoluteTolerance:.005,relativeTolerance:0,significantFigures:3})).toBe(true);
    expect(numericEquivalent("1.230","1.234",{absoluteTolerance:.005,significantFigures:3})).toBe(false);
    expect(numericEquivalent("100","100",{significantFigures:3})).toBe(false);
    expect(numericEquivalent("1","2",{absoluteTolerance:Infinity})).toBe(false);
  });
  it("uses full private and rubric-sensitive fingerprints including unicode", async()=>{
    const base={userId:"one",answer:"同じ開始 ".repeat(100),rubric:"v1",question:"q1"};
    const original=await assessmentFingerprint(base);
    for(const change of [{userId:"two"},{answer:base.answer+"different ending"},{rubric:"v2"},{question:"q2"}]) expect(await assessmentFingerprint({...base,...change})).not.toBe(original);
    expect(original).toMatch(/^[0-9a-f]{64}$/);
  });
  it("accepts equivalent polynomial forms and rejects unsafe or different answers",()=>{
    expect(expressionEquivalent("x*x+3*x+2","x^2+3x+2")).toBe(true);
    expect(expressionEquivalent("(x+1)(x+2)","x^2+3x+2")).toBe(true);
    expect(expressionEquivalent("x^2+2x+2","x^2+3x+2")).toBe(false);
    expect(expressionEquivalent("alert(1)","1")).toBe(false);
    expect(expressionEquivalent("x^999999","x")).toBe(false);
  });
  it("rejects malformed model grades instead of coercing them",()=>{
    const grade={score:3,feedback:"Explain the missing step.",strengths:["Correct formula"],improvements:["Add units"]};
    expect(validateEssayGrade(grade,5)).toMatchObject({provisional:true,score:3,max_marks:5});
    for(const score of ["3",NaN,Infinity,-1,6,2.5]) expect(()=>validateEssayGrade({...grade,score},5)).toThrow();
    expect(()=>validateEssayGrade({...grade,strengths:[{}]},5)).toThrow();
  });
  it("requires both coordinates and does not award full credit to partial steps",()=>{
    const questions=tutorials.find(t=>t.id==="quadratic-equations")!.practice!;
    const graph=questions.find(q=>q.format==="graph-point")!;
    expect(isCorrectResponse(graph,{...emptyResponse(graph),matches:{x:"2"}})).toBe(false);
    expect(isCorrectResponse(graph,{...emptyResponse(graph),matches:{x:"2",y:"5"}})).toBe(true);
    const steps=questions.find(q=>q.format==="multi-step")!;
    const partial={...emptyResponse(steps),matches:{subtract:"8",divide:"5",check:"11"}};
    expect(responseCredit(steps,partial)).toEqual({earned:2,total:3});
    expect(isCorrectResponse(steps,partial)).toBe(false);
    expect(isCorrectResponse(steps,{...partial,matches:{...partial.matches,divide:"4"}})).toBe(true);
  });
  it("round-trips FSRS state and does not train memory on revealed answers",()=>{
    const now=Date.UTC(2026,9,30);
    const first=recordReviewAttempt({},"q",true,true,now);
    const restored=parseReviewHistory(serialiseReviewHistory(first),new Set(["q"]));
    expect(restored.q.memory).toEqual(first.q.memory);
    const retry=recordReviewAttempt(restored,"q",true,false,now+1000);
    expect(retry.q.memory).toEqual(first.q.memory);
    expect(scheduleReview(first.q.memory,true,now+86400000).reps).toBe(2);
    expect(readCard({...first.q.memory,stability:Infinity})).toBeUndefined();
  });
});
