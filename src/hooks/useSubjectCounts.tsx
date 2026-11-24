import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubjectCounts = Record<string, number>;
export interface SubjectCountFilters { curricula?: string[]; boards?: string[]; difficulty?: number | null; }
type Snapshot = { key: string; attempt: number; status: "ready" | "error"; counts: SubjectCounts };

export function useSubjectCounts(filters: SubjectCountFilters = {}) {
  const cacheSegment = JSON.stringify({
    curricula: [...new Set(filters.curricula ?? [])].sort(),
    boards: [...new Set(filters.boards ?? [])].sort(),
    difficulty: filters.difficulty ?? null,
  });
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const query = JSON.parse(cacheSegment);
        const { data, error } = await supabase.rpc("get_curriculum_subject_question_counts" as any, {
          _curricula: query.curricula.length ? query.curricula : null,
          _boards: query.boards.length ? query.boards : null,
          _difficulty: query.difficulty,
        });
        if (error || !Array.isArray(data)) throw new Error("Question counts unavailable");
        const counts: SubjectCounts = Object.create(null);
        for (const row of data as { subject: string; question_count: number }[]) {
          const count = Number(row.question_count);
          if (typeof row.subject !== "string" || !Number.isSafeInteger(count) || count < 0) throw new Error("Invalid question count");
          counts[row.subject] = count;
        }
        if (active) setSnapshot({ key: cacheSegment, attempt, status: "ready", counts });
      } catch {
        if (active) setSnapshot({ key: cacheSegment, attempt, status: "error", counts: {} });
      }
    })();
    return () => { active = false; };
  }, [cacheSegment, attempt]);
  const current = snapshot?.key === cacheSegment && snapshot.attempt === attempt ? snapshot : null;
  const counts = current?.status === "ready" ? current.counts : null;
  return {
    counts: counts ?? {},
    loading: !current,
    error: current?.status === "error",
    retry,
    isEmpty: (subjectId: string) => counts !== null && !(counts[subjectId] > 0),
    countFor: (subjectId: string, fallback = 0) => counts?.[subjectId] ?? fallback,
  };
}
