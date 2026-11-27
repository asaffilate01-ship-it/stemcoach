import { MascotAvatar } from "@/components/ui/mascot-avatar";
import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Send, User, Loader2, Trash2, Sparkles, CreditCard, GraduationCap, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useQuotaGate } from "@/hooks/useQuotaGate";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { getMascot, getCoachStem } from "@/lib/mascots";
import { usePreferredCoach } from "@/hooks/usePreferredCoach";
import { useLearnerCurriculum } from "@/hooks/useLearnerCurriculum";
import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "@/i18n/language";
import { tutorials } from "@/data/tutorials";
import { CoachRequestScope, normaliseCoachThread, type CoachMessage as Msg } from "@/lib/coachThread";
import { readCoachStream } from "@/lib/coachStream";
import { COACH_MODES, type CoachMode } from "../../supabase/functions/_shared/coachModes";


const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const SUBJECT_IDS = ["mathematics", "physics", "chemistry", "biology", "computer-science", "economics", "english-literature", "psychology", "geography", "business-studies", "ielts", "celta", "german"];
export default function AITutor() {
  const { user } = useAuth();
  const { search } = useLocation();
  return <CoachWorkspace key={JSON.stringify([user?.id ?? null, search])} />;
}

function CoachWorkspace() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("nav.aiTutor"));
  const { user } = useAuth();
  const { canUseCoaching, loading: quotaLoading, error: quotaError, refresh: refreshQuota } = useQuotaGate();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { preferredCoachId, setPreferredCoachId } = usePreferredCoach();
  const { curriculumId, curriculum, loading: curriculumLoading, error: curriculumError, retry: retryCurriculum } = useLearnerCurriculum();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<CoachMode>("explain");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [loadedSubject, setLoadedSubject] = useState<string | null>(null);
  const [threadError, setThreadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestScope = useRef(new CoachRequestScope());
  const requestedSubject = searchParams.get("subject");
  const requestedTutorial = tutorials.find((tutorial) => tutorial.id === searchParams.get("tutorial")) || null;
  const initialSubject = requestedTutorial?.subject || (requestedSubject && SUBJECT_IDS.includes(requestedSubject)
    ? requestedSubject
    : preferredCoachId !== "stemcoach" && SUBJECT_IDS.includes(preferredCoachId)
      ? preferredCoachId
      : "mathematics");
  const [subjectId, setSubjectId] = useState(initialSubject);
  const scrollRef = useRef<HTMLDivElement>(null);
  const manuallySelectedTutor = useRef(false);

  useEffect(() => {
    const draft = (location.state as { qaDraft?: unknown } | null)?.qaDraft;
    if (typeof draft !== "string" || !draft.trim()) return;
    setInput(draft.slice(0, 2000));
    if (requestedSubject && SUBJECT_IDS.includes(requestedSubject)) setSubjectId(requestedSubject);
    // Discard route state so drafts are not replayed after another navigation.
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location.key, location.pathname, location.search, location.state, navigate, requestedSubject]);

  const mascot = getMascot(subjectId);
  const coach = getCoachStem();
  const subjectLabel = t(`subjects.names.${subjectId}`);
  const quickPrompts = [1, 2, 3].map((index) => t(`coach.prompts.${subjectId}.${index}`));
  const activeTutorial = requestedTutorial?.subject === subjectId ? requestedTutorial : null;

  const accountId = user?.id;
  const threadReady = !conversationLoading && loadedSubject === subjectId && !threadError && canUseCoaching && !curriculumLoading && !curriculumError;
  const busy = isLoading || clearing || conversationLoading;

  const persistConversation = async (thread: Msg[], request: AbortController) => {
    if (!accountId || !requestScope.current.isCurrent(request)) return;
    const { error } = await supabase.from("coach_conversations").upsert({
      user_id: accountId,
      subject: subjectId,
      messages: normaliseCoachThread(thread),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,subject" }).abortSignal(request.signal);
    if (error && requestScope.current.isCurrent(request)) {
      setSaveError("Your reply is visible but could not be saved to your account.");
    }
  };

  const clearConversation = async () => {
    if (!accountId || busy || !threadReady || requestScope.current.inFlight) return;
    const request = requestScope.current.begin();
    setClearing(true);
    setSaveError("");
    try {
      const { error } = await supabase.from("coach_conversations").delete().eq("user_id", accountId).eq("subject", subjectId).abortSignal(request.signal);
      if (error) throw error;
      if (requestScope.current.isCurrent(request)) setMessages([]);
    } catch {
      if (requestScope.current.isCurrent(request)) setSaveError("The conversation could not be cleared. Please retry.");
    } finally {
      if (requestScope.current.isCurrent(request)) {
        setClearing(false);
        requestScope.current.finish(request);
      }
    }
  };

  useEffect(() => {
    let active = true;
    const scope = requestScope.current;
    setMessages([]);
    setLoadedSubject(null);
    setThreadError("");
    setSaveError("");
    setIsLoading(false);
    setClearing(false);
    setConversationLoading(Boolean(accountId && canUseCoaching && !curriculumLoading && !curriculumError));
    if (accountId && canUseCoaching && !curriculumLoading && !curriculumError) {
      void (async () => {
        try {
          const { data, error } = await supabase.from("coach_conversations").select("messages").eq("user_id", accountId).eq("subject", subjectId).maybeSingle();
          if (error) throw error;
          if (active) {
            setMessages(normaliseCoachThread(data?.messages));
            setLoadedSubject(subjectId);
          }
        } catch {
          if (active) setThreadError("Your conversation history could not be verified.");
        } finally {
          if (active) setConversationLoading(false);
        }
      })();
    }
    return () => { active = false; scope.cancel(); };
  }, [accountId, subjectId, retry, canUseCoaching, curriculumId, curriculumLoading, curriculumError]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!manuallySelectedTutor.current && !busy && !requestedSubject && !requestedTutorial && messages.length === 0 && preferredCoachId !== "stemcoach" && SUBJECT_IDS.includes(preferredCoachId)) {
      setSubjectId(preferredCoachId);
    }
  }, [messages.length, preferredCoachId, requestedSubject, requestedTutorial, busy]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || busy || !threadReady || !accountId || requestScope.current.inFlight) return;
    const request = requestScope.current.begin();
    const current = () => requestScope.current.isCurrent(request);
    setSaveError("");
    const userMsg: Msg = { role: "user", content: msg };
    const allMessages = normaliseCoachThread([...messages, userMsg]);
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      if (!current()) return;
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
      if (!current()) return;
      if (!session?.access_token || session.user.id !== accountId) throw new Error(t("coach.errors.signInAgain"));
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        signal: request.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          subject: subjectId,
          curriculum: curriculumId,
          language: normalizeLanguage(i18n.resolvedLanguage || i18n.language),
          tutorialId: activeTutorial?.id,
          mode,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorMessage = resp.status === 429
          ? t("coach.errors.rateLimit")
          : resp.status === 402
            ? t("coach.errors.credits")
            : t("coach.errors.generic");
        throw new Error(errorMessage);
      }

      await readCoachStream(resp.body, upsertAssistant, request.signal);
      if (!current()) return;
      if (!assistantSoFar.trim()) throw new Error(t("coach.errors.generic"));
      try {
        await persistConversation([...allMessages, { role: "assistant", content: assistantSoFar }], request);
      } catch {
        if (current()) setSaveError("Your reply is visible but could not be saved to your account.");
      }
    } catch (error) {
      if (current()) {
        setMessages(messages);
        setInput(msg);
        setSaveError(error instanceof Error && error.message ? error.message : t("coach.errors.connection"));
      }
    } finally {
      if (current()) {
        setIsLoading(false);
        requestScope.current.finish(request);
      }
    }
  };

  if (quotaLoading || quotaError) {
    return <div className="min-h-screen bg-background"><AppHeader />
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        {quotaError ? <><h1 className="text-xl font-semibold">Coaching access could not be verified</h1>
          <p role="alert" className="my-4 text-sm text-muted-foreground">Retry the access check before opening your private conversation.</p>
          <Button onClick={() => void refreshQuota()} className="min-h-11">{t("common.retry")}</Button></>
          : <p role="status" className="text-sm text-muted-foreground">Checking your coaching access…</p>}
      </main></div>;
  }

  if (canUseCoaching && (curriculumLoading || curriculumError)) {
    return <div className="min-h-screen bg-background"><AppHeader /><main className="mx-auto max-w-md px-6 py-20 text-center">
      {curriculumError ? <><h1 className="text-xl font-semibold">Your curriculum could not be verified</h1><p role="alert" className="my-4 text-sm text-muted-foreground">Retry before opening your private tutor.</p><Button onClick={retryCurriculum} className="min-h-11">{t("common.retry")}</Button></> : <p role="status">Checking your curriculum…</p>}
    </main></div>;
  }
  if (!quotaLoading && !canUseCoaching) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <PageTransition>
          <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
              <MascotAvatar mascot={coach} className="h-full w-full" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">{t("coach.premiumTitle")}</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              {t("coach.premiumDesc")}
            </p>
            <Button onClick={() => navigate("/pricing")} className="gap-2 rounded-xl">
              <CreditCard className="h-4 w-4" /> {t("coach.viewPlans")}
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
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 pb-28 pt-4 sm:px-6 md:pb-12 md:pt-7">
          <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6" aria-labelledby="coach-workspace-title">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10"><MascotAvatar mascot={coach} decorative className="h-full w-full" /></div>
              <div className="min-w-0">
                <h1 id="coach-workspace-title" className="stem-heading text-xl font-bold sm:text-2xl">{t("coach.workspace.title")}</h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("coach.workspace.description")}</p>
              </div>
            </div>
          </section>
          {/* Subject selector with mascot avatars */}
          <div className="rounded-2xl border bg-card p-3 sm:p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">{t("coach.tutorLabel")}</p>
            <div className="flex flex-wrap items-center gap-2">
            {SUBJECT_IDS.map(id => {
              const m = getMascot(id);
              const isActive = subjectId === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    manuallySelectedTutor.current = true;
                    if (id !== subjectId) {
                      requestScope.current.cancel();
                      setMessages([]);
                      setInput("");
                      setLoadedSubject(null);
                      setSubjectId(id);
                    }
                    void setPreferredCoachId(id as Parameters<typeof setPreferredCoachId>[0]).then(({ error }) => {
                      if (error) setSaveError("Your tutor selection is active for this session, but your preference could not be saved.");
                    });
                  }}
                  disabled={busy}
                  aria-pressed={isActive}
                  className={`flex min-h-11 max-w-full items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MascotAvatar mascot={m} decorative className="h-6 w-6" />
                  {m.name}
                </button>
              );
            })}
            {curriculum && (
              <span className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                <GraduationCap className="h-3.5 w-3.5" /> {curriculum.label}
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                disabled={busy || !threadReady}
                className="flex min-h-11 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("common.clear")}
              </button>
            )}
            </div>
          </div>

          <fieldset className="min-w-0 rounded-2xl border bg-card p-3 sm:p-4">
            <legend className="px-2 text-sm font-semibold">{t("coach.workspace.modeLabel")}</legend>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {COACH_MODES.map(value => (
                <label key={value} className={`relative flex min-h-16 cursor-pointer flex-col rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring ${mode === value ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/40"} ${busy ? "cursor-default opacity-70" : ""}`}>
                  <input type="radio" name="coach-mode" className="sr-only" value={value} checked={mode === value} onChange={() => setMode(value)} disabled={busy} />
                  <span className="text-sm font-semibold">{t(`coach.workspace.modes.${value}.label`)}</span>
                  <span className="mt-1 text-xs leading-snug text-muted-foreground">{t(`coach.workspace.modes.${value}.description`)}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("coach.workspace.modeNotice")}</p>
          </fieldset>

          {activeTutorial && (
            <div className="mb-3 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center">
              <BookOpen className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("coach.tutorialContext")}</p>
                <p className="truncate text-sm font-semibold">{activeTutorial.title}</p>
              </div>
              <Button size="sm" variant="outline" disabled={busy || !threadReady} onClick={() => send(t("coach.tutorialPrompt", { title: activeTutorial.title }))}>
                {t("coach.workThroughLesson")}
              </Button>
            </div>
          )}

          {threadError && <div role="alert" className="mb-3 rounded-xl border border-destructive/30 p-3 text-sm">{threadError} <Button variant="outline" size="sm" onClick={() => setRetry(n => n + 1)}>{t("common.retry")}</Button></div>}
          {saveError && <p role="alert" className="mb-3 rounded-xl border border-destructive/30 p-3 text-sm">{saveError}</p>}
          {conversationLoading && <p role="status" className="mb-3 text-sm text-muted-foreground">Loading your private conversation…</p>}
          {/* Chat area */}
          <div ref={scrollRef} role="log" aria-label={t("coach.workspace.conversation")} aria-live="polite" aria-relevant="additions" className="min-h-[320px] flex-1 space-y-4 overflow-y-auto rounded-2xl border bg-card p-3 shadow-sm sm:min-h-[400px] sm:p-5" style={{ maxHeight: "min(65dvh, 760px)" }}>
            <AnimatePresence mode="wait">
              {messages.length === 0 && threadReady && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-lg">
                    <MascotAvatar mascot={mascot} decorative className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-semibold">{mascot.name}</h3>
                  <p className="mt-1 text-xs italic text-muted-foreground">“{t("coach.readyToHelp")}”</p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {curriculum
                      ? t("coach.introWithCurriculum", { subject: subjectLabel, curriculum: curriculum.label })
                      : t("coach.intro", { subject: subjectLabel })}
                  </p>
                  {user && <p className="mt-2 max-w-md text-xs text-primary/80">{t("coach.personalised")}</p>}

                  {/* Quick prompts */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {quickPrompts.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        disabled={busy || !threadReady}
                        className="flex min-h-11 items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                      >
                        <Sparkles className="h-3 w-3 text-primary/50" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loadedSubject === subjectId && messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                    <MascotAvatar mascot={mascot} decorative className="h-full w-full" />
                  </div>
                )}
                <div
                  className={`min-w-0 max-w-[calc(100%-2.5rem)] break-words [overflow-wrap:anywhere] rounded-2xl px-3 py-2.5 text-sm sm:max-w-[85%] sm:px-4 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted prose prose-sm dark:prose-invert prose-pre:max-w-full prose-pre:overflow-x-auto prose-table:block prose-table:overflow-x-auto"
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
                  <MascotAvatar mascot={mascot} decorative className="h-full w-full" />
                </div>
                <div className="rounded-xl bg-muted px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => navigate("/qa-clinic?subject=" + encodeURIComponent(subjectId) + (activeTutorial ? "&topic=" + encodeURIComponent(activeTutorial.id) : ""))}>
              <BookOpen className="h-4 w-4" /> {t("qa.explore")}
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => navigate(`/practice/${subjectId}`)}>
              <GraduationCap className="h-4 w-4" /> {t("coach.practiseSubject", { subject: subjectLabel })}
            </Button>
            {user && (
              <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => navigate("/weak-drills")}>
                <Target className="h-4 w-4" /> {t("coach.openWeakDrill")}
              </Button>
            )}
          </div>

          {/* Input */}
          <div className="rounded-2xl border bg-card p-3 shadow-sm">
            <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
              placeholder={t("coach.inputPlaceholder", { name: mascot.name, subject: subjectLabel })}
              className="min-h-12 min-w-0 flex-1 resize-y rounded-xl border bg-background px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:text-sm"
              aria-label={t("coach.inputPlaceholder", { name: mascot.name, subject: subjectLabel })}
              maxLength={2000}
              disabled={busy || !threadReady}
            />
            <Button onClick={() => send()} disabled={busy || !threadReady || !input.trim()} className="min-h-12 min-w-12 rounded-xl" aria-label={t("coach.send")}>
              <Send className="h-4 w-4" />
            </Button>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{t("coach.workspace.answerNotice")}</span><span>{input.length}/2000</span></div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
