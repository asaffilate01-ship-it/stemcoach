import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Flame, Clock, Trophy, Zap, Star, Target, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Icon3D } from "@/components/ui/icon-3d";
import { motion, AnimatePresence } from "framer-motion";

const challengeSubjects = [
  { id: "mathematics", name: "Mathematics", emoji: "🔢" },
  { id: "physics", name: "Physics", emoji: "⚡" },
  { id: "chemistry", name: "Chemistry", emoji: "🧪" },
  { id: "biology", name: "Biology", emoji: "🧬" },
];

interface LeaderEntry {
  user_id: string;
  display_name: string | null;
  score: number;
  total: number;
  time_taken_seconds: number | null;
}

interface ChallengeQuestion {
  id: string;
  question_text: string;
  options: unknown;
  topic: string;
  difficulty: number;
  points: number;
}

interface Challenge {
  id: string;
  subject: string;
  curriculum: string;
  question_count: number;
  time_limit_seconds: number;
  xp_reward: number;
}

type Phase = "pick" | "playing" | "done";

function parseOptions(raw: unknown): string[] {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? (raw as string[]) : [];
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function DailyChallenge() {
  useDocumentTitle("Daily Challenge");
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("pick");
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number; already_completed: boolean } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [summary, setSummary] = useState<{ completed: number; best_score: number; total_xp: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown to the next daily reset
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Personal summary
  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_my_challenge_summary" as never).then(({ data }) => {
      const d = data as unknown;
      const row = Array.isArray(d) ? d[0] : d;
      if (row) setSummary(row as never);
    });
  }, [user, result]);

  const loadLeaderboard = useCallback(async (challengeId: string) => {
    const { data } = await supabase.rpc("get_daily_challenge_leaderboard" as never, { _challenge_id: challengeId } as never);
    setLeaderboard((data as LeaderEntry[]) || []);
  }, []);

  // Timer while playing
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startChallenge = async () => {
    if (!selectedSubject || !user) return;
    setStarting(true);
    try {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("curriculum")
        .eq("user_id", user.id)
        .maybeSingle();
      const curriculum = prefs?.curriculum || "uk-gcse";

      const { data: created, error: cErr } = await supabase.rpc("get_or_create_daily_challenge" as never, {
        _subject: selectedSubject,
        _curriculum: curriculum,
      } as never);
      if (cErr) throw cErr;
      const c = created as unknown;
      const ch = (Array.isArray(c) ? c[0] : c) as Challenge;
      if (!ch) throw new Error("Could not start today's challenge");
      setChallenge(ch);
      await loadLeaderboard(ch.id);

      const { data: qs, error: qErr } = await supabase.rpc("get_mock_exam_questions" as never, {
        _subject: ch.subject,
        _curriculum: ch.curriculum,
        _count: ch.question_count,
      } as never);
      if (qErr) throw qErr;
      const list = ((qs as ChallengeQuestion[]) || []).filter((q) => parseOptions(q.options).length > 1);
      if (list.length === 0) {
        toast({
          title: "No questions available yet",
          description: "This subject has no challenge questions for your curriculum yet. Try another subject.",
          variant: "destructive",
        });
        return;
      }
      setQuestions(list);
      setAnswers({});
      setIndex(0);
      setElapsed(0);
      setResult(null);
      setPhase("playing");
    } catch (e) {
      toast({ title: "Could not start challenge", description: (e as Error).message, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const submitChallenge = useCallback(async () => {
    if (!challenge) return;
    setSubmitting(true);
    try {
      const payload = questions
        .filter((q) => answers[q.id])
        .map((q) => ({ question_id: q.id, answer: answers[q.id] }));
      if (payload.length === 0) {
        toast({ title: "Answer at least one question first", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("grade-daily-challenge", {
        body: { challenge_id: challenge.id, answers: payload, time_taken_seconds: elapsed },
      });
      if (error) throw error;
      setResult(data);
      setPhase("done");
      await loadLeaderboard(challenge.id);
    } catch (e) {
      toast({ title: "Could not submit challenge", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [challenge, questions, answers, elapsed, loadLeaderboard, toast]);

  // Auto-submit when the time limit runs out
  useEffect(() => {
    if (phase === "playing" && challenge && elapsed >= challenge.time_limit_seconds) {
      submitChallenge();
    }
  }, [elapsed, phase, challenge, submitChallenge]);

  const current = questions[index];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto max-w-3xl px-4 py-6 pb-28 lg:pb-12">
        {/* Hero */}
        <div className="mb-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="mb-2 flex items-center gap-3">
            <Icon3D icon={Flame} variant="warning" size="md" />
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Daily Challenge</h1>
              <p className="text-xs text-muted-foreground">A fresh timed challenge every day · Compete for the top spot</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Resets in {timeLeft}
            </span>
          </div>
        </div>

        {!user && (
          <Card className="mb-6 border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Sign in to play today's challenge and appear on the leaderboard.
            </CardContent>
          </Card>
        )}

        {/* Subject picker */}
        {user && phase === "pick" && (
          <>
            <h2 className="mb-3 text-base font-semibold text-foreground">Choose Today's Challenge</h2>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {challengeSubjects.map((subj) => (
                <motion.button
                  key={subj.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedSubject(subj.id)}
                  aria-pressed={selectedSubject === subj.id}
                  className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                    selectedSubject === subj.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border/50 bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="mb-2 text-2xl">{subj.emoji}</div>
                  <div className="text-sm font-semibold text-foreground">{subj.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Target className="h-3 w-3" /> 10 questions
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> 10 minutes
                  </div>
                </motion.button>
              ))}
            </div>
            {selectedSubject && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Button size="lg" className="w-full gap-2 text-base sm:w-auto" onClick={startChallenge} disabled={starting}>
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Start Challenge <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* Playing */}
        {phase === "playing" && current && challenge && (
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Question {index + 1} of {questions.length}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(Math.max(challenge.time_limit_seconds - elapsed, 0))} left
                </span>
              </div>
              <Progress value={((index + 1) / questions.length) * 100} className="mb-5 h-1.5" />

              <p className="mb-4 text-base font-medium leading-relaxed text-foreground">{current.question_text}</p>

              <div className="space-y-2">
                {parseOptions(current.options).map((opt, i) => {
                  const selected = answers[current.id] === opt;
                  return (
                    <button
                      key={`${current.id}-${i}`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: opt }))}
                      aria-pressed={selected}
                      className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/5 font-medium text-foreground"
                          : "border-border/50 bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                  Previous
                </Button>
                {index < questions.length - 1 ? (
                  <Button size="sm" onClick={() => setIndex((i) => i + 1)} className="gap-1.5">
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={submitChallenge} disabled={submitting} className="gap-1.5">
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Submit ({answeredCount}/{questions.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        <AnimatePresence>
          {phase === "done" && result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    {result.score >= result.total / 2 ? (
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    ) : (
                      <XCircle className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {result.score} / {result.total}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.already_completed
                      ? "You already completed today's challenge — this run wasn't scored again."
                      : `Completed in ${formatDuration(elapsed)}. Come back tomorrow for a new one.`}
                  </p>
                  <Button className="mt-4" variant="outline" onClick={() => { setPhase("pick"); setSelectedSubject(null); }}>
                    Back to challenges
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <div className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-primary" /> Today's Leaderboard
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              {leaderboard.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No one has finished today's challenge yet — be the first.
                </p>
              ) : (
                <div className="divide-y divide-border/30">
                  {leaderboard.map((entry, i) => (
                    <div key={entry.user_id} className="flex items-center gap-3 px-4 py-3">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? "bg-yellow-500/20 text-yellow-600"
                            : i === 1
                              ? "bg-muted text-muted-foreground"
                              : i === 2
                                ? "bg-amber-600/20 text-amber-700"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {entry.display_name || "Student"}
                          {entry.user_id === user?.id ? " (you)" : ""}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {entry.score}/{entry.total} · {formatDuration(entry.time_taken_seconds)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <Zap className="h-3 w-3" /> {entry.score * 15} XP
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Personal stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Challenges completed", value: summary ? String(summary.completed) : "—", icon: Star },
            { label: "Best score", value: summary ? String(summary.best_score) : "—", icon: Trophy },
            { label: "Challenge XP", value: summary ? summary.total_xp.toLocaleString() : "—", icon: Zap },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <stat.icon className="mb-1 h-5 w-5 text-primary" />
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
