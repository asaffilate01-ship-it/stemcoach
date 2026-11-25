import {act,cleanup,renderHook,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {useApprovedChildren,useChildSummary} from "@/hooks/useParentProgress";
const fake=vi.hoisted(()=>({links:vi.fn(),summary:vi.fn()}));
vi.mock("@/lib/parentProgress",()=>({loadApprovedChildren:fake.links,loadChildSummary:fake.summary}));
const defer=()=>{let resolve!:(data:any)=>void;const promise=new Promise<any>(r=>{resolve=r;});return {resolve,promise};};
beforeEach(()=>{fake.links.mockReset();fake.summary.mockReset();});
afterEach(cleanup);
describe("parent account and learner isolation",()=>{
 it("never displays another parent's links after switching accounts",async()=>{
  const a=defer(),b=defer();fake.links.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const {result,rerender}=renderHook(({id}:{id:string})=>useApprovedChildren(id),{initialProps:{id:"parent-a"}});
  rerender({id:"parent-b"});expect(result.current.data).toBeNull();
  await act(async()=>b.resolve({children:[{id:"b",name:"B"}]}));
  await act(async()=>a.resolve({children:[{id:"a",name:"A"}]}));
  expect(result.current.data?.children[0].id).toBe("b");
 });
 it("does not revive a previous summary when a child selection is removed and revisited",async()=>{
  const a=defer(),b=defer();fake.summary.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const {result,rerender}=renderHook(({id}:{id:string|null})=>useChildSummary("p",id),{initialProps:{id:"a"}});
  await act(async()=>a.resolve({stats:null,badges:5,certificates:0}));
  expect(result.current.data?.badges).toBe(5);
  rerender({id:null});expect(result.current.data).toBeNull();
  rerender({id:"a"});expect(result.current.loading).toBe(true);expect(result.current.data).toBeNull();
  await act(async()=>b.resolve({stats:null,badges:1,certificates:null}));
  expect(result.current.data?.badges).toBe(1);
 });
 it("preserves failed reads as errors and allows an explicit retry",async()=>{
  fake.links.mockRejectedValueOnce(Error("denied")).mockResolvedValueOnce({children:[]});
  const {result}=renderHook(()=>useApprovedChildren("p"));
  await waitFor(()=>expect(result.current.error).toBe(true));
  expect(result.current.data).toBeNull();act(()=>result.current.retry());
  await waitFor(()=>expect(result.current.data?.children).toEqual([]));
 });
});
