import {describe,expect,it} from "vitest";
import {buildMasteryWeek,REVISION_MINUTES_PER_TOPIC} from "@/lib/masteryWeek";
import type {MasteryRow} from "@/lib/masteryRevision";
import {safePracticeReturn} from "@/lib/launchPractice";
const now=new Date(2026,10,25,12);
const iso=(day:number,hour=10)=>new Date(2026,10,day,hour).toISOString();
const row=(topic:string,day:number,score=50,extra:Partial<MasteryRow>={}):MasteryRow=>({curriculum:"uk-gcse",subject:"physics",topic,mastery_score:score,confidence_score:40,attempts:5,correct_attempts:3,correct_streak:1,last_practised_at:iso(20),next_review_at:iso(day),mastery_level:"developing",...extra});
describe("curriculum-scoped mastery week",()=>{
  it("allocates overdue topics before future reviews and preserves exact topic links",()=>{
    const plan=buildMasteryWeek([row("Waves",24,80),row("Energy & Wärme",25,20),row("Fields",28),row("Beyond",32)],"uk-gcse",now,1);
    expect(plan.days.map(d=>d.date)).toEqual(["2026-11-25","2026-11-26","2026-11-27","2026-11-28","2026-11-29","2026-11-30","2026-12-01"]);
    expect(plan.days[0].tasks.map(t=>t.topic)).toEqual(["Energy & Wärme"]);
    expect(plan.days[1].tasks[0].topic).toBe("Waves");
    expect(plan.days[3].tasks[0].topic).toBe("Fields");
    expect(plan.scheduled).toBe(3);expect(plan.outsideWindow).toBe(1);expect(plan.unscheduled).toBe(0);
    expect(plan.estimatedMinutes).toBe(3*REVISION_MINUTES_PER_TOPIC);
    for(const task of plan.days.flatMap(d=>d.tasks)){
      expect(safePracticeReturn(task.practicePath)).toBe(task.practicePath);
      const url=new URL(task.practicePath,"https://stemcoach.invalid");
      expect(url.searchParams.get("topic")).toBe(task.topic);
      expect(url.searchParams.get("curriculum")).toBe("uk-gcse");
    }
  });
  it("reports capacity overflow and does not silently repeat or pull future work forward",()=>{
    const rows=Array.from({length:10},(_,i)=>row("Topic "+i,31));
    const small=buildMasteryWeek(rows,"uk-gcse",now,1);
    expect(small.scheduled).toBe(1);expect(small.unscheduled).toBe(9);
    expect(small.days.slice(0,6).every(d=>d.tasks.length===0)).toBe(true);
    const big=buildMasteryWeek(rows,"uk-gcse",now,4);
    expect(big.scheduled).toBe(4);expect(big.unscheduled).toBe(6);
    expect(new Set(big.days.flatMap(d=>d.tasks.map(t=>t.key))).size).toBe(4);
  });
  it("validates scope, duplicates, bounds and handles a genuine empty plan",()=>{
    expect(()=>buildMasteryWeek([row("Wrong",25,50,{curriculum:"de-abitur"})],"uk-gcse",now,2)).toThrow();
    expect(()=>buildMasteryWeek([row("A",25),row("A",25)],"uk-gcse",now,2)).toThrow();
    expect(()=>buildMasteryWeek([],"uk-gcse",now,0)).toThrow();
    expect(()=>buildMasteryWeek([],"uk-gcse",now,5)).toThrow();
    expect(()=>buildMasteryWeek([],"uk-gcse",new Date(NaN),2)).toThrow();
    const plan=buildMasteryWeek([row("Archived",25,20,{subject:"french"})],"uk-gcse",now,2);
    expect(plan.scheduled).toBe(0);expect(plan.unscheduled).toBe(0);expect(plan.outsideWindow).toBe(0);
  });
  it("keeps seven consecutive calendar dates across month boundaries",()=>{
    const start=new Date(2026,9,24,12),plan=buildMasteryWeek([],"uk-gcse",start,2);
    expect(plan.days.map(d=>d.date)).toEqual(["2026-10-24","2026-10-25","2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"]);
    expect(plan.days.every(d=>d.estimatedMinutes===0)).toBe(true);
  });
});