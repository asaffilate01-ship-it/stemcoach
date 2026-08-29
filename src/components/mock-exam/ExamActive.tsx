import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Flag, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamQuestion {
  id: string;
  question_text: string;
  options: any;
  correct_answer?: string;
  topic: string;
  subject: string;
  difficulty: number;
  points: number;
  explanation?: string;
  worked_solution?: string;
}

interface ExamActiveProps {
  questions: ExamQuestion[];
  currentQ: number;
  setCurrentQ: (q: number | ((prev: number) => number)) => void;
  answers: Record<number, string>;
  setAnswers: (a: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  flagged: Set<number>;
  setFlagged: (f: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  timeLeft: number;
  submitting: boolean;
  onSubmit: () => void;
  formatTime: (s: number) => string;
}

export function ExamActive({
  questions,
  currentQ,
  setCurrentQ,
  answers,
  setAnswers,
  flagged,
  setFlagged,
  timeLeft,
  submitting,
  onSubmit,
  formatTime,
}: ExamActiveProps) {
  const q = questions[currentQ];
  const parsedOptions: string[] =
    typeof q.options === "string" ? JSON.parse(q.options) : q.options || [];
  const answered = Object.keys(answers).length;
  const progressPct = (answered / questions.length) * 100;
  const timeWarning = timeLeft < 300 && timeLeft > 0;

  return (
    <>
      {/* Premium Exam Toolbar */}
      <div className="sticky top-0 z-30 border-b border-border/30 bg-background/70 backdrop-blur-2xl">
        <div className="container mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-mono font-bold transition-all ${
              timeWarning
                ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20 animate-pulse"
                : "bg-muted/40 ring-1 ring-border/30"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-1.5 ring-1 ring-border/20">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground">
                {answered}/{questions.length} answered
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground sm:hidden">
              {answered}/{questions.length}
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={onSubmit}
              disabled={submitting}
              className="gap-1.5 rounded-xl text-xs font-bold shadow-sm"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-border/20">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-6">
        {/* Question navigator pills */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-1.5 min-w-max">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${
                  i === currentQ
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-110"
                    : answers[i]
                    ? "bg-primary/12 text-primary ring-1 ring-primary/15"
                    : flagged.has(i)
                    ? "bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/25"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/60 ring-1 ring-border/10"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl border border-border/40 bg-card p-6 md:p-8 shadow-[var(--stem-card-shadow)]">
              {/* Meta */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/10">
                    {q.topic}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">Q{currentQ + 1}</span>
                  <span className="rounded-lg bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border/20">
                    D{q.difficulty}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setFlagged((prev: Set<number>) => {
                      const next = new Set(prev);
                      if (next.has(currentQ)) next.delete(currentQ);
                      else next.add(currentQ);
                      return next;
                    })
                  }
                  className={`rounded-xl p-2.5 transition-all ${
                    flagged.has(currentQ)
                      ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  title="Flag for review"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>

              {/* Question text */}
              <h2 className="mb-7 text-base font-semibold leading-relaxed md:text-lg">{q.question_text}</h2>

              {/* Options */}
              {parsedOptions.length > 0 && (
                <div className="mb-7 space-y-3">
                  {parsedOptions.map((option: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = answers[currentQ] === option;
                    return (
                      <motion.button
                        key={option}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setAnswers((prev: Record<number, string>) => ({
                            ...prev,
                            [currentQ]: option,
                          }))
                        }
                        className={`flex w-full items-center gap-3.5 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/[0.04] shadow-sm shadow-primary/10 ring-1 ring-primary/10"
                            : "border-border/30 bg-muted/15 hover:border-primary/20 hover:bg-muted/30"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "bg-muted/60 text-muted-foreground ring-1 ring-border/20"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm font-medium">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ((prev: number) => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                  className="gap-1.5 rounded-xl border-border/40"
                >
                  <ChevronLeft className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-xs font-bold text-muted-foreground">
                  {currentQ + 1} of {questions.length}
                </span>
                <Button
                  onClick={() =>
                    setCurrentQ((prev: number) => Math.min(questions.length - 1, prev + 1))
                  }
                  disabled={currentQ === questions.length - 1}
                  className="gap-1.5 rounded-xl"
                >
                  <span className="hidden sm:inline">Next</span>{" "}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
