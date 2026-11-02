/** An inventory target is not a claim that published questions already exist. */
export const PUBLISHED_BANK_TARGET = 2_000_000;
export const MONTHLY_RELEASE_FREQUENCY = "monthly" as const;

export interface QuestionBankMetrics {
  total_questions: number;
  awaiting_review: number;
  published_total: number;
  rejected_total: number;
  archived_total: number;
}

function safeCount(value: unknown): number {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

/** Admin dashboard only: counts come from the guarded server aggregate RPC. */
export function summariseBankMetrics(
  raw: Partial<Record<keyof QuestionBankMetrics, unknown>> | null | undefined,
  target = PUBLISHED_BANK_TARGET,
) {
  if (!raw) return null;
  const reviewedPublished = safeCount(raw.published_total);
  const totalDraftsAndQuestions = safeCount(raw.total_questions);
  const awaitingReview = safeCount(raw.awaiting_review);
  const goal = Number.isSafeInteger(target) && target > 0 ? target : PUBLISHED_BANK_TARGET;
  return {
    target: goal,
    total: totalDraftsAndQuestions,
    published: reviewedPublished,
    awaitingReview,
    remaining: Math.max(0, goal - reviewedPublished),
    progressPct: Math.min(100, Math.round(reviewedPublished / goal * 10000) / 100),
    complete: reviewedPublished >= goal,
  };
}

/** A month is an identifier, not a promised publication date. */
export function validReleaseMonth(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2026 && year <= 2100;
}

export type ReleaseLifecycle = "draft" | "under_review" | "approved" | "published" | "withdrawn";
export interface ProposedRelease {
  month: string;
  status: ReleaseLifecycle;
  reviewedQuestionCount: number;
  publishedQuestionCount: number;
  publishedAt: string | null;
}

/**
 * UI reporting only, NEVER a subscription/content authorization decision:
 * payment verification and partner learner eligibility belong on the server.
 */
export function publiclyReportableRelease(release: ProposedRelease, now = Date.now()): boolean {
  if (!validReleaseMonth(release.month) || release.status !== "published") return false;
  if (!Number.isSafeInteger(release.publishedQuestionCount) || release.publishedQuestionCount < 1) return false;
  if (!Number.isSafeInteger(release.reviewedQuestionCount) ||
      release.reviewedQuestionCount < release.publishedQuestionCount) return false;
  if (!release.publishedAt || !Number.isFinite(Date.parse(release.publishedAt))) return false;
  return Date.parse(release.publishedAt) <= now;
}
