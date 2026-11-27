import { parseBookmarks, parseReviewHistory, getReviewSummary, type ReviewCandidate } from "./qaPractice";
import { getReviewFocusCounts, qaStorageKeys } from "./qaReviewFocus";

/** Local-only formative review overview. Never reads another account or the
 * legacy shared keys and never uploads performance metadata. */
export function readRevisionOverview(
  entries: readonly ReviewCandidate[],
  accountId: string | null,
  read: (key: string) => string | null,
  now: number,
) {
  try {
    const unique = [...new Map(entries.map(entry => [entry.id, entry])).values()];
    const ids = new Set(unique.map(entry => entry.id));
    const keys = qaStorageKeys(accountId);
    const history = parseReviewHistory(read(keys.history), ids);
    const saved = new Set(parseBookmarks(read(keys.bookmarks), ids));
    const counts = getReviewFocusCounts(unique, { history, saved, now });
    const summary = getReviewSummary(unique, history, now);
    return { counts, practiced: summary.practiced };
  } catch {
    // An inaccessible browser store is not evidence of an empty review queue.
    return null;
  }
}
