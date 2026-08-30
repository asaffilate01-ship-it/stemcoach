import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CheckCircle2, Clock, Cloud, Loader2, MessageCircle, PlayCircle, Search } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tutorials } from "@/data/tutorials";
import { getMascot } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { normalizeLanguage } from "@/i18n/language";
import { supabase } from "@/integrations/supabase/client";

const COMPLETED_KEY = "stemcoach:tutorials-completed";
const LAST_OPENED_KEY = "stemcoach:tutorials-last-opened";
const tutorialIds = new Set(tutorials.map((tutorial) => tutorial.id));

function readLocalCompleted(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && tutorialIds.has(item))
      : [];
  } catch {
    return [];
  }
}

function readLocalLastOpened(): string | null {
  try {
    const value = localStorage.getItem(LAST_OPENED_KEY);
    return value && tutorialIds.has(value) ? value : null;
  } catch {
    return null;
  }
}

export default function Tutorials() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("tutorials.documentTitle"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const requestedTutorial = tutorials.find((tutorial) => tutorial.id === searchParams.get("tutorial"));
  const [subject, setSubject] = useState(requestedTutorial?.subject || "all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(requestedTutorial?.id || null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<string[]>(readLocalCompleted);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(requestedTutorial?.id || readLocalLastOpened());
  const [syncing, setSyncing] = useState(Boolean(user));
  const [accountProgressReady, setAccountProgressReady] = useState(false);
  const openedFromLinkRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setCompleted(readLocalCompleted());
      setLastOpenedId(requestedTutorial?.id || readLocalLastOpened());
      setSyncing(false);
      setAccountProgressReady(false);
      return () => { active = false; };
    }

    const loadAccountProgress = async () => {
      setSyncing(true);
      const localCompleted = readLocalCompleted();
      let localSyncError = false;
      if (localCompleted.length > 0) {
        const { error } = await supabase.rpc("sync_tutorial_completions", { _tutorial_ids: localCompleted });
        localSyncError = Boolean(error);
      }

      const { data, error } = await supabase
        .from("user_tutorial_progress")
        .select("tutorial_id, last_opened_at, completed_at")
        .order("last_opened_at", { ascending: false });

      if (!active) return;
      if (error || localSyncError) {
        toast({ title: t("tutorials.syncFailed"), variant: "destructive" });
      }
      if (!error) {
        const validRows = (data || []).filter((row) => tutorialIds.has(row.tutorial_id));
        const remoteCompleted = validRows.filter((row) => row.completed_at).map((row) => row.tutorial_id);
        setCompleted([...new Set([...remoteCompleted, ...(localSyncError ? localCompleted : [])])]);
        const recentIncomplete = validRows.find((row) => !row.completed_at);
        setLastOpenedId(requestedTutorial?.id || recentIncomplete?.tutorial_id || readLocalLastOpened());
      }
      setAccountProgressReady(!error && !localSyncError);
      setSyncing(false);
    };

    void loadAccountProgress();
    return () => { active = false; };
  }, [requestedTutorial?.id, t, toast, user]);

  const tutorialSubjects = useMemo(() => [...new Set(tutorials.map((tutorial) => tutorial.subject))], []);
  const filtered = useMemo(() => tutorials.filter((tutorial) =>
    (subject === "all" || tutorial.subject === subject) &&
    `${tutorial.title} ${tutorial.summary}`.toLowerCase().includes(search.toLowerCase()),
  ), [search, subject]);
  const continueTutorial = tutorials.find((tutorial) => tutorial.id === lastOpenedId && !completed.includes(tutorial.id));

  const saveProgress = useCallback(async (tutorialId: string, isComplete: boolean) => {
    if (user) {
      const { error } = await supabase.rpc("save_tutorial_progress", {
        _tutorial_id: tutorialId,
        _completed: isComplete,
      });
      if (error) {
        toast({ title: t("tutorials.saveFailed"), description: error.message, variant: "destructive" });
        return false;
      }
      setAccountProgressReady(true);
      return true;
    }

    try {
      localStorage.setItem(LAST_OPENED_KEY, tutorialId);
      if (isComplete) {
        const nextCompleted = [...new Set([...readLocalCompleted(), tutorialId])];
        localStorage.setItem(COMPLETED_KEY, JSON.stringify(nextCompleted));
      }
      return true;
    } catch {
      toast({ title: t("tutorials.saveFailed"), variant: "destructive" });
      return false;
    }
  }, [t, toast, user]);

  useEffect(() => {
    if (!requestedTutorial || authLoading) return;
    const progressKey = `${user?.id || "device"}:${requestedTutorial.id}`;
    if (openedFromLinkRef.current === progressKey) return;
    openedFromLinkRef.current = progressKey;
    setSubject(requestedTutorial.subject);
    setSearch("");
    setOpenId(requestedTutorial.id);
    setLastOpenedId(requestedTutorial.id);
    void saveProgress(requestedTutorial.id, false);
    window.setTimeout(() => document.getElementById(`tutorial-${requestedTutorial.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }, [authLoading, requestedTutorial, saveProgress, user?.id]);

  const toggleTutorial = (tutorialId: string) => {
    if (openId === tutorialId) {
      setOpenId(null);
      return;
    }
    setOpenId(tutorialId);
    setLastOpenedId(tutorialId);
    try { localStorage.setItem(LAST_OPENED_KEY, tutorialId); } catch { /* storage unavailable */ }
    void saveProgress(tutorialId, false);
  };

  const resumeTutorial = (tutorialId: string, tutorialSubject: string) => {
    setSubject(tutorialSubject);
    setSearch("");
    setOpenId(tutorialId);
    setLastOpenedId(tutorialId);
    void saveProgress(tutorialId, false);
    window.setTimeout(() => document.getElementById(`tutorial-${tutorialId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const answerCheckpoint = async (
    tutorialId: string,
    checkpointIndex: number,
    option: string,
    checkpoints: Array<{ answer: string }>,
  ) => {
    const answerKey = `${tutorialId}:${checkpointIndex}`;
    const nextAnswers = { ...answers, [answerKey]: option };
    setAnswers(nextAnswers);
    const allCorrect = checkpoints.every((item, index) => nextAnswers[`${tutorialId}:${index}`] === item.answer);
    if (!allCorrect || completed.includes(tutorialId)) return;

    if (await saveProgress(tutorialId, true)) {
      setCompleted((current) => [...new Set([...current, tutorialId])]);
      if (lastOpenedId === tutorialId) setLastOpenedId(null);
      toast({ title: t("tutorials.completed") });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <p className="stem-label mb-1">{t("tutorials.label")}</p>
          <h1 className="stem-heading text-3xl">{t("tutorials.title")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("tutorials.description")}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : user && accountProgressReady ? <Cloud className="h-4 w-4" /> : null}
            {t(user && accountProgressReady ? "tutorials.progressAccount" : "tutorials.progressDevice", { completed: completed.length, total: tutorials.length })}
          </p>
          {normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== "en" && (
            <p className="mt-2 max-w-2xl text-xs text-muted-foreground">{t("tutorials.contentLanguageNotice")}</p>
          )}
        </div>

        {continueTutorial && (
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <img src={getMascot(continueTutorial.subject).image} alt="" className="h-14 w-14 rounded-xl bg-background object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("tutorials.continueLabel")}</p>
              <h2 className="truncate font-bold">{continueTutorial.title}</h2>
              <p className="text-xs text-muted-foreground">{t(`subjects.names.${continueTutorial.subject}`)} · {t("tutorials.minutes", { count: continueTutorial.minutes })}</p>
            </div>
            <Button className="gap-2" onClick={() => resumeTutorial(continueTutorial.id, continueTutorial.subject)}>
              <PlayCircle className="h-4 w-4" /> {t("tutorials.resume")}
            </Button>
          </section>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("tutorials.search")} className="pl-9" />
          </div>
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="all">{t("tutorials.allSubjects")}</option>
            {tutorialSubjects.map((id) => <option key={id} value={id}>{t(`subjects.names.${id}`)}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {filtered.map((tutorial) => {
            const mascot = getMascot(tutorial.subject);
            const open = openId === tutorial.id;
            const checkpoints = [tutorial.checkpoint, ...(tutorial.practice || [])];
            const isComplete = completed.includes(tutorial.id);
            return (
              <article id={`tutorial-${tutorial.id}`} key={tutorial.id} className="scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-sm">
                <button onClick={() => toggleTutorial(tutorial.id)} className="flex w-full items-center gap-4 p-5 text-left" aria-expanded={open}>
                  <img src={mascot.image} alt="" className="h-14 w-14 rounded-xl bg-muted object-contain" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t(`subjects.names.${tutorial.subject}`)} · {t(`tutorials.levels.${tutorial.level.toLowerCase()}`)}</p>
                    <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">{tutorial.title}{isComplete && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{tutorial.summary}</p>
                  </div>
                  <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Clock className="h-4 w-4" />{t("tutorials.minutes", { count: tutorial.minutes })}</span>
                </button>

                {open && (
                  <div className="space-y-6 border-t px-5 py-6">
                    <section>
                      <h3 className="mb-2 font-semibold">{t("tutorials.objectives")}</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {tutorial.objectives.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                      </ul>
                    </section>
                    <section>
                      <h3 className="mb-2 font-semibold">{t("tutorials.lesson")}</h3>
                      <div className="space-y-2 text-sm leading-6 text-muted-foreground">{tutorial.lesson.map((item) => <p key={item}>{item}</p>)}</div>
                    </section>
                    <section className="rounded-xl bg-primary/5 p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-primary" />{t("tutorials.workedExample")}</h3>
                      <p className="text-sm leading-6">{tutorial.workedExample}</p>
                    </section>
                    <Button variant="outline" className="gap-2" onClick={() => navigate(`/ai-tutor?subject=${encodeURIComponent(tutorial.subject)}&tutorial=${encodeURIComponent(tutorial.id)}`)}>
                      <img src={mascot.image} alt="" className="h-6 w-6 rounded-lg object-cover" /><MessageCircle className="h-4 w-4" />{t("tutorials.askCoach", { name: mascot.name })}
                    </Button>
                    <section>
                      <h3 className="mb-3 font-semibold">{t("tutorials.knowledgeChecks")}</h3>
                      <div className="space-y-5">
                        {checkpoints.map((checkpoint, checkpointIndex) => {
                          const answerKey = `${tutorial.id}:${checkpointIndex}`;
                          const checkpointChoice = answers[answerKey];
                          return (
                            <div key={answerKey} className="rounded-xl border border-border/50 p-4">
                              <p className="mb-3 text-sm font-medium">{checkpointIndex + 1}. {checkpoint.question}</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {checkpoint.options.map((option) => (
                                  <Button key={option} variant={checkpointChoice === option ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => void answerCheckpoint(tutorial.id, checkpointIndex, option, checkpoints)}>{option}</Button>
                                ))}
                              </div>
                              {checkpointChoice && <p className={`mt-3 rounded-lg p-3 text-sm ${checkpointChoice === checkpoint.answer ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300"}`}>{checkpointChoice === checkpoint.answer ? t("tutorials.correct") : t("tutorials.notQuite", { answer: checkpoint.answer })}{checkpoint.explanation}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
