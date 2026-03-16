import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";

const FREE_DAILY_LIMIT = 5;

export function useSubscriptionGate() {
  const { user } = useAuth();
  const { tier, loading: subLoading } = useSubscription();
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    
    const fetchTodayCount = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00Z`);
      setTodayCount(count || 0);
      setLoading(false);
    };

    fetchTodayCount();
  }, [user]);

  const isFree = tier === "free";
  const remainingToday = Math.max(0, FREE_DAILY_LIMIT - todayCount);
  const canPractice = !isFree || remainingToday > 0;
  const canUseAITutor = !isFree;

  const incrementCount = () => setTodayCount(prev => prev + 1);

  return {
    isFree,
    canPractice,
    canUseAITutor,
    remainingToday,
    todayCount,
    loading: loading || subLoading,
    incrementCount,
    FREE_DAILY_LIMIT,
  };
}
