import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {buildRevisionWeek} from "@/lib/revisionWeek";
import type {MasteryEvidence} from "@/lib/educationBridge";
const migration=readFileSync("supabase/migrations/20261017160000_partner_course_scopes.sql","utf8");
const page=readFileSync("src/pages/EducationConnections.tsx","utf8");
const row=(topic:string, score:number, date:string):MasteryEvidence=>({
  curriculum:"gcse",subject:"maths",topic,mastery_score:score,confidence_score:50,
  attempts:4,correct_attempts:2,next_review_at:date,
});
const now=new Date(2026,9,17,12);
describe("seven-day self-managed revision plan",()=>{
  it("bounds daily workload and repeats due or weak topics only on later days",()=>{
    const input=[row("Algebra",30,"2026-10-16T12:00:00Z"),
      row("Graphs",48,"2026-10-10T12:00:00Z"),row("Geometry",90,"2026-11-10T12:00:00Z")];
    const plan=buildRevisionWeek(input,now,2);
    expect(plan.dates).toHaveLength(7);
    expect(plan.dates[0].date).toBe("2026-10-17");
    expect(plan.dates.every(d=>d.tasks.length<=2)).toBe(true);
    expect(plan.dates.some(d=>d.tasks.some(t=>t.reason==="follow-up"))).toBe(true);
    expect(plan.totalTopics).toBe(3);
    expect(plan.estimatedMinutes).toBe(plan.dates.flatMap(d=>d.tasks).length*15);
    expect(plan.dates[0].tasks[0].reason).toBe("due");
    expect(plan.dates.flatMap(d=>d.tasks).every(t=>t.practicePath==="/practice/maths?mode=focus")).toBe(true);
  });
  it("returns seven empty days with no data, and refuses an invalid date",()=>{
    expect(buildRevisionWeek([],now).totalTopics).toBe(0);
    expect(buildRevisionWeek([],now).dates.every(d=>d.tasks.length===0)).toBe(true);
    expect(()=>buildRevisionWeek([],new Date("invalid"))).toThrow();
  });
  it("deduplicates mastery topics and prevents fake over-capacity task counts",()=>{
    const plan=buildRevisionWeek([row("Algebra",30,"2026-10-16"),row("Algebra",30,"2026-10-16")],now);
    expect(plan.totalTopics).toBe(1);
    expect(plan.dates.every(d=>d.tasks.length<=3)).toBe(true);
  });
});
describe("partner curriculum preview security",()=>{
  it("cannot be self-issued by a browser or substitute for a subscription",()=>{
    for(const table of ["education_partner_bindings","education_partner_course_maps","education_partner_learner_links","education_partner_course_proposals"]) {
      expect(migration).toContain(table);
    }
    expect(migration).toContain("REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.get_my_partner_course_preview() TO authenticated");
    expect(migration).toContain("membership.role = 'student' AND membership.status = 'approved'");
    expect(migration).toContain("learner.stemcoach_user_id = auth.uid()");
    expect(migration).toContain("proposal.effective_until > now()");
    expect(migration).not.toContain("UPDATE public.subscriptions");
    expect(page).toContain("buildRevisionWeek");
    expect(page).toContain("Course mapping alone does not grant STEMCoach subscription access");
  });
});
