import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Eye, TrendingUp, Target, Flame, BookOpen, Link2, CheckCircle2, Clock, AlertTriangle, Award, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ChildData {
  user_id: string;
  display_name: string;
  status: string;
  stats: any;
  recentAttempts: AttemptData[];
  badges: number;
  certificates: number;
}

interface AttemptData {
  id: string;
  correct: boolean;
  created_at: string;
  question: { subject: string; topic: string } | null;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [childEmail, setChildEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadChildren();
  }, [user]);

  const loadChildren = async () => {
    if (!user) return;
    const { data: links } = await supabase
      .from("parent_links")
      .select("*")
      .eq("parent_id", user.id)
      .eq("status", "approved");

    if (!links?.length) { setLoading(false); return; }

    const childIds = links.map(l => l.child_id);

    const [profilesRes, statsRes, badgesRes, certsRes, attemptsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").in("user_id", childIds),
      supabase.from("user_stats").select("*").in("user_id", childIds),
      supabase.from("user_badges").select("user_id").in("user_id", childIds),
      supabase.from("certificates").select("user_id").in("user_id", childIds),
      supabase.from("attempts").select("id, user_id, correct, created_at, question_id").in("user_id", childIds).order("created_at", { ascending: false }).limit(20),
    ]);

    const profiles = profilesRes.data || [];
    const stats = statsRes.data || [];
    const badges = badgesRes.data || [];
    const certs = certsRes.data || [];

    const childrenData: ChildData[] = profiles.map(p => ({
      user_id: p.user_id,
      display_name: p.display_name || "Student",
      status: "approved",
      stats: stats.find(s => s.user_id === p.user_id) || null,
      recentAttempts: (attemptsRes.data || []).filter(a => a.user_id === p.user_id).map(a => ({
        id: a.id,
        correct: a.correct,
        created_at: a.created_at,
        question: null,
      })),
      badges: badges.filter(b => b.user_id === p.user_id).length,
      certificates: certs.filter(c => c.user_id === p.user_id).length,
    }));

    setChildren(childrenData);
    if (childrenData.length > 0 && !selectedChild) setSelectedChild(childrenData[0].user_id);
    setLoading(false);
  };

  const requestLink = async () => {
    if (!user || !childEmail.trim()) return;
    
    // Look up the child user by email via profiles (we can't query auth.users)
    // For now, create a pending link. The child will see it in Settings.
    // We need the child's user_id — search profiles by display_name or use a lookup approach
    // Since we can't query auth.users, we'll create a placeholder and let the admin/system resolve it
    // Better approach: use an edge function to look up by email
    try {
      const { data, error } = await supabase.functions.invoke("link-parent-child", {
        body: { child_email: childEmail.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast({
        title: "Link request sent",
        description: "Your child will need to approve this link from their account settings.",
      });
      setChildEmail("");
      loadChildren();
    } catch (e: any) {
      toast({ title: "Could not send request", description: e.message, variant: "destructive" });
    }
  };

  const child = children.find(c => c.user_id === selectedChild);
  const childStats = child?.stats;
  const accuracy = childStats && childStats.total_questions > 0
    ? Math.round((childStats.correct_answers / childStats.total_questions) * 100) : 0;

  // Inactivity alert
  const lastActive = childStats?.last_active_date;
  const daysSinceActive = lastActive
    ? Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isInactive = daysSinceActive !== null && daysSinceActive > 3;

  // Readiness tier
  const readinessTier = accuracy >= 80 ? "Exam Ready" : accuracy >= 60 ? "On Track" : accuracy > 0 ? "Needs Work" : "Not Started";
  const readinessColor = accuracy >= 80 ? "text-success" : accuracy >= 60 ? "text-primary" : accuracy > 0 ? "text-warning" : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Parent Portal</div>
          <h1 className="stem-heading text-3xl">Your Children's Progress</h1>
        </div>

        {/* Link a child */}
        <div className="stem-card mb-6 rounded-xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-primary" /> Link a Child
          </h3>
          <div className="flex gap-2">
            <Input
              value={childEmail}
              onChange={(e) => setChildEmail(e.target.value)}
              placeholder="Child's email address"
              className="max-w-xs"
            />
            <Button onClick={requestLink} className="rounded" disabled={!childEmail.trim()}>
              Send Request
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Your child will need to approve this from their account.</p>
        </div>

        {children.length === 0 && !loading ? (
          <div className="stem-card rounded-xl p-12 text-center">
            <Eye className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold">No linked children yet</h3>
            <p className="text-sm text-muted-foreground">
              Link your child's account above to monitor their progress.
            </p>
          </div>
        ) : (
          <>
            {/* Child selector */}
            {children.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {children.map(c => (
                  <button
                    key={c.user_id}
                    onClick={() => setSelectedChild(c.user_id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                      selectedChild === c.user_id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {c.display_name}
                  </button>
                ))}
              </div>
            )}

            {child && (
              <>
                {/* Inactivity Alert */}
                {isInactive && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4"
                  >
                    <Bell className="h-5 w-5 text-warning" />
                    <div>
                      <p className="text-sm font-medium">Inactivity Alert</p>
                      <p className="text-xs text-muted-foreground">
                        {child.display_name} hasn't practiced in {daysSinceActive} days. Encourage them to keep their streak going!
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Overview stats */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[
                      { label: "Questions", value: childStats?.total_questions || 0, icon: Target, color: "text-primary" },
                      { label: "Accuracy", value: `${accuracy}%`, icon: TrendingUp, color: "text-success" },
                      { label: "Streak", value: `${childStats?.streak || 0} days`, icon: Flame, color: "text-warning" },
                      { label: "Level", value: childStats?.level || 1, icon: BookOpen, color: "text-primary" },
                      { label: "Badges", value: child.badges, icon: Award, color: "text-primary" },
                      { label: "Certificates", value: child.certificates, icon: CheckCircle2, color: "text-success" },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="stem-card rounded-xl p-4"
                      >
                        <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
                        <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                        <div className="stem-label mt-1">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Exam Readiness */}
                  <div className="stem-card rounded-xl p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Exam Readiness
                    </h3>
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`text-3xl font-bold ${readinessColor}`}>{accuracy}%</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        accuracy >= 80 ? "bg-success/10 text-success" :
                        accuracy >= 60 ? "bg-primary/10 text-primary" :
                        accuracy > 0 ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>{readinessTier}</span>
                    </div>
                    <Progress value={accuracy} className="mb-3 h-3" />
                    <p className="text-sm text-muted-foreground">
                      {accuracy >= 80
                        ? "Excellent! Your child is performing very well. Keep up the consistent practice!"
                        : accuracy >= 60
                        ? "Good progress. Encourage them to focus on weak areas to improve further."
                        : accuracy > 0
                        ? "Your child needs more practice. Consider helping them set a daily study routine."
                        : "Your child hasn't started practicing yet. Encourage them to begin!"}
                    </p>
                  </div>

                  {/* XP & Level Progress */}
                  <div className="stem-card rounded-xl p-6">
                    <h3 className="mb-4 font-semibold">XP & Level</h3>
                    <div className="mb-2 text-3xl font-bold text-primary">{childStats?.xp || 0} XP</div>
                    <div className="mb-2 text-sm text-muted-foreground">Level {childStats?.level || 1}</div>
                    <Progress value={((childStats?.xp || 0) % 500) / 5} className="h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {500 - ((childStats?.xp || 0) % 500)} XP to next level
                    </p>
                  </div>

                  {/* Activity status */}
                  <div className="stem-card rounded-xl p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <Clock className="h-4 w-4 text-primary" /> Activity Status
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Last Active", value: childStats?.last_active_date || "Not yet active" },
                        { label: "Current Streak", value: `${childStats?.streak || 0} days`, bold: true, color: "text-warning" },
                        { label: "Longest Streak", value: `${childStats?.longest_streak || 0} days` },
                        { label: "Perfect Scores", value: childStats?.perfect_scores || 0 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className={`text-sm ${item.bold ? `font-bold ${item.color}` : "text-muted-foreground"}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {child.recentAttempts.length > 0 && (
                    <div className="stem-card rounded-xl p-6 lg:col-span-2">
                      <h3 className="mb-4 font-semibold">Recent Activity</h3>
                      <div className="space-y-2">
                        {child.recentAttempts.slice(0, 10).map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                            <div className="flex items-center gap-2">
                              {a.correct ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              )}
                              <span className="text-sm">{a.correct ? "Correct" : "Incorrect"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(a.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
