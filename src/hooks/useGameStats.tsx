import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GameStats {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalQuestions: number;
  correctAnswers: number;
  perfectScores: number;
}

export interface EarnedBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

const XP_PER_LEVEL = 500;

export function calcLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(xp: number) {
  const level = calcLevel(xp);
  return level * XP_PER_LEVEL;
}

export function xpProgress(xp: number) {
  const currentLevelXp = (calcLevel(xp) - 1) * XP_PER_LEVEL;
  const nextLevelXp = xpForNextLevel(xp);
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
}

export function useGameStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats>({
    xp: 0, level: 1, streak: 0, longestStreak: 0,
    totalQuestions: 0, correctAnswers: 0, perfectScores: 0,
  });
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setStats({
        xp: data.xp,
        level: calcLevel(data.xp),
        streak: data.streak,
        longestStreak: data.longest_streak,
        totalQuestions: data.total_questions,
        correctAnswers: data.correct_answers,
        perfectScores: data.perfect_scores,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const dismissBadge = useCallback((id: string) => {
    setNewBadges(prev => prev.filter(b => b.id !== id));
  }, []);

  return { stats, loading, newBadges, dismissBadge, fetchStats };
}
