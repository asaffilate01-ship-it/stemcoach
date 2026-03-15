import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Flag, BookOpen, Award, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { subjects, curricula } from "@/data/questions";

type ExamState = "setup" | "loading" | "active" | "review";

interface ExamQuestion {
  id: string;
  question_text: string;
  options: any;
  correct_answer: string;
  topic: string;
  subject: string;
  difficulty: number;
  points: number;
  explanation: string;
  worked_solution: string;
}

export default function MockExam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<ExamState>("setup");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [showReviewDetail, setShowReviewDetail] = useState(false);

  // Setup options
  const [examSubject, setExamSubject] = useState("physics");
  const [examCurriculum, setExamCurriculum] = useState("uk-alevel");
  const [questionCount, setQuestionCount] = useState(30);
  const [duration, setDuration] = useState(60);

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

  const startExam = async () => {
    setState("loading");
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("id, question_text, options, correct_answer, topic, subject, difficulty, points, explanation, worked_solution")
        .eq("subject", examSubject)
        .eq("curriculum", examCurriculum)
        .eq("question_type", "mcq")
        .limit(questionCount);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "No questions found", description: "No questions available for this subject/curriculum. Try generating some first.", variant: "destructive" });
        setState("setup");
        return;
      }

      // Shuffle
      const shuffled = data.sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setTimeLeft(duration * 60);
      setAnswers({});
      setFlagged(new Set());
      setCurrentQ(0);
      setState("active");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setState("setup");
    }
  };

  const handleSubmitExam = async () => {
    setState("review");

    if (!user) return;

    // Calculate score
    const totalScore = questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0),
      0
    );
    const percent = Math.round((totalScore / questions.length) * 100);

    // Record attempts
    for (let i = 0; i < questions.length; i++) {
      if (answers[i]) {
        await supabase.from("attempts").insert({
          user_id: user.id,
          question_id: questions[i].id,
          answer: answers[i],
          correct: answers[i] === questions[i].correct_answer,
        });
      }
    }

    // Generate certificate if score >= 60%
    if (percent >= 60) {
      const subjectName = subjects.find(s => s.id === examSubject)?.name || examSubject;
      await supabase.from("certificates").insert({
        user_id: user.id,
        title: `Mock Exam: ${subjectName} — ${percent}%`,
        subject: subjectName,
        achievement_type: "mock_exam",
        score_percent: percent,
      });
      toast({
        title: "🏆 Certificate earned!",
        description: `You scored ${percent}% — a certificate has been added to your profile.`,
      });
    }
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0),
    0
  );
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  if (state === "setup" || state === "loading") {
    const subjectInfo = subjects.find(s => s.id === examSubject);
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto max-w-2xl px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="stem-card rounded-xl p-8">
              <Clock className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h1 className="stem-heading mb-2 text-center text-3xl">Mock Exam</h1>
              <p className="mb-6 text-center text-muted-foreground">
                Simulate a real exam with questions from the database.
              </p>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <select
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Curriculum</label>
                    <select
                      value={examCurriculum}
                      onChange={(e) => setExamCurriculum(e.target.value)}
                      className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {curricula.map((c) => (
                        <option key={c.id} value={c.id}>{c.country} {c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Questions</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {[10, 20, 30, 40, 50].map((n) => (
                        <option key={n} value={n}>{n} questions</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {[30, 45, 60, 90, 120].map((n) => (
                        <option key={n} value={n}>{n} minutes</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4 text-center text-sm">
                  <div>
                    <div className="font-semibold">{questionCount}</div>
                    <div className="stem-label">Questions</div>
                  </div>
                  <div>
                    <div className="font-semibold">{duration} min</div>
                    <div className="stem-label">Duration</div>
                  </div>
                  <div>
                    <div className="font-semibold">{subjectInfo?.name}</div>
                    <div className="stem-label">Subject</div>
                  </div>
                </div>

                <Button
                  onClick={startExam}
                  size="lg"
                  className="w-full rounded"
                  disabled={state === "loading"}
                >
                  {state === "loading" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Questions...</>
                  ) : (
                    "Start Exam"
                  )}
                </Button>
              </div>
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
        <main className="container mx-auto max-w-2xl px-4 py-16">
          <div className="stem-card rounded-xl p-8 text-center">
            {percent >= 60 ? (
              <Award className="mx-auto mb-4 h-10 w-10 text-primary" />
            ) : (
              <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            )}
            <h1 className="stem-heading mb-2 text-3xl">Exam Complete</h1>
            <div className="my-6 text-5xl font-bold tracking-tight">
              {score}/{questions.length}
            </div>
            <p className="mb-2 text-lg text-muted-foreground">{percent}% accuracy</p>
            {percent >= 80 && <p className="mb-4 text-sm text-success font-medium">🏆 Excellent! Certificate earned.</p>}
            {percent >= 60 && percent < 80 && <p className="mb-4 text-sm text-primary font-medium">📜 Certificate earned! Keep improving.</p>}
            {percent < 60 && <p className="mb-4 text-sm text-muted-foreground">More practice needed — score 60%+ to earn a certificate.</p>}

            <Button variant="outline" className="mb-4 rounded" onClick={() => setShowReviewDetail(!showReviewDetail)}>
              {showReviewDetail ? "Hide" : "Review"} Answers
            </Button>

            {showReviewDetail && (
              <div className="mt-4 space-y-3 text-left">
                {questions.map((q, i) => {
                  const correct = answers[i] === q.correct_answer;
                  return (
                    <div key={q.id} className={`rounded-lg border p-3 ${correct ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                      <div className="mb-1 text-sm font-medium">Q{i + 1}: {q.question_text}</div>
                      {!correct && (
                        <div className="text-xs text-muted-foreground">
                          Your answer: {answers[i] || "—"} · Correct: {q.correct_answer}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">{q.explanation}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => navigate("/certificates")} variant="outline" className="rounded gap-1.5">
                <Award className="h-4 w-4" /> Certificates
              </Button>
              <Button onClick={() => { setState("setup"); setQuestions([]); }} className="rounded">
                New Exam
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Active exam
  const q = questions[currentQ];
  const parsedOptions: string[] = typeof q.options === "string" ? JSON.parse(q.options) : (q.options || []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-6">
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
            <Button size="sm" variant="destructive" onClick={handleSubmitExam} className="rounded">
              Submit Exam
            </Button>
          </div>
        </div>

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

        <div className="stem-card rounded-xl p-6 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{q.topic}</span>
              <span className="stem-label">Q{currentQ + 1}</span>
              <span className="stem-label">D{q.difficulty}</span>
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

          <h2 className="mb-6 text-lg font-semibold leading-relaxed">{q.question_text}</h2>

          {parsedOptions.length > 0 && (
            <div className="mb-6 space-y-2">
              {parsedOptions.map((option: string, i: number) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQ] === option;
                return (
                  <button
                    key={option}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: option }))}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">{letter}</span>
                    <span className="text-sm">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))} disabled={currentQ === 0} className="rounded">
              Previous
            </Button>
            <Button onClick={() => setCurrentQ((prev) => Math.min(questions.length - 1, prev + 1))} disabled={currentQ === questions.length - 1} className="rounded">
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
