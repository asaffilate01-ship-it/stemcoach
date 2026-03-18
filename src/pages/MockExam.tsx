import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Flag, BookOpen, Award, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Trophy, Zap, Target, Sparkles, BarChart3 } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmitExamRef = useCallback(() => {
    handleSubmitExam();
  }, [questions, answers, user, submitting, examSubject]);

  useEffect(() => {
    if (state !== "active") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExamRef();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, handleSubmitExamRef]);

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
        toast({ title: "No questions found", description: "No questions available for this subject/curriculum combination yet. Try a different selection.", variant: "destructive" });
        setState("setup");
        return;
      }

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
    if (submitting) return;
    setSubmitting(true);
    setState("review");

    if (!user) { setSubmitting(false); return; }

    const totalScore = questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0),
      0
    );
    const percent = Math.round((totalScore / questions.length) * 100);

    // Record attempts in batches — preserve original index for answer lookup
    const insertData = questions
      .map((q, i) => ({ q, i }))
      .filter(({ i }) => answers[i] !== undefined)
      .map(({ q, i }) => ({
        user_id: user.id,
        question_id: q.id,
        answer: answers[i],
        correct: answers[i] === q.correct_answer,
      }));
    
    if (insertData.length > 0) {
      await supabase.from("attempts").insert(insertData);
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
    setSubmitting(false);
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0),
    0
  );
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const answered = Object.keys(answers).length;
  const subjectInfo = subjects.find(s => s.id === examSubject);
  const timeWarning = timeLeft < 300 && timeLeft > 0;

  // ── Setup ──
  if (state === "setup" || state === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageTransition>
          <main className="container mx-auto max-w-2xl px-4 py-12 md:py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="stem-heading mb-2 text-3xl md:text-4xl">Mock Exam</h1>
                <p className="text-muted-foreground">
                  Simulate real exam conditions with timed questions from the database
                </p>
              </div>

              <div className="stem-card rounded-2xl p-6 md:p-8">
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Subject</label>
                      <select
                        value={examSubject}
                        onChange={(e) => setExamSubject(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Curriculum</label>
                      <select
                        value={examCurriculum}
                        onChange={(e) => setExamCurriculum(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {curricula.map((c) => (
                          <option key={c.id} value={c.id}>{c.country} {c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Questions</label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {[10, 20, 30, 40, 50].map((n) => (
                          <option key={n} value={n}>{n} questions</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {[30, 45, 60, 90, 120].map((n) => (
                          <option key={n} value={n}>{n} minutes</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview stats */}
                  <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/50 p-5">
                    {[
                      { label: "Questions", value: questionCount, icon: Target },
                      { label: "Duration", value: `${duration}m`, icon: Clock },
                      { label: "Subject", value: subjectInfo?.name?.slice(0, 8) || "", icon: BookOpen },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <stat.icon className="mx-auto mb-1.5 h-4 w-4 text-primary/60" />
                        <div className="text-lg font-bold tracking-tight">{stat.value}</div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={startExam}
                    size="lg"
                    className="w-full gap-2 rounded-xl text-base shadow-lg shadow-primary/20"
                    disabled={state === "loading"}
                  >
                    {state === "loading" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Loading Questions…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Start Exam</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </main>
        </PageTransition>
      </div>
    );
  }

  // ── Review ──
  if (state === "review") {
    const gradeColor = percent >= 80 ? "text-success" : percent >= 60 ? "text-primary" : "text-destructive";
    const gradeLabel = percent >= 80 ? "Excellent!" : percent >= 60 ? "Good effort!" : "Needs improvement";
    const gradeEmoji = percent >= 80 ? "🏆" : percent >= 60 ? "📜" : "📚";

    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageTransition>
          <main className="container mx-auto max-w-3xl px-4 py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="stem-card rounded-2xl p-8 md:p-12 text-center">
                <div className="mb-6 text-6xl">{gradeEmoji}</div>
                <h1 className="stem-heading mb-2 text-3xl md:text-4xl">Exam Complete</h1>
                <p className={`mb-8 text-lg font-medium ${gradeColor}`}>{gradeLabel}</p>

                {/* Score ring */}
                <div className="mx-auto mb-8 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-extrabold tracking-tight">{score}<span className="text-2xl text-muted-foreground">/{questions.length}</span></div>
                    <div className="mt-1 text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="h-16 w-px bg-border" />
                  <div className="text-center">
                    <div className={`text-5xl font-extrabold tracking-tight ${gradeColor}`}>{percent}%</div>
                    <div className="mt-1 text-sm text-muted-foreground">Accuracy</div>
                  </div>
                </div>

                {/* Stats breakdown */}
                <div className="mb-8 grid grid-cols-3 gap-4 rounded-2xl bg-muted/50 p-5">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{answered}</div>
                    <div className="text-xs text-muted-foreground">Answered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-warning">{flagged.size}</div>
                    <div className="text-xs text-muted-foreground">Flagged</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-muted-foreground">{questions.length - answered}</div>
                    <div className="text-xs text-muted-foreground">Skipped</div>
                  </div>
                </div>

                {percent >= 60 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-4"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                      <Award className="h-4 w-4" />
                      Certificate earned — view it in your profile
                    </div>
                  </motion.div>
                )}

                <Button variant="outline" className="mb-6 gap-2 rounded-xl" onClick={() => setShowReviewDetail(!showReviewDetail)}>
                  <BarChart3 className="h-4 w-4" />
                  {showReviewDetail ? "Hide" : "Review"} Answers
                </Button>

                <AnimatePresence>
                  {showReviewDetail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 space-y-3 overflow-hidden text-left"
                    >
                      {questions.map((q, i) => {
                        const correct = answers[i] === q.correct_answer;
                        return (
                          <div key={q.id} className={`rounded-xl border-2 p-4 ${correct ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"}`}>
                            <div className="mb-2 flex items-start gap-2">
                              {correct ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                              ) : (
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                              )}
                              <div className="text-sm font-medium">Q{i + 1}: {q.question_text}</div>
                            </div>
                            {!correct && (
                              <div className="ml-6 mb-2 text-xs text-muted-foreground">
                                Your answer: <span className="font-medium text-destructive">{answers[i] || "—"}</span> · Correct: <span className="font-medium text-success">{q.correct_answer}</span>
                              </div>
                            )}
                            <div className="ml-6 text-xs leading-relaxed text-muted-foreground">{q.explanation}</div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center gap-3">
                  <Button onClick={() => navigate("/certificates")} variant="outline" className="gap-2 rounded-xl">
                    <Award className="h-4 w-4" /> Certificates
                  </Button>
                  <Button onClick={() => { setState("setup"); setQuestions([]); setShowReviewDetail(false); }} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                    <Zap className="h-4 w-4" /> New Exam
                  </Button>
                </div>
              </div>
            </motion.div>
          </main>
        </PageTransition>
      </div>
    );
  }

  // ── Active Exam ──
  const q = questions[currentQ];
  const parsedOptions: string[] = typeof q.options === "string" ? JSON.parse(q.options) : (q.options || []);
  const progressPct = ((answered) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Exam toolbar */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
          <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-mono font-bold transition-colors ${
            timeWarning ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted/60"
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {answered}/{questions.length} answered
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleSubmitExam}
              disabled={submitting}
              className="gap-1.5 rounded-xl text-xs"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-border/30">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-6">
        {/* Question navigator pills */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                i === currentQ
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : answers[i]
                  ? "bg-primary/15 text-primary"
                  : flagged.has(i)
                  ? "bg-warning/15 text-warning ring-1 ring-warning/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="stem-card rounded-2xl p-6 md:p-8">
              {/* Meta */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{q.topic}</span>
                  <span className="text-xs font-medium text-muted-foreground">Q{currentQ + 1}</span>
                  <span className="rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">D{q.difficulty}</span>
                </div>
                <button
                  onClick={() => setFlagged((prev) => {
                    const next = new Set(prev);
                    next.has(currentQ) ? next.delete(currentQ) : next.add(currentQ);
                    return next;
                  })}
                  className={`rounded-lg p-2 transition-colors ${flagged.has(currentQ) ? "bg-warning/10 text-warning" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  title="Flag for review"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>

              {/* Question */}
              <h2 className="mb-6 text-base font-semibold leading-relaxed md:text-lg">{q.question_text}</h2>

              {/* Options */}
              {parsedOptions.length > 0 && (
                <div className="mb-6 space-y-2.5">
                  {parsedOptions.map((option: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = answers[currentQ] === option;
                    return (
                      <button
                        key={option}
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: option }))}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                            : "border-transparent bg-muted/30 hover:border-primary/20 hover:bg-muted/50"
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {letter}
                        </span>
                        <span className="text-sm">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                  className="gap-1.5 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-xs font-medium text-muted-foreground">
                  {currentQ + 1} of {questions.length}
                </span>
                <Button
                  onClick={() => setCurrentQ((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQ === questions.length - 1}
                  className="gap-1.5 rounded-xl"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
