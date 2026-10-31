import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuotaGate } from "@/hooks/useQuotaGate";
import { subjects } from "@/data/questions";
import { mockExamTemplates, type MockExamTemplate } from "@/data/mockExamTemplates";
import { ExamBrowse } from "@/components/mock-exam/ExamBrowse";
import { ExamSetup } from "@/components/mock-exam/ExamSetup";
import { ExamActive } from "@/components/mock-exam/ExamActive";
import { ExamReview } from "@/components/mock-exam/ExamReview";
import { Button } from "@/components/ui/button";
import { examDeadline, secondsToExamDeadline } from "@/lib/examClock";
import { requireCompleteMockExamGrades, type MockExamGradeResult } from "@/lib/mockExamGrading";
import { useTranslation } from "react-i18next";

type ExamState = "browse" | "setup" | "loading" | "active" | "grading" | "grading-error" | "review";

interface ExamQuestion {
  id: string;
  question_text: string;
  options: any;
  topic: string;
  subject: string;
  difficulty: number;
  points: number;
  /** Only populated after server-side grading */
  correct_answer?: string;
  explanation?: string;
  worked_solution?: string;
}

export default function MockExam() {
  const { t } = useTranslation();
  useDocumentTitle(t("mockExam.title"));
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTemplate = mockExamTemplates.find((template) => template.id === searchParams.get("template")) || null;
  const { toast } = useToast();
  const { canTakeMockExam, mockExamsRemaining, mockExamsTotal, hasPurchased, refresh: refreshQuota } = useQuotaGate();
  const [state, setState] = useState<ExamState>(initialTemplate ? "setup" : "browse");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const examDeadlineRef = useRef<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MockExamTemplate | null>(initialTemplate);

  // Custom exam options
  const [examSubject, setExamSubject] = useState("physics");
  const [examCurriculum, setExamCurriculum] = useState("uk-alevel");
  const [questionCount, setQuestionCount] = useState(30);
  const [duration, setDuration] = useState(60);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const handleSubmitExam = useCallback(async () => {
    // A synchronous guard prevents two timer/submit events charging or grading twice.
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    setSubmitting(true);
    setState("grading");

    if (!user || questions.length === 0) {
      setState("grading-error");
      submissionInFlight.current = false;
      setSubmitting(false);
      return;
    }

    const examName =
      selectedTemplate?.name ||
      subjects.find((s) => s.id === examSubject)?.name ||
      examSubject;

    try {
      const { data, error } = await supabase.functions.invoke("grade-mock-exam", {
        body: {
          submissions: questions.map((q, i) => ({
            question_id: q.id,
            answer: answers[i] ?? null,
          })),
          exam_name: examName,
          subject: selectedTemplate?.subject || examSubject,
        },
      });

      if (error) throw error;

      // Never render a 0%-style review until the backend has graded every item.
      const results = data?.results as MockExamGradeResult[] | undefined;
      const byId = requireCompleteMockExamGrades(
        questions.map((q) => q.id),
        results,
      );
      setQuestions((prev) =>
        prev.map((q) => {
          const r = byId.get(q.id)!;
          return {
            ...q,
            correct_answer: r.correct_answer ?? undefined,
            explanation: r.explanation ?? undefined,
            worked_solution: r.worked_solution ?? undefined,
          };
        }),
      );
      setState("review");

      // Quota refresh is best-effort; a network error here must not discard a
      // valid, confirmed grade or encourage the student to submit twice.
      try {
        await refreshQuota();
      } catch {
        // Server-side quota remains authoritative.
      }

      if (data?.certificate_issued) {
        toast({
          title: `🏆 ${t("mockExam.certificateEarned")}`,
          description: t("mockExam.certificateDesc", { percent: data.percent }),
        });
      }
    } catch {
      // The server might already have received the submission. Do not offer
      // an automatic retry until grading and quota handling are idempotent.
      setState("grading-error");
      toast({
        title: t("mockExam.gradingFailed"),
        description: t("mockExam.gradingUnconfirmed"),
        variant: "destructive",
      });
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }, [user, questions, answers, selectedTemplate, examSubject, toast, refreshQuota, t]);

  useEffect(() => {
    if (state !== "active" || examDeadlineRef.current === null) return;
    // A throttled tab must not add extra time to a timed assessment.
    // Never submit inside a React state updater (which React can replay).
    const updateClock = () => {
      if (examDeadlineRef.current === null) return;
      const remaining = secondsToExamDeadline(examDeadlineRef.current);
      setTimeLeft(remaining);
      if (remaining === 0) void handleSubmitExam();
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    document.addEventListener("visibilitychange", updateClock);
    window.addEventListener("focus", updateClock);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateClock);
      window.removeEventListener("focus", updateClock);
    };
  }, [state, handleSubmitExam]);

  const startExam = async () => {
    if (!canTakeMockExam) {
      toast({
        title: t("mockExam.limitReached"),
        description: hasPurchased
          ? t("mockExam.purchaseTopUp")
          : t("mockExam.purchasePack"),
        variant: "destructive",
      });
      return;
    }

    const subj = selectedTemplate ? selectedTemplate.subject : examSubject;
    const curr = selectedTemplate ? selectedTemplate.curriculum : examCurriculum;
    const qCount = selectedTemplate ? selectedTemplate.questionCount : questionCount;
    const dur = selectedTemplate ? selectedTemplate.durationMinutes : duration;
    const board = selectedTemplate?.board;

    setState("loading");
    try {
      const { data, error } = await supabase.rpc("get_mock_exam_questions" as any, {
        _subject: subj,
        _curriculum: curr,
        _count: qCount,
        _board: board || null,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast({
          title: t("mockExam.noQuestionsFound"),
          description: t("mockExam.noQuestionsDesc"),
          variant: "destructive",
        });
        setState(selectedTemplate ? "browse" : "setup");
        return;
      }

      const shuffled = (data as ExamQuestion[]);
      setQuestions(shuffled);
      examDeadlineRef.current = examDeadline(dur);
      setTimeLeft(secondsToExamDeadline(examDeadlineRef.current));
      setAnswers({});
      setFlagged(new Set());
      setCurrentQ(0);
      setState("active");
    } catch (e: any) {
      toast({ title: t("common.error"), description: t("common.tryAgain"), variant: "destructive" });
      setState(selectedTemplate ? "browse" : "setup");
    }
  };

  const handleBrowse = () => {
    examDeadlineRef.current = null;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("template");
    setSearchParams(nextParams, { replace: true });
    setState("browse");
    setQuestions([]);
    setSelectedTemplate(null);
  };

  // ── Browse ──
  if (state === "browse") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <PageTransition>
          <ExamBrowse
            onSelectTemplate={(t) => {
              setSearchParams({ template: t.id }, { replace: true });
              setSelectedTemplate(t);
              setState("setup");
            }}
            onCustomExam={() => {
              setSearchParams({}, { replace: true });
              setState("setup");
              setSelectedTemplate(null);
            }}
          />
        </PageTransition>
        <Footer />
      </div>
    );
  }

  // ── Setup / Loading ──
  if (state === "setup" || state === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageTransition>
          <ExamSetup
            selectedTemplate={selectedTemplate}
            examSubject={examSubject}
            setExamSubject={setExamSubject}
            examCurriculum={examCurriculum}
            setExamCurriculum={setExamCurriculum}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            duration={duration}
            setDuration={setDuration}
            isLoading={state === "loading"}
            onStart={startExam}
            onBack={() => {
              setSearchParams({}, { replace: true });
              setState("browse");
              setSelectedTemplate(null);
            }}
            mockExamsRemaining={mockExamsRemaining}
            mockExamsTotal={mockExamsTotal}
            canTakeMockExam={canTakeMockExam}
          />
        </PageTransition>
      </div>
    );
  }

  // ── Grading / unconfirmed result ──
  if (state === "grading" || state === "grading-error") {
    const pending = state === "grading";
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
          <div role={pending ? "status" : "alert"} aria-live={pending ? "polite" : "assertive"}
            className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {pending && (
              <div aria-hidden="true" className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none" />
            )}
            <h1 className="text-xl font-bold sm:text-2xl">
              {pending
                ? t("mockExam.gradingInProgress", { defaultValue: "Checking your answers…" })
                : t("mockExam.gradingFailed")}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {pending
                ? t("mockExam.waitForResults", { defaultValue: "Your results will appear only after grading is confirmed." })
                : t("mockExam.gradingUnconfirmed", {
                    defaultValue: "We couldn't confirm your result. Your submission may have reached the server. Please contact support to check its status before starting again.",
                  })}
            </p>
            {!pending && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={handleBrowse} variant="outline">{t("mockExam.backToExams")}</Button>
                <Button asChild><Link to="/support">{t("nav.support", { defaultValue: "Contact support" })}</Link></Button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Review ──
  if (state === "review") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageTransition>
          <ExamReview
            questions={questions}
            answers={answers}
            flagged={flagged}
            selectedTemplate={selectedTemplate}
            onBrowse={handleBrowse}
          />
        </PageTransition>
      </div>
    );
  }

  // ── Active Exam ──
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <ExamActive
        questions={questions}
        currentQ={currentQ}
        setCurrentQ={setCurrentQ}
        answers={answers}
        setAnswers={setAnswers}
        flagged={flagged}
        setFlagged={setFlagged}
        timeLeft={timeLeft}
        submitting={submitting}
        onSubmit={handleSubmitExam}
        formatTime={formatTime}
      />
    </div>
  );
}
