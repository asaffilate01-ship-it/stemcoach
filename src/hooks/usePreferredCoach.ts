import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_COACH_ID,
  getCoachById,
  isCoachId,
  type CoachId,
} from "@/lib/mascots";

const STORAGE_KEY = "stemcoach:preferred-coach";
const CHANGE_EVENT = "stemcoach:preferred-coach-change";

function readLocalPreference(): CoachId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isCoachId(stored) ? stored : DEFAULT_COACH_ID;
  } catch {
    return DEFAULT_COACH_ID;
  }
}

function writeLocalPreference(coachId: CoachId) {
  try {
    localStorage.setItem(STORAGE_KEY, coachId);
  } catch {
    // The database preference still persists for signed-in users.
  }
}

export function usePreferredCoach() {
  const { user } = useAuth();
  const [preferredCoachId, setPreferredCoachIdState] = useState<CoachId>(readLocalPreference);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setPreferredCoachIdState(isCoachId(detail) ? detail : readLocalPreference());
    };
    const storage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setPreferredCoachIdState(readLocalPreference());
    };
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", storage);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    supabase
      .from("user_preferences")
      .select("preferred_mascot")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const remote = (data as { preferred_mascot?: unknown } | null)?.preferred_mascot;
        if (isCoachId(remote)) {
          writeLocalPreference(remote);
          setPreferredCoachIdState(remote);
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const setPreferredCoachId = useCallback(async (coachId: CoachId) => {
    writeLocalPreference(coachId);
    setPreferredCoachIdState(coachId);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: coachId }));

    if (!user) return { error: null };
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, preferred_mascot: coachId, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    return { error };
  }, [user]);

  return {
    preferredCoachId,
    preferredCoach: getCoachById(preferredCoachId),
    setPreferredCoachId,
    loading,
  };
}
