import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Flag, BookOpen, Award, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Trophy, Zap, Target, Sparkles, BarChart3, Search, Filter, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { subjects, curricula } from "@/data/questions";
import { mockExamTemplates, examBoardGroups, type MockExamTemplate } from "@/data/mockExamTemplates";

type ExamState = "browse" | "setup" | "loading" | "active" | "review";

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
  useDocumentTitle("Mock Exam");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<ExamState>("browse");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [showReviewDetail, setShowReviewDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MockExamTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBoard, setFilterBoard] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);

  // Setup options (custom exam fallback)
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
    const subj = selectedTemplate ? selectedTemplate.subject : examSubject;
    const curr = selectedTemplate ? selectedTemplate.curriculum : examCurriculum;
    const qCount = selectedTemplate ? selectedTemplate.questionCount : questionCount;
    const dur = selectedTemplate ? selectedTemplate.durationMinutes : duration;
    const board = selectedTemplate?.board;

    setState("loading");
    try {
      let query = supabase
        .from("questions")
        .select("id, question_text, options, correct_answer, topic, subject, difficulty, points, explanation, worked_solution")
        .eq("subject", subj)
        .eq("curriculum", curr)
        .eq("question_type", "mcq")
        .limit(qCount);

      if (board) {
        query = query.contains("boards", [board]);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "No questions found", description: "No questions available for this exam yet. Try a different selection.", variant: "destructive" });
        setState(selectedTemplate ? "browse" : "setup");
        return;
      }

      const shuffled = data.sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setTimeLeft(dur * 60);
      setAnswers({});
      setFlagged(new Set());
      setCurrentQ(0);
      setState("active");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setState(selectedTemplate ? "browse" : "setup");
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

    if (percent >= 60) {
      const examName = selectedTemplate?.name || subjects.find(s => s.id === examSubject)?.name || examSubject;
      await supabase.from("certificates").insert({
        user_id: user.id,
        title: `${examName} — ${percent}%`,
        subject: selectedTemplate?.subject || examSubject,
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
  const timeWarning = timeLeft < 300 && timeLeft > 0;

  // Filter templates
  const filteredTemplates = mockExamTemplates.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.board.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    }
    if (filterBoard && t.board !== filterBoard) return false;
    if (filterSubject && t.subject !== filterSubject) return false;
    return true;
  });

  // Group filtered templates by curriculum label
  const groupedTemplates = examBoardGroups
    .map(g => ({
      ...g,
      templates: filteredTemplates.filter(t => {
        // Match by curriculum or by board membership
        return g.boards.includes(t.board);
      }),
    }))
    .filter(g => g.templates.length > 0);

  // ── Browse Templates ──
  if (state === "browse") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <PageTransition>
          <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 pb-24 md:py-12">
            {/* Hero */}
            <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(258,60%,52%)] px-6 py-10 text-primary-foreground md:px-12 md:py-14">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="relative z-10">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Mock Exams</span>
                </div>
                <h1 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                  Real exam simulations
                </h1>
                <p className="max-w-lg text-sm leading-relaxed opacity-75 md:text-base">
                  Practice with exam papers modelled on real boards — AQA, Edexcel, OCR, Cambridge, IB, AP, CBSE, JEE, NEET, and more.
                </p>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exams (e.g. AQA Physics, AP Biology, JEE Main...)"
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <select
                  value={filterSubject || ""}
                  onChange={(e) => setFilterSubject(e.target.value || null)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium transition-colors focus:border-primary focus:outline-none"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs whitespace-nowrap"
                  onClick={() => { setState("setup"); setSelectedTemplate(null); }}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Custom Exam
                </Button>
              </div>
            </div>

            {/* Template Groups */}
            <div className="space-y-10">
              {groupedTemplates.map((group) => (
                <div key={group.label}>
                  <h2 className="mb-4 text-lg font-bold tracking-tight md:text-xl">{group.label}</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.templates.map((template, i) => (
                      <motion.button
                        key={template.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        onClick={() => { setSelectedTemplate(template); setState("setup"); }}
                        className="group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25"
                      >
                        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${template.color}, ${template.color}80)` }} />
                        <div className="p-4 md:p-5">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: `${template.color}15` }}>
                              {template.icon}
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary">
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                          <h3 className="mb-1 text-sm font-bold leading-tight">{template.name}</h3>
                          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">{template.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {template.questionCount} Qs
                            </span>
                            <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {template.durationMinutes} min
                            </span>
                            <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {template.board}
                            </span>
                            {template.tier && (
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                {template.tier}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}

              {groupedTemplates.length === 0 && (
                <div className="py-20 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">No exams found</h3>
                  <p className="text-sm text-muted-foreground">Try a different search or clear your filters.</p>
                </div>
              )}
            </div>
          </main>
        </PageTransition>
        <Footer />
      </div>
    );
  }

  // ── Setup (Template or Custom) ──
  if (state === "setup" || state === "loading") {
    const subjectInfo = selectedTemplate
      ? subjects.find(s => s.id === selectedTemplate.subject)
      : subjects.find(s => s.id === examSubject);

    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageTransition>
          <main className="container mx-auto max-w-2xl px-4 py-12 md:py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setState("browse"); setSelectedTemplate(null); }}
                className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Exams
              </Button>

              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  {selectedTemplate ? (
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                  ) : (
                    <Clock className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h1 className="stem-heading mb-2 text-2xl md:text-3xl">
                  {selectedTemplate ? selectedTemplate.name : "Custom Mock Exam"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate
                    ? `${selectedTemplate.board} · ${selectedTemplate.paper} · ${selectedTemplate.description}`
                    : "Configure your own exam from the question bank"
                  }
                </p>
              </div>

              <div className="stem-card rounded-2xl p-6 md:p-8">
                <div className="space-y-5">
                  {selectedTemplate ? (
                    /* Template preview */
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-muted/50 p-5">
                      {[
                        { label: "Questions", value: selectedTemplate.questionCount, icon: Target },
                        { label: "Duration", value: `${selectedTemplate.durationMinutes}m`, icon: Clock },
                        { label: "Marks", value: selectedTemplate.totalMarks, icon: Award },
                        { label: "Board", value: selectedTemplate.board.split(" ")[0], icon: BookOpen },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center">
                          <stat.icon className="mx-auto mb-1.5 h-4 w-4 text-primary/60" />
                          <div className="text-lg font-bold tracking-tight">{stat.value}</div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Custom exam config */
                    <>
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
                            {[30, 45, 60, 90, 120, 150, 180].map((n) => (
                              <option key={n} value={n}>{n} minutes</option>
                            ))}
                          </select>
                        </div>
                      </div>
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
                    </>
                  )}

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
    const gradeColor = percent >= 80 ? "text-[hsl(var(--success))]" : percent >= 60 ? "text-primary" : "text-destructive";
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
                <p className={`mb-2 text-lg font-medium ${gradeColor}`}>{gradeLabel}</p>
                {selectedTemplate && (
                  <p className="mb-6 text-sm text-muted-foreground">{selectedTemplate.name}</p>
                )}

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
                    <div className="text-lg font-bold text-amber-600">{flagged.size}</div>
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
                          <div key={q.id} className={`rounded-xl border-2 p-4 ${correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"}`}>
                            <div className="mb-2 flex items-start gap-2">
                              {correct ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                              )}
                              <div className="text-sm font-medium">Q{i + 1}: {q.question_text}</div>
                            </div>
                            {!correct && (
                              <div className="ml-6 mb-2 text-xs text-muted-foreground">
                                Your answer: <span className="font-medium text-destructive">{answers[i] || "—"}</span> · Correct: <span className="font-medium text-emerald-600">{q.correct_answer}</span>
                              </div>
                            )}
                            <div className="ml-6 text-xs leading-relaxed text-muted-foreground">{q.explanation}</div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => navigate("/certificates")} variant="outline" className="gap-2 rounded-xl">
                    <Award className="h-4 w-4" /> Certificates
                  </Button>
                  <Button onClick={() => { setState("browse"); setQuestions([]); setShowReviewDetail(false); setSelectedTemplate(null); }} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                    <Zap className="h-4 w-4" /> Browse Exams
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
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              {answered}/{questions.length} answered
            </span>
            <span className="text-xs font-medium text-muted-foreground sm:hidden">
              {answered}/{questions.length}
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
        {/* Question navigator pills — scrollable on mobile */}
        <div className="mb-5 overflow-x-auto pb-2">
          <div className="flex gap-1.5 min-w-max">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                  i === currentQ
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : answers[i]
                    ? "bg-primary/15 text-primary"
                    : flagged.has(i)
                    ? "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
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
            <div className="stem-card rounded-2xl p-6 md:p-8">
              {/* Meta */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
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
                  className={`rounded-lg p-2 transition-colors ${flagged.has(currentQ) ? "bg-amber-500/10 text-amber-600" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
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
                  <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-xs font-medium text-muted-foreground">
                  {currentQ + 1} of {questions.length}
                </span>
                <Button
                  onClick={() => setCurrentQ((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQ === questions.length - 1}
                  className="gap-1.5 rounded-xl"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
