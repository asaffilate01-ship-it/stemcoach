import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_REVIEW_SCENARIO, estimateReviewCapacity, type ReviewCapacityScenario,
} from "@/lib/reviewCapacity";

/** Scenario inputs never persist and cannot initiate purchases or question publishing. */
export function ReviewCapacityPlanner({ published, target }: { published: number | null; target: number }) {
  const [scenario, setScenario] = useState<ReviewCapacityScenario>(DEFAULT_REVIEW_SCENARIO);
  const estimate = published === null ? null : estimateReviewCapacity(published, target, scenario);

  const fields = [
    { key: "reviewers", label: "Qualified reviewers", min: 1, max: 50000 },
    { key: "checksPerReviewerDay", label: "Checks per reviewer/day", min: 1, max: 1000 },
    { key: "workingDaysPerMonth", label: "Review days/month", min: 1, max: 31 },
    { key: "approvalRatePercent", label: "Approval yield (%)", min: 1, max: 100 },
    { key: "targetMonths", label: "Target months", min: 1, max: 120 },
  ] as const;
  return (
    <section aria-labelledby="review-capacity-title" className="mb-7 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
      <div className="mb-2 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 id="review-capacity-title" className="text-lg font-bold">Academic review capacity planner</h2>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Explore the reviewer capacity required to reach the published question target.
        These are arithmetic scenarios, not completed reviews or promised monthly releases.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {fields.map(({ key, label, min, max }) => (
          <div key={key}>
            <Label htmlFor={"review-" + key} className="text-xs font-semibold">{label}</Label>
            <Input id={"review-" + key} type="number" inputMode="numeric" min={min} max={max} step={1}
              className="mt-1 h-11" value={scenario[key]}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isSafeInteger(next) && next >= min && next <= max)
                  setScenario((old) => ({ ...old, [key]: next }));
              }}
            />
          </div>
        ))}
      </div>
      {estimate ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="status">
          {[
            ["Expected approvals/month", estimate.approvedPerMonth.toLocaleString()],
            ["Months at selected capacity", estimate.monthsToGoal === null ? "Not estimable" : estimate.monthsToGoal.toLocaleString()],
            ["Approvals/month needed", estimate.monthlyApprovalTarget.toLocaleString()],
            ["Reviewers for target", estimate.reviewersForTarget === null ? "Not estimable" : estimate.reviewersForTarget.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xl font-bold tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Actual published count is not available. A projected completion date cannot be calculated.
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Assumes a steady rate and independent question-by-question academic checking.
        Reviewer availability, duplicate questions, correction cycles, board changes and safety checks may lower output.
        This planner cannot publish questions or grant user access.
      </p>
    </section>
  );
}
