import { describe, expect, it, vi } from "vitest";
import { resolveCoachProvider, requestCoachCompletion, normaliseClaudeStream } from "../../supabase/functions/_shared/coachProviders";
import { readCoachStream } from "@/lib/coachStream";

const env = (values: Record<string,string>) => (name:string) => values[name];
const direct = (provider:string, extra:Record<string,string> = {}) => env({
  STEMCOACH_AI_PROVIDER: provider, STEMCOACH_DIRECT_AI_ENABLED: "true", STEMCOACH_AI_MODEL:"test-model", ...extra,
});
const turns = [{role:"user" as const,content:"Explain an equation"}];
const bytes=(s:string)=>new TextEncoder().encode(s);
const events=(...values:unknown[])=>values.map(v=>"data: "+JSON.stringify(v)+"\r\n\r\n").join("");
const stream=(text:string)=>new ReadableStream<Uint8Array>({start(c){for(const b of bytes(text))c.enqueue(Uint8Array.of(b));c.close();}});

describe("server-owned AI provider configuration",()=>{
  it("preserves the existing gateway when no provider is explicitly selected",()=>{
    expect(resolveCoachProvider(env({LOVABLE_API_KEY:"fixture"}))).toEqual({
      provider:"gateway",endpoint:"https://ai.gateway.lovable.dev/v1/chat/completions",key:"fixture",model:"google/gemini-3-flash-preview",
    });
  });
  it("fails closed on unknown providers, unapproved routes and incomplete configuration",()=>{
    expect(()=>resolveCoachProvider(env({STEMCOACH_AI_PROVIDER:"__proto__"}))).toThrow();
    expect(()=>resolveCoachProvider(env({STEMCOACH_AI_PROVIDER:"openai",OPENAI_API_KEY:"fixture",STEMCOACH_AI_MODEL:"test-model"}))).toThrow();
    expect(()=>resolveCoachProvider(direct("claude"))).toThrow();
    expect(()=>resolveCoachProvider(direct("gemini",{GEMINI_API_KEY:"fixture",STEMCOACH_AI_MODEL:""}))).toThrow();
  });
  it("allows configured Qwen regions but rejects arbitrary URLs, credentials, redirects and paths",()=>{
    const make=(base:string)=>direct("qwen",{DASHSCOPE_API_KEY:"fixture",STEMCOACH_QWEN_BASE_URL:base});
    expect(resolveCoachProvider(make("https://workspace-id.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1")).endpoint).toBe("https://workspace-id.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions");
    expect(resolveCoachProvider(make("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/")).endpoint).toContain("dashscope-intl.aliyuncs.com");
    for(const base of ["http://dashscope-intl.aliyuncs.com/compatible-mode/v1","https://dashscope-intl.aliyuncs.com.attacker.example/compatible-mode/v1","https://user:pass@dashscope-us.aliyuncs.com/compatible-mode/v1","https://dashscope-us.aliyuncs.com/compatible-mode/v1?x=1","https://dashscope-us.aliyuncs.com/other","https://localhost/compatible-mode/v1"])expect(()=>resolveCoachProvider(make(base))).toThrow();
  });
  it("uses exactly one configured call and never falls back on provider errors",async()=>{
    const transport=vi.fn(async()=>new Response("provider error",{status:429}));
    const signal=new AbortController().signal;
    const result=await requestCoachCompletion(direct("openai",{OPENAI_API_KEY:"fixture"}),"System",turns,signal,transport as typeof fetch);
    expect(result.status).toBe(429);
    expect(transport).toHaveBeenCalledOnce();
    const [url,init]=transport.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.signal).toBe(signal);
    expect(init.redirect).toBe("error");
    expect(JSON.parse(String(init.body))).toMatchObject({model:"test-model",store:false,stream:true,messages:[{role:"system",content:"System"},...turns]});
  });
  it("routes Gemini through the documented compatible endpoint",async()=>{
    const transport=vi.fn(async()=>new Response("",{status:200}));
    await requestCoachCompletion(direct("gemini",{GEMINI_API_KEY:"fixture"}),"System",turns,undefined,transport as typeof fetch);
    const [url,init]=transport.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(init.headers).toMatchObject({Authorization:"Bearer fixture"});
    expect(JSON.parse(String(init.body))).not.toHaveProperty("store");
  });
});

describe("Claude message stream adapter",()=>{
  const text={type:"content_block_delta",delta:{type:"text_delta",text:"Héllo 🙂"}};
  const thinking={type:"content_block_delta",delta:{type:"thinking_delta",thinking:"PRIVATE"}};
  const end={type:"message_delta",delta:{stop_reason:"end_turn"}};
  const stop={type:"message_stop"};
  it("normalises split Unicode chunks and never returns internal thinking",async()=>{
    const result=await readCoachStream(normaliseClaudeStream(stream(events(thinking,text,end,stop))),vi.fn());
    expect(result).toBe("Héllo 🙂");
  });
  it("rejects truncated streams and token-limit exits",async()=>{
    for(const input of [events(text),events(text,stop),events(text,{type:"message_delta",delta:{stop_reason:"max_tokens"}},stop),events(text,{type:"error",error:{message:"PRIVATE"}})]){
      await expect(readCoachStream(normaliseClaudeStream(stream(input)),vi.fn())).rejects.toThrow();
    }
  });
  it("uses native Claude Messages headers and normalises its successful response",async()=>{
    const transport=vi.fn(async()=>new Response(stream(events(text,end,stop)),{status:200}));
    const response=await requestCoachCompletion(direct("claude",{ANTHROPIC_API_KEY:"fixture"}),"System",turns,undefined,transport as typeof fetch);
    const [url,init]=transport.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.headers).toMatchObject({"x-api-key":"fixture","anthropic-version":"2023-06-01"});
    expect(JSON.parse(String(init.body))).toEqual({model:"test-model",system:"System",messages:turns,max_tokens:2048,stream:true});
    expect(await readCoachStream(response.body!,vi.fn())).toBe("Héllo 🙂");
  });
});
