import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "subject_question_counts_v1";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export type SubjectCounts = Record<string, number>;

function readCache(): SubjectCounts | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; counts: SubjectCounts };
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.counts;
  } catch {
    return null;
  }
}

/**
 * Real per-subject question counts from the database.
 * Used to hide/flag subjects that have no content yet.
 */
export function useSubjectCounts() {
  const [counts, setCounts] = useState<SubjectCounts | null>(() => readCache());
  const [loading, setLoading] = useState(counts === null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.rpc("get_subject_question_counts" as any);
      if (!active) return;
      if (!error && Array.isArray(data)) {
        const next: SubjectCounts = {};
        for (const row of data as { subject: string; question_count: number }[]) {
          next[row.subject] = Number(row.question_count) || 0;
        }
        setCounts(next);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), counts: next }));
        } catch {
          /* storage full or unavailable — non-fatal */
        }
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return {
    counts: counts ?? {},
    loading,
    /** true only when we know for sure the subject has no questions */
    isEmpty: (subjectId: string) => counts !== null && !(counts[subjectId] > 0),
    countFor: (subjectId: string, fallback = 0) => counts?.[subjectId] ?? fallback,
  };
}
