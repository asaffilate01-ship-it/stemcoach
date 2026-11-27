import { describe, expect, it } from "vitest";
import { calculateStudyExpression, numericalAnswerMatches, parseNumericalLiteral } from "@/lib/numericalPractice";
import { emptyResponse, isCorrectResponse, inspectQuestion } from "@/lib/qaEngine";
import type { TutorialCheckpoint } from "@/data/tutorials";

describe("exact numerical formative marking",()=>{
  it("supports fractions, signed decimals, decimal commas and scientific notation",()=>{
    expect(numericalAnswerMatches("3/4","0.75")).toBe(true);
    expect(numericalAnswerMatches("−1,25","-5/4")).toBe(true);
    expect(numericalAnswerMatches("1.2e-7","0.00000012")).toBe(true);
    expect(numericalAnswerMatches("12/-4","-3")).toBe(true);
    expect(numericalAnswerMatches("9007199254740993","9007199254740992")).toBe(false);
    expect(numericalAnswerMatches("0","1e-10")).toBe(false);
  });
  it("honours only the authored tolerance, including its exact boundary",()=>{
    expect(numericalAnswerMatches("1.009","1",0.01)).toBe(true);
    expect(numericalAnswerMatches("1.01","1",0.01)).toBe(true);
    expect(numericalAnswerMatches("1.01000000001","1",0.01)).toBe(false);
    expect(numericalAnswerMatches("1","1",-1)).toBe(false);
    expect(numericalAnswerMatches("1","1",Infinity)).toBe(false);
  });
  it("rejects malformed or executable input and bounded-size violations",()=>{
    for(const input of ["","1/0","1/2/3","1+2","1 234","12.3.4","1e500","Infinity","NaN","0x10","2 cm","alert(1)","1".repeat(121)]){
      expect(parseNumericalLiteral(input)).toBeNull();
      expect(numericalAnswerMatches(input,"0")).toBe(false);
    }
  });
  it("uses exact comparison in the existing Q&A engine",()=>{
    const question:TutorialCheckpoint={question:"Find the requested numerical result.",answer:"0.125",format:"numeric",options:[],explanation:"The fraction one eighth equals 0.125."};
    expect(inspectQuestion(question)).toEqual([]);
    const state=emptyResponse(question);
    state.freeText="1/8";
    expect(isCorrectResponse(question,state)).toBe(true);
    state.freeText="0.12500000001";
    expect(isCorrectResponse(question,state)).toBe(false);
    const tiny={...question,answer:"1e-10"};
    state.freeText="0";
    expect(isCorrectResponse(tiny,state)).toBe(false);
  });
});

describe("local study calculator",()=>{
  it("uses precedence, parentheses, unary signs and exact reduced fractions",()=>{
    for(const [input,exact] of [["2+3*4","14"],["(2+3)*4","20"],["0.1+0.2","3/10"],["1/3+1/6","1/2"],["−(3+5)÷4","-2"],["1,25×8","10"],["2e-3 + 3e-3","1/200"],["8/4/2","1"],["2*-3","-6"]]){
      expect(calculateStudyExpression(input)).toEqual({ok:true,exact});
    }
  });
  it("rejects unsupported syntax, divide by zero and excessive arithmetic",()=>{
    for(const value of ["","2(3)","2^4","2**4","1 2","(3+4","3+","foo()","window.location","1;2"]){
      expect(calculateStudyExpression(value)).toEqual({ok:false,reason:"invalid"});
    }
    expect(calculateStudyExpression("1/(2-2)")).toEqual({ok:false,reason:"zero"});
    expect(calculateStudyExpression("1e101")).toEqual({ok:false,reason:"range"});
    expect(calculateStudyExpression("1e100*1e100*1e100")).toEqual({ok:false,reason:"range"});
    expect(calculateStudyExpression("1".repeat(121))).toEqual({ok:false,reason:"range"});
  });
});
