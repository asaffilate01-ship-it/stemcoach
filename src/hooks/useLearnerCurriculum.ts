import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { curricula } from "@/data/questions";

const STORAGE_KEY = "stemcoach:learner-curriculum";
const curriculumIds = new Set(curricula.map((curriculum) => curriculum.id));

function readStoredCurriculum(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && curriculumIds.has(value) ? value : null;
  } catch {
    return null;
  }
}

export function useLearnerCurriculum() {
  const { user } = useAuth();
  const [curriculumId, setCurriculumId] = useState<string | null>(readStoredCurriculum);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    supabase
      .from("user_preferences")
      .select("curriculum")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const remote = data?.curriculum;
        if (remote && curriculumIds.has(remote)) {
          setCurriculumId(remote);
          try { localStorage.setItem(STORAGE_KEY, remote); } catch { /* storage unavailable */ }
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const curriculum = useMemo(
    () => curricula.find((item) => item.id === curriculumId) || null,
    [curriculumId],
  );

  return { curriculumId, curriculum, loading };
}
