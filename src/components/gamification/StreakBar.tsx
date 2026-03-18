import { Flame, Zap, Target, Trophy, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { xpProgress, calcLevel, xpForNextLevel } from "@/hooks/useGameStats";
import type { GameStats } from "@/hooks/useGameStats";
import { motion } from "framer-motion";

interface StreakBarProps {
  stats: GameStats;
}

export function StreakBar({ stats }: StreakBarProps) {
  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  const level = calcLevel(stats.xp);
  const progress = xpProgress(stats.xp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 md:p-4"
      style={{ boxShadow: "var(--stem-card-shadow)" }}
    >
      {/* Streak */}
      <div className="flex items-center gap-1.5 rounded-xl bg-warning/10 px-3 py-1.5">
        <Flame className="h-4 w-4 text-warning" />
        <span className="text-sm font-bold text-warning">{stats.streak}</span>
        <span className="text-[10px] font-medium text-muted-foreground">day streak</span>
      </div>

      {/* Accuracy */}
      <div className="flex items-center gap-1.5 rounded-xl bg-[hsl(var(--success)/0.1)] px-3 py-1.5">
        <Target className="h-4 w-4 text-[hsl(var(--success))]" />
        <span className="text-sm font-bold text-[hsl(var(--success))]">{accuracy}%</span>
      </div>

      {/* Level & XP */}
      <div className="flex flex-1 items-center gap-2 min-w-[140px]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-xs font-extrabold text-primary">{level}</span>
        </div>
        <div className="flex-1">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground">Level {level}</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {stats.xp}/{xpForNextLevel(stats.xp)} XP
            </span>
          </div>
          <Progress value={progress} variant="gradient" className="h-1.5" />
        </div>
      </div>

      {/* Perfect scores badge */}
      {stats.perfectScores > 0 && (
        <div className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1.5">
          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
          <span className="text-[10px] font-bold text-primary">{stats.perfectScores}</span>
        </div>
      )}
    </motion.div>
  );
}
