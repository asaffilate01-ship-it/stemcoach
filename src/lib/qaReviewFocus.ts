import { QA_HISTORY_KEY, QA_BOOKMARKS_KEY, type ReviewHistory, type ReviewCandidate } from "./qaPractice";

/** Local preferences are isolated by the current authenticated identity or guest.
 * Legacy unscoped data is deliberately not adopted into an account automatically.
 * This is browser-level separation, not encrypted storage or server-side access control.
 */
export function qaStorageKeys(accountId: string | null) {
  const scope = accountId === null ? "guest" : "account:" + encodeURIComponent(accountId);
  return {
    history: QA_HISTORY_KEY + ":scope-v2:" + scope,
    bookmarks: QA_BOOKMARKS_KEY + ":scope-v2:" + scope,
  };
}

export const REVIEW_FOCUSES = ["all", "due", "missed", "saved", "new"] as const;
export type ReviewFocus = typeof REVIEW_FOCUSES[number];

type ReviewContext = { history: ReviewHistory; saved: ReadonlySet<string>; now: number };

export function matchesReviewFocus(id: string, focus: ReviewFocus, context: ReviewContext): boolean {
  const row = Object.prototype.hasOwnProperty.call(context.history, id) ? context.history[id] : undefined;
  switch (focus) {
    case "all": return true;
    case "saved": return context.saved.has(id);
    case "due": return Boolean(row && row.attempts > 0 && Number.isFinite(row.dueAt) && row.dueAt <= context.now);
    case "missed": return Boolean(row && row.incorrectFirst > 0);
    case "new": return !row || row.attempts === 0;
  }
}

export function getReviewFocusCounts(source: readonly ReviewCandidate[], context: ReviewContext): Record<ReviewFocus, number> {
  const counts: Record<ReviewFocus, number> = { all: 0, due: 0, missed: 0, saved: 0, new: 0 };
  const seen = new Set<string>();
  for (const item of source) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    for (const focus of REVIEW_FOCUSES) {
      if (matchesReviewFocus(item.id, focus, context)) counts[focus]++;
    }
  }
  return counts;
}
