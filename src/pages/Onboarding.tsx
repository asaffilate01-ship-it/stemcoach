import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, ChevronRight, Loader2, Sparkles, Layers, CreditCard } from "lucide-react";
import { subjects, curricula } from "@/data/questions";
import { getSquadMembers, getCoachStem } from "@/lib/mascots";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Step = "welcome" | "meet-squad" | "curriculum" | "preview" | "go-pay";

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
  useDocumentTitle("Get Started");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [squadIndex, setSquadIndex] = useState(0);

  const squadMembers = getSquadMembers().filter(m => m.name !== "Lexi" || m.subjectId === "ielts");
  const coach = getCoachStem();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_quotas")
      .select("total_questions, subjects")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.total_questions > 0 && data?.subjects?.length > 0) {
          navigate("/dashboard", { replace: true });
        } else if (data?.total_questions > 0) {
          navigate("/select-subjects", { replace: true });
        }
      });
  }, [user, navigate]);

  const saveCurriculumAndContinue = async () => {
    if (!user || !selectedCurriculum) return;
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      curriculum: selectedCurriculum,
      onboarding_complete: false,
    } as any);
    setStep("preview");
  };

  const currentMascot = squadMembers[squadIndex];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16">
          {/* Progress dots */}
          <div className="mb-8 flex items-center gap-2">
            {["welcome", "meet-squad", "curriculum", "preview"].map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s ? "w-8 bg-primary" : i < ["welcome", "meet-squad", "curriculum", "preview"].indexOf(step) ? "w-2 bg-primary/50" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === "welcome" && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-lg">
                  <img src={coach.image} alt={coach.name} className="h-full w-full object-cover" />
                </div>
                <h1 className="mb-3 text-3xl font-bold">Welcome to STEMCoach!</h1>
                <p className="mb-2 text-muted-foreground">
                  I'm <strong className="text-foreground">{coach.name}</strong>, and I lead the STEM Squad.
                </p>
                <p className="mb-8 text-sm text-muted-foreground">
                  Let me introduce you to my team — they'll be your personal tutors!
                </p>
                <Button size="lg" onClick={() => setStep("meet-squad")} className="gap-2 rounded-xl">
                  Meet the Squad <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === "meet-squad" && currentMascot && (
              <motion.div
                key={`squad-${squadIndex}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="w-full text-center"
              >
                <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-lg">
                  <img src={currentMascot.image} alt={currentMascot.name} className="h-full w-full object-cover" />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                  {squadIndex + 1} of {squadMembers.length}
                </div>
                <h2 className="mb-1 text-2xl font-bold">
                  Hi, I'm {currentMascot.name}! {currentMascot.emoji}
                </h2>
                <p className="mb-2 text-sm italic text-muted-foreground">"{currentMascot.personality}"</p>
                <p className="mb-6 text-sm text-muted-foreground leading-relaxed">{currentMascot.bio}</p>

                {/* Tip bubble */}
                <div className="mx-auto mb-6 max-w-sm rounded-xl border bg-primary/5 px-4 py-3 text-left">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">💡 My top tip</div>
                  <p className="text-xs text-foreground">{currentMascot.tips[0]}</p>
                </div>

                <div className="flex justify-center gap-3">
                  {squadIndex > 0 && (
                    <Button variant="outline" onClick={() => setSquadIndex(i => i - 1)} className="rounded-xl">
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      if (squadIndex < squadMembers.length - 1) {
                        setSquadIndex(i => i + 1);
                      } else {
                        setStep("curriculum");
                      }
                    }}
                    className="gap-2 rounded-xl"
                  >
                    {squadIndex < squadMembers.length - 1 ? (
                      <>Next Mascot <ChevronRight className="h-4 w-4" /></>
                    ) : (
                      <>Let's Go! <Sparkles className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "curriculum" && (
              <motion.div key="curriculum" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
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
              <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
                <h2 className="mb-2 text-2xl font-bold">Here's what you'll get</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  After purchasing, you'll choose your subjects and levels to unlock your questions.
                </p>

                <div className="mb-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <BookOpen className="h-4 w-4" /> Available Subjects
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map((s) => {
                      const mascot = squadMembers.find(m => m.subjectId === s.id);
                      return (
                        <div key={s.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                          {mascot ? (
                            <img src={mascot.image} alt={mascot.name} className="h-5 w-5 rounded object-cover" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                          )}
                          {s.name}
                        </div>
                      );
                    })}
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
          </AnimatePresence>
        </main>
      </PageTransition>
    </div>
  );
}
