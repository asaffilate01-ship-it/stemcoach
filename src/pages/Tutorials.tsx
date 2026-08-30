import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tutorials } from "@/data/tutorials";
import { getMascot } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BookOpen, CheckCircle2, Clock, Search, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "@/i18n/language";

export default function Tutorials() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("tutorials.documentTitle"));
  const navigate = useNavigate();
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem("stemcoach:tutorials-completed") || "[]");
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  });
  const filtered = useMemo(() => tutorials.filter((tutorial) =>
    (subject === "all" || tutorial.subject === subject) &&
    `${tutorial.title} ${tutorial.summary}`.toLowerCase().includes(search.toLowerCase()),
  ), [search, subject]);

  return <div className="min-h-screen bg-background">
    <AppHeader />
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <p className="stem-label mb-1">{t("tutorials.label")}</p>
        <h1 className="stem-heading text-3xl">{t("tutorials.title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("tutorials.description")}</p>
        <p className="mt-3 text-sm font-medium text-primary">{t("tutorials.progress", { completed: completed.length, total: tutorials.length })}</p>
        {normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== "en" && (
          <p className="mt-2 max-w-2xl text-xs text-muted-foreground">{t("tutorials.contentLanguageNotice")}</p>
        )}
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("tutorials.search")} className="pl-9"/></div>
        <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="all">{t("tutorials.allSubjects")}</option>{["mathematics", "physics", "chemistry", "biology", "computer-science"].map((id) => <option key={id} value={id}>{t(`subjects.names.${id}`)}</option>)}
        </select>
      </div>
      <div className="space-y-4">
        {filtered.map((tutorial) => {
          const mascot = getMascot(tutorial.subject);
          const open = openId === tutorial.id;
          const checkpoints = [tutorial.checkpoint, ...(tutorial.practice || [])];
          const isComplete = completed.includes(tutorial.id);
          return <article key={tutorial.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <button onClick={() => setOpenId(open ? null : tutorial.id)} className="flex w-full items-center gap-4 p-5 text-left">
              <img src={mascot.image} alt="" className="h-14 w-14 rounded-xl bg-muted object-contain"/>
              <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{t(`subjects.names.${tutorial.subject}`)} · {tutorial.level}</p><h2 className="mt-1 flex items-center gap-2 text-lg font-bold">{tutorial.title}{isComplete && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</h2><p className="mt-1 text-sm text-muted-foreground">{tutorial.summary}</p></div>
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Clock className="h-4 w-4"/>{t("tutorials.minutes", { count: tutorial.minutes })}</span>
            </button>
            {open && <div className="space-y-6 border-t px-5 py-6">
              <section><h3 className="mb-2 font-semibold">{t("tutorials.objectives")}</h3><ul className="space-y-1 text-sm text-muted-foreground">{tutorial.objectives.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/>{item}</li>)}</ul></section>
              <section><h3 className="mb-2 font-semibold">{t("tutorials.lesson")}</h3><div className="space-y-2 text-sm leading-6 text-muted-foreground">{tutorial.lesson.map((item) => <p key={item}>{item}</p>)}</div></section>
              <section className="rounded-xl bg-primary/5 p-4"><h3 className="mb-2 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-primary"/>{t("tutorials.workedExample")}</h3><p className="text-sm leading-6">{tutorial.workedExample}</p></section>
              <Button variant="outline" className="gap-2" onClick={() => navigate(`/ai-tutor?subject=${encodeURIComponent(tutorial.subject)}`)}><img src={mascot.image} alt="" className="h-6 w-6 rounded-lg object-cover"/><MessageCircle className="h-4 w-4"/>{t("tutorials.askCoach", { name: mascot.name })}</Button>
              <section><h3 className="mb-3 font-semibold">{t("tutorials.knowledgeChecks")}</h3><div className="space-y-5">{checkpoints.map((checkpoint, checkpointIndex) => {
                const answerKey = `${tutorial.id}:${checkpointIndex}`;
                const checkpointChoice = answers[answerKey];
                return <div key={answerKey} className="rounded-xl border border-border/50 p-4"><p className="mb-3 text-sm font-medium">{checkpointIndex + 1}. {checkpoint.question}</p><div className="grid gap-2 sm:grid-cols-2">{checkpoint.options.map((option) => <Button key={option} variant={checkpointChoice === option ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => {
                  const nextAnswers = { ...answers, [answerKey]: option };
                  setAnswers(nextAnswers);
                  const allCorrect = checkpoints.every((item, index) => nextAnswers[`${tutorial.id}:${index}`] === item.answer);
                  if (allCorrect && !completed.includes(tutorial.id)) {
                    const nextCompleted = [...completed, tutorial.id];
                    setCompleted(nextCompleted);
                    try { localStorage.setItem("stemcoach:tutorials-completed", JSON.stringify(nextCompleted)); } catch { /* storage unavailable */ }
                  }
                }}>{option}</Button>)}</div>{checkpointChoice && <p className={`mt-3 rounded-lg p-3 text-sm ${checkpointChoice === checkpoint.answer ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300"}`}>{checkpointChoice === checkpoint.answer ? t("tutorials.correct") : t("tutorials.notQuite", { answer: checkpoint.answer })}{checkpoint.explanation}</p>}</div>;
              })}</div></section>
            </div>}
          </article>;
        })}
      </div>
    </main>
  </div>;
}
