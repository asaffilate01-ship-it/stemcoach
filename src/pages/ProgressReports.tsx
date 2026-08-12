import { useState, useEffect, useMemo, useRef } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, TrendingUp, Target, Calendar, Download,
  BookOpen, Clock, Flame, Zap, Star, ChevronRight, Trophy, Award,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface DailyData {
  date: string;
  total: number;
  correct: number;
  studyMinutes: number;
}

export default function ProgressReports() {
  useDocumentTitle("Progress Reports");
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

  // Accuracy ring SVG
  const AccuracyRing = ({ value, size = 100 }: { value: number; size?: number }) => {
    const stroke = 7;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    const color =
      value >= 80 ? "hsl(var(--success))" : value >= 60 ? "hsl(226, 70%, 45%)" : "hsl(var(--destructive))";
    const glowColor =
      value >= 80 ? "hsl(var(--success) / 0.25)" : value >= 60 ? "hsl(226 70% 45% / 0.25)" : "hsl(var(--destructive) / 0.25)";
    return (
      <svg width={size} height={size} className="rotate-[-90deg] drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} opacity={0.2} />
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
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          filter={`drop-shadow(0 0 6px ${glowColor})`}
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <TrendingUp className="h-6 w-6 text-primary" />
          </motion.div>
          <span className="text-sm font-medium text-muted-foreground">Loading your progress…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto max-w-4xl px-4 py-5 pb-28 md:py-10">

          {/* ─── Header ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                    Progress
                  </span>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">Your Report</h1>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={exportReport}
                className="gap-1.5 rounded-xl border-border/40 text-[10px] font-bold h-8 px-3 shrink-0"
              >
                <Download className="h-3 w-3" /> Export
              </Button>
            </div>

            {/* Period tabs */}
            <div className="mt-3 flex rounded-2xl bg-muted/50 p-1 ring-1 ring-border/15 w-fit">
              {(["week", "month", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`relative rounded-xl px-4 py-1.5 text-[11px] font-bold transition-all ${
                    period === p
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {period === p && (
                    <motion.div
                      layoutId="period-pill"
                      className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border/25"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {p === "week" ? "7 Days" : p === "month" ? "30 Days" : "All Time"}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          <div ref={reportRef} className="space-y-4">

            {/* ─── Accuracy Hero Card ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl border border-border/20 bg-gradient-to-br from-card via-card to-primary/[0.03] p-5 shadow-[0_2px_20px_-4px_hsl(var(--primary)/0.08)]"
            >
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl" />

              <div className="flex items-center gap-5">
                {/* Ring */}
                <div className="relative shrink-0">
                  <AccuracyRing value={overallAccuracy} size={88} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className="text-[22px] font-black tracking-tight leading-none"
                    >
                      {overallAccuracy}%
                    </motion.span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
                      Accuracy
                    </span>
                  </div>
                </div>

                {/* Mini stats */}
                <div className="flex-1 space-y-2.5 min-w-0">
                  {[
                    { icon: BookOpen, label: "Questions", value: filteredAttempts.length.toLocaleString(), color: "text-primary", bg: "bg-primary/10" },
                    { icon: Clock, label: "Study Time", value: totalStudyMin >= 60 ? `${Math.floor(totalStudyMin / 60)}h ${totalStudyMin % 60}m` : `${totalStudyMin}m`, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { icon: Calendar, label: "Active Days", value: activeDays.toString(), color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                      className="flex items-center gap-2.5"
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.bg} shrink-0`}>
                        <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                      </div>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-sm font-extrabold tracking-tight">{m.value}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground truncate">
                          {m.label}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ─── XP / Level / Streak Pills ─── */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="grid grid-cols-3 gap-2.5"
              >
                {[
                  { icon: Zap, label: "XP", value: stats.xp?.toLocaleString() || "0", gradient: "from-primary/12 to-primary/4", border: "border-primary/10", color: "text-primary" },
                  { icon: Trophy, label: "Level", value: `${stats.level || 1}`, gradient: "from-violet-500/12 to-violet-500/4", border: "border-violet-500/10", color: "text-violet-500" },
                  { icon: Flame, label: "Streak", value: `${stats.streak || 0}d`, gradient: "from-amber-500/12 to-amber-500/4", border: "border-amber-500/10", color: "text-amber-500" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className={`relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-b ${s.gradient} p-3.5 text-center`}
                  >
                    <div className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm ring-1 ring-border/10`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <div className="text-lg font-black tracking-tight leading-none">{s.value}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground mt-1">
                      {s.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ─── Activity Chart ─── */}
            {dailyData.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="rounded-2xl border border-border/20 bg-card p-4 md:p-6 shadow-[0_2px_20px_-4px_hsl(var(--primary)/0.06)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold tracking-tight">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-3 w-3 text-primary" />
                    </div>
                    Daily Activity
                  </h3>
                  <div className="flex gap-2 text-[8px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ≥70%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/40" /> 50–69
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive/50" /> &lt;50
                    </span>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-[2px] sm:gap-1 overflow-x-auto pb-1 scrollbar-none" style={{ minHeight: 100 }}>
                  {dailyData.map((d, i) => {
                    const h = Math.max((d.total / maxDaily) * 100, 5);
                    const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                    const barColor =
                      acc >= 70 ? "bg-primary" : acc >= 50 ? "bg-primary/40" : "bg-destructive/40";
                    return (
                      <motion.div
                        key={d.date}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.35 + i * 0.015, duration: 0.35 }}
                        className="group relative flex flex-col items-center origin-bottom flex-1"
                        style={{ minWidth: 14, maxWidth: 28 }}
                      >
                        {/* Hover tooltip */}
                        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-[8px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10 shadow-lg">
                          {d.total}q · {acc}%
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-foreground" />
                        </div>
                        <div
                          className={`w-full max-w-[12px] rounded-t-md ${barColor} transition-all group-hover:opacity-80`}
                          style={{ height: `${h}%` }}
                        />
                        {/* Date label - show every other on mobile */}
                        <span className="mt-1 text-[6px] sm:text-[7px] font-semibold text-muted-foreground/60">
                          {i % 2 === 0 || dailyData.length <= 14 ? d.date.slice(8) : ""}
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
                className="rounded-2xl border border-border/20 bg-card p-12 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-border/15">
                  <FileText className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <h3 className="mb-1 text-sm font-bold">No data yet</h3>
                <p className="text-xs text-muted-foreground">Practice some questions to see your report.</p>
              </motion.div>
            )}

            {/* ─── Study Time ─── */}
            {dailyData.some((d) => d.studyMinutes > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-2xl border border-border/20 bg-card p-4 md:p-6 shadow-[0_2px_20px_-4px_hsl(var(--primary)/0.06)]"
              >
                <h3 className="mb-4 flex items-center gap-2 text-xs font-extrabold tracking-tight">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10">
                    <Clock className="h-3 w-3 text-amber-500" />
                  </div>
                  Study Time
                </h3>
                <div className="flex items-end gap-[2px] sm:gap-1 overflow-x-auto pb-1 scrollbar-none" style={{ minHeight: 80 }}>
                  {dailyData
                    .filter((d) => d.studyMinutes > 0)
                    .map((d, i) => {
                      const maxMin = Math.max(...dailyData.map((x) => x.studyMinutes), 1);
                      const h = Math.max((d.studyMinutes / maxMin) * 100, 5);
                      return (
                        <motion.div
                          key={d.date}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.45 + i * 0.02, duration: 0.3 }}
                          className="group relative flex flex-col items-center origin-bottom flex-1"
                          style={{ minWidth: 14, maxWidth: 28 }}
                        >
                          <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-[8px] font-bold text-background opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10 shadow-lg">
                            {d.studyMinutes}m
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-foreground" />
                          </div>
                          <div
                            className="w-full max-w-[12px] rounded-t-md bg-amber-500/50 group-hover:bg-amber-500/70 transition-colors"
                            style={{ height: `${h}%` }}
                          />
                          <span className="mt-1 text-[6px] sm:text-[7px] font-semibold text-muted-foreground/60">
                            {i % 2 === 0 ? d.date.slice(8) : ""}
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
