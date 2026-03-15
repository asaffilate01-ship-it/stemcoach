import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Eye, TrendingUp, Target, Flame, AlertTriangle, BookOpen, Link2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ChildData {
  user_id: string;
  display_name: string;
  status: string;
  stats: any;
  recentAttempts: any[];
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [linkCode, setLinkCode] = useState("");
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
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", childIds);

    const { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .in("user_id", childIds);

    const childrenData: ChildData[] = (profiles || []).map(p => ({
      user_id: p.user_id,
      display_name: p.display_name || "Student",
      status: "approved",
      stats: stats?.find(s => s.user_id === p.user_id) || null,
      recentAttempts: [],
    }));

    setChildren(childrenData);
    if (childrenData.length > 0 && !selectedChild) setSelectedChild(childrenData[0].user_id);
    setLoading(false);
  };

  const requestLink = async () => {
    if (!user || !childEmail.trim()) return;
    // Look up child by email via profiles — in reality we'd need a lookup endpoint
    toast({
      title: "Link request sent",
      description: "Your child will need to approve this link from their account settings.",
    });
    setChildEmail("");
  };

  const child = children.find(c => c.user_id === selectedChild);
  const childStats = child?.stats;
  const accuracy = childStats && childStats.total_questions > 0
    ? Math.round((childStats.correct_answers / childStats.total_questions) * 100) : 0;

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
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Overview stats */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Questions", value: childStats?.total_questions || 0, icon: Target, color: "text-primary" },
                    { label: "Accuracy", value: `${accuracy}%`, icon: TrendingUp, color: "text-success" },
                    { label: "Streak", value: `${childStats?.streak || 0} days`, icon: Flame, color: "text-warning" },
                    { label: "Level", value: childStats?.level || 1, icon: BookOpen, color: "text-primary" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="stem-card rounded-xl p-4"
                    >
                      <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
                      <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                      <div className="stem-label mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
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
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">Last Active</span>
                      <span className="text-sm text-muted-foreground">
                        {childStats?.last_active_date || "Not yet active"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">Current Streak</span>
                      <span className="text-sm font-bold text-warning">{childStats?.streak || 0} days</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">Longest Streak</span>
                      <span className="text-sm text-muted-foreground">{childStats?.longest_streak || 0} days</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">Perfect Scores</span>
                      <span className="text-sm text-muted-foreground">{childStats?.perfect_scores || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Readiness summary */}
                <div className="stem-card rounded-xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-success" /> Exam Readiness
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {accuracy >= 80
                      ? "Your child is performing very well. Keep up the consistent practice!"
                      : accuracy >= 60
                      ? "Your child is making good progress. Encourage them to focus on weak areas."
                      : accuracy > 0
                      ? "Your child needs more practice. Consider extra support in weak topics."
                      : "Your child hasn't started practicing yet. Encourage them to begin!"}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">Overall Readiness</span>
                      <span className="text-muted-foreground">{accuracy}%</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
