import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MockExam from "@/pages/MockExam";

type ActiveProps = {
  questions:{id:string;question_text:string}[];
  answers:Record<number,string>;
  setAnswers:(value:Record<number,string>|((previous:Record<number,string>)=>Record<number,string>))=>void;
  onSubmit:()=>void;
};
const mocks=vi.hoisted(()=>({
  auth:{user:{id:"learner-a"} as {id:string}|null,loading:false},
  rpc:vi.fn(), invoke:vi.fn(), getSession:vi.fn(), toast:vi.fn(), refresh:vi.fn(),
  active:null as ActiveProps|null,
}));
vi.mock("@/hooks/useAuth",()=>({useAuth:()=>mocks.auth}));
vi.mock("@/hooks/useQuotaGate",()=>({useQuotaGate:()=>({canTakeMockExam:true,mockExamsRemaining:2,mockExamsTotal:2,hasPurchased:true,refresh:mocks.refresh})}));
vi.mock("@/hooks/use-toast",()=>({useToast:()=>({toast:mocks.toast})}));
vi.mock("@/hooks/useDocumentTitle",()=>({useDocumentTitle:()=>{}}));
vi.mock("@/components/layout/AppHeader",()=>({AppHeader:()=>null}));
vi.mock("@/components/layout/Footer",()=>({Footer:()=>null}));
vi.mock("@/components/layout/PageTransition",()=>({PageTransition:({children}:{children:React.ReactNode})=>children}));
vi.mock("react-i18next",()=>({useTranslation:()=>({t:(key:string)=>key})}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc:mocks.rpc,auth:{getSession:mocks.getSession},functions:{invoke:mocks.invoke}}}));
vi.mock("@/components/mock-exam/ExamBrowse",()=>({ExamBrowse:({onCustomExam}:{onCustomExam:()=>void})=><button onClick={onCustomExam}>Configure exam</button>}));
vi.mock("@/components/mock-exam/ExamSetup",()=>({ExamSetup:({onStart,isLoading}:{onStart:()=>void,isLoading:boolean})=><button onClick={onStart} disabled={isLoading}>Start exam</button>}));
vi.mock("@/components/mock-exam/ExamActive",()=>({ExamActive:(props:ActiveProps)=>{
  mocks.active=props;
  return <div><p>{props.questions[0].question_text}</p><button onClick={()=>props.setAnswers(previous=>({...previous,0:"Alpha"}))}>Choose Alpha</button><button onClick={props.onSubmit}>Submit exam</button><output>{props.answers[0]??"Unanswered"}</output></div>;
}}));
vi.mock("@/components/mock-exam/ExamReview",()=>({ExamReview:()=> <p>Confirmed exam review</p>}));

const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const sheet=()=>Array.from({length:30},(_,i)=>({id:id(i+1),question_text:"Synthetic question "+(i+1),topic:"Example",subject:"physics",difficulty:2,points:1,options:["Alpha","Beta"]}));
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done;});return{promise,resolve};}
const workspace=()=> <MemoryRouter><MockExam/></MemoryRouter>;
const start=()=>{fireEvent.click(screen.getByText("Configure exam"));fireEvent.click(screen.getByText("Start exam"));};

describe("account-scoped exam workspace",()=>{
  beforeEach(()=>{
    vi.clearAllMocks();
    mocks.auth={user:{id:"learner-a"},loading:false};
    mocks.active=null;
    mocks.getSession.mockImplementation(async()=>({data:{session:mocks.auth.user?{user:mocks.auth.user,access_token:"token-"+mocks.auth.user.id}:null},error:null}));
    mocks.refresh.mockResolvedValue(undefined);
  });
  afterEach(()=>{cleanup();vi.restoreAllMocks();});
  it("rejects incomplete sheets before opening the exam or sending a grading request",async()=>{
    mocks.rpc.mockResolvedValue({data:sheet().slice(0,29),error:null});
    render(workspace());start();
    await waitFor(()=>expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({description:"mockExam.invalidSheet"})));
    expect(screen.getByText("Start exam")).toBeEnabled();
    expect(screen.queryByText("Synthetic question 1")).not.toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("discards a delayed sheet after an account switch, even if the old network request completes",async()=>{
    const pending=deferred<{data:ReturnType<typeof sheet>;error:null}>();
    mocks.rpc.mockReturnValue(pending.promise);
    const view=render(workspace());start();
    await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledTimes(1));
    mocks.auth={user:{id:"learner-b"},loading:false};
    view.rerender(workspace());
    await act(async()=>pending.resolve({data:sheet(),error:null}));
    expect(screen.getByText("Configure exam")).toBeInTheDocument();
    expect(screen.queryByText("Synthetic question 1")).not.toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("freezes the latest accepted selection, refuses late changes and sends once under the original account",async()=>{
    const pending=deferred<{data:null;error:Error}>();
    mocks.invoke.mockReturnValue(pending.promise);
    mocks.rpc.mockResolvedValue({data:sheet(),error:null});
    const now=vi.spyOn(Date,"now").mockReturnValue(1_800_000_000_000);
    const view=render(workspace());start();
    await screen.findByText("Synthetic question 1");
    const active=mocks.active!;
    act(()=>{
      active.setAnswers(previous=>({...previous,0:"Alpha"}));
      now.mockReturnValue(1_800_000_000_000+60*60_000);
      active.setAnswers(previous=>({...previous,0:"Beta"}));
      active.onSubmit();active.onSubmit();
    });
    await waitFor(()=>expect(mocks.invoke).toHaveBeenCalledTimes(1));
    expect(mocks.invoke).toHaveBeenCalledWith("grade-mock-exam",expect.objectContaining({
      headers:{Authorization:"Bearer token-learner-a"},
      body:expect.objectContaining({submissions:expect.arrayContaining([{question_id:id(1),answer:"Alpha"}])}),
    }));
    mocks.auth={user:{id:"learner-b"},loading:false};
    view.rerender(workspace());
    await act(async()=>pending.resolve({data:null,error:new Error("Network response lost")}));
    expect(screen.getByText("Configure exam")).toBeInTheDocument();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
  });
});
