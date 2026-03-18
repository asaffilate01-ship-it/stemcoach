import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { subjects, curricula, difficultyLabels, type Difficulty } from "@/data/questions";
import { ChevronRight, Filter, Layers, GraduationCap, Zap, ArrowRight, BookOpen, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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

function FilterPanel({
  selectedCurriculum,
  setSelectedCurriculum,
  selectedBoard,
  setSelectedBoard,
  selectedDifficulty,
  setSelectedDifficulty,
  expandedCountry,
  setExpandedCountry,
  currentCurriculum,
  availableBoards,
}: any) {
  return (
    <div className="space-y-5">
      {/* Curriculum picker */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold">Curriculum</span>
        </div>
        <div className="space-y-1.5">
          {countryGroups.map((group) => (
            <div key={group.label} className="overflow-hidden rounded-xl border border-border/40">
              <button
                onClick={() => setExpandedCountry(expandedCountry === group.label ? null : group.label)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                  expandedCountry === group.label ? "bg-primary/5" : "hover:bg-muted/50"
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
        <div>
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
            {availableBoards.map((board: string) => (
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
      <div>
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
      <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-3">
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">Active Selection</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{currentCurriculum?.label}</span>
          {selectedBoard && <> · {selectedBoard}</>}
          {selectedDifficulty && <> · {difficultyLabels[selectedDifficulty]}</>}
        </p>
      </div>
    </div>
  );
}

export default function Subjects() {
  useDocumentTitle("Subjects");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedCurriculum, setSelectedCurriculum] = useState("uk-alevel");
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>("United Kingdom");
  const [filterOpen, setFilterOpen] = useState(false);

  const currentCurriculum = curricula.find(c => c.id === selectedCurriculum);
  const availableBoards = currentCurriculum?.boards || [];

  const filterProps = {
    selectedCurriculum, setSelectedCurriculum,
    selectedBoard, setSelectedBoard,
    selectedDifficulty, setSelectedDifficulty,
    expandedCountry, setExpandedCountry,
    currentCurriculum, availableBoards,
  };

  const activeFilterCount = (selectedBoard ? 1 : 0) + (selectedDifficulty ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto max-w-7xl px-4 py-6 pb-28 md:py-12">
          {/* Compact mobile hero */}
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(258,60%,52%)] px-5 py-6 text-primary-foreground md:mb-10 md:rounded-3xl md:px-12 md:py-14">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm md:h-8 md:w-8 md:rounded-xl">
                  <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80 md:text-xs">Study Centre</span>
              </div>
              <h1 className="mb-1 text-2xl font-extrabold tracking-tight md:mb-2 md:text-4xl">
                Choose your subject
              </h1>
              <p className="max-w-lg text-xs leading-relaxed opacity-75 md:text-base">
                Select your curriculum, board, and difficulty to start practising.
              </p>
            </div>
          </div>

          {/* Mobile: Sticky filter bar + subject label */}
          <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <div>
              <h2 className="text-base font-bold tracking-tight">{subjects.length} Subjects</h2>
              <p className="text-[11px] text-muted-foreground">{currentCurriculum?.label}</p>
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button className="relative flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors active:bg-muted">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-safe-area-bottom">
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-base">Filters</SheetTitle>
                </SheetHeader>
                <div className="pb-6">
                  <FilterPanel {...filterProps} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* Desktop sidebar filters */}
            {!isMobile && (
              <aside className="hidden md:block">
                <div className="sticky top-20 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                  <FilterPanel {...filterProps} />
                </div>
              </aside>
            )}

            {/* Subject grid */}
            <div>
              <div className="mb-5 hidden items-center justify-between md:flex">
                <div>
                  <h2 className="text-lg font-bold tracking-tight md:text-xl">Subjects</h2>
                  <p className="text-xs text-muted-foreground">{subjects.length} subjects available for {currentCurriculum?.label}</p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 md:gap-4">
                {subjects.map((subject, i) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <button
                      onClick={() => navigate(`/practice/${subject.id}`)}
                      className="group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25 active:scale-[0.98]"
                    >
                      {/* Gradient accent bar */}
                      <div className={`h-1 w-full bg-gradient-to-r md:h-1.5 ${subjectGradients[subject.id] || "from-primary to-primary/70"}`} />

                      <div className="flex items-center gap-4 p-4 md:block md:p-6">
                        {/* Mobile: horizontal layout */}
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br md:mb-5 md:h-12 md:w-12 md:rounded-2xl ${subjectGradients[subject.id] || "from-primary to-primary/70"} text-base font-bold text-white shadow-md md:text-lg md:shadow-lg`}>
                          {subject.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between md:mb-1">
                            <h3 className="text-sm font-bold tracking-tight md:text-base lg:text-lg">{subject.name}</h3>
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:hidden" />
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground md:mb-4 md:text-xs">
                            <BookOpen className="h-3 w-3" />
                            {subject.questionCount.toLocaleString()} Qs
                            <span className="h-2.5 w-px bg-border" />
                            {subject.topics.length} topics
                          </div>

                          {/* Topic pills - desktop only */}
                          <div className="hidden flex-wrap gap-1.5 md:flex">
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

                        {/* Desktop arrow */}
                        <div className="hidden md:flex absolute top-5 right-5 h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary">
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
