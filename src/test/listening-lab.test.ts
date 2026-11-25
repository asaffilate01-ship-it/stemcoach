import { describe, expect, it, vi } from "vitest";
import { chooseLocalVoice, listeningTracks, ListeningPlayback } from "@/lib/listeningLab";

describe("launch language listening models",()=>{
  it("keeps only the five agreed languages with four distinct prompts each",()=>{
    expect(listeningTracks.map(t=>t.id)).toEqual(["en","de","ar","ur","cy"]);
    for(const t of listeningTracks){
      expect(t.phrases).toHaveLength(4);
      expect(new Set(t.phrases.map(p=>p.text)).size).toBe(4);
      expect(t.phrases.every(p=>p.text&&p.meaningEn&&p.meaningDe)).toBe(true);
      expect(t.rtl).toBe(["ar","ur"].includes(t.id));
    }
  });
  it("selects exact local dialect before fallback without accepting remote or unrelated voices",()=>{
    const voices=[
      {lang:"de-DE",localService:false,default:true,name:"remote"},
      {lang:"de-AT",localService:true,default:true,name:"Austrian"},
      {lang:"de-DE",localService:true,default:false,name:"German"},
      {lang:"en-GB",localService:true,default:true,name:"English"},
    ];
    expect(chooseLocalVoice(voices,"de-DE")?.name).toBe("German");
    expect(chooseLocalVoice(voices,"de-CH")?.name).toBe("Austrian");
    expect(chooseLocalVoice(voices,"cy-GB")).toBeNull();
    expect(chooseLocalVoice(voices.slice(0,1),"de-DE")).toBeNull();
  });
  it("cancels an old utterance without accepting stale finish callbacks",()=>{
    const engine={speak:vi.fn(),cancel:vi.fn()} as unknown as SpeechSynthesis;
    const a={} as SpeechSynthesisUtterance,b={} as SpeechSynthesisUtterance;
    const finishA=vi.fn(),finishB=vi.fn(),session=new ListeningPlayback();
    session.play(engine,a,finishA);
    const old=a.onend!;
    session.play(engine,b,finishB);
    expect(engine.cancel).toHaveBeenCalledTimes(1);
    old.call(a,{} as SpeechSynthesisEvent);
    expect(finishA).not.toHaveBeenCalled();
    b.onend!.call(b,{} as SpeechSynthesisEvent);
    expect(finishB).toHaveBeenCalledWith(false);
    session.stop();
    expect(engine.cancel).toHaveBeenCalledTimes(1);
  });
  it("handles playback errors and clears stopped utterances",()=>{
    const engine={speak:vi.fn(()=>{throw Error("speech unavailable");}),cancel:vi.fn()} as unknown as SpeechSynthesis;
    const a={} as SpeechSynthesisUtterance,done=vi.fn();
    new ListeningPlayback().play(engine,a,done);
    expect(done).toHaveBeenCalledWith(true);
    expect(engine.cancel).toHaveBeenCalledOnce();
    expect(a.onerror).toBeNull();
  });
});
