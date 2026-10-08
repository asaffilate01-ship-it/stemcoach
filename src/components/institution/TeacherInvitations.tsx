import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCopy, Clock3, MailPlus, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TeacherInvite {
  id: string;
  invitee_email: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

export function TeacherInvitations({ tenantId }: { tenantId: string }) {
  const [email, setEmail] = useState("");
  const [latestLink, setLatestLink] = useState("");
  const { toast } = useToast();
  const client = useQueryClient();

  const invitations = useQuery({
    queryKey: ["institution-teacher-invites", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<TeacherInvite[]> => {
      const { data, error } = await (supabase as any).rpc("list_institution_teacher_invites", {
        _tenant_id: tenantId,
      });
      if (error) throw error;
      return (data || []) as TeacherInvite[];
    },
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc("create_institution_teacher_invite", {
        _tenant_id: tenantId,
        _email: email.trim(),
      });
      if (error) throw error;
      if (typeof data !== "string" || !/^[a-f0-9]{64}$/.test(data)) {
        throw new Error("The invitation service did not return a valid code.");
      }
      return data;
    },
    onSuccess: (token: string) => {
      setLatestLink(window.location.origin + "/teacher-invitation?token=" + token);
      setEmail("");
      void client.invalidateQueries({ queryKey: ["institution-teacher-invites", tenantId] });
      toast({ title: "Teacher invitation created", description: "Copy and securely share the link with the invited teacher." });
    },
    onError: (error: Error) => toast({ title: "Unable to invite teacher", description: error.message, variant: "destructive" }),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any).rpc("revoke_institution_teacher_invite", {
        _tenant_id: tenantId,
        _invitation_id: id,
      });
      if (error) throw error;
      if (!data) throw new Error("This invitation is no longer pending.");
    },
    onSuccess: () => {
      setLatestLink("");
      void client.invalidateQueries({ queryKey: ["institution-teacher-invites", tenantId] });
      toast({ title: "Invitation revoked" });
    },
    onError: (error: Error) => toast({ title: "Revoke failed", description: error.message, variant: "destructive" }),
  });

  const copy = () => {
    void navigator.clipboard.writeText(latestLink)
      .then(() => toast({ title: "Teacher invitation link copied" }))
      .catch(() => toast({ title: "Copy unavailable", description: "Select the link above and copy it manually.", variant: "destructive" }));
  };

  return (
    <section aria-labelledby="teacher-invitations-title" className="space-y-5">
      <div>
        <h2 id="teacher-invitations-title" className="text-xl font-bold">Teacher invitations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a one-time invitation to a teacher's verified email address. The link expires in seven days.
        </p>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); createInvite.mutate(); }}
        className="stem-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="teacher-email" className="mb-1.5 block text-sm font-semibold">Teacher email</label>
          <Input type="email" id="teacher-email" placeholder="teacher@example.edu" value={email} maxLength={254}
            onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </div>
        <Button type="submit" disabled={createInvite.isPending || !email.trim()} className="gap-2 rounded-xl">
          <MailPlus className="h-4 w-4" /> {createInvite.isPending ? "Creating…" : "Create invitation"}
        </Button>
      </form>

      {latestLink && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> New invitation link
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            This token is shown only now. The database stores its hash, not the link. Share it only with the invited teacher.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input aria-label="New teacher invitation link" readOnly value={latestLink} onFocus={(event) => event.currentTarget.select()} className="font-mono text-xs" />
            <Button type="button" variant="outline" className="gap-2" onClick={copy}>
              <ClipboardCopy className="h-4 w-4" /> Copy link
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold">Recent teacher invitations</h3>
        {invitations.isLoading && <p className="text-sm text-muted-foreground">Loading invitations…</p>}
        {invitations.isError && (
          <p role="alert" className="text-sm text-destructive">Unable to load invitations. Check your institution permissions and migrations.</p>
        )}
        {invitations.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No teacher invitations issued yet.</p>
        )}
        <div className="space-y-3">
          {invitations.data?.map((item) => {
            const accepted = Boolean(item.accepted_at);
            const revoked = Boolean(item.revoked_at);
            const expired = !accepted && !revoked && new Date(item.expires_at).getTime() <= Date.now();
            const pending = !accepted && !revoked && !expired;
            return (
              <div key={item.id} className="flex flex-col justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold">{item.invitee_email}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3" /> Expires {new Date(item.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold">
                    {accepted ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : revoked ? <XCircle className="h-4 w-4 text-muted-foreground" /> : <Clock3 className="h-4 w-4" />}
                    {accepted ? "Accepted" : revoked ? "Revoked" : expired ? "Expired" : "Pending"}
                  </span>
                  {pending && (
                    <Button size="sm" variant="outline" disabled={revokeInvite.isPending} onClick={() => revokeInvite.mutate(item.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
