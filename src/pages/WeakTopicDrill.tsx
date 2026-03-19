import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Target, Loader2, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";

interface WeakTopic {
  subject: string;
  topic: string;
  accuracy: number;
  attempts: number;
}

interface DrillQuestion {
  id: string;
  question_text: string;
  subject: string;
  topic: string;
  difficulty: number;
  correct_answer: string;
  options: string[] | null;
  explanation: string;
}

interface AIPlan {
  plans: { topic: string; subject: string; advice: string; focus_areas: string[] }[];
}

export default function WeakTopicDrill() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [drillQuestions, setDrillQuestions] = useState<DrillQuestion[]>([]);
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [analyzed, setAnalyzed] = useState(false);
  const [drilling, setDrilling] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("weak-topic-drill");
      if (error) throw error;
      setWeakTopics(data.weak_topics || []);
      setDrillQuestions(data.drill_questions || []);
      setAiPlan(data.ai_plan || null);
      setAnalyzed(true);
      if (data.weak_topics?.length === 0) {
        toast({ title: "No weak topics found! You're doing great! 🎉" });
      }
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startDrill = () => {
    setDrilling(true);
    setCurrentQ(0);
    setScore({ correct: 0, total: 0 });
    setSelected(null);
    setShowFeedback(false);
  };

  const submitAnswer = async () => {
    if (!selected) return;
    setShowFeedback(true);
    const q = drillQuestions[currentQ];
    const correct = selected === q.correct_answer;
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));

    if (user) {
      await supabase.from("attempts").insert({
        user_id: user.id,
        question_id: q.id,
        answer: selected,
        correct,
      });
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowFeedback(false);
    if (currentQ + 1 < drillQuestions.length) {
      setCurrentQ(prev => prev + 1);
    } else {
      setDrilling(false);
      toast({ title: `Drill complete! ${score.correct}/${score.total} correct` });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Sign in to access STEMcoach-powered drills.</div>
      </div>
    );
  }

  const question = drillQuestions[currentQ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">STEMcoach Practice</div>
          <h1 className="stem-heading text-3xl">Weak Topic Drills</h1>
          <p className="mt-2 text-sm text-muted-foreground">STEMcoach analyzes your performance and creates targeted practice sets for your weakest areas.</p>
        </div>

        {!analyzed && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stem-card rounded-xl p-8 text-center">
            <Brain className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Analyze Your Performance</h3>
            <p className="mb-6 text-sm text-muted-foreground">AI will review your past answers to identify weak areas and generate targeted practice questions.</p>
            <Button onClick={analyze} disabled={loading} className="gap-2 rounded-xl">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4" /> Start Analysis</>}
            </Button>
          </motion.div>
        )}

        {analyzed && !drilling && (
          <div className="space-y-6">
            {weakTopics.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stem-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Weak Topics Identified
                </h3>
                <div className="space-y-3">
                  {weakTopics.map((wt, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-medium">{wt.topic}</div>
                        <div className="text-xs text-muted-foreground">{wt.subject} · {wt.attempts} attempts</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={wt.accuracy} className="h-2 w-20" />
                        <span className={`text-sm font-bold ${wt.accuracy < 40 ? "text-destructive" : "text-warning"}`}>{wt.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {aiPlan?.plans && aiPlan.plans.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stem-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Study Plan
                </h3>
                <div className="space-y-4">
                  {aiPlan.plans.map((plan, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="mb-1 text-sm font-semibold">{plan.topic}</div>
                      <div className="mb-2 text-xs text-muted-foreground">{plan.subject}</div>
                      <p className="mb-2 text-sm text-muted-foreground">{plan.advice}</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.focus_areas.map((f, j) => (
                          <span key={j} className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{f}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {drillQuestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
                <Button onClick={startDrill} size="lg" className="gap-2 rounded-xl">
                  <Target className="h-5 w-5" /> Start Targeted Drill ({drillQuestions.length} questions)
                </Button>
              </motion.div>
            )}

            {weakTopics.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stem-card rounded-xl p-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
                <h3 className="text-lg font-semibold">No Weak Topics!</h3>
                <p className="text-sm text-muted-foreground">Keep practicing to maintain your performance.</p>
              </motion.div>
            )}
          </div>
        )}

        {drilling && question && (
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="stem-card rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{question.subject}</span>
                  <span className="rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">{question.topic}</span>
                </div>
                <span className="text-sm text-muted-foreground">{currentQ + 1}/{drillQuestions.length}</span>
              </div>

              <h2 className="mb-6 text-lg font-semibold leading-relaxed">{question.question_text}</h2>

              {question.options && (
                <div className="mb-6 space-y-3">
                  {(question.options as string[]).map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    let cls = "border-2 border-transparent hover:border-primary/20";
                    if (showFeedback && opt === question.correct_answer) cls = "stem-success-card";
                    else if (showFeedback && selected === opt) cls = "stem-error-card";
                    else if (selected === opt) cls = "border-2 border-primary bg-primary/5";

                    return (
                      <button
                        key={opt}
                        onClick={() => !showFeedback && setSelected(opt)}
                        disabled={showFeedback}
                        className={`flex w-full items-center gap-3 rounded-xl p-4 text-left transition-all ${cls}`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{letter}</span>
                        <span className="text-sm font-medium">{opt}</span>
                        {showFeedback && opt === question.correct_answer && <CheckCircle2 className="ml-auto h-5 w-5 text-success" />}
                        {showFeedback && selected === opt && opt !== question.correct_answer && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {showFeedback && question.explanation && (
                <div className="mb-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{question.explanation}</div>
              )}

              <div className="flex gap-3">
                {!showFeedback ? (
                  <Button onClick={submitAnswer} disabled={!selected} className="rounded-xl">Submit</Button>
                ) : (
                  <Button onClick={nextQuestion} className="gap-2 rounded-xl">
                    {currentQ + 1 < drillQuestions.length ? <>Next <ArrowRight className="h-4 w-4" /></> : "Finish Drill"}
                  </Button>
                )}
                <div className="ml-auto text-sm text-muted-foreground self-center">{score.correct}/{score.total} correct</div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        </main>
      </PageTransition>
    </div>
  );
}
