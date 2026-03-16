import { useState, useEffect } from "react";
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

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: { date: string; day: number; inMonth: boolean }[] = [];
  const startDay = (first.getDay() + 6) % 7;
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d.toISOString().split("T")[0], day: d.getDate(), inMonth: false });
  }
  for (let i = 1; i <= last.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({ date: d.toISOString().split("T")[0], day: i, inMonth: true });
  }
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - last.getDate() - startDay + 1);
    days.push({ date: d.toISOString().split("T")[0], day: d.getDate(), inMonth: false });
  }
  return days;
}

export default function StudyPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [viewMonth, setViewMonth] = useState(new Date());
  const [goals, setGoals] = useState<Record<string, StudyGoal>>({});
  const [todayGoal, setTodayGoal] = useState<StudyGoal | null>(null);
  const [targetQuestions, setTargetQuestions] = useState(10);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [loading, setLoading] = useState(true);

  const monthLabel = viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const days = getMonthDays(viewMonth.getFullYear(), viewMonth.getMonth());

  useEffect(() => {
    if (!user) return;
    fetchGoals();
  }, [user, viewMonth]);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    const startDate = days[0]?.date;
    const endDate = days[days.length - 1]?.date;
    const { data } = await supabase
      .from("study_goals")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    const map: Record<string, StudyGoal> = {};
    data?.forEach((g: any) => { map[g.date] = g; });
    setGoals(map);
    setTodayGoal(map[today] || null);
    setLoading(false);
  };

  const setTodayTarget = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("study_goals")
      .upsert({
        user_id: user.id,
        date: today,
        target_questions: targetQuestions,
        target_minutes: targetMinutes,
      }, { onConflict: "user_id,date" })
      .select()
      .single();

    if (error) {
      toast({ title: "Error setting goal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Daily goal set! 🎯" });
      setTodayGoal(data);
      setGoals(prev => ({ ...prev, [today]: data }));
    }
  };

  const getHeatColor = (goal: StudyGoal | undefined) => {
    if (!goal) return "bg-muted/30";
    const pct = goal.target_questions > 0
      ? (goal.completed_questions / goal.target_questions) * 100
      : 0;
    if (pct >= 100) return "bg-success/60";
    if (pct >= 50) return "bg-primary/40";
    if (pct > 0) return "bg-primary/20";
    return "bg-warning/20";
  };

  // Calculate streak from goals
  const calculateStreak = () => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = d.toISOString().split("T")[0];
      const g = goals[dateStr];
      if (g && g.completed_questions > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (dateStr === today) {
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const qPct = todayGoal ? Math.min(100, Math.round((todayGoal.completed_questions / todayGoal.target_questions) * 100)) : 0;
  const mPct = todayGoal ? Math.min(100, Math.round((todayGoal.completed_minutes / todayGoal.target_minutes) * 100)) : 0;

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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Study Planner</div>
          <h1 className="stem-heading text-3xl">Daily Goals & Streaks</h1>
          <p className="mt-2 text-sm text-muted-foreground">Set daily targets, track completion, and build your study streak.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Goal */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stem-card rounded-xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Target className="h-4 w-4 text-primary" /> Today's Goal
              </h3>
              {todayGoal ? (
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
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" /> Goal Complete! 🎉
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Target Questions</label>
                    <Input type="number" min={1} max={100} value={targetQuestions} onChange={(e) => setTargetQuestions(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Target Minutes</label>
                    <Input type="number" min={5} max={300} value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))} />
                  </div>
                  <Button onClick={setTodayTarget} className="w-full gap-2 rounded">
                    <Plus className="h-4 w-4" /> Set Today's Goal
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Streak Card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stem-card rounded-xl p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Flame className="h-4 w-4 text-warning" /> Current Streak
              </h3>
              <div className="text-4xl font-bold text-warning">{calculateStreak()}</div>
              <p className="text-sm text-muted-foreground">consecutive days</p>
            </motion.div>
          </div>

          {/* Calendar Heatmap */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 stem-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4 text-primary" /> Activity Calendar
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))} className="rounded p-1.5 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium min-w-[140px] text-center">{monthLabel}</span>
                <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))} className="rounded p-1.5 text-muted-foreground hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map(({ date, day, inMonth }) => {
                const goal = goals[date];
                const isToday = date === today;
                return (
                  <div
                    key={date}
                    title={goal ? `${goal.completed_questions}/${goal.target_questions} questions` : "No goal set"}
                    className={`relative flex aspect-square items-center justify-center rounded text-xs transition-all ${
                      inMonth ? getHeatColor(goal) : "opacity-20 bg-muted/10"
                    } ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                  >
                    <span className={`${inMonth ? "text-foreground" : "text-muted-foreground"} ${goal && goal.completed_questions >= goal.target_questions ? "font-bold" : ""}`}>
                      {day}
                    </span>
                  </div>
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
    </div>
  );
}
