import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {LanguageLabWorkspace} from "@/components/learning/LanguageLabWorkspace";
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

describe("language laboratory interaction",()=>{
  it("supports five language tracks and text fallback without audio",()=>{
    vi.stubGlobal("SpeechSynthesisUtterance",undefined);
    render(<LanguageLabWorkspace/>);
    const tracks=screen.getByRole("group",{name:"Study language"});
    expect(within(tracks).getAllByRole("button")).toHaveLength(5);
    fireEvent.click(within(tracks).getByRole("button",{name:/Urdu/}));
    expect(screen.getByRole("button",{name:/^Listen$/})).toBeDisabled();
    expect(screen.getByText(/No matching on-device voice/)).toBeVisible();
    fireEvent.click(screen.getByRole("button",{name:"Show transcript"}));
    const phrase=screen.getByText("کتب خانہ کہاں ہے؟");
    expect(phrase).toHaveAttribute("lang","ur-PK");
    expect(phrase).toHaveAttribute("dir","rtl");
    expect(screen.getByText("Where is the library?")).toBeVisible();
    fireEvent.click(screen.getByRole("button",{name:"Next phrase"}));
    expect(screen.getByText("Phrase 2 / 4")).toBeVisible();
    expect(phrase).not.toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Show transcript"})).toHaveAttribute("aria-expanded","false");
  });
  it("uses only the matching local device voice and cancels playback when a phrase changes",()=>{
    const voices=[{lang:"en-GB",localService:false,name:"Remote"},{lang:"en-GB",localService:true,name:"Local"}];
    const engine={getVoices:vi.fn(()=>voices),speak:vi.fn(),cancel:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn()};
    class Utterance {text:string;voice:unknown;lang="";rate=1;onend=null;onerror=null;constructor(text:string){this.text=text;}}
    vi.stubGlobal("speechSynthesis",engine);
    vi.stubGlobal("SpeechSynthesisUtterance",Utterance);
    render(<LanguageLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:"Listen slowly"}));
    expect(engine.speak).toHaveBeenCalledOnce();
    expect(engine.speak.mock.calls[0][0]).toMatchObject({voice:voices[1],lang:"en-GB",rate:0.75});
    expect(screen.getByRole("button",{name:"Stop audio"})).toBeEnabled();
    fireEvent.click(screen.getByRole("button",{name:"Next phrase"}));
    expect(engine.cancel).toHaveBeenCalledOnce();
    expect(screen.getByRole("button",{name:"Stop audio"})).toBeDisabled();
  });
  it("preserves the selected language and revealed transcript when switching interface locale",()=>{
    vi.stubGlobal("SpeechSynthesisUtterance",undefined);
    const {rerender}=render(<LanguageLabWorkspace/>);
    fireEvent.click(screen.getByRole("button",{name:/Welsh/}));
    fireEvent.click(screen.getByRole("button",{name:"Show transcript"}));
    rerender(<LanguageLabWorkspace language="de"/>);
    expect(screen.getByRole("heading",{name:"Sprachlabor"})).toBeVisible();
    expect(screen.getByText("Ble mae'r llyfrgell?")).toHaveAttribute("lang","cy-GB");
    expect(screen.getByText("Wo ist die Bibliothek?")).toBeVisible();
  });
});
