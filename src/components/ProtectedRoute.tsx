import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "teacher" | "parent" | "student";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
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
    if (!loading && !rolesLoading && user && requiredRole) {
      if (!hasRole(requiredRole)) {
        navigate("/subjects", { replace: true });
      }
    }
  }, [user, loading, rolesLoading, requiredRole, hasRole, navigate]);

  if (loading || (requiredRole && rolesLoading)) {
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

  return <>{children}</>;
}
