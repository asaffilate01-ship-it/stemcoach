import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface QuotaState {
  totalQuestions: number;
  usedQuestions: number;
  remainingQuestions: number;
  subjects: string[];
  levels: string[];
  hasPurchased: boolean;
  loading: boolean;
}

export function useQuotaGate() {
  const { user } = useAuth();
  const [state, setState] = useState<QuotaState>({
    totalQuestions: 0,
    usedQuestions: 0,
    remainingQuestions: 0,
    subjects: [],
    levels: [],
    hasPurchased: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const { data } = await supabase
      .from("user_quotas")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setState({
        totalQuestions: data.total_questions,
        usedQuestions: data.used_questions,
        remainingQuestions: Math.max(0, data.total_questions - data.used_questions),
        subjects: data.subjects || [],
        levels: data.levels || [],
        hasPurchased: data.total_questions > 0,
        loading: false,
      });
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const incrementUsed = useCallback(async () => {
    if (!user) return;
    setState(prev => ({
      ...prev,
      usedQuestions: prev.usedQuestions + 1,
      remainingQuestions: Math.max(0, prev.remainingQuestions - 1),
    }));

    await supabase
      .from("user_quotas")
      .update({ used_questions: state.usedQuestions + 1, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }, [user, state.usedQuestions]);

  const canPractice = state.remainingQuestions > 0 || !state.hasPurchased;
  const canUseAITutor = state.hasPurchased;

  return {
    ...state,
    canPractice,
    canUseAITutor,
    incrementUsed,
    refresh,
  };
}
