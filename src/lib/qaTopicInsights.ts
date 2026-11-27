import type { ReviewCandidate, ReviewHistory, QuestionHistory } from "./qaPractice";

type TopicCandidate = ReviewCandidate & { tutorialId: string };

export interface TopicRevisionInsight {
  tutorialId: string;
  subject: string;
  topic: string;
  practicedQuestions: number;
  firstAttempts: number;
  firstCorrect: number;
  firstMistakes: number;
  dueQuestions: number;
  reviewIds: string[];
}

/** Treat browser evidence as local formative practice only, not verified mastery.
 * Reject impossible counters instead of deriving misleading accuracy from them.
 */
function validEvidence(row: QuestionHistory | undefined): row is QuestionHistory {
  return Boolean(row && Number.isSafeInteger(row.attempts) && row.attempts > 0 &&
    Number.isSafeInteger(row.correctFirst) && row.correctFirst >= 0 &&
    Number.isSafeInteger(row.incorrectFirst) && row.incorrectFirst >= 0 &&
    row.correctFirst + row.incorrectFirst === row.attempts &&
    Number.isFinite(row.dueAt) && row.dueAt >= 0);
}

/** Input must be the currently eligible authored catalogue. Do not cross a lesson,
 * subject or active review filter, even if titles are identical.
 */
export function buildTopicRevisionInsights(
  source: readonly TopicCandidate[], history: ReviewHistory, now: number, limit = 3,
): TopicRevisionInsight[] {
  if (!Number.isFinite(now) || now < 0 || !Number.isSafeInteger(limit) || limit < 1) return [];
  type Group = TopicRevisionInsight & { candidates: { id: string; due: boolean; misses: number; dueAt: number }[] };
  const groups = new Map<string, Group>();
  const seen = new Set<string>();
  for (const entry of source) {
    if (!entry.id || !entry.tutorialId || !entry.subject || seen.has(entry.id)) continue;
    seen.add(entry.id);
    const row = Object.prototype.hasOwnProperty.call(history, entry.id) ? history[entry.id] : undefined;
    if (!validEvidence(row)) continue;
    const key = JSON.stringify([entry.subject, entry.tutorialId]);
    const group = groups.get(key) ?? {
      tutorialId: entry.tutorialId, subject: entry.subject, topic: entry.topic,
      practicedQuestions: 0, firstAttempts: 0, firstCorrect: 0, firstMistakes: 0,
      dueQuestions: 0, reviewIds: [], candidates: [],
    };
    const due = row.dueAt <= now;
    group.practicedQuestions++;
    group.firstAttempts += row.attempts;
    group.firstCorrect += row.correctFirst;
    group.firstMistakes += row.incorrectFirst;
    group.dueQuestions += Number(due);
    if (due || row.incorrectFirst > 0) group.candidates.push({ id: entry.id, due, misses: row.incorrectFirst, dueAt: row.dueAt });
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter(group => group.candidates.length > 0)
    .sort((a,b) => b.dueQuestions - a.dueQuestions || b.firstMistakes - a.firstMistakes ||
      b.practicedQuestions - a.practicedQuestions || a.subject.localeCompare(b.subject) ||
      a.tutorialId.localeCompare(b.tutorialId))
    .slice(0, Math.min(limit, 10))
    .map(({ candidates, ...group }) => ({
      ...group,
      reviewIds: candidates.sort((a,b) => Number(b.due) - Number(a.due) ||
        b.misses - a.misses || a.dueAt - b.dueAt || a.id.localeCompare(b.id)).map(item => item.id),
    }));
}
