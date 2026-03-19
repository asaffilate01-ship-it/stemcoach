import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { DashboardSkeleton } from "@/components/layout/DashboardSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, Zap, TrendingUp, AlertTriangle, Calendar, ArrowRight, BookOpen, Brain, Layers, BarChart3, Trophy, Star, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { QuotaWidget } from "@/components/dashboard/QuotaWidget";
import { getCoachStem, getDailyMotivation } from "@/lib/mascots";

interface SubjectProgress {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface WeakTopic {
  subject: string;
  topic: string;
  accuracy: number;
  total: number;
}

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; questions: number; accuracy: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    const [statsRes, attemptsRes, badgesRes] = await Promise.all([
      supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
      supabase
        .from("attempts")
        .select("id, correct, created_at, question_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false })
        .limit(12),
    ]);

    setStats(statsRes.data);
    setBadges(badgesRes.data || []);

    const attempts = attemptsRes.data || [];
    if (attempts.length > 0) {
      const qIds = [...new Set(attempts.map((a) => a.question_id))];
      const { data: questions } = await supabase
        .from("questions")
        .select("id, subject, topic")
        .in("id", qIds);

      const qMap = new Map(questions?.map((q) => [q.id, q]) || []);

      const subjectMap = new Map<string, { total: number; correct: number }>();
      const topicMap = new Map<string, { subject: string; total: number; correct: number }>();

      const dayMap = new Map<string, { total: number; correct: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, { total: 0, correct: 0 });
      }

      attempts.forEach((a) => {
        const q = qMap.get(a.question_id);
        if (!q) return;

        if (!subjectMap.has(q.subject)) subjectMap.set(q.subject, { total: 0, correct: 0 });
        const s = subjectMap.get(q.subject)!;
        s.total++;
        if (a.correct) s.correct++;

        const topicKey = `${q.subject}::${q.topic}`;
        if (!topicMap.has(topicKey)) topicMap.set(topicKey, { subject: q.subject, total: 0, correct: 0 });
        const t = topicMap.get(topicKey)!;
        t.total++;
        if (a.correct) t.correct++;

        const dateKey = a.created_at.slice(0, 10);
        if (dayMap.has(dateKey)) {
          const dm = dayMap.get(dateKey)!;
          dm.total++;
          if (a.correct) dm.correct++;
        }
      });

      setDailyData(
        Array.from(dayMap.entries()).map(([date, d]) => ({
          date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
          questions: d.total,
          accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
        }))
      );

      setSubjectProgress(
        Array.from(subjectMap.entries())
          .map(([subject, d]) => ({
            subject,
            total: d.total,
            correct: d.correct,
            accuracy: Math.round((d.correct / d.total) * 100),
          }))
          .sort((a, b) => b.total - a.total)
      );

      setWeakTopics(
        Array.from(topicMap.entries())
          .map(([key, d]) => ({
            subject: d.subject,
            topic: key.split("::")[1],
            accuracy: Math.round((d.correct / d.total) * 100),
            total: d.total,
          }))
          .filter((t) => t.total >= 3 && t.accuracy < 60)
          .sort((a, b) => a.accuracy - b.accuracy)
          .slice(0, 6)
      );

      const recentMap = new Map<string, { subject: string; topic: string; date: string; score: number; total: number }>();
      attempts.slice(0, 50).forEach((a) => {
        const q = qMap.get(a.question_id);
        if (!q) return;
        const date = new Date(a.created_at).toLocaleDateString();
        const key = `${date}-${q.topic}`;
        if (!recentMap.has(key)) recentMap.set(key, { subject: q.subject, topic: q.topic, date, score: 0, total: 0 });
        const r = recentMap.get(key)!;
        r.total++;
        if (a.correct) r.score++;
      });
      setRecentActivity(Array.from(recentMap.values()).slice(0, 8));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <DashboardSkeleton />
      </div>
    );
  }

  const totalQ = stats?.total_questions || 0;
  const correctQ = stats?.correct_answers || 0;
  const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const displayName = user?.email?.split("@")[0] || "Student";

  const quickActions = [
    { label: "Practice", icon: BookOpen, to: "/subjects", color: "bg-primary/10 text-primary", hoverColor: "group-hover:bg-primary/15" },
    { label: "Weak Drills", icon: Brain, to: "/weak-drills", color: "bg-warning/10 text-warning", hoverColor: "group-hover:bg-warning/15" },
    { label: "Flashcards", icon: Layers, to: "/flashcards", color: "bg-success/10 text-success", hoverColor: "group-hover:bg-success/15" },
    { label: "Analytics", icon: BarChart3, to: "/analytics", color: "bg-accent text-accent-foreground", hoverColor: "group-hover:bg-accent/80" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition>
        <main id="main-content" className="container mx-auto px-4 py-5 pb-28 flex-1 md:py-8">
          {/* Welcome header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 md:mb-8"
          >
            <div className="stem-label mb-1 text-[10px] md:mb-2 md:text-[11px]">Student Dashboard</div>
            <h1 className="stem-heading text-2xl md:text-3xl">
              {greeting}, <span className="stem-gradient-text capitalize">{displayName}</span>
            </h1>
            {stats?.streak > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-warning" />
                {stats.streak}-day streak — keep it going!
              </p>
            )}
          </motion.div>

          {/* Quick Actions */}
          <div className="mb-5 md:mb-8">
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(action.to)}
                  className="group stem-card flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left sm:gap-3 sm:p-3"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 sm:h-9 sm:w-9 ${action.color} ${action.hoverColor}`}>
                    <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap sm:text-sm">{action.label}</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/0 transition-all duration-300 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 hidden sm:block" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quota Widget */}
          <div className="mb-5 md:mb-8">
            <QuotaWidget />
          </div>

          {/* Stats Grid */}
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4 md:mb-8">
            {[
              { label: "Questions", value: totalQ, icon: Target, color: "bg-primary/10 text-primary" },
              { label: "Accuracy", value: `${accuracy}%`, icon: TrendingUp, color: "bg-success/10 text-success" },
              { label: "Streak", value: `${stats?.streak || 0}`, icon: Flame, color: "bg-warning/10 text-warning", suffix: " days" },
              { label: "XP", value: (stats?.xp || 0).toLocaleString(), icon: Zap, color: "bg-primary/10 text-primary" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group rounded-xl border border-border/40 bg-card p-3 transition-shadow hover:shadow-premium sm:rounded-2xl sm:p-5"
                style={{ boxShadow: "var(--stem-card-shadow)" }}
              >
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 sm:mb-3 sm:h-10 sm:w-10 sm:rounded-xl ${stat.color}`}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {stat.value}
                  {stat.suffix && <span className="text-[10px] font-semibold text-muted-foreground sm:text-sm">{stat.suffix}</span>}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:mt-1 sm:text-[11px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {totalQ === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="stem-card rounded-xl p-12 text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Start practicing!</h3>
              <p className="mb-6 text-sm text-muted-foreground">Answer some questions to see your progress here.</p>
              <button
                onClick={() => navigate("/subjects")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              >
                Browse Subjects <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              {/* Activity Chart */}
              {dailyData.some(d => d.questions > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="stem-card rounded-xl p-5 sm:p-6 lg:col-span-2"
                >
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                    </div>
                    14-Day Activity
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={30} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: "0.75rem",
                          boxShadow: "var(--stem-card-shadow)",
                        }}
                      />
                      <Area type="monotone" dataKey="questions" stroke="hsl(var(--primary))" fill="url(#colorQ)" strokeWidth={2.5} name="Questions" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Subject Progress */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="stem-card rounded-xl p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Subject Readiness
                  </h3>
                  <button onClick={() => navigate("/analytics")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors">
                    View details <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                {subjectProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subject data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {subjectProgress.map((sp) => (
                      <div key={sp.subject} className="group">
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{sp.subject}</span>
                          <span className={`font-semibold tabular-nums ${sp.accuracy >= 80 ? "text-success" : sp.accuracy >= 60 ? "text-warning" : "text-destructive"}`}>{sp.accuracy}%</span>
                        </div>
                        <Progress value={sp.accuracy} className="h-2" />
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                          <span>{sp.total} questions</span>
                          <span>{sp.correct} correct</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Weak Topics */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="stem-card rounded-xl p-5 sm:p-6"
              >
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  </div>
                  Focus Areas
                </h3>
                {weakTopics.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No weak areas identified yet. Keep practicing!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {weakTopics.map((wt) => (
                      <motion.div
                        key={`${wt.subject}-${wt.topic}`}
                        whileHover={{ x: 2 }}
                        className="group cursor-pointer rounded-xl border border-border/50 p-3 transition-all hover:border-warning/20 hover:bg-warning/[0.02]"
                        onClick={() => navigate("/weak-drills")}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{wt.topic}</span>
                          <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${wt.accuracy < 40 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{wt.accuracy}%</span>
                        </div>
                        <div className="text-xs capitalize text-muted-foreground">{wt.subject} · {wt.total} attempts</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="stem-card rounded-xl p-5 sm:p-6"
                >
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                      <TrendingUp className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                    Recent Activity
                  </h3>
                  <div className="space-y-2">
                    {recentActivity.map((a, i) => {
                      const ratio = a.score / a.total;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.04 }}
                          className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2.5 transition-all hover:bg-muted/30"
                        >
                          <div>
                            <div className="text-sm font-medium">{a.topic}</div>
                            <div className="text-xs capitalize text-muted-foreground">{a.subject} · {a.date}</div>
                          </div>
                          <div className={`rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums ${ratio >= 0.8 ? "bg-success/10 text-success" : ratio >= 0.6 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                            {a.score}/{a.total}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="stem-card rounded-xl p-5 sm:p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                        <Trophy className="h-3.5 w-3.5 text-primary" />
                      </div>
                      Recent Badges
                    </h3>
                    <button onClick={() => navigate("/badges")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    {badges.map((ub: any, i: number) => (
                      <motion.div
                        key={ub.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-3 text-center transition-shadow hover:shadow-premium"
                      >
                        <div className="mb-1.5 text-2xl">{ub.badges?.icon || "🏆"}</div>
                        <div className="text-xs font-bold leading-tight">{ub.badges?.name || "Badge"}</div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(ub.earned_at).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
