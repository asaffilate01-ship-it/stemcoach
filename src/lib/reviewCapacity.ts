/** A deterministic *planning scenario*, not a generation or publication guarantee. */
export interface ReviewCapacityScenario {
  reviewers: number;
  checksPerReviewerDay: number;
  workingDaysPerMonth: number;
  approvalRatePercent: number;
  targetMonths: number;
}
export interface ReviewCapacityEstimate {
  remaining: number;
  reviewsPerMonth: number;
  approvedPerMonth: number;
  monthsToGoal: number | null;
  reviewersForTarget: number | null;
  monthlyApprovalTarget: number;
}
export const DEFAULT_REVIEW_SCENARIO: ReviewCapacityScenario = {
  reviewers: 24, checksPerReviewerDay: 60, workingDaysPerMonth: 20,
  approvalRatePercent: 80, targetMonths: 24,
};
function boundedInteger(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isSafeInteger(value)
    && value >= min && value <= max ? value : null;
}
export function estimateReviewCapacity(
  published: number, target: number, config: ReviewCapacityScenario,
): ReviewCapacityEstimate | null {
  const count = boundedInteger(published, 0, 5_000_000);
  const goal = boundedInteger(target, 1, 5_000_000);
  const reviewers = boundedInteger(config.reviewers, 1, 50_000);
  const daily = boundedInteger(config.checksPerReviewerDay, 1, 1_000);
  const days = boundedInteger(config.workingDaysPerMonth, 1, 31);
  const rate = boundedInteger(config.approvalRatePercent, 1, 100);
  const months = boundedInteger(config.targetMonths, 1, 120);
  if (count === null || goal === null || reviewers === null || daily === null ||
      days === null || rate === null || months === null) return null;

  const remaining = Math.max(0, goal - count);
  const reviewsPerMonth = reviewers * daily * days;
  const approvedPerMonth = Math.floor(reviewsPerMonth * rate / 100);
  const monthlyApprovalTarget = Math.ceil(remaining / months);
  const perReviewerMonth = daily * days * rate / 100;
  return {
    remaining, reviewsPerMonth, approvedPerMonth,
    monthsToGoal: remaining === 0 ? 0 : approvedPerMonth > 0 ? Math.ceil(remaining / approvedPerMonth) : null,
    reviewersForTarget: remaining === 0 ? 0 : Math.ceil(monthlyApprovalTarget / perReviewerMonth),
    monthlyApprovalTarget,
  };
}
