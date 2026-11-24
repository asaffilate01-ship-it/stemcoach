import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { curricula } from "@/data/questions";

const curriculumIds = new Set(curricula.map(item => item.id));
type Snapshot = { accountId: string; attempt: number; status: "ready" | "error"; curriculumId: string | null };

export function useLearnerCurriculum() {
  const { user, loading: authLoading } = useAuth();
  const accountId = user?.id;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(n => n + 1), []);

  useEffect(() => {
    if (!accountId) { setSnapshot(null); return; }
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase.from("user_preferences").select("curriculum").eq("user_id", accountId).maybeSingle();
        if (error) throw error;
        const curriculumId = data?.curriculum || null;
        // Null means a successful lookup with no preference; an unknown ID is
        // a data error, not permission to request every curriculum.
        if (curriculumId && !curriculumIds.has(curriculumId)) throw new Error("Unknown curriculum");
        if (active) setSnapshot({ accountId, attempt, status: "ready", curriculumId });
      } catch {
        if (active) setSnapshot({ accountId, attempt, status: "error", curriculumId: null });
      }
    })();
    return () => { active = false; };
  }, [accountId, attempt]);

  const current = accountId && snapshot?.accountId === accountId && snapshot.attempt === attempt ? snapshot : null;
  const curriculumId = current?.status === "ready" ? current.curriculumId : null;
  const curriculum = curricula.find(item => item.id === curriculumId) || null;
  return { curriculumId, curriculum, loading: Boolean(authLoading || (accountId && !current)), error: current?.status === "error", retry };
}
