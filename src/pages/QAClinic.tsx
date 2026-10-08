import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, CheckCircle2, CircleHelp, GraduationCap, Search, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { qaEntries, type QAEntry } from "@/data/qaClinic";
import { subjects } from "@/data/questions";
import { getMascot } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function QAClinic() {
  const { t } = useTranslation();
  useDocumentTitle(t("qa.title"));
  const navigate = useNavigate();
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [askSubject, setAskSubject] = useState("mathematics");

  const filtered = useMemo(() => {
    const phrase = search.trim().toLowerCase();
    return qaEntries.filter((entry) =>
      (subject === "all" || entry.subject === subject) &&
      (!phrase || [entry.question, entry.topic, entry.explanation, entry.subject].some((text) => text.toLowerCase().includes(phrase))),
    );
  }, [subject, search]);

  const openCoach = (entry?: QAEntry) => {
    const requestedSubject = entry?.subject || askSubject;
    const prompt = entry
      ? t("qa.followUpPrompt", { question: entry.question })
      : question.trim().slice(0, 2000);
    if (!prompt) return;
    const link = "/ai-tutor?subject=" + encodeURIComponent(requestedSubject)
      + (entry ? "&tutorial=" + encodeURIComponent(entry.tutorialId) : "");
    // Draft is passed via router state, never embedded in shareable URLs or auto-submitted.
    navigate(link, { state: { qaDraft: prompt } });
  };

  const toggleReveal = (id: string) =>
    setRevealed((previous) => previous.includes(id)
      ? previous.filter((value) => value !== id)
      : [...previous, id]);

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
          </div>
        </section>

        <section aria-labelledby="qa-your-question" className="mb-8 rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="mb-3 flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" />
            <h2 id="qa-your-question" className="text-lg font-semibold">{t("qa.askTitle")}</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{t("qa.askDescription")}</p>
          <div className="grid gap-3 md:grid-cols-[210px_1fr]">
            <div>
              <label htmlFor="qa-ask-subject" className="mb-1 block text-xs font-semibold">{t("qa.subject")}</label>
              <select id="qa-ask-subject" value={askSubject} onChange={(event) => setAskSubject(event.target.value)}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                {subjects.map((item) => <option key={item.id} value={item.id}>{t("subjects.names." + item.id)}</option>)}
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
              <h2 id="qa-library" className="text-xl font-bold">{t("qa.libraryTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("qa.libraryDescription")}</p>
            </div>
            <span className="text-sm text-muted-foreground">{t("qa.results", { count: filtered.length })}</span>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[240px_1fr]">
            <div>
              <label htmlFor="qa-subject-filter" className="mb-1 block text-xs font-semibold">{t("qa.filterSubject")}</label>
              <select id="qa-subject-filter" value={subject} onChange={(event) => setSubject(event.target.value)}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="all">{t("qa.allSubjects")}</option>
                {subjects.map((item) => <option key={item.id} value={item.id}>{t("subjects.names." + item.id)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qa-search" className="mb-1 block text-xs font-semibold">{t("qa.searchLabel")}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input id="qa-search" value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("qa.searchPlaceholder")} className="h-11 rounded-xl pl-10" />
              </div>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {t("qa.noResults")}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((entry) => {
              const expanded = revealed.includes(entry.id);
              const isCorrect = chosen[entry.id] === entry.answer;
              const mascot = getMascot(entry.subject);
              return (
                <article key={entry.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <img src={mascot.image} alt="" className="h-10 w-10 rounded-xl bg-muted object-cover" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-primary">{t("subjects.names." + entry.subject)}</div>
                      <div className="text-sm font-medium">{entry.topic} · {entry.level}</div>
                    </div>
                  </div>
                  <h3 className="mb-3 text-base font-semibold leading-6">{entry.question}</h3>
                  <div className="mb-4 space-y-2" role="group" aria-label={t("qa.answerOptions")}>
                    {entry.options.map((option, index) =>
                      <button type="button" key={entry.id + "-" + index}
                        aria-pressed={chosen[entry.id] === option}
                        disabled={expanded}
                        onClick={() => setChosen((previous) => ({ ...previous, [entry.id]: option }))}
                        className={chosen[entry.id] === option
                          ? "w-full rounded-xl border border-primary bg-primary/10 px-3 py-2.5 text-left text-sm"
                          : "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40"}>
                        <span className="mr-2 text-xs font-bold text-muted-foreground">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className="mb-4 space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm" role="status">
                      {chosen[entry.id] && (
                        <p className={isCorrect ? "font-semibold text-emerald-700 dark:text-emerald-300" : "font-semibold text-amber-700 dark:text-amber-300"}>
                          {isCorrect ? t("qa.correct") : t("qa.incorrect")}
                        </p>
                      )}
                      <p><strong>{t("qa.correctAnswer")}:</strong> {entry.answer}</p>
                      <div><h4 className="mb-1 font-semibold">{t("qa.why")}</h4><p className="whitespace-pre-wrap">{entry.explanation}</p></div>
                      <div><h4 className="mb-1 font-semibold">{t("qa.workedExample")}</h4><p className="whitespace-pre-wrap">{entry.workedExample}</p></div>
                    </div>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant={expanded ? "secondary" : "outline"} className="gap-1.5 rounded-xl"
                      aria-expanded={expanded} onClick={() => toggleReveal(entry.id)}>
                      <CheckCircle2 className="h-4 w-4" /> {expanded ? t("qa.hideAnswer") : t("qa.checkAndExplain")}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => openCoach(entry)}>
                      <Sparkles className="h-4 w-4" /> {t("qa.askFollowUp")}
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl"
                      onClick={() => navigate("/tutorials")}>
                      <BookOpen className="h-4 w-4" /> {t("qa.lesson")}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
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
