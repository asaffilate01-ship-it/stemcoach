import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { FREE_QUESTIONS_PER_SUBJECT } from "@/lib/subscriptionTiers";

interface QuotaState {
  totalQuestions: number;
  usedQuestions: number;
  remainingQuestions: number;
  mockExamsTotal: number;
  mockExamsUsed: number;
  mockExamsRemaining: number;
  subjects: string[];
  levels: string[];
  hasPurchased: boolean;
  loading: boolean;
  freeUsage: Record<string, number>;
}

export function useQuotaGate() {
  const { user } = useAuth();
  const [state, setState] = useState<QuotaState>({
    totalQuestions: 0,
    usedQuestions: 0,
    remainingQuestions: 0,
    mockExamsTotal: 0,
    mockExamsUsed: 0,
    mockExamsRemaining: 0,
    subjects: [],
    levels: [],
    hasPurchased: false,
    loading: true,
    freeUsage: {},
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
      const mockTotal = (data as any).mock_exams_total ?? 0;
      const mockUsed = (data as any).mock_exams_used ?? 0;
      setState(prev => ({
        ...prev,
        totalQuestions: data.total_questions,
        usedQuestions: data.used_questions,
        remainingQuestions: Math.max(0, data.total_questions - data.used_questions),
        mockExamsTotal: mockTotal,
        mockExamsUsed: mockUsed,
        mockExamsRemaining: Math.max(0, mockTotal - mockUsed),
        subjects: data.subjects || [],
        levels: data.levels || [],
        hasPurchased: data.total_questions > 0,
        loading: false,
      }));
    } else {
      // Free tier user — load free usage
      const { data: freeData } = await supabase.rpc("get_free_usage", { _user_id: user.id });
      const freeUsage: Record<string, number> = {};
      if (freeData) {
        for (const row of freeData as any[]) {
          freeUsage[row.subject] = Number(row.attempt_count);
        }
      }
      setState(prev => ({ ...prev, loading: false, freeUsage }));
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

    await supabase.rpc("increment_used_questions", { _user_id: user.id });
  }, [user]);

  const incrementMockExam = useCallback(async () => {
    if (!user) return;
    setState(prev => ({
      ...prev,
      mockExamsUsed: prev.mockExamsUsed + 1,
      mockExamsRemaining: Math.max(0, prev.mockExamsRemaining - 1),
    }));

    await supabase.rpc("increment_mock_exams_used" as any, { _user_id: user.id });
  }, [user]);

  const canPractice = state.hasPurchased && state.remainingQuestions > 0;
  const canUseCoaching = state.hasPurchased;
  const canTakeMockExam = state.hasPurchased && state.mockExamsRemaining > 0;

  const canPracticeSubjectFree = useCallback((subject: string): boolean => {
    if (state.hasPurchased) return true;
    return (state.freeUsage[subject] || 0) < FREE_QUESTIONS_PER_SUBJECT;
  }, [state.hasPurchased, state.freeUsage]);

  const getFreeRemainingForSubject = useCallback((subject: string): number => {
    if (state.hasPurchased) return state.remainingQuestions;
    return Math.max(0, FREE_QUESTIONS_PER_SUBJECT - (state.freeUsage[subject] || 0));
  }, [state.hasPurchased, state.freeUsage, state.remainingQuestions]);

  return {
    ...state,
    canPractice,
    canUseCoaching,
    canUseAITutor: canUseCoaching, // legacy alias
    canTakeMockExam,
    canPracticeSubjectFree,
    getFreeRemainingForSubject,
    incrementUsed,
    incrementMockExam,
    refresh,
    FREE_QUESTIONS_PER_SUBJECT,
  };
}
