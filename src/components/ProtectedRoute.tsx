import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { roles, loading: rolesLoading, hasRole } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Check role access after roles load
  useEffect(() => {
    if (!loading && !rolesLoading && user && (requiredRole || allowedRoles?.length)) {
      const allowed = requiredRole ? hasRole(requiredRole) : allowedRoles!.some((role) => hasRole(role));
      if (!allowed) {
        navigate("/subjects", { replace: true });
      }
    }
  }, [user, loading, rolesLoading, requiredRole, allowedRoles, hasRole, navigate]);

  if (loading || ((requiredRole || allowedRoles?.length) && rolesLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && !hasRole(requiredRole)) return null;
  if (allowedRoles?.length && !allowedRoles.some((role) => hasRole(role))) return null;

  return <>{children}</>;
}
