import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Target, Users, Calendar } from "lucide-react";
import { getSquadMembers, getCoachStem } from "@/lib/mascots";
import { useTranslation } from "react-i18next";

interface LeaderEntry {
  user_id: string;
  display_name: string;
  xp: number;
  streak: number;
  level: number;
  total_questions: number;
  correct_answers: number;
}

type Tab = "xp" | "streak" | "accuracy";
type TimeFrame = "all" | "weekly";

export default function Leaderboard() {
  const { t } = useTranslation();
  useDocumentTitle(t("leaderboard.title"));
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [tab, setTab] = useState<Tab>("xp");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("all");
  const [classId, setClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, [timeFrame, classId]);

  useEffect(() => {
    if (!user) return;
    // Load user's classes for class filter
    supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", user.id)
      .then(async ({ data: memberships }) => {
        if (!memberships?.length) return;
        const ids = memberships.map((m) => m.class_id);
        const { data: classData } = await supabase
          .from("classes")
          .select("id, name")
          .in("id", ids);
        setClasses(classData || []);
      });
  }, [user]);

  const loadLeaderboard = async () => {
    let query = supabase
      .from("user_stats")
      .select("user_id, xp, streak, level, total_questions, correct_answers")
      .order("xp", { ascending: false })
      .limit(50);

    // If class filter, get class member IDs first
    let memberIds: string[] | null = null;
    if (classId) {
      const { data: members } = await supabase
        .from("class_members")
        .select("user_id")
        .eq("class_id", classId);
      memberIds = members?.map((m) => m.user_id) || [];
      if (memberIds.length === 0) {
        setEntries([]);
        return;
      }
      query = query.in("user_id", memberIds);
    }

    // Weekly: filter by last_active_date within 7 days
    if (timeFrame === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte("last_active_date", weekAgo.toISOString().split("T")[0]);
    }

    const { data: statsData } = await query;
    if (!statsData?.length) {
      setEntries([]);
      return;
    }

    const userIds = statsData.map((s) => s.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name || t("leaderboard.student")]));

    setEntries(
      statsData.map((s) => ({
        ...s,
        display_name: profileMap.get(s.user_id) || t("leaderboard.student"),
      }))
    );
  };

  const sorted = [...entries].sort((a, b) => {
    if (tab === "xp") return b.xp - a.xp;
    if (tab === "streak") return b.streak - a.streak;
    const accA = a.total_questions > 0 ? a.correct_answers / a.total_questions : 0;
    const accB = b.total_questions > 0 ? b.correct_answers / b.total_questions : 0;
    return accB - accA;
  });

  const medals = ["🥇", "🥈", "🥉"];

  // Pick a random cheerleader mascot for the top section
  const squadMembers = getSquadMembers();
  const cheerMascot = squadMembers.length > 0
    ? squadMembers[Math.floor(Date.now() / 86400000) % squadMembers.length]
    : getCoachStem();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 shadow-md"
          >
            <img src={cheerMascot.image} alt={cheerMascot.name} className="h-full w-full object-cover" />
          </motion.div>
          <div>
            <div className="stem-label mb-1">{t("leaderboard.label")}</div>
            <h1 className="stem-heading text-3xl">{t("leaderboard.title")}</h1>
            <p className="text-[11px] text-muted-foreground italic">"{cheerMascot.cheerMessage}"</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { key: "xp" as const, label: t("leaderboard.xp"), icon: Zap },
            { key: "streak" as const, label: t("leaderboard.streak"), icon: Flame },
            { key: "accuracy" as const, label: t("leaderboard.accuracy"), icon: Target },
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

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setTimeFrame("all")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                timeFrame === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" /> {t("leaderboard.allTime")}
            </button>
            <button
              onClick={() => setTimeFrame("weekly")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                timeFrame === "weekly"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> {t("leaderboard.thisWeek")}
            </button>
          </div>
        </div>

        {/* Class filter */}
        {classes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setClassId(null)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                !classId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Users className="h-3 w-3" /> {t("leaderboard.global")}
            </button>
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setClassId(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  classId === c.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {sorted.map((entry, i) => {
            const isMe = entry.user_id === user?.id;
            const accuracy =
              entry.total_questions > 0
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
                    {entry.display_name} {isMe && <span className="text-xs text-primary">{t("leaderboard.you")}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("leaderboard.level")} {entry.level}</div>
                </div>
                <div className="text-right">
                  {tab === "xp" && (
                    <div className="flex items-center gap-1 text-sm font-bold text-primary">
                      <Zap className="h-3.5 w-3.5" /> {entry.xp.toLocaleString()}
                    </div>
                  )}
                  {tab === "streak" && (
                    <div className="flex items-center gap-1 text-sm font-bold text-warning">
                      <Flame className="h-3.5 w-3.5" /> {entry.streak} {t("leaderboard.days")}
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
              <p>{t("leaderboard.empty")}</p>
            </div>
          )}
        </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
