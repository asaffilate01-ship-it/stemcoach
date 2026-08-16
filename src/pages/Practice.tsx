import { useState, useEffect, useMemo, useCallback } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { subjects, type Question as LocalQuestion } from "@/data/questions";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Lightbulb, BookOpen, MessageSquare, Loader2, Lock, CreditCard, Trophy, Zap, ChevronLeft, Timer, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGameStats } from "@/hooks/useGameStats";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { StreakBar } from "@/components/gamification/StreakBar";
import { XPPopup } from "@/components/gamification/XPPopup";
import { BadgeUnlock } from "@/components/gamification/BadgeUnlock";
import { CorrectAnimation } from "@/components/gamification/CorrectAnimation";
import { QuizTimer } from "@/components/gamification/QuizTimer";
import { MascotReaction } from "@/components/gamification/MascotReaction";
import ReactMarkdown from "react-markdown";
import { getCachedQuestions, cacheQuestions } from "@/lib/questionCache";
import { getMascot } from "@/lib/mascots";
import { useTranslation } from "react-i18next";

interface DBQuestion {
  id: string;
  question_text: string;
  options: any;
  correct_answer?: string;
  correct_answers?: string[] | null;
  allow_multiple_answers: boolean;
  explanation?: string;
  worked_solution?: string;
  tuition_tips?: string[];
  exam_tip?: string;
  formula: string | null;
  topic: string;
  subtopic: string;
  subject: string;
  difficulty: number;
  points: number;
  question_type: string;
  boards: string[];
  mark_scheme?: string | null;
  model_answer?: string | null;
  max_marks: number | null;
}

export default function Practice() {
  const { t } = useTranslation();
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, recordAnswer, newBadges, dismissBadge, fetchStats } = useGameStats();
  const { isFree, canPractice, remainingToday, incrementCount, FREE_DAILY_LIMIT, canUseAITutor: canUseCoaching, canPracticeSubjectFree, getFreeRemainingForSubject } = useSubscriptionGate();
  const subject = subjects.find((s) => s.id === subjectId);
  useDocumentTitle(subject ? t("practice.practiceSubject", { subject: subject.name }) : t("practice.title"));

  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [essayAnswer, setEssayAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiGrading, setAiGrading] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [showCorrectAnim, setShowCorrectAnim] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showMascotReaction, setShowMascotReaction] = useState(false);
  const [mascotCorrect, setMascotCorrect] = useState<boolean | null>(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timeTaken, setTimeTaken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // Server-returned answer data (only available after submission)
  const [revealedAnswer, setRevealedAnswer] = useState<any>(null);

  useEffect(() => {
    if (!subjectId) return;
    const loadQuestions = async () => {
      setDbLoading(true);

      // Try network first, fall back to IndexedDB cache for offline support
      try {
        const { data } = await supabase
          .from("questions_safe" as any)
          .select("*")
          .eq("subject", subjectId)
          .limit(50);
        if (data && (data as any[]).length > 0) {
          const shuffled = (data as unknown as DBQuestion[]).sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
          // Cache for offline use
          cacheQuestions(subjectId, shuffled);
        } else {
          // No data from network — try cache
          const cached = await getCachedQuestions(subjectId);
          if (cached && cached.length > 0) {
            setQuestions(cached as DBQuestion[]);
            toast({ title: t("practice.offlineMode"), description: t("practice.showingCached") });
          }
        }
      } catch {
        // Network error — use cached questions
        const cached = await getCachedQuestions(subjectId);
        if (cached && cached.length > 0) {
          setQuestions(cached as DBQuestion[]);
          toast({ title: t("practice.youreOffline"), description: t("practice.practicingCached") });
        }
      }

      setDbLoading(false);
    };
    loadQuestions();
  }, [subjectId]);

  // Keyboard shortcuts: 1-4 for options, Enter to submit/next, → for next
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (questions.length === 0 || dbLoading) return;
      const q = questions[currentIndex];
      if (!q) return;
      const isEssayQ = q.question_type === "essay";
      const opts: string[] = typeof q.options === "string" ? JSON.parse(q.options) : (Array.isArray(q.options) ? q.options : []);

      // Don't intercept keys when typing in textarea
      if (isEssayQ && document.activeElement?.tagName === "TEXTAREA") return;

      if (!showFeedback && !isEssayQ && opts.length > 0) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= opts.length) {
          e.preventDefault();
          setSelectedAnswer(opts[num - 1]);
          return;
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (showFeedback) {
          handleNext();
        } else if (selectedAnswer || selectedAnswers.size > 0 || (isEssayQ && essayAnswer.trim())) {
          handleSubmit();
        }
      }

      if ((e.key === "ArrowRight" || e.key === "n") && showFeedback) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [questions, currentIndex, showFeedback, selectedAnswer, selectedAnswers, essayAnswer, dbLoading]);

  // Empty / loading states
  if (!subject) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">{t("practice.subjectNotFound")}</h2>
            <p className="mb-8 text-muted-foreground">{t("practice.subjectNotFoundDesc")}</p>
            <Button onClick={() => navigate("/subjects")} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> {t("practice.backToSubjects")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (dbLoading) {
    const mascot = getMascot(subjectId || "");
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-16 w-16 overflow-hidden rounded-2xl shadow-md"
          >
            <img src={mascot.image} alt={mascot.name} className="h-full w-full object-cover" />
          </motion.div>
          <p className="text-sm text-muted-foreground">{mascot.name} {t("practice.loadingQuestions")}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    const mascot = getMascot(subjectId || "");
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-6 h-16 w-16 overflow-hidden rounded-2xl shadow-md">
              <img src={mascot.image} alt={mascot.name} className="h-full w-full object-cover" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">{t("practice.noQuestionsYet")}</h2>
            <p className="mb-8 text-muted-foreground">{mascot.name} {t("practice.preparingQuestions")} {subject.name}. {t("practice.checkBackSoon")}</p>
            <Button onClick={() => navigate("/subjects")} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to Subjects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isMultiSelect = question.allow_multiple_answers || question.question_type === "multi-select";
  const isEssay = question.question_type === "essay";
  const parsedOptions: string[] = typeof question.options === "string"
    ? JSON.parse(question.options)
    : (Array.isArray(question.options) ? question.options : []);
  const isCorrect = revealedAnswer ? revealedAnswer.correct : false;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  const showXPPopup = (xp: number) => {
    setXpGained(xp);
    setShowXP(true);
    setTimeout(() => setShowXP(false), 1500);
  };

  const handleSubmit = async () => {
    if (!canPractice && !canPracticeSubjectFree(subjectId || "")) {
      toast({ title: t("practice.questionLimitReached"), description: t("practice.purchaseToContinue"), variant: "destructive" });
      return;
    }
    if (isEssay) {
      if (!essayAnswer.trim()) return;
      setLoadingAI(true);
      setTimerRunning(false);
      try {
        const { data, error } = await supabase.functions.invoke("ai-tutor", {
          body: {
            action: "grade-essay",
            question_id: question.id,
            question_text: question.question_text,
            student_answer: essayAnswer,
            max_marks: question.max_marks || question.points,
            subject: question.subject,
            topic: question.topic,
          },
        });
        if (error) throw error;
        setAiGrading(data.grading);
        setShowFeedback(true);
        const passed = data.grading?.score >= data.grading?.max_marks * 0.6;
        setLastCorrect(passed);
        setShowCorrectAnim(true);
        setMascotCorrect(passed);
        setShowMascotReaction(true);
        setTimeout(() => setShowCorrectAnim(false), 2000);
        setTimeout(() => setShowMascotReaction(false), 3000);
        setScore((prev) => ({ correct: prev.correct + (passed ? 1 : 0), total: prev.total + 1 }));
        if (user) {
          await supabase.from("attempts").insert({
            user_id: user.id, question_id: question.id,
            answer: essayAnswer.slice(0, 500), correct: passed,
            time_taken_seconds: timeTaken, ai_score: data.grading?.score,
            ai_feedback: data.grading?.feedback?.slice(0, 500),
          });
        }
        const result = await recordAnswer(passed, question.points);
        showXPPopup(result.xpGained);
        incrementCount();
      } catch (e: any) {
        toast({ title: t("practice.gradingFailed"), description: e.message, variant: "destructive" });
      } finally {
        setLoadingAI(false);
      }
      return;
    }

    if (!selectedAnswer && selectedAnswers.size === 0) return;
    setTimerRunning(false);
    setSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke("check-answer", {
        body: {
          question_id: question.id,
          answer: isMultiSelect ? undefined : selectedAnswer,
          answers: isMultiSelect ? Array.from(selectedAnswers) : undefined,
          time_taken_seconds: timeTaken,
        },
      });
      if (error) throw error;

      const correct = result.correct;
      setRevealedAnswer(result);
      setLastCorrect(correct);
      setShowFeedback(true);
      setShowCorrectAnim(true);
      setMascotCorrect(correct);
      setShowMascotReaction(true);
      setTimeout(() => setShowCorrectAnim(false), 2000);
      setTimeout(() => setShowMascotReaction(false), 3000);
      setScore((prev) => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));

      // Update local stats from server response
      if (result.stats) {
        fetchStats();
      }
      showXPPopup(result.xp_gained || 0);
      incrementCount();

      // Handle new badges
      if (result.new_badges?.length > 0) {
        // Trigger badge display through fetchStats
      }
    } catch (e: any) {
      toast({ title: t("practice.submitFailed"), description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setSelectedAnswers(new Set());
    setEssayAnswer("");
    setShowFeedback(false);
    setShowTips(false);
    setAiExplanation(null);
    setAiGrading(null);
    setTimerRunning(true);
    setTimeTaken(0);
    setShowMascotReaction(false);
    setMascotCorrect(null);
    setRevealedAnswer(null);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleAskAI = async () => {
    // Device-level cache: an explanation for a given question never changes,
    // so we only ever fetch it once per device.
    const cacheKey = `stemcoach:explain:${question.id}`;
    try {
      const local = localStorage.getItem(cacheKey);
      if (local) {
        setAiExplanation(local);
        return;
      }
    } catch { /* storage unavailable — fall through to fetch */ }

    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          action: "explain",
          question_text: question.question_text,
          correct_answer: revealedAnswer?.correct_answer || "",
          student_answer: selectedAnswer || essayAnswer || "",
          subject: question.subject,
          topic: question.topic,
          question_id: question.id,
        },
      });
      if (error) throw error;
      setAiExplanation(data.explanation);
      try { localStorage.setItem(cacheKey, data.explanation); } catch { /* quota full */ }
    } catch (e: any) {
      toast({ title: t("practice.coachingFailed"), description: e.message, variant: "destructive" });
    } finally {
      setLoadingAI(false);
    }
  };


  const toggleMultiSelect = (option: string) => {
    setSelectedAnswers((prev) => {
      const next = new Set(prev);
      next.has(option) ? next.delete(option) : next.add(option);
      return next;
    });
  };

  const difficultyLabel = question.difficulty <= 2 ? t("practice.easy") : question.difficulty <= 4 ? t("practice.medium") : t("practice.hard");
  const difficultyColor = question.difficulty <= 2 ? "text-emerald-600 bg-emerald-500/10" : question.difficulty <= 4 ? "text-amber-600 bg-amber-500/10" : "text-red-500 bg-red-500/10";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Top navigation bar */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/subjects")}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("practice.backToSubjects")}</span>
            <span className="sm:hidden">{t("common.back")}</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">{score.correct}/{score.total}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
              <QuizTimer isRunning={timerRunning} onTimeUpdate={setTimeTaken} />
            </div>
            <CorrectAnimation show={showCorrectAnim} correct={lastCorrect} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-border/30">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 py-6 md:py-10">
        {/* Quota banner */}
        {isFree && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4"
          >
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">
                {canPracticeSubjectFree(subjectId || "") 
                  ? `${getFreeRemainingForSubject(subjectId || "")} ${t("practice.freeRemaining")}`
                  : t("practice.freeTrialUsed")}
              </span>
            </div>
            <Button size="sm" onClick={() => navigate("/pricing")} className="rounded-xl text-xs">
              {t("practice.getFullAccess")}
            </Button>
          </motion.div>
        )}
        {!isFree && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 flex items-center justify-between rounded-2xl border p-4 ${
              canPractice ? "border-primary/15 bg-primary/5" : "border-destructive/20 bg-destructive/5"
            }`}
          >
            <div className="flex items-center gap-3 text-sm">
              {canPractice ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
                  <Lock className="h-4 w-4 text-destructive" />
                </div>
              )}
              <span className="font-medium">
                {canPractice
                  ? `${remainingToday} questions remaining`
                  : "Questions exhausted — top up to continue"}
              </span>
            </div>
            {!canPractice && (
              <Button size="sm" onClick={() => navigate("/pricing")} className="rounded-xl text-xs">
                Top Up
              </Button>
            )}
          </motion.div>
        )}

        {user && <div className="mb-6"><StreakBar stats={stats} /></div>}

        {/* Question counter */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {question.boards?.length > 0 && (
              <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {question.boards.slice(0, 2).join(" · ")}
              </span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Question card */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
              {/* Meta tags */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <BookOpen className="h-3 w-3" />
                  {subject.name}
                </span>
                <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">{question.topic}</span>
                {question.subtopic !== question.topic && (
                  <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">{question.subtopic}</span>
                )}
                <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${difficultyColor}`}>{difficultyLabel}</span>
                <span className="ml-auto flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  <Trophy className="h-3 w-3" />
                  {question.points} pts
                </span>
              </div>

              {/* Multi-select / essay badges */}
              {isMultiSelect && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Select all correct answers
                </div>
              )}
              {isEssay && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Extended response · STEMcoach graded
                </div>
              )}

              {/* Question text */}
              <h2 className="mb-6 text-lg font-semibold leading-relaxed md:text-xl">{question.question_text}</h2>

              {/* Formula */}
              {question.formula && (
                <div className="mb-6 rounded-xl border border-border/50 bg-muted/30 px-5 py-3 font-mono text-sm">
                  {question.formula}
                </div>
              )}

              {/* MCQ Options */}
              {parsedOptions.length > 0 && !isEssay && (
                <div className="mb-6 space-y-2.5">
                  {parsedOptions.map((option, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = isMultiSelect ? selectedAnswers.has(option) : selectedAnswer === option;
                    const isOptionCorrect = showFeedback && option === revealedAnswer?.correct_answer;

                    let optionClasses = "border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/[0.02]";
                    if (showFeedback && isOptionCorrect) {
                      optionClasses = "border-2 border-emerald-500/40 bg-emerald-500/5";
                    } else if (showFeedback && isSelected && !isOptionCorrect) {
                      optionClasses = "border-2 border-destructive/40 bg-destructive/5";
                    } else if (isSelected && !showFeedback) {
                      optionClasses = "border-2 border-primary bg-primary/5 shadow-sm shadow-primary/10";
                    }

                    return (
                      <motion.button
                        key={option}
                        whileHover={!showFeedback ? { scale: 1.005 } : {}}
                        whileTap={!showFeedback ? { scale: 0.995 } : {}}
                        onClick={() => {
                          if (showFeedback) return;
                          isMultiSelect ? toggleMultiSelect(option) : setSelectedAnswer(option);
                        }}
                        disabled={showFeedback}
                        className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 ${optionClasses}`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          isSelected && !showFeedback
                            ? "bg-primary text-primary-foreground"
                            : showFeedback && isOptionCorrect
                            ? "bg-emerald-500 text-white"
                            : showFeedback && isSelected && !isOptionCorrect
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {letter}
                        </span>
                        <span className="flex-1 text-sm font-medium">{option}</span>
                        {showFeedback && isOptionCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        {showFeedback && isSelected && !isOptionCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Essay Input */}
              {isEssay && !showFeedback && (
                <div className="mb-6">
                  <Textarea
                    value={essayAnswer}
                    onChange={(e) => setEssayAnswer(e.target.value)}
                    placeholder={t("practice.writeAnswerPlaceholder")}
                    rows={8}
                    className="resize-none rounded-xl border-border/60 bg-muted/20 text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">{t("practice.marksAvailable", { count: question.max_marks || question.points })}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {!showFeedback ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={(!selectedAnswer && selectedAnswers.size === 0 && !essayAnswer.trim()) || loadingAI || (isFree && !canPracticeSubjectFree(subjectId || ""))}
                    className="rounded-xl px-6"
                    size="lg"
                  >
                    {loadingAI ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("practice.grading")}</>
                    ) : isFree && !canPracticeSubjectFree(subjectId || "") ? (
                      <><Lock className="mr-2 h-4 w-4" /> {t("practice.freeLimitReached")}</>
                    ) : isEssay ? (
                      t("practice.submitForGrading")
                    ) : (
                      t("practice.checkAnswer")
                    )}
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleNext} className="gap-2 rounded-xl px-6" size="lg">
                      {t("practice.nextQuestion")} <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setShowTips(!showTips)} className="gap-2 rounded-xl">
                      <Lightbulb className="h-4 w-4" /> {showTips ? t("practice.hideTips") : t("practice.tips")}
                    </Button>
                    {canUseCoaching ? (
                      <Button variant="outline" onClick={handleAskAI} disabled={loadingAI} className="gap-2 rounded-xl">
                        {loadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                        {t("practice.askCoach")}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => navigate("/pricing")} className="gap-2 rounded-xl text-muted-foreground">
                        <Lock className="h-4 w-4" /> {t("practice.coachingPro")}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* MCQ Feedback */}
            {showFeedback && !isEssay && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 space-y-4">
                <div className={`rounded-2xl border p-6 ${isCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"}`}>
                  <div className="mb-3 flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t("practice.correct")}</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="font-semibold text-destructive">{t("practice.incorrect")}</span>
                        <span className="text-sm text-muted-foreground">— Answer: {revealedAnswer?.correct_answer}</span>
                      </>
                    )}
                    {timeTaken > 0 && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" /> {timeTaken}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{revealedAnswer?.explanation}</p>
                </div>

                {revealedAnswer?.worked_solution && (
                  <div className="rounded-2xl border border-border/60 bg-card p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{t("practice.workedSolution")}</span>
                    </div>
                    <div className="whitespace-pre-line font-mono text-sm leading-relaxed text-muted-foreground">{revealedAnswer.worked_solution}</div>
                  </div>
                )}

                {revealedAnswer?.exam_tip && (
                  <div className="rounded-2xl border-l-4 border-l-primary bg-primary/5 p-5">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{t("practice.examTip")}</div>
                    <p className="text-sm leading-relaxed">{revealedAnswer.exam_tip}</p>
                  </div>
                )}

                {/* Why other answers are wrong — distractor reasoning */}
                {!isCorrect && parsedOptions.length > 0 && (
                  <div className="rounded-2xl border border-border/60 bg-card p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                      </div>
                      <span className="text-sm font-semibold">{t("practice.whyEachAnswer")}</span>
                    </div>
                    <div className="space-y-3">
                      {parsedOptions.map((opt) => {
                        const isRight = opt === revealedAnswer?.correct_answer;
                        const dbDistractors = (question as any).distractor_reasoning;
                        const reasoning = dbDistractors?.[opt] || null;
                        return (
                          <div key={opt} className={`rounded-xl border p-3 ${isRight ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/40 bg-muted/20"}`}>
                            <div className="mb-1 flex items-center gap-2">
                              {isRight ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/60" />}
                              <span className={`text-sm font-medium ${isRight ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{opt}</span>
                            </div>
                            {isRight && <p className="ml-5.5 text-xs leading-relaxed text-emerald-600/80 dark:text-emerald-400/80">✓ This is correct. {revealedAnswer?.explanation}</p>}
                            {!isRight && reasoning && <p className="ml-5.5 text-xs leading-relaxed text-muted-foreground">{reasoning}</p>}
                            {!isRight && !reasoning && <p className="ml-5.5 text-xs leading-relaxed text-muted-foreground">This is incorrect.</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Essay STEMcoach Grading */}
            {showFeedback && isEssay && aiGrading && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 space-y-4">
                <div className={`rounded-2xl border p-6 ${aiGrading.score >= aiGrading.max_marks * 0.7 ? "bg-emerald-500/5 border-emerald-500/20" : aiGrading.score >= aiGrading.max_marks * 0.4 ? "bg-amber-500/5 border-amber-500/20" : "bg-destructive/5 border-destructive/20"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold">Score: {aiGrading.score}/{aiGrading.max_marks}</span>
                    <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-semibold">{Math.round((aiGrading.score / aiGrading.max_marks) * 100)}%</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{aiGrading.feedback}</p>
                </div>
                {aiGrading.strengths?.length > 0 && (
                  <div className="rounded-2xl border border-border/60 bg-card p-6">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Strengths
                    </h4>
                    <ul className="space-y-1.5">{aiGrading.strengths.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}</ul>
                  </div>
                )}
                {aiGrading.improvements?.length > 0 && (
                  <div className="rounded-2xl border border-border/60 bg-card p-6">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      <Lightbulb className="h-4 w-4" /> Areas to Improve
                    </h4>
                    <ul className="space-y-1.5">{aiGrading.improvements.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}</ul>
                  </div>
                )}
                {aiGrading.tuition_tip && (
                  <div className="rounded-2xl border-l-4 border-l-primary bg-primary/5 p-5">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{t("practice.tuitionTip")}</div>
                    <p className="text-sm leading-relaxed">{aiGrading.tuition_tip}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tuition Tips */}
            {showTips && revealedAnswer?.tuition_tips?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <div className="rounded-2xl border-l-4 border-l-primary bg-primary/5 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Lightbulb className="h-4 w-4" /> Tuition Tips
                  </div>
                  <ul className="space-y-2">
                    {revealedAnswer.tuition_tips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm leading-relaxed">• {tip}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* STEMcoach Explanation */}
            {aiExplanation && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-border/60 bg-card p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  STEMcoach Explanation
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <XPPopup xp={xpGained} show={showXP} />

        {/* Mascot reaction */}
        <AnimatePresence>
          {showMascotReaction && (
            <div className="fixed bottom-20 left-4 right-4 z-40 flex justify-center lg:bottom-8 lg:left-auto lg:right-8">
              <MascotReaction subjectId={subjectId || ""} correct={mascotCorrect} show={showMascotReaction} />
            </div>
          )}
        </AnimatePresence>

        {newBadges.map((badge) => (
          <BadgeUnlock key={badge.id} badge={badge} onDismiss={() => dismissBadge(badge.id)} />
        ))}
      </main>
    </div>
  );
}
