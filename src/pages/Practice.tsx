import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { subjects, type Question as LocalQuestion } from "@/data/questions";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Lightbulb, BookOpen, MessageSquare, Loader2, Lock, CreditCard } from "lucide-react";
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
import ReactMarkdown from "react-markdown";

interface DBQuestion {
  id: string;
  question_text: string;
  options: any;
  correct_answer: string;
  correct_answers: string[] | null;
  allow_multiple_answers: boolean;
  explanation: string;
  worked_solution: string;
  tuition_tips: string[];
  exam_tip: string;
  formula: string | null;
  topic: string;
  subtopic: string;
  subject: string;
  difficulty: number;
  points: number;
  question_type: string;
  boards: string[];
  mark_scheme: string | null;
  model_answer: string | null;
  max_marks: number | null;
}

export default function Practice() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, recordAnswer, newBadges, dismissBadge } = useGameStats();
  const { isFree, canPractice, remainingToday, incrementCount, FREE_DAILY_LIMIT, canUseAITutor } = useSubscriptionGate();
  const subject = subjects.find((s) => s.id === subjectId);

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
  const [timerRunning, setTimerRunning] = useState(true);
  const [timeTaken, setTimeTaken] = useState(0);

  // Load questions from DB
  useEffect(() => {
    if (!subjectId) return;
    const loadQuestions = async () => {
      setDbLoading(true);
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("subject", subjectId)
        .limit(50);

      if (data && data.length > 0) {
        // Shuffle
        const shuffled = (data as DBQuestion[]).sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }
      setDbLoading(false);
    };
    loadQuestions();
  }, [subjectId]);

  if (!subject) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="stem-heading mb-4">Subject not found</h2>
          <Button onClick={() => navigate("/subjects")} variant="outline" className="rounded gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Subjects
          </Button>
        </div>
      </div>
    );
  }

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="stem-heading mb-4">No questions available yet</h2>
          <p className="mb-6 text-muted-foreground">Questions for {subject.name} are being added. Check back soon!</p>
          <Button onClick={() => navigate("/subjects")} variant="outline" className="rounded gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Subjects
          </Button>
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
  const isCorrect = isMultiSelect ? false : selectedAnswer === question.correct_answer;

  const showXPPopup = (xp: number) => {
    setXpGained(xp);
    setShowXP(true);
    setTimeout(() => setShowXP(false), 1500);
  };

  const handleSubmit = async () => {
    // Check free tier limit
    if (isFree && !canPractice) {
      toast({ title: "Daily limit reached", description: "Upgrade to Pro for unlimited practice.", variant: "destructive" });
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
            question_text: question.question_text,
            student_answer: essayAnswer,
            mark_scheme: question.mark_scheme || question.worked_solution,
            model_answer: question.model_answer || question.correct_answer,
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
        setTimeout(() => setShowCorrectAnim(false), 2000);
        setScore((prev) => ({ correct: prev.correct + (passed ? 1 : 0), total: prev.total + 1 }));

        // Record attempt
        if (user) {
          await supabase.from("attempts").insert({
            user_id: user.id,
            question_id: question.id,
            answer: essayAnswer.slice(0, 500),
            correct: passed,
            time_taken_seconds: timeTaken,
            ai_score: data.grading?.score,
            ai_feedback: data.grading?.feedback?.slice(0, 500),
          });
        }

        const result = await recordAnswer(passed, question.points);
        showXPPopup(result.xpGained);
      } catch (e: any) {
        toast({ title: "AI grading failed", description: e.message, variant: "destructive" });
      } finally {
        setLoadingAI(false);
      }
      return;
    }

    if (!selectedAnswer && selectedAnswers.size === 0) return;
    setTimerRunning(false);
    setShowFeedback(true);
    const correct = isMultiSelect ? false : selectedAnswer === question.correct_answer;
    setLastCorrect(correct);
    setShowCorrectAnim(true);
    setTimeout(() => setShowCorrectAnim(false), 2000);
    setScore((prev) => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));

    // Record attempt to DB
    if (user) {
      await supabase.from("attempts").insert({
        user_id: user.id,
        question_id: question.id,
        answer: selectedAnswer || Array.from(selectedAnswers).join(", "),
        correct,
        time_taken_seconds: timeTaken,
      });
    }

    const result = await recordAnswer(correct, question.points);
    showXPPopup(result.xpGained);
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
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleAskAI = async () => {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          action: "explain",
          question_text: question.question_text,
          correct_answer: question.correct_answer,
          student_answer: selectedAnswer || essayAnswer || "",
          subject: question.subject,
          topic: question.topic,
        },
      });
      if (error) throw error;
      setAiExplanation(data.explanation);
    } catch (e: any) {
      toast({ title: "AI explanation failed", description: e.message, variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {/* Free tier limit banner */}
        {isFree && user && (
          <div className={`mb-4 flex items-center justify-between rounded-xl border p-3 ${
            canPractice ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {canPractice ? (
                <CreditCard className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-destructive" />
              )}
              <span>
                {canPractice
                  ? `${remainingToday} of ${FREE_DAILY_LIMIT} free questions remaining today`
                  : "Daily limit reached — upgrade for unlimited practice"}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/pricing")} className="rounded text-xs">
              Upgrade
            </Button>
          </div>
        )}
        {user && <div className="mb-4"><StreakBar stats={stats} /></div>}

        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate("/subjects")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Subjects
          </button>
          <div className="flex items-center gap-3">
            <QuizTimer isRunning={timerRunning} onTimeUpdate={setTimeTaken} />
            <CorrectAnimation show={showCorrectAnim} correct={lastCorrect} />
            <span className="stem-label">{score.correct}/{score.total} correct</span>
            <span className="stem-label">Q{currentIndex + 1}/{questions.length}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={question.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <div className="stem-card rounded-xl p-6 md:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{subject.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{question.topic}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{question.subtopic}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">L{question.difficulty} · {question.points} pts</span>
                {question.boards?.length > 0 && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {question.boards.slice(0, 3).join(", ")}
                  </span>
                )}
                {isMultiSelect && <span className="rounded bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">Select all that apply</span>}
                {isEssay && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Essay · AI graded</span>}
              </div>

              <h2 className="mb-6 text-xl font-semibold leading-relaxed">{question.question_text}</h2>

              {question.formula && (
                <div className="mb-6 rounded-lg bg-muted/50 px-4 py-3 font-mono text-sm">{question.formula}</div>
              )}

              {/* MCQ Options */}
              {parsedOptions.length > 0 && !isEssay && (
                <div className="mb-6 space-y-3">
                  {parsedOptions.map((option, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = isMultiSelect ? selectedAnswers.has(option) : selectedAnswer === option;
                    const isOptionCorrect = option === question.correct_answer;

                    let optionClass = "border-2 border-transparent hover:border-primary/20";
                    if (showFeedback && isOptionCorrect) optionClass = "stem-success-card animate-pulse-success";
                    else if (showFeedback && isSelected && !isOptionCorrect) optionClass = "stem-error-card";
                    else if (isSelected && !showFeedback) optionClass = "border-2 border-primary bg-primary/5";

                    return (
                      <motion.button
                        key={option}
                        whileHover={!showFeedback ? { scale: 1.01 } : {}}
                        whileTap={!showFeedback ? { scale: 0.99 } : {}}
                        onClick={() => {
                          if (showFeedback) return;
                          isMultiSelect ? toggleMultiSelect(option) : setSelectedAnswer(option);
                        }}
                        disabled={showFeedback}
                        className={`flex w-full items-center gap-3 rounded-lg p-4 text-left transition-all ${optionClass}`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">{letter}</span>
                        <span className="text-sm font-medium">{option}</span>
                        {showFeedback && isOptionCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-success" />}
                        {showFeedback && isSelected && !isOptionCorrect && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
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
                    placeholder="Write your answer here..."
                    rows={8}
                    className="resize-none"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">{question.max_marks || question.points} marks available · AI graded</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {!showFeedback ? (
                  <Button onClick={handleSubmit} disabled={(!selectedAnswer && selectedAnswers.size === 0 && !essayAnswer.trim()) || loadingAI} className="rounded">
                    {loadingAI ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Grading...</> : isEssay ? "Submit for AI Grading" : "Submit Answer"}
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleNext} className="gap-2 rounded">Next Question <ArrowRight className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={() => setShowTips(!showTips)} className="gap-2 rounded">
                      <Lightbulb className="h-4 w-4" /> {showTips ? "Hide Tips" : "Tuition Tips"}
                    </Button>
                    <Button variant="outline" onClick={handleAskAI} disabled={loadingAI} className="gap-2 rounded">
                      {loadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                      Ask AI Tutor
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* MCQ Feedback */}
            {showFeedback && !isEssay && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <div className={`rounded-xl p-6 ${isCorrect ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"}`}>
                  <div className="mb-3 flex items-center gap-2">
                    {isCorrect ? (
                      <><CheckCircle2 className="h-5 w-5 text-success" /><span className="font-semibold text-success">Correct!</span></>
                    ) : (
                      <><XCircle className="h-5 w-5 text-destructive" /><span className="font-semibold text-destructive">Incorrect</span>
                      <span className="text-sm text-muted-foreground">— Correct: {question.correct_answer}</span></>
                    )}
                    {timeTaken > 0 && <span className="ml-auto text-xs text-muted-foreground">⏱ {timeTaken}s</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
                {question.worked_solution && (
                  <div className="stem-card mt-4 rounded-xl p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Step-by-Step Solution</span>
                    </div>
                    <div className="whitespace-pre-line font-mono text-sm text-muted-foreground">{question.worked_solution}</div>
                  </div>
                )}
                {question.exam_tip && (
                  <div className="stem-tuition-tip mt-4">
                    <div className="text-xs font-semibold text-primary mb-1">Exam Tip</div>
                    <p className="text-sm">{question.exam_tip}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Essay AI Grading */}
            {showFeedback && isEssay && aiGrading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
                <div className={`rounded-xl p-6 border ${aiGrading.score >= aiGrading.max_marks * 0.7 ? "bg-success/5 border-success/20" : aiGrading.score >= aiGrading.max_marks * 0.4 ? "bg-warning/5 border-warning/20" : "bg-destructive/5 border-destructive/20"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold">AI Score: {aiGrading.score}/{aiGrading.max_marks}</span>
                    <span className="text-sm text-muted-foreground">{Math.round((aiGrading.score / aiGrading.max_marks) * 100)}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{aiGrading.feedback}</p>
                </div>
                {aiGrading.strengths?.length > 0 && (
                  <div className="stem-card rounded-xl p-6">
                    <h4 className="mb-2 text-sm font-semibold text-success">✓ Strengths</h4>
                    <ul className="space-y-1">{aiGrading.strengths.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}</ul>
                  </div>
                )}
                {aiGrading.improvements?.length > 0 && (
                  <div className="stem-card rounded-xl p-6">
                    <h4 className="mb-2 text-sm font-semibold text-warning">△ Improvements</h4>
                    <ul className="space-y-1">{aiGrading.improvements.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}</ul>
                  </div>
                )}
                {aiGrading.tuition_tip && (
                  <div className="stem-tuition-tip">
                    <div className="text-xs font-semibold text-primary mb-1">Tuition Tip</div>
                    <p className="text-sm">{aiGrading.tuition_tip}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tuition Tips */}
            {showTips && question.tuition_tips?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <div className="stem-tuition-tip">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Lightbulb className="h-4 w-4" /> Tuition Tips
                  </div>
                  <ul className="space-y-1.5">
                    {question.tuition_tips.map((tip, i) => (
                      <li key={i} className="text-sm">• {tip}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* AI Explanation */}
            {aiExplanation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border bg-card p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4 text-primary" /> AI Tutor Explanation
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <XPPopup xp={xpGained} show={showXP} />
        {newBadges.map((badge) => (
          <BadgeUnlock key={badge.id} badge={badge} onDismiss={() => dismissBadge(badge.id)} />
        ))}
      </main>
    </div>
  );
}
