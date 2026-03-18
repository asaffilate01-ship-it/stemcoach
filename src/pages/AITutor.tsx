import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Bot, Send, User, Loader2, Trash2, Sparkles, Lock, CreditCard } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useQuotaGate } from "@/hooks/useQuotaGate";
import { useNavigate } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "IELTS", "CELTA"];

const QUICK_PROMPTS: Record<string, string[]> = {
  Mathematics: ["Explain the quadratic formula", "How do I solve simultaneous equations?", "What is differentiation?"],
  Physics: ["Explain Newton's 3 laws", "What is Ohm's law?", "How does radioactive decay work?"],
  Chemistry: ["What is ionic bonding?", "Explain Le Chatelier's principle", "What are moles in chemistry?"],
  Biology: ["Explain mitosis vs meiosis", "How does photosynthesis work?", "What is natural selection?"],
  IELTS: ["Tips for Writing Task 2", "How to improve my speaking score?", "Common grammar mistakes to avoid"],
  CELTA: ["What is TTT vs STT?", "How to write a lesson plan?", "Explain concept checking questions"],
};

export default function AITutor() {
  useDocumentTitle("AI Tutor");
  const { user } = useAuth();
  const { canUseAITutor, loading: quotaLoading } = useQuotaGate();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, subject, curriculum: "International" }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          upsertAssistant("⏳ Rate limit reached. Please wait a moment and try again.");
        } else if (resp.status === 402) {
          upsertAssistant("💳 AI credits exhausted. Please contact support.");
        } else {
          upsertAssistant(errData.error || "Sorry, something went wrong. Please try again.");
        }
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
    } catch (e) {
      console.error(e);
      upsertAssistant("Sorry, I couldn't connect. Please try again.");
    }
    setIsLoading(false);
  };

  if (!quotaLoading && !canUseAITutor) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <PageTransition>
          <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">AI Tutor — Premium Feature</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              Purchase a question pack to unlock the AI Tutor. Get personalised explanations, exam tips, and essay grading.
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
          {/* Subject selector */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Subject:</span>
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => { setSubject(s); if (messages.length === 0) setMessages([]); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  subject === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border bg-card p-4 space-y-4" style={{ maxHeight: "calc(100vh - 260px)" }}>
            <AnimatePresence mode="wait">
              {messages.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">STEMCoach AI Tutor</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Ask me anything about {subject}. I'll explain concepts, solve problems, and give you exam tips.
                  </p>

                  {/* Quick prompts */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {(QUICK_PROMPTS[subject] || []).map(prompt => (
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
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
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
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
              placeholder={`Ask about ${subject}...`}
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
