import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import AITutor from "@/pages/AITutor";

const mocks = vi.hoisted(() => ({
  persist: vi.fn(),
  getSession: vi.fn(),
  fetch: vi.fn(),
  coach: { id: "mathematics", name: "Math coach", image: "/mascot.png" },
}));
vi.mock("@/components/layout/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/components/layout/PageTransition", () => ({ PageTransition: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/ui/mascot-avatar", () => ({ MascotAvatar: () => null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "student-test" } }) }));
vi.mock("@/hooks/useQuotaGate", () => ({ useQuotaGate: () => ({ canUseCoaching: true, loading: false, error: null, refresh: vi.fn() }) }));
vi.mock("@/hooks/useLearnerCurriculum", () => ({ useLearnerCurriculum: () => ({ curriculumId: "uk-gcse", curriculum: { label: "GCSE" }, loading: false, error: null, retry: vi.fn() }) }));
vi.mock("@/hooks/usePreferredCoach", () => ({ usePreferredCoach: () => ({ preferredCoachId: "mathematics", setPreferredCoachId: vi.fn(async () => ({error:null})) }) }));
vi.mock("@/lib/mascots", () => ({ getMascot: () => mocks.coach, getCoachStem: () => mocks.coach }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage:"en",language:"en" } }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({data:{messages:[]},error:null}) }) }) }),
      upsert: (value: unknown) => ({ abortSignal: async () => { mocks.persist(value); return {error:null}; } }),
    }),
  },
}));

const response = (payload: string) => new Response(new ReadableStream<Uint8Array>({
  start(controller) { controller.enqueue(new TextEncoder().encode(payload)); controller.close(); },
}), {status:200,headers:{"Content-Type":"text/event-stream"}});
const chunk=(content:string)=>"data: "+JSON.stringify({choices:[{delta:{content},finish_reason:null}]})+"\n\n";

describe("AI tutor learner workflow",()=>{
  beforeEach(()=>{
    vi.stubGlobal("fetch",mocks.fetch);
    mocks.fetch.mockReset();mocks.persist.mockReset();mocks.getSession.mockReset();
    mocks.getSession.mockResolvedValue({data:{session:{access_token:"test-token",user:{id:"student-test"}}}});
    Object.defineProperty(HTMLElement.prototype,"scrollTo",{configurable:true,value:vi.fn()});
  });
  afterEach(()=>{cleanup();vi.unstubAllGlobals();});
  const open=()=>render(<MemoryRouter initialEntries={["/ai-tutor?subject=mathematics"]}><AITutor /></MemoryRouter>);
  it("sends the selected hint mode and stores only the completed conversation",async()=>{
    mocks.fetch.mockResolvedValue(response(chunk("Try isolating the variable.")+"data: [DONE]\n\n"));
    open();
    const input=await screen.findByRole("textbox",{name:"coach.inputPlaceholder"});
    await waitFor(()=>expect(input).toBeEnabled());
    fireEvent.click(screen.getByRole("radio",{name:/coach.workspace.modes.hint.label/}));
    fireEvent.change(input,{target:{value:"How do I start?"}});
    fireEvent.click(screen.getByRole("button",{name:"coach.send"}));
    await waitFor(()=>expect(mocks.persist).toHaveBeenCalledOnce());
    const request=JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(request).toMatchObject({subject:"mathematics",curriculum:"uk-gcse",mode:"hint",messages:[{role:"user",content:"How do I start?"}]});
    expect(mocks.persist.mock.calls[0][0].messages).toEqual([{role:"user",content:"How do I start?"},{role:"assistant",content:"Try isolating the variable."}]);
    expect(input).toHaveValue("");
  });
  it("restores the learner draft after an interrupted reply and never persists the partial answer",async()=>{
    mocks.fetch.mockResolvedValue(response(chunk("Partial answer")));
    open();
    const input=await screen.findByRole("textbox",{name:"coach.inputPlaceholder"});
    await waitFor(()=>expect(input).toBeEnabled());
    fireEvent.change(input,{target:{value:"My draft"}});
    fireEvent.click(screen.getByRole("button",{name:"coach.send"}));
    await waitFor(()=>expect(input).toHaveValue("My draft"));
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.persist).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("interrupted");
    expect(screen.queryByText("Partial answer")).not.toBeInTheDocument();
  });
  it("stops a streaming reply, restores the draft and safely sends a fresh turn",async()=>{
    const cancel=vi.fn();
    const pending=new Response(new ReadableStream<Uint8Array>({
      start(controller){controller.enqueue(new TextEncoder().encode(chunk("Unfinished explanation")));},
      cancel,
    }),{status:200,headers:{"Content-Type":"text/event-stream"}});
    mocks.fetch.mockResolvedValueOnce(pending).mockResolvedValueOnce(response(chunk("Completed new explanation")+"data: [DONE]\n\n"));
    open();
    const input=await screen.findByRole("textbox",{name:"coach.inputPlaceholder"});
    await waitFor(()=>expect(input).toBeEnabled());
    fireEvent.change(input,{target:{value:"Help with this problem"}});
    fireEvent.click(screen.getByRole("button",{name:"coach.send"}));
    await screen.findByText("Unfinished explanation");
    fireEvent.click(screen.getByRole("button",{name:"coach.workspace.stopResponse"}));
    await waitFor(()=>expect(input).toHaveValue("Help with this problem"));
    expect(mocks.fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(cancel).toHaveBeenCalled();
    expect(screen.queryByText("Unfinished explanation")).not.toBeInTheDocument();
    expect(mocks.persist).not.toHaveBeenCalled();
    expect(screen.getByText("coach.workspace.responseStopped")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"coach.send"}));
    await waitFor(()=>expect(mocks.persist).toHaveBeenCalledOnce());
    expect(mocks.persist.mock.calls[0][0].messages).toEqual([
      {role:"user",content:"Help with this problem"},
      {role:"assistant",content:"Completed new explanation"},
    ]);
    expect(screen.queryByText("coach.workspace.responseStopped")).not.toBeInTheDocument();
  });
  it("prepares a mode-specific study draft without sending or replacing existing text",async()=>{
    open();
    const input=await screen.findByRole("textbox",{name:"coach.inputPlaceholder"});
    await waitFor(()=>expect(input).toBeEnabled());
    fireEvent.click(screen.getByRole("radio",{name:/coach.workspace.modes.quiz.label/}));
    const starter=screen.getByRole("button",{name:"coach.workspace.useStarter"});
    fireEvent.click(starter);
    expect(input).toHaveValue("coach.workspace.starters.quiz");
    expect(input).toHaveFocus();
    expect(mocks.fetch).not.toHaveBeenCalled();
    fireEvent.change(input,{target:{value:"My own question"}});
    expect(starter).toBeDisabled();
    fireEvent.click(starter);
    expect(input).toHaveValue("My own question");
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("opens exact lesson review filters only after the learner chooses, preserving an unsent draft",async()=>{
    function Destination(){const location=useLocation();return <output data-testid="learning-destination">{location.pathname+location.search}</output>;}
    render(<MemoryRouter initialEntries={["/ai-tutor?subject=mathematics&tutorial=arithmetic-sequences-nth-term"]}>
      <Routes><Route path="/ai-tutor" element={<AITutor />} /><Route path="/qa-clinic" element={<Destination />} /></Routes>
    </MemoryRouter>);
    const input=await screen.findByRole("textbox",{name:"coach.inputPlaceholder"});
    await waitFor(()=>expect(input).toBeEnabled());
    const button=screen.getByRole("button",{name:"coach.studyActions.due"});
    expect(button).toBeEnabled();
    fireEvent.change(input,{target:{value:"Keep this draft"}});
    expect(button).toBeDisabled();
    expect(screen.getByRole("combobox",{name:"coach.tutorLabel"})).toBeDisabled();
    expect(screen.getByText("coach.studyActions.draftNotice")).toBeVisible();
    fireEvent.click(button);
    expect(input).toHaveValue("Keep this draft");
    expect(mocks.fetch).not.toHaveBeenCalled();
    fireEvent.change(input,{target:{value:""}});
    fireEvent.click(button);
    expect(await screen.findByTestId("learning-destination")).toHaveTextContent("/qa-clinic?subject=mathematics&topic=arithmetic-sequences-nth-term&review=due");
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("checks a calculation locally without sending it or persisting it to the tutor thread",async()=>{
    open();
    const composer=await screen.findByRole("textbox",{name:"coach.inputPlaceholder"});
    await waitFor(()=>expect(composer).toBeEnabled());
    fireEvent.click(screen.getByText("coach.calculator.title",{exact:true}));
    const input=screen.getByLabelText("coach.calculator.expression");
    fireEvent.change(input,{target:{value:"1/3+1/6"}});
    fireEvent.click(screen.getByRole("button",{name:"coach.calculator.calculate"}));
    expect(screen.getByText("1/2",{exact:true})).toBeInTheDocument();
    expect(composer).toHaveValue("");
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.persist).not.toHaveBeenCalled();
    fireEvent.change(input,{target:{value:"1/0"}});
    expect(screen.queryByText("1/2",{exact:true})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"coach.calculator.calculate"}));
    expect(screen.getByText("coach.calculator.errors.zero")).toBeInTheDocument();
  });
});
