import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useGameStats } from "@/hooks/useGameStats";
import { StreakBar } from "@/components/gamification/StreakBar";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  earned: boolean;
  earned_at?: string;
}

export default function Badges() {
  useDocumentTitle("Badges");
  const { user } = useAuth();
  const { stats } = useGameStats();
  const [badges, setBadges] = useState<BadgeData[]>([]);

  useEffect(() => {
    async function load() {
      const { data: allBadges } = await supabase.from("badges").select("*");
      let earnedIds = new Set<string>();
      let earnedMap = new Map<string, string>();

      if (user) {
        const { data: ub } = await supabase
          .from("user_badges")
          .select("badge_id, earned_at")
          .eq("user_id", user.id);
        for (const b of ub || []) {
          earnedIds.add(b.badge_id);
          earnedMap.set(b.badge_id, b.earned_at);
        }
      }

      setBadges(
        (allBadges || []).map((b) => ({
          ...b,
          earned: earnedIds.has(b.id),
          earned_at: earnedMap.get(b.id),
        }))
      );
    }
    load();
  }, [user]);

  const categories = [...new Set(badges.map((b) => b.category))];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="stem-label mb-2">Achievements</div>
          <h1 className="stem-heading text-3xl">Badges & Awards</h1>
        </div>

        {user && <div className="mb-6"><StreakBar stats={stats} /></div>}

        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold capitalize">
              <Trophy className="h-5 w-5 text-primary" />
              {cat}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {badges
                .filter((b) => b.category === cat)
                .map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`stem-card rounded-xl p-4 text-center transition-all ${
                      badge.earned
                        ? "border-2 border-primary/20 bg-primary/5"
                        : "opacity-50 grayscale"
                    }`}
                  >
                    <div className="relative mb-2 text-4xl">
                      {badge.icon}
                      {!badge.earned && (
                        <Lock className="absolute -right-1 -top-1 h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-sm font-bold">{badge.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{badge.description}</div>
                    {badge.earned && badge.earned_at && (
                      <div className="mt-2 text-[10px] font-medium text-primary">
                        Earned {new Date(badge.earned_at).toLocaleDateString()}
                      </div>
                    )}
                    {badge.xp_reward > 0 && (
                      <div className="mt-1 text-[10px] text-muted-foreground">+{badge.xp_reward} XP</div>
                    )}
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
        </main>
      </PageTransition>
    </div>
  );
}
