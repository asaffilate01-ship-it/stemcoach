import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_COACH_ID, getCoachById, isCoachId, type CoachId } from "@/lib/mascots";

const CHANGE_EVENT = "stemcoach:preferred-coach-change";
type Snapshot = { accountId: string; attempt: number; coachId: CoachId; status: "ready" | "error" };

export function usePreferredCoach() {
  const { user, loading: authLoading } = useAuth();
  const accountId = user?.id;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [attempt, setAttempt] = useState(0);
  const saveInFlight = useRef(false);
  const activeAccount = useRef(accountId);
  const retry = useCallback(() => setAttempt(n => n + 1), []);

  useEffect(() => {
    activeAccount.current = accountId;
    if (!accountId) { setSnapshot(null); return; }
    let active = true;
    const sync = (event: Event) => {
      if ((event as CustomEvent<{ accountId: string }>).detail?.accountId === accountId) retry();
    };
    window.addEventListener(CHANGE_EVENT, sync);
    void (async () => {
      try {
        const { data, error } = await supabase.from("user_preferences").select("preferred_mascot").eq("user_id", accountId).maybeSingle();
        if (error) throw error;
        const coachId = isCoachId(data?.preferred_mascot) ? data.preferred_mascot : DEFAULT_COACH_ID;
        if (active) setSnapshot({ accountId, attempt, coachId, status: "ready" });
      } catch {
        if (active) setSnapshot({ accountId, attempt, coachId: DEFAULT_COACH_ID, status: "error" });
      }
    })();
    return () => {
      active = false;
      activeAccount.current = undefined;
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, [accountId, attempt, retry]);

  const setPreferredCoachId = useCallback(async (coachId: CoachId) => {
    if (!accountId || !isCoachId(coachId) || activeAccount.current !== accountId || saveInFlight.current) {
      return { error: new Error("Coach preference cannot be saved right now") };
    }
    saveInFlight.current = true;
    try {
      const { error } = await supabase.from("user_preferences").upsert(
        { user_id: accountId, preferred_mascot: coachId, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      if (error) return { error };
      if (activeAccount.current !== accountId) return { error: new Error("Account changed") };
      // Other mounted consumers reload the preference from the server. No
      // local transcript, account preference or optimistic success is stored.
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { accountId } }));
      return { error: null };
    } catch {
      return { error: new Error("Coach preference could not be saved") };
    } finally {
      saveInFlight.current = false;
    }
  }, [accountId]);

  const current = accountId && snapshot?.accountId === accountId && snapshot.attempt === attempt ? snapshot : null;
  const preferredCoachId = current?.status === "ready" ? current.coachId : DEFAULT_COACH_ID;
  return { preferredCoachId, preferredCoach: getCoachById(preferredCoachId), setPreferredCoachId,
    loading: Boolean(authLoading || (accountId && !current)), error: current?.status === "error", retry };
}
