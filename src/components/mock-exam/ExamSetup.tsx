import { motion } from "framer-motion";
import { Clock, BookOpen, Award, Loader2, ChevronLeft, Target, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subjects, curricula } from "@/data/questions";
import { type MockExamTemplate } from "@/data/mockExamTemplates";

interface ExamSetupProps {
  selectedTemplate: MockExamTemplate | null;
  examSubject: string;
  setExamSubject: (s: string) => void;
  examCurriculum: string;
  setExamCurriculum: (c: string) => void;
  questionCount: number;
  setQuestionCount: (n: number) => void;
  duration: number;
  setDuration: (n: number) => void;
  isLoading: boolean;
  onStart: () => void;
  onBack: () => void;
  mockExamsRemaining?: number;
  mockExamsTotal?: number;
  canTakeMockExam?: boolean;
}

export function ExamSetup({
  selectedTemplate,
  examSubject,
  setExamSubject,
  examCurriculum,
  setExamCurriculum,
  questionCount,
  setQuestionCount,
  duration,
  setDuration,
  isLoading,
  onStart,
  onBack,
  mockExamsRemaining,
  mockExamsTotal,
  canTakeMockExam = true,
}: ExamSetupProps) {
  const subjectInfo = selectedTemplate
    ? subjects.find((s) => s.id === selectedTemplate.subject)
    : subjects.find((s) => s.id === examSubject);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Exams
        </Button>

        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10"
            style={{ width: 72, height: 72 }}
          >
            {selectedTemplate ? (
              <span className="text-3xl">{selectedTemplate.icon}</span>
            ) : (
              <Clock className="h-8 w-8 text-primary" />
            )}
          </motion.div>
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight md:text-3xl">
            {selectedTemplate ? selectedTemplate.name : "Custom Mock Exam"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {selectedTemplate
              ? `${selectedTemplate.board} · ${selectedTemplate.paper} · ${selectedTemplate.description}`
              : "Configure your own exam from the question bank"}
          </p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-6 md:p-8 shadow-[var(--stem-card-shadow)]">
          <div className="space-y-6">
            {selectedTemplate ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 p-6 ring-1 ring-border/20">
                {[
                  { label: "Questions", value: selectedTemplate.questionCount, icon: Target, color: "text-primary" },
                  { label: "Duration", value: `${selectedTemplate.durationMinutes}m`, icon: Clock, color: "text-amber-500" },
                  { label: "Marks", value: selectedTemplate.totalMarks, icon: Award, color: "text-emerald-500" },
                  { label: "Board", value: selectedTemplate.board.split(" ")[0], icon: BookOpen, color: "text-violet-500" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                  >
                    <stat.icon className={`mx-auto mb-2 h-5 w-5 ${stat.color}`} />
                    <div className="text-xl font-extrabold tracking-tight">{stat.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Subject</label>
                    <select
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Curriculum</label>
                    <select
                      value={examCurriculum}
                      onChange={(e) => setExamCurriculum(e.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    >
                      {curricula.map((c) => (
                        <option key={c.id} value={c.id}>{c.country} {c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Questions</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    >
                      {[10, 20, 30, 40, 50].map((n) => (
                        <option key={n} value={n}>{n} questions</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    >
                      {[30, 45, 60, 90, 120, 150, 180].map((n) => (
                        <option key={n} value={n}>{n} minutes</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 p-5 ring-1 ring-border/20">
                  {[
                    { label: "Questions", value: questionCount, icon: Target },
                    { label: "Duration", value: `${duration}m`, icon: Clock },
                    { label: "Subject", value: subjectInfo?.name?.slice(0, 8) || "", icon: BookOpen },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <stat.icon className="mx-auto mb-1.5 h-4 w-4 text-primary/60" />
                      <div className="text-lg font-bold tracking-tight">{stat.value}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Exam conditions notice */}
            <div className="flex items-center gap-3 rounded-xl bg-primary/[0.04] px-4 py-3 ring-1 ring-primary/10">
              <Shield className="h-4 w-4 text-primary/60 shrink-0" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Exam conditions: timed, auto-submitted when time expires. Score ≥ 60% earns a certificate.
              </p>
            </div>

            <Button
              onClick={onStart}
              size="lg"
              className="w-full gap-2.5 rounded-xl text-base font-bold shadow-lg shadow-primary/20 h-13 transition-all hover:shadow-xl hover:shadow-primary/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading Questions…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Start Exam
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
