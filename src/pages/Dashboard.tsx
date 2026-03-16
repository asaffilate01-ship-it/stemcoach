import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Flame, Target, Zap, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

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
      // Get question details for attempts
      const qIds = [...new Set(attempts.map((a) => a.question_id))];
      const { data: questions } = await supabase
        .from("questions")
        .select("id, subject, topic")
        .in("id", qIds);

      const qMap = new Map(questions?.map((q) => [q.id, q]) || []);

      // Subject breakdown
      const subjectMap = new Map<string, { total: number; correct: number }>();
      const topicMap = new Map<string, { subject: string; total: number; correct: number }>();

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
      });

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

      // Recent activity grouped by day+topic
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const totalQ = stats?.total_questions || 0;
  const correctQ = stats?.correct_answers || 0;
  const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Student Dashboard</div>
          <h1 className="stem-heading text-3xl">Your Progress</h1>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Questions", value: totalQ, icon: Target, color: "text-primary" },
            { label: "Accuracy", value: `${accuracy}%`, icon: TrendingUp, color: "text-success" },
            { label: "Streak", value: `${stats?.streak || 0} days`, icon: Flame, color: "text-warning" },
            { label: "XP", value: (stats?.xp || 0).toLocaleString(), icon: Zap, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stem-card rounded-xl p-4"
            >
              <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="stem-label mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {totalQ === 0 ? (
          <div className="stem-card rounded-xl p-12 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold">Start practicing!</h3>
            <p className="mb-4 text-sm text-muted-foreground">Answer some questions to see your progress here.</p>
            <button onClick={() => navigate("/subjects")} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Browse Subjects
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subject Progress */}
            <div className="stem-card rounded-xl p-6">
              <h3 className="mb-4 font-semibold">Subject Readiness</h3>
              {subjectProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subject data yet.</p>
              ) : (
                <div className="space-y-4">
                  {subjectProgress.map((sp) => (
                    <div key={sp.subject}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{sp.subject}</span>
                        <span className="text-muted-foreground">{sp.accuracy}%</span>
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
            </div>

            {/* Weak Topics */}
            <div className="stem-card rounded-xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Focus Areas
              </h3>
              {weakTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weak areas identified yet. Keep practicing!</p>
              ) : (
                <div className="space-y-3">
                  {weakTopics.map((wt) => (
                    <div key={`${wt.subject}-${wt.topic}`} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{wt.topic}</span>
                        <span className="text-xs font-semibold text-destructive">{wt.accuracy}%</span>
                      </div>
                      <div className="text-xs capitalize text-muted-foreground">{wt.subject} · {wt.total} attempts</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="stem-card rounded-xl p-6">
                <h3 className="mb-4 font-semibold">Recent Activity</h3>
                <div className="space-y-2">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{a.topic}</div>
                        <div className="text-xs capitalize text-muted-foreground">{a.subject} · {a.date}</div>
                      </div>
                      <div className={`text-sm font-semibold ${a.score / a.total >= 0.8 ? "text-success" : a.score / a.total >= 0.6 ? "text-warning" : "text-destructive"}`}>
                        {a.score}/{a.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="stem-card rounded-xl p-6">
                <h3 className="mb-4 font-semibold">Recent Badges</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {badges.map((ub: any) => (
                    <div key={ub.id} className="rounded-lg border bg-primary/5 border-primary/20 p-3 text-center">
                      <div className="mb-1 text-2xl">{ub.badges?.icon || "🏆"}</div>
                      <div className="text-xs font-semibold">{ub.badges?.name || "Badge"}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(ub.earned_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
