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

    if (!user) {
      setSubmitting(false);
      return;
    }

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

    // Decrement mock exam quota
    await incrementMockExam();

    if (percent >= 60) {
      const examName =
        selectedTemplate?.name ||
        subjects.find((s) => s.id === examSubject)?.name ||
        examSubject;
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
  }, [submitting, user, questions, answers, selectedTemplate, examSubject, toast, incrementMockExam]);

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
      let query = supabase
        .from("questions")
        .select(
          "id, question_text, options, correct_answer, topic, subject, difficulty, points, explanation, worked_solution"
        )
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
        toast({
          title: "No questions found",
          description: "No questions available for this exam yet. Try a different selection.",
          variant: "destructive",
        });
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
