import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tutorials } from "@/data/tutorials";
import { getMascot } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BookOpen, CheckCircle2, Clock, Search } from "lucide-react";

const subjectNames: Record<string, string> = {
  mathematics: "Mathematics", physics: "Physics", chemistry: "Chemistry", biology: "Biology", "computer-science": "Computer Science",
};

export default function Tutorials() {
  useDocumentTitle("STEM Tutorials");
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const filtered = useMemo(() => tutorials.filter((tutorial) =>
    (subject === "all" || tutorial.subject === subject) &&
    `${tutorial.title} ${tutorial.summary}`.toLowerCase().includes(search.toLowerCase()),
  ), [search, subject]);

  return <div className="min-h-screen bg-background">
    <AppHeader />
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <p className="stem-label mb-1">Learn, practise, check</p>
        <h1 className="stem-heading text-3xl">Guided STEM tutorials</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Short concept lessons with objectives, a worked example, and an immediate knowledge check.</p>
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tutorials" className="pl-9"/></div>
        <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="all">All subjects</option>{Object.entries(subjectNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <div className="space-y-4">
        {filtered.map((tutorial) => {
          const mascot = getMascot(tutorial.subject);
          const open = openId === tutorial.id;
          const chosen = answers[tutorial.id];
          return <article key={tutorial.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <button onClick={() => setOpenId(open ? null : tutorial.id)} className="flex w-full items-center gap-4 p-5 text-left">
              <img src={mascot.image} alt="" className="h-14 w-14 rounded-xl bg-muted object-contain"/>
              <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{subjectNames[tutorial.subject]} · {tutorial.level}</p><h2 className="mt-1 text-lg font-bold">{tutorial.title}</h2><p className="mt-1 text-sm text-muted-foreground">{tutorial.summary}</p></div>
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Clock className="h-4 w-4"/>{tutorial.minutes} min</span>
            </button>
            {open && <div className="space-y-6 border-t px-5 py-6">
              <section><h3 className="mb-2 font-semibold">Learning objectives</h3><ul className="space-y-1 text-sm text-muted-foreground">{tutorial.objectives.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/>{item}</li>)}</ul></section>
              <section><h3 className="mb-2 font-semibold">Lesson</h3><div className="space-y-2 text-sm leading-6 text-muted-foreground">{tutorial.lesson.map((item) => <p key={item}>{item}</p>)}</div></section>
              <section className="rounded-xl bg-primary/5 p-4"><h3 className="mb-2 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-primary"/>Worked example</h3><p className="text-sm leading-6">{tutorial.workedExample}</p></section>
              <section><h3 className="mb-3 font-semibold">Knowledge check</h3><p className="mb-3 text-sm">{tutorial.checkpoint.question}</p><div className="grid gap-2 sm:grid-cols-2">{tutorial.checkpoint.options.map((option) => <Button key={option} variant={chosen === option ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => setAnswers((current) => ({ ...current, [tutorial.id]: option }))}>{option}</Button>)}</div>
                {chosen && <p className={`mt-3 rounded-lg p-3 text-sm ${chosen === tutorial.checkpoint.answer ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300"}`}>{chosen === tutorial.checkpoint.answer ? "Correct. " : `Not quite. The answer is ${tutorial.checkpoint.answer}. `}{tutorial.checkpoint.explanation}</p>}
              </section>
            </div>}
          </article>;
        })}
      </div>
    </main>
  </div>;
}
