import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, CheckCircle2, XCircle, Palette, Shield, Settings, Copy, UserPlus } from "lucide-react";
import { TeacherInvitations } from "@/components/institution/TeacherInvitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function TenantAdmin() {
  useDocumentTitle("Institution Admin");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"branding" | "members" | "teachers" | "settings">("members");

  // Fetch tenant where user is admin
  const { data: membership, isLoading: membershipLoading, error: membershipError } = useQuery({
    queryKey: ["my-tenant-membership", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenant_members")
        .select("*, tenants(*)")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const tenant = membership?.tenants as any;

  // Fetch members
  const { data: members = [] } = useQuery({
    queryKey: ["tenant-members", tenant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenant_members")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("joined_at", { ascending: false });

      if (!data?.length) return [];

      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase.rpc("get_display_names", { _user_ids: userIds });
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || "Unknown"]));

      return data.map(m => ({ ...m, display_name: profileMap.get(m.user_id) || "Unknown" }));
    },
    enabled: !!tenant,
  });

  const approveMember = useMutation({
    mutationFn: async ({ memberId, approve }: { memberId: string; approve: boolean }) => {
      const { error } = await (supabase as any).rpc("review_institution_member", {
        _tenant_id: tenant.id,
        _member_id: memberId,
        _approve: approve,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
      toast({ title: "Member updated" });
    },
    onError: (error: Error) => toast({ title: "Approval failed", description: error.message, variant: "destructive" }),
  });

  // Branding state
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [brandSecondary, setBrandSecondary] = useState("#1e40af");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (tenant) {
      setBrandName(tenant.name || "");
      setBrandColor(tenant.primary_color || "#2563eb");
      setBrandSecondary(tenant.secondary_color || "#1e40af");
      setLogoUrl(tenant.logo_url || "");
    }
  }, [tenant]);

  const saveBranding = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("update_institution_branding", {
        _tenant_id: tenant.id,
        _name: brandName,
        _primary_color: brandColor,
        _secondary_color: brandSecondary,
        _logo_url: logoUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tenant-membership", user?.id] });
      window.dispatchEvent(new Event("stemcoach:tenant-branding-updated"));
      toast({ title: "Branding saved", description: "Your colours and logo have been updated." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pendingMembers = members.filter((m: any) => m.status === "pending");
  const approvedMembers = members.filter((m: any) => m.status === "approved");
  const approvedStudents = approvedMembers.filter((m: any) => m.role === "student").length;
  const approvedTeachers = approvedMembers.filter((m: any) => m.role === "teacher").length;
  const maxStudents = Number(tenant?.max_students ?? 50);
  const availableSeats = Math.max(0, maxStudents - approvedStudents);
  const inviteLink = tenant
    ? `${window.location.origin}/join-institution?code=${encodeURIComponent(tenant.slug)}`
    : "";

  if (membershipLoading) {
    return <div className="min-h-screen bg-background"><AppHeader /><main className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading institution…</main></div>;
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-16 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="stem-heading mb-2 text-2xl">No Institution Found</h2>
          <p className="text-muted-foreground">{membershipError ? "Unable to load institution membership. Please retry." : "Only an approved institution administrator can access this panel."}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="stem-label mb-2">Institution Admin</div>
          <h1 className="stem-heading text-3xl">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">Slug: {tenant.slug} · Plan: {tenant.plan}</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => {
            void navigator.clipboard.writeText(inviteLink)
              .then(() => toast({ title: "Invitation link copied", description: "Share this link with students to request access." }))
              .catch(() => toast({ title: "Unable to copy", description: inviteLink, variant: "destructive" }));
          }}>
            <Copy className="h-4 w-4" /> Copy student invitation link
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stem-card rounded-xl p-4"><p className="text-xs text-muted-foreground">Approved students</p><p className="mt-1 text-2xl font-bold">{approvedStudents} / {maxStudents}</p></div>
          <div className="stem-card rounded-xl p-4"><p className="text-xs text-muted-foreground">Pending student requests</p><p className="mt-1 text-2xl font-bold">{pendingMembers.length}</p></div>
          <div className="stem-card rounded-xl p-4"><p className="text-xs text-muted-foreground">Available student seats</p><p className="mt-1 text-2xl font-bold">{availableSeats}</p></div>
          <div className="stem-card rounded-xl p-4"><p className="text-xs text-muted-foreground">Approved teachers</p><p className="mt-1 text-2xl font-bold">{approvedTeachers}</p></div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "members" as const, label: "Members", icon: Users },
            { key: "teachers" as const, label: "Teachers", icon: UserPlus },
            { key: "branding" as const, label: "Branding", icon: Palette },
            { key: "settings" as const, label: "Settings", icon: Settings },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                tab === t.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Members Tab */}
        {tab === "members" && (
          <div className="space-y-6">
            {/* Pending approvals */}
            {pendingMembers.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <Shield className="h-5 w-5 text-warning" /> Pending Approvals ({pendingMembers.length})
                </h3>
                <div className="space-y-2">
                  {pendingMembers.map((m: any) => (
                    <div key={m.id} className="stem-card flex items-center justify-between rounded-xl px-5 py-3">
                      <div>
                        <div className="text-sm font-semibold">{m.display_name}</div>
                        <div className="text-xs text-muted-foreground">Requested: {new Date(m.joined_at).toLocaleDateString()} · Role: {m.role}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={approveMember.isPending || (availableSeats === 0 && m.role === "student")} onClick={() => approveMember.mutate({ memberId: m.id, approve: true })} className="gap-1 rounded text-xs">
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={approveMember.isPending} onClick={() => approveMember.mutate({ memberId: m.id, approve: false })} className="gap-1 rounded text-xs">
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved members */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Active Members ({approvedMembers.length})</h3>
              <div className="space-y-2">
                {approvedMembers.map((m: any) => (
                  <div key={m.id} className="stem-card flex items-center justify-between rounded-xl px-5 py-3">
                    <div>
                      <div className="text-sm font-semibold">{m.display_name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{m.role} · Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                    </div>
                    <span className="rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Active</span>
                  </div>
                ))}
                {approvedMembers.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No approved members yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teacher invitation Tab */}
        {tab === "teachers" && <TeacherInvitations tenantId={tenant.id} />}

        {/* Branding Tab */}
        {tab === "branding" && (
          <div className="stem-card max-w-xl rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Customise Your Branding</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Institution Name</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm">Logo URL</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Primary Colour</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border" />
                    <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Secondary Colour</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input type="color" value={brandSecondary} onChange={(e) => setBrandSecondary(e.target.value)} className="h-9 w-12 cursor-pointer rounded border" />
                    <Input value={brandSecondary} onChange={(e) => setBrandSecondary(e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg border p-4">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Preview</div>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: brandColor }}>
                      {brandName.charAt(0) || "S"}
                    </div>
                  )}
                  <span className="text-lg font-bold" style={{ color: brandColor }}>{brandName || "Your Institution"}</span>
                </div>
              </div>

              <Button onClick={() => saveBranding.mutate()} disabled={saveBranding.isPending} className="rounded">Save Branding</Button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="stem-card max-w-xl rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Institution Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="text-sm font-medium">Max Students</div>
                  <div className="text-xs text-muted-foreground">Current limit: {tenant.max_students}</div>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{tenant.plan} plan</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="text-sm font-medium">Custom Domain</div>
                  <div className="text-xs text-muted-foreground">{tenant.custom_domain || "Not configured"}</div>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                  {tenant.custom_domain ? "Active" : "Available on Pro"}
                </span>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Upgrade your plan to increase student limits, enable custom domains, and access advanced analytics.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
