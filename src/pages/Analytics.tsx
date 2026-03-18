import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, BookOpen, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

interface AttemptWithQuestion {
  id: string;
  correct: boolean;
  created_at: string;
  time_taken_seconds: number | null;
  question: {
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: number;
  } | null;
}

interface SubjectBreakdown {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
  topics: TopicBreakdown[];
}

interface TopicBreakdown {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
  avgTime: number;
}

export default function Analytics() {
  useDocumentTitle("Analytics");
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAttempts();
  }, [user]);

  const loadAttempts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("attempts")
      .select("id, correct, created_at, time_taken_seconds, question_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!data?.length) { setLoading(false); return; }

    const questionIds = [...new Set(data.map(a => a.question_id))];
    const { data: questions } = await supabase
      .from("questions")
      .select("id, subject, topic, subtopic, difficulty")
      .in("id", questionIds);

    const qMap = new Map(questions?.map(q => [q.id, q]) || []);
    const enriched: AttemptWithQuestion[] = data.map(a => ({
      ...a,
      question: qMap.get(a.question_id) || null,
    }));

    setAttempts(enriched);
    setLoading(false);
  };

  const subjectBreakdowns = useMemo<SubjectBreakdown[]>(() => {
    const map = new Map<string, { total: number; correct: number; topics: Map<string, { total: number; correct: number; totalTime: number }> }>();

    attempts.forEach(a => {
      if (!a.question) return;
      const { subject, topic } = a.question;

      if (!map.has(subject)) map.set(subject, { total: 0, correct: 0, topics: new Map() });
      const s = map.get(subject)!;
      s.total++;
      if (a.correct) s.correct++;

      if (!s.topics.has(topic)) s.topics.set(topic, { total: 0, correct: 0, totalTime: 0 });
      const t = s.topics.get(topic)!;
      t.total++;
      if (a.correct) t.correct++;
      t.totalTime += a.time_taken_seconds || 0;
    });

    return Array.from(map.entries()).map(([subject, data]) => ({
      subject,
      total: data.total,
      correct: data.correct,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      topics: Array.from(data.topics.entries())
        .map(([topic, td]) => ({
          topic,
          total: td.total,
          correct: td.correct,
          accuracy: td.total > 0 ? Math.round((td.correct / td.total) * 100) : 0,
          avgTime: td.total > 0 ? Math.round(td.totalTime / td.total) : 0,
        }))
        .sort((a, b) => a.accuracy - b.accuracy),
    })).sort((a, b) => b.total - a.total);
  }, [attempts]);

  const selected = subjectBreakdowns.find(s => s.subject === selectedSubject);
  const weakTopics = subjectBreakdowns
    .flatMap(s => s.topics.map(t => ({ ...t, subject: s.subject })))
    .filter(t => t.total >= 3 && t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 8);

  // Weekly trend (last 4 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks: { label: string; total: number; correct: number; accuracy: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const weekAttempts = attempts.filter(a => {
        const d = new Date(a.created_at);
        return d >= start && d < end;
      });
      const correct = weekAttempts.filter(a => a.correct).length;
      weeks.push({
        label: `Week ${4 - i}`,
        total: weekAttempts.length,
        correct,
        accuracy: weekAttempts.length > 0 ? Math.round((correct / weekAttempts.length) * 100) : 0,
      });
    }
    return weeks;
  }, [attempts]);

  // Radar chart data
  const radarData = useMemo(() => {
    return subjectBreakdowns.slice(0, 6).map(s => ({
      subject: s.subject.length > 8 ? s.subject.slice(0, 8) + "…" : s.subject,
      accuracy: s.accuracy,
      fullMark: 100,
    }));
  }, [subjectBreakdowns]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="stem-label mb-2">Performance</div>
            <h1 className="stem-heading text-3xl">Subject Analytics</h1>
          </div>

          {attempts.length === 0 ? (
            <div className="stem-card rounded-xl p-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="mb-2 text-lg font-semibold">No data yet</h3>
              <p className="text-sm text-muted-foreground">Practice some questions to see your analytics.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Subject Cards */}
              <div className="space-y-4 lg:col-span-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" /> By Subject
                </h3>
                {subjectBreakdowns.map((s, i) => (
                  <motion.button
                    key={s.subject}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedSubject(selectedSubject === s.subject ? null : s.subject)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      selectedSubject === s.subject
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize">{s.subject}</span>
                      <span className={`text-sm font-bold ${
                        s.accuracy >= 80 ? "text-success" : s.accuracy >= 60 ? "text-primary" : "text-destructive"
                      }`}>{s.accuracy}%</span>
                    </div>
                    <Progress value={s.accuracy} className="mb-2 h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{s.total} questions</span>
                      <span>{s.correct} correct</span>
                    </div>
                  </motion.button>
                ))}

                {/* Radar Chart */}
                {radarData.length >= 3 && (
                  <div className="stem-card rounded-xl p-4">
                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Subject Radar</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Accuracy" dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Detail Panel */}
              <div className="space-y-6 lg:col-span-2">
                {/* Weekly Trend Chart */}
                <div className="stem-card rounded-xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <TrendingUp className="h-4 w-4 text-primary" /> Weekly Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyTrend}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: "0.75rem",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "accuracy" ? `${value}%` : value,
                          name === "accuracy" ? "Accuracy" : "Questions",
                        ]}
                      />
                      <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="accuracy" />
                      <Bar dataKey="total" fill="hsl(var(--primary) / 0.25)" radius={[6, 6, 0, 0]} name="total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Topic Breakdown */}
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="stem-card rounded-xl p-6"
                  >
                    <h3 className="mb-4 flex items-center gap-2 font-semibold capitalize">
                      <Target className="h-4 w-4 text-primary" /> {selected.subject} — Topics
                    </h3>
                    <div className="space-y-3">
                      {selected.topics.map((t) => (
                        <div key={t.topic} className="rounded-lg border p-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm font-medium">{t.topic}</span>
                            <div className="flex items-center gap-2">
                              {t.avgTime > 0 && (
                                <span className="text-[10px] text-muted-foreground">{t.avgTime}s avg</span>
                              )}
                              <span className={`text-sm font-bold ${
                                t.accuracy >= 80 ? "text-success" : t.accuracy >= 60 ? "text-primary" : "text-destructive"
                              }`}>{t.accuracy}%</span>
                            </div>
                          </div>
                          <Progress value={t.accuracy} className="h-1.5" />
                          <div className="mt-1 text-xs text-muted-foreground">
                            {t.correct}/{t.total} correct
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Weak Topics */}
                {weakTopics.length > 0 && (
                  <div className="stem-card rounded-xl p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4 text-warning" /> Focus Areas
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {weakTopics.map((t) => (
                        <div key={`${t.subject}-${t.topic}`} className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium">{t.topic}</span>
                            <span className="text-xs font-bold text-destructive">{t.accuracy}%</span>
                          </div>
                          <div className="text-xs capitalize text-muted-foreground">{t.subject} · {t.total} attempts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
