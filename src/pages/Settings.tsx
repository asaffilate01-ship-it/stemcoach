import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { User, Shield, Bell, Link2, Check, X } from "lucide-react";

interface PendingLink {
  id: string;
  parent_id: string;
  parent_email?: string;
  created_at: string;
  status: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [notifPrefs, setNotifPrefs] = useState({
    badge_alerts: true,
    streak_reminders: true,
    parent_updates: true,
  });

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadPendingLinks();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    if (data) setDisplayName(data.display_name || "");
  };

  const loadPendingLinks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("parent_links")
      .select("id, parent_id, created_at, status")
      .eq("child_id", user.id)
      .eq("status", "pending");
    setPendingLinks(data || []);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  const handleLinkAction = async (linkId: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("parent_links")
      .update({ status: action })
      .eq("id", linkId);
    if (error) {
      toast({ title: "Error updating link", variant: "destructive" });
    } else {
      toast({ title: action === "approved" ? "Parent linked!" : "Request rejected" });
      setPendingLinks(prev => prev.filter(l => l.id !== linkId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Account</div>
          <h1 className="stem-heading text-3xl">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="stem-card rounded-xl p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <User className="h-4 w-4 text-primary" /> Profile
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Email</Label>
                <Input value={user?.email || ""} disabled className="mt-1.5 bg-muted" />
              </div>
              <div>
                <Label className="text-sm">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5"
                />
              </div>
              <Button onClick={saveProfile} disabled={saving} className="rounded">
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </motion.div>

          {/* Parent Link Requests */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="stem-card rounded-xl p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Link2 className="h-4 w-4 text-primary" /> Parent Link Requests
            </h3>
            {pendingLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Parent request</p>
                      <p className="text-xs text-muted-foreground">
                        Received {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 rounded text-success"
                        onClick={() => handleLinkAction(link.id, "approved")}
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 rounded text-destructive"
                        onClick={() => handleLinkAction(link.id, "rejected")}
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Notification Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="stem-card rounded-xl p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Bell className="h-4 w-4 text-primary" /> Notification Preferences
            </h3>
            <div className="space-y-4">
              {[
                { key: "badge_alerts" as const, label: "Badge & Achievement Alerts", desc: "Get notified when you earn a badge" },
                { key: "streak_reminders" as const, label: "Streak Reminders", desc: "Daily reminders to keep your streak going" },
                { key: "parent_updates" as const, label: "Parent Activity Updates", desc: "Allow parents to receive your progress updates" },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[pref.key]}
                    onCheckedChange={(checked) =>
                      setNotifPrefs((prev) => ({ ...prev, [pref.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="stem-card rounded-xl p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4 text-primary" /> Security
            </h3>
            <Button
              variant="outline"
              className="rounded"
              onClick={async () => {
                if (!user?.email) return;
                const { error } = await supabase.auth.resetPasswordForEmail(user.email);
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                } else {
                  toast({ title: "Password reset email sent", description: "Check your inbox." });
                }
              }}
            >
              Change Password
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
