import {beforeEach,describe,expect,it,vi} from "vitest";
import {loadStudentDashboard} from "@/lib/loadStudentDashboard";
const fake=vi.hoisted(()=>({from:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:fake.from}}));
const sample={id:"a",user_id:"student",correct:true,created_at:"2026-11-24T12:00:00Z",question_id:"q"};
const stats={user_id:"student",total_questions:1,correct_answers:1,streak:1,xp:10};
function mockRows(table:string,data:any,error:any=null){
 const result={data,error};
 const query={select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),maybeSingle:vi.fn(),in:vi.fn()};
 query.select.mockReturnValue(query);query.eq.mockReturnValue(query);query.order.mockReturnValue(query);query.limit.mockResolvedValue(result);query.maybeSingle.mockResolvedValue(result);query.in.mockResolvedValue(result);
 return query;
}
beforeEach(()=>fake.from.mockReset());
describe("dashboard data contract",()=>{
 it("reads metadata only from the existing safe view and reports metadata errors separately",async()=>{
  const queries={user_stats:mockRows("user_stats",stats),attempts:mockRows("attempts",[sample]),user_badges:mockRows("user_badges",[]),questions_safe:mockRows("questions_safe",null,{message:"denied"})};
  fake.from.mockImplementation(name=>queries[name]);
  const result=await loadStudentDashboard("student");
  expect(result.stats?.total_questions).toBe(1);
  expect(result.sampleSize).toBe(1);expect(result.missingMetadata).toBe(1);expect(result.metadataError).toBe(true);
  expect(queries.questions_safe.select).toHaveBeenCalledWith("id,subject,topic");
  expect(queries.attempts.eq).toHaveBeenCalledWith("user_id","student");
  expect(fake.from).not.toHaveBeenCalledWith("questions");
 });
 it("rejects mismatched accounts and failed core data rather than substituting zero",async()=>{
  const queries={user_stats:mockRows("user_stats",stats),attempts:mockRows("attempts",[{...sample,user_id:"other"}]),user_badges:mockRows("user_badges",[])};
  fake.from.mockImplementation(name=>queries[name]);
  await expect(loadStudentDashboard("student")).rejects.toThrow("account mismatch");
  queries.attempts=mockRows("attempts",null,{message:"offline"});
  await expect(loadStudentDashboard("student")).rejects.toThrow("unavailable");
 });
});
