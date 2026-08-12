import { useState, useEffect, useCallback } from "react";
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
import { ExamBrowse } from "@/components/mock-exam/ExamBrowse";
import { ExamSetup } from "@/components/mock-exam/ExamSetup";
import { ExamActive } from "@/components/mock-exam/ExamActive";
import { ExamReview } from "@/components/mock-exam/ExamReview";

type ExamState = "browse" | "setup" | "loading" | "active" | "review";

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
  useDocumentTitle("Mock Exam");
  const { user } = useAuth();
  const { toast } = useToast();
  const { canTakeMockExam, mockExamsRemaining, mockExamsTotal, hasPurchased, loading: quotaLoading, incrementMockExam } = useQuotaGate();
  const [state, setState] = useState<ExamState>("browse");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MockExamTemplate | null>(null);

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
    if (submitting) return;
    setSubmitting(true);
    setState("review");

    if (!user || questions.length === 0) {
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

      const results: Array<{
        question_id: string;
        correct_answer: string | null;
        explanation: string | null;
        worked_solution: string | null;
      }> = data?.results ?? [];

      const byId = new Map(results.map((r) => [r.question_id, r]));
      setQuestions((prev) =>
        prev.map((q) => {
          const r = byId.get(q.id);
          return r
            ? {
                ...q,
                correct_answer: r.correct_answer ?? undefined,
                explanation: r.explanation ?? undefined,
                worked_solution: r.worked_solution ?? undefined,
              }
            : q;
        })
      );

      // Keep the local quota display in sync (server already consumed the credit)
      await refreshQuota();

      if (data?.certificate_issued) {
        toast({
          title: "🏆 Certificate earned!",
          description: `You scored ${data.percent}% — a certificate has been added to your profile.`,
        });
      }
    } catch (e: any) {
      toast({
        title: "Could not grade exam",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, user, questions, answers, selectedTemplate, examSubject, toast, refreshQuota]);

  useEffect(() => {
    if (state !== "active") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, handleSubmitExam]);

  const startExam = async () => {
    if (!canTakeMockExam) {
      toast({
        title: "Mock exam limit reached",
        description: hasPurchased
          ? "You've used all your mock exams. Purchase a Top-Up pack for more."
          : "Purchase a question pack to unlock mock exams.",
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
          title: "No questions found",
          description: "No questions available for this exam yet. Try a different selection.",
          variant: "destructive",
        });
        setState(selectedTemplate ? "browse" : "setup");
        return;
      }

      const shuffled = (data as ExamQuestion[]);
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

  const handleBrowse = () => {
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
              setSelectedTemplate(t);
              setState("setup");
            }}
            onCustomExam={() => {
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
