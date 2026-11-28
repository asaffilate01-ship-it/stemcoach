import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
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
import { type MockExamTemplate } from "@/data/mockExamTemplates";
import { launchExamTemplates as mockExamTemplates } from "@/lib/launchDiscovery";
import { ExamBrowse } from "@/components/mock-exam/ExamBrowse";
import { ExamSetup } from "@/components/mock-exam/ExamSetup";
import { ExamActive } from "@/components/mock-exam/ExamActive";
import { ExamReview } from "@/components/mock-exam/ExamReview";
import { Button } from "@/components/ui/button";
import { examDeadline, secondsToExamDeadline } from "@/lib/examClock";
import { requireConfirmedMockExamResult, type ConfirmedMockExamResult } from "@/lib/mockExamGrading";
import { useTranslation } from "react-i18next";
import { requireMockExamSheet, acceptsExamAnswer, type MockExamQuestion } from "@/lib/mockExamSheet";

type ExamState = "browse" | "setup" | "loading" | "active" | "grading" | "grading-error" | "review";

export default function MockExam() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="min-h-screen bg-background"><AppHeader /><main className="p-8 text-center" role="status">{t("qa.scopeLoading")}</main></div>;
  return <ExamWorkspace key={JSON.stringify(user?.id ?? null)} accountId={user?.id ?? null} />;
}

function ExamWorkspace({ accountId }: { accountId: string | null }) {
  const { t } = useTranslation();
  useDocumentTitle(t("mockExam.title"));
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTemplate = mockExamTemplates.find((template) => template.id === searchParams.get("template")) || null;
  const { toast } = useToast();
  const { canTakeMockExam, mockExamsRemaining, mockExamsTotal, hasPurchased, refresh: refreshQuota } = useQuotaGate();
  const [state, setState] = useState<ExamState>(initialTemplate ? "setup" : "browse");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const answerSnapshot = useRef<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<MockExamQuestion[]>([]);
  const activeSheet = useRef<MockExamQuestion[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedResult, setConfirmedResult] = useState<ConfirmedMockExamResult | null>(null);
  const submissionInFlight = useRef(false);
  const submitted = useRef(false);
  const requestVersion = useRef(0);
  const mounted = useRef(false);
  const startInFlight = useRef(false);
  const examDeadlineRef = useRef<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MockExamTemplate | null>(initialTemplate);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestVersion.current++;
      examDeadlineRef.current = null;
      activeSheet.current = null;
    };
  }, []);

  const updateAnswers = useCallback((change: Record<number, string> | ((previous: Record<number, string>) => Record<number, string>)) => {
    if (!mounted.current || activeSheet.current !== questions || !acceptsExamAnswer(examDeadlineRef.current, submitted.current)) return;
    const next = typeof change === "function" ? change(answerSnapshot.current) : change;
    answerSnapshot.current = next;
    setAnswers(next);
  }, [questions]);

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
    if (!mounted.current || submitted.current || submissionInFlight.current || !accountId || !questions.length || activeSheet.current !== questions || examDeadlineRef.current === null) return;
    submitted.current = true;
    submissionInFlight.current = true;
    const version = requestVersion.current;
    const isCurrent = () => mounted.current && requestVersion.current === version;
    setSubmitting(true);
    setState("grading");

    const examName =
      selectedTemplate?.name ||
      subjects.find((s) => s.id === examSubject)?.name ||
      examSubject;

    const submissions = questions.map((q, i) => ({ question_id: q.id, answer: answerSnapshot.current[i] ?? null }));
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!isCurrent()) return;
      if (sessionError || !session || session.user.id !== accountId) throw new Error("Exam account changed");
      // Bind the outgoing request to the workspace's authenticated session.
      const { data, error } = await supabase.functions.invoke("grade-mock-exam", {
        headers: { Authorization: "Bearer " + session.access_token },
        body: {
          submissions,
          exam_name: examName,
          subject: selectedTemplate?.subject || examSubject,
        },
      });

      if (!isCurrent()) return;
      if (error) throw error;

      // No locally reconstructed grade: validate the entire server response.
      const confirmed = requireConfirmedMockExamResult(submissions, data);
      setConfirmedResult(confirmed);
      setState("review");

      // Quota refresh is best-effort; a network error here must not discard a
      // valid, confirmed grade or encourage the student to submit twice.
      try {
        await refreshQuota();
      } catch {
        // Server-side quota remains authoritative.
      }

      if (isCurrent() && confirmed.certificateIssued) {
        toast({
          title: `🏆 ${t("mockExam.certificateEarned")}`,
          description: t("mockExam.certificateDesc", { percent: confirmed.percent }),
        });
      }
    } catch {
      if (!isCurrent()) return;
      // The server might already have received the submission. Do not offer
      // an automatic retry until grading and quota handling are idempotent.
      setState("grading-error");
      toast({
        title: t("mockExam.gradingFailed"),
        description: t("mockExam.gradingUnconfirmed"),
        variant: "destructive",
      });
    } finally {
      if (isCurrent()) {
        submissionInFlight.current = false;
        setSubmitting(false);
      }
    }
  }, [accountId, questions, selectedTemplate, examSubject, toast, refreshQuota, t]);

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
    if (!mounted.current || startInFlight.current || state !== "setup") return;
    if (!accountId || !canTakeMockExam) {
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

    startInFlight.current = true;
    const version = ++requestVersion.current;
    const isCurrent = () => mounted.current && requestVersion.current === version;
    setState("loading");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!isCurrent()) return;
      if (sessionError || !session || session.user.id !== accountId) throw new Error("Exam account changed");
      const { data, error } = await supabase.rpc("get_mock_exam_questions" as any, {
        _subject: subj,
        _curriculum: curr,
        _count: qCount,
        _board: board || null,
      });

      if (!isCurrent()) return;
      if (error) throw error;
      const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
      if (!isCurrent()) return;
      if (currentError || currentSession?.user.id !== accountId) throw new Error("Exam account changed");
      if (!data || data.length === 0) {
        toast({
          title: t("mockExam.noQuestionsFound"),
          description: t("mockExam.noQuestionsDesc"),
          variant: "destructive",
        });
        setState("setup");
        return;
      }

      const sheet = requireMockExamSheet(data, subj, qCount);
      setConfirmedResult(null);
      activeSheet.current = sheet;
      setQuestions(sheet);
      setSubmitting(false);
      submitted.current = false;
      submissionInFlight.current = false;
      examDeadlineRef.current = examDeadline(dur);
      setTimeLeft(secondsToExamDeadline(examDeadlineRef.current));
      answerSnapshot.current = {};
      setAnswers({});
      setFlagged(new Set());
      setCurrentQ(0);
      setState("active");
    } catch {
      if (!isCurrent()) return;
      toast({ title: t("common.error"), description: t("mockExam.invalidSheet", { defaultValue: "A complete question sheet could not be verified. No exam was started." }), variant: "destructive" });
      setState("setup");
    } finally {
      if (isCurrent()) startInFlight.current = false;
    }
  };

  const handleBrowse = () => {
    requestVersion.current++;
    startInFlight.current = false;
    examDeadlineRef.current = null;
    activeSheet.current = null;
    setSubmitting(false);
    answerSnapshot.current = {};
    setAnswers({});
    setFlagged(new Set());
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("template");
    setSearchParams(nextParams, { replace: true });
    setState("browse");
    setQuestions([]);
    setConfirmedResult(null);
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
              if (startInFlight.current) return;
              setSearchParams({}, { replace: true });
              setState("browse");
              setSelectedTemplate(null);
            }}
            mockExamsRemaining={mockExamsRemaining}
            mockExamsTotal={mockExamsTotal}
            canTakeMockExam={Boolean(accountId && canTakeMockExam)}
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
  if (state === "review" && confirmedResult) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <PageTransition>
          <ExamReview
            questions={questions}
            result={confirmedResult}
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
        setAnswers={updateAnswers}
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
