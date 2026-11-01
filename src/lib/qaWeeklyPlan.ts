import type { ReviewCandidate, ReviewHistory } from "./qaPractice";

export interface QAPlanDay {
  /** Local midnight on the learner's device. No dates or answers are uploaded. */
  startAt: number;
  questionIds: string[];
  dueCount: number;
  newCount: number;
  missedCount: number;
}

/**
 * A small, deterministic formative practice plan derived only from validated
 * local review metadata. Overdue questions go first; then unseen questions
 * provide a balanced mix of subjects. Already scheduled IDs are not repeated.
 *
 * A suggested date is not a formal assignment or a guarantee of exam mastery.
 */
export function buildQAWeeklyPlan(
  source: readonly ReviewCandidate[],
  history: ReviewHistory,
  now: number,
  maxPerDay = 5,
): QAPlanDay[] {
  if (!Number.isFinite(now) || now < 0) return [];
  const limit = Number.isSafeInteger(maxPerDay) ? Math.min(20, Math.max(1, maxPerDay)) : 5;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (!Number.isFinite(start.getTime())) return [];

  const seen = new Set<string>();
  const unique = source.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  const hasAttempt = (id: string) => (history[id]?.attempts || 0) > 0;
  const due = unique.filter((item) => hasAttempt(item.id) &&
    Number.isFinite(history[item.id].dueAt) && history[item.id].dueAt >= 0)
    .sort((a, b) => history[a.id].dueAt - history[b.id].dueAt ||
      history[b.id].incorrectFirst - history[a.id].incorrectFirst ||
      a.id.localeCompare(b.id));
  const unseen = unique.filter((item) => !hasAttempt(item.id))
    .sort((a, b) => a.subject.localeCompare(b.subject) ||
      a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id));
  const subjectCount = new Map<string, number>();
  const result: QAPlanDay[] = [];

  for (let offset = 0; offset < 7; offset++) {
    // setDate (not adding 24 hours) preserves the learner's local calendar
    // across daylight-saving transitions.
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const questions: ReviewCandidate[] = [];
    let dueCount = 0;
    let newCount = 0;
    let missedCount = 0;
    while (questions.length < limit && due.length && history[due[0].id].dueAt < nextDay.getTime()) {
      const item = due.shift()!;
      questions.push(item);
      dueCount++;
      if (history[item.id].incorrectFirst > 0) missedCount++;
      subjectCount.set(item.subject, (subjectCount.get(item.subject) || 0) + 1);
    }
    // Spread introductory items between subjects rather than exhausting the
    // first (alphabetical) subject in the bank.
    while (questions.length < limit && unseen.length) {
      unseen.sort((a, b) => (subjectCount.get(a.subject) || 0) - (subjectCount.get(b.subject) || 0) ||
        a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id));
      const item = unseen.shift()!;
      questions.push(item);
      newCount++;
      subjectCount.set(item.subject, (subjectCount.get(item.subject) || 0) + 1);
    }
    result.push({
      startAt: day.getTime(),
      questionIds: questions.map((item) => item.id),
      dueCount,
      newCount,
      missedCount,
    });
  }
  return result;
}
