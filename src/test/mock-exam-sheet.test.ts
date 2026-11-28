import { describe, expect, it } from "vitest";
import { requireMockExamSheet, acceptsExamAnswer } from "@/lib/mockExamSheet";

const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const q=(n:number)=>({id:id(n),question_text:"Synthetic question "+n,topic:"Example",subject:"physics",difficulty:2,points:1,options:["Alpha","Beta"]});
describe("legacy mock examination sheet integrity",()=>{
  it("projects complete eligible sheets without retaining unexpected answer-key metadata",()=>{
    const first={...q(1),options:'["Alpha","Beta"]',correct_answer:"Beta",explanation:"not a sheet field"};
    const validated=requireMockExamSheet([first,q(2)],"physics",2);
    expect(validated).toEqual([q(1),q(2)]);
    expect(validated[0]).not.toHaveProperty("correct_answer");
    expect(validated[0]).not.toHaveProperty("explanation");
    expect(validated[1].options).not.toBe(q(2).options);
  });
  it("rejects partial, duplicate, foreign-subject and malformed questions before timing begins",()=>{
    for(const rows of [
      [], [q(1)], [q(1),q(1)], [q(1),{...q(2),subject:"biology"}],
      [q(1),{...q(2),id:"invalid"}],
      [q(1),{...q(2),question_text:" "}],
      [q(1),{...q(2),difficulty:0}],
      [q(1),{...q(2),points:NaN}],
      [q(1),{...q(2),options:"{"}],
      [q(1),{...q(2),options:["Only one"]}],
      [q(1),{...q(2),options:["A","a "]}],
      [q(1),{...q(2),options:[1,2]}],
      [q(1),{...q(2),options:{A:"Alpha",B:"Beta"}}],
    ]) expect(()=>requireMockExamSheet(rows,"physics",2)).toThrow();
    expect(()=>requireMockExamSheet([q(1)],"physics",101)).toThrow();
  });
  it("rejects answer mutations at the exact deadline or once the payload is frozen",()=>{
    expect(acceptsExamAnswer(1000,false,999)).toBe(true);
    expect(acceptsExamAnswer(1000,false,1000)).toBe(false);
    expect(acceptsExamAnswer(1000,true,999)).toBe(false);
    expect(acceptsExamAnswer(null,false,999)).toBe(false);
    expect(acceptsExamAnswer(Infinity,false,999)).toBe(false);
  });
});
