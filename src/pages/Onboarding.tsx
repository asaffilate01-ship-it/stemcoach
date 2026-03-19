import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, ChevronRight, Loader2, Sparkles, Layers, CreditCard } from "lucide-react";
import { subjects, curricula } from "@/data/questions";

type Step = "welcome" | "curriculum" | "preview" | "go-pay";

const LEVELS = [
  { id: "year-9", label: "Year 9", description: "Foundation level" },
  { id: "gcse", label: "GCSE", description: "Key Stage 4" },
  { id: "igcse", label: "IGCSE", description: "International GCSE" },
  { id: "a-level", label: "A-Level", description: "Advanced Level" },
  { id: "ib-sl", label: "IB SL", description: "Standard Level" },
  { id: "ib-hl", label: "IB HL", description: "Higher Level" },
  { id: "ap", label: "AP", description: "Advanced Placement" },
  { id: "university", label: "University", description: "Undergraduate" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");

  useEffect(() => {
    if (!user) return;
    // If user already has quota with subjects, skip to dashboard
    supabase
      .from("user_quotas")
      .select("total_questions, subjects")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.total_questions > 0 && data?.subjects?.length > 0) {
          navigate("/dashboard", { replace: true });
        } else if (data?.total_questions > 0) {
          // Paid but hasn't selected subjects yet
          navigate("/select-subjects", { replace: true });
        }
      });
  }, [user, navigate]);

  const saveCurriculumAndContinue = async () => {
    if (!user || !selectedCurriculum) return;
    // Save curriculum preference (no quota creation!)
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      curriculum: selectedCurriculum,
      onboarding_complete: false,
    } as any);
    setStep("preview");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16">
          {step === "welcome" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="mb-3 text-3xl font-bold">Welcome to STEMCoach!</h1>
              <p className="mb-8 text-muted-foreground">
                Let's get you set up. First, we'll find the right curriculum for you.
              </p>
              <Button size="lg" onClick={() => setStep("curriculum")} className="gap-2 rounded-xl">
                Get Started <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === "curriculum" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <h2 className="mb-2 text-2xl font-bold">Choose your curriculum</h2>
              <p className="mb-6 text-sm text-muted-foreground">Select the exam board you're studying for.</p>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
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
                onClick={saveCurriculumAndContinue}
                disabled={!selectedCurriculum}
                className="mt-6 w-full gap-2 rounded-xl"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <h2 className="mb-2 text-2xl font-bold">Here's what you'll get</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                After purchasing, you'll choose your subjects and levels to unlock your questions.
              </p>

              <div className="mb-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <BookOpen className="h-4 w-4" /> Available Subjects
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Layers className="h-4 w-4" /> Available Levels
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {LEVELS.map((l) => (
                    <div key={l.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-primary">5,000 questions + 20 mock exams per pack</p>
                <p className="text-xs text-muted-foreground">Split across your chosen subjects & levels · STEMcoach coaching included</p>
              </div>

              <Button
                size="lg"
                onClick={() => navigate("/pricing")}
                className="mt-6 w-full gap-2 rounded-xl"
              >
                <CreditCard className="h-4 w-4" /> View Plans & Purchase
              </Button>
            </motion.div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
