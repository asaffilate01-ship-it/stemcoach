import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type RoleSnapshot = { accountId: string; roles: AppRole[]; status: "loading" | "ready" | "error"; attempt: number };
const EMPTY_ROLES: AppRole[] = [];

export function useUserRole() {
  const { user } = useAuth();
  const accountId = user?.id;
  const [snapshot, setSnapshot] = useState<RoleSnapshot | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(n => n + 1), []);

  useEffect(() => {
    if (!accountId) { setSnapshot(null); return; }
    let active = true;
    setSnapshot({ accountId, roles: [], status: "loading", attempt });
    void (async () => {
      try {
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", accountId);
        if (error || !Array.isArray(data)) throw new Error("Unable to verify roles");
        if (active) setSnapshot({ accountId, roles: [...new Set(data.map(row => row.role))], status: "ready", attempt });
      } catch {
        if (active) setSnapshot({ accountId, roles: [], status: "error", attempt });
      }
    })();
    return () => { active = false; };
  }, [accountId, attempt]);

  // A render after an account switch must not expose the previous account's roles,
  // even before the effect cleanup and new network request have completed.
  const current = accountId && snapshot?.accountId === accountId && snapshot.attempt === attempt ? snapshot : null;
  const roles = current?.status === "ready" ? current.roles : EMPTY_ROLES;
  const loading = Boolean(accountId && (!current || current.status === "loading"));
  const error = current?.status === "error";
  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  return {
    roles, loading, error, retry,
    isAdmin: roles.includes("admin"),
    isReviewer: roles.includes("reviewer"),
    isTeacher: roles.includes("teacher"),
    isParent: roles.includes("parent"),
    isStudent: roles.includes("student"),
    hasRole,
  };
}
