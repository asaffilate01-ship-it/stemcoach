import {beforeEach,describe,expect,it,vi} from "vitest";
import {loadApprovedChildren,loadChildSummary,recordedAccuracy} from "@/lib/parentProgress";
const fake=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:fake}));
const link={parent_id:"p",child_id:"c",status:"approved"};
function query(result:any){
 const q={select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),maybeSingle:vi.fn(),then:(resolve:any)=>Promise.resolve(result).then(resolve)};
 q.select.mockReturnValue(q);q.eq.mockReturnValue(q);q.order.mockReturnValue(q);q.limit.mockResolvedValue(result);q.maybeSingle.mockResolvedValue(result);return q;
}
beforeEach(()=>{fake.from.mockReset();fake.rpc.mockReset();});
describe("parent progress data contract",()=>{
 it("includes only verified approved links and rejects mismatched rows",async()=>{
  const q=query({data:[link],error:null});
  fake.from.mockReturnValue(q);fake.rpc.mockResolvedValue({data:[{user_id:"c",display_name:"Child"},{user_id:"other",display_name:"Other"}],error:null});
  expect((await loadApprovedChildren("p")).children).toEqual([{id:"c",name:"Child"}]);
  expect(q.eq).toHaveBeenCalledWith("status","approved");
  fake.from.mockReturnValue(query({data:[{...link,parent_id:"other"}],error:null}));
  await expect(loadApprovedChildren("p")).rejects.toThrow();
 });
 it("requires revalidation before returning a child's summaries and never queries attempts",async()=>{
  const q=query({data:link,error:null}),revoked=query({data:null,error:null});
  fake.from.mockReturnValueOnce(q).mockReturnValueOnce(query({data:null,error:null})).mockReturnValueOnce(query({count:0,error:null})).mockReturnValueOnce(query({count:0,error:null})).mockReturnValueOnce(revoked);
  await expect(loadChildSummary("p","c")).rejects.toThrow("Child link not verified");
  expect(fake.from).not.toHaveBeenCalledWith("attempts");
 });
 it("preserves unavailable and zero counts separately",async()=>{
  fake.from.mockReturnValueOnce(query({data:link,error:null})).mockReturnValueOnce(query({data:null,error:{message:"denied"}})).mockReturnValueOnce(query({count:0,error:null})).mockReturnValueOnce(query({count:null,error:{message:"denied"}})).mockReturnValueOnce(query({data:link,error:null}));
  expect(await loadChildSummary("p","c")).toEqual({stats:null,badges:0,certificates:null});
  expect(recordedAccuracy(null)).toBeNull();
 });
});
