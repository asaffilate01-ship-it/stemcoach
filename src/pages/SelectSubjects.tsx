import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { BookOpen, Layers, ChevronRight, Loader2, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { subjects } from "@/data/questions";
import { calculateQuestionAllocation } from "@/lib/subscriptionTiers";

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

type Step = "verifying" | "subjects" | "levels" | "confirm" | "done";

export default function SelectSubjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("verifying");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [quota, setQuota] = useState<{ total_questions: number; used_questions: number } | null>(null);

  // Step 1: Verify purchase on mount
  useEffect(() => {
    if (!user) return;

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-purchase");
        if (error) throw error;

        if (data?.quota?.total_questions > 0) {
          setQuota(data.quota);

          // For top-ups: if subjects already selected, allow re-selection
          // For first purchase: go to subject selection
          // If already selected AND not a new purchase, go to dashboard
          if (data.quota.subjects?.length > 0 && !data?.granted) {
            navigate("/dashboard", { replace: true });
            return;
          }

          setStep("subjects");
        } else {
          toast({ title: "No purchase found", description: "Please complete a purchase first.", variant: "destructive" });
          navigate("/pricing", { replace: true });
        }
      } catch {
        toast({ title: "Verification failed", description: "Please try again.", variant: "destructive" });
        navigate("/pricing", { replace: true });
      }
    };

    verify();
  }, [user, navigate, toast]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleLevel = (id: string) => {
    setSelectedLevels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const allocationSummary = () => {
    if (!quota) return "";
    const alloc = calculateQuestionAllocation(quota.total_questions, selectedSubjects, selectedLevels);
    return `${alloc.perSubject.toLocaleString()} questions per subject, ${alloc.perLevel.toLocaleString()} per level`;
  };

  const confirmSelection = async () => {
    if (!user || selectedSubjects.length === 0 || selectedLevels.length === 0) return;
    setSaving(true);

    try {
      const { data, error } = await supabase.rpc("confirm_subject_selection", {
        _user_id: user.id,
        _subjects: selectedSubjects,
        _levels: selectedLevels,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) throw new Error(result.error);

      setStep("done");
    } catch (err: any) {
      toast({ title: "Error saving selection", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16">
          {step === "verifying" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h2 className="text-xl font-bold">Verifying your purchase...</h2>
              <p className="text-sm text-muted-foreground">This will only take a moment.</p>
            </motion.div>
          )}

          {step === "subjects" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Payment confirmed!</h2>
                  <p className="text-sm text-muted-foreground">
                    {quota?.total_questions.toLocaleString()} questions unlocked. Choose your subjects.
                  </p>
                </div>
              </div>

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
                onClick={() => setStep("levels")}
                disabled={selectedSubjects.length === 0}
                className="mt-6 w-full gap-2 rounded-xl"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === "levels" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <h2 className="mb-2 text-2xl font-bold">Select your level</h2>
              <p className="mb-6 text-sm text-muted-foreground">Choose which academic level(s) you're studying at.</p>

              <div className="grid grid-cols-2 gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => toggleLevel(l.id)}
                    className={`flex flex-col rounded-xl border-2 p-3 text-left transition-all ${
                      selectedLevels.includes(l.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-medium">{l.label}</span>
                    </div>
                    <span className="mt-1 text-xs text-muted-foreground">{l.description}</span>
                  </button>
                ))}
              </div>

              {selectedLevels.length > 0 && (
                <p className="mt-4 rounded-lg bg-primary/5 p-3 text-center text-xs text-primary font-medium">
                  📦 Your allocation: {allocationSummary()}
                </p>
              )}

              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => setStep("subjects")} className="rounded-xl">
                  Back
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  disabled={selectedLevels.length === 0}
                  className="flex-1 gap-2 rounded-xl"
                >
                  Review <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <h2 className="mb-6 text-2xl font-bold">Confirm your selection</h2>

              <div className="space-y-4">
                <div className="rounded-xl border p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subjects</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((s) => {
                      const sub = subjects.find((x) => x.id === s);
                      return (
                        <span key={s} className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {sub?.name || s}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Levels</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLevels.map((l) => {
                      const lev = LEVELS.find((x) => x.id === l);
                      return (
                        <span key={l} className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {lev?.label || l}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Question Allocation</div>
                  <div className="text-lg font-bold">{allocationSummary()}</div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Your selection is locked after confirmation. Contact support if you need to change subjects later.</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => setStep("levels")} className="rounded-xl">
                  Back
                </Button>
                <Button onClick={confirmSelection} disabled={saving} className="flex-1 gap-2 rounded-xl">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm & Start Learning
                </Button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--success)/0.1)]">
                <Sparkles className="h-10 w-10 text-[hsl(var(--success))]" />
              </div>
              <h1 className="mb-3 text-3xl font-bold">You're all set!</h1>
              <p className="mb-2 text-lg text-muted-foreground">
                {selectedSubjects.length} subject{selectedSubjects.length > 1 ? "s" : ""} ·{" "}
                {selectedLevels.length} level{selectedLevels.length > 1 ? "s" : ""} activated
              </p>
              <p className="mb-8 text-muted-foreground">Your personalized study plan is ready.</p>
              <Button size="lg" onClick={() => navigate("/dashboard")} className="gap-2 rounded-xl">
                Go to Dashboard <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
