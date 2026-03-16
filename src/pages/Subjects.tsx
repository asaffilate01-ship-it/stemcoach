import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { subjects, curricula, difficultyLabels, type Difficulty } from "@/data/questions";
import { ChevronRight, Filter } from "lucide-react";

const countryGroups = [
  { label: "🇬🇧 United Kingdom", keys: ["uk-gcse", "uk-alevel", "uk-btec", "uk-scottish-nat5", "uk-scottish-higher", "uk-scottish-adv-higher"] },
  { label: "🌍 International UK", keys: ["uk-igcse", "uk-ial", "uk-olevel", "uk-pre-u"] },
  { label: "🌍 IB", keys: ["ib-myp", "ib-dp-sl", "ib-dp-hl", "ib-dp-further"] },
  { label: "🇺🇸 United States", keys: ["us-middle", "us-highschool", "us-ap", "us-sat", "us-act"] },
  { label: "🇮🇳 India", keys: ["india-cbse-10", "india-cbse-12", "india-icse-10", "india-isc-12", "india-state", "india-jee", "india-neet", "india-olympiad"] },
  { label: "🇵🇰 Pakistan", keys: ["pakistan-matric", "pakistan-fsc", "pakistan-olevel", "pakistan-alevel", "pakistan-ecat-mdcat"] },
];

export default function Subjects() {
  const navigate = useNavigate();
  const [selectedCurriculum, setSelectedCurriculum] = useState("uk-alevel");
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>("🇬🇧 United Kingdom");

  const currentCurriculum = curricula.find(c => c.id === selectedCurriculum);
  const availableBoards = currentCurriculum?.boards || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Select Your Programme</div>
          <h1 className="stem-heading text-3xl">Choose a subject to practise</h1>
        </div>

        {/* Curriculum by Country */}
        <div className="mb-6">
          <div className="stem-label mb-2">Curriculum</div>
          <div className="space-y-3">
            {countryGroups.map((group) => (
              <div key={group.label}>
                <button
                  onClick={() => setExpandedCountry(expandedCountry === group.label ? null : group.label)}
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedCountry === group.label ? "rotate-90" : ""}`} />
                  {group.label}
                </button>
                {expandedCountry === group.label && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="ml-5 flex flex-wrap gap-1.5"
                  >
                    {group.keys.map((key) => {
                      const c = curricula.find(cu => cu.id === key);
                      if (!c) return null;
                      return (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCurriculum(c.id); setSelectedBoard(null); }}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                            selectedCurriculum === c.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Board Filter */}
        {availableBoards.length > 1 && (
          <div className="mb-6">
            <div className="stem-label mb-2 flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> Exam Board
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedBoard(null)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedBoard === null
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                All Boards
              </button>
              {availableBoards.map((board) => (
                <button
                  key={board}
                  onClick={() => setSelectedBoard(board)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedBoard === board
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {board}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Filter */}
        <div className="mb-8">
          <div className="stem-label mb-2">Difficulty</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                selectedDifficulty === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              All Levels
            </button>
            {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedDifficulty === d
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                L{d} · {difficultyLabels[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Info */}
        <div className="mb-6 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 text-sm">
          <span className="font-semibold text-primary">{currentCurriculum?.label}</span>
          {selectedBoard && <span className="text-muted-foreground"> · {selectedBoard}</span>}
          {selectedDifficulty && <span className="text-muted-foreground"> · Level {selectedDifficulty}</span>}
          <span className="text-muted-foreground"> — {currentCurriculum?.boards.length} board{(currentCurriculum?.boards.length || 0) > 1 ? "s" : ""} available</span>
        </div>

        {/* Subject Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, i) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
            >
              <button
                onClick={() => navigate(`/practice/${subject.id}`)}
                className="stem-card group w-full rounded-xl p-6 text-left transition-all hover:border-primary/20"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                    {subject.icon}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">{subject.name}</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  {subject.questionCount.toLocaleString()} questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {subject.topics.slice(0, 4).map((topic) => (
                    <span key={topic} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {topic}
                    </span>
                  ))}
                  {subject.topics.length > 4 && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{subject.topics.length - 4} more
                    </span>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
        </main>
      </PageTransition>
    </div>
  );
}
