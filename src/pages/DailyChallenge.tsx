import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Clock, Trophy, Zap, Star, Users, Target, ArrowRight } from "lucide-react";
import { Icon3D } from "@/components/ui/icon-3d";
import { motion, AnimatePresence } from "framer-motion";

const challengeSubjects = [
  { id: "mathematics", name: "Mathematics", emoji: "🔢", gradient: "from-primary to-[hsl(258,60%,52%)]" },
  { id: "physics", name: "Physics", emoji: "⚡", gradient: "from-[hsl(250,80%,55%)] to-[hsl(280,70%,50%)]" },
  { id: "chemistry", name: "Chemistry", emoji: "🧪", gradient: "from-[hsl(142,71%,40%)] to-[hsl(160,60%,38%)]" },
  { id: "biology", name: "Biology", emoji: "🧬", gradient: "from-[hsl(38,92%,45%)] to-[hsl(25,85%,50%)]" },
];

interface LeaderEntry {
  user_id: string;
  score: number;
  time_taken_seconds: number | null;
  display_name?: string;
}

export default function DailyChallenge() {
  useDocumentTitle("Daily Challenge | STEMCoach");
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Calculate time until next challenge resets
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto px-4 py-6 pb-28 lg:pb-12">
        {/* Hero */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Daily Challenge</h1>
              <p className="text-xs text-muted-foreground">New challenges every day · Compete for the top spot</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Resets in <strong className="text-foreground">{timeLeft}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <Zap className="h-4 w-4" />
              <span className="font-medium">100 XP Reward</span>
            </div>
          </div>
        </div>

        {/* Subject Selection */}
        <h2 className="mb-3 text-base font-semibold text-foreground">Choose Today's Challenge</h2>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {challengeSubjects.map((subj) => (
            <motion.button
              key={subj.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedSubject(subj.id)}
              className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                selectedSubject === subj.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/50 bg-card hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <div className="text-2xl mb-2">{subj.emoji}</div>
              <div className="text-sm font-semibold text-foreground">{subj.name}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Target className="h-3 w-3" /> 10 Questions
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" /> 10 minutes
              </div>
              {selectedSubject === subj.id && (
                <motion.div
                  layoutId="challengeCheck"
                  className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                >
                  <Star className="h-3 w-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {selectedSubject && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Button size="lg" className="w-full gap-2 text-base sm:w-auto">
              Start Challenge <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Today's Leaderboard */}
        <div className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-primary" /> Today's Leaderboard
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {[
                  { rank: 1, name: "Alex K.", score: "10/10", time: "4m 23s", xp: 150 },
                  { rank: 2, name: "Sarah M.", score: "10/10", time: "5m 01s", xp: 120 },
                  { rank: 3, name: "James R.", score: "9/10", time: "4m 45s", xp: 100 },
                  { rank: 4, name: "Priya S.", score: "9/10", time: "6m 12s", xp: 80 },
                  { rank: 5, name: "Omar H.", score: "8/10", time: "5m 30s", xp: 60 },
                ].map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-3 px-4 py-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      entry.rank === 1 ? "bg-yellow-500/20 text-yellow-600" :
                      entry.rank === 2 ? "bg-gray-300/20 text-gray-500" :
                      entry.rank === 3 ? "bg-amber-600/20 text-amber-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{entry.name}</div>
                      <div className="text-[10px] text-muted-foreground">{entry.score} · {entry.time}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Zap className="h-3 w-3" /> {entry.xp} XP
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Your Best Streak", value: "5 days", icon: Flame },
            { label: "Challenges Won", value: "12", icon: Trophy },
            { label: "Total XP Earned", value: "1,840", icon: Zap },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <stat.icon className="h-5 w-5 text-primary mb-1" />
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
