import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Brain, CalendarDays, CheckCircle2, Clock3, GraduationCap, HeartHandshake, Lightbulb, Pause, Play, RotateCcw, Search, ShieldCheck, Sparkles, Wind } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { normalizeLanguage } from "@/i18n/language";
import { studyCategories, studyChecklist, studySkills, studySources, type ChecklistKind, type StudyCategory, type StudyLanguage } from "@/data/studySkills";

const copy = {
  en: {
    eyebrow: "Learn well, feel better", title: "Study & exam skills",
    intro: "Practical ways to revise, remember, plan and look after yourself. Small steps count; you do not need to study every minute.",
    begin: "Start a revision session", qa: "Practise questions", planner: "Open study planner",
    question: "What would help today?", prompt: "Choose a starting point; you can change it at any time.",
    scenarios: [
      { label: "I cannot get started", category: "start" },
      { label: "I keep forgetting", category: "remember" },
      { label: "A topic is confusing", category: "understand" },
      { label: "An exam is coming up", category: "exam" },
      { label: "I need a healthy balance", category: "body" },
      { label: "I feel under pressure", category: "pressure" },
    ],
    categoryAll: "All techniques",
    categories: {
      start: "Plan & focus", remember: "Remember more", understand: "Understand difficult topics",
      exam: "Exam preparation", body: "Sleep, movement & rest", pressure: "Stay calm & get support",
    },
    search: "Search study techniques", searchPlaceholder: "Try memory, sleep, exam, focus…",
    results: "Showing {{count}} guides", noResults: "No guides match. Try a different search or category.",
    how: "Try these steps", guideSource: "Read the underlying guidance",
    habits: "Try a simple focus session", habitsDesc: "Pick a short, comfortable work block. Pause or stop whenever you need to. There is no score.",
    minutes: "{{count}} minutes", focus: "Focus timer", start: "Start", pause: "Pause", resume: "Resume", reset: "Reset", finished: "Session complete — a break is fine.",
    sessionNote: "The timer runs only on this page; it does not track you or change your learning records.",
    checklist: "Useful checklists", checklistDesc: "Tick what you want to remember. Ticks stay in this page only and clear when you leave.",
    checklists: { before: "Before studying", evening: "Night before an exam", exam: "On exam day" },
    done: "{{done}} of {{total}} considered", clear: "Clear ticks",
    evidence: "Helpful independent guidance", evidenceDesc: "Our short guides are original summaries of broadly applicable learning and wellbeing advice. Adjust them to your course, circumstances and needs.",
    safeguardingTitle: "When studying feels too much", safeguarding: "If worry or stress is affecting your sleep, day-to-day life or ability to cope, talk to someone you trust, such as a parent, teacher or tutor. A GP or appropriate local service can help. These tips are not medical advice or a substitute for personal support.",
    note: "The techniques are suggestions, not guaranteed exam outcomes. Follow your awarding body's current instructions for examination rules and accessibility arrangements.",
  },
  de: {
    eyebrow: "Gut lernen, besser fühlen", title: "Lern- und Prüfungstechniken",
    intro: "Praktische Methoden zum Lernen, Erinnern und Planen – mit Zeit für dich. Kleine Schritte zählen.",
    begin: "Lernrunde beginnen", qa: "Fragen üben", planner: "Lernplaner öffnen",
    question: "Was hilft dir heute?", prompt: "Wähle einen Einstieg. Du kannst ihn jederzeit ändern.",
    scenarios: [
      { label: "Ich komme nicht ins Lernen", category: "start" },
      { label: "Ich vergesse den Stoff", category: "remember" },
      { label: "Ein Thema ist schwierig", category: "understand" },
      { label: "Eine Prüfung steht an", category: "exam" },
      { label: "Ich brauche Ausgleich", category: "body" },
      { label: "Ich fühle mich unter Druck", category: "pressure" },
    ],
    categoryAll: "Alle Techniken",
    categories: {
      start: "Planen & konzentrieren", remember: "Besser erinnern", understand: "Schwierige Themen verstehen",
      exam: "Prüfungsvorbereitung", body: "Schlaf, Bewegung & Pausen", pressure: "Ruhe & Unterstützung",
    },
    search: "Lerntechniken suchen", searchPlaceholder: "Gedächtnis, Schlaf, Prüfung, Fokus …",
    results: "{{count}} Ratgeber", noResults: "Nichts gefunden. Ändere Suche oder Kategorie.",
    how: "So kannst du vorgehen", guideSource: "Grundlage lesen",
    habits: "Kurze Fokusphase ausprobieren", habitsDesc: "Wähle eine angenehme Dauer. Du kannst jederzeit unterbrechen. Es gibt keine Punkte.",
    minutes: "{{count}} Minuten", focus: "Fokus-Timer", start: "Starten", pause: "Pause", resume: "Fortsetzen", reset: "Zurücksetzen", finished: "Geschafft – eine Pause ist gut.",
    sessionNote: "Der Timer läuft nur auf dieser Seite. Er speichert keine Lerndaten.",
    checklist: "Praktische Checklisten", checklistDesc: "Kreuze an, was dir hilft. Die Häkchen bleiben nur auf dieser Seite.",
    checklists: { before: "Vor dem Lernen", evening: "Am Abend vor der Prüfung", exam: "Am Prüfungstag" },
    done: "{{done}} von {{total}} bedacht", clear: "Häkchen löschen",
    evidence: "Unabhängige Informationsquellen", evidenceDesc: "Unsere eigenen Kurztexte fassen allgemeine Lern- und Wohlbefindenstipps zusammen. Passe sie deinen Bedürfnissen an.",
    safeguardingTitle: "Wenn Lernen zu viel wird", safeguarding: "Wenn Stress deinen Schlaf, Alltag oder deine Belastbarkeit beeinträchtigt, sprich mit einer vertrauten Person, Lehrkraft oder Familie. Hausärztliche oder passende Beratungsangebote können helfen. Diese Hinweise ersetzen keine individuelle Beratung.",
    note: "Die Methoden garantieren keine Prüfungsergebnisse. Beachte die geltenden Regeln und Nachteilsausgleiche deiner Prüfungsstelle.",
  },
  fr: {
    eyebrow: "Mieux apprendre, mieux se sentir", title: "Méthodes d'étude et d'examen",
    intro: "Des façons pratiques de réviser, mémoriser, planifier et prendre soin de toi. Chaque petit pas compte.",
    begin: "Commencer une révision", qa: "S'entraîner aux questions", planner: "Ouvrir le planning",
    question: "De quoi as-tu besoin aujourd'hui ?", prompt: "Choisis un point de départ. Tu peux changer à tout moment.",
    scenarios: [
      { label: "J'ai du mal à commencer", category: "start" },
      { label: "J'oublie trop vite", category: "remember" },
      { label: "Un sujet me bloque", category: "understand" },
      { label: "Un examen approche", category: "exam" },
      { label: "J'ai besoin d'équilibre", category: "body" },
      { label: "Je me sens sous pression", category: "pressure" },
    ],
    categoryAll: "Toutes les méthodes",
    categories: {
      start: "Planifier et se concentrer", remember: "Mieux mémoriser", understand: "Comprendre les sujets difficiles",
      exam: "Préparer les examens", body: "Sommeil, mouvement et repos", pressure: "Retrouver le calme et du soutien",
    },
    search: "Rechercher une méthode", searchPlaceholder: "Mémoire, sommeil, examen, concentration…",
    results: "{{count}} guides affichés", noResults: "Aucun guide trouvé. Essaie une autre recherche.",
    how: "Étapes à essayer", guideSource: "Lire la source",
    habits: "Essayer une séance de concentration", habitsDesc: "Choisis une durée confortable. Tu peux faire une pause quand tu veux. Il n'y a pas de score.",
    minutes: "{{count}} minutes", focus: "Minuteur de concentration", start: "Commencer", pause: "Pause", resume: "Reprendre", reset: "Réinitialiser", finished: "Séance terminée — une pause est bienvenue.",
    sessionNote: "Le minuteur fonctionne uniquement sur cette page et ne conserve pas tes données.",
    checklist: "Listes de préparation", checklistDesc: "Coche ce qui t'aide. Les coches restent uniquement sur cette page.",
    checklists: { before: "Avant de réviser", evening: "La veille d'un examen", exam: "Le jour de l'examen" },
    done: "{{done}} sur {{total}} examinés", clear: "Effacer les coches",
    evidence: "Sources indépendantes", evidenceDesc: "Nos guides originaux résument des conseils généraux sur l'apprentissage et le bien-être. Adapte-les à ta situation.",
    safeguardingTitle: "Quand les études deviennent trop difficiles", safeguarding: "Si le stress touche ton sommeil, ton quotidien ou ta capacité à faire face, parle à un proche, parent ou enseignant. Un médecin ou un service adapté peut aussi t'aider. Ces conseils ne remplacent pas un soutien personnalisé.",
    note: "Ces méthodes ne garantissent aucun résultat. Suis les règles et les aménagements officiels de ton examen.",
  },
} as const;
const categoryIcons = {
  start: CalendarDays, remember: Brain, understand: Lightbulb,
  exam: GraduationCap, body: HeartHandshake, pressure: Wind,
};

export default function StudySkills() {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language) as StudyLanguage;
  const ui = copy[language];
  useDocumentTitle(ui.title);
  const [category, setCategory] = useState<StudyCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [checklist, setChecklist] = useState<ChecklistKind>("before");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [duration, setDuration] = useState<10 | 20 | 25>(20);
  const [remaining, setRemaining] = useState(20 * 60);
  const [running, setRunning] = useState(false);
  const deadline = useRef<number | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language);
    return studySkills.filter((guide) => {
      const content = guide.content[language];
      return (category === "all" || guide.category === category) &&
        (!query || [content.title, content.summary, ...content.steps, ui.categories[guide.category]]
          .some((value) => value.toLocaleLowerCase(language).includes(query)));
    });
  }, [category, search, language, ui]);

  useEffect(() => {
    if (!running) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil(((deadline.current ?? Date.now()) - Date.now()) / 1000)));
    tick();
    const handleVisibility = () => tick();
    const interval = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [running]);

  useEffect(() => {
    if (running && remaining === 0) {
      setRunning(false);
      deadline.current = null;
    }
  }, [running, remaining]);

  const resetTimer = (minutes: 10 | 20 | 25) => {
    deadline.current = null;
    setRunning(false);
    setDuration(minutes);
    setRemaining(minutes * 60);
  };
  const toggleTimer = () => {
    if (running) {
      setRemaining(Math.max(0, Math.ceil(((deadline.current ?? Date.now()) - Date.now()) / 1000)));
      deadline.current = null;
      setRunning(false);
    } else if (remaining > 0) {
      deadline.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  };

  const activeItems = studyChecklist[checklist][language];
  const considered = activeItems.filter((_, index) => checked[`${checklist}:${index}`]).length;
  const selectSituation = (next: StudyCategory) => {
    setCategory(next);
    setSearch("");
    document.getElementById("skills-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto max-w-6xl px-4 pb-28 pt-7 md:pt-10">
        <section className="relative mb-8 overflow-hidden rounded-3xl border bg-card p-6 shadow-sm md:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />{ui.eyebrow}
            </span>
            <h1 className="stem-heading text-3xl font-extrabold tracking-tight md:text-4xl">{ui.title}</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{ui.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="min-h-11 rounded-xl"><Link to="/qa-clinic"><BookOpen className="mr-2 h-4 w-4" />{ui.qa}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className="min-h-11 rounded-xl"><Link to="/study-planner">{ui.planner}</Link></Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="skills-situation-title" className="mb-8 rounded-2xl border bg-card p-5 md:p-7">
          <h2 id="skills-situation-title" className="text-xl font-bold">{ui.question}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{ui.prompt}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ui.scenarios.map((scenario) => {
              const Icon = categoryIcons[scenario.category];
              return <Button key={scenario.category} type="button" variant={category === scenario.category ? "default" : "outline"}
                aria-pressed={category === scenario.category}
                onClick={() => selectSituation(scenario.category)}
                className="min-h-12 h-auto justify-start gap-2 whitespace-normal rounded-xl px-4 py-3 text-left">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{scenario.label}
              </Button>;
            })}
          </div>
        </section>

        <section id="skills-library" aria-labelledby="skills-library-title" className="mb-10 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="skills-library-title" className="text-xl font-bold">{ui.how}</h2>
            <p role="status" className="text-sm text-muted-foreground">
              {ui.results.replace("{{count}}", String(filtered.length))}
            </p>
          </div>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={ui.categoryAll}>
            {(["all", ...studyCategories] as const).map((choice) => (
              <button key={choice} type="button" aria-pressed={category === choice}
                onClick={() => setCategory(choice)}
                className={`min-h-10 rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${category === choice ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                {choice === "all" ? ui.categoryAll : ui.categories[choice]}
              </button>
            ))}
          </div>
          <div className="relative mb-5 max-w-lg">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <label htmlFor="skills-search" className="sr-only">{ui.search}</label>
            <Input id="skills-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={ui.searchPlaceholder} className="h-11 rounded-xl pl-10" />
          </div>
          {filtered.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((guide) => {
                const content = guide.content[language];
                const Icon = categoryIcons[guide.category];
                return <article key={guide.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />{ui.categories[guide.category]}
                  </div>
                  <h3 className="text-lg font-bold leading-snug">{content.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.summary}</p>
                  <ol className="mt-4 flex-1 space-y-3 border-t pt-4">
                    {content.steps.map((step, index) =>
                      <li key={index} className="flex gap-3 text-sm leading-6">
                        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                        <span>{step}</span>
                      </li>)}
                  </ol>
                  <a href={studySources[guide.source].url} target="_blank" rel="noopener noreferrer"
                    className="mt-5 inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    {ui.guideSource}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">{studySources[guide.source].title}</span>
                  </a>
                </article>;
              })}
            </div>
          ) : <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{ui.noResults}</p>}
        </section>

        <div className="mb-9 grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="focus-title" className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <h2 id="focus-title" className="flex items-center gap-2 text-lg font-bold"><Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />{ui.habits}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{ui.habitsDesc}</p>
            <div role="group" aria-label={ui.focus} className="mt-5 flex flex-wrap gap-2">
              {([10, 20, 25] as const).map((minutes) => <Button key={minutes} type="button"
                variant={duration === minutes ? "default" : "outline"} size="sm" aria-pressed={duration === minutes}
                disabled={running} onClick={() => resetTimer(minutes)}>{ui.minutes.replace("{{count}}", String(minutes))}</Button>)}
            </div>
            <div className="my-5 rounded-2xl bg-muted/40 px-4 py-6 text-center">
              <div role="timer" aria-label={ui.focus} className="font-mono text-5xl font-semibold tabular-nums tracking-tight">
                {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
              </div>
              {remaining === 0 && <p role="status" className="mt-3 text-sm font-medium">{ui.finished}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="min-h-11 gap-2" disabled={remaining === 0} onClick={toggleTimer}>
                {running ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                {running ? ui.pause : remaining === duration * 60 ? ui.start : ui.resume}
              </Button>
              <Button variant="outline" className="min-h-11 gap-2" onClick={() => resetTimer(duration)}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />{ui.reset}
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{ui.sessionNote}</p>
          </section>

          <section aria-labelledby="checklist-title" className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
            <h2 id="checklist-title" className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />{ui.checklist}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{ui.checklistDesc}</p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={ui.checklist}>
              {(["before", "evening", "exam"] as const).map((kind) =>
                <Button key={kind} type="button" size="sm" variant={checklist === kind ? "default" : "outline"}
                  aria-pressed={checklist === kind} onClick={() => setChecklist(kind)} className="h-auto min-h-10 whitespace-normal">
                  {ui.checklists[kind]}
                </Button>)}
            </div>
            <div className="mt-4 space-y-2">
              {activeItems.map((item, index) => {
                const key = `${checklist}:${index}`;
                return <label key={key} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 px-3 py-3 text-sm leading-5">
                  <input type="checkbox" checked={Boolean(checked[key])}
                    onChange={(event) => setChecked((previous) => ({ ...previous, [key]: event.target.checked }))}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                  <span>{item}</span>
                </label>;
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <p role="status" className="text-xs text-muted-foreground">
                {ui.done.replace("{{done}}", String(considered)).replace("{{total}}", String(activeItems.length))}
              </p>
              <Button type="button" variant="ghost" size="sm" disabled={!Object.values(checked).some(Boolean)}
                onClick={() => setChecked({})}>{ui.clear}</Button>
            </div>
          </section>
        </div>

        <section className="mb-8 rounded-2xl border bg-muted/30 p-5 md:p-7" aria-labelledby="support-title">
          <h2 id="support-title" className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />{ui.safeguardingTitle}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">{ui.safeguarding}</p>
          <p className="mt-3 text-xs text-muted-foreground">{ui.note}</p>
        </section>

        <section aria-labelledby="sources-title" className="rounded-2xl border bg-card p-5 md:p-7">
          <h2 id="sources-title" className="text-lg font-bold">{ui.evidence}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{ui.evidenceDesc}</p>
          <ul className="mt-4 space-y-2">
            {Object.values(studySources).map((source) =>
              <li key={source.url}><a target="_blank" rel="noopener noreferrer" href={source.url}
                className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                {source.title}<ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a></li>)}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
