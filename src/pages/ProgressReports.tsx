import { useState, useEffect, useMemo, useRef } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  FileText, TrendingUp, Target, Calendar, Download,
  BookOpen, Clock, Flame, Zap, Star, ChevronRight,
} from "lucide-react";

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

  const overallAccuracy =
    filteredAttempts.length > 0
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

  // Accuracy ring SVG helper
  const AccuracyRing = ({ value, size = 88 }: { value: number; size?: number }) => {
    const stroke = 6;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    const color =
      value >= 80 ? "hsl(var(--success))" : value >= 60 ? "hsl(226, 70%, 45%)" : "hsl(var(--destructive))";
    return (
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} opacity={0.3} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Loading report…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto max-w-4xl px-4 py-6 pb-24 md:py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Progress
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Your Report</h1>
              </div>

              <div className="flex items-center gap-2">
                {/* Period tabs - pill style */}
                <div className="flex rounded-2xl bg-muted/40 p-1 ring-1 ring-border/20">
                  {(["week", "month", "all"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                        period === p
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p === "week" ? "7D" : p === "month" ? "30D" : "All"}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportReport}
                  className="gap-1.5 rounded-xl border-border/40 text-xs font-bold h-8"
                >
                  <Download className="h-3 w-3" /> CSV
                </Button>
              </div>
            </div>
          </motion.div>

          <div ref={reportRef}>
            {/* Hero Stats Card - Accuracy Ring + Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-5 rounded-2xl border border-border/30 bg-card p-5 md:p-7 shadow-[var(--stem-card-shadow)]"
            >
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
                {/* Accuracy Ring */}
                <div className="relative flex shrink-0 items-center justify-center">
                  <AccuracyRing value={overallAccuracy} size={96} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold tracking-tight">{overallAccuracy}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Accuracy
                    </span>
                  </div>
                </div>

                {/* Key metrics grid */}
                <div className="grid flex-1 grid-cols-3 gap-4 w-full">
                  {[
                    {
                      icon: BookOpen,
                      label: "Questions",
                      value: filteredAttempts.length.toLocaleString(),
                      color: "text-primary",
                      bg: "bg-primary/8",
                    },
                    {
                      icon: Clock,
                      label: "Study Time",
                      value: totalStudyMin >= 60 ? `${Math.floor(totalStudyMin / 60)}h ${totalStudyMin % 60}m` : `${totalStudyMin}m`,
                      color: "text-amber-500",
                      bg: "bg-amber-500/8",
                    },
                    {
                      icon: Calendar,
                      label: "Active Days",
                      value: activeDays.toString(),
                      color: "text-emerald-500",
                      bg: "bg-emerald-500/8",
                    },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="text-center"
                    >
                      <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}>
                        <m.icon className={`h-4 w-4 ${m.color}`} />
                      </div>
                      <div className="text-lg font-extrabold tracking-tight md:text-xl">{m.value}</div>
                      <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                        {m.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Gamification Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-5 grid grid-cols-3 gap-3"
              >
                {[
                  { icon: Zap, label: "XP", value: stats.xp?.toLocaleString() || "0", gradient: "from-primary/10 to-primary/5", color: "text-primary" },
                  { icon: Star, label: "Level", value: `Lv.${stats.level || 1}`, gradient: "from-violet-500/10 to-violet-500/5", color: "text-violet-500" },
                  { icon: Flame, label: "Streak", value: `${stats.streak || 0}`, gradient: "from-amber-500/10 to-amber-500/5", color: "text-amber-500" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className={`rounded-2xl bg-gradient-to-br ${s.gradient} p-4 ring-1 ring-border/15 text-center`}
                  >
                    <s.icon className={`mx-auto mb-1.5 h-5 w-5 ${s.color}`} />
                    <div className="text-xl font-extrabold tracking-tight">{s.value}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                      {s.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Activity Chart */}
            {dailyData.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-5 rounded-2xl border border-border/30 bg-card p-5 md:p-6 shadow-[var(--stem-card-shadow)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Daily Activity
                  </h3>
                  <div className="flex gap-3 text-[9px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" /> ≥70%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary/50" /> 50–69%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-destructive/50" /> &lt;50%
                    </span>
                  </div>
                </div>

                <div className="flex items-end gap-[3px] overflow-x-auto pb-2" style={{ minHeight: 110 }}>
                  {dailyData.map((d, i) => {
                    const h = Math.max((d.total / maxDaily) * 100, 6);
                    const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                    const barColor =
                      acc >= 70
                        ? "bg-primary"
                        : acc >= 50
                        ? "bg-primary/50"
                        : "bg-destructive/50";
                    return (
                      <motion.div
                        key={d.date}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.4 + i * 0.02, duration: 0.3 }}
                        className="group relative flex flex-col items-center origin-bottom"
                        style={{ minWidth: 18 }}
                      >
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-foreground/90 px-2 py-1 text-[9px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                          {d.total}q · {acc}%
                        </div>
                        <div
                          className={`w-3.5 rounded-t-md ${barColor} transition-all`}
                          style={{ height: `${h}%` }}
                        />
                        <span className="mt-1.5 text-[7px] font-medium text-muted-foreground/70">
                          {d.date.slice(8)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-5 rounded-2xl border border-border/30 bg-card p-14 text-center shadow-[var(--stem-card-shadow)]"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/30 ring-1 ring-border/20">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="mb-1.5 text-base font-bold">No data yet</h3>
                <p className="text-xs text-muted-foreground">Practice some questions to see your report.</p>
              </motion.div>
            )}

            {/* Study Time chart */}
            {dailyData.some((d) => d.studyMinutes > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-2xl border border-border/30 bg-card p-5 md:p-6 shadow-[var(--stem-card-shadow)]"
              >
                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  Study Time
                </h3>
                <div className="flex items-end gap-[3px] overflow-x-auto pb-2" style={{ minHeight: 80 }}>
                  {dailyData
                    .filter((d) => d.studyMinutes > 0)
                    .map((d, i) => {
                      const maxMin = Math.max(...dailyData.map((x) => x.studyMinutes), 1);
                      const h = Math.max((d.studyMinutes / maxMin) * 100, 6);
                      return (
                        <motion.div
                          key={d.date}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.5 + i * 0.02, duration: 0.3 }}
                          className="group relative flex flex-col items-center origin-bottom"
                          style={{ minWidth: 18 }}
                        >
                          <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-foreground/90 px-2 py-1 text-[9px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                            {d.studyMinutes}m
                          </div>
                          <div
                            className="w-3.5 rounded-t-md bg-amber-500/60"
                            style={{ height: `${h}%` }}
                          />
                          <span className="mt-1.5 text-[7px] font-medium text-muted-foreground/70">
                            {d.date.slice(8)}
                          </span>
                        </motion.div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
