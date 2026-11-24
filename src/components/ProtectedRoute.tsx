import { Fragment, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { safePracticeReturn } from "@/lib/launchPractice";
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
  const { loading: rolesLoading, error: rolesError, retry, hasRole } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      const returnTo = safePracticeReturn(location.pathname + location.search);
      navigate("/auth", { replace: true, state: returnTo ? { returnTo } : undefined });
    }
  }, [user, loading, navigate, location.pathname, location.search]);

  // Check role access after roles load
  useEffect(() => {
    if (!loading && !rolesLoading && !rolesError && user && (requiredRole || allowedRoles?.length)) {
      const allowed = requiredRole ? hasRole(requiredRole) : allowedRoles!.some((role) => hasRole(role));
      if (!allowed) {
        navigate("/subjects", { replace: true });
      }
    }
  }, [user, loading, rolesLoading, rolesError, requiredRole, allowedRoles, hasRole, navigate]);

  if (loading || ((requiredRole || allowedRoles?.length) && rolesLoading)) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin motion-reduce:animate-none rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if ((requiredRole || allowedRoles?.length) && rolesError) {
    return <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">Could not verify your permissions</h1>
      <p role="alert" className="text-sm text-muted-foreground">Your protected workspace is unavailable until your access can be verified.</p>
      <button type="button" className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={retry}>Try again</button>
    </main>;
  }
  if (requiredRole && !hasRole(requiredRole)) return null;
  if (allowedRoles?.length && !allowedRoles.some((role) => hasRole(role))) return null;

  return <Fragment key={user.id}>{children}</Fragment>;
}
