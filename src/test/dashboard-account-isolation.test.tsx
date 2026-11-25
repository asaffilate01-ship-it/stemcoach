import {act,cleanup,renderHook,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {useStudentDashboard} from "@/hooks/useStudentDashboard";
const fake=vi.hoisted(()=>({load:vi.fn()}));
vi.mock("@/lib/loadStudentDashboard",()=>({loadStudentDashboard:fake.load}));
const deferred=()=>{let resolve!:(data:any)=>void;let reject!:(reason:Error)=>void;const promise=new Promise<any>((res,rej)=>{resolve=res;reject=rej;});return {resolve,reject,promise};};
beforeEach(()=>fake.load.mockReset());
afterEach(cleanup);

describe("account-scoped dashboard reads",()=>{
 it("clears previous account data synchronously and ignores late responses",async()=>{
  const a=deferred(),b=deferred();
  fake.load.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const {result,rerender}=renderHook(({id}:{id:string|undefined})=>useStudentDashboard(id),{initialProps:{id:"a"}});
  rerender({id:"b"});
  expect(result.current.loading).toBe(true);expect(result.current.data).toBeNull();
  await act(async()=>b.resolve({sampleSize:7}));
  expect(result.current.data?.sampleSize).toBe(7);
  await act(async()=>a.resolve({sampleSize:500}));
  expect(result.current.data?.sampleSize).toBe(7);
  rerender({id:undefined});expect(result.current.data).toBeNull();
 });
 it("reports errors instead of presenting an empty dashboard, and retries",async()=>{
  fake.load.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({sampleSize:0});
  const {result}=renderHook(()=>useStudentDashboard("a"));
  await waitFor(()=>expect(result.current.error).toBe(true));
  expect(result.current.data).toBeNull();
  act(()=>result.current.retry());
  expect(result.current.loading).toBe(true);
  await waitFor(()=>expect(result.current.data?.sampleSize).toBe(0));
  expect(result.current.error).toBe(false);
 });
});
