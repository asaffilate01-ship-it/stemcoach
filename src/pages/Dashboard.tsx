import { AppHeader } from "@/components/layout/AppHeader";
import { mockProgress } from "@/data/mockProgress";
import { motion } from "framer-motion";
import { Flame, Target, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const p = mockProgress;
  const accuracy = Math.round((p.correctAnswers / p.totalQuestionsAnswered) * 100);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="stem-label mb-2">Student Dashboard</div>
          <h1 className="stem-heading text-3xl">Your Progress</h1>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Questions", value: p.totalQuestionsAnswered, icon: Target, color: "text-primary" },
            { label: "Accuracy", value: `${accuracy}%`, icon: TrendingUp, color: "text-success" },
            { label: "Streak", value: `${p.streak} days`, icon: Flame, color: "text-warning" },
            { label: "XP", value: p.xp.toLocaleString(), icon: Zap, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
              className="stem-card rounded-xl p-4"
            >
              <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="stem-label mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Subject Progress */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Subject Readiness</h3>
            <div className="space-y-4">
              {p.subjectProgress.map((sp) => (
                <div key={sp.subject}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{sp.subject}</span>
                    <span className="text-muted-foreground">{sp.readinessScore}%</span>
                  </div>
                  <Progress value={sp.readinessScore} className="h-2" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{sp.questionsCompleted} questions</span>
                    <span>{sp.accuracy}% accuracy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Weak Areas — Focus Here
            </h3>
            <div className="space-y-3">
              {p.weakTopics.map((wt) => (
                <div key={`${wt.subject}-${wt.topic}`} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{wt.topic}</span>
                    <span className="text-xs font-semibold text-destructive">{wt.accuracy}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{wt.subject}</div>
                  <div className="mt-2 stem-tuition-tip text-xs">{wt.recommended}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Recent Activity</h3>
            <div className="space-y-2">
              {p.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{a.topic}</div>
                    <div className="text-xs text-muted-foreground">{a.subject} · {a.date}</div>
                  </div>
                  <div className={`text-sm font-semibold ${a.score / a.total >= 0.8 ? "text-success" : a.score / a.total >= 0.6 ? "text-warning" : "text-destructive"}`}>
                    {a.score}/{a.total}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="stem-card rounded-xl p-6">
            <h3 className="mb-4 font-semibold">Badges & Awards</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {p.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-lg border p-3 text-center transition-all ${
                    badge.earned ? "bg-primary/5 border-primary/20" : "opacity-40"
                  }`}
                >
                  <div className="mb-1 text-2xl">{badge.icon}</div>
                  <div className="text-xs font-semibold">{badge.name}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{badge.requirement}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
