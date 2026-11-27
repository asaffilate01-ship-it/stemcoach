import { parseBookmarks, parseReviewHistory, getReviewSummary, type ReviewCandidate } from "./qaPractice";
import { getReviewFocusCounts, qaStorageKeys } from "./qaReviewFocus";
import { buildTopicRevisionInsights } from "./qaTopicInsights";

/** Local-only formative review overview. Never reads another account or the
 * legacy shared keys and never uploads performance metadata. */
export function readRevisionOverview(
  entries: readonly (ReviewCandidate & { tutorialId?: string })[],
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
    const topicCandidates = unique.flatMap(entry => typeof entry.tutorialId === "string" && entry.tutorialId.length > 0 ? [{ ...entry, tutorialId: entry.tutorialId }] : []);
    const recommendedTopics = buildTopicRevisionInsights(topicCandidates, history, now, 3).map(({ reviewIds, ...insight }) => ({ ...insight, focus: insight.dueQuestions > 0 ? "due" as const : "missed" as const, eligibleCount: insight.dueQuestions > 0 ? insight.dueQuestions : reviewIds.length }));
    return { counts, practiced: summary.practiced, recommendedTopics };
  } catch {
    // An inaccessible browser store is not evidence of an empty review queue.
    return null;
  }
}
