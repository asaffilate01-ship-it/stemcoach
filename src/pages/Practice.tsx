import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { subjects, sampleQuestions, type Question } from "@/data/questions";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Lightbulb, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Practice() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const subject = subjects.find((s) => s.id === subjectId);

  const questions = useMemo(
    () => sampleQuestions.filter((q) => q.subject === subjectId),
    [subjectId]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

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
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowFeedback(true);
    setScore((prev) => ({
      correct: prev.correct + (selectedAnswer === question.correctAnswer ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowTips(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/subjects")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Subjects
          </button>
          <div className="flex items-center gap-4">
            <span className="stem-label">
              {score.correct}/{score.total} correct
            </span>
            <span className="stem-label">
              Q{currentIndex + 1}/{questions.length}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          >
            <div className="stem-card rounded-xl p-6 md:p-8">
              {/* Meta */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {subject.name}
                </span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {question.topic}
                </span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {question.subtopic}
                </span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  L{question.difficulty} · {question.points} pts
                </span>
              </div>

              {/* Question Text */}
              <h2 className="mb-6 text-xl font-semibold leading-relaxed">{question.text}</h2>

              {/* Formula Reference */}
              {question.formula && (
                <div className="mb-6 rounded-lg bg-muted/50 px-4 py-3 font-mono text-sm">
                  {question.formula}
                </div>
              )}

              {/* Options */}
              {question.options && (
                <div className="mb-6 space-y-3">
                  {question.options.map((option, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = selectedAnswer === option;
                    const isOptionCorrect = option === question.correctAnswer;

                    let optionClass = "border-2 border-transparent hover:border-primary/20";
                    if (showFeedback && isOptionCorrect) {
                      optionClass = "stem-success-card";
                    } else if (showFeedback && isSelected && !isOptionCorrect) {
                      optionClass = "stem-error-card";
                    } else if (isSelected && !showFeedback) {
                      optionClass = "border-2 border-primary bg-primary/5";
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => !showFeedback && setSelectedAnswer(option)}
                        disabled={showFeedback}
                        className={`flex w-full items-center gap-3 rounded-lg p-4 text-left transition-all ${optionClass}`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">
                          {letter}
                        </span>
                        <span className="text-sm font-medium">{option}</span>
                        {showFeedback && isOptionCorrect && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-success" />
                        )}
                        {showFeedback && isSelected && !isOptionCorrect && (
                          <XCircle className="ml-auto h-5 w-5 text-destructive" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!showFeedback ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer}
                    className="rounded"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleNext} className="gap-2 rounded">
                      Next Question <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowTips(!showTips)}
                      className="gap-2 rounded"
                    >
                      <Lightbulb className="h-4 w-4" />
                      {showTips ? "Hide Tips" : "Tuition Tips"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Feedback Panel */}
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className="mt-4"
              >
                <div
                  className={`rounded-xl p-6 ${
                    isCorrect
                      ? "bg-success/5 border border-success/20"
                      : "bg-destructive/5 border border-destructive/20"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="font-semibold text-success">Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-destructive" />
                        <span className="font-semibold text-destructive">Incorrect</span>
                        <span className="text-sm text-muted-foreground">
                          — Correct answer: {question.correctAnswer}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>

                {/* Worked Solution */}
                <div className="stem-card mt-4 rounded-xl p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Step-by-Step Solution</span>
                  </div>
                  <div className="whitespace-pre-line font-mono text-sm text-muted-foreground">
                    {question.workedSolution}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tuition Tips */}
            <AnimatePresence>
              {showTips && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="mt-4 space-y-3"
                >
                  <div className="stem-label flex items-center gap-2">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Tuition Tips
                  </div>
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
