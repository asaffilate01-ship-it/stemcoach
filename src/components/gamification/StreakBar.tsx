import { Flame, Zap, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { xpProgress, calcLevel, xpForNextLevel } from "@/hooks/useGameStats";
import type { GameStats } from "@/hooks/useGameStats";

interface StreakBarProps {
  stats: GameStats;
}

export function StreakBar({ stats }: StreakBarProps) {
  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-3 shadow-sm" style={{ boxShadow: "var(--stem-card-shadow)" }}>
      <div className="flex items-center gap-1.5">
        <Flame className="h-4 w-4 text-warning" />
        <span className="text-sm font-bold">{stats.streak}</span>
        <span className="text-xs text-muted-foreground">streak</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Target className="h-4 w-4 text-success" />
        <span className="text-sm font-bold">{accuracy}%</span>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <Progress value={xpProgress(stats.xp)} className="h-2" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Lv{calcLevel(stats.xp)} · {stats.xp}/{xpForNextLevel(stats.xp)} XP
        </span>
      </div>
    </div>
  );
}
