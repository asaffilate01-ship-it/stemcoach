import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bookmark, BookOpen, Brain, CalendarDays, CircleHelp, Clock3, Flag, Flame, GraduationCap, Layers, Search, Sparkles, Target, Trophy, Trash2 } from "lucide-react";
import { contentReportHref } from "@/lib/contentReport";
import { SPRINT_SIZES, parseSprintSize, sprintDurationSeconds, sprintQuestionCount, effectiveSprintDurationSeconds, type SprintSize } from "@/lib/qaSprints";
import { buildQAWeeklyPlan } from "@/lib/qaWeeklyPlan";
import { buildTopicRevisionInsights } from "@/lib/qaTopicInsights";
import { summariseSprint, sprintAcceptsAttempt, selectSprintRetryIds } from "@/lib/qaSprintResults";
import { qaStorageKeys, REVIEW_FOCUSES, matchesReviewFocus, getReviewFocusCounts, parseReviewFocus, type ReviewFocus } from "@/lib/qaReviewFocus";
import { useAuth } from "@/hooks/useAuth";
import { parseReviewHistory, serialiseReviewHistory, parseBookmarks, serialiseBookmarks, recordReviewAttempt, buildReviewQueue, getReviewSummary, type ReviewHistory } from "@/lib/qaPractice";
import { AppHeader } from "@/components/layout/AppHeader";
import { QuestionInteraction } from "@/components/qa/QuestionInteraction";
import { OmniqoraEvidencePanel } from "@/components/qa/OmniqoraEvidencePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { qaEntries as allQAEntries, type QAEntry } from "@/data/qaClinic";
import { tutorials as allTutorials } from "@/data/tutorials";
import type { TutorialQuestionFormat } from "@/data/tutorials";
import { launchSubjects as subjects, isLaunchSubject } from "@/lib/launchDiscovery";
import { getMascot } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { normalizeLanguage } from "@/i18n/language";
import { studySpeechLanguage } from "@/lib/subjectLanguage";

const qaEntries = allQAEntries.filter(entry => isLaunchSubject(entry.subject));
const tutorials = allTutorials.filter(item => isLaunchSubject(item.subject));

const questionFormats: TutorialQuestionFormat[] = [
  "single", "multiple", "true-false", "numeric", "short-text", "ordering", "matching", "fill-blanks", "diagram-label",
];
const PAGE_SIZE = 16;

type ChallengeMode = "mixed" | "adaptive" | "timed";
const existingQuestionIds = new Set(allQAEntries.map((entry) => entry.id));
const launchQuestionIds = new Set(qaEntries.map((entry) => entry.id));

export default function QAClinic() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p role="status" className="text-sm text-muted-foreground">{t("qa.scopeLoading")}</p>
      </main>
    </div>
  );
  // Remount synchronously when the active identity changes so local history,
  // bookmarks and in-progress sprint state cannot follow another account.
  return <QAWorkspace key={JSON.stringify(user?.id ?? null)} accountId={user?.id ?? null} />;
}

function QAWorkspace({ accountId }: { accountId: string | null }) {
  const { t, i18n } = useTranslation();
  const { history: historyKey, bookmarks: bookmarksKey } = qaStorageKeys(accountId);
  useDocumentTitle(t("qa.title"));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedTopic = tutorials.find((item) => item.id === searchParams.get("topic"));
  const requestedSubject = searchParams.get("subject");
  const [subject, setSubject] = useState(
    linkedTopic?.subject || (requestedSubject && subjects.some((item) => item.id === requestedSubject) ? requestedSubject : "all"),
  );
  const [topic, setTopic] = useState(linkedTopic?.id || "all");
  const [format, setFormat] = useState("all");
  const [level, setLevel] = useState("all");
  const reviewFilter = parseReviewFocus(searchParams.get("review"));
  const [retainedReviewIds, setRetainedReviewIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [reviewTime, setReviewTime] = useState(() => Date.now());
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [question, setQuestion] = useState("");
  const [askSubject, setAskSubject] = useState("mathematics");
  const [challengeIds, setChallengeIds] = useState<string[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [firstAttempts, setFirstAttempts] = useState<Record<string, boolean>>({});
  const [mastered, setMastered] = useState<Record<string, boolean>>({});
  const [challengeStreak, setChallengeStreak] = useState(0);
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>("mixed");
  const [sprintSize, setSprintSize] = useState<SprintSize>(10);
  const [challengeRound, setChallengeRound] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(sprintDurationSeconds(10));
  const challengeHeading = useRef<HTMLHeadingElement>(null);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try { return parseBookmarks(localStorage.getItem(bookmarksKey), existingQuestionIds); }
    catch { return []; }
  });
  const [history, setHistory] = useState<ReviewHistory>(() => {
    try { return parseReviewHistory(localStorage.getItem(historyKey), existingQuestionIds); }
    catch { return {}; }
  });

  useEffect(() => {
    const refresh = () => setReviewTime(Date.now());
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    try {
      if (savedIds.length) localStorage.setItem(bookmarksKey, serialiseBookmarks(savedIds));
      else localStorage.removeItem(bookmarksKey);
    } catch { /* Storage is optional; the current session remains functional. */ }
  }, [savedIds, bookmarksKey]);

  useEffect(() => {
    try {
      if (Object.keys(history).length) localStorage.setItem(historyKey, serialiseReviewHistory(history));
      else localStorage.removeItem(historyKey);
    } catch { /* Private browsing or full storage: keep the in-memory session working. */ }
  }, [history, historyKey]);

  useEffect(() => {
    if (challengeMode !== "timed" || deadline === null || challengeIds.length === 0 ||
        challengeIndex >= challengeIds.length) return;
    const tick = () => setSecondsRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const interval = window.setInterval(() => {
      tick();
      if (Date.now() >= deadline) window.clearInterval(interval);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [challengeMode, deadline, challengeIds.length, challengeIndex]);

  // Only authored, known lesson IDs may be used as deep-linked topic presets.
  // A browser history navigation updates the visible filters as well.
  useEffect(() => {
    const selected = tutorials.find((item) => item.id === searchParams.get("topic"));
    const requested = searchParams.get("subject");
    setSubject(selected?.subject || (requested && subjects.some((item) => item.id === requested) ? requested : "all"));
    setTopic(selected?.id || "all");
    setRetainedReviewIds([]);
    setChallengeIds([]);
    setChallengeIndex(0);
    setDeadline(null);
    setDisplayLimit(PAGE_SIZE);
  }, [searchParams]);

  const availableTopics = useMemo(
    () => tutorials.filter((item) => subject === "all" || item.subject === subject),
    [subject],
  );

  // The focus counters reflect the current subject/topic/format/level/search,
  // not the selected focus itself. Selecting "Due" does not hide other counts.
  const scopedEntries = useMemo(() => {
    const phrase = search.trim().toLocaleLowerCase();
    return qaEntries.filter((entry) =>
      (subject === "all" || entry.subject === subject) &&
      (topic === "all" || entry.tutorialId === topic) &&
      (format === "all" || entry.format === format) &&
      (level === "all" || entry.level === level) &&
      (!phrase || [entry.question, entry.topic, entry.explanation, entry.subject, entry.hint]
        .some((text) => text.toLocaleLowerCase().includes(phrase))),
    );
  }, [subject, topic, format, level, search]);
  const reviewContext = useMemo(() => ({ history, saved: new Set(savedIds), now: reviewTime }), [history, savedIds, reviewTime]);
  const focusCounts = useMemo(() => getReviewFocusCounts(scopedEntries, reviewContext), [scopedEntries, reviewContext]);
  const filtered = useMemo(() => scopedEntries.filter(entry => matchesReviewFocus(entry.id, reviewFilter, reviewContext)),
    [scopedEntries, reviewFilter, reviewContext]);

  // A newly answered question may leave the live New/Due filter. Keep its
  // visible card so the learner can read the feedback and worked solution.
  // Retained cards never become eligible for a fresh filtered sprint.
  const browseEntries = useMemo(() => {
    if (!retainedReviewIds.length) return filtered;
    const displayIds = new Set([...filtered.map(entry => entry.id), ...retainedReviewIds]);
    return scopedEntries.filter(entry => displayIds.has(entry.id));
  }, [filtered, retainedReviewIds, scopedEntries]);
  const hasRetainedReviews = browseEntries.length > filtered.length;

  const activeChallenge = challengeIds.length > 0;
  const challengeCompleted = activeChallenge && (challengeIndex >= challengeIds.length ||
    (challengeMode === "timed" && secondsRemaining === 0));
  useEffect(() => {
    if (!activeChallenge) return;
    const frame = window.requestAnimationFrame(() => challengeHeading.current?.focus({ preventScroll: false }));
    return () => window.cancelAnimationFrame(frame);
  }, [activeChallenge, challengeIndex, challengeCompleted, challengeRound]);
  const challengeEntry = activeChallenge && !challengeCompleted
    ? qaEntries.find((entry) => entry.id === challengeIds[challengeIndex])
    : null;
  const visibleEntries = activeChallenge ? (challengeEntry ? [challengeEntry] : []) : browseEntries.slice(0, displayLimit);
  const sprintResult = useMemo(() => summariseSprint(challengeIds, firstAttempts), [challengeIds, firstAttempts]);
  const missedRetryIds = useMemo(() => selectSprintRetryIds(challengeIds, firstAttempts, "missed"), [challengeIds, firstAttempts]);
  const unansweredRetryIds = useMemo(() => selectSprintRetryIds(challengeIds, firstAttempts, "unattempted"), [challengeIds, firstAttempts]);
  const attemptedCount = sprintResult.attempted;
  const firstTryCorrect = sprintResult.correct;
  const sprintInProgress = activeChallenge && !challengeCompleted;
  const masteredCount = challengeIds.filter((id) => mastered[id] === true).length;
  const reviewSummary = useMemo(() => getReviewSummary(filtered, history, reviewTime), [filtered, history, reviewTime]);
  const weeklyPlan = useMemo(() => buildQAWeeklyPlan(filtered, history, reviewTime), [filtered, history, reviewTime]);
  const topicInsights = useMemo(() => buildTopicRevisionInsights(filtered, history, reviewTime), [filtered, history, reviewTime]);
  const selectedCount = sprintQuestionCount(filtered.length, sprintSize);
  const timedMinutes = effectiveSprintDurationSeconds(filtered.length, sprintSize) / 60;

  const launchChallenge = (selected: string[], kind: ChallengeMode) => {
    if (sprintInProgress || selected.length === 0) return;
    const ids = [...new Set(selected)].filter(id => launchQuestionIds.has(id)).slice(0, 20);
    if (!ids.length) return;
    setChallengeIds(ids);
    setChallengeIndex(0);
    setFirstAttempts({});
    setMastered({});
    setChallengeStreak(0);
    setChallengeMode(kind);
    setChallengeRound((round) => round + 1);
    const sprintSeconds = effectiveSprintDurationSeconds(ids.length, sprintSize);
    setSecondsRemaining(sprintSeconds);
    setDeadline(kind === "timed" ? Date.now() + sprintSeconds * 1000 : null);

  };

  const startChallenge = (kind: ChallengeMode = "mixed") => {
    const selected = buildReviewQueue(filtered, history, sprintSize,
      kind === "adaptive" ? "adaptive" : "mixed").map((entry) => entry.id);
    launchChallenge(selected, kind);
  };

  const startPlannedSet = (ids: readonly string[]) => {
    const allowed = new Set(filtered.map((entry) => entry.id));
    launchChallenge(ids.filter((id) => allowed.has(id)), "adaptive");
  };

  const exitChallenge = () => {
    setChallengeIds([]);
    setChallengeIndex(0);
    setDeadline(null);
    setFirstAttempts({});
    setMastered({});
    setChallengeStreak(0);
    window.requestAnimationFrame(() => document.getElementById("qa-library")?.focus());
  };

  const toggleSaved = (id: string) =>
    setSavedIds((previous) => previous.includes(id)
      ? previous.filter((entry) => entry !== id)
      : [...previous, id].slice(-500));

  const changeFilter = (change: () => void) => {
    setRetainedReviewIds([]);
    setChallengeIds([]);
    setChallengeIndex(0);
    setDeadline(null);
    setDisplayLimit(PAGE_SIZE);
    change();
  };

  const chooseSubject = (nextSubject: string) => {
    changeFilter(() => { setSubject(nextSubject); setTopic("all"); });
    const params = new URLSearchParams(searchParams);
    params.delete("topic");
    if (nextSubject === "all") params.delete("subject");
    else params.set("subject", nextSubject);
    setSearchParams(params, { replace: true });
  };

  const chooseTopic = (nextTopic: string) => {
    const selected = tutorials.find((item) => item.id === nextTopic);
    changeFilter(() => {
      setTopic(selected?.id || "all");
      if (selected) setSubject(selected.subject);
    });
    const params = new URLSearchParams(searchParams);
    if (selected) {
      params.set("topic", selected.id);
      params.set("subject", selected.subject);
    } else params.delete("topic");
    setSearchParams(params, { replace: true });
  };

  const chooseReviewFocus = (value: ReviewFocus) => {
    changeFilter(() => {
      const next = parseReviewFocus(value);
      const params = new URLSearchParams(searchParams);
      if (next === "all") params.delete("review");
      else params.set("review", next);
      setSearchParams(params, { replace: true });
    });
  };

  const clearAllFilters = () => {
    changeFilter(() => {
      setSubject("all"); setTopic("all"); setFormat("all");
      setLevel("all"); setSearch("");
    });
    const params = new URLSearchParams(searchParams);
    params.delete("topic");
    params.delete("subject");
    params.delete("review");
    setSearchParams(params, { replace: true });
  };

  const recordAttempt = (id: string, correct: boolean, firstAttempt: boolean) => {
    const now = Date.now();
    // A timer callback may run late when a tab is backgrounded. Reject late
    // attempts synchronously so neither sprint score nor review history changes.
    if (activeChallenge && !sprintAcceptsAttempt({ id, activeId: challengeIds[challengeIndex], deadline, now })) {
      if (deadline !== null && now >= deadline) setSecondsRemaining(0);
      return;
    }
    if (!activeChallenge && firstAttempt && (reviewFilter === "new" || reviewFilter === "due")) {
      setRetainedReviewIds(previous => previous.includes(id) ? previous : [...previous, id]);
    }
    setReviewTime(now);
    setHistory((previous) => recordReviewAttempt(previous, id, correct, firstAttempt, now));
    if (correct) setMastered((previous) => ({ ...previous, [id]: true }));
    if (activeChallenge && firstAttempt) {
      setFirstAttempts((previous) => Object.prototype.hasOwnProperty.call(previous, id) ? previous : { ...previous, [id]: correct });
      setChallengeStreak((previous) => correct ? previous + 1 : 0);
    }
  };

  const openCoach = (entry?: QAEntry) => {
    const requestedSubject = entry?.subject || askSubject;
    const prompt = entry ? t("qa.followUpPrompt", { question: entry.question }) : question.trim().slice(0, 2000);
    if (!prompt) return;
    const link = "/ai-tutor?subject=" + encodeURIComponent(requestedSubject)
      + (entry ? "&tutorial=" + encodeURIComponent(entry.tutorialId) : "");
    // The question is a draft in navigation state. It is not submitted or saved in a public URL.
    navigate(link, { state: { qaDraft: prompt } });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-6xl px-4 pb-28 pt-7 md:pt-10">
        <section className="mb-7 rounded-3xl border bg-card p-6 shadow-sm md:p-9">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CircleHelp className="h-4 w-4" /> {t("qa.eyebrow")}
          </div>
          <h1 className="stem-heading text-3xl font-bold md:text-4xl">{t("qa.title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{t("qa.intro")}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
            <span className="rounded-xl bg-muted px-3 py-2">{t("qa.questionCount", { count: qaEntries.length })}</span>
            <span className="rounded-xl bg-muted px-3 py-2">{t("qa.subjectCount", { count: subjects.length })}</span>
            <span className="rounded-xl bg-muted px-3 py-2">{t("qa.formatCount", { count: questionFormats.length })}</span>
          </div>
          {normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== "en" && (
            <p className="mt-3 text-xs text-muted-foreground">{t("qa.contentLanguageNotice")}</p>
          )}
        </section>

        <nav aria-label={t("qa.workspaceNavigation")} className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a href="#qa-library" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-card px-3 py-2 text-center text-sm font-semibold hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"><BookOpen className="h-4 w-4 shrink-0 text-primary" /> {t("qa.libraryTitle")}</a>
          <a href="#qa-revision" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-card px-3 py-2 text-center text-sm font-semibold hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"><Target className="h-4 w-4 shrink-0 text-primary" /> {t("qa.reviewTitle")}</a>
          <a href="#qa-your-question" className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-card px-3 py-2 text-center text-sm font-semibold hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring sm:col-span-1"><Sparkles className="h-4 w-4 shrink-0 text-primary" /> {t("qa.askTitle")}</a>
        </nav>
        <section aria-labelledby="qa-your-question" className="mb-8 rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h2 id="qa-your-question" className="scroll-mt-28 text-lg font-semibold">{t("qa.askTitle")}</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{t("qa.askDescription")}</p>
          <div className="grid gap-3 md:grid-cols-[210px_1fr]">
            <div>
              <label htmlFor="qa-ask-subject" className="mb-1 block text-xs font-semibold">{t("qa.subject")}</label>
              <select id="qa-ask-subject" value={askSubject} onChange={(event) => setAskSubject(event.target.value)}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                {subjects.map((item) => <option key={item.id} value={item.id}>{t(`subjects.names.${item.id}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-own-question" className="mb-1 block text-xs font-semibold">{t("qa.yourQuestion")}</label>
              <Textarea id="qa-own-question" maxLength={2000} rows={3} value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={t("qa.questionPlaceholder")} className="rounded-xl" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{t("qa.askNote")}</p>
            <Button className="gap-2 rounded-xl" disabled={!question.trim()} onClick={() => openCoach()}>
              {t("qa.askCoach")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <section aria-labelledby="qa-library">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 id="qa-library" tabIndex={-1} className="scroll-mt-28 flex items-center gap-2 text-xl font-bold focus-visible:ring-2 focus-visible:ring-ring">
                <Layers className="h-5 w-5 text-primary" /> {t("qa.libraryTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("qa.libraryDescription")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span role="status" className="text-sm text-muted-foreground">{t("qa.results", { count: filtered.length })}</span>
              <Button type="button" variant="outline" disabled={sprintInProgress || (subject === "all" && topic === "all" && format === "all" && level === "all" && reviewFilter === "all" && !search)}
                onClick={clearAllFilters}>
                {t("qa.clearFilters")}
              </Button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="qa-subject-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterSubject")}</label>
              <select id="qa-subject-filter" disabled={sprintInProgress} value={subject} onChange={(event) => chooseSubject(event.target.value)}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allSubjects")}</option>
                {subjects.map((item) => <option key={item.id} value={item.id}>{t(`subjects.names.${item.id}`)}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="qa-topic-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterTopic")}</label>
              <select id="qa-topic-filter" disabled={sprintInProgress} value={topic} onChange={(event) => chooseTopic(event.target.value)}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allTopics")}</option>
                {availableTopics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-format-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterFormat")}</label>
              <select id="qa-format-filter" disabled={sprintInProgress} value={format} onChange={(event) => changeFilter(() => setFormat(event.target.value))}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allFormats")}</option>
                {questionFormats.map((item) => <option key={item} value={item}>{t(`qa.formats.${item}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-level-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterLevel")}</label>
              <select id="qa-level-filter" disabled={sprintInProgress} value={level} onChange={(event) => changeFilter(() => setLevel(event.target.value))}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allLevels")}</option>
                {["Foundation", "Intermediate", "Advanced"].map((item) =>
                  <option key={item} value={item}>{t(`tutorials.levels.${item.toLowerCase()}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-review-filter" className="mb-1 block text-xs font-semibold">{t("qa.reviewFilterLabel")}</label>
              <select id="qa-review-filter" disabled={sprintInProgress} value={reviewFilter}
                onChange={(event) => chooseReviewFocus(parseReviewFocus(event.target.value))}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                {REVIEW_FOCUSES.map((choice) => (
                  <option key={choice} value={choice}>{t(`qa.reviewFilters.${choice}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qa-search" className="mb-1 block text-xs font-semibold">{t("qa.searchLabel")}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input id="qa-search" disabled={sprintInProgress} value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))}
                  placeholder={t("qa.searchPlaceholder")} className="h-11 rounded-xl pl-10" />
              </div>
            </div>
          </div>

          <div id="qa-revision" className="mb-5 scroll-mt-28 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Brain className="h-4 w-4 text-primary" /> {t("qa.reviewTitle")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("qa.reviewStats", { practiced: reviewSummary.practiced, total: filtered.length, due: reviewSummary.due })}
                  <span className="mt-1 block">
                    {reviewSummary.firstTryAccuracy === null
                      ? t("qa.firstTryEmpty")
                      : t("qa.firstTryAccuracy", { accuracy: reviewSummary.firstTryAccuracy, correct: reviewSummary.firstTryCorrect, total: reviewSummary.firstTryAttempts })}
                  </span>
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-xs"
                onClick={() => setHistory({})} disabled={sprintInProgress || Object.keys(history).length === 0}>
                <Trash2 className="h-4 w-4" /> {t("qa.clearPracticeHistory")}
              </Button>
            </div>
            {topicInsights.length > 0 && !sprintInProgress && (
              <section aria-labelledby="qa-topic-revision-title" className="mt-4">
                <h3 id="qa-topic-revision-title" className="text-sm font-semibold">{t("qa.topicRevision.title")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t("qa.topicRevision.notice")}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {topicInsights.map(item => {
                    const ids = item.reviewIds.slice(0, sprintSize);
                    return (
                      <article key={item.subject + ":" + item.tutorialId} className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3">
                        <div>
                          <p className="break-words text-xs font-medium text-muted-foreground">{t(`subjects.names.${item.subject}`)}</p>
                          <h4 className="mt-1 break-words text-sm font-semibold">{item.topic}</h4>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div><dt className="text-muted-foreground">{t("qa.topicRevision.attempts")}</dt><dd className="font-semibold tabular-nums">{item.firstAttempts}</dd></div>
                          <div><dt className="text-muted-foreground">{t("qa.topicRevision.mistakes")}</dt><dd className="font-semibold tabular-nums">{item.firstMistakes}</dd></div>
                          <div><dt className="text-muted-foreground">{t("qa.topicRevision.practised")}</dt><dd className="font-semibold tabular-nums">{item.practicedQuestions}</dd></div>
                          <div><dt className="text-muted-foreground">{t("qa.topicRevision.due")}</dt><dd className="font-semibold tabular-nums">{item.dueQuestions}</dd></div>
                        </dl>
                        <Button type="button" variant="outline" className="mt-auto min-h-11 w-full whitespace-normal rounded-lg"
                          aria-label={t("qa.topicRevision.startLabel", { topic: item.topic, count: ids.length })}
                          onClick={() => startPlannedSet(ids)}>
                          {t("qa.topicRevision.start", { count: ids.length })}
                        </Button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
            <div role="group" aria-label={t("qa.quickReviewTitle")} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {REVIEW_FOCUSES.map(focus => (
                <button key={focus} type="button" disabled={sprintInProgress} aria-pressed={reviewFilter === focus}
                  onClick={() => chooseReviewFocus(focus)}
                  className={`min-h-16 min-w-0 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${reviewFilter === focus ? "border-primary bg-primary/5" : "bg-muted/20 hover:bg-muted/50"}`}>
                  <span className="block text-lg font-bold tabular-nums">{focusCounts[focus]}</span>
                  <span className="mt-1 block break-words text-xs font-medium text-muted-foreground">{t(`qa.reviewFilters.${focus}`)}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("qa.quickReviewDescription")}</p>
            <p className="mt-3 text-xs text-muted-foreground">{t("qa.privateHistoryNotice")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("qa.scopedHistoryNotice")}</p>
            <Link to="/study-skills" className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />{t("qa.studySkillsLink")}<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {!activeChallenge && (
            <section aria-labelledby="qa-week-title" className="mb-5 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 id="qa-week-title" className="text-base font-semibold">{t("qa.weekPlanTitle")}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("qa.weekPlanDescription")}</p>
                </div>
              </div>
              {weeklyPlan.some((day) => day.questionIds.length > 0) ? (
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {weeklyPlan.map((day, index) => (
                    <li key={day.startAt} className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          {t("qa.weekPlanDay", { day: index + 1 })}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {new Intl.DateTimeFormat(normalizeLanguage(i18n.resolvedLanguage || i18n.language),
                            { weekday: "short", month: "short", day: "numeric" }).format(new Date(day.startAt))}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t("qa.weekPlanMix", { fresh: day.newCount, due: day.dueCount })}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="min-h-10 w-full rounded-lg"
                        disabled={day.questionIds.length === 0}
                        aria-label={t("qa.weekPlanStartDay", { day: index + 1 })}
                        onClick={() => startPlannedSet(day.questionIds)}>
                        {day.questionIds.length > 0
                          ? t("qa.weekPlanStart", { count: day.questionIds.length })
                          : t("qa.weekPlanNoTasks")}
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">{t("qa.weekPlanEmpty")}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">{t("qa.weekPlanDisclaimer")}</p>
            </section>
          )}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Flame className="h-4 w-4 text-primary" /> {t("qa.challengeTitle", { count: selectedCount })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("qa.challengeDescription")}</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[130px]">
                <label htmlFor="qa-sprint-size" className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {t("qa.sprintSize")}
                </label>
                <select id="qa-sprint-size" value={sprintSize} disabled={activeChallenge}
                  onChange={(event) => setSprintSize(parseSprintSize(event.target.value))}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                  {SPRINT_SIZES.map((count) => <option key={count} value={count}>
                    {t("qa.sprintOption", { count })}
                  </option>)}
                </select>
              </div>
              <Button type="button" variant="outline" className="min-h-11 gap-2 rounded-xl"
                disabled={sprintInProgress || filtered.length === 0} onClick={() => startChallenge("adaptive")}>
                <Brain className="h-4 w-4" /> {t("qa.adaptiveReview")}
              </Button>
              <Button type="button" variant="outline" className="gap-2 rounded-xl"
                disabled={sprintInProgress || filtered.length === 0} onClick={() => startChallenge("timed")}>
                <Clock3 className="h-4 w-4" /> {t("qa.timedChallenge", { minutes: timedMinutes })}
              </Button>
              <Button type="button" className="gap-2 rounded-xl" disabled={sprintInProgress || filtered.length === 0}
                onClick={() => startChallenge("mixed")}>
                <Target className="h-4 w-4" /> {t("qa.startChallenge")}
              </Button>
            </div>
          </div>

          {browseEntries.length === 0 && !activeChallenge && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {t("qa.noResults")}
            </div>
          )}

          {activeChallenge && (
            <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <h3 ref={challengeHeading} tabIndex={-1} className="scroll-mt-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{challengeCompleted
                  ? t("qa.challengeFinished")
                  : t("qa.challengeProgress", { current: challengeIndex + 1, total: challengeIds.length })}</h3>
                <span>{t("qa.challengeScore", { score: firstTryCorrect, total: challengeIds.length })}</span>
                {challengeMode === "timed" && !challengeCompleted && (
                  <span aria-label={t("qa.timeRemaining")}>
                    {t("qa.timerDisplay", { time: String(Math.floor(secondsRemaining / 60)).padStart(2, "0") + ":" +
                      String(secondsRemaining % 60).padStart(2, "0") })}
                  </span>
                )}
              </div>
              <div role="progressbar" aria-label={t("qa.challengeTitle", { count: challengeIds.length })} aria-valuemin={0} aria-valuemax={challengeIds.length} aria-valuenow={Math.min(challengeIndex, challengeIds.length)} className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(100 * challengeIndex / challengeIds.length)}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("qa.challengeStreak", { count: challengeStreak })}</p>
              {challengeMode === "adaptive" && <p className="mt-1 text-xs text-muted-foreground">{t("qa.adaptiveExplanation")}</p>}
              {!challengeCompleted && <Button type="button" variant="ghost" size="sm" className="mt-2 min-h-11" onClick={exitChallenge}>{t("qa.exitChallenge")}</Button>}
            </div>
          )}

          {challengeCompleted && (
            <div className="mb-5 rounded-2xl border bg-card p-4 text-center sm:p-8">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-bold">{t(challengeMode === "timed" && secondsRemaining === 0 ? "qa.timeExpired" : "qa.challengeFinished")}</h3>
              <p className="mb-2 text-sm">{t("qa.challengeSummary", { correct: firstTryCorrect, attempted: attemptedCount, total: challengeIds.length })}</p>
              <p className="mb-4 text-xs text-muted-foreground">{t("qa.challengeMastered", { count: masteredCount })}</p>
              <dl className="mx-auto mb-4 grid max-w-xl grid-cols-1 gap-2 text-center min-[380px]:grid-cols-3">
                {([
                  ["qa.sprintResults.correct", sprintResult.correct, "text-emerald-600 dark:text-emerald-400"],
                  ["qa.sprintResults.missed", sprintResult.missed, "text-amber-700 dark:text-amber-300"],
                  ["qa.sprintResults.unattempted", sprintResult.unattempted, "text-muted-foreground"],
                ] as const).map(([key, count, colour]) => (
                  <div key={key} className="min-w-0 rounded-xl border bg-muted/20 px-2 py-3">
                    <dd className={`text-2xl font-bold tabular-nums ${colour}`}>{count}</dd>
                    <dt className="mt-1 break-words text-xs font-medium">{t(key)}</dt>
                  </div>
                ))}
              </dl>
              <p className="mx-auto mb-5 max-w-lg text-xs leading-relaxed text-muted-foreground">{t("qa.sprintResults.notice")}</p>
              <div className="flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
                {sprintResult.retryIds.length > 0 && <Button type="button" onClick={() => launchChallenge(sprintResult.retryIds, "mixed")} className="min-h-11 gap-2 rounded-xl">
                  <Target className="h-4 w-4" aria-hidden="true" /> {t("qa.sprintResults.retry", { count: sprintResult.retryIds.length })}
                </Button>}
                {missedRetryIds.length > 0 && <Button type="button" variant="outline" onClick={() => launchChallenge(missedRetryIds, "mixed")} className="min-h-11 rounded-xl">{t("qa.sprintResults.retryMissed", { count: missedRetryIds.length })}</Button>}
                {unansweredRetryIds.length > 0 && <Button type="button" variant="outline" onClick={() => launchChallenge(unansweredRetryIds, "mixed")} className="min-h-11 rounded-xl">{t("qa.sprintResults.retryUnanswered", { count: unansweredRetryIds.length })}</Button>}
                <Button type="button" variant="outline" onClick={() => launchChallenge(challengeIds, challengeMode)} className="min-h-11 rounded-xl">{t("qa.playAgain")}</Button>
                <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={exitChallenge}>{t("qa.browseAll")}</Button>
              </div>
            </div>
          )}

          {!activeChallenge && hasRetainedReviews && <p className="mb-3 rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">{t("qa.retainedReviewNotice")}</p>}
          <div className={activeChallenge ? "mx-auto max-w-2xl" : "grid gap-4 lg:grid-cols-2"}>
            {visibleEntries.map((entry) => {
              const mascot = getMascot(entry.subject);
              return (
                <article key={entry.id} className="mb-4 flex min-w-0 flex-col rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <img src={mascot.image} alt="" className="h-10 w-10 rounded-xl bg-muted object-cover" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-primary">{t(`subjects.names.${entry.subject}`)}</div>
                      <div className="text-sm font-medium">{entry.topic} · {t(`tutorials.levels.${entry.level.toLowerCase()}`)}</div>
                    </div>
                    {mastered[entry.id] && <Trophy className="ml-auto h-5 w-5 text-primary" aria-label={t("qa.mastered")} />}
                  </div>
                  <h3 dir="auto" className="mb-3 text-base font-semibold leading-6">{entry.question}</h3>
                  <QuestionInteraction key={entry.id + (activeChallenge ? "-challenge-" + challengeRound : "")} questionId={entry.id}
                    question={entry.checkpoint} speechLanguage={studySpeechLanguage(entry.subject)} workedExample={entry.workedExample}
                    examTip={entry.examTip} commonMistake={entry.commonMistake}
                    onAttempt={(correct, firstAttempt) => recordAttempt(entry.id, correct, firstAttempt)} />
                  <div className="mt-4"><OmniqoraEvidencePanel key={entry.id} tutorialId={entry.tutorialId}
                    checkIndex={Number(entry.id.slice(entry.tutorialId.length + 1))} /></div>
                  <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
                    <Button size="sm" variant={savedIds.includes(entry.id) ? "secondary" : "ghost"}
                      className="gap-1.5 rounded-xl" aria-pressed={savedIds.includes(entry.id)}
                      onClick={() => toggleSaved(entry.id)}>
                      <Bookmark className="h-4 w-4" />
                      {t(savedIds.includes(entry.id) ? "qa.removeBookmark" : "qa.saveQuestion")}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => openCoach(entry)}>
                      <Sparkles className="h-4 w-4" /> {t("qa.askFollowUp")}
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl"
                      onClick={() => navigate("/tutorials?tutorial=" + encodeURIComponent(entry.tutorialId))}>
                      <BookOpen className="h-4 w-4" /> {t("qa.lesson")}
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="gap-1.5 rounded-xl">
                      <Link to={contentReportHref(entry.id, entry.tutorialId)}>
                        <Flag className="h-4 w-4" /> {t("qa.reportQuestion")}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {activeChallenge && !challengeCompleted && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <span className="text-xs text-muted-foreground">{t("qa.selfCheckNote")}</span>
              <Button className="gap-2 rounded-xl" onClick={() => {
                if (deadline !== null && Date.now() >= deadline) { setSecondsRemaining(0); return; }
                setChallengeIndex((index) => Math.min(challengeIds.length, index + 1));
              }}>
                {challengeIndex === challengeIds.length - 1 ? t("qa.finishChallenge") : t("qa.nextQuestion")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!activeChallenge && browseEntries.length > displayLimit && (
            <div className="mt-5 flex justify-center">
              <Button variant="outline" className="rounded-xl" onClick={() => setDisplayLimit((count) => count + PAGE_SIZE)}>
                {t("qa.loadMore")}
              </Button>
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-muted/30 p-5">
          <p className="max-w-lg text-sm text-muted-foreground">{t("qa.practiceNote")}</p>
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate("/subjects")}>
            <GraduationCap className="h-4 w-4" /> {t("qa.practice")} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
