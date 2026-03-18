import { useQuotaGate } from "@/hooks/useQuotaGate";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, BookOpen, Layers } from "lucide-react";

export function QuotaWidget() {
  const { totalQuestions, usedQuestions, remainingQuestions, subjects, levels, hasPurchased, loading } = useQuotaGate();
  const navigate = useNavigate();

  if (loading) return null;

  const usagePercent = totalQuestions > 0 ? Math.round((usedQuestions / totalQuestions) * 100) : 0;
  const isLow = remainingQuestions < 500 && hasPurchased;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`stem-card rounded-xl p-5 ${isLow ? "border-warning/30" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Zap className="h-4 w-4 text-primary" /> Question Balance
        </h3>
        {hasPurchased && (
          <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            Active
          </span>
        )}
      </div>

      {hasPurchased ? (
        <>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-2xl font-bold tracking-tight">{remainingQuestions.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">of {totalQuestions.toLocaleString()} remaining</span>
          </div>
          <Progress value={100 - usagePercent} className="mb-4 h-2" />

          {subjects.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              {subjects.map(s => (
                <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium capitalize">{s}</span>
              ))}
            </div>
          )}
          {levels.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              {levels.map(l => (
                <span key={l} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase">{l}</span>
              ))}
            </div>
          )}

          {isLow && (
            <Button size="sm" onClick={() => navigate("/pricing")} className="w-full gap-2 rounded-xl">
              <CreditCard className="h-3.5 w-3.5" /> Top Up Questions
            </Button>
          )}
        </>
      ) : (
        <div className="text-center">
          <p className="mb-3 text-sm text-muted-foreground">Purchase a question pack to unlock full practice.</p>
          <Button onClick={() => navigate("/pricing")} className="gap-2 rounded-xl">
            <CreditCard className="h-4 w-4" /> Get Started
          </Button>
        </div>
      )}
    </motion.div>
  );
}
