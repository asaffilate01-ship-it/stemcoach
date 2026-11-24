import { useState, useEffect, useCallback, useRef } from "react";
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
  freeUsage: Record<string, number>;
}

const EMPTY: QuotaState = {
  totalQuestions: 0, usedQuestions: 0, remainingQuestions: 0,
  mockExamsTotal: 0, mockExamsUsed: 0, mockExamsRemaining: 0,
  subjects: [], levels: [], hasPurchased: false, freeUsage: {},
};
type Snapshot = { accountId: string; status: "loading" | "ready" | "error"; quota: QuotaState };

function nonnegative(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid quota count");
  return value;
}

export function useQuotaGate() {
  const { user, loading: authLoading } = useAuth();
  const accountId = user?.id ?? null;
  const activeAccount = useRef(accountId);
  const requestVersion = useRef(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const refresh = useCallback(async () => {
    if (!accountId || activeAccount.current !== accountId) return;
    const version = ++requestVersion.current;
    const isCurrent = () => activeAccount.current === accountId && requestVersion.current === version;
    setSnapshot({ accountId, status: "loading", quota: EMPTY });
    try {
      const { data, error } = await supabase.from("user_quotas").select("*").eq("user_id", accountId).maybeSingle();
      if (!isCurrent()) return;
      if (error) throw error;
      let quota = EMPTY;
      if (data) {
        const totalQuestions = nonnegative(data.total_questions);
        const usedQuestions = nonnegative(data.used_questions);
        const mockExamsTotal = nonnegative(data.mock_exams_total ?? 0);
        const mockExamsUsed = nonnegative(data.mock_exams_used ?? 0);
        quota = { ...EMPTY, totalQuestions, usedQuestions,
          remainingQuestions: Math.max(0, totalQuestions - usedQuestions),
          mockExamsTotal, mockExamsUsed,
          mockExamsRemaining: Math.max(0, mockExamsTotal - mockExamsUsed),
          subjects: data.subjects ?? [], levels: data.levels ?? [],
          hasPurchased: totalQuestions > 0 };
      }
      if (!quota.hasPurchased) {
        const { data: freeData, error: freeError } = await supabase.rpc("get_free_usage", { _user_id: accountId });
        if (!isCurrent()) return;
        if (freeError || !Array.isArray(freeData)) throw new Error("Free usage could not be verified");
        const freeUsage: Record<string, number> = Object.create(null);
        for (const row of freeData) freeUsage[row.subject] = nonnegative(Number(row.attempt_count));
        quota = { ...quota, freeUsage };
      }
      if (isCurrent()) setSnapshot({ accountId, status: "ready", quota });
    } catch {
      if (isCurrent()) setSnapshot({ accountId, status: "error", quota: EMPTY });
    }
  }, [accountId]);

  useEffect(() => {
    activeAccount.current = accountId;
    if (accountId) void refresh();
    else setSnapshot(null);
    return () => { activeAccount.current = null; requestVersion.current++; };
  }, [accountId, refresh]);

  const current = accountId && snapshot?.accountId === accountId ? snapshot : null;
  const ready = Boolean(accountId && current?.status === "ready");
  const state = ready && current ? current.quota : EMPTY;
  const loading = Boolean(authLoading || (accountId && (!current || current.status === "loading")));
  const error = current?.status === "error";
  const canPractice = ready && state.hasPurchased && state.remainingQuestions > 0;
  const canUseCoaching = ready && state.hasPurchased;
  const canTakeMockExam = ready && state.hasPurchased && state.mockExamsRemaining > 0;

  const getFreeRemainingForSubject = useCallback((subject: string): number => {
    if (!ready) return 0;
    if (state.hasPurchased) return state.remainingQuestions;
    const used = Object.prototype.hasOwnProperty.call(state.freeUsage, subject) ? state.freeUsage[subject] : 0;
    return Math.max(0, FREE_QUESTIONS_PER_SUBJECT - used);
  }, [ready, state.hasPurchased, state.freeUsage, state.remainingQuestions]);
  const canPracticeSubjectFree = useCallback((subject: string) => getFreeRemainingForSubject(subject) > 0, [getFreeRemainingForSubject]);

  // Only the server consumes credits. These aliases refresh the read-only UI.
  return { ...state, loading, error, canPractice, canUseCoaching,
    canUseAITutor: canUseCoaching, canTakeMockExam, canPracticeSubjectFree,
    getFreeRemainingForSubject, incrementUsed: refresh, incrementMockExam: refresh,
    refresh, FREE_QUESTIONS_PER_SUBJECT };
}
