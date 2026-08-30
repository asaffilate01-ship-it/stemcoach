import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "curriculum_subject_question_counts_v2";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export type SubjectCounts = Record<string, number>;

function readCache(key: string): SubjectCounts | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}:${key}`);
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
export interface SubjectCountFilters {
  curricula?: string[];
  boards?: string[];
  difficulty?: number | null;
}

export function useSubjectCounts(filters: SubjectCountFilters = {}) {
  const curricula = [...(filters.curricula ?? [])].sort();
  const boards = [...(filters.boards ?? [])].sort();
  const difficulty = filters.difficulty ?? null;
  const cacheSegment = JSON.stringify({ curricula, boards, difficulty });
  const [result, setResult] = useState<{ key: string; counts: SubjectCounts | null }>(() => ({
    key: cacheSegment,
    counts: readCache(cacheSegment),
  }));
  const counts = result.key === cacheSegment ? result.counts : null;
  const [loading, setLoading] = useState(counts === null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const cached = readCache(cacheSegment);
      setResult({ key: cacheSegment, counts: cached });
      setLoading(cached === null);
      const activeFilters = JSON.parse(cacheSegment) as {
        curricula: string[];
        boards: string[];
        difficulty: number | null;
      };
      const { data, error } = await supabase.rpc("get_curriculum_subject_question_counts" as any, {
        _curricula: activeFilters.curricula.length > 0 ? activeFilters.curricula : null,
        _boards: activeFilters.boards.length > 0 ? activeFilters.boards : null,
        _difficulty: activeFilters.difficulty,
      });
      if (!active) return;
      if (!error && Array.isArray(data)) {
        const next: SubjectCounts = {};
        for (const row of data as { subject: string; question_count: number }[]) {
          next[row.subject] = Number(row.question_count) || 0;
        }
        setResult({ key: cacheSegment, counts: next });
        try {
          localStorage.setItem(`${CACHE_KEY}:${cacheSegment}`, JSON.stringify({ at: Date.now(), counts: next }));
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
  }, [cacheSegment]);

  return {
    counts: counts ?? {},
    loading: loading || result.key !== cacheSegment,
    /** true only when we know for sure the subject has no questions */
    isEmpty: (subjectId: string) => counts !== null && !(counts[subjectId] > 0),
    countFor: (subjectId: string, fallback = 0) => counts?.[subjectId] ?? fallback,
  };
}
