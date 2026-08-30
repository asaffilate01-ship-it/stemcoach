import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Award, Zap, BarChart3, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MockExamTemplate } from "@/data/mockExamTemplates";
import { useTranslation } from "react-i18next";

interface ExamQuestion {
  id: string;
  question_text: string;
  options: any;
  correct_answer?: string;
  topic: string;
  subject: string;
  difficulty: number;
  points: number;
  explanation?: string;
  worked_solution?: string;
}

interface ExamReviewProps {
  questions: ExamQuestion[];
  answers: Record<number, string>;
  flagged: Set<number>;
  selectedTemplate: MockExamTemplate | null;
  onBrowse: () => void;
}

export function ExamReview({ questions, answers, flagged, selectedTemplate, onBrowse }: ExamReviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showReviewDetail, setShowReviewDetail] = useState(false);

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0), 0);
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const answered = Object.keys(answers).length;

  const gradeColor =
    percent >= 80 ? "text-emerald-500" : percent >= 60 ? "text-primary" : "text-destructive";
  const gradeLabel =
    percent >= 80 ? t("mockExam.outstanding") : percent >= 60 ? t("mockExam.goodEffort") : t("mockExam.keepPractising");
  const gradeBg =
    percent >= 80
      ? "from-emerald-500/10 to-emerald-500/5"
      : percent >= 60
      ? "from-primary/10 to-primary/5"
      : "from-destructive/10 to-destructive/5";

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="rounded-3xl border border-border/40 bg-card p-8 md:p-12 shadow-[var(--stem-card-shadow)]">
          {/* Achievement Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${gradeBg} ring-1 ring-border/20`}
            >
              {percent >= 80 ? (
                <Star className="h-12 w-12 text-emerald-500" />
              ) : percent >= 60 ? (
                <TrendingUp className="h-12 w-12 text-primary" />
              ) : (
                <BarChart3 className="h-12 w-12 text-destructive/70" />
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl"
            >
              {t("mockExam.examComplete")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`text-lg font-bold ${gradeColor}`}
            >
              {gradeLabel}
            </motion.p>
            {selectedTemplate && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-1 text-sm text-muted-foreground"
              >
                {selectedTemplate.name}
              </motion.p>
            )}
          </div>

          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mb-8 flex items-center justify-center gap-10"
          >
            <div className="text-center">
              <div className="text-5xl font-extrabold tracking-tight">
                {score}
                <span className="text-2xl text-muted-foreground/50">/{questions.length}</span>
              </div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("mockExam.correct")}
              </div>
            </div>
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="text-center">
              <div className={`text-5xl font-extrabold tracking-tight ${gradeColor}`}>{percent}%</div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("mockExam.accuracy")}
              </div>
            </div>
          </motion.div>

          {/* Stats breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 grid grid-cols-3 gap-4 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 p-5 ring-1 ring-border/15"
          >
            <div className="text-center">
              <div className="text-lg font-extrabold text-foreground">{answered}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("mockExam.answered")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-extrabold text-amber-500">{flagged.size}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("mockExam.flagged")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-extrabold text-muted-foreground">{questions.length - answered}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("mockExam.skipped")}
              </div>
            </div>
          </motion.div>

          {/* Certificate Banner */}
          {percent >= 60 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-8 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/[0.06] to-primary/[0.02] p-4 ring-1 ring-primary/10"
            >
              <div className="flex items-center justify-center gap-2.5 text-sm font-bold text-primary">
                <Award className="h-5 w-5" />
                {t("mockExam.certificateProfile")}
              </div>
            </motion.div>
          )}

          {/* Review Toggle */}
          <div className="text-center mb-6">
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-border/40 font-bold"
              onClick={() => setShowReviewDetail(!showReviewDetail)}
            >
              <BarChart3 className="h-4 w-4" />
              {showReviewDetail ? t("mockExam.hideAnswers") : t("mockExam.review")}
            </Button>
          </div>

          <AnimatePresence>
            {showReviewDetail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 space-y-3 overflow-hidden text-left"
              >
                {questions.map((q, i) => {
                  const correct = answers[i] === q.correct_answer;
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-xl border-2 p-5 ${
                        correct
                          ? "border-emerald-500/15 bg-emerald-500/[0.03]"
                          : "border-destructive/15 bg-destructive/[0.03]"
                      }`}
                    >
                      <div className="mb-2 flex items-start gap-2.5">
                        {correct ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        )}
                        <div className="text-sm font-semibold">
                          Q{i + 1}: {q.question_text}
                        </div>
                      </div>
                      {!correct && (
                        <div className="ml-6.5 mb-2 text-xs text-muted-foreground" style={{ marginLeft: 26 }}>
                          {t("mockExam.yourAnswer")}:{" "}
                          <span className="font-bold text-destructive">{answers[i] || "—"}</span> ·
                          {t("mockExam.correctAnswer")}:{" "}
                          <span className="font-bold text-emerald-500">{q.correct_answer}</span>
                        </div>
                      )}
                      <div className="text-xs leading-relaxed text-muted-foreground" style={{ marginLeft: 26 }}>
                        {q.explanation}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => navigate("/certificates")}
              variant="outline"
              className="gap-2 rounded-xl border-border/40 font-bold"
            >
              <Award className="h-4 w-4" /> {t("nav.certificates")}
            </Button>
            <Button
              onClick={onBrowse}
              className="gap-2 rounded-xl shadow-lg shadow-primary/20 font-bold"
            >
              <Zap className="h-4 w-4" /> {t("mockExam.browse")}
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
