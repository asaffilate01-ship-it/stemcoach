import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/useNotifications";
import { motion } from "framer-motion";
import { User, Shield, Bell, Link2, Check, X, BellRing, Download, Trash2, Loader2 } from "lucide-react";
import { Icon3D } from "@/components/ui/icon-3d";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface PendingLink {
  id: string;
  parent_id: string;
  parent_email?: string;
  created_at: string;
  status: string;
}

export default function Settings() {
  const { t } = useTranslation();
  useDocumentTitle(t("settings.title"));
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
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
    loadNotifPrefs();
  }, [user]);

  const loadNotifPrefs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_preferences")
      .select("notification_prefs")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.notification_prefs) {
      setNotifPrefs(data.notification_prefs as typeof notifPrefs);
    }
  };

  const updateNotifPref = async (key: keyof typeof notifPrefs, checked: boolean) => {
    const updated = { ...notifPrefs, [key]: checked };
    setNotifPrefs(updated);
    if (!user) return;
    await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, notification_prefs: updated }, { onConflict: "user_id" });
  };

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
      toast({ title: t("settings.errorSaving"), variant: "destructive" });
    } else {
      toast({ title: t("settings.profileUpdated") });
    }
  };

  const handleLinkAction = async (linkId: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("parent_links")
      .update({ status: action })
      .eq("id", linkId);
    if (error) {
      toast({ title: t("settings.errorUpdatingLink"), variant: "destructive" });
    } else {
      toast({ title: action === "approved" ? t("settings.parentLinked") : t("settings.requestRejected") });
      setPendingLinks(prev => prev.filter(l => l.id !== linkId));
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-data");
      if (error) throw error;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stemcoach-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("settings.dataExported") });
    } catch (e: any) {
      toast({ title: t("settings.exportFailed"), description: e.message, variant: "destructive" });
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      navigate("/");
      toast({ title: t("settings.accountDeleted"), description: t("settings.accountDeletedDesc") });
    } catch (e: any) {
      toast({ title: t("settings.deletionFailed"), description: e.message, variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">{t("settings.account")}</div>
          <h1 className="stem-heading text-3xl">{t("settings.title")}</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stem-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Icon3D icon={User} variant="primary" size="sm" /> {t("settings.profile")}
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">{t("settings.email")}</Label>
                <Input value={user?.email || ""} disabled className="mt-1.5 bg-muted" />
              </div>
              <div>
                <Label className="text-sm">{t("settings.displayName")}</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("settings.yourName")} className="mt-1.5" />
              </div>
              <Button onClick={saveProfile} disabled={saving} className="rounded">
                {saving ? t("settings.saving") : t("settings.saveProfile")}
              </Button>
            </div>
          </motion.div>

          {/* Parent Link Requests */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="stem-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Icon3D icon={Link2} variant="purple" size="sm" /> {t("settings.parentLinkRequests")}
            </h3>
            {pendingLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("settings.noPendingRequests")}</p>
            ) : (
              <div className="space-y-3">
                {pendingLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{t("settings.parentRequest")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.received")} {new Date(link.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1 rounded text-success" onClick={() => handleLinkAction(link.id, "approved")}>
                        <Check className="h-3.5 w-3.5" /> {t("settings.approve")}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 rounded text-destructive" onClick={() => handleLinkAction(link.id, "rejected")}>
                        <X className="h-3.5 w-3.5" /> {t("settings.reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Notification Preferences */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="stem-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Icon3D icon={Bell} variant="warning" size="sm" /> {t("settings.notificationPrefs")}
            </h3>
            <div className="space-y-4">
              {[
                { key: "badge_alerts" as const, label: t("settings.badgeAlerts"), desc: t("settings.badgeAlertsDesc") },
                { key: "streak_reminders" as const, label: t("settings.streakReminders"), desc: t("settings.streakRemindersDesc") },
                { key: "parent_updates" as const, label: t("settings.parentUpdates"), desc: t("settings.parentUpdatesDesc") },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch checked={notifPrefs[pref.key]} onCheckedChange={(checked) => updateNotifPref(pref.key, checked)} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Push Notifications */}
          <PushNotificationCard />

          {/* Security */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="stem-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Icon3D icon={Shield} variant="success" size="sm" /> {t("settings.security")}
            </h3>
            <Button
              variant="outline"
              className="rounded"
              onClick={async () => {
                if (!user?.email) return;
                const { error } = await supabase.auth.resetPasswordForEmail(user.email);
                if (error) {
                  toast({ title: t("common.error"), description: error.message, variant: "destructive" });
                } else {
                  toast({ title: t("settings.passwordResetSent"), description: t("settings.checkInbox") });
                }
              }}
            >
              {t("settings.changePassword")}
            </Button>
          </motion.div>

          {/* Data & Privacy (GDPR) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="stem-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Icon3D icon={Download} variant="accent" size="sm" /> {t("settings.dataPrivacy")}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("settings.gdprDesc")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2 rounded" onClick={handleExportData} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t("settings.exportMyData")}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded border-destructive/30 text-destructive hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4" /> {t("settings.deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("settings.deleteAccountTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.deleteAccountDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t("settings.yesDeleteAccount")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}

function PushNotificationCard() {
  const { t } = useTranslation();
  const { permission, requestPermission } = usePushNotifications();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stem-card rounded-xl p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Icon3D icon={BellRing} variant="primary" size="sm" /> {t("settings.pushNotifications")}
      </h3>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">
            {permission === "granted" ? t("settings.notificationsEnabled") : permission === "denied" ? t("settings.notificationsBlocked") : t("settings.enablePush")}
          </p>
          <p className="text-xs text-muted-foreground">
            {permission === "granted"
              ? t("settings.pushEnabledDesc")
              : permission === "denied"
              ? t("settings.pushBlockedDesc")
              : t("settings.pushDefaultDesc")}
          </p>
        </div>
        {permission === "default" && (
          <Button size="sm" onClick={requestPermission} className="rounded">{t("settings.enable")}</Button>
        )}
        {permission === "granted" && (
          <span className="rounded bg-success/10 px-2 py-1 text-xs font-medium text-success">{t("settings.active")}</span>
        )}
        {permission === "denied" && (
          <span className="rounded bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">{t("settings.blocked")}</span>
        )}
      </div>
    </motion.div>
  );
}
