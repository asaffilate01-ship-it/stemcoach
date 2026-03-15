import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { subjects, sampleQuestions, type Question } from "@/data/questions";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Lightbulb, BookOpen, MessageSquare, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

export default function Practice() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const subject = subjects.find((s) => s.id === subjectId);

  const questions = useMemo(
    () => sampleQuestions.filter((q) => q.subject === subjectId),
    [subjectId]
  );

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

  if (!subject || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="stem-heading mb-4">No questions available yet</h2>
          <p className="mb-6 text-muted-foreground">Questions for this subject are being added.</p>
          <Button onClick={() => navigate("/subjects")} variant="outline" className="rounded gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Subjects
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isMultiSelect = question.type === "multi-select";
  const isEssay = question.type === "essay";
  const isCorrect = isMultiSelect
    ? false // handled differently
    : selectedAnswer === question.correctAnswer;

  const handleSubmit = async () => {
    if (isEssay) {
      if (!essayAnswer.trim()) return;
      setLoadingAI(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-tutor", {
          body: {
            action: "grade-essay",
            question_text: question.text,
            student_answer: essayAnswer,
            mark_scheme: question.workedSolution,
            model_answer: question.correctAnswer,
            max_marks: question.points,
            subject: question.subject,
            topic: question.topic,
          },
        });
        if (error) throw error;
        setAiGrading(data.grading);
        setShowFeedback(true);
        setScore((prev) => ({
          correct: prev.correct + (data.grading?.score >= data.grading?.max_marks * 0.6 ? 1 : 0),
          total: prev.total + 1,
        }));
      } catch (e: any) {
        toast({ title: "AI grading failed", description: e.message, variant: "destructive" });
      } finally {
        setLoadingAI(false);
      }
      return;
    }

    if (!selectedAnswer && selectedAnswers.size === 0) return;
    setShowFeedback(true);
    const correct = isMultiSelect ? false : selectedAnswer === question.correctAnswer;
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setSelectedAnswers(new Set());
    setEssayAnswer("");
    setShowFeedback(false);
    setShowTips(false);
    setAiExplanation(null);
    setAiGrading(null);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleAskAI = async () => {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          action: "explain",
          question_text: question.text,
          correct_answer: question.correctAnswer,
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
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate("/subjects")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Subjects
          </button>
          <div className="flex items-center gap-4">
            <span className="stem-label">{score.correct}/{score.total} correct</span>
            <span className="stem-label">Q{currentIndex + 1}/{questions.length}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={question.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <div className="stem-card rounded-xl p-6 md:p-8">
              {/* Meta */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{subject.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{question.topic}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{question.subtopic}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">L{question.difficulty} · {question.points} pts</span>
                {question.boards && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {question.boards.slice(0, 3).join(", ")}
                  </span>
                )}
                {isMultiSelect && <span className="rounded bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">Select all that apply</span>}
                {isEssay && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Essay · AI graded</span>}
              </div>

              <h2 className="mb-6 text-xl font-semibold leading-relaxed">{question.text}</h2>

              {question.formula && (
                <div className="mb-6 rounded-lg bg-muted/50 px-4 py-3 font-mono text-sm">{question.formula}</div>
              )}

              {/* MCQ Options */}
              {question.options && !isEssay && (
                <div className="mb-6 space-y-3">
                  {question.options.map((option, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = isMultiSelect ? selectedAnswers.has(option) : selectedAnswer === option;
                    const isOptionCorrect = option === question.correctAnswer;

                    let optionClass = "border-2 border-transparent hover:border-primary/20";
                    if (showFeedback && isOptionCorrect) optionClass = "stem-success-card";
                    else if (showFeedback && isSelected && !isOptionCorrect) optionClass = "stem-error-card";
                    else if (isSelected && !showFeedback) optionClass = "border-2 border-primary bg-primary/5";

                    return (
                      <button
                        key={option}
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
                      </button>
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
                  <p className="mt-2 text-xs text-muted-foreground">{question.points} marks available · Your answer will be graded by AI</p>
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
                      <span className="text-sm text-muted-foreground">— Correct: {question.correctAnswer}</span></>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
                <div className="stem-card mt-4 rounded-xl p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Step-by-Step Solution</span>
                  </div>
                  <div className="whitespace-pre-line font-mono text-sm text-muted-foreground">{question.workedSolution}</div>
                </div>
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
                    <ul className="space-y-1">
                      {aiGrading.strengths.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}
                    </ul>
                  </div>
                )}

                {aiGrading.improvements?.length > 0 && (
                  <div className="stem-card rounded-xl p-6">
                    <h4 className="mb-2 text-sm font-semibold text-warning">△ Improvements</h4>
                    <ul className="space-y-1">
                      {aiGrading.improvements.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}
                    </ul>
                  </div>
                )}

                {aiGrading.missing_points?.length > 0 && (
                  <div className="stem-card rounded-xl p-6">
                    <h4 className="mb-2 text-sm font-semibold text-destructive">✗ Missing Points</h4>
                    <ul className="space-y-1">
                      {aiGrading.missing_points.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}
                    </ul>
                  </div>
                )}

                {aiGrading.corrected_answer && (
                  <div className="stem-card rounded-xl p-6">
                    <h4 className="mb-2 text-sm font-semibold">Model Answer</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">{aiGrading.corrected_answer}</div>
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

            {/* AI Explanation */}
            {aiExplanation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stem-card mt-4 rounded-xl p-6">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">AI Tutor Explanation</span>
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Tuition Tips */}
            <AnimatePresence>
              {showTips && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mt-4 space-y-3">
                  <div className="stem-label flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5" /> Tuition Tips</div>
                  {question.tuitionTips.map((tip, i) => (
                    <div key={i} className="stem-tuition-tip">
                      <div className="text-xs font-semibold text-primary mb-1">Tip {i + 1}</div>
                      <p className="text-sm">{tip}</p>
                    </div>
                  ))}
                  <div className="rounded-lg bg-warning/10 border border-warning/20 p-4">
                    <div className="text-xs font-semibold text-warning mb-1">Exam Technique</div>
                    <p className="text-sm">{question.examTip}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
