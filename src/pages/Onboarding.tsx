import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { subjects, curricula } from "@/data/questions";

type Step = "welcome" | "curriculum" | "subjects" | "diagnostic" | "complete";

interface DiagnosticQ {
  id: string;
  question_text: string;
  options: any;
  correct_answer: string;
  subject: string;
  topic: string;
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [diagnosticQs, setDiagnosticQs] = useState<DiagnosticQ[]>([]);
  const [currentDiag, setCurrentDiag] = useState(0);
  const [diagAnswers, setDiagAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already onboarded
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("onboarding_complete")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.onboarding_complete) navigate("/dashboard", { replace: true });
      });
  }, [user, navigate]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const startDiagnostic = async () => {
    if (selectedSubjects.length === 0) {
      toast({ title: "Select at least one subject", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Fetch 2 questions per selected subject for diagnostic
    const allQs: DiagnosticQ[] = [];
    for (const subj of selectedSubjects) {
      const { data } = await supabase
        .from("questions")
        .select("id, question_text, options, correct_answer, subject, topic")
        .eq("subject", subj)
        .eq("question_type", "mcq")
        .limit(2);
      if (data) allQs.push(...(data as DiagnosticQ[]));
    }

    if (allQs.length === 0) {
      // Skip diagnostic if no questions available
      await completeOnboarding();
      return;
    }

    setDiagnosticQs(allQs.sort(() => Math.random() - 0.5));
    setStep("diagnostic");
    setLoading(false);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setSaving(true);

    // Save preferences
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      curriculum: selectedCurriculum,
      subjects: selectedSubjects,
      onboarding_complete: true,
    } as any);

    // Record diagnostic attempts
    for (let i = 0; i < diagnosticQs.length; i++) {
      if (diagAnswers[i]) {
        await supabase.from("attempts").insert({
          user_id: user.id,
          question_id: diagnosticQs[i].id,
          answer: diagAnswers[i],
          correct: diagAnswers[i] === diagnosticQs[i].correct_answer,
        });
      }
    }

    // Init user_stats if needed
    const { data: existingStats } = await supabase
      .from("user_stats")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existingStats) {
      await supabase.from("user_stats").insert({ user_id: user.id });
    }

    setSaving(false);
    setStep("complete");
  };

  const diagScore = diagnosticQs.length > 0
    ? Math.round(
        (Object.entries(diagAnswers).filter(
          ([i, a]) => a === diagnosticQs[Number(i)]?.correct_answer
        ).length /
          diagnosticQs.length) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16">
        {step === "welcome" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-3 text-3xl font-bold">Welcome to STEMCoach!</h1>
            <p className="mb-8 text-muted-foreground">
              Let's personalize your learning experience. This takes less than 2 minutes.
            </p>
            <Button size="lg" onClick={() => setStep("curriculum")} className="gap-2 rounded">
              Get Started <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === "curriculum" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h2 className="mb-2 text-2xl font-bold">Choose your curriculum</h2>
            <p className="mb-6 text-sm text-muted-foreground">Select the exam board you're studying for.</p>
            <div className="space-y-2">
              {curricula.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCurriculum(c.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    selectedCurriculum === c.id ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"
                  }`}
                >
                  <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.country}</div>
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setStep("subjects")}
              disabled={!selectedCurriculum}
              className="mt-6 w-full gap-2 rounded"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === "subjects" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h2 className="mb-2 text-2xl font-bold">Pick your subjects</h2>
            <p className="mb-6 text-sm text-muted-foreground">Select the subjects you want to practice.</p>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                    selectedSubjects.includes(s.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"
                  }`}
                >
                  <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{s.name}</span>
                </button>
              ))}
            </div>
            <Button
              onClick={startDiagnostic}
              disabled={selectedSubjects.length === 0 || loading}
              className="mt-6 w-full gap-2 rounded"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Take Diagnostic Quiz <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={completeOnboarding} className="mt-2 w-full rounded text-muted-foreground">
              Skip diagnostic
            </Button>
          </motion.div>
        )}

        {step === "diagnostic" && diagnosticQs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Diagnostic Quiz</h2>
              <span className="text-sm text-muted-foreground">
                {currentDiag + 1}/{diagnosticQs.length}
              </span>
            </div>

            <div className="stem-card rounded-xl p-6">
              <span className="mb-2 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {diagnosticQs[currentDiag].subject} · {diagnosticQs[currentDiag].topic}
              </span>
              <h3 className="mb-4 text-base font-semibold">{diagnosticQs[currentDiag].question_text}</h3>

              {(() => {
                const opts: string[] =
                  typeof diagnosticQs[currentDiag].options === "string"
                    ? JSON.parse(diagnosticQs[currentDiag].options)
                    : diagnosticQs[currentDiag].options || [];
                return (
                  <div className="space-y-2">
                    {opts.map((opt, oi) => (
                      <button
                        key={opt}
                        onClick={() => setDiagAnswers((p) => ({ ...p, [currentDiag]: opt }))}
                        className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-all ${
                          diagAnswers[currentDiag] === opt ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"
                        }`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="mt-4 flex gap-2">
              {currentDiag > 0 && (
                <Button variant="outline" onClick={() => setCurrentDiag((p) => p - 1)} className="rounded">
                  Previous
                </Button>
              )}
              {currentDiag < diagnosticQs.length - 1 ? (
                <Button onClick={() => setCurrentDiag((p) => p + 1)} className="flex-1 rounded">
                  Next
                </Button>
              ) : (
                <Button onClick={completeOnboarding} disabled={saving} className="flex-1 rounded">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Finish
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10">
              <GraduationCap className="h-10 w-10 text-success" />
            </div>
            <h1 className="mb-3 text-3xl font-bold">You're all set!</h1>
            {diagnosticQs.length > 0 && (
              <p className="mb-2 text-lg text-muted-foreground">
                Diagnostic score: <span className="font-bold text-primary">{diagScore}%</span>
              </p>
            )}
            <p className="mb-8 text-muted-foreground">
              Your personalized study plan is ready. Let's start learning!
            </p>
            <Button size="lg" onClick={() => navigate("/dashboard")} className="gap-2 rounded">
              Go to Dashboard <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
