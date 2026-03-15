import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { sampleQuestions } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, Flag } from "lucide-react";

type ExamState = "setup" | "active" | "review";

export default function MockExam() {
  const navigate = useNavigate();
  const [state, setState] = useState<ExamState>("setup");
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const questions = sampleQuestions; // use all sample questions for the mock

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (state !== "active") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setState("review");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const handleSubmitExam = () => setState("review");

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0),
    0
  );

  if (state === "setup") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="stem-card rounded-xl p-8">
              <Clock className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h1 className="stem-heading mb-2 text-3xl">Mock Exam</h1>
              <p className="mb-6 text-muted-foreground">
                Simulate a real exam environment with {questions.length} questions and a 90-minute timer.
              </p>
              <div className="mb-6 grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <div className="font-semibold">{questions.length}</div>
                  <div className="stem-label">Questions</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="font-semibold">90 min</div>
                  <div className="stem-label">Duration</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="font-semibold">Mixed</div>
                  <div className="stem-label">Subjects</div>
                </div>
              </div>
              <Button onClick={() => setState("active")} size="lg" className="rounded px-8">
                Start Exam
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (state === "review") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="stem-card rounded-xl p-8">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-success" />
            <h1 className="stem-heading mb-2 text-3xl">Exam Complete</h1>
            <div className="my-6 text-5xl font-bold tracking-tight">
              {score}/{questions.length}
            </div>
            <p className="mb-2 text-lg text-muted-foreground">
              {Math.round((score / questions.length) * 100)}% accuracy
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              {score >= questions.length * 0.8
                ? "Excellent performance! You're exam-ready."
                : score >= questions.length * 0.6
                ? "Good effort. Focus on your weak areas."
                : "More practice needed. Check the tuition tips for each question."}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded">
                View Dashboard
              </Button>
              <Button onClick={() => navigate("/subjects")} className="rounded">
                Practice More
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-6">
        {/* Exam Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold ${
            timeLeft < 300 ? "bg-destructive/10 text-destructive" : "bg-muted"
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-2">
            <span className="stem-label">
              {Object.keys(answers).length}/{questions.length} answered
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleSubmitExam}
              className="rounded"
            >
              Submit Exam
            </Button>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-all ${
                i === currentQ
                  ? "bg-primary text-primary-foreground"
                  : answers[i]
                  ? "bg-primary/20 text-primary"
                  : flagged.has(i)
                  ? "bg-warning/20 text-warning"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        <div className="stem-card rounded-xl p-6 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {q.topic}
              </span>
              <span className="stem-label">Q{currentQ + 1}</span>
            </div>
            <button
              onClick={() => setFlagged((prev) => {
                const next = new Set(prev);
                next.has(currentQ) ? next.delete(currentQ) : next.add(currentQ);
                return next;
              })}
              className={`rounded p-1.5 ${flagged.has(currentQ) ? "text-warning" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>

          <h2 className="mb-6 text-lg font-semibold leading-relaxed">{q.text}</h2>

          {q.options && (
            <div className="mb-6 space-y-2">
              {q.options.map((option, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQ] === option;
                return (
                  <button
                    key={option}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: option }))}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-primary/20"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">
                      {letter}
                    </span>
                    <span className="text-sm">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
              disabled={currentQ === 0}
              className="rounded"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentQ((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQ === questions.length - 1}
              className="rounded"
            >
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
