import { useState, useEffect, useMemo, useRef } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, TrendingUp, Target, Calendar, Download, BookOpen, Clock } from "lucide-react";

interface DailyData {
  date: string;
  total: number;
  correct: number;
  studyMinutes: number;
}

export default function ProgressReports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [studyGoals, setStudyGoals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [attRes, goalsRes, statsRes] = await Promise.all([
      supabase
        .from("attempts")
        .select("id, correct, created_at, time_taken_seconds, question_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("study_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true }),
      supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single(),
    ]);

    setAttempts(attRes.data || []);
    setStudyGoals(goalsRes.data || []);
    setStats(statsRes.data);
    setLoading(false);
  };

  const filteredAttempts = useMemo(() => {
    if (period === "all") return attempts;
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - (period === "week" ? 7 : 30));
    return attempts.filter((a) => new Date(a.created_at) >= cutoff);
  }, [attempts, period]);

  const dailyData = useMemo<DailyData[]>(() => {
    const map = new Map<string, DailyData>();
    filteredAttempts.forEach((a) => {
      const date = new Date(a.created_at).toISOString().slice(0, 10);
      if (!map.has(date)) map.set(date, { date, total: 0, correct: 0, studyMinutes: 0 });
      const d = map.get(date)!;
      d.total++;
      if (a.correct) d.correct++;
    });
    studyGoals.forEach((g) => {
      if (map.has(g.date)) {
        map.get(g.date)!.studyMinutes = g.completed_minutes;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredAttempts, studyGoals]);

  const overallAccuracy = filteredAttempts.length > 0
    ? Math.round((filteredAttempts.filter((a) => a.correct).length / filteredAttempts.length) * 100)
    : 0;

  const totalStudyMin = dailyData.reduce((s, d) => s + d.studyMinutes, 0);
  const activeDays = dailyData.filter((d) => d.total > 0).length;
  const maxDaily = Math.max(...dailyData.map((d) => d.total), 1);

  const exportReport = () => {
    const lines = [
      "STEMCoach Progress Report",
      `Generated: ${new Date().toLocaleDateString()}`,
      `Period: ${period}`,
      "",
      `Total Questions: ${filteredAttempts.length}`,
      `Accuracy: ${overallAccuracy}%`,
      `Study Time: ${totalStudyMin} minutes`,
      `Active Days: ${activeDays}`,
      `Streak: ${stats?.streak || 0}`,
      `XP: ${stats?.xp || 0}`,
      `Level: ${stats?.level || 1}`,
      "",
      "Daily Breakdown:",
      "Date,Questions,Correct,Accuracy%,Study Minutes",
      ...dailyData.map(
        (d) =>
          `${d.date},${d.total},${d.correct},${d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0},${d.studyMinutes}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stemcoach-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading report...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="stem-label mb-1">Reports</div>
            <h1 className="stem-heading text-3xl">Progress Report</h1>
          </div>
          <div className="flex items-center gap-2">
            {(["week", "month", "all"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                onClick={() => setPeriod(p)}
                className="rounded capitalize"
              >
                {p === "all" ? "All Time" : `Last ${p === "week" ? "7 Days" : "30 Days"}`}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={exportReport} className="gap-1.5 rounded">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div ref={reportRef}>
          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, label: "Accuracy", value: `${overallAccuracy}%`, color: overallAccuracy >= 70 ? "text-success" : "text-primary" },
              { icon: BookOpen, label: "Questions", value: filteredAttempts.length.toString(), color: "text-primary" },
              { icon: Clock, label: "Study Time", value: `${totalStudyMin}m`, color: "text-primary" },
              { icon: Calendar, label: "Active Days", value: activeDays.toString(), color: "text-primary" },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="stem-card rounded-xl p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                </div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          {stats && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="stem-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.xp}</div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
              <div className="stem-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">Lv.{stats.level}</div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
              <div className="stem-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.streak}🔥</div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
            </div>
          )}

          {/* Activity Chart */}
          {dailyData.length > 0 ? (
            <div className="stem-card mb-6 rounded-xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" /> Daily Activity
              </h3>
              <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: 120 }}>
                {dailyData.map((d) => {
                  const h = Math.max((d.total / maxDaily) * 100, 4);
                  const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                  return (
                    <div key={d.date} className="group relative flex flex-col items-center" style={{ minWidth: 20 }}>
                      <div
                        className={`w-4 rounded-t transition-all ${acc >= 70 ? "bg-primary" : acc >= 50 ? "bg-primary/60" : "bg-destructive/60"}`}
                        style={{ height: `${h}%` }}
                        title={`${d.date}: ${d.total}q, ${acc}% accuracy`}
                      />
                      <span className="mt-1 text-[8px] text-muted-foreground">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> ≥70%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary/60" /> 50-69%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/60" /> &lt;50%</span>
              </div>
            </div>
          ) : (
            <div className="stem-card mb-6 rounded-xl p-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="mb-2 text-lg font-semibold">No data for this period</h3>
              <p className="text-sm text-muted-foreground">Practice some questions to generate your report.</p>
            </div>
          )}

          {/* Study time chart */}
          {dailyData.some((d) => d.studyMinutes > 0) && (
            <div className="stem-card rounded-xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-primary" /> Study Time (minutes)
              </h3>
              <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: 80 }}>
                {dailyData.filter((d) => d.studyMinutes > 0).map((d) => {
                  const maxMin = Math.max(...dailyData.map((x) => x.studyMinutes), 1);
                  const h = Math.max((d.studyMinutes / maxMin) * 100, 4);
                  return (
                    <div key={d.date} className="flex flex-col items-center" style={{ minWidth: 20 }}>
                      <div
                        className="w-4 rounded-t bg-accent"
                        style={{ height: `${h}%` }}
                        title={`${d.date}: ${d.studyMinutes}min`}
                      />
                      <span className="mt-1 text-[8px] text-muted-foreground">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
