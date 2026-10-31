import { useState, useEffect, useMemo } from "react";
import { calculateStudyStreak, getMonthDays, localDateKey, studyGoalPercent, validStudyTargets } from "@/lib/studyCalendar";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Target, Flame, Calendar, CheckCircle2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface StudyGoal {
  id: string;
  date: string;
  target_questions: number;
  completed_questions: number;
  target_minutes: number;
  completed_minutes: number;
  subjects: string[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StudyPlanner() {
  useDocumentTitle("Study Planner");
  const { user } = useAuth();
  const { toast } = useToast();
  const today = localDateKey(new Date());
  const userId = user?.id;
  const [viewMonth, setViewMonth] = useState(new Date());
  const [goals, setGoals] = useState<Record<string, StudyGoal>>({});
  const [todayGoal, setTodayGoal] = useState<StudyGoal | null>(null);
  const [targetQuestions, setTargetQuestions] = useState(10);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [streakGoals, setStreakGoals] = useState<Record<string, StudyGoal>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const days = useMemo(() => getMonthDays(viewYear, viewMonthIndex), [viewYear, viewMonthIndex]);
  const startDate = days[0]?.date;
  const endDate = days[days.length - 1]?.date;

  useEffect(() => {
    if (!userId) {
      setGoals({});
      setTodayGoal(null);
      setStreakGoals({});
      setLoading(false);
      return;
    }

    let active = true;
    const loadGoals = async () => {
      setLoading(true);
      setLoadError(false);
      // Keep today's card and streak independent of the month being browsed.
      const lookback = new Date();
      lookback.setHours(12, 0, 0, 0);
      lookback.setDate(lookback.getDate() - 400);

      try {
        const [monthResult, recentResult] = await Promise.all([
          supabase.from("study_goals").select("*").eq("user_id", userId)
            .gte("date", startDate).lte("date", endDate),
          supabase.from("study_goals").select("*").eq("user_id", userId)
            .gte("date", localDateKey(lookback)).lte("date", today),
        ]);

        if (!active) return;
        if (monthResult.error || recentResult.error) throw monthResult.error || recentResult.error;
        const monthRows = (monthResult.data || []) as StudyGoal[];
        const recentRows = (recentResult.data || []) as StudyGoal[];
        setGoals(Object.fromEntries(monthRows.map(goal => [goal.date, goal])));
        const recent = Object.fromEntries(recentRows.map(goal => [goal.date, goal]));
        setStreakGoals(recent);
        setTodayGoal(recent[today] || null);
      } catch {
        if (!active) return;
        setGoals({});
        setStreakGoals({});
        setTodayGoal(null);
        setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadGoals();
    return () => { active = false; };
  }, [userId, startDate, endDate, today, retryKey]);

  const setTodayTarget = async () => {
    if (!userId || saving) return;
    if (!validStudyTargets(targetQuestions, targetMinutes)) {
      toast({ title: "Check your daily targets", description: "Choose 1–100 questions and 5–300 minutes.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("study_goals")
        .upsert({
          user_id: userId,
          date: today,
          target_questions: targetQuestions,
          target_minutes: targetMinutes,
        }, { onConflict: "user_id,date" })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Daily goal set! 🎯" });
      setTodayGoal(data);
      setGoals(prev => ({ ...prev, [today]: data }));
      setStreakGoals(prev => ({ ...prev, [today]: data }));
    } catch {
      toast({ title: "Could not save the daily goal", description: "Your previous progress has not been changed. Please retry.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getHeatColor = (goal: StudyGoal | undefined) => {
    if (!goal) return "bg-muted/30";
    const pct = studyGoalPercent(goal.completed_questions, goal.target_questions);
    if (pct >= 100) return "bg-success/60";
    if (pct >= 50) return "bg-primary/40";
    if (pct > 0) return "bg-primary/20";
    return "bg-warning/20";
  };

  const streak = calculateStudyStreak(streakGoals, new Date());
  const qPct = studyGoalPercent(todayGoal?.completed_questions ?? 0, todayGoal?.target_questions ?? 0);
  const mPct = studyGoalPercent(todayGoal?.completed_minutes ?? 0, todayGoal?.target_minutes ?? 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Sign in to use the Study Planner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Study Planner</div>
          <h1 className="stem-heading text-3xl">Daily Goals & Streaks</h1>
          <p className="mt-2 text-sm text-muted-foreground">Set daily targets, track completion, and build your study streak.</p>
          {loadError && (
            <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
              <span>Study activity could not be loaded. Your saved records have not been changed.</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setRetryKey(value => value + 1)}>Try again</Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stem-card rounded-xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Target className="h-4 w-4 text-primary" /> Today's Goal
              </h3>
              {loading ? (
                <p role="status" className="text-sm text-muted-foreground">Loading today's goal…</p>
              ) : loadError ? (
                <p className="text-sm text-muted-foreground">Daily goal temporarily unavailable.</p>
              ) : todayGoal ? (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Questions</span>
                      <span className="font-medium">{todayGoal.completed_questions}/{todayGoal.target_questions}</span>
                    </div>
                    <Progress value={qPct} className="h-3" />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Minutes</span>
                      <span className="font-medium">{todayGoal.completed_minutes}/{todayGoal.target_minutes}</span>
                    </div>
                    <Progress value={mPct} className="h-3" />
                  </div>
                  {qPct >= 100 && mPct >= 100 && (
                    <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" /> Goal Complete! 🎉
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="study-target-questions" className="mb-1 block text-xs text-muted-foreground">Target Questions</label>
                    <Input id="study-target-questions" type="number" min={1} max={100} value={targetQuestions} onChange={(e) => setTargetQuestions(Number(e.target.value))} className="rounded-xl" />
                  </div>
                  <div>
                    <label htmlFor="study-target-minutes" className="mb-1 block text-xs text-muted-foreground">Target Minutes</label>
                    <Input id="study-target-minutes" type="number" min={5} max={300} value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))} className="rounded-xl" />
                  </div>
                  <Button onClick={setTodayTarget} disabled={saving || !validStudyTargets(targetQuestions, targetMinutes)} className="w-full gap-2 rounded-xl">
                    <Plus className="h-4 w-4" /> Set Today's Goal
                  </Button>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stem-card rounded-xl p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Flame className="h-4 w-4 text-warning" /> Current Streak
              </h3>
              <div className="text-4xl font-bold text-warning">{loading ? "—" : streak}</div>
              <p className="text-sm text-muted-foreground">consecutive days with completed questions (up to 400 days)</p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 stem-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4 text-primary" /> Activity Calendar
              </h3>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Previous month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium min-w-[140px] text-center">{monthLabel}</span>
                <button type="button" aria-label="Next month" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div aria-busy={loading} className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map(({ date, day, inMonth }) => {
                const goal = goals[date];
                const isToday = date === today;
                return (
                  <time
                    key={date}
                    dateTime={date}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${date}: ${goal ? `${goal.completed_questions}/${goal.target_questions} questions completed` : "No goal set"}`}
                    title={goal ? `${goal.completed_questions}/${goal.target_questions} questions` : "No goal set"}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-xs transition-all ${
                      inMonth ? getHeatColor(goal) : "opacity-20 bg-muted/10"
                    } ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                  >
                    <span className={`${inMonth ? "text-foreground" : "text-muted-foreground"} ${goal && goal.completed_questions >= goal.target_questions ? "font-bold" : ""}`}>
                      {day}
                    </span>
                  </time>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted/30" /> No goal</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-warning/20" /> Set, not started</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/20" /> In progress</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/40" /> 50%+</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-success/60" /> Complete</span>
            </div>
          </motion.div>
        </div>
        </main>
      </PageTransition>
    </div>
  );
}
