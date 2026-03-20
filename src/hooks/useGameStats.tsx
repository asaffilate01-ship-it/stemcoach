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

  const recordAnswer = useCallback(async (correct: boolean, pointsEarned: number) => {
    if (!user) return { xpGained: 0, newBadges: [] };

    const xpGain = correct ? pointsEarned * 10 : Math.max(pointsEarned * 2, 5);

    // Use server-side SECURITY DEFINER function
    const { data: result } = await supabase.rpc("record_answer_stats", {
      _user_id: user.id,
      _correct: correct,
      _xp_gain: xpGain,
    });

    if (result) {
      const r = result as any;
      setStats(prev => ({
        ...prev,
        xp: r.xp,
        level: r.level,
        streak: r.streak,
        longestStreak: r.longest_streak,
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      }));
    }

    // Check for new badges via server-side function
    const { data: allBadges } = await supabase.from("badges").select("*");
    const earned: EarnedBadge[] = [];
    for (const badge of allBadges || []) {
      const { data: awarded } = await supabase.rpc("award_badge", {
        _user_id: user.id,
        _badge_id: badge.id,
      });
      if (awarded) {
        earned.push({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          earnedAt: new Date().toISOString(),
        });
      }
    }
    if (earned.length > 0) setNewBadges(prev => [...prev, ...earned]);

    return { xpGained: xpGain, newBadges: earned };
  }, [user]);

  const recordPerfectScore = useCallback(async () => {
    if (!user) return;
    await supabase.rpc("record_perfect_score", { _user_id: user.id });
    setStats(prev => ({ ...prev, perfectScores: prev.perfectScores + 1 }));
  }, [user]);

  const dismissBadge = useCallback((id: string) => {
    setNewBadges(prev => prev.filter(b => b.id !== id));
  }, []);

  return { stats, loading, recordAnswer, recordPerfectScore, newBadges, dismissBadge, fetchStats };
}
