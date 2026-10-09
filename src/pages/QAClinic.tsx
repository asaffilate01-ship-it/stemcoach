import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Brain, CircleHelp, Flame, GraduationCap, Layers, Search, Sparkles, Target, Trophy } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { QuestionInteraction } from "@/components/qa/QuestionInteraction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { qaEntries, type QAEntry } from "@/data/qaClinic";
import type { TutorialQuestionFormat } from "@/data/tutorials";
import { subjects } from "@/data/questions";
import { getMascot } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { normalizeLanguage } from "@/i18n/language";

const questionFormats: TutorialQuestionFormat[] = [
  "single", "multiple", "true-false", "numeric", "short-text", "ordering", "matching",
];
const PAGE_SIZE = 16;
const CHALLENGE_LENGTH = 10;

function sampleWithoutReplacement<T>(items: readonly T[], count: number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(0, Math.min(count, result.length));
}

export default function QAClinic() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("qa.title"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedSubject = searchParams.get("subject");
  const [subject, setSubject] = useState(
    requestedSubject && subjects.some((item) => item.id === requestedSubject) ? requestedSubject : "all",
  );
  const [format, setFormat] = useState("all");
  const [level, setLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [question, setQuestion] = useState("");
  const [askSubject, setAskSubject] = useState("mathematics");
  const [challengeIds, setChallengeIds] = useState<string[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [firstAttempts, setFirstAttempts] = useState<Record<string, boolean>>({});
  const [mastered, setMastered] = useState<Record<string, boolean>>({});
  const [challengeStreak, setChallengeStreak] = useState(0);

  const filtered = useMemo(() => {
    const phrase = search.trim().toLocaleLowerCase();
    return qaEntries.filter((entry) =>
      (subject === "all" || entry.subject === subject) &&
      (format === "all" || entry.format === format) &&
      (level === "all" || entry.level === level) &&
      (!phrase || [entry.question, entry.topic, entry.explanation, entry.subject, entry.hint]
        .some((text) => text.toLocaleLowerCase().includes(phrase))),
    );
  }, [subject, format, level, search]);

  const activeChallenge = challengeIds.length > 0;
  const challengeCompleted = activeChallenge && challengeIndex >= challengeIds.length;
  const challengeEntry = activeChallenge && !challengeCompleted
    ? qaEntries.find((entry) => entry.id === challengeIds[challengeIndex])
    : null;
  const visibleEntries = activeChallenge ? (challengeEntry ? [challengeEntry] : []) : filtered.slice(0, displayLimit);
  const attemptedCount = challengeIds.filter((id) => id in firstAttempts).length;
  const firstTryCorrect = challengeIds.filter((id) => firstAttempts[id] === true).length;
  const masteredCount = challengeIds.filter((id) => mastered[id] === true).length;

  const startChallenge = () => {
    const selected = sampleWithoutReplacement(filtered, CHALLENGE_LENGTH).map((entry) => entry.id);
    setChallengeIds(selected);
    setChallengeIndex(0);
    setFirstAttempts({});
    setMastered({});
    setChallengeStreak(0);
    window.setTimeout(() => document.getElementById("qa-library")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const changeFilter = (change: () => void) => {
    setChallengeIds([]);
    setChallengeIndex(0);
    setDisplayLimit(PAGE_SIZE);
    change();
  };

  const recordAttempt = (id: string, correct: boolean, firstAttempt: boolean) => {
    if (correct) setMastered((previous) => ({ ...previous, [id]: true }));
    if (firstAttempt) {
      setFirstAttempts((previous) => id in previous ? previous : { ...previous, [id]: correct });
      if (activeChallenge && challengeIds[challengeIndex] === id) {
        setChallengeStreak((previous) => correct ? previous + 1 : 0);
      }
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

        <section aria-labelledby="qa-your-question" className="mb-8 rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h2 id="qa-your-question" className="text-lg font-semibold">{t("qa.askTitle")}</h2>
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
              <h2 id="qa-library" className="flex items-center gap-2 text-xl font-bold">
                <Layers className="h-5 w-5 text-primary" /> {t("qa.libraryTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("qa.libraryDescription")}</p>
            </div>
            <span className="text-sm text-muted-foreground">{t("qa.results", { count: filtered.length })}</span>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="qa-subject-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterSubject")}</label>
              <select id="qa-subject-filter" value={subject} onChange={(event) => changeFilter(() => setSubject(event.target.value))}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allSubjects")}</option>
                {subjects.map((item) => <option key={item.id} value={item.id}>{t(`subjects.names.${item.id}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-format-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterFormat")}</label>
              <select id="qa-format-filter" value={format} onChange={(event) => changeFilter(() => setFormat(event.target.value))}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allFormats")}</option>
                {questionFormats.map((item) => <option key={item} value={item}>{t(`qa.formats.${item}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-level-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterLevel")}</label>
              <select id="qa-level-filter" value={level} onChange={(event) => changeFilter(() => setLevel(event.target.value))}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allLevels")}</option>
                {["Foundation", "Intermediate", "Advanced"].map((item) =>
                  <option key={item} value={item}>{t(`tutorials.levels.${item.toLowerCase()}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-search" className="mb-1 block text-xs font-semibold">{t("qa.searchLabel")}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input id="qa-search" value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))}
                  placeholder={t("qa.searchPlaceholder")} className="h-11 rounded-xl pl-10" />
              </div>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Flame className="h-4 w-4 text-primary" /> {t("qa.challengeTitle")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("qa.challengeDescription")}</p>
            </div>
            <Button type="button" className="gap-2 rounded-xl" disabled={filtered.length === 0}
              onClick={startChallenge}>
              <Target className="h-4 w-4" /> {t("qa.startChallenge")}
            </Button>
          </div>

          {filtered.length === 0 && !activeChallenge && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {t("qa.noResults")}
            </div>
          )}

          {activeChallenge && (
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4" aria-live="polite">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <span>{challengeCompleted
                  ? t("qa.challengeFinished")
                  : t("qa.challengeProgress", { current: challengeIndex + 1, total: challengeIds.length })}</span>
                <span>{t("qa.challengeScore", { score: firstTryCorrect, total: challengeIds.length })}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(100 * challengeIndex / challengeIds.length)}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("qa.challengeStreak", { count: challengeStreak })}</p>
            </div>
          )}

          {challengeCompleted && (
            <div className="mb-5 rounded-2xl border bg-card p-8 text-center">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-bold">{t("qa.challengeFinished")}</h3>
              <p className="mb-2 text-sm">{t("qa.challengeSummary", { correct: firstTryCorrect, attempted: attemptedCount, total: challengeIds.length })}</p>
              <p className="mb-5 text-xs text-muted-foreground">{t("qa.challengeMastered", { count: masteredCount })}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={startChallenge} className="rounded-xl">{t("qa.playAgain")}</Button>
                <Button variant="outline" className="rounded-xl" onClick={() => { setChallengeIds([]); setChallengeIndex(0); }}>
                  {t("qa.browseAll")}
                </Button>
              </div>
            </div>
          )}

          <div className={activeChallenge ? "mx-auto max-w-2xl" : "grid gap-4 lg:grid-cols-2"}>
            {visibleEntries.map((entry) => {
              const mascot = getMascot(entry.subject);
              return (
                <article key={entry.id} className="mb-4 flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <img src={mascot.image} alt="" className="h-10 w-10 rounded-xl bg-muted object-cover" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-primary">{t(`subjects.names.${entry.subject}`)}</div>
                      <div className="text-sm font-medium">{entry.topic} · {t(`tutorials.levels.${entry.level.toLowerCase()}`)}</div>
                    </div>
                    {mastered[entry.id] && <Trophy className="ml-auto h-5 w-5 text-primary" aria-label={t("qa.mastered")} />}
                  </div>
                  <h3 className="mb-3 text-base font-semibold leading-6">{entry.question}</h3>
                  <QuestionInteraction key={entry.id + (activeChallenge ? "-challenge" : "")} questionId={entry.id}
                    question={entry.checkpoint} workedExample={entry.workedExample}
                    examTip={entry.examTip} commonMistake={entry.commonMistake}
                    onAttempt={(correct, firstAttempt) => recordAttempt(entry.id, correct, firstAttempt)} />
                  <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => openCoach(entry)}>
                      <Sparkles className="h-4 w-4" /> {t("qa.askFollowUp")}
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl"
                      onClick={() => navigate("/tutorials?tutorial=" + encodeURIComponent(entry.tutorialId))}>
                      <BookOpen className="h-4 w-4" /> {t("qa.lesson")}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {activeChallenge && !challengeCompleted && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <span className="text-xs text-muted-foreground">{t("qa.selfCheckNote")}</span>
              <Button className="gap-2 rounded-xl" onClick={() => setChallengeIndex((index) => Math.min(challengeIds.length, index + 1))}>
                {challengeIndex === challengeIds.length - 1 ? t("qa.finishChallenge") : t("qa.nextQuestion")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!activeChallenge && filtered.length > displayLimit && (
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
