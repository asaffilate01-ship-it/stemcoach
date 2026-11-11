import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Target, Loader2, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { listDrillTopics, parseDrillOptions, selectDrillQuestions, type DrillFocus } from "@/lib/weakDrillSession";

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
  options: unknown;
}

interface AIPlan {
  plans: { topic: string; subject: string; advice: string; focus_areas: string[] }[];
}

export default function WeakTopicDrill() {
  useDocumentTitle("Weak Topic Drill");
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [drillQuestions, setDrillQuestions] = useState<DrillQuestion[]>([]);
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; correct_answer: string; explanation?: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [analyzed, setAnalyzed] = useState(false);
  const [drilling, setDrilling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<DrillQuestion[]>([]);
  const [activeFocus, setActiveFocus] = useState<DrillFocus | null>(null);
  const [lastSession, setLastSession] = useState<{ correct: number; total: number } | null>(null);
  const requestVersion = useRef(0);
  const analysisInFlight = useRef(false);
  const answerInFlight = useRef(false);
  const userId = user?.id;
  const topicOptions = useMemo(() => listDrillTopics(drillQuestions), [drillQuestions]);

  // A late response from a previous signed-in learner must not render here.
  useEffect(() => {
    requestVersion.current++;
    analysisInFlight.current = false;
    answerInFlight.current = false;
    setLoading(false);
    setSubmitting(false);
    setWeakTopics([]);
    setDrillQuestions([]);
    setActiveQuestions([]);
    setActiveFocus(null);
    setAiPlan(null);
    setAnalyzed(false);
    setDrilling(false);
    setLastSession(null);
    setScore({ correct: 0, total: 0 });
    return () => { requestVersion.current++; };
  }, [userId]);

  const analyze = async () => {
    if (!userId || analysisInFlight.current) return;
    analysisInFlight.current = true;
    const version = ++requestVersion.current;
    setLoading(true);
    setAnalyzed(false);
    setLastSession(null);
    try {
      const { data, error } = await supabase.functions.invoke("weak-topic-drill");
      if (error) throw error;
      if (version !== requestVersion.current) return;

      const safeQuestions = Array.isArray(data?.drill_questions)
        ? data.drill_questions.filter((question: DrillQuestion) =>
            question && typeof question.id === "string" &&
            typeof question.subject === "string" && typeof question.topic === "string" &&
            typeof question.question_text === "string")
        : [];
      setWeakTopics(Array.isArray(data?.weak_topics) ? data.weak_topics : []);
      setDrillQuestions(safeQuestions);
      setAiPlan(Array.isArray(data?.ai_plan?.plans) ? data.ai_plan : null);
      setAnalyzed(true);
      if (!Array.isArray(data?.weak_topics) || data.weak_topics.length === 0) {
        toast({ title: "No weak-topic pattern identified", description: "This may mean you need more completed practice to see a pattern." });
      }
    } catch (error) {
      if (version === requestVersion.current) {
        toast({ title: "Analysis failed", description: error instanceof Error ? error.message : "Please retry.", variant: "destructive" });
      }
    } finally {
      if (version === requestVersion.current) {
        analysisInFlight.current = false;
        setLoading(false);
      }
    }
  };

  const startDrill = (focus?: DrillFocus) => {
    const session = selectDrillQuestions(drillQuestions, focus);
    if (!session.length) return;
    requestVersion.current++;
    setActiveQuestions(session);
    setActiveFocus(focus || null);
    setLastSession(null);
    setDrilling(true);
    setCurrentQ(0);
    setScore({ correct: 0, total: 0 });
    setSelected(null);
    setShowFeedback(false);
    setAnswerResult(null);
    setSubmitting(false);
    answerInFlight.current = false;
  };

  const submitAnswer = async () => {
    const q = activeQuestions[currentQ];
    const answer = selected?.trim();
    if (!q || !answer || showFeedback || answerInFlight.current) return;
    const version = requestVersion.current;
    answerInFlight.current = true;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-answer", {
        body: { question_id: q.id, answer },
      });
      if (error) throw error;
      if (version !== requestVersion.current) return;
      if (!data || typeof data.correct !== "boolean") throw new Error("Answer feedback was incomplete. Please retry.");
      setAnswerResult({
        correct: data.correct,
        correct_answer: typeof data.correct_answer === "string" ? data.correct_answer : "",
        explanation: typeof data.explanation === "string" ? data.explanation : undefined,
      });
      setShowFeedback(true);
      setScore(prev => ({ correct: prev.correct + (data.correct ? 1 : 0), total: prev.total + 1 }));
    } catch (error) {
      if (version === requestVersion.current) {
        toast({ title: "Could not submit answer", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
      }
    } finally {
      if (version === requestVersion.current) {
        answerInFlight.current = false;
        setSubmitting(false);
      }
    }
  };

  const nextQuestion = () => {
    if (!showFeedback || submitting) return;
    setSelected(null);
    setShowFeedback(false);
    setAnswerResult(null);
    if (currentQ + 1 < activeQuestions.length) {
      setCurrentQ(prev => prev + 1);
    } else {
      requestVersion.current++;
      setDrilling(false);
      setLastSession({ correct: score.correct, total: score.total });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Sign in to access STEMCoach-powered drills.</div>
      </div>
    );
  }

  const question = activeQuestions[currentQ];
  const questionOptions = parseDrillOptions(question?.options);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">STEMCoach Practice</div>
          <h1 className="stem-heading text-3xl">Weak Topic Drills</h1>
          <p className="mt-2 text-sm text-muted-foreground">STEMCoach analyzes your performance and creates targeted practice sets for your weakest areas.</p>
        </div>

        {!analyzed && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stem-card rounded-xl p-8 text-center">
            <Brain className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Analyze Your Performance</h3>
            <p className="mb-6 text-sm text-muted-foreground">STEMCoach will review your past answers to identify weak areas and generate targeted practice questions.</p>
            <Button onClick={analyze} disabled={loading} className="gap-2 rounded-xl">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4" /> Start Analysis</>}
            </Button>
          </motion.div>
        )}

        {analyzed && !drilling && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={analyze} disabled={loading} className="min-h-11 rounded-xl">
                {loading ? "Refreshing..." : "Refresh analysis"}
              </Button>
            </div>
            {lastSession && (
              <section aria-label="Completed drill result" className="stem-card rounded-xl p-5" role="status">
                <div className="flex flex-wrap items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
                  <div><h2 className="font-semibold">Practice session complete</h2><p className="text-sm text-muted-foreground">{lastSession.correct} of {lastSession.total} correct. Review any missed ideas and try again.</p></div>
                </div>
              </section>
            )}
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
                        <Progress value={wt.accuracy} aria-label={wt.topic + " observed accuracy"} className="h-2 w-20" />
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
                  <Sparkles className="h-4 w-4 text-primary" /> AI-assisted study suggestions
                </h3>
                <p className="mb-4 text-xs text-muted-foreground">Suggestions are generated and are not verified marks or exam-board guidance.</p>
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

            {drillQuestions.length > 0 ? (
              <section aria-labelledby="drill-choice-title" className="stem-card rounded-xl p-5 sm:p-6">
                <h3 id="drill-choice-title" className="mb-2 flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-primary" /> Choose a practice set</h3>
                <p className="mb-4 text-sm text-muted-foreground">Practise all recommended questions or focus on one subject and topic. Each set is counted separately.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={() => startDrill()} className="min-h-12 h-auto rounded-xl px-4 py-3 text-left whitespace-normal">
                    All focus areas · {selectDrillQuestions(drillQuestions).length} questions
                  </Button>
                  {topicOptions.map((topic) => (
                    <Button
                      key={topic.subject + ":" + topic.topic}
                      variant="outline"
                      onClick={() => startDrill(topic)}
                      className="min-h-12 h-auto justify-start rounded-xl px-4 py-3 text-left whitespace-normal"
                    >
                      <span className="min-w-0 break-words">{topic.subject}: {topic.topic} · {topic.questionCount}</span>
                    </Button>
                  ))}
                </div>
              </section>
            ) : weakTopics.length > 0 ? (
              <div role="status" className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
                No practice questions were returned for these topics. Try general practice or refresh the analysis.
              </div>
            ) : null}

            {weakTopics.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stem-card rounded-xl p-8 text-center">
                <Brain className="mx-auto mb-3 h-12 w-12 text-primary" />
                <h3 className="text-lg font-semibold">No weak-topic pattern identified yet</h3>
                <p className="text-sm text-muted-foreground">A short diagnostic session can build the evidence needed for tailored recommendations.</p>
              </motion.div>
            )}
          </div>
        )}

        {drilling && question && (
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="stem-card rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex min-w-0 flex-wrap gap-2">
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{question.subject}</span>
                  <span className="rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">{question.topic}</span>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{currentQ + 1}/{activeQuestions.length}</span>
              </div>

              <Progress value={Math.round(((currentQ + 1) / activeQuestions.length) * 100)} aria-label={"Question " + (currentQ + 1) + " of " + activeQuestions.length} className="mb-5 h-2" />
              {activeFocus && <p className="mb-3 text-xs font-medium text-muted-foreground">Focused practice: {activeFocus.subject} · {activeFocus.topic}</p>}
              <h2 className="mb-6 text-lg font-semibold leading-relaxed">{question.question_text}</h2>

              {questionOptions.length > 0 ? (
                <div className="mb-6 space-y-3" role="group" aria-label="Answer options">
                  {questionOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    let cls = "border-2 border-border/60 hover:border-primary/50";
                    if (showFeedback && opt === answerResult?.correct_answer) cls = "stem-success-card border-2";
                    else if (showFeedback && selected === opt) cls = "stem-error-card border-2";
                    else if (selected === opt) cls = "border-2 border-primary bg-primary/5";

                    return (
                      <button
                        key={opt + "-" + i}
                        type="button"
                        aria-pressed={selected === opt}
                        onClick={() => !showFeedback && !submitting && setSelected(opt)}
                        disabled={showFeedback || submitting}
                        className={"flex min-h-12 w-full items-center gap-3 rounded-xl p-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " + cls}
                      >
                        <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{letter}</span>
                        <span className="min-w-0 break-words text-sm font-medium">{opt}</span>
                        {showFeedback && opt === answerResult?.correct_answer && <CheckCircle2 aria-label="Correct answer" className="ml-auto h-5 w-5 shrink-0 text-success" />}
                        {showFeedback && selected === opt && opt !== answerResult?.correct_answer && <XCircle aria-label="Your incorrect choice" className="ml-auto h-5 w-5 shrink-0 text-destructive" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-6">
                  <label htmlFor="drill-written-answer" className="mb-2 block text-sm font-semibold">Your answer</label>
                  <Input
                    id="drill-written-answer"
                    value={selected || ""}
                    maxLength={250}
                    autoComplete="off"
                    onChange={(event) => setSelected(event.target.value)}
                    disabled={showFeedback || submitting}
                    placeholder="Type your answer"
                    className="min-h-12"
                  />
                </div>
              )}

              {showFeedback && answerResult && (
                <p role="status" aria-live="polite" className="mb-3 text-sm font-semibold">
                  {answerResult.correct ? "Correct answer." : "Not quite — review the feedback below."}
                </p>
              )}

              {showFeedback && answerResult?.explanation && (
                <div className="mb-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{answerResult.explanation}</div>
              )}

              <div className="flex gap-3">
                {!showFeedback ? (
                  <Button onClick={submitAnswer} disabled={!selected?.trim() || submitting} className="min-h-11 rounded-xl">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</> : "Submit answer"}</Button>
                ) : (
                  <Button onClick={nextQuestion} className="gap-2 rounded-xl">
                    {currentQ + 1 < activeQuestions.length ? <>Next <ArrowRight className="h-4 w-4" /></> : "Finish Drill"}
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
