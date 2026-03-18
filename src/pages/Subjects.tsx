import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { subjects, curricula, difficultyLabels, type Difficulty } from "@/data/questions";
import { ChevronRight, Filter, Layers, GraduationCap, Zap, ArrowRight, BookOpen, Sparkles } from "lucide-react";

const countryGroups = [
  { label: "United Kingdom", flag: "🇬🇧", keys: ["uk-gcse", "uk-alevel", "uk-btec", "uk-scottish-nat5", "uk-scottish-higher", "uk-scottish-adv-higher"] },
  { label: "International UK", flag: "🌍", keys: ["uk-igcse", "uk-ial", "uk-olevel", "uk-pre-u"] },
  { label: "IB Programme", flag: "🌍", keys: ["ib-myp", "ib-dp-sl", "ib-dp-hl", "ib-dp-further"] },
  { label: "United States", flag: "🇺🇸", keys: ["us-middle", "us-highschool", "us-ap", "us-sat", "us-act"] },
  { label: "India", flag: "🇮🇳", keys: ["india-cbse-10", "india-cbse-12", "india-icse-10", "india-isc-12", "india-state", "india-jee", "india-neet", "india-olympiad"] },
  { label: "Pakistan", flag: "🇵🇰", keys: ["pakistan-matric", "pakistan-fsc", "pakistan-olevel", "pakistan-alevel", "pakistan-ecat-mdcat"] },
];

const subjectGradients: Record<string, string> = {
  mathematics: "from-[hsl(226,70%,50%)] to-[hsl(258,60%,52%)]",
  physics: "from-[hsl(250,80%,55%)] to-[hsl(280,70%,50%)]",
  chemistry: "from-[hsl(142,71%,40%)] to-[hsl(160,60%,38%)]",
  biology: "from-[hsl(38,92%,45%)] to-[hsl(25,85%,50%)]",
  "computer-science": "from-[hsl(340,75%,50%)] to-[hsl(0,84%,55%)]",
  ielts: "from-[hsl(200,80%,45%)] to-[hsl(220,70%,50%)]",
  celta: "from-[hsl(280,70%,50%)] to-[hsl(310,60%,50%)]",
};

export default function Subjects() {
  useDocumentTitle("Subjects");
  const navigate = useNavigate();
  const [selectedCurriculum, setSelectedCurriculum] = useState("uk-alevel");
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>("United Kingdom");

  const currentCurriculum = curricula.find(c => c.id === selectedCurriculum);
  const availableBoards = currentCurriculum?.boards || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto max-w-7xl px-4 py-8 pb-24 md:py-12">
          {/* Hero header */}
          <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(258,60%,52%)] px-6 py-10 text-primary-foreground md:px-12 md:py-14">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Study Centre</span>
              </div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                Choose your subject
              </h1>
              <p className="max-w-lg text-sm leading-relaxed opacity-75 md:text-base">
                Select your curriculum, exam board, and difficulty level to start practising with AI-powered questions tailored to your syllabus.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* Sidebar filters */}
            <aside className="space-y-6">
              {/* Curriculum picker */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-bold">Curriculum</span>
                </div>
                <div className="space-y-2">
                  {countryGroups.map((group) => (
                    <div key={group.label} className="overflow-hidden rounded-xl border border-border/40">
                      <button
                        onClick={() => setExpandedCountry(expandedCountry === group.label ? null : group.label)}
                        className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                          expandedCountry === group.label
                            ? "bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-base">{group.flag}</span>
                        <span className="flex-1 text-xs font-semibold">{group.label}</span>
                        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                          expandedCountry === group.label ? "rotate-90" : ""
                        }`} />
                      </button>
                      <AnimatePresence>
                        {expandedCountry === group.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-border/30 bg-muted/20"
                          >
                            <div className="flex flex-wrap gap-1.5 p-3">
                              {group.keys.map((key) => {
                                const c = curricula.find(cu => cu.id === key);
                                if (!c) return null;
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => { setSelectedCurriculum(c.id); setSelectedBoard(null); }}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                                      selectedCurriculum === c.id
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                                        : "bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                    }`}
                                  >
                                    {c.label}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Board filter */}
              {availableBoards.length > 1 && (
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <Filter className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-bold">Exam Board</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedBoard(null)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                        selectedBoard === null
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                          : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      All Boards
                    </button>
                    {availableBoards.map((board) => (
                      <button
                        key={board}
                        onClick={() => setSelectedBoard(board)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                          selectedBoard === board
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                            : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {board}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty filter */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-bold">Difficulty</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedDifficulty(null)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      selectedDifficulty === null
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    All
                  </button>
                  {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                        selectedDifficulty === d
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                          : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {difficultyLabels[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active selection summary */}
              <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-4">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">Active Selection</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{currentCurriculum?.label}</span>
                  {selectedBoard && <> · {selectedBoard}</>}
                  {selectedDifficulty && <> · {difficultyLabels[selectedDifficulty]}</>}
                  <br />
                  <span className="opacity-70">{currentCurriculum?.boards.length} board{(currentCurriculum?.boards.length || 0) > 1 ? "s" : ""} available</span>
                </p>
              </div>
            </aside>

            {/* Subject grid */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight md:text-xl">Subjects</h2>
                  <p className="text-xs text-muted-foreground">{subjects.length} subjects available for {currentCurriculum?.label}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject, i) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <button
                      onClick={() => navigate(`/practice/${subject.id}`)}
                      className="group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25"
                    >
                      {/* Gradient accent bar */}
                      <div className={`h-1.5 w-full bg-gradient-to-r ${subjectGradients[subject.id] || "from-primary to-primary/70"}`} />

                      <div className="p-5 md:p-6">
                        {/* Icon + arrow */}
                        <div className="mb-5 flex items-start justify-between">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${subjectGradients[subject.id] || "from-primary to-primary/70"} text-lg font-bold text-white shadow-lg`}>
                            {subject.icon}
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary">
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>

                        {/* Title + count */}
                        <h3 className="mb-1 text-base font-bold tracking-tight md:text-lg">{subject.name}</h3>
                        <div className="mb-4 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            {subject.questionCount.toLocaleString()} questions
                          </span>
                          <span className="h-3 w-px bg-border" />
                          <span className="text-xs font-medium text-muted-foreground">{subject.topics.length} topics</span>
                        </div>

                        {/* Topic pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {subject.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic}
                              className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors group-hover:bg-primary/5 group-hover:text-primary/80"
                            >
                              {topic}
                            </span>
                          ))}
                          {subject.topics.length > 3 && (
                            <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              +{subject.topics.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hover glow */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ring-1 ring-inset ring-primary/10" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
