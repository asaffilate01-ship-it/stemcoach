import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Target } from "lucide-react";

interface LeaderEntry {
  user_id: string;
  display_name: string;
  xp: number;
  streak: number;
  level: number;
  total_questions: number;
  correct_answers: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [tab, setTab] = useState<"xp" | "streak" | "accuracy">("xp");

  useEffect(() => {
    async function load() {
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("user_id, xp, streak, level, total_questions, correct_answers")
        .order("xp", { ascending: false })
        .limit(50);

      if (!statsData?.length) { setEntries([]); return; }

      const userIds = statsData.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || "Student"]));

      setEntries(statsData.map(s => ({
        ...s,
        display_name: profileMap.get(s.user_id) || "Student",
      })));
    }
    load();
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (tab === "xp") return b.xp - a.xp;
    if (tab === "streak") return b.streak - a.streak;
    const accA = a.total_questions > 0 ? a.correct_answers / a.total_questions : 0;
    const accB = b.total_questions > 0 ? b.correct_answers / b.total_questions : 0;
    return accB - accA;
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <div className="stem-label mb-2">Competition</div>
          <h1 className="stem-heading text-3xl">Leaderboard</h1>
        </div>

        <div className="mb-6 flex gap-2">
          {[
            { key: "xp" as const, label: "XP", icon: Zap },
            { key: "streak" as const, label: "Streak", icon: Flame },
            { key: "accuracy" as const, label: "Accuracy", icon: Target },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                tab === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {sorted.map((entry, i) => {
            const isMe = entry.user_id === user?.id;
            const accuracy = entry.total_questions > 0
              ? Math.round((entry.correct_answers / entry.total_questions) * 100)
              : 0;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                  isMe ? "bg-primary/5 border-2 border-primary/20" : "stem-card"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center text-lg font-bold">
                  {i < 3 ? medals[i] : <span className="text-sm text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {entry.display_name} {isMe && <span className="text-xs text-primary">(You)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">Level {entry.level}</div>
                </div>
                <div className="text-right">
                  {tab === "xp" && (
                    <div className="flex items-center gap-1 text-sm font-bold text-primary">
                      <Zap className="h-3.5 w-3.5" /> {entry.xp.toLocaleString()}
                    </div>
                  )}
                  {tab === "streak" && (
                    <div className="flex items-center gap-1 text-sm font-bold text-warning">
                      <Flame className="h-3.5 w-3.5" /> {entry.streak} days
                    </div>
                  )}
                  {tab === "accuracy" && (
                    <div className="flex items-center gap-1 text-sm font-bold text-success">
                      <Target className="h-3.5 w-3.5" /> {accuracy}%
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {sorted.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Trophy className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>No entries yet. Start practicing to join the leaderboard!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
