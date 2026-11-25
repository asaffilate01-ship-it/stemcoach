import {describe,expect,it} from "vitest";
import {masteryPracticePath,prioritiseMastery,validateMasteryRows,type MasteryRow} from "@/lib/masteryRevision";
import {readPracticeFilters,narrowPracticeSample,safePracticeReturn,validPracticeTopic} from "@/lib/launchPractice";

const base:MasteryRow={curriculum:"uk-gcse",subject:"physics",topic:"Waves",mastery_score:60,confidence_score:40,attempts:5,correct_attempts:3,correct_streak:1,last_practised_at:"2026-11-20T10:00:00Z",next_review_at:"2026-11-25T10:00:00Z",mastery_level:"developing"};
describe("scoped mastery revision",()=>{
  it("validates complete rows and keeps hidden subjects out of launch recommendations",()=>{
    expect(validateMasteryRows([base,{...base,subject:"french"}],"uk-gcse")).toEqual([base]);
    expect(validateMasteryRows([],"uk-gcse")).toEqual([]);
    for(const rows of [null,{},[{...base,curriculum:"de-abitur"}],[{...base,mastery_score:NaN}],[{...base,confidence_score:null}],[{...base,correct_attempts:6}],[{...base,correct_streak:4}],[{...base,next_review_at:"invalid"}],[base,base]])expect(()=>validateMasteryRows(rows,"uk-gcse")).toThrow();
    expect(()=>validateMasteryRows([],"us-sat")).toThrow();
  });
  it("prioritises due topics, then weaker mastery and lower confidence",()=>{
    const rows=[{...base,topic:"Future",next_review_at:"2026-12-01T10:00:00Z",mastery_score:10},{...base,topic:"Higher confidence",confidence_score:70},base,{...base,topic:"Weak",mastery_score:20}];
    expect(prioritiseMastery(rows,Date.parse("2026-11-25T12:00:00Z")).map(r=>r.topic)).toEqual(["Weak","Waves","Higher confidence","Future"]);
    expect(rows[0].topic).toBe("Future");
  });
  it("creates a canonical curriculum and topic-specific practice link",()=>{
    const href=masteryPracticePath("physics","uk-gcse","Energy & Wärme");
    expect(safePracticeReturn(href)).toBe(href);
    const u=new URL(href,"https://stemcoach.invalid");
    expect(u.pathname).toBe("/practice/physics");
    expect(u.searchParams.get("mode")).toBe("focus");
    const filters=readPracticeFilters(u.searchParams)!;
    expect(filters.curricula).toEqual(["uk-gcse"]);
    expect(filters.topic).toBe("Energy & Wärme");
    expect(()=>masteryPracticePath("french","uk-gcse","x")).toThrow();
    expect(()=>masteryPracticePath("physics","us-sat","x")).toThrow();
  });
  it("filters only exact matching rows in the existing server sample",()=>{
    const f=readPracticeFilters(new URLSearchParams("curriculum=uk-gcse&topic=Waves"))!;
    const a={curriculum:"uk-gcse",subject:"physics",topic:"Waves",difficulty:3,boards:["AQA"]};
    expect(narrowPracticeSample([a,{...a,topic:"Sound waves"},{...a,curriculum:"de-abitur"},{...a,subject:"biology"}],"physics","uk-gcse",f)).toEqual([a]);
  });
  it("rejects repeated, oversized, empty and control-character topic filters",()=>{
    for(const value of [""," Waves","Waves\n","x".repeat(161)])expect(validPracticeTopic(value)).toBe(false);
    for(const query of ["topic=","topic=A&topic=B","topic=%0A","topic="+ "x".repeat(161)])expect(readPracticeFilters(new URLSearchParams(query))).toBeNull();
    expect(safePracticeReturn("/practice/physics?topic=A&topic=B")).toBeNull();
    expect(validPracticeTopic("Energy & Wärme")).toBe(true);
  });
});
