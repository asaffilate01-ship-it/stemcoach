import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setRoles(data?.map(r => r.role) || ["student"]);
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  return {
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isReviewer: roles.includes("reviewer"),
    isTeacher: roles.includes("teacher"),
    isParent: roles.includes("parent"),
    isStudent: roles.includes("student"),
    hasRole: (role: AppRole) => roles.includes(role),
  };
}
