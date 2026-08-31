import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Clock, Loader2, MessageCircle, Target, Trophy, XCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getMascot } from "@/lib/mascots";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentQuestion {
  id: string;
  question_text: string;
  options: unknown;
  allow_multiple_answers: boolean;
  question_type: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  points: number;
  max_marks: number | null;
  boards: string[];
  formula: string | null;
  command_word: string | null;
  curriculum: string;
}

interface AssignmentSession {
  assignment: {
    id: string;
    title: string;
    description: string | null;
    subject: string;
    curriculum: string;
    due_date: string | null;
    question_count: number;
  };
  submission: {
    id: string;
    started_at: string;
    completed_at: string | null;
    score: number;
    total: number;
  };
  answered_question_ids: string[];
  questions: AssignmentQuestion[];
}

interface AssignmentProgress {
  answered_count: number;
  score: number;
  total: number;
  completed_at: string | null;
}

interface AnswerFeedback {
  correct: boolean;
  correct_answer: string;
  correct_answers: string[] | null;
  explanation: string;
  worked_solution: string;
  exam_tip: string;
  tuition_tips: string[];
  assignment_progress: AssignmentProgress;
}

function parseOptions(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function AssignmentQuiz() {
  const { t } = useTranslation();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<AssignmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [orderedOptions, setOrderedOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [progress, setProgress] = useState<AssignmentProgress | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachExplanation, setCoachExplanation] = useState<string | null>(null);
  const questionStartedAt = useRef(Date.now());

  useDocumentTitle(session?.assignment.title || t("assignmentQuiz.documentTitle"));

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      if (!user || !assignmentId) return;
      setLoading(true);
      const { data, error } = await supabase.rpc("get_assignment_session", { _assignment_id: assignmentId });
      if (!active) return;
      if (error || !data) {
        setLoadError(error?.message || t("assignmentQuiz.loadFailed"));
        setLoading(false);
        return;
      }
      const loaded = data as unknown as AssignmentSession;
      const loadedAnswered = new Set(loaded.answered_question_ids || []);
      const firstUnanswered = loaded.questions.findIndex((question) => !loadedAnswered.has(question.id));
      setSession(loaded);
      setAnsweredIds(loadedAnswered);
      setProgress({
        answered_count: loadedAnswered.size,
        score: loaded.submission.score || 0,
        total: loaded.submission.total || loaded.questions.length,
        completed_at: loaded.submission.completed_at,
      });
      setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      setLoading(false);
    };
    void loadSession();
    return () => { active = false; };
  }, [assignmentId, t, user]);

  const question = session?.questions[currentIndex];
  const options = useMemo(() => parseOptions(question?.options), [question?.options]);
  const isMultiSelect = Boolean(question?.allow_multiple_answers || question?.question_type === "multi-select");
  const isOrdering = question?.question_type === "ordering";
  const mascot = getMascot(session?.assignment.subject || "mathematics");
  const completed = Boolean(
    session?.submission.completed_at
    || (progress?.completed_at && answeredIds.size >= progress.total),
  );

  useEffect(() => {
    setSelectedAnswer("");
    setSelectedAnswers(new Set());
    setOrderedOptions(options);
    setFeedback(null);
    setCoachExplanation(null);
    questionStartedAt.current = Date.now();
  }, [currentIndex, options]);

  const submittedAnswer = () => {
    if (isOrdering) return orderedOptions.join(" → ");
    if (isMultiSelect) return [...selectedAnswers].join(", ");
    return selectedAnswer.trim();
  };

  const canSubmit = isOrdering ? orderedOptions.length > 0 : isMultiSelect ? selectedAnswers.size > 0 : Boolean(selectedAnswer.trim());

  const submitAnswer = async () => {
    if (!question || !assignmentId || !canSubmit || feedback) return;
    setSubmitting(true);
    try {
      const timeTaken = Math.max(0, Math.round((Date.now() - questionStartedAt.current) / 1000));
      const { data, error } = await supabase.functions.invoke("check-answer", {
        body: {
          assignment_id: assignmentId,
          question_id: question.id,
          answer: isMultiSelect ? undefined : submittedAnswer(),
          answers: isMultiSelect ? [...selectedAnswers] : undefined,
          time_taken_seconds: timeTaken,
        },
      });
      if (error) throw error;
      const result = data as AnswerFeedback;
      setFeedback(result);
      setProgress(result.assignment_progress);
    } catch (error) {
      toast({ title: t("assignmentQuiz.submitFailed"), description: error instanceof Error ? error.message : t("common.tryAgain"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (!question || !feedback || !session) return;
    const nextAnswered = new Set(answeredIds).add(question.id);
    setAnsweredIds(nextAnswered);
    if (feedback.assignment_progress.completed_at) return;
    const nextIndex = session.questions.findIndex((item, index) => index > currentIndex && !nextAnswered.has(item.id));
    const wrappedIndex = session.questions.findIndex((item) => !nextAnswered.has(item.id));
    setCurrentIndex(nextIndex >= 0 ? nextIndex : Math.max(0, wrappedIndex));
  };

  const askCoach = async () => {
    if (!question || !feedback) return;
    setCoachLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          action: "explain",
          question_id: question.id,
          question_text: question.question_text,
          correct_answer: feedback.correct_answer,
          student_answer: submittedAnswer(),
          subject: question.subject,
          topic: question.topic,
        },
      });
      if (error) throw error;
      setCoachExplanation(data.explanation);
    } catch (error) {
      toast({ title: t("assignmentQuiz.coachFailed"), description: error instanceof Error ? error.message : t("common.tryAgain"), variant: "destructive" });
    } finally {
      setCoachLoading(false);
    }
  };

  const toggleMultiSelect = (option: string) => {
    setSelectedAnswers((current) => {
      const next = new Set(current);
      if (next.has(option)) next.delete(option); else next.add(option);
      return next;
    });
  };

  const moveOption = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedOptions.length) return;
    const next = [...orderedOptions];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedOptions(next);
  };

  if (loading) return <div className="min-h-screen bg-background"><AppHeader /><main className="flex items-center justify-center gap-3 py-32 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t("assignmentQuiz.loading")}</main></div>;
  if (loadError || !session || !question) return <div className="min-h-screen bg-background"><AppHeader /><main className="container mx-auto max-w-xl px-4 py-20 text-center"><XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" /><h1 className="text-xl font-bold">{t("assignmentQuiz.unavailable")}</h1><p className="mt-2 text-sm text-muted-foreground">{loadError || t("assignmentQuiz.loadFailed")}</p><Button onClick={() => navigate("/my-classes")} className="mt-6">{t("assignmentQuiz.backToClasses")}</Button></main></div>;

  if (completed) {
    return (
      <div className="min-h-screen bg-background"><AppHeader /><main className="container mx-auto max-w-2xl px-4 py-16"><section className="stem-card rounded-3xl p-8 text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-success/10"><Trophy className="h-10 w-10 text-success" /></div><p className="stem-label mb-2">{t("assignmentQuiz.completeLabel")}</p><h1 className="stem-heading text-3xl">{session.assignment.title}</h1><p className="mt-3 text-muted-foreground">{t("assignmentQuiz.finalScore", { score: progress?.score || 0, total: progress?.total || session.questions.length })}</p><div className="mx-auto mt-6 max-w-sm"><Progress value={((progress?.score || 0) / Math.max(1, progress?.total || session.questions.length)) * 100} className="h-3" /></div><p className="mt-5 text-sm text-muted-foreground">{t("assignmentQuiz.teacherCanSee")}</p><Button onClick={() => navigate("/my-classes")} className="mt-7 gap-2"><ArrowLeft className="h-4 w-4" />{t("assignmentQuiz.backToClasses")}</Button></section></main></div>
    );
  }

  const progressPercent = ((progress?.answered_count || 0) / Math.max(1, progress?.total || session.questions.length)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-4xl px-4 py-7 pb-28">
        <Button variant="ghost" size="sm" onClick={() => navigate("/my-classes")} className="mb-4 gap-1.5 text-muted-foreground"><ArrowLeft className="h-4 w-4" />{t("assignmentQuiz.backToClasses")}</Button>
        <section className="mb-5 rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><img src={mascot.image} alt={mascot.name} className="h-14 w-14 rounded-xl bg-muted object-contain" /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-primary">{t("assignmentQuiz.assignedQuiz")}</p><h1 className="truncate text-xl font-bold">{session.assignment.title}</h1><p className="mt-1 text-xs text-muted-foreground">{t(`subjects.names.${session.assignment.subject}`)} · {session.assignment.curriculum}</p></div>{session.assignment.due_date && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{t("assignmentQuiz.due", { date: new Date(session.assignment.due_date).toLocaleDateString() })}</span>}</div>
          {session.assignment.description && <p className="mt-4 text-sm leading-6 text-muted-foreground">{session.assignment.description}</p>}
          <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs"><span>{t("assignmentQuiz.progress", { answered: progress?.answered_count || 0, total: progress?.total || session.questions.length })}</span><span className="font-semibold">{progress?.score || 0} {t("assignmentQuiz.correct")}</span></div><Progress value={progressPercent} className="h-2" /></div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary">{t("assignmentQuiz.questionOf", { current: (progress?.answered_count || 0) + 1, total: progress?.total || session.questions.length })}</span><span className="rounded-lg bg-muted px-2.5 py-1 text-muted-foreground">{question.topic}</span><span className="rounded-lg bg-muted px-2.5 py-1 text-muted-foreground">{t("assignmentQuiz.difficulty", { level: question.difficulty })}</span></div>
          <h2 className="text-lg font-semibold leading-7 md:text-xl">{question.question_text}</h2>
          {question.formula && <p className="mt-4 rounded-xl bg-muted/50 p-3 font-mono text-sm">{question.formula}</p>}

          <div className="mt-6 space-y-3">
            {isOrdering ? orderedOptions.map((option, index) => <div key={`${option}-${index}`} className="flex items-center gap-2 rounded-xl border p-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{index + 1}</span><span className="flex-1 text-sm">{option}</span><Button variant="ghost" size="icon" disabled={Boolean(feedback) || index === 0} onClick={() => moveOption(index, -1)} aria-label={t("assignmentQuiz.moveUp")}><ArrowUp className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={Boolean(feedback) || index === orderedOptions.length - 1} onClick={() => moveOption(index, 1)} aria-label={t("assignmentQuiz.moveDown")}><ArrowDown className="h-4 w-4" /></Button></div>) : options.length > 0 ? options.map((option) => {
              const selected = isMultiSelect ? selectedAnswers.has(option) : selectedAnswer === option;
              return <button key={option} disabled={Boolean(feedback)} onClick={() => isMultiSelect ? toggleMultiSelect(option) : setSelectedAnswer(option)} className={`w-full rounded-xl border p-4 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>{option}</button>;
            }) : <Input value={selectedAnswer} onChange={(event) => setSelectedAnswer(event.target.value)} disabled={Boolean(feedback)} maxLength={2000} placeholder={t("assignmentQuiz.answerPlaceholder")} className="h-12" />}
          </div>

          {!feedback ? <Button onClick={() => void submitAnswer()} disabled={!canSubmit || submitting} className="mt-6 gap-2">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{t("assignmentQuiz.submit")}</Button> : (
            <div className="mt-6 space-y-4">
              <div className={`rounded-xl p-4 ${feedback.correct ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}><p className="flex items-center gap-2 font-semibold">{feedback.correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}{t(feedback.correct ? "assignmentQuiz.correctAnswer" : "assignmentQuiz.incorrectAnswer")}</p>{!feedback.correct && <p className="mt-2 text-sm">{t("assignmentQuiz.expected", { answer: feedback.correct_answers?.length ? feedback.correct_answers.join(", ") : feedback.correct_answer })}</p>}</div>
              {feedback.explanation && <div className="prose prose-sm max-w-none rounded-xl bg-muted/40 p-4 dark:prose-invert"><ReactMarkdown>{feedback.explanation}</ReactMarkdown></div>}
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void askCoach()} disabled={coachLoading} className="gap-2"><img src={mascot.image} alt="" className="h-6 w-6 rounded-lg object-cover" /><MessageCircle className="h-4 w-4" />{coachLoading ? t("assignmentQuiz.coachThinking") : t("assignmentQuiz.askCoach", { name: mascot.name })}</Button><Button onClick={nextQuestion} className="gap-2">{feedback.assignment_progress.completed_at ? t("assignmentQuiz.viewResult") : t("assignmentQuiz.nextQuestion")}<ArrowRight className="h-4 w-4" /></Button></div>
              {coachExplanation && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Target className="h-4 w-4" />{mascot.name}</p><div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{coachExplanation}</ReactMarkdown></div></div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
