import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function TeacherInvitation() {
  useDocumentTitle("Teacher Invitation");
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const token = new URLSearchParams(location.search).get("token") || "";
  const validToken = /^[a-f0-9]{64}$/.test(token);

  const accept = async () => {
    if (!user || !validToken || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await (supabase as any).rpc("accept_institution_teacher_invite", {
        _token: token,
      });
      if (error) throw error;
      if (!data) throw new Error("No institution membership was returned.");
      toast({ title: "Teacher invitation accepted", description: "Your teacher workspace is now available." });
      navigate("/teacher", { replace: true });
    } catch (error) {
      toast({ title: "Invitation could not be accepted", description: error instanceof Error ? error.message : "Check the invitation and your verified email.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border bg-primary/10">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="stem-heading text-3xl">Teacher invitation</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Join your school or tuition centre as a teacher. Your account must use the exact email address invited by the administrator, and that email must be verified.
        </p>

        {!validToken ? (
          <div role="alert" className="mt-8 rounded-xl border border-destructive/30 p-5 text-sm text-destructive">
            Invalid invitation link. Ask your institution administrator for a new invitation.
          </div>
        ) : !user ? (
          <div className="mt-8 rounded-2xl border bg-card p-6">
            <LockKeyhole className="mx-auto h-7 w-7 text-primary" />
            <p className="my-4 text-sm text-muted-foreground">Sign in or create an account with your invited email to continue.</p>
            <Button onClick={() => navigate("/auth", { state: { returnTo: location.pathname + location.search } })}>
              Sign in to accept
            </Button>
          </div>
        ) : (
          <div className="mt-8 w-full rounded-2xl border bg-card p-6">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <p className="my-4 text-sm text-muted-foreground">
              Signed in as <strong className="break-all text-foreground">{user.email}</strong>. Accept only if this is the invited email.
            </p>
            <Button className="w-full gap-2" disabled={submitting} onClick={() => void accept()}>
              <CheckCircle2 className="h-4 w-4" /> {submitting ? "Verifying invitation…" : "Accept teacher invitation"}
            </Button>
          </div>
        )}
        <p className="mt-6 text-xs text-muted-foreground">Invitation codes expire in seven days and can be used only once.</p>
      </main>
    </div>
  );
}
