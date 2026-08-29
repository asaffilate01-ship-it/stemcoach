import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Send, User, Loader2, Trash2, Sparkles, Lock, CreditCard, GraduationCap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useQuotaGate } from "@/hooks/useQuotaGate";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMascot, getCoachStem } from "@/lib/mascots";
import { usePreferredCoach } from "@/hooks/usePreferredCoach";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const SUBJECT_IDS = ["mathematics", "physics", "chemistry", "biology", "computer-science", "economics", "english-literature", "psychology", "geography", "business-studies", "ielts", "celta", "french", "german"];
const SUBJECT_LABELS: Record<string, string> = {
  mathematics: "Mathematics",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  "computer-science": "Computer Science",
  economics: "Economics",
  "english-literature": "English Literature",
  psychology: "Psychology",
  geography: "Geography",
  "business-studies": "Business Studies",
  ielts: "IELTS",
  celta: "CELTA",
  french: "French",
  german: "German",
};

const QUICK_PROMPTS: Record<string, string[]> = {
  mathematics: ["Explain the quadratic formula", "How do I solve simultaneous equations?", "What is differentiation?"],
  physics: ["Explain Newton's 3 laws", "What is Ohm's law?", "How does radioactive decay work?"],
  chemistry: ["What is ionic bonding?", "Explain Le Chatelier's principle", "What are moles in chemistry?"],
  biology: ["Explain mitosis vs meiosis", "How does photosynthesis work?", "What is natural selection?"],
  "computer-science": ["Explain binary search", "Help me trace this algorithm", "How does authentication work?"],
  economics: ["Explain price elasticity", "How do interest rates affect demand?", "Help me structure an evaluation paragraph"],
  "english-literature": ["How do I analyse a quotation?", "Help me structure a comparison", "Explain dramatic irony"],
  psychology: ["Explain reliability and validity", "How do I evaluate a study?", "Compare experimental designs"],
  geography: ["Explain river erosion", "Help me evaluate fieldwork data", "How should I use a case study?"],
  "business-studies": ["Explain break-even", "How do I evaluate a business decision?", "What is cash flow?"],
  ielts: ["Tips for Writing Task 2", "How to improve my speaking score?", "Common grammar mistakes to avoid"],
  celta: ["What is TTT vs STT?", "How to write a lesson plan?", "Explain concept checking questions"],
  french: ["Help me revise verb tenses", "Correct this French paragraph", "Give me an oral practice question"],
  german: ["Help me revise German cases", "Correct this German paragraph", "Give me an oral practice question"],
};

export default function AITutor() {
  useDocumentTitle("STEMCoach");
  const { user } = useAuth();
  const { canUseCoaching, loading: quotaLoading } = useQuotaGate();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { preferredCoachId, setPreferredCoachId } = usePreferredCoach();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const requestedSubject = searchParams.get("subject");
  const initialSubject = requestedSubject && SUBJECT_IDS.includes(requestedSubject)
    ? requestedSubject
    : preferredCoachId !== "stemcoach" && SUBJECT_IDS.includes(preferredCoachId)
      ? preferredCoachId
      : "mathematics";
  const [subjectId, setSubjectId] = useState(initialSubject);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mascot = getMascot(subjectId);
  const coach = getCoachStem();

  const conversationKey = `stemcoach:coach-thread:${user?.id || "guest"}:${subjectId}`;

  const persistConversation = async (thread: Msg[]) => {
    const trimmed = thread.slice(-60).map((message) => ({ role: message.role, content: message.content.slice(0, 12_000) }));
    try { localStorage.setItem(conversationKey, JSON.stringify(trimmed)); } catch { /* storage unavailable */ }
    if (!user) return;
    await supabase.from("coach_conversations").upsert({
      user_id: user.id,
      subject: subjectId,
      messages: trimmed,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,subject" });
  };

  const clearConversation = async () => {
    setMessages([]);
    try { localStorage.removeItem(conversationKey); } catch { /* storage unavailable */ }
    if (user) await supabase.from("coach_conversations").delete().eq("user_id", user.id).eq("subject", subjectId);
  };

  useEffect(() => {
    let active = true;
    setConversationLoading(true);
    setMessages([]);
    try {
      const cached = JSON.parse(localStorage.getItem(conversationKey) || "[]");
      if (Array.isArray(cached)) setMessages(cached.filter((message): message is Msg =>
        (message?.role === "user" || message?.role === "assistant") && typeof message?.content === "string",
      ));
    } catch { /* ignore malformed local cache */ }
    if (!user) {
      setConversationLoading(false);
      return () => { active = false; };
    }
    supabase.from("coach_conversations").select("messages").eq("user_id", user.id).eq("subject", subjectId).maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const remote = data?.messages;
        if (Array.isArray(remote)) {
          const valid = remote.filter((message): message is Msg =>
            typeof message === "object" && message !== null &&
            ((message as { role?: unknown }).role === "user" || (message as { role?: unknown }).role === "assistant") &&
            typeof (message as { content?: unknown }).content === "string",
          );
          setMessages(valid);
          try { localStorage.setItem(conversationKey, JSON.stringify(valid)); } catch { /* storage unavailable */ }
        }
        setConversationLoading(false);
      });
    return () => { active = false; };
  }, [conversationKey, subjectId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!requestedSubject && messages.length === 0 && preferredCoachId !== "stemcoach" && SUBJECT_IDS.includes(preferredCoachId)) {
      setSubjectId(preferredCoachId);
    }
  }, [messages.length, preferredCoachId, requestedSubject]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    const userMsg: Msg = { role: "user", content: msg };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        const errorMessage = "Please sign in again to continue coaching.";
        upsertAssistant(errorMessage);
        await persistConversation([...allMessages, { role: "assistant", content: errorMessage }]);
        setIsLoading(false);
        return;
      }
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: allMessages, subject: SUBJECT_LABELS[subjectId], curriculum: "International" }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        const errorMessage = resp.status === 429
          ? "⏳ Rate limit reached. Please wait a moment and try again."
          : resp.status === 402
            ? "💳 Coaching credits exhausted. Please contact support."
            : errData.error || "Sorry, something went wrong. Please try again.";
        upsertAssistant(errorMessage);
        await persistConversation([...allMessages, { role: "assistant", content: errorMessage }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      if (assistantSoFar) await persistConversation([...allMessages, { role: "assistant", content: assistantSoFar }]);
    } catch (e) {
      console.error(e);
      const errorMessage = "Sorry, I couldn't connect. Please try again.";
      upsertAssistant(errorMessage);
      await persistConversation([...allMessages, { role: "assistant", content: errorMessage }]);
    }
    setIsLoading(false);
  };

  if (!quotaLoading && !canUseCoaching) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <PageTransition>
          <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
              <img src={coach.image} alt={coach.name} className="h-full w-full object-cover" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">STEMCoach Coaching — Premium Feature</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              Purchase a question pack to unlock STEMCoach coaching. Get personalised explanations, exam tips, and essay grading from your virtual tutor.
            </p>
            <Button onClick={() => navigate("/pricing")} className="gap-2 rounded-xl">
              <CreditCard className="h-4 w-4" /> View Plans
            </Button>
          </main>
        </PageTransition>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto flex flex-1 flex-col px-4 py-4">
          {/* Subject selector with mascot avatars */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Tutor:</span>
            {SUBJECT_IDS.map(id => {
              const m = getMascot(id);
              const isActive = subjectId === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setSubjectId(id);
                    void setPreferredCoachId(id as Parameters<typeof setPreferredCoachId>[0]);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img src={m.image} alt={m.name} className="h-5 w-5 rounded-full object-cover" />
                  {m.name}
                </button>
              );
            })}
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border bg-card p-4 space-y-4" style={{ maxHeight: "calc(100vh - 260px)" }}>
            <AnimatePresence mode="wait">
              {messages.length === 0 && !conversationLoading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-lg">
                    <img src={mascot.image} alt={mascot.name} className="h-full w-full object-cover" />
                  </div>
                  <h3 className="text-lg font-semibold">{mascot.name}</h3>
                  <p className="mt-1 text-xs italic text-muted-foreground">"{mascot.personality}"</p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Ask me anything about {SUBJECT_LABELS[subjectId]}. I'll explain concepts, solve problems, and give you exam tips — like a private tutor.
                  </p>

                  {/* Quick prompts */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {(QUICK_PROMPTS[subjectId] || []).map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        className="flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                      >
                        <Sparkles className="h-3 w-3 text-primary/50" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                    <img src={mascot.image} alt={mascot.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted prose prose-sm dark:prose-invert max-w-none"
                  }`}
                >
                  {msg.role === "assistant" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
                  <img src={mascot.image} alt={mascot.name} className="h-full w-full object-cover" />
                </div>
                <div className="rounded-xl bg-muted px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={`Ask ${mascot.name} about ${SUBJECT_LABELS[subjectId]}...`}
              className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isLoading}
            />
            <Button onClick={() => send()} disabled={isLoading || !input.trim()} className="rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
