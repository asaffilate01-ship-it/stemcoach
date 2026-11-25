import {describe,expect,it} from "vitest";
import {summariseDashboardProgress,validStudentStats,DASHBOARD_ATTEMPT_LIMIT} from "@/lib/dashboardProgress";

const now=new Date("2026-11-25T01:00:00Z");
const row=(id:string,q:string,correct:boolean,created_at="2026-11-24T23:59:00Z")=>({id,question_id:q,correct,created_at});

describe("verified dashboard sample calculations",()=>{
 it("retains UTC activity when question metadata is missing",()=>{
  const result=summariseDashboardProgress([row("1","unknown",true),row("2","q",false,"2026-11-25T00:01:00Z")],[{id:"q",subject:"physics",topic:"Waves"}],now);
  expect(result.missingMetadata).toBe(1);
  expect(result.dailyData).toHaveLength(14);
  expect(result.dailyData.slice(-2)).toEqual([{date:"2026-11-24",questions:1,accuracy:100},{date:"2026-11-25",questions:1,accuracy:0}]);
  expect(result.subjectProgress).toEqual([{subject:"physics",total:1,correct:0,accuracy:0}]);
  expect(result.dailyData[0].accuracy).toBeNull();
 });
 it("does not combine different subjects with the same topic label",()=>{
  const attempts=[row("1","a",false),row("2","b",true),row("3","a",false),row("4","a",false)];
  const result=summariseDashboardProgress(attempts,[{id:"a",subject:"biology",topic:"Energy::transfer"},{id:"b",subject:"physics",topic:"Energy::transfer"}],now);
  expect(result.recentActivity).toHaveLength(2);
  expect(result.weakTopics).toEqual([{subject:"biology",topic:"Energy::transfer",total:3,correct:0,accuracy:0}]);
 });
 it("marks bounded samples and empty accuracy honestly",()=>{
  const many=Array.from({length:DASHBOARD_ATTEMPT_LIMIT},(_,i)=>row(String(i),"q",true));
  const result=summariseDashboardProgress(many,[],now);
  expect(result.sampleCapped).toBe(true);expect(result.sampleSize).toBe(500);
  expect(result.missingMetadata).toBe(500);expect(result.subjectProgress).toEqual([]);
  const empty=summariseDashboardProgress([],[],now);
  expect(empty.sampleCapped).toBe(false);
  expect(empty.dailyData.every(d=>d.questions===0&&d.accuracy===null)).toBe(true);
 });
 it("rejects contradictory lifetime totals and invalid saved attempts",()=>{
  expect(validStudentStats({total_questions:0,correct_answers:0,streak:0,xp:0})).toBe(true);
  expect(validStudentStats(null)).toBe(false);
  expect(validStudentStats({total_questions:5,correct_answers:6,streak:0,xp:0})).toBe(false);
  expect(validStudentStats({total_questions:5,correct_answers:4,streak:-1,xp:0})).toBe(false);
  expect(()=>summariseDashboardProgress([row("1","q",true,"invalid")],[],now)).toThrow();
  expect(()=>summariseDashboardProgress([row("1","q",true),row("1","q",true)],[],now)).toThrow();
 });
});
