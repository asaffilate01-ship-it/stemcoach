import { useQuotaGate } from "@/hooks/useQuotaGate";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, BookOpen, Layers, Sparkles, Shield, FileText } from "lucide-react";

export function QuotaWidget() {
  const {
    totalQuestions, usedQuestions, remainingQuestions,
    mockExamsTotal, mockExamsUsed, mockExamsRemaining,
    subjects, levels, hasPurchased, loading,
  } = useQuotaGate();
  const navigate = useNavigate();

  if (loading) return null;

  const usagePercent = totalQuestions > 0 ? Math.round((usedQuestions / totalQuestions) * 100) : 0;
  const isLow = remainingQuestions < 500 && hasPurchased;
  const progressVariant = isLow ? "warning" : "gradient";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 md:p-6 bg-card ${isLow ? "border-warning/30" : "border-border/40"}`}
      style={{ boxShadow: "var(--stem-card-shadow)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          Question Balance
        </h3>
        {hasPurchased && (
          <span className="flex items-center gap-1.5 rounded-xl bg-[hsl(var(--success)/0.1)] px-3 py-1 text-xs font-bold text-[hsl(var(--success))]">
            <Shield className="h-3 w-3" /> Active
          </span>
        )}
      </div>

      {hasPurchased ? (
        <>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold tracking-tight">{remainingQuestions.toLocaleString()}</span>
              <span className="ml-1 text-sm text-muted-foreground">remaining</span>
            </div>
            <span className="text-xs text-muted-foreground">of {totalQuestions.toLocaleString()}</span>
          </div>
          <Progress value={100 - usagePercent} variant={progressVariant} className="mb-4 h-2.5" />

          {/* Mock exams */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Mock Exams</div>
              <div className="text-xs text-muted-foreground">{mockExamsRemaining} remaining of {mockExamsTotal}</div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {subjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {subjects.map(s => (
                  <span key={s} className="rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-primary">{s}</span>
                ))}
              </div>
            )}
            {levels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                {levels.map(l => (
                  <span key={l} className="rounded-lg bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase text-accent-foreground">{l}</span>
                ))}
              </div>
            )}
          </div>

          {isLow && (
            <Button size="sm" onClick={() => navigate("/pricing")} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-[hsl(258_60%_52%)] hover:opacity-90 transition-opacity">
              <Sparkles className="h-3.5 w-3.5" /> Top Up Questions
            </Button>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <p className="mb-1 text-sm font-semibold">Unlock 5,000+ questions & 20 mock exams</p>
          <p className="mb-4 text-xs text-muted-foreground">One-time purchase. No subscriptions.</p>
          <Button onClick={() => navigate("/pricing")} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-[hsl(258_60%_52%)] hover:opacity-90 transition-opacity">
            <CreditCard className="h-4 w-4" /> Get Started
          </Button>
        </div>
      )}
    </motion.div>
  );
}
