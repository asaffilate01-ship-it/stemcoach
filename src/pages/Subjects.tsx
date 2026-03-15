import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { subjects, curricula, difficultyLabels, type Difficulty } from "@/data/questions";
import { ChevronRight } from "lucide-react";

export default function Subjects() {
  const navigate = useNavigate();
  const [selectedCurriculum, setSelectedCurriculum] = useState("uk-alevel");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Select Your Programme</div>
          <h1 className="stem-heading text-3xl">Choose a subject to practise</h1>
        </div>

        {/* Curriculum Filter */}
        <div className="mb-6">
          <div className="stem-label mb-2">Curriculum</div>
          <div className="flex flex-wrap gap-2">
            {curricula.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCurriculum(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedCurriculum === c.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {c.country} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-8">
          <div className="stem-label mb-2">Difficulty</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
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
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
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
    </div>
  );
}
